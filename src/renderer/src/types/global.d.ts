export interface Settings {
  assetIndexPath: string
  objectsDir: string
  soundsJsonPath: string
  languageJsonPath: string
  exportDir: string
}

export interface SoundVariant {
  name: string
  hash: string
  absolutePath: string
}

export interface SoundEventItem {
  id: string
  displayName: string
  category: string
  sounds: SoundVariant[]
}

interface ElectronAPI {
  settings: {
    load: () => Promise<Settings>
    save: (settings: Settings) => Promise<boolean>
  }
  dialog: {
    openFile: (options?: { filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>
    openDirectory: () => Promise<string | null>
  }
  data: {
    index: (settings: Settings) => Promise<SoundEventItem[]>
  }
  audio: {
    load: (filePath: string) => Promise<string | null>
  }
  drag: {
    prepare: (payload: { originalPath: string; targetFileName: string }) => Promise<string | null>
    start: (filePath: string) => void
  }
  file: {
    showInFinder: (filePath: string) => Promise<boolean>
    export: (payload: { originalPath: string; fileName: string; exportDir: string }) => Promise<{ success: boolean; path?: string; error?: string }>
    openExportDir: (exportDir: string) => Promise<boolean>
  }
  minecraft: {
    getIndexFiles: (minecraftDir: string) => Promise<string[]>
    resolveSettings: (payload: { minecraftDir: string; indexName: string }) => Promise<{
      assetIndexPath: string
      objectsDir: string
      soundsJsonPath: string | null
      languageJsonPath: string | null
    } | null>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
