<template>
  <!-- 论文预览对话框（外壳样式在全局 global-styles.scss） -->
  <el-dialog
    v-model="preview.previewVisible.value"
    title="论文预览"
    :width="preview.isFullscreen.value ? undefined : '90%'"
    :class="['preview-dialog', { 'fullscreen': preview.isFullscreen.value }]"
    :fullscreen="preview.isFullscreen.value"
    append-to-body
    @close="preview.close"
  >
    <div class="preview-container">
      <div v-if="preview.previewLoading.value" class="loading-placeholder">
        <div class="skeleton-full">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="p" />
            </template>
          </el-skeleton>
        </div>
      </div>

      <iframe
        v-show="!preview.previewLoading.value && !preview.previewError.value && preview.previewUrl.value"
        :src="preview.previewUrl.value"
        class="preview-frame"
        @load="preview.handleLoad"
        @error="preview.handleError"
        frameborder="0"
      ></iframe>

      <div v-if="(preview.previewError.value || !preview.previewUrl.value) && !preview.previewLoading.value" class="error-placeholder">
        <el-icon :size="60"><Warning /></el-icon>
        <p v-if="preview.currentPaper.value && preview.currentPaper.value.title">
          论文：{{ preview.currentPaper.value.title }}
        </p>
        <p>{{ preview.previewError.value ? '论文预览加载失败' : '暂无预览URL' }}</p>
        <div v-if="preview.currentPaper.value">
          <p>论文信息：</p>
          <ul>
            <li v-if="preview.currentPaper.value.abstract">摘要：{{ preview.currentPaper.value.abstract }}</li>
            <li v-if="preview.currentPaper.value.wordCount">字数：{{ preview.currentPaper.value.wordCount }}</li>
            <li v-if="preview.currentPaper.value.pageCount">页数：{{ preview.currentPaper.value.pageCount }}</li>
          </ul>
        </div>
        <!-- 备用操作 -->
        <div class="fallback-panel">
          <p class="fallback-title">
            <el-icon><Warning /></el-icon>
            <strong>备用方案</strong>
          </p>
          <div class="fallback-actions">
            <el-button type="warning" size="small" @click="preview.openInNewWindow">
              在新窗口打开预览
            </el-button>
            <el-button type="info" size="small" @click="preview.copyUrl">
              复制预览链接
            </el-button>
          </div>
        </div>
        <el-button v-if="preview.currentPaper.value" type="primary" @click="preview.retry(preview.currentPaper.value)">
          重新加载
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button aria-label="切换全屏显示" @click="preview.toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
          {{ preview.isFullscreen.value ? '退出全屏' : '全屏查看' }}
        </el-button>
        <el-button @click="preview.close">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { usePaperPreview } from '@/composables/usePaperPreview.js'
import { Warning, FullScreen } from '@element-plus/icons-vue'

const preview = usePaperPreview()

defineExpose({
  /** 打开论文预览弹窗（内部处理加载/降级/重试） */
  open: preview.open
})
</script>

<style scoped>
/* ── 弹窗内容（弹窗外壳样式在全局 global-styles.scss）── */
.preview-container {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 500px;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-placeholder {
  width: 100%;
  height: 100%;
  padding: 24px;
  background: var(--apple-canvas-parchment);
}

.skeleton-full {
  width: 100%;
  height: 100%;

  :deep(.el-skeleton__item) {
    height: 100%;
  }
}

.error-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  color: var(--apple-ink-muted-48);
  background: var(--apple-canvas-parchment);
  padding: 48px;
  overflow: auto;

  .el-icon {
    font-size: 48px;
    color: var(--apple-info);
  }

  p {
    margin: 0;
    line-height: 1.5;
    font-size: 0.875rem;
  }

  ul {
    text-align: left;
    margin: 12px 0;
    padding-left: 24px;
  }

  li {
    margin-bottom: 8px;
    font-size: 0.8125rem;
  }
}

.fallback-panel {
  margin-top: 4px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--apple-warning) 8%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--apple-warning) 35%, #ffffff);
  border-radius: var(--apple-rounded-md);

  .fallback-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 10px;
    color: var(--apple-ink);
  }

  .fallback-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .preview-container {
    height: 60vh;
    min-height: 400px;
  }
}
</style>
