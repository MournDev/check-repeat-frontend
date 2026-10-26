<template>
  <div class="paper-preview-pane">
    <header class="preview-toolbar">
      <div class="preview-heading">
        <span class="preview-label">论文原文</span>
        <span class="preview-title" :title="paper?.paperTitle">{{ paper?.paperTitle || '请选择论文' }}</span>
      </div>
      <div class="preview-actions">
        <el-select
          v-if="previewUrl"
          v-model="previewZoom"
          size="small"
          class="zoom-select"
          aria-label="预览缩放比例"
        >
          <el-option label="75%" :value="75" />
          <el-option label="100%" :value="100" />
          <el-option label="125%" :value="125" />
        </el-select>
        <el-button text size="small" :icon="FullScreen" :disabled="!previewUrl" @click="openFullscreen">
          全屏
        </el-button>
        <el-button text size="small" :icon="Refresh" :disabled="!paper" @click="load">刷新</el-button>
        <el-button text size="small" :icon="TopRight" :disabled="!previewUrl" @click="openInNewWindow">新窗口</el-button>
        <el-button text size="small" :icon="Download" :disabled="!paper" @click="handleDownload">下载原文</el-button>
      </div>
    </header>

    <div class="preview-body" v-loading="loading" element-loading-text="论文加载中…">
      <div v-if="previewUrl && !error" class="preview-frame-wrap">
        <iframe
          :key="previewKey"
          :src="previewUrl"
          class="preview-frame"
          :style="iframeScaleStyle"
          title="论文只读预览"
          @load="loading = false"
          @error="onFrameError"
        />
      </div>

      <div v-else-if="paper" class="preview-fallback">
        <el-icon class="fallback-icon"><Document /></el-icon>
        <h3>{{ paper.paperTitle || '未命名论文' }}</h3>
        <p class="fallback-meta">
          {{ paper.studentName || '未知学生' }}
          <span>·</span>
          V{{ paper.version || 1 }}
          <span v-if="paper.wordCount">· {{ paper.wordCount }} 字</span>
          <span v-if="paper.pageCount">· {{ paper.pageCount }} 页</span>
        </p>
        <p class="fallback-tip">{{ error || '该论文暂不支持在线预览，可下载原文后查看。' }}</p>
        <div class="fallback-actions">
          <el-button size="small" @click="load">重新加载</el-button>
          <el-button size="small" @click="handleDownload">下载原文</el-button>
          <el-button v-if="previewUrl" size="small" type="primary" plain @click="openInNewWindow">在新窗口打开</el-button>
        </div>
      </div>

      <div v-else class="preview-empty">
        <el-icon class="empty-icon"><Document /></el-icon>
        <p>从左侧队列选择一篇论文开始审核</p>
      </div>
    </div>

    <!-- 全屏预览：真正铺满屏幕的只读 iframe -->
    <el-dialog
      v-model="fullscreenVisible"
      fullscreen
      destroy-on-close
      class="paper-preview-fullscreen"
      :title="paper?.paperTitle || '论文预览'"
    >
      <div v-if="previewUrl" class="fullscreen-preview">
        <iframe
          :src="previewUrl"
          class="fullscreen-iframe"
          title="论文全屏预览"
        />
      </div>
      <div v-else class="preview-empty">
        <p>暂无可预览的论文地址</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Download, Refresh, TopRight, FullScreen } from '@element-plus/icons-vue'
import { getPaperContent, getPaperPreviewUrl, downloadPaper } from '@/api/teacher.js'
import { buildPreviewUrl } from '@/utils/previewUrl'
import { saveBlobAs } from '@/utils/download.js'

const props = defineProps({
  paper: { type: Object, default: null }
})

const previewUrl = ref('')
const previewKey = ref(0)
const loading = ref(false)
const error = ref('')
const content = ref(null)
const previewZoom = ref(100)
const fullscreenVisible = ref(false)

// 缩放：先放大 iframe 的逻辑尺寸，再用 transform 缩回容器，避免放大后被裁切
const iframeScaleStyle = computed(() => {
  const scale = previewZoom.value / 100
  return {
    width: `${100 / scale}%`,
    height: `${100 / scale}%`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left'
  }
})

let requestSeq = 0

const reset = () => {
  previewUrl.value = ''
  error.value = ''
  content.value = null
  loading.value = false
  previewZoom.value = 100
  fullscreenVisible.value = false
}

