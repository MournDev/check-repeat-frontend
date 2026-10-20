<template>
  <div class="report-page">
    <PageHeader title="查重报告" :description="reportNoText">
      <template #actions>
        <el-button text :icon="ArrowLeft" @click="goBack">返回</el-button>
        <el-button :icon="Share" @click="shareReport">分享</el-button>
        <el-dropdown @command="handleExport">
          <el-button :icon="Download" :disabled="!currentReportId">
            导出报告<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pdf">导出 PDF</el-dropdown-item>
              <el-dropdown-item command="html">导出 HTML</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </PageHeader>

    <el-skeleton v-if="loading" :rows="10" animated />

    <div v-else-if="hasReport" class="report-body">
      <!-- 论文信息条 -->
      <section class="info-card">
        <div class="info-title">
          <el-icon><Document /></el-icon>
          <div>
            <h2>{{ baseInfo.paperTitle || '暂无标题' }}</h2>
            <p class="info-sub">
              {{ baseInfo.studentName || baseInfo.author || '未知作者' }}
              <template v-if="baseInfo.teacherName"> · 指导老师 {{ baseInfo.teacherName }}</template>
            </p>
          </div>
        </div>
        <div class="info-meta">
          <span class="meta-item">
            <el-icon><Collection /></el-icon>
            {{ baseInfo.reportNo || '—' }}
          </span>
          <span class="meta-item">
            <el-icon><Setting /></el-icon>
            {{ baseInfo.checkRuleName || '—' }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            检测 {{ formatDateTime(baseInfo.checkTime) }}
          </span>
          <span class="meta-item">
            <el-icon><Timer /></el-icon>
            生成 {{ baseInfo.generateTime || '—' }}
          </span>
        </div>
      </section>

      <!-- 三指标 -->
      <section class="metric-grid">
        <div class="metric-card">
          <span class="metric-label">总相似比</span>
          <span class="metric-value" :class="similarityTone">
            {{ formatRate(totalSimilarity) }}
          </span>
          <span class="metric-hint">{{ similarityHint }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">单篇最大</span>
          <span class="metric-value neutral">{{ formatRate(maxPerSource) }}</span>
          <span class="metric-hint">与单一来源的最高相似度</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">引用率</span>
          <span class="metric-value neutral">{{ formatRate(citationRate) }}</span>
          <span class="metric-hint">引用命中句占正文比例</span>
        </div>
      </section>

      <!-- 详情 -->
      <section class="tab-card">
        <el-tabs v-model="activeTab">
          <!-- 概览 -->
          <el-tab-pane label="概览" name="overview">
            <div class="overview-head">
              <div class="overview-chips">
                <span class="chip">
                  重复段落 {{ rateStat.repeatParagraphCount ?? '—' }} / {{ rateStat.totalParagraphCount ?? '—' }}
                </span>
                <span class="chip">
                  原文率 {{ rateStat.originalRate != null ? Number(rateStat.originalRate).toFixed(1) + '%' : '—' }}
                </span>
                <span v-if="sentenceMetrics.hitCount != null" class="chip">
                  命中句 {{ sentenceMetrics.hitCount }}
                </span>
              </div>
              <el-button
                type="primary"
                plain
                :icon="DataLine"
                :disabled="!baseInfo.taskId"
                @click="goSentenceDetail"
              >
                查看句级明细
              </el-button>
            </div>

            <div v-if="paragraphs.length" class="paragraph-list">
              <article
                v-for="(item, index) in paragraphs"
                :key="item.paragraphNo ?? index"
                class="paragraph-item"
                :class="{ 'is-repeat': item.isRepeat }"
              >
                <header class="paragraph-head">
                  <span class="paragraph-no">第 {{ item.paragraphNo ?? index + 1 }} 段</span>
                  <span v-if="item.isRepeat" class="paragraph-badge">相似度 {{ formatRate(item.similarity) }}</span>
                </header>
                <!-- 后端生成的分段正文，仅含固定标红 span -->
                <div class="paragraph-content" v-html="item.content"></div>
              </article>
            </div>
            <el-empty v-else description="暂无可预览的正文分段" />
          </el-tab-pane>

          <!-- 相似来源 -->
          <el-tab-pane label="相似来源" name="sources">
            <div v-if="sortedSources.length" class="source-list">
              <article
                v-for="source in sortedSources"
                :key="source.sourceId"
                class="source-item"
              >
                <div class="source-main">
                  <div class="source-name">{{ source.sourceName || '未知来源' }}</div>
                  <div class="source-meta">
                    <span class="source-type" v-if="source.sourceType">{{ source.sourceType }}</span>
                    <span v-if="source.matchedParagraphs">
                      匹配段落：{{ source.matchedParagraphs }}
                    </span>
                  </div>
                </div>
                <div class="source-side">
                  <span class="source-rate">{{ formatRate(source.maxSimilarity) }}</span>
                  <a
                    v-if="source.sourceUrl"
                    class="source-link"
                    :href="source.sourceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看来源
                  </a>
                </div>
              </article>
            </div>
            <el-empty v-else description="未发现相似来源" />
          </el-tab-pane>

          <!-- 历史记录 -->
          <el-tab-pane label="历史记录" name="history">
            <div v-if="historyList.length" class="history-list">
              <article
                v-for="(record, index) in historyList"
                :key="record.id"
                class="history-item"
                :class="{ 'is-current': String(record.id) === String(currentReportId) }"
              >
                <div class="history-version">第 {{ historyList.length - index }} 次</div>
                <div class="history-main">
                  <div class="history-title">{{ record.reportNo || '未编号报告' }}</div>
                  <div class="history-meta">
                    <span v-if="record.reportType">{{ record.reportType }}</span>
                    <span>{{ formatDateTime(record.createTime) }}</span>
                  </div>
                  <div v-if="record.repeatDetails" class="history-detail">{{ record.repeatDetails }}</div>
                </div>
                <el-button
                  text
                  type="primary"
                  :disabled="String(record.id) === String(currentReportId)"
                  @click="selectHistory(record)"
                >
                  {{ String(record.id) === String(currentReportId) ? '当前查看' : '查看' }}
                </el-button>
              </article>
            </div>
            <el-empty v-else description="暂无历史报告" />
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>

    <el-empty v-else description="未找到该论文的查重报告">
      <el-button type="primary" @click="goBack">返回</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, ArrowDown, Download, Share, Document, Calendar, Timer,
  DataLine, Collection, Setting
} from '@element-plus/icons-vue'
import { getPaperReport, exportCheckReport, getSimpleCheckReport } from '@/api/student'
import { getSentenceDetail } from '@/api/p5'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()

const activeTab = ref('overview')
const loading = ref(false)
const hasReport = ref(false)
const currentReportId = ref('')

const baseInfo = ref({})
const rateStat = ref({})
const paragraphs = ref([])
const similarSources = ref([])
const sentenceMetrics = ref({
  checkRate: null,
  maxPerSource: null,
  citationRate: null,
  hitCount: null
})
const historyList = ref([])

let isUnmounted = false

// ── 展示派生 ────────────────────────────────────────────────
const reportNoText = computed(() => {
  if (!hasReport.value) return ''
  const no = baseInfo.value.reportNo
  return no ? `报告编号 ${no}` : '在线预览查重结果'
})

const totalSimilarity = computed(() => {
  return firstNumber(
    sentenceMetrics.value.checkRate,
    rateStat.value.repeatRate,
    baseInfo.value.similarityRate
  )
})

const maxPerSource = computed(() => {
  return sentenceMetrics.value.maxPerSource ?? null
})

const citationRate = computed(() => {
  return sentenceMetrics.value.citationRate ?? null
})

const similarityTone = computed(() => {
  const value = totalSimilarity.value
  if (value == null) return 'neutral'
  if (value < 15) return 'success'
  if (value < 30) return 'warning'
  return 'danger'
})

const similarityHint = computed(() => {
  const value = totalSimilarity.value
  if (value == null) return '暂无检测结果'
  if (value < 15) return '低于 15%，原创性良好'
  if (value < 30) return '15%–30%，建议关注高相似段落'
  return '高于 30%，建议重点修改'
})

const sortedSources = computed(() => {
  return [...similarSources.value].sort((a, b) => (Number(b.maxSimilarity) || 0) - (Number(a.maxSimilarity) || 0))
})

// ── 工具 ────────────────────────────────────────────────────
function firstNumber(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value)
      if (!Number.isNaN(num)) return num
    }
  }
  return null
}

