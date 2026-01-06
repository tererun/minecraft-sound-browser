import { useState, useEffect } from 'react'
import { useAppStore, type Settings } from '../store/appStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsMode = 'simple' | 'advanced'

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, saveSettings } = useAppStore()
  const [localSettings, setLocalSettings] = useState<Settings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [mode, setMode] = useState<SettingsMode>('simple')
  
  // 簡単設定用の状態
  const [minecraftDir, setMinecraftDir] = useState('')
  const [indexFiles, setIndexFiles] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState('')
  const [isLoadingIndexes, setIsLoadingIndexes] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings, isOpen])

  if (!isOpen) return null

  const handleSelectMinecraftDir = async () => {
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      setMinecraftDir(path)
      setSelectedIndex('')
      setResolveError(null)
      setIsLoadingIndexes(true)
      
      const files = await window.electronAPI.minecraft.getIndexFiles(path)
      setIndexFiles(files)
      setIsLoadingIndexes(false)
      
      if (files.length === 0) {
        setResolveError('指定されたフォルダにassets/indexesが見つかりません')
      }
    }
  }

  const handleIndexSelect = async (indexName: string) => {
    setSelectedIndex(indexName)
    setResolveError(null)
    
    if (!indexName) return
    
    const resolved = await window.electronAPI.minecraft.resolveSettings({
      minecraftDir,
      indexName
    })
    
    if (resolved) {
      setLocalSettings(prev => ({
        ...prev,
        assetIndexPath: resolved.assetIndexPath,
        objectsDir: resolved.objectsDir,
        soundsJsonPath: resolved.soundsJsonPath || '',
        languageJsonPath: resolved.languageJsonPath || ''
      }))
      
      if (!resolved.soundsJsonPath) {
        setResolveError('sounds.jsonが見つかりませんでした')
      }
    } else {
      setResolveError('設定の解決に失敗しました')
    }
  }

  const handleSelectFile = async (key: keyof Settings) => {
    const path = await window.electronAPI.dialog.openFile()
    if (path) {
      setLocalSettings(prev => ({ ...prev, [key]: path }))
    }
  }

  const handleSelectDirectory = async (key: 'objectsDir' | 'exportDir') => {
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      setLocalSettings(prev => ({ ...prev, [key]: path }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await saveSettings(localSettings)
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">設定</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* モード切り替えタブ */}
        <div className="flex border-b border-neutral-700 flex-shrink-0">
          <button
            onClick={() => setMode('simple')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'simple'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-neutral-750'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            簡単設定
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'advanced'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-neutral-750'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            詳細設定
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {mode === 'simple' ? (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                  Minecraftフォルダ
                </h3>
                
                <div>
                  <p className="text-xs text-neutral-500 mb-2">
                    .minecraft フォルダを選択してください（通常は ~/Library/Application Support/minecraft）
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={minecraftDir}
                      onChange={(e) => setMinecraftDir(e.target.value)}
                      className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder=".minecraftフォルダのパス"
                    />
                    <button
                      onClick={handleSelectMinecraftDir}
                      className="px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-neutral-200 rounded-lg transition-colors text-sm"
                    >
                      参照...
                    </button>
                  </div>
                </div>

                {indexFiles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      バージョン（Asset Index）
                    </label>
                    <p className="text-xs text-neutral-500 mb-2">
                      使用するMinecraftバージョンのAsset Indexを選択
                    </p>
                    <select
                      value={selectedIndex}
                      onChange={(e) => handleIndexSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">選択してください...</option>
                      {indexFiles.map((file) => (
                        <option key={file} value={file}>
                          {file}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isLoadingIndexes && (
                  <p className="text-sm text-neutral-400">読み込み中...</p>
                )}

                {resolveError && (
                  <p className="text-sm text-red-400">{resolveError}</p>
                )}

                {selectedIndex && localSettings.soundsJsonPath && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                    <p className="text-sm text-green-400">設定が自動解決されました</p>
                    <ul className="text-xs text-green-300/70 mt-1 space-y-0.5">
                      <li>・sounds.json: 検出済み</li>
                      <li>・言語ファイル: {localSettings.languageJsonPath ? '検出済み' : '未検出'}</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                  エクスポート設定
                </h3>
                <PathInput
                  label="エクスポート先フォルダ"
                  description="サウンドファイルの出力先フォルダを指定"
                  value={localSettings.exportDir}
                  onSelect={() => handleSelectDirectory('exportDir')}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, exportDir: value }))}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                  ファイルパス設定
                </h3>

                <PathInput
                  label="Asset Index JSON"
                  description="例: ~/.minecraft/assets/indexes/27.json"
                  value={localSettings.assetIndexPath}
                  onSelect={() => handleSelectFile('assetIndexPath')}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, assetIndexPath: value }))}
                />

                <PathInput
                  label="Objects フォルダ"
                  description="例: ~/.minecraft/assets/objects"
                  value={localSettings.objectsDir}
                  onSelect={() => handleSelectDirectory('objectsDir')}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, objectsDir: value }))}
                />

                <PathInput
                  label="Sounds JSON"
                  description="例: ~/.minecraft/assets/objects/.../sounds.json のハッシュファイル"
                  value={localSettings.soundsJsonPath}
                  onSelect={() => handleSelectFile('soundsJsonPath')}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, soundsJsonPath: value }))}
                />

                <PathInput
                  label="日本語言語ファイル (オプション)"
                  description="例: ja_jp.json のハッシュファイル"
                  value={localSettings.languageJsonPath}
                  onSelect={() => handleSelectFile('languageJsonPath')}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, languageJsonPath: value }))}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                  エクスポート設定
                </h3>

                <PathInput
                  label="エクスポート先フォルダ"
                  description="サウンドファイルの出力先フォルダを指定"
                  value={localSettings.exportDir}
                  onSelect={() => handleSelectDirectory('exportDir')}
                  onChange={(value) => setLocalSettings(prev => ({ ...prev, exportDir: value }))}
                />
              </div>

              <div className="bg-neutral-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-neutral-300 mb-2">ヒント</h4>
                <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                  <li>Minecraft Java Edition のアセットフォルダは通常 <code className="bg-neutral-600 px-1 rounded">~/.minecraft/assets</code> にあります</li>
                  <li>sounds.json と言語ファイルは objects フォルダ内のハッシュファイルです</li>
                  <li>言語ファイルは翻訳表示のために使用されます（なくても動作します）</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-700 bg-neutral-850 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存して読み込み'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface PathInputProps {
  label: string
  description: string
  value: string
  onSelect: () => void
  onChange: (value: string) => void
}

function PathInput({ label, description, value, onSelect, onChange }: PathInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-1">
        {label}
      </label>
      <p className="text-xs text-neutral-500 mb-2">{description}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="パスを入力または選択..."
        />
        <button
          onClick={onSelect}
          className="px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-neutral-200 rounded-lg transition-colors text-sm"
        >
          参照...
        </button>
      </div>
    </div>
  )
}
