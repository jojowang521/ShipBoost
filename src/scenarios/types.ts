import type React from 'react'

export interface ScenarioContext {
  state: any
  dispatch: (action: any) => void
  stateRef: React.MutableRefObject<any>
}

export interface ButtonConfig {
  label: string
  value: string
  variant: 'primary' | 'outline' | 'ghost'
}

export interface PanelFooterProps {
  onAskQuestion: (q: string) => void
  readonly?: boolean
}

export interface HomeChip {
  label: string
  scenarioId: string
  prompt?: string
}

export interface AgentProfile {
  agentId: string
  agentName: string
  agentDescription: string
  avatarKey: string
  homeChips: HomeChip[]
  scenarios: ScenarioModule[]
}

export interface ScenarioModule {
  id: string
  label: string
  /** AI 专员分组 ID，优先来自 scenario.manifest.json */
  agentId?: string
  /** AI 专员名称，优先来自 scenario.manifest.json */
  agentName?: string
  /** AI 专员一句话介绍，优先来自 scenario.manifest.json */
  agentDescription?: string
  /** 首页快捷入口文案，要求 8 个字以内 */
  shortcutLabel?: string
  shortcutPrompt?: string
  /** 同一专员下快捷入口排序 */
  shortcutOrder?: number
  phases: string[]
  initialState: Record<string, unknown>
  handleSend: (text: string, ctx: ScenarioContext) => void
  handleComponentAction: (action: string, payload: Record<string, unknown>, ctx: ScenarioContext) => void
  panelMap: Record<string, React.ComponentType<any>>
  panelTitleMap?: Record<string, string>
  panelFooterMap?: Record<string, React.ComponentType<PanelFooterProps>>
  actionButtonsMap: (phase: string, isStreaming: boolean) => ButtonConfig[] | null
  onPhaseEnter?: (phase: string, ctx: ScenarioContext) => void
  chatVisibleComponents?: string[]
  extraComponentMap?: Record<string, React.ComponentType<any>>
  startDemo?: (ctx: ScenarioContext) => void
  /** 首页快捷入口，由 step_1 操作按钮自动生成 */
  homeChips?: HomeChip[]
  /** 头像 key，由 registry 按注册顺序自动分配，如 'avatar-ai-1' */
  avatarKey?: string
  /**
   * 是否在「切换专员」列表中隐藏。
   * 设为 true 的子场景只能通过首页 homeChips 或文字输入进入，不会出现在切换器中。
   */
  hidden?: boolean
  /** 内部：挂载解析后的 doc 对象（由 scenarioFactory 注入） */
  _doc?: unknown
}
