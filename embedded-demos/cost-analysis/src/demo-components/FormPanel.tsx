/**
 * FormPanel — 数据采集表单面板（右侧面板）
 *
 * 用于展示预填的采集表单（只读展示，非交互），
 * 支持分组标题，字段以 label/value 形式呈现。
 * 必填字段在 label 旁显示红色星号。
 */

export interface FormField {
  label: string
  value: string
  required?: boolean
  /** 空值时的占位提示 */
  placeholder?: string
}

export interface FormSection {
  /** 分组标题（可选），无标题则字段直接展示 */
  title?: string
  fields: FormField[]
}

interface Props {
  title?: string
  sections: FormSection[]
}

export default function FormPanel({ title = '采集信息表单', sections }: Props) {
  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      {title && (
        <div style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 16,
        }}>
          {title}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map((section, si) => (
          <div key={si} style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}>
            {section.title && (
              <div style={{
                padding: '8px 14px',
                background: 'var(--page-bg)',
                borderBottom: '1px solid var(--border)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
              }}>
                {section.title}
              </div>
            )}

            <div style={{ padding: '2px 0' }}>
              {section.fields.map((field, fi) => (
                <div key={fi} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '9px 14px',
                  borderBottom: fi < section.fields.length - 1
                    ? '1px solid var(--border)'
                    : 'none',
                  gap: 8,
                }}>
                  <div style={{
                    width: 100,
                    flexShrink: 0,
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--line-height-base)',
                    paddingTop: 1,
                  }}>
                    {field.required && (
                      <span style={{ color: 'var(--text-danger)', marginRight: 2 }}>*</span>
                    )}
                    {field.label}
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: 'var(--font-size-base)',
                    color: field.value ? 'var(--text-primary)' : 'var(--text-muted)',
                    lineHeight: 'var(--line-height-base)',
                  }}>
                    {field.value || field.placeholder || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
