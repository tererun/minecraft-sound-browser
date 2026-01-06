import { useState, useEffect, useRef } from 'react'
import { useAppStore, type SoundEventItem, type SoundVariant } from '../store/appStore'
import { useAudioPlayer } from '../hooks/useAudioPlayer'

interface SoundItemProps {
  event: SoundEventItem
}

export default function SoundItem({ event }: SoundItemProps) {
  const { expandedItems, toggleExpanded } = useAppStore()
  const isExpanded = expandedItems.has(event.id)

  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => toggleExpanded(event.id)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors text-left"
      >
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <div className="flex-1 min-w-0">
          <div className="text-white truncate">{event.displayName}</div>
          <div className="text-xs text-neutral-500 truncate">{event.id}</div>
        </div>

        <span className="text-xs text-neutral-500 bg-neutral-700 px-2 py-1 rounded">
          {event.sounds.length}
        </span>
      </button>

      {isExpanded && (
        <div className="bg-neutral-850 pl-8">
          {event.sounds.map((sound) => (
            <SoundVariantRow
              key={`${event.id}-${sound.hash}`}
              variant={sound}
              eventId={event.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SoundVariantRowProps {
  variant: SoundVariant
  eventId: string
}

function SoundVariantRow({ variant, eventId }: SoundVariantRowProps) {
  const { play, stop, isPlaying } = useAudioPlayer()
  const { settings } = useAppStore()
  const soundId = `${eventId}-${variant.hash}`
  const playing = isPlaying(soundId)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [tempFilePath, setTempFilePath] = useState<string | null>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const fileName = `${eventId.replace(/\./g, '_')}_${variant.name}.ogg`

  // ファイルを事前に準備
  useEffect(() => {
    window.electronAPI.drag.prepare({
      originalPath: variant.absolutePath,
      targetFileName: fileName
    }).then(path => setTempFilePath(path))
  }, [variant.absolutePath, fileName])

  // 公式ドキュメントに従い、ondragstartを直接代入
  useEffect(() => {
    const el = dragRef.current
    if (!el || !tempFilePath) return

    el.ondragstart = (event) => {
      event.preventDefault()
      window.electronAPI.drag.start(tempFilePath)
    }

    return () => {
      el.ondragstart = null
    }
  }, [tempFilePath])



  const handlePlay = () => {
    if (playing) {
      stop()
    } else {
      play(variant.absolutePath, soundId)
    }
  }

  const handleExport = async () => {
    if (!settings.exportDir) {
      alert('設定からエクスポート先フォルダを指定してください')
      return
    }

    const result = await window.electronAPI.file.export({
      originalPath: variant.absolutePath,
      fileName,
      exportDir: settings.exportDir
    })

    if (result.success) {
      setExportStatus('success')
      setTimeout(() => setExportStatus('idle'), 2000)
    } else {
      setExportStatus('error')
      console.error('Export failed:', result.error)
      setTimeout(() => setExportStatus('idle'), 2000)
    }
  }

  return (
    <div
      ref={dragRef}
      draggable="true"
      onClick={handlePlay}
      className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-700 transition-colors cursor-grab"
      style={{ opacity: tempFilePath ? 1 : 0.5 }}
    >
      <div
        className={`p-1.5 rounded-full transition-colors ${
          playing ? 'bg-green-600 text-white' : 'bg-neutral-600 text-neutral-300'
        }`}
      >
        {playing ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>

      <span className="flex-1 text-sm text-neutral-300 truncate">
        {variant.name}
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); handleExport() }}
        className={`p-1.5 rounded transition-colors ${
          exportStatus === 'success' 
            ? 'bg-green-600 text-white' 
            : exportStatus === 'error'
            ? 'bg-red-600 text-white'
            : 'hover:bg-neutral-600 text-neutral-400'
        }`}
        title="エクスポート"
      >
        {exportStatus === 'success' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : exportStatus === 'error' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        )}
      </button>
    </div>
  )
}
