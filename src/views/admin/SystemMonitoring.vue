<template>
  <div class="system-monitoring">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">系统监控</h1>
        <p class="page-desc">实时监控系统性能指标、资源使用率和API响应时间</p>
      </div>
      <div class="header-actions">
        <el-select v-model="refreshInterval" style="width: 120px" @change="handleRefreshChange">
          <el-option label="手动刷新" :value="0" />
          <el-option label="30秒刷新" :value="30" />
          <el-option label="60秒刷新" :value="60" />
        </el-select>
        <el-button type="primary" :icon="Refresh" @click="refreshAll">刷新</el-button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div class="stats-row">
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon cpu"><el-icon :size="28"><Monitor /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value" :class="getStatusClass(resources.cpuUsage)">{{ resources.cpuUsage || 0 }}%</div>
          <div class="stat-label">CPU 使用率</div>
          <el-progress :percentage="resources.cpuUsage || 0" :stroke-width="4" :show-text="false" :color="getProgressColor(resources.cpuUsage)" />
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon memory"><el-icon :size="28"><Cpu /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value" :class="getStatusClass(resources.memoryUsage)">{{ resources.memoryUsage || 0 }}%</div>
          <div class="stat-label">内存使用率</div>
          <el-progress :percentage="resources.memoryUsage || 0" :stroke-width="4" :show-text="false" :color="getProgressColor(resources.memoryUsage)" />
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon disk"><el-icon :size="28"><Coin /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value" :class="getStatusClass(resources.diskUsage)">{{ resources.diskUsage || 0 }}%</div>
          <div class="stat-label">磁盘使用率</div>
          <el-progress :percentage="resources.diskUsage || 0" :stroke-width="4" :show-text="false" :color="getProgressColor(resources.diskUsage)" />
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-icon db"><el-icon :size="28"><DataLine /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value" :class="getStatusClass(resources.dbPoolUsage)">{{ resources.dbPoolUsage || 0 }}%</div>
          <div class="stat-label">数据库连接池</div>
          <el-progress :percentage="resources.dbPoolUsage || 0" :stroke-width="4" :show-text="false" :color="getProgressColor(resources.dbPoolUsage)" />
        </div>
      </el-card>
    </div>

    <!-- 系统概览信息 -->
    <el-card class="overview-card" shadow="never">
      <template #header>
        <span class="card-title">系统概览</span>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="系统运行时间">{{ overview.uptime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="系统版本">{{ overview.version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Java 版本">{{ overview.javaVersion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ overview.osName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总请求数">{{ overview.totalRequests || 0 }}</el-descriptions-item>
        <el-descriptions-item label="平均响应时间">{{ overview.avgResponseTime || 0 }}ms</el-descriptions-item>
        <el-descriptions-item label="错误率">{{ overview.errorRate || 0 }}%</el-descriptions-item>
        <el-descriptions-item label="活跃线程数">{{ overview.activeThreads || 0 }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 图表区域 -->
    <div class="charts-row">
      <!-- 系统性能趋势 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">系统性能趋势</span>
            <el-select v-model="perfPeriod" style="width: 100px" size="small" @change="loadPerformanceData">
              <el-option label="最近1小时" value="1h" />
              <el-option label="最近6小时" value="6h" />
              <el-option label="最近24小时" value="24h" />
            </el-select>
          </div>
        </template>
        <div ref="perfChartRef" class="chart-container"></div>
      </el-card>

      <!-- API 响应时间趋势 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">API 响应时间趋势</span>
            <el-select v-model="rtPeriod" style="width: 100px" size="small" @change="loadResponseTimeTrend">
              <el-option label="最近15分钟" :value="15" />
              <el-option label="最近30分钟" :value="30" />
              <el-option label="最近60分钟" :value="60" />
            </el-select>
          </div>
        </template>
        <div ref="rtChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <div class="charts-row">
      <!-- 数据库监控 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span class="card-title">数据库监控</span>
        </template>
        <div class="db-metrics">
          <div class="db-metric-item" v-for="item in dbMetrics" :key="item.label">
            <div class="db-metric-value">{{ item.value }}</div>
            <div class="db-metric-label">{{ item.label }}</div>
          </div>
        </div>
        <div ref="dbChartRef" class="chart-container-small"></div>
      </el-card>

      <!-- 应用性能指标 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span class="card-title">应用性能指标</span>
        </template>
        <div class="app-metrics">
          <div class="app-metric-item" v-for="item in appMetrics" :key="item.label">
            <div class="app-metric-row">
              <span class="app-metric-label">{{ item.label }}</span>
              <span class="app-metric-value" :style="{ color: item.color || '#303133' }">{{ item.value }}</span>
            </div>
            <el-progress v-if="item.percent !== undefined" :percentage="item.percent" :stroke-width="6" :color="item.color" />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Monitor, Cpu, Coin, DataLine } from '@element-plus/icons-vue'
import { getResourceUsage, getPerformanceData, getApiResponseTimes, getSystemOverview, getDatabaseMonitor, getApplicationMetrics, getResponseTimeTrend } from '@/api/admin/monitoring'
import * as echarts from 'echarts'

const refreshInterval = ref(0)
let refreshTimer = null

// 资源数据
const resources = reactive({
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  dbPoolUsage: 0
})

// 系统概览
const overview = reactive({
  uptime: '',
  version: '',
  javaVersion: '',
  osName: '',
  totalRequests: 0,
  avgResponseTime: 0,
  errorRate: 0,
  activeThreads: 0
})

// 数据库指标
const dbMetrics = ref([])
const appMetrics = ref([])

// 图表相关
const perfChartRef = ref(null)
const rtChartRef = ref(null)
const dbChartRef = ref(null)
let perfChart = null
let rtChart = null
let dbChart = null
const perfPeriod = ref('1h')
const rtPeriod = ref(15)

const getStatusClass = (value) => {
  if (!value || value < 60) return 'status-normal'
  if (value < 80) return 'status-warning'
  return 'status-danger'
}

const getProgressColor = (value) => {
  if (!value || value < 60) return '#67C23A'
  if (value < 80) return '#E6A23C'
  return '#F56C6C'
}

const loadResources = async () => {
  try {
    const res = await getResourceUsage()
    if (res.code === 200 && res.data) {
      Object.assign(resources, {
        cpuUsage: Math.round(res.data.cpuUsage || 0),
        memoryUsage: Math.round(res.data.memoryUsage || 0),
        diskUsage: Math.round(res.data.diskUsage || 0),
        dbPoolUsage: Math.round(res.data.dbPoolUsage || 0)
      })
    }
  } catch (e) {
    console.error('加载资源数据失败', e)
  }
}

const loadOverview = async () => {
  try {
    const res = await getSystemOverview()
    if (res.code === 200 && res.data) {
      Object.assign(overview, res.data)
    }
  } catch (e) {
    console.error('加载系统概览失败', e)
  }
}

const loadPerformanceData = async () => {
  try {
    const res = await getPerformanceData('all', perfPeriod.value)
    if (res.code === 200 && res.data) {
      renderPerfChart(res.data)
    }
  } catch (e) {
    console.error('加载性能数据失败', e)
  }
}

const renderPerfChart = (data) => {
  if (!perfChart || !data) return
  const times = data.times || data.timestamps || []
  const cpuData = data.cpu || data.cpuUsage || []
  const memData = data.memory || data.memoryUsage || []
  const diskData = data.disk || data.diskUsage || []
  perfChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['CPU', '内存', '磁盘'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: times, boundaryGap: false },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      { name: 'CPU', type: 'line', smooth: true, data: cpuData, itemStyle: { color: '#409EFF' } },
      { name: '内存', type: 'line', smooth: true, data: memData, itemStyle: { color: '#67C23A' } },
      { name: '磁盘', type: 'line', smooth: true, data: diskData, itemStyle: { color: '#E6A23C' } }
    ]
  })
}

const loadResponseTimeTrend = async () => {
  try {
    const res = await getResponseTimeTrend(rtPeriod.value)
    if (res.code === 200 && res.data) {
      renderRtChart(res.data)
    }
  } catch (e) {
    console.error('加载响应时间数据失败', e)
  }
}

const renderRtChart = (data) => {
  if (!rtChart || !data) return
  const times = data.times || data.timestamps || []
  const avgData = data.avg || data.avgTime || []
  const maxData = data.max || data.maxTime || []
  const p99Data = data.p99 || data.p99Time || []
  rtChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均响应时间', '最大响应时间', 'P99'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: times, boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}ms' } },
    series: [
      { name: '平均响应时间', type: 'line', smooth: true, data: avgData, itemStyle: { color: '#409EFF' } },
      { name: '最大响应时间', type: 'line', smooth: true, data: maxData, itemStyle: { color: '#F56C6C' } },
      { name: 'P99', type: 'line', smooth: true, data: p99Data, itemStyle: { color: '#E6A23C' } }
    ]
  })
}

