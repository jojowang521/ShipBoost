import TabbedArtifactPanel from './TabbedArtifactPanel'
import type { GeneratedArtifact } from '../types'

interface Props {
  description: string
  artifacts?: GeneratedArtifact[]
  onClosePreview?: () => void
  targetArtifactTitle?: string | null
}

const DEFAULT_ARTIFACTS: GeneratedArtifact[] = [
  {
    title: '控制价审核报告',
    meta: '汇总审核结论、风险概览和核心关注点',
  },
  {
    title: '控制价审核明细',
    meta: '展示异常清单、指标偏差和综合单价明细',
  },
]

export default function StandardControlPriceWorkbench({
  description,
  artifacts,
  onClosePreview,
  targetArtifactTitle,
}: Props) {
  return (
    <TabbedArtifactPanel
      description={description}
      artifacts={artifacts && artifacts.length > 0 ? artifacts : DEFAULT_ARTIFACTS}
      onClosePreview={onClosePreview}
      targetArtifactTitle={targetArtifactTitle}
    />
  )
}

;(StandardControlPriceWorkbench as any).hasInternalClose = true
