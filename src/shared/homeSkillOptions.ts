export interface HomeSkillOption {
  name: string
  description: string
}

export const HOME_SKILL_OPTIONS: HomeSkillOption[] = [
  { name: '自然语言意图识别', description: '把口语化提问解析为可执行的查询条件、参数和动作。' },
  { name: '文档 OCR 识别', description: '从图片、扫描件和 PDF 中提取文字与版面信息。' },
  { name: '表格结构化抽取', description: '识别清单、台账、报价单中的表格并还原标准行列。' },
  { name: '审批规则校验', description: '按业务规则对比资料与系统数据，输出风险清单。' },
  { name: '控制价审核报告生成', description: '汇总指标偏差、组价合理性和风险点，生成审核报告。' },
]
