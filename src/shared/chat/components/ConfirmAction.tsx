/**
 * ConfirmAction — 外置确认按钮，点击后渐隐消失
 * 统一处理所有卡片下方的确认操作，防止重复点击。
 */
import { useState } from 'react'

interface Props {
  question?: string
  options?: string[]
  toolCallId?: string
  messageId?: string
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  phase?: string
  buttons?: Array<{ label: string; action: string; variant?: 'primary' | 'outline' | 'ghost' }>
  /** 外置模式：由 MessageBubble 直接渲染，携带卡片当前 selection payload */
  confirmPayload?: Record<string, unknown>
  confirmLabel?: string
  confirmAction?: string
  confirmDisabled?: boolean
}

export default function ConfirmAction({
  handled,
  onAction,
  phase,
  buttons,
  messageId,
  confirmPayload,
  confirmLabel,
  confirmAction,
  confirmDisabled,
}: Props) {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  if (handled || gone) return null

  const trigger = (action: string, payload: Record<string, unknown>) => {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setGone(true)
      onAction?.(action, payload)
    }, 280)
  }

  const fadeStyle: React.CSSProperties = {
    opacity: fading ? 0 : 1,
    transition: 'opacity 0.28s ease',
    pointerEvents: fading ? 'none' : 'auto',
  }

  const barClass = 'confirm-action'

  // 外置模式：由 MessageBubble 传入 confirmAction / confirmLabel / confirmPayload
  if (confirmAction && confirmLabel) {
    return (
      <div className={barClass} style={fadeStyle}>
        <button
          className="action-btn action-btn-primary"
          disabled={confirmDisabled}
          onClick={() => trigger(confirmAction, { ...(confirmPayload ?? {}), messageId })}
        >
          {confirmLabel}
        </button>
      </div>
    )
  }

  if (buttons && buttons.length > 0) {
    return (
      <div className={barClass} style={fadeStyle}>
        {buttons.map((btn, idx) => (
          <button
            key={`${btn.action}-${idx}`}
            className={`action-btn action-btn-${btn.variant || 'primary'}`}
            onClick={() => trigger(btn.action, { messageId })}
          >
            {btn.label}
          </button>
        ))}
      </div>
    )
  }

  if (phase === 'preview_result') {
    return (
      <div className={barClass} style={fadeStyle}>
        <button className="action-btn action-btn-primary" onClick={() => trigger('startAudit', {})}>
          开始审核
        </button>
      </div>
    )
  }

  return (
    <div className={barClass} style={fadeStyle}>
      <button className="action-btn action-btn-outline" onClick={() => trigger('previewResult', {})}>
        预览AI识别结果
      </button>
    </div>
  )
}
