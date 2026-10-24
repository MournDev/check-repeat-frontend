<template>
  <div class="report-page">
    <PageHeader :description="reportNoText">
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
          <span class="metric-value metric-primary" :class="similarityTone">
            {{ formatPercent(totalSimilarity) }}
          </span>
          <span class="metric-hint">{{ similarityHint }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">单篇最大</span>
          <span class="metric-value">{{ formatPercent(maxPerSource) }}</span>
          <span class="metric-hint">与单一来源的最高相似度</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">引用率</span>
          <span class="metric-value">{{ formatPercent(citationRate) }}</span>
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
                  原文率 {{ formatPercent(rateStat.originalRate) }}
                </span>
                <span v-if="sentenceMetrics.hitCount != null" class="chip">
                  命中句 {{ sentenceMetrics.hitCount }}
                </span>
              </div>
              <div class="overview-actions">
                <label class="overview-toggle">
                  <span>仅看重复段落</span>
                  <el-switch v-model="onlyRepeat" size="small" />
                </label>
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
            </div>

            <div v-if="selectedSourceId" class="overview-filter">
              <span class="chip chip-active">
                来源：{{ selectedSourceName }}
                <button class="chip-close" type="button" aria-label="清除来源筛选" @click="clearSourceFilter">×</button>
              </span>
            </div>

            <div v-if="visibleParagraphs.length" class="paragraph-list">
              <article
                v-for="item in visibleParagraphs"
                :key="item.displayNo"
                class="paragraph-item"
                :class="{ 'is-repeat': item.isRepeat }"
              >
                <header class="paragraph-head">
                  <span class="paragraph-no">第 {{ item.displayNo }} 段</span>
                  <div class="paragraph-tags">
                    <button
                      v-for="sourceId in (item.sourceIds || []).slice(0, 2)"
                      :key="sourceId"
                      type="button"
                      class="paragraph-source"
                      :title="sourceNameById(sourceId)"
                      @click="filterBySource(sourceId)"
                    >
                      {{ sourceNameById(sourceId) }}
                    </button>
                    <span v-if="(item.sourceIds || []).length > 2" class="paragraph-source-more">
                      +{{ item.sourceIds.length - 2 }}
                    </span>
                    <span v-if="item.isRepeat" class="paragraph-badge">相似度 {{ formatPercent(item.similarity) }}</span>
                  </div>
                </header>
                <!-- 后端生成的分段正文，仅含固定标红 span -->
                <div class="paragraph-content" v-html="item.content"></div>
              </article>
            </div>
            <el-empty v-else :description="paragraphEmptyText" />
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
                  <span class="source-rate">{{ formatPercent(source.maxSimilarity) }}</span>
                  <button
                    v-if="hasParagraphsForSource(source.sourceId)"
                    type="button"
                    class="source-locate"
                    @click="filterBySource(source.sourceId)"
                  >
                    定位段落
                  </button>
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
            <div v-if="historyList.length" class="history-toolbar">
              <span class="history-hint">勾选两份报告进行对比（最多 2 份）</span>
              <el-button
                type="primary"
                plain
                :disabled="compareSelected.length !== 2"
                @click="openCompare"
              >
                对比所选
              </el-button>
            </div>
            <div v-if="historyList.length" class="history-list">
              <article
                v-for="(record, index) in historyList"
                :key="record.id"
                class="history-item"
                :class="{
                  'is-current': String(record.id) === String(currentReportId),
                  'is-selected': isCompareSelected(record.id)
                }"
              >
                <el-checkbox
                  class="history-check"
                  :model-value="isCompareSelected(record.id)"
                  :disabled="compareSelected.length >= 2 && !isCompareSelected(record.id)"
                  @change="toggleCompare(record)"
                />
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

      <!-- 版本对比 -->
      <el-dialog v-model="compareVisible" title="报告版本对比" width="760px">
        <div class="compare-body" v-loading="compareLoading">
          <template v-if="comparison">
            <div class="compare-head">
              <div class="compare-side">
                <span class="compare-tag">基准</span>
                <span class="compare-name">{{ comparison.base.reportNo }}</span>
                <span class="compare-time">{{ formatDateTime(comparison.base.checkTime) }}</span>
              </div>
              <div class="compare-arrow">→</div>
              <div class="compare-side">
                <span class="compare-tag target">对比</span>
                <span class="compare-name">{{ comparison.target.reportNo }}</span>
                <span class="compare-time">{{ formatDateTime(comparison.target.checkTime) }}</span>
              </div>
            </div>

            <div class="compare-metrics">
              <div class="compare-metric compare-metric-head">
                <span class="compare-metric-label"></span>
                <span class="compare-metric-value">基准</span>
                <span class="compare-metric-value">对比</span>
                <span class="compare-delta">变化</span>
              </div>
              <div v-for="metric in compareMetrics" :key="metric.label" class="compare-metric">
                <span class="compare-metric-label">{{ metric.label }}</span>
                <span class="compare-metric-value">{{ metric.base }}</span>
                <span class="compare-metric-value">{{ metric.target }}</span>
                <span class="compare-delta" :class="metric.tone">{{ metric.delta }}</span>
              </div>
            </div>

            <div class="compare-sources">
              <div class="compare-block">
                <h4>新增相似来源（{{ comparison.addedSources.length }}）</h4>
                <ul v-if="comparison.addedSources.length">
                  <li v-for="item in comparison.addedSources" :key="item.name">
                    <span class="compare-source-name">{{ item.name }}</span>
                    <span class="compare-source-rate">{{ formatPercent(item.rate) }}</span>
                  </li>
                </ul>
                <p v-else class="compare-empty">无新增来源</p>
              </div>

              <div class="compare-block">
                <h4>相似度变化来源（{{ comparison.changedSources.length }}）</h4>
                <ul v-if="comparison.changedSources.length">
                  <li v-for="item in comparison.changedSources" :key="item.name">
                    <span class="compare-source-name">{{ item.name }}</span>
                    <span class="compare-source-rate">
                      {{ formatPercent(item.from) }} → {{ formatPercent(item.to) }}
                    </span>
                  </li>
                </ul>
                <p v-else class="compare-empty">无相似度变化</p>
              </div>

              <div class="compare-block">
                <h4>消失的相似来源（{{ comparison.removedSources.length }}）</h4>
                <ul v-if="comparison.removedSources.length">
                  <li v-for="item in comparison.removedSources" :key="item.name">
                    <span class="compare-source-name">{{ item.name }}</span>
                    <span class="compare-source-rate">{{ formatPercent(item.rate) }}</span>
                  </li>
                </ul>
                <p v-else class="compare-empty">无消失来源</p>
              </div>
            </div>
          </template>
          <el-empty v-else-if="!compareLoading" description="对比数据加载失败" />
        </div>
        <template #footer>
          <el-button @click="compareVisible = false">关闭</el-button>
        </template>
      </el-dialog>
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
import { formatDateTime as formatDateTimeShared, formatPercent } from '@/utils/dataType.js'
import { getSimilarityClass, getSimilarityLevel } from '@/utils/similarity.js'

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

