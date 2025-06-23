// crc32.js
const CRC32 = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }

  function from(input) {
    let data = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
    let crc = 0xFFFFFFFF;

    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }

    return (~crc) >>> 0;
  }

  return { from };
})();

export default CRC32;
