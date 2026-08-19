import request from '../request'

// 获取分配记录统计信息
export const getHistoryStats = () => {
  return request({
    url: '/api/admin/assignment/history/stats',
    method: 'get'
  })
}

// 获取分配记录列表
export const getHistoryList = (params) => {
  return request({
    url: '/api/admin/assignment/history/list',
    method: 'get',
    params
  })
}

// 删除分配记录
export const deleteHistoryRecords = (data) => {
  return request({
    url: '/api/admin/assignment/history',
    method: 'delete',
    data
  })
}

// 撤销分配
export const revokeAssignment = (data) => {
  return request({
    url: '/api/admin/assignment/history/revoke',
    method: 'post',
    data
  })
}

// 重新分配指导老师
export const reassignTeacher = (data) => {
  return request({
    url: '/api/admin/assignment/history/reassign',
    method: 'post',
    data
  })
}

// 获取可用教师列表
export const getAvailableTeachers = () => {
  return request({
    url: '/api/admin/assignment/history/available-teachers',
    method: 'get'
  })
}

// 导出分配记录
export const exportHistory = (params) => {
  return request({
    url: '/api/admin/assignment/history/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 刷新分配记录数据
export const refreshHistoryData = () => {
  return request({
    url: '/api/admin/assignment/history/refresh',
    method: 'post'
  })
}