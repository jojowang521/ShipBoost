import React from 'react'
import type { ScenarioContext, ScenarioModule } from '../types'
import { genMessageId, streamFakeText } from '../../shared/utils'
import { ArtifactActionChevron, ArtifactFileIcon } from '../../shared/chat/components/ArtifactFileIcons'

const SCENARIO_ID = 'process-assistant__handover-flow'
const AGENT_NAME = '系统管理助手'
const AVATAR_KEY = 'avatar-ai-2'

const changeRows = [
  { field: '租赁时长', before: '一年3个月', after: '3年' },
  { field: '租赁开始日期', before: '2026-01-01', after: '2026-01-15' },
  { field: '租赁结束日期', before: '2027-03-31', after: '2029-01-14' },
]

const instanceRows = [
  ['流程名称', '【深圳湾】延期租赁变更（需签订协议）'],
  ['流程实例编号', '0001-2026-04-01'],
  ['发起人', '小王'],
  ['发起时间', '2026-04-01 18:38'],
  ['当前审批步骤', '经办部门审核'],
  ['当前审批人', '张三'],
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

function FlowChangeTable({ includeResult = false }: { includeResult?: boolean }) {
  return (
    React.createElement('div', { className: 'template-md-table-wrap template-md-table-wrap--standalone flow-adjust-md-table-wrap', role: 'region', 'aria-label': includeResult ? '表单数据调整执行结果' : '字段变更清单' },
      React.createElement('table', { className: `template-md-table flow-adjust-md-table${includeResult ? ' flow-adjust-md-table--result' : ''}` },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, '字段名称'),
            React.createElement('th', null, '调整前'),
            React.createElement('th', null, '调整后'),
            includeResult ? React.createElement('th', null, '执行结果') : null
          )
        ),
        React.createElement('tbody', null,
          changeRows.map(row => (
            React.createElement('tr', { key: row.field },
              React.createElement('td', null, row.field),
              React.createElement('td', null, row.before),
              React.createElement('td', null, row.after),
              includeResult ? React.createElement('td', null, React.createElement('span', { className: 'flow-adjust-success-pill' }, '成功')) : null
            )
          ))
        )
      )
    )
  )
}

function FlowFormDataAdjustPreviewCard({ handled, onAction, messageId }: any) {
  return (
    React.createElement(React.Fragment, null,
      React.createElement('p', { className: 'flow-adjust-plain-text' }, '需要调整流程信息如下，请确认是否生成流程变更计划'),
      React.createElement(FlowChangeTable, null),
      React.createElement('div', { className: `flow-adjust-action-row${handled ? ' is-handled' : ''}` },
        React.createElement('button', {
          type: 'button',
          className: 'flow-adjust-primary-btn',
          disabled: handled,
          onClick: () => onAction?.('generateChangePlan', { messageId }),
        }, '生成变更计划')
      )
    )
  )
}

function FlowInstanceInfoTable() {
  return (
    React.createElement('div', { className: 'template-md-table-wrap template-md-table-wrap--standalone flow-adjust-md-table-wrap', role: 'region', 'aria-label': '流程实例信息' },
      React.createElement('table', { className: 'template-md-table flow-instance-info-table' },
        React.createElement('tbody', null,
          instanceRows.map(([label, value]) => (
            React.createElement('tr', { key: label },
              React.createElement('th', null, label),
              React.createElement('td', null, value)
            )
          ))
        )
      )
    )
  )
}

function FlowFormDataAdjustPlanCard({ handled, onAction, messageId }: any) {
  return (
    React.createElement(React.Fragment, null,
      React.createElement('p', { className: 'flow-adjust-section-title' }, '流程实例信息'),
      React.createElement(FlowInstanceInfoTable, null),
      React.createElement('p', { className: 'flow-adjust-section-title' }, '字段变更清单'),
      React.createElement(FlowChangeTable, null),
      React.createElement('p', { className: 'flow-adjust-warning-text' }, '该操作会真实修改此流程实例的表单数据。确认仅对当前实例、当前版本和上述变更清单有效；如实例数据或变更内容发生变化，需要重新生成计划并再次确认。'),
      React.createElement('div', { className: `flow-adjust-action-row flow-adjust-action-row--right${handled ? ' is-handled' : ''}` },
        React.createElement('button', {
          type: 'button',
          className: 'flow-adjust-primary-btn flow-adjust-primary-btn--confirm',
          disabled: handled,
          onClick: () => onAction?.('confirmModify', { messageId }),
        }, '确认修改')
      )
    )
  )
}

function FlowFormDataAdjustResultCard() {
  return (
    React.createElement(React.Fragment, null,
      React.createElement(FlowChangeTable, { includeResult: true })
    )
  )
}

