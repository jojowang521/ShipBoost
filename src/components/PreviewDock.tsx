/**
 * PreviewDock — 右侧预览区统一宿主
 *
 * 三段式布局：
 * - Header: 动态标题(左对齐) + 关闭按钮(右对齐)
 * - Body:   children 可滚动内容区
 * - Footer: 可选操作区（贴在整张预览白卡底部；主按钮用 .action-btn 与对话区一致）
 */
import React from 'react'
import { X } from 'lucide-react'

interface Props {
  isVisible: boolean
  onClose: () => void
  title?: string
  footer?: React.ReactNode
  footerReadonly?: boolean
  flex?: string
  closingFlex?: string
  keepFlexOnExit?: boolean
  hiddenTransform?: string
  motion?: 'none' | 'slide-left' | 'slide-right'
  children?: React.ReactNode
}

export function PreviewDock({ isVisible, onClose, title = '内容预览', footer, footerReadonly = false, flex, closingFlex, keepFlexOnExit = false, hiddenTransform = 'translateX(28px)', motion = 'none', children }: Props) {
  const isSlideMotion = motion === 'slide-left' || motion === 'slide-right'
  const visibleFlex = flex || '1 1 0'
  return (
    <div
      className={`preview-dock${isSlideMotion ? ` preview-dock--${motion}` : ''}${isVisible ? ' preview-dock--visible' : ''}`}
      style={{
        flex: isVisible || keepFlexOnExit ? visibleFlex : (closingFlex || '0 0 0%'),
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        minWidth: isSlideMotion && !isVisible && !keepFlexOnExit ? 0 : undefined,
        transition: isSlideMotion ? 'flex 250ms ease, min-width 250ms ease, opacity 250ms ease, transform 250ms ease' : 'flex 280ms ease-out, opacity 280ms ease-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        transform: isSlideMotion ? (isVisible ? 'translateX(0)' : hiddenTransform) : undefined,
      }}
    >
      <div className="preview-dock__card">

        <div className="preview-dock__header">
          <span className="preview-dock__header-title">{title}</span>
          <button
            onClick={onClose}
            className="preview-dock__close-btn"
            aria-label="关闭预览"
            title="关闭预览区"
          >
            <X size={14} />
          </button>
        </div>

        <div className="preview-dock__body">
          {children}
        </div>

        {footer && (
          <div className="preview-dock__footer">
            <div style={footerReadonly ? { pointerEvents: 'none', opacity: 0.4, cursor: 'not-allowed' } : undefined}>
              {footer}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
