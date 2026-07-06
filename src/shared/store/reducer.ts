import type { AppState, AppAction } from './types'

export const initialState: AppState = {
  shellMode: 'native',
  phase: 'home',
  messages: [],
  isStreaming: false,
  pendingQuestion: null,
  uploadedFileName: null,
  currentTaskTitle: '新任务',
  currentScenario: null,
  currentAgentName: 'Noma 助手',
  currentAvatarKey: 'noma_ai',
  homeAgentId: null,
  openPreview: false,
  openPreviewReadonly: false,
  openPreviewTargetPhase: null,
  openPreviewTargetArtifactTitle: null,
  openPreviewDelayMs: 0,
  openPreviewScrollBeforeOpen: false,
  closePreviewRequestId: 0,
  scenarioStates: {},
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SHELL_MODE':
      return { ...state, shellMode: action.shellMode }
    case 'SET_PHASE':
      return { ...state, phase: action.phase }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'SET_MESSAGES':
      return { ...state, messages: action.messages }
    case 'REPLACE_MESSAGES':
      return {
        ...state,
        messages: action.messages,
        isStreaming: action.isStreaming ?? state.isStreaming,
      }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
      }
    case 'APPEND_STREAMING_TEXT':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.messageId
            ? { ...m, content: m.content + action.text }
            : m
        ),
      }
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.isStreaming }
    case 'SET_PENDING_QUESTION':
      return { ...state, pendingQuestion: action.question }
    case 'SET_UPLOADED_FILE':
      return { ...state, uploadedFileName: action.fileName }
    case 'SET_CURRENT_TASK_TITLE':
      return { ...state, currentTaskTitle: action.title }
    case 'SET_CURRENT_SCENARIO':
      return {
        ...state,
        currentScenario: action.scenario,
        currentAgentName: action.agentName ?? state.currentAgentName,
        currentAvatarKey: action.avatarKey ?? state.currentAvatarKey,
      }
    case 'SET_HOME_AGENT':
      return { ...state, homeAgentId: action.agentId }
    case 'SWITCH_SCENARIO':
      // 原子切换：一次 dispatch 完成 RESET + 场景初始化，杜绝中间态渲染
      return {
        ...initialState,
        shellMode: state.shellMode,
        currentScenario: action.scenarioId,
        currentAgentName: action.agentName,
        currentAvatarKey: action.avatarKey,
        phase: action.initialPhase,
        currentTaskTitle: action.taskTitle || action.message.content || '新任务',
        messages: [action.message],
      }
    case 'START_TASK_REPLAY':
      return {
        ...initialState,
        shellMode: state.shellMode,
        phase: 'task-replay',
        currentScenario: action.scenarioId ?? null,
        currentAgentName: action.agentName,
        currentAvatarKey: action.avatarKey,
        currentTaskTitle: action.title,
        messages: action.messages,
      }
    case 'UPDATE_MESSAGE_PROGRESS':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.messageId ? { ...m, progress: action.progress } : m
        ),
      }
    case 'OPEN_PREVIEW':
      return {
        ...state,
        openPreview: true,
        openPreviewReadonly: action.readonly,
        openPreviewTargetPhase: action.targetPhase ?? null,
        openPreviewTargetArtifactTitle: action.targetArtifactTitle ?? null,
        openPreviewDelayMs: action.delayMs ?? 0,
        openPreviewScrollBeforeOpen: !!action.scrollBeforeOpen,
      }
    case 'RESET_OPEN_PREVIEW':
      return {
        ...state,
        openPreview: false,
        openPreviewReadonly: false,
        openPreviewTargetPhase: null,
        openPreviewTargetArtifactTitle: null,
        openPreviewDelayMs: 0,
        openPreviewScrollBeforeOpen: false,
      }
    case 'CLOSE_PREVIEW':
      return {
        ...state,
        openPreview: false,
        openPreviewReadonly: false,
        openPreviewTargetPhase: null,
        openPreviewTargetArtifactTitle: null,
        openPreviewDelayMs: 0,
        openPreviewScrollBeforeOpen: false,
        closePreviewRequestId: state.closePreviewRequestId + 1,
      }
    case 'SET_SCENARIO_STATE':
      return {
        ...state,
        scenarioStates: { ...state.scenarioStates, [action.scenarioId]: action.state },
      }
    case 'RESET':
      return { ...initialState, shellMode: state.shellMode, homeAgentId: action.homeAgentId ?? null }
    default:
      return state
  }
}
