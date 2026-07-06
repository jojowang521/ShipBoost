import type { ParsedBusinessDesign, BusinessDesignMeta, ParsedStep, GateNode, StepButton, GeneratedArtifact, SuggestedQuestion, FAQItem } from './types'

// ─── Frontmatter 解析 ─────────────────────────────────────────────────────────

function parseFrontmatter(raw: string): BusinessDesignMeta {
  const lines = raw.trim().split('\n')
  const map: Record<string, string> = {}
  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    map[key] = value
  }
  return {
    scenarioName: map['场景名称'] || '未命名场景',
    agentName: map['AI专员名称'] || 'AI 助手',
    agentDescription: map['AI专员简介'] || '',
    avatarColor: map['头像色'] || 'blue',
  }
}

// ─── 提取两个 heading 之间的内容 ──────────────────────────────────────────────

/** 提取 markdown 中某个标题之后、下一个同级或更高级标题之前的内容 */
function extractSection(text: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`${escapedHeading}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3} |\\n---|\n# |$)`)
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

function extractTrailingSection(text: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`${escapedHeading}[^\\n]*\\n([\\s\\S]*)$`)
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

// ─── 操作按钮解析 ─────────────────────────────────────────────────────────────

function parseActionButtons(text: string): StepButton[] {
  const buttons: StepButton[] = []
  // 匹配格式：
  // - 「按钮文字」→ 进入步骤 N
  // - 「按钮文字」→ 发送「用户消息」→ 进入步骤 N
  // - 「按钮文字」→ 重新开始
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.trim() === '无') continue
    const match = line.match(/「([^」]+)」/)
    if (!match) continue
    const label = match[1]
    const sendMatch = line.match(/发送\s*「([^」]+)」/)
    const sendText = sendMatch?.[1]?.trim() || label
    const targetMatch = line.match(/步骤\s*(\d+)/)
    const targetStep = targetMatch ? parseInt(targetMatch[1], 10) : 0
    buttons.push({ label, sendText, targetStep })
  }
  return buttons
}

// ─── 生成物卡片解析 ───────────────────────────────────────────────────────────

function parseGeneratedArtifacts(text: string): GeneratedArtifact[] {
  const artifacts: GeneratedArtifact[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('-')) continue
    const raw = trimmed.replace(/^-\s*/, '')
    const parts = raw.split('|').map(part => part.trim()).filter(Boolean)
    if (!parts[0]) continue
    artifacts.push({
      title: parts[0].replace(/^「|」$/g, ''),
      meta: parts[1],
      icon: parts[2],
    })
  }
  return artifacts
}

// ─── 推荐问题 / 下一步建议解析 ───────────────────────────────────────────────

function parseSuggestedQuestions(text: string): SuggestedQuestion[] {
  if (!text.trim() || text.trim() === '无') return []

  const suggestions: SuggestedQuestion[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('-')) continue

    const raw = trimmed.replace(/^-\s*/, '').trim()
    if (!raw) continue

    const quotedWithSend = raw.match(/^「([^」]+)」\s*→\s*(?:发送)?「([^」]+)」/)
    if (quotedWithSend) {
      suggestions.push({ label: quotedWithSend[1].trim(), sendText: quotedWithSend[2].trim() })
      continue
    }

    const quoted = raw.match(/^「([^」]+)」/)
    if (quoted) {
      const label = quoted[1].trim()
      suggestions.push({ label, sendText: label })
      continue
    }

    const arrowParts = raw.split(/\s*→\s*/)
    if (arrowParts.length >= 2) {
      const label = arrowParts[0].trim()
      const sendText = arrowParts.slice(1).join('→').replace(/^发送/, '').replace(/^「|」$/g, '').trim()
      if (label && sendText) suggestions.push({ label, sendText })
      continue
    }

    suggestions.push({ label: raw, sendText: raw })
  }

  return suggestions
}

// ─── 确认节点解析 ─────────────────────────────────────────────────────────────

