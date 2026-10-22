<template>
  <div class="teacher-review">
    <!-- 页面头部 -->
    <PageHeader description="查看您审核过的论文记录">
      <template #actions>
        <el-button type="primary" :icon="Refresh" @click="refreshData">
          刷新数据
        </el-button>
      </template>
    </PageHeader>

    <ListPageShell
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      title="审核记录列表"
      :icon="List"
      :total="total"
      show-total
      total-suffix="条记录"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange"
    >
      <template #filters>
        <el-form :model="filterForm" label-width="auto">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="学生姓名">
                <el-input 
                  v-model="filterForm.studentName" 
                  placeholder="请输入学生姓名" 
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="论文标题">
                <el-input 
                  v-model="filterForm.paperTitle" 
                  placeholder="请输入论文标题" 
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="审核状态">
                <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="审核通过" :value="REVIEW_RESULT.PASS" />
                  <el-option label="退回修改" :value="REVIEW_RESULT.REJECT" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="审核时间">
                <el-date-picker
                  v-model="filterForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="相似度">
                <el-select v-model="filterForm.similarityRange" placeholder="全部范围" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="0-10%" value="0-10" />
                  <el-option label="10-20%" value="10-20" />
                  <el-option label="20-30%" value="20-30" />
                  <el-option label="30%以上" value="30-100" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8" :lg="12">
              <div class="filter-actions">
                <el-button type="primary" :icon="Search" @click="handleSearch">
                  查询
                </el-button>
                <el-button :icon="RefreshRight" @click="resetFilter">
                  重置
                </el-button>
                <el-button type="success" :icon="Download" @click="exportData">
                  导出
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </template>

      <el-table 
        :data="reviewData" 
        stripe 
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="studentName" label="学生信息" min-width="200">
          <template #default="{ row }">
            <div class="student-info">
              <div class="student-name">{{ row.paperBaseInfo?.studentName  }}</div>
              <div class="student-meta">
                <el-tag size="small" type="info">{{ row.paperBaseInfo?.studentNo }}</el-tag>
                <span class="college">{{ row.paperBaseInfo?.college }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="paperTitle" label="论文信息" min-width="250">
          <template #default="{ row }">
            <div class="paper-info">
              <div class="paper-title">{{  row.paperBaseInfo?.paperTitle }}</div>
              <div class="paper-meta">
                <span class="version">V{{ row.version || row.paperBaseInfo?.version || row.paperBaseInfo?.paperVersion || 1 }}</span>
                <span class="submit-time">{{ formatDateTime(row.submitTime, 'YYYY-MM-DD HH:mm:ss') }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="similarity" label="相似度" width="120" sortable>
          <template #default="{ row }">
            <div class="similarity-cell">
              <el-progress 
                :percentage="row.similarity || row.paperBaseInfo?.similarity || row.paperBaseInfo?.similarityRate || row.similarityRate || 0" 
                :stroke-width="6" 
                :show-text="false"
                :color="getSimilarityColor(row.similarity || row.paperBaseInfo?.similarity || row.paperBaseInfo?.similarityRate || row.similarityRate || 0)"
                class="similarity-progress"
              />
              <span class="similarity-value" :class="getSimilarityClass(row.similarity || row.paperBaseInfo?.similarity || row.paperBaseInfo?.similarityRate || row.similarityRate || 0)">
                {{ (row.similarity || row.paperBaseInfo?.similarity || row.paperBaseInfo?.similarityRate || row.similarityRate || 0) }}%
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="审核状态" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="getReviewResultTagType(rowReviewStatus(row))" size="small">
              {{ getReviewResultText(rowReviewStatus(row), '未知') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="reviewTime" label="审核时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.reviewOperateInfo?.reviewTime , 'YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>

        <el-table-column prop="reviewDuration" label="审核时长" width="100" sortable>
          <template #default="{ row }">
            {{ (row.reviewDuration || row.reviewOperateInfo?.reviewDuration || 0) + '分钟' }}
          </template>
        </el-table-column>

        <el-table-column prop="feedback" label="审核意见" min-width="150">
          <template #default="{ row }">
            <div class="feedback-text" :title="row.feedback || row.reviewOpinion || row.reviewOperateInfo?.reviewOpinion || row.reviewOpinion?.opinion || row.reviewOpinion?.reviewOpinion || ''">
              {{ row.feedback || row.reviewOpinion || row.reviewOperateInfo?.reviewOpinion || row.reviewOpinion?.opinion || row.reviewOpinion?.reviewOpinion || '无意见' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small" 
                :icon="View" 
                @click="viewPaperDetail(row)"
              >
                查看
              </el-button>
              <el-dropdown @command="handleMoreAction(row, $event)">
                <el-button size="small">
                  更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="reAudit">重新审核</el-dropdown-item>
                    <el-dropdown-item command="download">下载论文</el-dropdown-item>
                    <el-dropdown-item command="contact">联系学生</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </ListPageShell>

    <!-- 论文详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="论文详情"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <PaperDetail :paper-id="currentPaperId" @close="detailDialogVisible = false" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import ListPageShell from '@/components/common/ListPageShell.vue'
import PaperDetail from '@/views/student/PaperDetail.vue'
import { getReviewedList, downloadPaper, contactStudent, exportReviewRecords } from '@/api/teacher.js'
import { getReviewResultText, getReviewResultTagType, getSimilarityColor, getSimilarityClass, REVIEW_RESULT } from '@/utils/reviewStatus.js'
import { formatDateTime } from '@/utils/dataType.js'
import {
  Refresh,
  Search,
  RefreshRight,
  Download,
  List,
  View,
  ArrowDown
} from '@element-plus/icons-vue'

// 筛选表单
const filterForm = reactive({
  studentName: '',
  paperTitle: '',
  status: '',
  dateRange: [],
  similarityRange: ''
})

// 表格数据
const reviewData = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

// 对话框
const detailDialogVisible = ref(false)
const currentPaperId = ref(null)

// 审核结果字段在不同接口层级出现过，统一取第一个非空值
const rowReviewStatus = (row) =>
  row.reviewStatus ?? row.reviewOperateInfo?.reviewStatus ?? row.reviewOpinion?.reviewStatus ?? row.status

// 事件处理
const handleSearch = () => {
  currentPage.value = 1
  fetchReviewData()
}

const resetFilter = () => {
  Object.keys(filterForm).forEach(key => {
    if (Array.isArray(filterForm[key])) {
      filterForm[key] = []
    } else {
      filterForm[key] = ''
    }
  })
  handleSearch()
}

const refreshData = () => {
  fetchReviewData()
}

const exportData = async () => {
  if (reviewData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  try {
    ElMessage.info('正在导出审核记录...')
    const params = {
      studentName: filterForm.studentName || undefined,
      paperTitle: filterForm.paperTitle || undefined
    }
    const res = await exportReviewRecords(params)
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `审核记录_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('审核记录导出成功')
  } catch (error) {
    console.error('导出审核记录失败:', error)
    ElMessage.error(error.message || '导出审核记录失败')
  }
}

const fetchReviewData = async () => {
  loading.value = true
  try {
    // 构造查询参数
    const queryParams = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      studentName: filterForm.studentName,
      paperTitle: filterForm.paperTitle,
      reviewStatus: filterForm.status,
      startTime: filterForm.dateRange && filterForm.dateRange.length > 0 ? filterForm.dateRange[0] : undefined,
      endTime: filterForm.dateRange && filterForm.dateRange.length > 1 ? filterForm.dateRange[1] : undefined,
      similarityRange: filterForm.similarityRange
    }
    
    // 过滤掉空值参数
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === '' || queryParams[key] === undefined || 
          (Array.isArray(queryParams[key]) && queryParams[key].length === 0)) {
        delete queryParams[key]
      }
    })
    
    const response = await getReviewedList(queryParams)
    
    // 确保响应数据结构正确
    if (response && response.data) {
      reviewData.value = Array.isArray(response.data.records) ? response.data.records : []
      total.value = response.data.total || 0
    } else {
      reviewData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取审核记录失败:', error)
    ElMessage.error('获取审核记录失败，请重试')
    reviewData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const viewPaperDetail = (row) => {
  // 兼容不同字段名的ID
  currentPaperId.value = row.paperId || row.paperBaseInfo?.paperId || row.id || row.paperBaseInfo?.id
  detailDialogVisible.value = true
}

const handleMoreAction = async (row, command) => {
  const paperId = row.paperId || row.paperBaseInfo?.paperId
  switch (command) {
    case 'reAudit':
      ElMessageBox.confirm('确定要重新审核这篇论文吗？', '重新审核', {
        type: 'warning'
      }).then(() => {
        ElMessage.success('已提交重新审核请求')
      })
      break
    case 'download':
      if (!paperId) {
        ElMessage.error('无法获取论文ID')
        return
      }
      try {
        const res = await downloadPaper(paperId)
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data])
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `论文_${paperId}.docx`
        link.click()
        window.URL.revokeObjectURL(url)
        ElMessage.success('论文下载成功')
      } catch (error) {
        console.error('下载论文失败:', error)
        ElMessage.error('下载论文失败，请稍后重试')
      }
      break
    case 'contact':
      if (!paperId) {
        ElMessage.error('无法获取论文信息')
        return
      }
      {
        const studentId = row.studentId || row.studentBaseInfo?.studentId || row.paperBaseInfo?.studentId
        try {
          const { value: content } = await ElMessageBox.prompt('请输入要发送给学生的消息', '联系学生', {
            inputType: 'textarea',
            confirmButtonText: '发送',
            cancelButtonText: '取消'
          })
          if (content) {
            const res = await contactStudent({
              paperId: String(paperId),
              ...(studentId ? { studentId: String(studentId) } : {}),
              message: content,
              messageType: 'chat'
            })
            if (res.code === 200) {
              ElMessage.success('消息已发送给学生')
            } else {
              ElMessage.error(res.message || '发送失败')
            }
          }
        } catch (error) {
          if (error !== 'cancel') {
            console.error('联系学生失败:', error)
            ElMessage.error('发送消息失败，请稍后重试')
          }
        }
      }
      break
  }
}

const handleSortChange = ({ prop, order }) => {
  fetchReviewData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchReviewData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchReviewData()
}

onMounted(() => {
  fetchReviewData()
})
</script>

<style scoped>
.teacher-review {
  min-height: 100vh;
  background: var(--apple-canvas-parchment);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.filter-card {
  margin-bottom: 16px;
}

.filter-content {
  padding: 0;
}

.filter-actions {
  display: flex;
  gap: 12px;
  padding-top: 4px;
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 400;
  color: var(--apple-ink);
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name {
  font-weight: 600;
  color: var(--apple-ink);
}

.student-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.college {
  color: var(--apple-ink-muted-48);
}

.paper-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.paper-title {
  font-weight: 600;
  color: var(--apple-ink);
  line-height: 1.4;
}

.paper-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--apple-ink-muted-48);
}

.version {
  background-color: var(--apple-canvas-parchment);
  padding: 2px 6px;
  border-radius: var(--apple-rounded-xs);
}

.similarity-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.similarity-progress {
  flex: 1;
  min-width: 60px;
}

.similarity-value {
  min-width: 45px;
  text-align: right;
  font-size: 17px;
  font-weight: 400;
}

/* 与 getSimilarityClass 返回的类名对应 */
.similarity-low {
  color: var(--apple-success);
}

.similarity-medium {
  color: var(--apple-warning);
}

.similarity-high {
  color: var(--apple-danger);
}

.feedback-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .teacher-review {
    padding: 12px;
  }
  
  .header-right {
    display: flex;
    justify-content: center;
  }
  
  .filter-actions {
    flex-wrap: wrap;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .pagination-wrapper {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .student-meta,
  .paper-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .similarity-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .similarity-progress {
    width: 100%;
  }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.teacher-review {
  font-family: var(--apple-font-text);
}

.filter-card {
  margin-bottom: var(--apple-spacing-md);
}

.filter-card :deep(.el-input__wrapper),
.filter-card :deep(.el-select__wrapper),
.filter-card :deep(.el-range-editor.el-input__wrapper) {
  border-radius: var(--apple-rounded-md);
  font-size: var(--apple-fs-caption);
}

.filter-card :deep(.el-form-item__label) {
  font-size: var(--apple-fs-fine-print);
  font-weight: 600;
}

.filter-actions {
  gap: var(--apple-spacing-sm);
  padding-top: var(--apple-spacing-xxs);
}

.data-card {
  margin-bottom: var(--apple-spacing-md);
}

.card-header .header-left {
  gap: var(--apple-spacing-xs);
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-body-strong);
  font-weight: 600;
}

.student-info,
.paper-info {
  gap: var(--apple-spacing-xxs);
}

.student-meta {
  gap: var(--apple-spacing-xs);
  font-size: var(--apple-fs-fine-print);
}

.paper-meta {
  gap: var(--apple-spacing-sm);
  font-size: var(--apple-fs-fine-print);
}

.version {
  padding: 2px var(--apple-spacing-xxs);
}

.similarity-cell {
  gap: var(--apple-spacing-xs);
}

.similarity-value {
  font-size: var(--apple-fs-body-strong);
}

.action-buttons {
  gap: var(--apple-spacing-xs);
}

.pagination-wrapper {
  padding-top: var(--apple-spacing-md);
}

@media (max-width: 768px) {
  .filter-actions {
    gap: var(--apple-spacing-xs);
  }

  .card-header {
    gap: var(--apple-spacing-sm);
  }

  .action-buttons {
    gap: var(--apple-spacing-xxs);
  }
}
</style>