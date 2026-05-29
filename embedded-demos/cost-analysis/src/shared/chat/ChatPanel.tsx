import React, { useRef, useEffect, useCallback, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useApp } from '../store/AppContext'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import { getScenario, getAllScenarios } from '../../scenarios/registry'
import { demoComponentRegistry } from '../../demo-components/index'
import type { ActionButtonDef } from './components/ActionButtons'
import { trackEvent } from '../telemetry'

interface Props {
  mode?: 'sidebar' | 'fullscreen'
  previewOpen?: boolean
  hasPreviewContent?: boolean
  onTogglePreview?: () => void
}

export default function ChatPanel({ mode = 'sidebar' }: Props) {
  const { state, dispatch } = useApp()
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const stateRef = useRef(state)
  stateRef.current = state
  const lastPhaseEnterKey = useRef('')
  const msgRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevMsgCountRef = useRef(0)
  const showScrollToTopRef = useRef(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  const scenario = getScenario(state.currentScenario)

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    const shouldShow = scrollHeight - scrollTop - clientHeight > 80
    if (shouldShow !== showScrollToTopRef.current) {
      showScrollToTopRef.current = shouldShow
      setShowScrollToTop(shouldShow)
    }
  }, [])

  useEffect(() => {
    const msgs = state.messages
    const isNewMsg = msgs.length > prevMsgCountRef.current
    prevMsgCountRef.current = msgs.length
    if (isNewMsg) {
      const last = msgs[msgs.length - 1]
      if (last?.role === 'user') {
        const el = msgRefs.current.get(last.id)
        const container = messagesContainerRef.current
        if (el && container) {
          const elRect = el.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - 16
          if (Math.abs(container.scrollTop - targetScrollTop) > 40) {
            container.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
          }
        }
        isNearBottomRef.current = true
        return
      }
    }
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.messages])

  useEffect(() => {
    if (state.pendingQuestion) {
      const q = state.pendingQuestion
      trackEvent('question_sent', {
        scenarioId: state.currentScenario,
        phase: state.phase,
        source: 'pending_question',
        value: q,
      })
      dispatch({ type: 'SET_PENDING_QUESTION', question: null })
      if (scenario) {
        scenario.handleSend(q, { state: stateRef.current, dispatch, stateRef })
      }
    }
  }, [state.pendingQuestion, dispatch, scenario])

  useEffect(() => {
    const key = `${state.currentScenario}:${state.phase}`
    if (key === lastPhaseEnterKey.current) return
    lastPhaseEnterKey.current = key
    if (scenario?.onPhaseEnter) {
      scenario.onPhaseEnter(state.phase, { state: stateRef.current, dispatch, stateRef })
    }
  }, [state.phase, state.currentScenario, scenario, dispatch])

  const handleSend = useCallback((text: string, source = 'chat_input') => {
    if (source !== 'action_button') {
      trackEvent('question_sent', {
        scenarioId: stateRef.current.currentScenario,
        phase: stateRef.current.phase,
        source,
        value: text,
      })
    }
    if (scenario) {
      scenario.handleSend(text, { state: stateRef.current, dispatch, stateRef })
    }
  }, [scenario, dispatch])

  const handleComponentAction = useCallback((action: string, payload: Record<string, unknown>) => {
    trackEvent(action === 'openPreview' ? 'preview_opened' : 'component_action_clicked', {
      scenarioId: stateRef.current.currentScenario,
      phase: stateRef.current.phase,
      source: 'chat_component',
      action,
      ...payload,
    })
    // PreviewTriggerCard 的点击：直接 dispatch 到 store，不经过 scenario
    if (action === 'openPreview') {
      dispatch({ type: 'OPEN_PREVIEW', readonly: !!(payload.readonly), targetPhase: payload.targetPhase as string | undefined })
      if (payload.messageId) {
        dispatch({ type: 'UPDATE_MESSAGE', id: payload.messageId as string, updates: { componentHandled: true } })
      }
      return
    }

    if (action === 'selectScenario' && !scenario) {
      const all = getAllScenarios()
      const target = all.find((s: any) => s.id === payload.scenario)
      if (target) {
        target.handleComponentAction(action, payload, { state: stateRef.current, dispatch, stateRef })
        return
      }
    }
    if (scenario) {
      scenario.handleComponentAction(action, payload, { state: stateRef.current, dispatch, stateRef })
    }
  }, [scenario, dispatch])

  const actionButtons: ActionButtonDef[] | null = React.useMemo(() => {
    if (!scenario) return null
    return scenario.actionButtonsMap(state.phase, state.isStreaming)
  }, [scenario, state.phase, state.isStreaming])

  const handleActionButtonClick = useCallback((value: string) => {
    const button = actionButtons?.find(btn => btn.value === value)
    trackEvent('action_button_clicked', {
      scenarioId: stateRef.current.currentScenario,
      phase: stateRef.current.phase,
      label: button?.label,
      value,
      source: 'action_button',
    })
    handleSend(value, 'action_button')
  }, [actionButtons, handleSend])

  const visibleComponents = scenario?.chatVisibleComponents || []
  // 全局注册表 + 场景专属组件合并，供 MessageBubble 渲染任意已注册组件
  const extraComponentMap = {
    ...demoComponentRegistry,
    ...(scenario?.extraComponentMap || {}),
  }

  const filteredMessages = state.messages.filter(msg => {
    if (msg.hidden) return false
    if (msg.role === 'user') return true
    if (msg.role === 'assistant') {
      if (!msg.component) return true
      if (visibleComponents.includes(msg.component as string)) return true
      return false
    }
    return false
  })

  const lastAssistantIdx = (() => {
    for (let i = filteredMessages.length - 1; i >= 0; i--) {
      if (filteredMessages[i].role === 'assistant') return i
    }
    return -1
  })()

  const groupStartFlags = filteredMessages.map((msg, idx) => {
    if (msg.role === 'user') return true
    if (idx === 0) return true
    const prev = filteredMessages[idx - 1]
    if (prev.role === 'user') return true
    // 多角色：优先用消息级别的 agentName 区分，其次用 componentProps.assistantAvatar
    const prevAgent = prev.agentName || (prev.componentProps?.assistantAvatar as string) || 'default'
    const curAgent = msg.agentName || (msg.componentProps?.assistantAvatar as string) || 'default'
    return prevAgent !== curAgent
  })

  return (
    <div className={`chat-panel${mode === 'fullscreen' ? ' chat-panel-fullscreen' : ''}`}>
      <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        <div className="chat-messages__inner">
          {filteredMessages.map((msg, idx) => (
            <div
              key={msg.id}
              ref={el => {
                if (el) msgRefs.current.set(msg.id, el)
                else msgRefs.current.delete(msg.id)
              }}
            >
              <MessageBubble
                message={msg}
                onComponentAction={handleComponentAction}
                phase={state.phase}
                extraComponentMap={extraComponentMap}
                isGroupStart={groupStartFlags[idx]}
                actionButtons={idx === lastAssistantIdx && !state.isStreaming ? (actionButtons ?? undefined) : undefined}
                onActionButtonClick={handleActionButtonClick}
                currentAgentName={state.currentAgentName}
                currentAvatarKey={state.currentAvatarKey}
              />
            </div>
          ))}

          {state.isStreaming && (
            <div className="chat-typing-indicator">
              <span className="spinner" /> AI 正在分析...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-input-anchor">
        {showScrollToTop && (
          <button
            className="chat-scroll-to-top"
            onClick={() => {
              const c = messagesContainerRef.current
              if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' })
            }}
            title="跳到最新消息"
          >
            <ChevronDown size={14} />
          </button>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={state.isStreaming}
          showQuickPrompts={false}
        />
      </div>
    </div>
  )
}