const load = async () => {
  const paperId = props.paper?.paperId
  const seq = ++requestSeq

  if (!paperId) {
    reset()
    return
  }

  loading.value = true
  error.value = ''
  previewUrl.value = ''

  const [contentResult, previewResult] = await Promise.allSettled([
    getPaperContent(paperId),
    getPaperPreviewUrl(paperId)
  ])

  if (seq !== requestSeq) return

  if (contentResult.status === 'fulfilled' && contentResult.value?.code === 200) {
    content.value = contentResult.value.data || null
  }

  if (previewResult.status !== 'fulfilled' || previewResult.value?.code !== 200 || !previewResult.value.data) {
    error.value = previewResult.status === 'fulfilled'
      ? (previewResult.value?.message || '该论文暂不支持在线预览')
      : '预览地址获取失败'
    loading.value = false
    return
  }

  const data = previewResult.value.data
  const rawUrl = data.previewUrl || data.url || data.onlineUrl || data.preview_url ||
    (typeof data === 'string' ? data : '')
  previewUrl.value = buildPreviewUrl(rawUrl)

  if (!previewUrl.value) {
    error.value = '该论文暂不支持在线预览'
    loading.value = false
    return
  }

  previewKey.value += 1
}

const onFrameError = () => {
  loading.value = false
  error.value = '论文预览加载失败，请检查网络或联系管理员'
}

const openInNewWindow = () => {
  if (!previewUrl.value) {
    ElMessage.warning('暂无可用的预览链接')
    return
  }
  window.open(previewUrl.value, '_blank', 'noopener')
}

const openFullscreen = () => {
  if (!previewUrl.value) {
    ElMessage.warning('暂无可用的预览链接')
    return
  }
  fullscreenVisible.value = true
}

const handleDownload = async () => {
  const paperId = props.paper?.paperId
  if (!paperId) return
  try {
    const res = await downloadPaper(paperId)
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data])
    saveBlobAs(blob, `论文_${props.paper.paperTitle || paperId}.docx`)
    ElMessage.success('论文下载成功')
  } catch (e) {
    // 响应拦截器已提示，这里只记录
    console.error('论文下载失败:', e)
  }
}

watch(() => props.paper?.paperId, () => {
  previewZoom.value = 100
  load()
}, { immediate: true })
</script>

<style scoped lang="scss">
.paper-preview-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--app-color-fill);
  font-family: var(--app-font-family);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: var(--app-space-2) var(--app-space-4);
  background: var(--app-color-card-bg);
  border-bottom: 1px solid var(--app-color-border);
  flex-shrink: 0;
}

.preview-heading {
  display: flex;
  align-items: baseline;
  gap: var(--app-space-2);
  min-width: 0;
  flex: 1;
}

.preview-label {
  flex-shrink: 0;
  padding: 1px var(--app-space-2);
  font-size: var(--app-fs-meta);
  color: var(--app-color-primary);
  background: var(--app-color-info-bg);
  border-radius: var(--app-radius-pill);
}

.preview-title {
  font-size: var(--app-fs-caption);
  font-weight: 600;
  color: var(--app-color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.zoom-select {
  width: 82px;
  margin-right: var(--app-space-1);
}

.zoom-select :deep(.el-select__wrapper) {
  min-height: 24px;
  font-size: var(--app-fs-meta);
}

.preview-body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: var(--app-space-3);
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
  background: var(--app-color-card-bg);
}

.preview-frame-wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--app-radius-md);
  background: var(--app-color-card-bg);
}

.preview-frame-wrap .preview-frame {
  display: block;
  border-radius: 0;
}

.fullscreen-preview {
  width: 100%;
  height: calc(100vh - 110px);
  background: var(--app-color-card-bg);
}

.fullscreen-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

:global(.paper-preview-fullscreen .el-dialog__body) {
  padding: 0;
}

.preview-fallback,
.preview-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-8);
  text-align: center;
  color: var(--app-color-text-muted);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
}

.fallback-icon,
.empty-icon {
  font-size: 40px;
  color: var(--app-color-text-secondary);
}

.preview-fallback h3 {
  margin: var(--app-space-3) 0 var(--app-space-1);
  max-width: 520px;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  color: var(--app-color-ink);
}

.fallback-meta {
  margin: 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.fallback-meta span {
  margin: 0 var(--app-space-1);
}

.fallback-tip {
  margin: var(--app-space-3) 0 0;
  max-width: 460px;
  font-size: var(--app-fs-caption);
  line-height: 1.5;
  color: var(--app-color-text-muted);
}

.fallback-actions {
  display: flex;
  gap: var(--app-space-2);
  margin-top: var(--app-space-4);
}

.preview-empty p {
  margin: var(--app-space-3) 0 0;
  font-size: var(--app-fs-caption);
}

@media (max-width: 768px) {
  .preview-toolbar {
    padding: var(--app-space-2) var(--app-space-3);
  }

  .preview-body {
    padding: var(--app-space-2);
  }

  .preview-fallback,
  .preview-empty {
    padding: var(--app-space-6);
  }
}
</style>
