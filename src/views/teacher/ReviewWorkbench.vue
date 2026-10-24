<template>
  <div class="review-workbench">
    <aside class="wb-queue">
      <ReviewQueue
        :papers="papers"
        :current-id="currentPaperId"
        :loading="loading"
        @select="selectPaper"
        @refresh="refreshQueue"
        @filtered-change="onFilteredChange"
      />
    </aside>

    <section class="wb-preview">
      <PaperPreviewPane :paper="currentPaper" />
    </section>

    <aside class="wb-detail">
      <template v-if="currentPaper">
        <header class="paper-head">
          <div class="student-line">
            <span class="avatar">{{ avatarText }}</span>
            <div class="student-meta">
              <strong>{{ currentPaper.studentName || '未知学生' }}</strong>
              <span>{{ currentPaper.studentNo || currentPaper.studentId || '—' }} · {{ currentPaper.college || '未知学院' }}</span>
            </div>
            <span class="status-flag" :class="{ overdue: isOverdue(currentPaper), urgent: isUrgent(currentPaper) && !isOverdue(currentPaper) }">
              {{ isOverdue(currentPaper) ? '已超时' : (isUrgent(currentPaper) ? '即将超时' : '待审核') }}
            </span>
          </div>

          <h2 class="paper-title" :title="currentPaper.paperTitle">{{ currentPaper.paperTitle || '未命名论文' }}</h2>

          <div class="paper-meta">
            <span>V{{ currentPaper.version || 1 }}</span>
            <span v-if="currentPaper.submitTime">提交 {{ formatDateTime(currentPaper.submitTime, 'MM-DD HH:mm') }}</span>
            <span v-if="currentPaper.deadline">截止 {{ formatDateTime(currentPaper.deadline, 'MM-DD HH:mm') }}</span>
          </div>

          <div class="steps">
            <div class="step done">
              <span class="step-dot">1</span>
              <span class="step-text">查看材料</span>
            </div>
            <div class="step-line" :class="{ done: !!signoff }" />
            <div class="step" :class="{ done: !!signoff, current: !signoff }">
              <span class="step-dot">2</span>
              <span class="step-text">{{ signoff ? (signoff.qualified === 1 ? '已合格签核' : '签核不合格') : '查重签核' }}</span>
            </div>
            <div class="step-line" :class="{ done: signoff?.qualified === 1 }" />
            <div class="step" :class="{ current: signoff?.qualified === 1 }">
              <span class="step-dot">3</span>
              <span class="step-text">初审结论</span>
            </div>
          </div>
        </header>

        <el-tabs v-model="activeTab" class="wb-tabs">
          <el-tab-pane label="查重报告" name="report">
            <CheckReportPanel
              :loading="reportLoading"
              :error="reportError"
              :no-report="noReport"
              :metrics="reportMetrics"
              :base-info="reportBaseInfo"
              :sources="reportSources"
              :paragraphs="reportParagraphs"
              :latest-report="latestReport"
              @retry="reloadReport"
              @download="downloadFullReport"
            />
          </el-tab-pane>

          <el-tab-pane label="签核与意见" name="signoff">
            <SignoffPanel
              :paper-id="currentPaperId"
              :signoff="signoff"
              :loading="signoffLoading"
              :submitting="signoffSubmitting"
              :can-sign="canSignReport"
              :no-report="noReport"
              :metrics="reportMetrics"
              :base-info="reportBaseInfo"
              @submit="handleSignoffSubmit"
            />
          </el-tab-pane>

          <el-tab-pane label="审核历史" name="history">
            <ReviewHistoryPanel :paper-id="currentPaperId" />
          </el-tab-pane>
        </el-tabs>

        <footer class="wb-actions">
          <div class="action-note">
            <template v-if="canApprove">查重签核已合格，可提交初审结论</template>
            <template v-else-if="signoff">查重签核为不合格，请退回修改</template>
            <template v-else>完成合格签核后，才能提交初审结论</template>
          </div>
          <div class="action-buttons">
            <el-button
              type="danger"
              plain
              :disabled="reviewSubmitting"
              @click="handleReject"
            >
              退回修改
            </el-button>
            <el-button
              type="primary"
              :loading="reviewSubmitting"
              :disabled="!canApprove"
              @click="handleApprove"
            >
              通过初审
            </el-button>
          </div>
        </footer>
      </template>

      <div v-else class="detail-empty">
        <el-empty description="请选择一篇待审核论文" :image-size="88" />
      </div>
    </aside>

    <el-dialog
      v-model="rejectDialogVisible"
      title="退回修改"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="reject-dialog">
        <p class="reject-tip">意见将同步给学生，请尽量指出可执行的修改点。</p>

        <div v-if="templatesLoading" class="template-tip">正在加载意见模板…</div>
        <div v-else-if="rejectTemplates.length" class="template-chips">
          <button
            v-for="template in rejectTemplates"
            :key="template.id"
            type="button"
            class="template-chip"
            :title="template.content"
            @click="applyRejectTemplate(template)"
          >
            {{ template.title }}
          </button>
        </div>
        <div v-else class="template-tip">暂无意见模板，可在「审核意见模板」中创建。</div>

        <el-input
          v-model="rejectOpinion"
          type="textarea"
          :rows="5"
          maxlength="500"
          show-word-limit
          placeholder="例如：第 3 章相似片段需改写，参考文献格式需统一"
        />
      </div>

      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="reviewSubmitting"
          :disabled="!rejectOpinion.trim()"
          @click="handleRejectConfirm"
        >
          确认退回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReviewQueue from './components/workbench/ReviewQueue.vue'
