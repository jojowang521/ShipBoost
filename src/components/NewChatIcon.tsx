import type { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export function NewChatIcon({ className, style }: Props) {
  return (
    <svg
      className={className}
      style={style}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath="url(#new-chat-icon-clip)">
        <path
          d="M7.99999 1.40002C11.6451 1.40002 14.6 4.35495 14.6 8.00002C14.6 11.6451 11.6451 14.6 7.99999 14.6H2.34285C1.82212 14.6 1.39999 14.1779 1.39999 13.6572V8.00002C1.39999 4.35495 4.35491 1.40002 7.99999 1.40002Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M5.17169 8H10.8288" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8.00009 10.8284V5.17123" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <defs>
        <clipPath id="new-chat-icon-clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
