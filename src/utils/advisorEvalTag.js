// P6a 导师评价标签字典（单一事实来源）
// 清单 1.3 固定字典：后端字典类型 advisor_eval_tag 的 value/label 与此保持一致，
// 前端按本地映射渲染即可（与 api/advisorEvaluation.js 头部约定同源）。
// 学生端表单选项、教师端负向标色、管理端明细标签渲染统一从这里取，禁止各处重复定义。

export const ADVISOR_EVAL_TAG_MAP = {
  reply_timely: "回复及时",
  feedback_detailed: "反馈细致",
  strict_demanding: "要求严格",
  tailored_guidance: "因材施教",
  resource_support: "资源丰富",
  guidance_lacking: "指导偏少",
  feedback_slow: "反馈较慢",
};

// 负向标签：教师端标签频次/管理端明细按 danger 色渲染
export const ADVISOR_EVAL_NEGATIVE_TAGS = ["guidance_lacking", "feedback_slow"];

// 学生端表单选项兜底（后端 /my 恒返回 tagOptions，接口异常时用本地兜底防白屏）
export const ADVISOR_EVAL_TAG_OPTIONS = Object.entries(ADVISOR_EVAL_TAG_MAP).map(
  ([value, label]) => ({ label, value })
);

export const advisorEvalTagLabel = (value) => ADVISOR_EVAL_TAG_MAP[value] || value;

export const isNegativeAdvisorEvalTag = (value) =>
  ADVISOR_EVAL_NEGATIVE_TAGS.includes(value);
