(function() {
  'use strict';
  
  // db.js
  
  // Nama database dan store utama untuk proyek
  const DB_NAME = 'Editor_code5';
  const PROJECT_STORE_NAME = 'projects';
  const DB_VERSION = 20;
  const TREE_STORE_NAME = 'Tree';
  /**
   * Membuka koneksi ke IndexedDB.
   * Menangani pembuatan object store dan indeks saat pertama kali atau upgrade.
   * @returns {Promise<IDBDatabase>} Promise yang resolve dengan objek database.
   */
  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = function(event) {
        const db = event.target.result;
        
        // Membuat object store 'projects' jika belum ada
        if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
          db.createObjectStore(PROJECT_STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          
          if (!db.objectStoreNames.contains('fileContents')) {
         db.createObjectStore('fileContents', { keyPath: 'path', });
  console.log(`IndexedDB: Object store 'fileContents' dibuat.`);
}

          // Contoh indeks: Jika ingin mencari proyek berdasarkan nama, tambahkan indeks.
          // projectStore.createIndex('by_name', 'name', { unique: false });
          console.log(`IndexedDB: Object store '${PROJECT_STORE_NAME}' dibuat atau di-upgrade.`);
        }
        
        if (!db.objectStoreNames.contains(TREE_STORE_NAME)) {
          db.createObjectStore(TREE_STORE_NAME, {
            keyPath: ['projectId', 'path']
          });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  
  
  /**
   * Mengambil semua proyek dari IndexedDB.
   * @returns {Promise<Array<Object>>} Promise yang resolve dengan array objek proyek.
   */
  async function getAllProjects() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_STORE_NAME, 'readonly');
      const store = tx.objectStore(PROJECT_STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Menambahkan proyek baru ke IndexedDB.
   * @param {Object} project - Objek proyek yang akan ditambahkan.
   * @returns {Promise<number>} Promise yang resolve dengan ID proyek yang baru dibuat.
   */
  async function addProject(project) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PROJECT_STORE_NAME);
      const request = store.add(project);
      console.log(project);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => console.log('IndexedDB: Transaksi addProject selesai.');
      tx.onerror = () => reject(tx.error);
    });
  }
  
  /**
   * Memperbarui proyek yang sudah ada di IndexedDB.
   * @param {Object} project - Objek proyek dengan ID yang sudah ada dan data terbaru.
   * @returns {Promise<void>} Promise yang resolve ketika proyek berhasil diperbarui.
   */
  async function updateProject(project) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PROJECT_STORE_NAME);
      const request = store.put(project); // Menggunakan put untuk update atau add jika id belum ada
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => console.log('IndexedDB: Transaksi updateProject selesai.');
      tx.onerror = () => reject(tx.error);
    });
  }
 class FileContentStorage {
  // Simpan konten file
  static async saveContent(path, contentUint8Array) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fileContents', 'readwrite');
      const store = tx.objectStore('fileContents');
      const request = store.put({ path, content: contentUint8Array });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Ambil konten file
  static async getContent(path) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fileContents', 'readonly');
      const store = tx.objectStore('fileContents');
      const request = store.get(path);

      request.onsuccess = () => {
        resolve(request.result?.content || new Uint8Array());
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Hapus konten file
  static async deleteContent(path) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fileContents', 'readwrite');
      const store = tx.objectStore('fileContents');
      const request = store.delete(path);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
 
  
  
  class Button {
    constructor(className = 'btn', icon = '') {
      this.button = document.createElement('button');
      this.button.className = className;
      this.button.innerHTML = icon;
    }
    
    setOnclickListener(callBack) {
      // Perbaikan: gunakan addEventListener
      this.button.addEventListener('click', callBack);
    }
  }
  
  function DropdownPosition(target, handle, show = false) {
    if (show === true || show === 1) {
      const dotRect = handle.getBoundingClientRect();
      const handleY = dotRect.y;
      target.style.top = handleY + 'px';
      console.log(handleY + 'px');
    }
  }
  
  class ixScrollManager {
    constructor(target, mode = 'both') {
      this.target = target;
      this.mode = mode;
      this.handlers = {
        wheel: this._blockEvent.bind(this),
        touchmove: this._blockEvent.bind(this),
      };
    }
    
    _blockEvent(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    lock() {
      if (!this.target) return;
      
      if (this.mode === 'both' || this.mode === 'desktop') {
        this.target.addEventListener('wheel', this.handlers.wheel, {
          passive: false,
        });
      }
      
      if (this.mode === 'both' || this.mode === 'mobile') {
        this.target.addEventListener('touchmove', this.handlers.touchmove, {
          passive: false,
        });
      }
    }
    
    unlock() {
      if (!this.target) return;
      
      this.target.removeEventListener('wheel', this.handlers.wheel);
      this.target.removeEventListener('touchmove', this.handlers.touchmove);
    }
  }
  
  class Dropdown extends EventTarget {
    dropdown = document.createElement('div');
    #onoptionclick = null; // Private field untuk callback tunggal
    
    constructor(
      group = [{
        label: 'group1',
        option: [{
          value: 'Berkas Baru',
          icon: 'bi bi-file-earmark-plus',
          id: 'new-file',
        },
        {
          value: 'Folder Baru',
          icon: 'bi bi-folder-plus',
          id: 'new-folder',
        }, ],
      }, ],
    ) {
      super(); // panggil constructor EventTarget
      
      //array object utuk dropdown
      
      this._group = group;
    }
    
    fragmentRender(render = false) {
      var fragment = document.createDocumentFragment();
      document.createElement('div');
      this.dropdown.className = 'dropdown';
      // Set class di sini
      
      this._group.forEach((group) => {
        var ul = document.createElement('ul');
        // Buat ID unik menggunakan crypto, base36
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const uniqueId = `icoddex_${randomArray[0].toString(36).slice(0, 10)}`;
        
        ul.id = uniqueId;
        
        group.option.forEach((opt) => {
          var li = document.createElement('li');
          
          var opt_icon = document.createElement('span');
          opt_icon.className = opt.icon;
          
          var opt_title = document.createElement('span');
          opt_title.textContent = opt.value;
          
          li.append(opt_icon, opt_title);
          
          li.addEventListener('click', (e) => {
            // Panggil callback onoptionclick jika diatur
            if (typeof this.#onoptionclick === 'function') {
              this.#onoptionclick(e, opt);
            }
            
            // Dispatch event custom 'optclick'
            const customEvent = new CustomEvent('optclick', {
              detail: {
                option: opt,
                eventOri: e, // Perbaikan: gunakan 'e' sebagai event asli
                group: this.group,
              },
              bubbles: true, // Saran: bisa diset true agar event menggelembung
              cancelable: true,
            });
            
            this.dispatchEvent(customEvent);
          });
          
          ul.appendChild(li);
        });
        fragment.appendChild(ul);
      });
      return fragment;
    }
    
    set onoptionclick(callback) {
      if (typeof callback === 'function') {
        this.#onoptionclick = callback;
      } else {
        this.#onoptionclick = null;
      }
    }
    
    get onoptionclick() {
      return this.#onoptionclick;
    }
    
    // ...
  }
  
  class CustomDropdown extends Dropdown {
    constructor(container, handle) {
      super(); // panggil constructor Dropdown
      this.handle = handle; // elemen DOM yang mengaktifkan dropdown (misalnya tombol dot)
      this.container = container; // elemen backdrop sebagai penampung dropdown
      this.dropDown = document.createElement('div');
      this.dropDown.className = 'dropdown';
      this.borderOverlay = document.createElement('div');
      this.borderOverlay.className = 'ix-drop-border';
      this.scrollManager = new ixScrollManager(this.dropDown, 'mobile');
    }
    
    // Fungsi private render internal
    #render(render = false) {
      if (render === true || render === 1) {
        this.container.innerHTML = '';
        this.dropDown.innerHTML = '';
        this.dropDown.appendChild(super.fragmentRender(true)); // render isi dropdown
        DropdownPosition(this.container, this.handle, true); // atur posisi
        this.container.appendChild(this.dropDown);
      } else {
        DropdownPosition(this.container, this.handle, false);
        this.container.innerHTML = '';
      }
    }
    
    open(state = false) {
      if (state) {
        if (!this.dropDown.isConnected && this.container) {
          this.#render(true);
        }
        this.#ixPlaceDropdown();
        this.scrollManager.lock();
        this.container.classList.add('open');
      } else {
        this.scrollManager.lock();
        this.container.classList.remove('open');
        this.#render(false);
      }
      return this;
    }
    
    #ixPlaceDropdown() {
      const rect = this.dropDown.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const enoughSpaceBelow = rect.y < windowHeight - rect.height;
      
      if (enoughSpaceBelow) {
        this.dropdown.style.top = rect.top + 'px';
      
      } else {
        this.dropDown.style.top = `-${rect.height}px`;
      
      }
    }
  }
  
  /*
  this.container.innerHTML = "";
  var dropdown = document.createElement('div')
  dropdown.className = "dropdown";
  dropdown.appendChild(super.fragmentRender())
  this.container.appendChild(dropdown)
  this.container.classList.add('open')
  console.log(JSON.stringify(this.container.parentNode.outerHTML, null, 2))

  console.info(this.dropDown.isConnected)
  }
  else {
    this.container.innerHTML = ''
    console.log(JSON.stringify(this.container.parentNode.outerHTML, null, 2))
    
    this.container.classList.remove('open')
    
    */
  
  function detectMimeFromName(name) {
    const ext = name.split('.').pop().toLowerCase();
    return ({
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      txt: 'text/plain',
      md: 'text/markdown',
      svg: 'image/svg+xml',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
    } [ext] || 'application/octet-stream'); // default jika tidak dikenali
  }
  
  /**
   * Menampilkan isi file ke iframe editor berbasis Ace.
   * Juga menyimpan path file aktif ke window.currentOpenTabPath.
   * @param {Object} param0
   */
  function renderFileContent({
    name,
    type,
    content,
    path
  }) {
    const mime = detectMimeFromName(name);
    const editorIframe = document.getElementById('editor');
    if (!editorIframe) return;
    
    window.currentOpenTabPath = path; // Simpan path aktif
    
    const blob = new Blob([content], {
      type: mime
    });
    const url = URL.createObjectURL(blob);
    
    if (mime.startsWith('text/') || mime.includes('javascript') || mime.includes('json') || mime.includes('svg+xml')) {
      const decoded =
        content instanceof Uint8Array || content instanceof ArrayBuffer ?
        new TextDecoder().decode(content) :
        String(content || '');
      
      editorIframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%; /* Tambahkan width:100% untuk body juga */
            overflow: hidden; /* Penting untuk mencegah scrollbar ganda */
          }
          #ace-editor {
            position: absolute; /* Ganti fixed menjadi absolute */
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            
      font-size:12px;
      line-height: 1.7!important;
  
            /* width:100vw; height:100%; dihapus karena top/bottom/left/right sudah menangani */
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/ace.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/ext-language_tools.js"></script>

      </head>
      <body>
        <div id="ace-editor"></div>
        <script>
          const editor = ace.edit("ace-editor");
          editor.setTheme("ace/theme/github_dark");
          editor.session.setValue(${JSON.stringify(decoded)});
          const modeMap = {
            ".html": "ace/mode/html",
            ".css": "ace/mode/css",
            ".js": "ace/mode/javascript",
            ".json": "ace/mode/json",
            ".svg": "ace/mode/xml"
          };
          const ext = ${JSON.stringify(name)}.slice(${JSON.stringify(name)}.lastIndexOf('.'));
          editor.session.setMode(modeMap[ext] || "ace/mode/text");

          // ---- BAGIAN PENTING YANG DIMODIFIKASI ----
          // Gunakan salah satu, bukan keduanya.
          // Untuk ruang kosong yang cukup terlihat, saya sarankan 0.5 atau 0.75
          editor.setOption("scrollPastEnd", 0.75); // Mengatur ruang kosong 75% dari tinggi editor
          // atau jika Anda ingin scroll sampai akhir halaman (satu layar penuh)
          // editor.setScrollPastEnd(true);
          // ------------------------------------------
editor.setOptions({
 "wrap" : true,
  enableBasicAutocompletion: true, // Mengaktifkan basis saran (kata dari dokumen, dll.)
  enableLiveAutocompletion: true, // Membuat saran muncul otomatis saat mengetik
  enableSnippets: true // Mengaktifkan fitur snippets
});
          // Pastikan editor fokus (opsional, tapi bagus untuk UX)
          editor.focus();

          // ---- Tambahan: Kode untuk fokus ke kursor setelah Enter ----
          function focusCursorInAceEditor() {
              editor.renderer.scrollSelectionIntoView(true, true, 0.5);
              editor.focus();
          }

          editor.container.addEventListener("keydown", function(e) {
              if (e.keyCode === 13) { // keyCode 13 adalah Enter
                  setTimeout(focusCursorInAceEditor, 50); // Memberi sedikit waktu Ace untuk memperbarui
              }
          });
          // -------------------------------------------------------------

        </script>
      </body>
      </html>
    `;
    } else if (mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/')) {
      const tag = mime.startsWith('image/') ?
        `<img src="${url}" alt="${name}">` :
        mime.startsWith('audio/') ?
        `<audio src="${url}" controls></audio>` :
        `<video src="${url}" controls></video>`;
      
      editorIframe.srcdoc = `
      <!DOCTYPE html>
      <html><head><style>
        html, body { margin:0; padding:0; height:100dvh; display:flex; justify-content:center; align-items:center; background:#0D161F; color:#A3AEAB; }
        video, img { max-width:300px; height:auto; aspect-ratio: auto; }
      </style></head><body>${tag}</body></html>
    `;
    } else {
      editorIframe.src = url;
    }
  }
  
  // Menyimpan path tab yang sedang aktif
  window.currentOpenTabPath = null;
  let openTabs = []; // Cache semua tab yang terbuka
  
  // Buat elemen <nav> untuk daftar tab
  const nav = document.createElement('nav');
  nav.className = 'nav-scroller';
  document.body.appendChild(nav);
  
  // Konstanta database
  const TAB_DB_NAME = 'tabFiles1';
  const TAB_STORE_NAME = 'openTabs';
  
  /**
   * Membuka database IndexedDB
   */
  function openTabDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(TAB_DB_NAME, 2);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(TAB_STORE_NAME)) {
          db.createObjectStore(TAB_STORE_NAME, {
            keyPath: 'path'
          });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Simpan tab ke IndexedDB
   */
  async function saveTabToDb(tab) {
    const db = await openTabDb();
    const tx = db.transaction(TAB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(TAB_STORE_NAME);
    store.put(tab);
    return tx.complete;
  }
  
  /**
   * Hapus tab dari IndexedDB berdasarkan path
   */
  async function deleteTabs(path) {
    const db = await openTabDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TAB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(TAB_STORE_NAME);
      const request = store.delete(path);
      request.onsuccess = () => {
        
        console.log('Tab dihapus dari DB:', path);
        openTabs = openTabs.filter((tab) => tab.path !== path); // Hapus dari cache
        
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Ambil semua tab dari IndexedDB
   */
  async function getAllTabsFromDb() {
    const db = await openTabDb();
    const tx = db.transaction(TAB_STORE_NAME, 'readonly');
    const store = tx.objectStore(TAB_STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Cek apakah tab sudah ditampilkan
   */
  function tabExists(path) {
    return !!document.querySelector(`.nav-link-button[data-path="${path}"] `);
  }
  
  /**
   * Hapus tab dari DOM
   */
  function removeTabFromDom(path) {
    const tabEl = document.querySelector(`.nav-link-button[data-path="${path}"]`);
    if (tabEl) {
      tabEl.remove();
      console.log('Tab dihapus dari DOM:', path);
    }
  }
  
  /**
   * Tambahkan tab baru ke DOM dan IndexedDB
   */
  async function addTabFile(path, name, content = '') {
    if (tabExists(path)) return;
    
    const ext = name.split('.').pop();
    const nav = document.querySelector('.nav-scroller');
    
    const span = document.createElement('span');
    span.className = 'nav-link-button n';
    span.setAttribute('draggable', 'true');
    span.setAttribute('role', 'button');
    span.setAttribute('data-file-type', ext);
    span.setAttribute('data-path', path);
    span.textContent = name;
    
    // Tombol X untuk tutup tab
    const spanDel = document.createElement('span');
    spanDel.role = 'button';
    spanDel.className = 'toggle-delete';
    spanDel.tabIndex = 0;
    
    const spanDelIc = document.createElement('i');
    spanDelIc.className = 'bi bi-x-lg';
    spanDel.appendChild(spanDelIc);
    
    // Event klik hapus tab
    spanDelIc.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Tutup tab "${name}" ? `)) return;
      
      await deleteTabs(path);
      removeTabFromDom(path);
      
      const editorIframe = document.getElementById('editor');
      const isThisTabActive = span.getAttribute('data-active') === 'true';
      
      if (isThisTabActive && editorIframe) {
        editorIframe.srcdoc = '';
      }
      document.dispatchEvent(new CustomEvent('tab-closed', {
        detail: {
          path
        }
      }));
    };
    
    // Event klik utama tab
    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      document.querySelectorAll('.nav-scroller span[data-path]').forEach((el) => el.removeAttribute('data-active'));
      span.setAttribute('data-active', 'true');
      
      renderFileContent({
        name,
        content,
        path
      });
      
      document.dispatchEvent(
        new CustomEvent('tab-opened', {
          detail: {
            path,
            name,
            content
          },
        }),
      );
    });
    
    // Trigger awal content-updated
    document.dispatchEvent(
      new CustomEvent('content-updated', {
        detail: {
          path,
          name
        },
      }),
    );
    
    span.appendChild(spanDel);
    
    // Drag start
    span.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', path);
      window.IcodexEditor.plugins.vibrate(25);
      span.classList.add('dragging');
    });
    
    // Drag end
    span.addEventListener('dragend', async () => {
      span.classList.remove('dragging');
      await saveTabOrder();
    });
    
    nav.appendChild(span);
    
    // Simpan ke IndexedDB
    await saveTabToDb({
      path,
      name,
      content
    });
    openTabs.push({
      path,
      name,
      content
    }); // Tambahkan ke cache
  }
  
  /**
   * Load ulang semua tab dari IndexedDB
   */
  async function loadOpenTabs() {
    const tabs = await getAllTabsFromDb();
    for (const tab of tabs) {
      await addTabFile(tab.path, tab.name, tab.content);
    }
  }
  
  /**
   * Event: file dihapus dari TreeView
   */
  document.addEventListener('file-removed', async (e) => {
    const path = e.detail.path;
    
    await deleteTabs(path);
    removeTabFromDom(path);
    
    const isTabActive = window.currentOpenTabPath === path;
    const editorIframe = document.getElementById('editor');
    if (isTabActive && editorIframe) {
      editorIframe.srcdoc = '';
      window.currentOpenTabPath = null;
    }
  });
  
  /*document.addEventListener("file-renamed", async (e) => {
    const { oldPath, newPath, newName } = e.detail;
    
    const tabEl = document.querySelector(`.nav -link-button[data-path = "${oldPath}"]`);
    if (tabEl) {
      tabEl.dataset.path = newPath;
      tabEl.dataset.fileType = newName.split('.').pop();
      
      const deleteBtn = tabEl.querySelector(".toggle-delete");
      if (deleteBtn) tabEl.removeChild(deleteBtn);
      tabEl.textContent = newName;
      if (deleteBtn) tabEl.appendChild(deleteBtn);
    }
    
    const db = await openTabDb();
    const tx = db.transaction(TAB_STORE_NAME, "readwrite");
    const store = tx.objectStore(TAB_STORE_NAME);
    const existing = await store.get(oldPath);
    if (existing) {
      store.delete(oldPath);
      store.put({ ...existing, path: newPath, name: newName });
    }
    
    if (window.currentOpenTabPath === oldPath) {
      window.currentOpenTabPath = newPath;
    }
  });
  */
  document.addEventListener('file-renamed', async (e) => {
    const {
      oldPath,
      newPath,
      newName
    } = e.detail;
    
    const tabEl = document.querySelector(`.nav-link-button[data-path="${oldPath}"]`);
    if (tabEl) {
      tabEl.dataset.path = newPath;
      tabEl.dataset.fileType = newName.split('.').pop();
      
      const deleteBtn = tabEl.querySelector('.toggle-delete');
      if (deleteBtn) tabEl.removeChild(deleteBtn);
      tabEl.textContent = newName;
      if (deleteBtn) tabEl.appendChild(deleteBtn);
    }
    
    const db = await openTabDb();
    const tx = db.transaction(TAB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(TAB_STORE_NAME);
    const getReq = store.get(oldPath);
    
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing) {
        store.delete(oldPath);
        store.put({
          ...existing,
          path: newPath,
          name: newName
        });
      }
    };
    
    if (window.currentOpenTabPath === oldPath) {
      window.currentOpenTabPath = newPath;
    }
  });
  
  document.addEventListener('folder-renamed', async (e) => {
    const {
      oldPath,
      newPath
    } = e.detail;
    
    const db = await openTabDb();
    const tx = db.transaction(TAB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(TAB_STORE_NAME);
    const request = store.openCursor();
    
    request.onsuccess = async (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const tab = cursor.value;
        if (tab.path.startsWith(oldPath + '/')) {
          const updatedPath = tab.path.replace(oldPath, newPath);
          const updatedTab = {
            ...tab,
            path: updatedPath
          };
          
          await cursor.update(updatedTab);
        }
        cursor.continue();
      } else {
        // Update cache
        openTabs = openTabs.map((tab) => {
          if (tab.path.startsWith(oldPath + '/')) {
            return {
              ...tab,
              path: tab.path.replace(oldPath, newPath)
            };
          }
          return tab;
        });
        renderTabs();
      }
    };
  });
  
  document.addEventListener('folder-removed', async (e) => {
    const removedPath = e.detail.removedPath;
    
    const tabsToRemove = openTabs.filter((tab) => tab.path.startsWith(removedPath + '/'));
    
    for (const tab of tabsToRemove) {
      // Hapus dari IndexedDB
      await deleteTabs(tab.path);
      
      // Hapus dari DOM
      removeTabFromDom(tab.path);
      
      // Hapus dari cache
      openTabs = openTabs.filter((t) => t.path !== tab.path);
      
      // Kosongkan editor jika tab aktif dihapus
      if (window.currentOpenTabPath === tab.path) {
        const editorIframe = document.getElementById('editor');
        if (editorIframe) editorIframe.srcdoc = '';
        window.currentOpenTabPath = null;
      }
      
      // Dispatch tab-closed jika perlu
      document.dispatchEvent(
        new CustomEvent('tab-closed', {
          detail: {
            path: tab.path
          },
        }),
      );
    }
  });
  /**
   * Sinkronisasi tab dari data project terbaru (rename, path, dst)
   */
  document.addEventListener('project-updated', async (e) => {
    const updatedProject = e.detail;
    const allTabs = await getAllTabsFromDb();
    
    for (const tab of allTabs) {
      const {
        path: oldPath,
        name: oldName,
        content
      } = tab;
      const updated = findUpdatedPathInProject(updatedProject, oldPath);
      
      if (!updated) {
        removeTabFromDom(oldPath);
        await deleteTabs(oldPath);
        continue;
      }
      
      if (updated.path !== oldPath || updated.name !== oldName) {
        removeTabFromDom(oldPath);
        await deleteTabs(oldPath);
        await addTabFile(updated.path, updated.name, content);
        
        if (window.currentOpenTabPath === oldPath) {
          window.currentOpenTabPath = updated.path;
        }
      }
    }
  });
  
  /**
   * Cari perubahan path di dalam struktur project
   */
  function findUpdatedPathInProject(project, oldPath) {
    let result = null;
    
    function traverse(node, currentPath = '') {
      const fullPath = currentPath ?
        `${currentPath}
    /${node.name}` :
        node.name;
      if (node.type === 'file' && fullPath === oldPath) {
        result = {
          path: fullPath,
          name: node.name
        };
        return;
      }
      if (node.type === 'directory' && node.children) {
        for (const child of node.children) {
          traverse(child, fullPath);
          if (result) return;
        }
      }
    }
    
    traverse(project);
    return result;
  }
  
  // Drag & drop penyusunan ulang tab
  const navScroller = document.querySelector('.nav-scroller');
  
  navScroller.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = document.querySelector('.nav-link-button.dragging');
    const afterElement = getDragAfterElement(navScroller, e.clientX);
    if (afterElement == null) {
      navScroller.appendChild(dragging);
    } else {
      navScroller.insertBefore(dragging, afterElement);
    }
  });
  
  function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.nav-link-button:not(.dragging)')];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
          return {
            offset: offset,
            element: child
          };
        } else {
          return closest;
        }
      }, {
        offset: Number.NEGATIVE_INFINITY
      },
    ).element;
  }
  
  /**
   * Simpan ulang urutan tab ke IndexedDB
   */
  async function saveTabOrder() {
    const tabs = [...document.querySelectorAll('.nav-link-button')];
    const orderedTabs = [];
    const dbTabs = await getAllTabsFromDb();
    
    for (const tab of tabs) {
      const path = tab.dataset.path;
      const match = dbTabs.find((t) => t.path === path);
      if (match) orderedTabs.push(match);
    }
    
    const db = await openTabDb();
    const tx = db.transaction(TAB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(TAB_STORE_NAME);
    await Promise.all(orderedTabs.map((tab) => store.put(tab)));
  }
  
  document.addEventListener('folder-renamed', async (e) => {
    const {
      oldPath,
      newPath
    } = e.detail;
    
    for (let tab of openTabs) {
      if (tab.path.startsWith(oldPath + '/')) {
        // Simpan path lama untuk dihapus dari IndexedDB
        const oldTabPath = tab.path;
        
        // Update path baru di cache
        tab.path = tab.path.replace(oldPath, newPath);
        
        // Hapus path lama dari IndexedDB
        await deleteTabs(oldTabPath);
        
        // Simpan tab dengan path baru ke IndexedDB
        await saveTabToDb(tab);
      }
    }
    
    renderTabs(); // Refresh tampilan tab
  });
  
  // ... fungsi-fungsi lain di atas
  
  /**
   * Render ulang semua tab dari cache global openTabs
   */
  function renderTabs() {
    const nav = document.querySelector('.nav-scroller');
    nav.innerHTML = ''; // Hapus semua tab di DOM
    
    for (const tab of openTabs) {
      addTabFile(tab.path, tab.name, tab.content); // Tambahkan kembali dari cache
    }
  }
  
  window.Icodex = {
    dialog_containers: document.createElement('div'),
  };
  
  
  // --- Kode Manajemen Tab ---
  
  //const dialog_containers = document.querySelector('#dialog');
  const DROPDOWN_CONTAINERS = document.createElement('div');
  DROPDOWN_CONTAINERS.className = 'dropdown-container';
  
  document.body.insertAdjacentElement('afterbegin', DROPDOWN_CONTAINERS);
  
  class TreeView {
    static currentOpenDropdown = null; // <- Tambahkan ini
    
    
    #mainParentTree;
    #loadingContainer;
    constructor(data) {
      this.data = data;
    }
    
    getNodeByPath(path) {
      const parts = path.split('/').filter(Boolean);
      let currentNodes = this.data;
      let currentNode = null;
      
      for (const part of parts) {
        currentNode = currentNodes.find((n) => n.name === part);
        if (!currentNode) return null;
        currentNodes = currentNode.children || [];
      }
      
      return currentNode;
    }
    
    renderTree() {
      this.#mainParentTree = document.createElement('div');
      this.#mainParentTree.className = 'tree-view';
      this.#loadingContainer = document.createElement('div');
      
      this.#mainParentTree.insertAdjacentElement('afterbegin', this.#loadingContainer);
      const data = this.data;
      data.forEach((item) => {
        const el = this.#createNode(item);
        
        if (el) this.#mainParentTree.appendChild(el);
      });
      return this.#mainParentTree;
    }
    
    // Membuat node DOM dari objek node (bisa directory atau file)
    // Parameter 'node' berasal dari data tree yang merepresentasikan file system
    // Mengembalikan elemen DOM yang sesuai untuk node tersebut
    #createNode(node) {
      if (!node) return null;
      if (node.type === 'directory') {
        // Jika jenis node adalah directory, buat elemen directory
        return this.#createDirectoryNode(node);
      } else if (node.type === 'file') {
        // Jika jenis node adalah file, buat elemen file
        return this.#createFileNode(node);
      }
      return null;
    }
    
    // Membuat elemen DOM untuk directory beserta isi dan dropdown-nya
    // Parameter 'node' adalah objek directory dengan properti children (array isi folder)
    // Menghasilkan elemen DOM yang mewakili folder beserta subfolder dan file di dalamnya
    #createDirectoryNode(node) {
      // Elemen pembungkus utama untuk direktori (folder)
      const directory = document.createElement('div');
      directory.className = 'directory';
      
      // Elemen nama direktori (folder) yang dapat diklik
      const dirName = document.createElement('span');
      dirName.className = 'directory-name';
      dirName.setAttribute('data-kind-type', 'directory');
      dirName.tabIndex = 0;
      dirName.textContent = node.name; // nama folder dari object node
      
      // Inisialisasi dropdown khusus (CustomDropdown)
      // Param 1: DROPDOWN_CONTAINERS (wadah global dropdown)
      // Param 2: dirName (elemen yang akan jadi anchor posisi dropdown)
      const renderDropdown = new CustomDropdown(DROPDOWN_CONTAINERS, dirName);
      
      // Tambahkan opsi menu khusus untuk folder
      // Group 1 (melengkapi default): import file
      renderDropdown._group[0].option.push({
        value: 'Import Files',
        icon: 'bi bi-upload',
        id: 'import-files',
      });
      
      // Group 2: Operasi umum
      renderDropdown._group.push({
          label: 'group-2',
          option: [{
            value: 'Copy',
            icon: 'bi bi-copy',
            id: 'copy-folder'
          },
          {
            value: 'Cut',
            icon: 'bi bi-scissors',
            id: 'cut-folder'
          },
          {
            value: 'Rename',
            icon: 'bi bi-pencil',
            id: 'rename-folder'
          },
          {
            value: 'Copy Path',
            icon: 'bi bi-copy',
            id: 'copy-path-folder'
          }, ],
        },
        // Group 3: Export & Delete
        {
          label: 'group-3',
          option: [{
            value: 'Download',
            icon: 'bi bi-download',
            id: 'export-folder'
          },
          {
            value: 'Delete',
            icon: 'codicon codicon-trash',
            id: 'delete-this-folder',
          }, ],
        },
      );
      
      // Buat tombol titik tiga horizontal sebagai pemicu dropdown
      const dot = document.createElement('span');
      dot.className = 'dot-horizontal';
      dot.tabIndex = 0;
      dirName.appendChild(dot);
      
      // Kontainer untuk isi dari folder ini
      const content = document.createElement('div');
      content.className = 'directory-content';
      
      // Hubungkan event klik dropdown dengan logika input handler-nya
      this.#setupDirectoryDropdown(node, renderDropdown);
      
      // Toggle buka-tutup isi folder saat nama folder diklik
      dirName.addEventListener('click', () => {
        //dirName.classList.toggle('open');
        //content.classList.toggle('open');
        const isOpen = content.classList.contains('open');
        
        if (isOpen) {
          content.style.height = `${content.scrollHeight}px`;
          
          requestAnimationFrame(() => (content.style.height = `0px`));
          
          content.classList.remove('open');
          dirName.classList.remove('open');
        } else {
          content.style.height = `0px`;
          content.classList.add('open');
          dirName.classList.add('open');
          
          requestAnimationFrame(() => (content.style.height = `${content.scrollHeight}px`));
          
          // Setelah transisi selesai, set ke auto agar fleksibel
          content.addEventListener('transitionend', function setAutoHeight() {
            if (content.classList.contains('open')) {
              content.style.height = 'auto';
            }
            content.removeEventListener('transitionend', setAutoHeight);
          });
        }
        
        if (TreeView.currentOpenDropdown) {
          TreeView.currentOpenDropdown.open(false);
          TreeView.currentOpenDropdown = null;
        }
      });
      
      // Event: saat tombol titik tiga diklik (buka/tutup dropdown)
      dot.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        
        // Jika ada dropdown lain terbuka (baik dari file atau folder), tutup terlebih dahulu
        if (TreeView.currentOpenDropdown && TreeView.currentOpenDropdown !== renderDropdown) {
          TreeView.currentOpenDropdown.open(false);
        }
        
        // Tambahkan event global klik luar DOM untuk menutup dropdown
        
        const hideDropdown = () => {
          if (TreeView.currentOpenDropdown) {
            TreeView.currentOpenDropdown.open(false);
            TreeView.currentOpenDropdown = null;
          }
        };
        document.removeEventListener('click', hideDropdown);
        document.addEventListener('click', hideDropdown);
        
        // Toggle dropdown folder saat ini
        const isOpen = DROPDOWN_CONTAINERS.classList.toggle('open');
        renderDropdown.open(isOpen);
        
        // Simpan referensi dropdown aktif secara global
        
        TreeView.currentOpenDropdown = isOpen ? renderDropdown : null;
      });
      
      // Klik di DROPDOWN_CONTAINERS (area dropdown) tidak menutup folder secara langsung,
      // tapi dipakai sebagai tempat penutupan dropdown secara manual
      DROPDOWN_CONTAINERS.addEventListener('click', (e) => {
        e.stopPropagation();
        if (TreeView.currentOpenDropdown) {
          TreeView.currentOpenDropdown.open(false);
          TreeView.currentOpenDropdown = null;
        }
      });
      
      // Render semua anak node (rekursif)
      if (Array.isArray(node.children)) {
        node.children.forEach((child) => {
          const childNode = this.#createNode(child);
          if (childNode) content.appendChild(childNode);
        });
      }
      
      // Gabungkan semuanya dalam elemen directory
      directory.appendChild(dirName);
      directory.appendChild(content);
      
      // Return node DOM yang mewakili folder
      return directory;
    }
    
    // Setup dropdown menu untuk folder (directory)
    // Menghubungkan event dropdown dengan dialog input pembuatan file/folder baru
    // Parameter:
    // - node: objek folder saat ini (dipakai sebagai parent saat tambah file/folder baru)
    // - dropdownInstance: instance komponen Dropdown untuk folder
    // Dialog akan mengambil input nama file/folder baru dan memvalidasi inputnya
    // Setelah valid, akan memanggil this.#handleAddItem untuk menambah data
    #setupDirectoryDropdown(node, dropdownInstance) {
      let self = this;
      
      // Dialog input untuk file baru
      const newFileDialog = new CustomDialog({
          title: `New File`,
          placeholder: 'Enter File Name or Path',
        },
        window.Icodex.dialog_containers,
      );
      
      // Dialog input untuk folder baru
      const newSubFolderDialog = new CustomDialog({
          title: `New Folder`,
          placeholder: 'Enter Folder Name or Path',
        },
        window.Icodex.dialog_containers,
      );
      
      // dialog input ganti nama folder
      const renameFolder = new CustomDialog({
          title: 'Rename Folder',
          placeholder: 'Enter Folder Name or Path',
        },
        window.Icodex.dialog_containers,
      );
      
      // Pesan error
      const errorMessage = 'Path cannot be empty.';
      const tagErrorFile = this.#createErrorMessageElement(errorMessage);
      const tagErrorFolder = this.#createErrorMessageElement(errorMessage);
      const tagErrorRenameFolder = this.#createErrorMessageElement(errorMessage);
      // Elemen input
      const inputFileEl = newFileDialog.input.input;
      const inputFolderEl = newSubFolderDialog.input.input;
      const renameFolderInputEl = renameFolder.input.input;
      // Tambahkan elemen error ke DOM
      inputFileEl.parentNode.appendChild(tagErrorFile);
      inputFolderEl.parentNode.appendChild(tagErrorFolder);
      renameFolderInputEl.parentNode.appendChild(tagErrorRenameFolder);
      // Tampilkan ikon jenis file berdasarkan ekstensi
      const fileType = document.createElement('span');
      fileType.className = 'validation-icon-type';
      fileType.setAttribute('data-validation-type', 'unknown');
      inputFileEl.parentNode.appendChild(fileType);
      
      // Handler dropdown diklik
      dropdownInstance.addEventListener('optclick', (e) => {
        const clicked = e.detail.option;
        
        // ========== TAMBAH FILE ==========
        
        if (clicked.id === 'new-file') {
          newFileDialog.show(true);
          
          const validateFileName = (value) => {
            const trimmed = value.trim();
            
            // Tampilkan ikon ekstensi
            const ext = value.split('.').pop().toLowerCase();
            const typeMap = {
              // Web & Markup
              html: 'html',
              htm: 'htm',
              css: 'css',
              js: 'js',
              jsx: 'jsx',
              ts: 'ts',
              tsx: 'tsx',
              json: 'json',
              xml: 'xml',
              yml: 'yml',
              yaml: 'yaml',
              md: 'md',
              
              // Text & Config
              txt: 'txt',
              ini: 'ini',
              env: 'env',
              cfg: 'cfg',
              conf: 'conf',
              log: 'log',
              gitignore: 'gitignore',
              gitattributes: 'gitattributes',
              editorconfig: 'editorconfig',
              
              // Backend Languages
              py: 'py',
              rb: 'rb',
              php: 'php',
              java: 'java',
              c: 'c',
              h: 'h',
              cpp: 'cpp',
              hpp: 'hpp',
              cs: 'cs',
              go: 'go',
              rs: 'rs',
              swift: 'swift',
              sh: 'sh',
              bash: 'bash',
              zsh: 'zsh',
              pl: 'pl',
              lua: 'lua',
              
              // Data & Documents
              csv: 'csv',
              tsv: 'tsv',
              xls: 'xls',
              xlsx: 'xlsx',
              doc: 'doc',
              docx: 'docx',
              pdf: 'pdf',
              rtf: 'rtf',
              jar: 'jar',
              
              // Images & Media
              png: 'png',
              jpg: 'jpg',
              jpeg: 'jpeg',
              gif: 'gif',
              svg: 'svg',
              webp: 'webp',
              ico: 'ico',
              bmp: 'bmp',
              mp3: 'mp3',
              wav: 'wav',
              mp4: 'mp4',
              webm: 'webm',
              ogg: 'ogg',
              mov: 'mov',
              
              // Fonts
              ttf: 'ttf',
              otf: 'otf',
              woff: 'woff',
              woff2: 'woff2',
              
              // Archives
              zip: 'zip',
              rar: 'rar',
              tar: 'tar',
              gz: 'gz',
              tgz: 'tgz',
              '7z': '7z',
              
              // Misc
              sql: 'sql',
              db: 'db',
              lock: 'lock',
              bak: 'bak',
              map: 'map',
              license: 'license',
              
              // Framework/Tools Specific
              vue: 'vue',
              svelte: 'svelte',
              astro: 'astro',
              dockerfile: 'dockerfile',
              toml: 'toml',
              makefile: 'makefile',
              gradle: 'gradle',
              babelrc: 'babelrc',
              eslintrc: 'eslintrc',
            };
            
            fileType.setAttribute('data-validation-type', typeMap[ext] || 'unknown');
            
            // Cek kosong
            if (!trimmed) {
              tagErrorFile.textContent = 'Nama file tidak boleh kosong.';
              tagErrorFile.classList.add('show');
              inputFileEl.classList.add('form-error');
              tagErrorFile.id = '';
              return false;
            }
            
            // Validasi path file: huruf, angka, simbol folder `/`, titik `.`, dan _- spasi
            const fileRegex = /^[a-zA-Z0-9_\-./ ]+$/;
            if (!fileRegex.test(trimmed)) {
              tagErrorFile.textContent = 'Nama file tidak valid.';
              tagErrorFile.id = 'infalid';
              tagErrorFile.classList.add('show');
              // inputFileEl.classList.add('form-error');
              
              return false;
            }
            
            // Cek duplikat (pada direktori saat ini, bukan path)
            const fileNameOnly = trimmed.split('/').pop(); // ambil nama file saja
            const duplicate = (node.children || []).some((child) => child.type === 'file' && child.name === fileNameOnly);
            
            if (duplicate) {
              tagErrorFile.textContent = `Nama File ( ${trimmed} ) sudah ada.`;
              tagErrorFile.classList.add('show');
              inputFileEl.classList.add('form-error');
              tagErrorFile.id = '';
              return false;
            }
            
            // Valid
            tagErrorFile.id = '';
            tagErrorFile.classList.remove('show');
            inputFileEl.classList.remove('form-error');
            return true;
          };
          
          inputFileEl.addEventListener('input', () => {
            validateFileName(inputFileEl.value);
          });
          
          // TEKAN ENTER UNTUK MENUTUP DIALOG
          inputFileEl.addEventListener('keydown', () => {
            if (event.key === 'Enter' || event.key === 13) {
              onPositiveClick();
            }
          });
          
          const onPositiveClick = () => {
            const inputValue = inputFileEl.value;
            if (!validateFileName(inputValue)) return;
          
            self.#handleAddItem('file', inputValue.trim(), node);
            
            newFileDialog.show(false);
            inputFileEl.classList.remove('form-error');
            tagErrorFile.classList.remove('show');
            newFileDialog.buttonPositive.button.removeEventListener('click', onPositiveClick);
          };
          
          newFileDialog.buttonPositive.button.removeEventListener('click', onPositiveClick);
          newFileDialog.buttonPositive.button.addEventListener('click', onPositiveClick);
          
          newFileDialog.buttonNegative.button.addEventListener('click', () => {
            newFileDialog.show(false);
            
            tagErrorFile.classList.remove('show');
            inputFileEl.classList.remove('form-error');
            newFileDialog.buttonPositive.button.removeEventListener('click', onPositiveClick);
          });
        }
        // ========== TAMBAH FOLDER ==========
        else if (clicked.id === 'new-folder') {
          newSubFolderDialog.show(true);
          
          const confirmBtn = newSubFolderDialog.buttonPositive.button;
          const cancelBtn = newSubFolderDialog.buttonNegative.button;
          
          const validateFolderName = (value) => {
            const trimmed = value.trim();
            
            if (!trimmed) {
              tagErrorFolder.textContent = 'Nama folder tidak boleh kosong.';
              tagErrorFolder.classList.add('show');
              inputFolderEl.classList.add('form-error');
              return false;
            }
            
            // Validasi nama folder (boleh nested, misalnya src/components)
            const folderRegex = /^[a-zA-Z0-9_\-./ ]+$/;
            if (!folderRegex.test(trimmed)) {
              tagErrorFolder.textContent = 'Nama folder mengandung karakter tidak valid.';
              tagErrorFolder.classList.add('show');
              inputFolderEl.classList.add('form-error');
              return false;
            }
            // Validasi nested path
            const pathParts = trimmed.split('/');
            let current = node;
            let isDuplicate = false;
            
            for (let i = 0; i < pathParts.length; i++) {
              const part = pathParts[i];
              if (!current.children) break;
              
              const found = current.children.find((child) => child.name === part && child.type === 'directory');
              if (found) {
                current = found;
                // Kalau sudah di akhir dan folder-nya ditemukan → duplikat
                if (i === pathParts.length - 1) isDuplicate = true;
              } else {
                break;
              }
            }
            
            if (isDuplicate) {
              tagErrorFolder.textContent = `Folder sudah ada.`;
              tagErrorFolder.classList.add('show');
              inputFolderEl.classList.add('form-error');
              return false;
            }
            
            // Tidak validasi duplikat di sini — diserahkan ke #handleAddItem
            
            tagErrorFolder.classList.remove('show');
            inputFolderEl.classList.remove('form-error');
            return true;
          };
          
          inputFolderEl.addEventListener('input', () => {
            validateFolderName(inputFolderEl.value);
          });
          // TEKAN ENTER UNTUK MENUTUP DIALOG
          inputFolderEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === 13) {
              onConfirm();
            }
          });
          const onConfirm = () => {
            const inputValue = inputFolderEl.value;
            if (!validateFolderName(inputValue)) return;
            
            self.#handleAddItem('directory', inputValue.trim(), node);
            
            newSubFolderDialog.show(false);
            tagErrorFolder.classList.remove('show');
            inputFolderEl.classList.remove('form-error');
            confirmBtn.removeEventListener('click', onConfirm);
          };
          
          confirmBtn.removeEventListener('click', onConfirm);
          confirmBtn.addEventListener('click', onConfirm);
          
          cancelBtn.addEventListener('click', () => {
            newSubFolderDialog.show(false);
            
            tagErrorFolder.classList.remove('show');
            inputFolderEl.classList.remove('form-error');
            confirmBtn.removeEventListener('click', onConfirm);
          });
        }
        
        // ========== RENAME FOLDER ===========
        else if (clicked.id === 'rename-folder') {
          renameFolder.show(true);
          
          const confirmBtn = renameFolder.buttonPositive.button;
          const cancelBtn = renameFolder.buttonNegative.button;
          
          renameFolder.value = node.name;
          renameFolder.input.select();
          
          const validateFolderName = (value) => {
            const trimmed = value.trim();
            
            if (!trimmed) {
              tagErrorRenameFolder.textContent = 'Nama folder tidak boleh kosong.';
              tagErrorRenameFolder.classList.add('show');
              renameFolderInputEl.classList.add('form-error');
              return false;
            }
            
            const folderRegex = /^[a-zA-Z0-9_\- ]+$/;
            if (!folderRegex.test(trimmed)) {
              tagErrorRenameFolder.textContent = 'Nama folder tidak valid.';
              tagErrorRenameFolder.classList.add('show');
              renameFolderInputEl.classList.add('form-error');
              return false;
            }
            
            // Cari parent node
            const rootProject = self.#findRootProject(self.data, node);
            const parentNode = self.#findParentNode(rootProject, node);
            
            const duplicate = (parentNode?.children || []).some(
              (child) => child.type === 'directory' && child !== node && child.name === trimmed,
            );
            
            if (duplicate) {
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

  const rootProject = self.#findRootProject(self.data, node);
  if (!rootProject) {
    console.error('Root project tidak ditemukan saat rename.');
    return;
  }

  const isRoot = node === rootProject;

  let newPath = '/';
  if (!isRoot) {
    const parentNode = self.#findParentNode(rootProject, node);
    const parentPath = parentNode?.path || '/';
    newPath = `${parentPath}/${newName}`.replace(/\/+/g, '/');
    node.path = newPath;
  } else {
    node.path = '/'; // pastikan root path tetap '/'
  }

  const updateChildPaths = (folderNode) => {
    if (!folderNode.children) return;

    for (const child of folderNode.children) {
      child.path = `${folderNode.path}/${child.name}`.replace(/\/+/g, '/');
      if (child.type === 'directory') updateChildPaths(child);
    }
  };

  if (!isRoot) updateChildPaths(node); // tidak perlu update anak-anak kalau root

  console.log(`[TreeView] Folder di-rename dari "${oldName}" menjadi "${newName}", path baru: ${node.path}`);

  document.dispatchEvent(new CustomEvent('folder-renamed', {
    detail: {
      oldPath,
      newPath: node.path,
      renamedNode: node,
    },
  }));

  self.#refreshAndSave(rootProject);

  // UI cleanup
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
        }
        
        // ========== IMPORT FILES ===========
        else if (clicked.id === 'import-files') {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.multiple = true;
          fileInput.webkitdirectory = false;
          
          fileInput.addEventListener('change', async () => {
            const files = Array.from(fileInput.files);
            if (files.length === 0) return;
            
            // Hindari duplikat DOM progress
            const old = document.querySelector('.progress-wrapper');
            if (old) old.remove();
            
            // Total size semua file
            const totalSize = files.reduce((sum, f) => sum + f.size, 0);
            let loadedSize = 0;
            
            // Buat elemen loading setelah user pilih file
            
            const progressWrap = document.createElement('div');
            const progressBar = document.createElement('progress');
            const progressText = document.createElement('label');
            
            progressWrap.className = 'progress-wrapper';
            progressBar.className = 'progress-bar';
            progressText.className = 'progress-value';
            
            progressBar.value = 0;
            progressBar.max = 100;
            progressBar.id = 'progress';
            progressText.for = 'progress';
            progressWrap.appendChild(progressBar);
            progressWrap.appendChild(progressText);
            this.#loadingContainer.appendChild(progressWrap);
            
            if (!document.querySelector('#progress-style')) {
              const style = document.createElement('style');
              style.id = 'progress-style';
              style.textContent = `
  .progress-wrapper {
      margin: 1rem auto;
      width: calc(340px - 20%);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
      line-height: 16px;
      height: max-content;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  } 
  
  .progress-bar {
      width: 100%;
      display: block;
      margin: 0!important;
      appearance: none;
  }

.progress-value {
    position: relative;
    font-size: 14px;
    display: inline-flex;
    line-height: inherit;
    font-weight: 400;
    margin-block: 8px;
    color: color-mix(in oklab, var(--bg-dark,#0D161F), #fff 70%);
 }
 
  .progress-bar::-webkit-progress-inner-element {
    height: 14px!important;
  }
  .progress-bar::-webkit-progress-bar {
   background-color: color-mix(in oklab, var(--bg-dark,#0D161F), currentColor 25%);
   border-radius: 9999px;
   overflow: hidden;
  }
  
  .progress-bar::-webkit-progress-value {
    background-color: #3b82f6!important;
 outline:1.5px solid color-mix(in oklab, var(--bg-dark,#0D161F), #fff 70%); 
  }
 `;
              document.head.appendChild(style);
            }
            
            const rootProject = self.#findRootProject(self.data, node);
            
           for (const file of files) {
              await new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onprogress = (e) => {
                  if (e.lengthComputable) {
                    const currentTotal = loadedSize + e.loaded;
                    const percent = (currentTotal / totalSize) * 100;
                    
                    progressBar.value = `${percent.toFixed(1)}`;
                    progressText.textContent = `${this.#formatBytes(currentTotal)} dari ${this.#formatBytes(totalSize)}`;
                  }
                };
                
  reader.onload = async () => {
  loadedSize += file.size;

  const rawPath = `${node.path}/${file.name}`;
  const cleanPath = rawPath.replace(/\/+/g, '/'); // konsisten dengan handleAddItem

  const fileNode = {
    type: 'file',
    name: file.name,
    mime: file.type,
    path: cleanPath,
  };
//indra3
  // Simpan isi file
  await FileContentStorage.saveContent(fileNode.path, reader.result);

  console.log(`[Import] File disimpan: ${fileNode.path}, ${reader.result.byteLength} byte`);

  // Tambahkan ke tree jika belum ada
  node.children = node.children || [];
  const isDuplicate = node.children.some(
    (child) => child.name === file.name && child.type === 'file'
  );

  if (!isDuplicate) {
    node.children.push(fileNode);
  }

  // Update progress
  progressBar.value = `${(loadedSize / totalSize) * 100}`;
  progressText.textContent = `${this.#formatBytes(loadedSize)} dari ${this.#formatBytes(totalSize)}`;

  resolve();
};
           
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
              });
              
              await new Promise((r) => setTimeout(r, 5));
            }
            
            if (rootProject) {
              self.#refreshAndSave(rootProject);
              console.log(`${files.length} file berhasil diimpor.`);
            }
            progressWrap.remove(); // Bersihkan DOM
          });
          
          fileInput.click();
        }
        
        // ========== COPY FOLDER ===========
        else if (clicked.id === 'copy-folder');
        else if (clicked.id === 'cut-folder');
        else if (clicked.id === 'copy-path-folder') IcodexEditor.plugins.clipboard.copy(node.path);
        
        else if (clicked.id === 'delete-this-folder') {
          // ========== DELETE FOLDER ===========
          const rootProject = self.#findRootProject(self.data, node);
          if (!rootProject) {
            alert('Root project tidak ditemukan.');
            return;
          }
          
          const parentNode = self.#findParentNode(rootProject, node);
          if (!parentNode) {
            console.error('Parent folder tidak ditemukan.');
            return;
          }
          
          const confirmDelete = window.confirm(`Yakin ingin menghapus folder "${node.name}" beserta semua isinya?`);
          if (!confirmDelete) return;
          
          const index = parentNode.children.findIndex((child) => child === node);
          if (index !== -1) {
            parentNode.children.splice(index, 1);
            
            document.dispatchEvent(
              new CustomEvent('folder-removed', {
                detail: {
                  removedPath: node.path
                },
              }),
            );
            
            self.#refreshAndSave(rootProject);
            console.warn(`Folder "${node.path}" telah dihapus.`);
          } else {
            console.error(`Folder "${node.name}" tidak ditemukan di parent.`);
          }
        }
        
   // ============ EXPORT ===============
        else if (clicked.id === 'export-folder') { const rootNode = node; window.IcodexEditor.plugins.ZipPlugin.exportTreeToZip(rootNode, `${rootNode.name}.zip`);}
          
        
        
        // ========== OPSI LAIN ==========
        else {
          alert('Coming soon..!');
        }
      });
    }
    
    /**
     * Membuat path absolut untuk item baru berdasarkan parent-nya
     */
    
    
    #formatBytes(bytes) {
      const units = ['B', 'KB', 'MB', 'GB'];
      let i = 0;
      while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
      }
      return `${bytes.toFixed(1)} ${units[i]}`;
    }
    
    // Membuat elemen pesan error dengan teks tertentu
    // Digunakan pada input dialog untuk menampilkan error validasi
    // Mengembalikan elemen <p> yang bisa ditampilkan/dihide
    #createErrorMessageElement(text) {
      const p = document.createElement('p');
      p.className = 'error-messages-text';
      p.innerText = text;
      return p;
    }
    
    // Membuat elemen DOM untuk file
    // Parameter 'node' adalah objek file dengan properti name
    // Menghasilkan elemen span dengan class dan atribut yang sesuai tipe file
    // Menyiapkan dropdown opsi file (rename, copy path, dll) juga
    #createFileNode(node) {
      // Elemen utama nama file
      const fileSpan = document.createElement('span');
      fileSpan.className = 'kind-file';
      
      // Mendapatkan ekstensi file untuk  ikon/tipe
      const ext = node.name.split('.').pop().toLowerCase();
      const typeMap = {
        // Web & Markup
        html: 'html',
        htm: 'htm',
        css: 'css',
        js: 'js',
        jsx: 'jsx',
        ts: 'ts',
        tsx: 'tsx',
        json: 'json',
        xml: 'xml',
        yml: 'yml',
        yaml: 'yaml',
        md: 'md',
        
        // Text & Config
        txt: 'txt',
        ini: 'ini',
        env: 'env',
        cfg: 'cfg',
        conf: 'conf',
        log: 'log',
        gitignore: 'gitignore',
        gitattributes: 'gitattributes',
        editorconfig: 'editorconfig',
        
        // Backend Languages
        py: 'py',
        rb: 'rb',
        php: 'php',
        java: 'java',
        c: 'c',
        h: 'h',
        cpp: 'cpp',
        hpp: 'hpp',
        cs: 'cs',
        go: 'go',
        rs: 'rs',
        swift: 'swift',
        sh: 'sh',
        bash: 'bash',
        zsh: 'zsh',
        pl: 'pl',
        lua: 'lua',
        
        // Data & Documents
        csv: 'csv',
        tsv: 'tsv',
        xls: 'xls',
        xlsx: 'xlsx',
        doc: 'doc',
        docx: 'docx',
        pdf: 'pdf',
        rtf: 'rtf',
        
        // Images & Media
        png: 'png',
        jpg: 'jpg',
        jpeg: 'jpeg',
        gif: 'gif',
        svg: 'svg',
        webp: 'webp',
        ico: 'ico',
        bmp: 'bmp',
        mp3: 'mp3',
        wav: 'wav',
        mp4: 'mp4',
        webm: 'webm',
        ogg: 'ogg',
        mov: 'mov',
        
        // Fonts
        ttf: 'ttf',
        otf: 'otf',
        woff: 'woff',
        woff2: 'woff2',
        
        // Archives
        zip: 'zip',
        rar: 'rar',
        tar: 'tar',
        gz: 'gz',
        tgz: 'tgz',
        '7z': '7z',
        
        // Misc
        sql: 'sql',
        db: 'db',
        lock: 'lock',
        bak: 'bak',
        map: 'map',
        license: 'license',
        
        // Framework/Tools Specific
        vue: 'vue',
        svelte: 'svelte',
        astro: 'astro',
        dockerfile: 'dockerfile',
        toml: 'toml',
        makefile: 'makefile',
        gradle: 'gradle',
        babelrc: 'babelrc',
        eslintrc: 'eslintrc',
      };
      
      fileSpan.setAttribute('data-file-type', typeMap[ext] || 'unknown');
      
      // Jika nama file terlalu panjang, buat elemen ellipsis agar tampilannya rapi
      if (node.name.length > 20) {
        const ellipsisSpan = document.createElement('span');
        ellipsisSpan.className = 'ellipsis';
        ellipsisSpan.textContent = node.name;
        fileSpan.appendChild(ellipsisSpan);
      } else {
        fileSpan.textContent = node.name;
      }
      
      fileSpan.addEventListener('click', async () => {
  const contentUint8 = await FileContentStorage.getContent(node.path); // ← ambil dari file store

  renderFileContent({
    name: node.name,
    type: node.type,
    path: node.path,
    content: contentUint8, // ← pastikan ini ada!
  });

  addTabFile(node.path, node.name, contentUint8); // ← tab juga pakai content asli
});



      /*
  kita buat bertahap dulu, 
    addTabFile(path, name, content);
    menambahkan tab file yang sedang aktif atau yang user klik di treeview.
    dan sudah otomatis terdeteksi jika user menghapus file di treeview maka terhapus juga di tabsfile nya melalui new CustomEvent "berfungsi baik" karna bisa antar module.
    jadi saya ingin: menampilkan isi content "bukan preview", tapi tipe text js || html || css, dan svg, di iframe tapi iframe nya sudah di include ace editor. dan menampilkan content html atau css dll, nya di situ.
    dan sedikit saran untuk import file kan sudah di buatkan type mime nya.
    tapi di new file tanpa import belum ada property mime nya, jadi sedikit susah jika file yang di impor memiliki mime tapi file yang di buat user sendiri tidak memiliki properti mime.
    kita focus dulu ke sini. pastikan jika anda ingin memberikan kode untuk modifikasi kode bagian mana, harap beritahu saya bagian mana harus di modifikasi atau menempel kode nya.
  */
      // Setup dropdown menu file (copy, rename, copy path, dll)
      this.#setupFileDropdown(node, fileSpan);
      return fileSpan;
    }
    
    // Setup dropdown menu untuk file dengan opsi operasi seperti rename dan copy path
    // Parameter:
    // - node: data file saat ini
    // - fileSpan: elemen DOM file yang akan dipasangi dropdown dan event-nya
    #setupFileDropdown(node, fileSpan) {
      const self = this;
      
      // Tombol titik tiga horizontal untuk membuka dropdown file
      const dot = document.createElement('span');
      dot.className = 'dot-horizontal';
      dot.tabIndex = 0;
      dot.role = 'button';
      dot.ariaLabel = 'Open Dropdown';
      fileSpan.appendChild(dot);
      
      // Buat instance dropdown file dan atur opsi yang tersedia
      const icodeXFileDropdown = new CustomDropdown(DROPDOWN_CONTAINERS, fileSpan);
      icodeXFileDropdown._group[0].option = [{
        value: 'Copy',
        icon: 'bi bi-copy',
        id: 'copy-file'
      },
      {
        value: 'Cut',
        icon: 'bi bi-scissors',
        id: 'cut-file'
      },
      {
        value: 'Rename',
        icon: 'bi bi-pencil',
        id: 'rename-file'
      },
      {
        value: 'Copy Path',
        icon: 'bi bi-copy',
        id: 'copy-path-file'
      }, ];
      
      icodeXFileDropdown._group.push({
        label: 'group-2',
        option: [{
          value: 'Delete',
          icon: 'codicon codicon-trash',
          id: 'delete-this-file'
        }],
      });
      
      // Event klik tombol titik tiga untuk toggle dropdown file
      
      dot.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        
        // Tutup dropdown lain jika sedang terbuka
        if (TreeView.currentOpenDropdown && TreeView.currentOpenDropdown !== icodeXFileDropdown) {
          TreeView.currentOpenDropdown.open(false);
        }
        
        // Toggle dropdown saat ini
        const isOpen = DROPDOWN_CONTAINERS.classList.toggle('open');
        icodeXFileDropdown.open(isOpen);
        
        // Simpan dropdown aktif
        TreeView.currentOpenDropdown = isOpen ? icodeXFileDropdown : null;
      });
      
      this.#mainParentTree.addEventListener('scroll', (e) => {
        e.stopPropagation();
        
        if (TreeView.currentOpenDropdown) {
          TreeView.currentOpenDropdown.open(false);
          
          TreeView.currentOpenDropdown = null;
        }
      });
    
      const hideDropdown = () => {
        if (TreeView.currentOpenDropdown) {
          TreeView.currentOpenDropdown.open(false);
          
          TreeView.currentOpenDropdown = null;
        }
      };
      
      document.removeEventListener('click', hideDropdown);
      document.addEventListener('click', hideDropdown);
      
      !(
        // Event klik opsi dropdown file
        icodeXFileDropdown.addEventListener('optclick', (e) => {
          const clicked = e.detail.option;
          
if (clicked.id === 'rename-file') {
  const newName = prompt('Rename file:', node.name);
  if (!newName || !newName.trim()) return;

  const trimmedName = newName.trim();

  const rootProject = self.#findRootProject(self.data, node);
  if (!rootProject) {
    console.error('Root project tidak ditemukan saat rename file.');
    return;
  }

  const parentNode = self.#findParentNode(rootProject, node);

  // Cek duplikat
  const isDuplicate = (parentNode?.children || []).some(
    (child) => child !== node && child.type === 'file' && child.name === trimmedName
  );

  if (isDuplicate) {
    alert(`File dengan nama "${trimmedName}" sudah ada di folder ini.`);
    return;
  }

  const oldPath = node.path;

  // Update nama
  node.name = trimmedName;

  // Bangun ulang path
  const parentPath = parentNode?.path || '/';
  const newPath = `${parentPath}/${trimmedName}`.replace(/\/+/g, '/');
  node.path = newPath;

  // Simpan dan refresh
  self.#refreshAndSave(rootProject);

  // Broadcast event
  const renameEvent = new CustomEvent('file-renamed', {
    detail: {
      oldPath,
      newPath,
      newName: trimmedName,
      type: node.type,
      
    },
  });
  document.dispatchEvent(renameEvent);

  console.log(`File berhasil di-rename dari ${oldPath} → ${newPath}`);
  
     }  else if (clicked.id === 'copy-path-file') IcodexEditor.plugins.clipboard.copy(node.path);
  
    else if (clicked.id === 'delete-this-file') {
            const type = node.type;
            const name = node.name;
            
            const confirmDelete = window.confirm(`Yakin ingin menghapus ${type} "${name}"?`);
            if (!confirmDelete) return;
            
            // Cari root project dulu
            const rootProject = self.#findRootProject(self.data, node);
            if (!rootProject) {
              console.error('Root project tidak ditemukan.');
              return;
            }
            
            // Cari parent node dari node yang ingin dihapus
            const parentNode = self.#findParentNode(rootProject, node);
            
            if (!parentNode || !Array.isArray(parentNode.children)) {
              console.error('Parent node tidak ditemukan atau tidak valid.');
              return;
            }
            
            const index = parentNode.children.findIndex((child) => child === node);
            if (index !== -1) {
              parentNode.children.splice(index, 1);
              
              self.#refreshAndSave(rootProject);
              console.log(`${type} "${name}" berhasil dihapus.`);
              
              // Kirim event file dihapus ke listener lain (misalnya TabManager)
              const event = new CustomEvent('file-removed', {
                detail: {
                  path: node.path
                }, // path penting untuk identifikasi tabs
              });
              document.dispatchEvent(event); // gunakan document sebagai event bus
            } else {
              console.error(`${type} "${name}" tidak ditemukan di parent.`);
            }
          }
        })
      );
      
      /**
       * kita mulai dari pertama dari pertama kali membuat project pastikan path nya seperti vscode
       * dan lanjut ke new folder dulu dan beberapa method yang di dalamnya jika anda ingin minta method yang terkait di dalam block code itu beritahukan saya.
       * kita mulai dari dua itu duluh.
       * pastikan anda simpan di memory anda tahap tahap nya
       * janan bertele-tele pastikan kalau ada yang perlu di ganti tinggal berikan kode nya dan jelaskan kode itu akan di rekatkan dimana. harus di ingat
       */
      
      // document.removeEventListener('click', hideDropdown)
    }
    
    #getOpenFolderPaths() {
      const openFolders = [];
      const nodes = document.querySelectorAll('.directory-name.open');
      for (const node of nodes) {
        const path = this.#getFullPath(node);
        
        if (path) openFolders.push(path);
      }
      return openFolders;
    }
    #getFullPath(el) {
      const path = [];
      let current = el;
      while (current && !current.classList.contains('tree-view')) {
        if (current.classList.contains('directory')) {
          const nameEl = current.querySelector('.directory-name');
          if (nameEl) path.unshift(nameEl.textContent.trim());
        }
        current = current.parentElement;
      }
      return path.join('/');
    }
    
    #reopenFolders(paths) {
      const allDirs = document.querySelectorAll('.directory');
      allDirs.forEach((dir) => {
        const nameEl = dir.querySelector('.directory-name');
        const contentEl = dir.querySelector('.directory-content');
        if (!nameEl || !contentEl) return;
        
        const fullPath = this.#getFullPath(nameEl);
        if (paths.includes(fullPath)) {
          nameEl.classList.add('open');
          contentEl.classList.add('open');
        }
      });
    }
    
    _replaceTree(newTreeElement) {
      const oldTree = document.querySelector('.tree-view');
      if (oldTree && oldTree.parentNode) {
        oldTree.parentNode.replaceChild(newTreeElement, oldTree);
      }
    }
     
    
    
    // handle add file sub folder dari sini, supaya menghindari duplikasi kode
    
    async #handleAddItem(type, name, node, content = "") {
  if (!name.trim()) return;

  const pathParts = name.trim().split('/').filter(Boolean);
  const isNested = pathParts.length > 1;

  // Tangani folder bertingkat
  if (type === "directory" && isNested) {
    await this.#createNestedDirectory(name.trim(), node);
    return;
  }

  // Tangani file bertingkat, contoh: "assets/js/main.js"
  if (type === "file" && isNested) {
    const fileName = pathParts.pop();             // Ambil nama file
    const folderPath = pathParts.join('/');       // Ambil path folder

    if (!fileName.trim()) {
      console.warn('Nama file tidak valid.');
      return;
    }

    // Buat semua foldernya dulu
    const parentFolder = await this.#createNestedDirectory(folderPath, node);

    // Lanjutkan dengan membuat file dalam folder yang telah dibuat
    await this.#handleAddItem("file", fileName, parentFolder, content);
    return;
  }

  // === NON-NESTED FILE/FOLDER DI SINI ===

  const rootProject = this.#findRootProject(this.data, node);
  const parentPath = node.path || '/';
  const fullPath = `${parentPath}/${name.trim()}`.replace(/\/+/g, "/");

  console.log(`[TreeView] ${type === "directory" ? "Folder" : "File"} dibuat dengan path: ${fullPath}`);

  const item = {
    type, // ganti dari `kind` ke `type` untuk konsistensi
    name: name.trim(),
    path: fullPath
  };

    if (type === "directory") {
    item.children = [];
  } else {
    const uint8 = typeof content === 'string'
      ? new TextEncoder().encode(content)
      : content;

    await FileContentStorage.saveContent(fullPath, uint8);
  }

  node.children = node.children || [];

  const duplicate = node.children.some(child =>
    child.name === item.name && child.type === item.type
  );

  if (duplicate) {
    console.warn(`${type === "directory" ? "Folder" : "File"} "${item.name}" sudah ada.`);
    return;
  }

  node.children.push(item);
  this.#sortNodeChildren(node);

  if (rootProject) {
    
    await updateProject(rootProject);
    this.#refreshTree();
  } else {
    console.error("Root project tidak ditemukan!");
  }
}
    
    #refreshTree() {
      const openPaths = this.#getOpenFolderPaths();
      const refreshedTree = this.renderTree();
      this._replaceTree(refreshedTree);
      this.#reopenFolders(openPaths);
    }
    
    #refreshAndSave(rootProject) {
      const openPaths = this.#getOpenFolderPaths();
      const refreshedTree = this.renderTree();
      this._replaceTree(refreshedTree);
      this.#reopenFolders(openPaths);
      if (rootProject) {
        updateProject(rootProject);
      }
    }
    
    // Cari path lengkap dari node target di tree project (objek)
    _findPathInProjectTree(root, targetNode, currentPath = []) {
      if (root === targetNode) {
        // Jika root adalah root project, return '/'
        if (!currentPath.length) return '/';
        return [...currentPath, root.name].join('/');
      }
      if (!root.children) return null;
      
      for (const child of root.children) {
        const result = this._findPathInProjectTree(child, targetNode, [...currentPath, root.name]);
        
        if (result) return result;
      }
      return null;
    }
    
    #findRootProject(projectList, targetNode) {
      for (const project of projectList) {
        if (this.#containsNode(project, targetNode)) return project;
      }
      return null;
    }
    
    #containsNode(current, target) {
      if (current === target) return true;
      if (current.children) {
        return current.children.some((child) => this.#containsNode(child, target));
      }
      return false;
    }
    
    /**
     * Membuat struktur folder bertingkat berdasarkan path (misal: "src/components/utils")
     * Jika folder sudah ada, tidak akan duplikat tapi akan lanjut ke dalamnya.
     * Digunakan untuk membuat path bertingkat dari input file/folder (misalnya "src/main.js").
     *
     * @param {string} path - path folder bertingkat, dipisah oleh "/"
     * @param {object} rootNode - node parent awal tempat path akan dibuat
     * @returns {object} - folder paling dalam  dari path yang berhasil dibuat/ditemukan
     */
    
    async #createNestedDirectory(path, rootNode) {
  const parts = path.split('/').filter(Boolean);
  let current = rootNode;

  for (const part of parts) {
    if (!current.children) current.children = [];

    // Cari folder dengan nama sama
    let existing = current.children.find(child =>
      child.name === part && child.type === "directory"
    );

    if (!existing) {
      // Gunakan path langsung dari node saat ini
      const parentPath = current.path || '/';
      const fullPath = `${parentPath}/${part}`.replace(/\/+/g, '/');

      existing = {
        type: "directory", // Ganti dari "kind" jadi "type"
        name: part,
        path: fullPath,
        children: []
      };

      current.children.push(existing);
      this.#sortNodeChildren(current);

      console.log(`[TreeView] Folder bertingkat dibuat: ${fullPath}`);
    }

    current = existing;
  }

  // Simpan ke DB setelah semua folder dibuat
  const rootProject = this.#findRootProject(this.data, rootNode);
  if (rootProject) {
    await updateProject(rootProject);
    this.#refreshTree();
  }

  return current;
}

    
    #sortNodeChildren(node) {
      if (!node.children) return;
      
      node.children.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });
    }
    
    
    /**
   * Fungsi untuk mencari parent (induk) dari suatu node dalam struktur tree.
   * 
   * @param {Object} currentNode - Node saat ini yang sedang diperiksa (biasanya root project).
   * @param {Object} targetNode - Node yang ingin kita cari parent-nya.
   * @returns {Object|null} - Node parent jika ditemukan, atau null jika tidak ada.
   * 
   * Fungsi ini dipanggil ketika kita ingin menghapus file, karena untuk menghapus node,
   * kita harus tahu siapa parent-nya agar bisa memodifikasi `children` parent tersebut.
   * 
   * Fungsi ini bekerja secara rekursif menelusuri seluruh pohon dari rootProject,
   * mencari node yang memiliki targetNode sebagai salah satu anaknya.
   * Cara pemanggilan 
   * @const parentNode = self.#findParentNode(rootProject, node);

   */
    
    #findParentNode(currentNode, targetNode) {
      // Jika currentNode tidak valid atau tidak punya children, langsung return null
      if (!currentNode || !currentNode.children) return null;
      
      // Loop semua anak dari currentNode
      for (const child of currentNode.children) {
        // Jika ada anak yang sama persis dengan targetNode, currentNode adalah parent-nya
        if (child === targetNode) {
          return currentNode;
        }
        
        // Jika child adalah folder (directory), lakukan pencarian ke dalamnya (rekursif)
        if (child.type === 'directory') {
          const found = this.#findParentNode(child, targetNode);
          if (found) return found; // Jika ketemu di dalam, langsung return
        }
      }
      
      // Jika tidak ditemukan di mana pun, return null
      return null;
    }
    
    
    
    // Di dalam class TreeView atau ProjectManager
    addItemFromOutside(type, name, node, content = '') {
      return this.#handleAddItem(type, name, node, content);
    }
  }
  
  /**
   * j
   */
  
  class Input {
    constructor(placeholder = '') {
      this.input = document.createElement('input');
      this.input.spellcheck = false;
      this.input.autocomplete = 'off';
      this.input.placeholder = placeholder;
      this.input.type = 'text';
      this.input.maxLength = 50;
      this.input.value = '';
      this.input.className = 'form-input';
    }
    
    set value(val) {
      this.input.value = val;
    }
    
    get value() {
      return this.input.value; // Perbaikan: tambahkan return
    }
    
    focus() {
      return this.input.focus();
    }
    
    blur() {
      return this.input.blur();
    }
    
    select() {
      this.input.select();
    }
    trim() {
      return this.input.value.trim();
    }
    onInput(callback) {
      this.input.addEventListener('input', callback);
    }
  }
  
  class Dialog {
    dialog = document.createElement('div'); // OK, class field
    
    // Hapus deklarasi null di sini, akan dibuat di #init()
    _dialogHeader;
    _dialogTitle;
    _dialogBody;
    _dialogFooter;
    _buttonCreate;
    constructor(dialogTitle = 'Dialog Header', container) {
      this.dialogTitle = dialogTitle;
      this._container = container;
      
      this.dialog.className = 'dialog-overlay';
      
      this.#init(); // Panggil init dulu untuk membuat elemen internal
      
      // Proxy setup - Pindahkan setelah #init() agar _dialogBody dll. tidak null
      this.children = {
        body: this.#createProxyList('body'),
        footer: this.#createProxyList('footer'),
      };
      
      this.classList = this.dialog.classList; // OK jika Anda ingin referensi langsung
    }
    
    render(render = false) {
      if (render === true || render === 1) {
        this._container.innerHTML = '';
        this._container.appendChild(this.dialog);
      } else {
        this._container.innerHTML = '';
      }
    }
    
    #createProxyList(type) {
      const targetArray = [];
      const self = this;
      
      return new Proxy(targetArray, {
        set(target, prop, value) {
          const isIndex = !isNaN(prop);
          const result = Reflect.set(target, prop, value);
          if (isIndex && value instanceof HTMLElement) {
            // Pastikan _dialogBody atau _dialogFooter sudah ada
            const targetElement = type === 'body' ? self._dialogBody : self._dialogFooter;
            if (targetElement) {
              targetElement.appendChild(value);
            } else {
              console.warn(`Attempted to append to ${type} before it was initialized.`);
            }
          }
          return result;
        },
      });
    }
    
    #init() {
      const container = document.createElement('div');
      const header = document.createElement('div');
      const body = document.createElement('div');
      const footer = document.createElement('div');
      
      header.className = 'dialog-header';
      body.className = 'dialog-body';
      footer.className = 'dialog-footer';
      container.className = 'dialog-container';
      
      const title = document.createElement('span');
      title.className = 'dialog-title';
      title.innerText = this.dialogTitle;
      
      header.appendChild(title);
      container.append(header, body, footer);
      this.dialog.appendChild(container);
      
      // Langsung inisialisasi properti di sini
      this._dialogHeader = header;
      this._dialogTitle = title;
      this._dialogBody = body;
      this._dialogFooter = footer;
    }
  }
  
  const dialogWrap = window.Icodex.dialog_containers;
  
  document.body.appendChild(dialogWrap);
  
  window.isTreeViewReady = false;
  
  class CustomDialog extends Dialog {
    constructor(option = {
      title: 'Berkas Baru',
      placeholder: 'Masukan Nama atau Path'
    }, container) {
      super(option.title, container); // Lewatkan judul ke konstruktor Dialog
      this._container = container;
      this.option = option;
      this.input = new Input(this.option.placeholder);
      
      this.#initCustomDialog(); // Method inisialisasi khusus untuk CustomDialog
    }
    get value() {
      return this.input.value;
    }
    set value(val) {
      return (this.input.value = val);
    }
    
    focus() {
      this.input.focus();
    }
    
    blur() {
      this.input.blur();
    }
    
    //renameFolder.input
    
    #initCustomDialog() {
      // Buat tombol di sini
      const buttonNegative = new Button('btn button-negative', 'Membatalkan');
      const buttonPositive = new Button('btn button-positive', 'Buat');
      this.buttonPositive = buttonPositive;
      this.buttonNegative = buttonNegative;
      // ✅ Simpan referensi
      
      // Gunakan Proxy children yang sudah ada dari Dialog
      this.children.body.push(this.input.input);
      this.children.footer.push(buttonNegative.button);
      this.children.footer.push(buttonPositive.button);
    }
    
    // Method 'render' CustomDialog tidak lagi perlu mengulang init DOM dasar
    // Method ini bisa digunakan untuk menampilkan atau menyembunyikan dialog
    show(state = false) {
      if (state) {
        if (!this.dialog.isConnected && this._container) {
          this.render(true);
        }
        this.dialog.classList.add('open');
        this.input.focus();
      } else {
        this.dialog.classList.remove('open');
        setTimeout(() => this.render(false), 300);
      }
    }
  }

  /*patern = 50 || [25 - 100]*/
  const vibrate = function(pattern = 50 || [50]) {
    const isNumber = typeof pattern === 'number';
    const isArrayNumber = Array.isArray(pattern) && pattern.every((n) => typeof n === 'number');
    
    // Deteksi tipe kesalahan
    if (!isNumber && !isArrayNumber) {
      let typeInfo = typeof pattern;
      
      // Jika array tapi ada elemen bukan number
      if (Array.isArray(pattern)) {
        const invalids = pattern.filter((n) => typeof n !== 'number');
        typeInfo = `Array dengan elemen tidak valid: [${invalids.map((v) => `"${v}" (${typeof v})`).join(', ')}]`;
      }
      
      // Bangun pesan error spesifik
      const message =
        `[TypeError]: Parameter "pattern" tidak valid.\n` +
        `Diterima: ${JSON.stringify(pattern)}\n` +
        `Tipe: ${typeInfo}\n` +
        `Yang diizinkan: Number atau Array of Number`;
      
      throw new TypeError(message);
    }
    
    // Eksekusi jika valid
    if (navigator.vibrate) {
      return navigator.vibrate(pattern);
    } else {
      console.warn('Vibration API tidak didukung di browser ini.');
      return false;
    }
  };
  
