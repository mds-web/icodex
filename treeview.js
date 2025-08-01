import { Dom, createElement } from './dom.js';
import { extMap } from './ext/extMap.js';
import { importFiles } from './file/importFiles.js';
import { FileContentStorage } from './file/storage/FileContentStorage.js';
import { dialogWrapper, CustomDialog } from './dialog.js';
import clipboard from '../plugin/Clipboard.js';
import { p } from '../plugin/zip.js';
import { updateProject } from './file/storage/indexeDb.js';
import { CustomDropdown, DROPDOWN_CONTAINERS } from './dropdown.js';
import { SearchBox } from './searchBox.js';
import { updateFolderOpenState } from './file/storage/indexeDb.js';

import { LangText } from './language.js';

window.icodex ??= {};
Object.assign(icodex, {
  plugin: {
    clipboard: clipboard,
  },
});

const selectedMarker = document.createElement('div');

selectedMarker.className = '--selected';


let lastInputMethod = 'keyboard'; // default: keyboard

document.addEventListener('pointerdown', () => {
  lastInputMethod = 'mouse';
});

document.addEventListener('keydown', () => {
  lastInputMethod = 'keyboard';
});

export class TreeView {
  static currentOpenDropdown = null;
  mainParentTree;
  treeParentNode;
  containerLoading;
  static version = Object.freeze({
    major: 1,
    minor: 0,
    patch: 0,
  });
  folderOpen = false;
  static getVersion() {
    const v = TreeView.version;
    return `${v.major}.${v.minor}.${v.patch}`;
  }
  constructor(data) {
    if (Array.isArray(data)) {
      const valid = data.every(
        item =>
          typeof item === 'object' && item !== null && !Array.isArray(item),
      );
      if (!valid)
        throw new Error('TreeView error: array harus berisi object saja');
      this.data = data;
    } else if (typeof data === 'object' && data !== null) {
      this.data = [data];
    } else {
      throw new Error('TreeView error: data harus object atau array of object');
    }
    this.folderOpen = []

  }
  
}

TreeView.prototype.getNodeByPath = function getNodeByPath(path) {
  
  const parts = path.split('/').filter(Boolean);
  let currentNodes = this.data,
    currentNode = null;
  for (const part of parts) {
    if (((currentNode = currentNodes.find(n => n.name === part)), !currentNode))
      return null;
    currentNodes = currentNode.children || [];
  }
  return currentNode;
};

TreeView.prototype.searchTree = function searchTree(keyword) {
  const normalized = keyword.trim().toLowerCase();
  const isEmpty = normalized === '';

  const folderItems = this.mainParentTree.querySelectorAll('.folder-item');
  const fileItems = this.mainParentTree.querySelectorAll('.file-item');
  const allLabels = this.mainParentTree.querySelectorAll(
    '.folder-name, .file-name',
  );

  // Reset semua tampilan dan hapus highlight
  folderItems.forEach(el => (el.style.display = ''));
  fileItems.forEach(el => (el.style.display = ''));
  const directoryContents =
    this.mainParentTree.querySelectorAll('.directory-content');
  directoryContents.forEach(dc => {
    dc.style.display = '';
    dc.classList.remove('open');
  });

  allLabels.forEach(label => {
    const text = label.textContent;
    label.innerHTML = text; // reset isi label ke semula (tanpa span.highlight)
  });

  // Kalau kosong, berhenti di sini
  if (isEmpty) return;

  // Pencarian aktif
  const matchedItems = new Set();

  allLabels.forEach(label => {
    const text = label.textContent.toLowerCase();
    if (text.includes(normalized)) {
      // Tambah highlight
      const rawText = label.textContent;
      const regex = new RegExp(`(${keyword})`, 'ig');
      label.innerHTML = rawText.replace(
        regex,
        `<span class="highlight">$1</span>`,
      );

      const item = label.closest('.folder-item, .file-item');
      matchedItems.add(item);

      // Buka semua parent .directory-content agar terlihat
      let parent = item.parentElement;
      while (parent && parent.classList.contains('directory-content')) {
        parent.style.display = '';
        parent.classList.add('open');
        parent = parent.parentElement.closest('.directory-content');
      }
    }
  });

  // Sembunyikan yang tidak cocok, kecuali root (project name)
  folderItems.forEach(item => {
    if (!matchedItems.has(item)) {
      const isProjectRoot = item.id === 'line-0'; // Atur sesuai id project kamu
      if (!isProjectRoot) item.style.display = 'none';
    }
  });

  fileItems.forEach(item => {
    if (!matchedItems.has(item)) {
      item.style.display = 'none';
    }
  });

  // Sembunyikan folder kosong (yang tidak punya visible isi)
  directoryContents.forEach(dir => {
    const hasVisibleChild = dir.querySelector(
      ".folder-item:not([style*='display: none']), .file-item:not([style*='display: none'])",
    );
    if (!hasVisibleChild) {
      dir.style.display = 'none';
    }
  });
};

function moveSelectedMarkerTo(targetEl) {
if (!targetEl) return;


  // Kalau marker sudah di target yang sama, abaikan
  if (selectedMarker.parentElement === targetEl) return;

  // Pindahkan ke elemen target
  targetEl.insertAdjacentElement('afterbegin', selectedMarker);

  // Reset animasi
  selectedMarker.classList.remove('enter');

  // Trigger animasi 1 frame berikutnya
  requestAnimationFrame(() => {
    selectedMarker.classList.add('enter');
  });
}


TreeView.prototype.createErrorMessageElement =
  function createErrorMessageElement(text) {
    const p = document.createElement('p');
    p.className = 'error-messages-text';
    p.innerText = text;
    return p;
  };

TreeView.prototype.renderTree = function renderTree() {
  // Buat elemen utama tree
  this.mainParentTree = document.createElement('div');

  this.headerTools();

  this.mainParentTree.className = 'treeView';


  // Buat dan tambahkan elemen loading di atas
  this.containerLoading = document.createElement('div');
  this.mainParentTree.insertAdjacentElement(
    'afterbegin',
    this.containerLoading,
  );
  

  // Render setiap item dari data
 function f(param) {
  return window.addEventListener('refresh-tree-from-db', function(newitem) {
  console.log(newitem.detail)
  
  return this.data = newitem
  
})
 }
 
 
  this.data.forEach(item => {
    const el = this.createNode(item);
    

    if (el) this.mainParentTree.appendChild(el);
     
    
  });
  



document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

  lastInputMethod = 'keyboard';

  const items = Array.from(
    document.querySelectorAll('.folder-item, .file-item')
  );

  const currentIndex = items.indexOf(selectedMarker.parentElement);

  // Kalau belum ada marker, mulai dari 0
  let nextIndex = currentIndex === -1 ? 0 :
    e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

  // Batasi index agar tidak out-of-bound
  if (nextIndex >= 0 && nextIndex < items.length) {
    e.preventDefault();
    moveSelectedMarkerTo(items[nextIndex]);
    items[nextIndex].scrollIntoView({ block: 'nearest' }); // opsional
  }
});


  return this.mainParentTree;
};

TreeView.prototype.createNode = function createNode(node, level = 0) {
  return node
    ? 'directory' === node.type
      ? this.createDirectoryNode(node, level)
      : 'file' === node.type
      ? this.createFileNode(node, level)
      : null
    : null;
};

