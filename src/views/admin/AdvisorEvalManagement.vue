<template>
  <div class="advisor-eval-management">
    <!-- 页头 -->
    <el-card class="console-card console-page-head-card" shadow="never">
      <div class="head-row">
        <div class="head-text">
          <h2 class="head-title">导师评价管理</h2>
          <p class="head-desc">全校导师评价完成率、导师排行、学院对比与实名评价明细，支持导出 xlsx。</p>
        </div>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出明细
        </el-button>
      </div>
    </el-card>

    <!-- 统计时段标注：分段口径下完成率分母为该时段内通过终期答辩的论文数（P6b） -->
    <div class="period-tip">
      <el-icon><InfoFilled /></el-icon>
      <span>统计时段：{{ periodText }}</span>
      <span v-if="hasDateRange" class="period-note">
        （届别口径：完成率分母为该时段内通过终期答辩的论文数，存量无状态日志论文不参与分段统计）
      </span>
    </div>

    <!-- 顶部统计卡 -->
    <el-row :gutter="16">
      <el-col :xs="24" :md="8">
        <el-card class="console-card stat-card" shadow="never" v-loading="statsLoading">
          <div class="stat-label">评价完成率</div>
          <div class="stat-main">
            <el-progress
              type="circle"
              :percentage="Number(stats.completionRate ?? 0)"
              :width="90"
              :stroke-width="8"
              color="var(--apple-primary)"
            >
              <span class="rate-text">{{ formatPercent(stats.completionRate) }}</span>
            </el-progress>
          </div>
          <div class="stat-sub">{{ stats.totalEvaluations ?? 0 }} / {{ stats.eligiblePapers ?? 0 }} 篇可评论文</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card class="console-card stat-card" shadow="never" v-loading="statsLoading">
          <div class="stat-label">已提交评价</div>
          <div class="stat-value">{{ stats.totalEvaluations ?? 0 }}</div>
          <div class="stat-sub">覆盖可评论文 {{ stats.eligiblePapers ?? 0 }} 篇</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card class="console-card stat-card warning" shadow="never" v-loading="statsLoading">
          <div class="stat-label">低分预警导师</div>
          <div class="stat-value warning-text">{{ lowScoreList.length }}</div>
          <div class="stat-sub">评价份数 ≥3 且总体均分 &lt; 3.0</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 低分预警名单 -->
    <el-card v-if="lowScoreList.length" class="console-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Warning /></el-icon>
            低分预警名单
          </span>
        </div>
      </template>
      <el-table :data="lowScoreList" row-key="teacherId" size="small">
        <el-table-column prop="teacherName" label="导师" min-width="120" />
        <el-table-column prop="evalCount" label="评价份数" width="100" align="center" />
        <el-table-column prop="avgOverall" label="总体均分" width="110" align="center">
          <template #default="{ row }">
            <span class="danger-text">{{ formatFixed(row.avgOverall, 2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="advisorScore" label="导师评价分" width="120" align="center">
          <template #default="{ row }">{{ formatFixed(row.advisorScore, 1) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="filterByTeacher(row)">
              查看明细
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 导师排行 + 学院对比 -->
    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card class="console-card" shadow="never" v-loading="statsLoading">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Trophy /></el-icon>
                导师排行（按评价分降序）
              </span>
            </div>
          </template>
          <el-table :data="teacherRank" row-key="teacherId" :row-class-name="lowScoreRowClass" max-height="420">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="teacherName" label="导师" min-width="110">
              <template #default="{ row }">
                <span>{{ row.teacherName }}</span>
                <el-tooltip v-if="row.lowScore" content="低分预警：评价份数≥3 且总体均分<3.0" placement="top">
                  <el-icon class="warn-icon"><Warning /></el-icon>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="evalCount" label="份数" width="70" align="center" />
            <el-table-column prop="avgOverall" label="总体均分" width="100" align="center" sortable>
              <template #default="{ row }">{{ formatFixed(row.avgOverall, 2) }}</template>
            </el-table-column>
            <el-table-column prop="advisorScore" label="评价分" width="100" align="center" sortable>
              <template #default="{ row }">
                <span class="score-cell">{{ formatFixed(row.advisorScore, 1) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="filterByTeacher(row)">
                  评价明细
                </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无评价数据" :image-size="80" />
            </template>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card class="console-card" shadow="never" v-loading="statsLoading">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataAnalysis /></el-icon>
                学院对比（按均分降序）
              </span>
            </div>
          </template>
          <div v-show="collegeCompare.length" :ref="collegeChart.chartRef" class="chart-container"></div>
          <el-empty v-if="!statsLoading && !collegeCompare.length" description="暂无学院数据" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 明细分页表 -->
    <el-card class="console-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Document /></el-icon>
            评价明细
          </span>
          <span class="header-tip">学生实名信息仅管理端可见，用于防滥用追溯，请勿外泄展示</span>
        </div>
      </template>

      <!-- 筛选器（时间范围同时驱动统计卡/排行/学院对比与明细列表，其余项仅过滤列表与导出） -->
      <div class="filter-bar">
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="评价开始日期"
          end-placeholder="评价结束日期"
          value-format="YYYY-MM-DD"
          :shortcuts="termShortcuts"
          class="filter-item filter-date"
          @change="handleDateChange"
        />
        <el-select
          v-model="filters.teacherId"
          placeholder="按导师筛选"
          clearable
          filterable
          class="filter-item"
          @change="handleFilterChange"
        >
          <el-option
            v-for="t in teacherOptions"
            :key="t.teacherId"
            :label="t.teacherName"
            :value="String(t.teacherId)"
          />
        </el-select>
        <el-select
          v-model="filters.collegeId"
          placeholder="按学院筛选"
          clearable
          filterable
          class="filter-item"
          @change="handleFilterChange"
        >
          <el-option
            v-for="c in collegeOptions"
            :key="c.collegeId"
            :label="c.collegeName"
            :value="String(c.collegeId)"
          />
        </el-select>
        <el-select v-model="filters.scoreRange" placeholder="总体满意度" clearable class="filter-item" @change="handleFilterChange">
          <el-option label="1 - 2 分" value="1-2" />
          <el-option label="2 - 3 分" value="2-3" />
          <el-option label="3 - 4 分" value="3-4" />
          <el-option label="4 - 5 分" value="4-5" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="pageList" row-key="id" v-loading="pageLoading">
        <el-table-column label="论文 / 学生" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">{{ row.paperTitle }}</div>
            <div class="cell-sub">{{ row.studentName }}（{{ row.studentId }}）</div>
          </template>
        </el-table-column>
        <el-table-column label="导师 / 学院" min-width="160">
          <template #default="{ row }">
            <div class="cell-main">{{ row.teacherName }}</div>
            <div class="cell-sub">{{ row.collegeName || '未分配' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="五维评分" width="200" align="center">
          <template #default="{ row }">
            <div class="score-dims">
              <span>及时 {{ row.scoreTimeliness }}</span>
              <span>质量 {{ row.scoreQuality }}</span>
              <span>责任 {{ row.scoreAttitude }}</span>
              <span>专业 {{ row.scoreProfessional }}</span>
              <span class="overall">总体 <b>{{ row.scoreOverall }}</b></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">
            <template v-if="row.tags?.length">
              <el-tag
                v-for="tag in row.tags"
                :key="tag"
                :type="isNegativeTag(tag) ? 'danger' : 'success'"
                effect="plain"
                size="small"
                class="tag-item"
              >
                {{ tagLabel(tag) }}
              </el-tag>
            </template>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="评语" min-width="200">
          <template #default="{ row }">
            <el-popover v-if="row.comment" placement="top" :width="360" trigger="hover">
              <template #reference>
                <span class="comment-preview">{{ row.comment }}</span>
              </template>
              <p class="comment-full">{{ row.comment }}</p>
            </el-popover>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无评价明细" :image-size="80" />
        </template>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchPage"
          @current-change="fetchPage"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Warning, Trophy, DataAnalysis, Document, InfoFilled } from '@element-plus/icons-vue'
import {
  getAdvisorEvalPage,
  getAdvisorEvalStats,
  exportAdvisorEval
} from '@/api/advisorEvaluation'
import { getAllColleges } from '@/api/user'
import { getAvailableTeachers } from '@/api/admin/assignment'
import { saveBlobAs } from '@/utils/download'
import { advisorEvalTagLabel, isNegativeAdvisorEvalTag } from '@/utils/advisorEvalTag'
import { useChart } from '@/composables/useChart'

// ── 标签字典统一取 utils/advisorEvalTag.js（SSOT），此处仅做模板别名 ──
const tagLabel = advisorEvalTagLabel
const isNegativeTag = isNegativeAdvisorEvalTag

const formatFixed = (v, digits) => {
  if (v === null || v === undefined || v === '') return '—'
  return Number(v).toFixed(digits)
}
const formatPercent = (v) => (v === null || v === undefined || v === '' ? '—' : `${Number(v).toFixed(2)}%`)
const formatDateTime = (val) => (val ? String(val).replace('T', ' ').slice(0, 19) : '—')

// ── 统计 ──
const statsLoading = ref(false)
const stats = ref({})
const teacherRank = computed(() => stats.value.teacherRank || [])
const collegeCompare = computed(() => stats.value.collegeCompare || [])
const lowScoreList = computed(() => stats.value.lowScoreTeachers || [])

const lowScoreRowClass = ({ row }) => (row.lowScore ? 'low-score-row' : '')

// ── 学院对比图（useChart 托管容器/dispose/resize）──
const collegeChart = useChart()

const renderCollegeChart = () => {
  if (!collegeCompare.value.length) {
    collegeChart.render(null)
    return
  }
  const rows = [...collegeCompare.value].reverse()
  collegeChart.render({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        const row = rows[p.dataIndex]
        return `${row.collegeName}<br/>总体均分：${formatFixed(row.avgOverall, 2)}<br/>评价份数：${row.evalCount ?? 0}`
      }
    },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: '总体均分', max: 5 },
    yAxis: {
      type: 'category',
      data: rows.map((it) => it.collegeName),
      axisLabel: { width: 110, overflow: 'truncate' }
    },
    series: [
      {
        type: 'bar',
        barWidth: '55%',
        data: rows.map((it) => Number(it.avgOverall ?? 0)),
        label: { show: true, position: 'right', formatter: ({ dataIndex }) => formatFixed(rows[dataIndex].avgOverall, 2) },
        itemStyle: { borderRadius: [0, 6, 6, 0], color: '#0066cc' }
      }
    ]
  })
}

const fetchStats = async () => {
  statsLoading.value = true
  try {
    // 统计仅支持时间段过滤（P6b），与明细分页共用同一时间筛选状态
    const res = await getAdvisorEvalStats(buildDateParams())
    stats.value = res.data || {}
  } finally {
    statsLoading.value = false
  }
  await nextTick()
  renderCollegeChart()
}

// ── 明细分页 ──
const pageLoading = ref(false)
const pageList = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filters = ref({
  teacherId: '',
  collegeId: '',
  scoreRange: '',
  dateRange: []
})

// 学年届别快捷选项：9/1 ~ 次年 6/30 为一届（学年制度以学校为准，可按需调整此口径）
const termShortcuts = (() => {
  const now = new Date()
  // 9 月及以后进入下一届学年（如 2026-10 属 2027 届：2026-09-01 ~ 2027-06-30）
  const currentClassYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
  return [0, 1, 2].map((offset) => {
    const classYear = currentClassYear - offset
    return {
      text: `${classYear} 届`,
      value: [new Date(classYear - 1, 8, 1), new Date(classYear, 5, 30)]
    }
  })
})()

const teacherOptions = ref([])
const collegeOptions = ref([])

// 时间段过滤项（P6b）：同时驱动统计接口与明细列表/导出，保证两区口径一致
const hasDateRange = computed(
  () => Array.isArray(filters.value.dateRange) && filters.value.dateRange.length === 2 && !!filters.value.dateRange[0]
)

const periodText = computed(() =>
  hasDateRange.value ? `${filters.value.dateRange[0]} ~ ${filters.value.dateRange[1]}` : '全量历史'
)

const buildDateParams = () => {
  const params = {}
  if (hasDateRange.value) {
    params.beginDate = filters.value.dateRange[0]
    params.endDate = filters.value.dateRange[1]
  }
  return params
}

// 列表与导出共用的过滤项（不含分页参数，导出按筛选全量出）
const buildFilterParams = () => {
  const params = buildDateParams()
  if (filters.value.teacherId) params.teacherId = String(filters.value.teacherId)
  if (filters.value.collegeId) params.collegeId = String(filters.value.collegeId)
  if (filters.value.scoreRange) {
    const [min, max] = filters.value.scoreRange.split('-')
    params.minOverall = Number(min)
    params.maxOverall = Number(max)
  }
  return params
}

const buildPageParams = () => ({
  pageNum: pageNum.value,
  pageSize: pageSize.value,
  ...buildFilterParams()
})

const fetchPage = async () => {
  pageLoading.value = true
  try {
    const res = await getAdvisorEvalPage(buildPageParams())
    pageList.value = res.data?.records || []
    total.value = Number(res.data?.total ?? 0)
  } finally {
    pageLoading.value = false
  }
}

const handleFilterChange = () => {
  pageNum.value = 1
  fetchPage()
}

// 时间段同时驱动统计与明细两个数据区，变化时需双刷
const handleDateChange = () => {
  pageNum.value = 1
  fetchStats()
  fetchPage()
}

const resetFilters = () => {
  filters.value = { teacherId: '', collegeId: '', scoreRange: '', dateRange: [] }
  pageNum.value = 1
  fetchStats()
  fetchPage()
}

const filterByTeacher = (row) => {
  filters.value.teacherId = String(row.teacherId)
  pageNum.value = 1
  fetchPage()
  // 滚动到明细表
  document.querySelector('.filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// ── 筛选器选项 ──
const fetchFilterOptions = async () => {
  try {
    const [teacherRes, collegeRes] = await Promise.all([
      getAvailableTeachers(),
      getAllColleges()
    ])
    teacherOptions.value = teacherRes?.data || []
    collegeOptions.value = collegeRes?.data || []
  } catch {
    // 筛选选项加载失败不阻塞主流程，下拉为空可手动重置
  }
}

// ── 导出 ──
const exporting = ref(false)
const handleExport = async () => {
  exporting.value = true
  try {
    // 导出跟随当前筛选（时间段/导师/学院/分数段），与明细分页同一口径
    const res = await exportAdvisorEval(buildFilterParams())
    const blob = res.data || res
    saveBlobAs(blob, `advisor_evaluation_${new Date().toISOString().slice(0, 10)}.xlsx`)
    ElMessage.success('导出已开始')
  } catch (error) {
    console.error('导出导师评价失败:', error)
    ElMessage.error(error.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// ── 生命周期 ──
onMounted(() => {
  fetchStats()
  fetchPage()
  fetchFilterOptions()
})
</script>

<style scoped lang="scss">
.advisor-eval-management {
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

.period-tip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);

  .el-icon {
    color: var(--apple-primary);
  }

  .period-note {
    opacity: 0.85;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  text-align: center;

  .stat-label {
    font-size: 0.8125rem;
    color: var(--apple-ink-muted-48);
  }

  .stat-main {
    display: flex;
    justify-content: center;
  }

  .rate-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--apple-primary);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;

    &.warning-text {
      color: var(--apple-danger);
    }
  }

  .stat-sub {
    font-size: 0.75rem;
    color: var(--apple-ink-muted-48);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .card-title {
    display: flex;
    align-items: center;
    font-weight: 600;

    .el-icon {
      margin-right: 0.5rem;
      color: var(--apple-primary);
    }
  }

  .header-tip {
    font-size: 0.75rem;
    color: var(--apple-ink-muted-48);
  }
}

.chart-container {
  height: 360px;
}

.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;

  .filter-item {
    width: 200px;
  }

  .filter-date {
    width: 300px;
  }
}

.cell-main {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--apple-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-sub {
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
  margin-top: 2px;
}

.score-dims {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);

  .overall {
    color: var(--apple-ink);

    b {
      color: var(--apple-primary);
    }
  }
}

.tag-item {
  margin: 2px 4px 2px 0;
}

.comment-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.8125rem;
  color: var(--apple-ink);
  cursor: default;
}

.comment-full {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.muted {
  color: var(--apple-ink-muted-48);
}

.warn-icon {
  margin-left: 4px;
  color: var(--apple-danger);
  vertical-align: middle;
}

.danger-text {
  color: var(--apple-danger);
  font-weight: 600;
}

.score-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

:deep(.low-score-row) {
  background: rgba(255, 59, 48, 0.04);
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 992px) {
  .el-col {
    margin-bottom: 16px;
  }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.advisor-eval-management {
  gap: var(--apple-spacing-md);
}

.head-row {
  gap: var(--apple-spacing-md);
}

.head-title {
  margin-bottom: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-tagline);
  font-family: var(--apple-font-display);
}

.head-desc {
  font-size: var(--apple-fs-fine-print);
}

.period-tip {
  gap: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
}

.stat-card {
  gap: var(--apple-spacing-xs);
  padding: var(--apple-spacing-md);

  .stat-label,
  .stat-sub {
    font-size: var(--apple-fs-fine-print);
  }

  .rate-text {
    font-size: var(--apple-fs-caption);
  }

  .stat-value {
    font-size: var(--apple-fs-display-md);
  }
}

.card-header {
  gap: var(--apple-spacing-sm);

  .card-title {
    font-size: var(--apple-fs-body-strong);
    font-family: var(--apple-font-display);

    .el-icon {
      margin-right: var(--apple-spacing-xs);
    }
  }

  .header-tip {
    font-size: var(--apple-fs-fine-print);
  }
}

.filter-bar {
  gap: var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-md);
}

.cell-main,
.comment-preview,
.comment-full {
  font-size: var(--apple-fs-fine-print);
}

.cell-sub {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
}

.score-dims {
  gap: var(--apple-spacing-xxs) var(--apple-spacing-xs);
  font-size: var(--apple-fs-fine-print);
}

.tag-item {
  margin: var(--apple-spacing-xxs) var(--apple-spacing-xxs) var(--apple-spacing-xxs) 0;
}

.warn-icon {
  margin-left: var(--apple-spacing-xxs);
}

.table-footer {
  margin-top: var(--apple-spacing-md);
}

@media (max-width: 768px) {
  .head-row {
    flex-direction: column;
  }

  .filter-bar {
    .filter-item,
    .filter-date {
      width: 100%;
    }
  }

  .table-footer {
    justify-content: center;
  }
}
</style>
