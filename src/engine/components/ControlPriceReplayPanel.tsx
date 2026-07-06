import StandardControlPriceWorkbench from './StandardControlPriceWorkbench'

const fallbackDescription = `**工作台卡片：控制价审核报告**

页面已在右侧工作台打开

## 招标控制价审核报告

请在对应演示场景的 \`### 右侧面板\` 中补充控制价审核报告正文和 \`**控制价审核明细**\` 分隔内容。`

export default function ControlPriceReplayPanel(props: { onClosePreview?: () => void; targetArtifactTitle?: string | null }) {
  return (
    <StandardControlPriceWorkbench
      {...props}
      description={fallbackDescription}
    />
  )
}

;(ControlPriceReplayPanel as any).hasInternalClose = true
