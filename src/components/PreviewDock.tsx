/**
 * PreviewDock — 右侧预览区统一宿主
 *
 * 三段式布局：
 * - Header: 动态标题(左对齐) + 关闭按钮(右对齐)
 * - Body:   children 可滚动内容区
 * - Footer: 可选操作区（贴在整张预览白卡底部；主按钮用 .action-btn 与对话区一致）
 */
import React from 'react'
import { FileText, Maximize2, RefreshCw, X } from 'lucide-react'

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
  motionMs?: number
  hideHeaderClose?: boolean
  hideHeader?: boolean
  children?: React.ReactNode
}

export function PreviewDock({ isVisible, onClose, title = '内容预览', footer, footerReadonly = false, flex, closingFlex, keepFlexOnExit = false, hiddenTransform = 'translateX(28px)', motion = 'none', motionMs = 250, hideHeaderClose = false, hideHeader = false, children }: Props) {
  const isSlideMotion = motion === 'slide-left' || motion === 'slide-right'
  const visibleFlex = flex || '1 1 0'
  const slideTransition = `flex ${motionMs}ms ease, min-width ${motionMs}ms ease, opacity ${motionMs}ms ease, transform ${motionMs}ms ease`
  return (
    <div
      className={`preview-dock${isSlideMotion ? ` preview-dock--${motion}` : ''}${isVisible ? ' preview-dock--visible' : ''}`}
      style={{
        flex: isVisible || keepFlexOnExit ? visibleFlex : (closingFlex || '0 0 0%'),
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        minWidth: isSlideMotion && !isVisible && !keepFlexOnExit ? 0 : undefined,
        transition: isSlideMotion ? slideTransition : 'flex 280ms ease-out, opacity 280ms ease-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        transform: isSlideMotion ? (isVisible ? 'translateX(0)' : hiddenTransform) : undefined,
      }}
    >
      <div className="preview-dock__card">

        {!hideHeader && (
          <div className="preview-dock__header">
            <span className="preview-dock__header-title">
              <FileText className="preview-dock__header-title-icon" size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{title}</span>
            </span>
            <div className="preview-dock__header-actions">
              <button className="preview-dock__tool-btn" type="button" aria-label="刷新" title="刷新">
                <RefreshCw size={15} />
              </button>
              <button className="preview-dock__tool-btn" type="button" aria-label="放大" title="放大">
                <Maximize2 size={15} />
              </button>
              {!hideHeaderClose && (
                <button
                  onClick={onClose}
                  className="preview-dock__tool-btn"
                  aria-label="关闭预览"
                  title="关闭预览区"
                  type="button"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

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
