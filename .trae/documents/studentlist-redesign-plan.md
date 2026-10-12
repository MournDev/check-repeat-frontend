# StudentList.vue 重构实施计划

## Context（为什么改造）

`src/views/teacher/StudentList.vue` 当前是 1320+ 行单文件页面，虽然已部分接入 Apple Design 变量，但与刚改造完成的 `PendingReviews.vue` 基准相比存在三层差距：

1. **公共类未接入**：页头未挂 `console-page-head-card`，stats/filter/list/batch 卡未挂 `el-card.console-card` 双类名
2. **组件未拆分**：stats/filter/table/批量操作 全 inline 在主文件，与 PendingReviews 的"4 子组件 + 2 composable + 337 行主文件"范式脱节
3. **交互不完整**：stat-card 仅展示无点击过滤、无键盘可访问性；多处 hover 是 no-op（`border-color` 与默认同值，等于无反馈）；el-table 未开 `reserve-selection` 跨页勾选不保留

用户已确认：**中层改造** = 拆组件 + 公共类 + 交互补齐，延续 Apple Design Language，不动 PendingReviews，不引入 React/shadcn。

## 设计系统声明（ui-design-master skill 第 3b 步 🛑 检查点 1）

```
设计决策：
- 注册表：Product（管理列表页，可预测、一致性、用户消失于任务）
- 色彩策略：Restrained（着色中性色 + ≤10% 面积单一强调色；Apple 语义色仅用于状态指示与 stat 图标背景）
- 色板：复用 design-tokens.scss 既有 Apple 变量（--apple-primary/success/warning/danger/info + --apple-surface/hairline/ink/ink-muted-48），不引入新色
- 排版：SF Pro Text（--apple-font-text，系统字体合法）；stat-number 1.375rem/700/1.2，stat-label 0.8125rem/ink-muted-48
- 间距系统：Apple spacing（xs:8/sm:12/md:17/lg:24/xl:32/xxl:48）；stat-grid gap 16px
- 圆角策略：--apple-rounded-lg (18px) 统一卡片区；按钮沿用 Element Plus pill
- 阴影层级：无 box-shadow（Apple HIG hairline border；console-card 公共类已定义）
- 动效风格：border-color 过渡 0.2s ease（Product 注册表 150-250ms 克制）；无入场编排；reveal 不需要（内容默认可见）
```

## 组件拆分清单（新建 3 个子组件）

### 1. `src/views/teacher/components/StudentStats.vue`
- **范式参照**：[PendingStats.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\PendingStats.vue) L1-181
- **props**：`stats: Object`(required)、`activeFilter: String`(default `''`)
- **emits**：`['filter']`，4 张卡分别 emit `''`/`'submitted'`/`'assigned'`/`'completed'`
- **template 骨架**：`.stats-grid` 4 张 `.stat-card.clickable`，每张：
  ```html
  role="button" tabindex="0" :aria-label="`按${label}过滤`"
  :class="{ active: activeFilter === 'submitted' }"
  @click="$emit('filter','submitted')"
  @keydown.enter.prevent="$emit('filter','submitted')"
  @keydown.space.prevent="$emit('filter','submitted')"
  ```
- **style**：照搬 PendingStats L80-181（`.clickable` hover/focus-visible/active、`.active` 高亮、40px 圆角图标带语义色背景、1200px/768px 响应式）
- **stat 语义色映射**：总学生→primary 12%、已提交→info 12%、已分配→warning 14%、已完成→success 12%

### 2. `src/views/teacher/components/StudentFilterBar.vue`
- **范式参照**：[PendingFilterBar.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\PendingFilterBar.vue) L1-141
- **props**：`keyword/status/college: String`、`collegeList: Array`
- **emits**：`update:keyword/update:status/update:college/reset`
- **template 骨架**：`<el-card class="filter-card console-card" shadow="never">` > `.filter-content` 包含 el-input（keyword）+ el-select（status，7 选项照搬现 [StudentList.vue L90-98](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L90-L98)）+ el-select（college）+ 重置按钮；aria-label 照搬 PendingFilterBar L11/L19/L33
- **style**：照搬 PendingFilterBar L106-141

