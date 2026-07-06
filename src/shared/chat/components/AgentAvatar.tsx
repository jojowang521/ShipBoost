/**
 * AgentAvatar — AI 专员头像。
 */
import React, { useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { pixelArt } from '@dicebear/collection'

const CUSTOM_AVATAR_IMAGES: Record<string, string> = {
  default:               '/aui-native/avatars/custom/1.png',
  noma_ai:               '/aui-native/avatars/custom/1.png',
  smart_cost_assistant:   '/aui-native/avatars/custom/2.png',
  cost_assistant:         '/aui-native/avatars/custom/12.png',
  data_assistant:         '/aui-native/avatars/custom/8.png',
  bill_assistant:         '/aui-native/avatars/custom/9.png',
  procurement_assistant:  '/aui-native/avatars/custom/6.png',
  payment_specialist:    '/aui-native/avatars/custom/4.png',
  finance_assistant:     '/aui-native/avatars/custom/5.png',
  tender_assistant:       '/aui-native/avatars/custom/10.png',
  cost_qa_assistant:      '/aui-native/avatars/custom/11.png',
  project_cost_assistant: '/aui-native/avatars/custom/7.png',
  'avatar-ai-1':          '/aui-native/avatars/custom/2.png',
  'avatar-ai-2':          '/aui-native/avatars/custom/8.png',
  'avatar-ai-3':          '/aui-native/avatars/custom/9.png',
  'avatar-ai-4':          '/aui-native/avatars/custom/6.png',
}

// 其余角色使用 dicebear 生成
const AVATAR_SEEDS: Record<string, string> = {
  payment_specialist:       'payment',
}

const AVATAR_BG: Record<string, string> = {
  default:                  '#FBEDEB',
  noma_ai:                  '#E9ECFF',
  payment_specialist:       '#FBEDEB',
  finance_assistant:        '#FBEDEB',
  smart_cost_assistant:     '#FBEDEB',
  data_assistant:           '#FBEDEB',
  bill_assistant:           '#FBEDEB',
  procurement_assistant:    '#FBEDEB',
  cost_assistant:           '#FBEDEB',
  tender_assistant:         '#FBEDEB',
  cost_qa_assistant:        '#FBEDEB',
  project_cost_assistant:   '#FBEDEB',
  'avatar-ai-1':            '#FBEDEB',
  'avatar-ai-2':            '#FBEDEB',
  'avatar-ai-3':            '#FBEDEB',
  'avatar-ai-4':            '#FBEDEB',
}

function NomaStarAvatar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <g clipPath="url(#agent-noma-avatar-clip)">
        <rect width="18" height="18" rx="9" fill="#E9ECFF" />
        <path d="M7.91699 10.8374C7.87012 10.6558 7.77542 10.49 7.64275 10.3573C7.51007 10.2246 7.34427 10.1299 7.16259 10.083L3.9418 9.25251C3.88685 9.23692 3.83848 9.20382 3.80405 9.15825C3.76961 9.11268 3.75098 9.05711 3.75098 8.99999C3.75098 8.94287 3.76961 8.88731 3.80405 8.84174C3.83848 8.79617 3.88685 8.76307 3.9418 8.74748L7.16259 7.91642C7.3442 7.8696 7.50997 7.77498 7.64263 7.6424C7.7753 7.50982 7.87004 7.34413 7.91699 7.16254L8.74752 3.94175C8.76296 3.88658 8.79602 3.83798 8.84166 3.80336C8.8873 3.76874 8.94301 3.75 9.0003 3.75C9.05759 3.75 9.1133 3.76874 9.15894 3.80336C9.20458 3.83798 9.23764 3.88658 9.25308 3.94175L10.0831 7.16254C10.13 7.34422 10.2247 7.51003 10.3573 7.6427C10.49 7.77538 10.6558 7.87008 10.8375 7.91695L14.0583 8.74695C14.1137 8.76223 14.1625 8.79525 14.1973 8.84096C14.2321 8.88667 14.251 8.94254 14.251 8.99999C14.251 9.05745 14.2321 9.11332 14.1973 9.15902C14.1625 9.20473 14.1137 9.23776 14.0583 9.25304L10.8375 10.083C10.6558 10.1299 10.49 10.2246 10.3573 10.3573C10.2247 10.49 10.13 10.6558 10.0831 10.8374L9.25256 14.0582C9.23712 14.1134 9.20406 14.162 9.15842 14.1966C9.11278 14.2312 9.05706 14.25 8.99978 14.25C8.94249 14.25 8.88678 14.2312 8.84114 14.1966C8.7955 14.162 8.76243 14.1134 8.74699 14.0582L7.91699 10.8374Z" fill="url(#agent-noma-avatar-gradient)" />
      </g>
      <defs>
        <linearGradient id="agent-noma-avatar-gradient" x1="14.1772" y1="9.29164" x2="3.80735" y2="9.26889" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8477FF" />
          <stop offset="1" stopColor="#5AA8FF" />
        </linearGradient>
        <clipPath id="agent-noma-avatar-clip">
          <rect width="18" height="18" rx="9" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

interface Props {
  avatarKey: string
  size?: number
  style?: React.CSSProperties
}

export default function AgentAvatar({ avatarKey, size = 36, style }: Props) {
  const bg = AVATAR_BG[avatarKey] || AVATAR_BG['default']
  const customImage = avatarKey === 'noma_ai' ? null : CUSTOM_AVATAR_IMAGES[avatarKey]

  const seed = AVATAR_SEEDS[avatarKey] || 'default'
  const svgDataUrl = useMemo(() => {
    if (customImage) return null
    const svg = createAvatar(pixelArt, {
      seed,
      size: 80,
      backgroundColor: [],
    }).toString()
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }, [seed, customImage])

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {avatarKey === 'noma_ai' ? (
        <NomaStarAvatar size={size} />
      ) : customImage ? (
        <img
          src={customImage}
          alt={avatarKey}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      ) : (
        <img
          src={svgDataUrl!}
          alt={avatarKey}
          style={{ width: '75%', height: '75%', borderRadius: '50%', display: 'block' }}
          draggable={false}
        />
      )}
    </div>
  )
}
