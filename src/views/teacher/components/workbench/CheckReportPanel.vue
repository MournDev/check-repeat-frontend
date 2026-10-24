<template>
  <div class="check-report-panel">
    <div v-if="loading" class="report-loading">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="error" class="report-state">
      <el-icon class="state-icon danger"><WarningFilled /></el-icon>
      <p>{{ error }}</p>
      <el-button size="small" @click="emit('retry')">重新加载</el-button>
    </div>

    <div v-else-if="noReport" class="report-state">
      <el-icon class="state-icon"><Document /></el-icon>
      <p>该论文暂无已完成的查重报告</p>
      <span class="state-tip">请先确认查重任务已完成；若长时间无报告，请联系管理员排查。</span>
    </div>

    <template v-else>
      <section class="risk-banner" :class="risk.cls">
        <div class="risk-ring">
          <svg viewBox="0 0 44 44" class="ring-svg">
            <circle class="ring-track" cx="22" cy="22" r="18" />
            <circle
              class="ring-value"
              cx="22"
              cy="22"
              r="18"
              :stroke-dasharray="`${ringOffset} ${ringCircumference}`"
            />
          </svg>
          <span class="ring-num">{{ formatPercent(metrics.repeatRate) }}</span>
        </div>
        <div class="risk-info">
          <div class="risk-title">总相似比 · {{ risk.label }}</div>
          <div class="risk-meta">
            <span v-if="baseInfo.checkTime">检测时间 {{ formatDateTime(baseInfo.checkTime, 'YYYY-MM-DD HH:mm') }}</span>
            <span v-if="baseInfo.taskNo">任务号 {{ baseInfo.taskNo }}</span>
            <span v-else-if="latestReport?.reportNo">报告号 {{ latestReport.reportNo }}</span>
          </div>
          <div class="risk-meta muted">报告只读引用，不随预览缩放或高亮变化</div>
        </div>
      </section>

      <section class="metric-grid">
        <div class="metric-item">
          <span class="metric-label">总相似比</span>
          <strong class="metric-value" :style="{ color: getSimilarityColor(metrics.repeatRate) }">
            {{ formatPercent(metrics.repeatRate) }}
          </strong>
        </div>
        <div class="metric-item">
          <span class="metric-label">单篇最大</span>
          <strong class="metric-value">{{ formatPercent(metrics.maxPerSource) }}</strong>
        </div>
        <div class="metric-item">
          <span class="metric-label">引用率</span>
          <strong class="metric-value muted">{{ formatPercent(metrics.citationRate) }}</strong>
        </div>
      </section>

      <section class="source-section">
        <div class="section-head">
          <span>相似来源</span>
          <span class="section-count">{{ sources.length }} 条</span>
        </div>

        <div v-if="!sources.length" class="source-empty">本次检测未命中相似来源</div>

        <div v-for="(source, index) in sources" :key="source.sourceId || index" class="source-block">
          <button type="button" class="source-row" @click="toggleSource(source)">
            <span class="source-index">{{ index + 1 }}</span>
            <span class="source-main">
              <span class="source-name">{{ source.sourceName || '未知来源' }}</span>
              <span class="source-sub">
                <span v-if="source.sourceType">{{ source.sourceType }}</span>
                <span v-if="source.matchedParagraphs">匹配段落 {{ source.matchedParagraphs }}</span>
              </span>
            </span>
            <span
              class="source-rate"
              :style="{ color: getSimilarityColor(source.maxSimilarity) }"
            >
              {{ formatPercent(source.maxSimilarity) }}
            </span>
            <el-icon class="source-arrow" :class="{ expanded: expandedId === String(source.sourceId) }">
              <ArrowRight />
            </el-icon>
          </button>

          <el-collapse-transition>
            <div v-show="expandedId === String(source.sourceId)" class="source-detail">
              <div v-if="source.sourceUrl" class="source-link">
                <a :href="source.sourceUrl" target="_blank" rel="noopener noreferrer">打开来源</a>
              </div>

              <div v-if="matchedParagraphs(source).length" class="match-list">
                <div v-for="item in matchedParagraphs(source)" :key="item.paragraphNo" class="match-item">
                  <div class="match-head">
                    <span>第 {{ item.paragraphNo }} 段</span>
                    <span class="match-rate">{{ formatPercent(item.similarity) }}</span>
                  </div>
                  <div class="match-content" v-html="item.content" />
                </div>
              </div>

              <div v-else-if="source.matchedParagraphs" class="match-plain">
                匹配段落：{{ source.matchedParagraphs }}
              </div>
              <div v-else class="match-plain muted">暂无可用匹配片段</div>
            </div>
          </el-collapse-transition>
        </div>
      </section>

      <div class="report-foot">
        <span class="foot-note">片段仅用于审核参考，点击来源展开匹配内容</span>
        <el-button
          type="primary"
          size="small"
          plain
          :icon="Download"
          :disabled="!latestReport?.id"
          @click="emit('download')"
        >
          查看完整报告（PDF）
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowRight, Document, Download, WarningFilled } from '@element-plus/icons-vue'
import { formatDateTime, formatPercent } from '@/utils/dataType.js'
import { getSimilarityColor, getSimilarityLevel } from '@/utils/similarity.js'