import PaperPreviewPane from './components/workbench/PaperPreviewPane.vue'
import CheckReportPanel from './components/workbench/CheckReportPanel.vue'
import SignoffPanel from './components/workbench/SignoffPanel.vue'
import ReviewHistoryPanel from './components/workbench/ReviewHistoryPanel.vue'
import { usePendingPapers, isOverdue, isUrgent } from '@/composables/usePendingPapers.js'
import { useWorkbenchReport } from '@/composables/useWorkbenchReport.js'
import { doReview, getReviewTemplates } from '@/api/teacher.js'
import { getCheckSignoff, signoffCheckReport } from '@/api/p5.js'
import { formatDateTime } from '@/utils/dataType.js'

const route = useRoute()
const router = useRouter()

const { papers, loading, refreshList } = usePendingPapers()

const activeTab = ref('report')
const currentPaperId = ref(route.query.paperId ? String(route.query.paperId) : '')

const currentPaper = computed(() =>
  papers.value.find(paper => String(paper.paperId) === currentPaperId.value) || null
)

const avatarText = computed(() => {
  const name = currentPaper.value?.studentName
  return name ? name.trim().slice(0, 1) : '?'
})

// ── 报告 ────────────────────────────────────────────────────
const {
  loading: reportLoading,
  error: reportError,
  noReport,
  latestReport,
  baseInfo: reportBaseInfo,
  metrics: reportMetrics,
  sources: reportSources,
  paragraphs: reportParagraphs,
  reload: reloadReport,
  downloadFullReport
} = useWorkbenchReport(currentPaperId)

const canSignReport = computed(() =>
  !!currentPaperId.value && !reportLoading.value && !reportError.value && !noReport.value
)

// ── 签核 ────────────────────────────────────────────────────
const signoff = ref(null)
const signoffLoading = ref(false)
const signoffSubmitting = ref(false)

const loadSignoff = async () => {
  const paperId = currentPaperId.value
  if (!paperId) {
    signoff.value = null
    return
  }

  signoffLoading.value = true
  try {
    const res = await getCheckSignoff(paperId)
    if (String(currentPaperId.value) !== String(paperId)) return
    signoff.value = res?.code === 200 ? (res.data || null) : null
  } catch (e) {
    if (String(currentPaperId.value) === String(paperId)) signoff.value = null
  } finally {
    if (String(currentPaperId.value) === String(paperId)) signoffLoading.value = false
  }
}

const canApprove = computed(() => signoff.value?.qualified === 1)

const handleSignoffSubmit = async (payload) => {
  const paperId = currentPaperId.value
  if (!paperId || signoffSubmitting.value) return

  signoffSubmitting.value = true
  try {
    const res = await signoffCheckReport(paperId, payload)
    if (res?.code === 200) {
      ElMessage.success('查重报告签核成功')
      await loadSignoff()
    }
  } catch (e) {
    // 响应拦截器已按后端 message 提示
    console.error('查重报告签核失败:', e)
  } finally {
    signoffSubmitting.value = false
  }
}

// ── 初审结论 ────────────────────────────────────────────────
const reviewSubmitting = ref(false)

// 当前筛选后的队列顺序，键盘 J/K 与用户看到的列表保持一致
const visiblePapers = ref([])
const onFilteredChange = (list) => {
  visiblePapers.value = Array.isArray(list) ? list : []
}

