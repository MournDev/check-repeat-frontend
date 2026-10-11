# 教师审核控制台（待审核论文）改造方案

> 评审对象：`src/views/teacher/PendingReviews.vue`（2172 行）及其容器 `src/views/teacher/PaperReview.vue`
> 评审日期：2026-10-11
> 状态：**P0、P1、P2 已全部实施完成（2026-10-11），生产构建通过；仅余阶段 B（服务端分页）依赖后端**。
> 事实基准：所有结论均由当前代码核实，行号对应当前版本（实施前版本，改造后行号已变化）。

---

## 0. 结论速览

问题分三层：

1. **视觉失效层（实锤 bug，与审美无关）**：页面引用了 7 个从未定义的 CSS 变量，导致卡片白底、圆角、语义色大面积失效。
2. **信息架构层（用户觉得"不合理"的主因）**：首屏非核心内容堆叠过深、紧急信息三重重复、批量操作双入口、行内信息密度失控、无分页、排序双轨。
3. **工程化层**：单文件 2172 行、scoped `:deep` 大面积覆盖 Element Plus 内部类、同组三页三套样式语言、存在死代码与失效的响应式规则。

整改原则：**先恢复设计意图（补 token），再做减法（收敛入口与信息），最后做拆分（组件化）**。不引入任何新的 UI 库或新的视觉体系，全部对齐项目已有的 Apple Design token 与 Element Plus 组件。

---

## 1. P0：视觉正确性修复（改动小、风险低、收益最大）

### P0-1 补齐 7 个缺失的设计 token（影响全站 6 文件 45 处）

**现状**

`PendingReviews.vue` 全篇使用以下变量，但 `src/styles/design-tokens.scss` 中均无定义（已全项目搜索确认）：

| 页面使用的变量 | token 文件实际情况 | 失效后果 |
|---|---|---|
| `--apple-surface` | 只有 `--apple-canvas: #ffffff`、`--apple-surface-pearl/tile-*` | 页头卡（L528）、统计卡（L588）背景透明，灰底直接透出 |
| `--apple-rounded-xl` | 圆角最大只到 `--apple-rounded-lg: 18px` | 卡片 18px+ 大圆角失效为直角 |
| `--apple-success` | 不存在 | 低相似度、正常等待时间绿色失效（L981、L1059） |
| `--apple-warning` | 不存在 | 中相似度黄色失效（L977、L1056） |
| `--apple-danger` | 不存在 | 高相似度、超时红色失效（L973、L1051、L1085） |
| `--apple-info` | 不存在 | 学号 tag 文字色失效（L838） |
| `--apple-primary-hover` | 已有 `--apple-primary-focus: #0071e3` 可复用 | 主按钮 hover 态失效（L717） |

受影响文件（引用次数）：`PendingReviews.vue`(28)、`StudentList.vue`(10)、`FileManager.vue`(3)、`DataStatistics.vue`(2)、`Dashboard.vue`(1)、`ChatCenter.vue`(1)。

**改法**：在 `design-tokens.scss` 的 `:root` 中新增"语义兼容层"（不动任何已有 token，纯新增）：

```scss
// ── Semantic aliases（兼容业务页面既有引用，2026-10 补）──
--apple-surface: #ffffff;                    // = --apple-canvas
--apple-primary-hover: #0071e3;              // = --apple-primary-focus
--apple-success: #34c759;                    // Apple system green
--apple-warning: #ff9500;                    // Apple system orange
--apple-danger: #ff3b30;                     // Apple system red
--apple-info: #8e8e93;                       // Apple system gray
--apple-rounded-xl: 22px;                    // 介于 lg(18) 与卡片层级之间
```

> 语义色具体取值建议采用 Apple 系统色；如希望与页面现有硬编码色板（#67C23A 等 Element 色）完全一致，可在评审时拍板，改 5 个值即可。

**风险评估**：这些变量此前未定义，补定义只会让 45 处引用"恢复设计意图"，不改变任何当前正常渲染的样式。合入后需巡检上述 6 个页面。

**验收**：教师端待审核页、学生管理页、文件管理等页卡片显示白底、圆角、红/黄/绿语义色；无 console 警告。

---

### P0-2 修复失效的响应式断点（类名写错）

**现状**：媒体查询中写的是 `.stats-row`，模板实际类名是 `.stats-grid`，导致 1200px / 768px 两档断点规则全部不生效（L1299-L1301、L1315-L1317）。

