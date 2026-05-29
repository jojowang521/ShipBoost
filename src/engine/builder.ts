/**
 * builder.ts — Config 轨道核心：defineScenario()
 *
 * 供复杂场景的 scenario.ts 调用，接收结构化配置对象，
 * 返回与 MD 轨道完全兼容的 ScenarioModule 接口。
 *
 * PM 无需接触此文件。场景作者（AI 或设计师）只需在 scenario.ts 里
 * 调用 defineScenario({ ... }) 并传入配置即可。
 */
import React from 'react'
import type { ScenarioModule, ScenarioContext, ButtonConfig } from '../scenarios/types'
import { genMessageId, streamFakeText } from '../shared/utils'
import { demoComponentRegistry } from '../demo-components/index'

// ─── 配置类型定义 ──────────────────────────────────────────────────────────────

export interface PhaseAgent {
  /** 显示名称，如「成本请款专员」 */
  name: string
  /** 头像 key，对应 AgentAvatar 中的映射；不填则继承场景默认头像 */
  avatarKey?: string
}

export interface PanelConfig {
  /** 组件名（字符串），需在全局注册表或场景 extraComponentMap 中注册 */
  component: string
  /** 传给组件的静态 props */
  props?: Record<string, unknown>
  /** 右侧面板标题，不填则用组件名 */
  title?: string
}

export interface CardConfig {
  /** 组件名（字符串），需在全局注册表或场景 extraComponentMap 中注册 */
  component: string
  /** 传给组件的静态 props */
  props?: Record<string, unknown>
}

export interface BranchConfig {
  /** 按钮文案 */
  label: string
  /** 跳转目标 phase id */
  to: string
  /** 按钮样式，默认第一个 primary，其余 outline */
  variant?: 'primary' | 'outline'
}

export interface PhaseConfig {
  /** Phase ID，英文 snake_case 或 kebab-case，如 'bc_file_upload' */
  id: string
  /** 此 phase 的 AI 发言角色（支持多角色切换） */
  agent?: PhaseAgent
  /**
   * 依次流式显示的 AI 消息列表（Markdown 字符串）。
   * 多条消息按顺序串行播放，每条播完再播下一条。
   */
  messages: string[]
  /**
   * 右侧面板组件配置。
   * 消息播完后若无 card，自动插入 PreviewTriggerCard 触发入口。
   */
  panel?: PanelConfig
  /**
   * 对话区内嵌卡片（交互组件）。
   * 消息播完后自动插入，作为最后一条消息展示。
   */
  card?: CardConfig
  /**
   * 自动定时跳转：消息播完 + 可选卡片插入后，等待 delayMs 毫秒自动进入下一 phase。
   * 若同时有 card/branches，建议不配 autoAdvance，让用户操作触发跳转。
   */
  autoAdvance?: { to: string; delayMs: number }
  /**
   * 分支按钮：渲染在消息底部的操作按钮，点击后跳到对应 phase。
   * 若同时有 card，buttons 由卡片自己渲染，此处配置不生效。
   */
  branches?: BranchConfig[]
}

export interface ScenarioConfig {
  id: string
  label: string
  phases: PhaseConfig[]
  /** 常见追问 FAQ，格式与 MD 轨道一致 */
  faq?: Array<{ question: string; answer: string }>
  /** 首页快捷入口，不填则默认用 label */
  homeChips?: Array<{ label: string; scenarioId: string }>
  /**
   * 场景专属组件映射（不进入全局注册表）。
   * key 为组件名字符串，value 为 React 组件。
   * 孵化中的业务专属组件在此注册，不污染核心项目。
   */
  extraComponentMap?: Record<string, React.ComponentType<any>>
  /**
   * 是否在「切换专员」列表中隐藏。
   * Hub 场景的子场景设为 true，只能通过 homeChips 进入。
   */
  hidden?: boolean
  /**
   * 固定该场景的头像 key（优先级高于 registry 自动分配）。
   * Hub 场景用于确保首页头像与对话内头像一致。
   */
  avatarKey?: string
  /**
   * Agent 名称 → 头像 key 的映射表。
   * 在此声明后，同名 agent 的消息将自动使用对应头像，
   * 无需在每个 PhaseConfig.agent 里逐一设置 avatarKey。
   *
   * 示例：
   * agentAvatarMap: {
   *   'AI 成本顾问':  'avatar-ai-1',   // 顾问头像，与首页一致
   *   '成本请款专员': 'avatar-ai-1',   // 专员头像，区分角色
   * }
   */
  agentAvatarMap?: Record<string, string>
}

