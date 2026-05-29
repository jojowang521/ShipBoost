import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { GateNode } from '../types'
import { useAppState } from '../../shared/store/AppContext'

interface Props {
  gateNode: GateNode
  stepId: string
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function GenericGateCard({ gateNode, handled, onAction, messageId }: Props) {
  const { shellMode } = useAppState()
  const listItems = gateNode.displayContent.length > 0 ? gateNode.displayContent : [gateNode.type]
  const markdownList = listItems.map(item => `- ${item}`).join('\n')

  const handleConfirm = () => {
    if (handled || !onAction) return
    onAction('confirmGate', { messageId })
  }

  if (shellMode === 'native') {
    return (
      <>
        <div className="chat-agent-content native-gate-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownList}
          </ReactMarkdown>
        </div>

        {!handled && (
          <div className="action-buttons-group">
            <button
              className="action-btn action-btn-primary"
              onClick={handleConfirm}
            >
              {gateNode.primaryButton}
            </button>
            {gateNode.secondaryButton && (
              <button
                className="action-btn action-btn-outline"
                onClick={() => onAction?.('cancelGate', { messageId })}
              >
                {gateNode.secondaryButton}
              </button>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* 卡片主体：只展示信息，不含按钮 */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        opacity: handled ? 0.6 : 1,
        width: '100%',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: handled ? 'var(--text-success)' : 'var(--accent)',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
          }}>
            {gateNode.type}
          </span>
          {handled && (
            <span style={{
              marginLeft: 'auto',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-success)',
            }}>
              ✓ 已确认
            </span>
          )}
        </div>

        {/* Body：展示内容列表 */}
        {gateNode.displayContent.length > 0 && (
          <div style={{ padding: '12px 16px' }}>
            {gateNode.displayContent.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: idx < gateNode.displayContent.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: 'var(--font-size-md)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>待确认</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 按钮组：卡片外部下方，左对齐，主按钮在最左 */}
      {!handled && (
        <div className="action-buttons-group">
          <button
            className="action-btn action-btn-primary"
            onClick={handleConfirm}
          >
            {gateNode.primaryButton}
          </button>
          {gateNode.secondaryButton && (
            <button
              className="action-btn action-btn-outline"
              onClick={() => onAction?.('cancelGate', { messageId })}
            >
              {gateNode.secondaryButton}
            </button>
          )}
        </div>
      )}
    </>
  )
}
