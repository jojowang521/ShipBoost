/**
 * AuditHistoryRail — 统一历史对话侧栏
 *
 * P9-g.5 对齐参考：AI 采招风控_独立模式
 *   - HistorySidebar.tsx: 收起时 width→0，展开态 244px，内容卡片圆角白色
 *   - AuditHeader.tsx:    收起时胶囊浮在对话区左上角（由父容器 relative 定位）
 *
 * 收起态（isCollapsed=true）：
 *   - aside 宽度过渡到 0（裁切动画），自身不占用空间
 *   - 胶囊由父容器（AuditWorkspaceShell）通过 .audit-rail__floating-capsule 绝对定位渲染
 *   - 本组件只负责展开态 JSX 和 isCollapsed 状态反馈
 *
 * 展开态（isCollapsed=false）：
 *   - aside 244px，内容区白色圆角卡片
 *
 * TODO(体验待统一): 历史记录待接入真实会话历史
 * TODO(体验待统一): 用户信息区待接入真实用户状态
 */
import { useState } from 'react'
import { NewChatIcon } from './NewChatIcon'
import { FoldIcon } from './FoldIcon'
import { useApp } from '../shared/store/AppContext'
import { getAgent, getAllAgents } from '../scenarios/registry'

interface HistoryItem {
  id: string
  label: string
}

interface HistoryGroup {
  label: string
  items: HistoryItem[]
}

interface Props {
  isCollapsed: boolean
  onToggle: () => void
  activeId?: string
  onNewChat?: () => void
  onSelectScenario?: (scenarioId: string) => void
  variant?: 'inline' | 'floating'
  hideFooter?: boolean
  hideFloatingHeader?: boolean
}

export function AuditHistoryRail({ isCollapsed, onToggle, activeId, onNewChat, onSelectScenario, variant = 'inline', hideFooter = false, hideFloatingHeader = false }: Props) {
  const { state } = useApp()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const homeAgent = (state.homeAgentId ? getAgent(state.homeAgentId) : undefined) ?? getAllAgents()[0]
  const railTitle = state.currentScenario ? state.currentAgentName : homeAgent?.agentName || 'AI 助手'
  // Real conversation persistence is not implemented yet. Do not fake history with scenario names.
  const historyGroups: HistoryGroup[] = []
  const hasHistory = historyGroups.some(group => group.items.length > 0)
  const railWidth = variant === 'floating' ? 228 : 244
  const outerPadding = variant === 'floating' ? 0 : 8
  const showTopActions = !(variant === 'floating' && hideFloatingHeader)

  return (
    <aside
      className={`audit-rail audit-rail--${variant} shrink-0 h-full overflow-hidden`}
      style={{
        width: isCollapsed ? 0 : railWidth,
        opacity: isCollapsed ? 0 : 1,
        transition: 'width 280ms ease-out, opacity 200ms ease-out',
      }}
    >
      {/* 内容固定 244px 宽，由 aside 宽度裁切做动画（对齐参考项目） */}
      <div style={{ width: railWidth, height: '100%', padding: outerPadding, display: 'flex', flexDirection: 'column' }}>
        <div className="audit-rail__inner">

          {showTopActions && (
            <>
              {/* 顶部：Logo + 收起按钮 */}
              <div className="audit-rail__header">
                <div className="audit-rail__header-left">
                  <span className="audit-rail__title">{railTitle}</span>
                </div>
                <button
                  onClick={onToggle}
                  className="audit-rail__collapse-btn"
                  title="收起侧栏"
                  aria-label="收起侧栏"
                >
                  <FoldIcon mirrored />
                </button>
              </div>

              {/* 新建对话按钮 */}
              <button
                onClick={onNewChat}
                className="audit-rail__new-btn"
              >
                <NewChatIcon style={{ flexShrink: 0 }} />
                <span>开启新对话</span>
              </button>
            </>
          )}

          {/* 历史记录列表 */}
          <div className={`audit-rail__history${hasHistory ? ' audit-rail__history--has-data' : ' audit-rail__history--empty'}`}>
            {!hasHistory ? (
              <div className="audit-rail__empty-state">暂无对话数据</div>
            ) : (
              historyGroups.map((group) => (
                <div key={group.label} className="audit-rail__group">
                <div className="audit-rail__group-label">{group.label}</div>
                <div className="audit-rail__group-items">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={`audit-rail__item${activeId === item.id || hoveredId === item.id ? ' audit-rail__item--active' : ''}`}
                      title={item.label}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => onSelectScenario?.(item.id)}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              ))
            )}
          </div>

          {variant !== 'floating' && !hideFooter && (
            <div className="audit-rail__footer">
              <div className="audit-rail__user">
                <div className="audit-rail__avatar">明</div>
                <span className="audit-rail__username">明小源</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </aside>
  )
}
