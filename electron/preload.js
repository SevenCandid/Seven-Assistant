const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Window state listeners
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', callback);
  },
  onWindowUnmaximized: (callback) => {
    ipcRenderer.on('window-unmaximized', callback);
  },
  
  // Check if window is maximized
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});


