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
  pending: { label: '待查重', type: 'info' },
  checking: { label: '查重中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  failure: { label: '失败', type: 'danger' },
  cancelled: { label: '已取消', type: 'info' },
}

export const getCheckStatusText = (status, fallback = '未知状态') => {
  const key = String(status || '').toLowerCase()
  return CHECK_STATUS_META[key]?.label || fallback
}

export const getCheckStatusType = (status) => {
  const key = String(status || '').toLowerCase()
  return CHECK_STATUS_META[key]?.type || 'info'
}
