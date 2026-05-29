/**
 * CardListCard — 卡片列表卡片（对话区）
 *
 * 在固定高度区域内纵向滚动展示一组卡片式条目。
 * 每条目支持图标、主/副信息、badge、meta 行、行级操作按钮。
 * 可单选（selectable），选中触发 selectCard；操作按钮触发 cardAction。
 */
import { useState } from 'react'
import { LayoutList } from 'lucide-react'

export interface CardItem {
  id: string
  icon?: string
  title: string
  description?: string
  badge?: string
  badgeType?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  meta?: Array<{ label: string; value: string }>
  actions?: Array<{ key: string; label: string; variant?: 'primary' | 'outline' | 'ghost' }>
  disabled?: boolean
}

interface Props {
  title?: string
  items: CardItem[]
  maxHeight?: number
  selectable?: boolean
  emptyText?: string
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

const BADGE_CLASS: Record<string, string> = {
  info:    'tag tag-info',
  success: 'tag tag-success',
  warning: 'tag tag-warning',
  danger:  'tag tag-danger',
  neutral: 'tag tag-neutral',
}

export default function CardListCard({
  title,
  items,
  maxHeight: _maxHeight = 320,
  selectable = true,
  emptyText = '暂无数据',
  handled,
  onAction,
  messageId,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleCardClick = (item: CardItem) => {
    if (handled || item.disabled || !selectable) return
    setSelectedId(item.id)
    onAction?.('selectCard', { item, messageId })
  }

  return (
    <div className="demo-card" style={{ opacity: handled ? 0.65 : 1 }}>
      {title && (
        <div className="demo-card__header">
          <div className="demo-card__title">
            <LayoutList size={16} color="var(--text-tertiary)" />
            {title}
          </div>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {items.length} 项
          </span>
        </div>
      )}

      <div style={{
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-muted)',
          }}>
            {emptyText}
          </div>
        ) : items.map(item => {
          const isSelected = selectedId === item.id
          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              style={{
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: 12,
                background: isSelected ? 'var(--accent-light)' : 'var(--card)',
                cursor: item.disabled || handled || !selectable
                  ? (item.disabled ? 'not-allowed' : 'default')
                  : 'pointer',
                opacity: item.disabled ? 0.45 : 1,
                transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                if (!item.disabled && !handled && selectable && !isSelected) {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              {/* 顶行：icon + 主副标题 + badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {item.icon && (
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 18,
                  }}>
                    {item.icon}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    lineHeight: 'var(--line-height-tight)',
                  }}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div style={{
                      marginTop: 3,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--line-height-base)',
                    }}>
                      {item.description}
                    </div>
                  )}
                </div>
                {item.badge && (
                  <span className={BADGE_CLASS[item.badgeType ?? 'neutral']}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Meta 行 */}
              {item.meta && item.meta.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 12,
                  marginTop: 8, paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                }}>
                  {item.meta.map((m, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        {m.label}
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-primary)',
                        fontWeight: 'var(--font-weight-bold)',
                      }}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 操作按钮 */}
              {item.actions && item.actions.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 6, marginTop: 8 }}>
                  {item.actions.map((act, i) => (
                    <button
                      key={i}
                      className={`action-btn action-btn-${act.variant ?? (i === item.actions!.length - 1 ? 'primary' : 'ghost')}`}
                      style={{ padding: '4px 10px', fontSize: 'var(--font-size-sm)' }}
                      onClick={e => {
                        e.stopPropagation()
                        onAction?.('cardAction', { item, actionKey: act.key, messageId })
                      }}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
