const { contextBridge, ipcRenderer } = require("electron");
const electronAPI = {
  settings: {
    load: () => ipcRenderer.invoke("settings:load"),
    save: (settings) => ipcRenderer.invoke("settings:save", settings)
  },
  dialog: {
    openFile: (options) => ipcRenderer.invoke("dialog:openFile", options || {}),
    openDirectory: () => ipcRenderer.invoke("dialog:openDirectory")
  },
  data: {
    index: (settings) => ipcRenderer.invoke("data:index", settings)
  },
  audio: {
    load: (filePath) => ipcRenderer.invoke("audio:load", filePath)
  },
  drag: {
    prepare: (payload) => ipcRenderer.invoke("drag:prepare", payload),
    start: (filePath) => ipcRenderer.send("ondragstart", filePath)
  },
  file: {
    showInFinder: (filePath) => ipcRenderer.invoke("file:showInFinder", filePath),
    export: (payload) => ipcRenderer.invoke("file:export", payload),
    openExportDir: (exportDir) => ipcRenderer.invoke("file:openExportDir", exportDir)
  },
  minecraft: {
    getIndexFiles: (minecraftDir) => ipcRenderer.invoke("minecraft:getIndexFiles", minecraftDir),
    resolveSettings: (payload) => ipcRenderer.invoke("minecraft:resolveSettings", payload)
  }
};
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
