<template>
  <div class="teacher-pending">
    <!-- 页面头部（仅保留说明与刷新，批量操作收敛到表格底栏） -->
    <PageHeader title="待审核论文" description="需要您审核的学生论文">
      <template #actions>
        <el-button type="primary" :icon="Refresh" @click="refreshList">
          刷新
        </el-button>
      </template>
    </PageHeader>

    <!-- 超时 / 紧急合并状态条 -->
    <el-alert
      v-if="!alertDismissed && (overduePapers.length > 0 || urgentPapers.length > 0)"
      :title="alertTitle"
      :type="overduePapers.length > 0 ? 'error' : 'warning'"
      show-icon
      class="urgent-alert"
      @close="dismissAlert"
    >
      <template #action>
        <el-button
          v-if="overduePapers.length > 0"
          type="danger"
          size="small"
          :plain="activeQuickFilter !== 'overdue'"
          @click="toggleQuickFilter('overdue')"
        >
          仅看超时 ({{ overduePapers.length }})
        </el-button>
        <el-button
          v-if="urgentPapers.length > 0"
          type="warning"
          size="small"
          :plain="activeQuickFilter !== 'urgent'"
          @click="toggleQuickFilter('urgent')"
        >
          仅看紧急 ({{ urgentPapers.length }})
        </el-button>
      </template>
    </el-alert>

    <!-- 统计卡片 -->
    <PendingStats
      :stats="stats"
      :active-quick-filter="activeQuickFilter"
      @filter="onStatFilter"
    />

    <!-- 筛选工具条 -->
    <PendingFilterBar
      v-model:keyword="searchKeyword"
      v-model:priority="filterPriority"
      v-model:college="filterCollege"
      v-model:similarity="filterSimilarity"
      :college-list="collegeList"
      :active-quick-filter="activeQuickFilter"
      @clear-quick-filter="setQuickFilter(null)"
      @reset="resetFilters"
    />

    <!-- 论文列表 -->
    <PendingPaperTable
      ref="pendingTableRef"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :papers="pagedPapers"
      :loading="loading"
      :total="filteredPapers.length"
      :any-filter-active="anyFilterActive"
      :selected-count="selectedPapers.length"
      @selection-change="onSelectionChange"
      @sort-change="handleSortChange"
      @review="reviewPaper"
      @view-paper="onViewPaper"
      @view-report="viewSimilarityReport"
      @signoff="onSignoff"
      @batch-review="batchReview"
      @batch-remind="batchRemind"
      @refresh="refreshList"
      @reset-filters="resetFilters"
    />

    <!-- 审核对话框 -->
    <ReviewDialog
      v-model="reviewDialogVisible"
      :paper-id="currentPaperId"
      :is-batch="reviewMode === 'batch'"
      :papers="reviewMode === 'batch' ? selectedPapers : []"
      @review-complete="handleReviewCompleted"
    />

    <!-- 相似度报告对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="查重报告详情"
      :width="reportFullscreen ? undefined : '90%'"
      class="report-dialog"
      :fullscreen="reportFullscreen"
      append-to-body
    >
      <PlagiarismReportViewer
        v-if="currentPaperId"
        :paper-id="currentPaperId"
        @close="reportDialogVisible = false"
        @approve="handleReportApprove"
        @revision="handleReportRevision"
      />

      <template #footer>
        <div class="dialog-footer">
          <el-button aria-label="切换全屏显示" @click="toggleReportFullscreen">
            <el-icon><FullScreen /></el-icon>
            {{ reportFullscreen ? '退出全屏' : '全屏查看' }}
          </el-button>
          <el-button @click="reportDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 论文预览对话框（内部自理加载/降级/重试） -->
    <PaperPreviewDialog ref="previewDialogRef" />

    <!-- 查重报告签核对话框（P5）：本列表均为查重完成（auditing）论文，签核成功后刷新 -->
    <CheckSignoffDialog ref="signoffDialogRef" @success="refreshList" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { Refresh, FullScreen } from '@element-plus/icons-vue'
import { sendReminder } from '@/api/teacher.js'
import ReviewDialog from '@/views/teacher/ReviewDialog.vue'
import PlagiarismReportViewer from '@/views/teacher/PlagiarismReportViewer.vue'
import PendingStats from '@/views/teacher/components/PendingStats.vue'
import PendingFilterBar from '@/views/teacher/components/PendingFilterBar.vue'
import PendingPaperTable from '@/views/teacher/components/PendingPaperTable.vue'
import PaperPreviewDialog from '@/views/teacher/components/PaperPreviewDialog.vue'
import CheckSignoffDialog from '@/views/teacher/components/CheckSignoffDialog.vue'
import { usePendingPapers } from '@/composables/usePendingPapers.js'

// 表格组件引用（须在 usePendingPapers 之前声明，供 onLoaded 回调清空跨页勾选）
const pendingTableRef = ref(null)
const previewDialogRef = ref(null)
const signoffDialogRef = ref(null)

