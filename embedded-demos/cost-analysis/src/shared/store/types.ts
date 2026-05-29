// ============ 对话类型 ============

export type ChatRole = 'user' | 'assistant' | 'system'

export type RichComponentType =
  | 'GenericGateCard'
  | 'GenericPanel'
  | 'ConfirmAction'
  | 'PreviewTriggerCard'
  | 'ScenarioSelectCard'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: number
  component?: RichComponentType
  componentProps?: Record<string, unknown>
  componentHandled?: boolean
  appendedComponent?: RichComponentType
  appendedComponentProps?: Record<string, unknown>
  appendedComponentHandled?: boolean
  attachment?: { name: string; size?: string }
  error?: string
  progress?: number
  hidden?: boolean
  /**
   * 多角色支持：消息归属的 AI 专员名称。
   * 有值时覆盖场景默认的 currentAgentName，用于多角色对话场景。
   */
  agentName?: string
  /**
   * 多角色支持：消息归属的头像 key（对应 AgentAvatar 映射）。
   * 有值时覆盖场景默认的 currentAvatarKey。
   */
  agentAvatarKey?: string
}

// ============ 全局状态 ============

export interface AppState {
  shellMode: 'native' | 'sidebar'
  phase: string
  messages: ChatMessage[]
  isStreaming: boolean
  pendingQuestion: string | null
  uploadedFileName: string | null
  currentTaskTitle: string
  currentScenario: string | null
  currentAgentName: string
  currentAvatarKey: string
  /** 首页当前展示的 AI 专员 ID（null = 默认展示第一个专员） */
  homeAgentId: string | null
  openPreview: boolean
  openPreviewReadonly: boolean
  openPreviewTargetPhase: string | null
  // 各场景专属状态容器（sub-object pattern）
  scenarioStates: Record<string, unknown>
}

// ============ Actions ============

export type AppAction =
  | { type: 'SET_SHELL_MODE'; shellMode: 'native' | 'sidebar' }
  | { type: 'SET_PHASE'; phase: string }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; id: string; updates: Partial<ChatMessage> }
  | { type: 'APPEND_STREAMING_TEXT'; messageId: string; text: string }
  | { type: 'SET_STREAMING'; isStreaming: boolean }
  | { type: 'SET_PENDING_QUESTION'; question: string | null }
  | { type: 'SET_UPLOADED_FILE'; fileName: string | null }
  | { type: 'SET_CURRENT_TASK_TITLE'; title: string }
  | { type: 'SET_CURRENT_SCENARIO'; scenario: string | null; agentName?: string; avatarKey?: string }
  | { type: 'SWITCH_SCENARIO'; scenarioId: string; agentName: string; avatarKey: string; initialPhase: string; message: ChatMessage }
  | { type: 'UPDATE_MESSAGE_PROGRESS'; messageId: string; progress: number }
  | { type: 'OPEN_PREVIEW'; readonly: boolean; targetPhase?: string }
  | { type: 'RESET_OPEN_PREVIEW' }
  | { type: 'SET_SCENARIO_STATE'; scenarioId: string; state: unknown }
  | { type: 'RESET'; homeAgentId?: string | null }
