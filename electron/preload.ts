import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: () => ipcRenderer.invoke('platform'),
  executeAction: (action: any) => ipcRenderer.invoke('execute-action', action),
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electron?: {
      platform: () => Promise<string>;
      executeAction: (action: any) => Promise<any>;
    };
  }
}



