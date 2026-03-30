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
let currentOS = localStorage.getItem('qn-os') || 'windows';
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

/* ── SVG Icons ── */
const ICONS = {
  // Windows logo (simplified)
  windows: `<path d="M1 3.2L6.6 2.5V7.4H1V3.2ZM7.4 2.4L14.4 1.2V7.4H7.4V2.4ZM1 8.1H6.6V13L1 12.3V8.1ZM7.4 8.1H14.4V14.4L7.4 13.1V8.1Z"/>`,
  // Apple logo (simplified)
  apple: `<path d="M12.2 4.5C11.5 4.5 10.6 5 10.1 5C9.5 5 8.7 4.5 7.9 4.5C6.3 4.6 4.8 5.5 4 7.1C2.3 10.2 3.5 14.8 5.2 17.3C6 18.5 7 19.9 8.3 19.9C9.5 19.8 10 19.1 11.4 19.1C12.9 19.1 13.3 19.9 14.6 19.8C15.9 19.8 16.8 18.5 17.6 17.3C18 16.6 18.3 15.9 18.5 15.5C16.3 14.6 15.9 11.4 18.1 10.1C17.1 8.8 15.6 8.1 14.2 8.1C12.7 8.1 12.2 4.5 12.2 4.5ZM13.6 1C12.9 1.8 11.7 2.5 10.6 2.4C10.4 1.3 11 0.5 11.6 0C12.3 -0.6 13.5 -0.1 13.7 0C13.9 1 13.6 1 13.6 1Z"/>`,
  // Sun
  sun: `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,
  // Moon
  moon: `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
  // Pin
  pin: `<path d="M12 2L12 10M8 10H16L14.5 16H9.5L8 10ZM10 16L9 22M14 16L15 22"/>`,
};

/* ── Init ── */
async function init() {
  notes = await window.api.loadNotes();
  applyTheme();
  buildColorPicker();
  render();
  bindEvents();
}

/* ── Theme & OS ── */
function applyTheme() {
  body.setAttribute('data-os', currentOS);
  body.setAttribute('data-theme', currentTheme);
  updateOSIcon();
  updateThemeIcon();
  localStorage.setItem('qn-os', currentOS);
  localStorage.setItem('qn-theme', currentTheme);
}

function toggleOS() {
  currentOS = currentOS === 'windows' ? 'mac' : 'windows';
  applyTheme();
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme();
}

function updateOSIcon() {
  const el = document.getElementById('icon-os');
  el.innerHTML = currentOS === 'windows' ? ICONS.windows : ICONS.apple;
  el.setAttribute('viewBox', currentOS === 'windows' ? '0 0 15.5 15.5' : '0 0 20 20');
}

function updateThemeIcon() {
  const el = document.getElementById('icon-theme');
  el.innerHTML = currentTheme === 'light' ? ICONS.moon : ICONS.sun;
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

  grid.innerHTML = '';
  emptyState.classList.toggle('hidden', filtered.length > 0 || !!query);

  filtered.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.setProperty('--note-color', note.color || COLORS[0].hex);
    card.dataset.id = note.id;

    const date = new Date(note.updatedAt);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    card.innerHTML = `
      <button class="note-pin ${note.pinned ? 'pinned' : ''}" data-pin="${note.id}" title="Pin note">
        <svg viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">${ICONS.pin}</svg>
      </button>
      <div class="note-title">${esc(note.title || 'Untitled')}</div>
      <div class="note-preview">${esc(note.content || '')}</div>
      <div class="note-date">${dateStr}</div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.note-pin')) return;
      openModal(note.id);
    });

    grid.appendChild(card);
  });
}

/* ── Color Picker ── */
function buildColorPicker() {
  colorPicker.innerHTML = '';
  COLORS.forEach(c => {
    const dot = document.createElement('button');
    dot.className = 'color-dot';
    dot.style.background = c.hex;
    dot.dataset.color = c.hex;
    dot.title = c.name;
    colorPicker.appendChild(dot);
  });
}

/* ── Modal ── */
function openModal(id = null) {
  editingId = id;
  const note = id ? notes.find(n => n.id === id) : null;

  modalTitle.value = note?.title || '';
  modalContent.value = note?.content || '';

  const color = note?.color || COLORS[0].hex;
  colorPicker.querySelectorAll('.color-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.color === color);
  });

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
  document.getElementById('win-max').addEventListener('click', () => window.api.maximize());
  document.getElementById('win-close').addEventListener('click', () => window.api.close());

  // macOS titlebar
  document.getElementById('mac-close').addEventListener('click', () => window.api.close());
  document.getElementById('mac-min').addEventListener('click', () => window.api.minimize());
  document.getElementById('mac-max').addEventListener('click', () => window.api.maximize());

  // Toolbar
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('btn-os').addEventListener('click', toggleOS);
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  searchInput.addEventListener('input', () => render(searchInput.value));

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveNote);
  document.getElementById('modal-delete').addEventListener('click', deleteNote);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // Color picker
  colorPicker.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (!dot) return;
    colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });

  // Pin (delegated)
  grid.addEventListener('click', (e) => {
    const pinBtn = e.target.closest('.note-pin');
    if (pinBtn) { e.stopPropagation(); togglePin(pinBtn.dataset.pin); }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !overlay.classList.contains('hidden')) saveNote();
  });

  // IPC
  window.api.onNewNote(() => openModal());
}

/* ── Helpers ── */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ── Start ── */
init();
