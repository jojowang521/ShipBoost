/**
 * ProgressOverlayPanel — 任务执行进度全屏面板（右侧面板）
 *
 * 展示多任务并行或串行的执行进度，每个任务包含：
 * - 状态图标（等待 / 执行中旋转 / 完成 / 错误）
 * - 标题 + 副标题描述
 * - 进度条（仅 running 状态显示）
 * - 完成后的摘要信息
 *
 * 用于文件采集、数据清洗、自动审核等批量执行场景。
 */
import React from 'react'

export type TaskStatus = 'waiting' | 'running' | 'done' | 'error' | 'skipped'

export interface OverlayTask {
  id: string
  title: string
  desc?: string
  status: TaskStatus
  /** 0-100，仅 running 时显示 */
  progress?: number
  /** 完成后摘要（如"已采集 38 条"） */
  summary?: string
}

interface Props {
  title?: string
  tasks: OverlayTask[]
  /** 整体进度描述，如"正在执行第 2/5 步" */
  overallStatus?: string
  /** 是否所有任务已完成 */
  done?: boolean
}

const ICON: Record<TaskStatus, React.ReactNode> = {
  waiting: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="var(--border)" strokeWidth="2"/>
    </svg>
  ),
  running: (
    <span className="spinner" style={{ width: 20, height: 20, borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
  ),
  done: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="var(--text-success)" opacity=".15"/>
      <path d="M6 10.5l3 3 5-5.5" stroke="var(--text-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="#FEF2F2"/>
      <path d="M7 7l6 6M13 7l-6 6" stroke="var(--text-danger)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  skipped: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="var(--border)" strokeWidth="2" strokeDasharray="3 2"/>
      <text x="10" y="14" textAnchor="middle" fontSize="10" fill="var(--text-muted)">—</text>
    </svg>
  ),
}

export default function ProgressOverlayPanel({ title = '任务执行中', tasks, overallStatus, done }: Props) {
  const doneCount = tasks.filter(t => t.status === 'done' || t.status === 'skipped').length

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      overflowY: 'auto',
    }}>
      {/* 头部信息 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}>
          {done ? '✅ 全部完成' : title}
        </div>
        {overallStatus && (
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            {overallStatus}
          </div>
        )}

        {/* 整体进度条 */}
        <div style={{
          marginTop: 10,
          height: 4,
          borderRadius: 99,
          background: 'var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(doneCount / tasks.length) * 100}%`,
            borderRadius: 99,
            background: done ? 'var(--text-success)' : 'var(--accent)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{
          marginTop: 4,
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-muted)',
          textAlign: 'right',
        }}>
          {doneCount} / {tasks.length}
        </div>
      </div>

      {/* 任务列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map(task => (
          <div key={task.id} style={{
            display: 'flex',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--card)',
            border: `1px solid ${task.status === 'error' ? 'var(--text-danger)' : task.status === 'running' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            alignItems: 'flex-start',
            transition: 'border-color 0.2s',
          }}>
            <div style={{ marginTop: 1, flexShrink: 0 }}>
              {ICON[task.status]}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-bold)',
                color: task.status === 'waiting' || task.status === 'skipped'
                  ? 'var(--text-muted)'
                  : 'var(--text-primary)',
                marginBottom: task.desc || task.status === 'running' ? 4 : 0,
              }}>
                {task.title}
              </div>

              {task.desc && (
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  marginBottom: task.status === 'running' ? 8 : 0,
                }}>
                  {task.desc}
                </div>
              )}

              {/* 单任务进度条 */}
              {task.status === 'running' && (
                <div style={{ height: 3, borderRadius: 99, background: 'var(--border)' }}>
                  <div style={{
                    height: '100%',
                    width: `${task.progress ?? 0}%`,
                    borderRadius: 99,
                    background: 'var(--accent)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              )}

              {/* 完成摘要 */}
              {task.summary && (
                <div style={{
                  marginTop: 4,
                  fontSize: 'var(--font-size-sm)',
                  color: task.status === 'error' ? 'var(--text-danger)' : 'var(--text-success)',
                }}>
                  {task.summary}
                </div>
              )}
            </div>

            {/* 右侧状态文字 */}
            <div style={{
              flexShrink: 0,
              fontSize: 'var(--font-size-sm)',
              color: task.status === 'running' ? 'var(--accent)' : 'var(--text-muted)',
              paddingTop: 2,
            }}>
              {task.status === 'running' && `${task.progress ?? 0}%`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
