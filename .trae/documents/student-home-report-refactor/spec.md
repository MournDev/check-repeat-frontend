# 学生端首页与查重报告页重构 — 规格说明

## 0. 背景与范围

学生端两个页面的信息架构落后于现有后端契约，需要在不改动后端、不删减既有功能的前提下完成重排与视觉统一。

| 页面 | 文件 | 重构类型 |
| --- | --- | --- |
| 学生首页 | `src/views/student/Dashboard.vue` | 信息架构重排 + 视觉统一（脚本逻辑保留） |
| 查重报告详情 | `src/views/student/PlagiarismReport.vue` | 指标与结构重排（对齐真实 DTO） |

硬约束：

- 不改任何后端接口、不新增后端字段。
- 不删除首页现有功能（提交论文、导出数据、日历导出、进度跟踪、三张图表、导师卡、通知）。
- 不做清单外的功能（不新增页面、不新增路由、不新增全局组件）。
- 完成后必须执行 `npm.cmd run build`（工作目录 `d:\check-repeat-system\check-repeat-frontend`），如实汇报结果。
- 未收到提交指令前不执行 `git commit`。

---

## 1. 设计系统约束

统一引用 `src/styles/design-tokens.scss` 中已定义的变量：

- 画布 `--apple-canvas-parchment` `#f5f5f7`，卡片 `--apple-surface`，描边 `--apple-hairline`。
- 文字 `--apple-ink` / `--apple-ink-secondary` / `--apple-ink-muted-48`。
- 主色 `--apple-primary`，语义色 `--apple-success` / `--apple-warning` / `--apple-danger` 及其 `-bg`。
- 圆角 `--apple-rounded-lg`(18px) / `--apple-rounded-md`(11px) / `--apple-rounded-sm`(8px)。
- 间距 `--apple-spacing-xs/sm/md/lg/xl`，字体 `--apple-font-display` / `--apple-font-text`。
- 禁止新增硬编码色值（语义色阶无法覆盖时，才允许用 `rgba(0,0,0,.0x)` 级别的中性描边/阴影）。

页面级复用：`PageHeader` 组件（props `title` / `description`，`#actions` 插槽）。

---

## 2. 学生首页 `src/views/student/Dashboard.vue`

### 2.1 现有事实（改造前，不得破坏）

- 文件结构：模板 1–438 行、脚本 439–1293 行、样式 1295–2425 行。
- 已接真实接口且后端已实现：`getStudentDashboardStats`、`getLatestPaper`、`getAdvisorInfo`、`getDashboardDeadlines`、`getAbilityRadarData`、`getSimilarityTrendChart`、`getMajorComparisonData`、`getNotifications`、`getProgressTracking`、`exportDashboardStats`。
- `src/api/student.js` 已存在 `getTodoList()`（GET `/api/student/dashboard/todo-list`），DTO：`{ id, title, description, completed, priority: 'high'|'normal'|'low', dueDate, createTime }`；**当前页面未使用**。
- 脚本中已有：`loading` 分项状态、`stats`、`latestPaper`、`advisorInfo`、`deadlines`、`notifications`、`progressSteps`、`currentProgress`、`estimatedCompletion`、`processingSpeed`、`hasRadarData/hasTrendData/hasComparisonData`、`radarChart/trendChart/comparisonChart` 的 `chartRef`、`formatDateTime`、`getStatusText`、`getSimilarityStatus`、`goToPaperSubmit`、`goToPaperStatus`、`viewPaperDetails`、`contactAdvisor`、`viewAllNotifications`、`refreshData`、`addAllToCalendar`、`exportDashboardData`、`getAvatarUrl`、`advisorOnlineStatus`。

### 2.2 目标信息架构（模板整体重写）

自上而下：

1. **页头**：`PageHeader`，`title="工作台"`，`description` 为「欢迎回来，{realName||同学} · {currentDate}」；`#actions` 内保留「提交新论文」「导出数据」两个按钮（沿用现有方法）。
2. **KPI 行**：4 个等宽指标卡，数据源 `stats`：
   - 总提交数 `submittedCount`
   - 待审核 `pendingCount`
   - 已通过 `approvedCount`
   - 需修改 `revisionCount`
   - 空值统一 `0`；`v-loading="loading.stats"` 放在 KPI 容器上。
