import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { HOME_SKILL_OPTIONS } from '../homeSkillOptions'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  showQuickPrompts: boolean
  onAttachment?: (file: { name: string; size?: string; type?: 'pdf' | 'word' | 'excel' | 'xml' | 'file' }) => void
}

const QUICK_PROMPTS = [
  '导出报告',
  '横向对比',
  '扣除甲供材重新算',
  '整理成澄清清单',
]

export default function ChatInput({ onSend, disabled, showQuickPrompts, onAttachment }: Props) {
  const [text, setText] = useState('')
  const [skillModalState, setSkillModalState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed')
  const [skillHighlightIndex, setSkillHighlightIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const skillDropdownRef = useRef<HTMLDivElement | null>(null)
  const skillModalTimerRef = useRef<number | null>(null)

  const clearSkillModalTimer = useCallback(() => {
    if (skillModalTimerRef.current !== null) {
      window.clearTimeout(skillModalTimerRef.current)
      skillModalTimerRef.current = null
    }
  }, [])

  const closeSkillModal = useCallback(() => {
    if (skillModalState === 'closed') return
    clearSkillModalTimer()
    setSkillModalState('closing')
    skillModalTimerRef.current = window.setTimeout(() => {
      setSkillModalState('closed')
      skillModalTimerRef.current = null
    }, 160)
  }, [clearSkillModalTimer, skillModalState])

  const openSkillModal = useCallback(() => {
    if (disabled) return
    clearSkillModalTimer()
    setSkillHighlightIndex(0)
    setSkillModalState('opening')
    skillModalTimerRef.current = window.setTimeout(() => {
      setSkillModalState('open')
      skillModalTimerRef.current = null
    }, 20)
  }, [clearSkillModalTimer, disabled])

  const toggleSkillModal = useCallback(() => {
    if (skillModalState === 'closed' || skillModalState === 'closing') {
      openSkillModal()
    } else {
      closeSkillModal()
    }
  }, [closeSkillModal, openSkillModal, skillModalState])

  const handleSelectSkill = useCallback((skillName: string) => {
    const skillPrompt = `使用【${skillName}】`
    const skillPattern = /(?:，?\s*)?使用【[^】]+】(?:，?)?/gu
    const textWithoutSkill = text.replace(skillPattern, ' ').replace(/\s+/g, ' ').trim()
    const nextText = textWithoutSkill ? `${skillPrompt}，${textWithoutSkill}` : `${skillPrompt}，`
    setText(nextText)
    closeSkillModal()
  }, [closeSkillModal, text])

  useEffect(() => () => clearSkillModalTimer(), [clearSkillModalTimer])

  useEffect(() => {
    if (skillModalState === 'closed') return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!skillDropdownRef.current?.contains(target)) closeSkillModal()
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [closeSkillModal, skillModalState])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input-area">
      {/* QUICK_PROMPTS 仅在 showQuickPrompts 为 true 且没有 ActionButtons 时（即非 complete 阶段）显示 */}
      {showQuickPrompts && (
        <div className="chat-quick-prompts">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              className="btn btn-sm btn-ghost"
              onClick={() => onSend(p)}
              disabled={disabled}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <div className="workbench-input-wrapper chat-panel-input-wrapper" ref={skillDropdownRef}>
        <textarea
          value={text}
          onChange={e => {
            setText(e.target.value)
            if (skillModalState !== 'closed') closeSkillModal()
          }}
          onKeyDown={event => {
            if (skillModalState !== 'closed') {
              if (event.key === 'Escape') {
                event.preventDefault()
                closeSkillModal()
                return
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setSkillHighlightIndex(index => (index + 1) % HOME_SKILL_OPTIONS.length)
                return
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setSkillHighlightIndex(index => (index - 1 + HOME_SKILL_OPTIONS.length) % HOME_SKILL_OPTIONS.length)
                return
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                const selected = HOME_SKILL_OPTIONS[skillHighlightIndex] ?? HOME_SKILL_OPTIONS[0]
                if (selected) handleSelectSkill(selected.name)
                return
              }
            }
            handleKeyDown(event)
          }}
          className="workbench-textarea"
          placeholder="请输入你的问题"
          disabled={disabled}
          rows={1}
        />
        <div className="workbench-input-toolbar">
          <div className="chat-input-left-actions">
            <button
              type="button"
              className="home-tool-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              title="上传附件"
              aria-label="上传附件"
            >
              <img src="/aui-native/icons/attachment.svg" alt="" draggable={false} />
            </button>
            <div className="chat-skill-picker">
              <button
                type="button"
                className="home-tool-btn"
                onClick={toggleSkillModal}
                disabled={disabled}
                aria-haspopup="menu"
                aria-expanded={skillModalState !== 'closed'}
                aria-label="选择技能"
                title="选择技能"
              >
                <img src="/aui-native/icons/skill.svg" alt="" draggable={false} />
              </button>
              {skillModalState !== 'closed' && (
                <div
                  className={`native-skill-dropdown chat-skill-dropdown ${skillModalState}`}
                  role="menu"
                  aria-label="选择技能"
                >
                  <div className="native-skill-dropdown__list">
                    {HOME_SKILL_OPTIONS.map(skill => (
                      <button
                        type="button"
                        className={`native-skill-dropdown__item${HOME_SKILL_OPTIONS[skillHighlightIndex]?.name === skill.name ? ' selected' : ''}`}
                        role="menuitem"
                        aria-selected={HOME_SKILL_OPTIONS[skillHighlightIndex]?.name === skill.name}
                        key={skill.name}
                        onMouseEnter={() => setSkillHighlightIndex(HOME_SKILL_OPTIONS.findIndex(item => item.name === skill.name))}
                        onClick={() => handleSelectSkill(skill.name)}
                      >
                        <img src="/aui-native/icons/skill.svg" alt="" draggable={false} />
                        <span className="native-skill-dropdown__copy">
                          <span className="native-skill-dropdown__name">{skill.name}</span>
                          <span className="native-skill-dropdown__desc">{skill.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className={`icon-btn send-btn${disabled ? ' send-btn--pause active' : text.trim() ? ' active' : ''}`}
            onClick={disabled ? undefined : handleSend}
            disabled={!disabled && !text.trim()}
            aria-label={disabled ? '暂停' : '发送'}
            title={disabled ? '暂停' : '发送'}
          >
            {disabled ? (
              <span className="send-btn__stop-icon" aria-hidden="true" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12.6978 7.06938C12.5681 7.34552 12.3471 7.56441 12.0823 7.6961L2.07299 12.7099C1.36289 13.0545 0.505997 12.7735 0.14562 12.0832C-0.0130195 11.7498 -0.0451876 11.3736 0.0646303 11.0226L1.15932 7.48572C1.25954 7.16187 1.56094 6.94082 1.9023 6.94082H5.73337C6.01496 6.93969 6.24522 6.7139 6.25164 6.42659C6.24987 6.14372 6.02244 5.9151 5.73337 5.91235H1.90512C1.56241 5.91235 1.26015 5.68959 1.16105 5.36398L0.0808283 1.81452C-0.145184 1.07423 0.281458 0.284662 1.03641 0.0628915C1.38586 -0.046133 1.76388 -0.013046 2.08917 0.15932L12.0823 5.17312C12.7804 5.527 13.0614 6.3785 12.6978 7.06938Z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={event => {
          const file = event.currentTarget.files?.[0]
          if (!file) return
          const suffix = file.name.split('.').pop()?.toLowerCase()
          const type = suffix === 'pdf'
            ? 'pdf'
            : suffix === 'doc' || suffix === 'docx'
              ? 'word'
              : suffix === 'xls' || suffix === 'xlsx'
                ? 'excel'
                : suffix === 'xml'
                  ? 'xml'
                  : 'file'
          onAttachment?.({
            name: file.name,
            size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            type,
          })
          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}
