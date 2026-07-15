import React, { useState } from 'react'
import type { ScenarioContext, ScenarioModule } from '../types'
import { genMessageId, streamFakeText } from '../../shared/utils'

const SCENARIO_ID = 'process-assistant__process-debug'
const AGENT_NAME = '系统管理助手'
const AVATAR_KEY = 'avatar-ai-2'

const flowTemplateRows = [
  { id: 'product-contract-approval', name: '产品立项申请与合同审批', status: '已发布' },
  { id: 'lease-contract-renewal', name: '租赁合同续签流程', status: '修订中' },
  { id: 'expense-contract-settlement', name: '费用合同结算流程', status: '草稿' },
]

const debugUserRows = [
  { id: 'debug-user-1', name: '张三', org: '集团-武汉分公司-信息部' },
  { id: 'debug-user-2', name: '李四', org: '集团-武汉分公司-财务部' },
  { id: 'debug-user-3', name: '王五', org: '集团-武汉分公司-成本部' },
]

const debugCaseRows = [
  { scene: '正常流程', caseNo: 'TC-001', params: '产品类型=智能硬件；当前阶段=交付；销售公司=集团/武汉分公司', path: '发起申请 → 部门负责人审批 → 流程结束', result: '通过' },
  { scene: '异常流程', caseNo: 'TC-002', params: '产品类型=智能硬件；当前阶段=售前；销售公司=集团/深圳分公司', path: '发起申请 → 部门负责人审批 → 驳回结束', result: '通过' },
  { scene: '边界条件', caseNo: 'TC-003', params: '产品类型=SaaS软件；当前阶段=交付；销售公司=集团/武汉分公司', path: '发起申请 → 表单校验 → 阻断提交', result: '不通过' },
  { scene: '特殊场景', caseNo: 'TC-004', params: '产品类型=SaaS软件；当前阶段=售前；销售公司=集团/深圳分公司', path: '发起申请 → 权限校验 → 组织规则匹配', result: '通过' },
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
  const templateName = supplement.trim() || selectedRow.name

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--choice-list process-debug-choice-card${handled ? ' is-handled' : ''}` },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '请选择要调试的流程模板')
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
              React.createElement('em', null, `状态：${row.status}`)
            )
          )
        ))
      ),
      React.createElement('label', { className: 'template-supplement-field' },
        React.createElement('span', null, '请输入流程名称'),
        React.createElement('input', {
          type: 'text',
          placeholder: '请输入流程名称',
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
            label: `已选择流程模版：${templateName}`,
            selectedTemplate: templateName,
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
  const userName = supplement.trim() || selectedRow.name
  const userOrg = supplement.trim() ? '手动输入用户所属组织待识别' : selectedRow.org

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--choice-list process-debug-choice-card${handled ? ' is-handled' : ''}` },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '请选择调试用户')
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
              React.createElement('em', null, `所属组织：${row.org}`)
            )
          )
        ))
      ),
      React.createElement('label', { className: 'template-supplement-field' },
        React.createElement('span', null, '请输入要调试的发起人'),
        React.createElement('input', {
          type: 'text',
          placeholder: '请输入要调试的发起人姓名',
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
            to: 'execution_result',
            label: `已选择调试用户：${userName}`,
            selectedUser: userName,
            selectedUserOrg: userOrg,
          }),
        }, '执行调试')
      )
    )
  )
}

function DebugCaseListCard() {
  return (
    React.createElement('section', { className: 'debug-case-list-card', 'aria-label': '流程测试用例清单' },
      React.createElement('div', { className: 'debug-case-list-card__title' },
        React.createElement('strong', null, '流程测试用例清单'),
        React.createElement('span', null, '共 4 条')
      ),
      React.createElement('div', { className: 'debug-case-list-table' },
        React.createElement('div', { className: 'debug-case-list-table__head' },
          React.createElement('span', null, '用例编号'),
          React.createElement('span', null, '流程调试模拟参数'),
          React.createElement('span', null, '流程预测路径')
        ),
        debugCaseRows.map(row => (
          React.createElement('div', { className: 'debug-case-list-table__row', key: row.caseNo },
            React.createElement('span', null, row.caseNo),
            React.createElement('strong', null, row.params),
            React.createElement('small', null, row.path)
          )
        ))
      )
    )
  )
}

