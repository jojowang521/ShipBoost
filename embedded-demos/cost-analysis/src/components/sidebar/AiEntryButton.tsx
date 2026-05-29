interface Props {
  onOpen: () => void
  hasActivity?: boolean
}

export function AiEntryButton({ onOpen, hasActivity = false }: Props) {
  return (
    <button
      type="button"
      className={`ai-entry-button${hasActivity ? ' ai-entry-button--active' : ''}`}
      onClick={onOpen}
      aria-label="打开 AI 助手"
      title="打开 AI 助手"
    >
      <span className="ai-entry-button__logo" aria-hidden="true">
        <img className="ai-entry-button__image" src="/gpt-entry.png" alt="" draggable={false} />
      </span>
      <span className="ai-entry-button__text">AI 助手</span>
      {hasActivity && <span className="ai-entry-button__dot" />}
    </button>
  )
}
