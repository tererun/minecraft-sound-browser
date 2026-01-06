import { useState, useEffect, useRef } from 'react'

interface AutoSizerProps {
  children: (size: { height: number; width: number }) => React.ReactNode
}

export default function AutoSizer({ children }: AutoSizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ height: 0, width: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          height: entry.contentRect.height,
          width: entry.contentRect.width
        })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.height > 0 && size.width > 0 && children(size)}
    </div>
  )
}