// 版本对比
const compareSelected = ref([])
const compareVisible = ref(false)
const compareLoading = ref(false)
const comparison = ref(null)

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

// 重复率档位与颜色统一由 utils/similarity.js 决定（similarity-low/medium/high/unknown）
const similarityTone = computed(() => getSimilarityClass(totalSimilarity.value))

const similarityHint = computed(() => {
  const hints = {
    unknown: '暂无检测结果',
    low: '重复率低，原创性良好',
    medium: '重复率中等，建议关注高相似段落',
    high: '重复率偏高，建议重点修改'
  }
  return hints[getSimilarityLevel(totalSimilarity.value)]
})

const sortedSources = computed(() => {
  return [...similarSources.value].sort((a, b) => (Number(b.maxSimilarity) || 0) - (Number(a.maxSimilarity) || 0))
})

// ── 阅读筛选 ────────────────────────────────────────────────
const onlyRepeat = ref(false)
const selectedSourceId = ref('')

const visibleParagraphs = computed(() => {
  return paragraphs.value
    .map((item, index) => ({ ...item, displayNo: item.paragraphNo ?? index + 1 }))
    .filter((item) => {
      if (onlyRepeat.value && !item.isRepeat) return false
      if (!selectedSourceId.value) return true
      return (item.sourceIds || []).some((id) => String(id) === selectedSourceId.value)
    })
})

const paragraphEmptyText = computed(() => {
  if (selectedSourceId.value) return '该来源没有可预览的重复段落'
  if (onlyRepeat.value) return '未检测到重复段落'
  return '暂无可预览的正文分段'
})

const selectedSourceName = computed(() => {
  if (!selectedSourceId.value) return ''
  const hit = similarSources.value.find((item) => String(item.sourceId) === selectedSourceId.value)
  return hit?.sourceName || '所选来源'
})

const sourceNameById = (id) => {
  const key = String(id)
  const hit = similarSources.value.find((item) => String(item.sourceId) === key)
  return hit?.sourceName || `来源 ${key}`
}

