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
import { AppLogo } from './AppLogo'
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

interface NativeAgent {
  agentId: string
  agentName: string
  agentDescription: string
  avatarKey: string
}

function nativeAvatarSrc(avatarKey: string): string {
  const map: Record<string, string> = {
    smart_cost_assistant: '/aui-native/avatars/smart-cost-assistant.png',
    data_assistant: '/aui-native/avatars/data-assistant.png',
    bill_assistant: '/aui-native/avatars/bill-assistant.png',
    procurement_assistant: '/aui-native/avatars/procurement-compliance-assistant.png',
    cost_assistant: '/aui-native/avatars/cost-assistant.png',
    tender_assistant: '/aui-native/avatars/tender-assistant.png',
    cost_qa_assistant: '/aui-native/avatars/cost-qa-assistant.png',
    project_cost_assistant: '/aui-native/avatars/project-cost-assistant.png',
    'avatar-ai-1': '/aui-native/avatars/smart-cost-assistant.png',
    'avatar-ai-2': '/aui-native/avatars/data-assistant.png',
    'avatar-ai-3': '/aui-native/avatars/bill-assistant.png',
    'avatar-ai-4': '/aui-native/avatars/procurement-compliance-assistant.png',
  }
  return map[avatarKey] || map['avatar-ai-1']
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
  nativeMode?: boolean
  hideDigitalEmployees?: boolean
}

export function AuditHistoryRail({ isCollapsed, onToggle, activeId, onNewChat, onSelectScenario, variant = 'inline', hideFooter = false, hideFloatingHeader = false, nativeMode = false, hideDigitalEmployees = false }: Props) {
  const { state } = useApp()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const homeAgent = (state.homeAgentId ? getAgent(state.homeAgentId) : undefined) ?? getAllAgents()[0]
  const railTitle = state.currentScenario ? state.currentAgentName : homeAgent?.agentName || 'AI 助手'
  const agents = getAllAgents()
  const fallbackAgents: NativeAgent[] = [
    {
      agentId: 'smart-cost-assistant',
      agentName: '智能成本助手',
      agentDescription: '我可以帮您清洗造价数据、测算项目成本、审核标底文件',
      avatarKey: 'smart_cost_assistant',
    },
    {
      agentId: 'data-assistant',
      agentName: '数据助手',
      agentDescription: '我可以帮您清洗造价数据、测算项目成本、审核标底文件',
      avatarKey: 'data_assistant',
    },
    {
      agentId: 'bill-assistant',
      agentName: '账单助手',
      agentDescription: '发票匹配、结算清单、费用汇总、合规性检查',
      avatarKey: 'bill_assistant',
    },
    {
      agentId: 'procurement-assistant',
      agentName: '采购合规官助手',
      agentDescription: '招标审核、串围标检测、投标评估、供应商风险识别',
      avatarKey: 'procurement_assistant',
    },
  ]
  const scenarioAgents: NativeAgent[] = agents.map(agent => ({
    agentId: agent.agentId,
    agentName: agent.agentName,
    agentDescription: agent.agentDescription,
    avatarKey: agent.avatarKey,
  }))
  const nativeAgents: NativeAgent[] = [...scenarioAgents, ...fallbackAgents]
    .filter((agent, index, list) => list.findIndex(item => item.agentName === agent.agentName) === index)
    .slice(0, 3)
  // Real conversation persistence is not implemented yet. Native mode uses static placeholders to preserve the current shell visual state.
  const historyGroups: HistoryGroup[] = nativeMode
    ? [
        {
          label: '历史对话',
          items: [
            { id: 'history-1', label: '对话内容示意' },
            { id: 'history-2', label: '对话内容示意' },
            { id: 'history-3', label: '对话内容示意' },
            { id: 'history-4', label: '对话内容示意' },
            { id: 'history-5', label: '对话内容示意' },
            { id: 'history-6', label: '对话内容示意' },
          ],
        },
      ]
    : []
  const hasHistory = historyGroups.some(group => group.items.length > 0)
  const railWidth = nativeMode ? 228 : (variant === 'floating' ? 228 : 244)
  const outerPadding = nativeMode ? '12px 0' : (variant === 'floating' ? 0 : 8)
  const showTopActions = !(variant === 'floating' && hideFloatingHeader)
  const showDigitalEmployees = nativeMode && !hideDigitalEmployees
  const railClassName = `audit-rail audit-rail--${variant}${nativeMode ? ' audit-rail--native' : ''} shrink-0 h-full overflow-hidden`

  return (
    <aside
      className={railClassName}
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
                  {nativeMode ? (
                    <AppLogo className="audit-rail__logo" />
                  ) : (
                    <span className="audit-rail__title">{railTitle}</span>
                  )}
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

              {showDigitalEmployees && (
                <section className="audit-rail__agents">
                  <div className="audit-rail__section-head">
                    <span>我的员工</span>
                    <span className="audit-rail__section-chevron" aria-hidden="true">›</span>
                  </div>
                  <div className="audit-rail__agent-list">
                    {nativeAgents.map(agent => (
                      <button
                        type="button"
                        className="audit-rail__agent-row"
                        key={agent.agentId}
                      >
                        <span className="audit-rail__agent-avatar">
                          <img src={nativeAvatarSrc(agent.avatarKey)} alt={agent.agentName} />
                        </span>
                        <span className="audit-rail__agent-copy">
                          <span className="audit-rail__agent-name">{agent.agentName}</span>
                          <span className="audit-rail__agent-desc">{agent.agentDescription}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* 历史记录列表 */}
          <div className={`audit-rail__history${hasHistory ? ' audit-rail__history--has-data' : ' audit-rail__history--empty'}`}>
            {!hasHistory ? (
              <div className="audit-rail__empty-state">暂无对话数据</div>
            ) : (
              historyGroups.map((group) => (
                <div key={group.label || group.items[0]?.id} className="audit-rail__group">
                {group.label && <div className="audit-rail__group-label">{group.label}</div>}
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
              {nativeMode && (
                <span className="audit-rail__settings" aria-hidden="true">
                  <img src="/aui-native/icons/settings.svg" alt="" />
                </span>
              )}
            </div>
          )}

        </div>
      </div>
    </aside>
  )
}
