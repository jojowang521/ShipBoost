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
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M2.6 2C1.93726 2 1.4 2.53726 1.4 3.2V12.8C1.4 13.4627 1.93726 14 2.6 14H12.2C12.8627 14 13.4 13.4627 13.4 12.8V3.2C13.4 2.53726 12.8627 2 12.2 2H2.6Z" stroke="#999999" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.4 2V14" stroke="#999999" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.66602 10L10.666 8L8.66602 6" stroke="#999999" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
