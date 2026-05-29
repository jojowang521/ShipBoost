import { Search, MoreHorizontal, FileText, Building2, AlertTriangle, CheckCircle2, Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import { AiEntryButton } from './AiEntryButton'

export type HostPresetType = 'list' | 'workbench' | 'detail' | 'split'

interface HostRecord {
  id: string
  project: string
  document: string
  amount: string
  status: string
  owner: string
  updatedAt: string
  risk: '高' | '中' | '低'
}

const records: HostRecord[] = [
  {
    id: 'ZB-2026-0412',
    project: '问数验证项目一期',
    document: '招标控制价文件',
    amount: '551,867,033.03',
    status: '待 AI 复核',
    owner: '成本管理部',
    updatedAt: '2026-04-24',
    risk: '高',
  },
  {
    id: 'ZB-2026-0408',
    project: '深圳湾东区展示中心',
    document: '安装工程清单',
    amount: '80,829,880.17',
    status: '待补充依据',
    owner: '招采合约部',
    updatedAt: '2026-04-22',
    risk: '中',
  },
  {
    id: 'ZB-2026-0396',
    project: '观澜云庭二期',
    document: '精装修工程标底',
    amount: '50,168,546.23',
    status: '已通过',
    owner: '成本管理部',
    updatedAt: '2026-04-18',
    risk: '低',
  },
  {
    id: 'ZB-2026-0389',
    project: '南山科创园配套',
    document: '门窗栏杆工程',
    amount: '27,538,440.35',
    status: '待复核',
    owner: '项目成本组',
    updatedAt: '2026-04-15',
    risk: '中',
  },
]

export function HostPagePreset({ type = 'list', onOpenAi, hasAiActivity = false }: { type?: HostPresetType; onOpenAi?: () => void; hasAiActivity?: boolean }) {
  const page = (() => {
    if (type === 'workbench') return <WorkbenchPreset />
    if (type === 'detail') return <DetailPreset />
    if (type === 'split') return <SplitPreset />
    return <ListPreset />
  })()

  return (
    <div className="host-app-shell">
      <HostSidebar />
      <div className="host-app-main">
        <HostTopbar onOpenAi={onOpenAi} hasAiActivity={hasAiActivity} />
        {page}
      </div>
    </div>
  )
}

function HostTopbar({ onOpenAi, hasAiActivity }: { onOpenAi?: () => void; hasAiActivity: boolean }) {
  return (
    <header className="host-topbar">
      <div className="host-topbar__title">成本分析</div>
      <div className="host-topbar__actions">
        <button className="host-topbar__link" type="button">帮助中心</button>
        <button className="host-topbar__avatar" type="button">管</button>
        {onOpenAi && <AiEntryButton onOpen={onOpenAi} hasActivity={hasAiActivity} />}
      </div>
    </header>
  )
}

function HostSidebar() {
  return (
    <aside className="host-sidebar" aria-label="产品导航">
      <div className="host-sidebar__brand">
        <div className="host-sidebar__brand-main">
          <img className="host-sidebar__logo" src="/mingyuanyun-logo.svg" alt="明源云" />
        </div>
        <button className="host-sidebar__collapse" type="button" aria-label="收起导航">
          <Menu size={16} />
        </button>
      </div>

      <nav className="host-sidebar__nav">
        <div className="host-sidebar__nav-title">成本管理</div>
        <button className="host-sidebar__item">
          <Building2 size={16} />
          <span>经营驾驶舱</span>
        </button>
        <button className="host-sidebar__item">
          <FileText size={16} />
          <span>项目台账</span>
        </button>

        <button className="host-sidebar__item host-sidebar__item--parent">
          <FileText size={16} />
          <span>成本管理</span>
        </button>
        <div className="host-sidebar__subnav host-sidebar__subnav--open">
          <button className="host-sidebar__subitem host-sidebar__subitem--active">招标控制价</button>
          <button className="host-sidebar__subitem">动态成本</button>
          <button className="host-sidebar__subitem">合同台账</button>
          <button className="host-sidebar__subitem">付款申请</button>
        </div>

        <button className="host-sidebar__item">
          <CheckCircle2 size={16} />
          <span>审批中心</span>
        </button>
        <button className="host-sidebar__item">
          <AlertTriangle size={16} />
          <span>风险指标</span>
        </button>
        <button className="host-sidebar__item">
          <MoreHorizontal size={16} />
          <span>系统设置</span>
        </button>
      </nav>

      <div className="host-sidebar__footer">
        <div className="host-sidebar__avatar">成</div>
        <div>
          <strong>成本管理部</strong>
          <span>招标复核组</span>
        </div>
      </div>
    </aside>
  )
}

function HostHeader() {
  return (
    <header className="host-page__header">
      <div>
        <h1>项目成本主题分析</h1>
      </div>
    </header>
  )
}

function HostActionButtons() {
  return (
    <div className="host-page__header-actions">
      <button>导入清单</button>
      <button className="is-primary">提交复核</button>
    </div>
  )
}

function ListPreset() {
  return (
    <main className="host-page host-page--list">
      <section className="host-metrics">
        <Metric title="本月动态成本" value="28.64 亿" trend="较上月 +4.8%" />
        <Metric title="目标成本偏差" value="3.2%" trend="高于预警线 0.7%" tone="warn" />
        <Metric title="异常项目" value="12 个" trend="需重点分析 5 个" tone="danger" />
        <Metric title="已生成洞察" value="46 条" trend="覆盖 8 个成本科目" />
      </section>

      <section className="host-card host-filter-card">
        <div className="host-filter-grid">
          <label>
            <span>所属项目</span>
            <select defaultValue="all">
              <option value="all">全部项目</option>
              <option>问数验证项目一期</option>
              <option>深圳湾东区展示中心</option>
            </select>
          </label>
          <label>
            <span>成本科目</span>
            <select defaultValue="all">
              <option value="all">全部科目</option>
              <option>建安工程费</option>
              <option>精装修工程</option>
            </select>
          </label>
          <label>
            <span>分析期间</span>
            <select defaultValue="h1">
              <option value="h1">2026 上半年</option>
              <option>近 3 个月</option>
              <option>本月</option>
            </select>
          </label>
          <label className="host-filter-grid__search">
            <span>关键词</span>
            <div className="host-search">
              <Search size={16} />
              <span>输入项目、科目、异常原因</span>
            </div>
          </label>
        </div>
      </section>

      <section className="host-card host-card--fill">
        <div className="host-card__title-row host-card__title-row--inline">
          <div className="host-card__title-inline">
            <h2>成本主题分析清单</h2>
            <p>按项目、科目、偏差率和风险等级聚合成本异常，支持 AI 追问洞察。</p>
          </div>
          <div className="host-card__title-actions">
            <span className="host-badge host-badge--danger">5 个高风险</span>
            <HostActionButtons />
          </div>
        </div>
        <div className="host-table">
          <div className="host-table__row host-table__row--head">
            <span>项目编号</span>
            <span>项目 / 成本科目</span>
            <span>动态成本（元）</span>
            <span>风险</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          {records.map(record => (
            <div className="host-table__row" key={record.id}>
              <span className="host-code">{record.id}</span>
              <span>
                <strong>{record.project}</strong>
                <small>{record.document} · {record.owner}</small>
              </span>
              <span>{record.amount}</span>
              <span><RiskBadge risk={record.risk} /></span>
              <span>{record.status}</span>
              <span><button className="host-row-action">分析</button></span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function WorkbenchPreset() {
  return (
    <main className="host-page host-page--workbench">
      <HostHeader />
      <section className="host-metrics">
        <Metric title="本月待审金额" value="7.28 亿" trend="较上月 +12.4%" />
        <Metric title="异常指标" value="59 项" trend="高风险 35 项" tone="danger" />
        <Metric title="平均复核时长" value="6min30s" trend="AI 已处理 18 单" />
        <Metric title="待人工确认" value="12 单" trend="集中在钢结构与门窗工程" tone="warn" />
      </section>
      <section className="host-grid">
        <div className="host-card">
          <h2>重点待办</h2>
          {records.slice(0, 3).map(record => (
            <div className="host-task" key={record.id}>
              <FileText size={18} />
              <div>
                <strong>{record.project}</strong>
                <span>{record.document} · {record.status}</span>
              </div>
              <RiskBadge risk={record.risk} />
            </div>
          ))}
        </div>
        <div className="host-card">
          <h2>异常分布</h2>
          <div className="host-bars">
            <Bar label="住宅钢结构" value={82} />
            <Bar label="普通砌体" value={56} />
            <Bar label="门窗栏杆" value={42} />
            <Bar label="精装修" value={36} />
          </div>
        </div>
      </section>
    </main>
  )
}

function DetailPreset() {
  const record = records[0]
  return (
    <main className="host-page host-page--detail">
      <HostHeader />
      <section className="host-card">
        <div className="host-card__title-row">
          <div>
            <h2>{record.project}控制价文件</h2>
            <p>文件编号 {record.id} · 出具日期 {record.updatedAt}</p>
          </div>
          <RiskBadge risk={record.risk} />
        </div>
        <div className="host-detail-grid">
          <Info label="项目位置" value="广东省深圳市" />
          <Info label="建筑面积" value="192,909.28 ㎡" />
          <Info label="送审金额" value="551,867,033.03 元" />
          <Info label="折合单方" value="2,860.76 元/㎡" />
        </div>
      </section>
      <section className="host-card">
        <h2>审核轨迹</h2>
        <div className="host-timeline">
          <Timeline icon={<CheckCircle2 size={16} />} title="文件上传完成" desc="招标控制价文件、清单明细和指标表已归集。" />
          <Timeline icon={<AlertTriangle size={16} />} title="发现异常指标" desc="钢结构工程单价偏离明显，建议优先复核。" />
          <Timeline icon={<FileText size={16} />} title="等待 AI 报告" desc="点击右下角 AI 入口生成控制价审核报告。" />
        </div>
      </section>
    </main>
  )
}

function SplitPreset() {
  return (
    <main className="host-page host-page--split">
      <HostHeader />
      <section className="host-split">
        <aside className="host-card host-tree">
          <h2>项目分类</h2>
          {['问数验证项目一期', '深圳湾东区展示中心', '观澜云庭二期', '南山科创园配套'].map((name, index) => (
            <button className={index === 0 ? 'is-active' : ''} key={name}>
              <Building2 size={16} />{name}
            </button>
          ))}
        </aside>
        <div className="host-card">
          <div className="host-card__title-row">
            <div>
              <h2>专业工程费用</h2>
              <p>当前项目共 8112 条清单项，建筑工程占比最高。</p>
            </div>
            <button className="host-filter"><MoreHorizontal size={16} /></button>
          </div>
          <div className="host-table host-table--compact">
            {records.map(record => (
              <div className="host-table__row" key={record.id}>
                <span>{record.document}</span>
                <span>{record.amount}</span>
                <span><RiskBadge risk={record.risk} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function Metric({ title, value, trend, tone }: { title: string; value: string; trend: string; tone?: 'danger' | 'warn' }) {
  return (
    <div className={`host-card host-metric${tone ? ` host-metric--${tone}` : ''}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </div>
  )
}

function RiskBadge({ risk }: { risk: HostRecord['risk'] }) {
  return <span className={`host-badge host-badge--${risk === '高' ? 'danger' : risk === '中' ? 'warn' : 'ok'}`}>{risk}风险</span>
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="host-bar">
      <div><span>{label}</span><strong>{value}%</strong></div>
      <i style={{ width: `${value}%` }} />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="host-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Timeline({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="host-timeline__item">
      <span>{icon}</span>
      <div><strong>{title}</strong><p>{desc}</p></div>
    </div>
  )
}
