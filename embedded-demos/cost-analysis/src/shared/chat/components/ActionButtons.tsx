/**
 * ActionButtons — 场景操作按钮组
 *
 * P9-g.5: 挂在最后一条 AI 气泡下方（由 MessageBubble 渲染），不再作为独立区块
 */
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
  return (
    <div className="action-buttons-group">
      {buttons.map(btn => (
        <button
          key={btn.value}
          className={`action-btn action-btn-${btn.variant || 'primary'}`}
          onClick={() => onAction(btn.value)}
          disabled={disabled}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
