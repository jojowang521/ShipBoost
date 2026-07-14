import React, { useState } from 'react'
import GenericPanel from '../../engine/components/GenericPanel'
import type { ScenarioContext, ScenarioModule } from '../types'
import { genMessageId, streamFakeText } from '../../shared/utils'

const SCENARIO_ID = 'process-assistant__process-debug'
const AGENT_NAME = '系统管理助手'
const AVATAR_KEY = 'avatar-ai-2'

const flowTemplateRows = [
  { id: 'product-contract-approval', name: '产品立项申请与合同审批', helper: '状态：已发布' },
  { id: 'lease-contract-renewal', name: '租赁合同续签流程', helper: '状态：修订中' },
  { id: 'expense-contract-settlement', name: '费用合同结算流程', helper: '状态：草稿' },
]

const debugUserRows = [
  { id: 'debug-user-1', name: '张三', helper: '所属组织：集团-武汉分公司-信息部' },
  { id: 'debug-user-2', name: '李四', helper: '所属组织：集团-武汉分公司-财务部' },
  { id: 'debug-user-3', name: '王五', helper: '所属组织：集团-武汉分公司-成本部' },
]

function addAssistantMessage(ctx: ScenarioContext, text: string, onComplete?: () => void) {
  const id = genMessageId()
  ctx.dispatch({
    type: 'ADD_MESSAGE',
    message: {
      id,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      agentName: AGENT_NAME,
      agentAvatarKey: AVATAR_KEY,
    },
  })
  streamFakeText(text, id, ctx.dispatch, onComplete)
}

function addComponentMessage(ctx: ScenarioContext, component: string, props: Record<string, unknown> = {}) {
  ctx.dispatch({
    type: 'ADD_MESSAGE',
    message: {
      id: genMessageId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      agentName: AGENT_NAME,
      agentAvatarKey: AVATAR_KEY,
      component: component as any,
      componentProps: props,
    },
  })
}

function FlowTemplateSelectCard({ handled, onAction, messageId }: any) {
  const [selected, setSelected] = useState(flowTemplateRows[0].id)
  const [supplement, setSupplement] = useState('')
  const selectedRow = flowTemplateRows.find(row => row.id === selected) || flowTemplateRows[0]
  const label = supplement.trim() || selectedRow.name

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--choice-list process-debug-choice-card${handled ? ' is-handled' : ''}` },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '选择调试流程（可以在补充说明中输入要调试流程名称）')
        )
      ),
      React.createElement('div', { className: 'template-choice-list' },
        flowTemplateRows.map(row => (
          React.createElement('button', {
            key: row.id,
            type: 'button',
            disabled: handled,
            className: `template-choice-list__item${selected === row.id ? ' is-selected' : ''}`,
            onClick: () => setSelected(row.id),
          },
            React.createElement('span', { className: 'template-choice-table__radio' }),
            React.createElement('span', { className: 'template-choice-list__copy' },
              React.createElement('strong', null, row.name),
              React.createElement('em', null, row.helper)
            )
          )
        ))
      ),
      React.createElement('label', { className: 'template-supplement-field' },
        React.createElement('span', null, '补充说明'),
        React.createElement('input', {
          type: 'text',
          placeholder: '请输入补充信息',
          value: supplement,
          disabled: handled,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setSupplement(event.target.value),
        })
      ),
      React.createElement('div', { className: 'template-card-footer template-card-footer--choice-list process-debug-choice-card__footer' },
        React.createElement('button', {
          type: 'button',
          className: 'template-primary-btn',
          disabled: handled,
          onClick: () => onAction?.('branchSelect', {
            messageId,
            to: 'debug_user_select',
            label,
            selectedTemplate: selectedRow.name,
          }),
        }, '确定')
      )
    )
  )
}

function DebugUserSelectCard({ handled, onAction, messageId }: any) {
  const [selected, setSelected] = useState(debugUserRows[0].id)
  const [supplement, setSupplement] = useState('')
  const selectedRow = debugUserRows.find(row => row.id === selected) || debugUserRows[0]
  const label = supplement.trim() || selectedRow.name

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--choice-list process-debug-choice-card${handled ? ' is-handled' : ''}` },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '选择调试的发起人（可以在补充说明输入用户姓名）')
        )
      ),
      React.createElement('div', { className: 'template-choice-list' },
        debugUserRows.map(row => (
          React.createElement('button', {
            key: row.id,
            type: 'button',
            disabled: handled,
            className: `template-choice-list__item${selected === row.id ? ' is-selected' : ''}`,
            onClick: () => setSelected(row.id),
          },
            React.createElement('span', { className: 'template-choice-table__radio' }),
            React.createElement('span', { className: 'template-choice-list__copy' },
              React.createElement('strong', null, row.name),
              React.createElement('em', null, row.helper)
            )
          )
        ))
      ),
      React.createElement('label', { className: 'template-supplement-field' },
        React.createElement('span', null, '补充说明'),
        React.createElement('input', {
          type: 'text',
          placeholder: '请输入补充信息',
          value: supplement,
          disabled: handled,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setSupplement(event.target.value),
        })
      ),
      React.createElement('div', { className: 'template-card-footer template-card-footer--choice-list process-debug-choice-card__footer' },
        React.createElement('button', {
          type: 'button',
          className: 'template-primary-btn',
          disabled: handled,
          onClick: () => onAction?.('branchSelect', {
            messageId,
            to: 'case_result',
            label,
            selectedUser: selectedRow.name,
          }),
        }, '执行调试')
      )
    )
  )
}

