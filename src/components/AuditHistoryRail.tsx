/**
 * AuditHistoryRail — 统一历史对话侧栏
 *
 * P9-g.5 对齐参考：AI 采招风控_独立模式
 *   - HistorySidebar.tsx: 收起时 width→0，展开态 244px，内容卡片圆角白色
 *   - AuditHeader.tsx:    收起时胶囊浮在对话区左上角（由父容器 relative 定位）
 *
 * 收起态（isCollapsed=true）：
 *   - aside 宽度过渡到 0（裁切动画），自身不占用空间
 *   - 胶囊由父容器（AuditWorkspaceShell）通过 .audit-rail__floating-capsule 绝对定位渲染
 *   - 本组件只负责展开态 JSX 和 isCollapsed 状态反馈
 *
 * 展开态（isCollapsed=false）：
 *   - aside 244px，内容区白色圆角卡片
 *
 * TODO(体验待统一): 历史记录待接入真实会话历史
 * TODO(体验待统一): 用户信息区待接入真实用户状态
 */
import { useEffect, useRef, useState } from 'react'
import { NewChatIcon } from './NewChatIcon'
import { FoldIcon } from './FoldIcon'
import { useApp } from '../shared/store/AppContext'
import { getScenario } from '../scenarios/registry'
import {
  NATIVE_ASSISTANT_EXPERIENCES,
  getNativeAssistantByIdentity,
  getNativeAssistantExperience,
  nativeAvatarSrc,
} from '../shared/nativeAssistants'

interface HistoryItem {
  id: string
  label: string
}

interface HistoryGroup {
  label: string
  items: HistoryItem[]
}

function DialogueRecordIcon({ className = 'audit-native-dialogue-row__icon' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14.6663 3C14.6663 2.44772 14.2186 2 13.6663 2H2.33301C1.78072 2 1.33301 2.44772 1.33301 3V11C1.33301 11.5523 1.78072 12 2.33301 12H4.33301V13.6667L7.66634 12H13.6663C14.2186 12 14.6663 11.5523 14.6663 11V3Z" />
      <path d="M4.66699 6.5V7.5" />
      <path d="M8 6.5V7.5" />
      <path d="M11.333 6.5V7.5" />
    </svg>
  )
}

function ScheduleTaskRecordIcon({ className = 'audit-native-dialogue-row__schedule-icon' }: { className?: string }) {
  return (
    <img className={className} src="/aui-native/icons/schedule-task.svg" alt="" draggable={false} aria-hidden="true" />
  )
}

function isScheduleDialogue(item: HistoryItem) {
  return item.id === 'noma-ai__daily-sales-report' || item.label.includes('日报')
}

interface NativeAgent {
  agentId: string
  agentName: string
  agentDescription: string
  avatarKey: string
}

interface NativePanelGroup {
  agentId: string
  agentName: string
  agentDescription: string
  avatarKey: string
  isOther?: boolean
}

type NativePage = 'home' | 'agents' | 'skills' | 'tasks'

function NativeNewDialogueIcon({ className = 'audit-native-nav-row__icon' }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <NewChatIcon className="audit-native-nav-row__icon-symbol" />
    </span>
  )
}

function NativeAgentDiscoveryIcon({ className = 'audit-native-nav-row__icon' }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <AgentDiscoveryGlyph className="audit-native-nav-row__icon-symbol" />
    </span>
  )
}

function AgentDiscoveryGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <g clipPath="url(#agent-discovery-icon-clip)">
        <path d="M14.75 8C14.75 4.27209 11.7279 1.25 8 1.25C4.27209 1.25 1.25 4.27209 1.25 8C1.25 11.7279 4.27209 14.75 8 14.75C11.7279 14.75 14.75 11.7279 14.75 8Z" stroke="#2E3238" strokeWidth="1.2" />
        <path d="M6.45995 6.45982L10.6955 5.30468L9.54032 9.54019L5.30481 10.6953L6.45995 6.45982Z" stroke="#2E3238" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="agent-discovery-icon-clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function ScheduleTaskGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <g clipPath="url(#schedule-task-icon-clip)">
        <mask id="schedule-task-icon-mask" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
          <path d="M16 0H0V16H16V0Z" fill="white" />
        </mask>
        <g mask="url(#schedule-task-icon-mask)">
          <path d="M7.99977 14.9166C11.5436 14.9166 14.4165 12.0438 14.4165 8.49994C14.4165 4.95613 11.5436 2.08328 7.99977 2.08328C4.45595 2.08328 1.58313 4.95613 1.58313 8.49994C1.58313 12.0438 4.45595 14.9166 7.99977 14.9166Z" stroke="#2E3238" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M7.91583 4.7739L7.91541 8.62697L10.6357 11.3472" stroke="#2E3238" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1.00012 2.55L3.45012 0.800003" stroke="#2E3238" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.0002 2.55008L12.5502 0.800079" stroke="#2E3238" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <defs>
        <clipPath id="schedule-task-icon-clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function NativeOtherDialogueIcon() {
  return (
    <span className="audit-native-agent-row__more-avatar" aria-hidden="true">
      <img src="/aui-native/icons/more.svg" alt="" draggable={false} />
    </span>
  )
}

