// ============================================================
// 查重任务状态字典（SSOT）
// ------------------------------------------------------------
// 对应后端 check_task.check_status：pending / checking / completed /
// failure / cancelled。注意它与 PaperStatusEnum（reviewStatus.js）不同：
// 论文状态含 rejected/revision_needed，查重任务状态是执行态。
// 页面禁止再各自维护「待处理/排队中/处理中」等词表。
// ============================================================

export const CHECK_STATUS = {
  PENDING: 'pending',
  CHECKING: 'checking',
  COMPLETED: 'completed',
  FAILURE: 'failure',
  CANCELLED: 'cancelled',
}

export const CHECK_STATUS_META = {
  pending: { label: '待查重', type: 'info', message: '准备开始查重检测...' },
  checking: { label: '查重中', type: 'warning', message: '正在进行查重检测...' },
  completed: { label: '已完成', type: 'success', message: '查重检测已完成' },
  failure: { label: '失败', type: 'danger', message: '查重检测失败' },
  cancelled: { label: '已取消', type: 'info', message: '查重检测已取消' },
}

// 兼容历史/第三方推送里的别名取值（页面旧代码用过 processing / failed）
const CHECK_STATUS_ALIASES = {
  processing: 'checking',
  failed: 'failure',
  success: 'completed',
}

export const normalizeCheckStatus = (status) => {
  const key = String(status || '').toLowerCase()
  return CHECK_STATUS_ALIASES[key] || key
}

export const getCheckStatusText = (status, fallback = '未知状态') => {
  return CHECK_STATUS_META[normalizeCheckStatus(status)]?.label || fallback
}

export const getCheckStatusType = (status) => {
  return CHECK_STATUS_META[normalizeCheckStatus(status)]?.type || 'info'
}

export const getCheckStatusMessage = (status) => {
  return CHECK_STATUS_META[normalizeCheckStatus(status)]?.message || '未知状态'
}