// ─── 内部工具函数 ──────────────────────────────────────────────────────────────

function findPhase(phases: PhaseConfig[], id: string): PhaseConfig | undefined {
  return phases.find(p => p.id === id)
}

function findNextPhase(phases: PhaseConfig[], currentId: string): string {
  const idx = phases.findIndex(p => p.id === currentId)
  if (idx === -1 || idx >= phases.length - 1) return 'complete'
  return phases[idx + 1].id
}

/** 收集所有 card 组件名，用于 chatVisibleComponents 白名单 */
function collectCardComponentNames(phases: PhaseConfig[]): string[] {
  const names = new Set<string>(['PreviewTriggerCard', 'GenericGateCard'])
  for (const phase of phases) {
    if (phase.card) names.add(phase.card.component)
  }
  return Array.from(names)
}

/**
 * 串行播放一个 phase 的所有消息，全部播完后执行 onDone 回调。
 * 每条消息携带该 phase 的 agent 信息（多角色支持）。
 * agentAvatarMap：场景级 Agent 名称→头像 key 映射，优先级低于 phase.agent.avatarKey。
 */
function playPhaseMessages(
  phase: PhaseConfig,
  dispatch: ScenarioContext['dispatch'],
  agentAvatarMap: Record<string, string>,
  onDone?: () => void,
): void {
  const agentName = phase.agent?.name
  const agentAvatarKey = phase.agent?.avatarKey ?? (agentName ? agentAvatarMap[agentName] : undefined)

  let msgIdx = 0

  function streamNext() {
    if (msgIdx >= phase.messages.length) {
      onDone?.()
      return
    }

    const text = phase.messages[msgIdx]
    const msgId = genMessageId()

    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: msgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        // 多角色字段：有值则覆盖场景默认角色
        agentName,
        agentAvatarKey,
      } as any,
    })

    msgIdx++
    streamFakeText(text, msgId, dispatch, streamNext)
  }

  streamNext()
}

/** 在所有消息播放完后，插入卡片或 PreviewTriggerCard */
function insertCardAfterMessages(
  phase: PhaseConfig,
  dispatch: ScenarioContext['dispatch'],
  agentAvatarMap: Record<string, string>,
): void {
  const agentName = phase.agent?.name
  const agentAvatarKey = phase.agent?.avatarKey ?? (agentName ? agentAvatarMap[agentName] : undefined)

  if (phase.card) {
    const cardMsgId = genMessageId()
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: cardMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        agentName,
        agentAvatarKey,
        component: phase.card.component as any,
        componentProps: phase.card.props || {},
      } as any,
    })
    return
  }

  if (phase.panel) {
    const triggerId = genMessageId()
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: triggerId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        agentName,
        agentAvatarKey,
        component: 'PreviewTriggerCard' as any,
        componentProps: {
          title: phase.panel.title || `${phase.panel.component} — 查看详情`,
          targetPhase: phase.id,
        },
      } as any,
    })
  }
}

// ─── 主函数：defineScenario ────────────────────────────────────────────────────

