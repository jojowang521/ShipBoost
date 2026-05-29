/**
 * MultiSelectCard — 多选卡片组（对话区）
 *
 * 用于专业选择（建筑/安装/装饰）、业态确认等场景。
 * 用户勾选后点击确认，触发 confirmGate action 并传回已选 id 列表。
 */
import { useState } from 'react'

export interface SelectOption {
  id: string
  label: string
  defaultChecked?: boolean
  disabled?: boolean
}

interface Props {
  title?: string
  options: SelectOption[]
  confirmLabel?: string
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function MultiSelectCard({
  title = '请确认选项',
  options,
  confirmLabel = '确认',
  handled,
  onAction,
  messageId,
}: Props) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(options.filter(o => o.defaultChecked !== false).map(o => o.id))
  )

  const toggle = (id: string) => {
    if (handled) return
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    if (handled || !onAction) return
    onAction('confirmGate', { messageId, selectedIds: Array.from(checked) })
  }

  return (
    <>
      <div className="demo-card" style={{ opacity: handled ? 0.65 : 1 }}>
        <div style={{
          padding: '12px 16px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
          }}>
            {title}
          </span>
          {handled && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-success)' }}>
              ✓ 已确认
            </span>
          )}
        </div>

        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt) => (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: handled || opt.disabled ? 'default' : 'pointer',
                padding: '4px 0',
              }}
            >
              <input
                type="checkbox"
                checked={checked.has(opt.id)}
                onChange={() => toggle(opt.id)}
                disabled={handled || opt.disabled}
              />
              <span style={{
                fontSize: 'var(--font-size-base)',
                color: opt.disabled ? 'var(--text-muted)' : 'var(--text-primary)',
              }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {!handled && (
        <div className="action-buttons-group">
          <button className="action-btn action-btn-primary" onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </div>
      )}
    </>
  )
}
