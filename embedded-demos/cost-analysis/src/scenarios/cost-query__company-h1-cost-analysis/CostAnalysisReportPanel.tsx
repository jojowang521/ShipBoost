import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  description: string
  title?: string
}

interface MarkdownSection {
  title: string
  body: string
}

const reportStyle = {
  label: '方案一',
  name: '曜石紫高管版',
  desc: '强汇报感、深色封面、指标更突出',
}

const summaryMetrics = [
  { label: '项目成本总体', value: '739,397', unit: '万元', trend: '总成本' },
  { label: '建面单方', value: '10,664', unit: '元/平方米', trend: '核心指标' },
  { label: '建安占比', value: '98.2', unit: '%', trend: '主导科目' },
  { label: '土建占建安', value: '88.4', unit: '%', trend: '管控重点' },
]

const markdownComponents = {
  table: ({ children, ...props }: any) => (
    <div className="cost-report-table-wrap">
      <table {...props}>{children}</table>
    </div>
  ),
}

function parseSections(markdown: string): MarkdownSection[] {
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

function normalizeSections(sections: MarkdownSection[]) {
  const lead = sections.find(section => section.title === '核心结论')
  const content = sections.filter(section => section.title !== '核心结论')
  return { lead, content }
}

export default function CostAnalysisReportPanel({ description, title = '公司成本构成分析报告' }: Props) {
  const sections = useMemo(() => normalizeSections(parseSections(description)), [description])

  return (
    <div className="cost-report-panel cost-report-panel--executive">
      <article className="cost-report-sheet">
        <header className="cost-report-hero">
          <div className="cost-report-hero__main">
            <span className="cost-report-kicker">{reportStyle.label} / {reportStyle.name}</span>
            <h1>{title}</h1>
            <p>{reportStyle.desc}</p>
          </div>
          <div className="cost-report-hero__meta">
            <span>AI 生成</span>
            <strong>上半年成本分析</strong>
            <em>公司维度 / 按科目穿透 / 建面单方</em>
          </div>
        </header>

        <section className="cost-report-metrics" aria-label="关键指标">
          {summaryMetrics.map(metric => (
            <div className="cost-report-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>
                {metric.value}
                <em>{metric.unit}</em>
              </strong>
              <small>{metric.trend}</small>
            </div>
          ))}
        </section>

        {sections.lead && (
          <section className="cost-report-lead">
            <div className="cost-report-section-title">
              <span>00</span>
              <h2>{sections.lead.title}</h2>
            </div>
            <div className="cost-report-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {sections.lead.body}
              </ReactMarkdown>
            </div>
          </section>
        )}

        <div className="cost-report-section-list">
          {sections.content.map((section, index) => (
            <section className="cost-report-section" key={`${section.title}-${index}`}>
              <div className="cost-report-section-title">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h2>{section.title}</h2>
              </div>
              <div className="cost-report-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {section.body}
                </ReactMarkdown>
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}
