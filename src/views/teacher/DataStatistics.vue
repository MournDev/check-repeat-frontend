<template>
  <div class="teacher-dashboard">
    <!-- 页面头部 -->
    <PageHeader description="查看您的论文审核数据和工作统计">
      <template #actions>
        <el-button-group>
          <el-button :type="timeRange === 'week' ? 'primary' : ''" @click="handleTimeRangeChange('week')">
            本周
          </el-button>
          <el-button :type="timeRange === 'month' ? 'primary' : ''" @click="handleTimeRangeChange('month')">
            本月
          </el-button>
          <el-button :type="timeRange === 'quarter' ? 'primary' : ''" @click="handleTimeRangeChange('quarter')">
            本季度
          </el-button>
          <el-button :type="timeRange === 'year' ? 'primary' : ''" @click="handleTimeRangeChange('year')">
            本年
          </el-button>
        </el-button-group>
      </template>
    </PageHeader>

    <!-- 主要统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="never">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: var(--app-color-primary)">
              <el-icon color="white" size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalReviews }}</div>
              <div class="stat-label">总审核数</div>
              <div class="stat-trend" :class="getTrendClass(statTrends.totalReviewsTrend.type)">
                <span class="trend-icon">{{ getTrendIcon(statTrends.totalReviewsTrend.type) }}</span>
                <span>{{ statTrends.totalReviewsTrend.text }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="never">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: var(--app-color-primary)">
              <el-icon color="white" size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.pendingReviews }}</div>
              <div class="stat-label">待审核</div>
              <div class="stat-trend" :class="getTrendClass(getPendingReviewsTrend().type)">
                <span class="trend-icon">{{ getTrendIcon(getPendingReviewsTrend().type) }}</span>
                <span>{{ getPendingReviewsTrend().text }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="never">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: var(--app-color-primary)">
              <el-icon color="white" size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.approvedReviews }}</div>
              <div class="stat-label">已通过</div>
              <div class="stat-trend" :class="getTrendClass(statTrends.approvedReviewsTrend.type)">
                <span class="trend-icon">{{ getTrendIcon(statTrends.approvedReviewsTrend.type) }}</span>
                <span>{{ statTrends.approvedReviewsTrend.text }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="never">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: var(--app-color-primary)">
              <el-icon color="white" size="24"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.currentStudents }}</div>
              <div class="stat-label">指导学生</div>
              <div class="stat-trend" :class="getTrendClass(statTrends.currentStudentsTrend.type)">
                <span class="trend-icon">{{ getTrendIcon(statTrends.currentStudentsTrend.type) }}</span>
                <span>{{ statTrends.currentStudentsTrend.text }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-row">
      <!-- 审核趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>审核趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <el-empty v-if="reviewTrendChart.empty" description="暂无审核趋势数据" :image-size="60" />
            <div v-else :ref="reviewTrendChart.chartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 状态分布图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><PieChart /></el-icon>
              <span>审核状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <el-empty v-if="statusDistributionChart.empty" description="暂无状态分布数据" :image-size="60" />
            <div v-else :ref="statusDistributionChart.chartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 相似度分布图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Histogram /></el-icon>
              <span>论文相似度分布</span>
            </div>
          </template>
          <div class="chart-container">
            <el-empty v-if="similarityChart.empty" description="暂无相似度分布数据" :image-size="60" />
            <div v-else :ref="similarityChart.chartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 学院分布图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><OfficeBuilding /></el-icon>
              <span>学生学院分布</span>
            </div>
          </template>
          <div class="chart-container">
            <el-empty v-if="collegeChart.empty" description="暂无学院分布数据" :image-size="60" />
            <div v-else :ref="collegeChart.chartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="data-table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><List /></el-icon>
            <span>详细统计数据</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Download" @click="exportData">
              导出数据
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="detailData" stripe class="detail-table">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="reviews" label="审核数" width="100" />
        <el-table-column prop="approved" label="通过数" width="100" />
        <el-table-column prop="rejected" label="拒绝数" width="100" />
        <el-table-column prop="modified" label="需修改数" width="120" />
        <el-table-column prop="avgSimilarity" label="平均相似度" width="120">
          <template #default="{ row }">
            <el-tag :type="getSimilarityTagType(row.avgSimilarity)">
              {{ formatPercent(row.avgSimilarity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgProcessingTime" label="平均处理时间(小时)" width="150" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElLoading } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { getSimilarityTagType } from '@/utils/similarity.js'
import { formatPercent } from '@/utils/dataType.js'

// API 接口导入
import {
  getReviewStats,
  getDetailData,
  getReviewTrend,
  getReviewStatusDistribution,
  getSimilarityDistribution,
  getCollegeDistribution,
  exportData as exportTeacherData
} from '@/api/teacher'
import { useChart } from '@/composables/useChart'

// 图标导入
import {
  TrendCharts, PieChart as PieChartIcon, Histogram, OfficeBuilding, List, Download,
  Document, Clock, CircleCheck, User
} from '@element-plus/icons-vue'

// Store
const userStore = useUserStore()

// 响应式数据
const timeRange = ref('month')
const stats = ref({})
const statTrends = ref({
  totalReviewsTrend: { type: '', text: '' },
  approvedReviewsTrend: { type: '', text: '' },
  currentStudentsTrend: { type: '', text: '' }
})
const detailData = ref([])

// 四张图表统一 useChart：容器 ref、dispose、resize、空态均由 composable 托管
const reviewTrendChart = useChart()
const statusDistributionChart = useChart()
const similarityChart = useChart()
const collegeChart = useChart()

// 方法
const handleTimeRangeChange = (range) => {
  timeRange.value = range
  loadData()
}

const loadData = async () => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在加载数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 并行加载统计数据和详细数据
    await Promise.all([
      loadStats(),
      loadDetailData()
    ])

    // 初始化图表
    await initCharts()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + error.message)
  } finally {
    loadingInstance.close()
  }
}

const loadStats = async () => {
  try {
    const params = {
      teacherId: userStore.userInfo?.userId,
      timeRange: timeRange.value
    }
    const res = await getReviewStats(params)
    if (res.code === 200) {
      stats.value = {
        totalReviews: res.data.totalReviews || 0,
        pendingReviews: res.data.pendingReviews || 0,
        approvedReviews: res.data.approvedReviews || 0,
        currentStudents: res.data.currentStudents || 0
      }
      
      statTrends.value = {
        totalReviewsTrend: res.data.totalReviewsTrend || { type: 'flat', text: '无变化' },
        approvedReviewsTrend: res.data.approvedReviewsTrend || { type: 'flat', text: '无变化' },
        currentStudentsTrend: res.data.currentStudentsTrend || { type: 'flat', text: '无变化' }
      }
    } else {
      ElMessage.error(res.message || '获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败: ' + error.message)
  }
}

const loadDetailData = async () => {
  try {
    const params = {
      teacherId: userStore.userInfo?.userId,
      timeRange: timeRange.value
    }
    
    const res = await getDetailData(params)
    if (res.code === 200) {
      detailData.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取详细数据失败')
      // 设置默认空数据
      detailData.value = []
    }
  } catch (error) {
    console.error('获取详细数据失败:', error)
    ElMessage.error('获取详细数据失败: ' + error.message)
    // 设置默认空数据
    detailData.value = []
  }
}

const initCharts = async () => {
  await Promise.all([
    loadReviewTrendChart(),
    loadStatusDistributionChart(),
    loadSimilarityChart(),
    loadCollegeChart()
  ])
}

// 审核趋势折线图（接口失败/空数据显空态，不再 mock 兜底）
const loadReviewTrendChart = () => reviewTrendChart.run(
  () => getReviewTrend({
    teacherId: userStore.userInfo?.userId,
    timeRange: timeRange.value,
    chartType: 'line'
  }),
  (res) => {
    if (res.code !== 200 || !res.data?.series?.length) return null
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: res.data.series.map(item => item.name) },
      xAxis: { type: 'category', data: res.data.categories || [] },
      yAxis: { type: 'value' },
      series: res.data.series
    }
  }
)