### 3. `src/views/teacher/components/StudentTable.vue`
- **范式参照**：[PendingPaperTable.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\PendingPaperTable.vue)（defineExpose 范式）
- **props**：`students/loading/total/currentPage/pageSize/selectedCount`
- **emits**：`update:current-page/update:page-size/selection-change/sort-change/refresh/view-paper/view-all-papers/assign-tutor/message/delete/batch-assign-advisor/batch-send-message/batch-export/batch-delete/clear-selection`
- **template 骨架**：`<el-card class="list-card console-card" shadow="never">` > list-header + `<el-table :data="students" reserve-selection row-key="studentId" @selection-change>` + 首列补 `el-table-column type="selection" width="55"`（现 [L139](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L139) type=index 需改）+ 11 列照搬 [L141-242](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L141-L242) + 分页 + 批量底栏 `v-if="selectedCount>0"`（[L253-282](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L253-L282)）
- **defineExpose**：`{ clearSelection: () => tableRef.value?.clearSelection() }`（关键，供父级刷新后清跨页勾选，范式见 [PendingPaperTable.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\PendingPaperTable.vue)）
- **style**：照搬现 StudentList L1519-1734，删 no-op hover

## 主文件 StudentList.vue 重构后结构

1320+ 行 → 约 **380 行**。template 仅留：
- `page-header > .header-content.console-page-head-card`（范式 [PendingReviews.vue L4-16](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\PendingReviews.vue#L4-L16)）
- `<StudentStats :stats :active-filter="filterStatus" @filter="onStatFilter"/>`
- `<StudentFilterBar v-model:keyword v-model:status v-model:college :college-list @reset="resetFilters"/>`
- `<StudentTable ref="studentTableRef" v-model:current-page v-model:page-size :students="filteredStudents" :loading :total :selected-count @selection-change="onSelectionChange" @view-paper="viewPaper" @assign-tutor @message @delete @batch-*/>`
- 3 个 dialog（[L284-479](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L284-L479) 原样保留主文件，用户选中层不拆 dialog）

script 保留全部 API 调用/业务方法/dialog 逻辑，新增：
- `onStatFilter(status)`：`filterStatus.value = status; currentPage.value = 1; await loadStudents(); await nextTick(); studentTableRef.value?.$el?.scrollIntoView({behavior:'smooth',block:'start'})`
- `onSelectionChange(sel)`：`selectedStudents.value = sel`
- `loadStudents` 末尾补：`await nextTick(); studentTableRef.value?.clearSelection()`（跨页勾选刷新后清除，范式见 usePendingPapers.js onLoaded）

## stat-card 点击过滤映射

| stat 卡 | emit 值 | filterStatus 变化 |
|---------|---------|-------------------|
| 总学生数 | `''` | 清空过滤 |
| 已提交论文 | `'submitted'` | 仅看已提交 |
| 已分配导师 | `'assigned'` | 仅看已分配 |
| 已完成审核 | `'completed'` | 仅看已完成 |

## console 公共类接入清单

| 区块 | 挂载类名 | 参照 |
|-------|----------|------|
| page-header | `.header-content` 加 `console-page-head-card` | [global-styles.scss L351](file:///d:\check-repeat-system\check-repeat-frontend\src\styles\global-styles.scss#L351) |
| filter-card | `el-card class="filter-card console-card" shadow="never"` | [global-styles.scss L344](file:///d:\check-repeat-system\check-repeat-frontend\src\styles\global-styles.scss#L344) |
| list-card | `el-card class="list-card console-card" shadow="never"` | 同上 |
| batch-card | `el-card class="batch-card console-card" shadow="never"` | 同上 |
| stats-grid | 不套 el-card（stat-card 自带 Apple 样式，PendingStats 范式） | [PendingStats.vue L81-86](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\PendingStats.vue#L81-L86) |

## hover/active 交互补齐清单

| 元素 | 现状 | 改为 |
|------|------|------|
| stat-card.clickable hover | no-op（[L1400](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L1400)） | `border-color: var(--apple-surface-chip-translucent)`（PendingStats L102） |
| stat-card.clickable:active | 无 | `border-color: var(--apple-primary)` |
| stat-card.clickable:focus-visible | 无 | `outline: 2px solid var(--apple-primary); outline-offset: 2px`（PendingStats L105-108） |
| filter-card/list-card/batch-card hover | no-op | 删除 hover 规则（Apple HIG 卡片无 hover 反馈） |
| el-button hover | no-op border-color 重复声明 | 删除冗余声明，依赖 Element Plus 默认 |

## 键盘可访问性补齐

- stat-card：`role="button" tabindex="0" :aria-label @keydown.enter.prevent @keydown.space.prevent`（照 PendingStats L6-11）
- el-input/el-select：补 `aria-label`（照 PendingFilterBar L11/L19/L33）
- el-button：Element Plus 默认已有 `:focus-visible` outline，无需额外

## el-table 跨页勾选修复

- el-table 加 `reserve-selection row-key="studentId"`（雪花 ID 按字符串，row-key 安全）
- 首列补 `el-table-column type="selection" width="55"`（现 [L139](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L139) type=index 需改/前置）
- StudentTable defineExpose `{ clearSelection }`
- 父级 `loadStudents` 后 `await nextTick(); studentTableRef.value?.clearSelection()`

## 样式统一（与 PendingStats 对齐）

- stat-icon：56px 方块 → **40px 圆角**（border-radius:12px）带语义色背景
- stat-card 圆角：`--apple-rounded-xl` → `--apple-rounded-lg`（18px）
- stat-number：1.75rem → **1.375rem**
- stat-label：0.875rem → **0.8125rem**
- stat-card padding：20px → 14px 16px（PendingStats L92）

## 不动清单

- 路由配置（meta.menu/order/roles）不动
- 3 个 dialog 内部结构（[L284-479](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue#L284-L479)）不动
- API 调用（getStudentStats/getStudentListFull/assignAdvisor/deleteStudent/import/export/batch*）不动
- 分页参数（currentPage/pageSize/pageSizes=[10,20,50,100]）不动
- filteredStudents computed 不动
- formRules/colleges/majors 数据流不动
- 全部业务方法（handleMessage/handleAssignTutor/handleMoreActions/handleBatchAssignAdvisor/handleBatchSendMessage/batchExport/batchDelete）不动

## 验证步骤

1. **生产构建**：`npm run build`（确认无 SCSS/导入错误，无 IDE 报错）
2. **回归测试要点**：
   - 4 张 stat-card 点击 → filterStatus 变 + 列表刷新 + 滚动到表格顶部 + active 高亮
   - Tab 聚焦 stat-card → Enter/Space 触发过滤
   - 跨页勾选：选第 1 页 → 翻第 2 页 → 回第 1 页保留勾选（reserve-selection）；点刷新 → 清空（clearSelection）
   - 3 个 dialog 正常打开关闭 + 表单验证
   - 批量底栏 v-if selectedCount>0 条件渲染
   - 搜索/重置/分页功能
   - 论文预览 iframe 加载/错误重试/下载
   - 多篇论文 tag → 论文列表 dialog
   - 状态色对比度：stat-number #1d1d1f on #ffffff ≥4.5:1 ✓

## 关键文件清单

| 文件 | 角色 |
|------|------|
| [StudentList.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\StudentList.vue) | 主文件重构（1320→380 行） |
| [StudentStats.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\StudentStats.vue) | 新建子组件 |
| [StudentFilterBar.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\StudentFilterBar.vue) | 新建子组件 |
| [StudentTable.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\StudentTable.vue) | 新建子组件 |
| [PendingStats.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\PendingStats.vue) | 范式参照（只读） |
| [PendingFilterBar.vue](file:///d:\check-repeat-system\check-repeat-frontend\src\views\teacher\components\PendingFilterBar.vue) | 范式参照（只读） |
| [global-styles.scss](file:///d:\check-repeat-system\check-repeat-frontend\src\styles\global-styles.scss) | 公共类来源（只读） |
| [design-tokens.scss](file:///d:\check-repeat-system\check-repeat-frontend\src\styles\design-tokens.scss) | Apple 变量来源（只读） |
