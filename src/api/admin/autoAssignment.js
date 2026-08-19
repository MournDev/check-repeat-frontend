import request from '../request'

// 获取算法配置
export const getAlgorithmConfig = () => {
  return request({
    url: '/api/admin/auto-assignment/config',
    method: 'get'
  })
}

// 保存算法配置
export const saveAlgorithmConfig = (data) => {
  return request({
    url: '/api/admin/auto-assignment/config',
    method: 'post',
    data
  })
}

// 获取分配预览数据
export const getAssignmentPreview = () => {
  return request({
    url: '/api/admin/auto-assignment/preview',
    method: 'get'
  })
}

// 启动自动分配
export const startAutoAssignment = (data) => {
  return request({
    url: '/api/admin/auto-assignment/start',
    method: 'post',
    data
  })
}

// 查询分配进度
export const getAssignmentProgress = (taskId) => {
  return request({
    url: `/api/admin/auto-assignment/progress/${taskId}`,
    method: 'get'
  })
}

// 取消分配任务
export const cancelAssignmentTask = (taskId) => {
  return request({
    url: `/api/admin/auto-assignment/cancel/${taskId}`,
    method: 'post'
  })
}

// 获取执行历史列表
export const getAssignmentHistory = (params) => {
  return request({
    url: '/api/admin/auto-assignment/history',
    method: 'get',
    params
  })
}

// 获取执行详情
export const getAssignmentDetail = (id) => {
  return request({
    url: `/api/admin/auto-assignment/history/${id}/detail`,
    method: 'get'
  })
}

// 应用分配结果
export const applyAssignmentResult = (id) => {
  return request({
    url: `/api/admin/auto-assignment/history/${id}/apply`,
    method: 'post'
  })
}

// 刷新基础数据
export const refreshAssignmentData = () => {
  return request({
    url: '/api/admin/auto-assignment/refresh',
    method: 'post'
  })
}