const submitReview = async (reviewStatus, reviewOpinion) => {
  const paperId = currentPaperId.value
  if (!paperId || reviewSubmitting.value) return false

  reviewSubmitting.value = true
  try {
    const res = await doReview({
      paperIds: [paperId],
      reviewStatus,
      reviewOpinion
    })
    if (res?.code === 200) {
      ElMessage.success(reviewStatus === 3 ? '初审已通过' : '已退回修改')
      await refreshList()
      // 队列刷新后主动切到下一篇，避免停留在已审核论文
      const remaining = papers.value.filter(item => String(item.paperId) !== String(paperId))
      if (remaining.length) {
        selectPaper(remaining[0])
      } else {
        currentPaperId.value = ''
        router.replace({ query: { ...route.query, paperId: undefined } })
      }
      return true
    }
    return false
  } catch (e) {
    // 响应拦截器已提示，保留当前论文与页面状态
    console.error('提交审核结论失败:', e)
    return false
  } finally {
    reviewSubmitting.value = false
  }
}

// ── 退回意见与模板 ──────────────────────────────────────────
const rejectDialogVisible = ref(false)
const rejectOpinion = ref('')
const rejectTemplates = ref([])
const templatesLoading = ref(false)
const templatesLoaded = ref(false)

const loadRejectTemplates = async () => {
  if (templatesLoaded.value) return
  templatesLoading.value = true
  try {
    const res = await getReviewTemplates()
    rejectTemplates.value = (Array.isArray(res?.data) ? res.data : []).slice(0, 8)
    templatesLoaded.value = true
  } catch (e) {
    console.error('加载审核意见模板失败:', e)
  } finally {
    templatesLoading.value = false
  }
}

const handleReject = () => {
  if (!currentPaperId.value || reviewSubmitting.value) return
  rejectOpinion.value = ''
  rejectDialogVisible.value = true
  loadRejectTemplates()
}

const applyRejectTemplate = (template) => {
  const content = template?.content
  if (!content) return
  const current = rejectOpinion.value.trim()
  rejectOpinion.value = (current ? `${current}\n${content}` : content).slice(0, 500)
}

const handleRejectConfirm = async () => {
  const opinion = rejectOpinion.value.trim()
  if (!opinion) return
  const ok = await submitReview(4, opinion)
  if (ok) rejectDialogVisible.value = false
}

const handleApprove = async () => {
  if (!canApprove.value) return
  try {
    await ElMessageBox.confirm(
      `确认通过《${currentPaper.value?.paperTitle || '当前论文'}》的初审？`,
      '通过初审',
      {
        type: 'info',
        confirmButtonText: '确认通过',
        cancelButtonText: '取消'
      }
    )
    await submitReview(3, signoff.value?.comment || '初审通过')
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    console.error('通过初审失败:', e)
  }
}

// ── 队列联动 ────────────────────────────────────────────────
const selectPaper = (paper) => {
  const id = paper?.paperId != null ? String(paper.paperId) : ''
  if (!id || id === currentPaperId.value) return

  currentPaperId.value = id
  router.replace({ query: { ...route.query, paperId: id } })
}

const refreshQueue = async () => {
  await refreshList()
}

// ── 键盘流：J/K 切换，A 通过，R 退回 ───────────────────────
const isTypingTarget = (target) => {
  if (!target) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

const moveSelection = (step) => {
  const list = visiblePapers.value
  if (!list.length) return

  const index = list.findIndex(item => String(item.paperId) === currentPaperId.value)
  const nextIndex = index < 0
    ? (step > 0 ? 0 : list.length - 1)
    : Math.min(Math.max(index + step, 0), list.length - 1)

  if (nextIndex !== index) selectPaper(list[nextIndex])
}

const onKeydown = (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (isTypingTarget(event.target)) return
  // 确认框、退回弹窗等浮层打开时不响应快捷键
  if (document.querySelector('.el-overlay')) return

  const key = event.key.toLowerCase()
  if (key === 'j') {
    event.preventDefault()
    moveSelection(1)
  } else if (key === 'k') {
    event.preventDefault()
    moveSelection(-1)
  } else if (key === 'a') {
    if (!currentPaper.value) return
    event.preventDefault()
    if (canApprove.value) handleApprove()
    else ElMessage.warning('完成合格签核后才能通过初审')
  } else if (key === 'r') {
    if (!currentPaper.value) return
    event.preventDefault()
    handleReject()
  }
}

watch(papers, (list) => {
  if (!list?.length) {
    if (currentPaperId.value) {
      currentPaperId.value = ''
      router.replace({ query: { ...route.query, paperId: undefined } })
    }
    return
  }

  const exists = list.some(paper => String(paper.paperId) === currentPaperId.value)
  if (!exists) selectPaper(list[0])
}, { immediate: true })

watch(currentPaperId, loadSignoff, { immediate: true })

onMounted(() => {
  refreshQueue()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.review-workbench {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 400px;
  /* 高度由导航与内容区留白令牌推导，避免写死 160px */
  height: calc(100vh - var(--app-global-nav-height) - var(--app-subnav-height) - (var(--app-page-gutter) * 2));
  height: calc(100dvh - var(--app-global-nav-height) - var(--app-subnav-height) - (var(--app-page-gutter) * 2));
  min-height: 520px;
  overflow: hidden;
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  font-family: var(--app-font-family);
}

/* 工作台为满屏三栏，隐藏全局页脚避免页面出现纵向滚动 */
:global(.main-content:has(.review-workbench) .app-footer) {
  display: none;
}

.wb-queue,
.wb-preview,
.wb-detail {
  min-width: 0;
  min-height: 0;
}

.wb-detail {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--app-color-border);
  background: var(--app-color-card-bg);
}

.paper-head {
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-4) var(--app-space-2);
  border-bottom: 1px solid var(--app-color-border);
}

.student-line {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
}

.avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-fs-meta);
  font-weight: 600;
  color: var(--app-color-primary);
  background: var(--app-color-info-bg);
  border-radius: 50%;
}

