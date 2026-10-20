# 学生端首页与查重报告页重构 — 任务清单

## [x] T1 首页 Dashboard.vue 模板重写

- 文件：`src/views/student/Dashboard.vue`（模板 1–438 行整体替换）
- 内容：
  - `PageHeader title="工作台"` + 动态 description（欢迎语 + `currentDate`）+ 原有「提交新论文」「导出数据」动作。
  - 4 个 KPI 卡（`stats.submittedCount/pendingCount/approvedCount/revisionCount`）。
  - 两列主区：左列 = 当前论文主卡 → 待办事项 → 处理进度 → 图表区（雷达/趋势/专业对比）；右列 = 时间节点 → 指导老师 → 通知。
  - 保留所有既有空态、`v-loading`、按钮方法与图表 `:ref` 绑定（`radarChart.chartRef` 等）。
- 验收：模板中不再出现「重要时间节点」独占整行的大区块；图表位于当前论文与待办之后。

## [x] T2 首页脚本接入待办

- 文件：`src/views/student/Dashboard.vue`（脚本 439–1293 行，仅增量修改）
- 内容：
  - `import { getTodoList } from '@/api/student'`
  - `todos = ref([])`、`loading.todos = false`
  - `loadTodos()`：归一数组、排序（未完成优先，按 `dueDate` 升序，空值排后）、异常静默
  - `onMounted` 中并行加入 `loadTodos()`
  - 计算属性 `sortedTodos`（`completed` 变化后仍有序），空值时模板显示空态
- 验收：不改动图表渲染、日历导出、`refreshData` 等既有逻辑。

## [x] T3 首页样式替换

- 文件：`src/views/student/Dashboard.vue`（样式 1295–2425 行整段替换）
- 内容：全部改用 `--apple-*` 令牌；新增 `.dashboard-page / .kpi-grid / .kpi-card / .dashboard-main / .dash-card / .todo-list / .deadline-list / .charts-*`；断点 1200px 双列→单列、768px KPI 4→2；图表容器最小高度 280/300px。
- 验收：无硬编码色值（中性 rgba 描边/阴影除外），无遗留旧类样式。

## [x] T4 报告页数据层重写

- 文件：`src/views/student/PlagiarismReport.vue`（脚本 407–795 行）
- 内容：
  - 新状态：`baseInfo`、`rateStat`、`paragraphs`、`similarSources`、`sentenceMetrics`、`historyList`
  - `loadReport()`：`getPaperReport(reportId)` + `getSimpleCheckReport(paperId)` 并行；随后 `getSentenceDetail(baseInfo.taskId)` 串行且失败静默
  - 计算属性 `totalSimilarity`（`sentenceMetrics.checkRate ?? rateStat.repeatRate`）、`maxPerSource`、`citationRate`、`sortedSources`（按 `maxSimilarity` 降序）
  - `goSentenceDetail()`：`router.push({ name: 'SentenceDetail', params: { taskId } })`
  - `selectHistory(item)`：切换 `reportId` 重新加载
  - `handleExport`：仅 `pdf` / `html`
  - 删除启发式模块相关状态与函数
- 验收：页面所有展示字段均来自上述真实 DTO。

## [x] T5 报告页模板重写

- 文件：`src/views/student/PlagiarismReport.vue`（模板 1–405 行）
- 内容：页头（返回/PDF/HTML）→ 论文信息条 → 三指标卡 → Tabs（概览/相似来源/历史记录）；概览含指标摘要 + 分段标红正文 + 「查看句级明细」；删除关键词/建议/分布图/章节分析/检测引擎。
- 验收：无「导出 Word」入口；`v-html` 仅用于 `paragraph.content`。

## [x] T6 报告页样式替换

- 文件：`src/views/student/PlagiarismReport.vue`（样式 796–1624 行整段替换）
- 内容：令牌化；信息条/指标行/Tabs 三段式；概览正文 `max-height: 640px; overflow-y: auto;`；指标 display 字体 34px + `tabular-nums`；<900px 指标卡堆叠。
- 验收：无旧类样式残留；窄屏无横向滚动。

## [x] T7 构建验证

- 命令：`npm.cmd run build`（cwd `d:\check-repeat-system\check-repeat-frontend`）
- 验收：构建成功；若失败，修复到通过并如实汇报。

## T8 提交（仅在用户明确指示后）

- 前端单次提交，中文简短描述本次两页重构。
