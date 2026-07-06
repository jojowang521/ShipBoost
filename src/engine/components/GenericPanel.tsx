import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRef, type ReactNode } from 'react'
import { FloatingScrollbar } from '../../shared/components/FloatingScrollbar'

interface Props {
  description: string
  title?: string
  onAskQuestion?: (q: string) => void
  readonly?: boolean
}

interface MarkdownSection {
  title: string
  body: string
}

function parsePanelSections(markdown: string): MarkdownSection[] {
  const lines = markdown.trim().split(/\r?\n/)
  const sections: MarkdownSection[] = []
  let currentTitle = '内容详情'
  let currentLines: string[] = []
  let hasExplicitSection = false

  const flush = () => {
    const body = currentLines.join('\n').trim()
    if (!body && sections.length === 0 && !hasExplicitSection) return
    if (body || hasExplicitSection) {
      sections.push({ title: currentTitle, body })
    }
    currentLines = []
  }

  for (const line of lines) {
    const match = line.trim().match(/^\*\*([^*]+)\*\*$/)
    if (match) {
      flush()
      currentTitle = match[1].trim()
      hasExplicitSection = true
      continue
    }
    currentLines.push(line)
  }

  flush()
  return sections.filter(section => section.body || section.title !== '内容详情')
}

function extractPanelContext(markdown: string, title: string) {
  const pick = (label: string) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = markdown.match(new RegExp(`\\|\\s*${escaped}\\s*\\|\\s*([^|\\n]+?)\\s*\\|`))
    return match?.[1]?.replace(/\*\*/g, '').trim()
  }

  const fallbackObject = title && title !== '内容预览' ? title : '业务对象'
  const project = pick('项目名称') || pick('项目') || '业务项目'
  const contract = pick('合同名称') || pick('合同') || pick('审核对象') || pick('文件类型') || fallbackObject
  const amount =
    pick('本次申请金额') ||
    pick('申请金额') ||
    pick('初始识别金额') ||
    pick('送审金额') ||
    pick('控制价金额') ||
    pick('目标成本') ||
    '待确认'

  return { project, contract, amount }
}

function getMarkdownCellText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(getMarkdownCellText).join('')
  return ''
}

function isMarkdownBarCell(children: ReactNode) {
  return /^█+$/.test(getMarkdownCellText(children).trim())
}

const markdownComponents = {
  table: ({ children, ...props }: any) => (
    <div className="v4-workbench-table-scroll">
      <table {...props}>{children}</table>
    </div>
  ),
  td: ({ children, ...props }: any) => (
    <td {...props} className={isMarkdownBarCell(children) ? 'v4-workbench-table__cell--bar' : undefined}>
      {isMarkdownBarCell(children) ? <span className="v4-workbench-table__bar">{children}</span> : children}
    </td>
  ),
}

export default function GenericPanel({ description, title = '内容预览' }: Props) {
  const workbenchPageRef = useRef<HTMLDivElement>(null)

  if (!description || description.trim().startsWith('暂无')) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-base)',
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="1" y="1" width="38" height="38" rx="8" stroke="var(--border)" strokeWidth="1.5"/>
          <path d="M13 20h14M20 13v14" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>当前阶段暂无预览内容</span>
      </div>
    )
  }

  const sections = parsePanelSections(description)
  const context = extractPanelContext(description, title)

  return (
    <div className="v4-workbench-shell">
      <div className="v4-workbench-page" ref={workbenchPageRef}>
        <div className="v4-workbench-summary-card" aria-label="工作台摘要">
          <header className="v4-workbench-report-header">
            <h1>{title}</h1>
          </header>

          <div className="v4-workbench-kpi-strip" aria-label="工作台上下文">
            <div className="v4-workbench-vc">
              <div className="v4-workbench-vc-label">项目</div>
              <div className="v4-workbench-vc-value">{context.project}</div>
            </div>
            <div className="v4-workbench-vc">
              <div className="v4-workbench-vc-label">合同/对象</div>
              <div className="v4-workbench-vc-value">{context.contract}</div>
            </div>
            <div className="v4-workbench-vc">
              <div className="v4-workbench-vc-label">关键金额</div>
              <div className="v4-workbench-vc-value">{context.amount}</div>
            </div>
          </div>
        </div>

        <div className="v4-workbench-doc-body">
          {sections.map((section, index) => (
            <section className="v4-workbench-doc-section" key={`${section.title}-${index}`}>
              <div className="v4-workbench-section-head">
                <span className="v4-workbench-section-num">{String(index + 1).padStart(2, '0')}</span>
                <h2>{section.title}</h2>
              </div>
              <div className="v4-workbench-doc-scroll">
                <div className="v4-prose v4-workbench-prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {section.body}
                  </ReactMarkdown>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
      <FloatingScrollbar targetRef={workbenchPageRef} className="floating-scrollbar--workbench" />
    </div>
  )
}