const hasParagraphsForSource = (id) => {
  const key = String(id)
  return paragraphs.value.some((item) => (item.sourceIds || []).some((sourceId) => String(sourceId) === key))
}

const filterBySource = (id) => {
  if (id === null || id === undefined) return
  selectedSourceId.value = String(id)
  activeTab.value = 'overview'
}

const clearSourceFilter = () => {
  selectedSourceId.value = ''
}

// 对比指标行：正负变化按「越大越差」着色
const compareMetrics = computed(() => {
  const data = comparison.value
  if (!data) return []
  const rows = [
    { label: '总相似比', base: data.base.repeatRate, target: data.target.repeatRate, type: 'rate', worseWhenUp: true },
    { label: '单篇最大', base: data.base.maxPerSource, target: data.target.maxPerSource, type: 'rate', worseWhenUp: true },
    { label: '引用率', base: data.base.citationRate, target: data.target.citationRate, type: 'rate', worseWhenUp: false },
    { label: '重复段落', base: data.base.repeatParagraphCount, target: data.target.repeatParagraphCount, type: 'count', worseWhenUp: true },
    { label: '相似来源', base: data.base.sourceCount, target: data.target.sourceCount, type: 'count', worseWhenUp: true }
  ]
  return rows.map((row) => {
    const hasValue = row.base != null && row.target != null
    const delta = hasValue ? row.target - row.base : null
    let tone = 'neutral'
    if (delta != null && delta !== 0) {
      tone = (delta > 0) === row.worseWhenUp ? 'up' : 'down'
    }
    return {
      label: row.label,
      base: row.type === 'rate' ? formatPercent(row.base) : formatCount(row.base),
      target: row.type === 'rate' ? formatPercent(row.target) : formatCount(row.target),
      delta: formatDelta(delta, row.type),
      tone
    }
  })
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

const formatCount = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

const formatDelta = (delta, type) => {
  if (delta === null) return '—'
  if (delta === 0) return '持平'
  const sign = delta > 0 ? '+' : '-'
  const abs = Math.abs(delta)
  return type === 'rate' ? `${sign}${abs.toFixed(1)}%` : `${sign}${abs}`
}

// 非法日期保留原始串，便于发现脏数据（共享实现只会返回占位符）
const formatDateTime = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return String(date)
  return formatDateTimeShared(d)
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
  compareSelected.value = []
  comparison.value = null
  onlyRepeat.value = false
  selectedSourceId.value = ''

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

// ── 版本对比 ────────────────────────────────────────────────
const isCompareSelected = (id) => {
  return compareSelected.value.some((item) => String(item.id) === String(id))
}

const toggleCompare = (record) => {
  if (isCompareSelected(record.id)) {
    compareSelected.value = compareSelected.value.filter((item) => String(item.id) !== String(record.id))
    return
  }
  if (compareSelected.value.length >= 2) {
    compareSelected.value = [compareSelected.value[1], record]
    return
  }
  compareSelected.value = [...compareSelected.value, record]
}

const buildSnapshot = async (record) => {
  const res = await getPaperReport(String(record.id))
  const data = res?.data || {}
  const base = data.baseInfo || {}
  const rate = data.rateStat || {}
  const sources = Array.isArray(data.similarSources) ? data.similarSources : []

  let sentence = {}
  if (base.taskId) {
    try {
      const sentenceRes = await getSentenceDetail(base.taskId)
      sentence = sentenceRes?.data || {}
    } catch (error) {
      console.warn('对比时句级指标获取失败，使用报告汇总值', error)
    }
  }

  const sourceMax = sources.length
    ? Math.max(...sources.map((item) => Number(item.maxSimilarity) || 0))
    : null

  return {
    reportNo: base.reportNo || record.reportNo || '未编号报告',
    checkTime: base.checkTime || record.createTime,
    repeatRate: firstNumber(sentence.checkRate, rate.repeatRate),
    maxPerSource: firstNumber(sentence.maxPerSource, sourceMax),
    citationRate: firstNumber(sentence.citationRate),
    repeatParagraphCount: rate.repeatParagraphCount ?? null,
    sourceCount: sources.length,
    sources: sources.map((item) => ({
      name: item.sourceName || `来源 ${item.sourceId ?? ''}`.trim(),
      rate: Number(item.maxSimilarity) || 0
    }))
  }
}

const diffSources = (baseSources, targetSources) => {
  const baseMap = new Map(baseSources.map((item) => [item.name, item]))
  const addedSources = []
  const changedSources = []

  targetSources.forEach((item) => {
    const baseItem = baseMap.get(item.name)
    if (!baseItem) {
      addedSources.push(item)
      return
    }
    baseMap.delete(item.name)
    if (Math.abs(item.rate - baseItem.rate) >= 0.05) {
      changedSources.push({ name: item.name, from: baseItem.rate, to: item.rate })
    }
  })

  return {
    addedSources,
    changedSources,
    removedSources: Array.from(baseMap.values())
  }
}

const openCompare = async () => {
  if (compareSelected.value.length !== 2) return

  compareVisible.value = true
  compareLoading.value = true
  comparison.value = null

  const [older, newer] = [...compareSelected.value].sort(
    (a, b) => new Date(a.createTime || 0) - new Date(b.createTime || 0)
  )

  try {
    const [baseSnapshot, targetSnapshot] = await Promise.all([
      buildSnapshot(older),
      buildSnapshot(newer)
    ])
    if (isUnmounted) return
    comparison.value = {
      base: baseSnapshot,
      target: targetSnapshot,
      ...diffSources(baseSnapshot.sources, targetSnapshot.sources)
    }
  } catch (error) {
    console.error('报告版本对比失败:', error)
    ElMessage.error('对比数据加载失败')
  } finally {
    if (!isUnmounted) {
      compareLoading.value = false
    }
  }
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

.report-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-6);
}

// ── 论文信息条 ──────────────────────────────────────────────
.info-card {
  padding: var(--app-space-6);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}

.info-title {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-3);

  > .el-icon {
    margin-top: 4px;
    font-size: 22px;
    color: var(--app-color-primary);
  }

  h2 {
    margin: 0;
    font-family: var(--app-font-family);
    font-size: var(--app-fs-display);
    font-weight: 600;
    line-height: 1.3;
    word-break: break-word;
  }
}

