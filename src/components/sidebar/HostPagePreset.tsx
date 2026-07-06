import { ChevronDown, ClipboardCheck, FileText, Menu, Settings, WalletCards } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export type HostPresetType = 'list' | 'workbench' | 'detail' | 'split' | 'honeycomb-control-price'

interface PaymentRecord {
  id: string
  project: string
  contract: string
  supplier: string
  amount: string
  status: '未审核' | '审核中' | '已审核'
  owner: string
  updatedAt: string
  risk: '高' | '中' | '低'
}

const paymentRecords: PaymentRecord[] = [
  {
    id: 'FK-20260609-001',
    project: '深圳湾一号城市更新项目',
    contract: '一期施工总承包合同',
    supplier: '深圳市华筑建设工程有限公司',
    amount: '1,860,000 元',
    status: '未审核',
    owner: '项目财务',
    updatedAt: '2026-06-09',
    risk: '中',
  },
  {
    id: 'FK-20260608-017',
    project: '龙华云璟花园二期',
    contract: '机电安装专业分包合同',
    supplier: '广东启安机电工程有限公司',
    amount: '920,000 元',
    status: '审核中',
    owner: '区域财务',
    updatedAt: '2026-06-08',
    risk: '低',
  },
  {
    id: 'FK-20260607-011',
    project: '前海展示中心改造工程',
    contract: '精装修工程合同',
    supplier: '深圳市深装建设集团有限公司',
    amount: '2,480,000 元',
    status: '未审核',
    owner: '项目财务',
    updatedAt: '2026-06-07',
    risk: '高',
  },
  {
    id: 'FK-20260605-006',
    project: '广州金融城综合体',
    contract: '幕墙工程合同',
    supplier: '广州立诚幕墙工程有限公司',
    amount: '1,320,000 元',
    status: '已审核',
    owner: '财务经理',
    updatedAt: '2026-06-05',
    risk: '低',
  },
]

interface HostPagePresetProps {
  type?: HostPresetType
  onOpenAi?: () => void
  showHeaderAiButton?: boolean
  aiDocked?: boolean
}