function DebugCaseListCard() {
  const rows = [
    ['TC-001', '产品类型=SaaS软件；当前阶段=交付；销售公司=集团/武汉分公司', '发起申请 → 表单校验 → 部门提交'],
    ['TC-002', '产品类型=SaaS软件；当前阶段=售前；销售公司=集团/深圳分公司', '发起申请 → 权限校验 → 组织规则匹配'],
    ['TC-003', '产品类型=智能硬件；附件缺失；销售公司=集团/武汉分公司', '发起申请 → 表单校验 → 阻断提交'],
    ['TC-004', '产品类型=SaaS软件；预算不足；销售公司=集团/武汉分公司', '发起申请 → 部门负责人审批 → 驳回结束'],
  ]

  return (
    React.createElement('div', { className: 'template-md-table-wrap template-md-table-wrap--standalone' },
      React.createElement('table', { className: 'template-md-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, '用例编号'),
            React.createElement('th', null, '流程调试模拟参数'),
            React.createElement('th', null, '流程预测路径')
          )
        ),
        React.createElement('tbody', null,
          rows.map(row => (
            React.createElement('tr', { key: row[0] },
              React.createElement('td', null, row[0]),
              React.createElement('td', null, row[1]),
              React.createElement('td', null, row[2])
            )
          ))
        )
      )
    )
  )
}

const panels = {
  flow_select: `**流程模板识别**

| 字段 | 内容 |
|---|---|
| 推荐流程 | 产品立项申请与合同审批 |
| 可选流程 | 租赁合同续签流程、费用合同结算流程 |
| 调试目标 | 选择流程模板后生成调试路径与测试用例 |`,
  debug_user_select: `**调试流程摘要**

| 用例 | 说明 | 预测路径 |
|---|---|---|
| TC-003 | 产品类型=SaaS软件；当前阶段=交付；销售公司=集团/武汉分公司 | 发起申请 → 表单校验 → 阻断提交 |
| TC-004 | 产品类型=SaaS软件；当前阶段=售前；销售公司=集团/深圳分公司 | 发起申请 → 权限校验 → 组织规则匹配 |`,
  case_result: `**流程调试测试用例**

| 用例编号 | 流程调试模拟参数 | 流程预测路径 |
|---|---|---|
| TC-001 | 产品类型=SaaS软件；当前阶段=交付；销售公司=集团/武汉分公司 | 发起申请 → 表单校验 → 部门提交 |
| TC-002 | 产品类型=SaaS软件；当前阶段=售前；销售公司=集团/深圳分公司 | 发起申请 → 权限校验 → 组织规则匹配 |
| TC-003 | 附件缺失；销售公司=集团/武汉分公司 | 发起申请 → 表单校验 → 阻断提交 |
| TC-004 | 预算不足；销售公司=集团/武汉分公司 | 发起申请 → 部门负责人审批 → 驳回结束 |`,
}