TreeView.prototype.headerTools = function headerTools() {
  const self = this;

  const root = self.data[0];
  const $header = document.createElement('nav');
  $header.className = 'treeView-header';
  const $iconGroup = document.createElement('a');
  $iconGroup.className = 'tree-icon-group';

  const dialogAddFolder = new CustomDialog(dialogWrapper);
  const $inputFolder = dialogAddFolder.input.input;
  const dialogNewFile = new CustomDialog(dialogWrapper);
  const inputNewFile = dialogNewFile.input.input;
  const confirmBtn = dialogNewFile.buttonPositive.button;
  const cancelBtn = dialogNewFile.buttonNegative.button;

  const $errorFolder = this.createErrorMessageElement('Path cannot be empty.');
  const tagErrorFile = this.createErrorMessageElement('Path cannot be empty');
  const fileType = document.createElement('span');
  (fileType.className = 'validation-icon-type'),
    fileType.setAttribute('data-validation-type', 'unknown'),
    inputNewFile.parentNode.appendChild(fileType);
  dialogAddFolder._dialogBody.append($errorFolder);

  const iconsActions = [
    'Explorer',
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 15 15"><path fill="currentColor" fill-rule="evenodd" d="M3.5 2a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V4.707L9.293 2zM2 2.5A1.5 1.5 0 0 1 3.5 1h6a.5.5 0 0 1 .354.146l2.926 2.927c.141.14.22.332.22.53V12.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 2 12.5zm2.75 5a.5.5 0 0 1 .5-.5H7V5.25a.5.5 0 0 1 1 0V7h1.75a.5.5 0 0 1 0 1H8v1.75a.5.5 0 0 1-1 0V8H5.25a.5.5 0 0 1-.5-.5" clip-rule="evenodd" stroke-width="0.5" stroke="currentColor"/></svg>',
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="ic-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/></svg>',
    },
  ];

  iconsActions.forEach((item, i) => {
    if (typeof item === 'string') {
      const $title = document.createElement('span');
      $title.textContent = item;
      $title.className = '_title';
      $header.appendChild($title);
      return;
    }

    const $btn = document.createElement('span');
    $btn.className = 'tree-icon-btn';
    $btn.id = `tree-tools-btn-${i}`;
    $btn.tabIndex = 0;
    $btn.role = 'button';

    const $tpl = document.createElement('template');
    $tpl.innerHTML = item.icon.trim();
    const $svg = $tpl.content.firstElementChild;
    if ($svg) $btn.appendChild($svg);

    if (i === 1) {
      const searchBox = new SearchBox();

      $header.appendChild(searchBox.element);
      this.searchBox = searchBox; // simpan referensi kalau butuh di luar
      const searchBoxEl = searchBox.element;
      $btn.addEventListener('click', () => {
        searchBoxEl.classList.remove('hidden');
        searchBox.focus();
        searchBox.onInput(keyword => this.searchTree(keyword));
        searchBox.close.addEventListener(
          'click',
          () => {
            searchBoxEl.classList.add('hidden');
          },
          { once: true },
        );
      });
    } else if (i === 2) {
    } else if (i === 3) {
      $btn.addEventListener('click', () => {
        dialogNewFile.title = 'new_file';
        dialogNewFile.placeholder = 'placeholder1';
        dialogNewFile.updateLanguage();
        dialogNewFile.show(true);

        const validateFileName = value => {
          const trimmed = value.trim();
          const ext = trimmed.split('.').pop().toLowerCase();
          const type = extMap[ext] || 'unknown';

          fileType.setAttribute('data-validation-type', type);

          if (!trimmed) {
            tagErrorFile.textContent = 'Path cannot be empty';
            tagErrorFile.classList.add('show');
            inputNewFile.classList.add('form-error');
            return false;
          }

          if (!/^[a-zA-Z0-9_\-./ ]+$/.test(trimmed)) {
            tagErrorFile.textContent = '!Invalid path name';
            tagErrorFile.classList.add('show');
            inputNewFile.classList.add('form-error');
            return false;
          }

          const fileName = trimmed.split('/').pop();
          const isDuplicate = (root.children || []).some(
            child => child.type === 'file' && child.name === fileName,
          );

          if (isDuplicate) {
            tagErrorFile.textContent = 'Path already exists';
            tagErrorFile.classList.add('show');
            inputNewFile.classList.add('form-error');
            return false;
          }

          tagErrorFile.classList.remove('show');
          inputNewFile.classList.remove('form-error');
          return true;
        };

        const onConfirm = () => {
          const value = inputNewFile.value;
          if (!validateFileName(value)) return;

          self.handleAddItem('file', value.trim(), root);
          dialogNewFile.show(false);
          inputNewFile.value = '';
          inputNewFile.classList.remove('form-error');
          tagErrorFile.classList.remove('show');
          confirmBtn.removeEventListener('click', onConfirm);
        };

        inputNewFile.addEventListener('input', () =>
          validateFileName(inputNewFile.value),
        );
        inputNewFile.addEventListener('keydown', e => {
          if (e.key === 'Enter') onConfirm();
        });

        confirmBtn.removeEventListener('click', onConfirm);
        confirmBtn.addEventListener('click', onConfirm);

        cancelBtn.addEventListener('click', () => {
          dialogNewFile.show(false);
          tagErrorFile.classList.remove('show');
          inputNewFile.classList.remove('form-error');
          confirmBtn.removeEventListener('click', onConfirm);
        });
      });
    } else if (i === 4) {
      $btn.addEventListener('click', () => {
        dialogAddFolder.title = 'new_folder';
        dialogAddFolder.placeholder = 'placeholder1';
        dialogAddFolder.updateLanguage();
        dialogAddFolder.show(true);

        const $ok = dialogAddFolder.buttonPositive.button;
        const $cancel = dialogAddFolder.buttonNegative.button;

        const validate = val => {
          const name = val.trim();
          if (!name) {
            $errorFolder.textContent = 'Path Cannot Be Empty';
            $errorFolder.classList.add('show');
            $inputFolder.classList.add('form-error');
            return false;
          }

          if (!/^[a-zA-Z0-9_\-./ ]+$/.test(name)) {
            $errorFolder.textContent = 'Invalid Path Name';
            $errorFolder.classList.add('show');
            $inputFolder.classList.add('form-error');
            return false;
          }

          const parts = name.split('/');
          let cur = root;
          let dup = false;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!cur.children) break;
            const found = cur.children.find(
              c => c.name === part && c.type === 'directory',
            );
            if (!found) break;
            cur = found;
            if (i === parts.length - 1) dup = true;
          }

          if (dup) {
            $errorFolder.textContent = 'Folder sudah ada.';
            $errorFolder.classList.add('show');
            $inputFolder.classList.add('form-error');
            return false;
          }

          $errorFolder.classList.remove('show');
          $inputFolder.classList.remove('form-error');
          return true;
        };

        const confirm = () => {
          const val = $inputFolder.value;
          if (validate(val)) {
            self.handleAddItem('directory', val.trim(), root);
            dialogAddFolder.show(false);
            $inputFolder.value = '';
            $errorFolder.classList.remove('show');
            $inputFolder.classList.remove('form-error');
            $ok.removeEventListener('click', confirm);
          }
        };

        $inputFolder.addEventListener('input', () =>
          validate($inputFolder.value),
        );
        $inputFolder.addEventListener('keydown', e => {
          if (e.key === 'Enter') confirm();
        });

        $ok.removeEventListener('click', confirm);
        $ok.addEventListener('click', confirm);

        $cancel.addEventListener('click', () => {
          dialogAddFolder.show(false);
          $errorFolder.classList.remove('show');
          $inputFolder.classList.remove('form-error');
          $ok.removeEventListener('click', confirm);
        });
      });
    } else {
      $btn.addEventListener('click', event => {
        const anchor = event.currentTarget;
        dropdown.toggle($btn);
      });
    }

    $iconGroup.appendChild($btn);
  });

  const headerTreeheader = new Dom(
    [
      {
        name: 'button',
        attr: [{ class: 'btn', 'aria-label': 'search file' }],
        children: [{ name: 'i', attr: [{ class: 'icodex icodex-search-2' }] }],
      },
      {
        name: 'button',
        attr: [{ class: 'btn', 'aria-label': 'file opened' }],
        children: [{ name: 'i', attr: [{ class: 'icodex icodex-location' }] }],
      },
      {
        name: 'button',
        attr: [{ class: 'btn', 'aria-label': 'new file' }],
        children: [
          { name: 'i', attr: [{ class: 'icodex icodex-file-added' }] },
        ],
      },
      {
        name: 'button',
        attr: [{ class: 'btn', 'aria-label': 'new folder' }],
        children: [
          { name: 'i', attr: [{ class: 'icodex icodex-folder-plus' }] },
        ],
      },
      {
        name: 'button',
        attr: [{ class: 'btn', 'aria-label': 'open dropdown' }],
        children: [
          { name: 'i', attr: [{ class: 'icodex icodex-kebab-horizontal' }] },
        ],
      },
    ],
    $header,
  );

  if (!$header.isConnected) {
    this.mainParentTree.insertAdjacentElement('afterbegin', $header);
  }
};

