// zipPlugin.js
import CRC32 from '../plugins/utils/crc32.js';

class ZipEntry {
  constructor(name, data, offset) {
    this.name = name;
    this.data = data;
    this.offset = offset;
    this.size = data.length;
    this.crc = CRC32.from(data);
    this.date = new Date();
  }

  toLocalHeader() {
    const nameBytes = new TextEncoder().encode(this.name);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    const { dosTime, dosDate } = this.#getDosDateTime();

    view.setUint32(0, 0x04034b50, true); // Local file header
    view.setUint16(4, 20, true);         // Version needed
    view.setUint16(6, 0, true);          // Flags
    view.setUint16(8, 0, true);          // Compression = store
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, this.crc, true);  // CRC32
    view.setUint32(18, this.size, true); // Compressed size
    view.setUint32(22, this.size, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);         // Extra field

    header.set(nameBytes, 30);
    return header;
  }

  toCentralDirectory() {
    const nameBytes = new TextEncoder().encode(this.name);
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);

    const { dosTime, dosDate } = this.#getDosDateTime();

    view.setUint32(0, 0x02014b50, true); // Central dir signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed
    view.setUint16(8, 0, true);          // Flags
    view.setUint16(10, 0, true);         // Compression
    view.setUint16(12, dosTime, true);
    view.setUint16(14, dosDate, true);
    view.setUint32(16, this.crc, true);  // CRC32
    view.setUint32(20, this.size, true); // Compressed
    view.setUint32(24, this.size, true); // Uncompressed
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true);         // Extra
    view.setUint16(32, 0, true);         // Comment
    view.setUint16(34, 0, true);         // Disk start
    view.setUint16(36, 0, true);         // Internal attr
    view.setUint32(38, 0, true);         // External attr
    view.setUint32(42, this.offset, true); // Offset local header

    header.set(nameBytes, 46);
    return header;
  }

  #getDosDateTime() {
    const d = this.date;
    const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2);
    const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { dosTime, dosDate };
  }
}

class MiniZip {
  constructor() {
    this.entries = [];
    this.offset = 0;
  }

  file(path, content = "") {
  // Deteksi jika konten adalah Uint8Array (binary)
  const data = (content instanceof Uint8Array)
    ? content
    : new TextEncoder().encode(String(content));

    const entry = new ZipEntry(path, data, this.offset);
    const local = entry.toLocalHeader();
    const full = new Uint8Array(local.length + data.length);
    full.set(local, 0);
    full.set(data, local.length);

    this.entries.push({ entry, data: full });
    this.offset += full.length;
  }

  folder(path) {
    const norm = path.endsWith("/") ? path : path + "/";
    this.file(norm); // folder entry
    return {
      file: (name, content) => this.file(norm + name, content),
      folder: (name) => this.folder(norm + name),
    };
  }

  generateBlob() {
    const buffers = [];
    const central = [];

    for (const { entry, data } of this.entries) {
      buffers.push(data);
      central.push(entry.toCentralDirectory());
    }

    const centralStart = this.offset;
    for (const d of central) {
      buffers.push(d);
      this.offset += d.length;
    }

    const eocd = new Uint8Array(22);
    const view = new DataView(eocd.buffer);
    view.setUint32(0, 0x06054b50, true);      // EOCD
    view.setUint16(8, central.length, true);  // total this disk
    view.setUint16(10, central.length, true); // total
    view.setUint32(12, this.offset - centralStart, true); // dir size
    view.setUint32(16, centralStart, true);   // dir offset
    buffers.push(eocd);

    return new Blob(buffers, { type: "application/zip" });
  }
}

const ZipPlugin = {
  MiniZip,

  exportTreeToZip(rootNode, zipName = "project.zip") {
    const zip = new MiniZip();

    function addToZip(node, zipFolder) {
      if (node.kind === "file") {
        zipFolder.file(node.name, node.content || "");
      } else if (node.kind === "directory" && node.children) {
        const folder = zipFolder.folder(node.name);
        node.children.forEach(child => addToZip(child, folder));
      }
    }

    addToZip(rootNode, zip);

    const blob = zip.generateBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = zipName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
};

export default ZipPlugin;

