import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '../store/types'
import { FileText } from 'lucide-react'
import ConfirmAction from './components/ConfirmAction'
import PreviewTriggerCard from './components/PreviewTriggerCard'
import AgentProfileCard, { AGENT_PROFILES } from './components/AgentProfileCard'
import AgentAvatar from './components/AgentAvatar'
import ActionButtons, { type ActionButtonDef } from './components/ActionButtons'

// 内置通用组件（可被 extraComponentMap 中的场景组件补充）
const SHARED_COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  ConfirmAction,
  PreviewTriggerCard,
}

interface Props {
  message: ChatMessage
  onComponentAction?: (action: string, payload: Record<string, unknown>) => void
  phase?: string
  extraComponentMap?: Record<string, React.ComponentType<any>>
  isGroupStart?: boolean
  actionButtons?: ActionButtonDef[]
  onActionButtonClick?: (value: string) => void
  currentAgentName?: string
  currentAvatarKey?: string
}

export default function MessageBubble({
  message,
  onComponentAction,
  phase,
  extraComponentMap,
  isGroupStart = true,
  actionButtons,
  onActionButtonClick,
  currentAgentName,
  currentAvatarKey,
}: Props) {
  const [cardState, setCardState] = useState<{ avatarKey: string; rect: DOMRect } | null>(null)

  const isUser = message.role === 'user'
  const assistantAvatar = (message.componentProps?.assistantAvatar as string) || 'default'

  // 多角色：消息级别的 agentAvatarKey 优先，其次 componentProps，再次场景默认
  const resolvedAvatarKey =
    message.agentAvatarKey ||
    (assistantAvatar !== 'default' ? assistantAvatar : null) ||
    currentAvatarKey ||
    'avatar-ai-1'

  // 多角色：消息级别的 agentName 优先，其次 componentProps 中的角色名，再次场景默认
  const agentProfile = AGENT_PROFILES[assistantAvatar] || AGENT_PROFILES['default']
  const displayName =
    message.agentName ||
    (assistantAvatar !== 'default' ? agentProfile.name : null) ||
    currentAgentName ||
    agentProfile.name

  const renderComponent = () => {
    if (!message.component) return null
    const allComponents = { ...SHARED_COMPONENT_MAP, ...(extraComponentMap || {}) }
    const Component = allComponents[message.component as string]
    if (!Component) return null
    return (
      <div className="chat-component-block">
        <Component
          {...(message.componentProps || {})}
          handled={message.componentHandled}
          onAction={onComponentAction}
          messageId={message.id}
          phase={phase}
        />
      </div>
    )
  }

  const renderAppendedComponent = () => {
    if (!message.appendedComponent) return null
    const allComponents = { ...SHARED_COMPONENT_MAP, ...(extraComponentMap || {}) }
    const Component = allComponents[message.appendedComponent as string]
    if (!Component) return null
    return (
      <div className="chat-component-block">
        <Component
          {...(message.appendedComponentProps || {})}
          handled={message.appendedComponentHandled}
          onAction={onComponentAction}
          messageId={message.id}
          phase={phase}
        />
      </div>
    )
  }

  const renderAttachment = () => {
    if (!isUser || !message.attachment) return null
    const isXml = message.attachment.name.toLowerCase().endsWith('.xml')
    return (
      <div className="chat-user-attachment">
        <div className="chat-user-attachment__icon">
          {isXml ? (
            <FileText size={20} color="#999" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M21.3337 2.66602H8.66699C7.60613 2.66602 6.58871 3.08744 5.83857 3.83759C5.08842 4.58773 4.66699 5.60515 4.66699 6.66602V25.3327C4.66699 26.3935 5.08842 27.411 5.83857 28.1611C6.58871 28.9113 7.60613 29.3327 8.66699 29.3327H23.3337C24.3945 29.3327 25.4119 28.9113 26.1621 28.1611C26.9122 27.411 27.3337 26.3935 27.3337 25.3327V9.33268L21.3337 2.66602Z" fill="#6397FF"/>
              <path d="M12.0556 21.3328L9.55957 12.6061H11.5749L13.0196 18.6695H13.0922L14.6856 12.6055H16.4122L17.9996 18.6821H18.0762L19.5209 12.6055H21.5369L19.0396 21.3328H17.2416L15.5796 15.6268H15.5116L13.8542 21.3328H12.0556Z" fill="white"/>
              <path d="M21.333 2.66602L25.833 7.66602L27.333 9.33268H23.333C22.8026 9.33268 22.2939 9.12197 21.9188 8.7469C21.5437 8.37182 21.333 7.86312 21.333 7.33268V2.66602Z" fill="#A8C5FF"/>
            </svg>
          )}
        </div>
        <div className="chat-user-attachment__info">
          <div className="chat-user-attachment__name">{message.attachment.name}</div>
          <div className="chat-user-attachment__meta">{isXml ? 'XML 文件' : 'Excel 表格'}</div>
        </div>
      </div>
    )
  }

  // 用户消息
  if (isUser) {
    return (
      <div className="chat-msg-user slide-in">
        <div className="chat-msg-user__inner">
          {message.content && (
            <div className="chat-msg-user__bubble">{message.content}</div>
          )}
          {renderAttachment()}
        </div>
      </div>
    )
  }

  // AI 消息
  return (
    <>
      <div className={`chat-bubble chat-bubble-agent slide-in${isGroupStart ? '' : ' chat-bubble--continuation'}`}>
        {isGroupStart && (
          <div className="chat-bubble-agent-header">
            <div
              className="chat-bubble-avatar avatar-agent"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                setCardState({ avatarKey: resolvedAvatarKey, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })
              }}
            >
              <AgentAvatar avatarKey={resolvedAvatarKey} size={36} style={{ borderRadius: '8px' }} />
            </div>
            <div className="agent-name-label">{displayName}</div>
          </div>
        )}

        <div className="chat-bubble-body">
          {message.content && (
            <div className="chat-agent-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.progress !== undefined && (
            <div className="message-progress-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>进度</span><span>{message.progress}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${message.progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {renderComponent()}
          {renderAppendedComponent()}

          {actionButtons && actionButtons.length > 0 && onActionButtonClick && (
            <ActionButtons buttons={actionButtons} onAction={onActionButtonClick} />
          )}
        </div>
      </div>

      {cardState && ReactDOM.createPortal(
        <AgentProfileCard
          avatarKey={cardState.avatarKey}
          anchorRect={cardState.rect}
          onClose={() => setCardState(null)}
        />,
        document.body
      )}
    </>
  )
}
