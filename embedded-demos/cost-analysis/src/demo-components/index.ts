/**
 * demo-components/index.ts — 全局演示组件注册表
 *
 * 在此注册的组件可被所有场景的 scenario.ts 通过字符串名称引用，
 * 无需在每个场景的 extraComponentMap 中重复声明。
 *
 * 维护规则（设计师）：
 *   1. 在 src/demo-components/ 下新建组件文件
 *   2. 在此文件 import 并注册到 demoComponentRegistry
 *   3. 更新 SKILL.md 的「可用组件库」章节，AI 即可生成该组件
 *
 * 场景专属（孵化中）的组件不在此注册，在各自 scenario.ts 的
 * extraComponentMap 中声明，不污染核心项目。
 */
import type React from 'react'

// ─── 对话区卡片（Chat Cards） ─────────────────────────────────────────────────
import ScenarioSelectCard from './ScenarioSelectCard'
import ProgressCard from './ProgressCard'
import MultiSelectCard from './MultiSelectCard'
import SummaryTableCard from './SummaryTableCard'
import ConfigFormCard from './ConfigFormCard'

// ─── 右侧面板（Right Panels） ─────────────────────────────────────────────────
import FileListPanel from './FileListPanel'
import FormPanel from './FormPanel'
import TreeTablePanel from './TreeTablePanel'
import MultiTabPanel from './MultiTabPanel'
import ProgressOverlayPanel from './ProgressOverlayPanel'

export const demoComponentRegistry: Record<string, React.ComponentType<any>> = {
  // 对话区卡片
  ScenarioSelectCard,
  ProgressCard,
  MultiSelectCard,
  SummaryTableCard,
  ConfigFormCard,

  // 右侧面板
  FileListPanel,
  FormPanel,
  TreeTablePanel,
  MultiTabPanel,
  ProgressOverlayPanel,
}
