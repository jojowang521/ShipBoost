/**
 * AuditWorkspaceShell — 统一宿主外壳（首页 + 工作台共用）
 *
 * P9-g.5 对齐更新：
 * - 左侧侧栏收起时宽度→0，浮层胶囊（audit-header-capsule）绝对定位于主内容区左上角
 * - chat-panel-header 改为 AuditHeader 风格：
 *     收起态：左侧胶囊（展开按钮 + 新建）+ 右侧"内容由 AI 生成"提示
 *     展开态：只有右侧提示（侧栏已展开，无需重复入口）
 * - 删除旧 topbar 中遗留的任务标题行（工作台 topbar 已极简）
 *
 * P9-g.4 宿主统一：
 * - 首页和工作台共用此组件
 * - homeContent prop：首页插槽，传入时渲染首页内容替换 ChatPanel
 *
 * 对齐参考：AI 采招风控_独立模式
 *   - AuditLayout.tsx（三栏布局）
 *   - HistorySidebar.tsx（width→0 裁切动画）
 *   - AuditHeader.tsx（收起态胶囊 + 右侧提示，内嵌在对话区顶部）
 */
import React, { useState, useCallback, useRef } from 'react'
import { ChevronRight, CircleCheck, ClipboardList, FileText, Link2, PanelRight } from 'lucide-react'
import { AuditHistoryRail } from './AuditHistoryRail'
import { PreviewDock } from './PreviewDock'
import { FoldIcon } from './FoldIcon'
import { NewChatIcon } from './NewChatIcon'
import ChatPanel from '../shared/chat/ChatPanel'
import { useAppState, useAppDispatch } from '../shared/store/AppContext'

interface Props {
  panelContent?: React.ReactNode
  hasPanelContent?: boolean
  panelHasInternalClose?: boolean
  panelTitle?: string
  panelFooter?: React.ReactNode
  onBack?: () => void
  homeContent?: React.ReactNode
  marketContent?: React.ReactNode
  onSelectArtifact?: (targetPhase: string, targetArtifactTitle?: string | null) => void
  onSelectScenario?: (scenarioId: string) => void
  activeNativePage?: 'home' | 'agents' | 'skills' | 'tasks'
  onNativeNavigate?: (page: 'home' | 'agents' | 'skills' | 'tasks') => void
  onNativeAgentSelect?: (agentId: string) => void
  railCollapsed?: boolean
  onRailCollapsedChange?: (collapsed: boolean) => void
  embeddedInSideNav?: boolean
  navHidden?: boolean
  chatInputReplacement?: React.ReactNode
  defaultContextPanelOpen?: boolean
  defaultPreviewOpen?: boolean
}

