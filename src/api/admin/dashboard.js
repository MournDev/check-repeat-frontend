import request from '../request'

// 获取系统统计数据
export const getDashboardStats = () => {
  return request({
    url: '/api/v1/admin/dashboard/stats',
    method: 'get'
  })
}

// 获取业务监控指标（Prometheus counters/gauges/timers）
export const getBusinessMetrics = () => {
  return request({
    url: '/api/v1/admin/monitoring/metrics',
    method: 'get'
  })
}

// 获取响应时间趋势（最近N分钟，按分钟聚合）
export const getResponseTimeTrend = (minutes = 15) => {
  return request({
    url: '/api/v1/admin/monitoring/response-time-trend',
    method: 'get',
    params: { minutes }
  })
}