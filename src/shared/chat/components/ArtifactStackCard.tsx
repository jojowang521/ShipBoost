import { ArtifactActionChevron, ArtifactFileIcon } from './ArtifactFileIcons'

interface ArtifactStackItem {
  title: string
  meta?: string
  icon?: string
  targetPhase: string
}

interface Props {
  items?: ArtifactStackItem[]
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function ArtifactStackCard({ items = [], handled = false, onAction, messageId }: Props) {
  const openItem = (item: ArtifactStackItem) => {
    onAction?.('openPreview', {
      messageId,
      readonly: handled,
      targetPhase: item.targetPhase,
      targetArtifactTitle: item.title,
      scrollBeforeOpen: true,
    })
  }

  return (
    <div className="artifact-stack-card">
      {items.map(item => (
        <button
          key={item.title}
          type="button"
          className="artifact-stack-card__item"
          onClick={() => openItem(item)}
        >
          <span className="artifact-stack-card__icon">
            <ArtifactFileIcon icon={item.icon} title={item.title} />
          </span>
          <span className="artifact-stack-card__copy">
            <span className="artifact-stack-card__title">{item.title}</span>
            {item.meta ? <span className="artifact-stack-card__meta">{item.meta}</span> : null}
          </span>
          <span className="artifact-stack-card__action" aria-hidden="true">
            查看
            <ArtifactActionChevron />
          </span>
        </button>
      ))}
    </div>
  )
}