const loadDatabaseData = async () => {
  try {
    const res = await getDatabaseMonitor()
    if (res.code === 200 && res.data) {
      const d = res.data
      dbMetrics.value = [
        { label: '活跃连接', value: d.activeConnections || 0 },
        { label: '最大连接', value: d.maxConnections || 0 },
        { label: '空闲连接', value: d.idleConnections || 0 },
        { label: '等待线程', value: d.waitingThreads || 0 },
        { label: '慢查询数', value: d.slowQueries || 0 },
        { label: '查询缓存命中率', value: (d.cacheHitRate || 0) + '%' }
      ]
      renderDbChart(d)
    }
  } catch (e) {
    console.error('加载数据库数据失败', e)
  }
}

const renderDbChart = (data) => {
  if (!dbChart) return
  const poolData = data.poolUsageHistory || []
  dbChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: poolData.map(i => i.time || i.timestamp), boundaryGap: false },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      name: '连接池使用率',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: poolData.map(i => i.value || i.usage),
      itemStyle: { color: '#9B59B6' }
    }]
  })
}

const loadAppMetrics = async () => {
  try {
    const res = await getApplicationMetrics()
    if (res.code === 200 && res.data) {
      const d = res.data
      appMetrics.value = [
        { label: 'JVM 堆内存', value: d.heapUsed + ' / ' + d.heapMax, percent: d.heapPercent, color: getProgressColor(d.heapPercent) },
        { label: '非堆内存', value: d.nonHeapUsed || '-', percent: d.nonHeapPercent, color: getProgressColor(d.nonHeapPercent) },
        { label: '线程数', value: d.threadCount || 0, color: '#409EFF' },
        { label: 'GC 次数 (Young)', value: d.youngGcCount || 0, color: '#67C23A' },
        { label: 'GC 次数 (Full)', value: d.fullGcCount || 0, color: d.fullGcCount > 5 ? '#F56C6C' : '#67C23A' },
        { label: '类加载数', value: d.loadedClassCount || 0 }
      ]
    }
  } catch (e) {
    console.error('加载应用指标失败', e)
  }
}

