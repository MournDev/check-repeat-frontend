<template>
  <div class="teacher-dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">数据统计</h1>
          <p class="page-subtitle">查看您的论文审核数据和工作统计</p>
        </div>
        <div class="header-right">
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
        </div>
      </div>
    </div>

    <!-- 主要统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <span style="color: white; font-size: 24px;">📄</span>
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
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <span style="color: white; font-size: 24px;">⏰</span>
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
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <span style="color: white; font-size: 24px;">✅</span>
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
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <span style="color: white; font-size: 24px;">👨‍🎓</span>
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
            <div ref="reviewTrendChart" style="width: 100%; height: 300px;"></div>
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
            <div ref="statusDistributionChart" style="width: 100%; height: 300px;"></div>
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
            <div ref="similarityChart" style="width: 100%; height: 300px;"></div>
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
            <div ref="collegeChart" style="width: 100%; height: 300px;"></div>
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
              {{ row.avgSimilarity }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgProcessingTime" label="平均处理时间(小时)" width="150" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElLoading } from 'element-plus'
// ECharts 通过 CDN 引入，全局 window.echarts 可用

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

// 图标导入
import {
  TrendCharts, PieChart as PieChartIcon, Histogram, OfficeBuilding, List, Download
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
const chartInstances = ref({})

// 图表引用
const reviewTrendChart = ref(null)
const statusDistributionChart = ref(null)
const similarityChart = ref(null)
const collegeChart = ref(null)

// 方法
const handleTimeRangeChange = (range) => {
  timeRange.value = range
  loadData()
}

const loadData = async () => {
  try {
    // 显示加载状态
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在加载数据...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    // 并行加载统计数据和详细数据
    await Promise.all([
      loadStats(),
      loadDetailData()
    ])
    
    // 初始化图表
    await initCharts()
    
    loadingInstance.close()
    ElMessage.success('数据加载完成')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + error.message)
  }
}

const loadStats = async () => {
  try {
    const res = await getReviewStats(userStore.userInfo?.userId, timeRange.value)
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
    initReviewTrendChart(),
    initStatusDistributionChart(),
    initSimilarityChart(),
    initCollegeChart()
  ])
}

const initReviewTrendChart = async () => {
  if (!reviewTrendChart.value) return
  
  try {
    const params = {
      teacherId: userStore.userInfo?.userId,
      timeRange: timeRange.value,
      chartType: 'line'
    }
    
    const res = await getReviewTrend(params)
    if (res.code === 200) {
      const chart = echarts.init(reviewTrendChart.value)
      chartInstances.value.reviewTrend = chart
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: res.data.series?.map(item => item.name) || ['审核数', '通过数']
        },
        xAxis: {
          type: 'category',
          data: res.data.categories || ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {
          type: 'value'
        },
        series: res.data.series || [
          {
            name: '审核数',
            type: 'line',
            data: [120, 132, 101, 134, 90, 230],
            smooth: true
          },
          {
            name: '通过数',
            type: 'line',
            data: [90, 110, 85, 115, 75, 190],
            smooth: true
          }
        ]
      }
      
      chart.setOption(option)
    }
  } catch (error) {
    console.error('获取审核趋势数据失败:', error)
    // 使用默认数据
    const chart = echarts.init(reviewTrendChart.value)
    chartInstances.value.reviewTrend = chart
    
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['审核数', '通过数'] },
      xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
      yAxis: { type: 'value' },
      series: [
        { name: '审核数', type: 'line', data: [120, 132, 101, 134, 90, 230], smooth: true },
        { name: '通过数', type: 'line', data: [90, 110, 85, 115, 75, 190], smooth: true }
      ]
    }
    chart.setOption(option)
  }
}

