import React, { useState, useCallback, type KeyboardEvent } from 'react'
import { useApp, useAppDispatch, useAppState } from '../shared/store/AppContext'
import { generateTaskTitle, genMessageId } from '../shared/utils'
import { AuditWorkspaceShell } from '../components/AuditWorkspaceShell'
import { getAgent, getAllAgents, getAllScenarios, getScenario } from '../scenarios/registry'
import type { ScenarioModule } from '../scenarios/types'
import { trackEvent } from '../shared/telemetry'

// ─── 场景意图识别 ──────────────────────────────────────────────────────────────
// 匹配优先级：场景名称 → AI专员简介 → step_1 触发方式关键词

function matchScenario(text: string, scenarios: ScenarioModule[]): ScenarioModule | null {
  if (scenarios.length === 0) return null
  if (scenarios.length === 1) return scenarios[0]  // 只有一个场景直接进入

  const lower = text.toLowerCase()

  // 1. 场景名称匹配（含子串）
  const byLabel = scenarios.find(s =>
    lower.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(lower.slice(0, 4))
  )
  if (byLabel) return byLabel

  // 2. AI 专员名称匹配，命中后进入该专员的第一个场景
  const byAgentName = scenarios.find(s =>
    s.agentName &&
    (lower.includes(s.agentName.toLowerCase()) || s.agentName.toLowerCase().includes(lower.slice(0, 4)))
  )
  if (byAgentName) return byAgentName

  // 3. AI专员简介关键词匹配
  const byDesc = scenarios.find(s => {
    const doc = (s as any)._doc
    const desc: string = s.agentDescription || doc?.meta?.agentDescription || doc?.description || ''
    return desc && lower.split(/[\s，。？！,?.!]+/).some(w => w.length >= 2 && desc.toLowerCase().includes(w))
  })
  if (byDesc) return byDesc

  // 4. step_1 触发方式关键词匹配
  const byTrigger = scenarios.find(s => {
    const doc = (s as any)._doc
    const trigger: string = doc?.steps?.[0]?.trigger || ''
    return trigger && lower.split(/[\s，。？！,?.!]+/).some(w => w.length >= 2 && trigger.toLowerCase().includes(w))
  })
  if (byTrigger) return byTrigger

  return null
}

// ─── 工作台视图（选中场景后） ──────────────────────────────────────────────────

function useScenarioPanelContent(phaseOverride?: string) {
  const { state, dispatch } = useApp()
  const scenario = getScenario(state.currentScenario)
  const phase = phaseOverride ?? state.phase

  const handleAskQuestion = (q: string) => {
    trackEvent('question_sent', {
      scenarioId: state.currentScenario,
      phase,
      source: 'panel',
      value: q,
    })
    dispatch({ type: 'SET_PENDING_QUESTION', question: q })
  }

  const panelTitle = scenario?.panelTitleMap?.[phase] ?? '内容预览'

  if (scenario && scenario.panelMap[phase]) {
    const PanelComponent = scenario.panelMap[phase]
    return {
      node: <PanelComponent onAskQuestion={handleAskQuestion} readonly={state.openPreviewReadonly} />,
      hasContent: true,
      panelTitle,
      panelFooter: null,
    }
  }

  return { node: null, hasContent: false, panelTitle: '内容预览', panelFooter: null }
}

export function AuditWorkspaceView({ onBack }: { onBack?: () => void } = {}) {
  const { state } = useApp()
  const [selectedArtifactPhase, setSelectedArtifactPhase] = useState<string | undefined>(undefined)

  const artifacts = React.useMemo(() => {
    const seen = new Set<string>()
    const result: Array<{ title: string; targetPhase: string }> = []
    for (const msg of state.messages) {
      const props = msg.component === 'PreviewTriggerCard' ? msg.componentProps
        : msg.appendedComponent === 'PreviewTriggerCard' ? msg.appendedComponentProps : null
      if (!props) continue
      const targetPhase = props.targetPhase as string
      if (!targetPhase || seen.has(targetPhase)) continue
      seen.add(targetPhase)
      result.push({ title: (props.title as string) || '内容预览', targetPhase })
    }
    return result
  }, [state.messages])

  const handleSelectArtifact = useCallback((targetPhase: string) => {
    trackEvent('preview_opened', {
      scenarioId: state.currentScenario,
      phase: state.phase,
      targetPhase,
      source: 'artifact_rail',
    })
    setSelectedArtifactPhase(targetPhase)
  }, [state.currentScenario, state.phase])

  const { node: panelContent, hasContent: hasPanelContent, panelTitle, panelFooter } =
    useScenarioPanelContent(selectedArtifactPhase)

  return (
    <AuditWorkspaceShell
      panelContent={panelContent}
      hasPanelContent={hasPanelContent}
      panelTitle={panelTitle}
      panelFooter={panelFooter}
      onBack={onBack}
      artifacts={artifacts}
      onSelectArtifact={handleSelectArtifact}
    />
  )
}

// ─── 首页（与 cost-ai-shell 结构对齐） ───────────────────────────────────────

