/**
 * AgentAvatar — AI 专员头像。
 */
import React, { useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { pixelArt } from '@dicebear/collection'

// 使用自定义图片的角色
// 图片文件存放于 public/，运行时通过根路径访问
// avatar-ai-1 ~ 4 为 ai-demo-shell 专属头像资源
const CUSTOM_AVATAR_IMAGES: Record<string, string> = {
  default:               '/avatar-ai-1.png',
  payment_specialist:    '/avatar-ai-1.png',
  // registry 按注册顺序自动分配的动态 key
  'avatar-ai-1':         '/avatar-ai-1.png',
  'avatar-ai-2':         '/avatar-ai-2.png',
  'avatar-ai-3':         '/avatar-ai-3.png',
  'avatar-ai-4':         '/avatar-ai-4.png',
}

// 其余角色使用 dicebear 生成
const AVATAR_SEEDS: Record<string, string> = {
  payment_specialist:       'payment',
}

const AVATAR_BG: Record<string, string> = {
  default:                  '#EEF3FB',
  payment_specialist:       '#EBEBFF',
  'avatar-ai-1':            '#EEEAF9',
  'avatar-ai-2':            '#E8F5EE',
  'avatar-ai-3':            '#FFF3E8',
  'avatar-ai-4':            '#E8EEF5',
}

interface Props {
  avatarKey: string
  size?: number
  style?: React.CSSProperties
}

export default function AgentAvatar({ avatarKey, size = 36, style }: Props) {
  const bg = AVATAR_BG[avatarKey] || AVATAR_BG['default']
  const customImage = CUSTOM_AVATAR_IMAGES[avatarKey]

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
      {customImage ? (
        <img
          src={customImage}
          alt={avatarKey}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      ) : (
        <img
          src={svgDataUrl!}
          alt={avatarKey}
          style={{ width: '75%', height: '75%', display: 'block' }}
          draggable={false}
        />
      )}
    </div>
  )
}
