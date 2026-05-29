/**
 * ContractOverviewCard.tsx
 *
 * Gate 确认节点卡片（info-confirm 类型）。
 * 展示 AI 解析出的合同结构概览，用户确认后触发全文风险扫描。
 *
 * 5 种状态：default / loading / completed / disabled / error
 */

import React from 'react';

type CardStatus = 'default' | 'loading' | 'completed' | 'disabled' | 'error';

interface ContractOverviewCardProps {
  /** 识别章节数 */
  chapters: number;
  /** 识别条款数 */
  clauses: number;
  /** 文档页数 */
  pages: number;
  /** AI 识别的合同类型 */
  detectedType: string;
  /** 审查重点标签列表 */
  reviewFocus: string[];
  /** 卡片状态 */
  status?: CardStatus;
  /** 用于 handleComponentAction 的 message id（Gate 确认时回传） */
  messageId?: string;
  /** 由 MessageBubble 注入的 dispatch 包装函数 */
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

const ContractOverviewCard: React.FC<ContractOverviewCardProps> = ({
  chapters,
  clauses,
  pages,
  detectedType,
  reviewFocus,
  status = 'default',
  messageId,
  onAction,
}) => {
  const isCompleted = status === 'completed';
  const isDisabled = status === 'disabled' || isCompleted;
  const isLoading = status === 'loading';
  const isError = status === 'error';

  const cardOpacity = status === 'disabled' ? 0.5 : 1;

  const infoRows = [
    { label: '合同类型', value: detectedType },
    { label: '识别章节', value: `共 ${chapters} 章` },
    { label: '识别条款', value: `共 ${clauses} 条` },
    { label: '文档页数', value: `共 ${pages} 页` },
    {
      label: '审查重点',
      value: reviewFocus.join('　·　'),
    },
  ];

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        border: isError
          ? '1px solid var(--destructive)'
          : '1px solid var(--border)',
        background: 'var(--card)',
        overflow: 'hidden',
        opacity: cardOpacity,
        maxWidth: 420,
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
          background: isError ? '#fff0f0' : 'var(--page-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <span
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
            }}
          >
            合同结构识别结果
          </span>
        </div>
        {/* 状态角标 */}
        {isCompleted && (
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-success)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            ✅ 已确认
          </span>
        )}
        {isError && (
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--destructive)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            解析失败
          </span>
        )}
        {isLoading && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            解析中…
          </span>
        )}
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        // 骨架屏
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[80, 60, 70, 55, 90].map((w, i) => (
            <div
              key={i}
              style={{
                height: 14,
                width: `${w}%`,
                borderRadius: 4,
                background: 'var(--secondary)',
              }}
            />
          ))}
        </div>
      ) : isError ? (
        // 错误状态
        <div style={{ padding: '16px' }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--radius)',
              background: '#fff0f0',
              border: '1px solid var(--destructive)',
            }}
          >
            <div
              style={{
                width: 3,
                borderRadius: 2,
                background: 'var(--destructive)',
                flexShrink: 0,
              }}
            />
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--destructive)',
                  margin: '0 0 4px',
                }}
              >
                合同文件解析失败
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                请确认上传的文件为有效 PDF 格式，或重新上传后重试。
              </p>
            </div>
          </div>
        </div>
      ) : (
        // 正常状态（default / completed / disabled）
        <div>
          {infoRows.map(({ label, value }, idx) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom:
                  idx < infoRows.length - 1 ? '1px solid var(--border)' : 'none',
                background: idx % 2 === 0 ? 'var(--card)' : 'var(--page-bg)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--text-secondary)',
                  width: 80,
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      {!isLoading && !isError && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--card)',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          {!isCompleted && (
            <button
              disabled={isDisabled}
              onClick={() =>
                onAction?.('reupload', { messageId })
              }
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--secondary)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-base)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              信息有误，重新上传
            </button>
          )}
          <button
            disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) {
                onAction?.('confirm_structure', { messageId });
              }
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isCompleted ? 'var(--secondary)' : 'var(--accent)',
              color: isCompleted ? 'var(--text-secondary)' : '#fff',
              fontSize: 'var(--font-size-base)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 'var(--font-weight-bold)',
              opacity: isCompleted ? 0.7 : 1,
            }}
          >
            {isCompleted ? '已确认' : '确认，开始扫描'}
          </button>
        </div>
      )}

      {isError && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => onAction?.('reupload', { messageId })}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--destructive)',
              color: '#fff',
              fontSize: 'var(--font-size-base)',
              cursor: 'pointer',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            重新上传
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractOverviewCard;
