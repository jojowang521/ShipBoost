interface Props {
  mirrored?: boolean
  className?: string
}

export function FoldIcon({ mirrored = false, className }: Props) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.2 2C2.53726 2 2 2.53726 2 3.2V12.8C2 13.4627 2.53726 14 3.2 14H12.8C13.4627 14 14 13.4627 14 12.8V3.2C14 2.53726 13.4627 2 12.8 2H3.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6 2V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.666 10L8.66602 8L10.666 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
