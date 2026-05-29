import { useState, useRef, type KeyboardEvent } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  showQuickPrompts: boolean
}

const QUICK_PROMPTS = [
  '导出报告',
  '横向对比',
  '扣除甲供材重新算',
  '整理成澄清清单',
]

export default function ChatInput({ onSend, disabled, showQuickPrompts }: Props) {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      <div className="workbench-input-wrapper chat-panel-input-wrapper">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="workbench-textarea"
          placeholder={disabled ? 'Agent 分析中...' : '输入问题或指令...'}
          disabled={disabled}
          rows={1}
        />
        <div className="workbench-input-toolbar">
          <button
            type="button"
            className="attachment-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="上传附件"
            aria-label="上传附件"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="0.5" y="0.5" width="29" height="29" rx="7.5" stroke="#EAEAEA" strokeOpacity="0.7" />
              <path d="M14.7603 8.14282C14.9369 8.14282 15.1045 8.21174 15.2301 8.33544C15.3569 8.45859 15.4268 8.62548 15.4268 8.80333C15.4268 8.97952 15.3571 9.14607 15.2309 9.2704L10.4167 14.0309C9.69469 14.7442 9.29825 15.699 9.30117 16.7196C9.30263 17.7408 9.70405 18.6987 10.4318 19.4177C11.111 20.0889 12.0015 20.4801 12.9578 20.5316L13.1742 20.5374C14.2034 20.5374 15.1677 20.146 15.8895 19.4359L19.6187 15.7455C20.0969 15.2729 20.3598 14.6383 20.3583 13.9595C20.3569 13.2811 20.09 12.6445 19.6067 12.1655C19.1213 11.6873 18.4754 11.4229 17.7877 11.4214C17.0944 11.4214 16.4534 11.682 15.9764 12.1547L12.4614 15.6309C12.2837 15.806 12.1868 16.0403 12.1882 16.2926C12.1882 16.5449 12.2874 16.7816 12.4678 16.9607C12.6464 17.138 12.8879 17.2367 13.1471 17.2381C13.4031 17.2381 13.6409 17.1418 13.8175 16.9666L16.9023 13.9176C17.0273 13.7945 17.195 13.7258 17.3712 13.7258C17.5488 13.7258 17.7164 13.794 17.8394 13.9169C17.9663 14.0401 18.0362 14.207 18.0362 14.3848C18.0362 14.561 17.9664 14.7276 17.8402 14.8519L14.7553 17.9009C14.3263 18.3236 13.7553 18.556 13.1437 18.556C12.534 18.5544 11.962 18.3194 11.531 17.8932C11.0998 17.4667 10.8613 16.8987 10.8597 16.2945C10.8582 15.6882 11.0938 15.1201 11.5235 14.6951L15.0384 11.2205C15.4086 10.855 15.8421 10.572 16.3257 10.3795C16.7133 10.226 17.1169 10.1356 17.5298 10.1097L17.7894 10.1019C18.829 10.1035 19.8059 10.5048 20.5416 11.2311C21.2743 11.9562 21.6806 12.9239 21.6854 13.9543C21.6869 14.4533 21.5923 14.9405 21.4045 15.4056C21.2118 15.8828 20.9253 16.3112 20.5537 16.6797L16.8246 20.3684C16.3335 20.8549 15.7566 21.2316 15.112 21.4872C14.5741 21.7022 14.0083 21.824 13.4252 21.8511L13.1601 21.8569C12.4832 21.8538 11.8261 21.7265 11.2089 21.478C10.5629 21.2177 9.98461 20.8382 9.49376 20.3519C8.99967 19.864 8.61692 19.2931 8.35505 18.6546C8.10178 18.0414 7.97278 17.3913 7.97115 16.7231C7.96968 16.0574 8.09517 15.4074 8.34428 14.7915C8.60485 14.1524 8.9862 13.5815 9.47709 13.0967L14.2915 8.33458C14.4164 8.21149 14.5841 8.14282 14.7603 8.14282Z" fill="#999999" />
            </svg>
          </button>
          <button
            className={`icon-btn send-btn${text.trim() ? ' active' : ''}`}
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            style={{ marginLeft: 'auto' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.6978 7.06938C12.5681 7.34552 12.3471 7.56441 12.0823 7.6961L2.07299 12.7099C1.36289 13.0545 0.505997 12.7735 0.14562 12.0832C-0.0130195 11.7498 -0.0451876 11.3736 0.0646303 11.0226L1.15932 7.48572C1.25954 7.16187 1.56094 6.94082 1.9023 6.94082H5.73337C6.01496 6.93969 6.24522 6.7139 6.25164 6.42659C6.24987 6.14372 6.02244 5.9151 5.73337 5.91235H1.90512C1.56241 5.91235 1.26015 5.68959 1.16105 5.36398L0.0808283 1.81452C-0.145184 1.07423 0.281458 0.284662 1.03641 0.0628915C1.38586 -0.046133 1.76388 -0.013046 2.08917 0.15932L12.0823 5.17312C12.7804 5.527 13.0614 6.3785 12.6978 7.06938Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.pdf,.doc,.docx"
        style={{ display: 'none' }}
      />
    </div>
  )
}
