import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { BarChart3, ClipboardList, Expand, FileText, Minimize2, Paperclip, Search, X } from 'lucide-react'
import { useApp, useAppDispatch } from '../../shared/store/AppContext'
import { getAgent, getAllAgents, getAllScenarios, getScenario } from '../../scenarios/registry'
import { generateTaskTitle, genMessageId } from '../../shared/utils'
import ChatPanel from '../../shared/chat/ChatPanel'
import { AuditHistoryRail } from '../AuditHistoryRail'
import { FoldIcon } from '../FoldIcon'
import { NewChatIcon } from '../NewChatIcon'
import { PreviewDock } from '../PreviewDock'
import { HostPagePreset } from './HostPagePreset'
import type { HostPresetType } from './HostPagePreset'
import type { AgentProfile, HomeChip, ScenarioModule } from '../../scenarios/types'

interface Props {
  onNewChat?: () => void
}

export function SidebarShell({ onNewChat }: Props) {
  const { state, dispatch } = useApp()
  const appDispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(true)
  const [previewMounted, setPreviewMounted] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewClosing, setPreviewClosing] = useState(false)
  const [railMounted, setRailMounted] = useState(false)
  const [railVisible, setRailVisible] = useState(false)
  const [selectedArtifactPhase, setSelectedArtifactPhase] = useState<string | undefined>(undefined)
  const [previewReadonly, setPreviewReadonly] = useState(false)
  const [homePrefillText, setHomePrefillText] = useState('')
  const previewCloseTimerRef = useRef<number | null>(null)
  const railCloseTimerRef = useRef<number | null>(null)
  const hostPreset = (new URLSearchParams(window.location.search).get('host') || 'list') as HostPresetType

  const scenario = getScenario(state.currentScenario)

  const clearPreviewCloseTimer = useCallback(() => {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current)
      previewCloseTimerRef.current = null
    }
  }, [])

  const clearRailCloseTimer = useCallback(() => {
    if (railCloseTimerRef.current !== null) {
      window.clearTimeout(railCloseTimerRef.current)
      railCloseTimerRef.current = null
    }
  }, [])

  const closeFloatingRail = useCallback(() => {
    clearRailCloseTimer()
    setRailCollapsed(true)
    setRailVisible(false)
    railCloseTimerRef.current = window.setTimeout(() => {
      setRailMounted(false)
      railCloseTimerRef.current = null
    }, 180)
  }, [clearRailCloseTimer])

  const toggleFloatingRail = useCallback(() => {
    if (railMounted && railVisible) {
      closeFloatingRail()
      return
    }
    clearRailCloseTimer()
    setRailCollapsed(false)
    setRailMounted(true)
    window.requestAnimationFrame(() => {
      setRailVisible(true)
    })
  }, [clearRailCloseTimer, closeFloatingRail, railMounted, railVisible])

  const handleHistoryToggle = useCallback(() => {
    if (isMaximized && !previewVisible) {
      setRailCollapsed(v => !v)
      return
    }
    toggleFloatingRail()
  }, [isMaximized, previewVisible, toggleFloatingRail])

  const enterScenario = useCallback((scenarioId: string, userText?: string) => {
    const target = getScenario(scenarioId)
    if (!target) return
    clearPreviewCloseTimer()
    setPreviewClosing(false)
    setPreviewMounted(false)
    setPreviewVisible(false)
    setSelectedArtifactPhase(undefined)
    setPreviewReadonly(false)
    generateTaskTitle(target.label, dispatch)
    dispatch({
      type: 'SWITCH_SCENARIO',
      scenarioId: target.id,
      agentName: target.agentName || target.label,
      avatarKey: target.avatarKey || 'avatar-ai-1',
      initialPhase: target.phases[0] || 'step_1',
      message: {
        id: genMessageId(),
        role: 'user',
        content: userText || target.shortcutLabel || target.label,
        timestamp: Date.now(),
      },
    })
  }, [clearPreviewCloseTimer, dispatch])

  const handleOpen = () => {
    setIsOpen(true)
    if ((state.phase === 'home' || !state.currentScenario) && state.messages.length === 0) {
      setHomePrefillText(getHostContextPrefill(hostPreset))
    }
  }

  const consumeHomePrefill = useCallback(() => {
    setHomePrefillText('')
  }, [])

  const resetTransientShellState = useCallback(() => {
    clearPreviewCloseTimer()
    clearRailCloseTimer()
    setPreviewClosing(false)
    setIsMaximized(false)
    setRailCollapsed(true)
    setRailMounted(false)
    setRailVisible(false)
    setPreviewMounted(false)
    setPreviewVisible(false)
    setSelectedArtifactPhase(undefined)
    setPreviewReadonly(false)
    setHomePrefillText('')
  }, [clearPreviewCloseTimer, clearRailCloseTimer])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    resetTransientShellState()
  }, [resetTransientShellState])

  const closePreview = useCallback(() => {
    clearPreviewCloseTimer()
    setPreviewClosing(true)
    setPreviewVisible(false)
    setPreviewReadonly(false)
    previewCloseTimerRef.current = window.setTimeout(() => {
      setPreviewMounted(false)
      setPreviewClosing(false)
      previewCloseTimerRef.current = null
    }, 250)
  }, [clearPreviewCloseTimer])

  const handleNewChat = () => {
    closePreview()
    closeFloatingRail()
    setSelectedArtifactPhase(undefined)
    onNewChat?.()
  }

  const handleSelectHistory = (scenarioId: string) => {
    const target = getScenario(scenarioId)
    if (!target) return
    enterScenario(target.id, target.shortcutLabel || target.label)
  }

  useEffect(() => {
    if (!state.openPreview) return
    clearPreviewCloseTimer()
    setPreviewClosing(false)
    if (state.openPreviewTargetPhase) {
      setSelectedArtifactPhase(state.openPreviewTargetPhase)
    }
    setPreviewMounted(true)
    window.requestAnimationFrame(() => {
      setPreviewVisible(true)
    })
    setPreviewReadonly(!!state.openPreviewReadonly)
    appDispatch({ type: 'RESET_OPEN_PREVIEW' })
  }, [appDispatch, clearPreviewCloseTimer, state.openPreview, state.openPreviewReadonly, state.openPreviewTargetPhase])

  useEffect(() => {
    return () => {
      clearPreviewCloseTimer()
      clearRailCloseTimer()
    }
  }, [clearPreviewCloseTimer, clearRailCloseTimer])

  const panelPhase = selectedArtifactPhase ?? state.phase
  const PanelComponent = scenario?.panelMap?.[panelPhase]
  const hasPanelContent = !!PanelComponent
  const panelTitle = scenario?.panelTitleMap?.[panelPhase] ?? '内容预览'
  const isHome = state.phase === 'home' || !state.currentScenario
  const sidebarAgentName = state.currentAgentName || scenario?.agentName || 'AI 助手'
  const hasVisiblePreview = previewMounted && previewVisible && hasPanelContent
  const useInlineHistoryRail = isMaximized && !hasVisiblePreview
  const useFloatingHistoryRail = railMounted && (!isMaximized || hasVisiblePreview)

  const sidebarClassName = [
    'sidebar-shell',
    isOpen ? 'sidebar-shell--open' : '',
    isHome ? 'sidebar-shell--home' : '',
    isMaximized ? 'sidebar-shell--maximized' : '',
    useInlineHistoryRail && !railCollapsed ? 'sidebar-shell--history-open' : '',
    hasVisiblePreview ? 'sidebar-shell--with-preview' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={sidebarClassName}>
      <HostPagePreset type={hostPreset} onOpenAi={handleOpen} hasAiActivity={state.messages.length > 0} />

      <div className="sidebar-shell__overlay" aria-hidden={!isOpen}>
        <div className="sidebar-shell__panel-group">
          {useInlineHistoryRail && (
            <AuditHistoryRail
              isCollapsed={railCollapsed}
              onToggle={() => setRailCollapsed(v => !v)}
              onNewChat={handleNewChat}
              onSelectScenario={handleSelectHistory}
              hideFooter
            />
          )}

          {previewMounted && hasPanelContent && (
            <PreviewDock
              isVisible={previewVisible}
              onClose={closePreview}
              title={panelTitle}
              footerReadonly={previewReadonly}
              flex="1 1 auto"
              closingFlex="0 1 auto"
              hiddenTransform={isMaximized && previewClosing ? 'translateX(-28px)' : undefined}
              motion="slide-left"
            >
              {PanelComponent ? <PanelComponent readonly={previewReadonly} /> : null}
            </PreviewDock>
          )}

          <aside className="sidebar-shell__drawer">
            <div className="sidebar-shell__home-bg" aria-hidden="true" />
            <header className="sidebar-shell__header">
              <div className="sidebar-shell__header-left">
                <div className="sidebar-shell__capsule">
                  <button
                    type="button"
                    className="sidebar-shell__capsule-btn"
                    onClick={handleHistoryToggle}
                    title="历史对话"
                    aria-label="历史对话"
                  >
                    <FoldIcon />
                  </button>
                  <button
                    type="button"
                    className="sidebar-shell__capsule-btn"
                    onClick={handleNewChat}
                    title="新建对话"
                    aria-label="新建对话"
                  >
                    <NewChatIcon />
                  </button>
                </div>
                {!isHome && (
                  <span className="sidebar-shell__agent">{sidebarAgentName}</span>
                )}
              </div>
              <div className="sidebar-shell__header-right">
                <button
                  type="button"
                  className="sidebar-shell__icon-btn"
                  onClick={() => setIsMaximized(v => !v)}
                  title={isMaximized ? '退出最大化' : '最大化 AI 面板'}
                  aria-label={isMaximized ? '退出最大化' : '最大化 AI 面板'}
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Expand size={16} />}
                </button>
                <button
                  type="button"
                  className="sidebar-shell__icon-btn"
                  onClick={handleClose}
                  title="关闭侧边栏"
                  aria-label="关闭侧边栏"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {useFloatingHistoryRail && (
              <div className={`sidebar-shell__floating-rail${railVisible ? ' sidebar-shell__floating-rail--visible' : ''}`}>
                <AuditHistoryRail
                  isCollapsed={false}
                  onToggle={closeFloatingRail}
                  onNewChat={handleNewChat}
                  onSelectScenario={handleSelectHistory}
                  variant="floating"
                  hideFooter
                  hideFloatingHeader={!isMaximized}
                />
              </div>
            )}

            <div className="sidebar-shell__chat-body">
              {isHome ? (
                <SidebarHome
                  onStartScenario={enterScenario}
                  prefillText={homePrefillText}
                  onPrefillConsumed={consumeHomePrefill}
                />
              ) : (
                <ChatPanel mode={isMaximized && !hasVisiblePreview ? 'fullscreen' : 'sidebar'} />
              )}
            </div>
          </aside>
        </div>

      </div>
    </div>
  )
}

