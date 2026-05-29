import React from 'react'
import { parseBusinessDesign } from '../../engine/markdownParser'
import type { ParsedStep } from '../../engine/types'
import GenericPanel from '../../engine/components/GenericPanel'
import type { ButtonConfig, ScenarioContext, ScenarioModule } from '../types'
import { genMessageId, streamFakeText } from '../../shared/utils'
import CostAnalysisChoiceCard from './CostAnalysisChoiceCard'
import CostAnalysisReportPanel from './CostAnalysisReportPanel'
import businessDesignMarkdown from './business-design.md?raw'

const doc = parseBusinessDesign(businessDesignMarkdown)
const agentName = doc.meta.agentName
const agentAvatarKey = 'avatar-ai-1'

function findStep(phase: string): ParsedStep | undefined {
  return doc.steps.find(step => step.stepId === phase)
}

function getPreviewMeta(step: ParsedStep): { title: string; meta?: string } {
  const match = step.panelDescription.match(/^\*\*工作台卡片[：:]\s*([^*]+)\*\*\s*\n+\s*([^\n]+)/)
  if (!match) return { title: `${step.title} — 内容预览` }

  return {
    title: match[1].trim(),
    meta: match[2].trim(),
  }
}

function stripPreviewMeta(description: string): string {
  return description
    .replace(/^\*\*工作台卡片[：:]\s*([^*]+)\*\*\s*\n+\s*([^\n]+)\s*\n+/, '')
    .trim()
}

function hasPanelDescription(step: ParsedStep): boolean {
  const description = step.panelDescription.trim()
  return description !== '' && !description.startsWith('暂无')
}

function streamAssistant(text: string, dispatch: ScenarioContext['dispatch'], onComplete?: () => void) {
  if (!text.trim()) {
    onComplete?.()
    return
  }

  const msgId = genMessageId()
  dispatch({
    type: 'ADD_MESSAGE',
    message: {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      agentName,
      agentAvatarKey,
    },
  })
  streamFakeText(text, msgId, dispatch, onComplete)
}

function playStepOne(ctx: ScenarioContext) {
  const intro = '我来帮您分析公司上半年的成本情况。为了让报告更贴近您的关注点，请先确认分析维度和核心指标。'
  streamAssistant(intro, ctx.dispatch, () => {
    ctx.dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: genMessageId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        agentName,
        agentAvatarKey,
        component: 'CostAnalysisChoiceCard' as any,
      },
    })
  })
}

function playStepWithPreview(step: ParsedStep, ctx: ScenarioContext) {
  streamAssistant(step.agentLines, ctx.dispatch, () => {
    if (!hasPanelDescription(step)) return
    const preview = getPreviewMeta(step)
    ctx.dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: genMessageId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        agentName,
        agentAvatarKey,
        component: 'PreviewTriggerCard' as any,
        componentProps: {
          title: preview.title,
          meta: preview.meta,
          targetPhase: step.stepId,
        },
      },
    })
  })
}

function findNextPhase(currentPhase: string): string {
  const idx = doc.steps.findIndex(step => step.stepId === currentPhase)
  if (idx === -1 || idx >= doc.steps.length - 1) return 'complete'
  return doc.steps[idx + 1].stepId
}

function handleFaq(text: string, ctx: ScenarioContext): boolean {
  const matched = doc.faq.find(f =>
    f.question !== '与任务无关的问题' &&
    (text.includes(f.question.slice(0, 6)) || f.question.includes(text.slice(0, 6)))
  )
  if (!matched) return false
  streamAssistant(matched.answer, ctx.dispatch)
  return true
}

const panelMap: Record<string, React.ComponentType<any>> = {}
const panelTitleMap: Record<string, string> = {}

for (const step of doc.steps) {
  if (!hasPanelDescription(step)) continue
  const description = stripPreviewMeta(step.panelDescription)
  const preview = getPreviewMeta(step)
  panelMap[step.stepId] = (props: any) => {
    if (step.stepId === 'step_2') {
      return React.createElement(CostAnalysisReportPanel, { ...props, description, title: preview.title })
    }
    return React.createElement(GenericPanel, { ...props, description, title: preview.title })
  }
  panelTitleMap[step.stepId] = preview.title
}

const scenario: ScenarioModule = {
  id: 'cost-query__company-h1-cost-analysis',
  label: doc.meta.scenarioName,
  phases: [...doc.steps.map(step => step.stepId), 'complete'],
  avatarKey: agentAvatarKey,
  initialState: {},
  chatVisibleComponents: ['CostAnalysisChoiceCard', 'PreviewTriggerCard'],
  extraComponentMap: {
    CostAnalysisChoiceCard,
  },
  homeChips: [{ label: '上半年成本分析', scenarioId: 'cost-query__company-h1-cost-analysis' }],
  panelMap,
  panelTitleMap,

  onPhaseEnter(phase, ctx) {
    if (phase === 'step_1') {
      playStepOne(ctx)
      return
    }

    const step = findStep(phase)
    if (step) playStepWithPreview(step, ctx)
  },

  handleSend(text, ctx) {
    ctx.dispatch({
      type: 'ADD_MESSAGE',
      message: { id: genMessageId(), role: 'user', content: text, timestamp: Date.now() },
    })

    if (handleFaq(text, ctx)) return

    const currentStep = findStep(ctx.stateRef.current.phase as string)
    const matchedBtn = currentStep?.actionButtons.find(btn =>
      text.includes(btn.label) || btn.label.includes(text.slice(0, 4))
    )
    if (matchedBtn) {
      const targetPhase = matchedBtn.targetStep > 0
        ? `step_${matchedBtn.targetStep}`
        : findNextPhase(ctx.stateRef.current.phase as string)
      ctx.dispatch({ type: 'SET_PHASE', phase: targetPhase })
      return
    }

    const fallback = doc.faq.find(f => f.question === '与任务无关的问题')
    streamAssistant(fallback?.answer || '请继续当前任务，有问题随时提问。', ctx.dispatch)
  },

  handleComponentAction(action, payload, ctx) {
    if (action === 'costAnalysisConfirm') {
      const messageId = payload.messageId as string
      const dimension = (payload.dimension as string) || '按科目穿透'
      const metric = (payload.metric as string) || '建面单方'
      if (messageId) {
        ctx.dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
      }
      ctx.dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: genMessageId(),
          role: 'user',
          content: `${dimension}，重点看${metric}`,
          timestamp: Date.now(),
        },
      })
      ctx.dispatch({ type: 'SET_PHASE', phase: 'step_2' })
      return
    }
  },

  actionButtonsMap(phase, isStreaming): ButtonConfig[] | null {
    if (isStreaming || phase === 'home' || phase === 'complete' || phase === 'step_1') return null
    const step = findStep(phase)
    if (!step || step.actionButtons.length === 0) return null
    return step.actionButtons.map((btn, idx) => ({
      label: btn.label,
      value: btn.label,
      variant: idx === 0 ? 'primary' : 'outline',
    }))
  },
}

export default scenario
