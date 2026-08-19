import request from '../request'

// 获取专业列表
export const getMajors = (collegeId) => {
  return request({
    url: '/api/common/dict/majors',
    method: 'get',
    params: { collegeId }
  })
}

// 获取年级列表
export const getGrades = () => {
  return request({
    url: '/api/common/dict/grades',
    method: 'get'
  })
}

// 获取学院列表
export const getColleges = () => {
  return request({
    url: '/api/common/dict/colleges',
    method: 'get'
  })
}

// 文件上传
export const uploadFile = (formData) => {
  return request({
    url: '/api/admin/files/upload',
    method: 'post',
    data: formData
  })
}

// 文件下载
export const downloadFile = (fileId) => {
  return request({
    url: `/api/admin/files/download/${fileId}`,
    method: 'get',
    responseType: 'blob'
  })
}