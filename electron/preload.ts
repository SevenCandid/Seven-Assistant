import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: () => ipcRenderer.invoke('platform'),
  executeAction: (action: any) => ipcRenderer.invoke('execute-action', action),
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowMaximized: (callback: () => void) => {
    ipcRenderer.on('window-maximized', callback);
  },
  onWindowUnmaximized: (callback: () => void) => {
    ipcRenderer.on('window-unmaximized', callback);
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electron?: {
      platform: () => Promise<string>;
      executeAction: (action: any) => Promise<any>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      isMaximized: () => Promise<boolean>;
      onWindowMaximized: (callback: () => void) => void;
      onWindowUnmaximized: (callback: () => void) => void;
    };
  }
}



