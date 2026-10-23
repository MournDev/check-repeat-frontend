<template>
  <div class="guidance-progress">
    <!-- 页头（全站统一 PageHeader 组件） -->
    <PageHeader
      description="我指导论文的状态分布与查重 / 成绩一览，查重完成的论文可直接签核查重报告。"
    >
      <template #actions>
        <el-button type="primary" :icon="Refresh" @click="fetchData">刷新</el-button>
      </template>
    </PageHeader>

    <!-- 总数 + 状态分布 -->
    <div class="stats-row">
      <el-card class="console-card total-card" shadow="never" v-loading="loading">
        <div class="total-value">{{ total }}</div>
        <div class="total-label">我指导的论文总数</div>
      </el-card>

      <el-card class="console-card chart-card" shadow="never" v-loading="loading">
        <div class="section-title">论文状态分布</div>
        <el-empty
          v-if="statusChart.empty"
          description="暂无论文状态数据"
          :image-size="80"
        />
        <div v-else :ref="statusChart.chartRef" class="status-chart"></div>
      </el-card>
    </div>

    <!-- 论文明细 -->
    <el-card class="console-card" shadow="never">
      <div class="section-head">
        <span class="section-title">最近论文</span>
        <span class="muted">最近 50 条（按提交时间倒序）</span>
      </div>
      <el-table :data="papers" v-loading="loading" row-key="paperId">
        <el-table-column prop="paperTitle" label="论文标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.paperTitle || '—' }}</template>
        </el-table-column>
        <el-table-column label="学生" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.studentName || '—' }}</template>
        </el-table-column>
        <el-table-column label="论文状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.paperStatus)" effect="light" round size="small">
              {{ statusText(row.paperStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总相似比" width="110" align="center">
          <template #default="{ row }">
            <span :class="rateClass(row.similarityRate)">
              {{ row.similarityRate === null || row.similarityRate === undefined ? '—' : `${row.similarityRate}%` }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="总评成绩" width="100" align="center">
          <template #default="{ row }">
            {{ row.finalScore === null || row.finalScore === undefined ? '—' : row.finalScore }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSignoff(row)">去签核</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无指导论文" />
        </template>
      </el-table>
    </el-card>

    <!-- 查重报告签核（P5 3.1），签核成功后刷新看板 -->
    <CheckSignoffDialog ref="signoffDialogRef" @success="fetchData" @view-report="onViewReport" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { getGuidanceProgress } from '@/api/p5.js'
import { loadDefenseDict, getDefenseDictText, DICT_PAPER_STATUS } from '@/utils/defenseDict.js'
import { getStatusText, getStatusType } from '@/utils/reviewStatus.js'
import { getSimilarityLevel } from '@/utils/similarity.js'
import { useChart } from '@/composables/useChart'
import PageHeader from '@/components/common/PageHeader.vue'
import CheckSignoffDialog from '@/views/teacher/components/CheckSignoffDialog.vue'

const loading = ref(false)
const total = ref(0)
const statusSummary = ref([])
const papers = ref([])
const signoffDialogRef = ref(null)
const router = useRouter()

// 签核弹窗内「查看完整报告」→ 审核工作台对应论文
const onViewReport = (paperId) => {
  if (!paperId) return
  router.push({
    name: 'TeacherReviewWorkbench',
    query: { paperId: String(paperId) }
  })
}

// 文案优先读数据库字典 paper_status，未加载时回落到前端统一字典
const statusText = (v) => getDefenseDictText(DICT_PAPER_STATUS, v, getStatusText(v, v || '—'))
const statusTagType = (v) => getStatusType(v)

const RATE_CLASS = { unknown: '', low: 'rate-low', medium: 'rate-medium', high: 'rate-high' }

// 重复率分档统一走 utils/similarity.js，本页仅保留既有类名
const rateClass = (rate) => RATE_CLASS[getSimilarityLevel(rate)]

// ── 状态分布饼图（useChart 托管容器/dispose/resize/空态）──────────────────
const statusChart = useChart()
const CHART_COLORS = [
  '#0066cc', '#34c759', '#ff9500', '#ff3b30', '#8e8e93',
  '#2997ff', '#5856d6', '#af52de', '#ff2d55', '#5ac8fa',
  '#ffcc00', '#64d2ff', '#30d158'
]

// 供「数据加载」与「字典加载完成后的图例翻译重绘」两个入口复用
const renderChart = () => statusChart.render(
  statusSummary.value.length === 0
    ? null
    : {
        color: CHART_COLORS,
        tooltip: { trigger: 'item', formatter: '{b}：{c} 篇（{d}%）' },
        legend: {
          orient: 'vertical',
          right: 0,
          top: 'middle',
          type: 'scroll',
          textStyle: { fontSize: 12, color: '#7a7a7a' }
        },
        series: [
          {
            name: '论文状态',
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['36%', '50%'],
            avoidLabelOverlap: true,
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
            data: statusSummary.value.map((s) => ({
              name: statusText(s.paperStatus),
              value: s.count
            }))
          }
        ]
      }
)

// ── 数据加载 ──────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getGuidanceProgress()
    const d = res?.data || {}
    total.value = d.total ?? 0
    statusSummary.value = d.statusSummary || []
    papers.value = d.papers || []
    await renderChart()
  } finally {
    loading.value = false
  }
}

const openSignoff = (row) => {
  signoffDialogRef.value?.open({
    paperId: row.paperId,
    paperTitle: row.paperTitle,
    studentName: row.studentName
  })
}

onMounted(() => {
  fetchData()
  // paper_status 字典：失败不阻塞页面（文案走本地兜底）；加载完成后重绘饼图翻译图例
  loadDefenseDict(DICT_PAPER_STATUS).then(renderChart).catch(() => {})
})
</script>

<style scoped lang="scss">
.guidance-progress {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  color: var(--app-color-ink);
  font-family: var(--app-font-family);
}

.stats-row {
  display: flex;
  gap: var(--app-space-4);
  flex-wrap: wrap;
}

.total-card {
  width: 240px;
  flex-shrink: 0;

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--app-space-2);
  }
}

.total-value {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-metric);
  font-weight: 700;
  line-height: 1;
  color: var(--app-color-primary);
  font-variant-numeric: tabular-nums;
}

.total-label {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.chart-card {
  flex: 1;
  min-width: 320px;
}

.status-chart {
  width: 100%;
  height: 240px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-space-3);
}

.section-title {
  margin-bottom: var(--app-space-2);
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  font-weight: 600;
}

.section-head .section-title {
  margin-bottom: 0;
}

.muted {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.rate-high {
  color: var(--app-color-danger);
  font-weight: 600;
}

.rate-medium {
  color: var(--app-color-warning);
  font-weight: 600;
}

.rate-low {
  color: var(--app-color-success);
  font-weight: 600;
}

@media (max-width: 768px) {
  .total-card {
    width: 100%;
  }

  .stats-row {
    flex-direction: column;
  }

  .chart-card {
    min-width: 0;
  }

  .section-head {
    gap: var(--app-space-2);
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
