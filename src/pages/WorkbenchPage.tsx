import { useState, useCallback, useEffect, useRef, useMemo, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useApp, useAppDispatch, useAppState } from '../shared/store/AppContext'
import { genMessageId, streamFakeText, summarizeTaskTitle } from '../shared/utils'
import { AuditWorkspaceShell } from '../components/AuditWorkspaceShell'
import { getAllAgents, getAllScenarios, getScenario } from '../scenarios/registry'
import type { ScenarioModule } from '../scenarios/types'
import { trackEvent } from '../shared/telemetry'
import {
  NATIVE_ASSISTANT_EXPERIENCES,
  getNativeAssistantExperience,
  getNativeAssistantInputPlaceholder,
  getNativeAssistantQuickActions,
  nativeAvatarSrc,
} from '../shared/nativeAssistants'
import { HOME_SKILL_OPTIONS } from '../shared/homeSkillOptions'
import { AgentsMarketPage, SkillsMarketPage, TasksMarketPage } from './NativeMarketPages'
import { getReplayScene, type ReplayScene } from '../shared/taskReplayData'
import type { ChatMessage } from '../shared/store/types'
import GenericPanel from '../engine/components/GenericPanel'
import PurchaseFieldExtractionPanel from '../engine/components/PurchaseFieldExtractionPanel'
import ControlPriceReplayPanel from '../engine/components/ControlPriceReplayPanel'
import AgentAvatar from '../shared/chat/components/AgentAvatar'

// ─── 场景意图识别 ──────────────────────────────────────────────────────────────
// 匹配优先级：场景名称 → AI专员简介 → step_1 触发方式关键词

function matchScenario(text: string, scenarios: ScenarioModule[]): ScenarioModule | null {
  if (scenarios.length === 0) return null
  if (scenarios.length === 1) return scenarios[0]  // 只有一个场景直接进入

  const lower = text.toLowerCase()

  // 1. 场景名称匹配（含子串）
  const byLabel = scenarios.find(s =>
    lower.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(lower.slice(0, 4))
  )
  if (byLabel) return byLabel

  // 2. AI 专员名称匹配，命中后进入该专员的第一个场景
  const byAgentName = scenarios.find(s =>
    s.agentName &&
    (lower.includes(s.agentName.toLowerCase()) || s.agentName.toLowerCase().includes(lower.slice(0, 4)))
  )
  if (byAgentName) return byAgentName

  // 3. AI专员简介关键词匹配
  const byDesc = scenarios.find(s => {
    const doc = (s as any)._doc
    const desc: string = s.agentDescription || doc?.meta?.agentDescription || doc?.description || ''
    return desc && lower.split(/[\s，。？！,?.!]+/).some(w => w.length >= 2 && desc.toLowerCase().includes(w))
  })
  if (byDesc) return byDesc

  // 4. step_1 触发方式关键词匹配
  const byTrigger = scenarios.find(s => {
    const doc = (s as any)._doc
    const trigger: string = doc?.steps?.[0]?.trigger || ''
    return trigger && lower.split(/[\s，。？！,?.!]+/).some(w => w.length >= 2 && trigger.toLowerCase().includes(w))
  })
  if (byTrigger) return byTrigger

  return null
}

function getEmptyScenarioReply() {
  return '当前模板还没有配置演示场景。请先新增一个业务场景后再开始演示。'
}

function NomaAssistantAvatar() {
  return (
    <svg className="home-agent-switch__noma-avatar" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <g clipPath="url(#home-noma-avatar-clip)">
        <rect width="18" height="18" rx="9" fill="#E9ECFF" />
        <path d="M7.91699 10.8374C7.87012 10.6558 7.77542 10.49 7.64275 10.3573C7.51007 10.2246 7.34427 10.1299 7.16259 10.083L3.9418 9.25251C3.88685 9.23692 3.83848 9.20382 3.80405 9.15825C3.76961 9.11268 3.75098 9.05711 3.75098 8.99999C3.75098 8.94287 3.76961 8.88731 3.80405 8.84174C3.83848 8.79617 3.88685 8.76307 3.9418 8.74748L7.16259 7.91642C7.3442 7.8696 7.50997 7.77498 7.64263 7.6424C7.7753 7.50982 7.87004 7.34413 7.91699 7.16254L8.74752 3.94175C8.76296 3.88658 8.79602 3.83798 8.84166 3.80336C8.8873 3.76874 8.94301 3.75 9.0003 3.75C9.05759 3.75 9.1133 3.76874 9.15894 3.80336C9.20458 3.83798 9.23764 3.88658 9.25308 3.94175L10.0831 7.16254C10.13 7.34422 10.2247 7.51003 10.3573 7.6427C10.49 7.77538 10.6558 7.87008 10.8375 7.91695L14.0583 8.74695C14.1137 8.76223 14.1625 8.79525 14.1973 8.84096C14.2321 8.88667 14.251 8.94254 14.251 8.99999C14.251 9.05745 14.2321 9.11332 14.1973 9.15902C14.1625 9.20473 14.1137 9.23776 14.0583 9.25304L10.8375 10.083C10.6558 10.1299 10.49 10.2246 10.3573 10.3573C10.2247 10.49 10.13 10.6558 10.0831 10.8374L9.25256 14.0582C9.23712 14.1134 9.20406 14.162 9.15842 14.1966C9.11278 14.2312 9.05706 14.25 8.99978 14.25C8.94249 14.25 8.88678 14.2312 8.84114 14.1966C8.7955 14.162 8.76243 14.1134 8.74699 14.0582L7.91699 10.8374Z" fill="url(#home-noma-avatar-gradient)" />
      </g>
      <defs>
        <linearGradient id="home-noma-avatar-gradient" x1="14.1772" y1="9.29164" x2="3.80735" y2="9.26889" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8477FF" />
          <stop offset="1" stopColor="#5AA8FF" />
        </linearGradient>
        <clipPath id="home-noma-avatar-clip">
          <rect width="18" height="18" rx="9" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function NomaHeroLogo() {
  return (
    <svg className="home-content__noma-logo" width="110" height="28" viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Noma" role="img">
      <g clipPath="url(#home-noma-hero-clip)">
        <path d="M25.9342 0.139022V27.4334C24.4985 27.4334 23.108 27.2974 21.7478 27.4636C20.0702 27.6752 19.1333 26.9498 18.166 25.6802C14.3423 20.6476 10.3979 15.7207 6.48354 10.7484C6.39287 10.6427 6.30219 10.5368 6.09061 10.2951V27.3729H0V0.0634525C1.32996 0.0634525 2.64481 0.169245 3.92943 0.0332292C5.56164 -0.148133 6.61957 0.411055 7.63215 1.75613C11.4255 6.77369 15.3701 11.6855 19.2542 16.6426C19.3902 16.8088 19.5262 16.9901 19.7831 17.2925V0.139022H25.9493H25.9342Z" fill="url(#home-noma-hero-gradient-0)" />
        <path d="M40.1333 27.5C35.9318 27.3337 32.6069 25.777 30.5969 22.0894C28.6776 18.553 28.7228 14.9409 30.869 11.5254C33.1812 7.86798 36.6723 6.38689 40.9343 6.67404C43.8209 6.87052 46.2994 8.00396 48.1886 10.2408C50.8486 13.3692 51.4833 16.951 50.0929 20.7747C48.7175 24.5075 45.8612 26.6083 41.962 27.3035C41.3121 27.4245 40.6623 27.4546 40.1333 27.5ZM44.9242 17.0266C44.9242 14.1098 42.7932 11.9031 39.9972 11.9183C37.2013 11.9183 35.0704 14.1249 35.0704 17.0417C35.0704 19.9283 37.2013 22.1499 39.9972 22.1499C42.7781 22.1499 44.9242 19.9131 44.9242 17.0266Z" fill="url(#home-noma-hero-gradient-1)" />
        <path d="M79.4253 27.5C79.4253 27.0919 79.4253 26.7594 79.4253 26.4421C79.4253 23.1474 79.4253 19.8376 79.4253 16.5429C79.4253 16.1652 79.395 15.7873 79.3497 15.4095C79.0777 13.6563 78.0499 12.6438 76.4026 12.4775C74.7704 12.3263 73.2742 13.2331 72.7755 14.8201C72.5336 15.5757 72.4128 16.3918 72.3977 17.1928C72.3523 20.1399 72.3825 23.0869 72.3825 26.034C72.3825 26.5026 72.3825 26.971 72.3825 27.5H66.6395C66.6395 27.1826 66.6395 26.9105 66.6395 26.6385C66.6395 23.359 66.6395 20.0945 66.6244 16.815C66.6244 16.2104 66.5791 15.606 66.4431 15.0165C66.0351 13.3843 64.9016 12.4623 63.3298 12.4473C61.7127 12.4322 60.3676 13.3843 59.9444 14.9409C59.763 15.6361 59.6573 16.3767 59.6573 17.1021C59.627 20.2759 59.6573 23.4496 59.6422 26.6234C59.6422 26.8954 59.6119 27.1675 59.5968 27.4848H54.0654V7.6564H59.6119V9.86296C61.1686 7.79242 63.2694 7.06699 65.6724 7.15766C68.1055 7.26345 70.0098 8.33649 71.2642 10.543C71.3851 10.407 71.4758 10.3314 71.5362 10.2257C73.7428 6.94609 78.3069 6.34155 81.526 8.07956C83.1431 8.95615 84.1557 10.3465 84.6545 12.0695C84.9264 13.0215 85.1229 14.0493 85.138 15.0317C85.1834 19.0064 85.1532 22.9963 85.138 26.971C85.138 27.1221 85.1078 27.2581 85.0927 27.4546H79.395L79.4253 27.5Z" fill="url(#home-noma-hero-gradient-2)" />
        <path d="M104.149 9.29929V7.09279H109.62V26.9363H104.179V24.881C104.043 24.881 103.968 24.8508 103.953 24.8659C101.504 27.7827 98.3608 27.9792 95.0812 26.8911C91.1064 25.5762 89.0661 22.5082 88.5372 18.5032C87.9931 14.3018 89.308 10.7199 92.8596 8.19609C95.7915 6.11043 99.993 6.0651 102.668 7.9845C103.152 8.33212 103.575 8.77038 104.164 9.29929H104.149ZM99.192 11.8988C96.3961 11.8988 94.2348 14.0599 94.2198 16.8861C94.2198 19.8483 96.381 22.1153 99.2222 22.1303C102.048 22.1303 104.179 19.9238 104.179 16.9466C104.179 14.0599 102.064 11.9139 99.192 11.8988Z" fill="url(#home-noma-hero-gradient-3)" />
      </g>
      <defs>
        <linearGradient id="home-noma-hero-gradient-0" x1="153.491" y1="24.152" x2="22.2066" y2="1.64746" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8477FF" />
          <stop offset="1" stopColor="#5AA8FF" />
        </linearGradient>
        <linearGradient id="home-noma-hero-gradient-1" x1="153.167" y1="23.7199" x2="21.882" y2="1.21536" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8477FF" />
          <stop offset="1" stopColor="#5AA8FF" />
        </linearGradient>
        <linearGradient id="home-noma-hero-gradient-2" x1="153.104" y1="24.2639" x2="21.8194" y2="1.75936" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8477FF" />
          <stop offset="1" stopColor="#5AA8FF" />
        </linearGradient>
        <linearGradient id="home-noma-hero-gradient-3" x1="153.103" y1="23.7004" x2="21.8183" y2="1.19579" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8477FF" />
          <stop offset="1" stopColor="#5AA8FF" />
        </linearGradient>
        <clipPath id="home-noma-hero-clip">
          <rect width="109.62" height="27.5" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

type AgentModalState = 'closed' | 'opening' | 'open' | 'closing'
type NativePage = 'home' | 'agents' | 'skills' | 'tasks'
type HomeAgentSwitchDirection = 'to-primary' | 'to-assistant'
type AgentPickerMode = 'toolbar' | 'mention'

const CONTROL_PRICE_SCENARIO_ID = 'control-price__audit-control-price'
const CONTROL_PRICE_MENTION_TITLE = '深圳湾控制价审核'

function normalizeIntentText(value: string): string {
  return value
    .replace(/[，,。.!！?？\s]+/g, '')
    .toLowerCase()
}

function matchHomeMentionScenario(text: string): { scenarioId: string; taskTitle: string } | null {
  const normalized = normalizeIntentText(text)
  if (
    normalized.includes('@成本分析助手') &&
    (
      normalized.includes('控制价审核') ||
      normalized.includes('深圳湾') ||
      normalized.includes('施工总承包清单')
    )
  ) {
    return {
      scenarioId: CONTROL_PRICE_SCENARIO_ID,
      taskTitle: CONTROL_PRICE_MENTION_TITLE,
    }
  }
  return null
}

// ─── 工作台视图（选中场景后） ──────────────────────────────────────────────────

function useScenarioPanelContent(phaseOverride?: string, targetArtifactTitle?: string | null) {
  const { state, dispatch } = useApp()
  const scenario = getScenario(state.currentScenario)
  const phase = phaseOverride ?? state.phase
  const replayScene = !scenario && state.currentScenario ? getReplayScene(state.currentScenario) : null
  const purchaseSubmitted = Boolean((state.scenarioStates['task-replay-purchase-field-extraction'] as { submitted?: boolean } | undefined)?.submitted)

  const handleAskQuestion = (q: string) => {
    trackEvent('question_sent', {
      scenarioId: state.currentScenario,
      phase,
      source: 'panel',
      value: q,
    })
    dispatch({ type: 'SET_PENDING_QUESTION', question: q })
  }

  const panelTitle = scenario?.panelTitleMap?.[phase] ?? '内容预览'

  if (scenario && scenario.panelMap[phase]) {
    const PanelComponent = scenario.panelMap[phase]
    return {
      node: (
        <PanelComponent
          onAskQuestion={handleAskQuestion}
          readonly={state.openPreviewReadonly}
        />
      ),
      hasContent: true,
      panelTitle,
      panelFooter: null,
      panelHasInternalClose: Boolean((PanelComponent as any).hasInternalClose),
    }
  }

  if (replayScene?.panel && replayScene.panel.phase === phase) {
    if (replayScene.panel.phase === 'task-replay-purchase-field-extraction') {
      const handlePurchaseSubmit = () => {
        if (purchaseSubmitted) return
        const now = Date.now()
        dispatch({
          type: 'SET_SCENARIO_STATE',
          scenarioId: 'task-replay-purchase-field-extraction',
          state: { submitted: true },
        })
        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: genMessageId(),
            role: 'user',
            content: '确认提交',
            timestamp: now,
          },
        })
        const replyId = genMessageId()
        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: replyId,
            role: 'assistant',
            content: '',
            timestamp: now + 1,
            agentName: replayScene.agentName,
            agentAvatarKey: replayScene.avatarKey,
          },
        })
        streamFakeText('认购单已提交完成。', replyId, dispatch, scrollReplayConversationToEnd)
        scrollReplayConversationToEnd()
      }

      return {
        node: (
          <PurchaseFieldExtractionPanel
            submitted={purchaseSubmitted}
            onSubmit={handlePurchaseSubmit}
          />
        ),
        hasContent: true,
        panelTitle: replayScene.panel.title,
        panelFooter: null,
        panelHasInternalClose: true,
      }
    }
    if (replayScene.panel.phase === 'task-replay-control-price-report') {
      return {
        node: <ControlPriceReplayPanel targetArtifactTitle={targetArtifactTitle} />,
        hasContent: true,
        panelTitle: replayScene.panel.title,
        panelFooter: null,
        panelHasInternalClose: true,
      }
    }
    return {
      node: (
        <GenericPanel
          description={replayScene.panel.markdown}
          title={replayScene.panel.title}
          readonly={state.openPreviewReadonly}
        />
      ),
      hasContent: true,
      panelTitle: replayScene.panel.title,
      panelFooter: null,
      panelHasInternalClose: false,
    }
  }

  return { node: null, hasContent: false, panelTitle: '内容预览', panelFooter: null, panelHasInternalClose: false }
}

