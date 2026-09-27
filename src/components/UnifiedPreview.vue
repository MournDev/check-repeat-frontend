<template>
  <el-dialog
    v-model="visible"
    :title="previewTitle"
    :width="isFullscreen ? '100%' : '90%'"
    :fullscreen="isFullscreen"
    class="unified-preview-dialog"
    @close="handleClose"
  >
    <div class="preview-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="p" style="width: 100%; height: 600px" />
          </template>
        </el-skeleton>
        <div class="loading-text">正在加载预览内容...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <el-empty description="预览失败">
          <p>{{ errorMessage }}</p>
          <div style="margin-top: 16px;">
            <el-button type="primary" @click="loadPreview">
              <el-icon><Refresh /></el-icon>
              重新加载
            </el-button>
            <el-button @click="downloadFile">
              <el-icon><Download /></el-icon>
              下载文件
            </el-button>
          </div>
        </el-empty>
      </div>

      <!-- 图片预览 -->
      <div v-else-if="fileType === 'image' && nativeUrl" class="image-preview">
        <img :src="nativeUrl" :alt="fileName" class="preview-image" />
      </div>

      <!-- PDF预览 -->
      <div v-else-if="fileType === 'pdf' && nativeUrl" class="pdf-preview">
        <embed :src="nativeUrl" type="application/pdf" class="pdf-embed" />
      </div>

      <!-- 文本预览 -->
      <div v-else-if="fileType === 'text' && textContent" class="text-preview">
        <pre class="text-content">{{ textContent }}</pre>
      </div>

      <!-- 代码预览 -->
      <div v-else-if="fileType === 'code' && textContent" class="code-preview">
        <pre><code>{{ textContent }}</code></pre>
      </div>

      <!-- 音频预览 -->
      <div v-else-if="fileType === 'audio' && nativeUrl" class="audio-preview">
        <audio :src="nativeUrl" controls class="audio-player" />
      </div>

      <!-- 视频预览 -->
      <div v-else-if="fileType === 'video' && nativeUrl" class="video-preview">
        <video :src="nativeUrl" controls class="video-player" />
      </div>

      <!-- KKFileView预览 (Office文件) -->
      <div v-else-if="fileType === 'office' && kkfileviewUrl" class="office-preview">
        <iframe :src="kkfileviewUrl" class="office-iframe" @load="handleIframeLoad" @error="handleIframeError" />
      </div>

      <!-- 不支持预览 -->
      <div v-else-if="!loading && !error" class="download-only">
        <el-empty description="该文件类型不支持预览">
          <el-button type="primary" @click="downloadFile">
            <el-icon><Download /></el-icon>
            下载文件
          </el-button>
        </el-empty>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="nativeUrl" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏查看' }}
        </el-button>
        <el-button v-if="kkfileviewUrl" @click="openInNewWindow">
          <el-icon><Link /></el-icon>
          新窗口打开
        </el-button>
        <el-button @click="downloadFile">
          <el-icon><Download /></el-icon>
          下载文件
        </el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import { Refresh, Download, FullScreen, Link } from '@element-plus/icons-vue';
import Cookies from 'js-cookie';
import { getFileType, isNativeSupported } from '@/utils/fileType';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  paperId: {
    type: [String, Number],
    required: true
  },
  fileName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const loading = ref(false);
const error = ref(false);
const errorMessage = ref('');
const fileInfo = ref(null);
const textContent = ref('');
const isFullscreen = ref(false);

const fileType = computed(() => {
  if (fileInfo.value?.fileType) {
    return fileInfo.value.fileType;
  }
  return getFileType(props.fileName);
});

const fileName = computed(() => {
  return fileInfo.value?.fileName || props.fileName || '未知文件';
});

const previewTitle = computed(() => `预览 - ${fileName.value}`);

const nativeUrl = computed(() => {
  if (fileInfo.value?.nativePreviewUrl) {
    return fileInfo.value.nativePreviewUrl;
  }
  return null;
});

const kkfileviewUrl = computed(() => {
  return fileInfo.value?.kkfileviewPreviewUrl || null;
});

const loadPreview = async () => {
  if (!props.paperId) {
    ElMessage.warning('论文ID不存在');
    return;
  }

  loading.value = true;
  error.value = false;
  errorMessage.value = '';
  textContent.value = '';

  try {
    const token = Cookies.get('token');
    const response = await fetch(`/check/api/v1/preview/info/${props.paperId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fileInfo.value = await response.json();

    if (fileInfo.value.errorMessage) {
      error.value = true;
      errorMessage.value = fileInfo.value.errorMessage;
      return;
    }

    if (['text', 'code'].includes(fileInfo.value.fileType) && fileInfo.value.nativePreviewUrl) {
      const textResponse = await fetch(fileInfo.value.nativePreviewUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      textContent.value = await textResponse.text();
    }

  } catch (err) {
    error.value = true;
    errorMessage.value = '加载预览失败: ' + err.message;
  } finally {
    loading.value = false;
  }
};

const handleIframeLoad = () => {
  ElMessage.success('预览加载完成');
};

const handleIframeError = () => {
  error.value = true;
  errorMessage.value = '预览内容加载失败，请尝试重新加载或下载文件';
};

const downloadFile = () => {
  const token = Cookies.get('token');
  const downloadUrl = `/check/api/v1/file/download/${fileInfo.value?.fileId || props.paperId}/${encodeURIComponent(fileName.value)}`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName.value;
  link.click();
  ElMessage.info('开始下载文件');
};

const openInNewWindow = () => {
  if (kkfileviewUrl.value) {
    window.open(kkfileviewUrl.value, '_blank');
    ElMessage.info('已在新窗口打开预览');
  }
};

const handleClose = () => {
  visible.value = false;
  resetPreview();
};

const resetPreview = () => {
  fileInfo.value = null;
  textContent.value = '';
  loading.value = false;
  error.value = false;
  errorMessage.value = '';
  isFullscreen.value = false;
  document.body.style.overflow = '';
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    loadPreview();
  } else {
    resetPreview();
  }
});

watch(() => props.paperId, () => {
  if (props.modelValue) {
    loadPreview();
  }
});

onMounted(() => {
  if (props.modelValue) {
    loadPreview();
  }
});
</script>

<style scoped>
.unified-preview-dialog {
  border-radius: 12px;
  overflow: hidden;

  :deep(.el-dialog__header) {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 24px;

    .el-dialog__title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.preview-container {
  width: 100%;
  height: 70vh;
  min-height: 500px;
}

.loading-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;

  .loading-text {
    margin-top: 20px;
    color: #64748b;
    font-size: 14px;
  }
}

.error-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 48px;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.pdf-preview {
  width: 100%;
  height: 100%;
}

.pdf-embed {
  width: 100%;
  height: 600px;
  border: none;
}

.text-preview, .code-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #1e293b;
  padding: 20px;
}

.text-content, :deep(code) {
  color: #e2e8f0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.audio-preview, .video-preview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
}

.audio-player {
  width: 100%;
  max-width: 500px;
}

.video-player {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.office-preview {
  width: 100%;
  height: 100%;
}

.office-iframe {
  width: 100%;
  height: 600px;
  border: none;
}

.download-only {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;

  :deep(.el-button) {
    border-radius: 8px;
  }
}
</style>