function getCompactAgentName(agent: NativeAgent) {
  return agent.agentName
}

function getCompactDialogueTitle(item: HistoryItem) {
  if (item.label === '新任务' || item.label === '新建对话') return '控制价审核'
  if (item.label === '生成控制价审核报告') return '控制价审核报告'
  if (item.label.includes('销售日报')) return '每日销售日报'
  return item.label
}

function getMockDialogueTitles(agent: NativeAgent) {
  const map: Record<string, string[]> = {
    'control-price': [
      '深圳湾控制价审核',
      '目标成本偏差分析',
      '动态成本月报复核',
      '清单指标异常定位',
      '材料价格波动跟踪',
      '合同条款风险检查',
      '签证变更费用复盘',
      '项目成本预警汇总',
      '单方造价对标分析',
      '结算争议事项整理',
    ],
    'cost-analysis-assistant': [
      '测试项目-一期总成本快照',
      '配套设施费超支归因',
      '近 6 月动态成本走势',
      '年末成本超目标预测',
      '待发生合约释放节奏',
      '主体建筑装修节余复盘',
      '机电安装成本风险跟踪',
      '二期成本对比分析',
      '本月成本预警事项汇总',
      '专项成本会上会材料',
    ],
    'data-assistant': [
      '成本台账口径核验',
      '项目指标看板生成',
      '区域成交数据对比',
      '目标成本数据缺口',
      '动态成本数据归集',
      '材料价格库清洗',
      '成本科目映射检查',
      '经营数据口径导出',
      '异常数据来源定位',
      '指标字段一致性复核',
    ],
    'bill-assistant': [
      '供应商账单金额核对',
      '本月待付款申请汇总',
      '重复发票异常识别',
      '结算差异明细生成',
      '逾期付款节点提醒',
      '供应商账户变更复核',
      '费用归集科目匹配',
      '月结账单异常整理',
      '付款审批资料检查',
      '账单风险优先级排序',
    ],
    'procurement-assistant': [
      '招标文件条款风险',
      '供应商报价偏离对比',
      '疑似围标线索识别',
      '采购合规报告生成',
      '入围供应商资质核验',
      '清标报价异常复核',
      '评标评分口径检查',
      '采购合同履约跟踪',
      '供应商风险分级',
      '招采过程资料归档',
    ],
    'payment-audit': [
      '西安云璟府付款预审',
      '供应商账户变更核验',
      '合同付款节点匹配',
      '重复付款风险识别',
      '发票金额一致性复核',
      '本月付款申请优先级',
      '补充资料缺口清单',
      '异常审批意见汇总',
      '付款审核报告生成',
      '付款台账风险复盘',
    ],
    'other-dialogues': [
      '通用事项跟进',
      '会议纪要整理',
      '跨部门协同提醒',
      '资料清单生成',
      '待确认问题汇总',
      '审批意见归纳',
      '业务规则查询',
      '项目背景摘要',
      '历史对话复盘',
      '临时任务记录',
      '待办优先级梳理',
      '资料归档进度提醒',
    ],
  }
  return map[agent.agentId] ?? Array.from({ length: 10 }, (_, index) => `${agent.agentName}对话记录 ${index + 1}`)
}

interface Props {
  isCollapsed: boolean
  onToggle: () => void
  activeId?: string
  onNewChat?: () => void
  onSelectScenario?: (scenarioId: string) => void
  activeNativePage?: NativePage
  onNativeNavigate?: (page: NativePage) => void
  onNativeAgentSelect?: (agentId: string) => void
  variant?: 'inline' | 'floating'
  hideFooter?: boolean
  hideFloatingHeader?: boolean
  nativeMode?: boolean
  hideDigitalEmployees?: boolean
  navHidden?: boolean
}

