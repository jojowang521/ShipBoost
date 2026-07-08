import React, { useState } from 'react'
import type { ScenarioContext, ScenarioModule } from '../types'
import { genMessageId, streamFakeText } from '../../shared/utils'
import { useApp } from '../../shared/store/AppContext'

const SCENARIO_ID = 'template-printing__auto-template-generation'
const AGENT_NAME = '系统管理助手'
const AVATAR_KEY = 'avatar-ai-2'

const templateDataRows = [
  { id: 'service', name: '租赁中心-服务协议文本', scene: '服务协议文本' },
  { id: 'notice', name: '租赁中心-催缴通知单-v001', scene: '催缴通知单' },
  { id: 'handover', name: '租赁中心-物业交房联系单-v001', scene: '物业交房联系单' },
  { id: 'intent', name: '租赁中心-意向协议文本-v001', scene: '意向协议文本' },
  { id: 'new-contract', name: '租赁中心-新签合同文本-v001', scene: '新签合同文本' },
]

const fieldRows = [
  ['1', '甲方（出租方）：广州市沙园同和教育有限公司', '甲方（出租方）：${租赁中心_新签合同文本.出租方名称}'],
  ['2', '地址：广州市南沙区龙穴岛龙穴大道中路13号1801房', '地址：${租赁中心_新签合同文本.出租方.联系地址}'],
  ['3', '营业执照：91440115747565587Q', '营业执照：${租赁中心_新签合同文本.出租方.营业执照（社会信用号码）}'],
  ['4', '乙方（承租方）：广州市捷博物流有限公司', '乙方（承租方）：${租赁中心_新签合同文本.承租方名称}'],
  ['5', '法定代表人：黄洁瑶', '法定代表人：${租赁中心_新签合同文本.承租方.法人姓名}'],
  ['6', '联系人：黄洁瑶', '联系人：${租赁中心_新签合同文本.承租方.联系人}'],
  ['7', '联系电话：13710936215', '联系电话：${租赁中心_新签合同文本.承租方.联系电话}'],
  ['8', '合同编号：WL-YY-2025111104', '合同编号：${租赁中心_新签合同文本.合同编号}'],
  ['9', '物业位于龙穴大道中路13号1401房，以下称租赁物业', '物业位于${租赁中心_新签合同文本.租赁资源名称}'],
  ['10', '租赁物业面积共为10.44平方米', '租赁物业面积共为${租赁中心_新签合同文本.总租赁面积（㎡）}平方米'],
]

