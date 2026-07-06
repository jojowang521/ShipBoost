import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'

interface Props {
  onOpen: () => void
  hasActivity?: boolean
}

const POSITION_STORAGE_KEY = 'aui-sidebar-entry-position-v2'
const EDGE_MARGIN = 20
const DEFAULT_BOTTOM = 80
const BUTTON_SIZE = 40

type DockSide = 'left' | 'right'

interface EntryPosition {
  left: number
  top: number
  side: DockSide
}

interface DragBounds {
  left: number
  top: number
  right: number
  bottom: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getViewportBounds(): DragBounds {
  return {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  }
}

function getHostBounds(host: HTMLElement | null): DragBounds {
  const rect = host?.getBoundingClientRect()
  if (!rect || rect.width <= BUTTON_SIZE + EDGE_MARGIN * 2 || rect.height <= BUTTON_SIZE + EDGE_MARGIN * 2) {
    return getViewportBounds()
  }
  return {
    left: 0,
    top: 0,
    right: rect.width,
    bottom: rect.height,
  }
}

function clampTop(top: number, bounds: DragBounds): number {
  return clamp(top, bounds.top + EDGE_MARGIN, bounds.bottom - BUTTON_SIZE - EDGE_MARGIN)
}

function clampLeft(left: number, bounds: DragBounds): number {
  return clamp(left, bounds.left + EDGE_MARGIN, bounds.right - BUTTON_SIZE - EDGE_MARGIN)
}

function getDockedLeft(side: DockSide, bounds: DragBounds): number {
  return side === 'left' ? bounds.left + EDGE_MARGIN : bounds.right - BUTTON_SIZE - EDGE_MARGIN
}

function getDefaultPosition(bounds: DragBounds): EntryPosition {
  return {
    left: getDockedLeft('right', bounds),
    top: clampTop(bounds.bottom - BUTTON_SIZE - DEFAULT_BOTTOM, bounds),
    side: 'right',
  }
}

function readSavedPosition(bounds: DragBounds): EntryPosition {
  return getDefaultPosition(bounds)
}

function savePosition(_position: EntryPosition) {
  window.localStorage.removeItem(POSITION_STORAGE_KEY)
}

export function AiEntryButton({ onOpen, hasActivity = false }: Props) {
  const [position, setPosition] = useState<EntryPosition | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number; moved: boolean } | null>(null)
  const suppressNextClickRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const getCurrentBounds = () => {
    const host = buttonRef.current?.closest('.aui-split-host') ?? document.querySelector('.aui-split-host')
    return getHostBounds(host as HTMLElement | null)
  }

