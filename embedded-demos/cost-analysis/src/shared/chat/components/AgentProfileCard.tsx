/**
 * AgentProfileCard — AI 专员资料卡。
 */
import { useEffect, useRef } from 'react'
import AgentAvatar from './AgentAvatar'

const AGENT_PROFILES: Record<string, {
  name: string
  title: string
  desc: string
  tags: string[]
  color: string
}> = {
  default: {
    name: '成本请款专员', title: '付款申请审核',
    desc: '负责工程付款申请资料识别、附件完整性检查、金额核对和提交前智能预审。',
    tags: ['付款申请', '附件检查', '智能预审'], color: '#5147FF',
  },
  payment_specialist: {
    name: '成本请款专员', title: '付款申请审核',
    desc: '负责工程付款申请资料识别、附件完整性检查、金额核对和提交前智能预审。',
    tags: ['付款申请', '金额核对', '审批跟进'], color: '#5147FF',
  },
}

export { AGENT_PROFILES }

function mentionToAvatarKey(mention: string): string {
  if (mention.includes('付款') || mention.includes('请款')) return 'payment_specialist'
  return 'default'
}

export { mentionToAvatarKey }

interface Props {
  avatarKey: string
  anchorRect: DOMRect
  onClose: () => void
}

const CARD_WIDTH = 240
const CARD_HEIGHT = 160

export default function AgentProfileCard({ avatarKey, anchorRect, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const profile = AGENT_PROFILES[avatarKey] || AGENT_PROFILES['default']

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  const viewportW = window.innerWidth
  const viewportH = window.innerHeight

  let left: number
  const rightSpace = viewportW - anchorRect.right - 8
  const leftSpace = anchorRect.left - 8

  if (rightSpace >= CARD_WIDTH) {
    left = anchorRect.right + 8
  } else if (leftSpace >= CARD_WIDTH) {
    left = anchorRect.left - CARD_WIDTH - 8
  } else {
    left = Math.max(8, viewportW - CARD_WIDTH - 8)
  }

  let top = anchorRect.top + anchorRect.height / 2 - CARD_HEIGHT / 2
  top = Math.max(8, Math.min(top, viewportH - CARD_HEIGHT - 8))

  return (
    <div
      ref={cardRef}
      className="agent-profile-card"
      style={{ left, top }}
    >
      <div className="agent-profile-card-header">
        <AgentAvatar avatarKey={avatarKey} size={48} />
        <div>
          <div className="agent-profile-name">{profile.name}</div>
          <div className="agent-profile-title">{profile.title}</div>
        </div>
      </div>
      <div className="agent-profile-desc">{profile.desc}</div>
      <div className="agent-profile-tags">
        {profile.tags.map(tag => (
          <span key={tag} className="agent-profile-tag">{tag}</span>
        ))}
      </div>
    </div>
  )
}
