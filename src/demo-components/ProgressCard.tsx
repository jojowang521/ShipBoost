/**
 * ProgressCard — 进度步骤卡片（对话区）
 *
 * 展示多个并行或串行任务的执行进度。
 * 每项可独立处于 pending / running / done / error 状态。
 * 纯展示，不触发 action。
 */
import React from 'react'

export type ProgressStatus = 'pending' | 'running' | 'done' | 'error'

export interface ProgressItem {
  label: string
  status: ProgressStatus
  /** 0-100，仅 running 状态有效 */
  progress?: number
  note?: string
}

interface Props {
  title?: string
  items: ProgressItem[]
}

const STATUS_CONFIG: Record<ProgressStatus, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: 'var(--text-muted)',
    icon: (
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '1.5px solid var(--border-strong)',
        flexShrink: 0,
      }} />
    ),
  },
  running: {
    color: 'var(--accent)',
    icon: <span className="spinner" style={{ width: 14, height: 14, flexShrink: 0 }} />,
  },
  done: {
    color: 'var(--text-success)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7.5" fill="var(--text-success)" />
        <path d="M4.5 8L7 10.5L11.5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  error: {
    color: 'var(--text-danger)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7.5" fill="var(--text-danger)" />
        <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
}

export default function ProgressCard({ title, items }: Props) {
  return (
    <div className="demo-card">
      {title && (
        <div className="demo-card__header">
          <span className="demo-card__title">{title}</span>
        </div>
      )}

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, idx) => {
          const { color, icon } = STATUS_CONFIG[item.status]
          return (
            <div key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {icon}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: item.status === 'running' && item.progress !== undefined ? 4 : 0,
                  }}>
                    <span style={{
                      fontSize: 'var(--font-size-base)',
                      color: item.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)',
                    }}>
                      {item.label}
                    </span>
                    {item.status === 'running' && item.progress !== undefined && (
                      <span style={{ fontSize: 'var(--font-size-sm)', color }}>
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'done' && item.note && (
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {item.note}
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-danger)' }}>
                        异常
                      </span>
                    )}
                  </div>
                  {item.status === 'running' && item.progress !== undefined && (
                    <div style={{
                      height: 4,
                      background: 'var(--border)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${item.progress}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        borderRadius: 2,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
