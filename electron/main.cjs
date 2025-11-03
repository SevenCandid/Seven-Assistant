const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

const createWindow = () => {
  // Check if icon exists
  const iconPath = path.join(__dirname, '../src/assets/seven-icon.png');
  const iconExists = fs.existsSync(iconPath);
  const icon = iconExists ? iconPath : undefined;

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'SEVEN',
    backgroundColor: '#0a0a15', // Dark background matching Jarvis theme
    frame: false, // Frameless window
    show: false,
    icon: icon, // Set icon if exists
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hidden', // Hide default title bar
    titleBarOverlay: false,
    resizable: true,
  });

  // Load the app
  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Optionally open dev tools in dev mode
    // mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from dist folder
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Window controls
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  // Handle maximize/unmaximize state
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-unmaximized');
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for Electron-specific features
ipcMain.handle('platform', () => {
  return 'electron';
});

ipcMain.handle('execute-action', async (event, action) => {
  try {
    switch (action.type) {
      case 'open-url':
        const { shell } = require('electron');
        await shell.openExternal(action.url);
        return { success: true };
      
      case 'system-info':
        return {
          success: true,
          data: {
            platform: process.platform,
            arch: process.arch,
            version: process.version,
          },
        };
      
      default:
        return { success: false, error: 'Unknown action type' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});



