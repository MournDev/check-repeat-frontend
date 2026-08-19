/**
 * 审核状态统一处理工具
 * 后端只支持两种状态：审核通过(3) 或 未通过(4)
 */

// 状态常量定义
export const REVIEW_STATUS = {
  PASS: 3,      // 审核通过
  REJECT: 4     // 未通过
}

// 状态文本映射
export const getStatusText = (status) => {
  // 统一处理各种可能的状态值
  const statusValue = typeof status === 'string' ? parseInt(status) : status
  
  const textMap = {
    [REVIEW_STATUS.PASS]: '审核通过',
    [REVIEW_STATUS.REJECT]: '未通过',
    // 兼容旧的状态值
    'approved': '审核通过',
    'rejected': '未通过',
    'pass': '审核通过',
    'reject': '未通过',
    '通过': '审核通过',
    '驳回': '未通过'
  }
  
  return textMap[statusValue] || textMap[status] || '未知状态'
}

// 状态标签类型映射
export const getStatusType = (status) => {
  // 统一处理各种可能的状态值
  const statusValue = typeof status === 'string' ? parseInt(status) : status
  
  const typeMap = {
    [REVIEW_STATUS.PASS]: 'success',
    [REVIEW_STATUS.REJECT]: 'danger',
    // 兼容旧的状态值
    'approved': 'success',
    'rejected': 'danger',
    'pass': 'success',
    'reject': 'danger'
  }
  
  return typeMap[statusValue] || typeMap[status] || 'info'
}

// 将前端状态转换为后端期望的整型值
export const convertToBackendStatus = (frontendStatus) => {
  // 如果已经是后端格式，直接返回
  if (frontendStatus === REVIEW_STATUS.PASS || frontendStatus === REVIEW_STATUS.REJECT) {
    return frontendStatus
  }
  
  // 处理各种前端可能的状态表示
  const statusMap = {
    'PASS': REVIEW_STATUS.PASS,
    'pass': REVIEW_STATUS.PASS,
    '通过': REVIEW_STATUS.PASS,
    'approved': REVIEW_STATUS.PASS,
    'REJECT': REVIEW_STATUS.REJECT,
    'reject': REVIEW_STATUS.REJECT,
    '未通过': REVIEW_STATUS.REJECT,
    'rejected': REVIEW_STATUS.REJECT
  }
  
  return statusMap[frontendStatus] || REVIEW_STATUS.REJECT // 默认未通过
}

// 验证状态是否有效
export const isValidReviewStatus = (status) => {
  const validStatuses = [REVIEW_STATUS.PASS, REVIEW_STATUS.REJECT]
  const statusValue = typeof status === 'string' ? parseInt(status) : status
  return validStatuses.includes(statusValue)
}

export default {
  REVIEW_STATUS,
  getStatusText,
  getStatusType,
  convertToBackendStatus,
  isValidReviewStatus
}