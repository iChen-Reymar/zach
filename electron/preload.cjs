const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  readDatabase: () => ipcRenderer.invoke('db:read'),
  writeDatabase: (data) => ipcRenderer.invoke('db:write', data),
  getDatabasePath: () => ipcRenderer.invoke('db:path')
})
