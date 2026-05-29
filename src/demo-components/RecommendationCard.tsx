/**
 * RecommendationCard — AI 推荐方案卡片（对话区）
 *
 * 用于 AI 需要用户做方案决策的场景。AI 最多推送 6 种方案（含「其他」兜底）。
 * 支持单选（single）和多选（multiple）两种模式。
 * 底部摘要行展示 AI 的推荐理由。
 *
 * 单选模式：点击编号方案直接触发 branchSelect，「其他」展开输入框后点「提交」触发。
 * 多选模式：积累选中后点「确认方案」按钮触发 confirmGate。
 */
import { useState } from 'react'

export interface Scheme {
  id: string
  label: string
  description?: string
}

export interface RecommendationSummary {
  /** 推荐的 scheme id，用于在摘要行渲染方案名称 */
  recommendedId: string
  /** 一句话推荐原因 */
  reason: string
}

type SelectMode = 'single' | 'multiple'

interface Props {
  title?: string
  summary: RecommendationSummary
  /** 最多 5 条，第 6 条「其他」由 showOther 控制 */
  schemes: Scheme[]
  showOther?: boolean
  otherPlaceholder?: string
  mode?: SelectMode
  confirmLabel?: string
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function RecommendationCard({
  title = '选择方案',
  summary,
  schemes,
  showOther = true,
  otherPlaceholder = '请描述你的具体需求或想法…',
  mode = 'single',
  confirmLabel = '确认方案',
  handled,
  onAction,
  messageId,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [customText, setCustomText] = useState('')

  const recommendedLabel =
    schemes.find(s => s.id === summary.recommendedId)?.label ?? summary.recommendedId

  const handleSelect = (scheme: Scheme) => {
    if (handled) return
    if (mode === 'single') {
      setSelectedIds([scheme.id])
      setIsOtherSelected(false)
      onAction?.('branchSelect', { selectedId: scheme.id, selectedLabel: scheme.label, messageId })
    } else {
      setSelectedIds(prev =>
        prev.includes(scheme.id) ? prev.filter(id => id !== scheme.id) : [...prev, scheme.id]
      )
    }
  }

  const handleOtherClick = () => {
    if (handled) return
    const next = !isOtherSelected
    setIsOtherSelected(next)
    if (mode === 'multiple') {
      setSelectedIds(prev =>
        next ? [...prev, 'other'] : prev.filter(id => id !== 'other')
      )
    } else if (next) {
      setSelectedIds([])
    }
  }

  const handleOtherSubmit = () => {
    if (!customText.trim()) return
    onAction?.('branchSelect', { selectedId: 'other', customText: customText.trim(), messageId })
  }

  const handleMultiConfirm = () => {
    const selectedLabels = selectedIds
      .filter(id => id !== 'other')
      .map(id => schemes.find(s => s.id === id)?.label ?? id)
    onAction?.('confirmGate', {
      selectedIds,
      selectedLabels,
      customText: isOtherSelected ? customText : undefined,
      messageId,
    })
  }

  return (
    <>
      <div className="demo-card" style={{ opacity: handled ? 0.65 : 1 }}>
        {/* Header — 无背景无分割线，纯左对齐标题 */}
        <div style={{
          padding: '12px 16px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
          }}>
            {title}
          </span>
          {handled && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-success)' }}>
              ✓ 已选择
            </span>
          )}
        </div>

        {/* 方案列表 */}
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {schemes.map((scheme, idx) => {
            const isSelected = selectedIds.includes(scheme.id)
            return (
              <div
                key={scheme.id}
                onClick={() => handleSelect(scheme)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '9px 12px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  cursor: handled ? 'default' : 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* 选中指示器 */}
                <div style={{
                  width: 16, height: 16,
                  borderRadius: mode === 'single' ? '50%' : 4,
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {isSelected && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--text-primary)',
                    lineHeight: 'var(--line-height-tight)',
                  }}>
                    {idx + 1}. {scheme.label}
                  </div>
                  {scheme.description && (
                    <div style={{
                      marginTop: 3,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--line-height-base)',
                    }}>
                      {scheme.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* 「其他」选项 — 用单个 div 包裹，避免 flex gap 插入展开区和行之间 */}
          {showOther && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                onClick={handleOtherClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  borderRadius: isOtherSelected ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
                  border: '1px solid var(--border)',
                  borderBottom: isOtherSelected ? 'none' : undefined,
                  background: 'var(--card)',
                  cursor: handled ? 'default' : 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 16, height: 16,
                  borderRadius: mode === 'single' ? '50%' : 4,
                  border: `1.5px solid ${isOtherSelected ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: isOtherSelected ? 'var(--accent)' : 'transparent',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {isOtherSelected && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 2 }}>✏</span>
                <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>
                  其他（可补充说明）
                </span>
              </div>

              {/* 行内展开：输入区，与上方行紧贴（无 gap） */}
              {isOtherSelected && (
                <div style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius) var(--radius)',
                  background: 'var(--card)',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <textarea
                    autoFocus
                    rows={3}
                    placeholder={otherPlaceholder}
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    style={{
                      width: '100%', resize: 'vertical',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      fontSize: 'var(--font-size-base)',
                      color: 'var(--text-primary)',
                      background: 'var(--card)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 'var(--line-height-base)',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                  {mode === 'single' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="action-btn action-btn-primary"
                        disabled={!customText.trim()}
                        onClick={handleOtherSubmit}
                        style={{ padding: '5px 14px' }}
                      >
                        提交
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 摘要行：卡片外正文样式 */}
      <p style={{
        margin: '8px 0 0',
        fontSize: 'var(--font-size-base)',
        color: 'var(--text-secondary)',
        lineHeight: 'var(--line-height-base)',
      }}>
        推荐方案
        <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-bold)', margin: '0 2px' }}>
          「{recommendedLabel}」
        </span>
        ，{summary.reason}
      </p>

      {/* 多选模式：外部确认按钮 */}
      {mode === 'multiple' && !handled && (
        <div className="action-buttons-group">
          <button
            className="action-btn action-btn-primary"
            disabled={selectedIds.length === 0}
            onClick={handleMultiConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      )}
    </>
  )
}
