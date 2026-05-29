/**
 * SummaryTableCard — 汇总表格卡片（对话区）
 *
 * 用于批量采集汇总、检查结果确认等场景。
 * 支持行级状态着色（normal/warning/error）和底部提示信息。
 * 点击分支按钮触发 branchSelect action。
 */

export interface TableRow {
  cells: string[]
  /** 行级状态，影响最后一个 cell 的颜色 */
  status?: 'normal' | 'warning' | 'error'
  /** 行内备注，显示在最后 cell 下方 */
  note?: string
  /** 是否默认勾选排除（CheckResultCard 场景） */
  excluded?: boolean
}

export interface BranchOption {
  label: string
  to: string
  variant?: 'primary' | 'outline'
}

interface Props {
  title?: string
  columns: string[]
  rows: TableRow[]
  /** 底部提示条内容 */
  notice?: string
  noticeType?: 'info' | 'warning'
  branches?: BranchOption[]
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

const STATUS_COLOR: Record<string, string> = {
  normal: 'var(--text-success)',
  warning: 'var(--text-warning)',
  error: 'var(--text-danger)',
}

export default function SummaryTableCard({
  title,
  columns,
  rows,
  notice,
  noticeType = 'warning',
  branches = [],
  handled,
  onAction,
  messageId,
}: Props) {
  const handleBranch = (branch: BranchOption) => {
    if (handled || !onAction) return
    onAction('branchSelect', { to: branch.to, label: branch.label, messageId })
  }

  return (
    <>
      <div className="demo-card" style={{ opacity: handled ? 0.65 : 1 }}>
        {title && (
          <div className="demo-card__header">
            <span className="demo-card__title">{title}</span>
            {handled && (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-success)' }}>
                ✓ 已确认
              </span>
            )}
          </div>
        )}

        {/* 表格 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--font-size-sm)',
          }}>
            <thead>
              <tr style={{ background: 'var(--page-bg)' }}>
                {columns.map((col, i) => (
                  <th key={i} style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{
                  borderBottom: ri < rows.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  {row.cells.map((cell, ci) => {
                    const isLast = ci === row.cells.length - 1
                    const color = isLast && row.status ? STATUS_COLOR[row.status] : 'var(--text-primary)'
                    return (
                      <td key={ci} style={{
                        padding: '9px 12px',
                        verticalAlign: 'top',
                      }}>
                        <div style={{ color, fontWeight: isLast && row.status && row.status !== 'normal' ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)' }}>
                          {cell}
                        </div>
                        {isLast && row.note && (
                          <div style={{
                            marginTop: 2,
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                          }}>
                            {row.note}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 底部提示 */}
        {notice && (
          <div style={{
            margin: '0 12px 12px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: noticeType === 'warning' ? '#FFF7ED' : 'var(--accent-light)',
            color: noticeType === 'warning' ? 'var(--text-warning)' : 'var(--text-accent)',
            fontSize: 'var(--font-size-sm)',
          }}>
            {notice}
          </div>
        )}
      </div>

      {!handled && branches.length > 0 && (
        <div className="action-buttons-group">
          {branches.map((b, i) => (
            <button
              key={i}
              className={`action-btn action-btn-${b.variant || (i === 0 ? 'primary' : 'outline')}`}
              onClick={() => handleBranch(b)}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
