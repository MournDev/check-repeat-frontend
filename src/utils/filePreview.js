import service from '@/api/request'

// 经登录态请求文件流再转 blob URL。
// 背景：/api/file/** 被 SecurityConfig 收紧为 authenticated，而 iframe/window.open
// 打开接口地址时浏览器不会携带 Authorization 头，必然 401。
// 正确姿势：先用 axios（带 JWT）取回 blob，再交给 iframe 展示或触发下载，
// 权限校验全程走登录态，URL 上不暴露任何令牌。
//
// ⚠️ 只适用于「后端直接吐文件字节」的地址（PDF、图片、文本）。
// 绝不能拿它去取 kkFileView 的预览页：那是一整张 HTML 文档，包成 blob 后
// 文档基址变成 blob:...，页内 js/css/图片的相对路径全部 404（整页破图）。
// office 文档的预览走 getPreviewUrl，由 iframe 直接加载后端返回的真实地址。

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

// 论文文件预览地址（office 走 kkFileView 预览页，其余由后端直出）。
// 后端返回 {mode, url}，这里只取地址，由 iframe 直接加载真实地址渲染，
// 不再经过 blob —— 否则 kkFileView 的预览页会因基址错位而整页破图。
export async function getPreviewUrl(fileId) {
  const res = await service({ url: `/api/file/preview-url/${fileId}`, method: 'get' })
  return res.data.url
}

// 查重报告预览：报告统一由后端生成为 PDF，直出字节，沿用 blob 方式
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
