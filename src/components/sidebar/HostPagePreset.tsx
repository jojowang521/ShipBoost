import { Search, Filter, MoreHorizontal, CalendarDays, FileText, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

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

export function HostPagePreset({ type = 'list' }: { type?: HostPresetType }) {
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
        {page}
      </div>
    </div>
  )
}

function HostSidebar() {
  return (
    <aside className="host-sidebar" aria-label="产品导航">
      <div className="host-sidebar__brand">
        <div className="host-sidebar__brand-mark">明</div>
        <div>
          <strong>成本云</strong>
          <span>企业成本管理</span>
        </div>
      </div>

      <nav className="host-sidebar__nav">
        <div className="host-sidebar__section">常用工作</div>
        <button className="host-sidebar__item">
          <Building2 size={16} />
          <span>经营驾驶舱</span>
        </button>
        <button className="host-sidebar__item">
          <FileText size={16} />
          <span>项目台账</span>
        </button>

        <div className="host-sidebar__section">成本业务</div>
        <button className="host-sidebar__item host-sidebar__item--parent">
          <FileText size={16} />
          <span>成本管理</span>
        </button>
        <div className="host-sidebar__subnav">
          <button className="host-sidebar__subitem host-sidebar__subitem--active">招标控制价</button>
          <button className="host-sidebar__subitem">动态成本</button>
          <button className="host-sidebar__subitem">合同台账</button>
          <button className="host-sidebar__subitem">付款申请</button>
        </div>

        <div className="host-sidebar__section">协同与分析</div>
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
        <h1>招标控制价审核工作台</h1>
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
      <section className="host-card host-top-card">
        <HostHeader />
        <div className="host-toolbar">
          <div className="host-search">
            <Search size={16} />
            <span>搜索项目、文件编号、工程类别</span>
          </div>
          <button className="host-filter"><Filter size={16} />筛选</button>
          <button className="host-filter"><CalendarDays size={16} />近 30 天</button>
        </div>
      </section>

      <section className="host-card host-card--fill">
        <div className="host-card__title-row host-card__title-row--inline">
          <div className="host-card__title-inline">
            <h2>待审核清单</h2>
            <p>基于招标控制价文件、清单金额和异常指标生成待处理任务。</p>
          </div>
          <div className="host-card__title-actions">
            <span className="host-badge host-badge--danger">35 个异常</span>
            <HostActionButtons />
          </div>
        </div>
        <div className="host-table">
          <div className="host-table__row host-table__row--head">
            <span>文件编号</span>
            <span>项目 / 文件</span>
            <span>金额（元）</span>
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
              <span><button className="host-row-action">查看</button></span>
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