**改法**：将两处 `.stats-row` 改为 `.stats-grid`；统计卡网格改为明确断点：

```scss
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .stats-grid { grid-template-columns: 1fr; } }
```

（替换当前 `repeat(auto-fit, minmax(280px, 1fr))` 的模糊策略。）

---

### P0-3 修复"等待时间"配色 class 不匹配

**现状**：`getWaitingTimeClass` 返回 `waiting-long/medium/short`（L1728-L1732），CSS 定义的却是 `urgent/high/normal`（L1050-L1060），颜色逻辑完全不生效。

**改法**：统一 JS 返回值为 CSS 已有命名：

```js
const getWaitingTimeClass = (days) => {
  if (days >= 3) return 'urgent'
  if (days >= 1) return 'high'
  return 'normal'
}
```

---

### P0-4 消除重复的空状态

**现状**：el-table 空数据时自带 empty-block，模板 L364-L375 又渲染了一个独立 `el-empty`，空列表时页面出现两个空状态。

**改法**：删除外部 `el-empty`，改用 el-table 的 `#empty` 插槽承载定制内容（自定义图标 + "刷新查看"按钮），空态只有一个事实源。

---

### P0-5 修复单篇审核误入批量模式

**现状**：`ReviewDialog` 的批量模式绑的是全局勾选数（L398）：

```vue
:is-batch="selectedPapers.length > 1"
```

用户勾选 ≥2 篇后，点任意一行的"审核"（`reviewPaper`）也会以批量模式打开单篇论文。

**改法**：新增独立状态，入口显式传模式：

```js
const reviewMode = ref('single') // 'single' | 'batch'
const reviewPaper = (paper) => {
  reviewMode.value = 'single'
  currentPaperId.value = paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id
  reviewDialogVisible.value = true
}
const batchReview = () => { /* 校验后 */ reviewMode.value = 'batch'; ... }
```

模板改为 `:is-batch="reviewMode === 'batch'"`，`:papers` 仅批量模式传入。

---

### P0-6 清理死代码与无效写法

| 位置 | 内容 | 处理 |
|---|---|---|
| L575、L705、L784、L1039、L1281 | 5 处空 hover 规则 `/* translateY removed */` | 删除 |
| L1130 | `/* box-shadow removed */` 注释残留 | 删除 |
| L1349 | 行尾注释 `// import SimilarityReportDialog ...` | 删除 |
| L1679-L1685 | `computeDeadlineFromSubmit` 定义后从未调用 | 删除 |
| L408 | el-dialog 传了不存在的 `:height` prop | 删除 |
| L407/L410、L436-L438 | `:width` 与 `:fullscreen` 同时传，全屏时 width 无意义 | 非全屏才绑定 width |
| L475-L495 | 错误占位区大块内联 style（#fff3cd）+ 🔧 emoji | 抽为 `.fallback-panel` class，颜色改用 token；emoji 换 el-icon |
| L446 | skeleton `style="width:100%;height:800px"` 内联 | 抽 class |
| L146 | 表格 `style="width:100%"` | el-table 默认即 100%，可删 |

---

### P0-7 交互反馈降噪

- `handlePreviewLoad`（L1586-L1593）：iframe 每次加载成功都弹"预览加载完成"成功提示 → **删除**，loading 遮罩消失已是充分反馈。
- `toggleFullscreen`（L1906-L1914）：进/出全屏各弹一条 message → **删除**，全屏状态本身可见。
- `viewPaper` 中"已加载论文基本信息/内容，但预览功能暂不可用"两条 info（L1521、L1559）同一次操作可能连续弹出 → 合并为一条。

---

### P0-8 排序状态初步统一（P1 再彻底化）

**现状**：表头"等待时间"列 `sortable` 走 el-table 内部排序；"时间正/倒序"按钮对 `submitTime` 排序（L1720-L1723），两者互不知道对方状态，按钮文案与表头箭头会互相矛盾。

**P0 最小修法**：点击自定义排序按钮时调用 `tableRef.value?.clearSort()` 清除表头态；表头 `sort-change` 时同步 `sortDesc` 按钮文案。P1 阶段把排序统一收敛到 `sortChange` 单一处理函数（见 P1-6）。

---

## 2. P1：信息架构与布局重构（用户可感知的体验提升）

### 目标线框（1366×768 首屏即见表格前两行）

