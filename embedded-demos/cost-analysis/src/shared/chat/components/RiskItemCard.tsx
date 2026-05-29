/**
 * RiskItemCard.tsx
 *
 * 单条风险条款详情卡片，可在 Chat 消息流中内联展示。
 * 适用场景：用户追问某条款，AI 回复时附带此卡片。
 *
 * 5 种状态：default / loading / completed / disabled / error
 */

import React from 'react';

type RiskLevel = 'high' | 'medium' | 'low';
type CardStatus = 'default' | 'loading' | 'completed' | 'disabled' | 'error';

interface RiskItemCardProps {
  clauseNumber: string;
  title: string;
  originalText: string;
  riskLevel: RiskLevel;
  riskDescription: string;
  suggestion: string;
  status?: CardStatus;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

function riskConfig(level: RiskLevel) {
  switch (level) {
    case 'high':
      return {
        label: '高风险',
        textColor: 'var(--destructive)',
        bg: '#fff0f0',
        border: '#fecaca',
        leftBar: '#ef4444',
        badgeBg: '#fee2e2',
      };
    case 'medium':
      return {
        label: '中风险',
        textColor: 'var(--text-warning)',
        bg: '#fffbeb',
        border: '#fde68a',
        leftBar: '#d97706',
        badgeBg: '#fef3c7',
      };
    case 'low':
      return {
        label: '低风险',
        textColor: 'var(--text-success)',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        leftBar: '#16a34a',
        badgeBg: '#dcfce7',
      };
  }
}

const RiskItemCard: React.FC<RiskItemCardProps> = ({
  clauseNumber,
  title,
  originalText,
  riskLevel,
  riskDescription,
  suggestion,
  status = 'default',
  onAction,
}) => {
  const cfg = riskConfig(riskLevel);
  const isCompleted = status === 'completed';
  const isDisabled = status === 'disabled' || isCompleted;
  const isLoading = status === 'loading';
  const isError = status === 'error';

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        border: isError ? '1px solid var(--destructive)' : '1px solid var(--border)',
        background: 'var(--card)',
        overflow: 'hidden',
        opacity: status === 'disabled' ? 0.5 : 1,
        maxWidth: 480,
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
          padding: '11px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--page-bg)',
          borderLeft: `3px solid ${cfg.leftBar}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
            }}
          >
            {clauseNumber}　{title}
          </span>
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: cfg.badgeBg,
            color: cfg.textColor,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-bold)',
            flexShrink: 0,
          }}
        >
          {isCompleted ? '✅ 已处理' : cfg.label}
        </span>
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[90, 75, 85, 65].map((w, i) => (
            <div
              key={i}
              style={{
                height: 12,
                width: `${w}%`,
                borderRadius: 4,
                background: 'var(--secondary)',
              }}
            />
          ))}
        </div>
      ) : isError ? (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              background: '#fff0f0',
              borderLeft: '3px solid var(--destructive)',
            }}
          >
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--destructive)', margin: 0 }}>
              条款信息加载失败，请重试。
            </p>
          </div>
        </div>
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 原文摘录 */}
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-muted)',
                margin: '0 0 4px',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              原文摘录
            </p>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
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
                {originalText}
              </p>
            </div>
          </div>

          {/* 风险说明 */}
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-muted)',
                margin: '0 0 4px',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              风险说明
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--line-height-base)',
                margin: 0,
              }}
            >
              {riskDescription}
            </p>
          </div>

          {/* 修改建议 */}
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-muted)',
                margin: '0 0 4px',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              修改建议
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--line-height-base)',
                margin: 0,
              }}
            >
              {suggestion}
            </p>
          </div>
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
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            disabled={isDisabled}
            onClick={() =>
              onAction?.('ask_clause', {
                clauseNumber,
                clauseTitle: title,
              })
            }
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--secondary)',
              color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
              fontSize: 'var(--font-size-base)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            {isCompleted ? '已追问' : '追问此条款'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskItemCard;
