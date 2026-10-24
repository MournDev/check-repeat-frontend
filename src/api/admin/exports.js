import request from '../request'

// 学期数据包 ZIP（单次下载）
// params: { semester?: '2026-2027-1', startDate?: 'yyyy-MM-dd', endDate?: 'yyyy-MM-dd',
//           items?: 'papers,checks,reviews,defense'（为空表示全部） }
// 包内含对应 xlsx 与 manifest.json；响应头带 UTF-8 文件名
export const exportSemesterPackage = (params) => {
  return request({
    url: '/api/admin/semester-package/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
