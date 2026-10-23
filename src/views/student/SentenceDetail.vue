<template>
  <div class="sentence-detail-page">
    <!-- 页面头部 -->
    <PageHeader>
      <template #actions>
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <el-button :icon="Refresh" @click="loadDetail">刷新</el-button>
      </template>
    </PageHeader>

    <!-- 错误态（403 等）：按后端 message 提示 -->
    <el-result
      v-if="loadError"
      icon="error"
      :title="loadError"
      class="error-result"
    >
      <template #extra>
        <el-button type="primary" @click="goBack">返回上一页</el-button>
      </template>
    </el-result>

    <template v-else>
      <!-- 顶部指标卡 -->
      <el-card class="console-card metrics-card" shadow="never" v-loading="loading">
        <div class="metrics-grid">
          <div class="metric-block metric-main">
            <div class="metric-label">总相似比</div>
            <div class="metric-value primary">{{ formatPercent(detail.checkRate) }}</div>
          </div>
          <div class="metric-block">
            <div class="metric-label">单篇最大</div>
            <div class="metric-value">{{ formatPercent(detail.maxPerSource) }}</div>
          </div>
          <div class="metric-block">
            <div class="metric-label">引用率</div>
            <div class="metric-value">{{ formatPercent(detail.citationRate) }}</div>
          </div>
          <div class="metric-block">
            <div class="metric-label">命中句数</div>
            <div class="metric-value">{{ detail.hitCount ?? '—' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 来源列表：点击过滤下方句列表，再点取消 -->
      <el-card v-if="sources.length > 0" class="console-card sources-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>命中来源（{{ sources.length }}）</span>
            <el-button
              v-if="activeSourceId"
              text
              type="primary"
              size="small"
              @click="clearSourceFilter"
            >
              取消过滤
            </el-button>
          </div>
        </template>
        <div
          v-for="source in sources"
          :key="source.hitPaperId"
          class="source-item"
          :class="{ active: String(activeSourceId) === String(source.hitPaperId) }"
          @click="toggleSourceFilter(source)"
        >
          <div class="source-info">
            <div class="source-title" :title="source.hitPaperTitle">
              {{ source.hitPaperTitle || '未知来源' }}
            </div>
            <div class="source-meta">
              命中 {{ source.sentenceCount }} 句<template v-if="source.citationSentenceCount">（含引用 {{ source.citationSentenceCount }} 句）</template>
              · 平均相似度 {{ formatPercent(source.avgSimilarity) }}
            </div>
          </div>
          <div class="source-share">
            <el-progress
              :percentage="normalizeShare(source.sharePercent)"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="share-text">{{ formatPercent(source.sharePercent) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 句级明细 -->
      <el-card class="console-card items-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>句级明细<template v-if="activeSourceId">（已按来源过滤）</template></span>
            <span v-if="items.length > 0" class="item-count">共 {{ filteredItems.length }} 句</span>
          </div>
        </template>

        <!-- 存量任务空态：正常情况，不是报错 -->
        <el-empty
          v-if="!loading && items.length === 0"
          description="该任务为历史数据，未生成句级明细，仅提供总相似比"
        />
        <el-empty
          v-else-if="!loading && filteredItems.length === 0"
          description="该来源下无命中句"
        />
        <div v-else class="sentence-list" v-loading="loading">
          <div
            v-for="item in filteredItems"
            :key="item.sentenceIndex"
            class="sentence-item"
          >
            <div class="sentence-head">
              <span class="sentence-index">#{{ item.sentenceIndex + 1 }}</span>
              <el-tag
                v-if="item.isCitation === 1"
                type="primary"
                size="small"
                effect="plain"
                class="citation-tag"
              >
                引用
              </el-tag>
              <el-tag
                v-else
                size="small"
                effect="light"
                :class="similarityTagClass(item.similarity)"
              >
                {{ formatPercent(item.similarity) }}
              </el-tag>
            </div>
            <div class="sentence-text">{{ item.sentenceText }}</div>
            <div class="sentence-source">命中来源：{{ item.hitPaperTitle || '未知来源' }}</div>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { getSentenceDetail } from '@/api/p5'
import PageHeader from '@/components/common/PageHeader.vue'
import { formatPercent } from '@/utils/dataType.js'

const route = useRoute()
const router = useRouter()

// 路由参数 taskId（雪花 ID，按字符串处理）
const taskId = route.params.taskId

const loading = ref(false)
const loadError = ref('')
const detail = ref({})
const sources = ref([])
const items = ref([])
// 当前过滤的来源 ID（null = 不过滤）；字符串比较防精度问题
const activeSourceId = ref(null)

// null（存量任务）显示「—」，不按 0 处理
const normalizeShare = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.min(100, Math.max(0, num))
}

const filteredItems = computed(() => {
  if (!activeSourceId.value) return items.value
  return items.value.filter(
    (item) => String(item.hitPaperId) === String(activeSourceId.value)
  )
})

// 普通命中按 similarity 分档：≥80 深红 / 其余（50-80）浅红
const similarityTagClass = (similarity) => {
  const value = Number(similarity) || 0
  return value >= 80 ? 'sim-tag-high' : 'sim-tag-mid'
}

const toggleSourceFilter = (source) => {
  activeSourceId.value =
    String(activeSourceId.value) === String(source.hitPaperId) ? null : source.hitPaperId
}

const clearSourceFilter = () => {
  activeSourceId.value = null
}

const goBack = () => {
  router.back()
}

const loadDetail = async () => {
  if (!taskId || taskId === 'undefined') {
    loadError.value = '缺少任务ID参数'
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const res = await getSentenceDetail(taskId)
    if (res.code === 200) {
      detail.value = res.data || {}
      sources.value = res.data?.sources || []
      items.value = res.data?.items || []
    } else {
      loadError.value = res.message || '获取句级检测明细失败'
    }
  } catch (error) {
    // 403 等 HTTP 错误：按后端 message 提示（拦截器已 toast，这里渲染错误态）
    loadError.value = error?.response?.data?.message || error?.message || '获取句级检测明细失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style lang="scss" scoped>
.sentence-detail-page {

  .error-result {
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);
  }

  .metrics-card {
    margin-bottom: var(--app-space-6);
    border-radius: var(--app-radius-lg);

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--app-space-6);

      .metric-block {
        .metric-label {
          font-size: var(--app-fs-meta);
          color: var(--app-color-text-muted);
          margin-bottom: var(--app-space-2);
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
        }

        .metric-value {
          font-family: var(--app-font-family);
          font-size: var(--app-fs-title);
          font-weight: 600;
          color: var(--app-color-ink);

          &.primary {
            font-size: var(--app-fs-display);
            line-height: var(--app-lh-display);
            color: var(--app-color-primary);
          }
        }
      }
    }
  }

  .sources-card {
    margin-bottom: var(--app-space-6);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--app-font-family);
      font-size: var(--app-fs-body);
      font-weight: 600;
      color: var(--app-color-ink);
    }

    .source-item {
      display: flex;
      align-items: center;
      gap: var(--app-space-4);
      padding: var(--app-space-3) var(--app-space-4);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      margin-bottom: var(--app-space-3);
      cursor: pointer;
      transition: all var(--app-transition-normal);

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: var(--app-color-primary);
      }

      &.active {
        border-color: var(--app-color-primary);
        background: rgba(0, 102, 204, 0.04);
      }

      .source-info {
        flex: 1;
        min-width: 0;

        .source-title {
          font-weight: 600;
          color: var(--app-color-ink);
          font-size: var(--app-fs-caption);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .source-meta {
          font-size: var(--app-fs-meta);
          color: var(--app-color-text-muted);
          margin-top: var(--app-space-1);
        }
      }

      .source-share {
        display: flex;
        align-items: center;
        gap: var(--app-space-3);
        width: 220px;
        flex-shrink: 0;

        .el-progress {
          flex: 1;
        }

        .share-text {
          font-size: var(--app-fs-caption);
          font-weight: 600;
          color: var(--app-color-ink);
          min-width: 48px;
          text-align: right;
        }
      }
    }
  }

  .items-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--app-font-family);
      font-size: var(--app-fs-body);
      font-weight: 600;
      color: var(--app-color-ink);

      .item-count {
        font-size: var(--app-fs-meta);
        color: var(--app-color-text-muted);
        font-weight: 400;
      }
    }

    .sentence-list {
      .sentence-item {
        padding: var(--app-space-3) var(--app-space-4);
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-md);
        margin-bottom: var(--app-space-3);

        &:last-child {
          margin-bottom: 0;
        }

        .sentence-head {
          display: flex;
          align-items: center;
          gap: var(--app-space-2);
          margin-bottom: var(--app-space-2);

          .sentence-index {
            font-size: var(--app-fs-meta);
            font-weight: 600;
            color: var(--app-color-text-muted);
          }

          // 普通命中分档：≥80 深红 / 50-80 浅红
          :deep(.sim-tag-high) {
            background: var(--app-color-danger);
            border-color: var(--app-color-danger);
            color: var(--app-color-on-primary);
          }

          :deep(.sim-tag-mid) {
            background: var(--app-color-danger-bg);
            border-color: var(--app-color-danger-bg);
            color: var(--app-color-danger);
          }
        }

        .sentence-text {
          color: var(--app-color-ink);
          font-size: var(--app-fs-caption);
          line-height: 1.6;
          word-break: break-word;
        }

        .sentence-source {
          margin-top: var(--app-space-2);
          font-size: var(--app-fs-meta);
          color: var(--app-color-text-muted);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .sentence-detail-page {
    padding: var(--app-space-3);

    .sources-card {
      .source-item {
        flex-direction: column;
        align-items: stretch;
        gap: var(--app-space-3);

        .source-share {
          width: 100%;
        }
      }
    }
  }
}
</style>