// ── 列表 / 筛选 / 排序 / 分页 / 统计（composable）──────────
const {
  loading,
  stats,
  collegeList,
  searchKeyword,
  filterPriority,
  filterCollege,
  filterSimilarity,
  activeQuickFilter,
  anyFilterActive,
  currentPage,
  pageSize,
  filteredPapers,
  pagedPapers,
  overduePapers,
  urgentPapers,
  alertTitle,
  refreshList,
  loadColleges,
  setQuickFilter,
  toggleQuickFilter,
  resetFilters,
  handleSortChange
} = usePendingPapers({
  onLoaded: () => pendingTableRef.value?.clearSelection()
})

// ── 状态条关闭状态（会话内记忆）────────────────────────────
const alertDismissed = ref(sessionStorage.getItem('teacherPendingAlertDismissed') === '1')
const dismissAlert = () => {
  alertDismissed.value = true
  sessionStorage.setItem('teacherPendingAlertDismissed', '1')
}

// 统计卡过滤映射：点击"待审核"清空过滤，点击"紧急"切换过滤
const onStatFilter = (value) => {
  if (value === null) {
    setQuickFilter(null)
  } else {
    toggleQuickFilter(value)
  }
}

// ── 选择与审核 ────────────────────────────────────────────
const selectedPapers = ref([])
const onSelectionChange = (selection) => {
  selectedPapers.value = selection
}

// 审核模式：'single' | 'batch'，显式区分，避免勾选多篇后单篇入口误入批量模式
const reviewMode = ref('single')
const reviewDialogVisible = ref(false)
const currentPaperId = ref(null)

const reviewPaper = (paper) => {
  // 单篇入口始终为单篇模式
  reviewMode.value = 'single'
  currentPaperId.value = paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null
  reviewDialogVisible.value = true
}

const batchReview = async () => {
  if (selectedPapers.value.length === 0) {
    ElMessage.warning('请先选择要审核的论文')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量审核 ${selectedPapers.value.length} 篇论文吗？`,
      '批量审核',
      { type: 'warning', confirmButtonText: '开始审核', cancelButtonText: '取消' }
    )
    reviewMode.value = 'batch'
    currentPaperId.value = selectedPapers.value[0]?.paperId || selectedPapers.value[0]?.id || null
    reviewDialogVisible.value = true
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核操作失败:', error)
      ElMessage.error('批量审核操作失败，请重试')
    }
  }
}

const batchRemind = async () => {
  if (selectedPapers.value.length === 0) {
    ElMessage.warning('请先选择要提醒的论文')
    return
  }

  try {
    const names = selectedPapers.value.map(p => p.studentName).join(', ')
    await ElMessageBox.confirm(
      `确定要批量提醒 ${selectedPapers.value.length} 位学生吗？\n${names}`,
      '批量提醒',
      {
        type: 'info',
        confirmButtonText: '发送提醒',
        cancelButtonText: '取消'
      }
    )

    const response = await sendReminder({
      studentIds: selectedPapers.value.map(p => p.studentId || p.studentNo || ''),
      message: '请及时处理您的论文审核反馈',
      paperIds: selectedPapers.value.map(p => p.paperId || p.paperBaseInfo?.paperId || p.id || null)
    })

    if (response?.code === 200) {
      ElMessage.success(`${response.message || '已向'} ${selectedPapers.value.length} 位学生发送提醒`)
      pendingTableRef.value?.clearSelection()
    } else {
      ElMessage.error(response?.message || '批量提醒发送失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量提醒失败:', error)
      ElMessage.error('批量提醒发送失败，请重试')
    }
  }
}

const handleReviewCompleted = async (reviewResult) => {
  try {
    // 刷新列表并关闭对话框（onLoaded 回调已清空跨页勾选）
    await refreshList()
    reviewDialogVisible.value = false
    reviewMode.value = 'single'
  } catch (error) {
    console.error('审核操作失败:', error)
    ElMessage.error('审核操作失败，请重试')
  }
}

// ── 预览 / 查重报告弹窗 ───────────────────────────────────
const onViewPaper = (paper) => {
  previewDialogRef.value?.open(paper)
}

const reportDialogVisible = ref(false)
const reportFullscreen = ref(false)

const viewSimilarityReport = (paper) => {
  currentPaperId.value = paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null
  reportDialogVisible.value = true
}

// ── 查重报告签核（P5）─────────────────────────────────────
const onSignoff = (paper) => {
  signoffDialogRef.value?.open({
    paperId: paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null,
    paperTitle: paper.paperTitle,
    studentName: paper.studentName
  })
}

const toggleReportFullscreen = () => {
  reportFullscreen.value = !reportFullscreen.value

  // 强制重新计算布局
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}

const handleReportApprove = () => {
  ElMessage.success('论文审核已通过')
  reportDialogVisible.value = false
  refreshList()
}

const handleReportRevision = () => {
  ElMessage.success('修改要求已发送')
  reportDialogVisible.value = false
  refreshList()
}

onMounted(async () => {
  await Promise.all([refreshList(), loadColleges()])
})
</script>

<style scoped>
.teacher-pending {
  min-height: 100vh;
  background: var(--apple-canvas-parchment);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

/* ── 状态提醒条 ───────────────────────────────────── */
.urgent-alert {
  margin-bottom: 16px;
  border-radius: var(--apple-rounded-md);
  border-left: none;
}

:deep(.urgent-alert .el-alert__content) {
  font-size: 0.8125rem;
  align-items: center;
}

:deep(.urgent-alert .el-alert__action) {
  display: flex;
  gap: 8px;
}
</style>
