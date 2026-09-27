<template>
  <el-dialog
    v-model="dialogVisible"
    :title="previewTitle"
    :width="isFullscreen ? '100%' : '90%'"
    :fullscreen="isFullscreen"
    class="paper-preview-dialog"
    @close="handleClose"
  >
    <div class="preview-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-placeholder">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="p" style="width: 100%; height: 800px" />
          </template>
        </el-skeleton>
        <div class="loading-text">正在加载预览内容...</div>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-placeholder">
        <el-empty description="预览加载失败">
          <p class="error-detail">{{ errorMessage }}</p>
          <div style="margin-top: 16px;">
            <el-button type="primary" @click="retryPreview">
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
      
      <!-- 预览内容 -->
      <iframe
        v-else-if="previewUrl"
        :src="previewUrl"
        class="preview-iframe"
        @load="handleIframeLoad"
        @error="handleIframeError"
      ></iframe>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="downloadFile">
          <el-icon><Download /></el-icon>
          下载原文
        </el-button>
        <el-button @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏查看' }}
        </el-button>
        <el-button v-if="previewUrl" @click="openInNewWindow">
          <el-icon><Link /></el-icon>
          新窗口打开
        </el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { Refresh, Download, FullScreen, Link } from '@element-plus/icons-vue'
import Cookies from 'js-cookie'
import { downloadPaper } from '@/utils/download.js'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  fileId: {
    type: [String, Number],
    required: true
  },
  fileName: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
const previewUrl = ref('')
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const isFullscreen = ref(false)

// 计算属性
const previewTitle = computed(() => {
  return props.fileName ? `预览 - ${props.fileName}` : '文件预览'
})

// 方法
const loadPreview = async () => {
  if (!props.fileId) {
    ElMessage.warning('文件ID不存在')
    return
  }

  loading.value = true
  error.value = false
  errorMessage.value = ''
  previewUrl.value = ''

  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在加载预览内容...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {

    // 获取JWT令牌（优先从Cookie获取，其次从localStorage获取）
    const token = Cookies.get('token')
    
    // 调用预览接口获取临时token
    const response = await fetch(`/check/api/v1/preview/info/${props.fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()

    if (data.code === 200) {
      const result = data.data
      
      // 根据后端返回的类型选择预览URL
      if (result.nativeSupported && result.nativePreviewUrl) {
        // 原生预览（浏览器直接支持的文件类型）
        previewUrl.value = result.nativePreviewUrl
      } else if (result.kkfileviewPreviewUrl) {
        // KKFileView预览（需要转换的文件，如Office文档）
        // 去除后端返回的URL中可能包含的多余反引号
        previewUrl.value = result.kkfileviewPreviewUrl.replace(/`/g, '').trim()
      } else if (result.previewToken) {
        // 本地存储文件的预览（需要临时token验证）
        const encodedFileName = encodeURIComponent(props.fileName || 'document')
        previewUrl.value = `/check/api/v1/file/preview/${result.previewToken}/${encodedFileName}`
      } else {
        error.value = true
        errorMessage.value = '未获取到有效的预览URL'
      }
    } else {
      error.value = true
      errorMessage.value = data.message || '获取预览信息失败'
    }
  } catch (err) {
    error.value = true
    errorMessage.value = '获取预览信息失败: ' + err.message
  } finally {
    loadingInstance.close()
    loading.value = false
  }
}

const handleIframeLoad = () => {
  ElMessage.success('预览加载完成')
}

const handleIframeError = () => {
  error.value = true
  errorMessage.value = '预览内容加载失败，请尝试重新加载或下载文件'
}

const retryPreview = () => {
  loadPreview()
}

const downloadFile = () => {
  downloadPaper(props.fileId, props.fileName)
}

const openInNewWindow = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
    ElMessage.info('已在新窗口打开预览')
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetPreview()
}

const resetPreview = () => {
  previewUrl.value = ''
  loading.value = false
  error.value = false
  errorMessage.value = ''
  isFullscreen.value = false
  document.body.style.overflow = ''
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// 监听属性变化
watch(() => props.modelValue, (visible) => {
  if (visible) {
    loadPreview()
  } else {
    resetPreview()
  }
})

watch(() => props.fileId, () => {
  if (props.modelValue) {
    loadPreview()
  }
})

// 生命周期
onMounted(() => {
  if (props.modelValue) {
    loadPreview()
  }
})
</script>

<style scoped>
.paper-preview-dialog {
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
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 500px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
}

.loading-placeholder {
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

.error-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 48px;
  
  .error-detail {
    color: #64748b;
    margin: 16px 0;
    text-align: center;
  }
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
