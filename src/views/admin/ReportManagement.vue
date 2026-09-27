<template>
  <div class="admin-report-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-title">报告管理</span>
        </template>
        <template #extra>
          <div class="header-actions">
            <el-button type="primary" @click="batchExport">
              <el-icon><Download /></el-icon>批量导出
            </el-button>
            <el-button @click="refreshList">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </template>
      </el-page-header>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="论文标题">
          <el-input v-model="searchForm.paperTitle" placeholder="输入论文标题" clearable />
        </el-form-item>
        <el-form-item label="学生姓名">
          <el-input v-model="searchForm.studentName" placeholder="输入学生姓名" clearable />
        </el-form-item>
        <el-form-item label="查重状态">
          <el-select v-model="searchForm.checkStatus" placeholder="选择查重状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="已完成" value="completed" />
            <el-option label="处理中" value="processing" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="相似度范围">
          <el-select v-model="searchForm.similarityRange" placeholder="选择相似度范围" clearable>
            <el-option label="全部" value="" />
            <el-option label="0-15%" value="0-15" />
            <el-option label="15-30%" value="15-30" />
            <el-option label="30%以上" value="30+" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="20" style="margin: 20px 0;">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ totalReports }}</div>
            <div class="stat-label">总报告数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ completedReports }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ averageSimilarity.toFixed(2) }}%</div>
            <div class="stat-label">平均相似度</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ highRiskReports }}</div>
            <div class="stat-label">高风险报告</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 报告列表 -->
    <el-card class="report-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
          <span style="margin-left: 20px;">报告列表</span>
          <span style="margin-left: 10px; color: #86868b;">(共 {{ total }} 条)</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="reportList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="reportNo" label="报告编号" width="180" />
        <el-table-column prop="paperTitle" label="论文标题" min-width="200">
          <template #default="{ row }">
            <span class="paper-title">{{ row.paperTitle }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="similarity" label="相似度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSimilarityTagType(row.similarity)">
              {{ row.similarity }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkTime" label="查重时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewReport(row)">
              查看
            </el-button>
            <el-button size="small" @click="exportReport(row)">
              导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 报告详情对话框 -->
    <el-dialog
      v-model="showReportDialog"
      :title="`报告详情 - ${selectedReport?.reportNo}`"
      width="90%"
      top="20px"
    >
      <div class="report-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>报告基本信息</span>
                </div>
              </template>
              <el-form :model="selectedReport" label-width="120px">
                <el-form-item label="报告编号">
                  <span>{{ selectedReport?.reportNo }}</span>
                </el-form-item>
                <el-form-item label="论文标题">
                  <span>{{ selectedReport?.paperTitle }}</span>
                </el-form-item>
                <el-form-item label="学生姓名">
                  <span>{{ selectedReport?.studentName }}</span>
                </el-form-item>
                <el-form-item label="学生ID">
                  <span>{{ selectedReport?.studentId }}</span>
                </el-form-item>
                <el-form-item label="指导教师">
                  <span>{{ selectedReport?.teacherName }}</span>
                </el-form-item>
                <el-form-item label="查重时间">
                  <span>{{ selectedReport?.checkTime }}</span>
                </el-form-item>
                <el-form-item label="状态">
                  <el-tag :type="getStatusTagType(selectedReport?.status)">
                    {{ selectedReport?.status }}
                  </el-tag>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>查重结果</span>
                </div>
              </template>
              <div class="similarity-overview">
                <div class="similarity-value">
                  <el-progress
                    :percentage="selectedReport?.similarity"
                    :stroke-width="20"
                    :color="getSimilarityColor(selectedReport?.similarity)"
                    :show-text="false"
                  />
                  <div class="similarity-text">
                    <div class="percentage">{{ selectedReport?.similarity }}%</div>
                    <div class="rating">{{ getSimilarityRating(selectedReport?.similarity) }}</div>
                  </div>
                </div>
                <div class="similarity-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ selectedReport?.wordCount }}</div>
                    <div class="stat-label">总字数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ selectedReport?.similarWords }}</div>
                    <div class="stat-label">相似字数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ selectedReport?.similarSources }}</div>
                    <div class="stat-label">相似来源</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <el-icon><Search /></el-icon>
              <span>相似来源</span>
            </div>
          </template>
          <div class="similar-sources">
            <div 
              v-for="(source, index) in selectedReport?.similarSourceList" 
              :key="index"
              class="source-item"
            >
              <div class="source-header">
                <h4>{{ source.title }}</h4>
                <el-tag :type="getSimilarityTagType(source.similarity)">
                  相似度: {{ source.similarity }}%
                </el-tag>
              </div>
              <div class="source-meta">
                <span>作者: {{ source.author }}</span>
              </div>
              <div class="matched-paragraphs">
                <h5>匹配段落:</h5>
                <div 
                  v-for="(paragraph, pIndex) in source.matchedParagraphs" 
                  :key="pIndex"
                  class="paragraph-item"
                >
                  <div class="source-text">
                    <strong>原文:</strong> {{ paragraph.sourceText }}
                  </div>
                  <div class="paper-text">
                    <strong>本文:</strong> {{ paragraph.paperText }}
                  </div>
                  <div class="match-similarity">
                    匹配度: {{ paragraph.similarity }}%
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!selectedReport?.similarSourceList || selectedReport.similarSourceList.length === 0" class="empty-sources">
              <el-empty description="暂无相似来源数据" />
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download, Refresh, Search, Document, DataAnalysis,
  Check
} from '@element-plus/icons-vue'
import { getReportList, getReportStats, getReportDetail, batchExportReports } from '@/api/admin/reports'
import { getSimilarityColor } from '@/utils/dataType.js'
import { getSimilarityTagType } from '@/utils/reviewStatus.js'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  paperTitle: '',
  studentName: '',
  checkStatus: '',
  similarityRange: ''
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

