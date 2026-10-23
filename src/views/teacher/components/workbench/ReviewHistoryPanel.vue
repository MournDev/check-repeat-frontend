<template>
  <div class="review-history-panel" v-loading="loading">
    <div v-if="!loading && records.length === 0" class="history-empty">
      <el-icon class="empty-icon"><Clock /></el-icon>
      <p>暂无审核历史记录</p>
      <span>提交初审结论后，这里会记录每一次审核动作。</span>
    </div>

    <ol v-else class="history-list">
      <li v-for="(item, index) in records" :key="item.reviewId || index" class="history-item">
        <span class="timeline-dot" :class="getReviewResultClass(item.reviewStatus)" />
        <div class="history-card">
          <div class="history-head">
            <span class="status-tag" :class="getReviewResultClass(item.reviewStatus)">
              {{ item.reviewStatusDesc || getReviewResultText(item.reviewStatus) }}
            </span>
            <span class="history-time">{{ formatDateTime(item.reviewTime, 'YYYY-MM-DD HH:mm') }}</span>
          </div>
          <div class="history-meta">
            <span>审核教师：{{ item.reviewerName || '—' }}</span>
            <span v-if="item.version">版本：V{{ item.version }}</span>
          </div>
          <p class="history-opinion">{{ item.reviewOpinion || '未填写审核意见' }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { getReviewHistory } from '@/api/teacher.js'
import { formatDateTime } from '@/utils/dataType.js'
import { getReviewResultText, getReviewResultClass } from '@/utils/reviewStatus.js'

const props = defineProps({
  paperId: { type: [String, Number], default: '' }
})

const loading = ref(false)
const records = ref([])

let requestSeq = 0

const load = async () => {
  const paperId = props.paperId ? String(props.paperId) : ''
  const seq = ++requestSeq
  records.value = []

  if (!paperId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await getReviewHistory(paperId)
    if (seq !== requestSeq) return
    records.value = res?.code === 200 && Array.isArray(res.data?.history) ? res.data.history : []
  } catch (e) {
    if (seq !== requestSeq) return
    records.value = []
    console.error('审核历史加载失败:', e)
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

watch(() => props.paperId, load, { immediate: true })
</script>

<style scoped>
.review-history-panel {
  padding: var(--apple-spacing-sm) 0 var(--apple-spacing-xs);
  min-height: 200px;
  font-family: var(--apple-font-text);
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  text-align: center;
  color: var(--apple-ink-muted-48);
}

.empty-icon {
  font-size: 36px;
  color: var(--apple-slate-faint);
}

.history-empty p {
  margin: var(--apple-spacing-sm) 0 var(--apple-spacing-xxs);
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink);
}

.history-empty span {
  font-size: var(--apple-fs-fine-print);
}

.history-list {
  position: relative;
  margin: 0;
  padding: 0 0 0 var(--apple-spacing-md);
  list-style: none;
}

.history-list::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 4px;
  width: 1px;
  background: var(--apple-hairline);
}

.history-item {
  position: relative;
  margin-bottom: var(--apple-spacing-sm);
}

.history-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  top: 6px;
  left: -16px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--apple-canvas);
  border-radius: 50%;
  background: var(--apple-ink-muted-48);
  box-shadow: 0 0 0 1px var(--apple-hairline);
}

.timeline-dot.success {
  background: var(--apple-success);
}

.timeline-dot.danger {
  background: var(--apple-danger);
}

.timeline-dot.warning {
  background: var(--apple-warning);
}

.history-card {
  padding: var(--apple-spacing-xs) var(--apple-spacing-sm);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-sm);
  background: var(--apple-canvas);
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apple-spacing-xs);
}

.status-tag {
  padding: 0 var(--apple-spacing-xs);
  font-size: var(--apple-fs-fine-print);
  line-height: 18px;
  border-radius: var(--apple-rounded-xs);
  color: var(--apple-ink-muted-48);
  background: var(--apple-canvas-parchment);
}

.status-tag.success {
  color: var(--apple-success);
  background: var(--apple-success-bg);
}

.status-tag.danger {
  color: var(--apple-danger);
  background: var(--apple-danger-bg);
}

.status-tag.warning {
  color: var(--apple-warning);
  background: var(--apple-warning-bg);
}

.history-time {
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apple-spacing-xxs) var(--apple-spacing-sm);
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

.history-opinion {
  margin: var(--apple-spacing-xxs) 0 0;
  font-size: var(--apple-fs-fine-print);
  line-height: 1.6;
  color: var(--apple-ink-muted-80);
  white-space: pre-wrap;
}
</style>