function HiddenNavLogo() {
  return (
    <svg className="audit-native-panel__hidden-logo" width="92" height="18" viewBox="0 0 92 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Noma.ai" role="img">
      <path d="M15.3572 1.53044V17.6931C14.507 17.6931 13.6837 17.6126 12.8782 17.711C11.8848 17.8363 11.33 17.4067 10.7572 16.655C8.49298 13.6748 6.15721 10.7573 3.8393 7.81292C3.78561 7.7503 3.73191 7.68763 3.60662 7.54446V17.6573H0V1.48569C0.787551 1.48569 1.56615 1.54834 2.32685 1.4678C3.29339 1.3604 3.91985 1.69153 4.51947 2.48803C6.76575 5.45924 9.10157 8.36783 11.4016 11.3032C11.4821 11.4017 11.5627 11.509 11.7148 11.6881V1.53044H15.3661H15.3572Z" fill="url(#hidden-nav-logo-0)"/>
      <path d="M47.2627 17.6663C47.2627 17.4246 47.2627 17.2277 47.2627 17.0398C47.2627 15.0888 47.2627 13.1289 47.2627 11.1779C47.2627 10.9542 47.2447 10.7304 47.2179 10.5067C47.0568 9.46856 46.4482 8.86897 45.4728 8.77055C44.5062 8.68099 43.6202 9.21797 43.3249 10.1577C43.1817 10.6051 43.1101 11.0884 43.1012 11.5627C43.0743 13.3079 43.0922 15.053 43.0922 16.7982C43.0922 17.0756 43.0922 17.353 43.0922 17.6663H39.6914C39.6914 17.4783 39.6914 17.3172 39.6914 17.1561C39.6914 15.2141 39.6914 13.281 39.6825 11.339C39.6825 10.981 39.6556 10.6231 39.5751 10.274C39.3335 9.30746 38.6623 8.76155 37.7315 8.75261C36.7739 8.74367 35.9774 9.30746 35.7268 10.2293C35.6194 10.6409 35.5568 11.0795 35.5568 11.5091C35.5389 13.3884 35.5568 15.2678 35.5479 17.1472C35.5479 17.3083 35.5299 17.4694 35.521 17.6573H32.2455V5.91565H35.5299V7.22229C36.4517 5.99619 37.6957 5.56662 39.1187 5.62031C40.5595 5.68296 41.6872 6.31837 42.43 7.62497C42.5015 7.54442 42.5553 7.49968 42.591 7.43707C43.8977 5.49503 46.6004 5.13705 48.5066 6.16623C49.4642 6.68531 50.0638 7.50862 50.3592 8.5289C50.5202 9.09268 50.6366 9.70127 50.6455 10.283C50.6724 12.6367 50.6545 14.9993 50.6455 17.353C50.6455 17.4425 50.6276 17.523 50.6187 17.6394H47.2447L47.2627 17.6663Z" fill="url(#hidden-nav-logo-1)"/>
      <path d="M61.9034 7.22227V5.91567H65.143V17.6663H61.9213V16.4491C61.8407 16.4491 61.796 16.4313 61.7871 16.4402C60.3372 18.1674 58.4758 18.2838 56.5337 17.6395C54.18 16.8608 52.9718 15.0441 52.6586 12.6725C52.3364 10.1846 53.115 8.06352 55.2182 6.569C56.9543 5.33396 59.4423 5.30711 61.0263 6.44371C61.3127 6.64955 61.5633 6.90907 61.9124 7.22227H61.9034ZM58.9679 8.76159C57.3123 8.76159 56.0325 10.0413 56.0236 11.7149C56.0236 13.469 57.3034 14.8114 58.9859 14.8203C60.6594 14.8203 61.9213 13.5137 61.9213 11.7507C61.9213 10.0413 60.6684 8.77053 58.9679 8.76159Z" fill="url(#hidden-nav-logo-2)"/>
      <path d="M23.9578 17.9884C21.4699 17.89 19.501 16.9682 18.3107 14.7845C17.1742 12.6903 17.201 10.5514 18.4718 8.52887C19.8411 6.36311 21.9084 5.48607 24.4322 5.65611C26.1415 5.77245 27.6092 6.44364 28.7279 7.76818C30.303 9.6207 30.6789 11.7417 29.8555 14.0059C29.0411 16.2164 27.3496 17.4604 25.0407 17.8721C24.6559 17.9437 24.2711 17.9616 23.9578 17.9884ZM26.7948 11.7865C26.7948 10.0593 25.5329 8.75259 23.8772 8.76159C22.2216 8.76159 20.9598 10.0682 20.9598 11.7954C20.9598 13.5048 22.2216 14.8203 23.8772 14.8203C25.524 14.8203 26.7948 13.4958 26.7948 11.7865Z" fill="url(#hidden-nav-logo-3)"/>
      <path d="M81.7176 7.088V5.91564H85.0026V17.6662H81.7356V16.4044C81.6283 16.467 81.5749 16.476 81.5389 16.5118C80.7064 17.5499 79.5878 17.9437 78.3079 17.9705C75.5963 18.0332 73.2698 16.2523 72.661 13.6032C72.0883 11.0794 72.4733 8.76155 74.4958 6.98065C76.1248 5.53976 78.0668 5.24442 80.0983 6.00513C80.671 6.21991 81.1538 6.70319 81.7176 7.088ZM75.7937 11.7506C75.7937 13.4958 77.118 14.8203 78.8363 14.8203C80.4737 14.8203 81.7446 13.4958 81.7446 11.8312C81.7446 10.0145 80.5277 8.75262 78.8003 8.76155C77.091 8.76155 75.7937 10.0592 75.802 11.7596L75.7937 11.7506Z" fill="url(#hidden-nav-logo-4)"/>
      <path d="M87.4627 5.90664H90.6577V17.6573H87.4627V5.90664Z" fill="url(#hidden-nav-logo-5)"/>
      <path d="M71.1563 15.7958C71.1563 17.004 70.2704 17.9169 69.0985 17.9169C67.9792 17.9169 67.1024 16.9772 67.1114 15.778C67.1114 14.5877 68.0063 13.648 69.1248 13.648C70.2704 13.648 71.1563 14.5877 71.1563 15.7958Z" fill="url(#hidden-nav-logo-6)"/>
      <path d="M91.1407 2.09423C91.1407 3.2487 90.2189 4.17945 89.0823 4.1705C87.9817 4.16155 87.0599 3.22186 87.0772 2.13898C87.0952 0.939754 88.0171 -0.0088866 89.1446 6.28015e-05C90.2459 6.28015e-05 91.1407 0.948703 91.1317 2.09423H91.1407Z" fill="url(#hidden-nav-logo-7)"/>
      <defs>
        {Array.from({ length: 8 }, (_, index) => (
          <linearGradient key={index} id={`hidden-nav-logo-${index}`} x1="90.9407" y1="10.9313" x2="38.5373" y2="-38.3327" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8477FF" />
            <stop offset="1" stopColor="#5AA8FF" />
          </linearGradient>
        ))}
      </defs>
    </svg>
  )
}

