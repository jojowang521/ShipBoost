import { CalendarDays, Clock3, MoreHorizontal, Pencil, Play, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAppDispatch } from '../shared/store/AppContext'
import { genMessageId } from '../shared/utils'
import { AgentMarketDetailModal, type AgentDetailArtifact, type AgentDetailPayload, type AgentDetailRecord, type AgentDetailSkill } from '../components/AgentMarketDetailModal'

type Tone = 'blue' | 'cyan' | 'orange' | 'violet' | 'green' | 'rose'

interface SkillItem {
  name: string
  category: string
  description: string
  usage: string
  developer: string
  version: string
  updatedAt: string
}

interface AgentMarketItem {
  name: string
  category: string
  description: string
}

interface ScheduledTaskItem {
  id: string
  name: string
  assistantName: string
  category: string
  description: string
  schedule: string
  lastRunAt: string
  enabled: boolean
}

const TONES: Tone[] = ['blue', 'cyan', 'orange', 'violet', 'green', 'rose']

const AGENT_CATEGORIES = ['全部', '销售域', '成本域', '资管域', '租赁域', '公共域']
const SKILL_CATEGORIES = ['全部', '通用', '基础数据', '成本', '售楼', '资管', '租赁']

const AGENTS: AgentMarketItem[] = [
  { name: '调价助手', category: '销售域', description: '通过对话式交互自动筛选房源、计算价格，生成一房一价的调价方案与合理性评估结果。' },
  { name: '库存分析助手', category: '销售域', description: '快速统计库存的产品结构、户型结构与库龄分布，辅助识别高压库存，支撑营销策略制定。' },
  { name: '销售日报助手', category: '销售域', description: '自动按模版汇总销售数据并完成简单特征分析，形成销售日报，减少人工统计与编写成本。' },
  { name: '回款分析助手', category: '销售域', description: '统计应收账龄、按揭银行、回款节点及实收情况，辅助识别回款风险与资金压力。' },
  { name: '项目成本分析助手', category: '成本域', description: '基于自然语言理解，覆盖项目、科目、业态、趋势 4 大分析视角与 30+ 标准指标。' },
  { name: '合同录入助手', category: '成本域', description: '上传合同附件与合同草拟件，智能审查准确性，无误后提取文本内容自动填充合同表单。' },
  { name: '合同审核助手', category: '成本域', description: '在流程审批过程中，结合业务资料、系统数据与内置规则检查点，辅助审批人进行业务审核。' },
  { name: '付款预审助手', category: '成本域', description: '对付款申请的概算、合同、账户、发票、工程量、现场进度等维度进行穿透式核验。' },
  { name: '资管查询助手', category: '资管域', description: '通过自然语言智能识别用户意图，提供多条件、跨业务查询数据服务与业务穿透。' },
  { name: '资产经营监管助手', category: '资管域', description: '将人工写材料升级为自动经营复盘，系统每天主动给出经营结论，内含业务 knowhow。' },
  { name: '合同录入助手（租赁）', category: '租赁域', description: '将人工填单升级为资料自动结构化，大幅提升租赁合同的录入吞吐量与准确率。' },
  { name: '租赁合同预审助手', category: '租赁域', description: '依据租赁商务政策与合同商务条款进行预审，提升商务审核效率，保障租赁合同收益。' },
  { name: '数据主题分析助手', category: '公共域', description: '针对成本、销售、资管租赁等主题宽表进行分析与洞察，支持自然语言自由问数。' },
  { name: '审批助手', category: '公共域', description: '作为流程审批人的副驾，基于审批规则对业务资料与系统数据进行检查对比。' },
  { name: '消息待办助手', category: '公共域', description: 'ERP 用户可随时通过对话查询自身待办与待阅任务，节省查找待办时间。' },
  { name: '文档辅助阅读助手', category: '公共域', description: '用户直接提问即可快速获取文档内容总结，无需逐页翻找关键信息，节省理解时间。' },
]