TreeView.prototype.createDirectoryNode = function createDirectoryNode(
  node,
  level = 0,
) {
  if (arguments.length > 2 || arguments.length < 2) {
    console.error('TreeView.prototype.createDirectoryNode');
    return false;
  }
  // Elemen utama direktori (pembungkus)
  const directory = document.createElement('div');
  directory.className = 'directory';

  // Wrapper folder sebagai item clickable
  const wrapper = document.createElement('a');
  wrapper.className = 'folder-item ';
  wrapper.tabIndex = 0;
  directory.id = `line-${level}`;
  // Pasang event pointerenter agar jalan di HP dan desktop


  // Jika showIndent true, tambahkan indentasi sesuai level

const user = { name: 'Indra' };

// tambah properti
user.email = 'indra@mail.com';
user['role'] = 'admin';

// hapus properti
delete user.role; 
 

  for (let i = 0; i < level; i++) {
    const indent = document.createElement('span');
    indent.className = 'indent';
    wrapper.appendChild(indent);
  }

  // Chevron SVG (ikon panah)
  const chevron = document.createElement('span');
  chevron.className = 'codicon codicon-chevron-right';

  // Nama folder
  const folderName = document.createElement('span');
  folderName.className = 'folder-name';
  folderName.textContent = node.name;

  // Tambahkan chevron dan nama folder ke wrapper
  wrapper.appendChild(chevron);
  wrapper.appendChild(folderName);

  // Tombol tiga titik (dropdown toggle)
  const _toggle_three_dots = document.createElement('span');
  _toggle_three_dots.className = '_toggle_three_dots-horizontal';
  _toggle_three_dots.tabIndex = 0;
  _toggle_three_dots.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="ic-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/></svg>';

  wrapper.addEventListener('mouseenter', () => {
  moveSelectedMarkerTo(wrapper);
});



  wrapper.appendChild(_toggle_three_dots);

  // Kontainer konten anak dari direktori
  const content = document.createElement('div');
  content.className = 'directory-content';
  content.addEventListener("contextmenu", (e) => e.preventDefault());
  content.id = level
   content.dataset.id = level
  // Inisialisasi dropdown
  const renderDropdown = new CustomDropdown(DROPDOWN_CONTAINERS, wrapper);

  // Setup dropdown folder dari TreeView

  this.setupDirectoryDropdown(node, renderDropdown);

  // Tambahkan opsi "Import Files" ke grup pertama
  renderDropdown._group[0].option.push({
    value: 'Import Files',
    icon: 'icodex icodex-upload',
    id: 'import-files',
  });

  // Tambahkan dua grup dropdown tambahan
  renderDropdown._group.push(
    {
      label: 'group-2',
      option: [
        {
          value: new LangText({
            id: 'Salin',
            en: 'Copy',
          }).getText(),
          icon: 'icodex icodex-copy',
          id: 'copy-folder',
        },
        {
          value: new LangText({
            id: 'Potong',
            en: 'Cut',
          }).getText(),

          icon: 'tb tb-scissors',
          id: 'cut-folder',
        },
        {
          value: new LangText({
            id: 'Ganti Nama',
            en: 'Rename',
          }).getText(),
          icon: 'icodex icodex-pencil',
          id: 'rename-folder',
        },
        {
          value: new LangText({
            id: 'Salin Path',
            en: 'Copy Path',
          }).getText(),

          icon: 'icodex icodex-copy',
          id: 'copy-path-folder',
        },
      ],
    },
    {
      label: 'group-3',
      option: [
        {
          value: new LangText({
            id: 'Unduh',
            en: 'Download',
          }).getText(),
          icon: 'icodex icodex-share',
          id: 'export-folder',
        },
        {
          value: new LangText({
            id: 'Hapus',
            en: 'Delete',
          }).getText(),
          icon: 'icodex icodex-trash',
          id: 'delete-this-folder',
        },
      ],
    },
  );
  

document.addEventListener('folderExpanded', function(e) {
  
})


wrapper.addEventListener('click', (e) => {
  console.log(this.data)
  const isOpen = content.classList.toggle('open');

  if (isOpen) {
    chevron.style.rotate = '90deg';
    wrapper.classList.add('open');
    node.folderIsOpen = true;
  } else {
    chevron.style.rotate = '0deg';
    wrapper.classList.remove('open');
    node.folderIsOpen = false;
    
  }
window.dispatchEvent(new CustomEvent('update', { detail: this.data})) 
  // ⬅️ Update ke DB biar persist
  
});



  

  // Event: klik pada tiga titik (tampilkan dropdown)
  _toggle_three_dots.addEventListener('click', event => {
    event.stopPropagation();
    event.preventDefault();

    // Tutup dropdown lain jika berbeda
    if (
      TreeView.currentOpenDropdown &&
      TreeView.currentOpenDropdown !== renderDropdown
    ) {
      TreeView.currentOpenDropdown.open(false);
    }

    // Toggle dropdown
    const isOpen = DROPDOWN_CONTAINERS.classList.toggle('open');
    renderDropdown.open(isOpen);
    TreeView.currentOpenDropdown = isOpen ? renderDropdown : null;

    // Siapkan listener untuk klik luar dropdown
    const hideDropdown = () => {
      if (TreeView.currentOpenDropdown) {
        TreeView.currentOpenDropdown.open(false);
        TreeView.currentOpenDropdown = null;
      }
    };
    document.removeEventListener('click', hideDropdown);
    document.addEventListener('click', hideDropdown);
  });

  // Event: klik area dropdown supaya tidak menutup TreeView
  DROPDOWN_CONTAINERS.addEventListener('click', e => {
    e.stopPropagation();
    if (TreeView.currentOpenDropdown) {
      TreeView.currentOpenDropdown.open(false);
      TreeView.currentOpenDropdown = null;
    }
  });

  // Jika ada children, render secara rekursif
  if (Array.isArray(node.children)) {
    node.children.forEach(child => {
      const childNode = this.createNode(child, level + 1);
      if (childNode) content.appendChild(childNode);
    });
  }

  // Tambahkan wrapper dan konten ke elemen utama direktori
  directory.appendChild(wrapper);
  directory.appendChild(content);
  // Jika node.folderIsOpen = true, buka kembali folder ini saat render

  return directory;
};



