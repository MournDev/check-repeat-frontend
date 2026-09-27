import request from '../request'

// 获取系统性能监控数据
export const getPerformanceData = (metric = 'all', period = '1h') => {
  return request({
    url: '/api/v1/admin/monitoring/performance',
    method: 'get',
    params: { metric, period }
  })
}

// 获取当前资源使用率
export const getResourceUsage = () => {
  return request({
    url: '/api/v1/admin/monitoring/resources',
    method: 'get'
  })
}

// 获取API响应时间统计
export const getApiResponseTimes = (period = '1h') => {
  return request({
    url: '/api/v1/admin/monitoring/response-times',
    method: 'get',
    params: { period }
  })
}

// 获取系统监控概览
export const getSystemOverview = () => {
  return request({
    url: '/api/v1/admin/monitoring/overview',
    method: 'get'
  })
}

// 获取数据库监控
export const getDatabaseMonitor = () => {
  return request({
    url: '/api/v1/admin/monitoring/database',
    method: 'get'
  })
}

// 获取应用性能监控
export const getApplicationMetrics = () => {
  return request({
    url: '/api/v1/admin/monitoring/application',
    method: 'get'
  })
}

// 获取缓存性能监控
export const getCacheMetrics = () => {
  return request({
    url: '/api/v1/admin/monitoring/cache',
    method: 'get'
  })
}

// 获取业务指标监控
export const getBusinessMetrics = () => {
  return request({
    url: '/api/v1/admin/monitoring/metrics',
    method: 'get'
  })
}

// 获取响应时间趋势
export const getResponseTimeTrend = (minutes = 15) => {
  return request({
    url: '/api/v1/admin/monitoring/response-time-trend',
    method: 'get',
    params: { minutes }
  })
}
