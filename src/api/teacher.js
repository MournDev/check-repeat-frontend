import request from "./request";

// 获取消息会话列表
export const getMessageSessions = () => {
  return request({
    url: '/api/v1/teacher/message/sessions',
    method: 'get',
    _skipLoginRedirect: true
  })
}

// 发送消息
export const sendMessage = (data) => {
  return request({
    url: '/api/v1/teacher/message/send',
    method: 'post',
    data,
    _skipLoginRedirect: true
  })
}

// 获取消息列表
export const getMessageList = (params) => {
  return request({
    url: '/api/v1/teacher/message/list',
    method: 'get',
    params,
    _skipLoginRedirect: true
  })
}

// 标记消息已读
export const markMessagesRead = (data) => {
  let sessionId;
  if (typeof data === 'object' && data !== null) {
    sessionId = data.sessionId;
  } else {
    sessionId = data;
  }
  return request({
    url: '/api/v1/teacher/message/mark-read',
    method: 'post',
    params: {
      sessionId
    },
    _skipLoginRedirect: true
  })
}

// 上传文件上传消息文件
export const uploadMessageFile = (formData) => {
  return request({
    url: '/api/v1/teacher/message/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 上传文件（别名）
export const uploadFile = uploadMessageFile

// 清空消息
export const clearMessages = (sessionId) => {
  return request({
    url: '/api/v1/teacher/message/clear',
    method: 'post',
    params: {
      sessionId
    }
  })
}

// 获取学生信息
export const getStudentInfo = (studentId) => {
  return request({
    url: `/api/v1/teacher/message/student-info`,
    method: 'get',
    params: {
      studentId
    }
  })
}

// 下载论文
export const downloadPaper = (paperId) => {
  return request({
    url: `/api/v1/teacher/papers/${paperId}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

// 获取教师仪表板统计信息
export const getTeacherDashboardStats = (teacherId) => {
  return request({
    url: teacherId ? `/api/v1/teacher/dashboard/stats/${teacherId}` : '/api/v1/teacher/dashboard/stats',
    method: 'get'
  })
}

// 获取待审核论文列表
export const getPendingReviewList = (pageNum, pageSize) => {
  return request({
    url: '/api/v1/teacher/dashboard/pending-papers',
    method: 'get',
    params: {
      pageNum,
      pageSize
    }
  })
}

// 获取学生统计信息
export const getStudentStats = (teacherId) => {
  return request({
    url: '/api/v1/teacher/students/statistics',
    method: 'get',
    params: teacherId ? { teacherId } : {}
  })
}

// 导出教师数据
export const exportTeacherData = (data) => {
  return request({
    url: '/api/v1/teacher/export/data',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 获取审核统计信息
export const getReviewStats = (params) => {
  return request({
    url: '/api/v1/teacher/data-analysis/review-stats',
    method: 'get',
    params
  })
}

// 获取学院分布
export const getCollegeDistribution = (params) => {
  return request({
    url: '/api/v1/teacher/data-analysis/college-distribution',
    method: 'get',
    params
  })
}

// 添加学生
export const addStudent = (data) => {
  return request({
    url: '/api/v1/teacher/students/add',
    method: 'post',
    data
  })
}

// 获取学生列表
export const getStudentListFull = (params) => {
  return request({
    url: '/api/v1/teacher/students',
    method: 'get',
    params
  })
}

// 导入学生数据
export const importStudentData = (formData) => {
  return request({
    url: '/api/v1/teacher/students/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取学院列表
export const getColleges = () => {
  return request({
    url: '/api/v1/common/dict/colleges',
    method: 'get'
  })
}

// 获取专业列表
export const getMajors = (collegeId) => {
  return request({
    url: '/api/v1/common/dict/majors',
    method: 'get',
    params: {
      collegeId
    }
  })
}

// 删除学生
export const deleteStudent = (studentId) => {
  return request({
    url: `/api/v1/teacher/students/${studentId}`,
    method: 'delete'
  })
}

// 分配导师
export const assignAdvisor = (studentId, data) => {
  return request({
    url: `/api/v1/teacher/students/${studentId}/assign-advisor`,
    method: 'post',
    data
  })
}

// 批量分配导师
export const batchAssignAdvisor = (data) => {
  return request({
    url: '/api/v1/teacher/students/batch-assign-advisor',
    method: 'post',
    data
  })
}

// 批量发送消息
export const batchSendMessage = (data) => {
  return request({
    url: '/api/v1/teacher/students/messages/batch-send',
    method: 'post',
    data
  })
}

// 批量删除学生
export const batchDeleteStudents = (studentIds) => {
  return request({
    url: '/api/v1/teacher/students/batch-delete',
    method: 'delete',
    data: studentIds
  })
}

// 导出学生数据
export const exportStudentData = (params) => {
  return request({
    url: '/api/v1/teacher/students/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取学生论文信息
export const getStudentPaper = (studentId) => {
  return request({
    url: `/api/v1/teacher/students/${studentId}/paper`,
    method: 'get'
  })
}

// 获取学生所有论文
export const getStudentPapers = (studentId) => {
  return request({
    url: `/api/v1/teacher/students/${studentId}/papers`,
    method: 'get'
  })
}

// 获取详细数据
export const getDetailData = (params) => {
  return request({
    url: '/api/v1/teacher/data-analysis/detail-data',
    method: 'get',
    params
  })
}

// 获取审核趋势
export const getReviewTrend = (params) => {
  return request({
    url: '/api/v1/teacher/data-analysis/review-trend',
    method: 'get',
    params
  })
}

// 获取审核状态分布
export const getReviewStatusDistribution = (params) => {
  return request({
    url: '/api/v1/teacher/data-analysis/review-status-distribution',
    method: 'get',
    params
  })
}

// 获取相似度分布
export const getSimilarityDistribution = (params) => {
  return request({
    url: '/api/v1/teacher/data-analysis/similarity-distribution',
    method: 'get',
    params
  })
}

// 导出数据
export const exportData = (params) => {
  return request({
    url: '/api/v1/teacher/data-analysis/export',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

// 执行审核
export const doReview = (data) => {
  const formData = new FormData()

  if (data.paperIds && Array.isArray(data.paperIds)) {
    formData.append('paperIds', data.paperIds.join(','))
  } else if (data.paperIds) {
    formData.append('paperIds', data.paperIds)
  }

  if (data.reviewStatus !== undefined) {
    formData.append('reviewStatus', data.reviewStatus)
  }

  if (data.reviewOpinion) {
    formData.append('reviewOpinion', data.reviewOpinion)
  }

  if (data.reviewAttach) {
    formData.append('reviewAttach', data.reviewAttach)
  }

  return request({
    url: '/api/v1/teacher/reviews/do-review',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取待审核统计
export const getPendingStats = () => {
  return request({
    url: '/api/v1/teacher/pending-reviews/stats',
    method: 'get'
  })
}

// 重新查重
export const recheckPlagiarism = (paperId) => {
  return request({
    url: '/api/v1/teacher/pending-reviews/recheck',
    method: 'post',
    data: { paperId: String(paperId) }
  })
}

// 发送提醒
export const sendReminder = (paperId) => {
  return request({
    url: '/api/v1/teacher/pending-reviews/reminder',
    method: 'post',
    data: { paperId: String(paperId) }
  })
}

// 联系学生
export const contactStudent = (data) => {
  return request({
    url: '/api/v1/teacher/pending-reviews/contact',
    method: 'post',
    data
  })
}

// 获取查重报告
export const getPlagiarismReport = (paperId) => {
  return request({
    url: `/api/v1/teacher/pending-reviews/report/${paperId}`,
    method: 'get'
  })
}

// 获取今日审核数量
export const getTodayReviewedCount = () => {
  return request({
    url: '/api/v1/teacher/pending-reviews/today',
    method: 'get'
  })
}

// 委托审核
export const delegateReview = (data) => {
  return request({
    url: '/api/v1/teacher/pending-reviews/delegate',
    method: 'post',
    data
  })
}

// 获取论文内容
export const getPaperContent = (paperId) => {
  return request({
    url: `/api/v1/teacher/reviews/paper-content/${paperId}`,
    method: 'get'
  })
}

// 获取论文预览URL
export const getPaperPreviewUrl = (paperId) => {
  return request({
    url: `/api/v1/teacher/reviews/paper-preview/${paperId}`,
    method: 'get'
  })
}

// 获取审核历史
export const getReviewHistory = (paperId) => {
  return request({
    url: `/api/v1/teacher/pending-reviews/history/${paperId}`,
    method: 'get'
  })
}

// 获取详细查重报告
export const getDetailedPlagiarismReport = (paperId) => {
  return request({
    url: '/api/v1/teacher/reports/list',
    method: 'get',
    params: { paperId }
  })
}

// 获取论文报告
export const getPaperReport = (reportId) => {
  return request({
    url: `/api/v1/teacher/reports/preview`,
    method: 'get',
    params: {
      reportId
    }
  })
}

// 获取简单查重报告列表
export const getSimpleCheckReport = (paperId) => {
  return request({
    url: `/api/v1/teacher/reports/list`,
    method: 'get',
    params: {
      paperId
    }
  })
}

// 导出查重报告
export const exportCheckReport = (reportId, format) => {
  return request({
    url: `/api/v1/teacher/reports/download`,
    method: 'post',
    data: {
      reportId,
      format
    },
    responseType: 'blob'
  })
}

// 获取已审核列表
export const getReviewedList = (params) => {
  return request({
    url: '/api/v1/teacher/reviews/reviewed-list',
    method: 'get',
    params
  })
}

// 导出审核记录
export const exportReviewRecords = (params) => {
  return request({
    url: '/api/v1/teacher/reviews/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取教师信息
export const getInfo = (userId) => {
  return request({
    url: '/api/v1/teacher/info/get',
    method: 'get',
    params: {
      userId
    }
  })
}

// 更新教师信息
export const updateInfo = (data) => {
  return request({
    url: '/api/v1/teacher/info/update',
    method: 'post',
    data
  })
}

// 修改密码
export const changePassword = (data) => {
  return request({
    url: '/api/v1/teacher/info/changePassword',
    method: 'post',
    params: {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    }
  })
}

// 创建审核模板
export const createReviewTemplate = (data) => {
  return request({
    url: '/api/v1/teacher/review-templates/createTemplate',
    method: 'post',
    data
  })
}

// 获取审核模板列表
export const getReviewTemplates = (params) => {
  return request({
    url: '/api/v1/teacher/review-templates/getTemplatesList',
    method: 'get',
    params
  })
}

// 更新审核模板
export const updateReviewTemplate = (templateId, data) => {
  return request({
    url: `/api/v1/teacher/review-templates/${templateId}`,
    method: 'put',
    data
  })
}

// 删除审核模板
export const deleteReviewTemplate = (templateId) => {
  return request({
    url: `/api/v1/teacher/review-templates/${templateId}`,
    method: 'delete'
  })
}

// 使用审核模板
export const useReviewTemplate = (templateId) => {
  return request({
    url: `/api/v1/teacher/review-templates/${templateId}/use`,
    method: 'post'
  })
}

// 添加学生到分组
export const addStudentsToGroup = (groupId, studentIds) => {
  return request({
    url: `/api/v1/teacher/student-groups/${groupId}/students`,
    method: 'post',
    data: studentIds
  })
}

// 获取学生分组列表
export const getStudentGroups = (params) => {
  return request({
    url: '/api/v1/teacher/student-groups',
    method: 'get',
    params
  })
}

// 创建学生分组
export const createStudentGroup = (data) => {
  return request({
    url: '/api/v1/teacher/student-groups',
    method: 'post',
    data
  })
}

// 更新学生分组
export const updateStudentGroup = (groupId, data) => {
  return request({
    url: `/api/v1/teacher/student-groups/${groupId}`,
    method: 'put',
    data
  })
}

// 删除学生分组
export const deleteStudentGroup = (groupId) => {
  return request({
    url: `/api/v1/teacher/student-groups/${groupId}`,
    method: 'delete'
  })
}

// 从分组中移除单个学生
export const removeStudentFromGroup = (groupId, studentId) => {
  return request({
    url: `/api/v1/teacher/student-groups/${groupId}/students/${studentId}`,
    method: 'delete'
  })
}

// 获取未分组的学生列表
export const getStudentsNotInGroup = (params) => {
  return request({
    url: `/api/v1/teacher/student-groups/${params.groupId}/students/not-in-group`,
    method: 'get'
  })
}

// 获取相似度阈值设置
export const getSimilarityThresholds = () => {
  return request({
    url: '/api/v1/teacher/similarity-thresholds',
    method: 'get'
  })
}

// 更新相似度阈值设置
export const updateSimilarityThresholds = (data) => {
  return request({
    url: '/api/v1/teacher/similarity-thresholds',
    method: 'put',
    data
  })
}

// 获取审核流程配置
export const getReviewWorkflow = () => {
  return request({
    url: '/api/v1/teacher/review-workflow',
    method: 'get'
  })
}

// 更新审核流程配置
export const updateReviewWorkflow = (data) => {
  return request({
    url: '/api/v1/teacher/review-workflow',
    method: 'put',
    data
  })
}

// 获取教师列表
export const getTeachers = (params) => {
  return request({
    url: '/api/v1/teacher/review-workflow/teachers',
    method: 'get',
    params
  })
}

// 删除共享文件
export const deleteSharedFile = (fileId) => {
  return request({
    url: `/api/v1/teacher/message/files/${fileId}`,
    method: 'delete'
  })
}

// 导出聊天记录
export const exportChatRecords = (params) => {
  return request({
    url: '/api/v1/teacher/message/export',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

// 详细对比接口
export const compareReport = (reportId, sourceId) => {
  return request({
    url: '/api/v1/teacher/reports/compare',
    method: 'get',
    params: {
      reportId,
      sourceId
    }
  })
}

// ── 审核草稿 ──

// 保存审核草稿
export const saveReviewDraft = (data) => {
  return request({
    url: '/api/v1/teacher/review-drafts/save',
    method: 'post',
    data
  })
}

// 获取审核草稿
export const getReviewDraft = (params) => {
  return request({
    url: '/api/v1/teacher/review-drafts/get',
    method: 'get',
    params
  })
}

// 删除审核草稿
export const deleteReviewDraft = (params) => {
  return request({
    url: '/api/v1/teacher/review-drafts/delete',
    method: 'delete',
    params
  })
}

// 获取审核草稿列表
export const getReviewDraftList = (params) => {
  return request({
    url: '/api/v1/teacher/review-drafts/list',
    method: 'get',
    params
  })
}

// ── 教师端审核详情 ──

// 获取审核详情
export const getReviewDetail = (params) => {
  return request({
    url: '/api/v1/teacher/reviews/detail',
    method: 'get',
    params
  })
}

// 下载审核附件
export const downloadReviewAttach = (params) => {
  return request({
    url: '/api/v1/teacher/reviews/download-attach',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 审核通过
export const approveReport = (reportId, comment) => {
  return request({
    url: '/api/v1/teacher/reports/approve',
    method: 'post',
    params: {
      reportId,
      comment
    }
  })
}

// 要求修改
export const requestRevision = (reportId, comment) => {
  return request({
    url: '/api/v1/teacher/reports/revision',
    method: 'post',
    params: {
      reportId,
      comment
    }
  })
}

// 联系学生
export const contactStudentReport = (reportId, content) => {
  return request({
    url: '/api/v1/teacher/reports/contact',
    method: 'post',
    params: {
      reportId,
      content
    }
  })
}

// 相似来源详情
export const getSourceDetail = (sourceId) => {
  return request({
    url: '/api/v1/teacher/reports/source/detail',
    method: 'get',
    params: {
      sourceId
    }
  })
}

// 历史报告列表
export const getHistoryReportList = (paperId) => {
  return request({
    url: '/api/v1/teacher/reports/history',
    method: 'get',
    params: {
      paperId
    }
  })
}

// 共享文件列表
export const getSharedFiles = (sessionId) => {
  return request({
    url: '/api/v1/teacher/message/files',
    method: 'get',
    params: { sessionId },
    _skipLoginRedirect: true
  })
}

// 下载共享文件
export const downloadSharedFile = (fileId) => {
  return request({
    url: `/api/v1/teacher/message/files/${fileId}`,
    method: 'get',
    responseType: 'blob'
  })
}