/**
 * AttachmentCard — 附件卡片（横向滚动列表，对话区）
 *
 * AI 完成分析或生成任务后，将输出文件以横向卡片行展示在消息气泡下方。
 * 每个文件卡片包含：文件类型图标 + 主副标题 + 预览按钮。
 * 超出宽度时区域内横向滚动。
 */
import { Eye, FileCode, FileImage, FileSpreadsheet, FileText } from 'lucide-react'

export type FileType = 'txt' | 'word' | 'excel' | 'markdown' | 'image' | 'pdf'

export interface AttachFile {
  id: string
  /** 文件显示名称 */
  name: string
  /** 副标题，如时间、大小 */
  subtitle?: string
  type?: FileType
}

interface Props {
  files: AttachFile[]
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

const TYPE_CONFIG: Record<FileType, { icon: React.ReactNode; bg: string; color: string }> = {
  txt:      { icon: <FileText      size={18} />, bg: '#f1f5f9', color: '#64748b' },
  word:     { icon: <FileText      size={18} />, bg: '#eff6ff', color: '#2563eb' },
  excel:    { icon: <FileSpreadsheet size={18} />, bg: '#f0fdf4', color: '#16a34a' },
  markdown: { icon: <FileCode      size={18} />, bg: '#f8fafc', color: '#374151' },
  image:    { icon: <FileImage     size={18} />, bg: '#fffbeb', color: '#d97706' },
  pdf:      { icon: <FileText      size={18} />, bg: '#fef2f2', color: '#dc2626' },
}

const DEFAULT_CONFIG = TYPE_CONFIG['txt']

export default function AttachmentCard({
  files,
  handled,
  onAction,
  messageId,
}: Props) {
  if (!files || files.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      opacity: handled ? 0.65 : 1,
    }}>
      {files.map(file => {
        const cfg = TYPE_CONFIG[file.type ?? 'txt'] ?? DEFAULT_CONFIG
        return (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 12px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxSizing: 'border-box',
            }}
          >
            {/* 文件类型图标 */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: cfg.bg,
              color: cfg.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {cfg.icon}
            </div>

            {/* 文件信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-primary)',
                lineHeight: '22px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {file.name}
              </div>
              {file.subtitle && (
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-muted)',
                  lineHeight: '18px',
                }}>
                  {file.subtitle}
                </div>
              )}
            </div>

            {/* 预览按钮 */}
            <button
              disabled={handled}
              onClick={() => onAction?.('previewFile', { file, messageId })}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: handled ? 'default' : 'pointer',
                flexShrink: 0,
                transition: 'color 0.12s, border-color 0.12s',
                padding: 0,
              }}
              onMouseEnter={e => {
                if (!handled) {
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <Eye size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
