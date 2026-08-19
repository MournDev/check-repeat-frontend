import request from '../request'

// 获取论文列表
export const getPaperList = (params) => {
  return request({
    url: '/api/admin/papers/list',
    method: 'get',
    params: params
  })
}

// 上传论文
export const uploadPaper = (formData, config = {}) => {
  // config 可包含 headers, onUploadProgress 等 axios 配置
  return request(Object.assign({
    url: '/api/admin/papers/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  }, config))
}

// 删除论文
export const deletePaper = (paperId) => {
  return request({
    url: `/api/admin/papers/${paperId}`,
    method: 'delete'
  })
}

// 批量删除论文
export const batchDeletePapers = (paperIds) => {
  return request({
    url: '/api/admin/papers/batch-delete',
    method: 'post',
    data: paperIds
  })
}

// 校内查重
export const internalCheck = (paperId) => {
  return request({
    url: `/api/admin/papers/${paperId}/internal-check`,
    method: 'post'
  })
}

// 第三方查重
export const thirdPartyCheck = (paperId) => {
  return request({
    url: `/api/admin/papers/${paperId}/third-party-check`,
    method: 'post'
  })
}

// 批量校内查重
export const batchInternalCheck = (paperIds) => {
  return request({
    url: '/api/admin/papers/batch-internal-check',
    method: 'post',
    data: paperIds
  })
}

// 批量第三方查重
export const batchThirdPartyCheck = (paperIds) => {
  return request({
    url: '/api/admin/papers/batch-third-party-check',
    method: 'post',
    data: paperIds
  })
}

// 获取论文库统计
export const getPaperStats = () => {
  return request({
    url: '/api/admin/papers/stats',
    method: 'get'
  })
}

// 导出论文数据
export const exportPapers = (params) => {
  return request({
    url: '/api/admin/papers/export',
    method: 'get',
    params: params,
    responseType: 'blob'
  })
}

// 单篇论文下载（返回 blob）
export const downloadPaper = (paperId) => {
  return request({
    url: `/api/admin/papers/${paperId}/download`,
    method: 'get',
    responseType: 'blob'
  })
}