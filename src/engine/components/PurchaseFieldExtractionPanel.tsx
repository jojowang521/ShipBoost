import { CalendarDays, ChevronDown, Download, FileText, Plus } from 'lucide-react'

const customerFields = [
  { label: '买方姓名', value: '张介红', required: true },
  { label: '身份证号', value: '51152919850622742X', required: true },
  { label: '通讯地址', value: '屏山县中央领御', required: true, warning: true, wide: true },
  { label: '联系电话', value: '18227275760', required: true },
]

const roomFields = [
  { label: '楼栋', value: '1号楼', required: true },
  { label: '单元', value: '2单元', required: true },
  { label: '房号', value: '301', required: true },
  { label: '付款方式', value: '一次性' },
  { label: '折扣', value: '按揭优化1%，总价优化2万', action: true, wide: true },
  { label: '定金金额', value: '10,000', required: true, suffix: '元' },
  { label: '认购日期', value: '2023-02-28', required: true, date: true },
  { label: '应签约日期', value: '2023-02-28', required: true, date: true },
  { label: '置业顾问', value: '张源', required: true },
]

function FieldInput({ field }: { field: { label: string; value: string; required?: boolean; warning?: boolean; suffix?: string; date?: boolean; action?: boolean; wide?: boolean } }) {
  return (
    <label className={`purchase-field${field.wide ? ' purchase-field--wide' : ''}`}>
      <span className="purchase-field__label">
        {field.label}{field.required ? <i>*</i> : null}
      </span>
      <span className="purchase-field__control">
        <span className="purchase-field__value">{field.value}</span>
        {field.suffix ? <span className="purchase-field__suffix">{field.suffix}</span> : null}
        {field.date ? <CalendarDays size={15} strokeWidth={1.8} className="purchase-field__icon" /> : null}
        {field.action ? <Plus size={16} strokeWidth={1.8} className="purchase-field__plus" /> : null}
      </span>
    </label>
  )
}

type PurchaseFieldExtractionPanelProps = {
  submitted?: boolean
  onSubmit?: () => void
  onClosePreview?: () => void
}

function RefreshWorkbenchIcon() {
  return (
    <svg className="artifact-workbench__svg-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.3999 2.3999V5.3999H10.3999" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.1973 11C12.1599 12.7934 10.2208 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.1372 2 12.0135 3.11747 13.0764 4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MaximizeWorkbenchIcon() {
  return (
    <svg className="artifact-workbench__svg-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.9847 10.5999V13.4284H11.1563" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.01333 4.84292V2.0145H4.84176" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.1988 2.01431H14.0273V4.84274" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.8417 13.4286H2.01328V10.6001" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.3989 13.2002L10.5989 10.4002" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.44165 2.3999L5.24165 5.1999" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13.3989 2.3999L10.5989 5.1999" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.59912 13.2002L5.39912 10.4002" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CloseWorkbenchIcon() {
  return (
    <svg className="artifact-workbench__svg-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.57564 2.57564C2.80995 2.34132 3.18996 2.34132 3.42427 2.57564L7.99947 7.15083L12.4751 2.67622C12.7094 2.44191 13.0894 2.44191 13.3237 2.67622C13.5579 2.91055 13.558 3.29057 13.3237 3.52486L8.8481 7.99947L13.3237 12.4751C13.558 12.7094 13.558 13.0894 13.3237 13.3237C13.0894 13.5579 12.7093 13.558 12.4751 13.3237L7.99947 8.8481L3.42427 13.4243C3.18999 13.6586 2.80996 13.6585 2.57564 13.4243C2.34132 13.19 2.34132 12.81 2.57564 12.5756L7.15083 7.99947L2.57564 3.42427C2.34134 3.18997 2.34138 2.80996 2.57564 2.57564Z" fill="currentColor" />
    </svg>
  )
}

export default function PurchaseFieldExtractionPanel({ submitted = false, onSubmit, onClosePreview }: PurchaseFieldExtractionPanelProps) {
  return (
    <div className={`purchase-extraction-panel${submitted ? ' purchase-extraction-panel--submitted' : ''}`}>
      <header className="artifact-workbench__titlebar artifact-workbench__titlebar--purchase">
        <div className="artifact-workbench__tabs" role="tablist" aria-label="认购字段提取工作台">
          <button type="button" role="tab" aria-selected="true" className="artifact-workbench__tab artifact-workbench__tab--active">
            <FileText size={16} strokeWidth={1.8} />
            <span>认购字段提取结果</span>
          </button>
        </div>
        <div className="artifact-workbench__ops" aria-label="工作台操作">
          <button type="button" className="artifact-workbench__export">
            <span>导出</span>
            <Download size={12} />
          </button>
          <button type="button" className="artifact-workbench__icon-btn" aria-label="刷新">
            <RefreshWorkbenchIcon />
          </button>
          <button type="button" className="artifact-workbench__icon-btn" aria-label="放大">
            <MaximizeWorkbenchIcon />
          </button>
          <button type="button" className="artifact-workbench__icon-btn" aria-label="关闭" onClick={onClosePreview}>
            <CloseWorkbenchIcon />
          </button>
        </div>
      </header>
      <div className="purchase-extraction-panel__body">
        <div className="purchase-extraction-alert">
          <span>识别到“通讯地址”可信度较低，请重点核对</span>
        </div>

        <section className="purchase-form-card">
          <div className="purchase-form-card__head">
            <div>
              <h2>客户信息</h2>
            </div>
            <ChevronDown size={18} strokeWidth={1.8} />
          </div>

          <div className="purchase-form-grid">
            {customerFields.map(field => <FieldInput field={field} key={field.label} />)}
          </div>

          <div className="purchase-form-divider" />

          <div className="purchase-form-grid">
            {roomFields.map(field => <FieldInput field={field} key={field.label} />)}
          </div>
        </section>
      </div>

      <footer className="purchase-extraction-panel__footer">
        <span>请核对字段，未识别项可手动补充。</span>
        <div className="purchase-extraction-panel__actions">
          <button type="button" className="purchase-extraction-panel__btn" disabled={submitted}>取消</button>
          <button
            type="button"
            className="purchase-extraction-panel__btn purchase-extraction-panel__btn--primary"
            disabled={submitted}
            onClick={onSubmit}
          >
            确认提交
          </button>
        </div>
      </footer>
    </div>
  )
}
