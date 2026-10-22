import type { FieldText, Localization } from './core';
import type { MessageKey } from './en';

/** Simplified Chinese. Missing or extra keys fail the type check below. */
const zhUI1 = {
  'meta.title': 'Retire · 本地退休规划',

  'header.home': 'Retire 首页',
  'header.localBadge': '本地运行',
  'language.label': '语言',

  'hero.eyebrow': '用数字规划人生下半场',
  'hero.title': '更清晰地看见退休生活。',
  'hero.copy': '探索支出、税收、通胀、医疗费用和汇率如何影响您一生的规划。',

  'start.backToConfig': '← 返回配置',
  'entry.grid': '开始配置',
  'entry.example.title': '从示例开始',
  'entry.example.body':
    '一个完整方案，账户、房产、税务与市场假设俱全，可直接探索。',
  'entry.example.load': '加载示例配置',
  'entry.example.control': '使用 50 年规划示例',
  'entry.guided.title': '引导式设置',
  'entry.guided.body': '回答几个问题，我们为您生成初始配置。',
  'entry.guided.start': '开始引导设置',
  'entry.guided.blank': '从空白配置开始',
  'entry.byo.title': '使用自己的方案',
  'entry.byo.body': '从设备上传 TOML 配置。在此编辑并下载保存您的工作。',
  'actions.uploadConfig': '上传配置',
  'upload.aria': '上传配置文件',

  'workspace.configChip': '配置',
  'workspace.hint': '下载以保存 · 重新加载需再次上传',
  'workspace.backToStart': '← 返回开始页',
  'workspace.newBlank': '新建空白',
  'workspace.downloadConfig': '下载当前配置',

  'plan.financial': '金融资产 · 税前总额',
  'plan.property': '房产净值',
  'plan.budget': '起始年度预算',
  'plan.health': '其中医疗预算',

  'run.issues': '还有 {count} 项待处理',
  'run.marketAttention': '市场假设需要检查',
  'run.ready': '就绪，可以开始探索',
  'run.issuesHint': '补全缺失输入并处理所列事项。',
  'run.readyHint': '所有配置使用相同的计算规则。您的配置保留在浏览器内存中。',
  'run.cancel': '取消运行',
  'run.start': '运行模拟',
  'run.simulating': '正在模拟 {done} / {total} 路径…',
  'run.summarizing': '正在计算分位数…',
  'run.completed': '已完成 {paths} 条路径。配置 {hash}。',
  'run.canceled': '运行已取消，部分结果已丢弃。',
  'run.failed': '运行失败，部分结果已丢弃。',
  'run.local': '所有计算均在本地完成。',
  'run.errorPath': '路径 {id}',
  'run.errorYear': '年份 {year}',

  'validation.title': '校验与待处理项',

  'tabs.label': '工作区标签页',
  'tabs.configuration': '配置',
  'tabs.results': '结果',
  'tabs.ledger': '年度账本',
  'tabs.assumptions': '假设说明',
  'tabs.compare': '对比',

  'snapshot.note':
    '当前显示的是已完成的运行 {hash}（种子 {seed}）。草稿修改、市场数据刷新和未完成的运行不会改变它。',

  'toml.title': '可携带的 TOML 配置',
  'toml.hint': '构建器中的每个字段都遵循与上传文件相同的解析与校验规则。',
  'toml.copy': '将预览复制到编辑器',
  'toml.label': '配置文本',
  'toml.description':
    '在此处编辑或粘贴完整 TOML 配置，然后选择"应用 TOML"以替换可编辑草稿。无效文本不会影响现有配置。仅编辑此处文本不会改变草稿、已完成的结果，也不会改变设备上的任何文件。',
  'toml.editorPath': 'TOML 编辑器',
  'toml.placeholder': '粘贴 TOML 配置以便在本地编辑和应用',
  'toml.apply': '应用 TOML',
  'draft.invalidArray': '# 草稿中存在无效的数组元素，请先修复该字段再导出。',

  'export.pin': '固定已完成的运行',
  'export.runConfig': '下载运行配置',
  'export.manifest': '下载运行清单',

  'error.simulation': '模拟或文件错误',
  'error.import': '导入未能应用',
  'error.preserved': '您现有的配置已保留。',
  'error.readFile': '无法读取本地文件：{detail}',
  'error.tooLarge': '配置超过 2 MiB',

  'footer.line1': '输入可携带，假设全透明。',
  'footer.line2': '本地文件 · 浏览器计算 · 不自动保存',

  'builder.sections': '配置分区',
  'section.simulation': '模拟设置',
  'section.people': '人员',
  'section.budget': '预算',
  'section.accounts': '账户',
  'section.properties': '房产',
  'section.market': '市场、通胀与汇率',
  'section.schema_version': '格式版本',
  'household.group': '家庭人数',
  'household.one': '一人',
  'household.two': '两人',
  'list.count': '{count} 项 · 顺序保留',
  'list.moveUp': '将 {path} 上移',
  'list.moveDown': '将 {path} 下移',
  'list.removeItem': '删除 {path}',
  'list.addItem': '添加 {path}',
  'list.remove': '删除',
  'list.add': '+ 添加{label}',
  'list.addShort': '+ 添加',
  'list.item': '{label} {index}',
  'builder.advancedProperty': '房产高级明细',
  'budget.core': '预算',
  'budget.medical': '医疗',
  'budget.shocks': '冲击',
  'budget.oneTime': '一次性支出',
  'market.markets': '市场',
  'market.inflation': '通胀',
  'market.fx': '汇率',
  'market.advanced': '高级{label}',
  'market.presets': '市场预设',
  'market.sampleDefaults': '示例默认值',
  'market.stablePrices': '稳定价格',
  'market.presetsHint':
    '示例默认值恢复示例自带的市场假设。稳定价格关闭通胀与汇率波动，但保留历史回报抽样。',
  'accounts.brokerage': '非退休流动资产',
  'accounts.preTax': '税前退休储蓄',
  'accounts.afterTax': '税后退休储蓄',
  'accounts.order': '第 {index}/3 顺位支取',
  'accounts.jointOwnership': '两人平均拥有',
  'accounts.soleOwnership': '由成员 A 全部拥有',
  'accounts.repairNotice': '该配置未使用三个固定账户。请重置后继续。',
  'accounts.repair': '重置为三个固定账户',
  'accounts.stocks': '股票',
  'accounts.bonds': '债券',
  'accounts.cash': '现金',
  'accounts.allocation': '资产配置',
  'field.bracket': '第 {index} 档{part}',
  'field.bracketLower': '起征点',
  'field.bracketRate': '税率',
  'field.bracketUnitRate': '小数',
  'field.bracketDesc': '{description}此框为第 {index} 档的{part}。',
  'field.bracketDescLower': '人民币收入下限',
  'field.bracketDescRate': '小数税率',
  'field.entryDesc': '{description}这是第 {index} 条，按显示顺序排列。',
  'field.required': '必填',
  'field.default': '默认值：{value}',
  'field.select': '请选择…',
  'field.annualBudget': '年度{ccy}（含医疗）',
  'field.medicalExpenses': '医疗费用',
  'field.ruleOf55': '55 岁规则豁免',
  'field.allowEarly': '允许提前支取',
  'seed.label': '生成随机模拟种子',
  'seed.title': '生成一个 0 到 4,294,967,295 之间的整数',
  'seed.random': '随机',
  'configField.about': '关于 {path}',

  'tutorial.dialog': '引导式设置',
  'tutorial.eyebrow': '引导式设置',
  'tutorial.question': '问题 {step}：{name}',
  'tutorial.reviewTitle': '检查您的初始方案',
  'tutorial.stepOf': '第 {step} 步，共 {total} 步',
  'tutorial.step.household': '家庭',
  'tutorial.step.people': '人员',
  'tutorial.step.spending': '支出',
  'tutorial.step.savings': '储蓄',
  'tutorial.step.retirement': '退休账户',
  'tutorial.step.horizon': '期限',
  'tutorial.step.done': '完成',
  'tutorial.q0household': '这个方案为谁制定？',
  'tutorial.q0domicile': '家庭在哪里退休？',
  'tutorial.domicile': '家庭定居地',
  'tutorial.domicileNote': '一个定居地覆盖全家，并决定所有人的中国税务处理。',
  'tutorial.q1':
    '每人回答一个出生年份和一个公民身份问题。公民适用居民税务待遇，其他人适用非居民待遇。',
  'tutorial.you': '您',
  'tutorial.personA': '成员 A',
  'tutorial.personB': '成员 B',
  'tutorial.birthYear': '出生年份',
  'tutorial.personBirth': '成员{id}出生年份',
  'tutorial.citizenship': '成员{id}公民身份',
  'tutorial.citizen': '美国公民',
  'tutorial.nonCitizen': '非美国公民',
  'tutorial.q2': '家庭典型一年的支出是多少？',
  'tutorial.annualSpending': '年度支出，{ccy}',
  'tutorial.annualSpendingAria': '年度支出 {ccy}',
  'tutorial.medicalSpending': '上述支出中含医疗，{ccy}（选填）',
  'tutorial.medicalSpendingAria': '医疗支出 {ccy}',
  'tutorial.shockCheck': '包含突发医疗支出',
  'tutorial.shockAmount': '单次突发金额，{ccy}',
  'tutorial.shockAmountAria': '单次突发金额 {ccy}',
  'tutorial.careCheck': '包含晚年护理',
  'tutorial.careStartAge': '护理起始年龄',
  'tutorial.careMonthly': '每月护理费用，{ccy}',
  'tutorial.careMonthlyAria': '每月护理费用 {ccy}',
  'tutorial.q3': '退休账户之外有多少储蓄？',
  'tutorial.investmentSavings': '非退休投资，美元',
  'tutorial.investmentSavingsAria': '非退休投资 美元',
  'tutorial.savingsNote':
    '我们将其放入非退休流动资产（60% 股票、30% 债券、10% 现金），最先支取。之后可在构建器中调整配比。',
  'tutorial.q4': '退休账户中有多少钱？',
  'tutorial.preTax': '税前退休账户（401k、传统 IRA），美元',
  'tutorial.preTaxAria': '税前退休账户 美元',
  'tutorial.afterTax': '税后退休账户（Roth），美元',
  'tutorial.afterTaxAria': '税后退休账户 美元',
  'tutorial.retirementNote':
    '两人时每个账户平均拥有；一人时由该人全部拥有。支取顺序为：先非退休资产，再税后，最后税前。',
  'tutorial.q5': '方案从哪一年开始，规划到多少岁？',
  'tutorial.startYear': '方案起始年份',
  'tutorial.throughAge': '规划至年龄',
  'tutorial.horizonNote':
    '所有人均存活至年轻者的终点年龄年份。市场按历史数据和标准默认假设回放。',
  'tutorial.reviewHousehold': '{household}，退休定居{domicile}。',
  'tutorial.reviewSpending': '每年支出 {amount} {ccy}{medical}。',
  'tutorial.reviewMedical': '，其中医疗 {amount} {ccy}',
  'tutorial.reviewShock': '突发医疗支出约 {amount} {ccy}。',
  'tutorial.reviewCare': '晚年护理自 {age} 岁起，每月 {amount} {ccy}。',
  'tutorial.reviewSavings':
    '非退休投资 {balance} 美元；退休账户税前 {pre} 美元、税后 {after} 美元。',
  'tutorial.reviewHorizon': '方案从 {start} 年运行至 {age} 岁，采用历史市场。',
  'tutorial.confirmExit': '退出引导式设置？目前为止的回答将被丢弃。',
  'tutorial.keepEditing': '继续编辑',
  'tutorial.discardExit': '丢弃并退出',
  'tutorial.back': '上一步',
  'tutorial.next': '下一步',
  'tutorial.finish': '开始模拟',
  'tutorial.exit': '退出引导式设置',
};

