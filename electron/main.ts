import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#0ea5e9',
    show: false,
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
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
        const { shell } = await import('electron');
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
    return { success: false, error: (error as Error).message };
  }
});



