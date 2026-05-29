/**
 * ScenarioSelectCard — 场景选择卡片（对话区）
 *
 * 展示 2-4 个场景选项供用户点击选择，
 * 点击后触发 branchSelect action，让 builder 跳转到对应 phase。
 */

export interface ScenarioOption {
  /** 跳转目标 phase id（对应 branch.to） */
  id: string
  label: string
  description?: string
  /** 是否禁用（如"即将上线"状态） */
  disabled?: boolean
}

interface Props {
  title?: string
  options: ScenarioOption[]
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function ScenarioSelectCard({
  title = '请选择任务场景',
  options,
  handled,
  onAction,
  messageId,
}: Props) {
  const handleSelect = (option: ScenarioOption) => {
    if (handled || option.disabled || !onAction) return
    onAction('branchSelect', { to: option.id, label: option.label, messageId })
  }

  return (
    <div className="demo-card" style={{ opacity: handled ? 0.65 : 1 }}>
      <div className="demo-card__header">
        <span className="demo-card__title">{title}</span>
        {handled && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-success)' }}>
            ✓ 已选择
          </span>
        )}
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt)}
            disabled={handled || opt.disabled}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: handled || opt.disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              opacity: opt.disabled ? 0.45 : 1,
            }}
            onMouseEnter={e => {
              if (!handled && !opt.disabled) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(81,71,255,0.1)'
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-bold)',
                color: opt.disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                lineHeight: 'var(--line-height-tight)',
              }}>
                {opt.label}
                {opt.disabled && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-muted)',
                    fontWeight: 'var(--font-weight-normal)',
                  }}>
                    即将上线
                  </span>
                )}
              </div>
              {opt.description && (
                <div style={{
                  marginTop: 3,
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-base)',
                }}>
                  {opt.description}
                </div>
              )}
            </div>
            {!opt.disabled && !handled && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M5 2.5L9.5 7L5 11.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
