import request from '../request'

// 获取系统配置
export const getSystemConfig = () => {
  return request({
    url: '/api/admin/config/system',
    method: 'get'
  })
}

// 更新基础配置
export const updateBasicConfig = (data) => {
  return request({
    url: '/api/admin/config/basic',
    method: 'put',
    data: data
  })
}

// 更新查重配置
export const updatePlagiarismConfig = (data) => {
  return request({
    url: '/api/admin/config/plagiarism',
    method: 'put',
    data: data
  })
}

// 更新安全配置
export const updateSecurityConfig = (data) => {
  return request({
    url: '/api/admin/config/security',
    method: 'put',
    data: data
  })
}

// 更新邮件配置
export const updateEmailConfig = (data) => {
  return request({
    url: '/api/admin/config/email',
    method: 'put',
    data: data
  })
}

// 更新性能配置
export const updatePerformanceConfig = (data) => {
  return request({
    url: '/api/admin/config/performance',
    method: 'put',
    data: data
  })
}

// 保存所有配置
export const saveAllConfig = (configData) => {
  return request({
    url: '/api/admin/config/save-all',
    method: 'post',
    data: configData
  })
}

// 测试邮件配置
export const testEmailConfig = (testEmail) => {
  return request({
    url: '/api/admin/config/test-email',
    method: 'post',
    data: { testEmail: testEmail }
  })
}

// 导出配置
export const exportConfig = () => {
  return request({
    url: '/api/admin/system/config/export',
    method: 'get',
    responseType: 'blob'
  })
}

// 恢复默认配置
export const resetDefaultConfig = () => {
  return request({
    url: '/api/admin/config/reset-default',
    method: 'post'
  })
}

// 获取时间节点配置
export const getDeadlinesConfig = () => {
  return request({
    url: '/api/admin/config/deadlines',
    method: 'get'
  })
}

// 更新时间节点配置
export const updateDeadlinesConfig = (data) => {
  return request({
    url: '/api/admin/config/deadlines',
    method: 'put',
    data: data
  })
}