function DebugExecutionResultCard() {
  return (
    React.createElement('section', { className: 'debug-execution-result-card', 'aria-label': '流程测试用例执行结果' },
      React.createElement('div', { className: 'debug-execution-result-card__title' },
        React.createElement('strong', null, '流程测试用例执行结果'),
        React.createElement('span', null, '3 通过 / 1 不通过')
      ),
      React.createElement('div', { className: 'debug-execution-result-table' },
        React.createElement('div', { className: 'debug-execution-result-table__head' },
          React.createElement('span', null, '用例编号'),
          React.createElement('span', null, '流程调试模拟参数'),
          React.createElement('span', null, '流程预测路径'),
          React.createElement('span', null, '执行结果')
        ),
        debugCaseRows.map(row => (
          React.createElement('div', { className: `debug-execution-result-table__row ${row.result === '通过' ? 'is-pass' : 'is-fail'}`, key: row.caseNo },
            React.createElement('span', null, row.caseNo),
            React.createElement('strong', null, row.params),
            React.createElement('small', null, row.path),
            React.createElement('em', null, row.result)
          )
        ))
      )
    )
  )
}

function FlowDebugReportCard({ handled, onAction }: any) {
  return (
    React.createElement('section', { className: `flow-debug-report-card${handled ? ' is-handled' : ''}`, 'aria-label': '流程调试报告' },
      React.createElement('button', {
        type: 'button',
        onClick: () => onAction?.('openPreview', {
          targetPhase: 'debug_report',
          targetArtifactTitle: '产品立项申请与合同审批流程调试报告',
          scrollBeforeOpen: false,
        }),
      },
        React.createElement('span', { className: 'flow-debug-report-card__icon' }, 'M'),
        React.createElement('span', { className: 'flow-debug-report-card__copy' },
          React.createElement('strong', null, '产品立项申请与合同审批流程调试报告'),
          React.createElement('em', null, '5 个流程实例')
        )
      )
    )
  )
}

function FlowDebugReportPanel({ onClosePreview }: { onClosePreview?: () => void }) {
  return (
    React.createElement('div', { className: 'flow-debug-report-panel' },
      React.createElement('header', { className: 'template-workbench-topbar' },
        React.createElement('div', { className: 'template-workbench-title' },
          React.createElement('span', null, '产品立项申请与合同审批流程调试报告')
        ),
        React.createElement('div', { className: 'template-workbench-actions' },
          React.createElement('button', { type: 'button', 'aria-label': '刷新' }, '↻'),
          React.createElement('button', { type: 'button', 'aria-label': '放大' }, '↗'),
          React.createElement('button', { type: 'button', 'aria-label': '关闭', onClick: onClosePreview }, '×')
        )
      ),
      React.createElement('div', { className: 'flow-debug-report-panel__body' },
        React.createElement('h2', null, '流程调试报告'),
        React.createElement('p', null, '产品立项申请与合同审批流程已完成调试，共生成 5 个流程实例，4 条测试用例中 3 条通过、1 条不通过。'),
        React.createElement('table', null,
          React.createElement('tbody', null,
            [['执行成功率', '100%'], ['执行耗时', '2.3s'], ['发起流程实例数量', '5 个流程实例'], ['测试用例结果', '3 通过 / 1 不通过']].map(row =>
              React.createElement('tr', { key: row[0] },
                React.createElement('th', null, row[0]),
                React.createElement('td', null, row[1])
              )
            )
          )
        )
      )
    )
  )
}

