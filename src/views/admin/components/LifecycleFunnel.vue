<template>
  <section class="lifecycle-funnel">
    <header class="panel-head">
      <div class="panel-title">
        <el-icon><TrendCharts /></el-icon>
        <span>论文全生命周期漏斗</span>
        <el-tag size="small" type="info" effect="plain">演示数据</el-tag>
      </div>
      <el-button text size="small" :icon="Refresh" @click="renderFunnel">刷新</el-button>
    </header>

    <div v-if="chart.empty" class="funnel-empty">暂无阶段数据</div>
    <div v-else :ref="chart.chartRef" class="funnel-chart"></div>

    <!-- 图表之外的阶段清单：既是图例也是可点击钻取入口 -->
    <div class="stage-list">
      <button
        v-for="(stage, index) in stages"
        :key="stage.key"
        type="button"
        class="stage-row"
        @click="goStage(stage)"
      >
        <span class="stage-name">{{ stage.label }}</span>
        <span class="stage-count">{{ stage.count }}</span>
        <span class="stage-rate">{{ index === 0 ? '—' : conversion(index) }}</span>
        <el-icon class="stage-arrow"><ArrowRight /></el-icon>
      </button>
    </div>

    <p class="panel-tip">
      阶段人数为前端演示数据，后端漏斗接口就绪后替换；点击任一阶段进入论文库并带上状态筛选。
    </p>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, TrendCharts, ArrowRight } from '@element-plus/icons-vue'
import { useChart } from '@/composables/useChart'

const router = useRouter()

// TODO(mock): 后端暂无生命周期漏斗接口，先用示例数据把结构与钻取跑通。
// 接口就绪后改为 getLifecycleFunnel()，并删除该常量。
const stages = [
  { key: 'submitted', label: '提交论文', count: 1200, status: '' },
  { key: 'checking', label: '查重阶段', count: 1145, status: 'checking' },
  { key: 'auditing', label: '导师审核', count: 1038, status: 'auditing' },
  { key: 'mid', label: '中期答辩', count: 960, status: 'mid_defense' },
  { key: 'final', label: '终期答辩', count: 902, status: 'final_defense' },
  { key: 'finalized', label: '定稿', count: 858, status: 'finalized' },
  { key: 'archived', label: '归档', count: 806, status: 'archived' }
]

const chart = useChart()

const conversion = (index) => {
  const prev = stages[index - 1]?.count
  if (!prev) return '—'
  return `${((stages[index].count / prev) * 100).toFixed(1)}%`
}

const goStage = (stage) => {
  router.push({
    path: '/admin/paper-library',
    query: stage.status ? { paperStatus: stage.status } : {}
  })
}

const buildOption = () => ({
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
      data: stages.map((stage) => ({
        name: stage.label,
        value: stage.count,
        status: stage.status
      })),
      color: ['#0066cc', '#2997ff', '#5856d6', '#34c759', '#ff9500', '#ff2d55', '#8e8e93']
    }
  ]
})

const renderFunnel = () => chart.render(buildOption())

const handleChartClick = (params) => {
  const status = params?.data?.status
  if (status === undefined) return
  goStage({ status })
}

onMounted(async () => {
  await renderFunnel()
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