```
┌──────────────────────────────────────────────────────────────────┐
│ 待审核论文                                          [刷新]        │  ← 页头瘦身，不再放批量按钮
│ 需要您审核的学生论文                                              │
├──────────────────────────────────────────────────────────────────┤
│ ⚠ 3 篇已超时 · 2 篇即将超时   [仅看超时 3][仅看紧急 2][×]         │  ← 两条 alert 合并为一条可关闭状态条
├──────────────────────────────────────────────────────────────────┤
│ 待审核 28    紧急 5    平均等待 1.8 天    今日已审 12             │  ← 统计卡紧凑化（单行、可点击）
├──────────────────────────────────────────────────────────────────┤
│ [🔍 搜索姓名/学号/论文标题] [优先级▾][学院▾][相似度▾] [重置]      │  ← 筛选工具条（对齐审核记录页）
├──────────────────────────────────────────────────────────────────┤
│ ☐ 优先级  学生信息        论文信息              查重   等待 截止  操作│
│ ☐ 🔴紧急   张三 2021xxxx  基于深度学习的…  V3     38% ▰▰▱  3天  …  [审核▾]│
│ ☐ …                                                              │
├──────────────────────────────────────────────────────────────────┤
│ 已选 2 篇（跨页保留）  [批量审核] [批量提醒] [取消]   共28条 < 1 2 >│  ← 选中态工具条与分页合并为底栏
└──────────────────────────────────────────────────────────────────┘
```

### P1-1 页头瘦身，批量操作收敛为单一入口

- 页头右侧只保留"刷新"；删除页头红色"批量提醒 (N)"按钮（L11-L13）。
- 批量操作只在选中后出现：底部批量条（L378-L391 上移或保留为表格底栏），按钮文案禁用态规则：未选中时 `disabled`，不再允许点击后弹 warning。
- "批量提醒"按钮类型从 `type="danger"` 改为 `type="warning"`（提醒是常规沟通动作，危险色只留给删除/驳回类操作）。

### P1-2 两条 alert 合并为一条状态条，过滤态对用户可见

- 超时/紧急合并为一条 `el-alert`（`type="error"` 当有超时，否则 `warning`），文案聚合数量。
- alert 操作区改为两个过滤 chip："仅看超时 (n)"、"仅看紧急 (n)"。
- **关键修复**：当前 `showOnlyOverdue` 激活后筛选栏无任何提示（L1665-L1671）。新增统一状态 `activeQuickFilter = 'overdue' | 'urgent' | null`，激活时在筛选工具条内显示可关闭的 chip（"仅看超时 ×"），用户始终知道列表为何被过滤；chip 关闭即回到全部。
- alert 允许 `closable`，关闭后本会话内不再挤占首屏（状态记忆到 sessionStorage，可选）。

### P1-3 统计卡紧凑化并可点击

- 卡片视觉减重：图标块 48×48 → 40×40、数值 1.75rem → 1.5rem、padding 20px → 16px，高度从约 96px 压到约 72px。
- 每张卡可点击，点击等价于对应快捷过滤（紧急待审卡 → `activeQuickFilter='urgent'`；待审核总数 → 清除过滤），带 hover 态与光标提示。这样 alert 与卡片不再是重复信息，而是同一筛选动作的两个入口；P1-2 实施后 alert 甚至可弱化为一行文字链接。

### P1-4 筛选工具条对齐 `AuditRecords.vue` 水平

- 新增"搜索"输入框：前端实时过滤学生姓名/学号/论文标题（`computed` 内加 `keyword` 匹配，input 加 300ms debounce），补齐当前只能按三个下拉筛选的短板。
- 三个 select 补可访问标签（`aria-label`，不必都上 form label），增加"重置"按钮一键清空全部筛选（含 quick filter chip）。
- 筛选区与右侧排序/刷新在 1200px 以下折行的规则保留，但删除 768px 断点中 `:deep(.el-button){width:100%}` 这类把页内所有按钮强制满宽的规则（L1328-L1331），改为只让工具条容器纵向排列。

### P1-5 表格瘦身（本页最核心的效率改造）

**列结构调整**：

