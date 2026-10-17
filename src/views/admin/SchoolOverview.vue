<template>
  <div class="school-overview">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">全校数据概览</h1>
        <p class="page-desc">实时展示全校论文查重系统运行状况和关键指标</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshAllData">刷新数据</el-button>
        <el-button type="primary" :icon="Download" @click="exportReport">导出报告</el-button>
      </div>
    </div>

    <!-- 核心指标概览 -->
    <el-row :gutter="16" class="overview-cards" v-loading="overviewLoading">
      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="never">
          <div class="card-content">
            <div class="card-icon bg-primary">
              <el-icon><User /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ overviewStats.totalUsers }}</div>
              <div class="card-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="never">
          <div class="card-content">
            <div class="card-icon bg-success">
              <el-icon><Document /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ overviewStats.totalPapers }}</div>
              <div class="card-label">论文总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="never">
          <div class="card-content">
            <div class="card-icon bg-warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ overviewStats.highSimilarity }}</div>
              <div class="card-label">高重复率</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="never">
          <div class="card-content">
            <div class="card-icon bg-info">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ realtimeStats.systemLoad }}%</div>
              <div class="card-label">系统负载</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-section" v-loading="chartsLoading" element-loading-text="图表加载中">
      <!-- 左侧双图表 -->
      <el-col :xs="24" :lg="16">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card class="chart-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><PieChart /></el-icon>
                    学院论文分布
                  </span>
                </div>
              </template>
              <!-- 图表数据为空/加载失败时显式空态，禁止 mock 兜底 -->
              <el-empty v-if="collegeChartEmpty" description="暂无学院分布数据" :image-size="60" class="chart-empty" />
              <div v-else ref="collegeChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card class="chart-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><DataAnalysis /></el-icon>
                    月度论文趋势
                  </span>
                </div>
              </template>
              <el-empty v-if="trendChartEmpty" description="暂无月度趋势数据" :image-size="60" class="chart-empty" />
              <div v-else ref="trendChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-card class="chart-card full-width" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Histogram /></el-icon>
                查重结果分布
              </span>
            </div>
          </template>
          <el-empty v-if="similarityChartEmpty" description="暂无查重结果分布数据" :image-size="60" class="chart-empty large" />
          <div v-else ref="similarityChartRef" class="chart-container large"></div>
        </el-card>
      </el-col>
      
      <!-- 右侧信息面板 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><User /></el-icon>
                人员分布
              </span>
            </div>
          </template>
          <el-empty v-if="roleChartEmpty" description="暂无人员分布数据" :image-size="60" class="chart-empty" />
          <div v-else ref="roleChartRef" class="chart-container"></div>
        </el-card>

        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><TrendCharts /></el-icon>
                实时统计
              </span>
            </div>
          </template>

          <div class="realtime-stats" v-loading="overviewLoading">
            <div class="stat-item">
              <div class="stat-label">今日新增用户</div>
              <div class="stat-value">{{ realtimeStats.todayNewUsers }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">活跃任务数</div>
              <div class="stat-value">{{ realtimeStats.activeTasks }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">在线用户</div>
              <div class="stat-value">{{ realtimeStats.onlineUsers }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">系统负载</div>
              <div class="stat-value">{{ realtimeStats.systemLoad }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">今日论文数</div>
              <div class="stat-value">{{ realtimeStats.todayPapers }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">本周审核数</div>
              <div class="stat-value">{{ realtimeStats.weekReviews }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 导入管理员 API
import {
  getSchoolOverview,
  getCollegeDistribution,
  getMonthlyTrend,
  getSimilarityDistribution,
  getRealtimeStats,
  exportSchoolReport
} from '@/api/admin/school'
import * as echarts from 'echarts'

// 图标导入（模板中其余图标依赖 main.js 的全局注册，无需在此导入）
import {
  Refresh, Download, User, Document, Warning, Monitor,
  DataAnalysis, Histogram, TrendCharts
} from '@element-plus/icons-vue'

// 响应式数据
const overviewStats = ref({})
// 加载状态
const overviewLoading = ref(false)
const chartsLoading = ref(false)
// 初始值一律 0：请求返回前显示 0 而不是编造的假数据
const realtimeStats = ref({
  todayPapers: 0,
  weekReviews: 0,
  onlineUsers: 0,
  systemLoad: 0,
  todayNewUsers: 0,
  activeTasks: 0
})

// 各图表空态标记：接口失败或返回空数据时显式展示 el-empty，不做 mock 兜底
const collegeChartEmpty = ref(false)
const trendChartEmpty = ref(false)
const similarityChartEmpty = ref(false)
const roleChartEmpty = ref(false)

// 人员统计优先使用概览接口返回值（students/teachers/admins）
const roleCounts = ref({ students: 0, teachers: 0, admins: 0 })

// 图表引用
const collegeChartRef = ref()
const trendChartRef = ref()
const similarityChartRef = ref()
const roleChartRef = ref()

// 图表实例
let collegeChartInstance = null
let trendChartInstance = null
let similarityChartInstance = null
let roleChartInstance = null

// 方法
// 全量刷新 = 概览数据 + 全部四张图表；silent 用于首屏加载不弹「数据已刷新」。
// 接口错误由 axios 拦截器统一提示，这里不再重复弹错。
const refreshAllData = async (silent = false) => {
  try {
    await loadOverviewData()
    // 空态开关复位后再挂 ref 容器，nextTick 保证 el-empty → 容器切换完成
    collegeChartEmpty.value = false
    trendChartEmpty.value = false
    similarityChartEmpty.value = false
    roleChartEmpty.value = false
    await nextTick()
    await initAllCharts()
    if (!silent) ElMessage.success('数据已刷新')
  } catch (error) {
    console.error('加载全校概览数据失败:', error)
  }
}

const exportReport = async () => {
  try {
    const response = await exportSchoolReport({
      startTime: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      endTime: new Date().toISOString()
    })

    // 创建下载链接
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `school-overview-report-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('报告导出成功')
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('报告导出失败')
  }
}
const loadOverviewData = async () => {
  overviewLoading.value = true
  try {
    // 并行加载多个API数据
    const [overviewResponse, realtimeResponse] = await Promise.all([
      getSchoolOverview(),
      getRealtimeStats()
    ])
    
    
    // 处理学校概览数据：后端未提供增长率/健康度字段，不再编造，卡片只展示真实值
    overviewStats.value = {
      totalUsers: overviewResponse.data.totalUsers || 0,
      totalPapers: overviewResponse.data.totalPapers || 0,
      highSimilarity: overviewResponse.data.highSimilarityPapers || 0
    }

    // 从概览接口优先获取人员分布统计（避免单独的实时接口不包含汇总）
    roleCounts.value = {
      students: Number(overviewResponse.data.students ?? 0) || 0,
      teachers: Number(overviewResponse.data.teachers ?? 0) || 0,
      admins: Number(overviewResponse.data.admins ?? 0) || 0
    }
    
    // 处理实时统计数据 - 根据您提供的接口数据结构
    realtimeStats.value = {
      todayPapers: realtimeResponse.data.todayPapers || 0,
      weekReviews: realtimeResponse.data.weekReviews || 0,
      onlineUsers: realtimeResponse.data.onlineUsers || 0,
      systemLoad: realtimeResponse.data.systemLoad || 0,
      todayNewUsers: realtimeResponse.data.todayNewUsers || 0,
      activeTasks: realtimeResponse.data.activeTasks || 0
    }
  } finally {
    overviewLoading.value = false
  }
}

// 释放图表实例的统一入口，返回 null 便于 `instance = disposeChart(instance)` 写法
const disposeChart = (chart) => {
  if (chart) chart.dispose()
  return null
}

// 初始化学院分布图表
const initCollegeChart = async () => {
  if (!collegeChartRef.value) return

  try {
    const response = await getCollegeDistribution()
    let items = []
    if (response) {
      if (Array.isArray(response.data)) items = response.data
      else if (response.data && Array.isArray(response.data.collegeStats?.distribution)) items = response.data.collegeStats.distribution
      else if (response.data && Array.isArray(response.data.distribution)) items = response.data.distribution
    }

    const chartData = (items || []).map(item => ({
      value: Number(item.paperCount ?? item.count ?? item.value ?? 0),
      name: item.collegeName || item.name || '未知'
    }))

    // 空数据：显式空态，不渲染空图表
    if (!chartData.length) {
      collegeChartInstance = disposeChart(collegeChartInstance)
      collegeChartEmpty.value = true
      return
    }

    collegeChartInstance = disposeChart(collegeChartInstance)
    collegeChartInstance = echarts.init(collegeChartRef.value)
    collegeChartInstance.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        bottom: '0',
        left: 'center'
      },
      series: [
        {
          name: '学院分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: chartData
        }
      ]
    })
  } catch (error) {
    // 接口失败：显式空态。绝不回退 mock 数据——管理驾驶舱宁缺毋假
    console.error('加载学院分布数据失败:', error)
    collegeChartInstance = disposeChart(collegeChartInstance)
    collegeChartEmpty.value = true
  }
}

// 初始化趋势图表
const initTrendChart = async () => {
  if (!trendChartRef.value) return

  try {
    const response = await getMonthlyTrend()
    // 默认空数组：拿不到数据就走空态，绝不用假月份假数量兜底
    let months = []
    let paperCounts = []
    if (response) {
      if (Array.isArray(response.data)) {
        const arr = response.data
        months = arr.map(it => it.month || it.label || '')
        paperCounts = arr.map(it => Number(it.submissionCount ?? it.paperCount ?? it.checkCount ?? 0))
      } else if (Array.isArray(response.data?.list)) {
        const arr = response.data.list
        months = arr.map(it => it.month || it.label || '')
        paperCounts = arr.map(it => Number(it.submissionCount ?? it.paperCount ?? it.checkCount ?? 0))
      } else if (Array.isArray(response)) {
        const arr = response
        months = arr.map(it => it.month || it.label || '')
        paperCounts = arr.map(it => Number(it.submissionCount ?? it.paperCount ?? it.checkCount ?? 0))
      } else {
        months = response.data?.months || []
        paperCounts = response.data?.paperCounts || []
      }
    }

    if (!months.length) {
      trendChartInstance = disposeChart(trendChartInstance)
      trendChartEmpty.value = true
      return
    }

    trendChartInstance = disposeChart(trendChartInstance)
    trendChartInstance = echarts.init(trendChartRef.value)
    trendChartInstance.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: months
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: paperCounts,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#0066cc'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 102, 204, 0.15)' },
              { offset: 1, color: 'rgba(0, 102, 204, 0.04)' }
            ])
          }
        }
      ]
    })
  } catch (error) {
    console.error('加载月度趋势数据失败:', error)
    trendChartInstance = disposeChart(trendChartInstance)
    trendChartEmpty.value = true
  }
}

// 初始化相似度分布图表
const initSimilarityChart = async () => {
  if (!similarityChartRef.value) return
  
  try {
    const response = await getSimilarityDistribution()
    // 兼容后端多种返回结构：data 可能是数组，也可能为 { records: [] } / { list: [] }
    let items = []
    if (response) {
      if (Array.isArray(response.data)) items = response.data
      else if (response.data && Array.isArray(response.data.records)) items = response.data.records
      else if (response.data && Array.isArray(response.data.list)) items = response.data.list
      else if (Array.isArray(response.records)) items = response.records
      else if (Array.isArray(response.list)) items = response.list
      else if (response.data && Array.isArray(response.data.data)) items = response.data.data
      else {
        // fallback: try to coerce object entries
        try {
          const maybeArr = Object.values(response.data || {}).filter(v => typeof v === 'number' || typeof v === 'string')
          if (maybeArr.length > 0) items = response.data
        } catch (e) {
          items = []
        }
      }
    }

    // 如果 items 不是数组但为对象（例如 { '0-10%': 123, '10-20%': 45 }), 将其转为数组
    if (!Array.isArray(items) && items && typeof items === 'object') {
      try {
        items = Object.entries(items).map(([k, v]) => ({ range: k, count: v }))
      } catch (e) {
        items = []
      }
    }

    console.debug('similarity items after normalize:', items)

    const chartData = (items || []).map(item => ({
      name: (item.range || item.name || '').toString().includes('+') ? (item.range || item.name || '').toString().replace('+', '以上') : (item.range || item.name || '').toString(),
      value: Number(item.count ?? item.value ?? 0)
    }))

    if (!chartData.length) {
      similarityChartInstance = disposeChart(similarityChartInstance)
      similarityChartEmpty.value = true
      return
    }

    similarityChartInstance = disposeChart(similarityChartInstance)
    similarityChartInstance = echarts.init(similarityChartRef.value)
    similarityChartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: chartData.map(item => item.name),
          axisTick: {
            alignWithLabel: true
          }
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: [
        {
          name: '论文数量',
          type: 'bar',
          barWidth: '60%',
          data: chartData.map(item => item.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#5ac8fa' },
              { offset: 0.5, color: '#0066cc' },
              { offset: 1, color: '#0066cc' }
            ])
          }
        }
      ]
    })
  } catch (error) {
    console.error('加载相似度分布数据失败:', error)
    similarityChartInstance = disposeChart(similarityChartInstance)
    similarityChartEmpty.value = true
  }
}

// 初始化人员分布图表
const initRoleChart = async () => {
  if (!roleChartRef.value) {
    return
  }
  try {
    // 优先使用从概览接口获取的统计数据
    let students = roleCounts.value.students
    let teachers = roleCounts.value.teachers
    let admins = roleCounts.value.admins

    // 若概览接口未提供，则回退到实时统计接口
    if ((students === 0 && teachers === 0 && admins === 0) || (students == null && teachers == null && admins == null)) {
      const response = await getRealtimeStats()
      students = Number(response.data.students ?? 0) || 0
      teachers = Number(response.data.teachers ?? 0) || 0
      admins = Number(response.data.admins ?? 0) || 0
    } else {
      // use roleCounts
    }

    const userData = [
      { value: students, name: '学生' },
      { value: teachers, name: '教师' },
      { value: admins, name: '管理员' }
    ]

    if (!userData.some(d => d.value > 0)) {
      roleChartInstance = disposeChart(roleChartInstance)
      roleChartEmpty.value = true
      return
    }

    roleChartInstance = disposeChart(roleChartInstance)
    roleChartInstance = echarts.init(roleChartRef.value)
    roleChartInstance.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}人 ({d}%)'
      },
      legend: {
        bottom: '0',
        left: 'center'
      },
      series: [
        {
          name: '人员分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: userData
        }
      ]
    })
  } catch (error) {
    console.error('加载人员分布数据失败:', error)
    roleChartInstance = disposeChart(roleChartInstance)
    roleChartEmpty.value = true
  }
}

// 初始化所有图表
const initAllCharts = async () => {
  chartsLoading.value = true
  try {
    await nextTick() // 确保DOM完全渲染
    await Promise.all([
      initCollegeChart(),
      initTrendChart(),
      initSimilarityChart(),
      initRoleChart()
    ])
  } finally {
    chartsLoading.value = false
  }
}

// 窗口大小改变时重新渲染图表
const handleResize = () => {
  if (collegeChartInstance) collegeChartInstance.resize()
  if (trendChartInstance) trendChartInstance.resize()
  if (similarityChartInstance) similarityChartInstance.resize()
  if (roleChartInstance) roleChartInstance.resize()
}

// 生命周期钩子：唯一入口。此前两个 onMounted 并存导致概览接口被调两次、
// 100ms/300ms 两个 setTimeout 竞争重初始化图表，已合并为 refreshAllData 一条链路
onMounted(async () => {
  await refreshAllData(true)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (collegeChartInstance) collegeChartInstance.dispose()
  if (trendChartInstance) trendChartInstance.dispose()
  if (similarityChartInstance) similarityChartInstance.dispose()
  if (roleChartInstance) roleChartInstance.dispose()
})
</script>

<style lang="scss" scoped>
.school-overview {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  
  .header-content {
    .page-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--apple-ink);
    }
    
    .page-desc {
      margin: 0;
      color: var(--apple-ink-secondary);
      font-size: 0.95rem;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.overview-cards {
  margin-bottom: 1.5rem;
  
  .overview-card {
    border: none;
    border-radius: 18px;
    
    .card-content {
      display: flex;
      align-items: center;
      
      .card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 18px;
        margin-right: 1rem;
        
        &.bg-primary {
          background: var(--apple-primary);
        }

        &.bg-success {
          background: var(--apple-success);
        }

        &.bg-warning {
          background: var(--apple-warning);
        }

        &.bg-info {
          background: #5ac8fa;
        }
        
        .el-icon {
          color: white;
          font-size: 1.5rem;
        }
      }
      
      .card-info {
        flex: 1;
        
        .card-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--apple-ink);
          line-height: 1;
        }
        
        .card-label {
          font-size: 0.875rem;
          color: var(--apple-ink-secondary);
          margin: 0.25rem 0;
        }
      }
    }
  }
}

.charts-section {
  .chart-card {
    border-radius: 18px;
    border: 1px solid var(--apple-surface-chip-translucent);
    margin-bottom: 1rem;
    
    :deep(.el-card__header) {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--apple-surface-chip-translucent);
      
      .card-header {
        display: flex;
        align-items: center;
        
        .card-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: var(--apple-ink);
          
          .el-icon {
            margin-right: 0.5rem;
            color: var(--apple-primary);
          }
        }
      }
    }
    
    .chart-container {
      height: 280px;

      &.large {
        height: 320px;
      }
    }

    // 图表空态容器：与 chart-container 同高，保证卡片高度稳定
    .chart-empty {
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.large {
        height: 320px;
      }
    }
  }
  
  .full-width {
    margin-bottom: 0;
  }
}

.info-card {
  border-radius: 18px;
  border: 1px solid var(--apple-surface-chip-translucent);
  margin-bottom: 1rem;
  
  :deep(.el-card__header) {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--apple-surface-chip-translucent);
    
    .card-header {
      display: flex;
      align-items: center;
      
      .card-title {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: var(--apple-ink);
        
        .el-icon {
          margin-right: 0.5rem;
          color: var(--apple-primary);
        }
      }
    }
  }
}

.realtime-stats {
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--apple-canvas-parchment);
    
    &:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--apple-ink-secondary);
    }
    
    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--apple-ink);
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    
    .header-actions {
      width: 100%;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .overview-cards {
    .el-col {
      margin-bottom: 0.75rem;
    }
  }
  
  .charts-section {
    .el-col {
      margin-bottom: 1rem;
    }
  }
}
</style>