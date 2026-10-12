// P5（引擎底座夯实 + 四角色端升级）新增接口统一封装
// 清单来源：.trae/documents/p5-frontend-checklist.md
// 约定：
// - 雪花 ID（taskId/paperId/策略 id/collegeId）一律按字符串接收与回传
// - 40912~40916 业务错误码由调用方按 message 精确提示（见清单 1.2）
// - 存量任务 maxPerSource/citationRate 可能为 null，前端展示「—」不按 0 处理
import request from "./request";

// ──────────────────────────── 学生端 ────────────────────────────

// 句级检测明细（论文属主本人 / ADMIN / SUPER_ADMIN）
// 存量任务返回空 items 属正常空态，不是错误
export const getSentenceDetail = (taskId) => {
  return request({
    url: `/api/papers/check-tasks/${taskId}/sentence-detail`,
    method: "get",
  });
};

// P5 重复率趋势（注意与 student.js 里旧的 /api/student/papers/{id}/similarity-trend
// 不是同一个接口：本接口无 period 参数，返回 {taskId,checkTime,repeatRate,maxPerSource,citationRate}[]）
export const getPaperSimilarityTrend = (paperId) => {
  return request({
    url: `/api/papers/${paperId}/similarity-trend`,
    method: "get",
  });
};

// ──────────────────────────── 教师端 ────────────────────────────

// 查重报告签核（TEACHER 且必须是论文 teacher_id 本人）
// data: { qualified: 1|0, guidanceScore: 0~100（不合格也必填）, comment?: ≤500字 }
// 重复签核返回 40913
export const signoffCheckReport = (paperId, data) => {
  return request({
    url: `/api/teacher/papers/${paperId}/check-signoff`,
    method: "post",
    data,
  });
};

// 指导进度看板
export const getGuidanceProgress = () => {
  return request({
    url: "/api/teacher/dashboard/guidance-progress",
    method: "get",
  });
};

// ──────────────────────────── 管理端（ADMIN） ────────────────────────────

// 全校统计报表：查重结果分布（固定 10 桶，缺失桶已补 0）
export const getSimilarityDistribution = () => {
  return request({
    url: "/api/admin/stat-report/similarity-distribution",
    method: "get",
  });
};

// 全校统计报表：学院对比（collegeId 为 null 的行 collegeName=「未分配」）
export const getCollegeCompare = () => {
  return request({
    url: "/api/admin/stat-report/college-compare",
    method: "get",
  });
};

// 全校统计报表：月度趋势（最近 12 个月，升序）
export const getMonthlyTrend = () => {
  return request({
    url: "/api/admin/stat-report/monthly-trend",
    method: "get",
  });
};

// 全校统计报表导出（xlsx，含分布/学院对比/月度趋势三个 sheet）
export const exportStatReport = () => {
  return request({
    url: "/api/admin/stat-report/export",
    method: "get",
    responseType: "blob",
  });
};

// 学院月度查重额度列表（MyBatis-Plus Page 结构 records/total/size/current）
// 必须显式传 currentPage/pageSize（既往踩坑：缺分页参数直接报错）
// params: { quotaMonth?: "yyyy-MM", currentPage: number, pageSize: number }
export const getCheckQuotaList = (params) => {
  return request({
    url: "/api/admin/config/check-quota/list",
    method: "get",
    params,
  });
};

// 学院月度查重额度保存（同学院同月份 upsert 覆盖）
// data: { collegeId: string, totalQuota: number(≥0), quotaMonth?: "yyyy-MM"（缺省当前月） }
export const saveCheckQuota = (data) => {
  return request({
    url: "/api/admin/config/check-quota/save",
    method: "post",
    data,
  });
};

// 总评成绩重算（兜底入口）
// 成功返回新总评成绩 number；40914=缺指导分（导师未签核），40915=权重合计≠100
export const recomputeFinalScore = (paperId) => {
  return request({
    url: `/api/admin/thesis/${paperId}/recompute-score`,
    method: "post",
  });
};

// ──────────────────────────── 超管端（SUPER_ADMIN） ────────────────────────────

// 学位检测策略集列表（按 degreeType 升序；仅 SUPER_ADMIN，ADMIN 调用 403）
export const getCheckPolicyList = () => {
  return request({
    url: "/api/super/check-policy/list",
    method: "get",
  });
};

// 学位检测策略保存（按 degreeType upsert，同学位类型再保存即覆盖）
// data: { degreeType, threshold: 0-100, maxPerSource: 0-100,
//         maxCheckCount?: number|null（null=沿用全局）, checkInterval?: number|null（≥0）, enabled: 0|1 }
export const saveCheckPolicy = (data) => {
  return request({
    url: "/api/super/check-policy/save",
    method: "post",
    data,
  });
};

// 学位检测策略删除（删除/停用后回落到既有阈值链路：学科>学院>全局，删除安全）
export const deleteCheckPolicy = (id) => {
  return request({
    url: `/api/super/check-policy/${id}`,
    method: "delete",
  });
};

// 审计日志汇总视图（仅 SUPER_ADMIN）
// params: { beginDate?: "yyyy-MM-dd"（含）, endDate?: "yyyy-MM-dd"（含） }
// 返回 { operationTypes: [{key,count}], userTypes: [{key,count}] }
export const getOperationLogSummary = (params) => {
  return request({
    url: "/api/admin/operation-logs/summary",
    method: "get",
    params,
  });
};

// ──────────────────────────── 公开验真（无需登录） ────────────────────────────

// 报告验真（任何访客可调用，不携带 Authorization 头——访客无 token cookie，
// 共享 request 封装自然不会带头；登录用户访问时带头也无副作用）
// 限流：同 IP 60 次/小时，超出 code=500 + message「验真请求过于频繁，请 1 小时后再试」
// silent：限流/验真失败信息由页面自行渲染三态结果卡，不走全局红条
export const verifyReport = (reportNo) => {
  return request({
    url: `/api/report/verify/${reportNo}`,
    method: "get",
    silent: true,
  });
};