| 列 | 现状问题 | 改法 |
|---|---|---|
| 学生信息 min-width 250 | 姓名 `max-width:100px` 截断（L823）、学院+邮箱双行，邮箱对审核场景低优先级 | 两行：第一行姓名 + 学号 tag；第二行学院。邮箱收进行 tooltip 或"更多"菜单。列宽降到 180 |
| 论文信息 min-width 320 | 双行标题 + 版本/时间 tag + 字数/页数两个 chip，层级过多 | 两行：第一行标题（2 行截断）；第二行 `V3 · 10-08 14:30 · 1.2万字 · 18页` 纯文本 meta，去掉 tag/chip 容器 |
| 查重结果 min-width 220 | 百分比 + tag + 进度条 + **三个无语义圆点** + **两个按钮**，最高约 110px | 两行：第一行 `38%` + 等级 tag；第二行细进度条（stroke 8px）。**删除圆点指示器**（L237-L248、L1003-L1025）；**删除列内两个按钮**（操作全部收敛到操作列）。列宽降到 150 |
| 等待时间 120 | 配色 class 坏（P0-3 已修） | 保留，居中 |
| 截止时间 150 | 两行，OK | 保留 |
| 操作 220 fixed | "审核/联系"按钮组 + 更多下拉；查重列与更多菜单功能重复 | 主按钮"审核" + 「更多」下拉：联系学生、查看原文、下载论文、**查看查重报告**、提醒学生、委托审核、重新检测（>30%）。列宽降到 130 |

- 文案统一："查看重报"（L260，疑似笔误）与菜单"查看报告"（L339）统一为 **"查看查重报告"**，均指向 `viewSimilarityReport`。
- 目标行高：从约 140px 降到 64–72px，1080p 首屏可见行数 4–5 → 8–10。

### P1-6 排序双轨收敛

- 去掉"时间正序/倒序"独立按钮，排序全部走 el-table 表头：`submitTime` 列加 `sortable`，与"等待时间"列一样触发统一的 `@sort-change`。
- `filteredPapers` 的排序改为由单一 `sortState = { prop, order }` 驱动；默认提交时间倒序，用 `:default-sort` 在表头体现箭头状态。

### P1-7 补分页（接口已就绪，前端可独立交付）

**现状**：`getPendingReviewList(pageNum, pageSize)` 在 `src/api/teacher.js` L117-L126 **已支持分页参数**，页面无参调用并把 `data.records` 全量前端渲染；同组 AuditRecords、StudentList 均有 `el-pagination`。

**阶段 A（纯前端，本方案内交付）**：
- 调用 `getPendingReviewList(1, 200)` 拉取（兜底上限，教师待审实际量级足够），保留现有前端筛选/排序；
- 对 `filteredPapers` 增加 `pagedPapers` 切片 computed，表格绑定切片数据，底部加 `el-pagination`（pageSize 选项 [10,20,50]，默认 20，对齐 AuditRecords 的 layout）；
- el-table 加 `row-key="paperId"` 与 selection 列 `reserve-selection`，保证翻页后批量勾选不丢失；
- 筛选/快捷过滤变化时重置到第 1 页。

**阶段 B（需后端配合，另立任务）**：`/api/teacher/dashboard/pending-papers` 增加 `keyword/priority/college/similarityMin/sortProp/sortOrder` 查询参数，前端改为服务端分页。当前接口契约未知是否支持，标记为跨端任务，不在本次前端改造内承诺。

### P1-8 1366 笔记本横向滚动治理

P1-5 列宽压缩后合计约 55+70+180+260+150+90+150+130 = 1085px，1366 视口（内容区约 1280px）无需横向滚动。保留操作列 `fixed="right"` 作为更小视口的兜底。

### P1-9 弹窗样式一致性

- `append-to-body` 的两个 el-dialog 渲染在 body 下，当前 scoped 中的 `:deep(.el-button)` 圆角覆盖**到不了弹窗**，造成页内/弹窗按钮风格不一致。
- 改法：弹窗专属样式（`.report-dialog`、`.preview-dialog` 内的 footer/button）迁移到 `src/styles/global-styles.scss`，以弹窗自定义 class 为命名空间；页面 scoped 中删除对 `:deep(.el-button)`、`:deep(.el-select)`、`:deep(.el-tag)` 的整页级覆盖（L681-L721、L830-L864、L1033-L1041），需要定制的元素改用组件根类 + 局部 class。

---

## 3. P2：工程化（建议在 P0/P1 验证后单独排期）

### P2-1 组件与逻辑拆分

当前 2172 行单文件职责：列表、统计、筛选、排序、分页、iframe 预览、报告弹窗、下载、提醒、委托全部耦合。建议目标结构：