const contractRows = [
  {
    id: 'WL-YY-2025111104',
    tenant: '广州市捷博物流有限公司',
    name: '龙光大道中路13号1502房租赁合同',
    status: '履约中',
  },
  {
    id: 'WL-YY-2025111105',
    tenant: '广州沙园同和教育有限公司',
    name: '龙光大道中路13号1502房租赁合同',
    status: '待签署',
  },
  {
    id: 'WL-YY-2025111106',
    tenant: '广州联运物流有限公司',
    name: '龙光大道中路13号1608房租赁合同',
    status: '审批中',
  },
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

function TemplateDataSelectCard({ handled, onAction, messageId }: any) {
  const [selected, setSelected] = useState<string | null>(null)
  const [supplement, setSupplement] = useState('')
  const selectedRow = selected ? templateDataRows.find(row => row.id === selected) : null
  const visibleRows = templateDataRows.slice(0, 3)
  const confirmLabel = selectedRow
    ? `已选择套打数据：${selectedRow.name}`
    : (supplement.trim() || '确认')

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--choice-list${handled ? ' is-handled' : ''}` },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '请选择套打数据')
        )
      ),
      React.createElement('div', { className: 'template-choice-list' },
        visibleRows.map(row => (
          React.createElement('button', {
            key: row.id,
            type: 'button',
            disabled: handled,
            className: `template-choice-list__item${selected === row.id ? ' is-selected' : ''}`,
            onClick: () => setSelected(row.id),
          },
            React.createElement('span', { className: 'template-choice-table__radio' }),
            React.createElement('span', { className: 'template-choice-list__copy' },
              React.createElement('strong', null, row.name.replace(/-/g, ' - ')),
              React.createElement('em', null, `套打场景：${row.scene}`)
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
      React.createElement('div', { className: 'template-card-footer template-card-footer--choice-list' },
        React.createElement('button', {
          type: 'button',
          className: 'template-primary-btn',
          disabled: handled,
          onClick: () => onAction?.('branchSelect', {
            messageId,
            to: 'field_recognition',
            label: confirmLabel,
          }),
        }, '确认')
      )
    )
  )
}

function FieldRecognitionCard({ handled, onAction, messageId }: any) {
  return (
    React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'template-md-table-wrap template-md-table-wrap--standalone' },
        React.createElement('table', { className: 'template-md-table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, '序号'),
              React.createElement('th', null, '原文片段'),
              React.createElement('th', null, '拟生成的替换字段（来源套打数据）')
            )
          ),
          React.createElement('tbody', null,
            fieldRows.map(row => (
              React.createElement('tr', { key: row[0] },
                React.createElement('td', null, row[0]),
                React.createElement('td', null, row[1]),
                React.createElement('td', null,
                  React.createElement('code', { className: 'template-md-code' }, row[2])
                )
              )
            ))
          )
        )
      ),
      React.createElement('div', { className: `template-result-actions template-result-actions--standard${handled ? ' is-handled' : ''}` },
        React.createElement('button', {
          type: 'button',
          className: 'template-primary-btn template-preview-btn',
          disabled: handled,
          onClick: () => onAction?.('branchSelect', {
            messageId,
            to: 'template_generated',
            label: '生成套打模板',
          }),
        }, '生成套打模板')
      )
    )
  )
}

type GeneratedTemplateVariant = 'templateDraft' | 'formalContract' | 'replacementUpdated'

const generatedTemplateMeta: Record<GeneratedTemplateVariant, {
  title: string
  description: string
  targetPhase: string
  targetArtifactTitle: string
}> = {
  templateDraft: {
    title: '租赁合同套打文档_AI 初稿',
    description: '35 处字段替换，含待复核提示',
    targetPhase: 'template_doc',
    targetArtifactTitle: '租赁合同套打文档_AI 初稿',
  },
  formalContract: {
    title: '租赁合同套打模板_AI 第二版',
    description: '正式合同已生成，字段已替换为合同数据',
    targetPhase: 'contract_preview',
    targetArtifactTitle: '租赁合同在线预览',
  },
  replacementUpdated: {
    title: '租赁合同套打模板_AI 第二版',
    description: '重新替换已更新，请查收文档',
    targetPhase: 'contract_preview',
    targetArtifactTitle: '租赁合同在线预览',
  },
}

function GeneratedTemplateCard({ handled, onAction, variant = 'templateDraft' }: any) {
  const meta = generatedTemplateMeta[variant as GeneratedTemplateVariant] || generatedTemplateMeta.templateDraft

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--artifact${handled ? ' is-handled' : ''}` },
      React.createElement('button', {
        type: 'button',
        className: 'template-word-card',
        onClick: () => onAction?.('openPreview', {
          targetPhase: meta.targetPhase,
          targetArtifactTitle: meta.targetArtifactTitle,
          scrollBeforeOpen: false,
        }),
      },
        React.createElement('span', { className: 'template-word-card__icon' }, 'W'),
        React.createElement('span', null,
          React.createElement('b', null, meta.title),
          React.createElement('em', null, meta.description)
        )
      )
    )
  )
}