function panel(title: string, description: string) {
  return (props: any) => React.createElement(GenericPanel, { ...props, title, description })
}

const scenario: ScenarioModule = {
  id: SCENARIO_ID,
  label: '采购审批流程调试',
  agentId: 'system-management-assistant',
  agentName: AGENT_NAME,
  agentDescription: '聚合套打、流程和权限管理能力，根据用户问题进入对应业务对话流',
  avatarKey: AVATAR_KEY,
  shortcutLabel: '调试采购流程',
  shortcutPrompt: '我要调试合同审批流程',
  shortcutOrder: 1,
  phases: ['flow_select', 'debug_user_select', 'case_result', 'complete'],
  initialState: {},
  chatVisibleComponents: ['FlowTemplateSelectCard', 'DebugUserSelectCard', 'DebugCaseListCard'],
  extraComponentMap: {
    FlowTemplateSelectCard,
    DebugUserSelectCard,
    DebugCaseListCard,
  },
  homeChips: [{ label: '调试审批流程', scenarioId: SCENARIO_ID, prompt: '我要调试合同审批流程' }],
  panelMap: {
    flow_select: panel('流程模板识别', panels.flow_select),
    debug_user_select: panel('调试流程摘要', panels.debug_user_select),
    case_result: panel('流程调试测试用例', panels.case_result),
  },
  panelTitleMap: {
    flow_select: '流程模板识别',
    debug_user_select: '调试流程摘要',
    case_result: '流程调试测试用例',
  },
  onPhaseEnter(phase, ctx) {
    if (phase === 'flow_select') {
      addAssistantMessage(
        ctx,
        '已查询到系统有多个合同流程模板，请选择要调试的流程模板。',
        () => addComponentMessage(ctx, 'FlowTemplateSelectCard')
      )
      return
    }
    if (phase === 'debug_user_select') {
      addAssistantMessage(
        ctx,
        '如果要进行流程调试，请选择以哪个用户作为发起人进行调试。',
        () => addComponentMessage(ctx, 'DebugUserSelectCard')
      )
      return
    }
    if (phase === 'case_result') {
      addAssistantMessage(
        ctx,
        '已完成流程分析。\n\n分析结果：\n- 流程节点：8 个\n- 独立流程路径：5 条\n- 预计生成流程用例：12 条\n- 调试用户：张三\n\n我已生成本次流程调试用例清单，可用于验证正常流程、异常流程、边界条件和特殊场景。',
        () => addComponentMessage(ctx, 'DebugCaseListCard')
      )
    }
  },
  handleSend(text, ctx) {
    ctx.dispatch({ type: 'ADD_MESSAGE', message: { id: genMessageId(), role: 'user', content: text, timestamp: Date.now() } })
    if (text.includes('调试') || text.includes('流程')) {
      ctx.dispatch({ type: 'SET_PHASE', phase: 'flow_select' })
      return
    }
    addAssistantMessage(ctx, '我主要负责流程调试、流程结构分析、测试用例生成和执行辅助。请告诉我需要调试的流程名称。')
  },
  handleComponentAction(action, payload, ctx) {
    if (action !== 'branchSelect') return
    const messageId = payload.messageId as string | undefined
    if (messageId) ctx.dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
    if (payload.label) {
      ctx.dispatch({
        type: 'ADD_MESSAGE',
        message: { id: genMessageId(), role: 'user', content: String(payload.label), timestamp: Date.now() },
      })
    }
    ctx.dispatch({
      type: 'SET_SCENARIO_STATE',
      scenarioId: SCENARIO_ID,
      state: {
        selectedTemplate: payload.selectedTemplate,
        selectedUser: payload.selectedUser,
      },
    })
    ctx.dispatch({ type: 'SET_PHASE', phase: String(payload.to || 'complete') })
  },
  actionButtonsMap() {
    return null
  },
}

export default scenario
