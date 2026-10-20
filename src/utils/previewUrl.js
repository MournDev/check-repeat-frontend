/**
 * 论文预览 URL 改写：统一处理后端返回的 kkFileView / 加密 url 参数。
 * 供论文预览弹窗与审核工作台共用，避免两处逻辑漂移。
 */
export const buildPreviewUrl = (rawUrl) => {
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
