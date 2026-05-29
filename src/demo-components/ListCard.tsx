/**
 * ListCard — 双向可滚动列表卡片（对话区）
 *
 * 在固定高度区域内展示多行多列数据，支持横向 + 纵向双向滚动。
 * 表头 sticky，行可点击选中，支持行级状态标记。
 * 纯展示时不触发 action；selectable 时点击触发 selectItem。
 */
import { List } from 'lucide-react'

export interface ListColumn {
  key: string
  label: string
  /** 列最小宽度 px */
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface ListRow {
  [key: string]: string | number | boolean | undefined
  _status?: 'normal' | 'warning' | 'error' | 'success'
  _disabled?: boolean
}

interface Props {
  title?: string
  columns: ListColumn[]
  rows: ListRow[]
  maxHeight?: number
  showIndex?: boolean
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

const STATUS_DOT: Record<string, string> = {
  normal:  'var(--text-success)',
  success: 'var(--text-success)',
  warning: 'var(--text-warning)',
  error:   'var(--destructive)',
}

export default function ListCard({
  title,
  columns,
  rows,
  maxHeight = 260,
  showIndex = false,
  handled,
  onAction,
  messageId,
}: Props) {
  const handleRowClick = (row: ListRow, idx: number) => {
    if (handled || row._disabled) return
    onAction?.('selectItem', { item: row, rowIndex: idx, messageId })
  }

  return (
    <div className="demo-card" style={{ opacity: handled ? 0.65 : 1 }}>
      {title && (
        <div className="demo-card__header">
          <div className="demo-card__title">
            <List size={16} color="var(--text-tertiary)" />
            {title}
          </div>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {rows.length} 条
          </span>
        </div>
      )}

      <div style={{ maxHeight, overflowX: 'auto', overflowY: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: columns.reduce((s, c) => s + (c.width ?? 80), showIndex ? 40 : 0),
        }}>
          <thead>
            <tr style={{ background: 'var(--page-bg)', position: 'sticky', top: 0, zIndex: 1 }}>
              {showIndex && (
                <th style={thStyle({ width: 40 })}>#</th>
              )}
              {columns.map((col, i) => (
                <th key={i} style={thStyle({ minWidth: col.width })}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                onClick={() => handleRowClick(row, ri)}
                style={{
                  borderBottom: ri < rows.length - 1 ? '1px solid #F2F4F6' : 'none',
                  cursor: row._disabled || handled ? (row._disabled ? 'not-allowed' : 'default') : 'pointer',
                  opacity: row._disabled ? 0.45 : 1,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => {
                  if (!row._disabled && !handled)
                    e.currentTarget.style.background = 'var(--secondary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {showIndex && (
                  <td style={tdStyle({ color: 'var(--text-muted)' })}>
                    {ri + 1}
                  </td>
                )}
                {columns.map((col, ci) => {
                  const isLast = ci === columns.length - 1
                  return (
                    <td key={ci} style={tdStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{row[col.key]}</span>
                        {isLast && row._status && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: STATUS_DOT[row._status],
                            flexShrink: 0,
                          }} />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function thStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '8px 12px',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-primary)',
    fontWeight: 700,
    borderBottom: '1px solid #F2F4F6',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    ...extra,
  }
}

function tdStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '9px 12px',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    ...extra,
  }
}