const initStatusDistributionChart = async () => {
  if (!statusDistributionChart.value) return
  
  try {
    const res = await getReviewStatusDistribution(userStore.userInfo?.userId, timeRange.value)
    if (res.code === 200) {
      const chart = echarts.init(statusDistributionChart.value)
      chartInstances.value.statusDistribution = chart
      
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '审核状态',
            type: 'pie',
            radius: '50%',
            data: res.data || [
              { value: 89, name: '通过' },
              { value: 23, name: '需修改' },
              { value: 16, name: '拒绝' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      chart.setOption(option)
    }
  } catch (error) {
    console.error('获取状态分布数据失败:', error)
    // 使用默认数据
    const chart = echarts.init(statusDistributionChart.value)
    chartInstances.value.statusDistribution = chart
    
    const option = {
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '审核状态',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 89, name: '通过' },
            { value: 23, name: '需修改' },
            { value: 16, name: '拒绝' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    chart.setOption(option)
  }
}

const initSimilarityChart = async () => {
  if (!similarityChart.value) return
  
  try {
    const res = await getSimilarityDistribution(userStore.userInfo?.userId, timeRange.value)
    if (res.code === 200) {
      const chart = echarts.init(similarityChart.value)
      chartInstances.value.similarity = chart
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: res.data.categories || ['0-10%', '10-20%', '20-30%', '30-40%', '40%以上']
        },
        yAxis: {
          type: 'value'
        },
        series: res.data.series || [
          {
            name: '论文数量',
            type: 'bar',
            data: [45, 32, 28, 15, 8],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            }
          }
        ]
      }
      
      chart.setOption(option)
    }
  } catch (error) {
    console.error('获取相似度分布数据失败:', error)
    // 使用默认数据
    const chart = echarts.init(similarityChart.value)
    chartInstances.value.similarity = chart
    
    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['0-10%', '10-20%', '20-30%', '30-40%', '40%以上'] },
      yAxis: { type: 'value' },
      series: [
        {
          name: '论文数量',
          type: 'bar',
          data: [45, 32, 28, 15, 8],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        }
      ]
    }
    chart.setOption(option)
  }
}

const initCollegeChart = async () => {
  if (!collegeChart.value) return
  
  try {
    const res = await getCollegeDistribution(userStore.userInfo?.userId, timeRange.value)
    if (res.code === 200) {
      const chart = echarts.init(collegeChart.value)
      chartInstances.value.college = chart
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: res.data.categories || ['计算机学院', '软件学院', '人工智能学院', '电子信息学院']
        },
        yAxis: {
          type: 'value'
        },
        series: res.data.series || [
          {
            name: '学生人数',
            type: 'bar',
            data: [25, 18, 12, 8],
            itemStyle: {
              color: '#409eff'
            }
          }
        ]
      }
      
      chart.setOption(option)
    }
  } catch (error) {
    console.error('获取学院分布数据失败:', error)
    // 使用默认数据
    const chart = echarts.init(collegeChart.value)
    chartInstances.value.college = chart
    
    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['计算机学院', '软件学院', '人工智能学院', '电子信息学院'] },
      yAxis: { type: 'value' },
      series: [
        {
          name: '学生人数',
          type: 'bar',
          data: [25, 18, 12, 8],
          itemStyle: {
            color: '#409eff'
          }
        }
      ]
    }
    chart.setOption(option)
  }
}

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

const getSimilarityTagType = (similarity) => {
  if (similarity >= 30) return 'danger'
  if (similarity >= 20) return 'warning'
  return 'success'
}

const exportData = async () => {
  try {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在导出数据...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    const params = {
      teacherId: userStore.userInfo?.userId,
      timeRange: timeRange.value,
      exportFormat: 'excel',
      includeCharts: true
    }
    
    const res = await exportTeacherData(params)
    
    // 创建下载链接
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `教师数据统计_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    loadingInstance.close()
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败: ' + error.message)
  }
}

// 生命周期
onMounted(async () => {
  await loadData()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    Object.values(chartInstances.value).forEach(chart => {
      if (chart) {
        chart.resize()
      }
    })
  })
})

onUnmounted(() => {
  // 销毁图表实例
  Object.values(chartInstances.value).forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
})
</script>

<style lang="scss" scoped>
.teacher-dashboard {
  .page-header {
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      .page-subtitle {
        margin: 0;
        color: #606266;
      }
    }
  }
  
  .stats-row {
    margin-bottom: 20px;
    
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
          border-radius: 12px;
          margin-right: 16px;
        }
        
        .stat-info {
          .stat-number {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1;
          }
          
          .stat-label {
            font-size: 14px;
            color: #909399;
            margin: 8px 0 4px 0;
          }
          
          .stat-trend {
            font-size: 12px;
            
            &.trend-up {
              color: #67c23a;
            }
            
            &.trend-down {
              color: #f56c6c;
            }
            
            &.trend-flat {
              color: #909399;
            }
            
            .trend-icon {
              margin-right: 4px;
            }
          }
        }
      }
    }
  }
  
  .charts-row {
    margin-bottom: 20px;
    
    .chart-card {
      .card-header {
        display: flex;
        align-items: center;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
        }
      }
      
      .chart-container {
        padding: 16px 0;
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
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
        }
      }
    }
    
    .detail-table {
      margin-top: 16px;
    }
  }
}
</style>