const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  noReport: { type: Boolean, default: false },
  metrics: { type: Object, default: () => ({}) },
  baseInfo: { type: Object, default: () => ({}) },
  sources: { type: Array, default: () => [] },
  paragraphs: { type: Array, default: () => [] },
  latestReport: { type: Object, default: null }
})

const emit = defineEmits(['retry', 'download'])

const expandedId = ref(null)

const ringCircumference = 2 * Math.PI * 18

const ringOffset = computed(() => {
  const rate = Number(props.metrics?.repeatRate)
  if (!Number.isFinite(rate)) return 0
  return Math.min(100, Math.max(0, rate)) / 100 * ringCircumference
})

// 风险分档统一走 utils/similarity.js，本组件仅保留展示文案与类名
const SIMILARITY_RISK = {
  unknown: { label: '暂无数据', cls: 'unknown' },
  low: { label: '低风险', cls: 'low' },
  medium: { label: '中风险', cls: 'medium' },
  high: { label: '高风险', cls: 'high' }
}

const risk = computed(() => SIMILARITY_RISK[getSimilarityLevel(props.metrics?.repeatRate)])

const toggleSource = (source) => {
  const id = String(source.sourceId)
  expandedId.value = expandedId.value === id ? null : id
}

const matchedParagraphs = (source) => {
  const sourceId = String(source.sourceId)
  return (props.paragraphs || []).filter(item =>
    Array.isArray(item.sourceIds) && item.sourceIds.some(id => String(id) === sourceId)
  )
}

watch(() => props.sources, () => {
  expandedId.value = null
})
</script>

<style scoped lang="scss">
.check-report-panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  padding: var(--app-space-3) 0 var(--app-space-2);
  font-family: var(--app-font-family);
}

.report-loading {
  padding: var(--app-space-1);
}

.report-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: var(--app-space-6);
  text-align: center;
  color: var(--app-color-text-muted);
}

.state-icon {
  font-size: 36px;
  color: var(--app-color-text-secondary);
}

.state-icon.danger {
  color: var(--app-color-danger);
}

.report-state p {
  margin: var(--app-space-3) 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-ink);
}

.state-tip {
  max-width: 280px;
  font-size: var(--app-fs-meta);
  line-height: 1.5;
}

.risk-banner {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: var(--app-space-3);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
  background: var(--app-color-fill-light);
}

.risk-banner.low {
  border-color: color-mix(in srgb, var(--app-color-success) 32%, var(--app-color-border));
  background: var(--app-color-success-bg);
}

.risk-banner.medium {
  border-color: color-mix(in srgb, var(--app-color-warning) 32%, var(--app-color-border));
  background: var(--app-color-warning-bg);
}

.risk-banner.high {
  border-color: color-mix(in srgb, var(--app-color-danger) 32%, var(--app-color-border));
  background: var(--app-color-danger-bg);
}

.risk-ring {
  position: relative;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
}

