<template>
  <section class="status-timeline" :class="{ 'is-dense': dense }">
    <header class="timeline-head">
      <span class="timeline-title">论文流转进度</span>
      <el-tag size="small" :type="overallTagType" round>{{ overallStatusText }}</el-tag>
    </header>

    <ol class="timeline-list">
      <li
        v-for="(node, index) in nodes"
        :key="node.key"
        class="timeline-node"
        :class="`is-${node.state}`"
      >
        <span class="node-line"></span>
        <span class="node-dot">
          <el-icon v-if="node.state === 'done'"><Check /></el-icon>
          <el-icon v-else-if="node.state === 'rejected'"><Close /></el-icon>
          <span v-else>{{ index + 1 }}</span>
        </span>

        <div class="node-body">
          <div class="node-head">
            <span class="node-name">{{ node.name }}</span>
            <span v-if="node.time" class="node-time">{{ node.time }}</span>
          </div>
          <div class="node-result">{{ node.result }}</div>

          <div
            v-if="node.state === 'rejected' && feedbackHtml"
            class="node-feedback markdown-body"
            v-html="feedbackHtml"
          ></div>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import { formatDateTime, handleSimilarity } from '@/utils/dataType.js'
import { getStatusText, getStatusType } from '@/utils/reviewStatus.js'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps({
  paper: { type: Object, default: () => ({}) },
  checkTask: { type: Object, default: null },
  dense: { type: Boolean, default: false }
})

const paper = computed(() => props.paper || {})

const status = computed(() =>
  String(paper.value.paperStatus || paper.value.status || '').toLowerCase()
)

const overallStatusText = computed(() =>
  status.value ? getStatusText(status.value, status.value) : '未知状态'
)

const overallTagType = computed(() =>
  status.value ? getStatusType(status.value) : 'info'
)

const isRejected = computed(() =>
  ['rejected', 'revision_needed', 'need_revision', 'revised'].includes(status.value)
)

const formatTime = (value) => formatDateTime(value, 'YYYY-MM-DD HH:mm', '')

const latestReviewTime = computed(() => {
  const history = paper.value.reviewHistory
  if (Array.isArray(history) && history.length) {
    return history[0]?.reviewTime || history[0]?.createTime || ''
  }
  if (Array.isArray(history?.records) && history.records.length) {
    return history.records[0]?.reviewTime || history.records[0]?.createTime || ''
  }
  return ''
})

const similarityText = computed(() => {
  const raw = paper.value.checkRate
    ?? paper.value.similarityRate
    ?? paper.value.similarity
    ?? props.checkTask?.checkRate
  if (raw === null || raw === undefined || raw === '') return ''
  return `${handleSimilarity(raw)}%`
})

const submitTime = computed(() => formatTime(paper.value.submitTime))
const checkTime = computed(() => formatTime(
  props.checkTask?.endTime
  || props.checkTask?.checkTime
  || paper.value.checkTime
  || paper.value.checkEndTime
))
const allocationTime = computed(() => formatTime(
  paper.value.allocationTime
  || paper.value.confirmTime
  || paper.value.assignTime
))
const reviewTime = computed(() => formatTime(
  paper.value.reviewTime
  || paper.value.auditTime
  || latestReviewTime.value
))
const defenseTime = computed(() => formatTime(
  paper.value.defenseTime
  || paper.value.defenseDate
  || paper.value.defenseBatchTime
))

const assigned = computed(() =>
  !!paper.value.teacherName
  || !!paper.value.teacherId
  || ['assigned', 'checking', 'auditing', 'completed', 'rejected', 'reviewing',
    'mid_defense', 'final_defense', 'defense_passed', 'finalized', 'archived'].includes(status.value)
)

const checkDone = computed(() =>
  paper.value.checkCompleted === 1
  || !!paper.value.checkTime
  || !!checkTime.value
  || similarityText.value !== ''
  || ['auditing', 'completed', 'rejected', 'reviewing', 'mid_defense',
    'final_defense', 'defense_passed', 'finalized', 'archived'].includes(status.value)
)

const reviewDone = computed(() =>
  ['completed', 'reviewing', 'mid_defense', 'final_defense',
    'defense_passed', 'finalized', 'archived'].includes(status.value)
)

const defenseDone = computed(() =>
  ['defense_passed', 'finalized', 'archived'].includes(status.value)
)

// 当前节点索引：提交 0 / 查重 1 / 分配 2 / 审核 3 / 答辩 4
const currentIndex = computed(() => {
  if (isRejected.value) return 3
  if (['draft', 'not_submitted'].includes(status.value)) return 0
  if (status.value === 'checking') return 1
  if (['pending', 'submitted'].includes(status.value)) return checkDone.value ? 2 : 1
  if (['assigned', 'auditing'].includes(status.value)) return 3
  if (['completed', 'reviewing', 'mid_defense', 'final_defense'].includes(status.value)) return 4
  if (['defense_passed', 'finalized', 'archived', 'withdrawn'].includes(status.value)) return null
  return 3
})

const getState = (index) => {
  if (isRejected.value && index === 3) return 'rejected'
  if (currentIndex.value === null) return 'done'
  if (index < currentIndex.value) return 'done'
  if (index === currentIndex.value) return 'current'
  return 'pending'
}

const submitResult = computed(() => {
  if (['draft', 'not_submitted'].includes(status.value)) return '草稿未提交'
  if (status.value === 'withdrawn') return '已撤回'
  return '已提交'
})

const checkResult = computed(() => {
  if (!checkDone.value) {
    return status.value === 'checking' ? '排队中' : '待处理'
  }
  return similarityText.value ? `总相似比 ${similarityText.value}` : '查重已完成'
})

