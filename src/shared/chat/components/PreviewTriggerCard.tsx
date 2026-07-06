import { ArtifactActionChevron, ArtifactFileIcon, getArtifactFileIconKind } from './ArtifactFileIcons'

interface Props {
  icon?: string
  title?: string
  meta?: string
  handled?: boolean
  /** Reserved for compatibility. The generated artifact card does not render status text. */
  handledLabel?: string
  targetPhase?: string
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function PreviewTriggerCard({
  icon,
  title = '内容预览',
  meta,
  handled = false,
  targetPhase,
  onAction,
  messageId,
}: Props) {
  const handleClick = () => {
    if (!onAction) return
    onAction('openPreview', {
      messageId,
      readonly: handled,
      targetPhase,
      targetArtifactTitle: title,
      scrollBeforeOpen: true,
    })
  }
  const iconKind = getArtifactFileIconKind(icon, title)

  return (
    <div
      onClick={handleClick}
      className="preview-trigger-card"
    >
      <div className="preview-trigger-card__link-icon" aria-hidden="true">
        <ArtifactFileIcon icon={iconKind} title={title} />
      </div>

      <div className="preview-trigger-card__copy">
        <div className="preview-trigger-card__title" data-handled={handled ? 'true' : undefined}>
          {title}
        </div>
        {meta && (
          <div className="preview-trigger-card__meta">
            {meta}
          </div>
        )}
      </div>

      <span className="preview-trigger-card__action" aria-hidden="true">
        查看
        <ArtifactActionChevron />
      </span>
    </div>
  )
}