const formatRate = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return `${num.toFixed(1)}%`
}

const formatDateTime = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return String(date)
  return d.toLocaleString('zh-CN')
}

// ── 数据加载 ────────────────────────────────────────────────
const fetchSentenceMetrics = async (taskId) => {
  sentenceMetrics.value = { checkRate: null, maxPerSource: null, citationRate: null, hitCount: null }
  if (!taskId) return
  try {
    const res = await getSentenceDetail(taskId)
    const data = res?.data || {}
    sentenceMetrics.value = {
      checkRate: data.checkRate ?? null,
      maxPerSource: data.maxPerSource ?? null,
      citationRate: data.citationRate ?? null,
      hitCount: data.hitCount ?? null
    }
  } catch (error) {
    // 存量任务无句级数据属正常情况，指标回落到 rateStat
    console.warn('句级明细指标获取失败，使用报告汇总值', error)
  }
}

const normalizeHistory = (list) => {
  if (!Array.isArray(list)) return []
  return [...list].sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
}

const loadReport = async () => {
  const paperId = route.params.paperId
  const queryReportId = route.query.reportId

  if (!paperId || paperId === 'undefined') {
    ElMessage.error('论文 ID 参数无效')
    router.back()
    return
  }

  loading.value = true
  hasReport.value = false

  try {
    // 历史列表先发起；若 query 已带 reportId，则报告详情与其并行
    const historyPromise = getSimpleCheckReport(paperId)
    let targetReportId = queryReportId && /^\d+$/.test(String(queryReportId)) ? String(queryReportId) : ''

    if (!targetReportId) {
      const historyRes = await historyPromise
      const list = normalizeHistory(historyRes?.data)
      historyList.value = list
      targetReportId = list[0]?.id ? String(list[0].id) : ''
    }

    if (!targetReportId) {
      hasReport.value = false
      return
    }

    const [reportRes, historyRes] = await Promise.all([
      getPaperReport(targetReportId),
      historyPromise
    ])

    if (isUnmounted) return

    historyList.value = normalizeHistory(historyRes?.data)

    const data = reportRes?.data || {}
    baseInfo.value = data.baseInfo || {}
    rateStat.value = data.rateStat || {}
    paragraphs.value = Array.isArray(data.paragraphs) ? data.paragraphs : []
    similarSources.value = Array.isArray(data.similarSources) ? data.similarSources : []
    currentReportId.value = String(baseInfo.value.reportId || targetReportId)
    hasReport.value = true

    await fetchSentenceMetrics(baseInfo.value.taskId)
  } catch (error) {
    console.error('加载查重报告失败:', error)
    hasReport.value = false
  } finally {
    if (!isUnmounted) {
      loading.value = false
    }
  }
}