;(FlowDebugReportPanel as any).hasInternalClose = true

function addFlowDebugReport(ctx: ScenarioContext) {
  addAssistantMessage(
    ctx,
    `**执行结果**

| 指标 | 结果 |
|---|---|
| 执行成功率 | **100%** |
| 执行耗时 | **2.3s** |
| 发起流程实例数量 | **5 个流程实例** |

我已经将本次流程调试生成报告，点击报告可以查看流程调试详情。`,
    () => addComponentMessage(ctx, 'FlowDebugReportCard')
  )
}

const scenario: ScenarioModule = {
  id: SCENARIO_ID,
  label: '采购审批流程调试',
  agentId: 'system-management-assistant',
  agentName: AGENT_NAME,
  agentDescription: '聚合套打、流程和权限管理能力，根据用户问题进入对应业务对话流',
  avatarKey: AVATAR_KEY,
  shortcutLabel: '调试审批流程',
  shortcutPrompt: '我要调试合同审批流程',
  shortcutOrder: 1,
  phases: ['flow_select', 'debug_user_select', 'execution_result', 'complete'],
  initialState: {},
  chatVisibleComponents: ['FlowTemplateSelectCard', 'DebugUserSelectCard', 'DebugCaseListCard', 'DebugExecutionResultCard', 'FlowDebugReportCard'],
  extraComponentMap: {
    FlowTemplateSelectCard,
    DebugUserSelectCard,
    DebugCaseListCard,
    DebugExecutionResultCard,
    FlowDebugReportCard,
  },
  homeChips: [{ label: '调试审批流程', scenarioId: SCENARIO_ID, prompt: '我要调试合同审批流程' }],
  panelMap: {
    debug_report: FlowDebugReportPanel,
  },
  panelTitleMap: {
    debug_report: '产品立项申请与合同审批流程调试报告',
  },
  onPhaseEnter(phase, ctx) {
    if (phase === 'flow_select') {
      addAssistantMessage(
        ctx,
        '已查询到系统有多个"合同"流程模板，请选择要调试的流程模板',
        () => addComponentMessage(ctx, 'FlowTemplateSelectCard')
      )
      return
    }
    if (phase === 'debug_user_select') {
      addAssistantMessage(
        ctx,
        `产品立项申请与合同审批已分析完成，流程调试信息如下：

- 流程节点：2个（审批节点0个、条件/网关节点0个）
- 独立路径：1条（正常流程1条、异常流程0条）
- 预计生成：4条测试用例`,
        () => {
          addComponentMessage(ctx, 'DebugCaseListCard')
          addAssistantMessage(
            ctx,
            '如果要进行流程调试，请选择以哪个用户作为发起人进行调试。',
            () => addComponentMessage(ctx, 'DebugUserSelectCard')
          )
        }
      )
      return
    }
    if (phase === 'execution_result') {
      const scenarioState = ctx.stateRef.current.scenarioStates?.[SCENARIO_ID] as { selectedUser?: string; selectedUserOrg?: string } | undefined
      const userName = scenarioState?.selectedUser || '张三'
      const userOrg = scenarioState?.selectedUserOrg || '集团-武汉分公司-信息部'
      addAssistantMessage(
        ctx,
        `已选择调试用户，我会以${userName}作为发起人、${userOrg}作为发起组织生成流程调试用例。`,
        () => {
          addAssistantMessage(ctx, '已完成流程测试用例批量执行，以下为每条测试用例的执行结果。', () => {
            addComponentMessage(ctx, 'DebugExecutionResultCard')
            addFlowDebugReport(ctx)
          })
        }
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
        selectedUserOrg: payload.selectedUserOrg,
      },
    })
    ctx.dispatch({ type: 'SET_PHASE', phase: String(payload.to || 'complete') })
  },
  actionButtonsMap() {
    return null
  },
}

export default scenario
