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

// ========================== 查重规则管理 ==========================

// 查询查重规则列表
export const getCheckRuleList = (params) => {
  return request({
    url: '/api/admin/config/check-rule/list',
    method: 'get',
    params: params
  })
}

// 新增/编辑查重规则
export const saveOrUpdateCheckRule = (data) => {
  return request({
    url: '/api/admin/config/check-rule/save-or-update',
    method: 'post',
    data: data
  })
}

// 删除查重规则
export const deleteCheckRule = (ruleId) => {
  return request({
    url: '/api/admin/config/check-rule/delete',
    method: 'post',
    params: { ruleId }
  })
}

// 查询规则关联的比对库
export const getRuleRelatedLibs = (ruleId) => {
  return request({
    url: '/api/admin/config/check-rule/related-libs',
    method: 'get',
    params: { ruleId }
  })
}

// ========================== 比对库管理 ==========================

// 查询比对库列表
export const getCompareLibList = (params) => {
  return request({
    url: '/api/admin/config/compare-lib/list',
    method: 'get',
    params: params
  })
}

// 新增/编辑比对库
export const saveOrUpdateCompareLib = (data) => {
  return request({
    url: '/api/admin/config/compare-lib/save-or-update',
    method: 'post',
    data: data
  })
}

// 启用/禁用比对库
export const toggleLibEnabled = (libId, isEnabled) => {
  return request({
    url: '/api/admin/config/compare-lib/toggle-enabled',
    method: 'post',
    params: { libId, isEnabled }
  })
}

// ========================== 相似度阈值设置 ==========================
// 阈值真值源：similarity_threshold / category_similarity_threshold 两张表。
// 查重判定按 专业 > 学院 > 全局 解析，故这里的配置会直接影响合格判定。

// 获取相似度阈值设置
export const getSimilarityThresholds = () => {
  return request({
    url: '/api/admin/similarity-thresholds',
    method: 'get'
  })
}

// 更新相似度阈值设置（整体覆盖）
export const updateSimilarityThresholds = (data) => {
  return request({
    url: '/api/admin/similarity-thresholds',
    method: 'put',
    data: data
  })
}

// ========================== 审核工作流配置 ==========================
// 页面是超管页面（/super-admin/review-workflow），配置的是全站审核流程，
// 端点因此挂在 /api/admin/** 下，与相似度阈值设置同理。
// 原先教育师域的 /api/teacher/review-workflow 后端从未实现，非 TEACHER 身份调用
// 只会被 hasAuthority("TEACHER") 拒掉（前端表现为 401），别再往回改。

// 获取审核工作流配置
export const getReviewWorkflow = () => {
  return request({
    url: '/api/admin/review-workflow',
    method: 'get'
  })
}

// 更新审核工作流配置（整体覆盖）
export const updateReviewWorkflow = (data) => {
  return request({
    url: '/api/admin/review-workflow',
    method: 'put',
    data: data
  })
}

// 获取审批人候选教师列表
export const getReviewWorkflowTeachers = () => {
  return request({
    url: '/api/admin/review-workflow/teachers',
    method: 'get'
  })
}