interface AuditWorkspaceViewProps {
  onBack?: () => void
  railCollapsed?: boolean
  onRailCollapsedChange?: (collapsed: boolean) => void
  taskReplaySceneId?: string | null
  navHidden?: boolean
}

function replaySceneToMessages(scene: ReplayScene, options: { includeArtifacts?: boolean } = {}): ChatMessage[] {
  const now = Date.now()
  const messages: ChatMessage[] = []
  const appendArtifactMessage = (
    artifact: NonNullable<ReplayScene['artifact']>,
    idSuffix: string,
  ) => {
    messages.push({
      id: `task-replay-${scene.id}-${idSuffix}`,
      role: 'assistant',
      content: '',
      timestamp: now + messages.length,
      component: 'PreviewTriggerCard',
      componentProps: {
        title: artifact.title,
        meta: artifact.meta,
        icon: artifact.icon,
        targetPhase: artifact.targetPhase,
        scrollBeforeOpen: false,
        replayClickLabel: artifact.title,
        replayClickKind: 'artifact-card',
      },
      agentName: scene.agentName,
      agentAvatarKey: scene.avatarKey,
    })
  }
  const appendConfirmMessage = (label: string, idSuffix: string) => {
    messages.push({
      id: `task-replay-${scene.id}-${idSuffix}`,
      role: 'assistant',
      content: '',
      timestamp: now + messages.length,
      component: 'ConfirmAction',
      componentProps: {
        confirmLabel: label,
        confirmAction: 'taskReplayConfirm',
        replayClickLabel: label,
        replayClickKind: 'confirm-action',
      },
      agentName: scene.agentName,
      agentAvatarKey: scene.avatarKey,
    })
  }
  const appendArtifactGroupMessage = (
    artifacts: NonNullable<ReplayScene['rounds'][number]['artifactGroup']>,
    idSuffix: string,
  ) => {
    messages.push({
      id: `task-replay-${scene.id}-${idSuffix}`,
      role: 'assistant',
      content: '',
      timestamp: now + messages.length,
      component: 'ArtifactStackCard',
      componentProps: {
        items: artifacts,
        replayClickLabel: artifacts[0]?.title,
        replayClickKind: 'artifact-card',
        targetPhase: artifacts[0]?.targetPhase,
      },
      agentName: scene.agentName,
      agentAvatarKey: scene.avatarKey,
    })
  }

  scene.rounds.forEach((round, roundIndex) => {
    if (round.clickLabel) {
      appendConfirmMessage(round.clickLabel, `${roundIndex}-confirm`)
    }

    if (round.user_message) {
      messages.push({
        id: `task-replay-${scene.id}-${roundIndex}-user`,
        role: 'user',
        content: round.user_message,
        timestamp: now + messages.length,
        attachment: round.user_attachment,
      })
    }
    messages.push({
      id: `task-replay-${scene.id}-${roundIndex}-assistant`,
      role: 'assistant',
      content: round.assistant_message,
      timestamp: now + messages.length,
      agentName: scene.agentName,
      agentAvatarKey: scene.avatarKey,
    })

    if (options.includeArtifacts !== false && round.artifact) {
      appendArtifactMessage(round.artifact, `${roundIndex}-artifact`)
    }

    if (options.includeArtifacts !== false && round.artifactGroup?.length) {
      appendArtifactGroupMessage(round.artifactGroup, `${roundIndex}-artifact-group`)
    }

    if (round.divider) {
      messages.push({
        id: `task-replay-${scene.id}-${roundIndex}-divider`,
        role: 'assistant',
        content: '',
        timestamp: now + messages.length,
        component: 'TaskReplayDivider',
        componentProps: {
          text: round.divider,
        },
        agentName: scene.agentName,
        agentAvatarKey: scene.avatarKey,
      })
    }
  })

  if (options.includeArtifacts !== false && scene.artifact) {
    appendArtifactMessage(scene.artifact, 'artifact')
  }

  return messages
}

const REPLAY_CONTROL_INTERVAL_MS = 600
const REPLAY_TYPEWRITER_INTERVAL_MS = 14
const REPLAY_CURSOR_SETTLE_MS = 520
const REPLAY_CURSOR_CLICK_MS = 320
const REPLAY_CURSOR_RETURN_MS = 420

type ReplayCursorState = {
  visible: boolean
  x: number
  y: number
  clicking: boolean
  variant?: 'pointer' | 'hand'
}

function getReplayCursorDockPosition() {
  return {
    x: Math.round(window.innerWidth - 142),
    y: Math.round(window.innerHeight - 76),
  }
}

function scrollReplayConversationToEnd() {
  window.requestAnimationFrame(() => {
    const scroller = document.querySelector<HTMLElement>('.chat-messages-shell, .chat-messages')
    if (scroller) scroller.scrollTop = scroller.scrollHeight
    document.querySelector<HTMLElement>('.chat-messages__end-anchor')?.scrollIntoView({ block: 'end' })
  })
}

function findReplayTarget(label: string, kind?: string): { x: number; y: number } {
  const selectors = kind === 'artifact-card'
    ? ['.artifact-stack-card__item', '.preview-trigger-card']
    : kind === 'purchase-submit'
      ? ['.purchase-extraction-panel__btn--primary']
      : ['.confirm-action .action-btn-primary', '.action-btn', '.standard-replay-player__button.is-primary', '.chat-input-anchor', '.chat-panel-input-wrapper']

  for (const selector of selectors) {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector))
    const match = nodes.find(node => node.textContent?.includes(label)) ?? nodes[0]
    const rect = match?.getBoundingClientRect()
    if (rect && rect.width > 0 && rect.height > 0) {
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      }
    }
  }

  if (kind === 'artifact-card') {
    return { x: Math.round(window.innerWidth * 0.16), y: Math.round(window.innerHeight * 0.72) }
  }

  return { x: Math.round(window.innerWidth * 0.26), y: Math.round(window.innerHeight * 0.89) }
}

function triggerReplayElement(label: string, kind?: string) {
  const selectors = kind === 'purchase-submit'
    ? ['.purchase-extraction-panel__btn--primary']
    : kind === 'artifact-card'
      ? ['.artifact-stack-card__item', '.preview-trigger-card']
      : ['.confirm-action .action-btn-primary', '.action-btn']

  for (const selector of selectors) {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector))
    const match = nodes.find(node => node.textContent?.includes(label)) ?? nodes[0]
    if (match) {
      match.click()
      return true
    }
  }
  return false
}

