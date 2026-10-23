<template>
  <div class="check-history-page">
    <!-- 页面头部 -->
    <PageHeader>
      <template #actions>
        <button class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <button class="refresh-button" @click="refreshHistory">
          <el-icon><Refresh /></el-icon>
          <span>刷新</span>
        </button>
      </template>
    </PageHeader>

    <!-- 论文信息 -->
    <div class="paper-info-card" v-loading="historyLoading">
      <div class="paper-header">
        <h2 class="paper-title">{{ paperInfo.title }}</h2>
        <div class="paper-stats">
          <div class="stat-item">
            <div class="stat-label">总相似比</div>
            <div class="stat-value" :class="getCurrentSimilarityClass(paperInfo.currentSimilarity)">{{ formatPercent(paperInfo.currentSimilarity) }}</div>
          </div>
          <!-- P5 新指标：存量任务为 null，显示「—」不按 0 处理 -->
          <div class="stat-item">
            <div class="stat-label">单篇最大</div>
            <div class="stat-value">{{ formatMetric(paperInfo.maxPerSource) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">引用率</div>
            <div class="stat-value">{{ formatMetric(paperInfo.citationRate) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">历史最低</div>
            <div class="stat-value lowest">{{ formatPercent(paperInfo.lowestSimilarity) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">版本数</div>
            <div class="stat-value">{{ paperInfo.versionCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相似度趋势图 -->
    <div class="trend-card">
      <div class="card-header">
        <div class="card-title">
          <el-icon><DataLine /></el-icon>
          <span>相似度趋势</span>
        </div>
        <div class="trend-controls">
          <div class="radio-group">
            <label 
              v-for="period in ['7', '30', '90']" 
              :key="period"
              class="radio-button"
              :class="{ active: trendPeriod === period }"
              @click="trendPeriod = period; loadTrendData()"
            >
              近{{ period }}天
            </label>
          </div>
        </div>
      </div>
      
      <div class="trend-chart-container">
        <div class="chart-wrapper">
          <el-empty v-if="trendChart.empty" description="暂无趋势数据" :image-size="60" />
          <div v-else :ref="trendChart.chartRef" style="width: 100%; height: 400px;"></div>
        </div>
        <div class="trend-summary">
          <div class="summary-item">
            <div class="summary-label">总体趋势</div>
            <div class="summary-value" :class="trendAnalysis.direction">
              {{ getTrendText(trendAnalysis.direction) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">总改进幅度</div>
            <div class="summary-value improvement">
              ↓{{ Math.abs(trendAnalysis.totalImprovement) }}%
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">平均每版改进</div>
            <div class="summary-value">
              {{ trendAnalysis.averageImprovementPerVersion > 0 ? '+' : '' }}{{ trendAnalysis.averageImprovementPerVersion.toFixed(1) }}%
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">最佳版本</div>
            <div class="summary-value best">
              V{{ trendAnalysis.bestVersion }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- P5 查重指标趋势（总相似比 + 单篇最大 + 引用率，新口径） -->
    <div class="trend-card p5-trend-card">
      <div class="card-header">
        <div class="card-title">
          <el-icon><TrendCharts /></el-icon>
          <span>查重指标趋势</span>
        </div>
      </div>
      <div v-loading="p5TrendLoading">
        <div v-if="!p5TrendLoading && p5TrendList.length === 0" class="trend-empty">暂无查重记录</div>
        <div v-show="p5TrendList.length > 0" :ref="p5TrendChart.chartRef" class="p5-trend-chart"></div>
      </div>
    </div>

    <!-- 版本历史时间轴 -->
    <div class="history-card">
      <div class="card-header">
        <div class="card-title">
          <el-icon><Timer /></el-icon>
          <span>版本历史</span>
        </div>
        <button class="text-button" @click="toggleCompactView">
          {{ compactView ? '展开详情' : '紧凑显示' }}
        </button>
      </div>
      
      <div class="timeline-container" v-loading="historyLoading">
        <el-empty v-if="!historyLoading && historyRecords.length === 0" description="暂无查重历史" :image-size="100" />
        <div class="timeline" v-else>
          <div 
            v-for="(record, index) in historyRecords" 
            :key="record.version"
            class="timeline-item"
          >
            <div class="timeline-node" :class="getTimelineType(record.rating)"></div>
            <div class="timeline-line" v-if="index < historyRecords.length - 1"></div>
            <div class="timeline-content">
              <div class="timeline-timestamp">{{ formatDateTime(record.checkTime, 'YYYY-MM-DD HH:mm', '-') }}</div>
              <div class="history-record" :class="{ 'current-version': record.isCurrent }">
                <div class="record-header">
                  <div class="version-info">
                    <el-tag 
                      :type="record.isCurrent ? 'primary' : 'info'" 
                      size="large"
                      effect="dark"
                    >
                      V{{ record.version }}
                    </el-tag>
                    <span class="similarity-badge" :class="getSimilarityClass(record.similarity)">
                      {{ formatPercent(record.similarity) }}
                    </span>
                    <el-tag :type="getRatingType(record.rating)" size="small">
                      {{ getRatingText(record.rating) }}
                    </el-tag>
                  </div>
                  <div class="record-actions" v-if="!compactView">
                    <el-button
                      v-if="record.taskId"
                      type="primary"
                      text
                      size="small"
                      @click="viewSentenceDetail(record.taskId)"
                    >
                      查看检测明细
                    </el-button>
                    <el-button
                      v-if="record.reportId"
                      text
                      size="small"
                      @click="viewReport(record.reportId)"
                    >
                      查看报告
                    </el-button>
                    <el-button
                      v-if="record.reportId"
                      text
                      size="small"
                      @click="downloadPdfReport(record.reportId)"
                    >
                      <el-icon><Download /></el-icon>
                      下载PDF
                    </el-button>
                    <el-button 
                      text 
                      size="small" 
                      @click="compareWithCurrent(record)"
                      v-if="!record.isCurrent"
                    >
                      对比当前
                    </el-button>
                  </div>
                </div>
                
                <div class="record-content" v-if="!compactView">
                  <!-- P5 新指标：该次查重的单篇最大/引用率，存量记录为 null 显示「—」 -->
                  <div class="p5-metric-row">
                    <span class="p5-metric-item">单篇最大：{{ formatMetric(record.maxPerSource) }}</span>
                    <span class="p5-metric-item">引用率：{{ formatMetric(record.citationRate) }}</span>
                  </div>
                  <div class="changes-description">
                    <el-icon><EditPen /></el-icon>
                    <span>{{ record.changes }}</span>
                  </div>
                  
                  <div class="improvement-info" v-if="record.improvementFromPrevious != null">
                    <div class="improvement-badge" :class="getImprovementClass(record.improvementFromPrevious)">
                      {{ record.improvementFromPrevious > 0 ? '+' : '' }}{{ (record.improvementFromPrevious || 0).toFixed(1) }}%
                    </div>
                    <span>相比上一版本</span>
                  </div>
                  
                  <div class="section-changes" v-if="record.sectionChanges">
                    <div class="section-change" v-for="(change, section) in record.sectionChanges" :key="section">
                      <span class="section-name">{{ getSectionName(section) }}:</span>
                      <span class="change-value" :class="getChangeClass(change.change)">
                        {{ change.to || 0 }}% ({{ (change.change || 0) > 0 ? '+' : '' }}{{ (change.change || 0).toFixed(1) }}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 版本对比面板 -->
    <el-drawer
      v-model="showCompareDrawer"
      title="版本对比分析"
      direction="rtl"
      size="60%"
    >
      <div class="compare-content" v-if="compareData">
        <div class="compare-header">
          <div class="version-tags">
            <span class="version-tag old">V{{ compareData.fromVersion }}</span>
            <span class="vs">VS</span>
            <span class="version-tag current">V{{ compareData.toVersion }}</span>
          </div>
          <div class="overall-change" :class="getImprovementClass(compareData.overallChange)">
            总体变化: {{ (compareData.overallChange || 0) > 0 ? '+' : '' }}{{ (compareData.overallChange || 0).toFixed(1) }}%
          </div>
        </div>
        
        <div class="compare-sections">
          <div 
            v-for="section in compareData.sectionComparison" 
            :key="section.name"
            class="section-compare-card"
          >
            <div class="section-header">
              <span class="section-name">{{ section.name }}</span>
              <span class="change-tag" :class="getChangeTagType(section.change)">
                {{ section.change > 0 ? '+' : '' }}{{ section.change.toFixed(1) }}%
              </span>
            </div>
            
            <div class="section-details">
              <div class="similarity-compare">
                <div class="similarity-item">
                  <div class="version-label">V{{ compareData.fromVersion }}</div>
                  <div class="progress-container">
                    <div 
                      class="progress-bar" 
                      :style="{ width: section.from + '%' }"
                      :class="getSimilarityClass(section.from)"
                    ></div>
                  </div>
                  <span class="similarity-value">{{ formatPercent(section.from) }}</span>
                </div>
                <div class="similarity-item">
                  <div class="version-label">V{{ compareData.toVersion }}</div>
                  <div class="progress-container">
                    <div 
                      class="progress-bar" 
                      :style="{ width: section.to + '%' }"
                      :class="getSimilarityClass(section.to)"
                    ></div>
                  </div>
                  <span class="similarity-value">{{ formatPercent(section.to) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 统计分析卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon improvement-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.improvementRate }}%</div>
            <div class="stat-label">改进效率</div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon average-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ formatPercent(stats.averageSimilarity) }}</div>
            <div class="stat-label">平均相似度</div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon speed-icon">
            <el-icon><Lightning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.improvementSpeed }}</div>
            <div class="stat-label">改进速度</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Refresh, DataLine, Timer, EditPen, TrendCharts, 
  DataAnalysis, Lightning, ArrowRight, ArrowLeft, Download
} from '@element-plus/icons-vue'

import { getCheckHistory, getSimilarityTrend, compareVersionHistory } from '@/api/student'
import { getPaperSimilarityTrend } from '@/api/p5'
import { getSimilarityColor } from '@/utils/similarity.js'
import { formatDateTime, formatPercent } from '@/utils/dataType.js'
import { useChart } from '@/composables/useChart'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const paperInfo = ref({
  title: '',
  currentSimilarity: 0,
  lowestSimilarity: 0,
  versionCount: 0,
  // P5 新指标：存量任务为 null，展示「—」
  maxPerSource: null,
  citationRate: null
})

const trendPeriod = ref('30')
const compactView = ref(false)
const showCompareDrawer = ref(false)

// 相似度趋势图 + P5 查重指标趋势图（useChart 托管容器/dispose/resize/空态）
const trendChart = useChart()

// P5 查重指标趋势（总相似比/单篇最大/引用率）
const p5TrendChart = useChart()
const p5TrendList = ref([])
const p5TrendLoading = ref(false)

const historyRecords = ref([])
const historyLoading = ref(false)

const trendAnalysis = ref({
  direction: 'stable',
  totalImprovement: 0,
  averageImprovementPerVersion: 0,
  bestVersion: 0
})

const compareData = ref(null)
const stats = ref({
  improvementRate: 0,
  averageSimilarity: 0,
  improvementSpeed: ''
})

// 计算属性
const getCurrentSimilarityClass = computed(() => (similarity) => {
  if (similarity < 20) return 'excellent'
  if (similarity < 40) return 'good'
  return 'warning'
})

// 方法
const goBack = () => {
  router.back()
}

// P5 指标展示：null（存量任务）显示「—」，不按 0 处理
const formatMetric = (value) => (value == null ? '—' : `${value}%`)

// 查看句级检测明细（P5 新页，taskId 按字符串传递防雪花 ID 精度丢失）
const viewSentenceDetail = (taskId) => {
  router.push(`/student/sentence-detail/${taskId}`)
}

const refreshHistory = async () => {
  const paperId = route.params.paperId
  
  // 参数验证
  if (!paperId || paperId === 'undefined') {
    ElMessage.error('缺少论文ID参数')
    return
  }

  historyLoading.value = true
  try {
    const res = await getCheckHistory(paperId)
    if (res.code === 200) {
      // 处理历史记录数据
      historyRecords.value = res.data.history || []

      // 处理趋势分析数据 — 优先使用后端数据，否则从历史记录计算
      if (res.data.trendAnalysis) {
        trendAnalysis.value = res.data.trendAnalysis
      } else {
        computeTrendFromRecords(historyRecords.value)
      }
      
      // 处理论文信息 — 优先使用后端数据，否则从历史记录计算
      const records = historyRecords.value
      if (res.data.paperInfo) {
        paperInfo.value = {
          title: res.data.paperInfo.title || '',
          currentSimilarity: res.data.paperInfo.currentSimilarity || 0,
          lowestSimilarity: res.data.paperInfo.lowestSimilarity || 0,
          versionCount: res.data.paperInfo.versionCount || 0,
          maxPerSource: res.data.paperInfo.maxPerSource ?? null,
          citationRate: res.data.paperInfo.citationRate ?? null
        }
      } else if (records.length > 0) {
        const similarities = records.map(r => Number(r.similarity) || 0)
        paperInfo.value = {
          title: route.query.paperTitle || '',
          currentSimilarity: similarities[0] || 0,
          lowestSimilarity: Math.min(...similarities),
          versionCount: records.length
        }
      }

      // 处理统计数据 — 优先使用后端数据，否则从历史记录计算
      if (res.data.statistics) {
        stats.value = {
          improvementRate: res.data.statistics.improvementRate || 0,
          averageSimilarity: res.data.statistics.averageSimilarity || 0,
          improvementSpeed: res.data.statistics.improvementSpeed || ''
        }
      } else if (records.length > 0) {
        const similarities = records.map(r => Number(r.similarity) || 0)
        const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length
        const firstSim = similarities[similarities.length - 1]
        const lastSim = similarities[0]
        const improvementRate = firstSim > 0 ? Math.round((firstSim - lastSim) / firstSim * 100) : 0
        stats.value = {
          improvementRate,
          averageSimilarity: Math.round(avgSim * 10) / 10,
          improvementSpeed: records.length > 1 ? `${(records.length - 1)}个版本` : '首个版本'
        }
      }
      
      ElMessage.success('历史记录已刷新')
    } else {
      ElMessage.error(res.message || '获取历史记录失败')
    }
  } catch (error) {
    console.error('刷新历史记录失败:', error)
    ElMessage.error('刷新失败: ' + (error.message || '网络错误'))
  } finally {
    historyLoading.value = false
  }
}

const loadTrendData = () => {
  const paperId = route.params.paperId
  if (!paperId || paperId === 'undefined') return

  // run() 统一兜底：接口失败显空态（axios 拦截器已提示，不再重复弹错）
  return trendChart.run(
    () => getSimilarityTrend(paperId, trendPeriod.value),
    (data) => (data?.dates?.length ? buildTrendOption(data) : null)
  )
}

const buildTrendOption = (data) => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textStyle: {
      color: '#ffffff',
      fontSize: 13
    },
    formatter: function(params) {
      const param = params[0]
      return `${param.name}<br/>相似度: ${param.value}%`
    }
  },
  grid: {
    left: '10%',
    right: '10%',
    top: '15%',
    bottom: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: data.dates,
    axisLine: {
      lineStyle: {
        color: '#e0e0e0'
      }
    },
    axisLabel: {
      color: '#86868b'
    },
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    axisLine: {
      show: false
    },
    axisLabel: {
      color: '#86868b',
      formatter: '{value}%'
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    }
  },
  series: [{
    name: '相似度',
    type: 'line',
    data: data.similarities,
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {
      width: 3,
      color: '#0066cc'
    },
    itemStyle: {
      color: '#0066cc',
      borderColor: '#ffffff',
      borderWidth: 2
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0, 102, 204, 0.3)' },
          { offset: 1, color: 'rgba(0, 102, 204, 0.05)' }
        ]
      }
    }
  }]
})

const toggleCompactView = () => {
  compactView.value = !compactView.value
}

// ── P5 查重指标趋势 ──────────────────────────────────────
// 接口：getPaperSimilarityTrend（新口径，无 period 参数，按查重完成时间升序）
// x=checkTime，y=repeatRate（总相似比）；maxPerSource/citationRate 叠加为第二/三条线，
// 存量点为 null，用 '-' 断开；空数组显示「暂无查重记录」
const loadP5Trend = async () => {
  const paperId = route.params.paperId

  if (!paperId || paperId === 'undefined') {
    return
  }

  p5TrendLoading.value = true
  try {
    const res = await getPaperSimilarityTrend(paperId)
    if (res.code === 200) {
      p5TrendList.value = res.data || []
      renderP5TrendChart()
    }
  } catch (error) {
    console.error('加载查重指标趋势失败:', error)
  } finally {
    p5TrendLoading.value = false
  }
}

const renderP5TrendChart = () => {
  const list = p5TrendList.value
  if (list.length === 0) {
    p5TrendChart.render(null)
    return
  }

  const xData = list.map(item => item.checkTime)
  // null 点映射为 '-'，connectNulls:false 使线条在缺口处断开
  const toPoints = (key) => list.map(item => (item[key] == null ? '-' : item[key]))

  p5TrendChart.render({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        textStyle: { color: '#ffffff', fontSize: 13 },
        valueFormatter: (value) => (value == null ? '—' : `${value}%`)
      },
      legend: {
        data: ['总相似比', '单篇最大', '引用率'],
        bottom: 0,
        textStyle: { color: '#86868b' }
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '12%',
        bottom: '14%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: { color: '#86868b' },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#86868b', formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.05)' } }
      },
      series: [
        {
          name: '总相似比',
          type: 'line',
          data: toPoints('repeatRate'),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          connectNulls: false,
          lineStyle: { width: 3, color: '#0066cc' },
          itemStyle: { color: '#0066cc', borderColor: '#ffffff', borderWidth: 2 }
        },
        {
          name: '单篇最大',
          type: 'line',
          data: toPoints('maxPerSource'),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          connectNulls: false,
          lineStyle: { width: 2, color: '#ff9500' },
          itemStyle: { color: '#ff9500', borderColor: '#ffffff', borderWidth: 2 }
        },
        {
          name: '引用率',
          type: 'line',
          data: toPoints('citationRate'),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          connectNulls: false,
          lineStyle: { width: 2, color: '#34c759' },
          itemStyle: { color: '#34c759', borderColor: '#ffffff', borderWidth: 2 }
        }
      ]
  })
}

