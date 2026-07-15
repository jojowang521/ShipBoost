import React, { useState } from 'react'
import type { ScenarioContext, ScenarioModule } from '../types'
import { genMessageId, streamFakeText } from '../../shared/utils'
import { useApp } from '../../shared/store/AppContext'

const SCENARIO_ID = 'template-printing__auto-template-generation'
const AGENT_NAME = '系统管理助手'
const AVATAR_KEY = 'avatar-ai-2'

const templateDataRows = [
  { id: 'new-contract', name: '租赁中心-新签合同文本-v001', helper: '' },
  { id: 'service', name: '租赁中心-服务协议文本', helper: '' },
  { id: 'handover', name: '租赁中心-物业交房联系单-v001', helper: '' },
]

const contractPreviewRows = [
  {
    id: 'contract-1',
    contractNo: 'WL-YY-2025111104',
    title: '合同编号：WL-YY-2025111104',
    helper: '承租方：广州市捷诺物流有限公司',
  },
  {
    id: 'sample',
    contractNo: '样例数据',
    title: '使用套打数据默认的样例数据预览',
    helper: '样例数据来源于业务系统内置套打数据的默认值',
  },
]

const fieldMappingRows = [
  ['合同名称', '龙穴大道中路13号1401房租赁合同'],
  ['物业合同编号', 'WL-YY-2025111104'],
  ['合同签订日期', '2025年11月11日'],
  ['出租方.名称', '广州南沙国际物流有限公司'],
  ['出租方.联系地址', '广州市南沙区龙穴岛龙穴大道中路13号1801房'],
  ['出租方.营业执照（社会信用号码）', '91440115747565587Q'],
  ['出租方法定代表人', '陈伟强'],
  ['承租方名称', '广州市捷诺物流有限公司'],
  ['承租方.法人姓名', '黄洁琼'],
  ['承租方.联系人', '林晓敏'],
  ['承租方.联系电话', '13710936215'],
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
  const confirmLabel = selectedRow
    ? `已选择套打数据：${selectedRow.name}`
    : (supplement.trim() || '确认')

  return (
    React.createElement('div', { className: `template-flow-card template-flow-card--choice-list${handled ? ' is-handled' : ''}` },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '推荐套打数据（可以在补充说明中输入套打数据名称）')
        )
      ),
      React.createElement('div', { className: 'template-choice-list' },
        templateDataRows.map(row => (
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
              row.helper ? React.createElement('em', null, row.helper) : null
            )
          )
        ))
      ),
      React.createElement('label', { className: 'template-supplement-field' },
        React.createElement('span', null, '补充说明'),
        React.createElement('input', {
          type: 'text',
          placeholder: '请输入补充说明描述',
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
            to: 'template_generated',
            label: confirmLabel,
          }),
        }, '确认')
      )
    )
  )
}

type GeneratedTemplateVariant = 'fieldRule' | 'templateDraft' | 'formalContract' | 'replacementUpdated'

const generatedTemplateMeta: Record<GeneratedTemplateVariant, {
  title: string
  description: string
  targetPhase: string
  targetArtifactTitle: string
  icon: string
}> = {
  fieldRule: {
    title: '套打数据字段替换规则',
    description: '共识别 35 处原文内容可替换',
    targetPhase: 'field_rule',
    targetArtifactTitle: '套打数据字段替换规则',
    icon: 'X',
  },
  templateDraft: {
    title: '租赁合同套打文档_AI_初稿',
    description: '已完成字段绑定，可在线预览',
    targetPhase: 'template_doc',
    targetArtifactTitle: '租赁合同套打文档_AI_初稿',
    icon: 'W',
  },
  formalContract: {
    title: '租赁合同_WL-YY-2025111104.docx',
    description: '正式合同已生成，字段已替换为合同数据',
    targetPhase: 'contract_doc',
    targetArtifactTitle: '租赁合同_WL-YY-2025111104.docx',
    icon: 'W',
  },
  replacementUpdated: {
    title: '租赁合同套打模版_AI_第二版',
    description: '套打模版已更新，请查看文档',
    targetPhase: 'template_doc',
    targetArtifactTitle: '租赁合同套打文档_AI_初稿',
    icon: 'W',
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
        React.createElement('span', { className: `template-word-card__icon template-word-card__icon--${variant === 'fieldRule' ? 'excel' : 'word'}` }, meta.icon),
        React.createElement('span', null,
          React.createElement('b', null, meta.title),
          React.createElement('em', null, meta.description)
        )
      )
    )
  )
}

