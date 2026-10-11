<template>
  <el-card class="list-card console-card" shadow="never">
    <el-table
      ref="tableRef"
      :data="papers"
      row-key="paperId"
      class="pending-table"
      row-class-name="table-row"
      v-loading="loading"
      :default-sort="{ prop: 'submitTime', order: 'descending' }"
      @selection-change="$emit('selection-change', $event)"
      @sort-change="$emit('sort-change', $event)"
    >
      <el-table-column type="selection" width="50" reserve-selection />

      <el-table-column label="优先级" width="72">
        <template #default="{ row }">
          <PriorityBadge :priority="row.priority" />
        </template>
      </el-table-column>

      <el-table-column prop="studentName" label="学生信息" min-width="170">
        <template #default="{ row }">
          <div class="cell-student">
            <div class="student-line1">
              <span class="student-name">{{ row.studentName }}</span>
              <el-tag size="small" type="info" effect="plain">{{ row.studentId }}</el-tag>
            </div>
            <el-tooltip :content="row.email ? `邮箱：${row.email}` : '邮箱未填写'" placement="top">
              <div class="student-line2">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ row.college }}</span>
              </div>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        prop="submitTime"
        label="论文信息"
        min-width="240"
        sortable="custom"
      >
        <template #default="{ row }">
          <div class="cell-paper">
            <el-tooltip :content="row.paperTitle" placement="top" :disabled="!row.paperTitle">
              <div class="paper-title">{{ row.paperTitle }}</div>
            </el-tooltip>
            <div class="paper-meta">
              <span>V{{ row.version }}</span>
              <span class="meta-dot">·</span>
              <span>{{ formatDateTime(row.submitTime, 'YYYY-MM-DD HH:mm') }}</span>
              <span class="meta-dot">·</span>
              <span>{{ row.wordCount ? `${row.wordCount}字` : '字数未知' }}</span>
              <span class="meta-dot">·</span>
              <span>{{ row.pageCount ? `${row.pageCount}页` : '页数未知' }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="similarity" label="查重结果" width="150">
        <template #default="{ row }">
          <div class="cell-similarity">
            <div class="sim-line1">
              <span class="sim-percent" :class="getSimilarityClass(row.similarity)">
                {{ row.similarity }}%
              </span>
              <el-tag :type="getSimilarityTagType(row.similarity)" size="small" effect="dark">
                {{ getSimilarityLevel(row.similarity) }}
              </el-tag>
            </div>
            <el-progress
              :percentage="row.similarity"
              :stroke-width="8"
              :color="getSimilarityColor(row.similarity)"
              :show-text="false"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="waitingTime" label="等待" width="90" sortable="custom" align="center">
        <template #default="{ row }">
          <span class="waiting-time" :class="getWaitingTimeClass(row.waitingTime)">
            {{ row.waitingTime }}天
          </span>
        </template>
      </el-table-column>

      <el-table-column prop="deadline" label="截止时间" width="140" align="center">
        <template #default="{ row }">
          <div class="deadline-cell">
            <div>{{ formatDateTime(row.deadline, 'YYYY-MM-DD HH:mm') }}</div>
            <div v-if="isOverdue(row)" class="deadline-overdue">
              <el-icon><Warning /></el-icon>
              <span>已超时</span>
            </div>
            <div v-else-if="isUrgent(row)" class="deadline-warning">
              <el-icon><Warning /></el-icon>
              <span>即将超时</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <div class="cell-actions">
            <el-button type="primary" size="small" :icon="View" @click.stop="$emit('review', row)">
              审核
            </el-button>
            <el-dropdown trigger="click" @command="handleMoreAction(row, $event)">
              <el-button size="small" aria-label="更多操作">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="contact" :icon="ChatDotRound">
                    联系学生
                  </el-dropdown-item>
                  <el-dropdown-item command="viewPaper" :icon="View">
                    查看原文
                  </el-dropdown-item>
                  <el-dropdown-item command="download" :icon="Download">
                    下载论文
                  </el-dropdown-item>
                  <el-dropdown-item command="viewReport" :icon="Document">
                    查看查重报告
                  </el-dropdown-item>
                  <el-dropdown-item command="remind" :icon="Bell" divided>
                    提醒学生
                  </el-dropdown-item>
                  <el-dropdown-item command="delegate" :icon="User">
                    委托审核
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.similarity > 30"
                    command="recheck"
                    :icon="Refresh"
                    divided
                  >
                    重新检测
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>

      <template #empty>
        <div class="table-empty">
          <el-icon :size="48"><DocumentChecked /></el-icon>
          <p>{{ anyFilterActive ? '没有符合筛选条件的论文' : '暂无待审核论文' }}</p>
          <el-button v-if="anyFilterActive" type="primary" size="small" @click="$emit('reset-filters')">
            清空筛选
          </el-button>
          <el-button v-else type="primary" size="small" @click="$emit('refresh')">
            刷新查看
          </el-button>
        </div>
      </template>
    </el-table>

    <!-- 底栏：批量操作 + 分页 -->
    <div class="table-footer">
      <div v-if="selectedCount > 0" class="batch-bar">
        <span class="batch-summary">已选择 {{ selectedCount }} 篇（跨页保留）</span>
        <el-button type="primary" size="small" @click="$emit('batch-review')">
          批量审核
        </el-button>
        <el-button type="warning" size="small" @click="$emit('batch-remind')">
          批量提醒
        </el-button>
        <el-button size="small" @click="clearSelection">
          取消选择
        </el-button>
      </div>
      <el-pagination
        class="pagination"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @update:current-page="$emit('update:currentPage', $event)"
        @update:page-size="handleSizeChange"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  recheckPlagiarism,
  sendReminder,
  contactStudent as contactStudentApi,
  delegateReview,
  downloadPaper as downloadPaperApi
} from '@/api/teacher.js'
import { saveBlobAs } from '@/utils/download.js'
import { getSimilarityColor, getSimilarityClass, getSimilarityTagType } from '@/utils/reviewStatus.js'
import { formatDateTime } from '@/utils/dataType.js'
import { isOverdue, isUrgent } from '@/composables/usePendingPapers.js'
import PriorityBadge from '@/views/teacher/components/PriorityBadge.vue'
import {
  Bell,
  Warning,
  Refresh,
  Document,
  View,
  ChatDotRound,
  Download,
  User,
  DocumentChecked,
  ArrowDown,
  OfficeBuilding
} from '@element-plus/icons-vue'