.info-sub {
  margin: 4px 0 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-2) var(--app-space-6);
  margin-top: var(--app-space-4);
  padding-top: var(--app-space-3);
  border-top: 1px solid var(--app-color-divider);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

// ── 三指标 ──────────────────────────────────────────────────
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--app-space-3);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
  padding: var(--app-space-6);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}

.metric-label {
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.metric-value {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-title); // 次级指标（单篇最大 / 引用率）
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  // 颜色不在此声明：scoped 属性选择器会压过全局 .similarity-* 类，
  // 总相似比的颜色必须由全局 utility 决定；其余指标继承正文色。
}

// 核心门面数字：总相似比，保持大字号不被密度压缩
.metric-value.metric-primary {
  font-size: var(--app-fs-metric);
}

.metric-hint {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
}

// ── Tabs ────────────────────────────────────────────────────
.tab-card {
  padding: var(--app-space-6);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}

.overview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-4);
}

.overview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-2);
}

.chip {
  padding: 4px 10px;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-fill);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  font-variant-numeric: tabular-nums;
}

// ── 正文段落 ────────────────────────────────────────────────
.paragraph-list {
  max-height: 640px;
  overflow-y: auto;
  padding-right: var(--app-space-2);
}

.paragraph-item {
  padding: var(--app-space-4);
  border: 1px solid var(--app-color-divider);
  border-radius: var(--app-radius-md);
  margin-bottom: var(--app-space-3);

  &.is-repeat {
    border-color: var(--app-color-danger-border);
    background: var(--app-color-danger-bg);
  }
}

.paragraph-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-space-2);
}

.paragraph-no {
  font-size: var(--app-fs-meta);
  font-weight: 600;
  color: var(--app-color-text-muted);
}

.paragraph-badge {
  padding: 2px 8px;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-card-bg);
  font-size: var(--app-fs-meta);
  color: var(--app-color-danger);
  font-variant-numeric: tabular-nums;
}

.paragraph-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--app-color-ink);
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
  gap: var(--app-space-4);
  padding: var(--app-space-4) 0;
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.source-main {
  flex: 1;
  min-width: 0;
}

.source-name {
  font-size: var(--app-fs-caption);
  font-weight: 500;
  color: var(--app-color-ink);
  word-break: break-word;
}

.source-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px var(--app-space-3);
  margin-top: 4px;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
}

.source-type {
  padding: 1px 8px;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-fill);
  color: var(--app-color-text-muted);
}

.source-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.source-rate {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-danger);
  font-variant-numeric: tabular-nums;
}

.source-link {
  font-size: var(--app-fs-meta);
  color: var(--app-color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// ── 阅读筛选 ────────────────────────────────────────────────
.overview-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-4);
  flex-shrink: 0;
}

.overview-toggle {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-secondary);
  cursor: pointer;
}

.overview-filter {
  margin-bottom: var(--app-space-3);
}

