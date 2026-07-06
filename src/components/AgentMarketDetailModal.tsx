import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

export type AgentDetailTab = 'basic' | 'skills' | 'records'
export type AgentDetailSkill = [string, string, string, string]
export type AgentDetailArtifact = [string, string, string]
export type AgentDetailRecord = [title: string, description: string, artifacts?: AgentDetailArtifact[]]
export type AgentDetailPayload = {
  index: number
  name: string
  domain: string
  description: string
  avatarSrc: string
  instructions: string[]
  questions: string[]
  skills: AgentDetailSkill[]
  records: AgentDetailRecord[]
  artifacts: AgentDetailArtifact[]
}

function getAgentArtifactIconSrc(type: string): string {
  return type === 'pdf' ? '/agent-skill-market/icons/pdf.svg' : '/agent-skill-market/icons/excel.svg'
}

export function AgentMarketDetailModal({
  agent,
  embeddedInSideNav = false,
  onClose,
}: {
  agent: AgentDetailPayload
  embeddedInSideNav?: boolean
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<AgentDetailTab>('basic')
  const [expandedRecordKeys, setExpandedRecordKeys] = useState<string[]>([])

  useEffect(() => {
    setActiveTab('basic')
    setExpandedRecordKeys([])
  }, [agent.index])

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const tabs: Array<{ key: AgentDetailTab; label: string }> = [
    { key: 'basic', label: '基本信息' },
    { key: 'skills', label: '可用技能' },
    { key: 'records', label: '对话记录' },
  ]

  const toggleRecord = (recordKey: string) => {
    setExpandedRecordKeys(current =>
      current.includes(recordKey)
        ? current.filter(key => key !== recordKey)
        : [...current, recordKey],
    )
  }

  return createPortal(
    <div
      className={`native-agent-detail-overlay${embeddedInSideNav ? ' native-agent-detail-overlay--side-nav' : ''}`}
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="native-agent-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nativeAgentDetailTitle"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="native-agent-detail-header">
          <h2 className="native-agent-detail-title" id="nativeAgentDetailTitle">智能体详情</h2>
          <button className="native-agent-detail-close" type="button" aria-label="关闭" onClick={onClose}>
            <img src="/agent-skill-market/icons/close.svg" alt="" />
          </button>
        </header>

        <div className="native-agent-detail-fixed">
          <div className="native-agent-detail-profile">
            <span className="native-agent-detail-avatar">
              <img src={agent.avatarSrc} alt="" />
            </span>
            <div className="native-agent-detail-summary">
              <div className="native-agent-detail-heading">
                <div className="native-agent-detail-identity">
                  <strong className="native-agent-detail-name">{agent.name}</strong>
                  <div className="native-agent-detail-tags" aria-label="智能体标签">
                    <span className="native-agent-detail-tag native-agent-detail-tag--online">在线</span>
                    <span className="native-agent-detail-tag">{agent.domain}</span>
                    <span className="native-agent-detail-tag">技能·{agent.skills.length}</span>
                    <span className="native-agent-detail-tag">对话记录·{agent.records.length}</span>
                    <span className="native-agent-detail-tag">输出产物·{agent.artifacts.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <nav className="native-agent-detail-tabs" aria-label="智能体详情分类">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`native-agent-detail-tab${activeTab === tab.key ? ' is-active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="native-agent-detail-body">
          {activeTab === 'basic' && (
            <div className="native-agent-detail-content">
              <section className="native-agent-detail-section">
                <div className="native-agent-detail-section-title">
                  <img src="/agent-skill-market/icons/instruction.svg" alt="" />
                  <span>智能体说明</span>
                </div>
                <div className="native-agent-detail-instructions">
                  <p className="native-agent-detail-desc">{agent.description}</p>
                </div>
              </section>

              <section className="native-agent-detail-section">
                <div className="native-agent-detail-section-title">
                  <img src="/agent-skill-market/icons/instruction.svg" alt="" />
                  <span>使用方式</span>
                </div>
                <div className="native-agent-detail-instructions">
                  <ul>
                    {agent.instructions.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </section>

            </div>
          )}

          {activeTab === 'skills' && (
            <div className="native-agent-detail-skill-grid">
              {agent.skills.map(skill => (
                <article className="native-agent-skill-card" key={skill[2]}>
                  <div className="native-agent-skill-card__top">
                    <span className={`native-agent-skill-card__icon ${skill[1]}`}>{skill[0]}</span>
                    <strong className="native-agent-skill-card__title">{skill[2]}</strong>
                  </div>
                  <p className="native-agent-skill-card__desc">{skill[3]}</p>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'records' && (
            <div className="native-agent-detail-record-list">
              {agent.records.map(record => {
                const recordArtifacts = record[2] ?? agent.artifacts
                const isExpanded = expandedRecordKeys.includes(record[0])

                return (
                  <article
                    className={`native-agent-record-card${isExpanded ? ' is-expanded' : ''}`}
                    key={record[0]}
                  >
                    <div className="native-agent-record-card__top">
                      <button
                        className="native-agent-record-card__toggle"
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleRecord(record[0])}
                      >
                        <ChevronDown className="native-agent-record-card__icon" aria-hidden="true" />
                        <strong className="native-agent-record-card__title">{record[0]}</strong>
                      </button>
                      <span className="native-agent-record-card__actions">
                        <span className="native-agent-record-card__meta">2025-12-03 14:32 · 对话18轮</span>
                        <button className="native-agent-record-card__view" type="button">查看对话</button>
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="native-agent-record-artifact-grid" aria-label={`${record[0]}输出产物`}>
                        {recordArtifacts.map((artifact, artifactIndex) => (
                          <button className="native-agent-record-artifact" type="button" key={`${record[0]}-${artifact[1]}-${artifactIndex}`}>
                            <img className="native-agent-record-artifact__icon" src={getAgentArtifactIconSrc(artifact[0])} alt="" />
                            <span className="native-agent-record-artifact__title">{artifact[1]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <footer className="native-agent-detail-footer">
          <button className="native-agent-detail-btn" type="button" onClick={onClose}>取消</button>
          <button className="native-agent-detail-btn native-agent-detail-btn--primary" type="button" onClick={onClose}>
            <img src="/agent-skill-market/icons/chat.svg" alt="" />
            <span>去对话</span>
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