defineProps({
  papers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  },
  anyFilterActive: {
    type: Boolean,
    default: false
  },
  selectedCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:currentPage',
  'update:pageSize',
  'selection-change',
  'sort-change',
  'review',
  'view-paper',
  'view-report',
  'batch-review',
  'batch-remind',
  'refresh',
  'reset-filters'
])

const tableRef = ref(null)

const resolvePaperId = (paper) => paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null

const handleSizeChange = (size) => {
  emit('update:pageSize', size)
  emit('update:currentPage', 1)
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

defineExpose({ clearSelection })

// ── 行内"更多"操作（各分支独立方法）────────────────────────
const getSimilarityLevel = (similarity) => {
  if (similarity < 15) return '低风险'
  if (similarity < 30) return '中风险'
  return '高风险'
}

const getWaitingTimeClass = (days) => {
  if (days >= 3) return 'urgent'
  if (days >= 1) return 'high'
  return 'normal'
}

const handleMoreAction = (paper, command) => {
  switch (command) {
    case 'contact':
      contactStudent(paper)
      break
    case 'viewPaper':
      emit('view-paper', paper)
      break
    case 'download':
      downloadRow(paper)
      break
    case 'viewReport':
      emit('view-report', paper)
      break
    case 'remind':
      remindPaper(paper)
      break
    case 'delegate':
      delegatePaper(paper)
      break
    case 'recheck':
      requestRecheck(paper)
      break
  }
}

const contactStudent = async (paper) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入联系内容', `联系学生：${paper.studentName}`, {
      inputType: 'textarea',
      inputPlaceholder: '请输入要传达给学生的信息...',
      confirmButtonText: '发送',
      cancelButtonText: '取消'
    })

    if (value) {
      const response = await contactStudentApi({
        studentId: paper.studentId ?? paper.studentNo ?? '',
        paperId: resolvePaperId(paper),
        message: value,
        messageType: 'chat'
      })

      if (response?.code === 200) {
        ElMessage.success(response.message || '消息已发送')
      } else {
        ElMessage.error(response?.message || '消息发送失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('联系学生失败:', error)
      ElMessage.error('消息发送失败，请重试')
    }
  }
}