.ring-svg {
  width: 58px;
  height: 58px;
  transform: rotate(-90deg);
}

.ring-track,
.ring-value {
  fill: none;
  stroke-width: 4;
}

.ring-track {
  stroke: var(--app-color-border);
}

.ring-value {
  stroke: var(--app-color-primary);
  stroke-linecap: round;
  transition: stroke-dasharray var(--app-transition-slow);
}

.risk-banner.low .ring-value {
  stroke: var(--app-color-success);
}

.risk-banner.medium .ring-value {
  stroke: var(--app-color-warning);
}

.risk-banner.high .ring-value {
  stroke: var(--app-color-danger);
}

.ring-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-fs-meta);
  font-weight: 700;
  color: var(--app-color-ink);
}

.risk-info {
  min-width: 0;
}

.risk-title {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-caption);
  font-weight: 600;
  color: var(--app-color-ink);
}

.risk-meta {
  margin-top: var(--app-space-1);
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1) var(--app-space-2);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.muted {
  color: var(--app-color-text-muted) !important;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--app-space-2);
}

.metric-item {
  padding: var(--app-space-2);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-color-card-bg);
}

.metric-label {
  display: block;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.metric-value {
  display: block;
  margin-top: var(--app-space-1);
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-ink);
}

.source-section {
  border-top: 1px solid var(--app-color-divider);
  padding-top: var(--app-space-3);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-space-2);
  font-size: var(--app-fs-caption);
  font-weight: 600;
  color: var(--app-color-ink);
}

.section-count {
  font-size: var(--app-fs-meta);
  font-weight: 500;
  color: var(--app-color-text-muted);
}

.source-empty {
  padding: var(--app-space-4) 0;
  text-align: center;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.source-block {
  border-bottom: 1px solid var(--app-color-divider);
}

/* 行高约 42px：单行来源名 + 单行辅助信息，接近表格密度 */
.source-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  width: 100%;
  padding: 5px 2px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--app-transition-fast);

  &:hover {
    background: var(--app-color-fill);
  }

  &:focus-visible {
    outline: 2px solid var(--app-color-primary);
    outline-offset: -2px;
  }
}

.source-row:hover .source-name {
  color: var(--app-color-primary);
}

.source-index {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-fs-meta);
  line-height: 1;
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
  border-radius: var(--app-radius-pill);
}

.source-main {
  flex: 1;
  min-width: 0;
}

.source-name {
  display: block;
  font-size: var(--app-fs-caption);
  line-height: 1.3;
  color: var(--app-color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-sub {
  display: flex;
  gap: var(--app-space-2);
  font-size: var(--app-fs-meta);
  line-height: 1.3;
  color: var(--app-color-text-muted);
  white-space: nowrap;
  overflow: hidden;

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.source-rate {
  flex-shrink: 0;
  font-size: var(--app-fs-caption);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.source-arrow {
  flex-shrink: 0;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  transition: transform var(--app-transition-fast);
}

.source-arrow.expanded {
  transform: rotate(90deg);
}

.source-detail {
  padding: 2px 0 var(--app-space-2) 26px;
}

.source-link {
  margin-bottom: var(--app-space-1);
  font-size: var(--app-fs-meta);
}

.source-link a {
  color: var(--app-color-primary);
  text-decoration: none;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
}

.match-item {
  padding: var(--app-space-2);
  border-radius: var(--app-radius-sm);
  background: var(--app-color-fill);
}

.match-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--app-space-1);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.match-rate {
  font-weight: 600;
}

.match-content {
  font-size: var(--app-fs-meta);
  line-height: 1.6;
  color: var(--app-color-text);
  word-break: break-word;
}

.match-plain {
  padding: var(--app-space-2);
  font-size: var(--app-fs-meta);
  line-height: 1.6;
  color: var(--app-color-text);
  background: var(--app-color-fill);
  border-radius: var(--app-radius-sm);
}

.report-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding-top: var(--app-space-1);
}

.foot-note {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

@media (max-width: 768px) {
  .risk-banner {
    gap: var(--app-space-2);
  }

  .source-detail {
    padding-left: var(--app-space-4);
  }
}
</style>
