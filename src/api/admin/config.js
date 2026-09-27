import request from '../request'

// 获取系统配置
export const getSystemConfig = () => {
  return request({
    url: '/api/v1/admin/config/system',
    method: 'get'
  })
}

// 更新基础配置
export const updateBasicConfig = (data) => {
  return request({
    url: '/api/v1/admin/config/basic',
    method: 'put',
    data: data
  })
}

// 更新查重配置
export const updatePlagiarismConfig = (data) => {
  return request({
    url: '/api/v1/admin/config/plagiarism',
    method: 'put',
    data: data
  })
}

// 更新安全配置
export const updateSecurityConfig = (data) => {
  return request({
    url: '/api/v1/admin/config/security',
    method: 'put',
    data: data
  })
}

// 更新邮件配置
export const updateEmailConfig = (data) => {
  return request({
    url: '/api/v1/admin/config/email',
    method: 'put',
    data: data
  })
}

// 更新性能配置
export const updatePerformanceConfig = (data) => {
  return request({
    url: '/api/v1/admin/config/performance',
    method: 'put',
    data: data
  })
}

// 保存所有配置
export const saveAllConfig = (configData) => {
  return request({
    url: '/api/v1/admin/config/save-all',
    method: 'post',
    data: configData
  })
}

// 测试邮件配置
export const testEmailConfig = (testEmail) => {
  return request({
    url: '/api/v1/admin/config/test-email',
    method: 'post',
    data: { testEmail: testEmail }
  })
}

// 导出配置
export const exportConfig = () => {
  return request({
    url: '/api/v1/admin/system/config/export',
    method: 'get',
    responseType: 'blob'
  })
}

// 恢复默认配置
export const resetDefaultConfig = () => {
  return request({
    url: '/api/v1/admin/config/reset-default',
    method: 'post'
  })
}

// 获取时间节点配置
export const getDeadlinesConfig = () => {
  return request({
    url: '/api/v1/admin/config/deadlines',
    method: 'get'
  })
}

// 更新时间节点配置
export const updateDeadlinesConfig = (data) => {
  return request({
    url: '/api/v1/admin/config/deadlines',
    method: 'put',
    data: data
  })
}

// ========================== 查重规则管理 ==========================

// 查询查重规则列表
export const getCheckRuleList = (params) => {
  return request({
    url: '/api/v1/admin/config/check-rule/list',
    method: 'get',
    params: params
  })
}

// 新增/编辑查重规则
export const saveOrUpdateCheckRule = (data) => {
  return request({
    url: '/api/v1/admin/config/check-rule/save-or-update',
    method: 'post',
    data: data
  })
}

// 删除查重规则
export const deleteCheckRule = (ruleId) => {
  return request({
    url: '/api/v1/admin/config/check-rule/delete',
    method: 'post',
    params: { ruleId }
  })
}

// 查询规则关联的比对库
export const getRuleRelatedLibs = (ruleId) => {
  return request({
    url: '/api/v1/admin/config/check-rule/related-libs',
    method: 'get',
    params: { ruleId }
  })
}

// ========================== 比对库管理 ==========================

// 查询比对库列表
export const getCompareLibList = (params) => {
  return request({
    url: '/api/v1/admin/config/compare-lib/list',
    method: 'get',
    params: params
  })
}

// 新增/编辑比对库
export const saveOrUpdateCompareLib = (data) => {
  return request({
    url: '/api/v1/admin/config/compare-lib/save-or-update',
    method: 'post',
    data: data
  })
}

// 启用/禁用比对库
export const toggleLibEnabled = (libId, isEnabled) => {
  return request({
    url: '/api/v1/admin/config/compare-lib/toggle-enabled',
    method: 'post',
    params: { libId, isEnabled }
  })
}