.student-meta {
  flex: 1;
  min-width: 0;
}

.student-meta strong {
  display: block;
  font-size: var(--app-fs-caption);
  color: var(--app-color-ink);
}

.student-meta span {
  display: block;
  margin-top: 1px;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-flag {
  flex-shrink: 0;
  padding: 0 var(--app-space-2);
  font-size: var(--app-fs-meta);
  line-height: 18px;
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
  border-radius: var(--app-radius-xs);
}

.status-flag.urgent {
  color: var(--app-color-warning);
  background: var(--app-color-warning-bg);
}

.status-flag.overdue {
  color: var(--app-color-danger);
  background: var(--app-color-danger-bg);
}

.paper-title {
  margin: var(--app-space-2) 0 0;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  line-height: 1.4;
  font-weight: 600;
  color: var(--app-color-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paper-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1) var(--app-space-2);
  margin-top: var(--app-space-1);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.steps {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
  margin-top: var(--app-space-3);
}

.step {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  white-space: nowrap;
}

.step-dot {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
  border-radius: 50%;
}

.step.done {
  color: var(--app-color-success);
}

.step.done .step-dot {
  color: var(--app-color-on-primary);
  background: var(--app-color-success);
}

.step.current {
  color: var(--app-color-primary);
}

.step.current .step-dot {
  color: var(--app-color-on-primary);
  background: var(--app-color-primary);
}

.step-line {
  flex: 1;
  height: 1px;
  background: var(--app-color-border);
}

.step-line.done {
  background: var(--app-color-success);
}

.wb-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 var(--app-space-4);
}

.wb-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  flex-shrink: 0;
}

.wb-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--app-space-1);
}

.wb-tabs :deep(.el-tab-pane) {
  min-height: 100%;
}

.wb-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4);
  border-top: 1px solid var(--app-color-border);
  background: var(--app-color-card-bg);
}

.action-note {
  flex: 1;
  min-width: 0;
  font-size: var(--app-fs-meta);
  line-height: 1.4;
  color: var(--app-color-text-muted);
}

.action-buttons {
  display: flex;
  gap: var(--app-space-2);
  flex-shrink: 0;
}

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reject-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
}

.reject-tip {
  margin: 0;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.template-tip {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1);
  max-height: 96px;
  overflow-y: auto;
}

.template-chip {
  padding: 3px var(--app-space-2);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text);
  background: var(--app-color-fill);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-pill);
  cursor: pointer;
  transition: var(--app-transition-fast);
}

.template-chip:hover {
  color: var(--app-color-primary);
  border-color: var(--app-color-info-border);
  background: var(--app-color-info-bg);
}

/* 中等宽度先收窄两侧栏，保证中间论文预览仍有可读宽度 */
@media (max-width: 1440px) {
  .review-workbench {
    grid-template-columns: 280px minmax(0, 1fr) 380px;
  }
}

@media (max-width: 1280px) {
  .review-workbench {
    grid-template-columns: 240px minmax(0, 1fr) 340px;
  }
}

/* 再窄就放弃三栏，改为纵向堆叠，避免预览区被挤成细条。
   1200px 折叠：1101–1200 区间三栏时中间预览仅 233–332px，已不可读 */
@media (max-width: 1200px) {
  .review-workbench {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .wb-queue {
    height: 260px;
    border-right: none;
    border-bottom: 1px solid var(--app-color-border);
  }

  .wb-preview {
    height: 68vh;
    min-height: 420px;
  }

  .wb-detail {
    border-left: none;
    border-top: 1px solid var(--app-color-border);
    min-height: 640px;
  }
}

@media (max-width: 768px) {
  .paper-head {
    padding: var(--app-space-3);
  }

  .wb-tabs {
    padding: 0 var(--app-space-3);
  }

  .wb-actions {
    flex-direction: column;
    align-items: stretch;
    padding: var(--app-space-3);
  }

  .action-buttons {
    justify-content: flex-end;
  }
}
</style>
