/**
 * TreeTablePanel — 工程结构树 + 数据表格双栏面板（右侧面板）
 *
 * 左侧：可展开/折叠的树形结构，支持多级节点及金额标注。
 * 右侧：分部分项清单表格，列头和行数据均由 props 传入。
 *
 * 用于树形结构与明细表联动展示。
 */
import { useState } from 'react'

export interface TreeNode {
  id: string
  label: string
  /** 副标注（如金额、条数） */
  meta?: string
  children?: TreeNode[]
  /** 初始是否展开 */
  defaultExpanded?: boolean
}

export interface TableColumn {
  key: string
  label: string
  /** 列宽（如 '80px' 或 120） */
  width?: string | number
  /** 对齐方式 */
  align?: 'left' | 'right' | 'center'
}

export interface TableRow {
  [key: string]: string
}

interface Props {
  treeTitle?: string
  treeNodes: TreeNode[]
  tableTitle?: string
  columns: TableColumn[]
  rows: TableRow[]
  /** 表格底部汇总行 */
  summaryRow?: TableRow
}

function TreeNodeItem({
  node,
  depth = 0,
}: {
  node: TreeNode
  depth?: number
}) {
  const [expanded, setExpanded] = useState(node.defaultExpanded !== false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        onClick={() => hasChildren && setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `5px 8px 5px ${8 + depth * 16}px`,
          cursor: hasChildren ? 'pointer' : 'default',
          borderRadius: 4,
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => hasChildren && ((e.currentTarget as HTMLElement).style.background = 'var(--secondary)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        {/* 展开箭头占位 */}
        <span style={{
          width: 14,
          flexShrink: 0,
          color: 'var(--text-muted)',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.15s',
          transform: hasChildren ? (expanded ? 'rotate(90deg)' : 'rotate(0deg)') : 'none',
        }}>
          {hasChildren ? '▶' : ''}
        </span>

        <span style={{
          flex: 1,
          fontSize: 'var(--font-size-sm)',
          color: depth === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: depth === 0 ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.label}
        </span>

        {node.meta && (
          <span style={{
            flexShrink: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            marginLeft: 4,
          }}>
            {node.meta}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map(child => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TreeTablePanel({
  treeTitle = '工程结构',
  treeNodes,
  tableTitle = '清单明细',
  columns,
  rows,
  summaryRow,
}: Props) {
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* 左侧树 */}
      <div style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 12px',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--page-bg)',
          flexShrink: 0,
        }}>
          {treeTitle}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 4px' }}>
          {treeNodes.map(node => (
            <TreeNodeItem key={node.id} node={node} />
          ))}
        </div>
      </div>

      {/* 右侧表格 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '10px 14px',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--page-bg)',
          flexShrink: 0,
        }}>
          {tableTitle}
          <span style={{
            marginLeft: 6,
            fontWeight: 'var(--font-weight-normal)',
            color: 'var(--text-muted)',
          }}>
            共 {rows.length} 条
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--font-size-sm)',
          }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--page-bg)', zIndex: 1 }}>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{
                    padding: '8px 10px',
                    textAlign: col.align || 'left',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border)',
                    width: col.width,
                    whiteSpace: 'nowrap',
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{
                  borderBottom: '1px solid var(--border)',
                  background: ri % 2 === 0 ? 'var(--card)' : 'var(--page-bg)',
                }}>
                  {columns.map(col => (
                    <td key={col.key} style={{
                      padding: '7px 10px',
                      color: 'var(--text-primary)',
                      textAlign: col.align || 'left',
                    }}>
                      {row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}

              {summaryRow && (
                <tr style={{
                  background: 'var(--accent-light)',
                  fontWeight: 'var(--font-weight-bold)',
                  position: 'sticky',
                  bottom: 0,
                }}>
                  {columns.map(col => (
                    <td key={col.key} style={{
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      textAlign: col.align || 'left',
                      borderTop: '1px solid var(--border)',
                    }}>
                      {summaryRow[col.key] ?? ''}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
