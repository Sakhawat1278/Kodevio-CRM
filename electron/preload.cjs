const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    const handler = (_event, isMax) => callback(isMax);
    ipcRenderer.on('window-maximize-change', handler);
    return () => ipcRenderer.removeListener('window-maximize-change', handler);
  },
  onTriggerSync: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('trigger-sync', handler);
    return () => ipcRenderer.removeListener('trigger-sync', handler);
  },
  openExternal: (url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      shell.openExternal(url);
    }
  },
  showNotification: (options) => ipcRenderer.send('show-notification', options),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
