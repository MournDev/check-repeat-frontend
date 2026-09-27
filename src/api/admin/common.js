import request from '../request'

// 获取专业列表
export const getMajors = (collegeId) => {
  return request({
    url: '/api/v1/common/dict/majors',
    method: 'get',
    params: { collegeId }
  })
}

// 获取学院列表
export const getColleges = () => {
  return request({
    url: '/api/v1/common/dict/colleges',
    method: 'get'
  })
}