// Pastikan namespace aman
window.IcodexEditor = window.IcodexEditor || {};
IcodexEditor.plugins = IcodexEditor.plugins || {};

  // crc32.js
  const CRC32 = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    
    function from(input) {
      let data = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
      let crc = 0xffffffff;
      
      for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
      }
      
      return ~crc >>> 0;
    }
    
    return {
      from
    };
  })();
  
  // zipPlugin.js
  
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
      
      const {
        dosTime,
        dosDate
      } = this.#getDosDateTime();
      
      view.setUint32(0, 0x04034b50, true); // Local file header
      view.setUint16(4, 20, true); // Version needed
      view.setUint16(6, 0, true); // Flags
      view.setUint16(8, 0, true); // Compression = store
      view.setUint16(10, dosTime, true);
      view.setUint16(12, dosDate, true);
      view.setUint32(14, this.crc, true); // CRC32
      view.setUint32(18, this.size, true); // Compressed size
      view.setUint32(22, this.size, true); // Uncompressed size
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true); // Extra field
      
      header.set(nameBytes, 30);
      return header;
    }
    
    toCentralDirectory() {
      const nameBytes = new TextEncoder().encode(this.name);
      const header = new Uint8Array(46 + nameBytes.length);
      const view = new DataView(header.buffer);
      
      const {
        dosTime,
        dosDate
      } = this.#getDosDateTime();
      
      view.setUint32(0, 0x02014b50, true); // Central dir signature
      view.setUint16(4, 20, true); // Version made by
      view.setUint16(6, 20, true); // Version needed
      view.setUint16(8, 0, true); // Flags
      view.setUint16(10, 0, true); // Compression
      view.setUint16(12, dosTime, true);
      view.setUint16(14, dosDate, true);
      view.setUint32(16, this.crc, true); // CRC32
      view.setUint32(20, this.size, true); // Compressed
      view.setUint32(24, this.size, true); // Uncompressed
      view.setUint16(28, nameBytes.length, true);
      view.setUint16(30, 0, true); // Extra
      view.setUint16(32, 0, true); // Comment
      view.setUint16(34, 0, true); // Disk start
      view.setUint16(36, 0, true); // Internal attr
      view.setUint32(38, 0, true); // External attr
      view.setUint32(42, this.offset, true); // Offset local header
      
      header.set(nameBytes, 46);
      return header;
    }
    
    #getDosDateTime() {
      const d = this.date;
      const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2);
      const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
      return {
        dosTime,
        dosDate
      };
    }
  }
  
  class MiniZip {
    constructor() {
      this.entries = [];
      this.offset = 0;
    }
    
    file(path, content = '') {
      // Deteksi jika konten adalah Uint8Array (binary)
      const data = content instanceof Uint8Array ? content : new TextEncoder().encode(String(content));
      
      const entry = new ZipEntry(path, data, this.offset);
      const local = entry.toLocalHeader();
      const full = new Uint8Array(local.length + data.length);
      full.set(local, 0);
      full.set(data, local.length);
      
      this.entries.push({
        entry,
        data: full
      });
      this.offset += full.length;
    }
    
    folder(path) {
      const norm = path.endsWith('/') ? path : path + '/';
      this.file(norm); // folder entry
      return {
        file: (name, content) => this.file(norm + name, content),
        folder: (name) => this.folder(norm + name),
      };
    }
    
    generateBlob() {
      const buffers = [];
      const central = [];
      
      for (const {
          entry,
          data
        }
        of this.entries) {
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
      view.setUint32(0, 0x06054b50, true); // EOCD
      view.setUint16(8, central.length, true); // total this disk
      view.setUint16(10, central.length, true); // total
      view.setUint32(12, this.offset - centralStart, true); // dir size
      view.setUint32(16, centralStart, true); // dir offset
      buffers.push(eocd);
      
      return new Blob(buffers, {
        type: 'application/zip'
      });
    }
  }
  
   window.IcodexEditor.plugins.ZipPlugin = {
    MiniZip,
    
    exportTreeToZip(rootNode, zipName = 'project.zip') {
      const zip = new MiniZip();
      
      function addToZip(node, zipFolder) {
        if (node.type === 'file') {
          zipFolder.file(node.name, node.content || '');
        } else if (node.type === 'directory' && node.children) {
          const folder = zipFolder.folder(node.name);
          node.children.forEach((child) => addToZip(child, folder));
        }
      }
      
      addToZip(rootNode, zip);
      
      const blob = zip.generateBlob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };


  
  class NavigationDrawer {
    navigationButton = new Button('btn', "<i class='bi bi-send'");
    constructor() {}
    
    #init() {
      const wrappper = document.createElement('div');
      dHead.className = 'drawer-header';
      const drawerToolbar = document.createElement('nav');
      drawerToolbar.className = 'drawer-tool';
    }
  }
  
 
 class DrawerTabs extends DocumentFragment {
   constructor(items = ['']) {
     super()
     this.items = items
   } 
   
  #init() {
    const wrapper = document.createElement('nav');
    
  }
 }

  class DrawerTool {
  constructor(buttonList = []) {
    this.element = document.createElement('nav');
    this.element.className = 'drawer-tool';

    // Tambahkan semua tombol yang dikirim lewat parameter
    for (const button of buttonList) {
      // Pastikan elemen tombol valid
      if (button instanceof HTMLElement) {
        this.element.appendChild(button);
      } else {
        console.warn('DrawerTool menerima elemen bukan HTMLElement:', button);
      }
    }
  }

  getElement() {
    return this.element;
  }
}