TreeView.prototype.setupDirectoryDropdown = function setupDirectoryDropdown(
  node,
  dropdownInstance,
) {
  let self = this;

  const newFile = new CustomDialog(dialogWrapper);
  const newFolder = new CustomDialog(dialogWrapper);
  const renameFolder = new CustomDialog(dialogWrapper);

  var tagErrorFile = this.createErrorMessageElement('');
  var tagErrorFolder = this.createErrorMessageElement(
    'path tidak boleh kosong',
  );
  var tagErrorRenameFolder = this.createErrorMessageElement(
    'path tidak boleh kosong',
  );

  const inputFileEl = newFile.input.input;
  const inputFolderEl = newFolder.input.input;
  const renameFolderInputEl = renameFolder.input.input;

  inputFileEl.parentNode.appendChild(tagErrorFile);
  inputFolderEl.parentNode.appendChild(tagErrorFolder);
  renameFolderInputEl.parentNode.appendChild(tagErrorRenameFolder);

  const fileType = document.createElement('span');
  fileType.className = 'validation-icon-type';
  fileType.setAttribute('data-validation-type', 'unknown');
  inputFileEl.parentNode.appendChild(fileType);

  dropdownInstance.addEventListener('optclick', e => {
    const clicked = e.detail.option;
    if (clicked.id === 'new-file') {
      newFile.title = 'new_file';
      newFile.placeholder = 'placeholder1';
      newFile.updateLanguage();
      newFile.show(true);

      const validateFileName = value => {
        const trimmed = value.trim();
        const ext = value.split('.').pop().toLowerCase();
        const type = extMap[ext] || 'unknown';

        fileType.setAttribute('data-validation-type', type);

        if (!trimmed) {
          tagErrorFile.textContent = 'Path cannot be empty';
          tagErrorFile.classList.add('show');
          tagErrorFile.id = '';
          inputFileEl.classList.add('form-error');
          return false;
        }

        if (!/^[a-zA-Z0-9_\-./ ]+$/.test(trimmed)) {
          tagErrorFile.textContent = '!Invalid path name';
          tagErrorFile.classList.add('show');
          tagErrorFile.id = 'infalid';
          return false;
        }

        const fileNameOnly = trimmed.split('/').pop();
        const isDuplicate = (node.children || []).some(
          child => child.type === 'file' && child.name === fileNameOnly,
        );

        if (isDuplicate) {
          tagErrorFile.textContent = 'Path Already Exists';
          tagErrorFile.classList.add('show');
          inputFileEl.classList.add('form-error');
          tagErrorFile.id = '';
          return false;
        }

        // clear error
        tagErrorFile.classList.remove('show');
        tagErrorFile.id = '';
        inputFileEl.classList.remove('form-error');
        return true;
      };

      const onPositiveClick = () => {
        const inputValue = inputFileEl.value;
        if (!validateFileName(inputValue)) return;

        self.handleAddItem('file', inputValue.trim(), node);
        inputFileEl.value = '';
        newFile.show(false);
        inputFileEl.classList.remove('form-error');
        tagErrorFile.classList.remove('show');

        newFile.buttonPositive.button.removeEventListener(
          'click',
          onPositiveClick,
        );
      

      };

      inputFileEl.addEventListener('input', () =>
        validateFileName(inputFileEl.value),
      );

      inputFileEl.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.keyCode === 13) onPositiveClick();
      });

      newFile.buttonPositive.button.removeEventListener(
        'click',
        onPositiveClick,
      );
      newFile.buttonPositive.button.addEventListener('click', onPositiveClick);

      newFile.buttonNegative.button.addEventListener('click', () => {
        newFile.show(false);
        tagErrorFile.classList.remove('show');
        inputFileEl.classList.remove('form-error');
        newFile.buttonPositive.button.removeEventListener(
          'click',
          onPositiveClick,
        );
      });
    } else if (clicked.id === 'new-folder') {
      newFolder.title = 'new_folder';
      newFolder.updateLanguage();
      newFolder.show(true);

      const confirmBtn = newFolder.buttonPositive.button;
      const cancelBtn = newFolder.buttonNegative.button;
     
      const validateFolderName = value => {
        const trimmed = value.trim();
        if (!trimmed) {
          tagErrorFolder.textContent = 'Path Cannot Be Empty';
          tagErrorFolder.classList.add('show');
          inputFolderEl.classList.add('form-error');
          return false;
        }

        if (!/^[a-zA-Z0-9_\-./ ]+$/.test(trimmed)) {
          tagErrorFolder.textContent = 'Infalid Path Name';
          tagErrorFolder.classList.add('show');
          inputFolderEl.classList.add('form-error');
          return false;
        }

        const pathParts = trimmed.split('/');
        let current = node;
        let isDuplicate = false;

        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          if (!current.children) break;

          const found = current.children.find(
            child => child.name === part && child.type === 'directory',
          );
          if (!found) break;

          current = found;
          if (i === pathParts.length - 1) isDuplicate = true;
        }

        if (isDuplicate) {
          tagErrorFolder.textContent = 'Folder sudah ada.';
          tagErrorFolder.classList.add('show');
          inputFolderEl.classList.add('form-error');
          return false;
        }

        tagErrorFolder.classList.remove('show');
        inputFolderEl.classList.remove('form-error');
        return true;
      };

      inputFolderEl.addEventListener('input', () => {
        validateFolderName(inputFolderEl.value);
      });

      inputFolderEl.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.keyCode === 13) {
          onConfirm();
        }
      });

      const onConfirm = () => {
        const inputValue = inputFolderEl.value;
        if (validateFolderName(inputValue)) {
          self.handleAddItem('directory', inputValue.trim(), node);
          newFolder.show(false);
          inputFolderEl.value = '';
          tagErrorFolder.classList.remove('show');
          inputFolderEl.classList.remove('form-error');
          confirmBtn.removeEventListener('click', onConfirm);
        }
      };

      confirmBtn.removeEventListener('click', onConfirm);
      confirmBtn.addEventListener('click', onConfirm);

      cancelBtn.addEventListener('click', () => {
        newFolder.show(false);
        tagErrorFolder.classList.remove('show');
        inputFolderEl.classList.remove('form-error');
        confirmBtn.removeEventListener('click', onConfirm);
      });
    } else if (clicked.id === 'rename-folder') {
      renameFolder.show(true);

      const confirmBtn = renameFolder.buttonPositive.button;
      const cancelBtn = renameFolder.buttonNegative.button;

      renameFolder.value = node.name;
      renameFolder.input.select();

      const validateFolderName = value => {
        const trimmed = value.trim();
        if (!trimmed) {
          tagErrorRenameFolder.textContent = new LangText({
            en: 'Path Cannot be Empty',
            id: 'Path tidak boleh kosong',
            es: 'la ruta no puede estar vacía',
            fr: 'le chemin ne peut pas être vide',
            de: 'Pfad darf nicht leer sein',
            ja: 'パスを空にすることはできません',
            ko: '경로는 비워둘 수 없습니다',
            zh: '路径不能为空',
            ru: 'путь не может быть пустым',
            pt: 'o caminho não pode estar vazio',
            hi: 'पथ खाली नहीं हो सकता',
            tr: 'yol boş olamaz',
          }).getText();
          tagErrorRenameFolder.classList.add('show');
          renameFolderInputEl.classList.add('form-error');
          return false;
        }
        /**
 * {
  "id": {
    "pathNotEmpty": "path tidak boleh kosong",
    "newFile": "file baru",
    "newFolder": "folder baru",
    "invalidPath": "path tidak valid",
    "create": "buat",
    "cancel": "membatalkan",
    "pathExists": "path sudah ada",
    "importFile": "mengimpor berkas",
    "delete": "hapus",
    "download": "unduh",
    "downloadZip": "unduh sebagai zip",
    "copy": "salin",
    "copied": "disalin ke papan klip",
    "cut": "potong",
    "rename": "ganti nama",
    "copyPath": "salin path",
    "refresh": "segarkan berkas",
    "preferences": "preferensi",
    "project": "proyek",
    "file": "berkas",
    "language": "bahasa",
    "theme": "tema",
    "background": "latar belakang",
    "appearance": "tampilan",
    "createProject": "buat proyek"
  },
  "en": {
    "pathNotEmpty": "path cannot be empty",
    "newFile": "new file",
    "newFolder": "new folder",
    "invalidPath": "invalid path",
    "create": "create",
    "cancel": "cancel",
    "pathExists": "path already exists",
    "importFile": "import file",
    "delete": "delete",
    "download": "download",
    "downloadZip": "download as zip",
    "copy": "copy",
    "copied": "copied to clipboard",
    "cut": "cut",
    "rename": "rename",
    "copyPath": "copy path",
    "refresh": "refresh files",
    "preferences": "preferences",
    "project": "project",
    "file": "file",
    "language": "language",
    "theme": "theme",
    "background": "background",
    "appearance": "appearance",
    "createProject": "create project"
  },
  "es": {
    "pathNotEmpty": "la ruta no puede estar vacía",
    "newFile": "nuevo archivo",
    "newFolder": "nueva carpeta",
    "invalidPath": "ruta no válida",
    "create": "crear",
    "cancel": "cancelar",
    "pathExists": "la ruta ya existe",
    "importFile": "importar archivo",
    "delete": "eliminar",
    "download": "descargar",
    "downloadZip": "descargar como zip",
    "copy": "copiar",
    "copied": "copiado al portapapeles",
    "cut": "cortar",
    "rename": "renombrar",
    "copyPath": "copiar ruta",
    "refresh": "actualizar archivos",
    "preferences": "preferencias",
    "project": "proyecto",
    "file": "archivo",
    "language": "idioma",
    "theme": "tema",
    "background": "fondo",
    "appearance": "apariencia",
    "createProject": "crear proyecto"
  },
  "fr": {
    "pathNotEmpty": "le chemin ne peut pas être vide",
    "newFile": "nouveau fichier",
    "newFolder": "nouveau dossier",
    "invalidPath": "chemin invalide",
    "create": "créer",
    "cancel": "annuler",
    "pathExists": "le chemin existe déjà",
    "importFile": "importer un fichier",
    "delete": "supprimer",
    "download": "télécharger",
    "downloadZip": "télécharger en zip",
    "copy": "copier",
    "copied": "copié dans le presse-papiers",
    "cut": "couper",
    "rename": "renommer",
    "copyPath": "copier le chemin",
    "refresh": "actualiser les fichiers",
    "preferences": "préférences",
    "project": "projet",
    "file": "fichier",
    "language": "langue",
    "theme": "thème",
    "background": "arrière-plan",
    "appearance": "apparence",
    "createProject": "créer un projet"
  },
  "de": {
    "pathNotEmpty": "Pfad darf nicht leer sein",
    "newFile": "neue Datei",
    "newFolder": "neuer Ordner",
    "invalidPath": "ungültiger Pfad",
    "create": "erstellen",
    "cancel": "abbrechen",
    "pathExists": "Pfad existiert bereits",
    "importFile": "Datei importieren",
    "delete": "löschen",
    "download": "herunterladen",
    "downloadZip": "als ZIP herunterladen",
    "copy": "kopieren",
    "copied": "in die Zwischenablage kopiert",
    "cut": "ausschneiden",
    "rename": "umbenennen",
    "copyPath": "Pfad kopieren",
    "refresh": "Dateien aktualisieren",
    "preferences": "Einstellungen",
    "project": "Projekt",
    "file": "Datei",
    "language": "Sprache",
    "theme": "Thema",
    "background": "Hintergrund",
    "appearance": "Darstellung",
    "createProject": "Projekt erstellen"
  },
  "ja": {
    "pathNotEmpty": "パスを空にすることはできません",
    "newFile": "新しいファイル",
    "newFolder": "新しいフォルダー",
    "invalidPath": "無効なパス",
    "create": "作成",
    "cancel": "キャンセル",
    "pathExists": "パスはすでに存在します",
    "importFile": "ファイルをインポート",
    "delete": "削除",
    "download": "ダウンロード",
    "downloadZip": "ZIPとしてダウンロード",
    "copy": "コピー",
    "copied": "クリップボードにコピーされました",
    "cut": "カット",
    "rename": "名前を変更",
    "copyPath": "パスをコピー",
    "refresh": "ファイルを更新",
    "preferences": "設定",
    "project": "プロジェクト",
    "file": "ファイル",
    "language": "言語",
    "theme": "テーマ",
    "background": "背景",
    "appearance": "外観",
    "createProject": "プロジェクトを作成"
  },
  "ko": {
    "pathNotEmpty": "경로는 비워둘 수 없습니다",
    "newFile": "새 파일",
    "newFolder": "새 폴더",
    "invalidPath": "잘못된 경로",
    "create": "생성",
    "cancel": "취소",
    "pathExists": "경로가 이미 존재합니다",
    "importFile": "파일 가져오기",
    "delete": "삭제",
    "download": "다운로드",
    "downloadZip": "ZIP으로 다운로드",
    "copy": "복사",
    "copied": "클립보드에 복사됨",
    "cut": "잘라내기",
    "rename": "이름 바꾸기",
    "copyPath": "경로 복사",
    "refresh": "파일 새로고침",
    "preferences": "환경설정",
    "project": "프로젝트",
    "file": "파일",
    "language": "언어",
    "theme": "테마",
    "background": "배경",
    "appearance": "모양",
    "createProject": "프로젝트 생성"
  },
  "zh": {
    "pathNotEmpty": "路径不能为空",
    "newFile": "新文件",
    "newFolder": "新文件夹",
    "invalidPath": "路径无效",
    "create": "创建",
    "cancel": "取消",
    "pathExists": "路径已存在",
    "importFile": "导入文件",
    "delete": "删除",
    "download": "下载",
    "downloadZip": "下载为 ZIP",
    "copy": "复制",
    "copied": "已复制到剪贴板",
    "cut": "剪切",
    "rename": "重命名",
    "copyPath": "复制路径",
    "refresh": "刷新文件",
    "preferences": "首选项",
    "project": "项目",
    "file": "文件",
    "language": "语言",
    "theme": "主题",
    "background": "背景",
    "appearance": "外观",
    "createProject": "创建项目"
  },
  "ru": {
    "pathNotEmpty": "путь не может быть пустым",
    "newFile": "новый файл",
    "newFolder": "новая папка",
    "invalidPath": "недопустимый путь",
    "create": "создать",
    "cancel": "отмена",
    "pathExists": "путь уже существует",
    "importFile": "импортировать файл",
    "delete": "удалить",
    "download": "скачать",
    "downloadZip": "скачать как ZIP",
    "copy": "копировать",
    "copied": "скопировано в буфер обмена",
    "cut": "вырезать",
    "rename": "переименовать",
    "copyPath": "копировать путь",
    "refresh": "обновить файлы",
    "preferences": "настройки",
    "project": "проект",
    "file": "файл",
    "language": "язык",
    "theme": "тема",
    "background": "фон",
    "appearance": "интерфейс",
    "createProject": "создать проект"
  },
  "ar": {
    "pathNotEmpty": "لا يمكن أن يكون المسار فارغًا",
    "newFile": "ملف جديد",
    "newFolder": "مجلد جديد",
    "invalidPath": "مسار غير صالح",
    "create": "إنشاء",
    "cancel": "إلغاء",
    "pathExists": "المسار موجود بالفعل",
    "importFile": "استيراد ملف",
    "delete": "حذف",
    "download": "تنزيل",
    "downloadZip": "تنزيل كملف ZIP",
    "copy": "نسخ",
    "copied": "تم النسخ إلى الحافظة",
    "cut": "قص",
    "rename": "إعادة تسمية",
    "copyPath": "نسخ المسار",
    "refresh": "تحديث الملفات",
    "preferences": "التفضيلات",
    "project": "مشروع",
    "file": "ملف",
    "language": "اللغة",
    "theme": "السمة",
    "background": "الخلفية",
    "appearance": "المظهر",
    "createProject": "إنشاء مشروع"
  },
  "pt": {
    "pathNotEmpty": "o caminho não pode estar vazio",
    "newFile": "novo arquivo",
    "newFolder": "nova pasta",
    "invalidPath": "caminho inválido",
    "create": "criar",
    "cancel": "cancelar",
    "pathExists": "o caminho já existe",
    "importFile": "importar arquivo",
    "delete": "excluir",
    "download": "baixar",
    "downloadZip": "baixar como zip",
    "copy": "copiar",
    "copied": "copiado para a área de transferência",
    "cut": "recortar",
    "rename": "renomear",
    "copyPath": "copiar caminho",
    "refresh": "atualizar arquivos",
    "preferences": "preferências",
    "project": "projeto",
    "file": "arquivo",
    "language": "idioma",
    "theme": "tema",
    "background": "plano de fundo",
    "appearance": "aparência",
    "createProject": "criar projeto"
  },
  "hi": {
    "pathNotEmpty": "पथ खाली नहीं हो सकता",
    "newFile": "नई फ़ाइल",
    "newFolder": "नया फ़ोल्डर",
    "invalidPath": "अमान्य पथ",
    "create": "बनाएँ",
    "cancel": "रद्द करें",
    "pathExists": "पथ पहले से मौजूद है",
    "importFile": "फ़ाइल आयात करें",
    "delete": "हटाएँ",
    "download": "डाउनलोड",
    "downloadZip": "ZIP के रूप में डाउनलोड करें",
    "copy": "कॉपी करें",
    "copied": "क्लिपबोर्ड पर कॉपी किया गया",
    "cut": "काटें",
    "rename": "नाम बदलें",
    "copyPath": "पथ कॉपी करें",
    "refresh": "फ़ाइलें ताज़ा करें",
    "preferences": "वरीयताएँ",
    "project": "प्रोजेक्ट",
    "file": "फ़ाइल",
    "language": "भाषा",
    "theme": "थीम",
    "background": "पृष्ठभूमि",
    "appearance": "रूप",
    "createProject": "प्रोजेक्ट बनाएँ"
  },
  "tr": {
    "pathNotEmpty": "yol boş olamaz",
    "newFile": "yeni dosya",
    "newFolder": "yeni klasör",
    "invalidPath": "geçersiz yol",
    "create": "oluştur",
    "cancel": "iptal",
    "pathExists": "yol zaten var",
    "importFile": "dosya içe aktar",
    "delete": "sil",
    "download": "indir",
    "downloadZip": "ZIP olarak indir",
    "copy": "kopyala",
    "copied": "panoya kopyalandı",
    "cut": "kes",
    "rename": "yeniden adlandır",
    "copyPath": "yolu kopyala",
    "refresh": "dosyaları yenile",
    "preferences": "tercihler",
    "project": "proje",
    "file": "dosya",
    "language": "dil",
    "theme": "tema",
    "background": "arka plan",
    "appearance": "görünüm",
    "createProject": "proje oluştur"
  }
}

 */
        if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) {
          tagErrorRenameFolder.textContent = new LangText({
            id: 'Path tidak valid',
            en: 'Invalid path',
          });
          tagErrorRenameFolder.classList.add('show');
          renameFolderInputEl.classList.add('form-error');
          return false;
        }

        const rootProject = self.findRootProject(self.data, node);
        const parentNode = self.findParentNode(rootProject, node);

        const isDuplicate = (parentNode?.children || []).some(
          child =>
            child.type === 'directory' &&
            child !== node &&
            child.name === trimmed,
        );

        if (isDuplicate) {
          tagErrorRenameFolder.textContent = `Folder "${trimmed}" sudah ada.`;
          tagErrorRenameFolder.classList.add('show');
          renameFolderInputEl.classList.add('form-error');
          return false;
        }

        tagErrorRenameFolder.classList.remove('show');
        renameFolderInputEl.classList.remove('form-error');
        return true;
      };

      renameFolderInputEl.addEventListener('input', () => {
        validateFolderName(renameFolderInputEl.value);
      });

      const onConfirm = () => {
        const newName = renameFolder.value.trim();
        if (!validateFolderName(newName)) return;

        const oldPath = node.path;
        const oldName = node.name;

        node.name = newName;

        const rootProject = self.findRootProject(self.data, node);
        if (!rootProject) {
          console.error('Root project tidak ditemukan saat rename.');
          return;
        }

        const isRoot = node === rootProject;
        let newPath = '/';

        if (!isRoot) {
          const parentNode = self.findParentNode(rootProject, node);
          newPath = `${parentNode?.path || '/'}/${newName}`.replace(
            /\/+/g,
            '/',
          );
          node.path = newPath;
        } else {
          node.path = '/';
        }

        const updateChildPaths = folderNode => {
          if (folderNode.children) {
            for (const child of folderNode.children) {
              child.path = `${folderNode.path}/${child.name}`.replace(
                /\/+/g,
                '/',
              );
              if (child.type === 'directory') {
                updateChildPaths(child);
              }
            }
          }
        };

        if (!isRoot) {
          updateChildPaths(node);
        }

        console.log(
          `[TreeView] Folder di-rename dari "${oldName}" menjadi "${newName}", path baru: ${node.path}`,
        );

        document.dispatchEvent(
          new CustomEvent('folder-renamed', {
            detail: {
              oldPath: oldPath,
              newPath: node.path,
              renamedNode: node,
            },
          }),
        );

        self.refreshAndSave(rootProject);
        renameFolder.show(false);
        tagErrorRenameFolder.classList.remove('show');
        renameFolderInputEl.classList.remove('form-error');
        confirmBtn.removeEventListener('click', onConfirm);
      };

      confirmBtn.removeEventListener('click', onConfirm);
      confirmBtn.addEventListener('click', onConfirm);

      const closeDialog = () => {
        renameFolder.show(false);
        tagErrorRenameFolder.classList.remove('show');
        renameFolderInputEl.classList.remove('form-error');
        confirmBtn.removeEventListener('click', onConfirm);
      };

      cancelBtn.addEventListener('click', closeDialog);
      renameFolder.buttonNegative.button.addEventListener('click', closeDialog);
    } else if (clicked.id === 'import-files') {
      importFiles({
        node,
        self: this,
        loadingContainer: this.containerLoading,
        findRootProject: this.findRootProject.bind(this),
        refreshAndSave: this.refreshAndSave.bind(this),
      });
    } else if ('copy-folder' === clicked.id) {
      icodex.plugin.clipboard.paste();
    } else if ('cut-folder' === clicked.id);
    else if ('copy-path-folder' === clicked.id) {
      icodex.plugin.clipboard.copy(node.path);
    } else if (clicked.id === 'delete-this-folder') {
      const rootProject = self.findRootProject(self.data, node);
      if (!rootProject) return void alert('Root project tidak ditemukan.');

      const parentNode = self.findParentNode(rootProject, node);
      if (!parentNode)
        return void console.error('Parent folder tidak ditemukan.');

      if (
        !window.confirm(
          `Yakin ingin menghapus folder "${node.name}" beserta semua isinya?`,
        )
      )
        return;

      const index = parentNode.children.findIndex(child => child === node);
      if (index !== -1) {
        parentNode.children.splice(index, 1);
        document.dispatchEvent(
          new CustomEvent('folder-removed', {
            detail: {
              removedPath: node.path,
            },
          }),
        );
        self.refreshAndSave(rootProject);
        console.warn(`Folder "${node.path}" telah dihapus.`);
      } else {
        console.error(`Folder "${node.name}" tidak ditemukan di parent.`);
      }
    } else if ('export-folder' === clicked.id) {
      const rootNode = node;
      window.Icodex.plugins.ZipPlugin.exportTreeToZip(
        rootNode,
        `${rootNode.name}.zip`,
      );
    }
  });
};

