import { create } from 'zustand'

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

interface AppState {
  settings: Settings
  soundEvents: SoundEventItem[]
  filteredEvents: SoundEventItem[]
  searchQuery: string
  selectedCategory: string | null
  categories: string[]
  isLoading: boolean
  error: string | null
  expandedItems: Set<string>
  currentlyPlaying: string | null

  loadSettings: () => Promise<void>
  saveSettings: (settings: Settings) => Promise<void>
  loadSoundData: () => Promise<void>
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void
  toggleExpanded: (id: string) => void
  setCurrentlyPlaying: (id: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: {
    assetIndexPath: '',
    objectsDir: '',
    soundsJsonPath: '',
    languageJsonPath: '',
    exportDir: ''
  },
  soundEvents: [],
  filteredEvents: [],
  searchQuery: '',
  selectedCategory: null,
  categories: [],
  isLoading: false,
  error: null,
  expandedItems: new Set(),
  currentlyPlaying: null,

  loadSettings: async () => {
    try {
      const settings = await window.electronAPI.settings.load()
      set({ settings })
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  },

  saveSettings: async (settings: Settings) => {
    try {
      await window.electronAPI.settings.save(settings)
      set({ settings })
      await get().loadSoundData()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  },

  loadSoundData: async () => {
    const { settings } = get()

    if (!settings.assetIndexPath || !settings.objectsDir || !settings.soundsJsonPath) {
      set({ soundEvents: [], filteredEvents: [], categories: [] })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const soundEvents = await window.electronAPI.data.index(settings)
      const categories = [...new Set(soundEvents.map((e: SoundEventItem) => e.category))].sort() as string[]

      set({
        soundEvents,
        filteredEvents: soundEvents,
        categories,
        isLoading: false
      })
    } catch (error) {
      set({
        error: 'サウンドデータの読み込みに失敗しました',
        isLoading: false
      })
    }
  },

  setSearchQuery: (query: string) => {
    const { soundEvents, selectedCategory } = get()
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0)

    const filtered = soundEvents.filter(event => {
      const matchesCategory = !selectedCategory || event.category === selectedCategory
      const matchesSearch = keywords.length === 0 || keywords.every(keyword =>
        event.displayName.toLowerCase().includes(keyword) ||
        event.id.toLowerCase().includes(keyword)
      )

      return matchesCategory && matchesSearch
    })

    set({ searchQuery: query, filteredEvents: filtered })
  },

  setSelectedCategory: (category: string | null) => {
    const { soundEvents, searchQuery } = get()
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0)

    const filtered = soundEvents.filter(event => {
      const matchesCategory = !category || event.category === category
      const matchesSearch = keywords.length === 0 || keywords.every(keyword =>
        event.displayName.toLowerCase().includes(keyword) ||
        event.id.toLowerCase().includes(keyword)
      )

      return matchesCategory && matchesSearch
    })

    set({ selectedCategory: category, filteredEvents: filtered })
  },

  toggleExpanded: (id: string) => {
    const { expandedItems } = get()
    const newExpanded = new Set(expandedItems)

    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }

    set({ expandedItems: newExpanded })
  },

  setCurrentlyPlaying: (id: string | null) => {
    set({ currentlyPlaying: id })
  }
}))