export function AuditHistoryRail({ isCollapsed, onToggle, onNewChat, activeNativePage = 'home', onNativeNavigate, onNativeAgentSelect, variant = 'inline', hideFooter = false, hideFloatingHeader = false, nativeMode = false, hideDigitalEmployees = false, navHidden = false }: Props) {
  const { state, dispatch } = useApp()
  const [nativePanelCollapsed, setNativePanelCollapsed] = useState(false)
  const [isNativeSearchOpen, setIsNativeSearchOpen] = useState(false)
  const [nativeSearchKeyword, setNativeSearchKeyword] = useState('')
  const [openAgentId, setOpenAgentId] = useState<string | null>(NATIVE_ASSISTANT_EXPERIENCES[0]?.agentId ?? null)
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null)
  const [nativeManualOpenAgentId, setNativeManualOpenAgentId] = useState<string | null>(null)
  const [selectedNativeItemId, setSelectedNativeItemId] = useState<string>(() => {
    const firstAgentId = NATIVE_ASSISTANT_EXPERIENCES[0]?.agentId
    return firstAgentId ? `agent:${firstAgentId}` : ''
  })
  const scenario = getScenario(state.currentScenario)
  const homeExperience = getNativeAssistantExperience(state.homeAgentId)
  const fallbackConversationExperience = state.phase !== 'home' && !state.currentScenario
    ? getNativeAssistantExperience('control-price')
    : homeExperience
  const resolvedExperience = state.currentScenario
    ? getNativeAssistantByIdentity(scenario?.agentId, state.currentAgentName)
    : fallbackConversationExperience
  const selectedHomeAgentId = state.homeAgentId || homeExperience.agentId
  const currentConversationTitle = state.currentTaskTitle && state.currentTaskTitle !== '新任务'
    ? state.currentTaskTitle
    : '新建对话'
  const currentConversationItem: HistoryItem | null = state.currentScenario || state.phase !== 'home'
    ? {
        id: `current-${state.currentScenario || state.phase}`,
        label: currentConversationTitle,
      }
    : null
  const shouldUseCostRailFallback = Boolean(currentConversationItem) && (
    resolvedExperience.agentId === 'noma-ai' ||
    currentConversationTitle.includes('控制价') ||
    currentConversationTitle.includes('审核') ||
    currentConversationTitle === '新建对话'
  )
  const currentExperience = shouldUseCostRailFallback
    ? getNativeAssistantExperience('control-price')
    : resolvedExperience
  const railTitle = currentExperience.agentName || 'AI 助手'
  const nativeAgents: NativeAgent[] = NATIVE_ASSISTANT_EXPERIENCES
  const currentAgentId = currentExperience.agentId
  const baseHistoryItems: HistoryItem[] = currentExperience.dialogues.map(item => ({
    id: item.id,
    label: item.title,
  }))
  const scenarioHistoryItems: HistoryItem[] = currentConversationItem
    ? [
        currentConversationItem,
        ...baseHistoryItems.filter(item => item.label !== currentConversationItem.label),
      ]
    : baseHistoryItems
  const historyGroups: HistoryGroup[] = nativeMode
    ? []
    : [
        {
          label: '',
          items: scenarioHistoryItems,
        },
      ]
  const hasHistory = historyGroups.some(group => group.items.length > 0)
  const showNativeAssistantPanel = nativeMode && !nativePanelCollapsed
  const nativeRailWidth = showNativeAssistantPanel ? 244 : 0
  const railWidth = nativeMode ? nativeRailWidth : (variant === 'floating' ? 228 : 244)
  const outerPadding = nativeMode ? 8 : (variant === 'floating' ? 0 : 8)
  const showTopActions = !(variant === 'floating' && hideFloatingHeader)
  const showDigitalEmployees = nativeMode && !hideDigitalEmployees
  const railClassName = `audit-rail audit-rail--${variant}${nativeMode ? ' audit-rail--native' : ''}${showNativeAssistantPanel ? ' audit-rail--native-panel-open' : ' audit-rail--native-panel-closed'} shrink-0 h-full overflow-hidden`
  const getNativeAgentSelectionId = (agentId: string) => `agent:${agentId}`
  const getNativeDialogueSelectionId = (dialogueId: string) => `dialogue:${dialogueId}`
  const nativeSearchRef = useRef<HTMLInputElement | null>(null)
  const nativePanelRef = useRef<HTMLDivElement | null>(null)
  const normalizedNativeSearchKeyword = nativeSearchKeyword.trim().toLowerCase()

  useEffect(() => {
    if (!nativeMode) return
    if (currentConversationItem) {
      if (!nativeManualOpenAgentId) {
        setOpenAgentId(currentAgentId)
        setSelectedNativeItemId(getNativeDialogueSelectionId(currentConversationItem.id))
      }
      return
    }
    if (nativeManualOpenAgentId) {
      setExpandedAgentId(null)
      setSelectedNativeItemId(getNativeAgentSelectionId(nativeManualOpenAgentId))
      setOpenAgentId(nativeManualOpenAgentId)
      return
    }
    setExpandedAgentId(null)
    setSelectedNativeItemId(getNativeAgentSelectionId(selectedHomeAgentId))
    setOpenAgentId(selectedHomeAgentId === 'noma-ai' ? null : selectedHomeAgentId)
    setNativeManualOpenAgentId(null)
  }, [currentAgentId, currentConversationItem?.id, nativeManualOpenAgentId, nativeMode, selectedHomeAgentId, state.currentScenario])

  useEffect(() => {
    if (!isNativeSearchOpen) return
    window.requestAnimationFrame(() => nativeSearchRef.current?.focus())
  }, [isNativeSearchOpen])

  useEffect(() => {
    if (!isNativeSearchOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (nativePanelRef.current?.contains(target)) return
      setIsNativeSearchOpen(false)
      setNativeSearchKeyword('')
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [isNativeSearchOpen])

  if (nativeMode) {
    const nativePanelGroups: NativePanelGroup[] = [
      ...nativeAgents.filter(agent => agent.agentId !== 'noma-ai'),
      {
        agentId: 'other-dialogues',
        agentName: '其他对话',
        agentDescription: '临时事项、通用问答和未归类对话记录。',
        avatarKey: '',
        isOther: true,
      },
    ]
    const handleToggleNativeAgentDialogues = (agentId: string) => {
      setOpenAgentId(current => {
        const nextAgentId = current === agentId ? null : agentId
        setNativeManualOpenAgentId(nextAgentId)
        return nextAgentId
      })
      setExpandedAgentId(null)
      setIsNativeSearchOpen(false)
      setNativeSearchKeyword('')
    }
    const handleSelectNativeAgent = (agentId: string) => {
      if (agentId === 'other-dialogues') {
        handleToggleNativeAgentDialogues(agentId)
        return
      }
      setSelectedNativeItemId(getNativeAgentSelectionId(agentId))
      setOpenAgentId(agentId)
      setNativeManualOpenAgentId(agentId)
      setExpandedAgentId(null)
      setIsNativeSearchOpen(false)
      setNativeSearchKeyword('')
      onNativeNavigate?.('home')
      if (onNativeAgentSelect) {
        onNativeAgentSelect(agentId)
      } else {
        dispatch(state.currentScenario ? { type: 'RESET', homeAgentId: agentId } : { type: 'SET_HOME_AGENT', agentId })
      }
    }
    const handleStartNativeAgentDialogue = (agentId: string) => {
      if (agentId === 'other-dialogues') {
        setSelectedNativeItemId(getNativeAgentSelectionId('noma-ai'))
        setOpenAgentId(null)
        setNativeManualOpenAgentId(null)
        setExpandedAgentId(null)
        setIsNativeSearchOpen(false)
        setNativeSearchKeyword('')
        dispatch({ type: 'RESET', homeAgentId: 'noma-ai' })
        onNativeNavigate?.('home')
        onNewChat?.()
        return
      }
      setSelectedNativeItemId(getNativeAgentSelectionId(agentId))
      setOpenAgentId(agentId)
      setNativeManualOpenAgentId(null)
      setExpandedAgentId(null)
      onNewChat?.()
      if (onNativeAgentSelect) {
        onNativeAgentSelect(agentId)
      } else {
        dispatch(state.currentScenario ? { type: 'RESET', homeAgentId: agentId } : { type: 'SET_HOME_AGENT', agentId })
        onNativeNavigate?.('home')
      }
    }
    const getAgentDialogues = (agent: NativePanelGroup): HistoryItem[] => {
      const baseList = getMockDialogueTitles(agent).map((title, index) => ({
        id: `${agent.agentId}-mock-${index + 1}`,
        label: title,
      }))
      if (!currentConversationItem || agent.agentId !== currentAgentId || normalizedNativeSearchKeyword) return baseList
      return [
        currentConversationItem,
        ...baseList.filter(item => item.label !== currentConversationItem.label),
      ]
    }
    const getVisibleDialogues = (agent: NativePanelGroup): HistoryItem[] => {
      const fullList = getAgentDialogues(agent)
      if (normalizedNativeSearchKeyword) {
        return fullList.filter(item => getCompactDialogueTitle(item).toLowerCase().includes(normalizedNativeSearchKeyword) || item.label.toLowerCase().includes(normalizedNativeSearchKeyword))
      }
      return expandedAgentId === agent.agentId ? fullList : fullList.slice(0, 5)
    }
    const navigateHome = () => {
      setNativePanelCollapsed(false)
      setSelectedNativeItemId(getNativeAgentSelectionId('noma-ai'))
      setOpenAgentId(null)
      setExpandedAgentId(null)
      setNativeManualOpenAgentId(null)
      setIsNativeSearchOpen(false)
      setNativeSearchKeyword('')
      dispatch({ type: 'RESET', homeAgentId: 'noma-ai' })
      onNativeNavigate?.('home')
      onNewChat?.()
    }
    const isNewDialogueSelected = (
      activeNativePage === 'home' &&
      !state.currentScenario &&
      state.phase === 'home' &&
      selectedNativeItemId === getNativeAgentSelectionId('noma-ai')
    )
    const visibleNativePanelAgents = normalizedNativeSearchKeyword
      ? nativePanelGroups.filter(agent => {
        const agentName = getCompactAgentName(agent).toLowerCase()
        if (agentName.includes(normalizedNativeSearchKeyword) || agent.agentName.toLowerCase().includes(normalizedNativeSearchKeyword)) return true
        return getAgentDialogues(agent).some(item => getCompactDialogueTitle(item).toLowerCase().includes(normalizedNativeSearchKeyword) || item.label.toLowerCase().includes(normalizedNativeSearchKeyword))
      })
      : nativePanelGroups
    const showNativeBrandHeader = navHidden && !isNativeSearchOpen

    return (
      <aside
        className={railClassName}
        aria-hidden={isCollapsed}
        style={{
          width: isCollapsed ? 0 : railWidth,
          padding: isCollapsed ? 0 : undefined,
          opacity: isCollapsed ? 0 : 1,
          transform: isCollapsed ? 'translateX(-14px)' : 'translateX(0)',
          pointerEvents: isCollapsed ? 'none' : 'auto',
          transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), padding 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'width, opacity, transform',
        }}
      >
        <div className="audit-native-menu-shell" ref={nativePanelRef}>
          <div
            className={`audit-native-panel${showNativeAssistantPanel ? ' audit-native-panel--open' : ' audit-native-panel--closed'}`}
            aria-hidden={!showNativeAssistantPanel}
          >
            <div className="audit-native-panel__content">
              <div className={`audit-native-panel__header${showNativeBrandHeader ? ' audit-native-panel__header--brand' : ''}${navHidden ? ' audit-native-panel__header--nav-hidden' : ''}${isNativeSearchOpen ? ' audit-native-panel__header--search-open' : ''}`}>
                {showNativeBrandHeader ? (
                  <div className="audit-native-panel__hidden-brand" aria-label="Noma.ai">
                    <HiddenNavLogo />
                  </div>
                ) : (
                  <div className="audit-native-panel__search" aria-label="搜索对话记录">
                    <input
                      ref={nativeSearchRef}
                      value={nativeSearchKeyword}
                      onFocus={() => setIsNativeSearchOpen(true)}
                      onChange={event => setNativeSearchKeyword(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Escape') {
                          setIsNativeSearchOpen(false)
                          setNativeSearchKeyword('')
                        }
                      }}
                      placeholder="搜索对话记录"
                      aria-label="搜索对话记录"
                    />
                    <img className="audit-native-panel__search-icon" src="/aui-native/icons/search.svg" alt="" draggable={false} aria-hidden="true" />
                  </div>
                )}
                {showNativeBrandHeader ? (
                  <button
                    type="button"
                    className="audit-native-panel__icon-btn"
                    onClick={() => setIsNativeSearchOpen(true)}
                    aria-label="搜索对话记录"
                    title="搜索对话记录"
                  >
                    <img className="audit-native-panel__icon-img" src="/aui-native/icons/search.svg" alt="" draggable={false} aria-hidden="true" />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="audit-native-panel__icon-btn"
                  onClick={() => {
                    setNativePanelCollapsed(false)
                    onToggle()
                  }}
                  aria-label="收起侧栏"
                  title="收起侧栏"
                >
                  <img className="audit-native-panel__icon-img" src="/aui-native/icons/sidebar-collapse.svg" alt="" draggable={false} aria-hidden="true" />
                </button>
              </div>

              <div className="audit-native-panel__top-nav">
                <button
                  type="button"
                  className={`audit-native-nav-row${isNewDialogueSelected ? ' audit-native-nav-row--selected' : ''}`}
                  onClick={navigateHome}
                  aria-current={isNewDialogueSelected ? 'page' : undefined}
                >
                  <NativeNewDialogueIcon />
                  <span>开启新对话</span>
                </button>
                <button
                  type="button"
                  className={`audit-native-nav-row${activeNativePage === 'agents' ? ' audit-native-nav-row--selected' : ''}`}
                  onClick={() => onNativeNavigate?.('agents')}
                  aria-current={activeNativePage === 'agents' ? 'page' : undefined}
                >
                  <NativeAgentDiscoveryIcon />
                  <span>发现智能体</span>
                </button>
                <button
                  type="button"
                  className={`audit-native-nav-row${activeNativePage === 'tasks' ? ' audit-native-nav-row--selected' : ''}`}
                  onClick={() => onNativeNavigate?.('tasks')}
                  aria-current={activeNativePage === 'tasks' ? 'page' : undefined}
                >
                  <span className="audit-native-nav-row__icon" aria-hidden="true">
                    <ScheduleTaskGlyph className="audit-native-nav-row__icon-symbol audit-native-nav-row__schedule-icon" />
                  </span>
                  <span>定时任务</span>
                </button>
              </div>

              <div className="audit-native-panel__divider" aria-hidden="true" />

              <div className={`audit-native-panel__body audit-native-panel__body--with-section-title${navHidden ? ' audit-native-panel__body--nav-hidden' : ''}`}>
                <div className="audit-native-panel__section-title">对话记录</div>
                <div className="audit-native-agent-list">
                  {visibleNativePanelAgents.map(agent => {
                    const isSelected = agent.agentId !== 'noma-ai' && selectedNativeItemId === getNativeAgentSelectionId(agent.agentId)
                    const dialogueItems = getVisibleDialogues(agent)
                    const isAgentNameMatched = Boolean(normalizedNativeSearchKeyword) && (
                      getCompactAgentName(agent).toLowerCase().includes(normalizedNativeSearchKeyword) ||
                      agent.agentName.toLowerCase().includes(normalizedNativeSearchKeyword)
                    )
                    const isOpen = normalizedNativeSearchKeyword ? dialogueItems.length > 0 : openAgentId === agent.agentId
                    const showDialogues = normalizedNativeSearchKeyword ? dialogueItems.length > 0 && !isAgentNameMatched : isOpen
                    const isShowingAll = expandedAgentId === agent.agentId
                    const fullDialogueItems = getAgentDialogues(agent)
                    const hasMore = !normalizedNativeSearchKeyword && fullDialogueItems.length > dialogueItems.length
                    return (
                      <div className="audit-native-agent-group" key={agent.agentId}>
                        <div
                          className={`audit-native-agent-row${isSelected ? ' audit-native-agent-row--selected' : ''}${isOpen ? ' audit-native-agent-row--open' : ''}`}
                        >
                          <button
                            type="button"
                            className="audit-native-agent-row__main"
                            onClick={() => handleSelectNativeAgent(agent.agentId)}
                            aria-expanded={isOpen}
                            aria-pressed={isSelected}
                            aria-label={`切换到${getCompactAgentName(agent)}`}
                          >
                            {agent.isOther ? (
                              <NativeOtherDialogueIcon />
                            ) : (
                              <span className="audit-native-agent-row__avatar">
                                <img src={nativeAvatarSrc(agent.avatarKey)} alt={agent.agentName} draggable={false} />
                              </span>
                            )}
                            <span className="audit-native-agent-row__name">{getCompactAgentName(agent)}</span>
                          </button>
                          <span className="audit-native-agent-row__actions">
                            <button
                              type="button"
                              className="audit-native-agent-row__icon-action"
                              onClick={() => handleToggleNativeAgentDialogues(agent.agentId)}
                              aria-label={isOpen ? '折叠对话记录' : '展开对话记录'}
                              title={isOpen ? '折叠对话记录' : '展开对话记录'}
                            >
                              <img
                                className="audit-native-agent-row__chevron"
                                src="/aui-native/icons/chevron-down.svg"
                                style={isOpen ? { transform: 'rotate(180deg)' } : undefined}
                                alt=""
                                draggable={false}
                              />
                            </button>
                            <span className="audit-native-agent-row__tooltip-wrap">
                              <button
                                type="button"
                                className="audit-native-agent-row__icon-action"
                                onClick={() => handleStartNativeAgentDialogue(agent.agentId)}
                                aria-label="开启新对话"
                                aria-describedby={`new-dialogue-tooltip-${agent.agentId}`}
                              >
                                <NewChatIcon />
                              </button>
                              <span
                                id={`new-dialogue-tooltip-${agent.agentId}`}
                                className="audit-native-agent-row__tooltip"
                                role="tooltip"
                              >
                                开启新对话
                              </span>
                            </span>
                          </span>
                        </div>

                        <div
                          className={`audit-native-agent-group__dialogues${showDialogues ? ' audit-native-agent-group__dialogues--open' : ''}`}
                          aria-hidden={!showDialogues}
                        >
                            {dialogueItems.map((item) => {
                              const isActiveDialogue = selectedNativeItemId === getNativeDialogueSelectionId(item.id)
                              const className = `audit-native-dialogue-row audit-native-dialogue-row--static${isActiveDialogue ? ' audit-native-dialogue-row--active' : ''}`
                              return (
                                <div
                                  key={item.id}
                                  className={className}
                                  title={getCompactDialogueTitle(item)}
                                  aria-disabled="true"
                                >
                                  <span className="audit-native-dialogue-row__icon" aria-hidden="true">
                                    {isScheduleDialogue(item) ? (
                                      <ScheduleTaskRecordIcon className="audit-native-dialogue-row__icon-symbol audit-native-dialogue-row__schedule-icon" />
                                    ) : (
                                      <DialogueRecordIcon className="audit-native-dialogue-row__icon-symbol" />
                                    )}
                                  </span>
                                  <span>{getCompactDialogueTitle(item)}</span>
                                </div>
                              )
                            })}
                            {hasMore && !isShowingAll && (
                              <button
                                type="button"
                                className="audit-native-dialogue-row audit-native-dialogue-row--more"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setExpandedAgentId(agent.agentId)
                                }}
                              >
                                <span className="audit-native-dialogue-row__icon" aria-hidden="true">
                                  <img className="audit-native-dialogue-row__icon-symbol audit-native-dialogue-row__more-icon" src="/aui-native/icons/more.svg" alt="" draggable={false} />
                                </span>
                                <span>更多</span>
                              </button>
                            )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={railClassName}
      aria-hidden={isCollapsed}
      style={{
        width: isCollapsed ? 0 : railWidth,
        opacity: isCollapsed ? 0 : 1,
        transform: isCollapsed ? 'translateX(-12px)' : 'translateX(0)',
        pointerEvents: isCollapsed ? 'none' : 'auto',
        transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 210ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'width, opacity, transform',
      }}
    >
      {/* 内容固定宽度，由 aside 宽度裁切做动画（对齐参考项目） */}
      <div style={{ width: railWidth, height: '100%', padding: outerPadding, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <div className="audit-rail__inner">

          {showTopActions && (
            <>
              {/* 顶部：Logo + 收起按钮 */}
              <div className="audit-rail__header">
                <div className="audit-rail__header-left">
                  {nativeMode ? (
                    <div className="audit-rail__brand">
                      <img className="audit-rail__brand-logo" src="/aui-native/home-icons/logo-tianqing.png" alt="明源云·天擎" draggable={false} />
                    </div>
                  ) : (
                    <span className="audit-rail__title">{railTitle}</span>
                  )}
                </div>
                <button
                  onClick={onToggle}
                  className="audit-rail__collapse-btn"
                  title="收起侧栏"
                  aria-label="收起侧栏"
                >
                  <FoldIcon mirrored />
                </button>
              </div>

              {nativeMode ? (
                <nav className="audit-rail__native-nav" aria-label="主导航">
                  <button
                    type="button"
                    className={`audit-rail__native-nav-item${activeNativePage === 'home' ? ' audit-rail__native-nav-item--active' : ''}`}
                    onClick={() => {
                      onNativeNavigate?.('home')
                      onNewChat?.()
                    }}
                  >
                    <img src="/aui-native/home-icons/new-chat.svg" alt="" draggable={false} />
                    <span>新对话</span>
                  </button>
                  <button
                    type="button"
                    className={`audit-rail__native-nav-item${activeNativePage === 'agents' ? ' audit-rail__native-nav-item--active' : ''}`}
                    onClick={() => onNativeNavigate?.('agents')}
                  >
                    <AgentDiscoveryGlyph />
                    <span>智能体</span>
                  </button>
                  <button
                    type="button"
                    className={`audit-rail__native-nav-item${activeNativePage === 'tasks' ? ' audit-rail__native-nav-item--active' : ''}`}
                    onClick={() => onNativeNavigate?.('tasks')}
                  >
                    <ScheduleTaskGlyph />
                    <span>定时任务</span>
                  </button>
                </nav>
              ) : (
                <button
                  onClick={onNewChat}
                  className="audit-rail__new-btn"
                >
                  <NewChatIcon style={{ flexShrink: 0 }} />
                  <span>开启新对话</span>
                </button>
              )}

              {showDigitalEmployees && !nativeMode && (
                <section className="audit-rail__agents">
                  <div className="audit-rail__section-head">
                    <span>我的员工</span>
                    <span className="audit-rail__section-chevron" aria-hidden="true">›</span>
                  </div>
                  <div className="audit-rail__agent-list">
                    {nativeAgents.map(agent => (
                      <button
                        type="button"
                        className="audit-rail__agent-row"
                        key={agent.agentId}
                      >
                        <span className="audit-rail__agent-avatar">
                          <img src={nativeAvatarSrc(agent.avatarKey)} alt={agent.agentName} />
                        </span>
                        <span className="audit-rail__agent-copy">
                          <span className="audit-rail__agent-name">{agent.agentName}</span>
                          <span className="audit-rail__agent-desc">{agent.agentDescription}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* 历史记录列表 */}
          <div className={`audit-rail__history${hasHistory ? ' audit-rail__history--has-data' : ' audit-rail__history--empty'}`}>
            {!hasHistory ? (
              <div className="audit-rail__empty-state">暂无对话数据</div>
            ) : (
              historyGroups.map((group) => (
                <div key={group.label || group.items[0]?.id} className="audit-rail__group">
                {group.label && <div className="audit-rail__group-label">{group.label}</div>}
                <div className="audit-rail__group-items">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="audit-rail__item audit-rail__item--static"
                      title={item.label}
                      aria-disabled="true"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              ))
            )}
          </div>

          {variant !== 'floating' && !hideFooter && (
            <div className="audit-rail__footer">
              <div className="audit-rail__user">
                <div className="audit-rail__avatar">明</div>
                <span className="audit-rail__username">明小源</span>
              </div>
              {nativeMode && (
                <span className="audit-rail__settings" aria-hidden="true">
                  <img src="/aui-native/home-icons/settings.svg" alt="" draggable={false} />
                </span>
              )}
            </div>
          )}

        </div>
      </div>
    </aside>
  )
}