function simulateReplayClick({
  label,
  kind,
  setCursor,
  timerRef,
  onAfterClick,
}: {
  label: string
  kind?: string
  setCursor: React.Dispatch<React.SetStateAction<ReplayCursorState>>
  timerRef: React.MutableRefObject<number | null>
  onAfterClick?: () => void
}) {
  timerRef.current = window.setTimeout(() => {
    const target = findReplayTarget(label, kind)
    setCursor(current => ({
      ...current,
      visible: true,
      x: target.x,
      y: target.y,
      clicking: false,
      variant: 'pointer',
    }))
    timerRef.current = window.setTimeout(() => {
      setCursor(current => ({ ...current, clicking: true, variant: 'hand' }))
      timerRef.current = window.setTimeout(() => {
        triggerReplayElement(label, kind)
        setCursor(current => ({ ...current, clicking: false, variant: 'pointer' }))
        const dock = getReplayCursorDockPosition()
        timerRef.current = window.setTimeout(() => {
          setCursor(current => ({ ...current, ...dock, visible: true, clicking: false, variant: 'pointer' }))
          onAfterClick?.()
        }, REPLAY_CURSOR_RETURN_MS)
      }, REPLAY_CURSOR_CLICK_MS)
    }, REPLAY_CURSOR_SETTLE_MS)
  }, 180)
}

function simulatePurchaseReviewAndSubmit({
  setCursor,
  timerRef,
  onAfterClick,
}: {
  setCursor: React.Dispatch<React.SetStateAction<ReplayCursorState>>
  timerRef: React.MutableRefObject<number | null>
  onAfterClick?: () => void
}) {
  const waitForWorkbench = (attempt = 0) => {
    const formRect = document.querySelector<HTMLElement>('.purchase-form-card')?.getBoundingClientRect()
    const submitButton = document.querySelector<HTMLButtonElement>('.purchase-extraction-panel__btn--primary:not(:disabled)')
    if (formRect && formRect.width > 0 && formRect.height > 0 && submitButton) {
      runReviewPath()
      return
    }
    timerRef.current = window.setTimeout(() => waitForWorkbench(attempt + 1), attempt > 20 ? 320 : 180)
  }

  const moveTo = (point: { x: number; y: number }, delay: number, next: () => void) => {
    timerRef.current = window.setTimeout(() => {
      setCursor(current => ({
        ...current,
        visible: true,
        x: point.x,
        y: point.y,
        clicking: false,
        variant: 'pointer',
      }))
      next()
    }, delay)
  }

  const runReviewPath = () => {
    const body = document.querySelector<HTMLElement>('.purchase-extraction-panel__body')
    const formRect = document.querySelector<HTMLElement>('.purchase-form-card')?.getBoundingClientRect()
    const submitTarget = findReplayTarget('确认提交', 'purchase-submit')
    if (!formRect) {
      waitForWorkbench()
      return
    }

    const topPoint = {
      x: Math.round(formRect.left + Math.min(140, formRect.width * 0.24)),
      y: Math.round(formRect.top + 42),
    }
    const middlePoint = {
      x: Math.round(formRect.left + formRect.width * 0.52),
      y: Math.round(formRect.top + Math.min(formRect.height - 36, 250)),
    }
    const bottomPoint = {
      x: Math.round(formRect.left + formRect.width * 0.52),
      y: Math.round(Math.min(window.innerHeight - 92, formRect.bottom - 30)),
    }

    moveTo(topPoint, 0, () => {
      timerRef.current = window.setTimeout(() => {
        body?.scrollTo({ top: 0, behavior: 'smooth' })
        moveTo(middlePoint, 520, () => {
          timerRef.current = window.setTimeout(() => {
            body?.scrollTo({ top: Math.max(0, body.scrollHeight * 0.28), behavior: 'smooth' })
            moveTo(bottomPoint, 620, () => {
              timerRef.current = window.setTimeout(() => {
                setCursor(current => ({
                  ...current,
                  x: submitTarget.x,
                  y: submitTarget.y,
                  clicking: false,
                  variant: 'pointer',
                  visible: true,
                }))
                timerRef.current = window.setTimeout(() => {
                  setCursor(current => ({ ...current, clicking: true, variant: 'hand' }))
                  timerRef.current = window.setTimeout(() => {
                    const clicked = triggerReplayElement('确认提交', 'purchase-submit')
                    setCursor(current => ({ ...current, clicking: false, variant: 'pointer' }))
                    const dock = getReplayCursorDockPosition()
                    timerRef.current = window.setTimeout(() => {
                      setCursor(current => ({ ...current, ...dock, visible: true, clicking: false, variant: 'pointer' }))
                      if (!clicked) {
                        waitForWorkbench()
                        return
                      }
                      onAfterClick?.()
                    }, REPLAY_CURSOR_RETURN_MS)
                  }, REPLAY_CURSOR_CLICK_MS)
                }, REPLAY_CURSOR_SETTLE_MS)
              }, 260)
            })
          }, 260)
        })
      }, 320)
    })
  }

  timerRef.current = window.setTimeout(() => waitForWorkbench(), 540)
}

function ReplayCursor({ cursor }: { cursor: ReplayCursorState }) {
  return (
    <div
      className={`task-replay-cursor${cursor.visible ? ' task-replay-cursor--visible' : ''}${cursor.clicking ? ' task-replay-cursor--clicking' : ''}${cursor.variant === 'hand' ? ' task-replay-cursor--hand' : ''}`}
      style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
      aria-hidden="true"
    >
      {cursor.variant === 'hand' ? <ReplayHandCursorIcon /> : <ReplayPointerCursorIcon />}
      <span className="task-replay-cursor__pulse" />
    </div>
  )
}

function ReplayPointerCursorIcon() {
  return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <g clipPath="url(#task-replay-pointer-clip)">
          <g filter="url(#task-replay-pointer-shadow)">
            <path d="M3.24264 3.24271L9.94875 18.4341L11.703 11.7031L18.434 9.94882L3.24264 3.24271Z" fill="black" />
            <path d="M3.24264 3.24271L9.94875 18.4341L11.703 11.7031L18.434 9.94882L3.24264 3.24271Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
          </g>
        </g>
        <defs>
          <filter id="task-replay-pointer-shadow" x="0.855105" y="1.74884" width="19.9665" height="19.9665" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="0.893737" />
            <feGaussianBlur stdDeviation="0.893737" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2585_6366" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2585_6366" result="shape" />
          </filter>
          <clipPath id="task-replay-pointer-clip">
            <rect width="20" height="20" fill="white" />
          </clipPath>
        </defs>
      </svg>
  )
}

