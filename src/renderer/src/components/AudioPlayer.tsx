import { useEffect, useState, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { useAppStore } from '../store/appStore'

export default function AudioPlayer() {
  const { currentlyPlaying, setCurrentlyPlaying } = useAppStore()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const howlRef = useRef<Howl | null>(null)
  const animationRef = useRef<number | null>(null)

  const updateProgress = useCallback(() => {
    if (howlRef.current && howlRef.current.playing()) {
      setCurrentTime(howlRef.current.seek() as number)
      animationRef.current = requestAnimationFrame(updateProgress)
    }
  }, [])

  useEffect(() => {
    const handlePlay = (e: CustomEvent<{ filePath: string; id: string }>) => {
      const { filePath, id } = e.detail

      if (howlRef.current) {
        howlRef.current.stop()
        howlRef.current.unload()
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      window.electronAPI.audio.load(filePath).then((dataUrl) => {
        if (!dataUrl) return

        const currentVolume = howlRef.current?.volume() ?? 1
        const sound = new Howl({
          src: [dataUrl],
          format: ['ogg'],
          volume: currentVolume,
          onload: () => {
            setDuration(sound.duration())
          },
          onplay: () => {
            setIsPlaying(true)
            updateProgress()
          },
          onpause: () => {
            setIsPlaying(false)
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current)
            }
          },
          onstop: () => {
            setIsPlaying(false)
            setCurrentTime(0)
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current)
            }
          },
          onend: () => {
            setIsPlaying(false)
            setCurrentTime(0)
            setCurrentlyPlaying(null)
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current)
            }
          }
        })

        howlRef.current = sound
        sound.play()
        setCurrentlyPlaying(id)
      })
    }

    const handleStopEvent = () => {
      if (howlRef.current) {
        howlRef.current.stop()
        howlRef.current.unload()
        howlRef.current = null
      }
      setCurrentlyPlaying(null)
      setCurrentTime(0)
      setDuration(0)
    }

    window.addEventListener('audio:play', handlePlay as EventListener)
    window.addEventListener('audio:stop', handleStopEvent)
    return () => {
      window.removeEventListener('audio:play', handlePlay as EventListener)
      window.removeEventListener('audio:stop', handleStopEvent)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [setCurrentlyPlaying, updateProgress])

  const handlePlayPause = () => {
    if (!howlRef.current) return

    if (isPlaying) {
      howlRef.current.pause()
    } else {
      howlRef.current.play()
    }
  }

  const handleStop = () => {
    if (howlRef.current) {
      howlRef.current.stop()
      howlRef.current.unload()
      howlRef.current = null
    }
    setCurrentlyPlaying(null)
    setCurrentTime(0)
    setDuration(0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (howlRef.current) {
      howlRef.current.seek(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (howlRef.current) {
      howlRef.current.volume(newVolume)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const displayName = currentlyPlaying ? currentlyPlaying.split('-')[0] : '---'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 px-4 py-3 z-50">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        <button
          onClick={handlePlayPause}
          className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={handleStop}
          className="p-2 hover:bg-neutral-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-neutral-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-xs text-neutral-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        <div className="text-sm text-neutral-300 truncate max-w-48">
          {displayName}
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
            {volume === 0 ? (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            ) : volume < 0.5 ? (
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            )}
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
