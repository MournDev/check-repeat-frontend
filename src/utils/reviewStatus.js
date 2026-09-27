/**
 * 审核状态统一处理工具
 * 与后端 PaperStatusEnum 保持一致
 */

// 状态常量定义（与后端 PaperStatusEnum 保持一致）
export const PAPER_STATUS = {
  PENDING: 'pending',      // 待分配
  ASSIGNED: 'assigned',    // 已分配
  CHECKING: 'checking',    // 待查重
  AUDITING: 'auditing',    // 待审核
  COMPLETED: 'completed',  // 审核通过
  REJECTED: 'rejected',    // 审核不通过
  REVISION_NEEDED: 'revision_needed', // 需要修改
  WITHDRAWN: 'withdrawn'   // 已取消
}

// 审核操作状态
export const REVIEW_OPERATION = {
  PASS: 'completed',         // 审核通过
  REVISION_NEEDED: 'revision_needed', // 需要修改
  REJECT: 'rejected'         // 审核不通过
}

// 状态文本映射
export const getStatusText = (status) => {
  const textMap = {
    [PAPER_STATUS.PENDING]: '待分配',
    [PAPER_STATUS.ASSIGNED]: '已分配',
    [PAPER_STATUS.CHECKING]: '待查重',
    [PAPER_STATUS.AUDITING]: '待审核',
    [PAPER_STATUS.COMPLETED]: '审核通过',
    [PAPER_STATUS.REJECTED]: '审核不通过',
    [PAPER_STATUS.REVISION_NEEDED]: '需要修改',
    [PAPER_STATUS.WITHDRAWN]: '已取消',
  }

  return textMap[status] || '未知状态'
}

// 状态标签类型映射
export const getStatusType = (status) => {
  const typeMap = {
    [PAPER_STATUS.PENDING]: 'info',
    [PAPER_STATUS.ASSIGNED]: 'info',
    [PAPER_STATUS.CHECKING]: 'warning',
    [PAPER_STATUS.AUDITING]: 'warning',
    [PAPER_STATUS.COMPLETED]: 'success',
    [PAPER_STATUS.REJECTED]: 'danger',
    [PAPER_STATUS.REVISION_NEEDED]: 'warning',
    [PAPER_STATUS.WITHDRAWN]: 'info',
  }

  return typeMap[status] || 'info'
}

// 将前端操作状态转换为后端状态值
export const convertToBackendStatus = (frontendStatus) => {
  // 处理各种前端可能的状态表示
  const statusMap = {
    'PASS': REVIEW_OPERATION.PASS,
    'pass': REVIEW_OPERATION.PASS,
    '通过': REVIEW_OPERATION.PASS,
    'approved': REVIEW_OPERATION.PASS,
    'REJECT': REVIEW_OPERATION.REJECT,
    'reject': REVIEW_OPERATION.REJECT,
    '未通过': REVIEW_OPERATION.REJECT,
    'rejected': REVIEW_OPERATION.REJECT,
    'MODIFY': REVIEW_OPERATION.REVISION_NEEDED,
    'modify': REVIEW_OPERATION.REVISION_NEEDED,
    '需要修改': REVIEW_OPERATION.REVISION_NEEDED,
    'revision_needed': REVIEW_OPERATION.REVISION_NEEDED,
    'DEFER': REVIEW_OPERATION.REVISION_NEEDED,
    'defer': REVIEW_OPERATION.REVISION_NEEDED,
    '暂缓审核': REVIEW_OPERATION.REVISION_NEEDED
  }

  return statusMap[frontendStatus] || REVIEW_OPERATION.REJECT // 默认未通过
}

// 验证状态是否有效
export const isValidReviewStatus = (status) => {
  const validStatuses = [REVIEW_OPERATION.PASS, REVIEW_OPERATION.REVISION_NEEDED, REVIEW_OPERATION.REJECT]
  return validStatuses.includes(status)
}

// 相似度颜色映射
export const getSimilarityColor = (similarity) => {
  if (!similarity) return '#909399'
  if (similarity < 15) return '#52c41a'
  if (similarity < 30) return '#faad14'
  return '#ff4d4f'
}

// 相似度CSS类名映射
export const getSimilarityClass = (similarity) => {
  if (similarity < 15) return 'similarity-low'
  if (similarity < 30) return 'similarity-medium'
  return 'similarity-high'
}

// 相似度Element标签类型映射
export const getSimilarityTagType = (similarity) => {
  if (similarity < 15) return 'success'
  if (similarity < 30) return 'warning'
  return 'danger'
}

export default {
  PAPER_STATUS,
  REVIEW_OPERATION,
  getStatusText,
  getStatusType,
  convertToBackendStatus,
  isValidReviewStatus,
  getSimilarityClass,
  getSimilarityColor,
  getSimilarityTagType
}