class Drawer {
  // Class private
  #drawerClass = 'file_exploler-drawer';

  // Komponen modular
  #drawerTool;
  #projectDialog;
  #treeView = new TreeView([]);

  constructor() {
    // Buat <aside> utama drawer
    this.drawerContainer = document.createElement('aside');
    this.drawerContainer.className = this.#drawerClass;
    this.drawerContainer.id = 'explorer';

    // Inisialisasi
    this.#setupDrawerStructure();
    this.#setupProjectDialog();
    this.#refreshTreeViewFromDb();
  }

  // Setup struktur drawer (header & tree)
#setupDrawerStructure() {
  const drawerHeader = document.createElement('div');
  drawerHeader.className = 'drawer-header';

  // Buat tombol eksternal (bisa pakai class Button milikmu)
  const navigationBtn  = new Button('btn', `
<svg
  class="lucide lucide-send-horizontal"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
  <path d="M6 12h16" />
</svg>

  `).button
  const treeBtn  = new Button('btn', `
 <svg
  class="lucide lucide-folder"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
</svg>
 
  `).button;
const searchCodeBtn = new Button('btn', `
<svg
  class="lucide lucide-search-code"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m13 13.5 2-2.5-2-2.5" />
  <path d="m21 21-4.3-4.3" />
  <path d="M9 8.5 7 11l2 2.5" />
  <circle cx="11" cy="11" r="8" />
</svg>

 
  `).button;  
  
const bellNotif = new Button('btn',`
<svg
  class="lucide lucide-bell"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M10.268 21a2 2 0 0 0 3.464 0" />
  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
</svg>

`).button 
  const addProject = new Button('btn', `
<svg
  class="lucide lucide-settings"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
  <circle cx="12" cy="12" r="3" />
</svg>

  `).button;

