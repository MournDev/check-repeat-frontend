<template>
  <div class="stat-report">
    <!-- 页头 -->
    <el-card class="console-card console-page-head-card" shadow="never">
      <div class="head-row">
        <div class="head-text">
          <h2 class="head-title">统计报表</h2>
          <p class="head-desc">全校查重结果分布、学院对比与近 12 个月查重趋势，支持一键导出 xlsx。</p>
        </div>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </el-card>

    <!-- 相似度分布 + 月度趋势 -->
    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <el-card class="console-card chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Histogram /></el-icon>
                相似度分布
              </span>
            </div>
          </template>
          <div v-loading="distLoading" class="chart-body">
            <div v-show="distList.length" ref="distChartRef" class="chart-container"></div>
            <el-empty v-if="!distLoading && !distList.length" description="暂无查重结果数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="console-card chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><TrendCharts /></el-icon>
                月度趋势（近 12 个月）
              </span>
            </div>
          </template>
          <div v-loading="trendLoading" class="chart-body">
            <div v-show="trendList.length" ref="trendChartRef" class="chart-container"></div>
            <el-empty v-if="!trendLoading && !trendList.length" description="暂无月度趋势数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 学院对比 -->
    <el-card class="console-card chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            学院对比（按平均相似度降序）
          </span>
        </div>
      </template>
      <div v-loading="compareLoading" class="chart-body">
        <div v-show="compareList.length" ref="compareChartRef" class="chart-container compare"></div>
        <el-empty v-if="!compareLoading && !compareList.length" description="暂无学院对比数据" :image-size="80" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Histogram, TrendCharts, DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getSimilarityDistribution,
  getCollegeCompare,
  getMonthlyTrend,
  exportStatReport
} from '@/api/p5'

// 百分比统一保留 2 位小数拼 %，null 显示「—」
const formatPercent = (v) => (v === null || v === undefined || v === '' ? '—' : `${Number(v).toFixed(2)}%`)

// ==================== 相似度分布 ====================
const distChartRef = ref()
const distList = ref([])
const distLoading = ref(false)
let distChart = null

const loadDistribution = async () => {
  distLoading.value = true
  try {
    const res = await getSimilarityDistribution()
    distList.value = Array.isArray(res.data) ? res.data : []
  } catch {
    // 拦截器已提示，本图独立空态
    distList.value = []
  } finally {
    distLoading.value = false
  }
  await nextTick()
  renderDistribution()
}

const renderDistribution = () => {
  if (!distList.value.length || !distChartRef.value) return
  if (!distChart) distChart = echarts.init(distChartRef.value)
  distChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      // x 轴用 bucket 原文（"0-10"…"90-100"）
      data: distList.value.map((it) => it.bucket),
      axisTick: { alignWithLabel: true },
      name: '相似度(%)'
    },
    yAxis: { type: 'value', name: '数量', minInterval: 1 },
    series: [
      {
        name: '查重结果数',
        type: 'bar',
        barWidth: '55%',
        data: distList.value.map((it) => Number(it.count ?? 0)),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#5ac8fa' },
            { offset: 1, color: '#0066cc' }
          ])
        }
      }
    ]
  })
}

// ==================== 学院对比 ====================
const compareChartRef = ref()
const compareList = ref([])
const compareLoading = ref(false)
let compareChart = null

const loadCollegeCompare = async () => {
  compareLoading.value = true
  try {
    const res = await getCollegeCompare()
    const list = Array.isArray(res.data) ? res.data : []
    // 按 avgRate 降序；collegeId 为 null 的行 collegeName=「未分配」原样展示
    compareList.value = [...list].sort((a, b) => Number(b.avgRate ?? 0) - Number(a.avgRate ?? 0))
  } catch {
    compareList.value = []
  } finally {
    compareLoading.value = false
  }
  await nextTick()
  renderCollegeCompare()
}