interface SidebarHomeProps {
  onStartScenario: (scenarioId: string, userText?: string) => void
  prefillText?: string
  onPrefillConsumed?: () => void
}

function SidebarHome({ onStartScenario, prefillText = '', onPrefillConsumed }: SidebarHomeProps) {
  const { state } = useApp()
  const [text, setText] = useState('')
  const agents = getAllAgents()
  const scenarios = getAllScenarios().filter(item => !item.hidden)
  const homeAgent = (state.homeAgentId ? getAgent(state.homeAgentId) : undefined) ?? agents[0]
  const fallbackScenario = homeAgent?.scenarios.find(item => !item.hidden) ?? scenarios[0]
  const agentName = homeAgent?.agentName || fallbackScenario?.agentName || 'AI 助手'
  const avatarKey = homeAgent?.avatarKey || fallbackScenario?.avatarKey || 'avatar-ai-1'
  const description = getSidebarHomeDescription(homeAgent, fallbackScenario)
  const chips = getSidebarHomeChips(homeAgent, fallbackScenario)

  useEffect(() => {
    if (!prefillText) return
    setText(current => current.trim() ? current : prefillText)
    onPrefillConsumed?.()
  }, [onPrefillConsumed, prefillText])

  const start = (prompt?: string) => {
    const trimmed = prompt?.trim() || text.trim()
    if (!trimmed || !fallbackScenario) return
    const matched = matchSidebarScenario(trimmed, scenarios) ?? fallbackScenario
    setText('')
    onStartScenario(matched.id, trimmed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      start()
    }
  }

  return (
    <div className="sidebar-home">
      <div className="sidebar-home__inner">
        <div className="sidebar-home__intro">
          <div className="sidebar-home__identity">
            <div className="sidebar-home__avatar">
              <img src={`/${avatarKey}.png`} alt={agentName} draggable={false} />
            </div>
            <span className="sidebar-home__agent-name">{agentName}</span>
          </div>
          <p className="sidebar-home__description">{description}</p>
        </div>

        {chips.length > 0 && (
          <div className="sidebar-home__chips">
            {chips.map((chip, index) => (
              <button
                key={`${chip.scenarioId}-${chip.label}`}
                type="button"
                className="sidebar-home__chip"
                onClick={() => onStartScenario(chip.scenarioId, chip.label)}
              >
                {getSidebarChipIcon(index)}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="sidebar-home__composer">
          <textarea
            value={text}
            onChange={event => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            className="workbench-textarea"
            placeholder="请输入您的问题，例如：审核数据"
            rows={3}
          />
          <div className="sidebar-home__composer-bar">
            <div className="sidebar-home__tools" aria-hidden="true">
              <button type="button" tabIndex={-1}><Paperclip size={16} /></button>
            </div>
            <button
              type="button"
              className={`icon-btn send-btn sidebar-home__send${text.trim() ? ' active' : ''}`}
              onClick={() => start()}
              disabled={!text.trim()}
              title="发送"
              aria-label="发送"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12.6978 7.06938C12.5681 7.34552 12.3471 7.56441 12.0823 7.6961L2.07299 12.7099C1.36289 13.0545 0.505997 12.7735 0.14562 12.0832C-0.0130195 11.7498 -0.0451876 11.3736 0.0646303 11.0226L1.15932 7.48572C1.25954 7.16187 1.56094 6.94082 1.9023 6.94082H5.73337C6.01496 6.93969 6.24522 6.7139 6.25164 6.42659C6.24987 6.14372 6.02244 5.9151 5.73337 5.91235H1.90512C1.56241 5.91235 1.26015 5.68959 1.16105 5.36398L0.0808283 1.81452C-0.145184 1.07423 0.281458 0.284662 1.03641 0.0628915C1.38586 -0.046133 1.76388 -0.013046 2.08917 0.15932L12.0823 5.17312C12.7804 5.527 13.0614 6.3785 12.6978 7.06938Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getSidebarHomeDescription(agent?: AgentProfile, scenario?: ScenarioModule) {
  const isCost = `${agent?.agentName || ''}${scenario?.label || ''}`.includes('成本')
  if (isCost) return '我可以帮您清洗造价数据、测算项目成本、审核标底文件'
  return agent?.agentDescription || scenario?.agentDescription || '我可以帮您理解当前页面、整理业务信息并生成分析结果'
}

function getSidebarHomeChips(agent?: AgentProfile, scenario?: ScenarioModule): HomeChip[] {
  if (!scenario) return agent?.homeChips || []
  const isCost = `${agent?.agentName || ''}${scenario.label}`.includes('成本') || scenario.label.includes('控制价')
  if (isCost) {
    return [
      { label: '查下武汉项目的硬景指标', scenarioId: scenario.id },
      { label: '审核控制价标底文件', scenarioId: scenario.id },
      { label: '清单指标分析', scenarioId: scenario.id },
      { label: '对比历史项目的钢筋含量', scenarioId: scenario.id },
    ]
  }
  return agent?.homeChips?.length ? agent.homeChips : [{ label: scenario.shortcutLabel || scenario.label, scenarioId: scenario.id }]
}

function matchSidebarScenario(text: string, scenarios: ScenarioModule[]) {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return null
  return scenarios.find(item => {
    const label = item.label.toLowerCase()
    const shortcut = (item.shortcutLabel || '').toLowerCase()
    const agentName = (item.agentName || '').toLowerCase()
    return normalized.includes(label) ||
      normalized.includes(shortcut) ||
      normalized.includes(agentName) ||
      label.includes(normalized.slice(0, 4)) ||
      shortcut.includes(normalized.slice(0, 4))
  }) ?? null
}

function getSidebarChipIcon(index: number) {
  const icons = [
    <FileText size={16} key="file" />,
    <ClipboardList size={16} key="clip" />,
    <BarChart3 size={16} key="chart" />,
    <Search size={16} key="search" />,
  ]
  return icons[index % icons.length]
}

function getHostContextPrefill(hostPreset: HostPresetType) {
  if (hostPreset === 'workbench') {
    return '基于当前成本管理工作台的待审任务、异常指标和待人工确认事项，请帮我梳理今天需要优先处理的招标控制价复核重点。'
  }
  if (hostPreset === 'detail') {
    return '基于当前打开的问数验证项目一期控制价文件（文件编号 ZB-2026-0412，送审金额 551,867,033.03 元，高风险），请帮我审核控制价标底文件。'
  }
  if (hostPreset === 'split') {
    return '基于当前项目分类与专业工程费用清单，请帮我分析问数验证项目一期的异常费用项，并给出需要人工复核的重点。'
  }
  return '基于当前页面已选中的招标控制价文件（问数验证项目一期，文件编号 ZB-2026-0412，送审金额 551,867,033.03 元，高风险，状态：待 AI 复核），请帮我审核控制价标底文件。'
}