export function AuditWorkspaceShell({
  panelContent,
  hasPanelContent = false,
  panelHasInternalClose = false,
  panelTitle,
  panelFooter,
  onBack,
  homeContent,
  marketContent,
  onSelectArtifact,
  onSelectScenario,
  activeNativePage = 'home',
  onNativeNavigate,
  onNativeAgentSelect,
  railCollapsed: controlledRailCollapsed,
  onRailCollapsedChange,
  embeddedInSideNav = false,
  navHidden = false,
  chatInputReplacement,
  defaultContextPanelOpen = false,
  defaultPreviewOpen = false,
}: Props) {
  const isHome = !!homeContent
  const isMarketPage = !isHome && activeNativePage !== 'home' && !!marketContent

  const appState = useAppState()
  const appDispatch = useAppDispatch()
  const [uncontrolledRailCollapsed, setUncontrolledRailCollapsed] = useState(false)
  const railCollapsed = controlledRailCollapsed ?? uncontrolledRailCollapsed
  const [previewOpen, setPreviewOpen] = useState(defaultPreviewOpen)
  const [contextPanelOpen, setContextPanelOpen] = useState(defaultContextPanelOpen)
  const [contextPanelAnchor, setContextPanelAnchor] = useState({ left: 0, top: 0 })
  // 记录当前预览是否以只读模式打开（通过已操作的卡片打开）
  const [previewReadonly, setPreviewReadonly] = useState(false)
  const previewOpenTimerRef = useRef<number | null>(null)
  const contextPanelCloseTimerRef = useRef<number | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const contextToggleRef = useRef<HTMLButtonElement | null>(null)
  const lastContextPanelConversationKeyRef = useRef<string | null>(null)

  React.useEffect(() => {
    if (!defaultPreviewOpen || !hasPanelContent) return
    setPreviewOpen(true)
  }, [defaultPreviewOpen, hasPanelContent])

  const clearPreviewOpenTimer = useCallback(() => {
    if (previewOpenTimerRef.current !== null) {
      window.clearTimeout(previewOpenTimerRef.current)
      previewOpenTimerRef.current = null
    }
  }, [])

  const clearContextPanelCloseTimer = useCallback(() => {
    if (contextPanelCloseTimerRef.current !== null) {
      window.clearTimeout(contextPanelCloseTimerRef.current)
      contextPanelCloseTimerRef.current = null
    }
  }, [])

  React.useEffect(() => {
    if (isHome) {
      clearPreviewOpenTimer()
      setPreviewOpen(false)
    }
  }, [clearPreviewOpenTimer, isHome])

  React.useEffect(() => {
    if (isHome || isMarketPage) {
      lastContextPanelConversationKeyRef.current = null
      setContextPanelOpen(false)
      return
    }

    const conversationKey = appState.currentScenario || appState.currentTaskTitle || 'conversation'
    if (lastContextPanelConversationKeyRef.current !== conversationKey) {
      lastContextPanelConversationKeyRef.current = conversationKey
      const shouldKeepChatWide = appState.currentScenario === 'template-printing__auto-template-generation'
      setContextPanelOpen(!shouldKeepChatWide && window.innerWidth >= 980)
    }
  }, [appState.currentScenario, appState.currentTaskTitle, isHome, isMarketPage])

  React.useEffect(() => () => {
    clearPreviewOpenTimer()
    clearContextPanelCloseTimer()
  }, [clearContextPanelCloseTimer, clearPreviewOpenTimer])

  React.useLayoutEffect(() => {
    const root = document.documentElement

    if (!isHome || activeNativePage !== 'home') {
      root.style.setProperty('--home-bg-anchor-offset-x', '0px')
      root.style.setProperty('--home-bg-anchor-top', '0px')
      return
    }

    let frame = 0
    let stopAt = 0
    let lastOffset: number | null = null

    const updateHomeBgAnchor = () => {
      const composer = document.querySelector<HTMLElement>('.home-composer')
      const homeBg = document.querySelector<HTMLElement>('.app-home-bg')
      const composerRect = composer?.getBoundingClientRect()
      const bgRect = homeBg?.getBoundingClientRect()
      const offset = composerRect ? composerRect.left + composerRect.width / 2 - window.innerWidth / 2 : 0
      const roundedOffset = Math.round(offset)
      const roundedTop = Math.round(composerRect ? composerRect.top - (bgRect?.top ?? 0) : 0)

      if (roundedOffset !== lastOffset) {
        root.style.setProperty('--home-bg-anchor-offset-x', `${roundedOffset}px`)
        lastOffset = roundedOffset
      }
      root.style.setProperty('--home-bg-anchor-top', `${roundedTop}px`)
    }

    const followHomeBgAnchor = (duration = 520) => {
      stopAt = Math.max(stopAt, window.performance.now() + duration)
      if (frame) return

      const tick = (timestamp: number) => {
        updateHomeBgAnchor()
        if (timestamp < stopAt) {
          frame = window.requestAnimationFrame(tick)
        } else {
          frame = 0
        }
      }

      frame = window.requestAnimationFrame(tick)
    }

    const handleResize = () => followHomeBgAnchor(260)
    const handleRailTransition = () => followHomeBgAnchor(520)
    const handleRailTransitionEnd = () => {
      updateHomeBgAnchor()
      followHomeBgAnchor(120)
    }

    const resizeObserver = new ResizeObserver(() => followHomeBgAnchor(260))
    const composer = document.querySelector<HTMLElement>('.home-composer')
    const chat = document.querySelector<HTMLElement>('.audit-workspace__chat')
    const rail = document.querySelector<HTMLElement>('.audit-rail--native')

    if (composer) resizeObserver.observe(composer)
    if (chat) resizeObserver.observe(chat)

    rail?.addEventListener('transitionrun', handleRailTransition)
    rail?.addEventListener('transitionstart', handleRailTransition)
    rail?.addEventListener('transitionend', handleRailTransitionEnd)
    window.addEventListener('resize', handleResize)

    updateHomeBgAnchor()
    followHomeBgAnchor()

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      rail?.removeEventListener('transitionrun', handleRailTransition)
      rail?.removeEventListener('transitionstart', handleRailTransition)
      rail?.removeEventListener('transitionend', handleRailTransitionEnd)
      window.removeEventListener('resize', handleResize)
      root.style.setProperty('--home-bg-anchor-offset-x', '0px')
      root.style.setProperty('--home-bg-anchor-top', '0px')
    }
  }, [activeNativePage, isHome, railCollapsed])

  const setRailCollapsedState = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(railCollapsed) : next
    if (controlledRailCollapsed === undefined) {
      setUncontrolledRailCollapsed(resolved)
    }
    onRailCollapsedChange?.(resolved)
  }, [controlledRailCollapsed, onRailCollapsedChange, railCollapsed])

  React.useEffect(() => {
    if (appState.currentScenario !== 'template-printing__auto-template-generation') return
    if (railCollapsed) return
    setRailCollapsedState(true)
  }, [appState.currentScenario, railCollapsed, setRailCollapsedState])

  // 响应来自对话区 PreviewTriggerCard 的 openPreview dispatch
  React.useEffect(() => {
    if (!appState.openPreview) return
    clearPreviewOpenTimer()
    // 先通过 targetPhase 切换面板内容（onSelectArtifact），再打开面板
    if (appState.openPreviewTargetPhase) {
      onSelectArtifact?.(appState.openPreviewTargetPhase, appState.openPreviewTargetArtifactTitle)
    }
    clearContextPanelCloseTimer()
    setContextPanelOpen(false)
    setRailCollapsedState(true)
    setPreviewReadonly(!!appState.openPreviewReadonly)
    const delay = appState.openPreviewDelayMs ?? 0
    previewOpenTimerRef.current = window.setTimeout(() => {
      setPreviewOpen(true)
      previewOpenTimerRef.current = null
    }, delay)
    appDispatch({ type: 'RESET_OPEN_PREVIEW' })
  }, [
    appState.openPreview,
    appState.openPreviewTargetPhase,
    appState.openPreviewTargetArtifactTitle,
    appState.openPreviewReadonly,
    appState.openPreviewDelayMs,
    onSelectArtifact,
    appDispatch,
    clearContextPanelCloseTimer,
    clearPreviewOpenTimer,
    setRailCollapsedState,
  ])

  React.useEffect(() => {
    clearPreviewOpenTimer()
    setPreviewOpen(false)
    setPreviewReadonly(false)
  }, [appState.closePreviewRequestId, clearPreviewOpenTimer])

  const handleToggleRail = useCallback(() => setRailCollapsedState((v) => !v), [setRailCollapsedState])
  const handleClosePreview = useCallback(() => {
    clearPreviewOpenTimer()
    setPreviewOpen(false)
    setPreviewReadonly(false)
  }, [clearPreviewOpenTimer])
  const handleTogglePreview = useCallback(() => {
    if (!hasPanelContent) return
    clearPreviewOpenTimer()
    setPreviewOpen((v) => {
      const next = !v
      if (next) {
        clearContextPanelCloseTimer()
        setContextPanelOpen(false)
        setRailCollapsedState(true)
      }
      return next
    })
  }, [clearContextPanelCloseTimer, clearPreviewOpenTimer, hasPanelContent, setRailCollapsedState])

  const chatFlex = !isHome && previewOpen
    ? (railCollapsed ? '0 0 400px' : '3 1 0')
    : '1 1 auto'
  const previewFlex = railCollapsed ? '1 1 0' : '7 1 0'
  const shouldShowPreview = previewOpen && hasPanelContent
  const shouldFloatContextPanel = shouldShowPreview
  const contextToggleSelected = contextPanelOpen
  const conversationTitle = appState.currentTaskTitle || '新任务'
  const contextPanelSections = getContextPanelSections(appState.currentScenario, appState.currentAgentName)
  const updateContextPanelAnchor = useCallback(() => {
    const bodyRect = bodyRef.current?.getBoundingClientRect()
    const toggleRect = contextToggleRef.current?.getBoundingClientRect()
    if (!bodyRect || !toggleRect) return

    setContextPanelAnchor({
      left: Math.round(toggleRect.right - bodyRect.left - 280),
      top: Math.round(toggleRect.bottom - bodyRect.top + 8),
    })
  }, [])
  const scheduleFloatingContextPanelClose = useCallback(() => {
    if (!shouldShowPreview) return
    clearContextPanelCloseTimer()
    contextPanelCloseTimerRef.current = window.setTimeout(() => {
      setContextPanelOpen(false)
      contextPanelCloseTimerRef.current = null
    }, 200)
  }, [clearContextPanelCloseTimer, shouldShowPreview])
  const handleContextPanelToggleEnter = useCallback(() => {
    if (!shouldShowPreview) return
    clearContextPanelCloseTimer()
    updateContextPanelAnchor()
    setContextPanelOpen(true)
  }, [clearContextPanelCloseTimer, shouldShowPreview, updateContextPanelAnchor])
  const handleContextPanelToggleLeave = useCallback(() => {
    scheduleFloatingContextPanelClose()
  }, [scheduleFloatingContextPanelClose])
  const handleContextPanelToggleClick = useCallback(() => {
    if (shouldShowPreview) {
      clearContextPanelCloseTimer()
      updateContextPanelAnchor()
      setContextPanelOpen(true)
      return
    }
    setContextPanelOpen((value) => !value)
  }, [clearContextPanelCloseTimer, shouldShowPreview, updateContextPanelAnchor])

  const workspaceClassName = [
    'audit-workspace',
    isHome ? 'audit-workspace--home' : '',
    embeddedInSideNav ? 'audit-workspace--side-nav-embed' : '',
    navHidden ? 'audit-workspace--nav-hidden' : '',
    (isHome || isMarketPage) && activeNativePage !== 'home' ? 'audit-workspace--market' : '',
    railCollapsed ? 'audit-workspace--rail-collapsed' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={workspaceClassName}>
      {isHome && (
        <div
          className={`app-home-bg${activeNativePage === 'home' ? ' app-home-bg--visible' : ' app-home-bg--hidden'}`}
          aria-hidden="true"
        >
          <div className="app-home-bg__orb" />
        </div>
      )}

      {/* 主体区 */}
      <div className="audit-workspace__body" ref={bodyRef}>

        {/* 左侧历史侧栏 — 收起时 width→0，胶囊由主内容区头部承载 */}
        <AuditHistoryRail
          isCollapsed={railCollapsed}
          onToggle={handleToggleRail}
          onNewChat={onBack}
          onSelectScenario={onSelectScenario}
          activeNativePage={activeNativePage}
          onNativeNavigate={onNativeNavigate}
          onNativeAgentSelect={onNativeAgentSelect}
          nativeMode
          navHidden={navHidden}
        />

        {/* 中间主内容区 */}
        <div
          className="audit-workspace__chat"
          style={{
            flex: chatFlex,
            transition: 'flex 220ms ease-out',
          }}
        >
          {/* 极简顶部提示条（收起态左侧放胶囊，展开态只有右侧提示） */}
          {activeNativePage === 'home' && !isMarketPage && (
          <div className="audit-chat-header">
            {/* 左侧：收起态胶囊（内联在 header flex 流中，避免绝对定位重叠） */}
            {railCollapsed && (
              <div className="audit-collapsed-capsule-wrap">
                {/* 胶囊：展开按钮 + 新建对话按钮 */}
                <div className="audit-collapsed-capsule">
                  <button
                    onClick={handleToggleRail}
                    className="audit-collapsed-capsule__btn audit-ui-tooltip-host"
                    aria-label="展开侧栏"
                  >
                    <FoldIcon mirrored />
                    <span className="audit-ui-tooltip audit-ui-tooltip--bottom" role="tooltip">展开</span>
                  </button>
                  <button
                    onClick={onBack}
                    className="audit-collapsed-capsule__btn audit-ui-tooltip-host"
                    aria-label="新建对话"
                  >
                    <NewChatIcon />
                    <span className="audit-ui-tooltip audit-ui-tooltip--bottom" role="tooltip">新建对话</span>
                  </button>
                </div>
              </div>
            )}

            {!isHome && !embeddedInSideNav && (
              <div className="audit-chat-header__title" title={conversationTitle}>
                <span className="audit-chat-header__title-text">{conversationTitle}</span>
              </div>
            )}

            {/* 占位 flex spacer */}
            <div style={{ flex: 1 }} />

            {!isHome && !embeddedInSideNav && (
              <button
                ref={contextToggleRef}
                type="button"
                className={`audit-context-toggle audit-ui-tooltip-host${contextPanelOpen || contextToggleSelected ? ' audit-context-toggle--active' : ''}`}
                aria-label={contextPanelOpen ? '收起任务资料面板' : '展开任务资料面板'}
                aria-pressed={contextPanelOpen}
                onMouseEnter={handleContextPanelToggleEnter}
                onMouseMove={handleContextPanelToggleEnter}
                onMouseLeave={handleContextPanelToggleLeave}
                onPointerEnter={handleContextPanelToggleEnter}
                onPointerLeave={handleContextPanelToggleLeave}
                onClick={handleContextPanelToggleClick}
              >
                <PanelRight size={16} strokeWidth={1.8} aria-hidden="true" />
                {!shouldShowPreview && !contextPanelOpen && (
                  <span className="audit-ui-tooltip audit-ui-tooltip--left" role="tooltip">
                    {contextPanelOpen ? '收起' : '展开'}
                  </span>
                )}
              </button>
            )}
          </div>
          )}

          {/* 主内容区 */}
          {isHome ? (
            homeContent
          ) : isMarketPage ? (
            marketContent
          ) : (
            <ChatPanel
              mode="sidebar"
              previewOpen={shouldShowPreview}
              hasPreviewContent={hasPanelContent}
              onTogglePreview={handleTogglePreview}
              inputReplacement={chatInputReplacement}
            />
          )}
        </div>

        {/* 右侧预览区（工作台模式） */}
        {!isHome && !isMarketPage && (
          <PreviewDock
            isVisible={shouldShowPreview}
            onClose={handleClosePreview}
            title={panelTitle}
            footer={panelFooter}
            footerReadonly={previewReadonly}
            flex={previewFlex}
            hideHeaderClose={panelHasInternalClose}
            hideHeader={panelHasInternalClose}
          >
            {shouldShowPreview && panelHasInternalClose && React.isValidElement(panelContent)
              ? React.cloneElement(panelContent as React.ReactElement<{ onClosePreview?: () => void }>, { onClosePreview: handleClosePreview })
              : shouldShowPreview
                ? panelContent
                : null}
          </PreviewDock>
        )}

        {!isHome && !isMarketPage && (
          <ContextSidePanel
            isOpen={contextPanelOpen}
            isFloating={shouldFloatContextPanel}
            anchor={contextPanelAnchor}
            sections={contextPanelSections}
            onFloatingMouseEnter={clearContextPanelCloseTimer}
            onFloatingMouseLeave={scheduleFloatingContextPanelClose}
          />
        )}
      </div>
    </div>
  )
}

