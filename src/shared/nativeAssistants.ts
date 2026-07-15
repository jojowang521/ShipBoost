export interface NativeAssistantDialogue {
  id: string
  title: string
  prompt: string
}

export interface NativeAssistantQuestion {
  label: string
  prompt: string
}

export interface NativeHomeInfoItem {
  title: string
  time: string
  tag: string
  tone: 'neutral' | 'warning' | 'danger' | 'success' | 'info'
}

export interface NativeHomeInfoCard {
  title: string
  count: number
  iconSrc: string
  items: NativeHomeInfoItem[]
}

export interface NativeAssistantExperience {
  agentId: string
  agentName: string
  agentDescription: string
  homeDescription: string
  inputPlaceholderExample: string
  avatarKey: string
  dialogues: NativeAssistantDialogue[]
  questions: NativeAssistantQuestion[]
  homeInfoCards: NativeHomeInfoCard[]
}

export const SYSTEM_MANAGEMENT_ASSISTANT_ID = 'system-management-assistant'

const LEGACY_NATIVE_ASSISTANT_ID_MAP: Record<string, string> = {
  'template-printing': SYSTEM_MANAGEMENT_ASSISTANT_ID,
  'process-assistant': SYSTEM_MANAGEMENT_ASSISTANT_ID,
  'permission-assistant': SYSTEM_MANAGEMENT_ASSISTANT_ID,
}

export function normalizeNativeAssistantId(agentId: string | null | undefined): string | null | undefined {
  if (!agentId) return agentId
  return LEGACY_NATIVE_ASSISTANT_ID_MAP[agentId] ?? agentId
}

const NOMA_HOME_INFO_CARDS: NativeHomeInfoCard[] = [
  {
    title: '消息',
    count: 6,
    iconSrc: '/aui-native/home-icons/list-analysis.svg',
    items: [
      { title: '2026-06-03 动态成本日报已生成', time: '2026/06/03 10:30', tag: 'AI日报', tone: 'neutral' },
      { title: '武汉江湾府硬景单方造价高于基准 8%', time: '2026/06/03 10:30', tag: '指标预警', tone: 'warning' },
      { title: '西安云璟府控制价底稿待复核', time: '2026/06/03 10:30', tag: '审核提醒', tone: 'neutral' },
      { title: '杭州西湖府签证变更累计超目标 12%', time: '2026/06/03 10:30', tag: '成本预警', tone: 'warning' },
    ],
  },
  {
    title: '待办',
    count: 8,
    iconSrc: '/aui-native/home-icons/control-price-review.svg',
    items: [
      { title: '审核西安云璟府控制价送审文件', time: '2026/06/03 10:30', tag: '急', tone: 'danger' },
      { title: '跟进总包合同付款节点补充说明', time: '2026/06/03 10:30', tag: '催', tone: 'warning' },
      { title: '处理武汉项目清单指标异常项', time: '2026/06/03 10:30', tag: '无', tone: 'neutral' },
      { title: '复盘本月动态成本超目标科目', time: '2026/06/03 10:30', tag: '超', tone: 'danger' },
    ],
  },
]

