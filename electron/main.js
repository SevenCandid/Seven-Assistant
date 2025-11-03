const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

const createWindow = () => {
  // Use circular SEVEN logo from public folder
  const iconPath = path.join(__dirname, '../public/favicon-circle.svg');
  // For Electron, we need .ico or .png - convert SVG path or use alternative
  // Try multiple formats for cross-platform compatibility
  const iconPaths = [
    path.join(__dirname, '../public/favicon-circle.svg'),
    path.join(__dirname, '../public/favicon.ico'),
    path.join(__dirname, '../public/favicon.svg'),
  ];
  
  let icon = undefined;
  for (const iconPath of iconPaths) {
    if (fs.existsSync(iconPath)) {
      icon = iconPath;
      console.log('Using icon:', iconPath);
      break;
    }
  }

  // Get preload script path
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);
  console.log('Preload script exists:', fs.existsSync(preloadPath));
  
  // Get screen dimensions for responsive sizing
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Responsive window sizing for smaller screens
  // Default size: 1000x700, but adapt to smaller screens
  let windowWidth = 1000;
  let windowHeight = 700;
  let minWidth = 640;
  let minHeight = 480;
  
  // For smaller screens (like 1366x768 or smaller laptops)
  if (screenWidth < 1400) {
    windowWidth = Math.min(900, screenWidth - 40); // Leave 20px margin on each side
    windowHeight = Math.min(650, screenHeight - 60); // Leave space for taskbar
  }
  
  // For very small screens (like 1280x720)
  if (screenWidth < 1300) {
    windowWidth = Math.min(800, screenWidth - 40);
    windowHeight = Math.min(600, screenHeight - 60);
    minWidth = 480; // Allow even smaller minimum for very constrained screens
    minHeight = 400;
  }
  
  // Ensure window doesn't exceed screen bounds
  windowWidth = Math.min(windowWidth, screenWidth - 40);
  windowHeight = Math.min(windowHeight, screenHeight - 60);
  
  console.log(`Screen size: ${screenWidth}x${screenHeight}, Window size: ${windowWidth}x${windowHeight}`);
  
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: minWidth,
    minHeight: minHeight,
    title: 'SEVEN',
    backgroundColor: '#0a0a15', // Dark background matching Jarvis theme
    frame: false, // Frameless window
    show: false,
    icon: icon, // Set icon if exists
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hidden', // Hide default title bar
    titleBarOverlay: false,
    resizable: true,
  });

  // Load the app
  const isDev = !app.isPackaged;
  console.log('Running in dev mode:', isDev);
  
  // Handle navigation errors first
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, 'Error:', errorCode, errorDescription);
    
    // If in dev mode and dev server fails, wait a bit and retry
    if (isDev && validatedURL.includes('localhost:5173')) {
      console.log('Waiting 3 seconds for dev server to be ready, then retrying...');
      setTimeout(() => {
        console.log('Retrying to load http://localhost:5173');
        mainWindow?.loadURL('http://localhost:5173');
      }, 3000);
    }
  });

  // Log when page loads successfully
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully!');
  });

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer ${level}]:`, message);
  });
  
  // Try to load from dev server first (if running in dev mode)
  if (isDev) {
    console.log('Attempting to load from http://localhost:5173');
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    
    // Open dev tools in development mode to see any errors
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from dist folder
    const distPath = path.join(__dirname, '../dist/index.html');
    console.log('Production: Loading from', distPath);
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      console.error('Production build: dist/index.html not found at', distPath);
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Window controls
  ipcMain.on('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
      console.log('Window minimized');
    }
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        console.log('Window unmaximized');
      } else {
        mainWindow.maximize();
        console.log('Window maximized');
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) {
      console.log('Closing window');
      mainWindow.close();
    }
  });
  
  // Check if window is maximized
  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
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
ipcMain.handle('ping', () => 'pong from Electron');

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