3. **主区两列**（`≥1200px` 为 `grid-template-columns: minmax(0, 2fr) minmax(0, 1fr)`，`<1200px` 单列）：
   - **左列**
     a. **当前论文主卡**（`latestPaper`）：
        - 标题 + 状态徽标（`getStatusText` / `getStatusClass`）+ 论文 ID。
        - 元信息：提交时间、字数、版本、指导老师（含分配状态 tag，仅 `advisorName` 存在时展示）。
        - 相似度：进度条 + 百分比 + 状态文案；无数据时显示「未检测」，不显示 0%。
        - 导师反馈块（`latestPaper.feedback` 存在时）。
        - 主按钮「查看详情」→ `viewPaperDetails()`；次按钮「论文状态」→ `goToPaperStatus()`。
        - 空态：无记录时展示「暂无论文提交记录」+「提交第一篇论文」。
     b. **待办事项卡**（新增数据接入 `getTodoList()`）：
        - 列表按 `completed` 升序、`dueDate` 升序（空值排后）排序，最多展示 5 条。
        - 每行：优先级圆点（high→`--apple-danger`，normal→`--apple-warning`，low→`--apple-info`）、标题、描述（单行省略）、截止日期（`formatDateTime`）。
        - 已完成项：标题删除线 + 文字 `--apple-ink-muted-48`。
        - 空态/失败：显示「暂无待办事项」；接口失败不阻塞其他区块，不弹全局错误。
     c. **论文处理进度卡**（沿用现有 `progressSteps` / `currentProgress` / `estimatedCompletion` / `processingSpeed`，视觉改为令牌版）。
     d. **图表区（次级）**：三张图统一放入「数据分析」区块，标题字号降级（14px 级），两列雷达/趋势 + 通栏专业对比；保留原空态与 `v-loading`。
   - **右列**
     a. **重要时间节点**：4 项（提交截止/审核截止/答辩/预计毕业），紧凑列表样式，保留倒计时徽标与「添加到日历」按钮。
     b. **指导老师卡**：头像、姓名、职称、研究方向、联系方式、三项统计；空态沿用「暂未分配指导老师」。
     c. **通知消息卡**：沿用列表结构与空态。

### 2.3 脚本改动（最小化）

- 新增导入：`getTodoList`（来自 `@/api/student`）。
- 新增响应式：`const todos = ref([])`；`loading.todos` 初始 `false`。
- 新增 `loadTodos()`：`try/catch` 调用 `getTodoList()`，取 `res?.data ?? res ?? []` 归一为数组，排序后赋值；`catch` 内静默置空数组。
- 在 `onMounted` 的加载流程中并行加入 `loadTodos()`（与既有 `Promise` 组织方式保持一致，不重排其他请求）。
- 新增计算属性 `sortedTodos`（或直接在 `loadTodos` 内排序，二选一，倾向计算属性以便 `completed` 变更后仍有序）。
- 其余脚本**不改动**，尤其图表 `nextTick` 渲染、日历导出、`refreshData`。

### 2.4 样式

- 删除模板不再使用的类（`.welcome-section`、`.stats-grid .stat-card` 旧结构、`.section`、`.deadlines-grid`、`.main-content` 旧布局、`.paper-progress-card` 旧布局等）对应样式。
- 新增/改写：`.dashboard-page`、`.kpi-grid`、`.kpi-card`、`.dashboard-main`、`.dash-card`、`.todo-list`、`.todo-item`、`.deadline-list`、`.advisor-*`、`.notification-*`、`.charts-*`。
- 保留图表容器高度（雷达/趋势 ≥ 280px，专业对比 ≥ 300px），保持 ECharts 正常渲染。
- 响应式断点：`1200px` 双列 → 单列；`768px` KPI 4 列 → 2 列。
- 整段样式替换（替换 1295–2425 区间），不留旧样式残骸。

---

## 3. 查重报告页 `src/views/student/PlagiarismReport.vue`

### 3.1 现有契约错配（必须修复）

页面当前读取 `data.paperTitle` / `data.totalSimilarity` / `data.sections` / `data.similarSourceList`，而 `GET /api/student/reports/preview?reportId=` 实际返回 `ReportPreviewDTO`：

```
{
  baseInfo: { taskId, reportId(string), reportNo, paperId, paperTitle, author,
              studentName, teacherName, checkRuleName, checkTime, generateTime, similarityRate },
  rateStat: { repeatRate, originalRate, repeatParagraphCount, totalParagraphCount },
  paragraphs: [{ paragraphNo, content(含 <span style="color:red">), similarity, isRepeat, sourceIds }],
  similarSources: [{ sourceId, sourceName, sourceType, matchedParagraphs, sourceUrl, maxSimilarity }]
}
```

因此旧页面字段基本恒为空，必须按上述 DTO 重写数据映射。

三指标来源：`getSentenceDetail(taskId)`（`@/api/p5`，GET `/api/papers/check-tasks/{taskId}/sentence-detail`）返回 `{ taskId, checkRate, maxPerSource, citationRate, hitCount, items, sources }`。无句级数据时 `items` 为空但指标照常返回。失败时回退 `rateStat.repeatRate`，`maxPerSource` / `citationRate` 显示「—」。

历史记录：`getSimpleCheckReport(paperId)`（`@/api/student`，GET `/api/student/reports/list`）返回 `CheckReport[]`，字段 `id, taskId, reportNo, repeatDetails, reportPath, reportType, contentHash, createTime`，按 `createTime` 降序编号版本。

导出：`exportCheckReport(reportId, format)` POST `/api/student/reports/download`，后端仅接受 `pdf` / `html`。

### 3.2 目标结构