export const NATIVE_ASSISTANT_EXPERIENCES: NativeAssistantExperience[] = [
  {
    agentId: 'noma-ai',
    agentName: 'AI 助手',
    agentDescription: '聚合交付提效场景、业务助手和日常任务协同的默认 AI 助手。',
    homeDescription: '明源云交付提效 AI 助手，串联套打、流程、权限与日常任务',
    inputPlaceholderExample: '查看今日待办',
    avatarKey: 'noma_ai',
    dialogues: [
      { id: 'message-todo__today-todo', title: '查看今日待办', prompt: '查看今日待办' },
      { id: 'template-printing__auto-template-generation', title: '套打模板生成', prompt: '根据标准合同样张生成套打模板' },
      { id: 'process-assistant__process-debug', title: '采购流程调试', prompt: '为采购审批流程生成全分支调试用例' },
      { id: 'process-assistant__handover-flow', title: '流程责任人转交', prompt: '将张三的所有流程转交给李四' },
      { id: 'permission-assistant__permission-check', title: '用户权限检查', prompt: 'wm1有哪些权限' },
    ],
    questions: [
      { label: '查看今日待办', prompt: '查看今日待办' },
      { label: '调试采购流程', prompt: '为采购审批流程生成全分支调试用例' },
      { label: '流程转交', prompt: '将张三的所有流程转交给李四' },
      { label: '查用户权限', prompt: 'wm1有哪些权限' },
    ],
    homeInfoCards: NOMA_HOME_INFO_CARDS,
  },
  {
    agentId: SYSTEM_MANAGEMENT_ASSISTANT_ID,
    agentName: '系统管理助手',
    agentDescription: '聚合套打、流程和权限管理能力，根据用户问题进入对应业务对话流。',
    homeDescription: '你好，我是系统管理助手，可以帮你快速生成套打模板、诊断权限问题、调试审批流程、调整流程数据。',
    inputPlaceholderExample: '根据标准合同样张生成套打模板',
    avatarKey: 'avatar-ai-2',
    dialogues: [
      { id: 'template-printing__auto-template-generation', title: '上传标准合同生成套打模板', prompt: '根据标准合同样张生成套打模板' },
      { id: 'process-assistant__process-debug', title: '流程模板调试', prompt: '我要调试合同审批流程' },
      { id: 'process-assistant__handover-flow', title: '流程数据调整', prompt: '请上传需要调整流程数据的截图（需要标注调整字段的值）' },
      { id: 'permission-assistant__permission-check', title: '用户权限配置检查', prompt: 'wm1有哪些权限' },
    ],
    questions: [
      { label: '生成套打模板', prompt: '根据标准合同样张生成套打模板' },
      { label: '查询和诊断用户权限', prompt: 'wm1有哪些权限' },
      { label: '调试审批流程', prompt: '我要调试合同审批流程' },
      { label: '调整流程数据', prompt: '请上传需要调整流程数据的截图（需要标注调整字段的值）' },
    ],
    homeInfoCards: [],
  },
]

export function getNativeAssistantExperience(agentId: string | null | undefined): NativeAssistantExperience {
  const normalizedAgentId = normalizeNativeAssistantId(agentId)
  if (!normalizedAgentId) return NATIVE_ASSISTANT_EXPERIENCES[0]
  return NATIVE_ASSISTANT_EXPERIENCES.find(agent => agent.agentId === normalizedAgentId) ?? NATIVE_ASSISTANT_EXPERIENCES[0]
}

export function getNativeAssistantByIdentity(
  agentId: string | null | undefined,
  agentName: string | null | undefined,
): NativeAssistantExperience {
  if (agentName) {
    const normalizedAgentName = ['套打助手', '流程助手', '权限助手'].includes(agentName) ? '系统管理助手' : agentName
    const byName = NATIVE_ASSISTANT_EXPERIENCES.find(agent => agent.agentName === normalizedAgentName)
    if (byName) return byName
  }
  if (agentId) {
    const normalizedAgentId = normalizeNativeAssistantId(agentId)
    const byId = NATIVE_ASSISTANT_EXPERIENCES.find(agent => agent.agentId === normalizedAgentId)
    if (byId) return byId
  }
  return NATIVE_ASSISTANT_EXPERIENCES[0]
}

export function getNativeAssistantQuickActions(agent: NativeAssistantExperience): NativeAssistantQuestion[] {
  return agent.questions.slice(0, 4)
}

export function getNativeAssistantInputPlaceholder(agent: NativeAssistantExperience): string {
  return `请输入你的问题，如：${agent.inputPlaceholderExample}`
}

export function nativeAvatarSrc(avatarKey: string): string {
  const map: Record<string, string> = {
    noma_ai: '/aui-native/avatars/custom/1.png',
    smart_cost_assistant: '/aui-native/avatars/custom/2.png',
    cost_assistant: '/aui-native/avatars/custom/12.png',
    data_assistant: '/aui-native/avatars/custom/8.png',
    bill_assistant: '/aui-native/avatars/custom/9.png',
    procurement_assistant: '/aui-native/avatars/custom/6.png',
    payment_specialist: '/aui-native/avatars/custom/4.png',
    finance_assistant: '/aui-native/avatars/custom/5.png',
    tender_assistant: '/aui-native/avatars/custom/10.png',
    cost_qa_assistant: '/aui-native/avatars/custom/11.png',
    project_cost_assistant: '/aui-native/avatars/custom/7.png',
    'avatar-ai-1': '/aui-native/avatars/custom/2.png',
    'avatar-ai-2': '/aui-native/avatars/custom/8.png',
    'avatar-ai-3': '/aui-native/avatars/custom/9.png',
    'avatar-ai-4': '/aui-native/avatars/custom/6.png',
  }
  return map[avatarKey] || map.noma_ai
}