TreeView.prototype.createFileNode = function createFileNode(node, level = 0) {
  const fileWrapper = document.createElement('a');
  fileWrapper.className = 'file-item';
  fileWrapper.tabIndex = 0;
  fileWrapper.dataset.path = node.path;
  fileWrapper.dataset.name = node.name;

  for (let i = 0; i < level; i++) {
    const indent = document.createElement('span');
    indent.className = 'indent';
    fileWrapper.appendChild(indent);
  }

  const fileName = document.createElement('span');
  fileName.className = 'file-name';
  fileName.id = `line-${level}`;

  const _language_icon = document.createElement('span');
  _language_icon.className = 'icodex-lang-icon';
  // Tentukan ekstensi file → tipe data
  const ext = node.name.split('.').pop().toLowerCase();

  _language_icon.setAttribute('data-file-type', extMap[ext] || 'unknown');
  fileWrapper.appendChild(_language_icon);

  fileName.textContent = node.name;
  fileWrapper.appendChild(fileName);

  this.setupFileDropdown(node, fileWrapper);
fileWrapper.addEventListener('mouseenter', () => {
  moveSelectedMarkerTo(fileWrapper);
});


  // fileWrapper.addEventListener('pointerenter', () => {
  //   // Hapus dari parent sebelumnya (jika ada)
  //   if (selectedMarker.parentElement) {
  //     selectedMarker.parentElement.removeChild(selectedMarker);
  //   }

  //   // Reset state animasi
  //   selectedMarker.classList.remove('enter');

  //   // Tambahkan ke wrapper
  //   fileWrapper.insertAdjacentElement('afterbegin', selectedMarker);

  //   // Trigger animasi dengan delay 1 frame (biar CSS transition aktif)
  //   requestAnimationFrame(() => {
  //     selectedMarker.classList.add('enter');
  //   });
  // });

  return fileWrapper;
};

