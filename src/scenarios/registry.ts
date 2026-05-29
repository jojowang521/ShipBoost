// registry.ts — 场景注册表（双轨制）
//
// 轨道 1（MD）：扫描 {id}/business-design.md，通过 markdownParser + scenarioFactory 生成 ScenarioModule
// 轨道 2（Config）：扫描 {id}/scenario.ts，直接使用其默认导出的 ScenarioModule
//
// 优先级：同一 scenario id 若同时存在 scenario.ts 和 business-design.md，
// 以 scenario.ts（Config 轨道）为准，MD 文件被忽略。
//
// PM 只需：
//   - 简单场景：在 src/scenarios/{id}/ 下新增 business-design.md
//   - 复杂场景：AI 生成 src/scenarios/{id}/scenario.ts（含 defineScenario 调用）
//   刷新浏览器即可出现新场景，无需手动注册。
import { parseBusinessDesign } from '../engine/markdownParser'
import { createScenarioFromDesign } from '../engine/scenarioFactory'
import type { AgentProfile, ScenarioModule } from './types'

// ── 轨道 1：MD 驱动 ────────────────────────────────────────────────────────────
const mdModules = import.meta.glob('./*/business-design.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

// ── 轨道 2：Config 驱动（scenario.ts 直接导出 ScenarioModule）─────────────────
const scenarioModules = import.meta.glob('./*/scenario.ts', {
  eager: true,
  import: 'default',
}) as Record<string, ScenarioModule>

// ── 场景 Manifest：每个场景的专员身份、头像、快捷入口和数据隔离声明 ─────────────
const manifestModules = import.meta.glob('./*/scenario.manifest.json', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const AVATAR_POOL = ['avatar-ai-1', 'avatar-ai-2', 'avatar-ai-3', 'avatar-ai-4']

interface ScenarioManifest {
  agentId?: string
  agentName?: string
  agentDescription?: string
  avatarKey?: string
  scenarioName?: string
  shortcutLabel?: string
  shortcutOrder?: number
  hidden?: boolean
}

function getScenarioIdFromPath(filePath: string, suffix: string): string {
  return filePath.replace('./', '').replace(suffix, '')
}

function safeParseManifest(filePath: string, raw: string): ScenarioManifest {
  try {
    return JSON.parse(raw) as ScenarioManifest
  } catch (err) {
    console.warn(`[scenario registry] scenario.manifest.json 解析失败: ${filePath}`, err)
    return {}
  }
}

function slugifyAgentId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ai|专员|顾问/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'agent'
}

function toShortcutLabel(label: string): string {
  return label.replace(/\s+/g, '').slice(0, 8) || '演示场景'
}

const manifestById: Record<string, ScenarioManifest> = Object.fromEntries(
  Object.entries(manifestModules).map(([filePath, raw]) => [
    getScenarioIdFromPath(filePath, '/scenario.manifest.json'),
    safeParseManifest(filePath, raw),
  ])
)

// 收集所有 Config 轨道已覆盖的 id，用于跳过重复的 MD 文件
const configIds = new Set(
  Object.keys(scenarioModules).map(path =>
    getScenarioIdFromPath(path, '/scenario.ts')
  )
)

// ── 处理 Config 轨道 ──────────────────────────────────────────────────────────
const configScenarios: ScenarioModule[] = Object.entries(scenarioModules).map(
  ([, module]) => module
)

// ── 处理 MD 轨道（跳过已被 Config 轨道覆盖的 id）──────────────────────────────
const mdScenarios: ScenarioModule[] = Object.entries(mdModules)
  .filter(([filePath]) => {
    const id = filePath.replace('./', '').replace('/business-design.md', '')
    return !configIds.has(id)
  })
  .map(([filePath, raw]) => {
    const id = getScenarioIdFromPath(filePath, '/business-design.md')
    const doc = parseBusinessDesign(raw)
    return createScenarioFromDesign(id, doc)
  })

// ── 合并、挂载 manifest，并按 AI 专员分配稳定头像 ─────────────────────────────
// Config 轨道在前，MD 轨道在后。同一 AI 专员下的场景共用头像。
const agentAvatarById = new Map<string, string>()
const scenarioRegistry: ScenarioModule[] = [
  ...configScenarios,
  ...mdScenarios,
].map((module) => {
  const manifest = manifestById[module.id] || {}
  const doc = (module as any)._doc
  const agentName = manifest.agentName || module.agentName || doc?.meta?.agentName || module.label || 'AI 助手'
  const agentId = manifest.agentId || module.agentId || slugifyAgentId(agentName)
  const scenarioName = manifest.scenarioName || module.label

  let avatarKey = manifest.avatarKey || module.avatarKey || agentAvatarById.get(agentId)
  if (!avatarKey) {
    avatarKey = AVATAR_POOL[agentAvatarById.size % AVATAR_POOL.length]
  }
  agentAvatarById.set(agentId, avatarKey)

  return {
    ...module,
    label: scenarioName,
    agentId,
    agentName,
    agentDescription: manifest.agentDescription || module.agentDescription || doc?.meta?.agentDescription || '',
    avatarKey,
    shortcutLabel: toShortcutLabel(manifest.shortcutLabel || module.shortcutLabel || scenarioName),
    shortcutOrder: manifest.shortcutOrder ?? module.shortcutOrder ?? 999,
    hidden: manifest.hidden ?? module.hidden,
  }
})

function buildAgentProfiles(): AgentProfile[] {
  const groups = new Map<string, ScenarioModule[]>()
  for (const scenario of scenarioRegistry) {
    if (!scenario.agentId) continue
    const list = groups.get(scenario.agentId) || []
    list.push(scenario)
    groups.set(scenario.agentId, list)
  }

  return Array.from(groups.entries()).map(([agentId, scenarios]) => {
    const sorted = [...scenarios].sort((a, b) => {
      const orderDiff = (a.shortcutOrder ?? 999) - (b.shortcutOrder ?? 999)
      return orderDiff !== 0 ? orderDiff : a.label.localeCompare(b.label, 'zh-CN')
    })
    const primary = sorted[0]
    return {
      agentId,
      agentName: primary.agentName || primary.label,
      agentDescription: primary.agentDescription || '选择下方场景开始演示',
      avatarKey: primary.avatarKey || 'avatar-ai-1',
      scenarios: sorted,
      homeChips: sorted.slice(0, 4).map(s => ({
        label: toShortcutLabel(s.shortcutLabel || s.label),
        scenarioId: s.id,
      })),
    }
  })
}

const agentProfiles = buildAgentProfiles()

export function getScenario(id: string | null): ScenarioModule | undefined {
  if (!id) return undefined
  return scenarioRegistry.find(s => s.id === id)
}

export function getAllScenarios(): ScenarioModule[] {
  return scenarioRegistry
}

export function getAgent(agentId: string | null): AgentProfile | undefined {
  if (!agentId) return undefined
  return agentProfiles.find(a => a.agentId === agentId)
}

export function getAllAgents(): AgentProfile[] {
  return agentProfiles
}

export { scenarioRegistry }