// 审核状态分布饼图
const loadStatusDistributionChart = () => statusDistributionChart.run(
  () => getReviewStatusDistribution({
    teacherId: userStore.userInfo?.userId,
    timeRange: timeRange.value
  }),
  (res) => {
    if (res.code !== 200 || !Array.isArray(res.data) || res.data.length === 0) return null
    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '审核状态',
          type: 'pie',
          radius: '50%',
          data: res.data,
          emphasis: {
            itemStyle: {
              shadowBlur: 0,
              shadowOffsetX: 0,
              shadowColor: 'transparent'
            }
          }
        }
      ]
    }
  }
)

// 论文相似度分布柱状图
const loadSimilarityChart = () => similarityChart.run(
  () => getSimilarityDistribution({
    teacherId: userStore.userInfo?.userId,
    timeRange: timeRange.value
  }),
  (res) => {
    if (res.code !== 200 || !res.data?.series?.length) return null
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: res.data.categories || [] },
      yAxis: { type: 'value' },
      series: res.data.series
    }
  }
)

// 学生学院分布柱状图
const loadCollegeChart = () => collegeChart.run(
  () => getCollegeDistribution({
    teacherId: userStore.userInfo?.userId,
    timeRange: timeRange.value
  }),
  (res) => {
    if (res.code !== 200 || !res.data?.series?.length) return null
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: res.data.categories || [] },
      yAxis: { type: 'value' },
      series: res.data.series
    }
  }
)

