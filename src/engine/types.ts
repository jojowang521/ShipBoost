// ============ 业务设计文档解析结果 ============

export interface BusinessDesignMeta {
  scenarioName: string
  agentName: string
  agentDescription: string
  avatarColor: string
}

export interface GateNode {
  type: string
  displayContent: string[]
  displayMarkdown?: string
  hideTitle?: boolean
  primaryButton: string
  secondaryButton?: string
  userReply?: string
  secondaryUserReply?: string
}

export interface StepButton {
  label: string
  sendText: string
  targetStep: number  // 目标步骤编号（1-indexed），0 表示重置
}

export interface GeneratedArtifact {
  title: string
  meta?: string
  icon?: string
}

export interface SuggestedQuestion {
  label: string
  sendText: string
}

export interface ParsedStep {
  number: number        // 步骤编号（1-indexed）
  stepId: string        // e.g. "step_1"
  title: string         // 步骤名称
  trigger: string       // 触发方式描述
  agentLines: string    // AI 台词（原始 markdown 文本）
  gateNode?: GateNode   // 确认节点（可选）
  actionButtons: StepButton[]
  generatedArtifacts: GeneratedArtifact[]
  suggestedQuestions: SuggestedQuestion[]
  panelDescription: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ParsedBusinessDesign {
  meta: BusinessDesignMeta
  description: string
  steps: ParsedStep[]
  faq: FAQItem[]
}
