import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'

interface Props {
  onOpen: () => void
  hasActivity?: boolean
}

const STORAGE_KEY = 'aui-sidebar-entry-y'
const DEFAULT_BOTTOM = 16
const MIN_TOP = 80
const MIN_BOTTOM = 80

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function AiEntryButton({ onOpen, hasActivity = false }: Props) {
  const [top, setTop] = useState<number | null>(null)
  const dragRef = useRef<{ startY: number; startTop: number; moved: boolean } | null>(null)
  const suppressNextClickRef = useRef(false)

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(saved) && saved > 0) {
      setTop(clamp(saved, MIN_TOP, window.innerHeight - MIN_BOTTOM))
      return
    }
    setTop(Math.max(MIN_TOP, window.innerHeight - 40 - DEFAULT_BOTTOM))
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setTop(prev => {
        const next = clamp(prev ?? window.innerHeight - 40 - DEFAULT_BOTTOM, MIN_TOP, window.innerHeight - MIN_BOTTOM)
        window.localStorage.setItem(STORAGE_KEY, String(next))
        return next
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { startY: event.clientY, startTop: top ?? window.innerHeight - 40 - DEFAULT_BOTTOM, moved: false }
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const delta = event.clientY - drag.startY
    if (Math.abs(delta) > 2) drag.moved = true
    const next = clamp(drag.startTop + delta, MIN_TOP, window.innerHeight - MIN_BOTTOM)
    setTop(next)
    window.localStorage.setItem(STORAGE_KEY, String(next))
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    const wasDrag = dragRef.current?.moved
    dragRef.current = null
    suppressNextClickRef.current = true
    if (!wasDrag) onOpen()
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      event.preventDefault()
      return
    }
    onOpen()
  }

  return (
    <button
      type="button"
      className={`ai-entry-button${hasActivity ? ' ai-entry-button--active' : ''}`}
      style={{ top: top ?? undefined }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      aria-label="打开 AI 助手"
      title="打开 AI 助手"
    >
      <span className="ai-entry-button__logo" aria-hidden="true">
        <img className="ai-entry-button__image" src="/gpt-entry.png" alt="" draggable={false} />
      </span>
      {hasActivity && <span className="ai-entry-button__dot" />}
    </button>
  )
}