function TemplateOnlinePreviewButton({ handled, onAction, messageId }: any) {
  return (
    React.createElement('div', { className: `template-result-actions template-result-actions--standard${handled ? ' is-handled' : ''}` },
      React.createElement('button', {
        type: 'button',
        className: 'template-primary-btn template-preview-btn',
        disabled: handled,
        onClick: () => onAction?.('branchSelect', {
          messageId,
          to: 'contract_data_select',
          label: '在线预览套打模版',
        }),
      }, '预览套打模版')
    )
  )
}

function ContractDataSelectCard({ handled, onAction, messageId }: any) {
  const [selected, setSelected] = useState('contract-1')
  const [manualContractId, setManualContractId] = useState('')
  const selectedRow = contractPreviewRows.find(row => row.id === selected) || contractPreviewRows[0]
  const previewContractId = manualContractId.trim() || selectedRow.contractNo
  const userLabel = previewContractId === '样例数据' ? '使用套打数据默认的样例数据预览' : `合同编号：${previewContractId}`

  return (
    React.createElement('section', { className: `template-flow-card template-flow-card--choice-list contract-preview-select-card${handled ? ' is-handled' : ''}`, 'aria-label': '选择在线预览合同' },
      React.createElement('div', { className: 'template-flow-card__head' },
        React.createElement('div', null,
          React.createElement('h3', null, '选择预览套打数据来源（可以在补充说明输入预览模版参数businessId值）')
        )
      ),
      React.createElement('div', { className: 'template-choice-list', role: 'radiogroup', 'aria-label': '在线预览合同数据' },
        contractPreviewRows.map(row => (
          React.createElement('button', {
            type: 'button',
            className: `template-choice-list__item${selected === row.id ? ' is-selected' : ''}`,
            role: 'radio',
            'aria-checked': selected === row.id,
            key: row.id,
            disabled: handled,
            onClick: () => setSelected(row.id),
          },
            React.createElement('span', { className: 'template-choice-table__radio' }),
            React.createElement('span', { className: 'template-choice-list__copy' },
              React.createElement('strong', null, row.title),
              React.createElement('em', null, row.helper)
            )
          )
        ))
      ),
      React.createElement('label', { className: 'template-supplement-field' },
        React.createElement('span', null, '补充说明'),
        React.createElement('input', {
          type: 'text',
          value: manualContractId,
          disabled: handled,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setManualContractId(event.target.value),
          placeholder: '请输入补充说明描述',
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
            label: userLabel,
          }),
        }, '确认')
      )
    )
  )
}

