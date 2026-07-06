export const replayScenes = {
  'control-price': {
    id: 'control-price',
    title: '控制价标底智能审核',
    roleTag: '成本审核专员',
    agentName: '控制价审核专员',
    avatarSrc: '/avatar-ai-1.png',
    template: '帮我审核[项目名称]的控制价标底文件，重点检查[工程量指标/综合单价/措施费]是否合理',
    defaultPrompt: '帮我审核太阳城片区城市更新项目一期土建工程控制价标底文件，重点检查工程量指标、综合单价和措施费是否合理',
    rounds: [
      {
        user_message: '帮我审核太阳城片区城市更新项目一期土建工程控制价标底文件，重点检查工程量指标和综合单价是否合理',
        agent_steps: [
          { type: 'thinking', content: '先解析控制价 Excel，再识别工程结构和清单金额，为后续对标做准备' },
          { type: 'tool_call', content: '读取文件：太阳城片区城市更新项目一期土建工程控制价.xlsx' },
          { type: 'tool_result', content: '识别 1 个工作表，995 行 x 7 列，分部分项清单 25 条，汇总金额 290,262,210.94 元' },
          { type: 'tool_call', content: '构建工程结构树：地下室、1栋塔楼、2栋一/二/三单元塔楼' },
          { type: 'tool_result', content: '已生成 5 个单位工程节点，并完成节点金额识别' },
        ],
        assistant_message: '已完成控制价文件解析和工程结构识别。系统识别总金额 **2.90 亿元**，后续将对土建、装饰、市政等专业进行指标扫描和综合单价审核。',
      },
      {
        user_message: null,
        agent_steps: [
          { type: 'thinking', content: '需要匹配同区域、同业态、同阶段的历史项目作为合理区间' },
          { type: 'tool_call', content: '检索历史对标库：广东 / 深圳 / 住宅城市更新 / 近 3 年' },
          { type: 'tool_result', content: '匹配到 10 个指标完整项目，其中 6 个相似度高于 80 分' },
          { type: 'tool_call', content: '执行指标扫描：钢筋含量、混凝土含量、单方造价、措施费占比' },
          { type: 'tool_result', content: '发现 7 项指标偏离历史合理区间，钢筋含量和 PC 构件单价风险较高' },
        ],
        assistant_message: '已完成历史项目对标和指标扫描。当前项目存在 **7 项指标异常**：钢筋含量较历史均值偏高 11.9%，PC 构件综合单价偏高 15.5%，建议进入清单穿透分析。',
      },
      {
        user_message: '继续穿透明细，看哪些清单项影响最大',
        agent_steps: [
          { type: 'thinking', content: '优先穿透量价双高的清单项，并模拟合理组价区间' },
          { type: 'tool_call', content: '执行 AI 模拟组价：现浇构件钢筋、PC构件、C60混凝土、外墙干挂石材' },
          { type: 'tool_result', content: '发现 12 项清单综合单价偏高，最大偏差 +35.8%' },
          { type: 'tool_call', content: '交叉验证：指标异常 x 组价异常' },
          { type: 'tool_result', content: '确认 4 项高风险、8 项中风险，预计可优化金额约 486 万元' },
        ],
        assistant_message: '穿透分析完成。重点风险集中在 **PC构件、现浇钢筋、外墙干挂石材** 三类清单，初步测算可优化金额约 **486 万元**。建议要求编制方拆解运输费、加工费、吊装费和材料品牌溢价。',
      },
      {
        user_message: '生成一份审核结论，方便给甲方汇报',
        agent_steps: [
          { type: 'thinking', content: '整理风险等级、异常明细和整改建议，形成管理层可读的审核摘要' },
          { type: 'tool_call', content: '生成审核报告：控制价标底审核报告_太阳城_20260428.docx' },
          { type: 'tool_result', content: '报告已生成，包含执行摘要、异常指标、清单穿透明细和整改建议' },
        ],
        assistant_message: '审核报告已生成。报告结论为：当前控制价存在 **中高风险**，建议重点复核 4 项高风险清单，预计优化空间约 **486 万元**。已同步生成甲方汇报版摘要。',
      },
    ],
    artifact: {
      title: '控制价标底审核报告',
      fileName: '控制价标底审核报告_太阳城_20260428.docx',
      typeLabel: 'Word 报告',
      status: '已生成',
      description: '查看异常指标、清单穿透明细和整改建议。',
      generatedAt: '2026-04-28 15:42',
      thumbnailTitle: '中高风险',
      thumbnailMeta: '4项高风险 / 486万元优化空间',
      metrics: [
        { label: '审核金额', value: '2.90亿元' },
        { label: '风险项', value: '12项' },
        { label: '高风险', value: '4项' },
        { label: '预计优化', value: '486万元' },
      ],
      sections: [
        {
          heading: '审核摘要',
          columns: ['字段', '内容'],
          rows: [
            ['项目名称', '太阳城片区城市更新项目一期'],
            ['审核范围', '土建工程控制价标底'],
            ['审核结论', '中高风险，建议复核 PC构件、现浇钢筋、外墙干挂石材'],
            ['建议动作', '要求编制方拆解运输费、加工费、吊装费和材料品牌溢价'],
          ],
        },
        {
          heading: '异常明细',
          columns: ['风险项', '异常表现', '影响金额', '处理建议'],
          rows: [
            ['PC构件综合单价', '高于相似项目均值 15.5%', '218万元', '复核运输费、吊装费和构件损耗率'],
            ['现浇构件钢筋', '钢筋含量高于历史均值 11.9%', '142万元', '复核结构参数和钢筋损耗口径'],
            ['外墙干挂石材', '综合单价偏高 35.8%', '86万元', '核对品牌档次和市场参考价'],
            ['C60混凝土', '组价偏离同区间项目 12.4%', '40万元', '补充供应商询价依据'],
          ],
        },
      ],
    },
    automationSteps: [
      {
        user_message: '帮我审核龙华城市更新项目三期控制价标底文件，重点检查综合单价和措施费是否合理',
        agent_steps: [
          { type: 'thinking', content: '识别默认提示词中的项目、文件类型和审核重点' },
          { type: 'tool_call', content: '创建自动化任务：控制价标底智能审核' },
          { type: 'tool_result', content: '任务已创建，自动绑定历史对标库、组价规则和报告模板' },
        ],
        assistant_message: '已默认提交控制价审核任务，正在解析标底文件并启动指标对标。',
      },
      {
        user_message: null,
        agent_steps: [
          { type: 'thinking', content: '并行执行结构识别、指标扫描、价格偏差和措施费占比检查' },
          { type: 'tool_call', content: '运行审核规则：工程量指标、综合单价、措施费占比' },
          { type: 'tool_result', content: '发现 15 项待复核问题，初步可优化金额约 392 万元' },
        ],
        assistant_message: '类似任务已开始执行。系统已完成初步审核，发现 **15 项待复核问题**，正在生成风险摘要和整改建议。',
      },
    ],
  },

  'bid-clearing': {
    id: 'bid-clearing',
    title: '多供应商清标比价',
    roleTag: '清标比价专员',
    agentName: '清标比价专员',
    avatarSrc: '/avatar-ai-2.png',
    template: '请对[项目名称]的多家供应商报价文件进行清标比价，重点检查[缺项/雷同/偏差]',
    defaultPrompt: '请对太阳城3号地块土建工程的5家供应商报价文件进行清标比价，重点检查缺项、雷同和报价偏差',
    rounds: [
      {
        user_message: '请对太阳城3号地块土建工程的5家供应商报价文件进行清标比价',
        agent_steps: [
          { type: 'thinking', content: '先识别供应商文件，再用首个文件生成采集规则，复用到剩余文件' },
          { type: 'tool_call', content: '读取报价文件：华建建设、中恒工程、宏达建工、正源集团、天诚建设' },
          { type: 'tool_result', content: '已识别 5 个供应商文件和 1 个控制价文件，首个文件包含 186 条清单' },
          { type: 'tool_call', content: '生成采集规则并批量解析剩余供应商报价' },
          { type: 'tool_result', content: '5 家供应商采集完成，正源集团缺失 2 项清单' },
        ],
        assistant_message: '已完成供应商报价文件采集。共识别 **5 家供应商**，其中正源集团缺失模板工程、脚手架工程 2 项清单，已标记为未报价。',
      },
      {
        user_message: null,
        agent_steps: [
          { type: 'thinking', content: '对清标内容做规则性检查，重点看报价规律、错误雷同和清单混装' },
          { type: 'tool_call', content: '执行清标检查：报价规律性、错误雷同性、报价清单混装' },
          { type: 'tool_result', content: '中恒工程与宏达建工有 12 项报价相似度 >95%；天诚建设 38 项整百整千报价' },
        ],
        assistant_message: '清标检查完成。建议重点关注 **中恒工程与宏达建工报价雷同**，以及 **天诚建设报价规律异常**。默认建议排除天诚建设后继续比价。',
      },
      {
        user_message: '按推荐规则继续比价',
        agent_steps: [
          { type: 'thinking', content: '采用截尾均值法，剔除异常供应商后计算基准价和偏差率' },
          { type: 'tool_call', content: '配置比价规则：截尾均值，严重偏差 ±30%，中度偏差 ±15%' },
          { type: 'tool_result', content: '基准总价 3,037,000 元；发现 18 项中度偏差、5 项严重偏差' },
          { type: 'tool_call', content: '生成比价报告和清单明细预警表' },
          { type: 'tool_result', content: '比价报告已生成，包含总价对比、雷同明细、严重偏差清单' },
        ],
        assistant_message: '比价分析完成。供应商 C 总价偏高 +7.0%，门窗工程和屋面工程出现严重偏差；供应商 B 与 C 有 **12 项高度相似报价**，建议在评标阶段重点核查。',
      },
    ],
    artifact: {
      title: '多供应商清标比价报告',
      fileName: '清标比价报告_太阳城3号地块_20260428.xlsx',
      typeLabel: 'Excel 报告',
      status: '已生成',
      description: '查看供应商总价对比、缺项、报价雷同和严重偏差明细。',
      generatedAt: '2026-04-28 16:10',
      thumbnailTitle: '5家供应商',
      thumbnailMeta: '2项缺项 / 5项严重偏差',
      metrics: [
        { label: '供应商', value: '5家' },
        { label: '缺项', value: '2项' },
        { label: '雷同报价', value: '12项' },
        { label: '严重偏差', value: '5项' },
      ],
      sections: [
        {
          heading: '比价摘要',
          columns: ['供应商', '总价', '偏差', '系统判断'],
          rows: [
            ['华建建设', '2,980,000元', '-1.9%', '可进入商务评审'],
            ['中恒工程', '3,050,000元', '+0.4%', '与宏达建工存在高相似报价'],
            ['宏达建工', '3,062,000元', '+0.8%', '与中恒工程存在高相似报价'],
            ['正源集团', '2,890,000元', '-4.8%', '缺失模板工程、脚手架工程'],
            ['天诚建设', '3,248,000元', '+7.0%', '报价规律异常，建议重点核查'],
          ],
        },
        {
          heading: '风险明细',
          columns: ['风险类型', '涉及对象', '证据', '建议'],
          rows: [
            ['报价缺项', '正源集团', '模板工程、脚手架工程未报价', '要求补齐报价后再参与比较'],
            ['报价雷同', '中恒工程、宏达建工', '12 项报价相似度 >95%', '评标阶段补充询标记录'],
            ['规律报价', '天诚建设', '38 项整百整千报价', '核查是否存在模板化填报'],
            ['严重偏差', '门窗工程、屋面工程', '偏差超过 ±30%', '要求供应商提供组价说明'],
          ],
        },
      ],
    },
    automationSteps: [
      {
        user_message: '请对星河湾商业裙楼装修工程的4家供应商报价文件进行清标比价',
        agent_steps: [
          { type: 'thinking', content: '识别多文件任务，建立供应商报价采集批次' },
          { type: 'tool_call', content: '创建自动化任务：多供应商清标比价' },
          { type: 'tool_result', content: '任务已创建，自动加载清标规则和截尾均值比价规则' },
        ],
        assistant_message: '已默认提交清标比价任务，正在批量解析供应商报价文件。',
      },
      {
        user_message: null,
        agent_steps: [
          { type: 'thinking', content: '批量完成文件采集、内容检查和比价规则计算' },
          { type: 'tool_call', content: '运行清标检查：缺项、雷同、报价规律、总价偏差' },
          { type: 'tool_result', content: '发现 1 家供应商缺项、2 家供应商报价雷同、4 项严重偏差' },
        ],
        assistant_message: '类似任务已开始执行。系统已发现 **1 家供应商缺项** 和 **2 家供应商报价雷同**，正在生成比价报告。',
      },
    ],
  },

  'cost-qa-indicator': {
    id: 'cost-qa-indicator',
    title: '项目成本指标问数',
    roleTag: '成本问数专员',
    agentName: '成本问数专员',
    avatarSrc: '/avatar-ai-3.png',
    template: '帮我查询[项目名称]的[成本指标]，并对比[参考项目]',
    defaultPrompt: '帮我查询严西湖临府住宅的钢筋建面单方，并对比东湖国际和光谷壹号',
    rounds: [
      {
        user_message: '严西湖临府住宅的钢筋建面单方是多少？',
        agent_steps: [
          { type: 'thinking', content: '识别为项目指标查询，需要调取历史项目指标库' },
          { type: 'tool_call', content: '查询项目指标：严西湖临府 / 住宅 / 钢筋建面单方' },
          { type: 'tool_result', content: '命中竣工结算数据：46.85 kg/m²，口径为主体结构含量' },
        ],
        assistant_message: '**严西湖临府住宅主体结构钢筋建面单方为 46.85 kg/m²。**\n\n数据来自项目竣工结算入库，口径为主体结构含量，适合作为同类高层住宅目标成本测算的参考基准。',
      },
      {
        user_message: '对比一下严西湖临府、东湖国际、光谷壹号这三个项目的钢筋含量',
        agent_steps: [
          { type: 'thinking', content: '识别为多项目指标对比，需要统一业态、结构和指标口径' },
          { type: 'tool_call', content: '查询项目指标对比：3 个项目 / 钢筋含量 / 高层住宅' },
          { type: 'tool_result', content: '三个项目钢筋含量区间为 43.20~49.60 kg/m²' },
        ],
        assistant_message: '三个项目钢筋含量分布在 **43.20~49.60 kg/m²** 区间：东湖国际 43.20，严西湖临府 46.85，光谷壹号 49.60。差异主要受层数和抗震等级影响。',
      },
      {
        user_message: '为什么光谷壹号比东湖国际高 6.4kg/m²？',
        agent_steps: [
          { type: 'thinking', content: '进入归因模式，拆解层数、抗震等级和地下室深度对钢筋含量的贡献' },
          { type: 'tool_call', content: '调取结构设计参数：东湖国际 vs 光谷壹号' },
          { type: 'tool_result', content: '抗震等级贡献 +3.5，层数贡献 +2.2，地下室深度贡献 +0.7' },
        ],
        assistant_message: '差异 **100% 来自设计参数**。其中抗震设防从 7 度提升到 8 度贡献 +3.5kg/m²，层数从 24 层增加到 33 层贡献 +2.2kg/m²，地下室增加贡献 +0.7kg/m²，属于合理偏差。',
      },
    ],
    artifact: {
      title: '项目成本指标问数分析',
      fileName: '项目成本指标问数分析_严西湖临府_20260428.pdf',
      typeLabel: 'PDF 分析',
      status: '已生成',
      description: '查看历史项目指标、对比口径、差异归因和目标成本参考区间。',
      generatedAt: '2026-04-28 16:35',
      thumbnailTitle: '指标对比',
      thumbnailMeta: '3项目 / 4项归因',
      metrics: [
        { label: '目标指标', value: '46.85kg/m²' },
        { label: '参考项目', value: '3个' },
        { label: '指标区间', value: '43.20-49.60' },
        { label: '主要归因', value: '抗震等级' },
      ],
      sections: [
        {
          heading: '指标对比',
          columns: ['项目', '业态', '钢筋含量', '数据口径'],
          rows: [
            ['东湖国际', '高层住宅', '43.20 kg/m²', '主体结构竣工结算'],
            ['严西湖临府', '高层住宅', '46.85 kg/m²', '主体结构竣工结算'],
            ['光谷壹号', '高层住宅', '49.60 kg/m²', '主体结构竣工结算'],
          ],
        },
        {
          heading: '差异归因',
          columns: ['归因项', '影响值', '说明', '判断'],
          rows: [
            ['抗震设防等级', '+3.5 kg/m²', '7 度提升至 8 度', '合理'],
            ['建筑层数', '+2.2 kg/m²', '24 层提升至 33 层', '合理'],
            ['地下室深度', '+0.7 kg/m²', '地下空间增加', '合理'],
            ['施工损耗', '0 kg/m²', '结算口径已统一', '无异常'],
          ],
        },
      ],
    },
    automationSteps: [
      {
        user_message: '帮我查询江汉湾府目标成本测算可参考的住宅钢筋含量指标',
        agent_steps: [
          { type: 'thinking', content: '识别为历史指标问数，自动选择同区域、同业态参考项目' },
          { type: 'tool_call', content: '创建自动化任务：项目成本指标问数' },
          { type: 'tool_result', content: '任务已创建，已锁定武汉住宅高层样本库' },
        ],
        assistant_message: '已默认提交项目成本问数任务，正在检索同区域住宅项目指标。',
      },
      {
        user_message: null,
        agent_steps: [
          { type: 'thinking', content: '汇总历史项目指标，并生成推荐参考区间' },
          { type: 'tool_call', content: '查询指标：钢筋含量、混凝土含量、单方造价' },
          { type: 'tool_result', content: '已生成参考区间：钢筋含量 43.2~49.6 kg/m²' },
        ],
        assistant_message: '类似任务已开始执行。系统已生成同类住宅项目钢筋含量参考区间，并正在输出目标成本测算建议。',
      },
    ],
  },

  'cost-sensitivity': {
    id: 'cost-sensitivity',
    title: '材料价格敏感性测算',
    roleTag: '成本测算专员',
    agentName: '成本测算专员',
    avatarSrc: '/avatar-ai-4.png',
    template: '如果[材料名称]市场价上涨[比例]，测算对[项目名称]目标成本的影响',
    defaultPrompt: '如果钢筋市场价上涨5%，测算对江汉湾府目标成本的影响',
    rounds: [
      {
        user_message: '如果钢筋市场价上涨 5%，对江汉湾府目标成本影响多少？',
        agent_steps: [
          { type: 'thinking', content: '识别为价格敏感性测算，需要读取项目规模、目标含量和当前采购价' },
          { type: 'tool_call', content: '读取江汉湾府目标成本参数：建面 27.6 万㎡，目标钢筋含量 45kg/㎡' },
          { type: 'tool_result', content: '计算钢筋总用量 12,420 吨，当前综合采购价 3,950 元/吨' },
        ],
        assistant_message: '已读取江汉湾府目标成本参数。当前测算口径为：建面 **27.6 万㎡**，目标钢筋含量 **45kg/㎡**，钢筋总用量约 **12,420 吨**。',
      },
      {
        user_message: null,
        agent_steps: [
          { type: 'thinking', content: '按价格上涨幅度计算直接影响，再扣除合同调差可转嫁部分' },
          { type: 'tool_call', content: '执行敏感性测算：12,420 吨 x 3,950 元/吨 x 5%' },
          { type: 'tool_result', content: '直接成本增加 2,455 万元；合同调差可转嫁 608 万元' },
        ],
        assistant_message: '钢筋价格上涨 5% 时，江汉湾府目标成本预计净增加 **1,847 万元**，折合单方成本 **+67 元/㎡**，约占总成本 **1.16%**。',
      },
      {
        user_message: '给我一个成本控制建议',
        agent_steps: [
          { type: 'thinking', content: '结合历史价格波动和采购窗口，输出准备金与锁价建议' },
          { type: 'tool_call', content: '查询近 3 年钢筋价格趋势和同期采购窗口' },
          { type: 'tool_result', content: '4-5 月通常为年内相对低点，建议锁定 60% 以上用量' },
        ],
        assistant_message: '建议在目标成本中预留 **1.5% 钢筋价格波动准备金**，并在 4-5 月采购窗口锁定 60% 以上用量。若价格继续上行，可优先复核钢筋损耗率和分包调差条款。',
      },
    ],
    artifact: {
      title: '材料价格敏感性测算报告',
      fileName: '材料价格敏感性测算_江汉湾府_钢筋_20260428.xlsx',
      typeLabel: 'Excel 测算',
      status: '已生成',
      description: '查看材料用量、价格上涨影响、合同调差和采购锁价建议。',
      generatedAt: '2026-04-28 17:05',
      thumbnailTitle: '净增 1,847 万元',
      thumbnailMeta: '+67元/㎡ / 准备金1.5%',
      metrics: [
        { label: '材料用量', value: '12,420吨' },
        { label: '涨价幅度', value: '+5%' },
        { label: '净增加', value: '1,847万元' },
        { label: '单方影响', value: '+67元/㎡' },
      ],
      sections: [
        {
          heading: '测算口径',
          columns: ['字段', '数值'],
          rows: [
            ['项目名称', '江汉湾府'],
            ['建筑面积', '27.6万㎡'],
            ['目标钢筋含量', '45kg/㎡'],
            ['当前综合采购价', '3,950元/吨'],
          ],
        },
        {
          heading: '敏感性结果',
          columns: ['测算项', '金额', '说明', '建议'],
          rows: [
            ['直接成本增加', '2,455万元', '12,420吨 x 3,950元/吨 x 5%', '纳入目标成本预警'],
            ['合同调差可转嫁', '608万元', '按现有合同调差条款测算', '同步复核分包条款'],
            ['净增加目标成本', '1,847万元', '扣除可转嫁金额后的净影响', '预留 1.5% 价格波动准备金'],
            ['采购锁价建议', '锁定 60% 以上用量', '4-5 月为相对低点窗口', '提前完成框架采购谈判'],
          ],
        },
      ],
    },
    automationSteps: [
      {
        user_message: '如果铝合金门窗价格上涨8%，测算对星河湾商业综合体目标成本的影响',
        agent_steps: [
          { type: 'thinking', content: '识别为材料价格敏感性测算，自动读取材料用量和合同调差规则' },
          { type: 'tool_call', content: '创建自动化任务：材料价格敏感性测算' },
          { type: 'tool_result', content: '任务已创建，已绑定目标成本参数和人材机价格库' },
        ],
        assistant_message: '已默认提交材料价格敏感性测算任务，正在读取门窗工程目标成本参数。',
      },
      {
        user_message: null,
        agent_steps: [
          { type: 'thinking', content: '计算价格上涨直接影响，并生成采购与准备金建议' },
          { type: 'tool_call', content: '运行测算：铝合金门窗价格 +8%' },
          { type: 'tool_result', content: '预计净增加目标成本 214 万元，建议提前锁价 55%' },
        ],
        assistant_message: '类似任务已开始执行。系统已测算门窗价格上涨影响，预计净增加目标成本 **214 万元**，正在生成采购建议。',
      },
    ],
  },
}

export const defaultSceneId = 'control-price'

export function getReplayScene(sceneId) {
  return replayScenes[sceneId] || replayScenes[defaultSceneId]
}

export function getSceneIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return params.get('scene') || defaultSceneId
}
