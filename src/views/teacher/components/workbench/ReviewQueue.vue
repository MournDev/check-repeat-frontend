<template>
  <div class="review-queue">
    <header class="queue-head">
      <div class="queue-title">
        <span>待审核队列</span>
        <span class="queue-count">{{ filteredPapers.length }}<em v-if="keyword.trim() || quickFilter !== 'all'"> / {{ papers.length }}</em></span>
      </div>
      <el-button text size="small" :icon="Refresh" :loading="loading" @click="emit('refresh')">刷新</el-button>
    </header>

    <el-input
      v-model="keyword"
      class="queue-search"
      size="small"
      clearable
      :prefix-icon="Search"
      placeholder="学生姓名 / 学号 / 论文标题"
    />

    <div class="queue-filters">
      <button
        v-for="item in quickFilters"
        :key="item.value"
        type="button"
        class="filter-chip"
        :class="{ active: quickFilter === item.value }"
        @click="quickFilter = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <div ref="listRef" class="queue-list" v-loading="loading">
      <button
        v-for="paper in filteredPapers"
        :key="paper.paperId"
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
        <div class="card-title">{{ paper.paperTitle || '未命名论文' }}</div>
        <div class="card-meta">
          <span class="sim" :class="getSimilarityClass(Number(paper.similarity) || 0)">
            {{ formatRate(paper.similarity) }}
          </span>
          <span>V{{ paper.version || 1 }}</span>
          <span v-if="paper.deadline">{{ formatDateTime(paper.deadline, 'MM-DD HH:mm') }} 截止</span>
          <span v-else>待审核</span>
        </div>
      </button>

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
import { getSimilarityClass } from '@/utils/reviewStatus.js'
import { formatDateTime } from '@/utils/dataType.js'

const props = defineProps({
  papers: { type: Array, default: () => [] },
  currentId: { type: [String, Number], default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'refresh', 'filtered-change'])

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

const formatRate = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  return Number.isFinite(num) ? `${num}%` : '—'
}

const resetLocalFilter = () => {
  keyword.value = ''
  quickFilter.value = 'all'
}

// 把筛选后的顺序交给父级，键盘 J/K 才能与用户看到的队列保持一致
watch(filteredPapers, (list) => emit('filtered-change', list), { immediate: true })

// 键盘切换或审核后自动切下一篇时，把选中卡片滚进可视区
watch(() => props.currentId, async () => {
  await nextTick()
  listRef.value?.querySelector('.queue-card.active')?.scrollIntoView({ block: 'nearest' })
})
</script>

<style scoped>
.review-queue {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--apple-canvas);
  border-right: 1px solid var(--apple-hairline);
}

.queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
  flex-shrink: 0;
}

.queue-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--apple-ink);
}

.queue-count {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--apple-primary);
}

.queue-count em {
  font-style: normal;
  color: var(--apple-ink-muted-48);
}

.queue-search {
  padding: 0 16px;
  flex-shrink: 0;
}

.queue-filters {
  display: flex;
  gap: 6px;
  padding: 10px 16px 12px;
  flex-shrink: 0;
}

.filter-chip {
  padding: 3px 10px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
  background: var(--apple-canvas-parchment);
  border: 1px solid transparent;
  border-radius: var(--apple-rounded-pill);
  cursor: pointer;
  transition: var(--apple-transition-fast);
}

.filter-chip:hover {
  color: var(--apple-ink);
}

.filter-chip.active {
  color: var(--apple-primary);
  background: var(--apple-info-bg);
  border-color: var(--apple-info-border);
}

.queue-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queue-card {
  display: block;
  width: 100%;
  padding: 11px 12px;
  text-align: left;
  background: var(--apple-canvas);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-md);
  cursor: pointer;
  transition: var(--apple-transition-fast);
}

.queue-card:hover {
  border-color: var(--apple-slate-border-strong);
  background: var(--apple-surface-pearl);
}

.queue-card.active {
  border-color: var(--apple-primary);
  background: var(--apple-info-bg);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.student-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--apple-ink);
}

