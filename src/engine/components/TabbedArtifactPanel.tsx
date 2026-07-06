import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Clock3, Download, FileText, MapPin, Settings2, Tags } from 'lucide-react'
import type { GeneratedArtifact } from '../types'
import { FloatingScrollbar } from '../../shared/components/FloatingScrollbar'

interface Props {
  description: string
  artifacts: GeneratedArtifact[]
  onClosePreview?: () => void
  targetArtifactTitle?: string | null
}

interface ArtifactTab {
  id: string
  title: string
  body: string
}

function getMarkdownCellText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(getMarkdownCellText).join('')
  return ''
}

function isMarkdownBarCell(children: ReactNode) {
  return /^█+$/.test(getMarkdownCellText(children).trim())
}

function getMarkdownCellClass(children: ReactNode) {
  const text = getMarkdownCellText(children).trim()
  const numericHeaders = /^(序号|清单数|金额|占比|值|年份|送审值|当前项目|对标均值|偏差)$/
  const numericValue = /^(?:¥|-?\+?\d|[0-9,]+(?:\.\d+)?%|[0-9,]+(?:\.\d+)?㎡|[0-9,]+(?:\.\d+)? 项)/u
  return numericHeaders.test(text) || numericValue.test(text)
    ? 'artifact-report-table__cell--number'
    : undefined
}

function getMarkdownTdClass(children: ReactNode) {
  return [
    getMarkdownCellClass(children),
    isMarkdownBarCell(children) ? 'artifact-report-table__cell--bar' : undefined,
  ].filter(Boolean).join(' ') || undefined
}

const markdownComponents = {
  table: ({ children, ...props }: any) => (
    <div className="artifact-workbench__table-scroll">
      <table {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }: any) => (
    <th {...props} className={getMarkdownCellClass(children)}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td {...props} className={getMarkdownTdClass(children)}>
      {isMarkdownBarCell(children) ? <span className="artifact-report-table__bar">{children}</span> : children}
    </td>
  ),
}

interface MetricRow {
  name: string
  type?: string
  average: string
  current: string
  currentDiff: string
  peer1: string
  peer1Diff: string
  peer2: string
  peer2Diff: string
  peer3: string
  peer3Diff: string
  severity?: 'danger' | 'accent'
}

function diffClass(row: MetricRow) {
  if (row.severity === 'danger') return ' artifact-detail-table__diff--danger'
  if (row.severity === 'accent') return ' artifact-detail-table__diff--accent'
  return ''
}

