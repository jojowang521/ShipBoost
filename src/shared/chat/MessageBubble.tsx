import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '../store/types'
import { FileText } from 'lucide-react'
import ConfirmAction from './components/ConfirmAction'
import ArtifactStackCard from './components/ArtifactStackCard'
import PreviewTriggerCard from './components/PreviewTriggerCard'
import TaskReplayDivider from './components/TaskReplayDivider'
import AgentProfileCard, { AGENT_PROFILES } from './components/AgentProfileCard'
import AgentAvatar from './components/AgentAvatar'
import ActionButtons, { type ActionButtonDef } from './components/ActionButtons'

// 内置通用组件（可被 extraComponentMap 中的场景组件补充）
const SHARED_COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  ConfirmAction,
  ArtifactStackCard,
  PreviewTriggerCard,
  TaskReplayDivider,
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
  const [clickedSuggestionIndex, setClickedSuggestionIndex] = useState<number | null>(null)

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

  const renderSuggestionCards = () => {
    if (!message.suggestionCards || message.suggestionCards.length === 0) return null
    return (
      <div className="suggestion-card-list" aria-label="推荐问题和下一步建议">
        {message.suggestionCards.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className="suggestion-card"
            title={item.label}
            disabled={clickedSuggestionIndex !== null}
            onClick={() => {
              if (clickedSuggestionIndex !== null) return
              setClickedSuggestionIndex(index)
              onComponentAction?.('sendSuggestionQuestion', {
                label: item.label,
                text: item.sendText || item.label,
                messageId: message.id,
              })
            }}
          >
            <span className="suggestion-card__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" focusable="false">
                <path d="M5.37256 4.35403C5.43392 4.02974 5.8991 4.02974 5.96045 4.35403L6.23877 5.82571C6.46735 7.03286 7.41145 7.97719 8.61866 8.2056L10.0903 8.48392C10.4144 8.54539 10.4144 9.00933 10.0903 9.07083L8.61866 9.34915C7.4113 9.57758 6.46721 10.5227 6.23877 11.73L5.96045 13.2007C5.8991 13.525 5.43392 13.525 5.37256 13.2007L5.09424 11.73C4.86581 10.5227 3.92171 9.57758 2.71436 9.34915L1.24268 9.07083C0.918467 9.00942 0.918445 8.5453 1.24268 8.48392L2.71436 8.2056C3.92156 7.97718 4.86568 7.03286 5.09424 5.82571L5.37256 4.35403ZM12.52 2.67728C12.5507 2.51513 12.7833 2.51513 12.814 2.67728L12.9526 3.41263C13.0669 4.0163 13.5394 4.48884 14.1431 4.60306L14.8784 4.74173C15.0406 4.77241 15.0406 5.005 14.8784 5.03567L14.1431 5.17435C13.5394 5.28856 13.0669 5.7611 12.9526 6.36478L12.814 7.10013C12.7833 7.26228 12.5507 7.26228 12.52 7.10013L12.3814 6.36478C12.2671 5.7611 11.7946 5.28857 11.1909 5.17435L10.4546 5.03567C10.293 5.00471 10.293 4.77269 10.4546 4.74173L11.1909 4.60306C11.7946 4.48884 12.2671 4.0163 12.3814 3.41263L12.52 2.67728Z" fill="url(#suggestion-card-icon-gradient)" />
                <defs>
                  <linearGradient id="suggestion-card-icon-gradient" x1="0.999512" y1="7.9998" x2="15" y2="7.9998" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5C8AFF" />
                    <stop offset="1" stopColor="#786CFF" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="suggestion-card__text">{item.label}</span>
          </button>
        ))}
      </div>
    )
  }

  const renderAttachment = () => {
    if (!isUser || !message.attachment) return null
    const fileName = message.attachment.name.toLowerCase()
    const fileType = message.attachment.type ?? (
      fileName.endsWith('.pdf') ? 'pdf' :
        fileName.endsWith('.xml') ? 'xml' :
          fileName.endsWith('.doc') || fileName.endsWith('.docx') ? 'word' :
            fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ? 'excel' :
              'file'
    )
    return (
      <div className="chat-user-attachment">
        <div className="chat-user-attachment__icon">
          {fileType === 'xml' ? (
            <FileText size={20} color="#999" />
          ) : fileType === 'pdf' ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
              <path d="M21.3333 2.66699H8.66663C7.60576 2.66699 6.58834 3.08842 5.8382 3.83856C5.08805 4.58871 4.66663 5.60613 4.66663 6.66699V25.3337C4.66663 26.3945 5.08805 27.4119 5.8382 28.1621C6.58834 28.9122 7.60576 29.3337 8.66663 29.3337H23.3333C24.3942 29.3337 25.4116 28.9122 26.1617 28.1621C26.9119 27.4119 27.3333 26.3945 27.3333 25.3337V9.33366L21.3333 2.66699Z" fill="#FD6D6D" />
              <path d="M20.3554 18.3823C20.0521 18.3823 19.7854 18.3823 19.4821 18.4476C19.8221 18.6143 20.1554 18.679 20.4947 18.7083C20.7314 18.7436 20.9681 18.7083 21.1681 18.643C21.1614 18.5483 21.0281 18.3823 20.3554 18.3823ZM15.7507 16.583L15.7147 16.537L15.6781 16.6136C15.3761 17.4021 15.0391 18.1766 14.6681 18.935L14.6581 18.995L14.7347 18.9656C15.4828 18.6933 16.2463 18.4655 17.0214 18.2836L17.1087 18.265C16.6006 17.7515 16.1456 17.1879 15.7507 16.583ZM15.5161 11.6876L15.4047 11.6503C15.3661 11.6503 15.2987 11.6876 15.2667 11.7236C15.1267 12.2936 15.2287 12.899 15.4781 13.4383C15.6887 12.869 15.6887 12.2636 15.5161 11.6876ZM11.0214 21.8343L11.1234 21.7983C11.5907 21.627 11.9567 21.2916 12.2207 20.8456C11.7315 21.0488 11.3137 21.3929 11.0207 21.8343H11.0214ZM20.4741 19.741C19.5529 19.6784 18.6761 19.3218 17.9727 18.7236C16.5854 19.0283 15.2707 19.4663 13.9494 20.009C12.9027 21.873 11.9227 22.823 11.0774 22.823C10.9067 22.823 10.7061 22.7863 10.5721 22.689C10.3993 22.6074 10.2537 22.478 10.1523 22.3161C10.0509 22.1542 9.99807 21.9666 10.0001 21.7756C10.0001 21.4703 10.0667 20.6236 13.2801 19.235C14.0227 17.8823 14.6007 16.4936 15.0694 15.0376C14.6614 14.227 13.7794 12.229 14.3881 11.211C14.5887 10.8396 14.9961 10.639 15.4347 10.669C15.7754 10.669 16.1107 10.8396 16.3107 11.1083C16.7494 11.717 16.7187 13.003 16.1407 14.8976C16.6814 15.9105 17.3891 16.8249 18.2341 17.6023C18.9461 17.469 19.6521 17.365 20.3641 17.365C21.9527 17.4016 22.1901 18.145 22.1534 18.5836C22.1654 19.741 21.0521 19.741 20.4734 19.741H20.4741Z" fill="white" />
              <path d="M21.3334 2.66699L25.8334 7.66699L27.3334 9.33366H23.3334C22.8029 9.33366 22.2942 9.12295 21.9192 8.74787C21.5441 8.3728 21.3334 7.86409 21.3334 7.33366V2.66699Z" fill="#F14646" />
            </svg>
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
          <div className="chat-user-attachment__meta">{message.attachment.size ?? (fileType === 'xml' ? 'XML 文件' : fileType === 'pdf' ? 'PDF 文件' : fileType === 'word' ? 'Word 文档' : 'Excel 表格')}</div>
        </div>
      </div>
    )
  }

  // 用户消息
  if (isUser) {
    return (
      <div className="chat-msg-user slide-in">
        <div className="chat-msg-user__inner">
          {renderAttachment()}
          {message.content && (
            <div className="chat-msg-user__bubble">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
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
              <AgentAvatar avatarKey={resolvedAvatarKey} size={32} />
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
          {renderSuggestionCards()}

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
