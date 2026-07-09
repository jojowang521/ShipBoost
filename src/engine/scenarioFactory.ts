import type { ParsedBusinessDesign, ParsedStep } from './types'
import React from 'react'
import type { ScenarioModule, ScenarioContext, ButtonConfig } from '../scenarios/types'
import { genMessageId, streamFakeText } from '../shared/utils'
import GenericPanel from './components/GenericPanel'
import GenericGateCard from './components/GenericGateCard'
import TabbedArtifactPanel from './components/TabbedArtifactPanel'
import StandardControlPriceWorkbench from './components/StandardControlPriceWorkbench'

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

function normalizeTriggerText(text: string): string {
  return text.replace(/\s+/g, '').trim()
}

function triggerMatchesUserText(trigger: string, userText: string): boolean {
  const normalizedUserText = normalizeTriggerText(userText)
  if (!normalizedUserText) return false

  const quotedTriggers = Array.from(trigger.matchAll(/「([^」]+)」/g)).map(match => normalizeTriggerText(match[1]))
  const candidates = quotedTriggers.length > 0 ? quotedTriggers : [normalizeTriggerText(trigger)]
  return candidates.some(candidate => {
    if (!candidate) return false
    if (/^\d+$/.test(candidate)) {
      return normalizedUserText === candidate ||
        normalizedUserText === `选择${candidate}` ||
        normalizedUserText === `序号${candidate}`
    }
    return normalizedUserText.includes(candidate) || candidate.includes(normalizedUserText.slice(0, 8))
  })
}

function findTriggeredStep(steps: ParsedStep[], currentPhase: string, userText: string): ParsedStep | undefined {
  const currentIndex = steps.findIndex(step => step.stepId === currentPhase)
  const laterSteps = currentIndex >= 0 ? steps.slice(currentIndex + 1) : steps
  const laterMatch = laterSteps.find(step => triggerMatchesUserText(step.trigger, userText))
  if (laterMatch) return laterMatch

  return steps.find(step => triggerMatchesUserText(step.trigger, userText))
}

// ─── 判断步骤是否为自动触发（无需等待用户输入） ──────────────────────────────
// 触发方式字段含"自动"或为空 → 进入步骤后直接播放 AI 台词
// 否则 → 发送引导语后等待用户输入，用户任意输入再播放 AI 台词

function isAutoTrigger(step: ParsedStep): boolean {
  return step.trigger.trim() === '' || step.trigger.includes('自动')
}

function stripAssistantNamePrefix(text: string): string {
  return text.replace(/^\s*(?:[\u4e00-\u9fa5A-Za-z0-9_\s]{1,24}(?:助手|专员)|AI)\s*[：:]\s*/, '')
}

// ─── 核心辅助：播放步骤 AI 台词 + 在流式结束后挂载卡片 ────────────────────────
// 这是唯一负责"说台词+挂卡片"的地方，onPhaseEnter / handleSend 都复用它

const playedStepResponseKeys = new Set<string>()

function getStepResponseKey(step: ParsedStep, ctx: ScenarioContext): string {
  const state = ctx.stateRef.current
  const firstUserMessage = state.messages?.find((msg: any) => msg.role === 'user')
  const sessionKey = firstUserMessage?.id || firstUserMessage?.timestamp || 'no-session'
  return `${state.currentScenario || 'unknown'}:${sessionKey}:${step.stepId}`
}

function hasRenderedStepResponse(step: ParsedStep, ctx: ScenarioContext): boolean {
  const messages = ctx.stateRef.current.messages ?? []
  const expectedText = normalizeTriggerText(stripAssistantNamePrefix(step.agentLines)).slice(0, 24)
  const hasResponseText = expectedText.length > 0 && messages.some((message: any) =>
    message.role === 'assistant' &&
    normalizeTriggerText(message.content || '').includes(expectedText)
  )
  if (hasResponseText) return true

  const hasGeneratedArtifact = step.generatedArtifacts.some(artifact =>
    messages.some((message: any) =>
      message.component === 'PreviewTriggerCard' &&
      message.componentProps?.targetPhase === step.stepId &&
      message.componentProps?.title === artifact.title
    )
  )
  if (hasGeneratedArtifact) return true

  return Boolean(step.gateNode && messages.some((message: any) =>
    message.component === 'GenericGateCard' &&
    message.componentProps?.stepId === step.stepId
  ))
}

