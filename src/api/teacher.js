import { da } from 'element-plus/es/locales.mjs';
import request from './request';

export const updateInfo = (data) => {
  return request({
    url: '/api/teacher/info/update',
    method: 'post',
    data: data
  });
}

export const getInfo = (userId) => {
  return request({
    url: `/api/teacher/info/get`,
    method: 'get',
    params: { userId: userId }
  });
}

export const changePassword = (data) => {
  return request({
    url: '/api/teacher/info/changePassword',
    method: 'post',
    params: data 
  });
}
 
export const getStudentList = (teacherId,current=1,pageSize=10) => {
  return request({
    url: '/api/teacher/student-list/list',
    method: 'get',
    params: { teacherId,current,pageSize }
  });
}

export const deleteStudent = (studentId) => {
  return request({
    url: '/api/teacher/student-list/delete',
    method: 'post',
    params: { studentId }
  });
}

export const getPendingReviewList =() => {
  return request({
    url: '/api/teacher/reviews/pending-list',
    method: 'get',
  });
}

export const doReview = (data) => {
  const formData = new FormData();
  // paperIds 转换为逗号分隔字符串
  if (Array.isArray(data.paperIds)) {
    formData.append('paperIds', data.paperIds.join(','));
  } else {
    formData.append('paperIds', data.paperIds);
  }
  
  // reviewStatus
  formData.append('reviewStatus', data.reviewStatus);
  
  // 可选参数
  if (data.reviewOpinion) {
    formData.append('reviewOpinion', data.reviewOpinion);
  }
  
  if (data.reviewAttach) {
    formData.append('reviewAttach', data.reviewAttach);
  }
  
  return request({
    url: '/api/teacher/reviews/do-review',
    method: 'post',
    data: formData
  });
};

export const getReviewedList =(params)=>{
  return request({
    url: '/api/teacher/reviews/reviewed-list',
    method: 'get',
    params: params
  })
}

export const getReviewStats =(teacherId, timeRange)=>{
  return request({
    url: '/api/teacher/data-analysis/review-stats',
    method: 'get',
    params: { teacherId, timeRange }
  })
}

export const getReviewTrend =(params)=> {
  return request({
    url: '/api/teacher/data-analysis/review-trend',
    method: 'get',
    params
  })
}

