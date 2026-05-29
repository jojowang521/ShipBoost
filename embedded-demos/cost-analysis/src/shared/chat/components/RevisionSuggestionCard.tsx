/**
 * RevisionSuggestionCard.tsx
 *
 * 三方案对比卡片（演示高光 2）。
 * 用户追问「第28条怎么改」时，AI 回复后附带此卡片展示
 * 强势版 / 平衡版 / 保守版 三种修改方案，可展开查看修改后文本。
 *
 * 5 种状态：default / loading / completed / disabled / error
 */

import React, { useState } from 'react';

type CardStatus = 'default' | 'loading' | 'completed' | 'disabled' | 'error';
type OptionType = '强势版' | '平衡版' | '保守版';

interface RevisionOption {
  type: OptionType;
  description: string;
  revisedText: string;
}

interface RevisionSuggestionCardProps {
  clauseNumber: string;
  clauseTitle: string;
  options: RevisionOption[];
  status?: CardStatus;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

const OPTION_STYLE: Record<OptionType, { label: string; color: string; bg: string; border: string }> = {
  强势版: {
    label: '强势版',
    color: 'var(--destructive)',
    bg: '#fff0f0',
    border: '#fecaca',
  },
  平衡版: {
    label: '平衡版',
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
    border: '#c7d2fe',
  },
  保守版: {
    label: '保守版',
    color: 'var(--text-success)',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
};

const RevisionSuggestionCard: React.FC<RevisionSuggestionCardProps> = ({
  clauseNumber,
  clauseTitle,
  options,
  status = 'default',
  onAction,
}) => {
  const [expandedType, setExpandedType] = useState<OptionType | null>(null);
  const [selectedType, setSelectedType] = useState<OptionType | null>(null);

  const isCompleted = status === 'completed';
  const isDisabled = status === 'disabled' || isCompleted;
  const isLoading = status === 'loading';
  const isError = status === 'error';

  const handleSelect = (type: OptionType) => {
    if (isDisabled) return;
    setSelectedType(type);
    onAction?.('select_revision', { type, clauseNumber });
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        border: isError ? '1px solid var(--destructive)' : '1px solid var(--border)',
        background: 'var(--card)',
        overflow: 'hidden',
        opacity: status === 'disabled' ? 0.5 : 1,
        maxWidth: 520,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--page-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>✏️</span>
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 'var(--line-height-tight)',
              }}
            >
              修改方案对比
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              {clauseNumber}　{clauseTitle}
            </p>
          </div>
        </div>
        {isCompleted && (
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-success)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            ✅ 已选定
          </span>
        )}
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius)',
                background: 'var(--secondary)',
                height: 72,
              }}
            />
          ))}
        </div>
      ) : isError ? (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius)',
              background: '#fff0f0',
              borderLeft: '3px solid var(--destructive)',
            }}
          >
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--destructive)', margin: 0 }}>
              修改方案加载失败，请重新追问。
            </p>
          </div>
        </div>
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              margin: '0 0 4px',
              lineHeight: 'var(--line-height-base)',
            }}
          >
            以下三种方案可根据谈判空间灵活选用，点击方案标题可展开查看修改后条款文本：
          </p>

          {options.map((opt) => {
            const style = OPTION_STYLE[opt.type];
            const isExpanded = expandedType === opt.type;
            const isSelected = selectedType === opt.type;

            return (
              <div
                key={opt.type}
                style={{
                  borderRadius: 'var(--radius)',
                  border: isSelected
                    ? `2px solid ${style.color}`
                    : `1px solid ${style.border}`,
                  background: style.bg,
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* 方案头：点击展开/收起 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => setExpandedType(isExpanded ? null : opt.type)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: style.color,
                          color: '#fff',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-bold)',
                        }}
                      >
                        {style.label}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            color: style.color,
                            fontWeight: 'var(--font-weight-bold)',
                          }}
                        >
                          ✓ 已选用
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: 'var(--font-size-base)',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 'var(--line-height-base)',
                      }}
                    >
                      {opt.description}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginLeft: 8,
                      marginTop: 2,
                      flexShrink: 0,
                      transition: 'transform 0.15s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▾
                  </span>
                </div>

                {/* 展开：修改后条款文本 */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 14px 12px',
                      borderTop: `1px dashed ${style.border}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-muted)',
                        margin: '10px 0 6px',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      修改后条款文本：
                    </p>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-primary)',
                          lineHeight: 'var(--line-height-base)',
                          margin: 0,
                        }}
                      >
                        {opt.revisedText}
                      </p>
                    </div>

                    {!isDisabled && (
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(opt.type);
                          }}
                          style={{
                            padding: '5px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: isSelected ? 'var(--secondary)' : style.color,
                            color: isSelected ? 'var(--text-secondary)' : '#fff',
                            fontSize: 'var(--font-size-base)',
                            cursor: 'pointer',
                            fontWeight: 'var(--font-weight-bold)',
                          }}
                        >
                          {isSelected ? '已选用此方案' : '选用此方案'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      {!isLoading && !isError && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            {selectedType
              ? `已选定「${selectedType}」，建议提交法务团队复核`
              : '点击展开查看修改后文本，选定后可提交法务复核'}
          </p>
          {selectedType && !isDisabled && (
            <button
              onClick={() => onAction?.('select_revision', { type: selectedType, clauseNumber })}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                fontWeight: 'var(--font-weight-bold)',
                flexShrink: 0,
              }}
            >
              确认使用
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RevisionSuggestionCard;