const viewReport = (reportId) => {
  router.push(`/student/plagiarism-report/${route.params.paperId}?reportId=${reportId}`)
}

const downloadPdfReport = (reportId) => {
  try {
    // 构建PDF下载URL
    const downloadUrl = `/api/detection/report/pdf/${reportId}`
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `plagiarism_report_${reportId}_${Date.now()}.pdf`
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('PDF报告下载已开始')
  } catch (error) {
    console.error('下载PDF报告失败:', error)
    ElMessage.error('下载PDF报告失败: ' + (error.message || '网络错误'))
  }
}

const compareWithCurrent = async (record) => {
  const paperId = route.params.paperId

  // 参数验证
  if (!paperId || paperId === 'undefined') {
    ElMessage.error('缺少论文ID参数')
    return
  }

  // 获取当前版本的 submitVersion
  const currentRecord = historyRecords.value.find(r => r.isCurrent)
  const fromSubmitVersion = record.submitVersion ?? record.version
  const toSubmitVersion = currentRecord?.submitVersion ?? paperInfo.value.versionCount

  try {
    const res = await compareVersionHistory(paperId, fromSubmitVersion, toSubmitVersion)

    if (res.code === 200) {
      compareData.value = {
        fromVersion: record.version,
        toVersion: currentRecord?.version || paperInfo.value.versionCount,
        overallChange: res.data.overallChange || 0,
        sectionComparison: res.data.sectionComparison || []
      }
      showCompareDrawer.value = true
      ElMessage.success('版本对比数据加载成功')
    } else {
      ElMessage.error(res.message || '获取对比数据失败')
    }
  } catch (error) {
    console.error('版本对比失败:', error)
    ElMessage.error('版本对比失败: ' + (error.message || '网络错误'))
  }
}