  useLayoutEffect(() => {
    let frameId = 0
    let secondFrameId = 0

    const syncPositionToBounds = (resetToDefault = false) => {
      const bounds = getCurrentBounds()
      setPosition(current => {
        if (resetToDefault || !current) return readSavedPosition(bounds)
        const next = {
          side: current.side,
          left: getDockedLeft(current.side, bounds),
          top: clampTop(current.top, bounds),
        }
        return next
      })
    }

    syncPositionToBounds(true)
    frameId = window.requestAnimationFrame(() => {
      syncPositionToBounds(true)
      secondFrameId = window.requestAnimationFrame(() => syncPositionToBounds(true))
    })

    const host = (buttonRef.current?.closest('.aui-split-host') ?? document.querySelector('.aui-split-host')) as HTMLElement | null
    const observer = host ? new ResizeObserver(() => syncPositionToBounds(false)) : null
    if (host && observer) observer.observe(host)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.cancelAnimationFrame(secondFrameId)
      observer?.disconnect()
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const bounds = getCurrentBounds()
        const current = prev ?? readSavedPosition(bounds)
        const next = {
          side: current.side,
          left: getDockedLeft(current.side, bounds),
          top: clampTop(current.top, bounds),
        }
        savePosition(next)
        return next
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const moveDrag = (clientX: number, clientY: number) => {
    const drag = dragRef.current
    if (!drag) return
    const bounds = getCurrentBounds()
    const hostRect = buttonRef.current?.closest('.aui-split-host')?.getBoundingClientRect()
    const localClientX = hostRect ? clientX - hostRect.left : clientX
    const localClientY = hostRect ? clientY - hostRect.top : clientY
    const deltaX = localClientX - drag.startX
    const deltaY = localClientY - drag.startY
    if (Math.hypot(deltaX, deltaY) > 3) drag.moved = true
    const nextLeft = clampLeft(drag.startLeft + deltaX, bounds)
    setPosition({
      left: nextLeft,
      top: clampTop(drag.startTop + deltaY, bounds),
      side: nextLeft + BUTTON_SIZE / 2 < bounds.left + (bounds.right - bounds.left) / 2 ? 'left' : 'right',
    })
  }

  const finishDrag = () => {
    const drag = dragRef.current
    if (!drag) return
    const wasDrag = drag.moved
    dragRef.current = null
    setIsDragging(false)
    suppressNextClickRef.current = true
    if (!wasDrag) {
      onOpen()
      return
    }

    setPosition(current => {
      const bounds = getCurrentBounds()
      const fallback = readSavedPosition(bounds)
      const base = current ?? fallback
      const side: DockSide = base.left + BUTTON_SIZE / 2 < bounds.left + (bounds.right - bounds.left) / 2 ? 'left' : 'right'
      const next = {
        side,
        left: getDockedLeft(side, bounds),
        top: clampTop(base.top, bounds),
      }
      savePosition(next)
      return next
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      moveDrag(event.clientX, event.clientY)
    }
    const handlePointerUp = () => {
      finishDrag()
    }
    const handleBlur = () => {
      finishDrag()
    }

    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('pointerup', handlePointerUp, true)
    window.addEventListener('pointercancel', handlePointerUp, true)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('pointerup', handlePointerUp, true)
      window.removeEventListener('pointercancel', handlePointerUp, true)
      window.removeEventListener('blur', handleBlur)
    }
  })

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const current = position ?? readSavedPosition(getCurrentBounds())
    const hostRect = buttonRef.current?.closest('.aui-split-host')?.getBoundingClientRect()
    setPosition(current)
    setIsDragging(true)
    dragRef.current = {
      startX: hostRect ? event.clientX - hostRect.left : event.clientX,
      startY: hostRect ? event.clientY - hostRect.top : event.clientY,
      startLeft: current.left,
      startTop: current.top,
      moved: false,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    moveDrag(event.clientX, event.clientY)
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    finishDrag()
  }

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    finishDrag()
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      event.preventDefault()
      return
    }
    onOpen()
  }

  const buttonStyle = position
    ? {
        left: position.left,
        top: position.top,
      } as CSSProperties
    : {
        left: 0,
        top: 0,
        visibility: 'hidden',
      } as CSSProperties

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`ai-entry-button${hasActivity ? ' ai-entry-button--active' : ''}${isDragging ? ' ai-entry-button--dragging' : ''}`}
      style={buttonStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      aria-label="打开 AI 助手"
      title="打开 AI 助手"
    >
      <span className="ai-entry-button__logo" aria-hidden="true">
        <svg className="ai-entry-button__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.2003 15.6228L9.95545 8.31915C9.53796 8.35919 9.14289 8.52599 8.82371 8.79698C8.50453 9.06796 8.27664 9.43005 8.17088 9.83425L15.6025 18.1969L15.7557 18.3495C15.981 18.5493 16.2523 18.6907 16.5456 18.7613C16.8388 18.8319 17.145 18.8295 17.4371 18.7542C17.7292 18.679 17.9981 18.5332 18.2202 18.3299C18.4423 18.1265 18.6107 17.8718 18.7104 17.5883C18.8297 17.247 18.8449 16.8783 18.7539 16.5285C18.663 16.1787 18.4709 15.8635 18.2003 15.6228ZM5.80612 9.1404C6.32519 9.97383 6.81412 9.83425 6.88175 8.8791C6.93056 8.3969 7.15074 7.94793 7.50261 7.61314C7.85447 7.27835 8.31486 7.07976 8.80078 7.05318C9.78433 7.02235 9.9253 6.54193 9.11206 5.99334C8.71855 5.70746 8.44067 5.29087 8.32859 4.81881C8.21651 4.34675 8.27763 3.85033 8.5009 3.41922C8.96538 2.55495 8.62313 2.20194 7.73085 2.6215C7.28208 2.82806 6.77329 2.86541 6.29896 2.72661C5.82463 2.58781 5.417 2.28229 5.15178 1.86679C4.6327 1.03336 4.14948 1.15509 4.07614 2.12891C4.02734 2.6111 3.80715 3.06007 3.45529 3.39486C3.10342 3.72965 2.64303 3.92824 2.15712 3.95482C1.16705 3.99702 1.02689 4.47824 1.84584 5.02602C2.23934 5.3119 2.51723 5.72849 2.62931 6.20055C2.74138 6.67262 2.68027 7.16903 2.45699 7.60015C1.99251 8.46522 2.33476 8.81742 3.22705 8.39787C3.67443 8.19018 4.18222 8.15096 4.6564 8.28748C5.13059 8.424 5.53904 8.72701 5.80612 9.1404Z" fill="white" />
          <path opacity="0.6" d="M11.2511 4.87957L11.2897 4.89302C11.2334 4.8679 11.1853 4.82754 11.1508 4.77644C11.1142 4.72224 11.0947 4.65841 11.0947 4.59311C11.0947 4.5278 11.1142 4.46398 11.1508 4.40978C11.1874 4.35557 11.2393 4.31345 11.3 4.28879L12.1312 4.02748C12.3891 3.94698 12.6245 3.80763 12.8187 3.62054C13.013 3.43344 13.1607 3.20376 13.25 2.94979L13.5369 2.13421C13.5616 2.07375 13.6039 2.022 13.6584 1.98557C13.7128 1.94914 13.7769 1.92969 13.8424 1.92969C13.908 1.92969 13.9721 1.94914 14.0265 1.98557C14.081 2.022 14.1232 2.07375 14.148 2.13421L14.3737 2.95628C14.4547 3.21292 14.5946 3.44721 14.7825 3.64051C14.9704 3.8338 15.201 3.98075 15.4559 4.06968L16.2748 4.35614C16.3356 4.38081 16.3875 4.42293 16.4241 4.47713C16.4607 4.53133 16.4802 4.59516 16.4802 4.66046C16.4802 4.72577 16.4607 4.78959 16.4241 4.84379C16.3875 4.89799 16.3356 4.94012 16.2748 4.96478L15.4314 5.21392C15.1736 5.29442 14.9382 5.43376 14.7439 5.62086C14.5497 5.80796 14.402 6.03764 14.3126 6.29161L14.0258 7.10718C14.001 7.16765 13.9587 7.2194 13.9043 7.25583C13.8499 7.29225 13.7858 7.31171 13.7202 7.31171C13.6546 7.31171 13.5905 7.29225 13.5361 7.25583C13.4817 7.2194 13.4394 7.16765 13.4146 7.10718L13.1522 6.27944C13.0714 6.02264 12.9315 5.78819 12.7436 5.59475C12.5557 5.40131 12.3251 5.25423 12.0701 5.16523L11.2897 4.89302C11.2931 4.89455 11.2966 4.89601 11.3 4.89743L11.2511 4.87957Z" fill="white" />
          <path opacity="0.6" d="M7.05299 12.9938L7.77986 13.2494L7.74971 13.2307C7.8081 13.2501 7.85889 13.2873 7.89488 13.3371C7.93086 13.3868 7.95023 13.4466 7.95023 13.5079C7.95023 13.5692 7.93086 13.6289 7.89488 13.6787C7.85889 13.7284 7.8081 13.7656 7.74971 13.785L7.01632 14.0163C6.78813 14.088 6.57985 14.2116 6.40799 14.3774C6.23614 14.5432 6.10543 14.7466 6.02625 14.9714L5.76957 15.6961C5.75009 15.7543 5.71273 15.8049 5.66279 15.8407C5.61284 15.8765 5.55285 15.8958 5.49129 15.8958C5.42973 15.8958 5.36973 15.8765 5.31979 15.8407C5.26984 15.8049 5.23249 15.7543 5.21301 15.6961L4.98077 14.9658C4.91254 14.7423 4.79397 14.5373 4.63411 14.3665C4.47425 14.1956 4.27732 14.0633 4.05833 13.9798L3.33065 13.7241C3.27226 13.7047 3.22147 13.6675 3.18548 13.6178C3.14949 13.5681 3.13013 13.5083 3.13013 13.447C3.13013 13.3857 3.14949 13.326 3.18548 13.2762C3.22147 13.2265 3.27226 13.1893 3.33065 13.1699L4.06404 12.9386C4.28929 12.868 4.49522 12.7467 4.66591 12.5842C4.83659 12.4217 4.96746 12.2222 5.0484 12.0013L5.30509 11.2766C5.32475 11.2188 5.36213 11.1685 5.41198 11.1329C5.46182 11.0973 5.52162 11.0781 5.58296 11.0781C5.6443 11.0781 5.7041 11.0973 5.75394 11.1329C5.80378 11.1685 5.84117 11.2188 5.86083 11.2766L6.09307 12.007C6.16501 12.2345 6.28924 12.4421 6.45587 12.6134C6.62251 12.7847 6.82696 12.915 7.05299 12.9938Z" fill="white" />
        </svg>
      </span>
      {hasActivity && <span className="ai-entry-button__dot" />}
    </button>
  )
}
