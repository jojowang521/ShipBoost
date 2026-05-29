import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from 'react'
import { Box } from 'lucide-react'
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

const QUICK_ICON_BY_KEYWORD: Array<{ keyword: string; src: string }> = [
  { keyword: '硬景', src: '/aui-native/icons/query-hardscape.svg' },
  { keyword: '标底', src: '/aui-native/icons/review-control-price.svg' },
  { keyword: '控制价', src: '/aui-native/icons/review-control-price.svg' },
  { keyword: '清单', src: '/aui-native/icons/list-indicator-analysis.svg' },
  { keyword: '钢筋', src: '/aui-native/icons/rebar-history-compare.svg' },
  { keyword: '历史', src: '/aui-native/icons/rebar-history-compare.svg' },
]

function getQuickIcon(label: string): string | null {
  return QUICK_ICON_BY_KEYWORD.find(item => label.includes(item.keyword))?.src ?? null
}

interface NativeHomeChip {
  label: string
  scenarioId: string | null
}

const NATIVE_HOME_PLACEHOLDER_CHIPS: NativeHomeChip[] = [
  { label: '查下武汉项目的硬景指标', scenarioId: null },
  { label: '审核控制价标底文件', scenarioId: null },
  { label: '清单指标分析', scenarioId: null },
  { label: '对比历史项目的钢筋含量', scenarioId: null },
]

function getNativeHomeChips(agent: ReturnType<typeof getAgent> | undefined): NativeHomeChip[] {
  const scenariosForAgent = agent?.scenarios || []
  if (scenariosForAgent.length > 0) {
    const realChips = scenariosForAgent.slice(0, 4).map(scenario => ({
      label: scenario.shortcutLabel || scenario.label,
      scenarioId: scenario.id,
    }))
    const placeholders = NATIVE_HOME_PLACEHOLDER_CHIPS
      .filter(placeholder => !realChips.some(chip => chip.label === placeholder.label))
      .map(placeholder => ({ ...placeholder }))
    return [...realChips, ...placeholders].slice(0, 4)
  }
  return agent?.homeChips || []
}

function getEmptyScenarioReply() {
  return '当前模板还没有配置演示场景。请先新增一个业务场景后再开始演示。'
}

interface NativeAssistantOption {
  agentId: string
  agentName: string
  agentDescription: string
  avatarKey: string
}

type AgentModalState = 'closed' | 'opening' | 'open' | 'closing'

const NATIVE_ASSISTANT_OPTIONS: NativeAssistantOption[] = [
  {
    agentId: 'cost-assistant',
    agentName: '价格库助手',
    agentDescription: '沉淀材料、人工、机械等成本价格库，支持历史均价查询、价格趋势查看和基础口径维护。',
    avatarKey: 'cost_assistant',
  },
  {
    agentId: 'bill-assistant',
    agentName: '账单助手',
    agentDescription: '匹配增值税发票与采购单，一键对账供应商应付款，让财务清算从手工变自动。',
    avatarKey: 'bill_assistant',
  },
  {
    agentId: 'smart-cost-assistant',
    agentName: '智能成本助手',
    agentDescription: '面向成本审核场景，综合历史项目、供应商报价和基准指标，识别异常价格并生成审核建议。',
    avatarKey: 'smart_cost_assistant',
  },
  {
    agentId: 'tender-assistant',
    agentName: '采招助手',
    agentDescription: '上传采购清单PDF/图片，智能识别物料/数量/规格/价格，一键转化为可编辑表格直接入库。',
    avatarKey: 'tender_assistant',
  },
  {
    agentId: 'data-assistant',
    agentName: '数据助手',
    agentDescription: '自动检测采购数据异常值和格式错误，一键修复或智能补全，确保入库数据质量≥99.8%。',
    avatarKey: 'data_assistant',
  },
  {
    agentId: 'project-cost-assistant',
    agentName: '项目动态助手',
    agentDescription: '围绕单项目成本执行，跟踪目标成本、合同金额、变更签证和动态成本偏差，辅助项目预警。',
    avatarKey: 'project_cost_assistant',
  },
  {
    agentId: 'cost-qa-assistant',
    agentName: '成本问答官助手',
    agentDescription: '智能提炼业务痛点，快采购成本知识库AI智能问答，秒级回答采购人员的成本问题。',
    avatarKey: 'cost_qa_assistant',
  },
  {
    agentId: 'procurement-compliance-assistant',
    agentName: '采购合规官助手',
    agentDescription: '合同智能解读、围标风险拦截、供应商资质检查、廉政风险预警，四层合规检查一体。',
    avatarKey: 'procurement_assistant',
  },
]