const loadStatistics = async () => {
  const paperId = route.params.paperId
  
  // 参数验证
  if (!paperId || paperId === 'undefined') {
    return
  }
  
  try {
    // 如果有专门的统计接口，这里调用
    // 暂时使用查重历史接口中的统计数据
    const res = await getCheckHistory(paperId)
    if (res.code === 200 && res.data.statistics) {
      stats.value = res.data.statistics
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const getTimelineType = (rating) => {
  const typeMap = {
    excellent: 'success',
    good: 'primary',
    warning: 'warning',
    danger: 'danger'
  }
  return typeMap[rating] || 'info'
}

const getRatingType = (rating) => {
  const typeMap = {
    excellent: 'success',
    good: 'primary',
    warning: 'warning',
    danger: 'danger'
  }
  return typeMap[rating] || 'info'
}

const getRatingText = (rating) => {
  const textMap = {
    excellent: '优秀',
    good: '良好',
    warning: '一般',
    danger: '需改进'
  }
  return textMap[rating] || '未知'
}

const getSimilarityClass = (similarity) => {
  if (similarity < 15) return 'excellent'
  if (similarity < 30) return 'good'
  if (similarity < 50) return 'warning'
  return 'danger'
}

const getImprovementClass = (improvement) => {
  if (improvement == null) return 'unchanged'
  if (improvement < 0) return 'improved'
  if (improvement > 0) return 'regressed'
  return 'unchanged'
}

const getChangeClass = (change) => {
  if (change == null) return 'unchanged'
  if (change < 0) return 'decreased'
  if (change > 0) return 'increased'
  return 'unchanged'
}

const getChangeTagType = (change) => {
  if (change < 0) return 'success'
  if (change > 0) return 'danger'
  return 'info'
}

const getSectionName = (key) => {
  const nameMap = {
    introduction: '引言',
    literature_review: '文献综述',
    methodology: '研究方法',
    results: '实验结果',
    conclusion: '结论'
  }
  return nameMap[key] || key
}

const getTrendText = (direction) => {
  const textMap = {
    decreasing: '持续下降',
    increasing: '持续上升',
    stable: '相对稳定'
  }
  return textMap[direction] || '波动'
}

const computeTrendFromRecords = (records) => {
  if (!records || records.length === 0) {
    trendAnalysis.value = { direction: 'stable', totalImprovement: 0, averageImprovementPerVersion: 0, bestVersion: 0 }
    return
  }

  const similarities = records.map(r => Number(r.similarity) || 0)
  const firstSim = similarities[similarities.length - 1]
  const lastSim = similarities[0]
  const totalImprovement = firstSim - lastSim

  let direction = 'stable'
  if (totalImprovement > 3) direction = 'decreasing'
  else if (totalImprovement < -3) direction = 'increasing'

  const versionCount = similarities.length
  const averageImprovementPerVersion = versionCount > 1 ? totalImprovement / (versionCount - 1) : 0

  let bestVersion = 0
  let bestSim = Infinity
  similarities.forEach((sim, i) => {
    if (sim < bestSim) {
      bestSim = sim
      bestVersion = versionCount - i
    }
  })

  trendAnalysis.value = {
    direction,
    totalImprovement: Math.round(totalImprovement * 10) / 10,
    averageImprovementPerVersion: Math.round(averageImprovementPerVersion * 100) / 100,
    bestVersion
  }
}


// 生命周期
onMounted(async () => {
  await refreshHistory()
  await loadTrendData()
  await loadStatistics()
  loadP5Trend()
})
</script>

<style lang="scss" scoped>
// 全局样式
.check-history-page {

  .back-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-md);
    background: var(--apple-surface);
    color: var(--apple-ink-secondary);
    font-size: var(--apple-fs-caption);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--apple-hairline);
      background: var(--apple-canvas-parchment);
      color: var(--apple-ink);
    }
  }

  .refresh-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-md);
    background: var(--apple-surface);
    color: var(--apple-ink-secondary);
    font-size: var(--apple-fs-caption);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--apple-hairline);
      background: var(--apple-canvas-parchment);
      color: var(--apple-ink);
    }
  }

  // 论文信息卡片
  .paper-info-card {
    background: var(--apple-surface);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-lg);
    padding: var(--apple-spacing-lg);
    margin-bottom: var(--apple-spacing-lg);
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--apple-hairline);
    }
    
    .paper-header {
      .paper-title {
        font-family: var(--apple-font-display);
        font-size: var(--apple-fs-lead-airy);
        font-weight: 600;
        color: var(--apple-ink);
        margin-bottom: var(--apple-spacing-md);
        line-height: 1.25;
      }
      
      .paper-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--apple-spacing-lg);
        
        .stat-item {
          .stat-label {
            font-size: var(--apple-fs-fine-print);
            color: var(--apple-ink-muted-48);
            margin-bottom: var(--apple-spacing-xxs);
            font-weight: 500;
            text-transform: none;
            letter-spacing: 0;
          }
          
          .stat-value {
            font-family: var(--apple-font-display);
            font-size: var(--apple-fs-tagline);
            font-weight: 600;
            color: var(--apple-ink);
            
            &.excellent { color: var(--apple-success); }
            &.good { color: var(--apple-primary); }
            &.warning { color: var(--apple-warning); }
            &.lowest { color: var(--apple-success); }
          }
        }
      }
    }
  }

  // 趋势卡片
  .trend-card {
    background: var(--apple-surface);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-lg);
    padding: var(--apple-spacing-lg);
    margin-bottom: var(--apple-spacing-lg);
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--apple-hairline);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--apple-spacing-md);
      
      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--apple-font-display);
        font-size: var(--apple-fs-body-strong);
        font-weight: 600;
        color: var(--apple-ink);
        
        .el-icon {
          color: var(--apple-ink-muted-48);
        }
      }
      
      .trend-controls {
        .radio-group {
          display: flex;
          gap: 2px;
          background: var(--apple-divider-soft);
          border: 1px solid var(--apple-hairline);
          border-radius: var(--apple-rounded-sm);
          padding: 3px;
          
          .radio-button {
            padding: 5px 12px;
            border-radius: var(--apple-rounded-xs);
            font-size: var(--apple-fs-fine-print);
            font-weight: 500;
            color: var(--apple-ink-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            
            &.active {
              background: var(--apple-surface);
              color: var(--apple-ink);
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
            }
            
            &:hover:not(.active) {
              color: var(--apple-ink);
            }
          }
        }
      }
    }
    
    .trend-chart-container {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: var(--apple-spacing-lg);
      
      .chart-wrapper {
        background: var(--apple-surface);
        border: 1px solid var(--apple-divider-soft);
        border-radius: var(--apple-rounded-md);
        padding: var(--apple-spacing-md);
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .trend-summary {
        display: flex;
        flex-direction: column;
        gap: var(--apple-spacing-md);
        
        .summary-item {
          .summary-label {
            font-size: var(--apple-fs-fine-print);
            color: var(--apple-ink-muted-48);
            margin-bottom: var(--apple-spacing-xxs);
            font-weight: 500;
            text-transform: none;
            letter-spacing: 0;
          }
          
          .summary-value {
            font-family: var(--apple-font-display);
            font-size: var(--apple-fs-tagline);
            font-weight: 600;
            
            &.decreasing { color: var(--apple-success); }
            &.increasing { color: var(--apple-danger); }
            &.stable { color: var(--apple-ink-muted-48); }
            &.improvement { color: var(--apple-success); }
            &.best { color: var(--apple-primary); }
          }
        }
      }
    }
  }

  // P5 查重指标趋势卡（复用 trend-card 外壳，仅补图表容器与空态）
  .p5-trend-card {
    .p5-trend-chart {
      width: 100%;
      height: 360px;
    }

    .trend-empty {
      padding: 64px 0;
      text-align: center;
      color: var(--apple-ink-muted-48);
      font-size: var(--apple-fs-caption);
    }
  }

  // 历史卡片
  .history-card {
    background: var(--apple-surface);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-lg);
    padding: var(--apple-spacing-lg);
    margin-bottom: var(--apple-spacing-lg);
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--apple-hairline);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--apple-spacing-md);
      
      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--apple-font-display);
        font-size: var(--apple-fs-body-strong);
        font-weight: 600;
        color: var(--apple-ink);
        
        .el-icon {
          color: var(--apple-ink-muted-48);
        }
      }
      
      .text-button {
        padding: 6px 10px;
        background: transparent;
        border: none;
        border-radius: var(--apple-rounded-sm);
        color: var(--apple-primary);
        font-size: var(--apple-fs-caption);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          color: var(--apple-primary-hover);
          background: var(--apple-info-bg);
          border-radius: var(--apple-rounded-sm);
        }
      }
    }
    
    .timeline-container {
      .timeline {
        position: relative;
        padding-left: 24px;
        
        &::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--apple-hairline);
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 32px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .timeline-node {
            position: absolute;
            left: -24px;
            top: 4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--apple-slate-border-strong);
            border: 2px solid var(--apple-surface);

            &.success {
              background: var(--apple-success);
            }
            &.primary {
              background: var(--apple-primary);
            }
            &.warning {
              background: var(--apple-warning);
            }
            &.danger {
              background: var(--apple-danger);
            }
            &.info {
              background: var(--apple-slate-sub);
            }
          }
          
          .timeline-line {
            position: absolute;
            left: -23px;
            top: 20px;
            bottom: -32px;
            width: 2px;
            background: var(--apple-hairline);
          }
          
          .timeline-content {
            .timeline-timestamp {
              margin-bottom: 6px;
              font-size: var(--apple-fs-fine-print);
              font-weight: 500;
              color: var(--apple-ink-muted-48);
            }
            
            .history-record {
              padding: var(--apple-spacing-md);
              background: var(--apple-surface);
              border: 1px solid var(--apple-hairline);
              border-radius: var(--apple-rounded-md);
              transition: all 0.2s ease;
              
              &:hover {
                border-color: var(--apple-hairline);
              }

              &:active {
                transform: none;
              }

              &.current-version {
                border-color: var(--apple-primary);
                background: var(--apple-info-bg);
              }
              
              .record-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                
                .version-info {
                  display: flex;
                  align-items: center;
                  gap: var(--apple-spacing-xs);
                  flex-wrap: wrap;

                  :deep(.el-tag) {
                    border-radius: var(--apple-rounded-pill);
                    font-size: var(--apple-fs-fine-print);
                    font-weight: 600;
                  }
                  
                  .similarity-badge {
                    padding: 3px 10px;
                    border-radius: var(--apple-rounded-pill);
                    font-weight: 600;
                    font-size: var(--apple-fs-fine-print);
                    
                    &.excellent { background: var(--apple-success-bg); color: var(--apple-success); }
                    &.good { background: var(--apple-info-bg); color: var(--apple-primary); }
                    &.warning { background: var(--apple-warning-bg); color: var(--apple-warning); }
                    &.danger { background: var(--apple-danger-bg); color: var(--apple-danger); }
                  }
                  
                }
                
                .record-actions {
                  display: flex;
                  gap: var(--apple-spacing-xxs);
                }
              }
              
              .record-content {
                .p5-metric-row {
                  display: flex;
                  gap: var(--apple-spacing-md);
                  margin-bottom: var(--apple-spacing-sm);

                  .p5-metric-item {
                    font-size: var(--apple-fs-fine-print);
                    font-weight: 500;
                    color: var(--apple-ink-muted-48);
                  }
                }

                .changes-description {
                  display: flex;
                  align-items: flex-start;
                  gap: 8px;
                  margin-bottom: var(--apple-spacing-sm);
                  color: var(--apple-ink-secondary);
                  line-height: 1.5;
                  font-size: var(--apple-fs-caption);
                  
                  .el-icon {
                    margin-top: 3px;
                    color: var(--apple-primary);
                  }
                }
                
                .improvement-info {
                  display: flex;
                  align-items: center;
                  gap: var(--apple-spacing-xs);
                  margin-bottom: var(--apple-spacing-sm);
                  color: var(--apple-ink-muted-48);
                  font-size: var(--apple-fs-caption);
                  
                  .improvement-badge {
                    padding: 3px 10px;
                    border-radius: var(--apple-rounded-pill);
                    font-weight: 600;
                    font-size: var(--apple-fs-fine-print);
                    
                    &.improved { background: var(--apple-success-bg); color: var(--apple-success); }
                    &.regressed { background: var(--apple-danger-bg); color: var(--apple-danger); }
                    &.unchanged { background: var(--apple-divider-soft); color: var(--apple-ink-muted-48); }
                  }
                }
                
                .section-changes {
                  .section-change {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    border-bottom: 1px solid var(--apple-divider-soft);
                    
                    &:last-child {
                      border-bottom: none;
                    }
                    
                    .section-name {
                      color: var(--apple-ink-secondary);
                      font-size: var(--apple-fs-caption);
                    }
                    
                    .change-value {
                      font-weight: 600;
                      font-size: var(--apple-fs-caption);
                      
                      &.decreased { color: var(--apple-success); }
                      &.increased { color: var(--apple-danger); }
                      &.unchanged { color: var(--apple-ink-muted-48); }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 对比内容
  .compare-content {
    .compare-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--apple-spacing-lg);
      padding-bottom: var(--apple-spacing-md);
      border-bottom: 1px solid var(--apple-divider-soft);
      
      .version-tags {
        display: flex;
        align-items: center;
        gap: var(--apple-spacing-sm);
        
        .version-tag {
          padding: 3px 12px;
          border-radius: var(--apple-rounded-pill);
          font-size: var(--apple-fs-caption);
          font-weight: 600;
          
          &.old {
            background: var(--apple-divider-soft);
            color: var(--apple-ink-secondary);
          }
          &.current {
            background: var(--apple-primary);
            color: var(--apple-on-primary);
          }
        }
        
        .vs {
          font-size: var(--apple-fs-fine-print);
          font-weight: 600;
          color: var(--apple-ink-muted-48);
        }
      }
      
      .overall-change {
        font-family: var(--apple-font-display);
        font-size: var(--apple-fs-body-strong);
        font-weight: 600;
        
        &.improved { color: var(--apple-success); }
        &.regressed { color: var(--apple-danger); }
        &.unchanged { color: var(--apple-ink-muted-48); }
      }
    }
    
    .compare-sections {
      .section-compare-card {
        background: var(--apple-surface);
        border: 1px solid var(--apple-hairline);
        border-radius: var(--apple-rounded-md);
        padding: var(--apple-spacing-md);
        margin-bottom: var(--apple-spacing-sm);
        transition: all 0.2s ease;
        
        &:hover {
          border-color: var(--apple-hairline);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--apple-spacing-sm);
          
          .section-name {
            font-weight: 600;
            color: var(--apple-ink);
            font-size: var(--apple-fs-caption);
          }
          
          .change-tag {
            padding: 3px 10px;
            border-radius: var(--apple-rounded-pill);
            font-size: var(--apple-fs-fine-print);
            font-weight: 600;
            
            &.success { background: var(--apple-success-bg); color: var(--apple-success); }
            &.danger { background: var(--apple-danger-bg); color: var(--apple-danger); }
            &.info { background: var(--apple-divider-soft); color: var(--apple-ink-muted-48); }
          }
        }
        
        .similarity-compare {
          .similarity-item {
            display: flex;
            align-items: center;
            gap: var(--apple-spacing-sm);
            margin-bottom: var(--apple-spacing-xs);
            
            .version-label {
              width: 60px;
              font-size: var(--apple-fs-fine-print);
              color: var(--apple-ink-muted-48);
              font-weight: 500;
            }
            
            .progress-container {
              flex: 1;
              height: 6px;
              background: var(--apple-divider-soft);
              border-radius: var(--apple-rounded-pill);
              overflow: hidden;
              
              .progress-bar {
                height: 100%;
                border-radius: var(--apple-rounded-pill);
                transition: width 0.3s ease;
                
                &.excellent { background: var(--apple-success); }
                &.good { background: var(--apple-primary); }
                &.warning { background: var(--apple-warning); }
                &.danger { background: var(--apple-danger); }
              }
            }
            
            .similarity-value {
              min-width: 50px;
              font-weight: 600;
              color: var(--apple-ink);
              font-size: var(--apple-fs-caption);
            }
          }
        }
      }
    }
  }

  // 统计卡片网格
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--apple-spacing-sm);
    
    .stat-card {
      background: var(--apple-surface);
      border: 1px solid var(--apple-hairline);
      border-radius: var(--apple-rounded-lg);
      padding: var(--apple-spacing-md);
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--apple-hairline);
      }

      &:active {
        transform: none;
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: var(--apple-spacing-sm);
        
        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--apple-rounded-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          
          &.improvement-icon {
            background: var(--apple-success-bg);
            color: var(--apple-success);
          }
          &.average-icon {
            background: var(--apple-info-bg);
            color: var(--apple-primary);
          }
          &.speed-icon {
            background: var(--apple-warning-bg);
            color: var(--apple-warning);
          }
        }
        
        .stat-info {
          .stat-number {
            font-family: var(--apple-font-display);
            font-size: var(--apple-fs-lead-airy);
            font-weight: 600;
            color: var(--apple-ink);
            line-height: 1.2;
            margin-bottom: 2px;
          }
          
          .stat-label {
            font-size: var(--apple-fs-fine-print);
            color: var(--apple-ink-muted-48);
            font-weight: 500;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .check-history-page {
    .trend-card {
      .trend-chart-container {
        grid-template-columns: 1fr;
        
        .trend-summary {
          flex-direction: row;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 16px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .check-history-page {
    padding: var(--apple-spacing-sm);

    .paper-info-card {
      padding: var(--apple-spacing-md);
      
      .paper-header {
        .paper-title {
          font-size: var(--apple-fs-tagline);
        }
      }
      
      .paper-stats {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }
    
    .trend-card {
      padding: var(--apple-spacing-md);
      
      .trend-chart-container {
        gap: 16px;
        
        .chart-wrapper {
          padding: 16px;
          min-height: 300px;
        }
      }
    }
    
    .history-card {
      padding: var(--apple-spacing-md);
      
      .timeline-container {
        .timeline {
          padding-left: 20px;
          
          .timeline-item {
            .timeline-node {
              left: -20px;
            }
            
            .timeline-line {
              left: -19px;
            }
            
            .history-record {
              padding: var(--apple-spacing-sm);
              
              .record-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
                
                .record-actions {
                  align-self: stretch;
                  justify-content: space-between;
                }
              }
            }
          }
        }
      }
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
      
      .stat-card {
        padding: var(--apple-spacing-md);
      }
    }
  }
}
</style>