TreeView.prototype.setupFileDropdown = function setupFileDropdown(
  node,
  anchor,
) {
  const self = this;
  const _toggle_three_dots = document.createElement('span');
  _toggle_three_dots.className = '_toggle_three_dots-horizontal';
  _toggle_three_dots.tabIndex = 0;
  _toggle_three_dots.setAttribute('role', 'button');
  _toggle_three_dots.ariaLabel = 'Open Dropdown';
  _toggle_three_dots.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" class="ic-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/></svg>';
  anchor.appendChild(_toggle_three_dots);

  const icodeXFileDropdown = new CustomDropdown(DROPDOWN_CONTAINERS, anchor);
  icodeXFileDropdown._group[0].option = [
    {
      value: new LangText({ id: 'salin', en: 'Copy' }).getText(),
      icon: 'icodex icodex-copy',
      id: 'copy-file',
    },
    {
      value: new LangText({ id: 'potong', en: 'Cut' }).getText(),
      icon: 'tb tb-scissors',
      id: 'cut-file',
    },
    {
      value: new LangText({ id: 'ubah nama', en: 'Rename' }).getText(),
      icon: 'bi bi-pencil',
      id: 'rename-file',
    },
    {
      value: new LangText({ id: 'salin path', en: 'Copy Path' }).getText(),
      icon: 'bi bi-copy',
      id: 'copy-path-file',
    },
  ];

  icodeXFileDropdown._group.push({
    label: 'group-2',
    option: [
      {
        value: new LangText({ id: 'hapus', en: 'Delete' }).getText(),
        icon: 'codicon codicon-trash',
        id: 'delete-this-file',
      },
    ],
  });

  _toggle_three_dots.addEventListener('click', event => {
    event.stopPropagation();
    event.preventDefault();
    //indrajit
    if (
      TreeView.currentOpenDropdown &&
      TreeView.currentOpenDropdown !== icodeXFileDropdown
    ) {
      TreeView.currentOpenDropdown.open(false);
    }

    const isOpen = DROPDOWN_CONTAINERS.classList.toggle('open');
    icodeXFileDropdown.open(isOpen);
    TreeView.currentOpenDropdown = isOpen ? icodeXFileDropdown : null;
  });
  

  this.treeParentNode.addEventListener('scroll', e => {
    e.stopPropagation();
    if (TreeView.currentOpenDropdown) {
      TreeView.currentOpenDropdown.open(false);
      TreeView.currentOpenDropdown = null;
    }
  });

  const hideDropdown = () => {
    TreeView.currentOpenDropdown &&
      (TreeView.currentOpenDropdown.open(!1),
      (TreeView.currentOpenDropdown = null));
  };

  document.removeEventListener('click', hideDropdown);
  document.addEventListener('click', hideDropdown);

  icodeXFileDropdown.addEventListener('optclick', e => {
    const clicked = e.detail.option;
    if ('rename-file' === clicked.id) {
      const newName = prompt('Rename file:', node.name);
      if (!newName || !newName.trim()) return;
      const trimmedName = newName.trim();
      const rootProject = self.findRootProject(self.data, node);
      if (!rootProject)
        return void console.error(
          'Root project tidak ditemukan saat rename file.',
        );
      const parentNode = self.findParentNode(rootProject, node);
      if (
        (parentNode?.children || []).some(
          child =>
            child !== node &&
            'file' === child.type &&
            child.name === trimmedName,
        )
      ) {
        return void alert(
          `File dengan nama "${trimmedName}" sudah ada di folder ini.`,
        );
      }
      const oldPath = node.path;
      node.name = trimmedName;
      const newPath = `${parentNode?.path || '/'}/${trimmedName}`.replace(
        /\/+/g,
        '/',
      );
      node.path = newPath;
      self.refreshAndSave(rootProject);
      const renameEvent = new CustomEvent('file-renamed', {
        detail: {
          oldPath: oldPath,
          newPath: newPath,
          newName: trimmedName,
          type: node.type,
        },
      });
      document.dispatchEvent(renameEvent);
      console.log(`File berhasil di-rename dari ${oldPath} → ${newPath}`);
    } else if ('copy-path-file' === clicked.id) {
      icodex.plugin?.clipboard?.copy(node.path);
    } else if ('delete-this-file' === clicked.id) {
      const type = node.type;
      const name = node.name;
      if (!window.confirm(`Yakin ingin menghapus ${type} "${name}"?`)) return;
      const rootProject = self.findRootProject(self.data, node);
      if (!rootProject)
        return void console.error('Root project tidak ditemukan.');
      const parentNode = self.findParentNode(rootProject, node);
      if (!parentNode || !Array.isArray(parentNode.children)) {
        return void console.error(
          'Parent node tidak ditemukan atau tidak valid.',
        );
      }
      const index = parentNode.children.findIndex(child => child === node);
      if (-1 !== index) {
        parentNode.children.splice(index, 1);
        self.refreshAndSave(rootProject);
        console.log(`${type} "${name}" berhasil dihapus.`);
        const event = new CustomEvent('file-removed', {
          detail: {
            path: node.path,
          },
        });
        document.dispatchEvent(event);
      } else {
        console.error(`${type} "${name}" tidak ditemukan di parent.`);
      }
    }
  });
};

