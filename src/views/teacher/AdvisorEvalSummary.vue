<template>
  <div class="advisor-eval-summary">
    <!-- 页头 -->
    <el-card class="console-card console-page-head-card" shadow="never">
      <div class="head-row">
        <div class="head-text">
          <h2 class="head-title">学生评价汇总</h2>
          <p class="head-desc">查看学生对您指导工作的匿名聚合评价，数据仅作教学改进参考。</p>
        </div>
        <el-button :icon="Refresh" @click="fetchSummary">刷新</el-button>
      </div>
    </el-card>

    <!-- 加载中 -->
    <el-card v-if="loading" class="console-card" shadow="never">
      <el-skeleton :rows="6" animated />
    </el-card>

    <!-- 掩码态：样本不足 -->
    <el-card v-else-if="summary.masked" class="console-card" shadow="never">
      <div class="masked-block">
        <el-icon :size="48" class="masked-icon"><Hide /></el-icon>
        <h3 class="masked-title">样本不足，暂不展示</h3>
        <p class="masked-desc">
          已收到 {{ summary.evalCount }} 份评价。为保护学生匿名，评价样本达到 3 份及以上才会展示聚合分数与标签统计。
        </p>
      </div>
    </el-card>

    <!-- 正常态 -->
    <template v-else>
      <!-- 导师评价分大字卡 -->
      <el-card class="console-card score-hero-card" shadow="never">
        <div class="hero-content">
          <div class="hero-label">导师评价分</div>
          <div class="hero-value">{{ formatScore(summary.advisorScore) }}</div>
          <div class="hero-sub">
            基于 {{ summary.evalCount }} 份学生评价 · 总体满意度均分 {{ formatScore(summary.avgOverall, 2) }}/5
          </div>
        </div>
      </el-card>

      <!-- 五维均分 + 标签统计 -->
      <el-row :gutter="16">
        <el-col :xs="24" :lg="14">
          <el-card class="console-card chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><Histogram /></el-icon>
                  五维均分
                </span>
              </div>
            </template>
            <div ref="radarChartRef" class="chart-container" v-loading="loading"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="10">
          <el-card class="console-card chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><CollectionTag /></el-icon>
                  标签频次
                </span>
              </div>
            </template>
            <div v-if="summary.tagStats?.length" class="tag-stats-body">
              <div
                v-for="item in summary.tagStats"
                :key="item.tag"
                class="tag-stat-row"
              >
                <div class="tag-info">
                  <el-tag :type="isNegativeTag(item.tag) ? 'danger' : 'success'" effect="light" round size="small">
                    {{ item.label }}
                  </el-tag>
                  <span class="tag-count">{{ item.count }} 次</span>
                </div>
                <el-progress
                  :percentage="tagPercent(item.count)"
                  :stroke-width="8"
                  :color="isNegativeTag(item.tag) ? '#ff3b30' : '#34c759'"
                  :show-text="false"
                />
              </div>
            </div>
            <el-empty v-else description="暂无标签数据" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Refresh, Histogram, CollectionTag, Hide } from '@element-plus/icons-vue'
import { getAdvisorEvalSummary } from '@/api/advisorEvaluation'

const loading = ref(false)
const summary = ref({
  masked: false,
  evalCount: 0,
  avgTimeliness: null,
  avgQuality: null,
  avgAttitude: null,
  avgProfessional: null,
  avgOverall: null,
  advisorScore: null,
  tagStats: []
})

const radarChartRef = ref()
let radarChart = null

const NEGATIVE_TAGS = ['guidance_lacking', 'feedback_slow']
const isNegativeTag = (tag) => NEGATIVE_TAGS.includes(tag)

const formatScore = (v, digits = 1) => {
  if (v === null || v === undefined || v === '') return '—'
  return Number(v).toFixed(digits)
}

const tagPercent = (count) => {
  const total = summary.value.tagStats?.reduce((sum, t) => sum + (t.count || 0), 0) || 0
  if (!total) return 0
  return Math.round((count / total) * 100)
}

const dimensionLabels = ['指导及时性', '反馈质量', '责任心态度', '专业能力', '总体满意度']
const dimensionKeys = ['avgTimeliness', 'avgQuality', 'avgAttitude', 'avgProfessional', 'avgOverall']

const renderRadar = () => {
  if (!radarChartRef.value || summary.value.masked) return
  const values = dimensionKeys.map((k) => Number(summary.value[k] ?? 0))
  if (!radarChart) radarChart = echarts.init(radarChartRef.value)
  radarChart.setOption({
    tooltip: { trigger: 'item' },
    radar: {
      indicator: dimensionLabels.map((name) => ({ name, max: 5 })),
      radius: '65%',
      splitNumber: 5,
      axisName: { color: 'var(--apple-ink)', fontSize: 12 },
      splitArea: {
        areaStyle: {
          color: ['rgba(0,102,204,0.02)', 'rgba(0,102,204,0.05)', 'rgba(0,102,204,0.08)', 'rgba(0,102,204,0.11)', 'rgba(0,102,204,0.14)']
        }
      },
      splitLine: { lineStyle: { color: 'rgba(0,102,204,0.2)' } },
      axisLine: { lineStyle: { color: 'rgba(0,102,204,0.3)' } }
    },
    series: [
      {
        name: '五维均分',
        type: 'radar',
        data: [
          {
            value: values,
            name: '均分',
            areaStyle: { color: 'rgba(0,102,204,0.25)' },
            lineStyle: { color: '#0066cc', width: 2 },
            itemStyle: { color: '#0066cc' },
            label: { show: true, formatter: ({ value }) => value.toFixed(2) }
          }
        ]
      }
    ]
  })
}

const fetchSummary = async () => {
  loading.value = true
  try {
    const res = await getAdvisorEvalSummary()
    summary.value = res.data || {}
  } finally {
    loading.value = false
  }
  await nextTick()
  renderRadar()
}

const handleResize = () => {
  radarChart?.resize()
}

onMounted(() => {
  fetchSummary()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  radarChart = null
})
</script>

<style scoped lang="scss">
.advisor-eval-summary {
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

.masked-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
}

.masked-icon {
  color: var(--apple-ink-muted-48);
}

.masked-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.masked-desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--apple-ink-muted-48);
  max-width: 480px;
  line-height: 1.6;
}

.score-hero-card {
  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 24px;
    text-align: center;
  }

  .hero-label {
    font-size: 0.875rem;
    color: var(--apple-ink-muted-48);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .hero-value {
    font-size: 3rem;
    font-weight: 700;
    color: var(--apple-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .hero-sub {
    font-size: 0.8125rem;
    color: var(--apple-ink-muted-48);
  }
}

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

.chart-container {
  height: 320px;
}

.tag-stats-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0;
}

.tag-stat-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .tag-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tag-count {
    font-size: 0.8125rem;
    color: var(--apple-ink-muted-48);
    font-variant-numeric: tabular-nums;
  }
}

@media (max-width: 992px) {
  .el-col {
    margin-bottom: 16px;
  }
}
</style>