// 报告列表
const reportList = ref([])
const selectedReports = ref([])
const selectAll = ref(false)

// 报告详情
const showReportDialog = ref(false)
const selectedReport = ref(null)

// 统计数据
const totalReports = ref(0)
const completedReports = ref(0)
const averageSimilarity = ref(0)
const highRiskReports = ref(0)

// 方法
const goBack = () => {
  router.back()
}

const refreshList = () => {
  loadReportList()
}

const search = () => {
  currentPage.value = 1
  loadReportList()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  currentPage.value = 1
  loadReportList()
}

const handleSelectAll = (val) => {
  if (val) {
    selectedReports.value = [...reportList.value]
  } else {
    selectedReports.value = []
  }
}

const handleSelectionChange = (val) => {
  selectedReports.value = val
  selectAll.value = val.length === reportList.value.length
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadReportList()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  loadReportList()
}

const viewReport = async (report) => {
  try {
    loading.value = true
    const response = await getReportDetail(report.id)
    if (response.code === 200) {
      selectedReport.value = response.data
      showReportDialog.value = true
    } else {
      ElMessage.error(response.message || '获取报告详情失败')
    }
  } catch (error) {
    console.error('获取报告详情失败:', error)
    ElMessage.error('获取报告详情失败')
  } finally {
    loading.value = false
  }
}

const exportReport = (report) => {
  ElMessage.info('正在导出报告...')
  batchExportReports([report.id]).then(res => {
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${report.reportNo}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('报告导出成功')
  }).catch(err => {
    console.error('导出报告失败', err)
    ElMessage.error(err.message || '导出报告失败')
  })
}

const batchExport = () => {
  if (selectedReports.value.length === 0) {
    ElMessage.warning('请选择要导出的报告')
    return
  }
  ElMessage.info(`正在导出 ${selectedReports.value.length} 份报告...`)
  const ids = selectedReports.value.map(r => r.id)
  batchExportReports(ids).then(res => {
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reports_${new Date().toISOString().slice(0, 10)}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('批量导出成功')
  }).catch(err => {
    console.error('批量导出失败', err)
    ElMessage.error(err.message || '批量导出失败')
  })
}

const getSimilarityRating = (similarity) => {
  if (similarity < 15) return '优秀'
  if (similarity < 30) return '良好'
  return '需要修改'
}

const getStatusTagType = (status) => {
  switch (status) {
    case '已完成':
      return 'success'
    case '处理中':
      return 'warning'
    case '失败':
      return 'danger'
    default:
      return 'info'
  }
}

const loadReportList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      paperTitle: searchForm.paperTitle || null,
      studentName: searchForm.studentName || null,
      checkStatus: searchForm.checkStatus || null
    }

    // 添加相似度范围筛选
    if (searchForm.similarityRange) {
      switch (searchForm.similarityRange) {
        case '0-15':
          params.minSimilarity = 0
          params.maxSimilarity = 15
          break
        case '15-30':
          params.minSimilarity = 15
          params.maxSimilarity = 30
          break
        case '30+':
          params.minSimilarity = 30
          params.maxSimilarity = 100
          break
      }
    }

    const response = await getReportList(params)

    if (response.code === 200) {
      const data = response.data
      reportList.value = data.records || []
      total.value = Number(data.total) || 0
      totalReports.value = total.value
      completedReports.value = reportList.value.filter(r => r.status === '已完成').length
      const sum = reportList.value.reduce((acc, r) => acc + (r.similarity || 0), 0)
      averageSimilarity.value = reportList.value.length > 0 ? sum / reportList.value.length : 0
      highRiskReports.value = reportList.value.filter(r => r.similarity > 30).length
    } else {
      ElMessage.error(response.message || '获取报告列表失败')
      reportList.value = []
    }
  } catch (error) {
    console.error('获取报告列表失败:', error)
    ElMessage.error('获取报告列表失败')
    reportList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReportList()
})
</script>

<style scoped>
.admin-report-management {
  padding: 20px;
  background-color: #f5f5f7;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 18px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card {
  border-radius: 18px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: #86868b;
}

.stat-card:active {
  transform: scale(0.95);
  transition: transform 0.15s ease;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #0066cc;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #86868b;
}

.report-list-card {
  border-radius: 18px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #1d1d1f;
  font-size: 16px;
}

.paper-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.report-detail {
  padding: 20px;
}

.similarity-overview {
  text-align: center;
  padding: 20px;
}

.similarity-value {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.similarity-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.percentage {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
}

.rating {
  font-size: 14px;
  color: #86868b;
  margin-top: 4px;
}

.similarity-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.similar-sources {
  padding: 20px;
}

.source-item {
  background: #f5f5f7;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #d2d2d7;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.source-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  flex: 1;
  margin-right: 20px;
}

.source-meta {
  margin-bottom: 16px;
  color: #86868b;
  font-size: 14px;
}

.matched-paragraphs {
  margin-top: 16px;
}

.matched-paragraphs h5 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.paragraph-item {
  background: #ffffff;
  border-radius: 11px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid #0066cc;
}

.source-text,
.paper-text {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.match-similarity {
  text-align: right;
  font-size: 14px;
  color: #ef4444;
  font-weight: 600;
}

.empty-sources {
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .admin-report-management {
    padding: 16px;
  }
  
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stat-card {
    margin-bottom: 16px;
  }
  
  .source-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