.flag {
  margin-left: auto;
  padding: 0 6px;
  font-size: 0.6875rem;
  line-height: 16px;
  border-radius: var(--apple-rounded-xs);
}

.flag.danger {
  color: var(--apple-danger);
  background: var(--apple-danger-bg);
}

.flag.warning {
  color: var(--apple-warning);
  background: var(--apple-warning-bg);
}

.card-title {
  margin-top: 4px;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--apple-ink-muted-80);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 0.6875rem;
  color: var(--apple-ink-muted-48);
}

.card-meta .sim {
  font-weight: 600;
}

.card-meta .sim.similarity-low {
  color: var(--apple-success);
}

.card-meta .sim.similarity-medium {
  color: var(--apple-warning);
}

.card-meta .sim.similarity-high {
  color: var(--apple-danger);
}

.queue-empty {
  padding: 40px 12px;
  text-align: center;
  color: var(--apple-ink-muted-48);
  font-size: 0.8125rem;
}

.empty-icon {
  font-size: 28px;
  color: var(--apple-slate-faint);
}

.queue-empty p {
  margin: 8px 0;
}

.queue-hint {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--apple-hairline);
  font-size: 0.6875rem;
  color: var(--apple-ink-muted-48);
}

.queue-hint span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.queue-hint kbd {
  min-width: 16px;
  padding: 0 4px;
  font-family: var(--apple-font-text);
  font-size: 0.625rem;
  line-height: 16px;
  text-align: center;
  color: var(--apple-ink-muted-80);
  background: var(--apple-canvas-parchment);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xs);
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.review-queue {
  font-family: var(--apple-font-text);
}

.queue-head {
  padding: var(--apple-spacing-md) var(--apple-spacing-md) var(--apple-spacing-xs);
}

.queue-title {
  gap: var(--apple-spacing-xs);
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-body-strong);
}

.queue-count {
  font-size: var(--apple-fs-fine-print);
}

.queue-search {
  padding: 0 var(--apple-spacing-md);

  :deep(.el-input__wrapper) {
    border-radius: var(--apple-rounded-md);
    font-size: var(--apple-fs-fine-print);
  }
}

.queue-filters {
  gap: var(--apple-spacing-xxs);
  padding: var(--apple-spacing-xs) var(--apple-spacing-md) var(--apple-spacing-sm);
}

.filter-chip {
  padding: 3px var(--apple-spacing-xs);
  font-size: var(--apple-fs-fine-print);
  transition: var(--apple-transition-fast);
}

.queue-list {
  padding: 0 var(--apple-spacing-sm) var(--apple-spacing-md);
  gap: var(--apple-spacing-xs);
}

.queue-card {
  padding: var(--apple-spacing-xs) var(--apple-spacing-sm);
  border-radius: var(--apple-rounded-md);
  transition: var(--apple-transition-fast);
}

.card-top {
  gap: var(--apple-spacing-xxs);
}

.student-name {
  font-size: var(--apple-fs-caption);
}

.flag {
  padding: 0 var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
  line-height: 16px;
}

.card-title {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
  line-height: 1.4;
}

.card-meta {
  gap: var(--apple-spacing-xs);
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
}

.queue-empty {
  padding: var(--apple-spacing-xl) var(--apple-spacing-sm);
  font-size: var(--apple-fs-caption);
}

.queue-empty p {
  margin: var(--apple-spacing-xs) 0;
}

.queue-hint {
  gap: var(--apple-spacing-sm);
  padding: var(--apple-spacing-xs) var(--apple-spacing-md);
  font-size: var(--apple-fs-fine-print);
}

.queue-hint span {
  gap: var(--apple-spacing-xxs);
}

.queue-hint kbd {
  font-size: var(--apple-fs-fine-print);
}

@media (max-width: 768px) {
  .queue-head {
    padding: var(--apple-spacing-sm);
  }

  .queue-search,
  .queue-filters,
  .queue-list {
    padding-left: var(--apple-spacing-sm);
    padding-right: var(--apple-spacing-sm);
  }
}
</style>