1. **页头**：`PageHeader title="查重报告"`；`#actions`：返回、PDF 导出、HTML 导出（下拉仅两项，删除 Word 项）。
2. **论文信息条**：标题 `baseInfo.paperTitle`；元信息：作者/学生、报告编号 `reportNo`、检测规则 `checkRuleName`、检测时间 `checkTime`、生成时间 `generateTime`。
3. **三指标卡**（一行三列）：
   - 总相似比：`sentenceDetail.checkRate` ?? `rateStat.repeatRate`，保留 1 位小数，配语义色与阈值说明。
   - 单篇最大：`sentenceDetail.maxPerSource`，`null/undefined` → 「—」。
   - 引用率：`sentenceDetail.citationRate`，`null/undefined` → 「—」。
   - 失败/缺失时显示「—」，绝不按 0 展示。
4. **Tabs**（保留三个）：
   - **概览**：
     - 指标摘要行：重复段落数 `rateStat.repeatParagraphCount` / 总段落数 `rateStat.totalParagraphCount`、原文率 `originalRate`、命中数 `hitCount`（句级接口返回时展示）。
     - 分段标红正文：渲染 `paragraphs`，每段标题 `第 {paragraphNo} 段` + 相似度徽标（`isRepeat` 时危险色）+ `v-html="content"`（内容由后端生成，仅含固定 `<span style="color:red">`）。
     - 右上「查看句级明细」按钮 → `router.push({ name: 'SentenceDetail', params: { taskId: baseInfo.taskId } })`（`taskId` 存在时可用，否则禁用并提示）。
   - **相似来源**：
     - 表格/卡片列表：来源名 `sourceName`、类型 `sourceType`、匹配段落 `matchedParagraphs`、最大相似度 `maxSimilarity`、外链 `sourceUrl`（`target="_blank" rel="noopener"`，无 URL 则不显示链接）。
     - 按 `maxSimilarity` 降序。
     - 空态：「未发现相似来源」。
   - **历史记录**：
     - 调用 `getSimpleCheckReport(paperId)`；按 `createTime` 降序编号「第 N 次」。
     - 每行：报告编号 `reportNo`、类型 `reportType`、重复详情 `repeatDetails`、时间 `createTime`、操作「查看」（切换 `reportId` 重新加载当前页数据）。
5. **删除模块**：关键词分析、修改建议、相似度分布图、按章节分析、检测引擎展示等启发式/无接口支撑模块全部删除。

### 3.3 脚本改造

- 数据模型改为：
  - `baseInfo`、`rateStat`、`paragraphs`、`similarSources`（来自 `getPaperReport`）。
  - `sentenceMetrics = { checkRate, maxPerSource, citationRate, hitCount }`（来自 `getSentenceDetail`，失败置空）。
  - `historyList`（来自 `getSimpleCheckReport`）。
- 加载顺序：并行请求 `getPaperReport` 与 `getSimpleCheckReport`；拿到 `baseInfo.taskId` 后再请求 `getSentenceDetail`（串行，失败静默）。
- `reportId` 来自路由 `params.paperId`？实际路由为 `/student/plagiarism-report/:paperId`，因此：
  - 首次进入以路由 `paperId` 作为 `getPaperReport` 的 `reportId`？**不可假设**。按现有页面已能工作的调用方式保留：`reportId` 由路由参数传入并直接作为 `getPaperReport({ reportId })` 的参数；`getSimpleCheckReport` 使用 `paperId`（同路由参数）。若后端返回 `baseInfo.paperId`，历史记录改用 `baseInfo.paperId` 重新加载一次（优先真实 paperId）。
- 导出：`handleExport(command)` 仅接受 `pdf` / `html`，成功走 blob 下载，失败 `ElMessage.error`。
- 保留：`formatDateTime`、返回、分享（若现有 `shareReport` 依赖已删数据则简化为复制当前链接）。
- 删除：`distributionData`、`normalKeywords`、`highRiskKeywords`、`getSectionName`、`getSimilarityRating`、`getBarColor` 等仅服务已删模块的函数。

### 3.4 样式

- 整段样式替换（796–1624 行），统一令牌；三段式布局：信息条 / 指标行 / Tabs。
- 概览正文容器 `max-height: 640px; overflow-y: auto;` 且段落字号 15px、行高 1.8。
- 指标数值使用 display 字体、34px、`font-variant-numeric: tabular-nums`。
- 响应式：`<900px` 三指标卡纵向堆叠。

---

## 4. 验收标准

- 首页：首屏可见页头 + 4 KPI；当前论文与待办在图表之上；三张图仍能正常渲染（有数据时）；待办接口失败不影响页面其他区域；窄屏单列无横向滚动。
- 报告页：三指标与真实接口一致（无数据显示「—」）；概览段落标红正文可见；相似来源与历史记录有真实数据；导出仅 PDF/HTML；「查看句级明细」可跳转 `SentenceDetail`。
- 构建：`npm.cmd run build` 成功，无新增编译错误/告警级错误。

## 5. 需要确认的决策

1. 报告页「分享」按钮：保留（简化为复制链接）还是移除？
2. 首页待办是否只展示前 5 条（不提供「查看全部」跳转，因无对应页面）？

默认执行方案：保留分享、待办仅展示前 5 条且不加跳转。
