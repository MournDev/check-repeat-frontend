<template>
  <div class="review-queue">
    <header class="queue-head">
      <div class="queue-title">
        <span>待审核队列</span>
        <span class="queue-count">{{ filteredPapers.length }}<em v-if="keyword.trim() || quickFilter !== 'all'"> / {{ papers.length }}</em></span>
      </div>
      <el-button text size="small" :icon="Refresh" :loading="loading" @click="emit('refresh')">刷新</el-button>
    </header>

    <!-- 搜索与快捷筛选合并成一条紧凑工具栏，窄栏时自动换行 -->
    <div class="queue-toolbar">
      <el-input
        v-model="keyword"
        class="queue-search"
        size="small"
        clearable
        :prefix-icon="Search"
        placeholder="姓名 / 学号 / 标题"
      />

      <div class="queue-filters" role="group" aria-label="按时限筛选">
        <button
          v-for="item in quickFilters"
          :key="item.value"
          type="button"
          class="filter-chip"
          :class="{ active: quickFilter === item.value }"
          :aria-pressed="quickFilter === item.value"
          @click="quickFilter = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- 批量操作：全选只针对当前筛选结果，批量动作由父级处理 -->
    <div v-if="papers.length" class="queue-batch">
      <el-checkbox
        :model-value="allSelected"
        :indeterminate="someSelected && !allSelected"
        @change="toggleSelectAll"
      >
        全选
      </el-checkbox>
      <span class="batch-count">{{ selectedIds.length ? `已选 ${selectedIds.length}` : '未选择' }}</span>
      <div class="batch-actions">
        <el-button size="small" type="primary" :disabled="!selectedIds.length" @click="emitBatch('approve')">
          批量通过
        </el-button>
        <el-button size="small" type="danger" plain :disabled="!selectedIds.length" @click="emitBatch('reject')">
          批量退回
        </el-button>
      </div>
    </div>

    <div ref="listRef" class="queue-list" v-loading="loading">
      <div
        v-for="paper in filteredPapers"
        :key="paper.paperId"
        class="queue-row"
      >
        <el-checkbox
          class="queue-check"
          :model-value="isSelected(paper)"
          :disabled="!isEligible(paper)"
          :title="isEligible(paper) ? '选择该论文' : '未完成合格签核，不能批量操作'"
          :aria-label="`选择 ${paper.studentName || '该论文'}`"
          @change="(checked) => toggleSelect(paper, checked)"
        />
        <button
          type="button"
          class="queue-card"
          :class="{ active: String(paper.paperId) === String(currentId) }"
          @click="emit('select', paper)"
        >
          <div class="card-top">
            <span class="student-name">{{ paper.studentName || '未命名学生' }}</span>
            <span v-if="isOverdue(paper)" class="flag danger">已超时</span>
            <span v-else-if="isUrgent(paper)" class="flag warning">紧急</span>
          </div>
          <div class="card-title" :title="paper.paperTitle || '未命名论文'">{{ paper.paperTitle || '未命名论文' }}</div>
          <div class="card-meta">
            <span class="sim" :class="getSimilarityClass(Number(paper.similarity) || 0)">
              {{ formatPercent(paper.similarity) }}
            </span>
            <span>V{{ paper.version || 1 }}</span>
            <span v-if="paper.deadline" class="meta-deadline">{{ formatDateTime(paper.deadline, 'MM-DD HH:mm') }} 截止</span>
            <span v-else class="meta-deadline">待审核</span>
            <span v-if="paper.canBatchReview === false" class="meta-lock">未签核</span>
          </div>
        </button>
      </div>

      <div v-if="!loading && filteredPapers.length === 0" class="queue-empty">
        <el-icon class="empty-icon"><Document /></el-icon>
        <p>{{ papers.length ? '没有符合筛选条件的论文' : '暂无待审核论文' }}</p>
        <el-button v-if="papers.length" text type="primary" size="small" @click="resetLocalFilter">
          重置筛选
        </el-button>
      </div>
    </div>

    <footer v-if="papers.length" class="queue-hint">
      <span><kbd>J</kbd><kbd>K</kbd> 切换</span>
      <span><kbd>A</kbd> 通过</span>
      <span><kbd>R</kbd> 退回</span>
    </footer>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Document, Refresh, Search } from '@element-plus/icons-vue'
