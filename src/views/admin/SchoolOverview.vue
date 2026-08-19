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
    <el-row :gutter="16" class="overview-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon bg-primary">
              <el-icon><User /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ overviewStats.totalUsers }}</div>
              <div class="card-label">总用户数</div>
              <div class="card-trend positive">
                <el-icon><Top /></el-icon>
                <span>+{{ overviewStats.userGrowth }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon bg-success">
              <el-icon><Document /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ overviewStats.totalPapers }}</div>
              <div class="card-label">论文总数</div>
              <div class="card-trend positive">
                <el-icon><Top /></el-icon>
                <span>+{{ overviewStats.paperGrowth }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon bg-warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ overviewStats.highSimilarity }}</div>
              <div class="card-label">高重复率</div>
              <div class="card-trend negative">
                <el-icon><Bottom /></el-icon>
                <span>{{ overviewStats.similarityRate }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon bg-info">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ overviewStats.systemHealth }}%</div>
              <div class="card-label">系统健康度</div>
              <div class="card-trend positive">
                <el-icon><Top /></el-icon>
                <span>稳定</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-section">
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
              <div ref="collegeChartRef" class="chart-container"></div>
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
              <div ref="trendChartRef" class="chart-container"></div>
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
          <div ref="similarityChartRef" class="chart-container large"></div>
        </el-card>
      </el-col>
      
      <!-- 人员分布图表 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><User /></el-icon>
                人员分布
              </span>
              
            </div>
          </template>
          <div ref="roleChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <!-- 右侧信息面板 -->
      <el-col :xs="24" :lg="8">  
        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><TrendCharts /></el-icon>
                实时统计
              </span>
            </div>
          </template>
          
          <div class="realtime-stats">
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
// ECharts 通过 CDN 引入，全局 window.echarts 可用

// 导入管理员 API
import {
  getSchoolOverview,
  getCollegeDistribution,
  getMonthlyTrend,
  getSimilarityDistribution,
  getRealtimeStats,
  getNotices,
  exportSchoolReport
} from '@/api/admin/school'

// 图标导入
import {
  Refresh, Download, User, Document, Warning, Monitor,
  Top, Bottom, PieChart as PieChartIcon, DataAnalysis, Histogram, Notification,
  TrendCharts, InfoFilled, WarningFilled, SuccessFilled
} from '@element-plus/icons-vue'

// 响应式数据
const overviewStats = ref({})
const realtimeStats = ref({
  todayPapers: 23,
  weekReviews: 156,
  onlineUsers: 142,
  systemLoad: 65
})

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
const refreshAllData = async () => {
  try {
    await Promise.all([
      loadOverviewData(),
    ])
    // 数据加载完成后重新初始化图表
    await nextTick()
    setTimeout(async () => {
      await initRoleChart()
    }, 100)
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  }
}


const exportReport = async () => {
  try {
    const response = await exportSchoolReport({
      startTime: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      endTime: new Date().toISOString()
    })
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/pdf' })
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

const getNoticeIcon = (type) => {
  const iconMap = {
    info: InfoFilled,
    warning: WarningFilled,
    success: SuccessFilled
  }
  return iconMap[type] || InfoFilled
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return `${Math.floor(diff / 86400000)}天前`
  }
}

// 生命周期
onMounted(async () => {
  await refreshAllData()
})
const loadOverviewData = async () => {
  try {
    console.log('开始加载学校概览数据...')
    // 并行加载多个API数据
    const [overviewResponse, realtimeResponse] = await Promise.all([
      getSchoolOverview(),
      getRealtimeStats()
    ])
    
    console.log('概览数据:', overviewResponse.data)
    console.log('实时数据:', realtimeResponse.data)
    
    // 处理学校概览数据
    overviewStats.value = {
      totalUsers: overviewResponse.data.totalUsers || 0,
      userGrowth: 0, // 后端未提供，设为0
      totalPapers: overviewResponse.data.totalPapers || 0,
      paperGrowth: 0, // 后端未提供，设为0
      highSimilarity: overviewResponse.data.highSimilarityPapers || 0,
      similarityRate: overviewResponse.data.highSimilarityPapers && overviewResponse.data.totalPapers ? 
                     ((overviewResponse.data.highSimilarityPapers / overviewResponse.data.totalPapers) * 100).toFixed(1) : 0,
      systemHealth: 95 // 固定值或根据其他指标计算
    }

    // 从概览接口优先获取人员分布统计（避免单独的实时接口不包含汇总）
    roleCounts.value = {
      students: Number(overviewResponse.data.students ?? 0) || 0,
      teachers: Number(overviewResponse.data.teachers ?? 0) || 0,
      admins: Number(overviewResponse.data.admins ?? 0) || 0
    }
    
    // 处理实时统计数据 - 根据您提供的接口数据结构
    console.log('实时统计数据原始数据:', realtimeResponse.data)
    realtimeStats.value = {
      todayPapers: realtimeResponse.data.todayPapers || 0,
      weekReviews: realtimeResponse.data.weekReviews || 0,
      onlineUsers: realtimeResponse.data.onlineUsers || 0,
      systemLoad: realtimeResponse.data.systemLoad || 0,
      todayNewUsers: realtimeResponse.data.todayNewUsers || 0,
      activeTasks: realtimeResponse.data.activeTasks || 0
    }
  } finally {
    console.log('最终的overviewStats值:', overviewStats.value)
    console.log('最终的realtimeStats值:', realtimeStats.value)
    // 强制触发响应式更新
    overviewStats.value = { ...overviewStats.value }
    realtimeStats.value = { ...realtimeStats.value }
  }
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
      else if (Array.isArray(response.records)) items = response.records
      else if (Array.isArray(response.list)) items = response.list
      else if (response.data && Array.isArray(response.data.records)) items = response.data.records
    }

    const chartData = (items || []).map(item => ({
      value: Number(item.paperCount ?? item.count ?? item.value ?? 0),
      name: item.collegeName || item.name || '未知'
    }))
    
    if (collegeChartInstance) {
      collegeChartInstance.dispose()
    }
    
    collegeChartInstance = echarts.init(collegeChartRef.value)
    const option = {
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
            borderColor: '#fff',
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
    }
    
    collegeChartInstance.setOption(option)
  } catch (error) {
    console.error('加载学院分布数据失败:', error)
    
    if (collegeChartInstance) {
      collegeChartInstance.dispose()
    }
    
    collegeChartInstance = echarts.init(collegeChartRef.value)
    const option = {
      tooltip: {
        trigger: 'item'
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
            borderColor: '#fff',
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
          data: mockData
        }
      ]
    }
    
    collegeChartInstance.setOption(option)
  }
}

