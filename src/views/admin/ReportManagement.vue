<template>
  <div class="admin-report-management">
    <!-- 页面头部 -->
    <PageHeader>
      <template #actions>
        <el-button text :icon="ArrowLeft" @click="goBack">返回</el-button>
        <el-button type="primary" @click="batchExport">
          <el-icon><Download /></el-icon>批量导出
        </el-button>
        <el-button @click="refreshList">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </template>
    </PageHeader>

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

    <ListPageShell
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      title="报告列表"
      :icon="Document"
      :total="total"
      show-total
      total-suffix="条"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange"
    >
      <template #filters>
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
            <el-option label="待查重" value="pending" />
            <el-option label="查重中" value="checking" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failure" />
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
      </template>

      <template #header-extra>
        <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
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
              {{ getStatusLabel(row.status) }}
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
    </ListPageShell>

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
                    {{ getStatusLabel(selectedReport?.status) }}
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
                    <div class="percentage">{{ formatPercent(selectedReport?.similarity) }}</div>
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
                  相似度: {{ formatPercent(source.similarity) }}
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
  Check, ArrowLeft
} from '@element-plus/icons-vue'
import { getReportList, getReportStats, getReportDetail, batchExportReports } from '@/api/admin/reports'
import { getSimilarityColor, getSimilarityTagType, getSimilarityLabel as getSimilarityRating } from '@/utils/similarity.js'
import { formatPercent } from '@/utils/dataType.js'
import { getCheckStatusText as getStatusLabel, getCheckStatusType as getStatusTagType } from '@/utils/checkStatus.js'
import PageHeader from '@/components/common/PageHeader.vue'
import ListPageShell from '@/components/common/ListPageShell.vue'

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

// 查重状态词表与后端 check_task.check_status 统一走 utils/checkStatus.js，
// 不要复用 reviewStatus.js 的 getStatusText（那是 PaperStatusEnum，词表不同）

// 构造列表与统计共用的查询参数（两者口径必须一致）
const buildQueryParams = () => {
  const params = {
    page: currentPage.value,
    size: pageSize.value,
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

  return params
}

// 统计卡片改为由后端 /stats 返回，避免只看当前页的偏差
const loadReportStats = async (params) => {
  try {
    const response = await getReportStats(params)
    if (response.code === 200) {
      const stats = response.data || {}
      totalReports.value = Number(stats.totalReports) || 0
      completedReports.value = Number(stats.completedReports) || 0
      averageSimilarity.value = Number(stats.averageSimilarity) || 0
      highRiskReports.value = Number(stats.highRiskReports) || 0
    }
  } catch (error) {
    console.error('获取报告统计失败:', error)
  }
}

const loadReportList = async () => {
  loading.value = true
  try {
    const params = buildQueryParams()
    const response = await getReportList(params)

    if (response.code === 200) {
      const data = response.data
      reportList.value = data.records || []
      total.value = Number(data.total) || 0
    } else {
      ElMessage.error(response.message || '获取报告列表失败')
      reportList.value = []
      total.value = 0
    }

    // 统计卡片与列表用同一组筛选条件，保证两者口径一致
    await loadReportStats(params)
  } catch (error) {
    console.error('获取报告列表失败:', error)
    ElMessage.error('获取报告列表失败')
    reportList.value = []
    total.value = 0
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
  background-color: var(--apple-canvas-parchment);
  min-height: 100vh;
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
  border-color: var(--apple-ink-secondary);
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
  color: var(--apple-primary);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--apple-ink-secondary);
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
  color: var(--apple-ink);
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
  color: var(--apple-ink);
}

.rating {
  font-size: 14px;
  color: var(--apple-ink-secondary);
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
  background: var(--apple-canvas-parchment);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--apple-surface-chip-translucent);
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
  color: var(--apple-ink);
  flex: 1;
  margin-right: 20px;
}

.source-meta {
  margin-bottom: 16px;
  color: var(--apple-ink-secondary);
  font-size: 14px;
}

.matched-paragraphs {
  margin-top: 16px;
}

.matched-paragraphs h5 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--apple-ink);
}

.paragraph-item {
  background: var(--apple-surface);
  border-radius: 11px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid var(--apple-primary);
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
  color: var(--apple-danger);
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

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.admin-report-management {
  padding: var(--apple-spacing-lg);
  font-family: var(--apple-font-text);
}

.report-list-card {
  margin-bottom: var(--apple-spacing-md);
  border-radius: var(--apple-rounded-lg);
}

.search-form {
  gap: var(--apple-spacing-md);
}

.stat-card {
  border-radius: var(--apple-rounded-lg);
}

.stat-item {
  padding: var(--apple-spacing-md);
}

.stat-value {
  margin-bottom: var(--apple-spacing-xs);
  font-size: var(--apple-fs-display-md);
}

.stat-label {
  font-size: var(--apple-fs-caption);
}

.card-header {
  gap: var(--apple-spacing-sm);
  font-size: var(--apple-fs-body-strong);
  font-family: var(--apple-font-display);
}

.report-detail,
.similarity-overview,
.similar-sources {
  padding: var(--apple-spacing-md);
}

.similarity-value {
  margin-bottom: var(--apple-spacing-md);
}

.percentage {
  font-size: var(--apple-fs-lead-airy);
}

.rating {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-caption);
}

.similarity-stats {
  margin-top: var(--apple-spacing-md);
}

.source-item {
  padding: var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-md);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
}

.source-header {
  margin-bottom: var(--apple-spacing-md);
}

.source-header h4 {
  margin-right: var(--apple-spacing-md);
  font-size: var(--apple-fs-body-strong);
  font-family: var(--apple-font-display);
}

.source-meta {
  margin-bottom: var(--apple-spacing-md);
  font-size: var(--apple-fs-caption);
}

.matched-paragraphs {
  margin-top: var(--apple-spacing-md);
}

.matched-paragraphs h5 {
  margin-bottom: var(--apple-spacing-sm);
  font-size: var(--apple-fs-caption);
}

.paragraph-item {
  padding: var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-sm);
  border-radius: var(--apple-rounded-md);
}

.source-text,
.paper-text {
  margin-bottom: var(--apple-spacing-xs);
  font-size: var(--apple-fs-caption);
}

.match-similarity {
  font-size: var(--apple-fs-caption);
}

.empty-sources {
  padding: var(--apple-spacing-xl) var(--apple-spacing-md);
}

@media (max-width: 768px) {
  .admin-report-management {
    padding: var(--apple-spacing-sm);
  }

  .stat-card {
    margin-bottom: var(--apple-spacing-sm);
  }

  .source-header {
    gap: var(--apple-spacing-xs);
  }
}
</style>