const downloadRow = async (paper) => {
  try {
    const paperId = resolvePaperId(paper)
    if (!paperId) {
      ElMessage.error('无法获取论文ID')
      return
    }
    const res = await downloadPaperApi(paperId)
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data])
    saveBlobAs(blob, `论文_${paper.paperTitle || paperId}.docx`)
    ElMessage.success('论文下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

const remindPaper = async (paper) => {
  try {
    await ElMessageBox.confirm(`确定要提醒学生 ${paper.studentName} 吗？`, '提醒学生', {
      type: 'warning'
    })

    const response = await sendReminder({
      studentIds: [paper.studentId ?? paper.studentNo ?? ''],
      message: `请及时处理您的论文《${paper.paperTitle}》的审核反馈`,
      paperIds: [resolvePaperId(paper)]
    })

    if (response?.code === 200) {
      ElMessage.success(response.message || '提醒已发送')
    } else {
      ElMessage.error(response?.message || '提醒发送失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发送提醒失败:', error)
      ElMessage.error('提醒发送失败，请重试')
    }
  }
}

const delegatePaper = async (paper) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入委托原因', '委托审核', {
      inputPlaceholder: '请输入委托原因...',
      confirmButtonText: '确认委托',
      cancelButtonText: '取消'
    })

    if (reason) {
      const paperId = resolvePaperId(paper)
      const res = await delegateReview({
        paperId: String(paperId),
        reason,
        studentId: String(paper.studentId ?? paper.studentNo ?? '')
      })
      if (res?.code === 200) {
        ElMessage.success(res.message || '委托审核请求已提交')
      } else {
        ElMessage.error(res?.message || '委托审核请求提交失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('委托操作失败:', error)
      ElMessage.error('委托操作失败，请重试')
    }
  }
}

const requestRecheck = async (paper) => {
  try {
    await ElMessageBox.confirm(
      `确定要对论文《${paper.paperTitle}》重新进行查重检测吗？这可能需要一些时间。`,
      '重新查重检测',
      {
        type: 'warning',
        confirmButtonText: '确认检测',
        cancelButtonText: '取消'
      }
    )

    const response = await recheckPlagiarism(resolvePaperId(paper))

    if (response?.code === 200) {
      ElMessage.success(response.message || '已提交重新检测请求')
      // 可以轮询检测状态或刷新列表
      setTimeout(() => {
        emit('refresh')
      }, 3000)
    } else {
      ElMessage.error(response?.message || '重新检测请求失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新查重检测失败:', error)
      ElMessage.error('重新检测请求失败，请重试')
    }
  }
}
</script>

<style scoped>
.list-card {
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 0;
  }
}

:deep(.pending-table) {
  .el-table__header th {
    background: var(--apple-canvas-parchment);
    color: var(--apple-ink-muted-48);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--apple-hairline);
  }

  .el-table__row {
    transition: background-color 0.2s ease;

    &:hover > td.el-table__cell {
      background-color: var(--apple-canvas-parchment);
    }

    td.el-table__cell {
      padding: 10px 12px;
      border-bottom: 1px solid var(--apple-divider-soft);
      font-size: 0.8125rem;
      color: var(--apple-ink);
    }
  }
}

/* 学生信息 */
.cell-student {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-line1 {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.student-name {
  font-weight: 600;
  color: var(--apple-ink);
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.student-line2 {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .el-icon {
    font-size: 14px;
    flex-shrink: 0;
  }
}

/* 论文信息 */
.cell-paper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.paper-title {
  font-weight: 600;
  color: var(--apple-ink);
  font-size: 0.8125rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.paper-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);

  .meta-dot {
    color: var(--apple-surface-chip-translucent);
  }
}

/* 查重结果 */
.cell-similarity {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sim-line1 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sim-percent {
  font-size: 1rem;
  font-weight: 700;
  color: var(--apple-ink);

  /* 与 getSimilarityClass 返回的类名对应 */
  &.similarity-high {
    color: var(--apple-danger);
  }

  &.similarity-medium {
    color: var(--apple-warning);
  }

  &.similarity-low {
    color: var(--apple-success);
  }
}

/* 等待 / 截止 */
.waiting-time {
  font-size: 0.8125rem;
  font-weight: 600;

  &.urgent {
    color: var(--apple-danger);
  }

  &.high {
    color: var(--apple-warning);
  }

  &.normal {
    color: var(--apple-success);
  }
}

.deadline-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
}

.deadline-overdue,
.deadline-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  .el-icon {
    font-size: 14px;
  }
}

.deadline-overdue {
  color: var(--apple-danger);
}

.deadline-warning {
  color: var(--apple-warning);
}

/* 操作列 */
.cell-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 底栏：批量 + 分页 */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--apple-hairline);
  background: var(--apple-surface);
}

.batch-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.batch-bar .batch-summary {
  font-size: 0.8125rem;
  color: var(--apple-ink);
  margin-right: 4px;
}

.pagination {
  margin-left: auto;
}

/* 空状态 */
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--apple-ink-muted-48);

  .el-icon {
    color: var(--apple-surface-chip-translucent);
  }

  p {
    margin: 0;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination {
    margin-left: 0;
    justify-content: center;
  }
}
</style>