const zhUI2 = {
  'results.eyebrow': '已完成的运行',
  'results.title': '模拟结果一览',
  'results.paths': '{paths} 条路径 · {seconds} 秒',
  'results.fundingTitle': '全程资金充足率',
  'results.fundingHint': '无资金短缺、无资产提前耗尽',
  'results.terminalTitle': '终点净资产中位数',
  'results.terminalHint': '以今日美元计',
  'results.heirsTitle': '税后剩余资产中位数',
  'results.heirsHint': '扣除未缴清所得税后',
  'results.wealthTitle': '家庭财富变化',
  'results.wealthHint': '所有路径的中位数与 10%–90% 分位数',
  'results.unitsAria': '财富图单位',
  'results.unitRealCny': '今日人民币',
  'results.unitRealUsd': '今日美元',
  'results.unitNominalCny': '名义人民币',
  'results.wealthChart': '家庭财富分位数图',
  'results.wealthNote':
    '年末数值。路径在年轻人达到最高年龄的年份停止，或在净资产降至零或以下时停止。已停止路径在后续财富分位数中计为零；两人都依然存活。账户余额包含缴税前的退休资产。',
  'results.fundingChart': '全程资金状况',
  'results.fundingDenom': '该曲线以全部 {paths} 条路径为分母。',
  'results.fundingChartLabel': '全程资金概率图',
  'results.fxTitle': '汇率',
  'results.fxHint': '人民币/美元 · 无条件市场分位数',
  'results.fxChart': '汇率分位数图',
  'results.depletionTitle': '首次资金失败或资产耗尽',
  'results.depletionSome':
    '按首次资金失败或净资产提前耗尽时 A 的年龄统计的失败路径数。',
  'results.depletionNone': '没有路径出现资金失败或净资产提前耗尽。',
  'results.depletionChart': '首次耗尽年龄直方图',
  'results.taxTitle': '税收与现金流',
  'results.forcedSale': '强制房产出售',
  'results.lifetimeTax': '终身已缴所得税中位数',
  'results.terminalDue': '终点应缴所得税中位数',
  'results.taxNote':
    '每年计算并缴纳税款。两人都依然存活；不模拟遗产税、继承或死亡导致的成本重置。更广泛的税务与来源审计仍未完结。',
  'chart.median': '中位数',
  'chart.p10': '10%',
  'chart.p90': '90%',
  'chart.tooltipTitle': '{year} · A 年龄 {age}',
  'chart.funded': '无资金短缺',
  'chart.ageAxis': 'A 年龄',
  'chart.pathsAxis': '路径数',

  'ledger.eyebrow': '从已完成运行回放',
  'ledger.title': '逐年查看一条路径',
  'ledger.p10': '10% 路径',
  'ledger.pathId': '路径 ID',
  'ledger.pathIdAria': '回放路径 ID',
  'ledger.replaying': '正在回放路径 {path}…',
  'ledger.summary': '路径 {path} · {years} 个有效年度 · Float64',
  'ledger.allColumns': '全部 {count} 列',
  'ledger.lastYear': '最后一个有效年度',
  'ledger.downloadCsv': '下载账本 CSV',
  'ledger.downloadProv': '下载路径溯源',
  'ledger.stopMaxAge': '在 {year} 年年轻人达到最高年龄时停止。',
  'ledger.stopBefore': '因起始净资产为零或负，在第一年开始前即停止。',
  'ledger.stopDepleted': '在 {year} 年因净资产降至零或以下而停止。',
  'ledger.explainer':
    '期初余额先于本年现金流。流动美元包括美元金融账户（含退休账户）；期初净资产包括按开盘汇率计的房产净值。医疗包括基础预算、冲击和晚年护理。投资回报覆盖美元金融账户，按开盘年现金流后加权，税前且不计汇率变动。此处金额四舍五入到整数；下载保留完整精度。',
  'ledger.table': '年度账本',
  'ledger.prevRows': '上一页',
  'ledger.rowsOf': '第 {a}–{b} 行，共 {c} 行',
  'ledger.nextRows': '下一页',
  'ledger.yearTitle': '年份 {year} · 原始溯源',
  'ledger.yearOutside': '规划范围之外',
  'ledger.fxNote': '交易使用开盘汇率 {open}；收盘汇率 {close} 用于账本计价。',
  'ledger.noYear': '规划范围内未选择年份。',

  'compare.title': '对比已完成的运行',
  'compare.unpin': '取消固定基线',
  'compare.paired': '配对成功：索引隐变量抽样与参考数据版本相同。',
  'compare.unpaired': '未配对：种子、时间轴、数量或参考数据不同。',
  'compare.metric': '指标',
  'compare.baseline': '基线',
  'compare.current': '当前',
  'compare.configuration': '配置',
  'compare.fundingSuccess': '终身资金充足率',
  'compare.preTaxWealth': '税前终点财富',
  'compare.netHeirs': '留给继承人净额',
  'compare.lifetimeTax': '终身已缴所得税',
  'compare.terminalDue': '终点未缴所得税',
  'compare.medianSuffix': '{label} · 今日美元中位数',
  'compare.pathsSeed': '路径数 / 种子',
  'compare.deltasTitle': '每条配对路径的变化 · 今日人民币',
  'compare.deltasHint':
    '当前减基线，按路径 ID 配对。这些分位数描述单条路径的变化。',
  'compare.matched': '配对路径数',
  'compare.downloadPaired': '下载配对对比',
  'compare.computing': '正在计算配对路径差异…',
  'compare.retained':
    '基线使用其原始不可变配置。保留的基线缓冲：{mib} MiB。对比会临时复制两个 Float64 汇总缓冲。',
  'compare.downloadBaseline': '下载基线配置',
  'compare.showLedger': '显示基线账本',
  'compare.hideLedger': '隐藏基线账本',
  'compare.baselineLedger': '基线账本 · 种子 {seed}',
  'compare.empty':
    '固定一次已完成的运行，修改配置后再次运行。基线始终绑定其原始假设。',

  'assumptions.title': '了解数字背后的假设',
  'assumptions.marketTitle': '市场参考',
  'assumptions.marketP1':
    '{label}。美股、10 年期国债、短期国库券、美国通胀和房价使用 {count} 个联合日历年观测值。模拟路径按块重采样这些年份，不是按时间顺序的预测。',
  'assumptions.marketP2':
    '所有配置直接使用所选历史行，包括其中的年度亏损。模型不设 3% 规划回报。在波动为正时，算术年均值不是复合回报。股票和债券收益将总回报拆分为收益与价格变动，不增加额外回报。',
  'assumptions.marketP3':
    '债券序列代表 10 年期美国国债，而非广泛债券基金。房产回报仅计量价格变动；租金另行建模。中国 CPI、汇率和医疗增长仍为配置假设。',
  'assumptions.sourcesTitle': '历史数据来源与校准',
  'assumptions.fetched':
    '{date} 获取。美国通胀使用 FRED 12 月同比 CPI。中国年均通胀和年末美元/人民币提供校准参考；未来路径由配置参数控制。',
  'assumptions.rawSha': '· 原始 SHA-256：',
  'assumptions.stopTitle': '路径何时结束',
  'assumptions.stopBody':
    '路径在年轻人达到最高年龄的年份之后停止——一人家庭则为该人的最高年龄年份——或在净资产首次为非正的年份之后停止。净资产包括投资、人民币现金和扣除房贷后的房产净值；每年缴税，未缴清税款在停止点一次性扣除。非正的起始净资产在任何年度现金流之前即停止。账本仅包含模拟年份；已停止路径在后续财富分位数中计为零。',
  'assumptions.healthTitle': '健康与预算',
  'assumptions.healthBody':
    '年度预算在一次性扣除医疗费用后提供日常支出。医疗费用是两人的单一基础医疗金额；医疗组增加配置的冲击和晚年护理。护理始终为额外支出，从起始年龄持续到终点；冲击同样始终为额外支出。所有预算均采用初始处理。',
  'assumptions.medicalFactor':
    '在 CPI 均值不变时，年度医疗价格 × 年龄系数为 {factor}，以实际 {ccy} 计为 {real}。',
  'assumptions.ssTitle': '社会保障金',
  'assumptions.ssBody':
    '整个模拟不含社会保障金：从不发放福利，也没有社会保障金输入，因此结果从不包含社保收入。',
  'assumptions.cnyTitle': '人民币现金',
  'assumptions.cnyBody':
    '有意省略人民币现金利息，未来可能加回。存取改变其名义余额；通胀和汇率仍影响购买力和美元价值。',
  'assumptions.fxTitle': '汇率与购买力',
  'assumptions.fxBody':
    '汇率为人民币/美元。交易使用年初汇率及配置的点差。实际人民币回报 =（1 + 美元回报）× 年末汇率 / 年初汇率 /（1 + 中国通胀）。PPP 是连接相对通胀与汇率的假设。',
  'assumptions.taxTitle': '税务与支持的分类',
  'assumptions.taxBody':
    '模型支持公民/居民与非公民/非居民。保留的绿卡适用相应的居民分支，从不静默视为 NRA。税务保持简单：全长期净额结算加亏损结转，房产收益按长期资本利得税率，无州税，当年缴纳加当年 中国税收抵免。第 1231 条损失历史与回溯排序已移除。',
  'assumptions.registry': '来源登记 · {open} 项未完',
  'assumptions.snapshot': '当前科学快照',
  'assumptions.configHash': '当前配置哈希：',
  'marketData.label':
    'NYU/FRED 美国历史市场数据 · {start}–{end} · 中国通胀与汇率为模型假设',

  'market.title': '市场数据',
  'market.intro':
    '服务器按计划刷新公开的 NYU/FRED 数据。配置与财务输入保留在浏览器中。已完成的运行保留其原始数据。',
  'market.asOf': '市场数据截至 {date}。',
  'market.stockYield': '股票收益率',
  'market.stockNote': 'NYU · {date} · 股息 ÷ 年初指数',
  'market.bondYield': '债券收益率',
  'market.bondNote': 'FRED DGS10 · {date} · 10 年期国债票面收益代理',
  'market.spotFx': '即期人民币/美元',
  'market.fxNote': 'FRED DEXCHUS · {date}',
  'market.yieldNote':
    '这些收益将总投资回报拆分为收益与价格变动，不增加额外回报。票面收益代理可能与您持仓的实际票息不同。当前来源数值可在"配置"中编辑。',
  'market.sourcesTitle': '来源日期与公开数据包',
  'market.fetched': '{date} 获取。数据包 SHA-256：',
  'market.retrieved': '· 获取于 {date} · 原始 SHA-256',
  'market.cpi':
    '美国最新 CPI：{us}（{usDate}，月度同比）。中国最新 CPI：{cn}（{cnDate}，年均）。未来中国通胀与汇率波动仍遵循您的配置假设。',
  'market.applied':
    '已应用 {years} 个美国历史年份、两类收益率与即期汇率。中国/汇率校准数据已更新；您的风险参数与预算保留。',
  'market.refreshFailed': '公开市场刷新失败。',
  'market.fewerYears': '获取来源的完整年份少于当前数据。现有数据予以保留。',
  'market.errorSuffix': '现有数据与配置予以保留。',
};

