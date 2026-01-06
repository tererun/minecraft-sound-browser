const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings)
  },
  dialog: {
    openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options || {}),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory')
  },
  data: {
    index: (settings: any) => ipcRenderer.invoke('data:index', settings)
  },
  audio: {
    load: (filePath: string) => ipcRenderer.invoke('audio:load', filePath)
  },
  drag: {
    prepare: (payload: { originalPath: string; targetFileName: string }): Promise<string | null> =>
      ipcRenderer.invoke('drag:prepare', payload),
    start: (filePath: string) => ipcRenderer.send('ondragstart', filePath)
  },
  file: {
    showInFinder: (filePath: string): Promise<boolean> => ipcRenderer.invoke('file:showInFinder', filePath),
    export: (payload: { originalPath: string; fileName: string; exportDir: string }): Promise<{ success: boolean; path?: string; error?: string }> =>
      ipcRenderer.invoke('file:export', payload),
    openExportDir: (exportDir: string): Promise<boolean> => ipcRenderer.invoke('file:openExportDir', exportDir)
  },
  minecraft: {
    getIndexFiles: (minecraftDir: string): Promise<string[]> => 
      ipcRenderer.invoke('minecraft:getIndexFiles', minecraftDir),
    resolveSettings: (payload: { minecraftDir: string; indexName: string }): Promise<{
      assetIndexPath: string
      objectsDir: string
      soundsJsonPath: string | null
      languageJsonPath: string | null
    } | null> => ipcRenderer.invoke('minecraft:resolveSettings', payload)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
