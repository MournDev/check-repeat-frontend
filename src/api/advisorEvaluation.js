// P6a（学生对导师评价）接口统一封装
// 清单来源：P6a 前端配合清单
// 约定：
// - 雪花 ID（paperId/评价 id/teacherId/studentId/collegeId）一律按字符串接收与回传
// - 40917/40918/40919 业务错误码按后端 message 精确提示（见清单 1.1）
// - 标签字典 advisor_eval_tag 的 value/label 在清单 1.3 已固定，前端本地映射即可
import request from "./request";

// ──────────────────────────── 学生端 ────────────────────────────

// 查询当前论文的导师评价状态（paperId 可空，空则取本人最新一篇论文）
// 返回 AdvisorEvalStatusVO（evaluable/submitted/五维分数/tags/comment/submitTime/tagOptions）
export const getMyAdvisorEvaluation = (paperId) => {
  return request({
    url: "/api/student/advisor-evaluation/my",
    method: "get",
    params: paperId ? { paperId: String(paperId) } : {},
  });
};

// 提交导师评价（提交后不可修改；重复提交返回 40918）
// data: { paperId: string, scoreTimeliness/scoreQuality/scoreAttitude/scoreProfessional/scoreOverall: 1-5,
//         tags?: string[], comment?: string }
export const submitAdvisorEvaluation = (data) => {
  return request({
    url: "/api/student/advisor-evaluation",
    method: "post",
    data,
  });
};

// ──────────────────────────── 教师端 ────────────────────────────

// 学生评价汇总（仅聚合，匿名保护）
// masked=true 时分数与 tagStats 为 null/空属正常，不是接口异常
export const getAdvisorEvalSummary = () => {
  return request({
    url: "/api/teacher/advisor-evaluation/summary",
    method: "get",
  });
};

// ──────────────────────────── 管理端（ADMIN） ────────────────────────────

// 评价实名分页（MyBatis-Plus Page 结构 records/total/size/current）
// params: { pageNum: number, pageSize: number, teacherId?: string, collegeId?: string,
//           minOverall?: number, maxOverall?: number }
export const getAdvisorEvalPage = (params) => {
  return request({
    url: "/api/admin/advisor-evaluation/page",
    method: "get",
    params,
  });
};

// 评价统计（完成率/导师排行/学院对比/低分预警）
export const getAdvisorEvalStats = () => {
  return request({
    url: "/api/admin/advisor-evaluation/stats",
    method: "get",
  });
};

// 导师评价明细导出（xlsx，单 sheet「导师评价明细」）
export const exportAdvisorEval = () => {
  return request({
    url: "/api/admin/advisor-evaluation/export",
    method: "get",
    responseType: "blob",
  });
};