const initCharts = () => {
  nextTick(() => {
    if (perfChartRef.value) {
      perfChart = echarts.init(perfChartRef.value)
    }
    if (rtChartRef.value) {
      rtChart = echarts.init(rtChartRef.value)
    }
    if (dbChartRef.value) {
      dbChart = echarts.init(dbChartRef.value)
    }
    window.addEventListener('resize', handleResize)
  })
}

const handleResize = () => {
  perfChart?.resize()
  rtChart?.resize()
  dbChart?.resize()
}

const refreshAll = async () => {
  await Promise.all([
    loadResources(),
    loadOverview(),
    loadPerformanceData(),
    loadResponseTimeTrend(),
    loadDatabaseData(),
    loadAppMetrics()
  ])
  ElMessage.success('数据已刷新')
}

const handleRefreshChange = (val) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (val > 0) {
    refreshTimer = setInterval(() => {
      refreshAll()
    }, val * 1000)
  }
}

onMounted(() => {
  initCharts()
  refreshAll()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  perfChart?.dispose()
  rtChart?.dispose()
  dbChart?.dispose()
})
</script>

<style scoped>
.system-monitoring { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; margin: 0 0 4px 0; }
.page-desc { color: #909399; margin: 0; font-size: 14px; }
.header-actions { display: flex; gap: 8px; align-items: center; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 16px; }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-icon.cpu { background: linear-gradient(135deg, #409EFF, #337ecc); }
.stat-icon.memory { background: linear-gradient(135deg, #67C23A, #529b2e); }
.stat-icon.disk { background: linear-gradient(135deg, #E6A23C, #b88230); }
.stat-icon.db { background: linear-gradient(135deg, #9B59B6, #7d3c98); }
.stat-info { flex: 1; min-width: 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; line-height: 1.2; }
.stat-value.status-normal { color: #67C23A; }
.stat-value.status-warning { color: #E6A23C; }
.stat-value.status-danger { color: #F56C6C; }
.stat-label { font-size: 13px; color: #909399; margin: 4px 0 8px; }

.overview-card { margin-bottom: 16px; }
.card-title { font-weight: 600; font-size: 15px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.chart-card { margin-bottom: 0; }
.chart-container { width: 100%; height: 320px; }
.chart-container-small { width: 100%; height: 200px; }

.db-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.db-metric-item { text-align: center; padding: 12px; background: #f5f7fa; border-radius: 8px; }
.db-metric-value { font-size: 20px; font-weight: 600; color: #303133; }
.db-metric-label { font-size: 12px; color: #909399; margin-top: 4px; }

.app-metrics { display: flex; flex-direction: column; gap: 16px; }
.app-metric-item { }
.app-metric-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.app-metric-label { font-size: 13px; color: #606266; }
.app-metric-value { font-size: 16px; font-weight: 600; }
</style>