function ReplayHandCursorIcon() {
  return (
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <rect width="15" height="16" transform="translate(2 1)" fill="white" fillOpacity="0.01"/>
        <g filter="url(#task-replay-cursor-shadow)">
          <path fillRule="evenodd" clipRule="evenodd" d="M5.82053 14.4501C5.97083 14.5855 6.0746 14.6828 6.39524 14.9874C6.70931 15.2857 6.86119 15.4267 7.00007 15.5446C7.05799 15.5934 7.10737 15.7238 7.12693 15.9178C7.14303 16.0773 7.13743 16.2553 7.11791 16.4268C7.11117 16.4861 7.10466 16.5289 7.10093 16.5493C7.05906 16.778 7.23342 16.9894 7.466 16.9917C7.6753 16.9939 7.83657 16.9965 8.26341 17.0041C8.37021 17.006 8.37021 17.006 8.47737 17.0078C9.63766 17.0278 10.2303 17.0223 10.6556 16.9688C11.1102 16.9117 11.5784 16.3626 11.9831 15.6737C12.3261 16.2833 12.8018 16.8786 13.2821 16.956C13.4347 16.9804 13.6194 16.9879 13.8333 16.983C13.9929 16.9793 14.1617 16.9688 14.332 16.9536C14.4605 16.9421 14.5629 16.9306 14.624 16.9226C14.8499 16.8933 14.9978 16.671 14.9374 16.4514C14.9244 16.4039 14.9034 16.3169 14.8823 16.2073C14.8578 16.0802 14.8401 15.9561 14.832 15.8431C14.8269 15.7714 14.8259 15.7065 14.8292 15.6504C14.8348 15.5526 14.8366 15.4979 14.8393 15.3713C14.8404 15.3242 14.8404 15.3242 14.8418 15.283C14.847 15.1482 14.8652 15.0201 14.9238 14.7408C14.949 14.6196 15.0711 14.3876 15.2634 14.1006C15.3207 14.0151 15.3833 13.9258 15.4504 13.8336C15.5776 13.6588 15.7145 13.4822 15.8514 13.3132C15.9335 13.212 15.9969 13.1363 16.0322 13.0951C16.3285 12.6707 16.6443 11.976 16.7604 11.5698C16.8718 11.1794 16.9609 10.4604 17.0157 9.75373C17.0457 9.35284 17.0568 9.02968 17.0568 8.52275C17.0569 8.43384 17.0569 8.43384 17.057 8.36041C17.0573 8.24015 17.0573 8.19467 17.0569 8.13845C17.0558 7.98487 17.0514 7.83265 17.0365 7.44443C17.0046 6.63078 16.5587 6.10474 15.9017 6.00327C15.3427 5.91695 14.6623 6.38123 14.6623 6.38123C14.6623 6.38123 14.5108 5.85842 14.4086 5.69702C14.2424 5.43767 13.8144 5.10719 13.4872 5.04281C13.1507 4.97747 12.7518 4.98469 12.3855 5.04949C12.0647 5.10689 11.7451 5.39331 11.5603 5.70226C11.4281 5.92265 11.5524 5.69057 11.4202 5.46258C11.2371 5.14856 10.8108 4.86735 10.4049 4.78436C10.061 4.71323 9.66691 4.74032 9.30697 4.84729C8.84393 4.98566 8.77022 5.33803 8.7518 5.23714C8.69022 4.8989 8.68453 4.92113 8.64615 4.67984C8.50357 3.78457 8.34401 3.16511 8.10208 2.62456C8.116 2.65564 8.01347 2.42241 7.97616 2.34199C7.91155 2.20274 7.84706 2.0767 7.77617 1.95547C7.55766 1.58182 7.30725 1.30206 6.99307 1.14313C6.44746 0.866838 5.62966 1.0013 5.24202 1.45378C4.85706 1.90345 4.79287 2.65527 4.88982 3.58562C4.92685 3.94683 5.05661 4.60628 5.17427 5.09374C5.21588 5.26293 5.25233 5.41723 5.31919 5.70226C5.33068 5.75074 5.33068 5.75074 5.34228 5.79924C5.394 6.01496 5.43936 6.19244 5.49351 6.3872C5.48782 6.3669 5.59052 6.73129 5.61239 6.81193C5.61967 6.83885 5.61967 6.83885 5.62688 6.86588C5.6677 7.01966 5.70762 7.18548 5.76998 7.46219C5.8041 7.61434 5.8374 7.77688 5.86997 7.94918C5.95881 8.41911 5.95925 8.32126 5.87373 8.22105C5.81466 8.15182 5.7591 8.08895 5.70543 8.03101C5.60566 7.92331 5.51394 7.83424 5.42687 7.7632C4.79247 7.24414 4.40374 7.0148 3.87005 6.96441C2.99463 6.88031 2.16385 7.49868 2.03893 8.33324C1.96211 8.84494 1.98686 9.08047 2.22357 9.53267C2.35383 9.777 2.57418 10.0721 2.9853 10.58C3.01046 10.6111 3.01046 10.6111 3.0356 10.6421C3.54025 11.264 3.59522 11.333 3.71522 11.5068C4.03957 11.9775 4.82917 13.329 4.9727 13.5104L5.82053 14.4501Z" fill="black"/>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M3.61839 10.1695C3.5935 10.1388 3.5935 10.1388 3.56868 10.1082C3.19139 9.64202 2.9845 9.36495 2.88712 9.18231C2.7343 8.89036 2.72599 8.81124 2.78106 8.44442C2.84579 8.01195 3.31288 7.66429 3.79935 7.71103C4.13596 7.74281 4.43004 7.91631 4.95275 8.34398C5.00935 8.39016 5.07758 8.45642 5.15563 8.54068C5.2018 8.59052 5.25077 8.64593 5.30364 8.70788C5.38304 8.80094 5.65066 9.1284 5.61125 9.08075C5.66939 9.15067 5.71097 9.20483 5.75847 9.2712C5.85257 9.40554 5.90552 9.48015 5.97722 9.57575C5.9436 9.53087 6.19195 9.87418 6.24454 9.92438C6.52314 10.1903 6.92657 9.96634 6.9013 9.61193C6.89708 9.55277 6.88317 9.48885 6.85412 9.37726C6.73924 8.55803 6.69906 8.29508 6.60734 7.80986C6.57326 7.62962 6.53828 7.45888 6.50212 7.29767C6.43777 7.0121 6.39577 6.8376 6.35218 6.67342C6.34443 6.64435 6.34443 6.64435 6.33665 6.61559C6.31365 6.53077 6.2094 6.16088 6.21634 6.1857C6.165 6.00102 6.1218 5.83196 6.07202 5.62436C6.06072 5.57707 6.06072 5.57707 6.04943 5.52946C5.98293 5.24595 5.94555 5.0877 5.90336 4.91619C5.79338 4.46051 5.66911 3.82899 5.63626 3.50851C5.56079 2.78429 5.61287 2.17432 5.81208 1.94162C5.96763 1.76005 6.40849 1.68757 6.6548 1.8123C6.81588 1.89378 6.97684 2.07361 7.12915 2.33407C7.1868 2.43264 7.24088 2.53833 7.29624 2.65764C7.32976 2.7299 7.42916 2.95601 7.41797 2.93101C7.62829 3.40093 7.77277 3.96188 7.90588 4.79772C7.94528 5.04539 7.99402 5.32596 8.05652 5.66923C8.0751 5.77102 8.0751 5.77102 8.09375 5.87237C8.39514 7.50771 8.37309 7.38377 8.37742 7.5142C8.39323 7.98998 9.09553 8.00112 9.12642 7.52608C9.13622 7.37543 9.13274 7.24092 9.11535 6.85462C9.11289 6.79997 9.11289 6.79997 9.11053 6.74552C9.09531 6.38961 9.09619 6.18485 9.11723 6.06846C9.15558 5.85623 9.3461 5.61848 9.52158 5.56605C9.768 5.49281 10.038 5.47425 10.2543 5.51898C10.4613 5.56131 10.7029 5.72069 10.7722 5.8396C10.8558 5.9836 10.9274 6.20298 10.9823 6.47491C11.0266 6.69439 11.0571 6.92984 11.0786 7.18115C11.0852 7.25934 11.0896 7.31975 11.0963 7.4197C11.0991 7.46153 11.0991 7.46153 11.102 7.49605C11.1036 7.51336 11.1036 7.51336 11.1075 7.54072C11.1105 7.5599 11.1105 7.5599 11.1248 7.60846C11.1321 7.74628 11.1321 7.74628 11.6856 7.79739C11.8509 7.59756 11.8509 7.59756 11.8464 7.56252C11.8735 7.44418 11.8901 7.31226 11.9137 7.06439C11.9288 6.90326 11.9364 6.82405 11.9453 6.74189C11.9821 6.40177 12.0288 6.18567 12.0858 6.09068C12.1565 5.97249 12.4056 5.80787 12.5173 5.78788C12.7978 5.73826 13.1059 5.73268 13.3437 5.77887C13.4515 5.80007 13.7143 6.00301 13.7765 6.10008C13.9042 6.30164 14.0284 6.95146 14.0984 7.5962C14.0874 7.63849 14.0874 7.63849 14.2591 7.8838C14.8495 7.8165 14.8495 7.8165 14.8329 7.70991C14.8485 7.67192 14.8608 7.62799 14.8784 7.55977C14.9206 7.40006 14.9486 7.30733 14.9902 7.20341C15.019 7.13152 15.0494 7.07006 15.0806 7.02113C15.2012 6.8312 15.5136 6.70217 15.7876 6.74448C16.0819 6.78992 16.2694 7.01113 16.2875 7.47345C16.302 7.85388 16.3063 8.00013 16.3073 8.14368C16.3077 8.19664 16.3077 8.23916 16.3074 8.35877C16.3073 8.43268 16.3073 8.43268 16.3072 8.52275C16.3072 9.01167 16.2967 9.31628 16.2683 9.69675C16.2176 10.35 16.1322 11.0396 16.0396 11.3638C15.9452 11.6944 15.6632 12.3147 15.4399 12.6373C15.424 12.6526 15.3561 12.7338 15.2692 12.841C15.1246 13.0194 14.9799 13.206 14.8444 13.3923C14.7718 13.492 14.7037 13.5892 14.6407 13.6832C14.397 14.0469 14.2407 14.3439 14.1901 14.5874C14.1236 14.9039 14.0999 15.0717 14.0927 15.2536C14.091 15.3051 14.091 15.3052 14.0899 15.3551C14.0873 15.4732 14.0858 15.5208 14.0808 15.6072C14.0756 15.6978 14.0771 15.7943 14.0843 15.8963C14.0947 16.0423 14.0843 16.2418 14.0843 16.2418C14.0843 16.2418 13.9577 16.2299 13.8165 16.2332C13.644 16.2372 13.5005 16.2313 13.4014 16.2154C13.2583 16.1924 12.872 15.709 12.6742 15.3324C12.3719 14.756 11.6382 14.7839 11.3374 15.293C11.0661 15.7548 10.6777 16.2102 10.5624 16.2247C10.1878 16.2718 9.60772 16.2771 8.49068 16.2579C8.38388 16.2561 8.38388 16.2561 8.27719 16.2542C7.84829 16.2465 7.86478 16.3189 7.87356 16.2418C7.89863 16.0215 7.89578 16.0627 7.87356 15.8425C7.8363 15.4731 7.7223 15.172 7.48479 14.9719C7.36192 14.8676 7.21496 14.7312 6.91978 14.4508C6.58256 14.1305 6.47694 14.0315 6.34679 13.9171L5.54549 13.0264C5.45753 12.9139 4.68546 11.5924 4.333 11.081C4.19589 10.8824 4.1446 10.8179 3.61839 10.1695ZM13.1271 10.1732V13.6322C13.1271 14.1322 13.8771 14.1322 13.8771 13.6322V10.1732C13.8771 9.67325 13.1271 9.67325 13.1271 10.1732ZM11.0955 10.1727L11.1115 13.6457C11.1138 14.1457 11.8638 14.1422 11.8615 13.6422L11.8455 10.1692C11.8432 9.66922 11.0932 9.67268 11.0955 10.1727ZM9.88641 13.6262L9.86541 10.2002C9.86234 9.70026 9.11236 9.70485 9.11542 10.2048L9.13642 13.6308C9.13949 14.1308 9.88947 14.1262 9.88641 13.6262Z" fill="white"/>
        <defs>
          <filter id="task-replay-cursor-shadow" x="0" y="0" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="1"/>
            <feGaussianBlur stdDeviation="1.5"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
          </filter>
        </defs>
      </svg>
  )
}

