/* ══════════════════════════════════════════
   Quick Notes — Renderer
   ══════════════════════════════════════════ */

const COLORS = [
  { name: 'Blue',    hex: '#005fb8' },
  { name: 'Teal',    hex: '#0e8a7b' },
  { name: 'Green',   hex: '#107c10' },
  { name: 'Yellow',  hex: '#d48c00' },
  { name: 'Orange',  hex: '#c24e00' },
  { name: 'Red',     hex: '#c42b1c' },
  { name: 'Pink',    hex: '#bf4080' },
  { name: 'Purple',  hex: '#7160e8' },
];

let notes = [];
let editingId = null;

/* ── Preferences ── */
let currentTheme = localStorage.getItem('qn-theme') || 'light';

/* ── DOM ── */
const body        = document.body;
const grid        = document.getElementById('notes-grid');
const emptyState  = document.getElementById('empty-state');
const searchInput = document.getElementById('search');
const overlay     = document.getElementById('modal-overlay');
const modalTitle  = document.getElementById('modal-title');
const modalContent= document.getElementById('modal-content');
const colorPicker = document.getElementById('color-picker');
const winMaxBtn   = document.getElementById('win-max');

/* ── SVG Icons ── */
const ICONS = {
  sun: `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,
  moon: `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
  pin: `<path d="M12 2L12 10M8 10H16L14.5 16H9.5L8 10ZM10 16L9 22M14 16L15 22"/>`,
  maximize: `<rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/>`,
  restore: `<rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/><rect x="0" y="2" width="8" height="8" fill="var(--surface, #fff)" stroke="currentColor" stroke-width="1"/>`,
};

/* ── Helpers ── */
const _escEl = document.createElement('div');
function esc(str) {
  _escEl.textContent = str;
  return _escEl.innerHTML;
}

let _searchTimer = null;
function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => fn(...args), ms);
  };
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ── Init ── */
async function init() {
  applyTheme();
  buildColorPicker();
  notes = await window.api.loadNotes();
  render();
  bindEvents();
}

/* ── Theme ── */
function applyTheme() {
  body.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
  localStorage.setItem('qn-theme', currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme();
}

function updateThemeIcon() {
  document.getElementById('icon-theme').innerHTML = currentTheme === 'light' ? ICONS.moon : ICONS.sun;
}

/* ── Maximize icon ── */
function updateMaximizeIcon(isMaximized) {
  winMaxBtn.querySelector('svg').innerHTML = isMaximized ? ICONS.restore : ICONS.maximize;
  winMaxBtn.title = isMaximized ? 'Restore' : 'Maximize';
}

/* ── Render ── */
function render(filter = '') {
  const query = filter.toLowerCase().trim();
  const filtered = notes
    .filter(n => !query || n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  emptyState.classList.toggle('hidden', filtered.length > 0 || !!query);

  const frag = document.createDocumentFragment();

  for (const note of filtered) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.setProperty('--note-color', note.color || COLORS[0].hex);
    card.dataset.id = note.id;

    card.innerHTML = `
      <button class="note-pin ${note.pinned ? 'pinned' : ''}" data-pin="${note.id}" title="Pin note">
        <svg viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">${ICONS.pin}</svg>
      </button>
      <div class="note-title">${esc(note.title || 'Untitled')}</div>
      <div class="note-preview">${esc(note.content || '')}</div>
      <div class="note-date">${dateFormatter.format(new Date(note.updatedAt))}</div>
    `;

    frag.appendChild(card);
  }

  grid.innerHTML = '';
  grid.appendChild(frag);
}

/* ── Color Picker ── */
function buildColorPicker() {
  const frag = document.createDocumentFragment();
  for (const c of COLORS) {
    const dot = document.createElement('button');
    dot.className = 'color-dot';
    dot.style.background = c.hex;
    dot.dataset.color = c.hex;
    dot.title = c.name;
    frag.appendChild(dot);
  }
  colorPicker.innerHTML = '';
  colorPicker.appendChild(frag);
}

/* ── Modal ── */
function openModal(id = null) {
  editingId = id;
  const note = id ? notes.find(n => n.id === id) : null;

  modalTitle.value = note?.title || '';
  modalContent.value = note?.content || '';

  const color = note?.color || COLORS[0].hex;
  for (const d of colorPicker.querySelectorAll('.color-dot')) {
    d.classList.toggle('active', d.dataset.color === color);
  }

  document.getElementById('modal-delete').classList.toggle('hidden', !id);
  overlay.classList.remove('hidden');
  modalTitle.focus();
}

function closeModal() {
  overlay.classList.add('hidden');
  editingId = null;
}

function getSelectedColor() {
  const active = colorPicker.querySelector('.color-dot.active');
  return active ? active.dataset.color : COLORS[0].hex;
}

async function saveNote() {
  const title = modalTitle.value.trim();
  const content = modalContent.value.trim();
  if (!title && !content) { closeModal(); return; }

  const now = Date.now();

  if (editingId) {
    const note = notes.find(n => n.id === editingId);
    if (note) {
      note.title = title;
      note.content = content;
      note.color = getSelectedColor();
      note.updatedAt = now;
    }
  } else {
    notes.push({
      id: crypto.randomUUID(),
      title: title || 'Untitled',
      content,
      color: getSelectedColor(),
      pinned: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  await window.api.saveNotes(notes);
  closeModal();
  render(searchInput.value);
}

async function deleteNote() {
  if (!editingId) return;
  notes = notes.filter(n => n.id !== editingId);
  await window.api.saveNotes(notes);
  closeModal();
  render(searchInput.value);
}

async function togglePin(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    await window.api.saveNotes(notes);
    render(searchInput.value);
  }
}

/* ── Events ── */
function bindEvents() {
  // Windows titlebar
  document.getElementById('win-min').addEventListener('click', () => window.api.minimize());
  winMaxBtn.addEventListener('click', () => window.api.maximize());
  document.getElementById('win-close').addEventListener('click', () => window.api.close());

  // Maximize state sync
  window.api.isMaximized().then(updateMaximizeIcon);
  window.api.onMaximizeChange(updateMaximizeIcon);

  // Toolbar
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);

  const debouncedSearch = debounce(() => render(searchInput.value), 120);
  searchInput.addEventListener('input', debouncedSearch);

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveNote);
  document.getElementById('modal-delete').addEventListener('click', deleteNote);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // Color picker (delegated)
  colorPicker.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (!dot) return;
    for (const d of colorPicker.querySelectorAll('.color-dot')) d.classList.remove('active');
    dot.classList.add('active');
  });

  // Pin (delegated)
  grid.addEventListener('click', (e) => {
    const pinBtn = e.target.closest('.note-pin');
    if (pinBtn) { e.stopPropagation(); togglePin(pinBtn.dataset.pin); return; }
    const card = e.target.closest('.note-card');
    if (card) openModal(card.dataset.id);
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveNote();
  });

  // IPC
  window.api.onNewNote(() => openModal());
}

/* ── Start ── */
init();