  // Pasang event listener langsung (tanpa pakai setOnclick bawaan)
  addProject.addEventListener('click', () => {
    this.#projectDialog.show(true);
  });

  

  // Kirim ke DrawerTool
  this.#drawerTool = new DrawerTool([
    navigationBtn,
    treeBtn,
    searchCodeBtn,
    bellNotif,
    addProject]);

  drawerHeader.appendChild(this.#drawerTool.getElement());

  this.drawerContainer.appendChild(drawerHeader);
  this.drawerContainer.appendChild(this.#treeView.renderTree());
}


  // Setup dialog project baru
  #setupProjectDialog() {
    this.#projectDialog = new CustomDialog(
      {
        title: 'Project Baru',
        placeholder: 'Masukan Nama Project',
      },
      dialogWrap // diasumsikan global
    );

    this.#projectDialog.buttonPositive.button.addEventListener('click', async () => {
      const projectName = this.#projectDialog.input.value.trim();
      if (!projectName) return;

      const newProjectNode = {
        type: 'directory',
        name: projectName,
        path: '/',
        children: [],
      };

      await addProject(newProjectNode);

      this.#projectDialog.show(false);
      await this.#refreshTreeViewFromDb();
    });
  }

  // Refresh tree view dari IndexedDB
  async #refreshTreeViewFromDb() {
    const projects = await getAllProjects();
    // projects.forEach((p) => {
    //   if (p.path !== '/') p.path = '/';
    // });

    const previousTree = this.drawerContainer.querySelector('.tree-view');
    if (previousTree) previousTree.remove();

    const worker = new Worker('treeWorkers.js');

    console.log('%c [TreeView] Mengirim data ke worker:', 'color: #22c55e;', projects);
    
    

    worker.postMessage(projects);

    worker.onmessage = (event) => {
      if (event.data.type === 'log') {
        console.log('%c [Worker LOG]', 'color: #14b8a6;font-weight:500;', event.data.message, event.data.data);
      } else if (event.data.type === 'result') {
        const finalTreeData = event.data.data;

        this.#treeView = new TreeView(finalTreeData);
        this.drawerContainer.appendChild(this.#treeView.renderTree());

        window.treeView = this.#treeView;
        window.isTreeViewReady = true;

        window.dispatchEvent(new CustomEvent('treeViewReady', {
          detail: {
            treeView: window.treeView
          }
        }));

        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error('%c [Main] Terjadi error pada worker:', 'color: crimson', err);

      this.#treeView = new TreeView(projects);
      this.drawerContainer.appendChild(this.#treeView.renderTree());
    };
  }
}
  
  class ProjectHome {
    #el = document.createElement('div'); // root utama
    #searchInput;
    #btnClone;
    #btnAdd;
    #ulList;
    
    constructor() {
      // Atur atribut utama
      this.#el.dataset.pageType = 'homepage';
      
      // === Toolbar ===
      const wrap = document.createElement('div');
      const toolbar = document.createElement('div');
      toolbar.className = 'project-toolbar';
      
      this.#searchInput = document.createElement('input');
      this.#searchInput.type = 'text';
      this.#searchInput.className = 'project-search-input';
      this.#searchInput.placeholder = 'Cari Nama Proyek';
      this.#searchInput.autocapitalize = 'off';
      this.#searchInput.autocomplete = 'off';
      this.#searchInput.autocorrect = 'off';
      this.#searchInput.spellcheck = false;
      
      this.#btnClone = document.createElement('button');
      this.#btnClone.className = 'btn toolbar-cln-repo';
      this.#btnClone.innerHTML = `<i class="codicon codicon-repo-clone"></i>`;
      
      this.#btnAdd = document.createElement('button');
      this.#btnAdd.className = 'btn toolbar-add-project';
      this.#btnAdd.innerHTML = `<i class="codicon codicon-add"></i>`;
      this.#btnAdd.addEventListener('click', () => {});
      toolbar.append(this.#searchInput, this.#btnClone, this.#btnAdd);
      wrap.appendChild(toolbar);
      this.#el.appendChild(wrap);
      
      // === Project List ===
      const nav = document.createElement('nav');
      nav.className = 'project-list';
      
      this.#ulList = document.createElement('ul');
      this.#ulList.className = 'unstyle';
      
      nav.appendChild(this.#ulList);
      this.#el.appendChild(nav);
      
      // Tambah contoh item
    }
    
    // Method untuk menambah item ke list
    addItem(name, date, id) {
      const li = document.createElement('li');
      li.className = 'project-list-item';
      li.dataset.projectId = id;
      
      const img = document.createElement('div');
      img.className = 'meta-img';
      
      const info = document.createElement('div');
      info.className = 'project-info';
      
      const title = document.createElement('div');
      title.className = 'project-name';
      title.textContent = name;
      
      const meta = document.createElement('div');
      meta.className = 'project-meta-desc';
      meta.innerHTML = `
    <span class="timestamp">
      <span class="timestamp-label">
        Dibuat pada:
        <time datetime="${date}" pubdate="${date}">${date}</time>
      </span>
    </span>
  `;
      
      info.append(title, meta);
      li.append(img, info);
      this.#ulList.appendChild(li);
      
      // ✅ Tambahkan listener klik
      li.addEventListener('click', () => {});
    }
    
    
    
    // Getter elemen utama
    get el() {
      return this.#el;
    }
    
    
  }
  
  const OVERLAY_DRAWER = document.createElement('div');
  OVERLAY_DRAWER.id = 'overlay-drawer';
  
  document.body.insertAdjacentElement('afterend', OVERLAY_DRAWER);
  class ActionBar extends DocumentFragment {
    constructor() {
      super();
      this.#init();
    }
    
    #init() {
      const wrap = document.createElement('div');
      wrap.className = 'actionBar j';
      
      const item = document.createElement('div');
      item.className = 'action-bar-item';
      
      const btn = document.createElement('span');
      btn.role = 'button';
      btn.className = 'toggler';
      
      btn.addEventListener('click', () => {
        const drawer = document.getElementById('explorer');
        const overlay = document.getElementById('overlay-drawer');
        
        drawer.classList.add('show');
        overlay.classList.add('show');
        
        if (overlay.classList.contains('show')) {
          overlay.addEventListener(
            'click',
            function() {
              this.classList.remove('show');
              drawer.classList.remove('show');
            }, {
              once: true
            },
          ); // tambahkan `once` agar event tidak numpuk
        }
      });
      
      const icon = document.createElement('i');
      icon.className = 'bi bi-list';
      btn.appendChild(icon);
      
      item.appendChild(btn);
      wrap.appendChild(item);
      this.appendChild(wrap);
    }
  }
  
  // Tabs VSCode Style - Vanilla JS
  // Pastikan sudah ada <nav class="nav-scroller"></nav> di HTML
  
  class VSCodexTabs {
    constructor(navSelector = '.nav-scroller') {
      this.nav = document.querySelector(navSelector);
      this.tabs = [];
      this.activePath = null;
      this.initDnD();
    }
    
    addTab({
      name,
      path
    }) {
      // Cegah duplikat tab
      if (this.tabs.find((tab) => tab.path === path)) return;
      this.tabs.push({
        name,
        path
      });
      this.render();
      this.setActive(path);
    }
    
    removeTab(path) {
      this.tabs = this.tabs.filter((tab) => tab.path !== path);
      if (this.activePath === path) {
        this.activePath = this.tabs.length ? this.tabs[0].path : null;
      }
      this.render();
    }
    
    setActive(path) {
      this.activePath = path;
      this.render();
      // Trigger event (opsional)
      this.nav.dispatchEvent(new CustomEvent('tab-changed', {
        detail: {
          path
        }
      }));
    }
    
    render() {
      this.nav.innerHTML = '';
      this.tabs.forEach((tab) => {
        const span = document.createElement('span');
        span.className = 'nav-link-button vscode-tab';
        if (tab.path === this.activePath) span.classList.add('active');
        span.textContent = tab.name;
        span.setAttribute('data-path', tab.path);
        span.setAttribute('draggable', 'true');
        
        // Close Button
        const btnClose = document.createElement('button');
        btnClose.className = 'tab-close-btn';
        btnClose.innerHTML = '<i class="codicon codicon-close"></i>';
        btnClose.onclick = (e) => {
          e.stopPropagation();
          this.removeTab(tab.path);
        };
        span.appendChild(btnClose);
        
        // Click tab: set active
        span.onclick = (e) => {
          if (e.target !== btnClose) this.setActive(tab.path);
        };
        
        // Drag & Drop event
        span.addEventListener('dragstart', (e) => this.onDragStart(e, tab.path));
        span.addEventListener('dragover', (e) => e.preventDefault());
        span.addEventListener('drop', (e) => this.onDrop(e, tab.path));
        
        this.nav.appendChild(span);
      });
    }
    
    // --- Drag & Drop Logic ---
    initDnD() {
      this.draggedPath = null;
    }
    onDragStart(e, path) {
      this.draggedPath = path;
      e.dataTransfer.effectAllowed = 'move';
    }
    onDrop(e, targetPath) {
      if (this.draggedPath === targetPath) return;
      const fromIdx = this.tabs.findIndex((t) => t.path === this.draggedPath);
      const toIdx = this.tabs.findIndex((t) => t.path === targetPath);
      if (fromIdx >= 0 && toIdx >= 0) {
        const [removed] = this.tabs.splice(fromIdx, 1);
        this.tabs.splice(toIdx, 0, removed);
        this.render();
      }
      this.draggedPath = null;
    }
  }
  

//Plugins
// Namespace utama
window.IcodexEditor = window.IcodexEditor || {};
IcodexEditor.plugins = IcodexEditor.plugins || {};

/**
 * Loader plugin secara manual dari array
 * Mirip seperti modular system (tanpa manifest.json)
 */
IcodexEditor.loadPlugins = async function (list = [], basePath = '/plugins') {
  for (const file of list) {
    const script = document.createElement('script');
    script.src = `${basePath}/${file}`;
    script.type = 'text/javascript';
    script.onload = () => {
      console.log(`[PluginLoader] Berhasil load: ${file}`);
    };
    script.onerror = () => {
      console.error(`[PluginLoader] Gagal load: ${file}`);
    };
    document.head.appendChild(script);
  }
};





  document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const drawer = new Drawer();
    
    app.appendChild(drawer.drawerContainer);
    const actionBar = new ActionBar();
    
    app.appendChild(actionBar);
    const homepage = new ProjectHome();
    app.appendChild(homepage.el);
    homepage.addItem('App', '21 jan 2023');
    await loadOpenTabs();
    
    
    IcodexEditor.loadPlugins([
      'Clipboard.js',
    
     ]);
     
     function updateVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', updateVh);
window.addEventListener('orientationchange', updateVh);
updateVh(); // panggil saat awal

  });
})();
console.log(IcodexEditor.plugins)
//# sourceMappingURL=bundle.js.map
