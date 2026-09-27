import request from '../request'

// 获取实时监控统计数据
export const getRealtimeStats = () => {
  return request({
    url: '/api/v1/admin/dashboard/realtime-stats',
    method: 'get'
  })
}

// 获取操作日志列表
export const getOperationLogs = (params) => {
  return request({
    url: '/api/v1/admin/logs/operations',
    method: 'get',
    params
  })
}

// 获取安全日志列表
export const getSecurityLogs = (params) => {
  return request({
    url: '/api/v1/admin/logs/security',
    method: 'get',
    params
  })
}

// 获取登录日志列表
export const getLoginLogs = (params) => {
  return request({
    url: '/api/v1/admin/logs/login',
    method: 'get',
    params
  })
}

// 导出操作日志
export const exportOperationLogs = (params) => {
  return request({
    url: '/api/v1/admin/logs/operations/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取智能预警配置
export const getAlertConfig = () => {
  return request({
    url: '/api/v1/admin/alerts/config',
    method: 'get'
  })
}

// 更新智能预警配置
export const updateAlertConfig = (data) => {
  return request({
    url: '/api/v1/admin/alerts/config',
    method: 'put',
    data
  })
}

// 获取活跃预警列表
export const getActiveAlerts = () => {
  return request({
    url: '/api/v1/admin/alerts/active',
    method: 'get'
  })
}

// 删除告警规则
export const deleteAlertRule = (id) => {
  return request({
    url: `/api/v1/admin/alerts/config/${id}`,
    method: 'delete'
  })
}

// 启用/禁用告警规则
export const toggleAlertRule = (id, enabled) => {
  return request({
    url: `/api/v1/admin/alerts/config/${id}/toggle`,
    method: 'put',
    data: { enabled }
  })
}

// 处理预警
export const handleAlert = (data) => {
  return request({
    url: '/api/v1/admin/alerts/handle',
    method: 'post',
    data
  })
}

// 获取资源使用率
export const getResourceUsage = () => {
  return request({
    url: '/api/v1/admin/monitoring/resources',
    method: 'get'
  })
}

// 获取API响应时间统计
export const getApiResponseTimes = (params) => {
  return request({
    url: '/api/v1/admin/monitoring/response-times',
    method: 'get',
    params
  })
}

// ==================== 操作日志管理（SysOperationLogController） ====================

// 获取操作统计信息
export const getOperationStatistics = (days = 7) => {
  return request({
    url: '/api/v1/admin/operation-logs/statistics',
    method: 'get',
    params: { days }
  })
}

// 获取热门操作统计
export const getHotOperations = (days = 7, limit = 10) => {
  return request({
    url: '/api/v1/admin/operation-logs/hot-operations',
    method: 'get',
    params: { days, limit }
  })
}

// 获取用户活跃度统计
export const getUserActivity = (days = 7) => {
  return request({
    url: '/api/v1/admin/operation-logs/user-activity',
    method: 'get',
    params: { days }
  })
}

// 获取模块使用统计
export const getModuleUsage = (days = 7) => {
  return request({
    url: '/api/v1/admin/operation-logs/module-usage',
    method: 'get',
    params: { days }
  })
}

// 批量删除操作日志
export const batchDeleteLogs = (ids) => {
  return request({
    url: '/api/v1/admin/operation-logs/batch',
    method: 'delete',
    data: ids
  })
}

// 清理过期操作日志
export const cleanExpiredLogs = (days = 30) => {
  return request({
    url: '/api/v1/admin/operation-logs/clean-expired',
    method: 'delete',
    params: { days }
  })
}

// 导出操作日志（新接口）
export const exportOperationLogsNew = (params) => {
  return request({
    url: '/api/v1/admin/operation-logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取系统日志
export const getSystemLogs = (params) => {
  return request({
    url: '/api/v1/admin/logs/system',
    method: 'get',
    params
  })
}

// 导出登录日志
export const exportLoginLogs = (params) => {
  return request({
    url: '/api/v1/admin/logs/login/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}