const getPendingReviewsTrend = () => {
  return { type: 'down', text: '-5% 同比下降' }
}

const getTrendClass = (type) => {
  if (!type) return 'trend-flat'
  return `trend-${type}`
}

const getTrendIcon = (type) => {
  if (!type) return '→'
  const icons = {
    up: '↑',
    down: '↓',
    flat: '→'
  }
  return icons[type] || '→'
}

const exportData = async () => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在导出数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const params = {
      teacherId: userStore.userInfo?.userId,
      timeRange: timeRange.value,
      exportFormat: 'excel',
      includeCharts: true
    }

    const res = await exportTeacherData(params)

    // 创建下载链接
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `教师数据统计_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败: ' + error.message)
  } finally {
    loadingInstance.close()
  }
}

// 生命周期
onMounted(async () => {
  await loadData()
})
</script>

<style scoped lang="scss">
.teacher-dashboard {
  .stats-row {
    margin-bottom: var(--app-space-4);

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: var(--app-radius-lg);
          margin-right: var(--app-space-4);
        }

        .stat-info {
          .stat-number {
            font-family: var(--app-font-family);
            font-size: var(--app-fs-metric);
            font-weight: 700;
            color: var(--app-color-ink);
            line-height: 1;
          }

          .stat-label {
            margin: var(--app-space-2) 0 var(--app-space-1);
            font-size: var(--app-fs-caption);
            color: var(--app-color-text-muted);
          }

          .stat-trend {
            font-size: var(--app-fs-meta);

            &.trend-up {
              color: var(--app-color-success);
            }

            &.trend-down {
              color: var(--app-color-danger);
            }

            &.trend-flat {
              color: var(--app-color-text-muted);
            }

            .trend-icon {
              margin-right: var(--app-space-1);
            }
          }
        }
      }
    }
  }

  .charts-row {
    margin-bottom: var(--app-space-4);

    .chart-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        font-family: var(--app-font-family);
        font-size: var(--app-fs-body);
        font-weight: 600;

        .el-icon {
          margin-right: 0;
        }
      }

      .chart-container {
        padding: var(--app-space-4) 0;
      }
    }
  }

  .data-table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        font-family: var(--app-font-family);
        font-size: var(--app-fs-body);
        font-weight: 600;

        .el-icon {
          margin-right: 0;
        }
      }
    }

    .detail-table {
      margin-top: var(--app-space-4);
    }
  }
}
</style>
