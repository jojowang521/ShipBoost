export interface ReplayRound {
  user_message: string | null
  user_attachment?: {
    name: string
    size?: string
    type?: 'pdf' | 'word' | 'excel' | 'xml' | 'file'
  }
  assistant_message: string
  clickLabel?: string
  artifact?: ReplayArtifact
  artifactGroup?: ReplayArtifact[]
  divider?: string
}

export interface ReplayArtifact {
  title: string
  meta?: string
  icon?: string
  targetPhase: string
}

export interface ReplayScene {
  id: string
  title: string
  agentName: string
  avatarKey: string
  rounds: ReplayRound[]
  artifact?: ReplayArtifact
  panel?: {
    phase: string
    title: string
    markdown: string
  }
}

export const replayScenes: Record<string, ReplayScene> = {
  'contract-ledger-entry': {
    id: 'contract-ledger-entry',
    title: '认购单录入',
    agentName: '销售录单助手',
    avatarKey: 'bill_assistant',
    rounds: [
      {
        user_message: '认购单录入',
        user_attachment: {
          name: '深圳湾云庭-1栋1203-客户认购单.pdf',
          size: '11.4k',
          type: 'pdf',
        },
        assistant_message: '字段提取完成。共提取 **12/13 个字段**，折扣 1 项未识别，已保留空值并标注。已生成 **认购字段提取结果** 文档。请核对认购提取结果，确认后可提交录单。',
        artifact: {
          title: '认购字段提取结果',
          icon: 'detail',
          targetPhase: 'task-replay-purchase-field-extraction',
        },
      },
    ],
    panel: {
      phase: 'task-replay-purchase-field-extraction',
      title: '认购字段提取结果',
      markdown: '',
    },
  },
  'control-price': {
    id: 'control-price',
    title: '深圳湾控制价审核',
    agentName: '成本分析助手',
    avatarKey: 'smart_cost_assistant',
    rounds: [
      {
        user_message: '帮我做一次“深圳湾一号中信宏城片区城市更新项目(一期)施工总承包清单”的控制价审核',
        assistant_message: '已确认业态信息。请选择审核分析方式，建议使用 **「指标分析 + 综合单价分析（⭐ 推荐）」**。确认无误后，点击或回复 **「确认」** 将进入下一步 **「项目选择」**。',
      },
      {
        user_message: '选择审核分析方式：指标分析、综合单价分析',
        clickLabel: '确认',
        assistant_message: '已匹配到 **9 个近 3 年同类项目**，覆盖 **11 个专业**，带 **「⭐」** 为推荐项目。\n\n确认无误后，回复 **「确认项目」** 将进入下一步 **「选择组价范围」**。\n\n| 序号 | 业态 / 专业 / 项目 | 面积/规模 | 总分 |\n|---:|---|---:|---:|\n| 1 | 住宅 - 住宅 / 门窗栏杆工程 |  |  |\n| 2 | └─ 深圳湾一号-分期 2 (深圳市-2016) | 12.97 万㎡ | ⭐ 96 |\n| 3 | └─ 深圳龙华民治花园项目一期 (深圳市-2016) | 12.97 万㎡ | ⭐ 90 |\n| 4 | 住宅 - 住宅 / 门窗栏杆工程 |  |  |\n| 5 | └─ 深圳湾一号-分期3 (深圳市-2016) | 12.97 万㎡ | 85 |\n| 6 | └─ 深圳龙华民治花园项目一期（深圳市-2016） | 12.97 万㎡ | 80 |\n| 7 | 住宅 - 住宅 / 门窗栏杆工程 |  |  |\n| 8 | └─ 深圳湾一号-分期3 (深圳市-2016) | 12.97 万㎡ | 85 |\n| 9 | └─ 深圳龙华民治花园项目一期 (深圳市-2016) | 12.97 万㎡ | 85 |',
      },
      {
        user_message: '确认项目',
        clickLabel: '确认项目',
        assistant_message: '为提升 AI 模拟组价的准确性，我建议使用以下**组价范围**：\n\n- **地区：** 广东省/深圳市\n- **时间范围：** 近1年\n- **清单覆盖范围：** 50%\n\n确认无误后，回复 **「确认」** 开始生成控制价审核报告。',
      },
      {
        user_message: '地区：广东省/深圳市、时间范围：近1年、清单覆盖范围：50%',
        clickLabel: '确认',
        assistant_message: '**本次审核结论：**\n\n**1.风险概览**\n\n- 本次送审总额 5.52 亿元，折合单方综合造价 2,860.76 元/㎡。\n- 系统共扫描 59 个造价指标，发现 35 个异常，主要集中在单价异常、量价联动异常及严重偏离项。\n\n**2.核心关注点Top**\n\n- 住宅钢结构工程单价明显偏高，偏离 +620.5%。\n- 住宅钢筋、普通砌体含量明显偏低，可能存在口径差异/漏项风险。\n\n建议先查看异常明细，重点核查钢结构、钢筋、普通砌体相关清单。接下来，您可以直接用自然语言修改报告内容，也可以继续追问本报告中的问题。\n\n已同步生成 **控制价审核明细**，可切换右侧工作台查看异常清单、指标偏差和综合单价明细。',
        artifactGroup: [
          {
            title: '控制价审核报告',
            meta: '汇总审核结论、风险概览和核心关注点',
            icon: 'report',
            targetPhase: 'task-replay-control-price-report',
          },
          {
            title: '控制价审核明细',
            meta: '展示异常清单、指标偏差和综合单价明细',
            icon: 'detail',
            targetPhase: 'task-replay-control-price-report',
          },
        ],
      },
    ],
    panel: {
      phase: 'task-replay-control-price-report',
      title: '控制价审核报告',
      markdown: '',
    },
  },
  'bid-clearing': {
    id: 'bid-clearing',
    title: '多供应商清标比价',
    agentName: 'Noma助手',
    avatarKey: 'noma_ai',
    rounds: [
      {
        user_message: '请对太阳城3号地块土建工程的5家供应商报价文件进行清标比价',
        assistant_message: '已完成供应商报价文件采集。共识别 **5 家供应商**，其中正源集团缺失模板工程、脚手架工程 2 项清单，已标记为未报价。',
      },
      {
        user_message: null,
        assistant_message: '清标检查完成。建议重点关注 **中恒工程与宏达建工报价雷同**，以及 **天诚建设报价规律异常**。默认建议排除天诚建设后继续比价。',
      },
      {
        user_message: '按推荐规则继续比价',
        assistant_message: '比价分析完成。供应商 C 总价偏高 +7.0%，门窗工程和屋面工程出现严重偏差；供应商 B 与 C 有 **12 项高度相似报价**，建议在评标阶段重点核查。',
      },
    ],
  },
  'cost-qa-indicator': {
    id: 'cost-qa-indicator',
    title: '项目成本指标问数',
    agentName: 'Noma助手',
    avatarKey: 'noma_ai',
    rounds: [
      {
        user_message: '严西湖临府住宅的钢筋建面单方是多少？',
        assistant_message: '**严西湖临府住宅主体结构钢筋建面单方为 46.85 kg/m²。**\n\n数据来自项目竣工结算入库，口径为主体结构含量，适合作为同类高层住宅目标成本测算的参考基准。',
      },
      {
        user_message: '对比一下严西湖临府、东湖国际、光谷壹号这三个项目的钢筋含量',
        assistant_message: '三个项目钢筋含量分布在 **43.20~49.60 kg/m²** 区间：东湖国际 43.20，严西湖临府 46.85，光谷壹号 49.60。差异主要受层数和抗震等级影响。',
      },
      {
        user_message: '为什么光谷壹号比东湖国际高 6.4kg/m²？',
        assistant_message: '差异 **100% 来自设计参数**。其中抗震设防从 7 度提升到 8 度贡献 +3.5kg/m²，层数从 24 层增加到 33 层贡献 +2.2kg/m²，地下室增加贡献 +0.7kg/m²，属于合理偏差。',
      },
    ],
  },
  'cost-sensitivity': {
    id: 'cost-sensitivity',
    title: '材料价格敏感性测算',
    agentName: 'Noma助手',
    avatarKey: 'noma_ai',
    rounds: [
      {
        user_message: '如果钢筋市场价上涨 5%，对江汉湾府目标成本影响多少？',
        assistant_message: '已读取江汉湾府目标成本参数。当前测算口径为：建面 **27.6 万㎡**，目标钢筋含量 **45kg/㎡**，钢筋总用量约 **12,420 吨**。',
      },
      {
        user_message: null,
        assistant_message: '钢筋价格上涨 5% 时，江汉湾府目标成本预计净增加 **1,847 万元**，折合单方成本 **+67 元/㎡**，约占总成本 **1.16%**。',
      },
      {
        user_message: '给我一个成本控制建议',
        assistant_message: '建议在目标成本中预留 **1.5% 钢筋价格波动准备金**，并在 4-5 月采购窗口锁定 60% 以上用量。若价格继续上行，可优先复核钢筋损耗率和分包调差条款。',
      },
    ],
  },
}

export const defaultReplaySceneId = 'control-price'

export function getReplayScene(sceneId: string | null | undefined): ReplayScene {
  return replayScenes[sceneId || defaultReplaySceneId] || replayScenes[defaultReplaySceneId]
}
