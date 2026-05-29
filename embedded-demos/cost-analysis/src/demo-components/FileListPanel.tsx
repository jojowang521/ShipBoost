/**
 * FileListPanel — 供应商文件列表面板（右侧面板）
 *
 * 展示一组文件的采集状态，支持 pending/collecting/collected/error 四种状态。
 * collecting 状态显示旋转动画，collected 显示采集结果（清单条数+金额）。
 */

export type FileStatus = 'pending' | 'collecting' | 'collected' | 'error'

export interface FileItem {
  name: string
  status: FileStatus
  /** 已采集清单条数 */
  count?: number
  /** 已采集合计金额（如 "¥3,120,000"） */
  amount?: string
  /** 警告/错误备注（如"缺失2项清单"） */
  note?: string
}

interface Props {
  title?: string
  files: FileItem[]
}

const STATUS_LABEL: Record<FileStatus, string> = {
  pending: '待采集',
  collecting: '采集中',
  collected: '已采集',
  error: '异常',
}

const STATUS_COLOR: Record<FileStatus, string> = {
  pending: 'var(--text-muted)',
  collecting: 'var(--accent)',
  collected: 'var(--text-success)',
  error: 'var(--text-danger)',
}

const STATUS_BG: Record<FileStatus, string> = {
  pending: 'var(--secondary)',
  collecting: 'var(--accent-light)',
  collected: '#ECFDF5',
  error: '#FEF2F2',
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#EEF3FB"/>
      <path d="M19.5 4H10a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10.5L19.5 4Z" fill="#6397FF" opacity=".2"/>
      <path d="M19 4v6.5H25" stroke="#6397FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 17h10M11 21h7" stroke="#6397FF" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function FileListPanel({ title = '供应商报价文件', files }: Props) {
  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      <div style={{
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--text-primary)',
        marginBottom: 12,
      }}>
        {title}
        <span style={{
          marginLeft: 8,
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-normal)',
          color: 'var(--text-secondary)',
        }}>
          共 {files.length} 个文件
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {files.map((file, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 12px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <FileIcon />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: 4,
              }}>
                {file.name}
              </div>

              {file.status === 'collected' && (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  {file.count !== undefined && <span>{file.count} 条清单</span>}
                  {file.count !== undefined && file.amount && <span style={{ margin: '0 4px' }}>·</span>}
                  {file.amount && <span>{file.amount}</span>}
                </div>
              )}

              {file.note && (
                <div style={{
                  marginTop: 3,
                  fontSize: 'var(--font-size-sm)',
                  color: file.status === 'error' ? 'var(--text-danger)' : 'var(--text-warning)',
                }}>
                  ⚠ {file.note}
                </div>
              )}
            </div>

            {/* 状态徽章 */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 99,
              background: STATUS_BG[file.status],
              fontSize: 'var(--font-size-sm)',
              color: STATUS_COLOR[file.status],
              fontWeight: 'var(--font-weight-bold)',
              whiteSpace: 'nowrap',
            }}>
              {file.status === 'collecting' && (
                <span className="spinner" style={{ width: 10, height: 10 }} />
              )}
              {STATUS_LABEL[file.status]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
