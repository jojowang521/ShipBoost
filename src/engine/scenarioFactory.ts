import type { ParsedBusinessDesign, ParsedStep } from './types'
import type { ScenarioModule, ScenarioContext, ButtonConfig } from '../scenarios/types'
import { genMessageId, streamFakeText } from '../shared/utils'
import GenericPanel from './components/GenericPanel'
import GenericGateCard from './components/GenericGateCard'

// ─── phase 推导 ───────────────────────────────────────────────────────────────

function toPhaseId(step: ParsedStep): string {
  return step.stepId
}

function findStep(steps: ParsedStep[], phase: string): ParsedStep | undefined {
  return steps.find(s => s.stepId === phase)
}

function findNextPhase(steps: ParsedStep[], currentPhase: string): string {
  const idx = steps.findIndex(s => s.stepId === currentPhase)
  if (idx === -1 || idx >= steps.length - 1) return 'complete'
  return steps[idx + 1].stepId
}

// ─── 判断步骤是否为自动触发（无需等待用户输入） ──────────────────────────────
// 触发方式字段含"自动"或为空 → 进入步骤后直接播放 AI 台词
// 否则 → 发送引导语后等待用户输入，用户任意输入再播放 AI 台词

function isAutoTrigger(step: ParsedStep): boolean {
  return step.trigger.trim() === '' || step.trigger.includes('自动')
}

// ─── 核心辅助：播放步骤 AI 台词 + 在流式结束后挂载卡片 ────────────────────────
// 这是唯一负责"说台词+挂卡片"的地方，onPhaseEnter / handleSend 都复用它

function playStepResponse(step: ParsedStep, dispatch: ScenarioContext['dispatch']): void {
  if (!step.agentLines.trim()) return

  const msgId = genMessageId()
  dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })

  const hasPanel =
    step.panelDescription.trim() !== '' &&
    !step.panelDescription.trim().startsWith('暂无')

  const afterStream = () => {
    if (step.gateNode) {
      // 有确认节点 → GateCard（含按钮），不再叠加 PreviewTriggerCard
      const gateId = genMessageId()
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: gateId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          component: 'GenericGateCard' as any,
          componentProps: { gateNode: step.gateNode, stepId: step.stepId },
        },
      })
    } else if (hasPanel) {
      // 无确认节点但有面板内容 → PreviewTriggerCard，用户点击后打开右侧面板
      const preview = getPreviewMeta(step)
      const triggerId = genMessageId()
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: triggerId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          component: 'PreviewTriggerCard' as any,
          componentProps: {
            title: preview.title,
            meta: preview.meta,
            targetPhase: step.stepId,
          },
        },
      })
    }
  }

  streamFakeText(step.agentLines, msgId, dispatch, afterStream)
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

// ─── onPhaseEnter：进入阶段时决定"直接播台词"还是"发引导语等待用户" ─────────────

function onPhaseEnterForDesign(
  phase: string,
  ctx: ScenarioContext,
  doc: ParsedBusinessDesign,
): void {
  const step = findStep(doc.steps, phase)
  if (!step) return

  const { dispatch } = ctx

  if (isAutoTrigger(step)) {
    // 自动触发：直接播放 AI 台词
    playStepResponse(step, dispatch)
  } else {
    // 等待模式：发送触发方式字段的引导语，等待用户输入
    if (step.trigger.trim()) {
      const msgId = genMessageId()
      dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })
      streamFakeText(step.trigger, msgId, dispatch)
    }
  }
}

// ─── handleSend：用户发送消息时的处理链路 ─────────────────────────────────────
// 优先级：FAQ 匹配 → 操作按钮关键词匹配 → 等待模式触发 AI 台词 → 兜底

function handleSendForDesign(
  text: string,
  ctx: ScenarioContext,
  doc: ParsedBusinessDesign,
): void {
  const { dispatch, stateRef } = ctx
  const phase = stateRef.current.phase as string

  // 记录用户消息
  dispatch({
    type: 'ADD_MESSAGE',
    message: { id: genMessageId(), role: 'user', content: text, timestamp: Date.now() },
  })

  // 优先级 1：FAQ 关键词匹配 → 直接回复，不推进步骤
  const matched = doc.faq.find(f =>
    f.question !== '与任务无关的问题' &&
    (text.includes(f.question.slice(0, 6)) || f.question.includes(text.slice(0, 6)))
  )
  if (matched) {
    const msgId = genMessageId()
    dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })
    streamFakeText(matched.answer, msgId, dispatch)
    return
  }

  // 优先级 2：操作按钮关键词匹配 → 推进到目标步骤（onPhaseEnter 接手后续）
  const currentStep = findStep(doc.steps, phase)
  const matchedBtn = currentStep?.actionButtons.find(b =>
    text.includes(b.label) || b.label.includes(text.slice(0, 4))
  )
  if (matchedBtn && currentStep) {
    const targetPhase = matchedBtn.targetStep > 0
      ? `step_${matchedBtn.targetStep}`
      : findNextPhase(doc.steps, phase)
    dispatch({ type: 'SET_PHASE', phase: targetPhase })
    return
  }

  // 优先级 3：当前步骤处于"等待用户输入"模式 → 用户任意发消息即触发 AI 台词
  if (currentStep && !isAutoTrigger(currentStep)) {
    playStepResponse(currentStep, dispatch)
    return
  }

  // 优先级 4：兜底回复
  const fallback = doc.faq.find(f => f.question === '与任务无关的问题')
  const msgId = genMessageId()
  dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })
  streamFakeText(
    fallback?.answer || '请继续当前任务，有问题随时提问。',
    msgId,
    dispatch,
  )
}

