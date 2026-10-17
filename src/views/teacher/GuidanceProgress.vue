<template>
  <div class="guidance-progress">
    <!-- 页头（全站统一 PageHeader 组件） -->
    <PageHeader
      title="指导进度看板"
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
    <CheckSignoffDialog ref="signoffDialogRef" @success="fetchData" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getGuidanceProgress } from '@/api/p5.js'
import { loadDefenseDict, getDefenseDictText, DICT_PAPER_STATUS } from '@/utils/defenseDict.js'
import { useChart } from '@/composables/useChart'
import PageHeader from '@/components/common/PageHeader.vue'
import CheckSignoffDialog from '@/views/teacher/components/CheckSignoffDialog.vue'

const loading = ref(false)
const total = ref(0)
const statusSummary = ref([])
const papers = ref([])
const signoffDialogRef = ref(null)

// paper_status 13 态本地兜底映射（与 /api/dict/data/type/paper_status 对齐）：文案优先读字典，
// 字典已加载但未命中的历史脏数据原样显示状态码原文
const PAPER_STATUS_TEXT = {
  pending: '待分配',
  assigned: '已分配',
  checking: '待查重',
  auditing: '待审核',
  completed: '初审通过',
  rejected: '审核不通过',
  withdrawn: '已取消',
  reviewing: '评阅中',
  mid_defense: '中期答辩',
  final_defense: '终期答辩',
  defense_passed: '答辩通过',
  finalized: '已定稿',
  archived: '已归档'
}
const statusText = (v) => getDefenseDictText(DICT_PAPER_STATUS, v, PAPER_STATUS_TEXT[v] || v || '—')
const statusTagType = (v) => ({
  checking: 'warning',
  auditing: 'warning',
  reviewing: 'primary',
  mid_defense: 'warning',
  final_defense: 'warning',
  completed: 'success',
  defense_passed: 'success',
  rejected: 'danger'
}[v] || 'info')

const rateClass = (rate) => {
  if (rate === null || rate === undefined) return ''
  const n = Number(rate)
  if (Number.isNaN(n)) return ''
  if (n >= 30) return 'rate-high'
  if (n >= 15) return 'rate-medium'
  return 'rate-low'
}

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
  gap: 16px;
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.stats-row {
  display: flex;
  gap: 16px;
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
    gap: 8px;
  }
}

.total-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--apple-primary);
  font-variant-numeric: tabular-nums;
}

.total-label {
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
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
  margin-bottom: 12px;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.section-head .section-title {
  margin-bottom: 0;
}

.muted {
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
}

.rate-high {
  color: var(--apple-danger);
  font-weight: 600;
}

.rate-medium {
  color: var(--apple-warning);
  font-weight: 600;
}

.rate-low {
  color: var(--apple-success);
  font-weight: 600;
}

@media (max-width: 768px) {
  .total-card {
    width: 100%;
  }
}
</style>