const zhLabels: Record<string, string> = {
  age_growth: '年龄增长',
  allow_early_trad: '允许提前支取',
  amount: '金额',
  annual: '年度总额',
  balance: '余额',
  birth_year: '出生年份',
  block_mean_years: '分块平均年数',
  cost_basis: '成本基础',
  currency: '货币',
  depreciation_taken: '已提折旧',
  domicile: '定居地',
  enabled: '启用',
  fx_adjust_speed: '汇率调整速度',
  fx_drift: '汇率漂移',
  fx_fair_value: '汇率公允值',
  fx_mode: '汇率模式',
  fx_quota_usd_per_person: '人均换汇额度（美元）',
  fx_real_trend: '汇率实际趋势',
  fx_sigma: '汇率波动率',
  fx_spot: '即期汇率',
  fx_spread: '换汇点差',
  hoa_monthly: '物业费（月）',
  home_cpi_mean: '本国 CPI 均值',
  home_cpi_phi: '本国 CPI 持续性',
  home_cpi_sigma: '本国 CPI 波动率',
  home_cpi_start: '本国 CPI 初值',
  id: '编号',
  included_health: '医疗费用',
  income_yield_us_bonds: '美债收益率',
  income_yield_us_stocks: '美股收益率',
  insurance_annual: '保险（年）',
  land_share: '土地占比',
  last_resort_property_sale: '兜底房产出售',
  maintenance_annual: '维护费（年）',
  max_age: '最高年龄',
  medical_excess_inflation: '医疗超额通胀',
  monthly: '月费用',
  mortgage_balance: '房贷余额',
  mortgage_rate: '房贷利率',
  mortgage_years_left: '房贷剩余年限',
  n_paths: '路径数',
  name: '名称',
  proceeds_account: '收款账户',
  property_tax_annual: '房产税（年）',
  real_growth: '实际增长',
  rent_monthly: '租金（月）',
  rent_real_growth: '租金实际增长',
  rule_of_55: '55 岁规则豁免',
  sample_end: '抽样结束年',
  sample_start: '抽样起始年',
  schema_version: '格式版本',
  seed: '随机种子',
  sell_liquid_years: '出售流动性年限',
  sell_year: '出售年份',
  selling_cost: '出售费用率',
  sex: '性别',
  share_A: 'A 占比',
  shock_enabled: '启用冲击',
  shock_median: '冲击金额',
  shock_prob_at_60: '60 岁冲击概率',
  shock_prob_doubling_years: '冲击概率翻倍年数',
  start_age: '起始年龄',
  start_year: '起始年份',
  strategy: '策略',
  type: '类型',
  us_bonds: '美债',
  us_citizen: '美国公民',
  us_income_tax_status: '美国所得税身份',
  us_stocks: '美股',
  usd_cash: '美元现金',
  value: '价值',
  year: '年份',
  accounts: '账户',
  allocation: '资产配置',
  median: '中位数',
  one_time: '一次性支出',
  properties: '房产',
  worst: '最差',
  age_A: 'A 年龄',
  age_B: 'B 年龄',
  alive_A: 'A 存活',
  alive_B: 'B 存活',
  fx: '汇率',
  home_index: '本国价格指数',
  usd_index: '美元价格指数',
  spend_plan_cny: '计划支出（人民币）',
  spend_cny: '日常支出（人民币）',
  medical_cny: '医疗（人民币）',
  medical_base_cny: '基础医疗（人民币）',
  medical_shock_cny: '医疗冲击（人民币）',
  one_time_cny: '一次性支出（人民币）',
  included_consumption_cny: '计入消费（人民币）',
  additional_consumption_cny: '额外消费（人民币）',
  rent_cash_usd: '租金现金（美元）',
  rmd_usd: '最低提款（美元）',
  portfolio_return: '美元组合回报',
  withdraw_usd: '支取（美元）',
  withdraw_cny: '支取（人民币）',
  convert_usd: '换汇（美元）',
  tax_us_A: '美国所得税 A',
  tax_us_B: '美国所得税 B',
  tax_cn_A: '中国所得税 A',
  tax_cn_B: '中国所得税 B',
  liquid_usd: '期末流动美元',
  cny_cash_cny: '人民币现金（人民币）',
  property_equity_usd: '房产净值（美元）',
  net_worth_cny: '净资产（人民币）',
  net_worth_cny_real: '净资产实际值（人民币）',
  liquid_cny_real: '流动资产实际值（人民币）',
  net_worth_usd_real: '净资产实际值（美元）',
  shortfall_cny: '资金缺口（人民币）',
  forced_sale: '强制出售',
  sale_failed: '出售失败',
  fx_quota_flag: '换汇额度标记',
  starting_liquid_usd: '期初流动美元',
  starting_net_worth_cny: '期初净资产（人民币）',
  spend_excluding_medical_cny: '支出（人民币，不含医疗）',
  medical_total_cny: '医疗合计（人民币）',
  annual_investment_return: '年度综合投资回报',
};