const SKILLS: SkillItem[] = [
  { name: '自然语言意图识别', category: '通用', description: '把用户的口语化提问解析为可执行的查询条件、参数、动作。', usage: '适用于用户以口语化方式发起查询、筛选、分析、填报等任务，需要系统自动识别条件、参数和动作的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '多轮对话编排', category: '通用', description: '维持上下文，支持追问、改写、纠错，确保任务一次说不清也能闭环。', usage: '适用于用户信息不完整、需要连续追问补齐条件，并在多轮交互后形成可执行任务闭环的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '文档 OCR 识别', category: '通用', description: '图片、扫描件、PDF 中提取文字与版面信息，含手写体与盖章页处理。', usage: '适用于合同扫描件、付款附件、票据图片等非结构化资料，需要先识别文字和版面信息的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '表格结构化抽取', category: '通用', description: '从图片或非结构化文档中识别表格，输出标准行列数据。', usage: '适用于清单、台账、报价单等资料未形成标准数据表，需要自动还原行列结构并进入后续分析的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '审批规则校验', category: '基础数据', description: '业务资料与系统数据按规则对比，输出风险清单。', usage: '适用于合同审核、付款预审、流程审批等需要按规则比对业务资料与系统数据并输出风险清单的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '待办消息检索', category: '基础数据', description: '按账号实时聚合待办、待阅，按优先级排序。', usage: '适用于用户需要快速查看个人待办、待阅、催办事项，并按时间、风险或优先级聚合处理的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '权限定位', category: '基础数据', description: '输入账号即输出权限清单与摘要，定位权限设置问题。', usage: '适用于账号无法访问菜单、数据范围异常、审批权限缺失等需要快速定位权限配置问题的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '文档辅助阅读', category: '基础数据', description: '文档加问题，快速生成内容总结并定位引用。', usage: '适用于制度、合同、报告等长文档阅读，需要围绕问题提炼结论并定位原文依据的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '科目指标分析', category: '成本', description: '覆盖 30+ 标准指标，按项目、科目、业态、趋势 4 视角问数与分析。', usage: '适用于成本科目对比、项目指标复盘、业态差异分析和趋势异常识别等成本分析场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '清单组价', category: '成本', description: '基于市场价库和历史成本，自动完成工程量清单组价。', usage: '适用于控制价编制、招标清单测算、历史项目对标，需要结合市场价库完成清单组价的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '控制价审核报告生成', category: '成本', description: '汇总科目对比、清单组价合理性、风险点，输出审核报告。', usage: '适用于控制价审核完成后，需要汇总指标偏差、组价合理性、风险点并形成可交付报告的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '付款规则预审', category: '成本', description: '从概算、合同、账户、发票、工程量、进度等维度批量校验。', usage: '适用于付款申请提交前，对合同、发票、账户、工程进度和概算占用进行批量校验的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '一房一价测算', category: '售楼', description: '自动筛选房源、计算调价方案并评估货值影响。', usage: '适用于批量调价、库存去化、房源价格策略测算，需要快速输出一房一价方案的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '成交结构分析', category: '售楼', description: '产品与户型成交结构、同环比、换退房异常识别。', usage: '适用于营销复盘、产品去化分析、换退房异常排查，需要从成交结构中发现问题的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '跨台账查询', category: '资管', description: '覆盖项目、资产、资源、合同、费用、收缴等业务台账的跨表查询。', usage: '适用于资产、资源、合同、费用、收缴等信息分散在多张台账，需要一次性跨表查询的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '经营复盘生成', category: '资管', description: '自动汇总经营数据并提炼结论，输出经营复盘材料。', usage: '适用于月度经营复盘、项目运营汇报、租收分析等需要汇总数据并生成复盘材料的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '租赁合同抽取', category: '租赁', description: '租赁合同要素抽取与自动结构化，提升录入吞吐量与准确率。', usage: '适用于租赁合同录入、合同台账补全、关键条款归档，需要自动抽取合同要素的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
  { name: '商务条款审核', category: '租赁', description: '对照租赁商务政策审核条款合理性，保障租赁合同收益。', usage: '适用于租赁合同审批、商务政策校验、收益风险排查，需要审核条款合理性的场景。', developer: '张三', version: '1.0.1', updatedAt: '2026/01/01 12:00:00' },
]

const SCHEDULED_TASKS: ScheduledTaskItem[] = [
  {
    id: 'daily-sales-report',
    name: '每日销售日报',
    assistantName: 'AI 助手',
    category: '售楼',
    description: '每日汇总项目销售金额、成交套数、来访转化和重点风险，生成销售日报。',
    schedule: '每天 09:00',
    lastRunAt: '2026/06/03 10:30',
    enabled: true,
  },
  {
    id: 'weekly-inventory-warning',
    name: '库存去化预警',
    assistantName: '库存分析助手',
    category: '售楼',
    description: '每周识别高库龄、低转化房源，生成库存结构分析和调价建议。',
    schedule: '每周一 09:00',
    lastRunAt: '2026/06/01 09:08',
    enabled: true,
  },
  {
    id: 'receivable-risk-digest',
    name: '回款风险汇总',
    assistantName: '回款分析助手',
    category: '售楼',
    description: '按项目汇总应收账龄、按揭放款和逾期节点，生成回款风险摘要。',
    schedule: '每天 18:00',
    lastRunAt: '2026/06/03 18:12',
    enabled: true,
  },
  {
    id: 'daily-cost-report',
    name: '动态成本日报推送',
    assistantName: '成本分析助手',
    category: '成本',
    description: '每日汇总动态成本变化，标记目标成本偏差、异常科目和需要跟进的项目。',
    schedule: '每天 09:30',
    lastRunAt: '2026/06/03 10:30',
    enabled: true,
  },
  {
    id: 'weekly-control-risk',
    name: '控制价审核风险复盘',
    assistantName: '成本分析助手',
    category: '成本',
    description: '每周复盘控制价审核中的高频风险，生成待复核清单和处理建议。',
    schedule: '每周一 10:00',
    lastRunAt: '2026/06/03 10:30',
    enabled: false,
  },
  {
    id: 'monthly-target-cost-review',
    name: '目标成本月度复盘',
    assistantName: '项目成本助手',
    category: '成本',
    description: '每月对比目标成本、动态成本和合同发生额，输出偏差项目与责任科目。',
    schedule: '每月 3 日 09:30',
    lastRunAt: '2026/06/03 09:36',
    enabled: true,
  },
  {
    id: 'payment-precheck-reminder',
    name: '付款申请预审提醒',
    assistantName: '付款预审助手',
    category: '成本',
    description: '每日扫描待提交付款申请，提示合同、发票、账户和进度资料缺失项。',
    schedule: '每天 16:30',
    lastRunAt: '2026/06/03 16:42',
    enabled: false,
  },
  {
    id: 'asset-operation-weekly',
    name: '资产经营周报',
    assistantName: '资产经营监管助手',
    category: '资管',
    description: '汇总租金收缴、空置率和重点资产运营表现，生成经营周报。',
    schedule: '每周五 17:00',
    lastRunAt: '2026/05/29 17:18',
    enabled: true,
  },
  {
    id: 'lease-renewal-alert',
    name: '租赁续约提醒',
    assistantName: '租赁合同预审助手',
    category: '租赁',
    description: '提前识别 60 天内到期租赁合同，推送续约、退租和商务条款关注事项。',
    schedule: '每天 08:30',
    lastRunAt: '2026/06/03 08:34',
    enabled: false,
  },
]

function toneClass(index: number) {
  return `native-market-tone-${TONES[index % TONES.length]}`
}

function filterByQuery<T extends { name: string; category: string; description: string }>(items: T[], query: string, category: string) {
  const keyword = query.trim().toLowerCase()
  return items.filter(item => {
    const categoryMatched = category === '全部' || item.category === category
    const searchMatched = !keyword || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(keyword)
    return categoryMatched && searchMatched
  })
}

function NativeMarketSearch({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="native-market-search" aria-label={label}>
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <span className="native-market-search__addon" aria-hidden="true">
        <Search size={16} strokeWidth={1.7} />
      </span>
    </label>
  )
}

function NativeMarketTabs({ categories, activeCategory, onChange, label }: { categories: string[]; activeCategory: string; onChange: (category: string) => void; label: string }) {
  return (
    <nav className="native-market-tabs" aria-label={label}>
      {categories.map(category => (
        <button
          key={category}
          type="button"
          className={`native-market-tab${category === activeCategory ? ' active' : ''}`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </nav>
  )
}

function SkillDetailModal({ skill, onClose }: { skill: SkillItem; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return createPortal(
    <div className="native-skill-modal-overlay" aria-hidden="false" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="native-skill-modal" role="dialog" aria-modal="true" aria-labelledby="nativeSkillModalTitle">
        <header className="native-skill-modal__header">
          <h2 className="native-skill-modal__title" id="nativeSkillModalTitle">技能详情</h2>
          <button className="native-skill-modal__close" type="button" aria-label="关闭技能详情" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="native-skill-modal__body">
          <div className="native-skill-modal__profile">
            <span className={`native-skill-modal__icon ${toneClass(SKILLS.findIndex(item => item.name === skill.name))}`}>
              {skill.name.slice(0, 1)}
            </span>
            <div className="native-skill-modal__name-row">
              <h3 className="native-skill-modal__name">{skill.name}</h3>
              <div className="native-skill-modal__meta-tags" aria-label="技能基础信息">
                <span className="native-skill-modal__meta-tag">{skill.category}</span>
                <span className="native-skill-modal__meta-tag">开发者 {skill.developer}</span>
                <span className="native-skill-modal__meta-tag">版本 {skill.version}</span>
                <span className="native-skill-modal__meta-tag">更新时间 {skill.updatedAt}</span>
              </div>
            </div>
          </div>
          <section className="native-skill-modal__section">
            <h4 className="native-skill-modal__section-title">说明</h4>
            <p className="native-skill-modal__description">{skill.description}</p>
          </section>
          <section className="native-skill-modal__section">
            <h4 className="native-skill-modal__section-title">使用场景</h4>
            <p className="native-skill-modal__usage">{skill.usage}</p>
          </section>
        </div>
        <footer className="native-skill-modal__footer">
          <button className="native-skill-modal__button" type="button" onClick={onClose}>取消</button>
          <button className="native-skill-modal__button native-skill-modal__button--primary" type="button" onClick={onClose}>添加</button>
        </footer>
      </section>
    </div>,
    document.body
  )
}

function TaskActionMenu({
  task,
  position,
  onClose,
}: {
  task: ScheduledTaskItem
  position: { top: number; left: number }
  onClose: () => void
}) {
  const actions = [
    { label: '执行一次', icon: Play },
    { label: '编辑', icon: Pencil },
    { label: '删除', icon: Trash2 },
  ] as const

  return createPortal(
    <div
      className="native-task-menu-layer"
      aria-hidden="false"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
    <div
      className="native-task-card__menu"
      role="menu"
      aria-label={`${task.name}操作`}
      style={{ top: position.top, left: position.left }}
      onMouseDown={event => event.stopPropagation()}
    >
      {actions.map(action => {
        const Icon = action.icon
        return (
          <button
            key={action.label}
            type="button"
            role="menuitem"
            className="native-task-card__menu-item"
            onClick={event => {
              event.stopPropagation()
              onClose()
            }}
          >
            <Icon size={16} strokeWidth={2} />
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>
    </div>,
    document.body,
  )
}

function createSalesDailyReportContent(): string {
  return [
    'AI 助手：已按定时任务生成 6 月 1 日、6 月 2 日、6 月 3 日三天的销售日报。',
    '',
    '**6 月 1 日销售日报**',
    '',
    '**概述**',
    '6 月 1 日整体销售表现平稳，认购金额 1,860 万元，成交 24 套，来访转化率保持在合理区间。',
    '',
    '**分点描述**',
    '- 成交结构：高层住宅贡献 68%，改善型户型成交占比提升。',
    '- 渠道表现：自然到访与老带新合计贡献 57%，线上投放线索转化偏低。',
    '- 项目节奏：上午来访集中，下午成交效率更高，案场接待排班基本匹配客流。',
    '',
    '**重点关注**',
    '线上渠道有效线索不足，建议复盘关键词投放和落地页转化路径。',
    '',
    '**6 月 2 日销售日报**',
    '',
    '**概述**',
    '6 月 2 日销售热度小幅上升，认购金额 2,120 万元，成交 27 套，主力户型去化速度加快。',
    '',
    '**分点描述**',
    '- 成交结构：三房户型成交 15 套，是当日主要贡献来源。',
    '- 价格表现：成交均价较前一日提升 1.8%，折扣使用保持稳定。',
    '- 客户跟进：重点意向客户到访 43 组，复访客户成交率明显高于新访客户。',
    '',
    '**重点关注**',
    '三房户型库存消耗较快，需要同步评估后续推盘节奏和价格策略。',
    '',
    '**6 月 3 日销售日报**',
    '',
    '**概述**',
    '6 月 3 日销售表现继续改善，认购金额 2,460 万元，成交 31 套，转化效率达到三日最高。',
    '',
    '**分点描述**',
    '- 成交结构：改善型客户占比 62%，大面积产品成交贡献提升。',
    '- 渠道表现：老带新成交 9 套，渠道质量优于外部投放线索。',
    '- 风险提示：部分客户对付款节点仍有疑虑，影响签约推进速度。',
    '',
    '**重点关注**',
    '建议销售与财务共同优化付款节点解释口径，减少签约前反复沟通成本。',
  ].join('\n')
}

function openDailySalesReportConversation(dispatch: ReturnType<typeof useAppDispatch>) {
  const now = Date.now()
  dispatch({ type: 'RESET', homeAgentId: 'noma-ai' })
  dispatch({ type: 'SET_CURRENT_TASK_TITLE', title: '每日销售日报' })
  dispatch({ type: 'SET_CURRENT_SCENARIO', scenario: null, agentName: 'AI 助手', avatarKey: 'noma_ai' })
  dispatch({
    type: 'ADD_MESSAGE',
    message: {
      id: genMessageId(),
      role: 'user',
      content: '生成 6 月 1 日至 6 月 3 日销售日报',
      timestamp: now,
    },
  })
  dispatch({
    type: 'ADD_MESSAGE',
    message: {
      id: genMessageId(),
      role: 'assistant',
      content: createSalesDailyReportContent(),
      timestamp: now + 1,
      agentName: 'AI 助手',
      agentAvatarKey: 'noma_ai',
    },
  })
  dispatch({ type: 'SET_PHASE', phase: 'daily_sales_report' })
}

function getAgentAvatarSrc(index: number) {
  return `/aui-native/avatars/custom/${(index % 12) + 1}.png`
}

function getAgentInstructions(agent: AgentMarketItem): string[] {
  if (agent.name === '调价助手') {
    return [
      '你可以在对话框中直接描述调价需求，比如说“帮我筛选深圳湾一期未售出的 3 房房源，对比上月均价生成调价方案”。',
      '调价助手将逐步引导确认筛选条件、调价幅度、合规校验，最终输出可导出的 Excel 调价清单。',
    ]
  }

  return [
    `你可以在对话框中直接描述${agent.category}相关任务，${agent.name}会按业务目标识别条件并拆解执行步骤。`,
    `${agent.name}将结合历史记录、业务规则和当前资料输出结果，并在需要时继续引导你补充信息。`,
  ]
}

function getAgentSkills(agent: AgentMarketItem): AgentDetailSkill[] {
  const preset: Record<string, AgentDetailSkill[]> = {
    调价助手: [
      ['一', 'native-market-tone-blue', '一房一价测算', '自动筛选房源、计算调价方案并评估货值影响。支持批量处理，输出标准化调价清单。'],
      ['成', 'native-market-tone-green', '成交结构分析', '产品与户型成交结构、环比、换退房异常识别。为调价策略提供数据支撑。'],
      ['自', 'native-market-tone-orange', '自然语言意图识别', '把用户的口语化提问解析为可执行的查询条件、参数、动作。支持多轮对话追问。'],
    ],
    项目成本分析助手: [
      ['科', 'native-market-tone-blue', '科目指标分析', '覆盖 30+ 标准指标，按项目、科目、业态、趋势 4 视角问数与分析。'],
      ['清', 'native-market-tone-green', '清单组价', '基于市场价库和历史成本，自动完成工程量清单组价。'],
      ['报', 'native-market-tone-orange', '控制价审核报告生成', '汇总科目对比、清单组价合理性、风险点，输出审核报告。'],
    ],
    合同录入助手: [
      ['识', 'native-market-tone-blue', '合同要素识别', '从合同附件和草拟件中提取合同名称、金额、乙方、付款节点等核心字段。'],
      ['核', 'native-market-tone-green', '附件一致性校验', '对比附件、草拟件和系统字段，识别金额、主体、日期不一致。'],
      ['填', 'native-market-tone-orange', '表单自动填充', '将已确认字段映射到合同录入表单，减少人工重复录入。'],
    ],
    合同审核助手: [
      ['审', 'native-market-tone-blue', '审批规则校验', '业务资料与系统数据按规则对比，输出风险清单。'],
      ['条', 'native-market-tone-green', '商务条款审核', '对照合同模板和商务政策审核条款合理性，标记异常条款。'],
      ['摘', 'native-market-tone-orange', '风险摘要生成', '按付款、结算、签证、履约等维度生成可复核的审核摘要。'],
    ],
    付款预审助手: [
      ['付', 'native-market-tone-blue', '付款规则预审', '从概算、合同、账户、发票、工程量、进度等维度批量校验。'],
      ['票', 'native-market-tone-green', '票据账户核验', '识别发票、收款账户、供应商主体与合同信息是否一致。'],
      ['进', 'native-market-tone-orange', '进度匹配检查', '核验付款金额、工程量和现场进度是否匹配。'],
    ],
  }

  return preset[agent.name] || [
    ['识', 'native-market-tone-blue', '自然语言意图识别', '把用户的口语化提问解析为可执行的查询条件、参数、动作。'],
    ['编', 'native-market-tone-green', '多轮对话编排', '维持上下文，支持追问、改写、纠错，确保任务闭环。'],
    ['输', 'native-market-tone-orange', '结果摘要生成', '把分析结果整理成可复核、可交付的业务结论。'],
  ]
}

function getAgentRecords(agent: AgentMarketItem): AgentDetailRecord[] {
  if (agent.name === '调价助手') {
    return [
      [
        '深圳湾一号中信宏城片区 — 2025 年 12 月批量调价',
        '筛选出 32 套未售 3 房房源，按楼层区间生成差异化调价方案，最终调价幅度在 -2% ~ +1.5% 区间。',
        [
          ['excel', '深圳湾一号_12月批量调价清单.xlsx', '生成于2025/12/03 · 2.4 MB'],
          ['pdf', '宏城片区_调价合理性说明.pdf', '生成于2025/12/03 · 1.8 MB'],
          ['excel', '未售三房_楼层价差测算表.xlsx', '生成于2025/12/03 · 1.2 MB'],
        ],
      ],
      [
        '西安·云璟府滞销房源专项调价分析',
        '针对去化周期超过 6 个月的 15 套高层房源进行专项分析，结合竞品均价给出阶梯让利方案，预测去化周期可缩短至 2.3 个月。',
        [
          ['pdf', '云璟府_滞销房源专项分析报告.pdf', '生成于2025/12/03 · 2.1 MB'],
          ['excel', '高层房源_阶梯让利测算表.xlsx', '生成于2025/12/03 · 986 KB'],
        ],
      ],
      [
        '武汉光谷项目竞品响应调价策略',
        '筛选出 32 套未售 3 房房源，按楼层区间生成差异化调价方案，最终调价幅度在 -2% ~ +1.5% 区间。',
        [
          ['excel', '光谷项目_竞品响应调价清单.xlsx', '生成于2025/12/03 · 2.6 MB'],
          ['pdf', '竞品价格带_响应策略简报.pdf', '生成于2025/12/03 · 1.7 MB'],
          ['excel', '备案价风险_房源校验表.xlsx', '生成于2025/12/03 · 1.1 MB'],
          ['pdf', '货值影响_营销复盘摘要.pdf', '生成于2025/12/03 · 1.5 MB'],
        ],
      ],
    ]
  }

  return [
    [
      `${agent.name}近期任务复盘`,
      `围绕${agent.category}任务生成关键结论和后续建议，并保留完整对话上下文。`,
      [
        ['excel', `${agent.name}_近期任务清单.xlsx`, '生成于2025/12/03 · 1.6 MB'],
        ['pdf', `${agent.name}_复盘摘要.pdf`, '生成于2025/12/03 · 1.1 MB'],
      ],
    ],
    [
      `${agent.name}专项分析`,
      '结合业务资料和规则检查点，整理风险、机会和待确认事项。',
      [
        ['pdf', `${agent.category}_专项分析报告.pdf`, '生成于2025/12/03 · 2.0 MB'],
        ['excel', `${agent.category}_风险明细表.xlsx`, '生成于2025/12/03 · 1.3 MB'],
        ['excel', `${agent.name}_机会点台账.xlsx`, '生成于2025/12/03 · 942 KB'],
      ],
    ],
    [
      `${agent.name}结果确认`,
      '根据用户补充条件更新分析结果，输出可复核摘要。',
      [
        ['excel', `${agent.name}_确认结果清单.xlsx`, '生成于2025/12/03 · 1.4 MB'],
      ],
    ],
  ]
}

function getAgentArtifacts(agent: AgentMarketItem): AgentDetailArtifact[] {
  if (agent.name === '调价助手') {
    return [
      ['excel', '深圳湾一号_2025年12月批量调价清单.xlsx', '生成于2025/12/03 · 2.4 MB'],
      ['pdf', '西安云璟府_滞销房源调价分析报告.pdf', '生成于2025/12/03 · 2.4 MB'],
      ['excel', '华南大区·11月度调价汇总台账.xlsx', '生成于2025/12/03 · 2.4 MB'],
      ['pdf', '武汉光谷_竞品响应调价策略.pdf', '生成于2025/12/03 · 1.9 MB'],
    ]
  }

  return [
    ['excel', `${agent.name}_任务处理清单.xlsx`, '生成于2025/12/03 · 2.4 MB'],
    ['pdf', `${agent.name}_专项分析报告.pdf`, '生成于2025/12/03 · 2.4 MB'],
    ['excel', `${agent.category}月度汇总台账.xlsx`, '生成于2025/12/03 · 2.4 MB'],
    ['pdf', `${agent.name}_复盘分析报告.pdf`, '生成于2025/12/03 · 2.4 MB'],
  ]
}

function getAgentQuestions(agent: AgentMarketItem): string[] {
  const preset: Record<string, string[]> = {
    调价助手: [
      '西安云璟府滞销超 6 个月的高层房源有哪些？给出让利调价建议',
      '对比上月均价，武汉光谷项目全盘调价货值会变化多少？',
      '帮我筛选深圳湾一号 2 栋未售的 3 房，楼层 15 层以上，按 +1.2% 生成调价清单',
      '帮我检查这批调价方案是否有超备案价的房源',
    ],
    项目成本分析助手: [
      '查看本月动态成本变化，重点说明超目标科目和项目原因',
      '对比目标成本差异，按项目和成本科目输出偏差说明',
      '查武汉项目硬景指标，并输出单方造价与含量对标结果',
      '复盘本月动态成本超目标科目',
    ],
    合同录入助手: [
      '帮我识别这份合同附件中的核心字段并生成录入摘要',
      '检查合同草拟件和附件金额是否一致',
      '提取付款节点、履约保证金和结算方式',
      '把合同要素整理成可复核的录入清单',
    ],
    合同审核助手: [
      '审核总包合同条款风险，标记付款、结算和签证相关异常',
      '帮我检查这份合同是否存在超范围付款约定',
      '对比审批规则，列出需要重点关注的合同条款',
      '生成本次合同审核的风险摘要',
    ],
    付款预审助手: [
      '检查这批付款申请是否存在账户或发票异常',
      '对比合同付款节点，识别提前付款风险',
      '核验付款金额、工程量和现场进度是否匹配',
      '输出付款预审风险清单',
    ],
  }

  return preset[agent.name] || [
    `请帮我处理一个${agent.category}任务，并给出关键结论`,
    `结合当前业务数据，生成${agent.name}的处理建议`,
    '列出这个任务里需要人工确认的风险点',
    '把本次分析整理成可复用的结果摘要',
  ]
}

function createAgentDetailPayload(agent: AgentMarketItem, index: number): AgentDetailPayload {
  return {
    index,
    name: agent.name,
    domain: agent.category,
    description: agent.description,
    avatarSrc: getAgentAvatarSrc(index),
    instructions: getAgentInstructions(agent),
    questions: getAgentQuestions(agent),
    skills: getAgentSkills(agent),
    records: getAgentRecords(agent),
    artifacts: getAgentArtifacts(agent),
  }
}

export function AgentsMarketPage({
  embeddedInSideNav = false,
  railCollapsed = false,
}: {
  embeddedInSideNav?: boolean
  railCollapsed?: boolean
} = {}) {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<{ agent: AgentMarketItem; index: number } | null>(null)
  const visibleAgents = useMemo(() => filterByQuery(AGENTS, query, activeCategory), [activeCategory, query])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, agent: AgentMarketItem, index: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setSelectedAgent({ agent, index })
  }

  return (
    <main className={`native-market-page native-market-page--agents${railCollapsed ? ' native-market-page--agents-rail-collapsed' : ''}`}>
      <header className="native-market-head">
        <h1>智能体</h1>
        <NativeMarketSearch label="搜索智能体" placeholder="输入智能体名称搜索" value={query} onChange={setQuery} />
      </header>
      <div className="native-market-controls">
        <NativeMarketTabs categories={AGENT_CATEGORIES} activeCategory={activeCategory} onChange={setActiveCategory} label="智能体分类" />
      </div>
      <div className="native-market-scroll">
        <section className="native-market-grid native-market-grid--agents" aria-label="智能体列表">
          {visibleAgents.map(agent => {
            const sourceIndex = AGENTS.findIndex(item => item.name === agent.name)
            return (
              <article
                key={agent.name}
                className="native-agent-card"
                role="button"
                tabIndex={0}
                aria-label={`查看${agent.name}详情`}
                onClick={() => setSelectedAgent({ agent, index: sourceIndex })}
                onKeyDown={event => handleKeyDown(event, agent, sourceIndex)}
              >
                <div className="native-agent-card__top">
                  <div className="native-agent-card__id">
                    <span className="native-agent-card__avatar">
                      <img src={getAgentAvatarSrc(sourceIndex)} alt="" />
                    </span>
                    <h2>{agent.name}</h2>
                  </div>
                  <span className="native-agent-card__action" aria-hidden="true">对话</span>
                </div>
                <p>{agent.description}</p>
              </article>
            )
          })}
        </section>
      </div>
      {selectedAgent && (
        <AgentMarketDetailModal
          agent={createAgentDetailPayload(selectedAgent.agent, selectedAgent.index)}
          embeddedInSideNav={embeddedInSideNav}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </main>
  )
}


export function SkillsMarketPage() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)
  const visibleSkills = useMemo(() => filterByQuery(SKILLS, query, activeCategory), [activeCategory, query])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, skill: SkillItem) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setSelectedSkill(skill)
  }

  return (
    <main className="native-market-page">
      <header className="native-market-head">
        <h1>技能</h1>
      </header>
      <div className="native-market-controls">
        <NativeMarketTabs
          categories={SKILL_CATEGORIES}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
          label="技能分类"
        />
        <NativeMarketSearch label="搜索技能" placeholder="搜索技能" value={query} onChange={setQuery} />
      </div>
      <div className="native-market-scroll">
        <section className="native-market-grid native-market-grid--skills" aria-label="技能列表">
          {visibleSkills.map((skill, index) => (
            <article
              key={skill.name}
              className={`native-skill-card${index === 0 ? ' native-skill-card--featured' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`查看${skill.name}技能详情`}
              onClick={() => setSelectedSkill(skill)}
              onKeyDown={event => handleKeyDown(event, skill)}
            >
              <div className="native-skill-card__top">
                <div className="native-skill-card__id">
                  <span className={`native-skill-card__icon ${toneClass(index)}`}>{skill.name.slice(0, 1)}</span>
                  <h2>{skill.name}</h2>
                </div>
                <button className="native-skill-card__action" type="button" aria-label={`安装${skill.name}`}>
                  安装
                </button>
              </div>
              <p>{skill.description}</p>
            </article>
          ))}
        </section>
      </div>
      {selectedSkill && <SkillDetailModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />}
    </main>
  )
}

export function TasksMarketPage({ railCollapsed = false }: { railCollapsed?: boolean } = {}) {
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState('')
  const [activeTaskMenu, setActiveTaskMenu] = useState<{ id: string; top: number; left: number } | null>(null)
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SCHEDULED_TASKS.map(task => [task.id, task.enabled])),
  )
  const visibleTasks = useMemo(() => filterByQuery(SCHEDULED_TASKS, query, '全部'), [query])

  useEffect(() => {
    if (!activeTaskMenu) return

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setActiveTaskMenu(null)
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.native-task-card__menu') || target.closest('.native-task-card__more')) return
      setActiveTaskMenu(null)
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [activeTaskMenu])

  return (
    <main className={`native-market-page native-market-page--tasks${railCollapsed ? ' native-market-page--tasks-rail-collapsed' : ''}`}>
      <header className="native-market-head">
        <h1>任务</h1>
        <NativeMarketSearch label="搜索任务" placeholder="输入任务名称搜索" value={query} onChange={setQuery} />
      </header>
      <div className="native-market-scroll">
        <section className="native-market-grid native-market-grid--tasks" aria-label="任务列表">
          {visibleTasks.map(task => {
            const enabled = enabledMap[task.id]
            const isTaskMenuOpen = activeTaskMenu?.id === task.id
            return (
              <article
                className="native-task-card"
                key={task.id}
                role={task.id === 'daily-sales-report' ? 'button' : undefined}
                tabIndex={task.id === 'daily-sales-report' ? 0 : undefined}
                onClick={() => {
                  if (task.id === 'daily-sales-report') openDailySalesReportConversation(dispatch)
                }}
                onKeyDown={event => {
                  if (task.id !== 'daily-sales-report') return
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  openDailySalesReportConversation(dispatch)
                }}
              >
                <div className="native-task-card__top">
                  <div className="native-task-card__identity">
                    <div className="native-task-card__name-row">
                      <h2>{task.name}</h2>
                    </div>
                  </div>
                  <div className="native-task-card__actions">
                    <button
                      type="button"
                      className={`native-task-switch${enabled ? ' is-on' : ''}`}
                      aria-label={`${enabled ? '关闭' : '开启'}${task.name}`}
                      aria-pressed={enabled}
                      onClick={event => {
                        event.stopPropagation()
                        setEnabledMap(current => ({ ...current, [task.id]: !current[task.id] }))
                      }}
                    >
                      <span />
                    </button>
                    <button
                      className="native-task-card__more"
                      type="button"
                      aria-label={`${task.name}更多操作`}
                      aria-haspopup="menu"
                      aria-expanded={isTaskMenuOpen}
                      onClick={event => {
                        event.stopPropagation()
                        if (isTaskMenuOpen) {
                          setActiveTaskMenu(null)
                          return
                        }

                        const rect = event.currentTarget.getBoundingClientRect()
                        const menuWidth = 152
                        const gap = 8
                        setActiveTaskMenu({
                          id: task.id,
                          top: Math.round(rect.bottom + gap),
                          left: Math.round(Math.max(80, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12))),
                        })
                      }}
                    >
                      <MoreHorizontal size={18} strokeWidth={2} />
                    </button>
                    {isTaskMenuOpen && (
                      <TaskActionMenu task={task} position={activeTaskMenu} onClose={() => setActiveTaskMenu(null)} />
                    )}
                  </div>
                </div>
                <p className="native-task-card__description">{task.description}</p>
                <div className="native-task-card__divider" />
                <div className="native-task-card__meta">
                  <span className="native-task-card__meta-item">
                    <CalendarDays size={16} strokeWidth={1.7} />
                    <span>{task.schedule}</span>
                  </span>
                  <span className="native-task-card__meta-item">
                    <Clock3 size={16} strokeWidth={1.7} />
                    <span>上次：{task.lastRunAt}</span>
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
