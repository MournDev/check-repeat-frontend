import request from '../request'

// 获取系统性能监控数据
export const getPerformanceData = (metric = 'all', period = '1h') => {
  return request({
    url: '/api/admin/monitoring/performance',
    method: 'get',
    params: { metric, period }
  })
}

// 获取当前资源使用率
export const getResourceUsage = () => {
  return request({
    url: '/api/admin/monitoring/resources',
    method: 'get'
  })
}

// 获取系统监控概览
// 后端已统一到 /api/admin/monitoring 前缀（原 /api/admin/monitor/{overview,database,application} 已迁移）
export const getSystemOverview = () => {
  return request({
    url: '/api/admin/monitoring/overview',
    method: 'get'
  })
}

// 获取数据库监控
export const getDatabaseMonitor = () => {
  return request({
    url: '/api/admin/monitoring/database',
    method: 'get'
  })
}

// 获取应用性能监控
export const getApplicationMetrics = () => {
  return request({
    url: '/api/admin/monitoring/application',
    method: 'get'
  })
}

// 获取响应时间趋势
export const getResponseTimeTrend = (minutes = 15) => {
  return request({
    url: '/api/admin/monitoring/response-time-trend',
    method: 'get',
    params: { minutes }
  })
}