function playStepResponse(step: ParsedStep, ctx: ScenarioContext): void {
  if (!step.agentLines.trim()) return
  const responseKey = getStepResponseKey(step, ctx)
  if (playedStepResponseKeys.has(responseKey)) return
  if (hasRenderedStepResponse(step, ctx)) {
    playedStepResponseKeys.add(responseKey)
    return
  }
  playedStepResponseKeys.add(responseKey)

  const { dispatch } = ctx
  const msgId = genMessageId()
  dispatch({ type: 'ADD_MESSAGE', message: { id: msgId, role: 'assistant', content: '', timestamp: Date.now() } })

  const hasPanel = hasPanelDescription(step)

  const afterStream = () => {
    if (step.suggestedQuestions.length > 0) {
      dispatch({
        type: 'UPDATE_MESSAGE',
        id: msgId,
        updates: {
          suggestionCards: step.suggestedQuestions.map(item => ({
            label: item.label,
            sendText: item.sendText,
          })),
        },
      })
    }

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
    } else if (step.generatedArtifacts.length > 0) {
      for (const artifact of step.generatedArtifacts) {
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
              title: artifact.title,
              meta: artifact.meta,
              icon: artifact.icon,
              targetPhase: step.stepId,
            },
          },
        })
      }
      if (hasPanel) {
        dispatch({ type: 'RESET_OPEN_PREVIEW' })
      }
    }
  }

  streamFakeText(stripAssistantNamePrefix(step.agentLines), msgId, dispatch, afterStream)
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
  return description !== '' && description !== '---' && !description.startsWith('暂无')
}

function isControlPriceWorkbench(step: ParsedStep): boolean {
  const marker = `${step.title}\n${step.panelDescription}\n${step.generatedArtifacts.map(item => item.title).join('\n')}`
  return marker.includes('控制价审核') || marker.includes('招标控制价') || marker.includes('组价')
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
    playStepResponse(step, ctx)
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

  // 优先级 1：当前步骤操作按钮关键词匹配 → 推进到目标步骤（onPhaseEnter 接手后续）
  const currentStep = findStep(doc.steps, phase)
  const matchedBtn = currentStep?.actionButtons.find(b =>
    text.includes(b.label) ||
    b.label.includes(text.slice(0, 4)) ||
    text.includes(b.sendText) ||
    b.sendText.includes(text.slice(0, 4))
  )
  if (matchedBtn && currentStep) {
    const targetPhase = matchedBtn.targetStep > 0
      ? `step_${matchedBtn.targetStep}`
      : findNextPhase(doc.steps, phase)
    dispatch({ type: 'SET_PHASE', phase: targetPhase })
    return
  }

  const triggeredStep = findTriggeredStep(doc.steps, phase, text)
  if (triggeredStep) {
    dispatch({ type: 'SET_PHASE', phase: triggeredStep.stepId })
    return
  }

  // 优先级 2：FAQ 关键词匹配 → 直接回复，不推进步骤
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

  // 优先级 3：当前步骤处于"等待用户输入"模式 → 用户任意发消息即触发 AI 台词
  if (currentStep && !isAutoTrigger(currentStep)) {
    playStepResponse(currentStep, ctx)
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
      const label = (payload.label as string) || currentStep.gateNode.primaryButton
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: genMessageId(),
          role: 'user',
          content: label,
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
      const label = (payload.label as string) || currentStep.gateNode.secondaryButton
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: genMessageId(),
          role: 'user',
          content: label,
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
    value: btn.sendText,
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
    if (!hasPanelDescription(step)) continue
    const description = stripPreviewMeta(step.panelDescription)
    const preview = getPreviewMeta(step)
    if (isControlPriceWorkbench(step)) {
      const ControlPricePanel = (props: any) => (
        React.createElement(StandardControlPriceWorkbench, { ...props, description, artifacts: step.generatedArtifacts })
      )
      ;(ControlPricePanel as any).hasInternalClose = true
      panelMap[step.stepId] = ControlPricePanel
    } else if (step.generatedArtifacts.length > 1) {
      const ArtifactPanel = (props: any) => (
        React.createElement(TabbedArtifactPanel, { ...props, description, artifacts: step.generatedArtifacts })
      )
      ;(ArtifactPanel as any).hasInternalClose = true
      panelMap[step.stepId] = ArtifactPanel
    } else {
      panelMap[step.stepId] = (props: any) => (
        React.createElement(GenericPanel, { ...props, description, title: preview.title })
      )
    }
  }

  const panelTitleMap: Record<string, string> = {}
  for (const step of doc.steps) {
    if (!hasPanelDescription(step)) continue
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
