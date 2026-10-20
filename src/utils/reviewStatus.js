/**
 * 论文状态 / 审核结果统一字典（前端唯一事实来源）
 *
 * 三个概念不要混用：
 * 1. 论文状态 paper_status：字符串，取值见 DB 字典 paper_status（13 个阶段门值）
 * 2. 审核结果 review_status：整数 3=通过，4=不通过（review_record / do-review 接口）
 * 3. 审核弹窗的操作项只存在于 UI 层，提交前必须经 convertToBackendStatus 转成 3/4
 *
 * 页面不要再各自维护「初审通过 / 已定稿 / 审核驳回」之类的第二套文案，
 * 需要展示时统一调用本文件的 getStatusText / getStatusType / getReviewResultXxx。
 */

// ── 论文状态 ────────────────────────────────────────────────
export const PAPER_STATUS = {
  PENDING: 'pending',                 // 待分配
  ASSIGNED: 'assigned',               // 已分配
  CHECKING: 'checking',               // 待查重
  AUDITING: 'auditing',               // 待审核（导师初审）
  COMPLETED: 'completed',             // 审核通过（语义收窄为初审通过）
  REJECTED: 'rejected',               // 审核不通过
  WITHDRAWN: 'withdrawn',             // 已取消
  REVIEWING: 'reviewing',             // 评阅中
  MID_DEFENSE: 'mid_defense',         // 中期答辩
  FINAL_DEFENSE: 'final_defense',     // 终期答辩
  DEFENSE_PASSED: 'defense_passed',   // 答辩通过
  FINALIZED: 'finalized',             // 定稿
  ARCHIVED: 'archived',               // 已归档
  REVISION_NEEDED: 'revision_needed'  // 需要修改（存量值，不在 paper_status 字典内）
}

// 文案与标签色：与种子数据 sys_dict_data.paper_status 保持一致
export const PAPER_STATUS_META = {
  [PAPER_STATUS.PENDING]: { label: '待分配', tagType: 'info' },
  [PAPER_STATUS.ASSIGNED]: { label: '已分配', tagType: 'info' },
  [PAPER_STATUS.CHECKING]: { label: '待查重', tagType: 'warning' },
  [PAPER_STATUS.AUDITING]: { label: '待审核', tagType: 'warning' },
  [PAPER_STATUS.COMPLETED]: { label: '审核通过', tagType: 'success' },
  [PAPER_STATUS.REJECTED]: { label: '审核不通过', tagType: 'danger' },
  [PAPER_STATUS.WITHDRAWN]: { label: '已取消', tagType: 'info' },
  [PAPER_STATUS.REVIEWING]: { label: '评阅中', tagType: 'primary' },
  [PAPER_STATUS.MID_DEFENSE]: { label: '中期答辩', tagType: 'warning' },
  [PAPER_STATUS.FINAL_DEFENSE]: { label: '终期答辩', tagType: 'warning' },
  [PAPER_STATUS.DEFENSE_PASSED]: { label: '答辩通过', tagType: 'success' },
  [PAPER_STATUS.FINALIZED]: { label: '定稿', tagType: 'success' },
  [PAPER_STATUS.ARCHIVED]: { label: '已归档', tagType: 'info' },
  // 存量/历史值：只做展示兜底，不再写入
  [PAPER_STATUS.REVISION_NEEDED]: { label: '需要修改', tagType: 'warning' },
  need_revision: { label: '需要修改', tagType: 'warning' },
  draft: { label: '草稿', tagType: 'info' },
  submitted: { label: '已提交', tagType: 'info' },
  reviewed: { label: '已审核', tagType: 'warning' },
  revised: { label: '需要修改', tagType: 'warning' },
  not_submitted: { label: '未提交', tagType: 'info' }
}

export const getStatusText = (status, fallback = '未知状态') => {
  return PAPER_STATUS_META[status]?.label || fallback
}

export const getStatusType = (status) => {
  return PAPER_STATUS_META[status]?.tagType || 'info'
}

// ── 审核结果（review_record.review_status / do-review.reviewStatus）──
export const REVIEW_RESULT = {
  PASS: 3,    // 审核通过
  REJECT: 4   // 审核不通过（退回修改）
}

export const REVIEW_RESULT_META = {
  [REVIEW_RESULT.PASS]: { label: '审核通过', tagType: 'success', className: 'success' },
  [REVIEW_RESULT.REJECT]: { label: '审核不通过', tagType: 'danger', className: 'danger' }
}

export const getReviewResultText = (status, fallback = '审核记录') => {
  return REVIEW_RESULT_META[Number(status)]?.label || fallback
}

export const getReviewResultTagType = (status) => {
  return REVIEW_RESULT_META[Number(status)]?.tagType || 'info'
}

export const getReviewResultClass = (status) => {
  return REVIEW_RESULT_META[Number(status)]?.className || 'neutral'
}

// 兼容旧导入名：审核操作常量现在直接对应后端整数
export const REVIEW_OPERATION = {
  PASS: REVIEW_RESULT.PASS,
  REJECT: REVIEW_RESULT.REJECT
}

/**
 * 把审核弹窗里的操作项转成后端 reviewStatus。
 * do-review 只接受 3（通过）/ 4（不通过），需要修改、暂缓等一律按退回处理。
 */
export const convertToBackendStatus = (frontendStatus) => {
  const passValues = ['PASS', 'pass', '通过', '审核通过', 'approved', 'completed', 3, '3']
  return passValues.includes(frontendStatus) ? REVIEW_RESULT.PASS : REVIEW_RESULT.REJECT
}

export const isValidReviewStatus = (status) => {
  return [REVIEW_RESULT.PASS, REVIEW_RESULT.REJECT].includes(Number(status))
}

// ── 相似度 ─────────────────────────────────────────────────
// Apple 语义色板，与 --apple-success/warning/danger 对齐；供 el-progress :color 等 JS 场景使用
export const getSimilarityColor = (similarity) => {
  if (!similarity) return '#8e8e93'
  if (similarity < 15) return '#34c759'
  if (similarity < 30) return '#ff9500'
  return '#ff3b30'
}

export const getSimilarityClass = (similarity) => {
  if (similarity < 15) return 'similarity-low'
  if (similarity < 30) return 'similarity-medium'
  return 'similarity-high'
}

export const getSimilarityTagType = (similarity) => {
  if (similarity < 15) return 'success'
  if (similarity < 30) return 'warning'
  return 'danger'
}

export default {
  PAPER_STATUS,
  PAPER_STATUS_META,
  REVIEW_RESULT,
  REVIEW_RESULT_META,
  REVIEW_OPERATION,
  getStatusText,
  getStatusType,
  getReviewResultText,
  getReviewResultTagType,
  getReviewResultClass,
  convertToBackendStatus,
  isValidReviewStatus,
  getSimilarityClass,
  getSimilarityColor,
  getSimilarityTagType
}