function AdjustedFlowFormLinkCard() {
  return (
      React.createElement('a', {
        className: 'artifact-stack-card__item adjusted-flow-form-link-card',
        href: 'http://10.5.10.167:9080/erp40/bpm/flowinstance/approval/index?node_id=3a205acc-16e4-4a96-826a-955caa48da9f&proc_id=3a205acc-1674-ed42-0899-8432f8e0998f&package_id=661f753e71dda5986205516532215610&oid=',
        target: '_blank',
        rel: 'noreferrer',
        'aria-label': '打开调整后的流程表单',
      },
        React.createElement('span', { className: 'artifact-stack-card__icon' },
          React.createElement(ArtifactFileIcon, { icon: 'detail', title: '调整后的流程表单' })
        ),
        React.createElement('span', { className: 'artifact-stack-card__copy' },
          React.createElement('span', { className: 'artifact-stack-card__title' }, '调整后的流程表单'),
          React.createElement('span', { className: 'artifact-stack-card__meta' }, '已生成可查看的流程表单详情')
        ),
        React.createElement('span', { className: 'artifact-stack-card__action', 'aria-hidden': true },
          '查看',
          React.createElement(ArtifactActionChevron)
        )
      )
  )
}

const scenario: ScenarioModule = {
  id: SCENARIO_ID,
  label: '流程数据调整',
  agentId: 'system-management-assistant',
  agentName: AGENT_NAME,
  agentDescription: '聚合套打、流程和权限管理能力，根据用户问题进入对应业务对话流',
  avatarKey: AVATAR_KEY,
  shortcutLabel: '调整流程数据',
  shortcutPrompt: '请上传需要调整流程数据的截图（需要标注调整字段的值）',
  shortcutOrder: 2,
  phases: ['screenshot_received', 'change_plan', 'modify_result', 'complete'],
  initialState: {},
  chatVisibleComponents: [
    'FlowFormDataAdjustPreviewCard',
    'FlowFormDataAdjustPlanCard',
    'FlowFormDataAdjustResultCard',
    'AdjustedFlowFormLinkCard',
  ],
  extraComponentMap: {
    FlowFormDataAdjustPreviewCard,
    FlowFormDataAdjustPlanCard,
    FlowFormDataAdjustResultCard,
    AdjustedFlowFormLinkCard,
  },
  homeChips: [{ label: '调整流程数据', scenarioId: SCENARIO_ID, prompt: '请上传需要调整流程数据的截图（需要标注调整字段的值）' }],
  panelMap: {},
  panelTitleMap: {},
  onPhaseEnter(phase, ctx) {
    if (phase === 'screenshot_received') {
      addAssistantMessage(
        ctx,
        '已收到上传的流程数据调整截图，已根据截图识别到要调整的流程实例，查看链接：[流程表单](http://10.5.10.167:9080/erp40/bpm/flowinstance/approval/index?node_id=3a205acc-168e-10e0-6bd4-d2637511350c&proc_id=3a205acc-1674-ed42-0899-8432f8e0998f&package_id=661f753e71dda5986205516532215610&oid=)',
        () => addComponentMessage(ctx, 'FlowFormDataAdjustPreviewCard')
      )
    }
  },
  handleSend(text, ctx) {
    ctx.dispatch({ type: 'ADD_MESSAGE', message: { id: genMessageId(), role: 'user', content: text, timestamp: Date.now() } })
    if (text.includes('调整') && text.includes('流程') && text.includes('数据')) {
      ctx.dispatch({ type: 'SET_PHASE', phase: 'screenshot_received' })
      return
    }
    addAssistantMessage(ctx, '我主要负责流程表单数据调整。请上传需要调整流程数据的截图，并标注调整字段的值。')
  },
  handleComponentAction(action, payload, ctx) {
    const messageId = payload.messageId as string | undefined
    if (messageId) ctx.dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })

    if (action === 'generateChangePlan') {
      ctx.dispatch({ type: 'ADD_MESSAGE', message: { id: genMessageId(), role: 'user', content: '生成变更计划', timestamp: Date.now() } })
      addAssistantMessage(ctx, '已生成流程变更计划，计划信息如下：', () => addComponentMessage(ctx, 'FlowFormDataAdjustPlanCard'))
      return
    }

    if (action === 'confirmModify') {
      ctx.dispatch({ type: 'ADD_MESSAGE', message: { id: genMessageId(), role: 'user', content: '确认修改', timestamp: Date.now() } })
      addAssistantMessage(ctx, '表单数据已执行修改，以下是本次执行结果：', () => {
        addComponentMessage(ctx, 'FlowFormDataAdjustResultCard')
        addComponentMessage(ctx, 'AdjustedFlowFormLinkCard')
      })
    }
  },
  actionButtonsMap() {
    return null
  },
}

export default scenario
