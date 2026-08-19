import request from '../request'

// 获取学校概览数据
export const getSchoolOverview = () => {
  return request({
    url: '/api/admin/school/overview',
    method: 'get'
  })
}

// 获取学院论文分布
export const getCollegeDistribution = () => {
  return request({
    url: '/api/admin/school/college-distribution',
    method: 'get'
  })
}

// 获取月度论文趋势
export const getMonthlyTrend = () => {
  return request({
    url: '/api/admin/school/monthly-trend',
    method: 'get'
  })
}

// 获取查重结果分布
export const getSimilarityDistribution = () => {
  return request({
    url: '/api/admin/school/similarity-distribution',
    method: 'get'
  })
}

// 获取实时统计
export const getRealtimeStats = () => {
  return request({
    url: '/api/admin/school/realtime-stats',
    method: 'get'
  })
}

// 获取系统通知
export const getNotices = () => {
  return request({
    url: '/api/admin/school/notices',
    method: 'get'
  })
}

// 导出学校数据报告
export const exportSchoolReport = (params) => {
  return request({
    url: '/api/admin/school/export-report',
    method: 'get',
    params: params,
    responseType: 'blob'
  })
}