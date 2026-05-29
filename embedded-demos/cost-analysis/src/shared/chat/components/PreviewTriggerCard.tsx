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
    })
  }

  return (
    <div
      onClick={handleClick}
      className="preview-trigger-card"
    >
      {/* 左侧图标 */}
      <div style={{ flexShrink: 0, width: 34, height: 34 }}>
        <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="8" fill="#E9ECFF"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M27.75 13.4033C27.75 11.9638 26.4171 10.8946 25.0119 11.2068L13.3869 13.7902C12.3574 14.0189 11.625 14.932 11.625 15.9866V34.1258C11.625 35.3685 12.6324 36.3758 13.875 36.3758H26.625C27.2463 36.3758 27.75 35.8721 27.75 35.2508V13.4033ZM16.1248 21.7508C16.1248 21.1294 16.6285 20.6258 17.2498 20.6258H22.1248C22.7461 20.6258 23.2498 21.1294 23.2498 21.7508C23.2498 22.3721 22.7461 22.8758 22.1248 22.8758H17.2498C16.6285 22.8758 16.1248 22.3721 16.1248 21.7508ZM17.2498 25.5008C16.6285 25.5008 16.1248 26.0045 16.1248 26.6258C16.1248 27.2471 16.6285 27.7508 17.2498 27.7508H19.4998C20.1211 27.7508 20.6248 27.2471 20.6248 26.6258C20.6248 26.0045 20.1211 25.5008 19.4998 25.5008H17.2498Z" fill="#645BFF"/>
          <path d="M29.625 36.375H34.1246C35.3673 36.375 36.3746 35.3676 36.3746 34.125V20.625C36.3746 19.3824 35.3673 18.375 34.1246 18.375H29.625V36.375Z" fill="#645BFF"/>
        </svg>
      </div>

      {/* 中间文字 */}
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-normal)',
            color: handled ? 'var(--text-secondary, #6B7280)' : 'var(--text-primary, #111827)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {meta && (
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-tertiary, #9CA3AF)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {meta}
          </div>
        )}
      </div>

    </div>
  )
}