// ── 交互 ────────────────────────────────────────────────────
const goBack = () => {
  router.back()
}

const shareReport = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    ElMessage.success('报告链接已复制到剪贴板')
  } catch {
    ElMessage.info('当前浏览器不支持自动复制，请手动复制地址栏链接')
  }
}

const goSentenceDetail = () => {
  const taskId = baseInfo.value.taskId
  if (!taskId) {
    ElMessage.warning('该报告暂无句级数据')
    return
  }
  router.push({ name: 'SentenceDetail', params: { taskId: String(taskId) } })
}

const handleExport = (command) => {
  if (command !== 'pdf' && command !== 'html') return
  ElMessageBox.confirm(`确定要导出为 ${command.toUpperCase()} 格式吗？`, '导出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    exportReport(command)
  }).catch(() => {})
}

const exportReport = async (format) => {
  if (!currentReportId.value) {
    ElMessage.error('当前报告不可导出')
    return
  }
  try {
    const response = await exportCheckReport(currentReportId.value, format)
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `查重报告_${baseInfo.value.paperTitle || '未知'}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  }
}

const selectHistory = async (record) => {
  if (!record?.id) {
    ElMessage.warning('该版本暂无报告')
    return
  }
  if (String(record.id) === String(currentReportId.value)) {
    ElMessage.info('已经是当前查看的版本')
    return
  }
  await router.replace({
    path: route.path,
    query: { ...route.query, reportId: String(record.id) }
  })
  loadReport()
}

onMounted(() => {
  loadReport()
})

onUnmounted(() => {
  isUnmounted = true
})
</script>

<style lang="scss" scoped>
// 颜色/圆角/间距一律引用 design-tokens.scss（唯一真源）

.report-page {
  padding: var(--apple-spacing-lg);
  background: var(--apple-canvas-parchment);
  min-height: 100vh;
  font-family: var(--apple-font-text);
  color: var(--apple-ink);
}

.report-body {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-lg);
}

// ── 论文信息条 ──────────────────────────────────────────────
.info-card {
  padding: var(--apple-spacing-lg);
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
}

.info-title {
  display: flex;
  align-items: flex-start;
  gap: var(--apple-spacing-sm);

  > .el-icon {
    margin-top: 4px;
    font-size: 22px;
    color: var(--apple-primary);
  }

  h2 {
    margin: 0;
    font-family: var(--apple-font-display);
    font-size: var(--apple-fs-lead-airy);
    font-weight: 600;
    line-height: 1.3;
    word-break: break-word;
  }
}

.info-sub {
  margin: 4px 0 0;
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink-muted-48);
}

.info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apple-spacing-xs) var(--apple-spacing-lg);
  margin-top: var(--apple-spacing-md);
  padding-top: var(--apple-spacing-sm);
  border-top: 1px solid var(--apple-divider-soft);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

// ── 三指标 ──────────────────────────────────────────────────
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--apple-spacing-sm);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-xxs);
  padding: var(--apple-spacing-lg);
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
}

.metric-label {
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink-muted-48);
}

.metric-value {
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-display-md);
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;

  &.success { color: var(--apple-success); }
  &.warning { color: var(--apple-warning); }
  &.danger { color: var(--apple-danger); }
  &.neutral { color: var(--apple-ink); }
}

.metric-hint {
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-secondary);
}

// ── Tabs ────────────────────────────────────────────────────
.tab-card {
  padding: var(--apple-spacing-lg);
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
}

.overview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-md);
}

.overview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apple-spacing-xs);
}

.chip {
  padding: 4px 10px;
  border-radius: var(--apple-rounded-pill);
  background: var(--apple-canvas-parchment);
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
  font-variant-numeric: tabular-nums;
}

// ── 正文段落 ────────────────────────────────────────────────
.paragraph-list {
  max-height: 640px;
  overflow-y: auto;
  padding-right: var(--apple-spacing-xs);
}

.paragraph-item {
  padding: var(--apple-spacing-md);
  border: 1px solid var(--apple-divider-soft);
  border-radius: var(--apple-rounded-md);
  margin-bottom: var(--apple-spacing-sm);

  &.is-repeat {
    border-color: var(--apple-danger-border);
    background: var(--apple-danger-bg);
  }
}

.paragraph-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--apple-spacing-xs);
}

.paragraph-no {
  font-size: var(--apple-fs-fine-print);
  font-weight: 600;
  color: var(--apple-ink-muted-48);
}

.paragraph-badge {
  padding: 2px 8px;
  border-radius: var(--apple-rounded-pill);
  background: var(--apple-surface);
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-danger);
  font-variant-numeric: tabular-nums;
}

.paragraph-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--apple-ink);
  white-space: pre-wrap;
  word-break: break-word;
}

// ── 相似来源 ────────────────────────────────────────────────
.source-list {
  display: flex;
  flex-direction: column;
}

.source-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--apple-spacing-md);
  padding: var(--apple-spacing-md) 0;
  border-bottom: 1px solid var(--apple-divider-soft);

  &:last-child {
    border-bottom: none;
  }
}

.source-main {
  flex: 1;
  min-width: 0;
}

.source-name {
  font-size: var(--apple-fs-caption);
  font-weight: 500;
  color: var(--apple-ink);
  word-break: break-word;
}

.source-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px var(--apple-spacing-sm);
  margin-top: 4px;
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-secondary);
}

.source-type {
  padding: 1px 8px;
  border-radius: var(--apple-rounded-pill);
  background: var(--apple-canvas-parchment);
  color: var(--apple-ink-muted-48);
}

.source-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.source-rate {
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-body-strong);
  font-weight: 600;
  color: var(--apple-danger);
  font-variant-numeric: tabular-nums;
}

.source-link {
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// ── 历史记录 ────────────────────────────────────────────────
.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: var(--apple-spacing-sm);
  padding: var(--apple-spacing-md) 0;
  border-bottom: 1px solid var(--apple-divider-soft);

  &:last-child {
    border-bottom: none;
  }

  &.is-current {
    background: var(--apple-info-bg);
    border-radius: var(--apple-rounded-md);
    padding-left: var(--apple-spacing-sm);
    padding-right: var(--apple-spacing-sm);
  }
}

.history-version {
  flex-shrink: 0;
  width: 56px;
  font-size: var(--apple-fs-fine-print);
  font-weight: 600;
  color: var(--apple-primary);
}

.history-main {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-size: var(--apple-fs-caption);
  font-weight: 500;
  color: var(--apple-ink);
  font-variant-numeric: tabular-nums;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apple-spacing-sm);
  margin-top: 2px;
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

.history-detail {
  margin-top: 4px;
  font-size: var(--apple-fs-fine-print);
  line-height: 1.6;
  color: var(--apple-ink-secondary);
  word-break: break-word;
}

// ── 响应式 ──────────────────────────────────────────────────
@media (max-width: 900px) {
  .report-page {
    padding: var(--apple-spacing-sm);
  }

  .metric-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .overview-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .source-item {
    flex-direction: column;
  }

  .source-side {
    align-items: flex-start;
  }
}
</style>
