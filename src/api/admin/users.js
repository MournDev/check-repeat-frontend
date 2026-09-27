import request from '../request'

// 获取用户列表
export const getUserList = (params) => {
  return request({
    url: '/api/v1/admin/users/list',
    method: 'get',
    params: params
  })
}

// 创建新用户
export const createUser = (data) => {
  return request({
    url: '/api/v1/admin/users/create',
    method: 'post',
    data: data
  })
}

// 更新用户信息
export const updateUser = (userId, data) => {
  return request({
    url: `/api/v1/admin/users/${userId}`,
    method: 'put',
    data: data
  })
}

// 删除用户
export const deleteUser = (userId) => {
  return request({
    url: `/api/v1/admin/users/${userId}`,
    method: 'delete'
  })
}

// 批量删除用户
export const batchDeleteUsers = (userIds) => {
  return request({
    url: '/api/v1/admin/users/batch-delete',
    method: 'post',
    data: userIds
  })
}

// 启用/禁用用户
export const updateUserStatus = (userId, status) => {
  return request({
    url: `/api/v1/admin/users/${userId}/status`,
    method: 'put',
    data: { status: status }
  })
}

// 获取学生详细信息（复用 /api/v1/admin/users/{userId} 端点）
export const getStudentDetail = (studentId) => {
  return request({
    url: `/api/v1/admin/users/${studentId}`,
    method: 'get'
  })
}

// 导出用户列表
export const exportUsers = (params) => {
  return request({
    url: '/api/v1/admin/users/export',
    method: 'get',
    params: params,
    responseType: 'blob'
  })
}

// 重置用户密码
export const resetUserPassword = (userId) => {
  return request({
    url: `/api/v1/admin/users/${userId}/reset-password`,
    method: 'put'
  })
}

// 获取用户登录历史
export const getUserLoginHistory = (userId, params) => {
  return request({
    url: `/api/v1/admin/users/${userId}/login-history`,
    method: 'get',
    params
  })
}