function TemplateDataDetailPanel({ onClosePreview }: { onClosePreview?: () => void }) {
  return (
    React.createElement('div', { className: 'template-detail-panel' },
      React.createElement(WorkbenchTopbar, { title: '套打数据字段替换规则', onClosePreview }),
      React.createElement('div', { className: 'template-detail-panel__body' },
        React.createElement('section', { className: 'template-detail-section' },
          React.createElement('h3', null, '基础信息'),
          React.createElement('div', { className: 'template-detail-grid' },
            React.createElement('span', null, '套打数据名称'), React.createElement('b', null, '租赁中心-新签合同文本-v001'),
            React.createElement('span', null, '业务对象'), React.createElement('b', null, '租赁中心_新签合同文本'),
            React.createElement('span', null, '对接方式'), React.createElement('b', null, '字段路径映射')
          )
        ),
        React.createElement('section', { className: 'template-detail-section' },
          React.createElement('h3', null, '字段结构'),
          React.createElement('div', { className: 'template-schema-table' },
            [
              ['租赁中心_新签合同文本.出租方名称', '文本', '广州南沙国际物流有限公司'],
              ['租赁中心_新签合同文本.出租方.联系地址', '文本', '广州市南沙区龙穴岛龙穴大道中路13号1801房'],
              ['租赁中心_新签合同文本.出租方.营业执照（社会信用号码）', '文本', '91440115747565587Q'],
              ['租赁中心_新签合同文本.承租方名称', '文本', '广州市捷诺物流有限公司'],
              ['租赁中心_新签合同文本.承租方.法人姓名', '文本', '黄洁琼'],
              ['租赁中心_新签合同文本.承租方.联系人', '文本', '黄洁琼'],
              ['租赁中心_新签合同文本.承租方.联系电话', '电话', '13710936215'],
              ['租赁中心_新签合同文本.物业合同编号', '文本', 'WL-YY-2025111104'],
              ['租赁中心_新签合同文本.租赁资源全称', '文本', '龙穴大道中路13号1401房'],
              ['租赁中心_新签合同文本.总租赁面积（㎡）', '数值', '10.44'],
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
    ? 'WL-YY-2025111104'
    : (replacementChanged ? '${租赁中心_新签合同文本.合同名称}' : '${租赁中心_新签合同文本.合同编号}')
  const contractName = isContract ? '龙穴大道中路13号1401房租赁合同' : '${租赁中心_新签合同文本.合同名称}'
  const partyA = isContract ? '广州南沙国际物流有限公司' : '${租赁中心_新签合同文本.出租方名称}'
  const partyB = isContract ? '广州市捷诺物流有限公司' : '${租赁中心_新签合同文本.承租方名称}'
  const workbenchTitle = replacementChanged
    ? '租赁合同套打模板_AI_第二版'
    : (isContract ? '租赁合同_WL-YY-2025111104.docx' : '租赁合同套打文档_AI_初稿')
  const documentPreview = React.createElement('div', { className: 'template-doc-editor' },
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
      React.createElement('p', null, '合同名称：', React.createElement('mark', null, contractName)),
      React.createElement('p', null, '甲方（出租方）：', React.createElement('mark', null, partyA)),
      React.createElement('p', null, '甲方联系地址：', React.createElement('mark', null, isContract ? '广州市南沙区龙穴岛龙穴大道中路13号1801房' : '${租赁中心_新签合同文本.出租方.联系地址}')),
      React.createElement('p', null, '社会信用代码：', React.createElement('mark', null, isContract ? '91440115747565587Q' : '${租赁中心_新签合同文本.出租方.营业执照（社会信用号码）}')),
      React.createElement('p', null, '乙方（承租方）：', React.createElement('mark', null, partyB)),
      React.createElement('p', null, '乙方法人姓名：', React.createElement('mark', null, isContract ? '黄洁琼' : '${租赁中心_新签合同文本.承租方.法人姓名}')),
      React.createElement('p', null, '联系人：', React.createElement('mark', null, isContract ? '林晓敏' : '${租赁中心_新签合同文本.承租方.联系人}'), '，联系电话：', React.createElement('mark', null, isContract ? '13710936215' : '${租赁中心_新签合同文本.承租方.联系电话}')),
      React.createElement('p', null, '租赁物业位于 ', React.createElement('mark', null, isContract ? '龙穴大道中路13号1401房' : '${租赁中心_新签合同文本.租赁资源全称}'), '，租赁面积 ', React.createElement('mark', null, isContract ? '10.44' : '${租赁中心_新签合同文本.总租赁面积（㎡）}'), ' 平方米。')
    )
  )
  const mappingPreview = React.createElement('section', { className: 'template-field-mapping-pane', 'aria-label': '套打数据字段替换规则' },
    React.createElement('div', { className: 'template-field-mapping-pane__tabs' },
      React.createElement('span', { className: 'active' }, '套打数据字段替换规则'),
      React.createElement('span', null, '租赁合同套打文档_AI_初稿')
    ),
    React.createElement('div', { className: 'template-field-mapping-pane__body' },
      React.createElement('h3', null, '套打数据字段替换规则'),
      React.createElement('div', { className: 'template-field-mapping-pane__head' },
        React.createElement('span', null, '字段名称'),
        React.createElement('span', null, '原文替换内容')
      ),
      React.createElement('div', { className: 'template-field-tree' },
        React.createElement('div', { className: 'template-field-tree__group' },
          React.createElement('span', null, '⌄'),
          React.createElement('strong', null, '租赁中心_新签合同文本'),
          React.createElement('em', null, '对象')
        ),
        fieldMappingRows.map(([label, value], index) => (
          React.createElement('div', { className: `template-field-tree__row${index === 3 ? ' is-active' : ''}`, key: label },
            React.createElement('span', null, '•'),
            React.createElement('strong', null, label),
            React.createElement('em', null, value)
          )
        ))
      )
    )
  )

  return (
    React.createElement('div', { className: 'template-doc-workbench' },
      React.createElement(WorkbenchTopbar, {
        title: workbenchTitle,
        onClosePreview,
      }),
      isContract
        ? documentPreview
        : React.createElement('div', { className: 'template-doc-split-workbench' },
          mappingPreview,
          documentPreview
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
;(TemplateDocPanel as any).hasInternalClose = true
const ContractDocPanel = (props: any) => React.createElement(TemplateDocumentPanel, { ...props, variant: 'contract' })
;(ContractDocPanel as any).hasInternalClose = true

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
  phases: ['upload_received', 'template_generated', 'contract_data_select', 'contract_preview', 'complete'],
  initialState: {},
  chatVisibleComponents: ['TemplateDataSelectCard', 'GeneratedTemplateCard', 'TemplateOnlinePreviewButton', 'ContractDataSelectCard'],
  extraComponentMap: {
    TemplateDataSelectCard,
    GeneratedTemplateCard,
    TemplateOnlinePreviewButton,
    ContractDataSelectCard,
  },
  homeChips: [{ label: 'AI新增模板', scenarioId: SCENARIO_ID, prompt: '@系统管理助手 帮我根据这份租赁合同生成套打模板' }],
  panelMap: {
    field_rule: panel(TemplateDataDetailPanel),
    template_doc: panel(TemplateDocPanel),
    contract_doc: panel(ContractDocPanel),
  },
  panelTitleMap: {
    field_rule: '套打数据字段替换规则',
    template_doc: '租赁合同套打文档_AI_初稿',
    contract_doc: '租赁合同_WL-YY-2025111104.docx',
  },
  onPhaseEnter(phase, ctx) {
    if (phase === 'upload_received') {
      addAssistantMessage(
        ctx,
        '已收到上传的标准合同文档。请选择本次使用的套打数据，我会自动解析文档并匹配套打字段，并且自动生成套打模版。',
        () => addComponentMessage(ctx, 'TemplateDataSelectCard')
      )
      return
    }
    if (phase === 'template_generated') {
      addAssistantMessage(
        ctx,
        '已生成字段匹配规则：**套打数据字段匹配规则**，共识别 **35 处原文内容** 可替换。\n\n已自动创建套打模版：**租赁合同套打文档_AI_初稿**，并完成套打模版字段的绑定。',
        () => {
          addComponentMessage(ctx, 'GeneratedTemplateCard', { variant: 'fieldRule' })
          addComponentMessage(ctx, 'GeneratedTemplateCard', { variant: 'templateDraft' })
          addComponentMessage(ctx, 'TemplateOnlinePreviewButton')
        }
      )
      return
    }
    if (phase === 'contract_data_select') {
      addAssistantMessage(
        ctx,
        '请选择在线预览套打模版的套打数据来源',
        () => addComponentMessage(ctx, 'ContractDataSelectCard')
      )
      return
    }
    if (phase === 'contract_preview') {
      addAssistantMessage(
        ctx,
        '套打模版根据选择合同数据已经生成正式的租赁合同，请点击租赁合同查看详情；',
        () => addComponentMessage(ctx, 'GeneratedTemplateCard', { variant: 'formalContract' })
      )
    }
  },
  handleSend(text, ctx) {
    ctx.dispatch({ type: 'ADD_MESSAGE', message: { id: genMessageId(), role: 'user', content: text, timestamp: Date.now() } })
    if (text.includes('合同编号') && text.includes('合同名称')) {
      ctx.dispatch({ type: 'SET_SCENARIO_STATE', scenarioId: SCENARIO_ID, state: { replacementChanged: true } })
      addAssistantMessage(
        ctx,
        '我会把套打模板中 ${租赁中心_新签合同文本.合同编号} 改成 ${租赁中心_新签合同文本.合同名称}。字段已替换完成，请检查文档中的字段替换效果。',
        () => {
          addComponentMessage(ctx, 'GeneratedTemplateCard', { variant: 'replacementUpdated' })
          ctx.dispatch({ type: 'OPEN_PREVIEW', readonly: false, targetPhase: 'template_doc', targetArtifactTitle: '租赁合同套打文档_AI 初稿', scrollBeforeOpen: false })
        }
      )
      return
    }
    if (text.includes('在线预览套打模版') || text.includes('预览套打模版')) {
      ctx.dispatch({ type: 'SET_PHASE', phase: 'contract_data_select' })
      return
    }
    if (text.includes('合同编号') || text.includes('样例数据')) {
      ctx.dispatch({ type: 'SET_PHASE', phase: 'contract_preview' })
      return
    }
    addAssistantMessage(ctx, '我主要负责当前套打模板的自动生成、字段识别、在线预览和字段替换调整。请继续描述需要解析、识别或调整的套打字段。')
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
      ctx.dispatch({ type: 'SET_PHASE', phase: String(payload.to || 'complete') })
    }
  },
  actionButtonsMap() {
    return null
  },
}

export default scenario
