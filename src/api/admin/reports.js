import request from '../request'

export function getReportList(params) {
  return request({
    url: '/api/v1/admin/reports/list',
    method: 'get',
    params
  })
}

export function getReportStats() {
  return request({
    url: '/api/v1/admin/reports/stats',
    method: 'get'
  })
}

export function getReportDetail(reportId) {
  return request({
    url: '/api/v1/admin/reports/detail',
    method: 'get',
    params: { reportId }
  })
}

export function batchExportReports(ids) {
  return request({
    url: '/api/v1/admin/reports/batch-export',
    method: 'post',
    data: { ids },
    responseType: 'blob'
  })
}
