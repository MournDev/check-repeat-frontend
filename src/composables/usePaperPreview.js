import { ref, onUnmounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { getPaperContent, getPaperPreviewUrl } from '@/api/teacher.js'

/**
 * 论文在线预览：加载 / URL 改写 / 超时提示 / 重试 / 复制链接 / 全屏
 */
export function usePaperPreview() {
  const previewVisible = ref(false)
  const previewUrl = ref('')
  const previewLoading = ref(false)
  const previewError = ref(false)
  const currentPaper = ref(null)
  const isFullscreen = ref(false)

  let loadingInstance = null
  let timeoutTimer = null

  const buildPreviewUrl = (rawUrl) => {
    if (!rawUrl) return ''
    if (rawUrl.includes('onlinePreview')) return rawUrl
    try {
      if (rawUrl.includes('url=')) {
        const urlParam = new URLSearchParams(rawUrl.split('?')[1]).get('url')
        if (urlParam) {
          const decodedUrl = decodeURIComponent(atob(urlParam))
          const previewBase = import.meta.env.VITE_KKFILEVIEW_BASE_URL || ''
          return `${previewBase}/onlinePreview?url=${btoa(decodedUrl)}`
        }
      }
    } catch (e) {
      console.warn('URL处理失败:', e)
    }
    return rawUrl
  }

  const notifyPreviewFallback = () => {
    ElMessage.info('在线预览暂不可用，已展示论文基本信息')
  }

  const getPaperId = (paper) => paper.paperId || paper.id || paper.paperBaseInfo?.paperId

  const open = async (paper) => {
    try {
      // 重置所有状态
      previewLoading.value = true
      previewError.value = false
      previewUrl.value = ''
      currentPaper.value = null

      loadingInstance = ElLoading.service({
        lock: true,
        text: '正在加载论文信息...',
        background: 'rgba(0,0,0,0.4)'
      })

      const paperId = getPaperId(paper)

      if (!paperId) {
        ElMessage.error('论文ID不存在')
        previewLoading.value = false
        return
      }

      // 并行获取论文内容和预览URL
      const [contentRes, previewRes] = await Promise.all([
        getPaperContent(paperId),
        getPaperPreviewUrl(paperId)
      ])

      // 处理论文内容
      if (contentRes.code === 200 && contentRes.data) {
        currentPaper.value = contentRes.data
      } else {
        console.warn('获取论文内容失败:', contentRes.message)
      }

      // 处理预览URL
      if (previewRes.code === 200 && previewRes.data) {
        // 检查多种可能的数据结构
        const rawUrl = previewRes.data.previewUrl ||
                      previewRes.data.url ||
                      previewRes.data.onlineUrl ||
                      previewRes.data.preview_url ||
                      (typeof previewRes.data === 'string' ? previewRes.data : null)

        // 检查是否为null值
        if (rawUrl === null || rawUrl === undefined) {
          console.error('后端返回的URL为null:', previewRes.data)
          ElMessage.error({
            message: '后端服务未返回有效的预览URL，请联系管理员检查文件存储和KKFileView服务配置',
            duration: 8000,
            showClose: true
          })

          previewLoading.value = false
          previewError.value = true

          // 显示论文基本信息作为降级方案
          if (currentPaper.value) {
            previewVisible.value = true
            previewLoading.value = false
            previewError.value = false
            notifyPreviewFallback()
          }
          return
        }

        previewUrl.value = buildPreviewUrl(rawUrl)

        if (previewUrl.value) {
          previewVisible.value = true
          previewLoading.value = true
          previewError.value = false

          // 延长超时时间
          clearTimeout(timeoutTimer)
          timeoutTimer = setTimeout(() => {
            if (previewLoading.value) {
              console.warn('预览加载超时')
              ElMessage.warning({
                message: '预览加载较慢，可能需要更多时间\n如果持续无法加载，请联系管理员',
                duration: 8000,
                showClose: true
              })
            }
          }, 10000)
        } else {
          previewLoading.value = false
          previewError.value = true
          ElMessage.warning('预览URL为空')
        }
      } else {
        previewLoading.value = false
        previewError.value = true
        ElMessage.info(previewRes.message || '该论文暂不支持在线预览')

        // 即使预览失败，如果有内容也显示内容
        if (currentPaper.value) {
          previewVisible.value = true
          previewLoading.value = false
          previewError.value = false
          notifyPreviewFallback()
        }
      }
    } catch (error) {
      console.error('获取论文信息失败:', error)
      previewLoading.value = false
      previewError.value = true
      ElMessage.error('获取论文信息失败: ' + error.message)
    } finally {
      setTimeout(() => {
        loadingInstance?.close()
        loadingInstance = null
      }, 500)
    }
  }

  const close = () => {
    previewVisible.value = false
    previewUrl.value = ''
    previewLoading.value = false
    previewError.value = false
    currentPaper.value = null
    // 重置全屏状态
    isFullscreen.value = false
    document.body.style.overflow = ''
  }

  const handleLoad = () => {
    previewLoading.value = false
  }

  const handleError = (event) => {
    console.error('iframe加载错误:', event)
    previewLoading.value = false
    previewError.value = true

    // 显示详细错误信息
    ElMessage.error({
      message: `论文预览加载失败\nURL: ${previewUrl.value}\n请检查网络连接或联系管理员`,
      duration: 5000,
      showClose: true
    })
  }

  // 重试预览
  const retry = async (paper) => {
    previewError.value = false
    previewLoading.value = true
    previewUrl.value = ''

    try {
      const paperId = getPaperId(paper)
      const res = await getPaperPreviewUrl(paperId)

      if (res.code === 200 && res.data) {
        const rawUrl = res.data.previewUrl || res.data.url
        previewUrl.value = buildPreviewUrl(rawUrl)

        if (previewUrl.value) {
          previewError.value = false
          previewLoading.value = true
        } else {
          previewError.value = true
          ElMessage.warning('预览URL为空')
        }
      } else {
        previewError.value = true
        ElMessage.error(res.message || '获取预览URL失败')
      }
    } catch (error) {
      console.error('重试预览失败:', error)
      previewError.value = true
      ElMessage.error('重试预览失败: ' + error.message)
    }
  }

  // 在新窗口打开预览
  const openInNewWindow = () => {
    if (previewUrl.value) {
      window.open(previewUrl.value, '_blank')
      ElMessage.info('已在新窗口打开预览')
    } else {
      ElMessage.warning('暂无可用的预览链接')
    }
  }

  // 复制预览链接
  const copyUrl = async () => {
    if (previewUrl.value) {
      try {
        await navigator.clipboard.writeText(previewUrl.value)
        ElMessage.success('预览链接已复制到剪贴板')
      } catch (err) {
        console.error('复制失败:', err)
        ElMessage.error('复制失败，请手动复制链接')
      }
    } else {
      ElMessage.warning('暂无可用的预览链接')
    }
  }

  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value

    // 强制重新计算布局
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
  }

  onUnmounted(() => {
    clearTimeout(timeoutTimer)
    if (isFullscreen.value) {
      document.body.style.overflow = ''
    }
  })

  return {
    previewVisible,
    previewUrl,
    previewLoading,
    previewError,
    currentPaper,
    isFullscreen,
    open,
    close,
    handleLoad,
    handleError,
    retry,
    openInNewWindow,
    copyUrl,
    toggleFullscreen
  }
}
