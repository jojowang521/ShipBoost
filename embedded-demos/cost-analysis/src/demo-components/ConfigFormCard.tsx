/**
 * ConfigFormCard — 配置表单卡片（对话区）
 *
 * 用于比价规则配置等场景，支持单选按钮组和下拉选择。
 * 用户调整参数后点击确认，触发 confirmGate 并传回表单值。
 */
import { useState } from 'react'

export type FieldType = 'radio-group' | 'select'

export interface FormFieldConfig {
  key: string
  label: string
  type: FieldType
  options: string[]
  defaultValue?: string
  /** 推荐选项（在选项旁显示「推荐」标签） */
  recommended?: string
  unit?: string
}

interface Props {
  title?: string
  fields: FormFieldConfig[]
  confirmLabel?: string
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

export default function ConfigFormCard({
  title = '请配置参数',
  fields,
  confirmLabel = '确认并继续',
  handled,
  onAction,
  messageId,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(fields.map(f => [f.key, f.defaultValue ?? f.options[0] ?? '']))
  )

  const handleConfirm = () => {
    if (handled || !onAction) return
    onAction('confirmGate', { messageId, formValues: values })
  }

  return (
    <>
      <div className="demo-card" style={{ opacity: handled ? 0.65 : 1 }}>
        <div className="demo-card__header">
          <span className="demo-card__title">{title}</span>
          {handled && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-success)' }}>
              ✓ 已确认
            </span>
          )}
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(field => (
            <div key={field.key}>
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                marginBottom: 8,
                fontWeight: 'var(--font-weight-bold)',
              }}>
                {field.label}
              </div>

              {field.type === 'radio-group' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {field.options.map(opt => {
                    const selected = values[field.key] === opt
                    return (
                      <button
                        key={opt}
                        disabled={!!handled}
                        onClick={() => setValues(prev => ({ ...prev, [field.key]: opt }))}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                          background: selected ? 'var(--accent-light)' : 'var(--card)',
                          color: selected ? 'var(--accent)' : 'var(--text-primary)',
                          fontSize: 'var(--font-size-sm)',
                          cursor: handled ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt}
                        {field.recommended === opt && (
                          <span style={{
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: 'var(--accent)',
                            color: '#fff',
                          }}>
                            推荐
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {field.type === 'select' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={values[field.key]}
                    onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    disabled={!!handled}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      fontSize: 'var(--font-size-base)',
                      color: 'var(--text-primary)',
                      cursor: handled ? 'default' : 'pointer',
                    }}
                  >
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {field.unit && (
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {field.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!handled && (
        <div className="action-buttons-group">
          <button className="action-btn action-btn-primary" onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </div>
      )}
    </>
  )
}
