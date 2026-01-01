const { contextBridge, ipcRenderer } = require('electron')

const api = {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Projects
  getProjects: () => ipcRenderer.invoke('projects:getAll'),
  scanDirectory: (dirPath: string) => ipcRenderer.invoke('projects:scan', dirPath),
  addProject: (projectPath: string) => ipcRenderer.invoke('projects:add', projectPath),
  removeProject: (projectId: string) => ipcRenderer.invoke('projects:remove', projectId),
  updateProject: (projectId: string, updates: any) => ipcRenderer.invoke('projects:update', projectId, updates),
  refreshProject: (projectId: string) => ipcRenderer.invoke('projects:refresh', projectId),

  // Tags
  getTags: () => ipcRenderer.invoke('tags:getAll'),
  createTag: (tag: any) => ipcRenderer.invoke('tags:create', tag),
  deleteTag: (tagId: string) => ipcRenderer.invoke('tags:delete', tagId),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories:getAll'),
  createCategory: (category: any) => ipcRenderer.invoke('categories:create', category),

  // Shell operations
  openInVSCode: (projectPath: string) => ipcRenderer.invoke('shell:openInVSCode', projectPath),
  openInTerminal: (projectPath: string) => ipcRenderer.invoke('shell:openInTerminal', projectPath),
  openInExplorer: (projectPath: string) => ipcRenderer.invoke('shell:openInExplorer', projectPath),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings)
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