function TaskReplayControls({
  scene,
  onRenderMessages,
  onRenderMessagesWithStreaming,
  onComplete,
  onReplayFinished,
  onSimilarTask,
}: {
  scene: ReplayScene
  onRenderMessages: (messages: ChatMessage[]) => void
  onRenderMessagesWithStreaming: (messages: ChatMessage[], isStreaming: boolean) => void
  onComplete: () => void
  onReplayFinished?: (helpers: {
    setCursor: React.Dispatch<React.SetStateAction<ReplayCursorState>>
    timerRef: React.MutableRefObject<number | null>
    markComplete: () => void
  }) => boolean | void
  onSimilarTask: () => void
}) {
  const items = useMemo(() => replaySceneToMessages(scene), [scene])
  const timerRef = useRef<number | null>(null)
  const typewriterRef = useRef<number | null>(null)
  const cursorTimerRef = useRef<number | null>(null)
  const typewriterCursorRef = useRef(0)
  const replayFinishedRef = useRef(false)
  const handledMessageIdsRef = useRef<Set<string>>(new Set())
  const [pointer, setPointer] = useState(0)
  const [paused, setPaused] = useState(false)
  const [complete, setComplete] = useState(false)
  const [cursor, setCursor] = useState<ReplayCursorState>({
    visible: false,
    x: window.innerWidth + 36,
    y: getReplayCursorDockPosition().y,
    clicking: false,
    variant: 'pointer',
  })

  const applyReplayHandledState = useCallback((messages: ChatMessage[]) => (
    messages.map(message => (
      handledMessageIdsRef.current.has(message.id)
        ? { ...message, componentHandled: true }
        : message
    ))
  ), [])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (typewriterRef.current !== null) {
      window.clearTimeout(typewriterRef.current)
      typewriterRef.current = null
    }
    if (cursorTimerRef.current !== null) {
      window.clearTimeout(cursorTimerRef.current)
      cursorTimerRef.current = null
    }
  }, [])

  const markReplayComplete = useCallback(() => {
    replayFinishedRef.current = true
    setComplete(true)
    setPaused(true)
  }, [])

  const finishComplete = useCallback(() => {
    if (!replayFinishedRef.current) {
      replayFinishedRef.current = true
      const markComplete = () => {
        setComplete(true)
        setPaused(true)
      }
      const handled = onReplayFinished?.({ setCursor, timerRef: cursorTimerRef, markComplete })
      if (!handled) {
        markComplete()
        onComplete()
        cursorTimerRef.current = window.setTimeout(() => {
          setCursor(current => ({ ...current, visible: false, clicking: false, variant: 'pointer' }))
        }, 540)
      }
    } else {
      setComplete(true)
      setPaused(true)
    }
    scrollReplayConversationToEnd()
  }, [onComplete, onReplayFinished])

  const renderTo = useCallback((nextPointer: number, shouldPause = true) => {
    const safePointer = Math.max(0, Math.min(items.length, nextPointer))
    clearTimer()
    onRenderMessagesWithStreaming(applyReplayHandledState(items.slice(0, safePointer)), false)
    setPointer(safePointer)
    setComplete(safePointer >= items.length)
    setPaused(shouldPause || safePointer >= items.length)
    if (safePointer >= items.length) {
      finishComplete()
    }
  }, [applyReplayHandledState, clearTimer, finishComplete, items, onRenderMessagesWithStreaming])

  const restart = useCallback(() => {
    clearTimer()
    handledMessageIdsRef.current.clear()
    onRenderMessagesWithStreaming([], false)
    setPointer(0)
    setPaused(false)
    setComplete(false)
    replayFinishedRef.current = false
    typewriterCursorRef.current = 0
    setCursor(current => ({ ...current, visible: false, clicking: false, variant: 'pointer' }))
    const dock = getReplayCursorDockPosition()
    setCursor({ visible: false, x: window.innerWidth + 36, y: dock.y, clicking: false, variant: 'pointer' })
    window.requestAnimationFrame(() => {
      setCursor({ visible: true, x: dock.x, y: dock.y, clicking: false, variant: 'pointer' })
    })
  }, [clearTimer, onRenderMessagesWithStreaming])

  useEffect(() => {
    restart()
    return clearTimer
  }, [clearTimer, restart, scene.id])

  useEffect(() => {
    clearTimer()
    if (paused || complete || pointer >= items.length) return
    timerRef.current = window.setTimeout(() => {
      const nextPointer = pointer + 1
      const nextItem = items[pointer]
      const shouldType = nextItem?.role === 'assistant' && !nextItem.component && Boolean(nextItem.content)
      const clickLabel = nextItem?.componentProps?.replayClickLabel as string | undefined
      const clickKind = nextItem?.componentProps?.replayClickKind as string | undefined

      const renderNextItem = () => {
        if (!shouldType) {
          onRenderMessages(applyReplayHandledState(items.slice(0, nextPointer)))
          setPointer(nextPointer)
          scrollReplayConversationToEnd()
          if (nextPointer >= items.length) finishComplete()
          return
        }

        const completedMessages = applyReplayHandledState(items.slice(0, pointer))
        const fullContent = nextItem.content
        typewriterCursorRef.current = 0
        onRenderMessagesWithStreaming([...completedMessages, { ...nextItem, content: '' }], true)
        scrollReplayConversationToEnd()

        const tick = () => {
          typewriterCursorRef.current += 1
          const typedContent = fullContent.slice(0, typewriterCursorRef.current)
          onRenderMessagesWithStreaming([...completedMessages, { ...nextItem, content: typedContent }], true)
          scrollReplayConversationToEnd()

          if (typewriterCursorRef.current >= fullContent.length) {
            typewriterRef.current = null
            onRenderMessagesWithStreaming(applyReplayHandledState(items.slice(0, nextPointer)), false)
            setPointer(nextPointer)
            scrollReplayConversationToEnd()
            if (nextPointer >= items.length) finishComplete()
            return
          }

          typewriterRef.current = window.setTimeout(tick, REPLAY_TYPEWRITER_INTERVAL_MS)
        }

        typewriterRef.current = window.setTimeout(tick, REPLAY_TYPEWRITER_INTERVAL_MS)
      }

      if (clickLabel) {
        if (clickKind === 'artifact-card') {
          onRenderMessages(applyReplayHandledState(items.slice(0, nextPointer)))
          if (scene.id !== 'contract-ledger-entry') {
            setPointer(nextPointer)
          }
          scrollReplayConversationToEnd()
          simulateReplayClick({
            label: clickLabel,
            kind: clickKind,
            setCursor,
            timerRef: cursorTimerRef,
            onAfterClick: () => {
              if (nextItem.componentProps?.targetPhase) {
                onComplete()
              }
              if (nextPointer >= items.length) {
                if (scene.id === 'contract-ledger-entry') {
                  simulatePurchaseReviewAndSubmit({
                    setCursor,
                    timerRef: cursorTimerRef,
                    onAfterClick: () => {
                      setPointer(nextPointer)
                      markReplayComplete()
                      cursorTimerRef.current = window.setTimeout(() => {
                        setCursor(current => ({ ...current, visible: false, clicking: false, variant: 'pointer' }))
                      }, 540)
                    },
                  })
                } else {
                  finishComplete()
                  cursorTimerRef.current = window.setTimeout(() => {
                    setCursor(current => ({ ...current, visible: false, clicking: false, variant: 'pointer' }))
                  }, 540)
                }
              }
            },
          })
          return
        }

        onRenderMessages(applyReplayHandledState(items.slice(0, nextPointer)))
        scrollReplayConversationToEnd()
        cursorTimerRef.current = window.setTimeout(() => {
          const target = findReplayTarget(clickLabel, clickKind)
          setCursor({
            visible: false,
            x: window.innerWidth + 36,
            y: target.y,
            clicking: false,
            variant: 'pointer',
          })
          window.requestAnimationFrame(() => {
            setCursor({
              visible: true,
              x: target.x,
              y: target.y,
              clicking: false,
              variant: 'pointer',
            })
          })
          cursorTimerRef.current = window.setTimeout(() => {
            setCursor(current => ({ ...current, clicking: true, variant: 'hand' }))
            cursorTimerRef.current = window.setTimeout(() => {
              setCursor(current => ({ ...current, clicking: false, variant: 'pointer' }))
              if (clickKind === 'confirm-action') {
                triggerReplayElement(clickLabel, clickKind)
                handledMessageIdsRef.current.add(nextItem.id)
                const handledMessages = applyReplayHandledState(items.slice(0, nextPointer))
                const dock = getReplayCursorDockPosition()
                cursorTimerRef.current = window.setTimeout(() => {
                  setCursor(current => ({ ...current, ...dock, visible: true, clicking: false, variant: 'pointer' }))
                  onRenderMessages(handledMessages)
                  setPointer(nextPointer)
                  scrollReplayConversationToEnd()
                  if (nextPointer >= items.length) finishComplete()
                }, 280)
                return
              }
              renderNextItem()
            }, REPLAY_CURSOR_CLICK_MS)
          }, REPLAY_CURSOR_SETTLE_MS)
        }, 180)
        return
      }

      renderNextItem()
    }, REPLAY_CONTROL_INTERVAL_MS)

    return clearTimer
  }, [applyReplayHandledState, clearTimer, complete, finishComplete, items, markReplayComplete, onComplete, onRenderMessages, onRenderMessagesWithStreaming, paused, pointer, scene.id])

  const jumpToResult = useCallback(() => {
    renderTo(items.length)
  }, [items.length, renderTo])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.code !== 'Space' || complete) return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return
      event.preventDefault()
      jumpToResult()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [complete, jumpToResult])

  const isContractLedgerReplay = scene.id === 'contract-ledger-entry'
  const rawProgressPercent = items.length > 0 ? Math.min(100, Math.round((pointer / items.length) * 100)) : 0
  const visualComplete = complete || (!isContractLedgerReplay && pointer >= items.length)
  const progressPercent = isContractLedgerReplay && !complete && rawProgressPercent >= 100 ? 92 : rawProgressPercent
  const primaryText = visualComplete ? '任务回放完成' : `${scene.agentName}正在回放任务...`

  return (
    <div className="standard-replay-controls">
      <ReplayCursor cursor={cursor} />
      <div className={`standard-replay-player${visualComplete ? ' is-complete' : ''}`}>
        <button
          type="button"
          className="standard-replay-player__play"
          onClick={visualComplete ? restart : () => setPaused(value => !value)}
          aria-label={visualComplete ? '重看' : paused ? '继续播放' : '暂停播放'}
          title={visualComplete ? '重看' : paused ? '继续播放' : '暂停播放'}
        >
          <AgentAvatar avatarKey={scene.avatarKey} size={36} />
        </button>

        <div className="standard-replay-player__progress" aria-label="任务回放进度">
          <div className="standard-replay-player__status">
            <span className="standard-replay-player__primary">{primaryText}</span>
            <span className="standard-replay-player__percent">{progressPercent}%</span>
          </div>
          <div
            className="standard-replay-player__scrubber"
            role="progressbar"
            aria-label="任务回放进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-valuetext={`${progressPercent}%`}
            style={{ '--replay-progress': `${progressPercent}%` } as CSSProperties}
          >
            <span className="standard-replay-player__track" />
          </div>
        </div>

        <button type="button" className="standard-replay-player__button" onClick={visualComplete ? restart : jumpToResult}>
          {visualComplete ? '重看' : '跳转到结果'}
        </button>
        <button type="button" className="standard-replay-player__button is-primary" onClick={onSimilarTask}>
          做类似的任务
        </button>
      </div>
    </div>
  )
}

export function AuditWorkspaceView({ onBack, railCollapsed, onRailCollapsedChange, taskReplaySceneId, navHidden = false }: AuditWorkspaceViewProps = {}) {
  const { state, dispatch } = useApp()
  const [selectedArtifactPhase, setSelectedArtifactPhase] = useState<string | undefined>(undefined)
  const [selectedArtifactTitle, setSelectedArtifactTitle] = useState<string | null>(null)
  const [nativePage, setNativePage] = useState<NativePage>('home')
  const taskReplayScene = taskReplaySceneId ? getReplayScene(taskReplaySceneId) : null

  const handleSelectArtifact = useCallback((targetPhase: string, targetArtifactTitle?: string | null) => {
    trackEvent('preview_opened', {
      scenarioId: state.currentScenario,
      phase: state.phase,
      targetPhase,
      targetArtifactTitle,
      source: 'artifact_rail',
    })
    setSelectedArtifactPhase(targetPhase)
    setSelectedArtifactTitle(targetArtifactTitle ?? null)
  }, [state.currentScenario, state.phase])

  const { node: panelContent, hasContent: hasPanelContent, panelTitle, panelFooter, panelHasInternalClose } =
    useScenarioPanelContent(selectedArtifactPhase, selectedArtifactTitle)

  const handleNativeAgentSelect = useCallback((agentId: string) => {
    dispatch({ type: 'RESET', homeAgentId: agentId })
  }, [dispatch, taskReplayScene])

  const handleBackToHome = useCallback(() => {
    setNativePage('home')
    if (taskReplayScene) {
      const url = new URL(window.location.href)
      url.searchParams.set('shell', 'hidden')
      url.searchParams.delete('taskReplay')
      url.searchParams.delete('similarTaskPrompt')
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    }
    onBack?.()
  }, [onBack, taskReplayScene])

  const startTaskReplay = useCallback((scene: ReplayScene) => {
    dispatch({
      type: 'START_TASK_REPLAY',
      title: scene.title,
      agentName: scene.agentName,
      avatarKey: scene.avatarKey,
      scenarioId: scene.id,
      messages: [],
    })
  }, [dispatch])

  const renderTaskReplayMessages = useCallback((messages: ChatMessage[]) => {
    dispatch({ type: 'SET_MESSAGES', messages })
  }, [dispatch])

  const renderTaskReplayMessagesWithStreaming = useCallback((messages: ChatMessage[], isStreaming: boolean) => {
    dispatch({ type: 'REPLACE_MESSAGES', messages, isStreaming })
  }, [dispatch])

  useEffect(() => {
    if (!taskReplayScene) return
    startTaskReplay(taskReplayScene)
  }, [startTaskReplay, taskReplayScene?.id])

  const handleReplayComplete = useCallback(() => {
    if (!taskReplayScene?.panel) return
    dispatch({
      type: 'OPEN_PREVIEW',
      readonly: true,
      targetPhase: taskReplayScene.panel.phase,
      targetArtifactTitle: taskReplayScene.panel.title,
      delayMs: 260,
      scrollBeforeOpen: false,
    })
  }, [dispatch, taskReplayScene?.panel?.phase, taskReplayScene?.panel?.title])

  const handleSimilarTask = useCallback(() => {
    if (!taskReplayScene) return
    const url = new URL(window.location.href)
    const replayPrompt = taskReplayScene.rounds.find(round => round.user_message)?.user_message || taskReplayScene.title
    url.searchParams.set('shell', 'hidden')
    url.searchParams.delete('taskReplay')
    url.searchParams.set('similarTaskPrompt', replayPrompt)
    window.open(`${url.pathname}${url.search}${url.hash}`, '_blank', 'noopener,noreferrer')
  }, [taskReplayScene])

  const marketContent = nativePage === 'home' ? null : (
    <div className="native-home-stack" data-active-page={nativePage}>
      <div
        className={`native-market-embed native-page native-page--agents${nativePage === 'agents' ? ' native-page--active' : ''}`}
        aria-hidden={nativePage !== 'agents'}
      >
        <AgentsMarketPage railCollapsed={railCollapsed} />
      </div>

      <div
        className={`native-market-embed native-page native-page--tasks${nativePage === 'tasks' ? ' native-page--active' : ''}`}
        aria-hidden={nativePage !== 'tasks'}
      >
        <TasksMarketPage railCollapsed={railCollapsed} />
      </div>
    </div>
  )

  return (
    <AuditWorkspaceShell
      panelContent={panelContent}
      hasPanelContent={hasPanelContent}
      panelHasInternalClose={panelHasInternalClose}
      panelTitle={panelTitle}
      panelFooter={panelFooter}
      onBack={handleBackToHome}
      marketContent={marketContent}
      onSelectArtifact={handleSelectArtifact}
      onNativeAgentSelect={handleNativeAgentSelect}
      activeNativePage={nativePage}
      onNativeNavigate={setNativePage}
      navHidden={navHidden || Boolean(taskReplayScene)}
      railCollapsed={railCollapsed}
      onRailCollapsedChange={onRailCollapsedChange}
      defaultContextPanelOpen={Boolean(taskReplayScene)}
      chatInputReplacement={taskReplayScene ? (
        <TaskReplayControls
          scene={taskReplayScene}
          onRenderMessages={renderTaskReplayMessages}
          onRenderMessagesWithStreaming={renderTaskReplayMessagesWithStreaming}
          onComplete={handleReplayComplete}
          onSimilarTask={handleSimilarTask}
        />
      ) : undefined}
    />
  )
}