const zhEnums: Record<string, string> = {
  CNY: 'CNY',
  USD: 'USD',
  US: '美国',
  China: '中国',
  F: '女',
  M: '男',
  brokerage: '证券账户',
  pre_tax: '税前退休',
  after_tax: '税后退休',
  hold: '持有',
  sell_year: '按年出售',
  sell_when_liquid_below: '低流动性出售',
  resident: '居民',
  nonresident: '非居民',
  unresolved: '未确定',
  drift: '漂移模式',
  ppp: '购买力平价',
};

const zhUnits: Record<string, string> = {
  'CNY/USD': '人民币/美元',
  'USD, current nominal': '美元，当前名义',
  'USD current nominal': '美元，当前名义',
  'USD/month today': '美元/月，今日价格',
  'USD/person/year': '美元/人/年',
  'USD/year today': '美元/年，今日价格',
  'access exception': '支取例外',
  'access policy': '支取政策',
  'account reference': '账户引用',
  age: '年龄',
  'annual CPI SD': '年 CPI 标准差',
  'annual decimal rate': '年率（小数）',
  'annual log change': '年对数变动',
  'annual log-FX SD': '年对数汇率标准差',
  'calendar year': '日历年',
  classification: '分类',
  currency: '货币',
  'currency today': '货币，今日价格',
  descriptive: '描述性',
  dimensionless: '无量纲',
  fraction: '比例',
  'household CNY/USD today': '家庭人民币/美元，今日价格',
  'household CNY/USD/month today': '家庭人民币/美元/月，今日价格',
  'household CNY/USD/year today': '家庭人民币/美元/年，今日价格',
  label: '标签',
  'label/reference/provenance': '标签/引用/溯源',
  mode: '模式',
  paths: '路径数',
  'persistence factor': '持续性系数',
  'sale policy': '出售政策',
  'sale strategy': '出售策略',
  setting: '设置',
  uint32: '32 位无符号整数',
  version: '版本',
  wrapper: '容器',
  years: '年',
};