.chip-active {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--app-color-info-bg);
  color: var(--app-color-primary);
}

.chip-close {
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: var(--app-fs-caption);
  line-height: 1;
  cursor: pointer;
}

.paragraph-tags {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.paragraph-source {
  max-width: 160px;
  padding: 2px 8px;
  overflow: hidden;
  border: none;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-card-bg);
  color: var(--app-color-primary);
  font-size: var(--app-fs-meta);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: var(--app-color-info-bg);
  }
}

.paragraph-source-more {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.source-locate {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--app-color-primary);
  font-size: var(--app-fs-meta);
  cursor: pointer;

  &:hover {
    color: var(--app-color-primary-hover);
    text-decoration: underline;
  }
}

// ── 历史记录 ────────────────────────────────────────────────
.history-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-3);
  padding-bottom: var(--app-space-3);
  border-bottom: 1px solid var(--app-color-divider);
}

.history-hint {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-3);
  padding: var(--app-space-4) 0;
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child {
    border-bottom: none;
  }

  &.is-current {
    background: var(--app-color-info-bg);
    border-radius: var(--app-radius-md);
    padding-left: var(--app-space-3);
    padding-right: var(--app-space-3);
  }

  &.is-selected {
    background: var(--app-color-fill);
    border-radius: var(--app-radius-md);
    padding-left: var(--app-space-3);
    padding-right: var(--app-space-3);
  }
}

.history-check {
  flex-shrink: 0;
  height: 18px;
  margin-top: 0;
}

.history-version {
  flex-shrink: 0;
  width: 56px;
  font-size: var(--app-fs-meta);
  font-weight: 600;
  color: var(--app-color-primary);
}

.history-main {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-size: var(--app-fs-caption);
  font-weight: 500;
  color: var(--app-color-ink);
  font-variant-numeric: tabular-nums;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  margin-top: 2px;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.history-detail {
  margin-top: 4px;
  font-size: var(--app-fs-meta);
  line-height: 1.6;
  color: var(--app-color-text-secondary);
  word-break: break-word;
}

// ── 版本对比 ────────────────────────────────────────────────
.compare-body {
  min-height: 120px;
}

.compare-head {
  display: flex;
  align-items: center;
  gap: var(--app-space-4);
  padding: var(--app-space-3) var(--app-space-4);
  background: var(--app-color-fill);
  border-radius: var(--app-radius-md);
}

.compare-side {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.compare-arrow {
  color: var(--app-color-text-muted);
}

.compare-tag {
  align-self: flex-start;
  padding: 1px 8px;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-card-bg);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);

  &.target {
    color: var(--app-color-primary);
    background: var(--app-color-info-bg);
  }
}

.compare-name {
  font-size: var(--app-fs-caption);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.compare-time {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.compare-metrics {
  margin-top: var(--app-space-4);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
  overflow: hidden;
}

.compare-metric {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: var(--app-space-2);
  padding: 10px var(--app-space-4);
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.compare-metric-head {
  background: var(--app-color-fill);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.compare-metric-label {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
}

.compare-metric-value {
  font-size: var(--app-fs-meta);
  font-variant-numeric: tabular-nums;
  color: var(--app-color-ink);
}

.compare-delta {
  font-size: var(--app-fs-meta);
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  &.up { color: var(--app-color-danger); }
  &.down { color: var(--app-color-success); }
  &.neutral { color: var(--app-color-text-muted); }
}

.compare-sources {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  margin-top: var(--app-space-4);
}

.compare-block {
  h4 {
    margin: 0 0 var(--app-space-2);
    font-size: var(--app-fs-meta);
    font-weight: 600;
    color: var(--app-color-text-secondary);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--app-space-3);
    padding: 6px 0;
    border-bottom: 1px solid var(--app-color-divider);
    font-size: var(--app-fs-meta);

    &:last-child {
      border-bottom: none;
    }
  }
}

.compare-source-name {
  flex: 1;
  min-width: 0;
  color: var(--app-color-ink);
  word-break: break-word;
}

.compare-source-rate {
  flex-shrink: 0;
  color: var(--app-color-text-muted);
  font-variant-numeric: tabular-nums;
}

.compare-empty {
  margin: 0;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

// ── 响应式 ──────────────────────────────────────────────────
@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .overview-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-actions {
    width: 100%;
    justify-content: space-between;
  }

  .paragraph-head {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--app-space-1);
  }

  .paragraph-tags {
    justify-content: flex-start;
  }

  .source-item {
    flex-direction: column;
  }

  .source-side {
    align-items: flex-start;
  }
}
</style>
