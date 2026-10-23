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
  padding: var(--app-space-3) 0 var(--app-space-2);
  min-height: 200px;
  font-family: var(--app-font-family);
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  text-align: center;
  color: var(--app-color-text-muted);
}

.empty-icon {
  font-size: 36px;
  color: var(--app-color-text-secondary);
}

.history-empty p {
  margin: var(--app-space-3) 0 var(--app-space-1);
  font-size: var(--app-fs-caption);
  color: var(--app-color-ink);
}

.history-empty span {
  font-size: var(--app-fs-meta);
}

.history-list {
  position: relative;
  margin: 0;
  padding: 0 0 0 var(--app-space-4);
  list-style: none;
}

.history-list::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 4px;
  width: 1px;
  background: var(--app-color-border);
}

.history-item {
  position: relative;
  margin-bottom: var(--app-space-3);
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
  border: 2px solid var(--app-color-card-bg);
  border-radius: 50%;
  background: var(--app-color-text-muted);
  box-shadow: 0 0 0 1px var(--app-color-border);
}

.timeline-dot.success {
  background: var(--app-color-success);
}

.timeline-dot.danger {
  background: var(--app-color-danger);
}

.timeline-dot.warning {
  background: var(--app-color-warning);
}

.history-card {
  padding: var(--app-space-2) var(--app-space-3);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-color-card-bg);
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2);
}

.status-tag {
  padding: 0 var(--app-space-2);
  font-size: var(--app-fs-meta);
  line-height: 18px;
  border-radius: var(--app-radius-xs);
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
}

.status-tag.success {
  color: var(--app-color-success);
  background: var(--app-color-success-bg);
}

.status-tag.danger {
  color: var(--app-color-danger);
  background: var(--app-color-danger-bg);
}

.status-tag.warning {
  color: var(--app-color-warning);
  background: var(--app-color-warning-bg);
}

.history-time {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1) var(--app-space-3);
  margin-top: var(--app-space-1);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.history-opinion {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-fs-meta);
  line-height: 1.6;
  color: var(--app-color-text);
  white-space: pre-wrap;
}
</style>
