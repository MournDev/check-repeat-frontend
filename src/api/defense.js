import request from './request'

// ==================== 管理端：答辩批次管理 ====================
// 后端控制器：AdminDefenseController（/api/admin/defense/batch/**，仅 ADMIN）。
// 注意：这一组接口的分页参数是 currentPage（不是项目里常用的 pageNum），
// 响应仍走 MyBatis-Plus Page 序列化：res.data.records / res.data.total。

// 新建答辩批次
// data: { batchNo, batchType(mid_term|final), collegeId?, defenseDate, location?,
//         mode(online|offline), leaderId?, secretaryId?, remark? }
// 雪花 ID 一律按字符串传（后端 DTO 已有 @JsonFormat STRING 约定）
export const createDefenseBatch = (data) => {
  return request({
    url: '/api/admin/defense/batch',
    method: 'post',
    data
  })
}

// 编辑答辩批次（批次编号与批次类型不可改，后端强校验）
export const updateDefenseBatch = (id, data) => {
  return request({
    url: `/api/admin/defense/batch/${id}`,
    method: 'put',
    data
  })
}

// 答辩批次分页列表
// params: { batchType?, collegeId?, status?(0筹备中/1进行中/2已结束), currentPage, pageSize }
export const getDefenseBatchList = (params) => {
  return request({
    url: '/api/admin/defense/batch/list',
    method: 'get',
    params
  })
}

// 答辩批次详情（含组成员数/入册论文数/已提交结论数三个统计）
export const getDefenseBatchDetail = (id) => {
  return request({
    url: `/api/admin/defense/batch/${id}`,
    method: 'get'
  })
}

// 删除答辩批次（仅筹备中 status=0 可删，后端拦截其余状态）
export const deleteDefenseBatch = (id) => {
  return request({
    url: `/api/admin/defense/batch/${id}`,
    method: 'delete'
  })
}

// 分配答辩组成员（1 组长 + N 成员）
// data: { batchId, leaderTeacherId?, teacherIds: string[], defaultRole?('leader'|'member') }
// 返回 { total, success, skipped, skipReasons[], leaderId }
export const assignDefenseMembers = (id, data) => {
  return request({
    url: `/api/admin/defense/batch/${id}/members`,
    method: 'post',
    data
  })
}

// 学生入批（论文按批次类型经阶段门推进：mid_term→mid_defense / final→final_defense）
// data: { batchId, paperIds: string[] }
// 返回 { total, success, skipped, skipReasons[] }；不符合前置状态的论文会被跳过
export const enrollDefenseStudents = (id, data) => {
  return request({
    url: `/api/admin/defense/batch/${id}/enroll`,
    method: 'post',
    data
  })
}

// 批次内答辩记录列表
// params: { studentId?, result?(pass|fail|postpone), currentPage, pageSize }
export const getDefenseBatchRecords = (id, params) => {
  return request({
    url: `/api/admin/defense/batch/${id}/records`,
    method: 'get',
    params
  })
}

// 导出批次内答辩记录（EasyExcel xlsx；responseType blob 返回原始 axios response）
export const exportDefenseBatchRecords = (id) => {
  return request({
    url: `/api/admin/defense/batch/${id}/records/export`,
    method: 'get',
    responseType: 'blob'
  })
}

// 批次答辩组成员名单（组长在前，成员在后，同角色按加入时间升序）
export const getDefenseBatchMembers = (id) => {
  return request({
    url: `/api/admin/defense/batch/${id}/members`,
    method: 'get'
  })
}

// ==================== 教师端：答辩工作台 ====================
// 后端控制器：TeacherDefenseController（/api/teacher/defense/**，仅 TEACHER）。
// 组长（leader）主持并汇总结论；成员（member）参与；秘书（secretary）记录与线下回填。
// 评分录入仅组长可提交（后端强校验 batch.leaderId === 当前教师）。

// 我的答辩批次列表（我作为组员/组长/秘书参与的批次）
export const getMyDefenseBatches = () => {
  return request({
    url: '/api/teacher/defense/batches',
    method: 'get'
  })
}

// 答辩批次会议信息（须为本批次组成员或秘书）
export const getTeacherDefenseBatchDetail = (id) => {
  return request({
    url: `/api/teacher/defense/batch/${id}`,
    method: 'get'
  })
}

// 批次内答辩记录列表（须为本批次组成员或秘书）
// result 可空：pass / fail / postpone
export const getTeacherDefenseRecords = (id, result) => {
  return request({
    url: `/api/teacher/defense/batch/${id}/records`,
    method: 'get',
    params: result ? { result } : {}
  })
}

// 批次答辩组成员名单（组长在前，成员在后；须为本批次组成员或秘书）
// silent：名单属辅助信息，失败不弹全局红条，由页面自行降级为隐藏
export const getTeacherDefenseMembers = (id) => {
  return request({
    url: `/api/teacher/defense/batch/${id}/members`,
    method: 'get',
    silent: true
  })
}

// 组长评分录入（结论提交）
// data: { recordId, result(pass|fail|postpone), score?(0-100), grade?(优|良|中|及格|不及格),
//         comment?, attachmentId? }
// 约束：result=pass 时 score 与 grade 必填（终期通过会回写 final_score）
export const submitDefenseScore = (data) => {
  return request({
    url: '/api/teacher/defense/score',
    method: 'post',
    data
  })
}

// 上传答辩表扫描件（复用通用文件上传，返回 FileUploadResponse，取 data.fileId 作为 attachmentId）
export const uploadDefenseAttachment = (formData) => {
  return request({
    url: '/api/file/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ==================== 学生端 ====================
// 后端控制器：StudentDefenseController（/api/student/defense/**，仅 STUDENT）。

// 我的答辩安排（按答辩时间倒序，含已出结论）
// batchType 可空：mid_term / final
export const getMyDefenseList = (batchType) => {
  return request({
    url: '/api/student/defense/my',
    method: 'get',
    params: batchType ? { batchType } : {}
  })
}
