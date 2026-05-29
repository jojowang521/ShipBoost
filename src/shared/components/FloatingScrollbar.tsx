import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from 'react'

interface FloatingScrollbarProps {
  targetRef: RefObject<HTMLElement | null>
  className?: string
  minThumbSize?: number
}

interface ScrollbarMetrics {
  visible: boolean
  top: number
  height: number
}

export function FloatingScrollbar({
  targetRef,
  className = '',
  minThumbSize = 40,
}: FloatingScrollbarProps) {
  const [metrics, setMetrics] = useState<ScrollbarMetrics>({ visible: false, top: 0, height: 0 })
  const [active, setActive] = useState(false)

  const updateMetrics = useCallback(() => {
    const target = targetRef.current
    if (!target) return

    const { clientHeight, scrollHeight, scrollTop } = target
    if (clientHeight <= 0 || scrollHeight <= clientHeight + 1) {
      setMetrics({ visible: false, top: 0, height: 0 })
      return
    }

    const height = Math.max(minThumbSize, (clientHeight / scrollHeight) * clientHeight)
    const maxTop = Math.max(0, clientHeight - height)
    const maxScrollTop = Math.max(1, scrollHeight - clientHeight)
    const top = Math.min(maxTop, Math.max(0, (scrollTop / maxScrollTop) * maxTop))

    setMetrics({ visible: true, top, height })
  }, [minThumbSize, targetRef])

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const handleScroll = () => {
      updateMetrics()
    }

    updateMetrics()
    const animationFrame = window.requestAnimationFrame(updateMetrics)
    target.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateMetrics)

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateMetrics) : null
    resizeObserver?.observe(target)
    if (target.firstElementChild) resizeObserver?.observe(target.firstElementChild)

    const mutationObserver = typeof MutationObserver !== 'undefined' ? new MutationObserver(updateMetrics) : null
    mutationObserver?.observe(target, { childList: true, subtree: true, characterData: true })

    return () => {
      target.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateMetrics)
      window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [targetRef, updateMetrics])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = targetRef.current
    const track = event.currentTarget.parentElement
    if (!target || !track) return

    const maxTop = Math.max(1, target.clientHeight - metrics.height)
    const maxScrollTop = Math.max(1, target.scrollHeight - target.clientHeight)
    const startY = event.clientY
    const startScrollTop = target.scrollTop

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setActive(true)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY
      target.scrollTop = startScrollTop + (deltaY / maxTop) * maxScrollTop
    }

    const handlePointerUp = () => {
      setActive(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  if (!metrics.visible) return null

  return (
    <div
      className={`floating-scrollbar${active ? ' floating-scrollbar--active' : ''}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <div
        className="floating-scrollbar__thumb"
        onPointerDown={handlePointerDown}
        style={{
          height: `${metrics.height}px`,
          transform: `translateY(${metrics.top}px)`,
        }}
      />
    </div>
  )
}
