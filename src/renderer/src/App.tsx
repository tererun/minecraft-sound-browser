import { useEffect, useState } from 'react'
import { useAppStore } from './store/appStore'
import SearchBar from './components/SearchBar'
import SoundList from './components/SoundList'
import SettingsModal from './components/SettingsModal'
import CategoryFilter from './components/CategoryFilter'
import AudioPlayer from './components/AudioPlayer'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { loadSettings, loadSoundData, isLoading, error, soundEvents, settings } = useAppStore()

  const handleOpenExportDir = async () => {
    if (settings.exportDir) {
      await window.electronAPI.file.openExportDir(settings.exportDir)
    } else {
      setIsSettingsOpen(true)
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadSettings()
      await loadSoundData()
    }
    init()
  }, [loadSettings, loadSoundData])

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header with drag region */}
      <header
        className="flex items-center gap-4 px-4 py-3 bg-neutral-800 border-b border-neutral-700"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="w-20" /> {/* Spacer for traffic lights */}
        <h1 className="text-lg font-semibold text-white">Minecraft Sound Browser</h1>
        <div className="flex-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <SearchBar />
        </div>
        <button
          onClick={handleOpenExportDir}
          className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="エクスポートフォルダを開く"
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="設定"
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 bg-neutral-850 border-r border-neutral-700 overflow-y-auto">
          <CategoryFilter />
        </aside>

        {/* Sound list */}
        <main className="flex-1 overflow-hidden">
          {error && (
            <div className="p-4 bg-red-900/50 border-b border-red-700 text-red-200">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-neutral-400">読み込み中...</div>
            </div>
          ) : soundEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <p className="mb-2">サウンドデータがありません</p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                設定を開く
              </button>
            </div>
          ) : (
            <SoundList />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Audio Player */}
      <AudioPlayer />
    </div>
  )
}

export default App
