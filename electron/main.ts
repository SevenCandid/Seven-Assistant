import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Get icon path - try seven_ico.png first, then fallback options
  let iconPath: string | undefined;
  const iconOptions = [
    path.join(__dirname, '../public/seven_ico.png'),
    path.join(__dirname, '../public/seven_logo.png'),
    path.join(__dirname, '../public/favicon.ico'),
  ];
  
  for (const iconOption of iconOptions) {
    if (fs.existsSync(iconOption)) {
      iconPath = iconOption;
      console.log('✅ Using Electron icon:', iconPath);
      break;
    }
  }
  
  if (!iconPath) {
    console.warn('⚠️ No icon found for Electron app');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath, // Set app icon
    frame: false, // Frameless window for custom title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Allow network requests for speech recognition API
      webSecurity: true, // Keep security enabled but allow speech API
      allowRunningInsecureContent: false,
    },
    backgroundColor: '#0ea5e9',
    show: false,
  });
  
  // Configure network permissions for speech recognition
  const session = mainWindow.webContents.session;
  
  // Allow requests to Google's speech recognition services
  session.webRequest.onBeforeRequest(
    (details, callback) => {
      // Always allow requests (don't cancel any)
      callback({ cancel: false });
    }
  );
  
  // Note: Don't modify response headers for Google APIs - this can interfere with CORS
  // The browser handles CORS automatically. Just ensure requests aren't blocked.
  
  // Set permission handler to allow microphone access
  session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Allow microphone permission for speech recognition
    if (permission === 'media' || permission === 'microphone') {
      callback(true);
    } else {
      callback(false);
    }
  });
  
  // Set permission check handler
  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    // Allow microphone permission for speech recognition
    if (permission === 'media' || permission === 'microphone') {
      return true;
    }
    return false;
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

  // Listen for maximize/unmaximize events to notify renderer
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

// IPC handlers for window controls
ipcMain.on('window-minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.close();
  }
});

// Handle request for maximized state
ipcMain.handle('window-is-maximized', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return window ? window.isMaximized() : false;
});



