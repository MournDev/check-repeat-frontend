import request from '../request'

// 获取系统统计数据
export const getDashboardStats = () => {
  return request({
    url: '/api/admin/dashboard/stats',
    method: 'get'
  })
}

// 获取最近活动列表
export const getRecentActivities = (params = { limit: 10 }) => {
  return request({
    url: '/api/admin/dashboard/recent-activities',
    method: 'get',
    params: params
  })
}

// 获取快捷操作菜单
export const getQuickActions = () => {
  return request({
    url: '/api/admin/dashboard/quick-actions',
    method: 'get'
  })
}