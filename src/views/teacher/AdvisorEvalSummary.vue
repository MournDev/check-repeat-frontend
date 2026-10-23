<template>
  <div class="advisor-eval-summary">
    <!-- 页头 -->
    <PageHeader description="查看学生对您指导工作的匿名聚合评价，数据仅作教学改进参考。">
      <template #actions>
        <el-button :icon="Refresh" @click="fetchSummary">刷新</el-button>
      </template>
    </PageHeader>

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
            <el-empty v-if="radarChart.empty" description="暂无评分数据" :image-size="60" />
            <div v-else :ref="radarChart.chartRef" class="chart-container" v-loading="loading"></div>
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
                  :color="isNegativeTag(item.tag) ? 'var(--app-color-danger)' : 'var(--app-color-success)'"
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
import PageHeader from '@/components/common/PageHeader.vue'
import { ref, onMounted, nextTick } from 'vue'
import { Refresh, Histogram, CollectionTag, Hide } from '@element-plus/icons-vue'
import { getAdvisorEvalSummary } from '@/api/advisorEvaluation'
import { isNegativeAdvisorEvalTag } from '@/utils/advisorEvalTag'
import { useChart } from '@/composables/useChart'

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

// 五维雷达图（useChart 托管容器/dispose/resize/空态）
const radarChart = useChart()

// 标签负向判定统一取 utils/advisorEvalTag.js（SSOT）
const isNegativeTag = isNegativeAdvisorEvalTag

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
  if (summary.value.masked) {
    radarChart.render(null)
    return
  }
  // 五维均分全为空时显空态
  const rawValues = dimensionKeys.map((k) => summary.value[k])
  if (rawValues.every((v) => v === null || v === undefined)) {
    radarChart.render(null)
    return
  }
  const values = rawValues.map((v) => Number(v ?? 0))
  radarChart.render({
    tooltip: { trigger: 'item' },
    radar: {
      indicator: dimensionLabels.map((name) => ({ name, max: 5 })),
      radius: '65%',
      splitNumber: 5,
      axisName: { color: 'var(--app-color-ink)', fontSize: 12 },
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

onMounted(() => {
  fetchSummary()
})
</script>

<style scoped lang="scss">
.advisor-eval-summary {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  color: var(--app-color-ink);
  font-family: var(--app-font-family);
}

.masked-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-3);
  padding: var(--app-space-12) var(--app-space-6);
  text-align: center;
}

.masked-icon {
  color: var(--app-color-text-muted);
}

.masked-title {
  margin: 0;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  font-weight: 600;
}

.masked-desc {
  margin: 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
  max-width: 480px;
  line-height: 1.6;
}

.score-hero-card {
  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--app-space-2);
    padding: var(--app-space-8) var(--app-space-6);
    text-align: center;
  }

  .hero-label {
    font-size: var(--app-fs-caption);
    color: var(--app-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .hero-value {
    font-family: var(--app-font-family);
    font-size: var(--app-fs-metric);
    font-weight: 700;
    color: var(--app-color-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .hero-sub {
    font-size: var(--app-fs-caption);
    color: var(--app-color-text-muted);
  }
}

.card-header {
  display: flex;
  align-items: center;

  .card-title {
    display: flex;
    align-items: center;
    font-family: var(--app-font-family);
    font-size: var(--app-fs-body);
    font-weight: 600;

    .el-icon {
      margin-right: var(--app-space-2);
      color: var(--app-color-primary);
    }
  }
}

.chart-container {
  height: 320px;
}

.tag-stats-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  padding: var(--app-space-2) 0;
}

.tag-stat-row {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);

  .tag-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tag-count {
    font-size: var(--app-fs-meta);
    color: var(--app-color-text-muted);
    font-variant-numeric: tabular-nums;
  }
}

@media (max-width: 992px) {
  .el-col {
    margin-bottom: var(--app-space-4);
  }

  .masked-block {
    padding: var(--app-space-8) var(--app-space-4);
  }
}
</style>