const NATIVE_ASSISTANT_TABS = ['全部', '资产管理', '租赁管理', '工程管理', '销售管理']

function nativeAvatarSrc(avatarKey: string): string {
  const map: Record<string, string> = {
    smart_cost_assistant: '/aui-native/avatars/smart-cost-assistant.png',
    data_assistant: '/aui-native/avatars/data-assistant.png',
    bill_assistant: '/aui-native/avatars/bill-assistant.png',
    procurement_assistant: '/aui-native/avatars/procurement-compliance-assistant.png',
    cost_assistant: '/aui-native/avatars/cost-assistant.png',
    tender_assistant: '/aui-native/avatars/tender-assistant.png',
    cost_qa_assistant: '/aui-native/avatars/cost-qa-assistant.png',
    project_cost_assistant: '/aui-native/avatars/project-cost-assistant.png',
    'avatar-ai-1': '/aui-native/avatars/smart-cost-assistant.png',
    'avatar-ai-2': '/aui-native/avatars/data-assistant.png',
    'avatar-ai-3': '/aui-native/avatars/bill-assistant.png',
    'avatar-ai-4': '/aui-native/avatars/procurement-compliance-assistant.png',
  }
  return map[avatarKey] || map['avatar-ai-1']
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
  const [agentModalState, setAgentModalState] = useState<AgentModalState>('closed')
  const modalTimerRef = useRef<number | null>(null)

  // 首页展示的专员：由切换器选定（homeAgentId），否则默认第一个专员
  const homeAgent = (appState.homeAgentId
    ? getAgent(appState.homeAgentId)
    : null) ?? agents[0]
  const homeAgentName: string = homeAgent?.agentName || 'AI 助手'
  const agentDesc: string = homeAgent?.agentDescription || '选择下方场景开始演示'
  const homeAvatarKey: string = homeAgent?.avatarKey || 'avatar-ai-1'

  const clearModalTimer = useCallback(() => {
    if (modalTimerRef.current !== null) {
      window.clearTimeout(modalTimerRef.current)
      modalTimerRef.current = null
    }
  }, [])

  const openAgentModal = useCallback(() => {
    clearModalTimer()
    setAgentModalState('opening')
    modalTimerRef.current = window.setTimeout(() => {
      setAgentModalState('open')
      modalTimerRef.current = null
    }, 250)
  }, [clearModalTimer])

  const closeAgentModal = useCallback(() => {
    clearModalTimer()
    setAgentModalState('closing')
    modalTimerRef.current = window.setTimeout(() => {
      setAgentModalState('closed')
      modalTimerRef.current = null
    }, 200)
  }, [clearModalTimer])

  useEffect(() => () => clearModalTimer(), [clearModalTimer])

  useEffect(() => {
    if (agentModalState === 'closed') return

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeAgentModal()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [agentModalState, closeAgentModal])

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

    if (scenarios.length === 0) {
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'user', content: trimmed, timestamp: Date.now() },
      })
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'assistant', content: getEmptyScenarioReply(), timestamp: Date.now() },
      })
      return
    }

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

  const homeChips = getNativeHomeChips(homeAgent)

  const homeContent = (
    <div className="home-content">
      <div className="home-content__greeting-section">

        {/* 1. 方形头像 + 专员名称（并排） */}
        <div className="home-content__identity">
          <div className="home-content__avatar-square" style={{ overflow: 'hidden' }}>
            <img
              src={nativeAvatarSrc(homeAvatarKey)}
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
          <div className="workbench-input-wrapper home-composer">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="workbench-textarea"
              placeholder="请输入您的问题，例如：审核数据"
              rows={3}
            />
            <div className="workbench-input-toolbar">
              <div className="home-composer__left-actions">
                <button type="button" className="home-tool-btn" aria-label="技能">
                  <img src="/aui-native/icons/skill.svg" alt="" />
                </button>
                <button type="button" className="home-tool-btn" aria-label="附件">
                  <img src="/aui-native/icons/attachment.svg" alt="" />
                </button>
                <span className="home-composer__divider" aria-hidden="true" />
                <button
                  type="button"
                  className="home-agent-switch"
                  onClick={openAgentModal}
                  aria-haspopup="dialog"
                  aria-expanded={agentModalState !== 'closed'}
                >
                  <span>{homeAgentName}</span>
                  <img src="/aui-native/icons/switch-agent.svg" alt="" />
                </button>
              </div>
              <button
                className={`icon-btn send-btn home-send-btn${text.trim() ? ' active' : ''}`}
                onClick={handleSend}
                disabled={!text.trim()}
                aria-label="发送"
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
                key={`${chip.scenarioId || 'placeholder'}-${chip.label}`}
                onClick={() => {
                  if (chip.scenarioId) enterScenario(chip.scenarioId, chip.label)
                }}
                className="suggestion-chip"
              >
                {getQuickIcon(chip.label) ? (
                  <img src={getQuickIcon(chip.label)!} alt="" />
                ) : (
                  <Box size={16} strokeWidth={1.8} />
                )}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        <section className="home-practice" aria-label="最佳实践">
          <div className="home-practice__head">
            <h2>最佳实践</h2>
            <button type="button">
              <img src="/aui-native/icons/change.svg" alt="" />
              <span>换一换</span>
            </button>
          </div>
          <div className="home-practice__cards">
            <article className="home-practice-card">
              <div className="home-practice-card__thumb">
                <img src="/aui-native/smart-audit-summary.svg" alt="智能审核概要" />
              </div>
              <div className="home-practice-card__copy">
                <h3>控制价标底智能审核</h3>
                <p>自动识别清单结构，对标历史项目，定位量价异常并生成审核报告。</p>
              </div>
            </article>
            <article className="home-practice-card">
              <div className="home-practice-card__thumb">
                <img src="/aui-native/smart-price-recommend.svg" alt="智能比价推荐" />
              </div>
              <div className="home-practice-card__copy">
                <h3>多供应商清标比价</h3>
                <p>批量解析供应商报价，检查缺项、雷同与异常偏差，输出比价报告。</p>
              </div>
            </article>
            <article className="home-practice-card">
              <div className="home-practice-card__thumb">
                <img src="/aui-native/history-project-average.svg" alt="历史项目均价" />
              </div>
              <div className="home-practice-card__copy">
                <h3>项目成本指标问数</h3>
                <p>用自然语言查询历史项目指标，完成项目对比和差异归因分析。</p>
              </div>
            </article>
          </div>
        </section>

      </div>

      {agentModalState !== 'closed' && (
        <div
          className={`native-agent-modal-layer ${agentModalState}`}
          aria-hidden={agentModalState === 'closing'}
        >
          <div className="native-agent-page-blur" />
          <section className="native-agent-modal" role="dialog" aria-modal="true" aria-labelledby="nativeAgentModalTitle" tabIndex={-1}>
            <header className="native-agent-modal__header">
              <h2 className="native-agent-modal__title" id="nativeAgentModalTitle">请选择数字员工</h2>
              <button className="native-agent-modal__close" type="button" onClick={closeAgentModal} aria-label="关闭">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>

            <div className="native-agent-modal__body">
              <div className="native-agent-tabs" role="tablist" aria-label="数字员工分类">
                {NATIVE_ASSISTANT_TABS.map((tab, index) => (
                  <button
                    key={tab}
                    className={`native-agent-tab${index === 0 ? ' active' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={index === 0}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="native-agent-list">
                <div className="native-agent-grid">
                  {NATIVE_ASSISTANT_OPTIONS.map(assistant => (
                    <button
                      className={`native-agent-card${assistant.agentId === 'smart-cost-assistant' ? ' selected' : ''}`}
                      type="button"
                      aria-pressed={assistant.agentId === 'smart-cost-assistant'}
                      key={assistant.agentId}
                    >
                      <span className="native-agent-card__avatar">
                        <img src={nativeAvatarSrc(assistant.avatarKey)} alt={assistant.agentName} />
                      </span>
                      <span className="native-agent-card__text">
                        <span className="native-agent-card__name">{assistant.agentName}</span>
                        <span className="native-agent-card__desc">{assistant.agentDescription}</span>
                      </span>
                      {assistant.agentId === 'smart-cost-assistant' && (
                        <span className="native-agent-card__check" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="m5 12 4 4 10-10" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <footer className="native-agent-modal__footer">
              <button className="native-agent-modal__ghost" type="button" tabIndex={-1}>创建智能助手</button>
              <div className="native-agent-modal__actions">
                <button className="native-agent-action cancel" type="button" onClick={closeAgentModal}>取消</button>
                <button className="native-agent-action confirm" type="button" onClick={closeAgentModal}>确定</button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  )

  return <AuditWorkspaceShell homeContent={homeContent} />
}
