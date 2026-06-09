import { useMemo, useState } from 'react'
import {
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  PackageCheck,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

type Assistant = {
  name: string
  category: string
  helper: string
  problem: string
  value: string
  demoPrompt: string
  demoOutput: string[]
  icon: LucideIcon
  embedUrl?: string
  comingSoon?: boolean
}

type Category = {
  id: string
  name: string
  helper: string
  icon: LucideIcon
  assistants: Assistant[]
}

const categories: Category[] = [
  {
    id: 'analytics',
    name: '数据分析平台',
    helper: '面向成本、销售、资管等主题，支持自然语言查数、归因和洞察生成。',
    icon: BarChart3,
    assistants: [
      {
        name: '数据分析助手',
        category: '平台技能',
        helper: '用自然语言完成主题指标查询、趋势归因和经营洞察。',
        problem: '指标查询门槛高，多指标场景配置繁琐，数据洞察依赖人工判断。',
        value: '通过自然语言在指标库范围内自由问数，自动拆解口径、维度和筛选条件，并生成分析洞察。',
        demoPrompt: '查询武汉区域近 3 个月销售回款趋势，并解释异常波动原因',
        demoOutput: ['识别业务主题：销售回款', '生成指标组合：回款金额、回款率、逾期笔数', '输出趋势摘要和异常项目清单'],
        icon: LayoutDashboard,
        embedUrl: '/embedded/cost-analysis/index.html?shell=sidebar',
      },
    ],
  },
  {
    id: 'workflow',
    name: '流程平台',
    helper: '覆盖审批校验、流程调试和流程维护，降低人工排查与漏审风险。',
    icon: Workflow,
    assistants: [
      {
        name: '审批助手',
        category: '平台技能',
        helper: '自动核对规则、资料和系统数据，辅助审批人提前识别风险。',
        problem: '审批规则复杂，人工审核耗时长，容易遗漏关键风险项。',
        value: '自动比对业务资料、系统数据和审批规则，辅助审批人完成事前拦截。',
        demoPrompt: '检查这个控制价审批单是否存在规则风险',
        demoOutput: ['命中 4 条审批规则', '发现 1 项金额偏差和 2 项附件缺失', '生成审批建议：退回补充资料'],
        icon: ClipboardCheck,
        embedUrl: '/embedded/approval/index.html',
      },
      {
        name: '流程助手（流程调试）',
        category: '公共助手',
        helper: '自动梳理流程路径并生成全分支调试用例。',
        problem: '复杂流程调试路径长，人工整理用例工作量大，遗漏场景概率高。',
        value: '一键生成流程全路径用例数据，提升流程调试效率和质量。',
        demoPrompt: '为合同审批流程生成覆盖所有分支的调试用例',
        demoOutput: ['解析 6 个流程节点', '生成 12 条分支路径', '输出用例表、触发条件和预期结果'],
        icon: GitBranch,
        embedUrl: '/embedded/process-debug/index.html?shell=sidebar&v=20260603-flow-assistant-title',
      },
      {
        name: '流程助手（流程维护）',
        category: '公共助手',
        helper: '聚合流程监控、变更分析和运行治理能力，辅助管理员处理流程维护问题。',
        problem: '流程配置和运行数据分散，管理员需要跨页面排查流程状态、异常和变更影响。',
        value: '通过嵌入式流程维护 demo 直接展示完整交互，支持实时预览最新流程维护能力。',
        demoPrompt: '查看当前流程运行异常，并给出处理建议',
        demoOutput: ['汇总异常流程实例', '定位高频卡点节点', '生成流程治理建议'],
        icon: Workflow,
        embedUrl: '/embedded/process-manager/index.html?shell=sidebar&v=20260603-flow-manager-ai-maintenance',
      },
    ],
  },
  {
    id: 'message',
    name: '消息中心',
    helper: '让待办、提醒和系统消息可被快速检索、归纳和行动。',
    icon: MessageSquareText,
    assistants: [
      {
        name: '消息待办技能',
        category: '平台技能',
        helper: '聚合待办和消息提醒，按优先级给出今日处理建议。',
        problem: '待办分散在多个入口，用户查找当前任务耗时。',
        value: '随时查询并汇总当前待办任务，支持按紧急程度、来源系统和截止时间排序。',
        demoPrompt: '今天有哪些必须处理的审批和待办？',
        demoOutput: ['汇总 8 条待办', '标记 3 条高优先级任务', '生成今日处理顺序建议'],
        icon: ListChecks,
        embedUrl: '/embedded/message-todo/todo-clean.html?shell=sidebar&v=20260609-todo-no-head',
      },
    ],
  },
  {
    id: 'docs',
    name: '文档服务',
    helper: '面向长文档阅读、摘要提炼、套打模板生成与检索问答。',
    icon: FileSearch,
    assistants: [
      {
        name: '文档问答助手',
        category: '平台技能',
        helper: '快速总结长文档、定位关键内容，并支持按问题追问原文。',
        problem: '文档内容冗长，关键内容定位困难，阅读效率低。',
        value: '通过提问方式快速获取文档摘要、关键条款和业务结论，节省查找与理解时间。',
        demoPrompt: '总结这份招采管理制度里和审批权限有关的内容',
        demoOutput: ['提取 5 条审批权限规则', '标注原文出处', '生成适用场景和注意事项'],
        icon: FileSearch,
        embedUrl: '/embedded/document-reader/index.html?v=20260609-doc-reader-b6ms',
      },
      {
        name: '套打助手',
        category: '公共助手',
        helper: '上传标准样板后识别字段并生成套打模板配置。',
        problem: '套打模板配置复杂，制作和反馈周期长。',
        value: '上传标准样板后自动生成套打模板，大幅提升模板制作效率。',
        demoPrompt: '根据这份合同样张生成套打模板',
        demoOutput: ['识别 23 个占位字段', '生成模板结构和字段映射', '提示 2 个需人工确认字段'],
        icon: FileCheck2,
        embedUrl: '/embedded/print-template/index.html?v=20260603-print-home-title-fix',
      },
    ],
  },
  {
    id: 'foundation',
    name: '基础数据',
    helper: '辅助顾问和管理员处理权限、组织架构与基础资料治理。',
    icon: Database,
    assistants: [
      {
        name: '权限检查助手',
        category: '公共助手',
        helper: '面向权限配置、授权调整和异常排查，辅助管理员完成权限检查。',
        problem: '权限配置项多、角色关系复杂，管理员调整权限时容易遗漏影响范围。',
        value: '嵌入权限检查 demo，支持直接预览权限检查助手的完整交互与最新能力。',
        demoPrompt: '帮我检查并调整武汉项目合同台账权限',
        demoOutput: ['定位用户与角色关系', '识别权限缺口和冲突项', '生成授权调整建议'],
        icon: ShieldCheck,
        embedUrl: '/embedded/permission-check/index.html?shell=sidebar',
      },
      {
        name: '组织架构调整助手',
        category: '公共助手',
        helper: '评估组织变更影响范围，并生成迁移计划与校验清单。',
        problem: '组织调整涉及多个系统与业务模块，影响范围难评估。',
        value: '基于自然语言完成组织变更影响分析、数据联动检查和迁移方案生成。',
        demoPrompt: '评估华中区域拆分为武汉和长沙两个公司的影响',
        demoOutput: ['识别受影响系统 5 个', '列出权限、流程、主数据影响项', '生成组织迁移执行计划'],
        icon: Building2,
        comingSoon: true,
      },
    ],
  },
  {
    id: 'package',
    name: '套打服务',
    helper: '聚焦套打配置、模板制作和文档自动生成效率提升。',
    icon: PackageCheck,
    assistants: [
      {
        name: '套打配置检查助手',
        category: '公共助手',
        helper: '自动检查套打字段、数据源和输出样式配置完整性。',
        problem: '套打字段多、映射关系复杂，配置校验依赖人工比对。',
        value: '自动检查模板字段、数据源、权限和输出样式，减少上线返工。',
        demoPrompt: '检查这份付款申请套打模板的字段配置是否完整',
        demoOutput: ['扫描 31 个模板字段', '发现 3 个未绑定字段', '输出修复建议和验证清单'],
        icon: ShieldCheck,
      },
    ],
  },
]

const assistantDirectory = [
  '消息待办技能',
  '文档问答助手',
  '权限检查助手',
  '套打助手',
  '流程助手（流程调试）',
  '流程助手（流程维护）',
]

const allAssistants = categories.flatMap(category =>
  category.assistants.map(assistant => ({
    ...assistant,
    serviceName: category.name,
    serviceHelper: category.helper,
  }))
)

const directoryAssistants = assistantDirectory
  .map(name => allAssistants.find(assistant => assistant.name === name))
  .filter((assistant): assistant is Assistant & { serviceName: string; serviceHelper: string } => Boolean(assistant))

function withFreshParam(rawUrl: string): string {
  const url = new URL(rawUrl, window.location.origin)
  if (['127.0.0.1', 'localhost'].includes(url.hostname) && !['127.0.0.1', 'localhost'].includes(window.location.hostname)) {
    url.hostname = window.location.hostname
  }
  url.searchParams.set('_fresh', Date.now().toString())
  return rawUrl.startsWith('http') ? url.toString() : `${url.pathname}${url.search}${url.hash}`
}

function App() {
  const [activeAssistantName, setActiveAssistantName] = useState(() => {
    const assistantFromUrl = new URLSearchParams(window.location.search).get('assistant')
    return allAssistants.some(assistant => assistant.name === assistantFromUrl)
      ? assistantFromUrl as string
      : directoryAssistants[0].name
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const activeAssistant = useMemo(
    () => allAssistants.find(item => item.name === activeAssistantName) || directoryAssistants[0],
    [activeAssistantName]
  )

  const handleAssistantChange = (assistantName: string) => {
    setActiveAssistantName(assistantName)
    const url = new URL(window.location.href)
    url.searchParams.set('assistant', assistantName)
    window.history.replaceState(null, '', url)
  }

  const handleFullscreenPreview = () => {
    if (activeAssistant.embedUrl) {
      window.open(withFreshParam(activeAssistant.embedUrl), '_blank', 'noopener,noreferrer')
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.set('assistant', activeAssistant.name)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  return (
    <main className={`assistant-hub${isSidebarCollapsed ? ' assistant-hub--collapsed' : ''}`}>
      <aside className="assistant-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Bot size={22} strokeWidth={1.8} />
          </div>
          <div className="brand-copy">
            <h1>交付提效助手</h1>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(value => !value)}
            title={isSidebarCollapsed ? '展开导航' : '收起导航'}
            type="button"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.8} />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.8} />
            )}
          </button>
        </div>

        <nav className="category-nav" aria-label="助手目录">
          {directoryAssistants.map((assistant) => {
            const Icon = assistant.icon
            const isActive = assistant.name === activeAssistant.name
            return (
              <button
                className={`category-nav__item${isActive ? ' category-nav__item--active' : ''}`}
                key={assistant.name}
                onClick={() => handleAssistantChange(assistant.name)}
                title={assistant.name}
                type="button"
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{assistant.name}</span>
                <span className="nav-tip">{assistant.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-summary">
          <Sparkles size={18} strokeWidth={1.8} />
          <span>{directoryAssistants.length} 个助手 demo 已归档</span>
        </div>
      </aside>

      <section className="assistant-main">
        <header className="assistant-topbar">
          <div className="topbar-copy">
            <div className="topbar-title-line">
              <h2>{activeAssistant.name}</h2>
              <span className="service-tag">{activeAssistant.serviceName}</span>
              <p>{activeAssistant.helper}</p>
            </div>
          </div>
          <div className="topbar-actions" aria-label="页面操作">
            <button className="primary-action" onClick={handleFullscreenPreview} type="button">
              <PlayCircle size={18} strokeWidth={1.8} />
              全屏预览
            </button>
          </div>
        </header>

        <div className={`content-layout${activeAssistant.embedUrl ? ' content-layout--embedded' : ''}`}>
          <section className={`demo-panel${activeAssistant.embedUrl ? ' demo-panel--embedded' : ''}`} aria-label="助手 demo">
            {activeAssistant.comingSoon ? (
              <div className="coming-soon">敬请期待</div>
            ) : activeAssistant.embedUrl ? (
              <div className="embedded-demo">
                <iframe
                  src={withFreshParam(activeAssistant.embedUrl)}
                  title={`${activeAssistant.name}嵌入演示`}
                />
              </div>
            ) : (
              <div className="demo-grid">
                <article className="demo-section demo-section--wide">
                  <div className="demo-section__heading">
                    <MessageSquareText size={18} strokeWidth={1.8} />
                    <span>助手问答 demo</span>
                  </div>
                  <div className="chat-preview">
                    <div className="chat-preview__bubble chat-preview__bubble--user">
                      {activeAssistant.demoPrompt}
                    </div>
                    <div className="chat-preview__bubble chat-preview__bubble--ai">
                      <strong>已理解你的问题，正在生成处理结果。</strong>
                      <ul>
                        {activeAssistant.demoOutput.map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="chat-composer">
                      <span>继续追问或补充业务条件</span>
                      <button type="button" title="发送">
                        <Send size={16} strokeWidth={1.9} />
                      </button>
                    </div>
                  </div>
                </article>

                <article className="demo-section">
                  <div className="demo-section__heading">
                    <CheckCircle2 size={18} strokeWidth={1.8} />
                    <span>解决问题</span>
                  </div>
                  <p>{activeAssistant.problem}</p>
                </article>

                <article className="demo-section">
                  <div className="demo-section__heading">
                    <Sparkles size={18} strokeWidth={1.8} />
                    <span>价值描述</span>
                  </div>
                  <p>{activeAssistant.value}</p>
                </article>

                <article className="demo-section demo-section--wide">
                  <div className="demo-section__heading">
                    <Workflow size={18} strokeWidth={1.8} />
                    <span>演示流程</span>
                  </div>
                  <div className="flow-steps">
                    {['输入业务问题', '自动定位数据与规则', '生成结论与行动建议'].map((step, index) => (
                      <div className="flow-step" key={step}>
                        <span>{index + 1}</span>
                        <strong>{step}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
