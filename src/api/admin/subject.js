import request from '../request'

// 学科领域管理（管理端）
//
// 对应后端 admin/controller/AdminSubjectController（/api/admin/subjects）。
// 注意：读取学科树的**公共**接口是 /api/dict/subject/tree（见 api/user.js 的
// getSubjectFieldTree，教师/学生端共用）。这个文件里的 getSubjectTree 是管理端版本，
// 多带引用次数与是否有子节点，供删除前提示用。

// 学科领域树（门类 → 二级学科，含 referenceCount / hasChildren）
export const getSubjectTree = () => {
  return request({
    url: '/api/admin/subjects',
    method: 'get'
  })
}

// 新增学科领域。parentId 为空建一级门类，否则建该门类下的二级学科
export const createSubject = (data) => {
  return request({
    url: '/api/admin/subjects',
    method: 'post',
    data: data
  })
}

// 修改学科领域（只允许改 name / sortNo / isEnabled，code 与 parentId 必须原样回传）
export const updateSubject = (id, data) => {
  return request({
    url: `/api/admin/subjects/${id}`,
    method: 'put',
    data: data
  })
}

// 启用/停用。停用后不再出现在选择器与阈值候选中，已引用数据不受影响
export const setSubjectEnabled = (id, isEnabled) => {
  return request({
    url: `/api/admin/subjects/${id}/enabled`,
    method: 'put',
    params: { isEnabled }
  })
}

// 删除（物理删除；有二级学科或被引用时后端会拒绝并返回原因）
export const deleteSubject = (id) => {
  return request({
    url: `/api/admin/subjects/${id}`,
    method: 'delete'
  })
}
