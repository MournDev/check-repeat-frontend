import request from '../request'

// 审核记录导出（review_record + paper_info + sys_user）
export const exportAdminReviews = (params) => {
  return request({
    url: '/api/admin/reviews/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 答辩结论导出（全校，非单批次）
export const exportDefenseConclusions = (params) => {
  return request({
    url: '/api/admin/defense/conclusions/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
