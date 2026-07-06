/**
 * ActionButtons — 场景操作按钮组
 *
 * P9-g.5: 挂在最后一条 AI 气泡下方（由 MessageBubble 渲染），不再作为独立区块
 */
import { useState } from 'react'

export interface ActionButtonDef {
  label: string
  value: string
  variant?: 'primary' | 'outline' | 'ghost'
}

interface Props {
  buttons: ActionButtonDef[]
  onAction: (value: string) => void
  disabled?: boolean
}

export default function ActionButtons({ buttons, onAction, disabled }: Props) {
  const [clickedValue, setClickedValue] = useState<string | null>(null)
  const isHandled = disabled || clickedValue !== null

  return (
    <div className={`action-buttons-group${isHandled ? ' action-buttons-group--handled' : ''}`}>
      {buttons.map(btn => (
        <button
          key={btn.value}
          className={`action-btn action-btn-${btn.variant || 'primary'}`}
          onClick={() => {
            if (isHandled) return
            setClickedValue(btn.value)
            onAction(btn.value)
          }}
          disabled={isHandled}
        >
          <span className="action-btn__text">{btn.label}</span>
        </button>
      ))}
    </div>
  )
}
