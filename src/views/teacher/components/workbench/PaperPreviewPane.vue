<template>
  <div class="paper-preview-pane">
    <header class="preview-toolbar">
      <div class="preview-heading">
        <span class="preview-label">论文原文</span>
        <span class="preview-title" :title="paper?.paperTitle">{{ paper?.paperTitle || '请选择论文' }}</span>
      </div>
      <div class="preview-actions">
        <el-button text size="small" :icon="Refresh" :disabled="!paper" @click="load">刷新</el-button>
        <el-button text size="small" :icon="TopRight" :disabled="!previewUrl" @click="openInNewWindow">新窗口</el-button>
        <el-button text size="small" :icon="Download" :disabled="!paper" @click="handleDownload">下载原文</el-button>
      </div>
    </header>

    <div class="preview-body" v-loading="loading" element-loading-text="论文加载中…">
      <iframe
        v-if="previewUrl && !error"
        :key="previewKey"
        :src="previewUrl"
        class="preview-frame"
        title="论文只读预览"
        @load="loading = false"
        @error="onFrameError"
      />

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
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Download, Refresh, TopRight } from '@element-plus/icons-vue'
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

let requestSeq = 0

const reset = () => {
  previewUrl.value = ''
  error.value = ''
  content.value = null
  loading.value = false
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

watch(() => props.paper?.paperId, load, { immediate: true })
</script>

<style scoped>
.paper-preview-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--apple-canvas-parchment);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--apple-canvas);
  border-bottom: 1px solid var(--apple-hairline);
  flex-shrink: 0;
}

.preview-heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.preview-label {
  flex-shrink: 0;
  padding: 1px 8px;
  font-size: 0.6875rem;
  color: var(--apple-primary);
  background: var(--apple-info-bg);
  border-radius: var(--apple-rounded-pill);
}

.preview-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--apple-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.preview-body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 12px;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-md);
  background: var(--apple-canvas);
}

.preview-fallback,
.preview-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  color: var(--apple-ink-muted-48);
  background: var(--apple-canvas);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-md);
}

.fallback-icon,
.empty-icon {
  font-size: 40px;
  color: var(--apple-slate-faint);
}

.preview-fallback h3 {
  margin: 14px 0 6px;
  max-width: 520px;
  font-size: 1rem;
  color: var(--apple-ink);
}

.fallback-meta {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.fallback-meta span {
  margin: 0 4px;
}

.fallback-tip {
  margin: 14px 0 0;
  max-width: 460px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--apple-ink-muted-48);
}

.fallback-actions {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}

.preview-empty p {
  margin: 12px 0 0;
  font-size: 0.875rem;
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.paper-preview-pane {
  font-family: var(--apple-font-text);
}

.preview-toolbar {
  gap: var(--apple-spacing-sm);
  padding: var(--apple-spacing-xs) var(--apple-spacing-md);
}

.preview-heading {
  gap: var(--apple-spacing-xs);
}

.preview-label {
  padding: 1px var(--apple-spacing-xs);
  font-size: var(--apple-fs-fine-print);
}

.preview-title {
  font-size: var(--apple-fs-caption);
}

.preview-body {
  padding: var(--apple-spacing-sm);
}

.preview-frame {
  border-radius: var(--apple-rounded-md);
}

.preview-fallback,
.preview-empty {
  padding: var(--apple-spacing-xl);
  border-radius: var(--apple-rounded-md);
}

.fallback-icon,
.empty-icon {
  font-size: 40px;
  color: var(--apple-slate-faint);
}

.preview-fallback h3 {
  margin: var(--apple-spacing-sm) 0 var(--apple-spacing-xxs);
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-body-strong);
}

.fallback-meta {
  font-size: var(--apple-fs-caption);
}

.fallback-meta span {
  margin: 0 var(--apple-spacing-xxs);
}

.fallback-tip {
  margin: var(--apple-spacing-sm) 0 0;
  font-size: var(--apple-fs-caption);
  line-height: 1.5;
}

.fallback-actions {
  gap: var(--apple-spacing-xs);
  margin-top: var(--apple-spacing-md);
}

.preview-empty p {
  margin: var(--apple-spacing-sm) 0 0;
  font-size: var(--apple-fs-caption);
}

@media (max-width: 768px) {
  .preview-toolbar {
    padding: var(--apple-spacing-xs) var(--apple-spacing-sm);
  }

  .preview-body {
    padding: var(--apple-spacing-xs);
  }

  .preview-fallback,
  .preview-empty {
    padding: var(--apple-spacing-lg);
  }
}
</style>