const REQUIRED = '必填；留空则保持缺省并阻止运行';
const OPTIONAL = '选填；缺省则使用声明的默认值';
const STRICT = '键名须为已知键；数字须有限；整数须为安全整数；见规范 §9.2。';

const zhFields: Record<string, FieldText> = {
  schema_version: {
    description:
      '配置文件格式的版本。请保持为 1，以便应用读取文件。这不是财务假设。',
    omission: REQUIRED,
    constraints: '必须为 1；缺失则需旧版迁移预览。',
  },
  'simulation.start_year': {
    description:
      '退休的第一个日历年。年龄按该年减去每人出生年份计算。起始余额与今日支出金额适用于该年年初。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'simulation.n_paths': {
    description:
      '模拟多少种可能的退休未来。路径越多，概率与分位数估计越稳定，但耗时与内存也越多。每条路径使用相同的财务规则，但市场与医疗结果不同。',
    omission: OPTIONAL,
    constraints: '1 至 100000（含）；精确值；内存预检可能拒绝。',
  },
  'simulation.seed': {
    description:
      '控制随机抽样的数字。相同的种子、配置与参考数据可复现相同路径。使用 0 到 4,294,967,295 的整数；旁边按钮可随机选择。',
    omission: OPTIONAL,
    constraints: '0 至 4294967295（含）。',
  },
  'simulation.max_age': {
    description:
      '模拟包含年轻人达到该年龄的年份。假设两人都一直存活。若某路径净资产（含扣除房贷后的房产净值）降至零或负，则提前结束。',
    omission: OPTIONAL,
    constraints:
      '不低于年轻人起始年龄（一人则为该人起始年龄）；所有人存活至该最高年龄年份；内存预检限制期限。',
  },
  'market.sample_start': {
    description:
      '可抽样的最早历史年份，用于美国投资回报、美国通胀和美国房价。各序列使用相同的年份以保留历史相关性。请选择至少包含 10 个完整年份的窗口。',
    omission: OPTIONAL,
    constraints: '须在有效历史内；窗口不小于 10 年。',
  },
  'market.sample_end': {
    description:
      '可抽样的最晚历史年份。与抽样起始年共同决定历史结果池；不决定退休终点年份，也不预测未来回报。',
    omission: OPTIONAL,
    constraints: '须在有效历史内；不小于起始年 +9。',
  },
  'market.block_mean_years': {
    description:
      '跳转到另一个历史起点之前，连续保留历史年份的平均长度。分块越长，越能保留繁荣与危机时期的序列特征。这是平均值，而非固定块长。',
    omission: OPTIONAL,
    constraints: '不小于 1。',
  },
  'market.home_cpi_mean': {
    description:
      '本国经济长期年通胀假设。本国定居家庭的支出跟随相应的本国价格指数。以小数输入：0.04 表示年 4%。定居美国时忽略，改用历史回放通胀。',
    omission: OPTIONAL,
    constraints: STRICT,
  },
  'market.home_cpi_phi': {
    description:
      '上一年本国通胀相对长期均值延续到下一年的程度。零表示无延续；正值使高或低通胀更可能持续。这是持续性系数，不是通胀率。',
    omission: OPTIONAL,
    constraints: 'v1 规范利率范围下为 -0.5 至 0.5。',
  },
  'market.home_cpi_sigma': {
    description:
      '本国通胀年度随机变动的幅度。零表示无随机变动；0.018 表示 1.8 个百分点的标准差。长期均值与持续性仍然有效。',
    omission: OPTIONAL,
    constraints: '0 至 0.5；生成的 CPI 须大于 -1。',
  },
  'market.home_cpi_start': {
    description:
      '第一个模拟年份之前一刻的本国通胀率，通过持续性设置影响第一年通胀计算。以小数输入：0.04 表示 4%。',
    omission: OPTIONAL,
    constraints: STRICT,
  },
  'market.fx_spot': {
    description:
      '起始汇率，人民币/美元。例如 6.69 表示扣除换汇成本前 1 美元兑 6.69 元。数字越小，美元计价的人民币支出越贵。刷新市场数据会更新为最新观测值。',
    omission: OPTIONAL,
    constraints: '大于 0。',
  },
  'market.fx_fair_value': {
    description:
      '购买力平价（PPP）模式使用的起始参考汇率。该参考随中美通胀差及实际趋势设置变动，是建模假设，可能与当前即期汇率不同。漂移模式不用它推动汇率。',
    omission: OPTIONAL,
    constraints: '大于 0。',
  },
  'market.fx_adjust_speed': {
    description:
      'PPP 模式下汇率向通胀调整后参考汇率靠拢的速度。零表示无此拉力；数值越大调整越快。漂移模式忽略此设置。',
    omission: OPTIONAL,
    constraints: '0 至 1。',
  },
  'market.fx_sigma': {
    description:
      '年度汇率随机变动的幅度，按对数尺度计量。零表示无汇率噪声。0.042 约为小幅变动下 4.2% 的年波动率，不是保证的年度变动。',
    omission: OPTIONAL,
    constraints: '0 至 0.5。',
  },
  'market.fx_real_trend': {
    description:
      'PPP 参考汇率在中美通胀差之外的年度趋势。正值推高人民币/美元（人民币走弱），负值则走强。这是对数变动：0.01 约为年 1%。漂移模式忽略。',
    omission: OPTIONAL,
    constraints: STRICT,
  },
  'market.fx_mode': {
    description:
      'PPP 使汇率向跟随中美通胀差的参考汇率靠拢；漂移则采用所选的年度漂移。两种模式都叠加 FX 波动率指定的汇率噪声。',
    omission: OPTIONAL,
    constraints: STRICT,
  },
  'market.fx_drift': {
    description:
      '仅漂移模式使用的年度人民币/美元变动（噪声之前）。正值使人民币走弱，负值走强。这是对数变动：0.01 约为年增长 1.005%。PPP 模式忽略此设置。',
    omission: OPTIONAL,
    constraints: '-0.2 至 0.2；为年对数变动，非简单百分比。',
  },
  'market.fx_spread': {
    description:
      '美元与人民币双向兑换成本。以小数输入：0.003 表示 0.3%。成本越高，同样人民币支出所需美元越多，人民币换回美元所得越少。',
    omission: OPTIONAL,
    constraints: '0 ≤ 点差 <1；换算分母须为正。',
  },
  'market.fx_quota_usd_per_person': {
    description:
      '每人每年美元换人民币的额度，用于标记可能的额度问题。两人家庭按两倍比较。超额时在账本中标记；不阻止换汇，也不模拟银行审批。该金额不随通胀调整。',
    omission: OPTIONAL,
    constraints: '非负名义美元；不指数化。',
  },
  'market.medical_excess_inflation': {
    description:
      '在中国通胀之上额外增加的年度医疗价格通胀。例如中国通胀 4% 加此处 0.02，则当年医疗价格增长 6%。影响基础医疗预算、医疗冲击和晚年护理；年龄相关增长是另一设置。',
    omission: OPTIONAL,
    constraints: STRICT,
  },
  'market.income_yield_us_stocks': {
    description:
      '证券股票持仓中视为再投资股息的年份额，用于税务计算。其余抽样总回报为价格变动；该收益不增加总回报。刷新使用最新完整 NYU 年份股息除以年初标普 500 点位。以小数输入：0.013 表示 1.3%。',
    omission: OPTIONAL,
    constraints:
      '0 至 1；NYU 2025 股息 / 年初标普点位 = 0.01335854176478289；拆分总回报，不增加回报。',
  },
  'market.income_yield_us_bonds': {
    description:
      '证券债券持仓中视为再投资票息的年份额，用于税务计算。该收益已是抽样总回报的一部分，不重复计入。刷新使用最新 FRED 10 年期国债票面收益作代理，可能与您持仓实际票息不同。以小数输入：0.051 表示 5.1%。',
    omission: OPTIONAL,
    constraints:
      '0 至 1；FRED DGS10 2026-10-15 = 0.051；国债收益代理，非组合票息或额外回报。',
  },
  'people.domicile': {
    description:
      '家庭所得税定居地：美国或中国。一国覆盖一人或两人。中国定居使境外投资与养老金收入从第一年起纳入中国税务；美国定居按配置的六年重置假设决定中国税务起始。',
    omission: REQUIRED,
    constraints: '全家同一国；决定每位成员的中国税务归属。',
  },
  'people.A.birth_year': {
    description:
      '成员 A 的出生年份。年龄按日历年而非确切生日计算，决定退休账户支取、医疗冲击概率、福利时点，以及由谁设定最高年龄终点。',
    omission: REQUIRED,
    constraints: '起始年龄 18 至 100；实际为 1986 年化占位。',
  },
  'people.A.sex': {
    description:
      '成员 A 的描述性性别。所有人存活至同一规划终点，因此该选择不改变寿命、医疗概率或财务计算。',
    omission: '选填描述值；不影响计算',
    constraints: 'M 为男，F 为女；全家寿命采用同一固定期限。',
  },
  'people.A.us_citizen': {
    description:
      '成员 A 是否为美国公民。公民身份与所选美国所得税身份交叉核对：公民须用居民待遇；非公民须明确其税务居民身份。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'people.A.us_income_tax_status': {
    description:
      '成员 A 的美国所得税待遇。居民适用模型的美国居民所得与投资税规则；非居民使用支持的非居民类别。未确定则阻止运行。仅凭公民身份不能确定非公民的所得税居民身份。',
    omission: REQUIRED,
    constraints: '支持公民/居民或非公民/非居民；居民外籍人士不得用 NRA。',
  },
  'people.B.birth_year': {
    description:
      '成员 B 的出生年份。年龄按日历年而非确切生日计算，决定退休账户支取、医疗冲击概率、福利时点，以及由谁设定最高年龄终点。',
    omission: REQUIRED,
    constraints: '起始年龄 18 至 100；实际为 1986 年化占位。',
  },
  'people.B.sex': {
    description:
      '成员 B 的描述性性别。所有人存活至同一规划终点，因此该选择不改变寿命、医疗概率或财务计算。',
    omission: '选填描述值；不影响计算',
    constraints: 'M 为男，F 为女；全家寿命采用同一固定期限。',
  },
  'people.B.us_citizen': {
    description:
      '成员 B 是否为美国公民。公民身份与所选美国所得税身份交叉核对：公民须用居民待遇；非公民须明确其税务居民身份。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'people.B.us_income_tax_status': {
    description:
      '成员 B 的美国所得税待遇。居民适用模型的美国居民所得与投资税规则；非居民使用支持的非居民类别。未确定则阻止运行。仅凭公民身份不能确定非公民的所得税居民身份。',
    omission: REQUIRED,
    constraints: '支持公民/居民或非公民/非居民；居民外籍人士不得用 NRA。',
  },
  'medical.age_growth': {
    description:
      '除医疗价格通胀外，因年龄增长的基础医疗预算年增长率。以小数输入：0.04 表示每年再增 4%。影响经常性医疗基数；冲击有自己的年龄概率，护理有自己的增长设置。',
    omission: OPTIONAL,
    constraints: '金额非负；增长系数有效。',
  },
  'medical.shock_enabled': {
    description:
      '允许每人发生随机大额医疗支出，作为经常性医疗基数之外的部分。关闭则移除冲击，保留基础医疗预算和已启用的晚年护理。',
    omission: OPTIONAL,
    constraints: '金额非负；增长系数有效。',
  },
  'medical.shock_prob_at_60': {
    description:
      '每人 60 岁时年度医疗冲击概率。以小数输入：0.02 表示每人每年 2%。翻倍年数设置调整年轻与年长概率，最高 100%。',
    omission: OPTIONAL,
    constraints: '0 至 1。',
  },
  'medical.shock_prob_doubling_years': {
    description:
      '年龄每增加多少年，个人年度医疗冲击概率翻倍。例如 8 表示 68 岁概率为 60 岁的两倍。年轻时概率更低，上限 100%。',
    omission: OPTIONAL,
    constraints: '大于 0。',
  },
  'medical.shock_median': {
    description:
      '每次医疗冲击金额，以今日家庭货币计，未计医疗价格通胀。每次冲击均为该通胀调整后金额。',
    omission: OPTIONAL,
    constraints: '金额非负；增长系数有效。',
  },
  'medical.late_life_care.enabled': {
    description:
      '最早出生者达到护理起始年龄后，计入配置的月护理费用。护理始终为额外医疗支出，持续到最后一个模拟年份，独立于已含医疗基数与随机冲击。',
    omission: OPTIONAL,
    constraints:
      '始终为额外医疗支出；从所选年龄开始持续到规划终点；月费 ≥0；实际增长 -0.5 至 0.5；跟随医疗价格指数。',
  },
  'medical.late_life_care.start_age': {
    description:
      '家庭月护理费用开始的年龄（含当年），按最早出生者计量。护理持续到模拟最后一年，无单独结束年龄。',
    omission: OPTIONAL,
    constraints:
      '始终为额外医疗支出；从所选年龄开始持续到规划终点；月费 ≥0；实际增长 -0.5 至 0.5；跟随医疗价格指数。',
  },
  'medical.late_life_care.monthly': {
    description:
      '家庭月护理费用，以今日人民币计。模拟在每个有效年度收取 12 个月，并按医疗价格通胀与护理实际增长调整。始终为基础年度预算之外的额外支出。',
    omission: OPTIONAL,
    constraints:
      '始终为额外医疗支出；从所选年龄开始持续到规划终点；月费 ≥0；实际增长 -0.5 至 0.5；跟随医疗价格指数。',
  },
  'medical.late_life_care.real_growth': {
    description:
      '护理金额在医疗价格通胀之外的年增长率。以小数输入：0.01 表示每年再增 1%。增长从模拟起点计量（含护理开始前的年份），因此录入金额仍为今日价格。',
    omission: OPTIONAL,
    constraints:
      '始终为额外医疗支出；从所选年龄开始持续到规划终点；月费 ≥0；实际增长 -0.5 至 0.5；跟随医疗价格指数。',
  },
  'budget.annual': {
    description:
      '家庭年度基础预算总额，以今日人民币计，含下方医疗金额。日常支出为该金额减去医疗费用部分。医疗只计一次。医疗冲击、护理、一次性支出与所得税可能需要额外资金。',
    omission: OPTIONAL,
    constraints:
      '≥0；家庭货币年度基础预算总额。日常支出为年度额减医疗费用，按定居地价格指数调整。',
  },
  'budget.included_health': {
    description:
      '两人合计年度基础医疗预算，以今日人民币计。已包含在年度预算中，不再重复计入。该部分随医疗价格通胀与年龄增长；预算其余部分随中国通胀增长。',
    omission: OPTIONAL,
    constraints:
      '≥0；家庭单一年度基础医疗预算；计入年度额一次，在冲击/护理之前。',
  },
  'one_time[].name': {
    description: '该一次性支出的标签，如搬迁或购车。标签便于识别，不影响计算。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'one_time[].year': {
    description: '支付该费用日历年，仅支付一次。模拟路径到达该年才支付。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'one_time[].amount': {
    description:
      '一次性支出金额，以今日价格计，使用此处所选货币。人民币支出随中国通胀、美元支出随美国通胀增长到支付年份。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'one_time[].currency': {
    description:
      '录入金额的货币。人民币支出跟随中国通胀；美元支出跟随美国通胀，并按当年汇率折人民币报告。新建费用默认为定居地货币。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'accounts[].name': {
    description:
      '该账户的固定标识：非退休流动资产用 brokerage，税后退休储蓄用 after_tax，税前退休储蓄用 pre_tax。支取顺序与房产出售去向使用该标识。盈余现金恒入非退休流动资产。',
    omission: REQUIRED,
    constraints:
      '固定标识：brokerage、after_tax 或 pre_tax；三个账户缺一不可且按此顺序。',
  },
  'accounts[].type': {
    description:
      '固定的账户类型，与标识一致。证券账户为美元账户，对投资收益与已实现利得征税。税前为税前退休账户，支取征税并有支取规则。税后支取免美国税，但所选中国养老金待遇仍适用。两个退休账户都有年龄限制。',
    omission: REQUIRED,
    constraints: '按位置固定：先证券，再税前，再税后；与标识一致。',
  },
  'accounts[].balance': {
    description:
      '账户起始市值，美元。是未来缴税前的全额余额，按所选资产配置分配。证券账户的税务成本基础恒等于该余额。两人时余额平均拥有；一人时由该人全部拥有。',
    omission: REQUIRED,
    constraints: STRICT,
  },
  'accounts[].allocation.us_stocks': {
    description:
      '该证券或退休账户投资美股的比例。60% 填 0.60，不要填 60。三个配置比例之和须为 1。决定起始余额、新存入与年度再平衡目标。各资产收益处理固定：股票付合格股息，债券付票息且出售零利得，现金赚货币市场利息。',
    omission: '单个资产键缺省为 0；三个账户均须配资产',
    constraints: '≥0；为三键子集；和为 1（±1e-6）。',
  },
  'accounts[].allocation.us_bonds': {
    description:
      '该证券或退休账户投资美债的比例。60% 填 0.60，不要填 60。三个配置比例之和须为 1。决定起始余额、新存入与年度再平衡目标。各资产收益处理固定：股票付合格股息，债券付票息且出售零利得，现金赚货币市场利息。',
    omission: '单个资产键缺省为 0；三个账户均须配资产',
    constraints: '≥0；为三键子集；和为 1（±1e-6）。',
  },
  'accounts[].allocation.usd_cash': {
    description:
      '该证券或退休账户持有美元现金的比例。60% 填 0.60，不要填 60。三个配置比例之和须为 1。决定起始余额、新存入与年度再平衡目标。各资产收益处理固定：股票付合格股息，债券付票息且出售零利得，现金赚货币市场利息。',
    omission: '单个资产键缺省为 0；三个账户均须配资产',
    constraints: '≥0；为三键子集；和为 1（±1e-6）。',
  },
  'accounts[].rule_of_55': {
    description:
      '声明该税前退休账户符合模型的 55 岁规则豁免。允许 55 岁起支取而无提前支取罚款，普通支取所得税照常。这不是适用于所有 IRA 或前雇主账户的通用豁免。',
    omission: '仅税前；其他类型禁用',
    constraints: '声明的合格条件；请核实豁免与罚款处理。',
  },
  'accounts[].allow_early_trad': {
    description:
      '允许在模型正常支取年龄 60 岁之前从该税前退休账户支取。此类支取可能产生普通所得税与提前支取罚款，除非适用配置的 55 岁规则豁免。不解锁税后提前支取。',
    omission: '仅税前；其他类型禁用',
    constraints: '声明的提前支取；请核实豁免与罚款处理。',
  },
  'withdrawals.last_resort_property_sale': {
    description:
      '当账户支取无法满足现金需求时，允许模型尝试出售房产，包括标记为持有的房产。关闭则不会仅为弥补缺口而出售房产。若过户成本、房贷与预扣税需要无法负担的额外现金，出售可能失败。',
    omission: REQUIRED,
    constraints: '家庭不出售 = 否，即使房产策略为持有。',
  },
  'properties[].id': {
    description:
      '该美国房产的唯一持久标识。所有业主均用公民税务待遇；无外国业主预扣。',
    omission: REQUIRED,
    constraints: 'ID 唯一持久非空；仅限美国不动产，所有业主公民待遇。',
  },
  'properties[].share_A': {
    description:
      '成员 A 的房产所有权份额，其余归 B。均分填 0.5。在两位纳税人之间拆分租金、基础与利得。',
    omission: OPTIONAL,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].value': {
    description:
      '房产起始市值（美元），未扣房贷。房产净值为市值减未偿贷款。持有房产跟随抽样的美国房价回报，无溢价或个体价格噪声。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].cost_basis': {
    description:
      '房产原始美元税务基础总额，未扣已提折旧。按所有权份额拆分。与折旧和出售费用共同决定出售的美国应税利得或亏损。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].land_share': {
    description:
      '房产税务基础中归属土地的比例，土地不折旧。20% 土地、80% 房屋填 0.20。只有房屋部分适用模型的年度出租折旧。',
    omission: OPTIONAL,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].depreciation_taken': {
    description:
      '模拟开始前已申报的折旧总额（美元）。调减美国税务调整基础与房屋剩余折旧。出售时可能使部分利得落入特殊的折旧相关税务类别。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].mortgage_balance': {
    description:
      '起始未偿房贷本金（美元）。调减房产净值。房贷还款减少可用租金现金，出售时须偿还剩余贷款。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].mortgage_rate': {
    description:
      '固定年房贷利率。以小数输入：0.04 表示 4%。与贷款余额和剩余年限共同计算年供、利息与本金偿还。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].mortgage_years_left': {
    description:
      '房贷剩余期限（年）。与起始余额和利率共同决定年度等额还款。正房贷余额须配正剩余期限。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].rent_monthly': {
    description:
      '月租金总额（今日美元），费用前，假设满租。模型将其年化，应用美国通胀与租金实际增长，再扣运营成本与房贷还款。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].maintenance_annual': {
    description:
      '年度维护成本（今日美元），管理与维护合一。随美国通胀增长，从租金现金流与租金收入计算中扣除。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].property_tax_annual': {
    description:
      '起始年度房产税账单（美元）。未来账单跟随建模房价变动。是运营费用，独立于租金所得税或出售税。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].insurance_annual': {
    description:
      '年度房产保险（今日美元）。随美国通胀增长，作为出租运营费用扣除。是财产保险，独立于家庭医疗预算。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].hoa_monthly': {
    description:
      '月业主协会费（今日美元）。模型每年收取 12 个月，随美国通胀上调，从租金现金流中扣除。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].rent_real_growth': {
    description:
      '美国通胀之外的年度租金增长。仅跟随通胀填 0，每年再增 1% 填 0.01。负值表示租金跑输通胀。',
    omission: OPTIONAL,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].selling_cost': {
    description:
      '出售费用，按房产毛售价比例。6% 填 0.06。费用调减过户现金与计算出售利得的净价；房贷偿还另计。',
    omission: OPTIONAL,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].strategy': {
    description:
      '持有则保留房产，除非启用兜底出售且需要现金。按年出售在指定日历年尝试出售。低流动性出售在流动资产低于配置的年度支出倍数时尝试一次。路径提前结束则无法完成后续出售。',
    omission: REQUIRED,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].sell_year': {
    description:
      '策略为按年出售时，首次尝试出售该房产的日历年。若无法成交，持有期间可在后续年份再试。其他策略忽略此设置；已结束的路径无法出售。',
    omission: OPTIONAL,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].sell_liquid_years': {
    description:
      '低流动性出售的流动资产阈值，以中国通胀调整后的基础年度预算倍数表示。填 3 表示低于当年基础预算三倍时触发。额外医疗增长、护理与一次性支出不提高该阈值。',
    omission: OPTIONAL,
    constraints: '见规范 §5.8/9.2；金额 ≥0，系数有效，比例在 [0,1]。',
  },
  'properties[].proceeds_account': {
    description:
      '接收房产成功出售现金的账户（扣除过户成本与房贷偿还后），默认为非退休流动资产。后续税款结算可能需要进一步支取。',
    omission: OPTIONAL,
    constraints: '须为已存在的固定账户名。',
  },
};

const zhUI = { ...zhUI1, ...zhUI2 } satisfies Record<MessageKey, string>;

export const zh: Localization = {
  code: 'zh',
  intlLocale: 'zh-CN',
  nativeName: '中文',
  ui: zhUI,
  fields: zhFields,
  labels: zhLabels,
  enums: zhEnums,
  units: zhUnits,
};
