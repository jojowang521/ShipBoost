import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Expand, FileText, Minimize2, Paperclip, X } from 'lucide-react'
import { useApp, useAppDispatch } from '../../shared/store/AppContext'
import { getAgent, getAllAgents, getAllScenarios, getScenario } from '../../scenarios/registry'
import { generateTaskTitle, genMessageId } from '../../shared/utils'
import ChatPanel from '../../shared/chat/ChatPanel'
import AgentAvatar from '../../shared/chat/components/AgentAvatar'
import { AuditHistoryRail } from '../AuditHistoryRail'
import { FoldIcon } from '../FoldIcon'
import { NewChatIcon } from '../NewChatIcon'
import { PreviewDock } from '../PreviewDock'
import { AiEntryButton } from './AiEntryButton'
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
  }

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
  const sidebarAgentName = state.currentAgentName || scenario?.agentName || '智能助手'
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
      <HostPagePreset type={hostPreset} />

      {!isOpen && (
        <AiEntryButton
          onOpen={handleOpen}
          hasActivity={state.messages.length > 0}
        />
      )}

      <div className="sidebar-shell__overlay" aria-hidden={!isOpen}>
        <div className="sidebar-shell__panel-group">
          {useInlineHistoryRail && (
            <AuditHistoryRail
              isCollapsed={railCollapsed}
              onToggle={() => setRailCollapsed(v => !v)}
              onNewChat={handleNewChat}
              onSelectScenario={handleSelectHistory}
              nativeMode
              hideDigitalEmployees
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
}

function SidebarHome({ onStartScenario }: SidebarHomeProps) {
  const { state } = useApp()
  const [text, setText] = useState('')
  const agents = getAllAgents()
  const scenarios = getAllScenarios().filter(item => !item.hidden)
  const homeAgent = (state.homeAgentId ? getAgent(state.homeAgentId) : undefined) ?? agents[0]
  const fallbackScenario = homeAgent?.scenarios.find(item => !item.hidden) ?? scenarios[0]
  const agentName = homeAgent?.agentName || fallbackScenario?.agentName || '智能助手'
  const avatarKey = homeAgent?.avatarKey || fallbackScenario?.avatarKey || 'avatar-ai-1'
  const description = getSidebarHomeDescription(homeAgent, fallbackScenario)
  const chips = getSidebarHomeChips(homeAgent, fallbackScenario)

  const start = (prompt?: string) => {
    const trimmed = prompt?.trim() || text.trim()
    if (!trimmed || !fallbackScenario) {
      setText('')
      return
    }
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
          <div className="sidebar-home__opening-card">
            <div className="sidebar-home__opening-head">
              <div className="sidebar-home__identity">
                <AgentAvatar avatarKey={avatarKey} size={40} style={{ borderRadius: 10 }} />
                <span className="sidebar-home__agent-name">{agentName}</span>
              </div>
              <button type="button" className="sidebar-home__shuffle">
                <SidebarHomeIcon src="/aui-native/icons/sidebar-home-shuffle.svg" alt="" />
                <span>换一换</span>
              </button>
            </div>
            <p className="sidebar-home__description">您好，我是{agentName}，{description}</p>

            {chips.length > 0 && (
              <div className="sidebar-home__questions">
                <div className="sidebar-home__questions-title">
                  <SidebarHomeIcon src="/aui-native/icons/sidebar-home-question-title.svg" alt="" />
                  <span>或者还可以这样问我</span>
                </div>
                <div className="sidebar-home__chips">
                  {chips.map((chip, index) => (
                    <button
                      key={`${chip.scenarioId}-${chip.label}`}
                      type="button"
                      className="sidebar-home__chip"
                      onClick={() => onStartScenario(chip.scenarioId, chip.label)}
                    >
                      {getSidebarChipIcon(chip.label, index)}
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-home__composer">
          <textarea
            value={text}
            onChange={event => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            className="workbench-textarea"
            placeholder="请输入您的问题"
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

interface SidebarHomeIconProps {
  src: string
  alt: string
}

function SidebarHomeIcon({ src, alt }: SidebarHomeIconProps) {
  return <img src={src} alt={alt} className="sidebar-home__svg-icon" aria-hidden={alt ? undefined : true} />
}

function getSidebarHomeDescription(agent?: AgentProfile, scenario?: ScenarioModule) {
  const isCost = `${agent?.agentName || ''}${scenario?.label || ''}`.includes('成本')
  if (isCost) return '我可以帮您清洗造价数据、测算项目成本、审核标底文件'
  return agent?.agentDescription || scenario?.agentDescription || '我可以帮您理解当前页面、整理业务信息并生成分析结果'
}

function getSidebarHomeChips(agent?: AgentProfile, scenario?: ScenarioModule): HomeChip[] {
  if (!scenario) return (agent?.homeChips || []).slice(0, 3)
  const isDailyReport = `${agent?.agentName || ''}${scenario.label}`.includes('日报')
  if (isDailyReport) {
    return [
      { label: scenario.shortcutLabel || '日报校验', scenarioId: scenario.id },
      { label: '生成日报摘要', scenarioId: scenario.id },
      { label: '查看异常项目', scenarioId: scenario.id },
    ]
  }
  const isCost = `${agent?.agentName || ''}${scenario.label}`.includes('成本') || scenario.label.includes('控制价')
  if (isCost) {
    return getSidebarDemoQuestionChips(scenario.id)
  }
  const baseChips = agent?.homeChips?.length ? agent.homeChips : [
    { label: scenario.shortcutLabel || scenario.label, scenarioId: scenario.id },
    { label: `分析${scenario.label}的风险点`, scenarioId: scenario.id },
    { label: `整理${scenario.label}的处理建议`, scenarioId: scenario.id },
  ]
  return ensureThreeSidebarQuestions(baseChips, scenario)
}

function ensureThreeSidebarQuestions(chips: HomeChip[], scenario: ScenarioModule): HomeChip[] {
  const normalized = chips
    .filter(chip => chip.label.trim())
    .map(chip => ({ ...chip, scenarioId: chip.scenarioId || scenario.id }))
  const fallback = [
    { label: scenario.shortcutLabel || scenario.label, scenarioId: scenario.id },
    { label: `分析${scenario.label}的风险点`, scenarioId: scenario.id },
    { label: `整理${scenario.label}的处理建议`, scenarioId: scenario.id },
  ]
  const merged = [...normalized, ...fallback]
  return merged
    .filter((chip, index, list) => list.findIndex(item => item.label === chip.label) === index)
    .slice(0, 3)
}

function getSidebarDemoQuestionChips(scenarioId: string): HomeChip[] {
  return [
    { label: '查下武汉项目的硬景指标', scenarioId },
    { label: '审核控制价标底文件', scenarioId },
    { label: '清单指标分析', scenarioId },
  ]
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

const SIDEBAR_HOME_ICON_BY_KEYWORD: Array<{ keyword: string; src: string }> = [
  { keyword: '硬景', src: '/aui-native/icons/sidebar-home-query-hardscape.svg' },
  { keyword: '标底', src: '/aui-native/icons/sidebar-home-review-control-price.svg' },
  { keyword: '控制价', src: '/aui-native/icons/sidebar-home-review-control-price.svg' },
  { keyword: '清单', src: '/aui-native/icons/sidebar-home-list-indicator-analysis.svg' },
]

function getSidebarChipIcon(label: string, index: number) {
  const icon = SIDEBAR_HOME_ICON_BY_KEYWORD.find(item => label.includes(item.keyword))
  if (icon) return <SidebarHomeIcon src={icon.src} alt="" />
  return <FileText size={16} key={`fallback-${index}`} />
}