TreeView.prototype.findParentNode = function findParentNode(
  currentNode,
  targetNode,
) {
  if (!currentNode || !currentNode.children) return null;
  for (const child of currentNode.children) {
    if (child === targetNode) return currentNode;
    if ('directory' === child.type) {
      const found = this.findParentNode(child, targetNode);
      if (found) return found;
    }
  }
  return null;
};


TreeView.prototype.getOpenFolderPaths = function getOpenFolderPaths() {
  const openFolders = [],
    nodes = document.querySelectorAll('.folder-item.open');
  for (const node of nodes) {
    const path = this.getFullPath(node);
    // 
    path && openFolders.push(path);
  }
  return openFolders;
};


TreeView.prototype.getFullPath = function getFullPath(el) {
  const path = [];

  let current = el;
  while (current && !current.classList.contains("treeView")) {
    if (current.classList.contains("directory")) {
      // Ambil SPAN .folder-name DI DALAM .directory
      const nameEl = current.querySelector(".folder-name");
      if (nameEl) path.unshift(nameEl.textContent.trim());
      console.log(path)
    }
    current = current.parentElement;
  }
  return path.join("/");
}

TreeView.prototype.reopenFolders = function reopenFolders(paths) {
  document.querySelectorAll('.directory').forEach(dir => {
    const nameEl = dir.querySelector('.folder-item'),
      contentEl = dir.querySelector('.directory-content');
    if (!nameEl || !contentEl) return;
    console.log();
    const fullPath = this.getFullPath(nameEl);
    if (paths.includes(fullPath)) {
      nameEl.classList.add('open')
      contentEl.classList.add('open');
    }
  });
};