import { isOverdue, isUrgent } from '@/composables/usePendingPapers.js'
import { getSimilarityClass } from '@/utils/similarity.js'
import { formatDateTime, formatPercent } from '@/utils/dataType.js'

const props = defineProps({
  papers: { type: Array, default: () => [] },
  currentId: { type: [String, Number], default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'refresh', 'filtered-change', 'batch-approve', 'batch-reject'])

const listRef = ref(null)

const quickFilters = [
  { value: 'all', label: '全部' },
  { value: 'urgent', label: '紧急' },
  { value: 'overdue', label: '已超时' }
]

const keyword = ref('')
const quickFilter = ref('all')

const filteredPapers = computed(() => {
  let list = Array.isArray(props.papers) ? props.papers : []

  if (quickFilter.value === 'urgent') {
    list = list.filter(paper => !isOverdue(paper) && isUrgent(paper))
  } else if (quickFilter.value === 'overdue') {
    list = list.filter(paper => isOverdue(paper))
  }

  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(paper => [paper.studentName, paper.studentId, paper.studentNo, paper.paperTitle]
      .some(field => field != null && String(field).toLowerCase().includes(kw)))
  }

  return list
})

const resetLocalFilter = () => {
  keyword.value = ''
  quickFilter.value = 'all'
}

// ── 批量选择 ────────────────────────────────────────────────
// 只保存 id：队列刷新后按 id 与最新数据对齐，避免持有过期对象
const selectedIds = ref([])

const isSelected = (paper) => selectedIds.value.includes(String(paper?.paperId))

// 后端待审列表已带 canBatchReview（signoffQualified && auditing），
// 字段缺失时按可批量处理，最终仍由后端签核门兜底
const isEligible = (paper) => paper?.canBatchReview !== false

const toggleSelect = (paper, checked) => {
  const id = String(paper?.paperId ?? '')
  if (!id || !isEligible(paper)) return
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  }
}

const eligiblePapers = computed(() => filteredPapers.value.filter(isEligible))

const allSelected = computed(() =>
  eligiblePapers.value.length > 0
  && eligiblePapers.value.every(paper => isSelected(paper))
)

const someSelected = computed(() => selectedIds.value.length > 0)

const toggleSelectAll = (checked) => {
  selectedIds.value = checked
    ? eligiblePapers.value.map(paper => String(paper.paperId))
    : []
}

const selectedPapers = computed(() =>
  (props.papers || []).filter(paper => isSelected(paper) && isEligible(paper))
)

const emitBatch = (action) => {
  if (!selectedPapers.value.length) return
  emit(action === 'approve' ? 'batch-approve' : 'batch-reject', selectedPapers.value)
}

// 队列刷新后剔除已不在待审列表中的选择，避免批量操作打到已审完的论文
watch(() => props.papers, (list) => {
  if (!selectedIds.value.length) return
  const alive = new Set((list || []).map(paper => String(paper.paperId)))
  selectedIds.value = selectedIds.value.filter(id => alive.has(id))
}, { deep: false })

defineExpose({ clearSelection: () => { selectedIds.value = [] } })

// 把筛选后的顺序交给父级，键盘 J/K 才能与用户看到的队列保持一致
watch(filteredPapers, (list) => emit('filtered-change', list), { immediate: true })

// 键盘切换或审核后自动切下一篇时，把选中卡片滚进可视区
watch(() => props.currentId, async () => {
  await nextTick()
  listRef.value?.querySelector('.queue-card.active')?.scrollIntoView({ block: 'nearest' })
})
</script>

<style scoped lang="scss">
.review-queue {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--app-color-card-bg);
  border-right: 1px solid var(--app-color-border);
  font-family: var(--app-font-family);
}

.queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-3) var(--app-space-3) var(--app-space-1);
  flex-shrink: 0;
}

.queue-title {
  display: flex;
  align-items: baseline;
  gap: var(--app-space-2);
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-ink);
}

.queue-count {
  font-size: var(--app-fs-meta);
  font-weight: 500;
  color: var(--app-color-primary);
}

.queue-count em {
  font-style: normal;
  color: var(--app-color-text-muted);
}

/* 搜索 + 快捷筛选同一行；240px 窄栏时筛选自动落到下一行 */
.queue-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2);
  padding: 0 var(--app-space-3) var(--app-space-2);
  flex-shrink: 0;
}

