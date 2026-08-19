import request from '../request'

// 获取分配统计信息
export const getAssignmentStats = () => {
  return request({
    url: '/api/admin/assignment/stats',
    method: 'get'
  })
}

// 获取未分配学生列表
export const getUnassignedStudents = (params) => {
  return request({
    url: '/api/admin/assignment/unassigned-students',
    method: 'get',
    params
  })
}

// 获取可用教师列表
export const getAvailableTeachers = (params) => {
  return request({
    url: '/api/admin/assignment/available-teachers',
    method: 'get',
    params
  })
}

// 单个学生分配指导老师
export const assignSingleStudent = (data) => {
  return request({
    url: '/api/admin/assignment/single-assign',
    method: 'post',
    data
  })
}

// 批量学生分配指导老师
export const assignBatchStudents = (data) => {
  return request({
    url: '/api/admin/assignment/batch-assign',
    method: 'post',
    data
  })
}

// 获取专业名称映射
export const getMajorMapping = () => {
  return request({
    url: '/api/admin/dict/majors/map',
    method: 'get'
  })
}

// 获取分配规则配置
export const getAssignmentRules = () => {
  return request({
    url: '/api/admin/assignment/rules',
    method: 'get'
  })
}

// 保存分配规则配置
export const saveAssignmentRules = (data) => {
  return request({
    url: '/api/admin/assignment/rules',
    method: 'post',
    data
  })
}

// 刷新分配相关数据
export const refreshAssignmentData = () => {
  return request({
    url: '/api/admin/assignment/refresh',
    method: 'post'
  })
}