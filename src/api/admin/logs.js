import request from '../request'

// 获取实时监控统计数据
export const getRealtimeStats = () => {
  return request({
    url: '/api/admin/dashboard/realtime-stats',
    method: 'get'
  })
}

// 获取操作日志列表
export const getOperationLogs = (params) => {
  return request({
    url: '/api/admin/logs/operations',
    method: 'get',
    params
  })
}

// 获取安全日志列表
export const getSecurityLogs = (params) => {
  return request({
    url: '/api/admin/logs/security',
    method: 'get',
    params
  })
}

// 获取登录日志列表
export const getLoginLogs = (params) => {
  return request({
    url: '/api/admin/logs/login',
    method: 'get',
    params
  })
}

// 获取系统日志列表
export const getSystemLogs = (params) => {
  return request({
    url: '/api/admin/logs/system',
    method: 'get',
    params
  })
}

// 导出操作日志
export const exportOperationLogs = (params) => {
  return request({
    url: '/api/admin/logs/operations/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取智能预警配置
export const getAlertConfig = () => {
  return request({
    url: '/api/admin/alerts/config',
    method: 'get'
  })
}

// 更新智能预警配置
export const updateAlertConfig = (data) => {
  return request({
    url: '/api/admin/alerts/config',
    method: 'put',
    data
  })
}

// 获取活跃预警列表
export const getActiveAlerts = () => {
  return request({
    url: '/api/admin/alerts/active',
    method: 'get'
  })
}

// 处理预警
export const handleAlert = (data) => {
  return request({
    url: '/api/admin/alerts/handle',
    method: 'post',
    data
  })
}

// 获取性能监控数据
export const getPerformanceData = (params) => {
  return request({
    url: '/api/admin/monitoring/performance',
    method: 'get',
    params
  })
}

// 获取资源使用率
export const getResourceUsage = () => {
  return request({
    url: '/api/admin/monitoring/resources',
    method: 'get'
  })
}

// 获取API响应时间统计
export const getApiResponseTimes = (params) => {
  return request({
    url: '/api/admin/monitoring/response-times',
    method: 'get',
    params
  })
}

// 获取系统监控概览数据
export const getSystemOverview = () => {
  return request({
    url: '/api/admin/monitor/overview',
    method: 'get'
  })
}