<template>
  <section class="lifecycle-funnel">
    <header class="panel-head">
      <div class="panel-title">
        <el-icon><TrendCharts /></el-icon>
        <span>论文全生命周期漏斗</span>
      </div>
      <el-button text size="small" :icon="Refresh" @click="loadAndRender">刷新</el-button>
    </header>

    <div v-if="chart.empty" class="funnel-empty">暂无阶段数据</div>
    <div v-else :ref="chart.chartRef" class="funnel-chart"></div>

    <!-- 图表之外的阶段清单：既是图例也是可点击钻取入口 -->
    <div v-if="stages.length" class="stage-list">
      <button
        v-for="(stage, index) in stages"
        :key="stage.key"
        type="button"
        class="stage-row"
        @click="goStage(stage)"
      >
        <span class="stage-name">{{ stage.label }}</span>
        <span class="stage-count">{{ stage.count }}</span>
        <span class="stage-rate">{{ index === 0 ? '—' : formatRate(stage.conversionRate) }}</span>
        <el-icon class="stage-arrow"><ArrowRight /></el-icon>
      </button>
    </div>

    <p class="panel-tip">
      阶段人数优先按状态日志统计，缺失时回退为当前状态快照；点击任一阶段进入论文库并带上状态筛选。
    </p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, TrendCharts, ArrowRight } from '@element-plus/icons-vue'
import { useChart } from '@/composables/useChart'
import { getLifecycleFunnel } from '@/api/admin/papers'

const router = useRouter()
const chart = useChart()
const stages = ref([])

const formatRate = (rate) => {
  if (rate === null || rate === undefined || Number.isNaN(Number(rate))) return '—'
  return `${Number(rate).toFixed(1)}%`
}

const goStage = (stage) => {
  router.push({
    path: '/admin/paper-library',
    query: stage.status ? { paperStatus: stage.status } : {}
  })
}

const buildOption = (list) => ({
  tooltip: {
    trigger: 'item',
    formatter: (p) => `${p.name}<br/>${p.value} 篇`
  },
  series: [
    {
      name: '论文阶段',
      type: 'funnel',
      left: '4%',
      right: '4%',
      top: 6,
      bottom: 6,
      minSize: '24%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        formatter: (p) => `${p.name} ${p.value}`
      },
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 1
      },
      data: list.map((stage) => ({
        name: stage.label,
        value: stage.count,
        status: stage.status
      })),
      color: ['#0066cc', '#2997ff', '#5856d6', '#34c759', '#ff9500', '#ff2d55', '#8e8e93']
    }
  ]
})

const loadAndRender = async () => {
  try {
    const res = await getLifecycleFunnel()
    const list = res?.code === 200 && Array.isArray(res.data?.stages) ? res.data.stages : []
    stages.value = list
    await chart.render(list.length ? buildOption(list) : null)
  } catch (error) {
    console.error('加载生命周期漏斗失败:', error)
    stages.value = []
    await chart.render(null)
  }
}

const handleChartClick = (params) => {
  const status = params?.data?.status
  if (status === undefined) return
  goStage({ status })
}

onMounted(async () => {
  await loadAndRender()
  chart.on('click', handleChartClick)
})
</script>

<style scoped lang="scss">
.lifecycle-funnel {
  height: 100%;
  padding: var(--app-space-4);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-2);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-ink);
}

.funnel-chart {
  width: 100%;
  height: 280px;
}

.funnel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
  border-radius: var(--app-radius-md);
}

.stage-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--app-color-divider);
}

.stage-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  padding: var(--app-space-2) var(--app-space-1);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--app-color-divider);
  cursor: pointer;
  text-align: left;
  font-family: var(--app-font-family);

  &:last-child {
    border-bottom: none;
  }

  &:hover .stage-name,
  &:hover .stage-arrow {
    color: var(--app-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--app-color-primary);
    outline-offset: -2px;
  }
}

.stage-name {
  flex: 1;
  min-width: 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-ink);
}

.stage-count {
  font-size: var(--app-fs-caption);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--app-color-ink);
}

.stage-rate {
  width: 56px;
  text-align: right;
  font-size: var(--app-fs-meta);
  font-variant-numeric: tabular-nums;
  color: var(--app-color-text-muted);
}

.stage-arrow {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.panel-tip {
  margin: var(--app-space-2) 0 0;
  font-size: var(--app-fs-meta);
  line-height: 1.4;
  color: var(--app-color-text-muted);
}
</style>
