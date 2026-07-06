import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { GateNode } from '../types'

interface Props {
  gateNode: GateNode
  stepId: string
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function GenericGateCard({ gateNode, handled, onAction, messageId }: Props) {
  const [clickedAction, setClickedAction] = useState<string | null>(null)
  const isHandled = handled || clickedAction !== null
  const displayItems = gateNode.displayContent.length > 0 ? gateNode.displayContent : [gateNode.type]
  const titleMarkdown = gateNode.hideTitle ? '' : `**${gateNode.type}**\n\n`
  const markdownContent = gateNode.displayMarkdown?.trim()
    ? `${titleMarkdown}${gateNode.displayMarkdown.trim()}`
    : `${titleMarkdown}${displayItems.map(item => `- ${item}`).join('\n')}`

  const handleConfirm = () => {
    if (isHandled || !onAction) return
    setClickedAction('confirm')
    onAction('confirmGate', { messageId, label: gateNode.primaryButton })
  }

  const handleCancel = () => {
    if (isHandled || !onAction || !gateNode.secondaryButton) return
    setClickedAction('cancel')
    onAction('cancelGate', { messageId, label: gateNode.secondaryButton })
  }

  return (
    <div className={`generic-gate-inline${isHandled ? ' generic-gate-inline--handled' : ''}`}>
      <div className="chat-agent-content native-gate-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdownContent}
        </ReactMarkdown>
      </div>

      <div className={`action-buttons-group generic-gate-inline__actions${isHandled ? ' action-buttons-group--handled' : ''}`}>
        <button
          className="action-btn action-btn-primary"
          onClick={handleConfirm}
          disabled={isHandled}
        >
          {gateNode.primaryButton}
        </button>
        {gateNode.secondaryButton && (
          <button
            className="action-btn action-btn-outline"
            onClick={handleCancel}
            disabled={isHandled}
          >
            {gateNode.secondaryButton}
          </button>
        )}
      </div>
    </div>
  )
}