function parseGateNode(text: string): GateNode | undefined {
  if (!text.trim()) return undefined

  const typeMatch = text.match(/\*\*类型\*\*[：:]\s*(.+)/)
  const contentMatch = text.match(/\*\*展示内容\*\*[：:]\s*(.+)/)
  const contentMarkdownMatch = text.match(/\*\*展示内容说明\*\*[：:]\s*([\s\S]*?)(?=\n\*\*[^*]+\*\*[：:]|$)/)
  const hideTitleMatch = text.match(/\*\*隐藏标题\*\*[：:]\s*(是|否|true|false)/i)
  const primaryMatch = text.match(/\*\*主操作按钮\*\*[：:]\s*「([^」]+)」/)
  const secondaryMatch = text.match(/\*\*次操作按钮\*\*[：:]\s*「([^」]+)」/)
  const userReplyMatch = text.match(/\*\*用户回显\*\*[：:]\s*([\s\S]*?)(?=\n\*\*[^*]+\*\*[：:]|$)/)
  const secondaryUserReplyMatch = text.match(/\*\*次操作用户回显\*\*[：:]\s*([\s\S]*?)(?=\n\*\*[^*]+\*\*[：:]|$)/)

  if (!primaryMatch) return undefined

  const displayContent = contentMatch
    ? contentMatch[1].split(/\s+\/\s+|[|、，,]/).map(s => s.trim()).filter(Boolean)
    : []

  return {
    type: typeMatch?.[1]?.trim() || '待确认事项',
    displayContent,
    displayMarkdown: contentMarkdownMatch?.[1]?.trim(),
    hideTitle: hideTitleMatch ? /^(是|true)$/i.test(hideTitleMatch[1]) : false,
    primaryButton: primaryMatch[1],
    secondaryButton: secondaryMatch?.[1],
    userReply: userReplyMatch?.[1]?.trim(),
    secondaryUserReply: secondaryUserReplyMatch?.[1]?.trim(),
  }
}

// ─── 步骤解析 ─────────────────────────────────────────────────────────────────

function parseSteps(flowSection: string): ParsedStep[] {
  // 按 "## 步骤 N：" 分割
  const stepParts = flowSection.split(/(?=^## 步骤 \d+[：:].+$)/m).filter(p => p.trim().startsWith('## 步骤'))

  return stepParts.map(part => {
    const titleMatch = part.match(/^## 步骤 (\d+)[：:]\s*(.+)$/m)
    if (!titleMatch) return null

    const number = parseInt(titleMatch[1], 10)
    const title = titleMatch[2].trim()
    const stepId = `step_${number}`

    const triggerSection = extractSection(part, '### 触发方式')
    // trigger 可能被 blockquote > 包裹
    const trigger = triggerSection.replace(/^>\s*/gm, '').trim()

    const agentLines = extractSection(part, '### AI 台词')

    const gateRaw = extractSection(part, '### 确认节点（可选）')
    const gateNode = parseGateNode(gateRaw)

    const buttonsRaw = extractSection(part, '### 操作按钮')
    const actionButtons = parseActionButtons(buttonsRaw)

    const artifactsRaw = extractSection(part, '### 生成物卡片')
    const generatedArtifacts = parseGeneratedArtifacts(artifactsRaw)

    const suggestionsRaw = extractSection(part, '### 推荐问题/下一步建议')
    const suggestedQuestions = parseSuggestedQuestions(suggestionsRaw)

    const panelDescription = extractTrailingSection(part, '### 右侧面板')

    return { number, stepId, title, trigger, agentLines, gateNode, actionButtons, generatedArtifacts, suggestedQuestions, panelDescription }
  }).filter(s => s !== null) as ParsedStep[]
}

// ─── 常见追问解析 ─────────────────────────────────────────────────────────────

function parseFAQ(faqSection: string): FAQItem[] {
  if (!faqSection.trim()) return []

  // 按 "## " 分割
  const parts = faqSection.split(/(?=^## .+$)/m).filter(p => p.trim().startsWith('## '))

  return parts.map(part => {
    const questionMatch = part.match(/^## (.+)$/m)
    if (!questionMatch) return null
    const question = questionMatch[1].trim()
    const answer = part.slice(part.indexOf('\n') + 1).trim()
    return { question, answer }
  }).filter((f): f is FAQItem => f !== null)
}

// ─── 主解析入口 ───────────────────────────────────────────────────────────────

export function parseBusinessDesign(markdown: string): ParsedBusinessDesign {
  // 1. 提取 frontmatter
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/)
  const meta = fmMatch ? parseFrontmatter(fmMatch[1]) : {
    scenarioName: '未命名场景',
    agentName: 'AI 助手',
    agentDescription: '',
    avatarColor: 'blue',
  }
  const body = fmMatch ? markdown.slice(fmMatch[0].length) : markdown

  // 2. 场景说明
  const descMatch = body.match(/# 场景说明\n+([\s\S]*?)(?=\n# |$)/)
  const description = descMatch ? descMatch[1].trim() : ''

  // 3. 交互流程（# 交互流程 存在时用它圈定范围，否则对整个 body 解析，兼容两种写法）
  const flowMatch = body.match(/# 交互流程\n+([\s\S]*?)(?=\n# |$)/)
  const steps = parseSteps(flowMatch ? flowMatch[1] : body)

  // 4. 常见追问
  const faqMatch = body.match(/# 常见追问\n+([\s\S]*)$/)
  const faq = faqMatch ? parseFAQ(faqMatch[1]) : []

  return { meta, description, steps, faq }
}
