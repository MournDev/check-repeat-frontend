import service from '@/api/request'

// 经登录态请求文件流再转 blob URL。
// 背景：/api/file/** 被 SecurityConfig 收紧为 authenticated，而 iframe/window.open
// 打开接口地址时浏览器不会携带 Authorization 头，必然 401。
// 正确姿势：先用 axios（带 JWT）取回 blob，再交给 iframe 展示或触发下载，
// 权限校验全程走登录态，URL 上不暴露任何令牌。

async function fetchBlobUrl(url, params) {
  const response = await service({ url, method: 'get', params, responseType: 'blob' })
  const blob = response.data
  // 后端把业务错误（文件不存在等）按 JSON 返回，识别出来转成可读异常
  if (blob instanceof Blob && blob.type.includes('application/json')) {
    const message = await blob.text().then((t) => {
      try { return JSON.parse(t)?.message } catch { return null }
    })
    throw new Error(message || '文件加载失败')
  }
  return URL.createObjectURL(blob)
}

// 论文文件智能预览（pdf 直出，office 走 kkFileView）
export const getSmartPreviewBlobUrl = (fileId) => fetchBlobUrl('/api/file/smartPreview', { fileId })

// 查重报告预览
export const getSmartPreviewReportBlobUrl = (paperId) => fetchBlobUrl('/api/file/smartPreviewReport', { paperId })

// blob 方式触发浏览器下载（带 JWT；href+download 属性方式同样会 401，统一走这里）
export async function downloadFileBlob(url, fileName) {
  const response = await service({ url, method: 'get', responseType: 'blob' })
  const blobUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName || '文件'
  link.click()
  URL.revokeObjectURL(blobUrl)
}

// 释放不再使用的预览 blob，避免长时间使用后内存堆积
export function revokeBlobUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