.queue-search {
  flex: 1 1 132px;
  min-width: 0;

  :deep(.el-input__wrapper) {
    border-radius: var(--app-radius-sm);
    font-size: var(--app-fs-meta);
  }
}

.queue-filters {
  display: flex;
  gap: var(--app-space-1);
  flex-shrink: 0;
}

.filter-chip {
  padding: 2px var(--app-space-2);
  font-size: var(--app-fs-meta);
  line-height: 18px;
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
  border: 1px solid transparent;
  border-radius: var(--app-radius-pill);
  cursor: pointer;
  transition: var(--app-transition-fast);

  &:focus-visible {
    outline: 2px solid var(--app-color-primary);
    outline-offset: 1px;
  }
}

.filter-chip:hover {
  color: var(--app-color-ink);
}

.filter-chip.active {
  color: var(--app-color-primary);
  background: var(--app-color-info-bg);
  border-color: var(--app-color-info-border);
}

/* 批量条：与搜索工具栏同宽，按钮靠右 */
.queue-batch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2);
  padding: 0 var(--app-space-3) var(--app-space-2);
  flex-shrink: 0;

  :deep(.el-checkbox__label) {
    font-size: var(--app-fs-meta);
  }
}

.batch-count {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.batch-actions {
  display: flex;
  gap: var(--app-space-1);
  margin-left: auto;
}

.queue-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.queue-check {
  flex-shrink: 0;
  margin-top: 8px;
  height: auto;
}

.queue-row .queue-card {
  flex: 1;
  min-width: 0;
}

.queue-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--app-space-3) var(--app-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
}

/* 单行标题 + 两行结构，行高稳定在 68px 左右，一屏可多看 2–3 条 */
.queue-card {
  display: block;
  width: 100%;
  padding: 6px 10px;
  text-align: left;
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-sm);
  cursor: pointer;
  transition: var(--app-transition-fast);
}

.queue-card:hover {
  border-color: var(--app-color-border-strong);
  background: var(--app-color-fill-light);
}

.queue-card.active {
  border-color: var(--app-color-primary);
  background: var(--app-color-info-bg);
  box-shadow: inset 2px 0 0 var(--app-color-primary);
}

.card-top {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
}

.student-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--app-fs-caption);
  font-weight: 600;
  color: var(--app-color-ink);
}

.flag {
  margin-left: auto;
  padding: 0 var(--app-space-1);
  font-size: var(--app-fs-meta);
  line-height: 16px;
  border-radius: var(--app-radius-xs);
}

.flag.danger {
  color: var(--app-color-danger);
  background: var(--app-color-danger-bg);
}

.flag.warning {
  color: var(--app-color-warning);
  background: var(--app-color-warning-bg);
}

.card-title {
  margin-top: 2px;
  font-size: var(--app-fs-meta);
  line-height: 1.35;
  color: var(--app-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  margin-top: 2px;
  font-size: var(--app-fs-meta);
  line-height: 16px;
  color: var(--app-color-text-muted);
}

.meta-deadline {
  margin-left: auto;
  flex-shrink: 0;
}

.meta-lock {
  flex-shrink: 0;
  color: var(--app-color-danger);
}

.card-meta .sim {
  font-weight: 600;
}

/* 颜色由 global-styles.scss 的 similarity-* 语义类统一提供 */

.queue-empty {
  padding: var(--app-space-8) var(--app-space-3);
  text-align: center;
  color: var(--app-color-text-muted);
  font-size: var(--app-fs-caption);
}

.empty-icon {
  font-size: 28px;
  color: var(--app-color-text-secondary);
}

.queue-empty p {
  margin: var(--app-space-2) 0;
}

.queue-hint {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: var(--app-space-2) var(--app-space-4);
  border-top: 1px solid var(--app-color-border);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.queue-hint span {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-1);
}

.queue-hint kbd {
  min-width: 16px;
  padding: 0 var(--app-space-1);
  font-family: var(--app-font-family);
  font-size: var(--app-fs-meta);
  line-height: 16px;
  text-align: center;
  color: var(--app-color-text);
  background: var(--app-color-fill);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-xs);
}

@media (max-width: 768px) {
  .queue-head {
    padding: var(--app-space-3);
  }

  .queue-toolbar,
  .queue-list {
    padding-left: var(--app-space-3);
    padding-right: var(--app-space-3);
  }
}
</style>