// 初始化趋势图表
const initTrendChart = async () => {
  if (!trendChartRef.value) return
  
  try {
    const response = await getMonthlyTrend()
    console.debug('monthly trend raw response:', response)
    let months = ['1月', '2月', '3月', '4月', '5月', '6月']
    let paperCounts = [120, 200, 150, 80, 70, 110]
    if (response) {
      if (response.data) {
        if (Array.isArray(response.data)) {
          const arr = response.data
          months = arr.map(it => it.month || it.label || '')
          paperCounts = arr.map(it => Number(it.submissionCount ?? it.paperCount ?? it.checkCount ?? 0))
        } else if (Array.isArray(response.data.list)) {
          const arr = response.data.list
          months = arr.map(it => it.month || it.label || '')
          paperCounts = arr.map(it => Number(it.submissionCount ?? it.paperCount ?? it.checkCount ?? 0))
        } else {
          months = response.data.months || months
          paperCounts = response.data.paperCounts || paperCounts
        }
      } else if (Array.isArray(response)) {
        const arr = response
        months = arr.map(it => it.month || it.label || '')
        paperCounts = arr.map(it => Number(it.submissionCount ?? it.paperCount ?? it.checkCount ?? 0))
      }
    }
    
    if (trendChartInstance) {
      trendChartInstance.dispose()
    }
    
    trendChartInstance = echarts.init(trendChartRef.value)
    const option = {
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
            color: '#409EFF'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          }
        }
      ]
    }
    
    trendChartInstance.setOption(option)
  } catch (error) {
    console.error('加载月度趋势数据失败:', error)
    // 使用模拟数据
    const mockMonths = ['1月', '2月', '3月', '4月', '5月', '6月']
    const mockCounts = [120, 200, 150, 80, 70, 110]
    
    if (trendChartInstance) {
      trendChartInstance.dispose()
    }
    
    trendChartInstance = echarts.init(trendChartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: mockMonths
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: mockCounts,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          }
        }
      ]
    }
    
    trendChartInstance.setOption(option)
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
    
    if (similarityChartInstance) {
      similarityChartInstance.dispose()
    }
    
    similarityChartInstance = echarts.init(similarityChartRef.value)
    const option = {
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
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        }
      ]
    }
    
    similarityChartInstance.setOption(option)
  } catch (error) {
    console.error('加载相似度分布数据失败:', error)
    // 使用模拟数据
    const mockData = [
      { name: '0-10%', value: 320 },
      { name: '10-20%', value: 258 },
      { name: '20-30%', value: 147 },
      { name: '30-40%', value: 89 },
      { name: '40-50%', value: 42 },
      { name: '50%以上', value: 18 }
    ]
    
    if (similarityChartInstance) {
      similarityChartInstance.dispose()
    }
    
    similarityChartInstance = echarts.init(similarityChartRef.value)
    const option = {
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
          data: mockData.map(item => item.name),
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
          data: mockData.map(item => item.value),
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
    
    similarityChartInstance.setOption(option)
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
    
    if (roleChartInstance) {
      roleChartInstance.dispose()
    }
    roleChartInstance = echarts.init(roleChartRef.value)
    const option = {
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
            borderColor: '#fff',
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
    }
    
    roleChartInstance.setOption(option)
  } catch (error) {
    console.error('加载人员分布数据失败:', error)
    // 使用模拟数据
    const mockData = [
      { value: 120, name: '学生' },
      { value: 25, name: '教师' },
      { value: 5, name: '管理员' }
    ]
    
    if (roleChartInstance) {
      roleChartInstance.dispose()
    }
    
    roleChartInstance = echarts.init(roleChartRef.value)
    const option = {
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
            borderColor: '#fff',
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
          data: mockData
        }
      ]
    }
    
    roleChartInstance.setOption(option)
  }
}