TreeView.prototype._replaceTree = function _replaceTree(newTreeElement) {
  const oldTree = document.querySelector('.treeView');
    

  oldTree &&
    oldTree.parentNode &&
    oldTree.parentNode.replaceChild(newTreeElement, oldTree);
};

TreeView.prototype.handleAddItem = async function handleAddItem(
  type,
  name,
  node,
  content = '',
) {
  if (!name.trim()) return;

  const pathParts = name.trim().split('/').filter(Boolean);
  const isNested = pathParts.length > 1;

  if (type === 'directory' && isNested) {
    return void (await this.createNestedDirectory(name.trim(), node));
  }

  if (type === 'file' && isNested) {
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');

    if (!fileName.trim()) return void console.warn('Nama file tidak valid.');

    const parentFolder = await this.createNestedDirectory(folderPath, node);
    return void (await this.handleAddItem(
      'file',
      fileName,
      parentFolder,
      content,
    ));
  }

  const rootProject = this.findRootProject(this.data, node);
  const fullPath = `${node.path || '/'}/${name.trim()}`.replace(/\/+/g, '/');

  console.log(
    `[TreeView] ${
      type === 'directory' ? 'Folder' : 'File'
    } dibuat dengan path: ${fullPath}`,
  );

  const item = {
    type: type,
    name: name.trim(),
    path: fullPath,
  };

  if (type === 'directory') {
    item.children = [];
  } else {
    const uint8 =
      typeof content === 'string' ? new TextEncoder().encode(content) : content;
    if (typeof FileContentStorage === 'function') {
      await FileContentStorage.saveContent(fullPath, uint8);
    } else {
      console.warn('class FileContentStorage tidak di definisikan');
    }
  }

  node.children = node.children || [];

  const isDuplicate = node.children.some(
    child => child.name === item.name && child.type === item.type,
  );

  if (isDuplicate) {
    console.warn(
      `${type === 'directory' ? 'Folder' : 'File'} "${item.name}" sudah ada.`,
    );
  } else {
    node.children.push(item);
    this.sortNodeChildren(node);

    if (rootProject) {
      await updateProject(rootProject);
      this.refreshTree();
    } else {
      console.error('Root project tidak ditemukan!');
    }
  }
};

TreeView.prototype.refreshTree = function refreshTree() {
  const openPaths = this.getOpenFolderPaths();

  const refreshedTree = this.renderTree();
  
  this._replaceTree(refreshedTree);
  this.reopenFolders(openPaths);
};
TreeView.prototype.refreshAndSave = function refreshAndSave(rootProject) {
  const openPaths = this.getOpenFolderPaths();
  const refreshedTree = this.renderTree();

  this._replaceTree(refreshedTree);
  this.reopenFolders(openPaths);

  if (rootProject) updateProject(rootProject);
};
TreeView.prototype._findPathInProjectTree = function _findPathInProjectTree(
  root,
  targetNode,
  currentPath = [],
) {
  if (root === targetNode)
    return currentPath.length ? [...currentPath, root.name].join('/') : '/';
  if (!root.children) return null;
  for (const child of root.children) {
    const result = this._findPathInProjectTree(child, targetNode, [
      ...currentPath,
      root.name,
    ]);
    if (result) return result;
  }
  return null;
};

TreeView.prototype.findRootProject = function findRootProject(
  projectList,
  targetNode,
) {
  for (const project of projectList) {
    if (this.containsNode(project, targetNode)) return project;
  }
  return null;
};

TreeView.prototype.containsNode = function containsNode(current, target) {
  return (
    current === target ||
    (!!current.children &&
      current.children.some(child => this.containsNode(child, target)))
  );
};

TreeView.prototype.createNestedDirectory = async function createNestedDirectory(
  path,
  rootNode,
) {
  const parts = path.split('/').filter(Boolean);
  let current = rootNode;
  for (const part of parts) {
    current.children || (current.children = []);
    let existing = current.children.find(
      child => child.name === part && 'directory' === child.type,
    );
    if (!existing) {
      const fullPath = `${current.path || '/'}/${part}`.replace(/\/+/g, '/');
      (existing = {
        type: 'directory',
        name: part,
        path: fullPath,
        children: [],
      }),
        current.children.push(existing),
        this.sortNodeChildren(current),
        console.log(`[TreeView] Folder bertingkat dibuat: ${fullPath}`);
    }
    current = existing;
  }
   // Simpan ke DB setelah semua folder dibuat
  const rootProject = this.findRootProject(this.data, rootNode);
  if (rootProject) {
    await updateProject(rootProject);
    this.refreshTree();
  }

  return current;
};

TreeView.prototype.sortNodeChildren = function sortNodeChildren(node) {
  node.children &&
    node.children.sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : 'directory' === a.type
        ? -1
        : 1,
    );
};

TreeView.prototype.addItemFromOutside = function addItemFromOutside(
  type,
  name,
  node,
  content = '',
) {
  return this.handleAddItem(type, name, node, content);
};

TreeView.prototype.instanceMethodCount = function instanceMethodCount() {
  return Object.getOwnPropertyNames(TreeView.prototype).filter(
    key => typeof this[key] === 'function' && key !== 'constructor',
  ).length;
};




    window.addEventListener("data-project", (e) => {
    
    }) 
 
 




  

document.body.appendChild(dialogWrapper);
window.dialogContainer = dialogWrapper