type ContextPanelItem = {
  label: string
  icon: React.ReactNode
}

type ContextPanelSection = {
  id: 'progress' | 'documents' | 'resources'
  title: string
  meta?: string
  items: ContextPanelItem[]
}

const CONTEXT_PANEL_SECTIONS: ContextPanelSection[] = [
  {
    id: 'progress',
    title: '任务进展',
    meta: '4/4',
    items: [
      { label: '1.确认分析范围', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
      { label: '2.匹配同类项目', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
      { label: '3.确认组价范围', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
      { label: '4.输出审核报告', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
    ],
  },
  {
    id: 'documents',
    title: '产出文档',
    meta: '4',
    items: [
      { label: '控制价审核报告.md', icon: <FileText size={16} strokeWidth={1.7} /> },
      { label: '控制价审核明细.html', icon: <Link2 size={16} strokeWidth={1.7} /> },
      { label: '异常指标清单.xlsx', icon: <FileText size={16} strokeWidth={1.7} /> },
      { label: '组价对标说明.pdf', icon: <FileText size={16} strokeWidth={1.7} /> },
    ],
  },
  {
    id: 'resources',
    title: '相关资源',
    meta: '5',
    items: [
      { label: '深圳近三年同类项目库', icon: <ClipboardList size={16} strokeWidth={1.7} /> },
      { label: '深圳市信息价与人工费指导价', icon: <Link2 size={16} strokeWidth={1.7} /> },
      { label: '施工图预算清单', icon: <FileText size={16} strokeWidth={1.7} /> },
      { label: '主要材料询价记录', icon: <FileText size={16} strokeWidth={1.7} /> },
      { label: 'AI 模拟组价技能', icon: <ClipboardList size={16} strokeWidth={1.7} /> },
    ],
  },
]

function getContextPanelSections(currentScenario: string | null, currentAgentName: string): ContextPanelSection[] {
  if (currentScenario?.startsWith('message-todo')) {
    return [
      {
        id: 'progress',
        title: '任务进展',
        meta: '3/3',
        items: [
          { label: '1.汇总今日待办任务', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '2.识别紧急、催办和超期标记', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '3.生成处理优先级建议', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'documents',
        title: '产出文档',
        meta: '2',
        items: [
          { label: '今日待办清单.md', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '待办优先级建议.html', icon: <Link2 size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'resources',
        title: '相关资源',
        meta: '4',
        items: [
          { label: '消息待办技能', icon: <ClipboardList size={16} strokeWidth={1.7} /> },
          { label: '今日待办样例数据', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '催办与超期标记规则', icon: <Link2 size={16} strokeWidth={1.7} /> },
          { label: '审批单摘要模板', icon: <FileText size={16} strokeWidth={1.7} /> },
        ],
      },
    ]
  }

  if (currentScenario?.startsWith('template-printing') || currentAgentName.includes('套打')) {
    return [
      {
        id: 'progress',
        title: '任务进展',
        meta: '4/4',
        items: [
          { label: '1.确认样张与数据对象', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '2.识别合同候选字段', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '3.生成套打替换标记', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '4.整理发布前复核清单', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'documents',
        title: '产出文档',
        meta: '3',
        items: [
          { label: '租赁合同套打模板初稿.docx', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '字段替换标记清单.xlsx', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '发布前复核清单.md', icon: <FileText size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'resources',
        title: '相关资源',
        meta: '5',
        items: [
          { label: '武汉光谷未来中心租赁合同样张.docx', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '租赁合同业务对象字段库', icon: <ClipboardList size={16} strokeWidth={1.7} /> },
          { label: '套打字段命名规范', icon: <Link2 size={16} strokeWidth={1.7} /> },
          { label: '模板发布复核规则', icon: <ClipboardList size={16} strokeWidth={1.7} /> },
          { label: '明源套打配置指引', icon: <Link2 size={16} strokeWidth={1.7} /> },
        ],
      },
    ]
  }

  if (currentScenario?.startsWith('process-assistant') || currentAgentName.includes('流程')) {
    return [
      {
        id: 'progress',
        title: '任务进展',
        meta: '4/4',
        items: [
          { label: '1.确认流程与版本范围', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '2.梳理节点和分支条件', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '3.生成调试或转交计划', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '4.输出影响分析和审计记录', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'documents',
        title: '产出文档',
        meta: '3',
        items: [
          { label: '流程全分支调试用例.xlsx', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '流程责任人转交计划.md', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '流程影响范围分析.html', icon: <Link2 size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'resources',
        title: '相关资源',
        meta: '4',
        items: [
          { label: '采购审批流程 V3.8', icon: <ClipboardList size={16} strokeWidth={1.7} /> },
          { label: '张三待办与在途实例清单', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '李四组织岗位与职责范围', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '流程维护审计规则', icon: <Link2 size={16} strokeWidth={1.7} /> },
        ],
      },
    ]
  }

  if (currentScenario?.startsWith('permission-assistant') || currentAgentName.includes('权限')) {
    return [
      {
        id: 'progress',
        title: '任务进展',
        meta: '3/3',
        items: [
          { label: '1.生成 wm1 权限总览', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '2.匹配新增合同入口', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
          { label: '3.输出入口权限诊断', icon: <CircleCheck size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'documents',
        title: '产出文档',
        meta: '2',
        items: [
          { label: 'wm1 权限总览.md', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '新增合同入口权限诊断.md', icon: <FileText size={16} strokeWidth={1.7} /> },
        ],
      },
      {
        id: 'resources',
        title: '相关资源',
        meta: '4',
        items: [
          { label: 'wm1 当前用户权限快照', icon: <ClipboardList size={16} strokeWidth={1.7} /> },
          { label: '新增合同权限点候选清单', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '公司数据权限范围', icon: <FileText size={16} strokeWidth={1.7} /> },
          { label: '项目数据权限范围', icon: <FileText size={16} strokeWidth={1.7} /> },
        ],
      },
    ]
  }

  return CONTEXT_PANEL_SECTIONS
}

function ContextSidePanel({
  isOpen,
  isFloating,
  anchor,
  sections,
  onFloatingMouseEnter,
  onFloatingMouseLeave,
}: {
  isOpen: boolean
  isFloating: boolean
  anchor: { left: number; top: number }
  sections: ContextPanelSection[]
  onFloatingMouseEnter?: () => void
  onFloatingMouseLeave?: () => void
}) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }))
  }, [])

  return (
    <aside
      className={[
        'audit-context-panel',
        isOpen ? 'audit-context-panel--open' : '',
        isFloating ? 'audit-context-panel--floating' : '',
      ].filter(Boolean).join(' ')}
      aria-label="任务资料面板"
      aria-hidden={!isOpen}
      style={isFloating ? {
        '--audit-context-panel-left': `${anchor.left}px`,
        '--audit-context-panel-top': `${anchor.top}px`,
      } as React.CSSProperties : undefined}
      onMouseEnter={isFloating ? onFloatingMouseEnter : undefined}
      onMouseLeave={isFloating ? onFloatingMouseLeave : undefined}
      onPointerEnter={isFloating ? onFloatingMouseEnter : undefined}
      onPointerLeave={isFloating ? onFloatingMouseLeave : undefined}
    >
      <div className="audit-context-panel__card">
        {sections.map((section, index) => {
          const collapsed = !!collapsedSections[section.id]
          return (
            <section className="audit-context-section" key={section.id}>
              {index > 0 && <div className="audit-context-section__divider" />}
              <button
                type="button"
                className="audit-context-section__header"
                aria-expanded={!collapsed}
                onClick={() => toggleSection(section.id)}
              >
                <span className="audit-context-section__title">{section.title}</span>
                <span className="audit-context-section__meta">
                  {!collapsed && section.meta ? <span>{section.meta}</span> : null}
                  <ChevronRight
                    size={16}
                    strokeWidth={1.8}
                    className={collapsed ? 'audit-context-section__chevron' : 'audit-context-section__chevron audit-context-section__chevron--expanded'}
                    aria-hidden="true"
                  />
                </span>
              </button>
              {!collapsed && (
                <div className="audit-context-section__items">
                  {section.items.map((item) => (
                    <button
                      type="button"
                      className="audit-context-item"
                      key={item.label}
                    >
                      <span className="audit-context-item__icon" aria-hidden="true">{item.icon}</span>
                      <span className="audit-context-item__label">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </aside>
  )
}
