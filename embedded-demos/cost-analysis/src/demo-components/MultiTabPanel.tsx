/**
 * MultiTabPanel — 多 Tab 切换面板（右侧面板）
 *
 * 每个 Tab 承载任意内容（通过 content 数组传入已渲染的 ReactNode，
 * 或通过 componentName + props 引用注册组件）。
 *
 * 用于比价结果（供应商A/B/C tab）、指标多维度分析等场景。
 */
import React, { useState } from 'react'

export interface TabItem {
  /** Tab 标签文字 */
  label: string
  /** Tab 标记（如"最优"、"警告"），可选 */
  badge?: string
  badgeColor?: 'success' | 'warning' | 'error' | 'info'
  /** 已渲染内容 */
  content: React.ReactNode
}

interface Props {
  tabs: TabItem[]
  defaultTab?: number
}

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  success: { background: '#ECFDF5', color: 'var(--text-success)' },
  warning: { background: '#FFF7ED', color: 'var(--text-warning)' },
  error: { background: '#FEF2F2', color: 'var(--text-danger)' },
  info: { background: 'var(--accent-light)', color: 'var(--accent)' },
}

export default function MultiTabPanel({ tabs, defaultTab = 0 }: Props) {
  const [active, setActive] = useState(defaultTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab 头 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--page-bg)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: active === idx ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: active === idx ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: active === idx ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
              fontSize: 'var(--font-size-base)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.label}
            {tab.badge && (
              <span style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 99,
                fontWeight: 'var(--font-weight-bold)',
                ...(BADGE_STYLE[tab.badgeColor || 'info']),
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tabs[active]?.content}
      </div>
    </div>
  )
}