```
src/views/teacher/
├── PendingReviews.vue            # 页面编排，目标 < 300 行
├── components/
│   ├── PendingStats.vue          # 4 个统计指标（P1-3 紧凑版）
│   ├── PendingFilterBar.vue      # 搜索 + 3 下拉 + 重置 + quick filter chip
│   ├── PendingPaperTable.vue     # 表格 + 空态插槽 + 分页 + 批量底栏
│   └── PaperPreviewDialog.vue    # iframe 预览弹窗（含失败降级/重试/新窗口）
├── composables/
│   ├── usePendingPapers.js       # 列表加载/normalize/筛选/排序/分页/统计
│   └── usePaperPreview.js        # buildPreviewUrl/加载/超时/重试/复制链接
└── （现有 ReviewDialog.vue、PlagiarismReportViewer.vue、PriorityBadge.vue 不动）
```

`handleMoreAction` 的 switch 各分支拆为表格组件内独立方法；blob 下载逻辑（L1977-L1984）下沉到 `src/utils/download.js`（如已有下载工具则复用）。

### P2-2 统一样式语言（跨页任务）

容器 `PaperReview.vue`（硬编码 Apple 色值）、`PendingReviews.vue`（半套 token）、`AuditRecords.vue`（Ant/Element 色板 #52c41a/#faad14/#ff4d4f）三套体系需统一。建议：

1. P0-1 补齐 token 后，三页全部改为 token 引用，禁止新增硬编码十六进制色值；
2. 新增 ESLint/Stylelint 规则（如 `stylelint-declaration-strict-value` 对 color/background 要求变量）作为防回退手段（可选，需团队同意）；
3. 卡片、筛选栏、表格卡片抽公共 class 到全局样式（如 `.console-card`、`.console-filterbar`），三页复用，与项目"菜单 SSOT"同样的单一事实源思路一致。

### P2-3 `:deep` 收敛清单

实施 P1-9 时顺带处理，原则：**不改 Element 内部类外观，只通过组件 props / 自定义 class 定制**。需逐处评估的覆盖点：`.el-table__header th`、`.el-table__row td`、`.el-dropdown-menu__item`、`.el-progress__bar`、`.el-button-group`、`.el-tag--*`（L735-L788、L830-L864、L991-L1001、L1105-L1143）。保留确有必要的，迁移到全局命名空间。

### P2-4 可访问性收尾

- 所有仅图标或语义不自明的控件补 `aria-label`（全屏、更多下拉）；
- 相似度红/绿始终伴随文字 tag（低/中/高风险），不单靠颜色传达，现状基本满足，改造时保持。

---

## 4. 明确不做的事（防止过度设计）

- 不引入新 UI 库、不换设计风格、不做暗色模式；
- 不把表格改为卡片流（教师端是高密度工作台，表格仍是最佳形态）；
- 不在本次做服务端分页改造（阶段 B 依赖后端）；
- 不改 ReviewDialog / PlagiarismReportViewer 的内部审核流程与接口；
- 不顺手重构同组其他页面（P2-2 统一任务单独排期）。

---

## 5. 需后端 / 跨端确认项

1. `/api/teacher/dashboard/pending-papers` 是否能承受 `pageSize=200`，以及未来是否支持筛选/排序参数（决定阶段 A→B 切换时机）；
2. `getPendingStats()` 在 `teacher.js` L363 定义为无参，但页面调用传了 `userId`（L1784）——参数实际被 axios 忽略，统计口径是否以后端登录态为准，需确认（功能不影响，属代码整洁项）。

---

## 6. 实施顺序与回归清单

**建议提交粒度**：P0 一个提交（纯修复）→ P1 按 P1-1/2/3、P1-4/6、P1-5/8、P1-7、P1-9 分 4–5 个提交 → P2 独立排期。

**回归测试清单（教师账号）**：

- [ ] 首屏：卡片白底/圆角/语义色正常，1366 与 768 两档视口布局
- [ ] 快捷过滤：超时/紧急 chip 过滤、chip 可见可关闭、与下拉筛选共存逻辑
- [ ] 筛选：搜索、三个下拉、重置；筛选后分页回到第 1 页
- [ ] 排序：提交时间、等待时间表头排序，状态指示正确
- [ ] 选择：单选、跨页多选保留（reserve-selection）、批量审核仅在批量入口进入批量模式
- [ ] 单篇审核：勾选多篇后点行内"审核"仍为单篇模式
- [ ] 操作列：联系、原文预览（成功/失败降级/重试/新窗口/复制链接）、下载、查重报告、提醒、委托、>30% 重新检测
- [ ] 分页：翻页、改 pageSize、总数显示
- [ ] 空态：仅一个空状态
- [ ] 巡检 P0-1 涉及的另外 5 个页面无视觉回退
