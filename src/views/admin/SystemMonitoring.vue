<template>
  <div class="system-monitoring">
    <PageHeader description="实时监控系统性能指标、资源使用率和API响应时间">
      <template #actions>
        <el-select v-model="refreshInterval" style="width: 120px" @change="handleRefreshChange">
          <el-option label="手动刷新" :value="0" />
          <el-option label="30秒刷新" :value="30" />
          <el-option label="60秒刷新" :value="60" />
        </el-select>
        <el-button type="primary" :icon="Refresh" @click="refreshAll">刷新</el-button>
      </template>
    </PageHeader>

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
        <div :ref="perfChart.chartRef" class="chart-container"></div>
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
        <div :ref="rtChart.chartRef" class="chart-container"></div>
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
        <div :ref="dbChart.chartRef" class="chart-container-small"></div>
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
              <span class="app-metric-value" :style="{ color: item.color || 'var(--app-color-ink)' }">{{ item.value }}</span>
            </div>
            <el-progress v-if="item.percent !== undefined" :percentage="item.percent" :stroke-width="6" :color="item.color" />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Monitor, Cpu, Coin, DataLine } from '@element-plus/icons-vue'
import { getResourceUsage, getPerformanceData, getSystemOverview, getDatabaseMonitor, getApplicationMetrics, getResponseTimeTrend } from '@/api/admin/monitoring'
import { useChart } from '@/composables/useChart'
import PageHeader from '@/components/common/PageHeader.vue'

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

// 图表相关（定时轮询刷新走 update 原地更新，避免每次销毁重建闪屏）
const perfChart = useChart()
const rtChart = useChart()
const dbChart = useChart()
const perfPeriod = ref('1h')
const rtPeriod = ref(15)

const getStatusClass = (value) => {
  if (!value || value < 60) return 'status-normal'
  if (value < 80) return 'status-warning'
  return 'status-danger'
}

const getProgressColor = (value) => {
  if (!value || value < 60) return 'var(--app-color-success)'
  if (value < 80) return 'var(--app-color-warning)'
  return 'var(--app-color-danger)'
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
  if (!data) {
    perfChart.update(null)
    return
  }
  const times = data.times || data.timestamps || []
  const cpuData = data.cpu || data.cpuUsage || []
  const memData = data.memory || data.memoryUsage || []
  const diskData = data.disk || data.diskUsage || []
  perfChart.update({
    tooltip: { trigger: 'axis' },
    legend: { data: ['CPU', '内存', '磁盘'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: times, boundaryGap: false },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      { name: 'CPU', type: 'line', smooth: true, data: cpuData, itemStyle: { color: '#0066cc' } },
      { name: '内存', type: 'line', smooth: true, data: memData, itemStyle: { color: '#34c759' } },
      { name: '磁盘', type: 'line', smooth: true, data: diskData, itemStyle: { color: '#ff9500' } }
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
  if (!data) {
    rtChart.update(null)
    return
  }
  // 字段名对齐后端 /api/admin/monitoring/response-time-trend 的规范字段
  const times = data.timestamps || []
  const avgData = data.avgResponseTime || []
  const maxData = data.maxResponseTime || []
  const p99Data = data.p99ResponseTime || []
  rtChart.update({
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均响应时间', '最大响应时间', 'P99'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: times, boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}ms' } },
    series: [
      { name: '平均响应时间', type: 'line', smooth: true, data: avgData, itemStyle: { color: '#0066cc' } },
      { name: '最大响应时间', type: 'line', smooth: true, data: maxData, itemStyle: { color: '#ff3b30' } },
      { name: 'P99', type: 'line', smooth: true, data: p99Data, itemStyle: { color: '#ff9500' } }
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
  if (!data) {
    dbChart.update(null)
    return
  }
  const poolData = data.poolUsageHistory || []
  dbChart.update({
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
        { label: '线程数', value: d.threadCount || 0, color: '#0066cc' },
        { label: 'GC 次数 (Young)', value: d.youngGcCount || 0, color: '#34c759' },
        { label: 'GC 次数 (Full)', value: d.fullGcCount || 0, color: d.fullGcCount > 5 ? '#ff3b30' : '#34c759' },
        { label: '类加载数', value: d.loadedClassCount || 0 }
      ]
    }
  } catch (e) {
    console.error('加载应用指标失败', e)
  }
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
  refreshAll()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.system-monitoring { padding: 0; font-family: var(--app-font-family); }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--app-space-4); margin-bottom: var(--app-space-4); }
.stat-card { display: flex; align-items: center; gap: var(--app-space-4); padding: var(--app-space-4); }
.stat-icon { width: 56px; height: 56px; border-radius: var(--app-radius-lg); display: flex; align-items: center; justify-content: center; color: var(--app-color-card-bg); flex-shrink: 0; }
.stat-icon.cpu { background: var(--app-color-primary); }
.stat-icon.memory { background: var(--app-color-success); }
.stat-icon.disk { background: var(--app-color-warning); }
.stat-icon.db { background: var(--app-color-purple); }
.stat-info { flex: 1; min-width: 0; }
.stat-value { font-size: var(--app-fs-metric); font-weight: 700; color: var(--app-color-ink); line-height: 1.2; }
.stat-value.status-normal { color: var(--app-color-success); }
.stat-value.status-warning { color: var(--app-color-warning); }
.stat-value.status-danger { color: var(--app-color-danger); }
.stat-label { font-size: var(--app-fs-meta); color: var(--app-color-info); margin: var(--app-space-1) 0 var(--app-space-2); }

.overview-card { margin-bottom: var(--app-space-4); }
.card-title { font-weight: 600; font-size: var(--app-fs-caption); font-family: var(--app-font-family); }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--app-space-4); margin-bottom: var(--app-space-4); }
.chart-card { margin-bottom: 0; }
.chart-container { width: 100%; height: 320px; }
.chart-container-small { width: 100%; height: 200px; }

.db-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--app-space-3); margin-bottom: var(--app-space-4); }
.db-metric-item { text-align: center; padding: var(--app-space-3); background: var(--app-color-fill); border-radius: var(--app-radius-sm); }
.db-metric-value { font-size: var(--app-fs-title); font-weight: 600; color: var(--app-color-ink); }
.db-metric-label { font-size: var(--app-fs-meta); color: var(--app-color-info); margin-top: var(--app-space-1); }

.app-metrics { display: flex; flex-direction: column; gap: var(--app-space-4); }
.app-metric-item { }
.app-metric-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-1); }
.app-metric-label { font-size: var(--app-fs-meta); color: var(--app-color-text); }
.app-metric-value { font-size: var(--app-fs-body); font-weight: 600; }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .db-metrics { grid-template-columns: 1fr; }
}
</style>
