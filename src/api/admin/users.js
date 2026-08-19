import request from '../request'

// 获取用户列表
export const getUserList = (params) => {
  return request({
    url: '/api/admin/users/list',
    method: 'get',
    params: params
  })
}

// 创建新用户
export const createUser = (data) => {
  return request({
    url: '/api/admin/users/create',
    method: 'post',
    data: data
  })
}

// 更新用户信息
export const updateUser = (userId, data) => {
  return request({
    url: `/api/admin/users/${userId}`,
    method: 'put',
    data: data
  })
}

// 删除用户
export const deleteUser = (userId) => {
  return request({
    url: `/api/admin/users/${userId}`,
    method: 'delete'
  })
}

// 批量删除用户
export const batchDeleteUsers = (userIds) => {
  return request({
    url: '/api/admin/users/batch-delete',
    method: 'post',
    data: userIds
  })
}

// 启用/禁用用户
export const updateUserStatus = (userId, status) => {
  return request({
    url: `/api/admin/users/${userId}/status`,
    method: 'put',
    data: { status: status }
  })
}

// 重置用户密码
export const resetUserPassword = (userId, newPassword) => {
  return request({
    url: `/api/admin/users/${userId}/reset-password`,
    method: 'put',
    data: { newPassword: newPassword }
  })
}

// 获取用户详细信息
export const getUserDetail = (userId) => {
  return request({
    url: `/api/admin/users/${userId}`,
    method: 'get'
  })
}

// 获取学生详细信息
export const getStudentDetail = (studentId) => {
  return request({
    url: `/api/admin/students/${studentId}`,
    method: 'get'
  })
}

// 获取用户登录历史
export const getUserLoginHistory = (userId, params) => {
  return request({
    url: `/api/admin/users/${userId}/login-history`,
    method: 'get',
    params: params
  })
}