export function WorkbenchPage() {
  const dispatch = useAppDispatch()
  const appState = useAppState()
  const scenarios = getAllScenarios()
  const agents = getAllAgents()
  const [text, setText] = useState('')

  // 首页展示的专员：由切换器选定（homeAgentId），否则默认第一个专员
  const homeAgent = (appState.homeAgentId
    ? getAgent(appState.homeAgentId)
    : null) ?? agents[0]
  const homeAgentName: string = homeAgent?.agentName || 'AI 助手'
  const agentDesc: string = homeAgent?.agentDescription || '选择下方场景开始演示'
  const homeAvatarKey: string = homeAgent?.avatarKey || 'avatar-ai-1'

  const enterScenario = (scenarioId: string, userText?: string) => {
    const scenario = getScenario(scenarioId)
    if (!scenario) return
    trackEvent('scenario_entered', {
      scenarioId,
      phase: scenario.phases[0] || 'step_1',
      label: scenario.label,
      source: userText ? 'user_input' : 'home',
      value: userText || scenario.label,
    })
    // 使用目标场景自己的专员名称和头像，而不是首页的默认值
    const scenarioAgentName: string = scenario.agentName || (scenario as any)?._doc?.meta?.agentName || scenario.label
    const avatarKey: string = scenario.avatarKey || 'avatar-ai-1'
    generateTaskTitle(scenario.label, dispatch)
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: genMessageId(),
        role: 'user',
        content: userText || scenario.label,
        timestamp: Date.now(),
      },
    })
    dispatch({ type: 'SET_CURRENT_SCENARIO', scenario: scenarioId, agentName: scenarioAgentName, avatarKey })
    dispatch({ type: 'SET_PHASE', phase: scenario.phases[0] || 'step_1' })
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')

    const target = matchScenario(trimmed, scenarios)
    if (target) {
      enterScenario(target.id, trimmed)
    } else {
      // 多场景下未命中意图：发用户气泡 + AI 引导选择场景
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'user', content: trimmed, timestamp: Date.now() },
      })
      const chipNames = agents.map(agent => `「${agent.agentName}」`).join('、')
      const replyId = genMessageId()
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: replyId, role: 'assistant', content: `您好！我可以帮助您完成以下任务：${chipNames}。请点击下方快捷入口，或告诉我您需要哪项服务。`, timestamp: Date.now() },
      })
      // 切换到工作台以显示对话（默认用第一个场景）
      const defaultScenario = scenarios[0]
      const defaultAgentName: string = defaultScenario?.agentName || (defaultScenario as any)?._doc?.meta?.agentName || defaultScenario?.label || 'AI 助手'
      const defaultAvatarKey: string = defaultScenario?.avatarKey || 'avatar-ai-1'
      dispatch({ type: 'SET_CURRENT_SCENARIO', scenario: defaultScenario?.id ?? '', agentName: defaultAgentName, avatarKey: defaultAvatarKey })
      // 切换到工作台视图，否则 phase 仍为 'home'，消息不可见
      if (defaultScenario?.phases?.[0]) {
        dispatch({ type: 'SET_PHASE', phase: defaultScenario.phases[0] })
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const homeChips = homeAgent?.homeChips || []

  const homeContent = (
    <div className="home-content">
      <div className="home-content__greeting-section">

        {/* 1. 方形头像 + 专员名称（并排） */}
        <div className="home-content__identity">
          <div className="home-content__avatar-square" style={{ overflow: 'hidden' }}>
            <img
              src={`/${homeAvatarKey}.png`}
              alt={homeAgentName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              draggable={false}
            />
          </div>
          <span className="home-content__agent-name">{homeAgentName}</span>
        </div>

        {/* 2. 一句话介绍 */}
        <p className="home-content__subtitle">{agentDesc}</p>

        {/* 3. 对话框 */}
        <div className="home-content__input-container">
          <div className="workbench-input-wrapper">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="workbench-textarea"
              placeholder="输入指令，或点击下方场景快捷键..."
              rows={3}
            />
            <div className="workbench-input-toolbar">
              <button
                className={`icon-btn send-btn${text.trim() ? ' active' : ''}`}
                onClick={handleSend}
                disabled={!text.trim()}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.6978 7.06938C12.5681 7.34552 12.3471 7.56441 12.0823 7.6961L2.07299 12.7099C1.36289 13.0545 0.505997 12.7735 0.14562 12.0832C-0.0130195 11.7498 -0.0451876 11.3736 0.0646303 11.0226L1.15932 7.48572C1.25954 7.16187 1.56094 6.94082 1.9023 6.94082H5.73337C6.01496 6.93969 6.24522 6.7139 6.25164 6.42659C6.24987 6.14372 6.02244 5.9151 5.73337 5.91235H1.90512C1.56241 5.91235 1.26015 5.68959 1.16105 5.36398L0.0808283 1.81452C-0.145184 1.07423 0.281458 0.284662 1.03641 0.0628915C1.38586 -0.046133 1.76388 -0.013046 2.08917 0.15932L12.0823 5.17312C12.7804 5.527 13.0614 6.3785 12.6978 7.06938Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 4. 首页快捷入口 — 展示默认快捷入口，并补齐所有可见场景 */}
        {homeChips.length > 0 && (
          <div className="workbench-suggestions">
            {homeChips.map(chip => (
              <button
                key={`${chip.scenarioId}-${chip.label}`}
                onClick={() => enterScenario(chip.scenarioId, chip.label)}
                className="suggestion-chip"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )

  return <AuditWorkspaceShell homeContent={homeContent} />
}