export function defineScenario(config: ScenarioConfig): ScenarioModule {
  const { phases, faq = [] } = config
  const phaseIds = phases.map(p => p.id)
  const extraMap = config.extraComponentMap || {}
  const agentAvatarMap = config.agentAvatarMap || {}

  // ── panelMap：每个有 panel 的 phase 创建一个动态包装组件 ──────────────────
  const panelMap: Record<string, React.ComponentType<any>> = {}
  const panelTitleMap: Record<string, string> = {}

  for (const phase of phases) {
    if (!phase.panel) continue
    const compName = phase.panel.component
    const staticProps = phase.panel.props || {}

    // 动态包装：渲染时才解析组件名，支持全局注册表 + 场景专属组件
    panelMap[phase.id] = function DynamicPanel(runtimeProps: any) {
      const allComponents = { ...demoComponentRegistry, ...extraMap }
      const Component = allComponents[compName]
      if (!Component) {
        return React.createElement(
          'div',
          { style: { padding: 16, color: '#c00', fontFamily: 'monospace', fontSize: 12 } },
          `[builder] 面板组件未找到: "${compName}"，请检查注册表或 extraComponentMap。`
        )
      }
      return React.createElement(Component, { ...staticProps, ...runtimeProps })
    }

    panelTitleMap[phase.id] = phase.panel.title || `${compName} — 内容预览`
  }

  // ── chatVisibleComponents：所有卡片组件名都需要在白名单里 ────────────────
  const chatVisibleComponents = collectCardComponentNames(phases)

  // ── ScenarioModule 实现 ────────────────────────────────────────────────────
  return {
    id: config.id,
    label: config.label,
    hidden: config.hidden,
    avatarKey: config.avatarKey,
    phases: [...phaseIds, 'complete'],
    initialState: {},
    chatVisibleComponents,
    extraComponentMap: extraMap,
    homeChips: config.homeChips || [{ label: config.label, scenarioId: config.id }],
    panelMap,
    panelTitleMap,

    // ── onPhaseEnter ─────────────────────────────────────────────────────────
    onPhaseEnter(phaseId, ctx) {
      const { dispatch } = ctx
      const phase = findPhase(phases, phaseId)
      if (!phase) return

      playPhaseMessages(phase, dispatch, agentAvatarMap, () => {
        insertCardAfterMessages(phase, dispatch, agentAvatarMap)

        if (phase.autoAdvance) {
          setTimeout(() => {
            ctx.dispatch({ type: 'SET_PHASE', phase: phase.autoAdvance!.to })
          }, phase.autoAdvance.delayMs)
        }
      })
    },

    // ── handleSend ───────────────────────────────────────────────────────────
    handleSend(text, ctx) {
      const { dispatch, stateRef } = ctx
      const phaseId = stateRef.current.phase as string

      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'user', content: text, timestamp: Date.now() },
      })

      // 优先级 1：FAQ 关键词匹配
      const matched = faq.find(
        f =>
          f.question !== '与任务无关的问题' &&
          (text.includes(f.question.slice(0, 6)) || f.question.includes(text.slice(0, 6)))
      )
      if (matched) {
        const msgId = genMessageId()
        dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })
        streamFakeText(matched.answer, msgId, dispatch)
        return
      }

      // 优先级 2：分支按钮关键词匹配
      const phase = findPhase(phases, phaseId)
      const matchedBranch = phase?.branches?.find(
        b => text.includes(b.label) || b.label.includes(text.slice(0, 4))
      )
      if (matchedBranch) {
        dispatch({ type: 'SET_PHASE', phase: matchedBranch.to })
        return
      }

      // 优先级 3：兜底回复
      const fallback = faq.find(f => f.question === '与任务无关的问题')
      const msgId = genMessageId()
      dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })
      streamFakeText(
        fallback?.answer || '请继续当前任务，有问题随时提问。',
        msgId,
        dispatch
      )
    },

    // ── handleComponentAction ────────────────────────────────────────────────
    handleComponentAction(action, payload, ctx) {
      const { dispatch, stateRef } = ctx
      const phaseId = stateRef.current.phase as string

      if (action === 'confirmGate') {
        const messageId = payload.messageId as string
        if (messageId) dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
        const phase = findPhase(phases, phaseId)
        const nextPhase = phase?.branches?.[0]?.to || findNextPhase(phases, phaseId)
        dispatch({ type: 'SET_PHASE', phase: nextPhase })
        return
      }

      // 分支卡片选择（SummaryTableCard、ScenarioSelectCard 等均可触发）
      if (action === 'branchSelect') {
        const messageId = payload.messageId as string
        const to = payload.to as string
        const label = payload.label as string
        if (messageId) dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
        if (label) {
          dispatch({
            type: 'ADD_MESSAGE',
            message: { id: genMessageId(), role: 'user', content: label, timestamp: Date.now() },
          })
        }
        dispatch({ type: 'SET_PHASE', phase: to })
        return
      }

      if (action === 'cancelGate') {
        const messageId = payload.messageId as string
        if (messageId) dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
        const msgId = genMessageId()
        dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })
        streamFakeText('好的，请告诉我需要调整的内容，我会重新处理。', msgId, dispatch)
        return
      }

      if (action === 'selectScenario') {
        const scenarioId = payload.scenario as string
        dispatch({ type: 'SET_CURRENT_SCENARIO', scenario: scenarioId })
        const firstPhase = phaseIds[0]
        if (firstPhase) dispatch({ type: 'SET_PHASE', phase: firstPhase })
        return
      }
    },

    // ── actionButtonsMap ─────────────────────────────────────────────────────
    actionButtonsMap(phaseId, isStreaming): ButtonConfig[] | null {
      if (isStreaming || phaseId === 'complete' || phaseId === 'home') return null
      const phase = findPhase(phases, phaseId)
      if (!phase) return null
      // 有 card 时由卡片自己渲染按钮
      if (phase.card) return null
      if (!phase.branches?.length) return null

      return phase.branches.map((b, idx) => ({
        label: b.label,
        value: b.label,
        variant: b.variant || (idx === 0 ? 'primary' : 'outline'),
      }))
    },
  }
}