// ─── 首页（与 cost-ai-shell 结构对齐） ───────────────────────────────────────

interface WorkbenchPageProps {
  railCollapsed?: boolean
  onRailCollapsedChange?: (collapsed: boolean) => void
  embedMode?: 'native' | 'side-nav'
  navigationMode?: 'top-nav' | 'side-nav' | 'hidden'
  homeDisplayMode?: 'none' | 'info-cards' | 'best-practices'
}

const HIDDEN_NAV_PRACTICES = [
  {
    title: '智能录入',
    description: '识别认购单 PDF，提取客户、房源、付款字段，核对后提交录单。',
    imageSrc: '/aui-native/best-practices/attachment-parse.svg',
    replaySceneId: 'contract-ledger-entry',
  },
  {
    title: '智能审核',
    description: '选择分析方式与组价范围，自动生成控制价审核报告和异常明细。',
    imageSrc: '/aui-native/best-practices/audit-summary.svg',
    replaySceneId: 'control-price',
  },
  {
    title: '智能数据洞察',
    description: '汇总投建营指标波动，自动归因并输出经营建议。',
    imageSrc: '/aui-native/best-practices/data-analysis.svg',
    replaySceneId: 'cost-qa-indicator',
  },
  {
    title: '智能生成可视化报告',
    description: '自动聚合项目成本、进度、付款与风险数据，快速生成...',
    imageSrc: '/aui-native/best-practices/operation-report.svg',
    replaySceneId: 'cost-sensitivity',
  },
]