const allocationResult = computed(() =>
  assigned.value
    ? `指导老师：${paper.value.teacherName || paper.value.teacherRealName || '已分配'}`
    : '等待分配导师'
)

const reviewResult = computed(() => {
  if (isRejected.value) return '审核未通过，需修改后重提'
  if (reviewDone.value) return '审核通过'
  if (status.value === 'auditing') return '导师审核中'
  if (status.value === 'assigned') return '已分配，等待导师审核'
  return '等待导师审核'
})

const defenseResult = computed(() => {
  if (defenseDone.value) return '答辩已通过'
  if (status.value === 'mid_defense') return '中期答辩已安排'
  if (status.value === 'final_defense') return '终期答辩已安排'
  if (['completed', 'reviewing'].includes(status.value)) return '等待答辩安排'
  if (isRejected.value) return '需修改后重新进入流程'
  return '未进入答辩'
})

const latestReviewComment = computed(() => {
  const history = paper.value.reviewHistory
  if (Array.isArray(history) && history.length) {
    return history[0]?.comments || history[0]?.reviewOpinion || history[0]?.auditComment || ''
  }
  if (Array.isArray(history?.records) && history.records.length) {
    return history.records[0]?.comments || history.records[0]?.reviewOpinion || history.records[0]?.auditComment || ''
  }
  return ''
})

const feedbackHtml = computed(() => {
  if (!isRejected.value) return ''
  const content = paper.value.feedback
    || paper.value.auditComment
    || paper.value.reviewOpinion
    || latestReviewComment.value
    || ''
  return content ? renderMarkdown(content) : ''
})

const nodes = computed(() => [
  { key: 'submit', name: '提交论文', time: submitTime.value, result: submitResult.value, state: getState(0) },
  { key: 'check', name: '查重检测', time: checkTime.value, result: checkResult.value, state: getState(1) },
  { key: 'assign', name: '分配导师', time: allocationTime.value, result: allocationResult.value, state: getState(2) },
  { key: 'review', name: '导师审核', time: reviewTime.value, result: reviewResult.value, state: getState(3) },
  { key: 'defense', name: '答辩', time: defenseTime.value, result: defenseResult.value, state: getState(4) }
])
</script>

<style scoped lang="scss">
.status-timeline {
  font-family: var(--app-font-family);
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-3);
}

.timeline-title {
  font-size: var(--app-fs-caption);
  font-weight: 600;
  color: var(--app-color-ink);
}

.timeline-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-node {
  position: relative;
  display: flex;
  gap: var(--app-space-3);
  padding-bottom: var(--app-space-4);
}

.timeline-node:last-child {
  padding-bottom: 0;
}

.node-line {
  position: absolute;
  top: 22px;
  bottom: 0;
  left: 9px;
  width: 2px;
  background: var(--app-color-divider);
}

.timeline-node:last-child .node-line {
  display: none;
}

.node-dot {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
  border: 1px solid var(--app-color-border);
  border-radius: 50%;
}

.node-dot .el-icon {
  font-size: 12px;
}

.is-done .node-dot {
  color: var(--app-color-on-primary);
  background: var(--app-color-success);
  border-color: var(--app-color-success);
}

.is-current .node-dot {
  color: var(--app-color-on-primary);
  background: var(--app-color-primary);
  border-color: var(--app-color-primary);
  box-shadow: 0 0 0 4px var(--app-color-info-bg);
  animation: timeline-pulse 2s infinite;
}

.is-rejected .node-dot {
  color: var(--app-color-on-primary);
  background: var(--app-color-danger);
  border-color: var(--app-color-danger);
}

.node-body {
  flex: 1;
  min-width: 0;
  padding-top: 1px;
}

.node-head {
  display: flex;
  align-items: baseline;
  gap: var(--app-space-2);
  min-width: 0;
}

.node-name {
  font-size: var(--app-fs-caption);
  font-weight: 600;
  color: var(--app-color-ink);
}

.is-pending .node-name {
  font-weight: 500;
  color: var(--app-color-text-muted);
}

.is-current .node-name {
  color: var(--app-color-primary);
}

.is-rejected .node-name {
  color: var(--app-color-danger);
}

.node-time {
  flex-shrink: 0;
  margin-left: auto;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  font-variant-numeric: tabular-nums;
}

.node-result {
  margin-top: 2px;
  font-size: var(--app-fs-meta);
  line-height: 1.5;
  color: var(--app-color-text-secondary);
}

.is-pending .node-result {
  color: var(--app-color-text-muted);
}

.node-feedback {
  margin-top: var(--app-space-2);
  padding: var(--app-space-2) var(--app-space-3);
  font-size: var(--app-fs-meta);
  line-height: 1.6;
  color: var(--app-color-text);
  background: var(--app-color-danger-bg);
  border-left: 3px solid var(--app-color-danger);
  border-radius: var(--app-radius-xs);
}

.node-feedback :deep(p) {
  margin: 0 0 var(--app-space-1);
}

.node-feedback :deep(p:last-child) {
  margin-bottom: 0;
}

.node-feedback :deep(ul),
.node-feedback :deep(ol) {
  margin: 0 0 var(--app-space-1);
  padding-left: var(--app-space-4);
}

.node-feedback :deep(strong) {
  color: var(--app-color-ink);
  font-weight: 600;
}

.node-feedback :deep(a) {
  color: var(--app-color-primary);
  word-break: break-all;
}

.is-dense {
  .timeline-head {
    margin-bottom: var(--app-space-2);
  }

  .timeline-node {
    padding-bottom: var(--app-space-2);
  }

  .node-name,
  .node-result {
    font-size: var(--app-fs-meta);
  }
}

@keyframes timeline-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--app-color-primary-rgb), 0.35);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(var(--app-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--app-color-primary-rgb), 0);
  }
}
</style>