// ─── handleComponentAction ────────────────────────────────────────────────────

function handleComponentActionForDesign(
  action: string,
  payload: Record<string, unknown>,
  ctx: ScenarioContext,
  doc: ParsedBusinessDesign,
): void {
  const { dispatch, stateRef } = ctx

  if (action === 'confirmGate') {
    const messageId = payload.messageId as string
    if (messageId) {
      dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
    }
    // 添加用户确认气泡（显示用户点击了哪个按钮）
    const currentPhase = stateRef.current.phase as string
    const currentStep = findStep(doc.steps, currentPhase)
    if (currentStep?.gateNode?.primaryButton) {
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: genMessageId(),
          role: 'user',
          content: currentStep.gateNode.primaryButton,
          timestamp: Date.now(),
        },
      })
    }
    const nextPhase = findNextPhase(doc.steps, currentPhase)
    dispatch({ type: 'SET_PHASE', phase: nextPhase })
    return
  }

  if (action === 'cancelGate') {
    // 次操作按钮：标记卡片已处理但不推进步骤，兜底回复
    const messageId = payload.messageId as string
    if (messageId) {
      dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
    }
    const currentPhase = stateRef.current.phase as string
    const currentStep = findStep(doc.steps, currentPhase)
    if (currentStep?.gateNode?.secondaryButton) {
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: genMessageId(),
          role: 'user',
          content: currentStep.gateNode.secondaryButton,
          timestamp: Date.now(),
        },
      })
    }
    const msgId = genMessageId()
    dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })
    streamFakeText('好的，请告诉我需要修改哪些审查重点，我将重新配置后继续。', msgId, dispatch)
    return
  }

  if (action === 'actionButton') {
    const targetStep = payload.targetStep as number
    const targetPhase = targetStep > 0 ? `step_${targetStep}` : 'complete'
    dispatch({ type: 'SET_PHASE', phase: targetPhase })
    return
  }

  if (action === 'selectScenario') {
    const scenarioId = payload.scenario as string
    dispatch({ type: 'SET_CURRENT_SCENARIO', scenario: scenarioId, agentName: doc.meta.agentName })
    dispatch({ type: 'SET_PHASE', phase: doc.steps[0]?.stepId || 'step_1' })
  }
}

// ─── actionButtonsMap ─────────────────────────────────────────────────────────

function actionButtonsMapForDesign(
  phase: string,
  isStreaming: boolean,
  doc: ParsedBusinessDesign,
): ButtonConfig[] | null {
  if (isStreaming) return null
  if (phase === 'complete' || phase === 'home') return null

  const step = findStep(doc.steps, phase)
  if (!step || step.actionButtons.length === 0) return null

  // 有确认节点时由 GateCard 内部的按钮组负责，底部不重复渲染
  if (step.gateNode) return null

  return step.actionButtons.map((btn, idx) => ({
    label: btn.label,
    value: btn.label,
    variant: idx === 0 ? 'primary' : 'outline',
  }))
}

// ─── 主工厂函数 ───────────────────────────────────────────────────────────────

export function createScenarioFromDesign(
  id: string,
  doc: ParsedBusinessDesign,
): ScenarioModule {
  const phases = [...doc.steps.map(toPhaseId), 'complete']

  const panelMap: Record<string, React.ComponentType<any>> = {}
  for (const step of doc.steps) {
    const description = stripPreviewMeta(step.panelDescription)
    const preview = getPreviewMeta(step)
    panelMap[step.stepId] = (props: any) => GenericPanel({ ...props, description, title: preview.title })
  }

  const panelTitleMap: Record<string, string> = {}
  for (const step of doc.steps) {
    const preview = getPreviewMeta(step)
    panelTitleMap[step.stepId] = preview.title
  }

  const extraComponentMap: Record<string, React.ComponentType<any>> = {
    GenericGateCard,
  }

  // 首页快捷入口只展示场景名；步骤操作按钮进入对话后再展示。
  const homeChips = [{ label: doc.meta.scenarioName, scenarioId: id }]

  return {
    id,
    label: doc.meta.scenarioName,
    phases,
    initialState: {},
    chatVisibleComponents: ['GenericGateCard', 'PreviewTriggerCard'],
    extraComponentMap,
    homeChips,
    _doc: doc,

    handleSend: (text, ctx) => handleSendForDesign(text, ctx, doc),

    handleComponentAction: (action, payload, ctx) =>
      handleComponentActionForDesign(action, payload, ctx, doc),

    panelMap,
    panelTitleMap,

    actionButtonsMap: (phase, isStreaming) =>
      actionButtonsMapForDesign(phase, isStreaming, doc),

    onPhaseEnter: (phase, ctx) => onPhaseEnterForDesign(phase, ctx, doc),
  }
}
