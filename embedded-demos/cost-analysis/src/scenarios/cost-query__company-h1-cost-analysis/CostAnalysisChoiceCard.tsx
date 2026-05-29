import { useMemo, useState } from 'react'

interface ChoiceRow {
  id: string
  index: string
  label: string
  description: string
  example?: string
}

interface Props {
  handled?: boolean
  onAction?: (action: string, payload: Record<string, unknown>) => void
  messageId?: string
}

const DIMENSION_ROWS: ChoiceRow[] = [
  {
    id: 'project',
    index: '1',
    label: '按项目汇总',
    description: '各项目成本总额及单方对比',
    example: '项目 A vs 项目 B 的建面单方',
  },
  {
    id: 'product',
    index: '2',
    label: '按业态分解',
    description: '住宅、商业、车库等业态成本构成',
    example: '住宅单方 vs 车库单方',
  },
  {
    id: 'subject',
    index: '3',
    label: '按科目穿透',
    description: '建安、土建、安装、精装等科目金额',
    example: '各科目占总成本比例',
  },
  {
    id: 'city',
    index: '4',
    label: '按城市分布',
    description: '不同城市的成本水平对比',
    example: '深圳 vs 上海项目单方',
  },
]

const METRIC_ROWS: ChoiceRow[] = [
  {
    id: 'amount',
    index: '1',
    label: '总金额',
    description: '科目或项目累计成本',
  },
  {
    id: 'unit',
    index: '2',
    label: '建面单方',
    description: '元/平方米，常用对比口径',
  },
  {
    id: 'cost',
    index: '3',
    label: '单位造价',
    description: '按测算基础的造价',
  },
]

function renderRadioTable(
  title: string,
  groupName: string,
  rows: ChoiceRow[],
  selectedId: string,
  onSelect: (id: string) => void,
  handled?: boolean,
) {
  return (
    <section className="cost-choice-section" aria-label={title}>
      <div className="cost-choice-section__title">{title}</div>
      <div className="cost-choice-table-wrap">
        <table className="cost-choice-table">
          <colgroup>
            <col style={{ width: 48 }} />
            <col style={{ width: 64 }} />
            <col />
            <col />
            {rows.some(row => row.example) && <col />}
          </colgroup>
          <thead>
            <tr>
              <th aria-label="选择" />
              <th className="cost-choice-table__index-head">序号</th>
              <th>{groupName === 'dimension' ? '分析维度' : '指标类型'}</th>
              <th>说明</th>
              {rows.some(row => row.example) && <th>示例</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const selected = row.id === selectedId
              return (
                <tr
                  key={row.id}
                  className={selected ? 'cost-choice-table__row cost-choice-table__row--selected' : 'cost-choice-table__row'}
                  onClick={() => {
                    if (!handled) onSelect(row.id)
                  }}
                >
                  <td className="cost-choice-table__radio-cell">
                    <input
                      type="radio"
                      name={groupName}
                      checked={selected}
                      disabled={handled}
                      onChange={() => onSelect(row.id)}
                      aria-label={row.label}
                    />
                  </td>
                  <td className="cost-choice-table__index-cell">{row.index}</td>
                  <td className="cost-choice-table__label">{row.label}</td>
                  <td>{row.description}</td>
                  {rows.some(item => item.example) && <td>{row.example || '-'}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function CostAnalysisChoiceCard({
  handled,
  onAction,
  messageId,
}: Props) {
  const [dimensionId, setDimensionId] = useState('subject')
  const [metricId, setMetricId] = useState('unit')

  const selected = useMemo(() => {
    const dimension = DIMENSION_ROWS.find(row => row.id === dimensionId) || DIMENSION_ROWS[2]
    const metric = METRIC_ROWS.find(row => row.id === metricId) || METRIC_ROWS[1]
    return { dimension, metric }
  }, [dimensionId, metricId])

  const handleConfirm = () => {
    if (handled || !onAction) return
    onAction('costAnalysisConfirm', {
      messageId,
      dimensionId,
      metricId,
      dimension: selected.dimension.label,
      metric: selected.metric.label,
    })
  }

  return (
    <>
      <div className="demo-card cost-choice-card" style={{ opacity: handled ? 0.68 : 1 }}>
        <div className="demo-card__body cost-choice-card__body">
          {renderRadioTable(
            '请选择您关注的分析维度',
            'dimension',
            DIMENSION_ROWS,
            dimensionId,
            setDimensionId,
            handled,
          )}
          {renderRadioTable(
            '请选择您关注的核心指标',
            'metric',
            METRIC_ROWS,
            metricId,
            setMetricId,
            handled,
          )}
        </div>
      </div>

      {!handled && (
        <div className="action-buttons-group cost-choice-card__actions">
          <button className="action-btn action-btn-primary" onClick={handleConfirm}>
            确定
          </button>
        </div>
      )}
    </>
  )
}