export const exportData =(params) =>{
  return request({
    url: '/api/teacher/data-analysis/export',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

export const getDetailData=(params) =>{
  return request({
    url: '/api/teacher/data-analysis/detail-data',
    method: 'get',
    params
  })
}

// 获取审核状态分布
export function getReviewStatusDistribution(teacherId, timeRange) {
  return request({
    url: '/api/teacher/data-analysis/review-status-distribution',
    method: 'get',
    params: { teacherId, timeRange }
  })
}

// 获取相似度分布
export function getSimilarityDistribution(teacherId, timeRange) {
  return request({
    url: '/api/teacher/data-analysis/similarity-distribution',
    method: 'get',
    params: { teacherId, timeRange }
  })
}

// 获取学院分布
export function getCollegeDistribution(teacherId, timeRange) {
  return request({
    url: '/api/teacher/data-analysis/college-distribution',
    method: 'get',
    params: { teacherId, timeRange }
  })
}

// 获取教师仪表盘统计数据
export function getTeacherDashboardStats(teacherId) {
  return request({
    url: '/api/teacher/dashboard/stats',
    method: 'get',
    params: { teacherId }
  })
}

// 获取指导学生状态统计
export function getStudentStats(teacherId) {
  return request({
    url: '/api/teacher/students/stats',
    method: 'get',
    params: { teacherId }
  })
}

// 下载论文
export function downloadPaper(paperId) {
  return request({
    url: `/api/teacher/papers/${paperId}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

// 获取近期活动记录
export function getRecentActivities(teacherId, limit = 5) {
  return request({
    url: '/api/teacher/activities/recent',
    method: 'get',
    params: { teacherId, limit }
  })
}

// 数据导出
export function exportTeacherData(params) {
  return request({
    url: '/api/teacher/export/data',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

// 获取学生列表（完整版）
export function getStudentListFull(params) {
  return request({
    url: '/api/teacher/students',
    method: 'get',
    params
  })
}

// 分配导师
export function assignAdvisor(studentId, advisorData) {
  return request({
    url: `/api/teacher/students/${studentId}/assign-advisor`,
    method: 'post',
    data: advisorData
  })
}

// 发送消息
export function sendMessage(messageData) {
  return request({
    url: '/api/messages/send',
    method: 'post',
    data: messageData
  })
}

// 批量分配导师
export function batchAssignAdvisor(data) {
  return request({
    url: '/api/teacher/students/batch-assign-advisor',
    method: 'post',
    data
  })
}

// 批量发送消息
export function batchSendMessage(data) {
  return request({
    url: '/api/teacher/messages/batch-send',
    method: 'post',
    data
  })
}

// 批量删除学生
export function batchDeleteStudents(studentIds) {
  return request({
    url: '/api/teacher/students/batch-delete',
    method: 'delete',
    data: { studentIds }
  })
}

// 数据导出
export function exportStudentData(params) {
  return request({
    url: '/api/teacher/students/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 数据导入
export function importStudentData(formData) {
  return request({
    url: '/api/teacher/students/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 添加学生
export function addStudent(studentData) {
  return request({
    url: '/api/teacher/students/add',
    method: 'post',
    data: studentData
  })
}

// 获取学院列表
export function getColleges() {
  return request({
    url: '/api/common/dict/colleges',
    method: 'get'
  })
}

// 获取专业列表
export function getMajors(collegeId) {
  return request({
    url: '/api/common/dict/majors',
    method: 'get',
    params: { collegeId }
  })
}

// 获取学生论文信息
export function getStudentPaper(studentId) {
  return request({
    url: `/api/teacher/students/${studentId}/paper`,
    method: 'get'
  })
}

// 获取待审核论文统计信息
export function getPendingStats(teacherId) {
  return request({
    url: '/api/teacher/pending-reviews/stats',
    method: 'get',
    params: { teacherId }
  })
}

// 重新查重检测
export function recheckPlagiarism(paperId) {
  return request({
    url: '/api/teacher/recheck-plagiarism',
    method: 'post',
    data: { paperId }
  })
}

// 发送提醒消息
export function sendReminder(data) {
  return request({
    url: '/api/teacher/pending-reviews/reminder',
    method: 'post',
    data
  })
}

// 联系学生
export function contactStudent(data) {
  return request({
    url: '/api/teacher/pending-reviews/contact',
    method: 'post',
    data
  })
}

// 获取查重报告
export function getPlagiarismReport(paperId) {
  return request({
    url: `/api/teacher/plagiarism-report/${paperId}`,
    method: 'get'
  })
}

// 获取今日审核统计
export function getTodayReviewedCount(teacherId) {
  return request({
    url: '/api/teacher/today-reviewed-count',
    method: 'get',
    params: { teacherId }
  })
}

// 委托审核
export function delegateReview(data) {
  return request({
    url: '/api/teacher/delegate-review',
    method: 'post',
    data
  })
}

// 获取论文原文内容
export function getPaperContent(paperId) {
  return request({
    url: `/api/teacher/pending-reviews/content/${paperId}`,
    method: 'get'
  })
}

// 获取论文在线预览URL
export function getPaperPreviewUrl(paperId) {
  return request({
    url: `/api/teacher/pending-reviews/preview/${paperId}`,
    method: 'get'
  })
}

// 获取论文审核历史
export function getReviewHistory(paperId) {
  return request({
    url: `/api/teacher/papers/${paperId}/review-history`,
    method: 'get'
  })
}

// 获取教师审核历史统计
export function getTeacherReviewHistory(teacherId, params) {
  return request({
    url: '/api/teacher/review-history',
    method: 'get',
    params: { teacherId, ...params }
  })
}

// 获取详细的查重报告
export function getDetailedPlagiarismReport(paperId) {
  return request({
    url: `/api/teacher/plagiarism-report/${paperId}/detailed`,
    method: 'get'
  })
}