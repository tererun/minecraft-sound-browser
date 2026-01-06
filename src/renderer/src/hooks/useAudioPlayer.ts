import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useAudioPlayer() {
  const { currentlyPlaying } = useAppStore()

  const play = useCallback((filePath: string, id: string) => {
    window.dispatchEvent(new CustomEvent('audio:play', {
      detail: { filePath, id }
    }))
  }, [])

  const stop = useCallback(() => {
    window.dispatchEvent(new CustomEvent('audio:stop'))
  }, [])

  const isPlaying = useCallback((id: string) => {
    return currentlyPlaying === id
  }, [currentlyPlaying])

  return { play, stop, isPlaying }
}
