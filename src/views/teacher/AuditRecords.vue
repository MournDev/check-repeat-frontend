<template>
  <div class="teacher-review">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">审核记录</h1>
          <p class="page-subtitle">查看您审核过的论文记录</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Refresh" @click="refreshData">
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-content">
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
                  <el-option label="审核通过" :value="3" />
                  <el-option label="未通过" :value="4" />
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
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="data-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><List /></el-icon>
            <span>审核记录列表</span>
          </div>
          <div class="header-right">
            <el-text type="info">共 {{ total }} 条记录</el-text>
          </div>
        </div>
      </template>

      <el-table 
        :data="reviewData" 
        stripe 
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        
        <el-table-column prop="studentName" label="学生信息" width="180">
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

        <el-table-column prop="paperTitle" label="论文信息" min-width="200">
          <template #default="{ row }">
            <div class="paper-info">
              <div class="paper-title">{{  row.paperBaseInfo?.paperTitle }}</div>
              <div class="paper-meta">
                <span class="version">V{{ row.version || row.paperBaseInfo?.version || row.paperBaseInfo?.paperVersion || 1 }}</span>
                <span class="submit-time">{{ formatTime(row.submitTime || row.paperBaseInfo?.submitTime || row.paperBaseInfo?.createTime || row.createTime) }}</span>
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
            <el-tag :type="getStatusType(row.reviewStatus || row.reviewOperateInfo?.reviewStatus || row.reviewOpinion?.reviewStatus || row.status || 0)" size="small">
              {{ getStatusText(row.reviewStatus || row.reviewOperateInfo?.reviewStatus || row.reviewOpinion?.reviewStatus || row.status || '未知') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="reviewTime" label="审核时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatTime(row.reviewOperateInfo?.reviewTime || row.reviewTime || row.reviewOpinion?.reviewTime || row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="reviewDuration" label="审核时长" width="100" sortable>
          <template #default="{ row }">
            {{ row.reviewOperateInfo?.reviewDuration || row.reviewDuration || row.reviewOpinion?.reviewDuration ? (row.reviewOperateInfo?.reviewDuration || row.reviewDuration || row.reviewOpinion?.reviewDuration) + '分钟' : '--' }}
          </template>
        </el-table-column>

        <el-table-column prop="feedback" label="审核意见" min-width="150">
          <template #default="{ row }">
            <div class="feedback-text" :title="row.reviewOpinion || row.reviewOperateInfo?.reviewOpinion || row.reviewOpinion?.opinion || row.reviewOpinion?.reviewOpinion || ''">
              {{ row.reviewOpinion || row.reviewOperateInfo?.reviewOpinion || row.reviewOpinion?.opinion || row.reviewOpinion?.reviewOpinion || '无意见' }}
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

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

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
import PaperDetail from '@/views/student/PaperDetail.vue'
import { getReviewedList } from '@/api/teacher.js'
import { getStatusText, getStatusType } from '@/utils/reviewStatus.js'
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
const total = ref(100)
const loading = ref(false)

// 对话框
const detailDialogVisible = ref(false)
const currentPaperId = ref(null)

// 工具函数
const getSimilarityColor = (similarity) => {
  if (!similarity) return '#909399'
  if (similarity < 15) return '#52c41a'
  if (similarity < 30) return '#faad14'
  return '#ff4d4f'
}

const getSimilarityClass = (similarity) => {
  if (similarity < 15) return 'similarity-low'
  if (similarity < 30) return 'similarity-medium'
  return 'similarity-high'
}

// 使用统一的状态处理工具
// getStatusText 和 getStatusType 已从 '@/utils/reviewStatus.js' 导入

const formatTime = (time) => {
  if (!time) return '--'
  return time.replace(' ', '  ')
}

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

const exportData = () => {
  ElMessage.success('数据导出成功')
}

const fetchReviewData = async () => {
  loading.value = true
  try {
    // 构造查询参数
    const queryParams = {
      current: currentPage.value,
      pageSize: pageSize.value,
      studentName: filterForm.studentName,
      paperTitle: filterForm.paperTitle,
      status: filterForm.status,
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
  currentPaperId.value = row.paperBaseInfo?.paperId 
  detailDialogVisible.value = true
}

const handleMoreAction = (row, command) => {
  switch (command) {
    case 'reAudit':
      ElMessageBox.confirm('确定要重新审核这篇论文吗？', '重新审核', {
        type: 'warning'
      }).then(() => {
        ElMessage.success('已提交重新审核请求')
      })
      break
    case 'download':
      ElMessage.success('开始下载论文文件')
      break
    case 'contact':
      ElMessage.info(`联系学生：${row.studentName || row.studentBaseInfo?.studentName || row.studentBaseInfo?.realName || '未知学生'} (${row.studentId || row.studentBaseInfo?.studentId || row.studentBaseInfo?.studentNo || '未知学号'})`)
      break
  }
}

const handleSortChange = ({ prop, order }) => {
  console.log('排序变化:', prop, order)
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
  padding: 20px;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left .page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-left .page-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #909399;
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
  font-weight: 500;
  color: #303133;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name {
  font-weight: 500;
  color: #303133;
}

.student-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.college {
  color: #909399;
}

.paper-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.paper-title {
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
}

.paper-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.version {
  background-color: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
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
  font-size: 14px;
  font-weight: 500;
}

.similarity-low {
  color: #52c41a;
}

.similarity-medium {
  color: #faad14;
}

.similarity-high {
  color: #ff4d4f;
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
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
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
</style>