const renderCollegeCompare = () => {
  if (!compareList.value.length || !compareChartRef.value) return
  if (!compareChart) compareChart = echarts.init(compareChartRef.value)
  // 横向条形图：数值最大的显示在最上方
  const rows = [...compareList.value].reverse()
  compareChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        const row = rows[p.dataIndex]
        return `${row.collegeName}<br/>平均相似度：${formatPercent(row.avgRate)}<br/>论文数：${row.total ?? 0}`
      }
    },
    grid: { left: '3%', right: '6%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: '平均相似度(%)' },
    yAxis: {
      type: 'category',
      data: rows.map((it) => it.collegeName),
      axisLabel: {
        width: 120,
        overflow: 'truncate'
      }
    },
    series: [
      {
        name: '平均相似度',
        type: 'bar',
        barWidth: '55%',
        data: rows.map((it) => Number(it.avgRate ?? 0)),
        label: {
          show: true,
          position: 'right',
          formatter: ({ dataIndex }) => formatPercent(rows[dataIndex].avgRate)
        },
        itemStyle: { borderRadius: [0, 6, 6, 0], color: '#0066cc' }
      }
    ]
  })
}

// ==================== 月度趋势 ====================
const trendChartRef = ref()
const trendList = ref([])
const trendLoading = ref(false)
let trendChart = null

const loadMonthlyTrend = async () => {
  trendLoading.value = true
  try {
    const res = await getMonthlyTrend()
    const list = Array.isArray(res.data) ? res.data : []
    // 后端已按 ym 升序，前端再排一次兜底
    trendList.value = [...list].sort((a, b) => String(a.ym).localeCompare(String(b.ym)))
  } catch {
    trendList.value = []
  } finally {
    trendLoading.value = false
  }
  await nextTick()
  renderMonthlyTrend()
}

const renderMonthlyTrend = () => {
  if (!trendList.value.length || !trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const idx = params[0]?.dataIndex ?? 0
        const row = trendList.value[idx]
        return `${row.ym}<br/>查重次数：${row.count ?? 0}<br/>平均重复率：${formatPercent(row.avgRate)}`
      }
    },
    legend: { bottom: 0, data: ['查重次数', '平均重复率'] },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: trendList.value.map((it) => it.ym) },
    yAxis: [
      { type: 'value', name: '次数', minInterval: 1 },
      { type: 'value', name: '平均重复率(%)', axisLabel: { formatter: '{value}' } }
    ],
    series: [
      {
        name: '查重次数',
        type: 'bar',
        barWidth: '45%',
        data: trendList.value.map((it) => Number(it.count ?? 0)),
        itemStyle: { borderRadius: [6, 6, 0, 0], color: '#5ac8fa' }
      },
      {
        name: '平均重复率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: trendList.value.map((it) => (it.avgRate === null || it.avgRate === undefined ? null : Number(it.avgRate))),
        itemStyle: { color: '#ff9500' }
      }
    ]
  })
}

// ==================== 导出 ====================
const exporting = ref(false)
const handleExport = async () => {
  exporting.value = true
  try {
    const res = await exportStatReport()
    // request 在 responseType=blob 时返回 axios response
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stat_report_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出已开始')
  } catch (error) {
    console.error('导出统计报表失败:', error)
    ElMessage.error(error.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// ==================== 生命周期 ====================
const handleResize = () => {
  distChart?.resize()
  compareChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  // 三个接口并行加载，各自独立空态（单个失败不影响其他图）
  Promise.all([loadDistribution(), loadCollegeCompare(), loadMonthlyTrend()])
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  distChart?.dispose()
  compareChart?.dispose()
  trendChart?.dispose()
  distChart = null
  compareChart = null
  trendChart = null
})
</script>

<style scoped lang="scss">
.stat-report {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.head-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 600;
}

.head-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.chart-card {
  margin-bottom: 0;

  :deep(.el-card__header) {
    padding: 1rem 1.25rem;

    .card-header {
      display: flex;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        font-weight: 600;

        .el-icon {
          margin-right: 0.5rem;
          color: var(--apple-primary);
        }
      }
    }
  }
}

.chart-body {
  min-height: 200px;
}

.chart-container {
  height: 320px;

  &.compare {
    height: 380px;
  }
}

@media (max-width: 992px) {
  .el-col {
    margin-bottom: 16px;
  }
}
</style>