// 初始化所有图表
const initAllCharts = async () => {
  await nextTick() // 确保DOM完全渲染
  await Promise.all([
    initCollegeChart(),
    initTrendChart(),
    initSimilarityChart(),
    initRoleChart()
  ])
}

// 窗口大小改变时重新渲染图表
const handleResize = () => {
  if (collegeChartInstance) collegeChartInstance.resize()
  if (trendChartInstance) trendChartInstance.resize()
  if (similarityChartInstance) similarityChartInstance.resize()
  if (roleChartInstance) roleChartInstance.resize()
}

// 生命周期钩子
onMounted(async () => {
  await loadOverviewData()
  // 增加延迟确保数据完全加载
  setTimeout(async () => {
    await initAllCharts()
  }, 300)
  
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
      color: #2c3e50;
    }
    
    .page-desc {
      margin: 0;
      color: #7f8c8d;
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
    border-radius: 12px;
    
    .card-content {
      display: flex;
      align-items: center;
      
      .card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        margin-right: 1rem;
        
        &.bg-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }
        
        &.bg-success {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        
        &.bg-warning {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        
        &.bg-info {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
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
          color: #2c3e50;
          line-height: 1;
        }
        
        .card-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin: 0.25rem 0;
        }
        
        .card-trend {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          
          &.positive {
            color: #4caf50;
          }
          
          &.negative {
            color: #f44336;
          }
          
          .el-icon {
            margin-right: 0.25rem;
          }
        }
      }
    }
  }
}

.charts-section {
  .chart-card {
    border-radius: 12px;
    border: 1px solid #f1f2f6;
    margin-bottom: 1rem;
    
    :deep(.el-card__header) {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f2f6;
      
      .card-header {
        display: flex;
        align-items: center;
        
        .card-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: #2c3e50;
          
          .el-icon {
            margin-right: 0.5rem;
            color: #667eea;
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
  }
  
  .full-width {
    margin-bottom: 0;
  }
}

.info-card {
  border-radius: 12px;
  border: 1px solid #f1f2f6;
  margin-bottom: 1rem;
  
  :deep(.el-card__header) {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f1f2f6;
    
    .card-header {
      display: flex;
      align-items: center;
      
      .card-title {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #2c3e50;
        
        .el-icon {
          margin-right: 0.5rem;
          color: #667eea;
        }
      }
    }
  }
}

.notification-list {
  .notice-item {
    display: flex;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateX(4px);
    }
    
    &.info {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }
    
    &.warning {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
    }
    
    &.success {
      background: #e8f5e8;
      border-left: 4px solid #4caf50;
    }
    
    .notice-icon {
      margin-right: 0.75rem;
      
      .el-icon {
        font-size: 1.25rem;
      }
    }
    
    .notice-content {
      flex: 1;
      
      .notice-title {
        margin: 0 0 0.25rem 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: #2c3e50;
      }
      
      .notice-desc {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: #5a6c7d;
        line-height: 1.4;
      }
      
      .notice-time {
        font-size: 0.75rem;
        color: #7f8c8d;
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
    border-bottom: 1px solid #f8f9fa;
    
    &:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #7f8c8d;
    }
    
    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #2c3e50;
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