function MetricTable({ rows, withType = false }: { rows: MetricRow[]; withType?: boolean }) {
  return (
    <div className="artifact-detail-table-scroll">
      <table className="artifact-detail-table">
        <thead>
          <tr>
            <th rowSpan={2}>指标名称</th>
            {withType ? <th rowSpan={2}>类型</th> : null}
            <th rowSpan={2}>均值</th>
            <th colSpan={2}>当前项目</th>
            <th colSpan={2}>保利·天汇一期</th>
            <th colSpan={2}>万科·星城北区</th>
            <th colSpan={2}>绿城·锦兰雅苑</th>
          </tr>
          <tr>
            <th>指标值</th>
            <th>差异比</th>
            <th>指标值</th>
            <th>差异比</th>
            <th>指标值</th>
            <th>差异比</th>
            <th>指标值</th>
            <th>差异比</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.name}>
              <td className="artifact-detail-table__name">{row.name}</td>
              {withType ? <td>{row.type}</td> : null}
              <td className="artifact-detail-table__muted">{row.average}</td>
              <td className="artifact-detail-table__current">{row.current}</td>
              <td className={`artifact-detail-table__diff${diffClass(row)}`}>{row.currentDiff}</td>
              <td>{row.peer1}</td>
              <td className="artifact-detail-table__muted">{row.peer1Diff}</td>
              <td>{row.peer2}</td>
              <td className="artifact-detail-table__muted">{row.peer2Diff}</td>
              <td>{row.peer3}</td>
              <td className="artifact-detail-table__muted">{row.peer3Diff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const structureQuantityRows: MetricRow[] = [
  {
    name: '钢筋含量指标',
    average: '52 kg/m²',
    current: '58.2',
    currentDiff: '+11.9%',
    peer1: '51.4',
    peer1Diff: '-1.2%',
    peer2: '53.4',
    peer2Diff: '+2.6%',
    peer3: '51.6',
    peer3Diff: '-0.8%',
  },
  {
    name: '混凝土含量指标',
    average: '0.38 m³/m²',
    current: '0.35',
    currentDiff: '-7.9%',
    peer1: '0.4',
    peer1Diff: '+1.5%',
    peer2: '0.4',
    peer2Diff: '+2.6%',
    peer3: '0.4',
    peer3Diff: '+3.1%',
  },
]

const structurePriceRows: MetricRow[] = [
  {
    name: '土方开挖',
    type: '综合单价',
    average: '35.5 元/m³',
    current: '36.2',
    currentDiff: '+2.0%',
    peer1: '35.1',
    peer1Diff: '-1.2%',
    peer2: '36.4',
    peer2Diff: '+2.6%',
    peer3: '35.2',
    peer3Diff: '-0.8%',
  },
]

const decorationQuantityRows: MetricRow[] = [
  {
    name: '门窗面积占比',
    average: '0.15 m²/m²',
    current: '0.12',
    currentDiff: '-20.0%',
    peer1: '0.1',
    peer1Diff: '-1.2%',
    peer2: '0.2',
    peer2Diff: '+2.6%',
    peer3: '0.1',
    peer3Diff: '-0.8%',
    severity: 'accent',
  },
]

const decorationPriceRows: MetricRow[] = [
  {
    name: '墙面抹灰',
    type: '单位造价',
    average: '65 元/m²',
    current: '98.5',
    currentDiff: '+51.5%',
    peer1: '64.2',
    peer1Diff: '-1.2%',
    peer2: '66.7',
    peer2Diff: '+2.6%',
    peer3: '64.5',
    peer3Diff: '-0.8%',
    severity: 'danger',
  },
]

function splitArtifactContent(description: string, artifacts: GeneratedArtifact[]): ArtifactTab[] {
  const detailMarker = '**控制价审核明细**'
  const markerIndex = description.indexOf(detailMarker)
  const reportSource = markerIndex >= 0 ? description.slice(0, markerIndex).trim() : description.trim()
  const reportBody = reportSource
    .replace(/^\*\*工作台卡片：控制价审核报告\*\*\s*\n+\s*页面已在右侧工作台打开\s*/u, '')
    .trim()
  const detailBody = markerIndex >= 0
    ? description.slice(markerIndex + detailMarker.length).trim()
    : ''

  const fallbackTabs = [
    { id: 'report', title: '控制价审核报告', body: reportBody },
    { id: 'detail', title: '控制价审核明细', body: detailBody || reportBody },
  ]

  if (artifacts.length < 2) return fallbackTabs

  return artifacts.slice(0, 2).map((artifact, index) => ({
    id: index === 0 ? 'report' : 'detail',
    title: artifact.title,
    body: index === 0 ? reportBody : (detailBody || reportBody),
  }))
}

function DetailPanel() {
  return (
    <div className="artifact-detail-page">
      <header className="artifact-detail-page__head">
        <h1>太阳城片区城市更新项目（一期）土建工程控制价</h1>
        <div className="artifact-detail-page__meta">
          <span className="artifact-detail-page__meta-location">
            <MapPin size={13} />
            <span className="artifact-detail-page__meta-text">广东省·深圳市</span>
          </span>
          <span className="artifact-detail-page__meta-date">
            <Clock3 size={13} />
            <span className="artifact-detail-page__meta-text">编制 2026年3月</span>
          </span>
          <span className="artifact-detail-page__meta-scope">
            <Tags size={13} />
            <span className="artifact-detail-page__meta-text">业态与专业：高层住宅、总承包、地下室、住宅-高层（80m 内）、商业-商业、车库/库房-地下室、建筑工程、安装工程、外墙面装饰工程、门窗栏杆工程、配套工程、土石方及基础工程、室外工程、专业安装工程、销售设施建设工程、精装修工程</span>
          </span>
        </div>
      </header>

      <div className="artifact-detail-page__card">
        <div className="artifact-detail-page__mode-tabs">
          <div className="artifact-detail-page__mode-tab-group">
            <button className="artifact-detail-page__mode-tab artifact-detail-page__mode-tab--active">指标分析明细</button>
            <button className="artifact-detail-page__mode-tab">综合单价明细</button>
          </div>
          <button className="artifact-detail-page__setting">
            <span>对比设置</span>
            <Settings2 size={14} />
          </button>
        </div>
        <div className="artifact-detail-page__body">
          <div className="artifact-detail-page__filter-row">
            <div className="artifact-detail-page__scope-tabs">
              <button className="artifact-detail-page__scope-tab artifact-detail-page__scope-tab--active">高层住宅</button>
              <button className="artifact-detail-page__scope-tab">地下车库</button>
              <button className="artifact-detail-page__scope-tab">项目整体</button>
            </div>
            <div className="artifact-detail-page__badges">
              <span>量指标·3</span>
              <span>价指标·2</span>
              <span className="artifact-detail-page__badge-danger">极端异常·2</span>
            </div>
          </div>

          <section className="artifact-detail-section">
            <h2>工程结构</h2>
            <p>量指标 (2项)</p>
            <MetricTable rows={structureQuantityRows} />
            <p>价指标 (1项)</p>
            <MetricTable rows={structurePriceRows} withType />
          </section>

          <section className="artifact-detail-section">
            <h2>装饰工程</h2>
            <p>量指标 (1项)</p>
            <MetricTable rows={decorationQuantityRows} />
            <p>价指标 (1项)</p>
            <MetricTable rows={decorationPriceRows} withType />
          </section>
        </div>
      </div>
    </div>
  )
}

function ReportPanel({ body }: { body: string }) {
  return (
    <article className="artifact-report-page v4-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {body}
      </ReactMarkdown>
    </article>
  )
}

function RefreshWorkbenchIcon() {
  return (
    <svg className="artifact-workbench__svg-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.3999 2.3999V5.3999H10.3999" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.1973 11C12.1599 12.7934 10.2208 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.1372 2 12.0135 3.11747 13.0764 4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MaximizeWorkbenchIcon() {
  return (
    <svg className="artifact-workbench__svg-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.9847 10.5999V13.4284H11.1563" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.01333 4.84292V2.0145H4.84176" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.1988 2.01431H14.0273V4.84274" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.8417 13.4286H2.01328V10.6001" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.3989 13.2002L10.5989 10.4002" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.44165 2.3999L5.24165 5.1999" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13.3989 2.3999L10.5989 5.1999" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.59912 13.2002L5.39912 10.4002" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CloseWorkbenchIcon() {
  return (
    <svg className="artifact-workbench__svg-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.57564 2.57564C2.80995 2.34132 3.18996 2.34132 3.42427 2.57564L7.99947 7.15083L12.4751 2.67622C12.7094 2.44191 13.0894 2.44191 13.3237 2.67622C13.5579 2.91055 13.558 3.29057 13.3237 3.52486L8.8481 7.99947L13.3237 12.4751C13.558 12.7094 13.558 13.0894 13.3237 13.3237C13.0894 13.5579 12.7093 13.558 12.4751 13.3237L7.99947 8.8481L3.42427 13.4243C3.18999 13.6586 2.80996 13.6585 2.57564 13.4243C2.34132 13.19 2.34132 12.81 2.57564 12.5756L7.15083 7.99947L2.57564 3.42427C2.34134 3.18997 2.34138 2.80996 2.57564 2.57564Z" fill="currentColor" />
    </svg>
  )
}

function TabbedArtifactPanel({ description, artifacts, onClosePreview, targetArtifactTitle }: Props) {
  const tabs = useMemo(() => splitArtifactContent(description, artifacts), [description, artifacts])
  const targetActiveId = useMemo(() => {
    if (!targetArtifactTitle) return null
    return tabs.find(tab => targetArtifactTitle.includes(tab.title) || tab.title.includes(targetArtifactTitle))?.id ?? null
  }, [tabs, targetArtifactTitle])
  const [activeId, setActiveId] = useState(targetActiveId ?? tabs[0]?.id ?? 'report')
  const pageRef = useRef<HTMLDivElement>(null)
  const scrollPositionsRef = useRef<Record<string, number>>({})
  const activeTab = tabs.find(tab => tab.id === activeId) ?? tabs[0]

  useEffect(() => {
    if (targetActiveId) {
      setActiveId(targetActiveId)
    }
  }, [targetActiveId])

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page) return
    page.scrollTop = scrollPositionsRef.current[activeId] ?? 0
  }, [activeId])

  const handleTabChange = (nextId: string) => {
    const page = pageRef.current
    if (page) {
      scrollPositionsRef.current[activeId] = page.scrollTop
    }
    setActiveId(nextId)
  }

  const handleContentScroll = () => {
    const page = pageRef.current
    if (!page) return
    scrollPositionsRef.current[activeId] = page.scrollTop
  }

  return (
    <div className="artifact-workbench artifact-workbench--control-price">
      <header className="artifact-workbench__titlebar">
        <div className="artifact-workbench__tabs" role="tablist" aria-label="控制价审核工作台">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeId === tab.id}
              className={`artifact-workbench__tab${activeId === tab.id ? ' artifact-workbench__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <FileText size={16} strokeWidth={1.8} />
              <span>{tab.title}</span>
            </button>
          ))}
        </div>
        <div className="artifact-workbench__ops" aria-label="工作台操作">
          {activeTab?.id === 'report' && (
            <button type="button" className="artifact-workbench__export">
              <span>导出</span>
              <Download size={12} />
            </button>
          )}
          <button type="button" className="artifact-workbench__icon-btn" aria-label="刷新">
            <RefreshWorkbenchIcon />
          </button>
          <button type="button" className="artifact-workbench__icon-btn" aria-label="放大">
            <MaximizeWorkbenchIcon />
          </button>
          <button type="button" className="artifact-workbench__icon-btn" aria-label="关闭" onClick={onClosePreview}>
            <CloseWorkbenchIcon />
          </button>
        </div>
      </header>

      <div className="artifact-workbench__content-shell">
        <div className="artifact-workbench__content" ref={pageRef} onScroll={handleContentScroll}>
          {activeTab?.id === 'detail' ? (
            <DetailPanel />
          ) : (
            <ReportPanel body={activeTab?.body ?? ''} />
          )}
        </div>
        <FloatingScrollbar targetRef={pageRef} className="floating-scrollbar--workbench" />
      </div>
    </div>
  )
}

TabbedArtifactPanel.hasInternalClose = true

export default TabbedArtifactPanel