export function WorkbenchPage({ railCollapsed, onRailCollapsedChange, embedMode = 'native', navigationMode = 'top-nav', homeDisplayMode = 'best-practices' }: WorkbenchPageProps = {}) {
  const dispatch = useAppDispatch()
  const appState = useAppState()
  const scenarios = getAllScenarios()
  const agents = getAllAgents()
  const [text, setText] = useState('')
  const [nativePage, setNativePage] = useState<NativePage>('home')
  const [agentModalState, setAgentModalState] = useState<AgentModalState>('closed')
  const [skillModalState, setSkillModalState] = useState<AgentModalState>('closed')
  const [agentHighlightIndex, setAgentHighlightIndex] = useState(0)
  const [agentPickerMode, setAgentPickerMode] = useState<AgentPickerMode>('toolbar')
  const [selectedComposerAgentId, setSelectedComposerAgentId] = useState(appState.homeAgentId ?? 'noma-ai')
  const [skillHighlightIndex, setSkillHighlightIndex] = useState(0)
  const [homeAgentMotionDirection, setHomeAgentMotionDirection] = useState<HomeAgentSwitchDirection | null>(null)
  const modalTimerRef = useRef<number | null>(null)
  const skillModalTimerRef = useRef<number | null>(null)
  const homeAgentMotionTimerRef = useRef<number | null>(null)
  const agentDropdownRef = useRef<HTMLDivElement | null>(null)
  const mentionDropdownRef = useRef<HTMLDivElement | null>(null)
  const skillDropdownRef = useRef<HTMLDivElement | null>(null)
  const homeTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const homeFileInputRef = useRef<HTMLInputElement | null>(null)

  const homeExperience = getNativeAssistantExperience(appState.homeAgentId)
  const isPrimaryHomeAgent = homeExperience.agentId === 'noma-ai'
  const toolbarAssistantOptions = NATIVE_ASSISTANT_EXPERIENCES
  const mentionableAssistants = NATIVE_ASSISTANT_EXPERIENCES.filter(assistant => assistant.agentId !== 'noma-ai')
  const homeQuickActions = getNativeAssistantQuickActions(homeExperience)
  const primaryHomeInfoCards = getNativeAssistantExperience('noma-ai').homeInfoCards
  const showPrimaryHomeInfoCards = homeDisplayMode === 'info-cards' && isPrimaryHomeAgent
  const showHomePracticeCards = homeDisplayMode === 'best-practices' && isPrimaryHomeAgent
  const homeInputPlaceholder = getNativeAssistantInputPlaceholder(homeExperience)
  const selectedComposerAgent = NATIVE_ASSISTANT_EXPERIENCES.find(assistant => assistant.agentId === selectedComposerAgentId) ?? homeExperience
  const agentPickerOpen = agentModalState === 'opening' || agentModalState === 'open'
  const skillPickerOpen = skillModalState === 'opening' || skillModalState === 'open'
  const agentPickerOptions = agentPickerMode === 'mention' ? mentionableAssistants : toolbarAssistantOptions

  const getSelectedAssistantIndex = useCallback((_value: string) => {
    const selectedIndex = toolbarAssistantOptions.findIndex(assistant => assistant.agentId === selectedComposerAgentId)
    return selectedIndex >= 0 ? selectedIndex : 0
  }, [selectedComposerAgentId, toolbarAssistantOptions])

  const getSelectedSkillIndex = useCallback((value: string) => {
    const index = HOME_SKILL_OPTIONS.findIndex(skill => value.includes(`使用【${skill.name}】`))
    return index >= 0 ? index : 0
  }, [])

  const clearModalTimer = useCallback(() => {
    if (modalTimerRef.current !== null) {
      window.clearTimeout(modalTimerRef.current)
      modalTimerRef.current = null
    }
  }, [])

  const clearSkillModalTimer = useCallback(() => {
    if (skillModalTimerRef.current !== null) {
      window.clearTimeout(skillModalTimerRef.current)
      skillModalTimerRef.current = null
    }
  }, [])

  const clearHomeAgentMotionTimer = useCallback(() => {
    if (homeAgentMotionTimerRef.current !== null) {
      window.clearTimeout(homeAgentMotionTimerRef.current)
      homeAgentMotionTimerRef.current = null
    }
  }, [])

  const startHomeAgentMotion = useCallback((direction: HomeAgentSwitchDirection) => {
    clearHomeAgentMotionTimer()
    setHomeAgentMotionDirection(direction)
    homeAgentMotionTimerRef.current = window.setTimeout(() => {
      homeAgentMotionTimerRef.current = null
      setHomeAgentMotionDirection(null)
    }, 360)
  }, [clearHomeAgentMotionTimer])

  const focusHomeTextareaAtEnd = useCallback((value?: string) => {
    window.requestAnimationFrame(() => {
      const textarea = homeTextareaRef.current
      if (!textarea) return
      const caretIndex = typeof value === 'string' ? value.length : textarea.value.length
      textarea.focus()
      textarea.setSelectionRange(caretIndex, caretIndex)
    })
  }, [])

  const openAgentModal = useCallback((sourceText = text, mode: AgentPickerMode = 'toolbar') => {
    const options = mode === 'mention' ? mentionableAssistants : toolbarAssistantOptions
    if (options.length === 0) return
    clearModalTimer()
    clearSkillModalTimer()
    setAgentPickerMode(mode)
    setAgentHighlightIndex(mode === 'toolbar' ? getSelectedAssistantIndex(sourceText) : 0)
    setSkillModalState('closed')
    setAgentModalState('opening')
    modalTimerRef.current = window.setTimeout(() => {
      setAgentModalState('open')
      modalTimerRef.current = null
    }, 200)
  }, [clearModalTimer, clearSkillModalTimer, getSelectedAssistantIndex, mentionableAssistants, text, toolbarAssistantOptions])

  const closeAgentModal = useCallback(() => {
    if (agentModalState === 'closed') return
    clearModalTimer()
    setAgentModalState('closing')
    modalTimerRef.current = window.setTimeout(() => {
      setAgentModalState('closed')
      modalTimerRef.current = null
    }, 200)
  }, [agentModalState, clearModalTimer])

  const toggleAgentModal = useCallback((mode: AgentPickerMode = 'mention') => {
    if (agentModalState === 'closed' || agentModalState === 'closing') {
      openAgentModal(text, mode)
    } else {
      closeAgentModal()
    }
  }, [agentModalState, closeAgentModal, openAgentModal, text])

  const openSkillModal = useCallback((sourceText = text) => {
    clearSkillModalTimer()
    clearModalTimer()
    setSkillHighlightIndex(getSelectedSkillIndex(sourceText))
    setAgentModalState('closed')
    setSkillModalState('opening')
    skillModalTimerRef.current = window.setTimeout(() => {
      setSkillModalState('open')
      skillModalTimerRef.current = null
    }, 200)
  }, [clearModalTimer, clearSkillModalTimer, getSelectedSkillIndex, text])

  const closeSkillModal = useCallback(() => {
    if (skillModalState === 'closed') return
    clearSkillModalTimer()
    setSkillModalState('closing')
    skillModalTimerRef.current = window.setTimeout(() => {
      setSkillModalState('closed')
      skillModalTimerRef.current = null
    }, 200)
  }, [clearSkillModalTimer, skillModalState])

  const toggleSkillModal = useCallback(() => {
    if (skillModalState === 'closed' || skillModalState === 'closing') {
      openSkillModal()
    } else {
      closeSkillModal()
    }
  }, [closeSkillModal, openSkillModal, skillModalState])

  useEffect(() => () => clearModalTimer(), [clearModalTimer])
  useEffect(() => () => clearSkillModalTimer(), [clearSkillModalTimer])
  useEffect(() => () => clearHomeAgentMotionTimer(), [clearHomeAgentMotionTimer])
  useEffect(() => setSelectedComposerAgentId(homeExperience.agentId), [homeExperience.agentId])

  useEffect(() => {
    const agentId = new URLSearchParams(window.location.search).get('agent')
    const isKnownAssistant = NATIVE_ASSISTANT_EXPERIENCES.some(assistant => assistant.agentId === agentId)
    if (!agentId || !isKnownAssistant || appState.homeAgentId === agentId) return
    dispatch({ type: 'RESET', homeAgentId: agentId })
    setNativePage('home')
  }, [appState.homeAgentId, dispatch])

  useEffect(() => {
    if (agentModalState === 'closed') return

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeAgentModal()
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (agentDropdownRef.current?.contains(target)) return
      if (mentionDropdownRef.current?.contains(target)) return
      if (homeTextareaRef.current?.contains(target)) return
      closeAgentModal()
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [agentModalState, closeAgentModal])

  useEffect(() => {
    if (skillModalState === 'closed') return

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeSkillModal()
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!skillDropdownRef.current?.contains(target)) closeSkillModal()
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [skillModalState, closeSkillModal])

  const enterScenario = useCallback((
    scenarioId: string,
    userText?: string,
    options?: {
      taskTitle?: string
      homeAgentId?: string | null
      attachment?: { name: string; size?: string; type?: 'pdf' | 'word' | 'excel' | 'xml' | 'file' }
    },
  ) => {
    const scenario = getScenario(scenarioId)
    if (!scenario) return
    const targetHomeExperience = getNativeAssistantExperience(options?.homeAgentId ?? scenario.agentId ?? homeExperience.agentId)
    const userMessageContent = userText || scenario.label
    trackEvent('scenario_entered', {
      scenarioId,
      phase: scenario.phases[0] || 'step_1',
      label: scenario.label,
      source: userText ? 'user_input' : 'home',
      value: userMessageContent,
    })
    const scenarioAgentName: string = targetHomeExperience.agentName || scenario.agentName || (scenario as any)?._doc?.meta?.agentName || scenario.label
    const avatarKey: string = targetHomeExperience.avatarKey || scenario.avatarKey || 'avatar-ai-1'
    dispatch({
      type: 'SWITCH_SCENARIO',
      scenarioId,
      agentName: scenarioAgentName,
      avatarKey,
      initialPhase: scenario.phases[0] || 'step_1',
      taskTitle: options?.taskTitle || summarizeTaskTitle(userMessageContent),
      message: {
        id: genMessageId(),
        role: 'user',
        content: userMessageContent,
        timestamp: Date.now(),
        attachment: options?.attachment,
      },
    })
    dispatch({ type: 'SET_HOME_AGENT', agentId: targetHomeExperience.agentId })
  }, [dispatch, homeExperience.agentId])

  const handleTemplateAttachmentDemo = useCallback((file?: File) => {
    const scenario = scenarios.find(item => item.agentId === 'template-printing')
    if (!scenario) return
    const fileName = file?.name || '武汉光谷未来中心租赁合同样张.docx'
    const fileSize = file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : '186 KB'
    enterScenario(
      scenario.id,
      `上传《${fileName}》，并根据这份标准租赁合同样张生成套打模板`,
      {
        taskTitle: scenario.label,
        homeAgentId: 'template-printing',
        attachment: { name: fileName, size: fileSize, type: 'word' },
      },
    )
  }, [enterScenario, scenarios])

  const fillHomePrompt = useCallback((prompt: string) => {
    setText(prompt)
    focusHomeTextareaAtEnd(prompt)
  }, [focusHomeTextareaAtEnd])

  useEffect(() => {
    const prompt = new URLSearchParams(window.location.search).get('similarTaskPrompt')
    if (!prompt) return
    fillHomePrompt(prompt)
  }, [fillHomePrompt])

  const handleQuickAction = useCallback((prompt: string) => {
    fillHomePrompt(prompt)
  }, [fillHomePrompt])

  const handleSelectHistoryScenario = useCallback((scenarioId: string) => {
    const scenario = getScenario(scenarioId)
    if (scenario) {
      enterScenario(
        scenario.id,
        scenario.shortcutPrompt || scenario.shortcutLabel || scenario.label,
        { taskTitle: scenario.label, homeAgentId: scenario.agentId ?? homeExperience.agentId },
      )
      return
    }

    const dialogue = NATIVE_ASSISTANT_EXPERIENCES
      .flatMap(agent => agent.dialogues.map(item => ({ ...item, agentId: agent.agentId })))
      .find(item => item.id === scenarioId)

    if (!dialogue) return
    const matchedScenario = matchScenario(dialogue.prompt, scenarios)
    if (!matchedScenario) {
      fillHomePrompt(dialogue.prompt)
      return
    }
    enterScenario(
      matchedScenario.id,
      dialogue.prompt,
      { taskTitle: dialogue.title, homeAgentId: dialogue.agentId },
    )
  }, [enterScenario, fillHomePrompt, homeExperience.agentId, scenarios])

  const handleOpenTaskReplay = useCallback((sceneId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('shell', 'hidden')
    url.searchParams.set('taskReplay', sceneId)
    window.location.assign(`${url.pathname}${url.search}${url.hash}`)
  }, [])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')

    if (scenarios.length === 0) {
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'user', content: trimmed, timestamp: Date.now() },
      })
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'assistant', content: getEmptyScenarioReply(), timestamp: Date.now() },
      })
      return
    }

    const mentionTarget = matchHomeMentionScenario(trimmed)
    const target = mentionTarget ? getScenario(mentionTarget.scenarioId) : matchScenario(trimmed, scenarios)
    if (target) {
      enterScenario(target.id, trimmed, mentionTarget
        ? { taskTitle: mentionTarget.taskTitle, homeAgentId: 'control-price' }
        : undefined)
    } else {
      // 多场景下未命中意图：发用户气泡 + AI 引导选择场景
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'user', content: trimmed, timestamp: Date.now() },
      })
      const chipNames = agents.map(agent => `「${agent.agentName}」`).join('、')
      const replyId = genMessageId()
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: replyId, role: 'assistant', content: `您好！我可以帮助您完成以下任务：${chipNames}。请点击下方快捷入口，或告诉我您需要哪项服务。`, timestamp: Date.now() },
      })
      // 切换到工作台以显示对话（默认用第一个场景）
      const defaultScenario = scenarios[0]
      const defaultAgentName: string = homeExperience.agentName || defaultScenario?.agentName || (defaultScenario as any)?._doc?.meta?.agentName || defaultScenario?.label || 'AI 助手'
      const defaultAvatarKey: string = homeExperience.avatarKey || defaultScenario?.avatarKey || 'avatar-ai-1'
      dispatch({ type: 'SET_HOME_AGENT', agentId: homeExperience.agentId })
      dispatch({ type: 'SET_CURRENT_SCENARIO', scenario: defaultScenario?.id ?? '', agentName: defaultAgentName, avatarKey: defaultAvatarKey })
      // 切换到工作台视图，否则 phase 仍为 'home'，消息不可见
      if (defaultScenario?.phases?.[0]) {
        dispatch({ type: 'SET_PHASE', phase: defaultScenario.phases[0] })
      }
    }
  }

  const handleHomeAgentSelect = useCallback((agentId: string) => {
    const currentAgentId = homeExperience.agentId
    if (agentId === currentAgentId) {
      dispatch({ type: 'RESET', homeAgentId: agentId })
      closeAgentModal()
      closeSkillModal()
      setNativePage('home')
      return
    }

    const isCurrentPrimary = currentAgentId === 'noma-ai'
    const isNextPrimary = agentId === 'noma-ai'
    const motionDirection: HomeAgentSwitchDirection = isNextPrimary ? 'to-primary' : 'to-assistant'
    closeAgentModal()
    closeSkillModal()
    setNativePage('home')
    if (isCurrentPrimary !== isNextPrimary) {
      startHomeAgentMotion(motionDirection)
    } else {
      clearHomeAgentMotionTimer()
      setHomeAgentMotionDirection(null)
    }
    dispatch({ type: 'RESET', homeAgentId: agentId })
  }, [
    clearHomeAgentMotionTimer,
    closeAgentModal,
    closeSkillModal,
    dispatch,
    homeExperience.agentId,
    startHomeAgentMotion,
  ])

  const handleComposerAgentSelect = useCallback((agentId: string) => {
    setText('')
    handleHomeAgentSelect(agentId)
    closeAgentModal()
  }, [closeAgentModal, handleHomeAgentSelect])

  const handleMentionAssistantSelect = useCallback((assistantName: string) => {
    const mentionText = `@${assistantName}，`
    const trimmedEnd = text.trimEnd()
    const textWithoutTrigger = trimmedEnd.endsWith('@') ? text.replace(/@$/u, '') : text
    const textWithoutExistingMention = textWithoutTrigger.replace(/^@\S+?[，,]\s*/u, '')
    const nextText = `${mentionText}${textWithoutExistingMention ? ` ${textWithoutExistingMention}` : ''}`
    setText(nextText)
    closeAgentModal()
    focusHomeTextareaAtEnd(nextText)
  }, [closeAgentModal, focusHomeTextareaAtEnd, text])

  const handleAgentPickerSelect = useCallback((agentId: string) => {
    const selected = agentPickerOptions.find(assistant => assistant.agentId === agentId)
    if (!selected) return
    if (agentPickerMode === 'mention') {
      handleMentionAssistantSelect(selected.agentName)
      return
    }
    handleComposerAgentSelect(agentId)
  }, [agentPickerMode, agentPickerOptions, handleComposerAgentSelect, handleMentionAssistantSelect])

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (agentPickerOpen && agentPickerOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setAgentHighlightIndex(index => (index + 1) % agentPickerOptions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setAgentHighlightIndex(index => (index - 1 + agentPickerOptions.length) % agentPickerOptions.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const selected = agentPickerOptions[agentHighlightIndex] ?? agentPickerOptions[0]
        if (selected) handleAgentPickerSelect(selected.agentId)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeAgentModal()
        return
      }
    }

    if (skillPickerOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSkillHighlightIndex(index => (index + 1) % HOME_SKILL_OPTIONS.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSkillHighlightIndex(index => (index - 1 + HOME_SKILL_OPTIONS.length) % HOME_SKILL_OPTIONS.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const selected = HOME_SKILL_OPTIONS[skillHighlightIndex] ?? HOME_SKILL_OPTIONS[0]
        if (selected) handleSelectSkill(selected.name)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeSkillModal()
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleComposerChange = useCallback((value: string) => {
    setText(value)
    const trimmedEnd = value.trimEnd()
    if (trimmedEnd.endsWith('@')) {
      if (isPrimaryHomeAgent) {
        openAgentModal(value, 'mention')
      } else if (agentPickerOpen) {
        closeAgentModal()
      }
      return
    }
    if (trimmedEnd.endsWith('/')) {
      openSkillModal(value)
      return
    }
    if (agentPickerOpen) closeAgentModal()
    if (skillPickerOpen) closeSkillModal()
  }, [agentPickerOpen, closeAgentModal, closeSkillModal, isPrimaryHomeAgent, openAgentModal, openSkillModal, skillPickerOpen])

  const renderAgentDropdown = (className = 'native-agent-dropdown') => (
    <div
      className={`${className} ${agentModalState}`}
      role="menu"
      aria-label="选择助手"
    >
      {agentPickerOptions.map((assistant, index) => {
        const selected = agentPickerMode !== 'toolbar'
          ? index === agentHighlightIndex
          : assistant.agentId === selectedComposerAgentId
        return (
          <button
            className={`native-agent-dropdown__item${selected ? ' selected' : ''}`}
            type="button"
            role="menuitem"
            aria-selected={selected}
            key={assistant.agentId}
            onMouseEnter={() => setAgentHighlightIndex(index)}
            onClick={() => handleAgentPickerSelect(assistant.agentId)}
          >
            <span className="native-agent-dropdown__avatar">
              {assistant.agentId === 'noma-ai'
                ? <NomaAssistantAvatar />
                : <img src={nativeAvatarSrc(assistant.avatarKey)} alt="" draggable={false} />}
            </span>
            <span>{assistant.agentId === 'noma-ai' ? 'Noma 助手' : assistant.agentName}</span>
          </button>
        )
      })}
    </div>
  )

  const handleSelectSkill = useCallback((skillName: string) => {
    const skillPrompt = `使用【${skillName}】`
    const skillPattern = /(?:，?\s*)?使用【[^】]+】(?:，?)?/gu
    const slashPattern = /\/$/u
    const textWithoutSkill = text
      .replace(slashPattern, '')
      .replace(skillPattern, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const assistantMatch = textWithoutSkill.match(/^(@[^，,]+[，,])\s*(.*)$/u)
    const nextText = assistantMatch
      ? `${assistantMatch[1]} ${skillPrompt}，${assistantMatch[2] || '【填写任务描述】'}`
      : `${skillPrompt}，【填写任务描述】${textWithoutSkill ? ` ${textWithoutSkill}` : ''}`
    setText(nextText)
    closeSkillModal()
    focusHomeTextareaAtEnd(nextText)
  }, [closeSkillModal, focusHomeTextareaAtEnd, text])

  const homeContent = (
    <div className="native-home-stack" data-active-page={nativePage}>
      <div
        className={`home-content native-page native-page--home${nativePage === 'home' ? ' native-page--active' : ''}`}
        data-home-agent={isPrimaryHomeAgent ? 'noma-ai' : 'assistant'}
        data-agent-switch-motion={homeAgentMotionDirection ?? undefined}
        aria-hidden={nativePage !== 'home'}
      >
      <div className="home-content__greeting-section">

        <div className="home-content__hero-copy">
          <div className="home-content__hero-title">
            <span className="home-content__hero-prefix">Hi,</span>
            {isPrimaryHomeAgent ? (
              <>
                <span className="home-content__hero-prefix">我是智能助手</span>
                <NomaHeroLogo />
              </>
            ) : (
              <>
                <span className="home-content__hero-prefix">我是</span>
                <span className="home-content__hero-agent-name">{homeExperience.agentName}</span>
              </>
            )}
          </div>
          <p className="home-content__hero-description">{homeExperience.homeDescription}</p>
        </div>

        <div className="home-content__input-container">
          <div className="workbench-input-wrapper home-composer" ref={skillDropdownRef}>
            <textarea
              ref={homeTextareaRef}
              value={text}
              onChange={e => handleComposerChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="workbench-textarea"
              placeholder={homeInputPlaceholder}
              rows={3}
            />
            {agentModalState !== 'closed' && agentPickerMode === 'mention' && (
              <div className="home-mention-picker" ref={mentionDropdownRef}>
                {renderAgentDropdown('native-agent-dropdown native-agent-dropdown--mention')}
              </div>
            )}
            <div className="workbench-input-toolbar">
              <div className="home-composer__left-actions">
                <button
                  type="button"
                  className="home-tool-btn"
                  onClick={() => {
                    if (homeExperience.agentId === 'template-printing' || selectedComposerAgent.agentId === 'template-printing') {
                      handleTemplateAttachmentDemo()
                      return
                    }
                    homeFileInputRef.current?.click()
                  }}
                  aria-label="上传附件"
                  title="上传附件"
                >
                  <img src="/aui-native/icons/attachment.svg" alt="" draggable={false} />
                </button>
                <div className="home-agent-picker" ref={agentDropdownRef}>
                  <button
                    type="button"
                    className="home-agent-switch"
                    onClick={() => toggleAgentModal('toolbar')}
                    aria-haspopup="menu"
                    aria-expanded={agentModalState !== 'closed'}
                    aria-label="选择助手"
                    title="选择助手"
                  >
                    <span className="home-agent-switch__avatar">
                      {selectedComposerAgent.agentId === 'noma-ai'
                        ? <NomaAssistantAvatar />
                        : <img src={nativeAvatarSrc(selectedComposerAgent.avatarKey)} alt="" draggable={false} />}
                    </span>
                    <span className="home-agent-switch__label">{selectedComposerAgent.agentId === 'noma-ai' ? 'Noma 助手' : selectedComposerAgent.agentName}</span>
                    <svg className="home-agent-switch__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.25 5.75L7 8.5L9.75 5.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {agentModalState !== 'closed' && agentPickerMode === 'toolbar' && renderAgentDropdown()}
                </div>
                <div className="home-skill-picker">
                  <button
                    type="button"
                    className="home-tool-btn"
                    onClick={toggleSkillModal}
                    aria-haspopup="menu"
                    aria-expanded={skillModalState !== 'closed'}
                    aria-label="选择技能"
                    title="选择技能"
                  >
                    <img src="/aui-native/icons/skill.svg" alt="" draggable={false} />
                  </button>
                </div>
              </div>
              <button
                className={`icon-btn send-btn home-send-btn${text.trim() ? ' active' : ''}`}
                onClick={handleSend}
                disabled={!text.trim()}
                aria-label="发送"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.6978 7.06938C12.5681 7.34552 12.3471 7.56441 12.0823 7.6961L2.07299 12.7099C1.36289 13.0545 0.505997 12.7735 0.14562 12.0832C-0.0130195 11.7498 -0.0451876 11.3736 0.0646303 11.0226L1.15932 7.48572C1.25954 7.16187 1.56094 6.94082 1.9023 6.94082H5.73337C6.01496 6.93969 6.24522 6.7139 6.25164 6.42659C6.24987 6.14372 6.02244 5.9151 5.73337 5.91235H1.90512C1.56241 5.91235 1.26015 5.68959 1.16105 5.36398L0.0808283 1.81452C-0.145184 1.07423 0.281458 0.284662 1.03641 0.0628915C1.38586 -0.046133 1.76388 -0.013046 2.08917 0.15932L12.0823 5.17312C12.7804 5.527 13.0614 6.3785 12.6978 7.06938Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <input
              ref={homeFileInputRef}
              type="file"
              accept=".xlsx,.xls,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={event => {
                const file = event.currentTarget.files?.[0]
                if (file && (homeExperience.agentId === 'template-printing' || selectedComposerAgent.agentId === 'template-printing')) {
                  handleTemplateAttachmentDemo(file)
                }
                event.currentTarget.value = ''
              }}
            />
            {skillModalState !== 'closed' && (
              <div
                className={`native-skill-dropdown ${skillModalState}`}
                role="menu"
                aria-label="选择技能"
              >
                <div className="native-skill-dropdown__list">
                  {HOME_SKILL_OPTIONS.map(skill => (
                    <button
                      type="button"
                      className={`native-skill-dropdown__item${HOME_SKILL_OPTIONS[skillHighlightIndex]?.name === skill.name ? ' selected' : ''}`}
                      role="menuitem"
                      aria-selected={HOME_SKILL_OPTIONS[skillHighlightIndex]?.name === skill.name}
                      key={skill.name}
                      onMouseEnter={() => setSkillHighlightIndex(HOME_SKILL_OPTIONS.findIndex(item => item.name === skill.name))}
                      onClick={() => handleSelectSkill(skill.name)}
                    >
                      <img src="/aui-native/icons/skill.svg" alt="" draggable={false} />
                      <span className="native-skill-dropdown__copy">
                        <span className="native-skill-dropdown__name">{skill.name}</span>
                        <span className="native-skill-dropdown__desc">{skill.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="home-quick-actions" aria-label="快捷指令">
          {homeQuickActions.map(chip => (
            <button
              key={chip.label}
              type="button"
              className="home-quick-action"
              onClick={() => handleQuickAction(chip.prompt)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {showHomePracticeCards ? (
          <section className="home-practice home-practice--hidden-nav" aria-label="最佳实践">
            <div className="home-practice__head">
              <h2>最佳实践</h2>
              <button type="button" aria-hidden="true" tabIndex={-1}>
                <img src="/aui-native/icons/change.svg" alt="" draggable={false} />
                <span>换一换</span>
              </button>
            </div>
            <div className="home-practice__cards">
              {HIDDEN_NAV_PRACTICES.map(practice => (
                <button
                  className="home-practice-card"
                  key={practice.title}
                  type="button"
                  onClick={() => handleOpenTaskReplay(practice.replaySceneId)}
                >
                  <div className="home-practice-card__thumb">
                    <img src={practice.imageSrc} alt="" draggable={false} />
                  </div>
                  <div className="home-practice-card__copy">
                    <h3>{practice.title}</h3>
                    <p>{practice.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : showPrimaryHomeInfoCards ? (
          <div
            className={`home-info-grid${primaryHomeInfoCards.length === 1 ? ' home-info-grid--single' : ''}`}
            aria-label="消息和待办"
          >
            {primaryHomeInfoCards.map(card => {
              const isScheduleCard = card.title === '定时任务'
              return (
              <section className={`home-info-card${isScheduleCard ? ' home-info-card--schedule' : ''}`} key={card.title}>
                <div className="home-info-card__head">
                  <span className="home-info-card__head-main">
                    <img className="home-info-card__icon" src={card.iconSrc} alt="" draggable={false} />
                    <span className="home-info-card__title">{card.title}</span>
                    <span className="home-info-card__dot">·</span>
                    <span className="home-info-card__count">{card.count}</span>
                  </span>
                  {isScheduleCard && (
                    <button className="home-info-card__view-all" type="button">
                      查看全部
                    </button>
                  )}
                </div>
                <div className="home-info-card__list">
                  {card.items.map((item, itemIndex) => (
                    <div className="home-info-card__row" key={`${card.title}-${item.title}`}>
                      <button className="home-info-card__item" type="button">
                        <span className="home-info-card__item-main">
                          <span className="home-info-card__item-title">{item.title}</span>
                          <span className={`home-info-card__tag home-info-card__tag--${item.tone}`}>{item.tag}</span>
                        </span>
                        <span className="home-info-card__time">{item.time}</span>
                      </button>
                      {itemIndex < card.items.length - 1 && <span className="home-info-card__divider" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
              </section>
              )
            })}
          </div>
        ) : null}

      </div>
      </div>

      <div
        className={`native-market-embed native-page native-page--agents${nativePage === 'agents' ? ' native-page--active' : ''}`}
        aria-hidden={nativePage !== 'agents'}
      >
        <AgentsMarketPage embeddedInSideNav={embedMode === 'side-nav'} railCollapsed={railCollapsed} />
      </div>

      <div
        className={`native-market-embed native-page native-page--skills${nativePage === 'skills' ? ' native-page--active' : ''}`}
        aria-hidden={nativePage !== 'skills'}
      >
        <SkillsMarketPage />
      </div>

      <div
        className={`native-market-embed native-page native-page--tasks${nativePage === 'tasks' ? ' native-page--active' : ''}`}
        aria-hidden={nativePage !== 'tasks'}
      >
        <TasksMarketPage railCollapsed={railCollapsed} />
      </div>
    </div>
  )

  if (appState.phase !== 'home' && appState.currentScenario) {
    const currentScenario = getScenario(appState.currentScenario)
    const backHomeAgentId = appState.homeAgentId ?? currentScenario?.agentId ?? 'noma-ai'
    return (
      <AuditWorkspaceView
        onBack={() => {
          dispatch({ type: 'RESET', homeAgentId: backHomeAgentId })
          setNativePage('home')
        }}
        railCollapsed={railCollapsed}
        onRailCollapsedChange={onRailCollapsedChange}
        navHidden={navigationMode === 'hidden'}
      />
    )
  }

  return (
    <>
      <AuditWorkspaceShell
        homeContent={homeContent}
        onBack={() => {
          dispatch({ type: 'RESET', homeAgentId: 'noma-ai' })
          setNativePage('home')
        }}
        activeNativePage={nativePage}
        onNativeNavigate={setNativePage}
        onNativeAgentSelect={handleHomeAgentSelect}
        onSelectScenario={handleSelectHistoryScenario}
        railCollapsed={railCollapsed}
        onRailCollapsedChange={onRailCollapsedChange}
        embeddedInSideNav={embedMode === 'side-nav'}
        navHidden={navigationMode === 'hidden'}
      />
    </>
  )
}
