// ============================================================
// 重复率语义（SSOT）
// ------------------------------------------------------------
// 全站只有这一处定义重复率分档、文案、标签类型与颜色：
//   low     < 15%   低重复（绿）
//   medium  15–30%  中等重复（橙）
//   high    ≥ 30%   高重复（红）
//   unknown 空值    未检测（灰）
// 颜色值与 design-tokens.scss 的 --apple-rate-* 保持一致；
// JS 场景（el-progress :color、内联样式）无法读取 CSS 变量，
// 因此在这里以常量镜像一份，改色时两处同步。
// 需要按业务自定义阈值的页面（如论文库 20/50）传入 thresholds 覆盖，
// 但颜色语义仍走同一套 low/medium/high。
// ============================================================

export const SIMILARITY_THRESHOLDS = {
  low: 15,
  medium: 30,
}

const LEVEL_META = {
  unknown: {
    label: '未检测',
    className: 'similarity-unknown',
    tagType: 'info',
    color: '#8e8e93',
  },
  low: {
    label: '低重复',
    className: 'similarity-low',
    tagType: 'success',
    color: '#34c759',
  },
  medium: {
    label: '中等重复',
    className: 'similarity-medium',
    tagType: 'warning',
    color: '#ff9500',
  },
  high: {
    label: '高重复',
    className: 'similarity-high',
    tagType: 'danger',
    color: '#ff3b30',
  },
}

// 兼容 0–1 小数与 0–100 百分数；空值返回 null（不等于 0）
export const normalizeSimilarity = (value) => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (Number.isNaN(num)) return null
  const percent = num > 0 && num <= 1 ? num * 100 : num
  return Math.max(0, Math.min(100, Math.round(percent)))
}

export const getSimilarityLevel = (value, thresholds = SIMILARITY_THRESHOLDS) => {
  const sim = normalizeSimilarity(value)
  if (sim === null) return 'unknown'
  if (sim < thresholds.low) return 'low'
  if (sim < thresholds.medium) return 'medium'
  return 'high'
}

const metaOf = (value, thresholds) => LEVEL_META[getSimilarityLevel(value, thresholds)]

export const getSimilarityLabel = (value, thresholds) => metaOf(value, thresholds).label
export const getSimilarityClass = (value, thresholds) => metaOf(value, thresholds).className
export const getSimilarityTagType = (value, thresholds) => metaOf(value, thresholds).tagType
export const getSimilarityColor = (value, thresholds) => metaOf(value, thresholds).color