function ContractDataSelectCard({ handled, onAction, messageId }: any) {
  const [selected, setSelected] = useState(contractRows[0].id)
  const [supplement, setSupplement] = useState('')
  const row = contractRows.find(item => item.id === selected) || contractRows[0]

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--choice-list${handled ? ' is-handled' : ''}` },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '请选择合同数据')
        )
      ),
      React.createElement('div', { className: 'template-choice-list' },
        contractRows.map(item => (
          React.createElement('button', {
            key: item.id,
            type: 'button',
            className: `template-choice-list__item${selected === item.id ? ' is-selected' : ''}`,
            disabled: handled,
            onClick: () => setSelected(item.id),
          },
            React.createElement('span', { className: 'template-choice-table__radio' }),
            React.createElement('span', { className: 'template-choice-list__copy' },
              React.createElement('strong', null, item.name),
              React.createElement('em', null, `${item.id} / ${item.tenant} / ${item.status}`)
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
      React.createElement('div', { className: 'template-card-footer template-card-footer--choice-list' },
        React.createElement('button', {
          type: 'button',
          className: 'template-primary-btn',
          disabled: handled,
          onClick: () => onAction?.('branchSelect', {
            messageId,
            to: 'contract_preview',
            label: `合同编号：${row.id}`,
            contractId: row.id,
          }),
        }, '选择合同数据确认')
      )
    )
  )
}

function TemplateDataDetailPanel({ onClosePreview }: { onClosePreview?: () => void }) {
  return (
    React.createElement('div', { className: 'template-detail-panel' },
      React.createElement(WorkbenchTopbar, { title: '查看套打数据详情', onClosePreview }),
      React.createElement('div', { className: 'template-detail-panel__body' },
        React.createElement('section', { className: 'template-detail-section' },
          React.createElement('h3', null, '基础信息'),
          React.createElement('div', { className: 'template-detail-grid' },
            React.createElement('span', null, '套打数据名称'), React.createElement('b', null, '租赁中心-催缴通知单-v001'),
            React.createElement('span', null, '套打场景名称'), React.createElement('b', null, '租赁中心 / 新签合同文本')
          )
        ),
        React.createElement('section', { className: 'template-detail-section' },
          React.createElement('h3', null, '字段结构'),
          React.createElement('div', { className: 'template-schema-table' },
            [
              ['租赁中心_新签合同文本', '对象', '主对象'],
              ['出租方名称', '文本', '广州市沙园同和教育有限公司'],
              ['出租方', '对象', '出租方信息'],
              ['联系地址', '文本', '广州市南沙区龙穴岛龙穴大道'],
              ['营业执照（社会信用号码）', '文本', '91440115747565587Q'],
              ['承租方名称', '文本', '广州市捷博物流有限公司'],
              ['承租方', '对象', '承租方信息'],
              ['法人姓名', '文本', '黄洁瑶'],
              ['联系人', '文本', '黄洁瑶'],
              ['联系电话', '电话', '13710936215'],
              ['合同编号', '文本', 'WL-YY-2025111104'],
              ['合同名称', '文本', '龙光大道中路13号1502房租赁合同'],
            ].map(row => (
              React.createElement('div', { className: 'template-schema-table__row', key: row.join('-') },
                React.createElement('span', null, row[0]),
                React.createElement('em', null, row[1]),
                React.createElement('span', null, row[2])
              )
            ))
          )
        )
      )
    )
  )
}

function WorkbenchTopbar({ title, onClosePreview }: { title: string; onClosePreview?: () => void }) {
  return (
    React.createElement('header', { className: 'template-workbench-topbar' },
      React.createElement('div', { className: 'template-workbench-title' },
        React.createElement('span', null, title)
      ),
      React.createElement('div', { className: 'template-workbench-actions' },
        React.createElement('button', { type: 'button', 'aria-label': '刷新' }, '↻'),
        React.createElement('button', { type: 'button', 'aria-label': '放大' }, '↗'),
        React.createElement('button', { type: 'button', 'aria-label': '关闭', onClick: onClosePreview }, '×')
      )
    )
  )
}

function TemplateDocumentPanel({ onClosePreview, variant = 'template' }: { onClosePreview?: () => void; variant?: 'template' | 'contract' }) {
  const { state } = useApp()
  const scenarioState = state.scenarioStates[SCENARIO_ID] as { replacementChanged?: boolean } | undefined
  const replacementChanged = Boolean(scenarioState?.replacementChanged)
  const isContract = variant === 'contract'
  const codeValue = isContract
    ? (replacementChanged ? '${租赁中心_新签合同文本.合同名称}' : '龙光大道中路13号1502房租赁合同')
    : (replacementChanged ? '${租赁中心_新签合同文本.合同名称}' : '${租赁中心_新签合同文本.合同编号}')
  const partyA = isContract ? '广州市沙园同和教育有限公司' : '${租赁中心_新签合同文本.出租方名称}'
  const partyB = isContract ? '广州市捷博物流有限公司' : '${租赁中心_新签合同文本.承租方名称}'
  const workbenchTitle = replacementChanged
    ? '租赁合同套打模板_AI 第二版'
    : (isContract ? '租赁合同_WL-YY-2025111104.docx' : '租赁合同套打文档_AI 初稿')

  return (
    React.createElement('div', { className: 'template-doc-workbench' },
      React.createElement(WorkbenchTopbar, {
        title: workbenchTitle,
        onClosePreview,
      }),
      React.createElement('div', { className: 'template-doc-editor' },
        React.createElement('div', { className: 'template-doc-editor__bar' },
          React.createElement('strong', null, 'ONLYOFFICE'),
          React.createElement('span', null, '深圳市公共租赁住房租赁合同（个人）示范文本.docx')
        ),
        React.createElement('div', { className: 'template-doc-editor__tabs' },
          ['文件', '开始', '插入', '绘图', '布局', '引用', '协作', '保护', '视图', '插件'].map(item =>
            React.createElement('span', { key: item, className: item === '开始' ? 'active' : '' }, item)
          )
        ),
        React.createElement('div', { className: 'template-doc-editor__ribbon' },
          ['Times New Roman', '五号', 'B', 'I', 'U', '正文', '无间距', '标题 2', '标题 4'].map(item =>
            React.createElement('span', { key: item }, item)
          )
        ),
        React.createElement('article', { className: 'template-doc-page' },
          React.createElement('p', { className: 'template-doc-code' },
            '合同编号：',
            React.createElement('mark', null, codeValue)
          ),
          React.createElement('h1', null, '深圳市公共租赁住房租赁合同', React.createElement('br'), '（个人）示范文本'),
          React.createElement('p', null, '甲方（出租方）：', React.createElement('mark', null, partyA)),
          React.createElement('p', null, '乙方（承租方）：', React.createElement('mark', null, partyB)),
          React.createElement('p', null, '租赁物业位于 ', React.createElement('mark', null, isContract ? '龙光大道中路13号1502房' : '${租赁中心_新签合同文本.租赁资源名称}'), '，租赁面积 ', React.createElement('mark', null, isContract ? '10.44' : '${租赁中心_新签合同文本.总租赁面积（㎡）}'), ' 平方米。')
        )
      )
    )
  )
}

;(TemplateDataDetailPanel as any).hasInternalClose = true
;(TemplateDocumentPanel as any).hasInternalClose = true

function panel(component: React.ComponentType<any>) {
  return component
}

const TemplateDocPanel = (props: any) => React.createElement(TemplateDocumentPanel, { ...props, variant: 'template' })
const ContractPreviewPanel = (props: any) => React.createElement(TemplateDocumentPanel, { ...props, variant: 'contract' })
;(TemplateDocPanel as any).hasInternalClose = true
;(ContractPreviewPanel as any).hasInternalClose = true

const scenario: ScenarioModule = {
  id: SCENARIO_ID,
  label: '上传标准合同生成套打模板',
  agentId: 'system-management-assistant',
  agentName: AGENT_NAME,
  agentDescription: '聚合套打、流程和权限管理能力，根据用户问题进入对应业务对话流',
  avatarKey: AVATAR_KEY,
  shortcutLabel: 'AI新增模板',
  shortcutPrompt: '根据标准合同样张生成套打模板',
  shortcutOrder: 1,
  phases: ['upload_received', 'field_recognition', 'template_generated', 'contract_data_select', 'contract_preview', 'complete'],
  initialState: {},
  chatVisibleComponents: ['TemplateDataSelectCard', 'FieldRecognitionCard', 'GeneratedTemplateCard', 'ContractDataSelectCard'],
  extraComponentMap: {
    TemplateDataSelectCard,
    FieldRecognitionCard,
    GeneratedTemplateCard,
    ContractDataSelectCard,
  },
  homeChips: [{ label: 'AI新增模板', scenarioId: SCENARIO_ID, prompt: '根据标准合同样张生成套打模板' }],
  panelMap: {
    data_detail: panel(TemplateDataDetailPanel),
    template_doc: panel(TemplateDocPanel),
    contract_preview: panel(ContractPreviewPanel),
  },
  panelTitleMap: {
    data_detail: '查看套打数据详情',
    template_doc: '租赁合同套打文档_AI 初稿',
    contract_preview: '租赁合同在线预览',
  },
  onPhaseEnter(phase, ctx) {
    if (phase === 'upload_received') {
      addAssistantMessage(
        ctx,
        '已收到你上传的标准合同文档。为了继续生成套打模板，还需要补充本次使用的套打数据。\n\n当前推荐套打数据为：**租赁合同**。选择套打数据后，我会自动解析文档并识别套打字段。',
        () => addComponentMessage(ctx, 'TemplateDataSelectCard')
      )
      return
    }
    if (phase === 'field_recognition') {
      addAssistantMessage(
        ctx,
        '已收到原始文档和本次确认信息。我开始解析上传的合同正文，并同步识别可替换为套打字段的内容。\n\n**套打模板字段替换结果**\n\n请根据以下识别结果复核确认。本次共识别 **35 个标记**。',
        () => addComponentMessage(ctx, 'FieldRecognitionCard')
      )
      return
    }
    if (phase === 'template_generated') {
      addAssistantMessage(
        ctx,
        '我会把合同中的实际内容替换为套打字段标记，并同步生成字段配置。套打模板已生成，已完成 **35 处字段替换**，请仔细检查文档中生成替换的字段。\n\n提示：如果套打模板中有替换的字段不准确，可以通过对话的方式直接调整，例如：请将 ${租赁中心_新签合同文本.合同编号} 改成 ${租赁中心_新签合同文本.合同名称}。',
        () => {
          addComponentMessage(ctx, 'GeneratedTemplateCard', { variant: 'templateDraft' })
          ctx.dispatch({ type: 'OPEN_PREVIEW', readonly: false, targetPhase: 'template_doc', targetArtifactTitle: '租赁合同套打文档_AI 初稿', scrollBeforeOpen: false })
        }
      )
      return
    }
    if (phase === 'contract_data_select') {
      addAssistantMessage(
        ctx,
        '请选择一条合同数据，系统将使用该数据在线预览套打模板。',
        () => addComponentMessage(ctx, 'ContractDataSelectCard')
      )
      return
    }
    if (phase === 'contract_preview') {
      addAssistantMessage(
        ctx,
        '套打模板根据选择合同数据已经生成正式的租赁合同，请点击租赁合同查看详情。',
        () => {
          addComponentMessage(ctx, 'GeneratedTemplateCard', { variant: 'formalContract' })
          ctx.dispatch({ type: 'OPEN_PREVIEW', readonly: false, targetPhase: 'contract_preview', targetArtifactTitle: '租赁合同在线预览', scrollBeforeOpen: false })
        }
      )
    }
  },
  handleSend(text, ctx) {
    ctx.dispatch({ type: 'ADD_MESSAGE', message: { id: genMessageId(), role: 'user', content: text, timestamp: Date.now() } })
    if (text.includes('合同编号') && text.includes('合同名称')) {
      ctx.dispatch({ type: 'SET_SCENARIO_STATE', scenarioId: SCENARIO_ID, state: { replacementChanged: true } })
      addAssistantMessage(
        ctx,
        '我会把套打模板中${租赁中心_新签合同文本.合同编号}改成${租赁中心_新签合同文本.合同名称}，字段已替换完成，请检查文档的字段替换效果；',
        () => {
          addComponentMessage(ctx, 'GeneratedTemplateCard', { variant: 'replacementUpdated' })
          ctx.dispatch({ type: 'OPEN_PREVIEW', readonly: false, targetPhase: 'contract_preview', targetArtifactTitle: '租赁合同在线预览', scrollBeforeOpen: false })
        }
      )
      return
    }
    addAssistantMessage(ctx, '我主要处理当前套打模板的字段识别、在线预览和字段替换调整。请继续描述需要调整的套打字段。')
  },
  handleComponentAction(action, payload, ctx) {
    if (action === 'branchSelect') {
      const messageId = payload.messageId as string | undefined
      if (messageId) ctx.dispatch({ type: 'UPDATE_MESSAGE', id: messageId, updates: { componentHandled: true } })
      if (payload.label) {
        ctx.dispatch({
          type: 'ADD_MESSAGE',
          message: { id: genMessageId(), role: 'user', content: String(payload.label), timestamp: Date.now() },
        })
      }
      if (payload.to === 'contract_preview' && payload.contractId) {
        ctx.dispatch({ type: 'SET_SCENARIO_STATE', scenarioId: SCENARIO_ID, state: { selectedContractId: payload.contractId } })
      }
      ctx.dispatch({ type: 'SET_PHASE', phase: String(payload.to || 'complete') })
    }
  },
  actionButtonsMap() {
    return null
  },
}

export default scenario
