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
    inputPlaceholderExample: '根据合同样张生成套打模板',
    avatarKey: 'noma_ai',
    dialogues: [
      { id: 'template-printing__auto-template-generation', title: '套打模板生成', prompt: '根据标准合同样张生成套打模板' },
      { id: 'process-assistant__process-debug', title: '采购流程调试', prompt: '为采购审批流程生成全分支调试用例' },
      { id: 'process-assistant__handover-flow', title: '流程责任人转交', prompt: '将张三的所有流程转交给李四' },
      { id: 'permission-assistant__permission-check', title: '用户权限检查', prompt: '查询李四现在有哪些权限，说明角色、公司和项目数据权限' },
    ],
    questions: [
      { label: 'AI新增模板', prompt: '根据标准合同样张生成套打模板' },
      { label: '调试采购流程', prompt: '为采购审批流程生成全分支调试用例' },
      { label: '流程转交', prompt: '将张三的所有流程转交给李四' },
      { label: '查用户权限', prompt: '查询李四现在有哪些权限，说明角色、公司和项目数据权限' },
    ],
    homeInfoCards: NOMA_HOME_INFO_CARDS,
  },
  {
    agentId: 'template-printing',
    agentName: '套打助手',
    agentDescription: '识别合同样张、生成套打字段配置，并整理模板发布前复核清单。',
    homeDescription: '上传标准样张后识别字段、生成套打模板配置并整理发布前复核清单',
    inputPlaceholderExample: '根据标准合同样张生成套打模板',
    avatarKey: 'avatar-ai-1',
    dialogues: [
      { id: 'template-printing__auto-template-generation', title: '上传标准合同生成套打模板', prompt: '根据标准合同样张生成套打模板' },
    ],
    questions: [
      { label: 'AI新增模板', prompt: '根据标准合同样张生成套打模板' },
      { label: '识别合同字段', prompt: '识别这份租赁合同样张里的业务字段' },
      { label: '生成替换标记', prompt: '生成套打模板字段替换标记' },
      { label: '发布前复核', prompt: '整理套打模板发布前复核清单' },
    ],
    homeInfoCards: [],
  },
  {
    agentId: 'process-assistant',
    agentName: '流程助手',
    agentDescription: '支持流程调试、路径覆盖、责任人转交和流程维护影响分析。',
    homeDescription: '覆盖流程调试和流程维护，生成分支用例、执行计划和影响分析',
    inputPlaceholderExample: '为采购审批流程生成全分支调试用例',
    avatarKey: 'avatar-ai-2',
    dialogues: [
      { id: 'process-assistant__process-debug', title: '采购审批流程调试', prompt: '为采购审批流程生成全分支调试用例' },
      { id: 'process-assistant__handover-flow', title: '流程责任人批量转交', prompt: '将张三的所有流程转交给李四' },
    ],
    questions: [
      { label: '调试采购流程', prompt: '为采购审批流程生成全分支调试用例' },
      { label: '流程转交', prompt: '将张三的所有流程转交给李四' },
      { label: '检查分支覆盖', prompt: '检查采购审批流程调试用例是否覆盖所有分支' },
      { label: '查看影响范围', prompt: '分析张三流程转交给李四的影响范围' },
    ],
    homeInfoCards: [],
  },
  {
    agentId: 'permission-assistant',
    agentName: '权限助手',
    agentDescription: '查询用户权限、诊断功能权限和数据权限，并生成最小授权方案。',
    homeDescription: '面向功能权限、公司数据权限和项目数据权限，辅助生成最小授权方案',
    inputPlaceholderExample: '查询李四现在有哪些权限',
    avatarKey: 'avatar-ai-3',
    dialogues: [
      { id: 'permission-assistant__permission-check', title: '用户权限配置检查', prompt: '查询李四现在有哪些权限，说明角色、公司和项目数据权限' },
    ],
    questions: [
      { label: '查用户权限', prompt: '查询李四现在有哪些权限，说明角色、公司和项目数据权限' },
      { label: '检查功能权限', prompt: '检查李四是否具备合同台账查看功能权限' },
      { label: '检查数据权限', prompt: '检查李四在公司和项目上的数据权限范围' },
      { label: '生成授权方案', prompt: '为李四生成最小授权调整方案' },
    ],
    homeInfoCards: [],
  },
]

export function getNativeAssistantExperience(agentId: string | null | undefined): NativeAssistantExperience {
  if (!agentId) return NATIVE_ASSISTANT_EXPERIENCES[0]
  return NATIVE_ASSISTANT_EXPERIENCES.find(agent => agent.agentId === agentId) ?? NATIVE_ASSISTANT_EXPERIENCES[0]
}

export function getNativeAssistantByIdentity(
  agentId: string | null | undefined,
  agentName: string | null | undefined,
): NativeAssistantExperience {
  if (agentName) {
    const byName = NATIVE_ASSISTANT_EXPERIENCES.find(agent => agent.agentName === agentName)
    if (byName) return byName
  }
  if (agentId) {
    const byId = NATIVE_ASSISTANT_EXPERIENCES.find(agent => agent.agentId === agentId)
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
