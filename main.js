const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(app.getPath('userData'), 'notes.json');
const ICON_PATH = path.join(__dirname, 'assets', 'icon.ico');

let mainWindow = null;
let tray = null;

/* ── Data persistence ── */

function loadNotes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch { /* ignore corrupt file */ }
  return [];
}

function saveNotes(notes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf-8');
}

/* ── Window ── */

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 620,
    minWidth: 480,
    minHeight: 400,
    frame: false,
    backgroundColor: '#f3f3f3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: ICON_PATH,
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Notify renderer of maximize state changes
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized', false);
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ── Tray ── */

function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Quick Notes', click: createWindow },
    {
      label: 'New Note',
      click: () => {
        createWindow();
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow.webContents.send('new-note');
        });
        // If already loaded, send immediately
        if (!mainWindow.webContents.isLoading()) {
          mainWindow.webContents.send('new-note');
        }
      },
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip('Quick Notes');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', createWindow);
}

/* ── IPC handlers ── */

ipcMain.handle('notes:load', () => loadNotes());
ipcMain.handle('notes:save', (_e, notes) => { saveNotes(notes); return true; });
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

/* ── App lifecycle ── */

app.whenReady().then(() => {
  createWindow();
  createTray();
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    createWindow();
    if (!mainWindow.webContents.isLoading()) {
      mainWindow.webContents.send('new-note');
    }
  });
});

app.on('window-all-closed', () => { /* keep running in tray */ });
app.on('activate', createWindow);
app.on('before-quit', () => { app.isQuitting = true; });