function HostAiButtonIcon() {
  return (
    <svg className="host-ai-button__icon-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14.4752 13.266L7.40819 7.0057C7.05034 7.04002 6.71171 7.18299 6.43813 7.41527C6.16455 7.64754 5.96921 7.9579 5.87856 8.30436L12.2485 15.4724L12.3798 15.6031C12.573 15.7744 12.8055 15.8956 13.0569 15.9561C13.3082 16.0166 13.5707 16.0145 13.821 15.95C14.0714 15.8855 14.3019 15.7606 14.4923 15.5863C14.6826 15.412 14.827 15.1937 14.9125 14.9507C15.0147 14.6582 15.0277 14.3421 14.9498 14.0423C14.8718 13.7424 14.7065 13.4723 14.4745 13.266H14.4752ZM3.85162 7.70963C4.29654 8.424 4.71562 8.30436 4.77359 7.48565C4.81543 7.07234 5.00416 6.68751 5.30575 6.40055C5.60735 6.11358 6.00197 5.94337 6.41847 5.92059C7.26151 5.89416 7.38235 5.48237 6.68528 5.01215C6.34799 4.76711 6.10981 4.41003 6.01374 4.00541C5.91767 3.60078 5.97006 3.17528 6.16144 2.80576C6.55956 2.06496 6.26621 1.76238 5.50139 2.122C5.11673 2.29905 4.68062 2.33107 4.27405 2.21209C3.86749 2.09312 3.51809 1.83124 3.29076 1.4751C2.84584 0.760736 2.43165 0.865073 2.36879 1.69978C2.32695 2.11309 2.13822 2.49792 1.83662 2.78488C1.53502 3.07185 1.1404 3.24206 0.723907 3.26484C-0.124725 3.30101 -0.244861 3.7135 0.457094 4.18302C0.794384 4.42806 1.03257 4.78513 1.12864 5.18976C1.22471 5.59439 1.17232 6.01988 0.980941 6.38941C0.582817 7.13091 0.876171 7.43279 1.64099 7.07317C2.02446 6.89515 2.45971 6.86154 2.86615 6.97856C3.27259 7.09557 3.62269 7.3553 3.85162 7.70963ZM8.51875 4.05781L9.2207 4.30266C9.43929 4.37895 9.63698 4.50502 9.79801 4.67082C9.95904 4.83662 10.079 5.03758 10.1483 5.25769L10.3732 5.96719C10.3944 6.01902 10.4306 6.06338 10.4773 6.0946C10.5239 6.12582 10.5789 6.1425 10.6351 6.1425C10.6913 6.1425 10.7462 6.12582 10.7929 6.0946C10.8395 6.06338 10.8758 6.01902 10.897 5.96719L11.1429 5.26813C11.2195 5.05044 11.3461 4.85357 11.5126 4.6932C11.679 4.53283 11.8808 4.41339 12.1019 4.34439L12.8248 4.13085C12.8768 4.1097 12.9214 4.0736 12.9527 4.02714C12.9841 3.98068 13.0008 3.92598 13.0008 3.87C13.0008 3.81403 12.9841 3.75932 12.9527 3.71286C12.9214 3.6664 12.8768 3.6303 12.8248 3.60916L12.1228 3.36362C11.9043 3.28739 11.7067 3.16143 11.5456 2.99575C11.3846 2.83007 11.2646 2.62925 11.1953 2.40927L11.0018 1.70464C10.9806 1.65282 10.9443 1.60846 10.8976 1.57724C10.851 1.54601 10.7961 1.52934 10.7399 1.52934C10.6837 1.52934 10.6287 1.54601 10.5821 1.57724C10.5354 1.60846 10.4992 1.65282 10.4779 1.70464L10.2321 2.40371C10.1555 2.6214 10.0289 2.81827 9.86239 2.97864C9.6959 3.13901 9.49411 3.25845 9.27309 3.32745L8.56065 3.55142C8.50861 3.57257 8.46407 3.60867 8.43272 3.65513C8.40137 3.70159 8.38462 3.75629 8.38462 3.81227C8.38462 3.86824 8.40137 3.92295 8.43272 3.96941C8.46407 4.01587 8.50861 4.05197 8.56065 4.07311L8.51875 4.05781ZM5.5433 11.2314L4.92027 11.0123C4.72653 10.9447 4.55128 10.8331 4.40845 10.6862C4.26562 10.5394 4.15915 10.3614 4.09748 10.1664L3.89842 9.54041C3.88156 9.49082 3.84952 9.44773 3.8068 9.41721C3.76407 9.38669 3.71282 9.37028 3.66024 9.37028C3.60767 9.37028 3.55641 9.38669 3.51369 9.41721C3.47096 9.44773 3.43892 9.49082 3.42207 9.54041L3.20205 10.1616C3.13268 10.3509 3.0205 10.5219 2.8742 10.6612C2.72789 10.8005 2.55138 10.9044 2.35831 10.965L1.72969 11.1632C1.67964 11.1798 1.63611 11.2117 1.60526 11.2544C1.57441 11.297 1.55781 11.3482 1.55781 11.4008C1.55781 11.4533 1.57441 11.5045 1.60526 11.5471C1.63611 11.5898 1.67964 11.6217 1.72969 11.6383L2.35342 11.8574C2.54112 11.929 2.70992 12.0424 2.84695 12.1889C2.98397 12.3353 3.0856 12.511 3.14408 12.7025L3.34314 13.3286C3.35984 13.3784 3.39186 13.4218 3.43467 13.4525C3.47747 13.4832 3.5289 13.4997 3.58167 13.4997C3.63443 13.4997 3.68586 13.4832 3.72867 13.4525C3.77147 13.4218 3.80349 13.3784 3.82019 13.3286L4.04021 12.7074C4.10808 12.5147 4.22011 12.3403 4.36741 12.1982C4.51472 12.0561 4.69325 11.9501 4.88884 11.8887L5.51745 11.6905C5.56751 11.6738 5.61104 11.642 5.64189 11.5993C5.67273 11.5567 5.68933 11.5055 5.68933 11.4529C5.68933 11.4004 5.67273 11.3492 5.64189 11.3065C5.61104 11.2639 5.56751 11.232 5.51745 11.2154L5.5433 11.2314Z" fill="url(#host-ai-button-icon-gradient)" />
      <defs>
        <linearGradient id="host-ai-button-icon-gradient" x1="0" y1="8.5" x2="15" y2="8.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5C8AFF" />
          <stop offset="1" stopColor="#786CFF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function HostAiButton({ label = 'AI 助手', onOpenAi }: { label?: string; onOpenAi?: () => void }) {
  return (
    <button
      className="host-ai-button"
      type="button"
      onClick={onOpenAi}
      aria-label={label}
      title={label}
    >
      <span className="host-ai-button__icon-wrapper">
        <HostAiButtonIcon />
      </span>
      <span className="host-ai-button__label">{label}</span>
    </button>
  )
}

export function HostPagePreset({ onOpenAi, showHeaderAiButton = true, aiDocked = false }: HostPagePresetProps) {
  const previousAiDockedRef = useRef(aiDocked)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const hostNavWidth = navCollapsed ? '64px' : '208px'
  const hostStyle = {
    gridTemplateColumns: `${hostNavWidth} minmax(0, 1fr)`,
    '--host-nav-width': hostNavWidth,
  } as CSSProperties
  const sidebarStyle = {
    width: hostNavWidth,
    minWidth: hostNavWidth,
    maxWidth: hostNavWidth,
  } as CSSProperties
  const mainStyle = {
    left: hostNavWidth,
    right: 0,
    width: 'auto',
  } as CSSProperties
  const className = [
    'host-app-shell',
    aiDocked ? 'host-app-shell--ai-docked' : '',
    navCollapsed ? 'host-app-shell--nav-collapsed' : '',
  ].filter(Boolean).join(' ')

  useEffect(() => {
    if (aiDocked && !previousAiDockedRef.current) {
      setNavCollapsed(true)
    }
    if (!aiDocked && previousAiDockedRef.current) {
      setNavCollapsed(false)
    }
    previousAiDockedRef.current = aiDocked
  }, [aiDocked])

  return (
    <div className={className} style={hostStyle}>
      <HostSidebar
        collapsed={navCollapsed}
        onToggleNav={() => setNavCollapsed(value => !value)}
        style={sidebarStyle}
      />
      <div className="host-app-main" style={mainStyle}>
        <PaymentListPage onOpenAi={onOpenAi} showHeaderAiButton={showHeaderAiButton} />
      </div>
    </div>
  )
}

function PaymentListPage({ onOpenAi, showHeaderAiButton = true }: { onOpenAi?: () => void; showHeaderAiButton?: boolean }) {
  return (
    <main className="host-page host-page--list host-page--honeycomb">
      <section className="host-card host-filter-card">
        <div className="host-toolbar host-toolbar--honeycomb">
          <label className="host-field">
            <span>项目范围</span>
            <div className="host-field__control">全部项目</div>
          </label>
          <label className="host-field">
            <span>付款类型</span>
            <div className="host-field__control">工程进度款</div>
          </label>
          <label className="host-field">
            <span>供应商</span>
            <div className="host-field__control">全部供应商</div>
          </label>
          <label className="host-field">
            <span>申请日期</span>
            <div className="host-field__control">近 30 天</div>
          </label>
        </div>
      </section>

      <section className="host-card host-card--fill">
        <div className="host-list-toolbar">
          <div className="tt-l">
            <div className="view-tabs" aria-label="状态筛选">
              <button className="view-tab on" type="button">全部<span>·28</span></button>
              <button className="view-tab" type="button"><span className="vt-div" />未审核<span>·9</span></button>
              <button className="view-tab" type="button"><span className="vt-div" />审核中<span>·11</span></button>
              <button className="view-tab" type="button"><span className="vt-div" />已审核<span>·8</span></button>
            </div>
          </div>
          <div className="host-card__title-actions">
            <HostActionButtons onOpenAi={onOpenAi} showAiButton={showHeaderAiButton} />
          </div>
        </div>

        <div className="host-table">
          <div className="host-table__row host-table__row--head">
            <span>申请单号</span>
            <span>项目 / 合同</span>
            <span>申请金额</span>
            <span>风险</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          {paymentRecords.map(record => (
            <div className="host-table__row" key={record.id}>
              <span className="host-code">{record.id}</span>
              <span>
                <strong>{record.project}</strong>
                <small>{record.contract} · {record.supplier}</small>
              </span>
              <span>{record.amount}</span>
              <span><RiskBadge risk={record.risk} /></span>
              <span>{record.status}</span>
              <span><button className="host-row-action" type="button">查看</button></span>
            </div>
          ))}
        </div>

        <div className="pgn">
          <div className="pgn-info">共 <b>28</b> 条</div>
          <div className="pgn-size">
            <div className="pgn-pages">
              <button className="pgn-btn" type="button">‹</button>
              <button className="pgn-btn on" type="button">1</button>
              <button className="pgn-btn" type="button">2</button>
              <button className="pgn-btn" type="button">3</button>
              <button className="pgn-btn" type="button">...</button>
              <button className="pgn-btn" type="button">9</button>
              <button className="pgn-btn" type="button">›</button>
            </div>
            <select className="sel" defaultValue="20 条/页" aria-label="每页条数">
              <option>20 条/页</option>
              <option>50 条/页</option>
              <option>100 条/页</option>
            </select>
          </div>
        </div>
      </section>
    </main>
  )
}

function HostSidebar({
  collapsed,
  onToggleNav,
  style,
}: {
  collapsed: boolean
  onToggleNav: () => void
  style?: CSSProperties
}) {
  return (
    <aside className="host-sidebar" style={style} aria-label="产品导航" aria-expanded={!collapsed}>
      <div className="host-sidebar__module">
        <strong>财务管理</strong>
        <button
          className="host-sidebar__collapse-btn"
          type="button"
          aria-label={collapsed ? '展开导航' : '收起导航'}
          aria-pressed={collapsed}
          onClick={onToggleNav}
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="host-sidebar__nav">
        <HostNavGroup
          defaultOpen
          icon={<WalletCards size={16} />}
          label="付款管理"
          activeItem="付款申请审核"
          items={['付款申请审核', '付款计划', '供应商付款台账']}
        />

        <HostNavGroup
          icon={<ClipboardCheck size={16} />}
          label="审批中心"
          items={['待我审批', '审批记录', '退回单据']}
        />

        <HostNavGroup
          icon={<FileText size={16} />}
          label="票据与对账"
          items={['发票登记', '往来对账', '付款回单']}
        />

        <button className="host-sidebar__item host-sidebar__item--single" type="button">
          <span className="host-sidebar__item-main">
            <Settings size={16} />
            <span>系统设置</span>
          </span>
        </button>
      </nav>
    </aside>
  )
}

function HostNavGroup({
  icon,
  label,
  items,
  activeItem,
  defaultOpen = false,
}: {
  icon: ReactNode
  label: string
  items: string[]
  activeItem?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="host-sidebar__group">
      <button
        className="host-sidebar__item host-sidebar__item--parent"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span className="host-sidebar__item-main">
          {icon}
          <span>{label}</span>
        </span>
        <ChevronDown className="host-sidebar__chevron" size={14} aria-hidden="true" />
      </button>
      {open ? (
        <div className="host-sidebar__subnav">
          {items.map(item => (
            <button
              className={`host-sidebar__subitem${item === activeItem ? ' host-sidebar__subitem--active' : ''}`}
              type="button"
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function HostActionButtons({ onOpenAi, showAiButton = true }: { onOpenAi?: () => void; showAiButton?: boolean }) {
  return (
    <div className="host-page__header-actions">
      <button type="button">导出</button>
      {showAiButton ? <HostAiButton label="AI智能审核" onOpenAi={onOpenAi} /> : null}
      <button className="is-primary" type="button">批量审核</button>
    </div>
  )
}

function RiskBadge({ risk }: { risk: PaymentRecord['risk'] }) {
  return <span className={`host-badge host-badge--${risk === '高' ? 'danger' : risk === '中' ? 'warn' : 'ok'}`}>{risk}风险</span>
}
