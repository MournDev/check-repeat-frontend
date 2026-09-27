// 数据类型处理工具函数

/**
 * 确保值为字符串
 * @param {*} value - 输入值
 * @param {string} defaultValue - 默认值
 * @returns {string}
 */
export const ensureString = (value, defaultValue = '') => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
};

/**
 * 确保值为数字
 * @param {*} value - 输入值
 * @param {number} defaultValue - 默认值
 * @returns {number}
 */
export const ensureNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return value;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * 确保值为布尔值
 * @param {*} value - 输入值
 * @param {boolean} defaultValue - 默认值
 * @returns {boolean}
 */
export const ensureBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return defaultValue;
};

/**
 * 确保值为数组
 * @param {*} value - 输入值
 * @param {Array} defaultValue - 默认值
 * @returns {Array}
 */
export const ensureArray = (value, defaultValue = []) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

/**
 * 确保值为对象
 * @param {*} value - 输入值
 * @param {Object} defaultValue - 默认值
 * @returns {Object}
 */
export const ensureObject = (value, defaultValue = {}) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return defaultValue;
};

/**
 * 格式化日期时间
 * @param {*} date - 日期值
 * @param {string} format - 格式
 * @returns {string}
 */
export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 计算两个日期之间的天数差
 * @param {*} startDate - 开始日期
 * @param {*} endDate - 结束日期
 * @returns {number}
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * 处理相似度值，确保在合理范围内
 * @param {*} similarity - 相似度值
 * @returns {number}
 */
export const handleSimilarity = (similarity) => {
  const num = ensureNumber(similarity, 0);
  // 处理小数形式的相似度（如 0.23）
  if (num > 0 && num <= 1) {
    return Math.round(num * 100);
  }
  // 确保相似度在 0-100 之间
  return Math.max(0, Math.min(100, Math.round(num)));
};

/**
 * 获取相似度颜色
 * @param {number} similarity - 相似度值
 * @returns {string}
 */
export const getSimilarityColor = (similarity) => {
  const sim = handleSimilarity(similarity);
  if (sim < 15) return '#67c23a';  // 绿色 - 优秀
  if (sim < 30) return '#e6a23c';  // 黄色 - 良好
  return '#f56c6c';  // 红色 - 需关注
};

/**
 * 获取相似度状态文本
 * @param {number} similarity - 相似度值
 * @returns {string}
 */
export const getSimilarityStatus = (similarity) => {
  const sim = handleSimilarity(similarity);
  if (sim === 0) return '未检测';
  if (sim < 15) return '优秀';
  if (sim < 30) return '良好';
  return '需修改';
};

/**
 * 获取论文状态文本
 * @param {string} status - 状态码
 * @returns {string}
 */
export const getPaperStatusText = (status) => {
  const statusMap = {
    'pending': '待分配',
    'assigned': '已分配',
    'checking': '待查重',
    'auditing': '待审核',
    'completed': '审核通过',
    'rejected': '审核不通过',
    'withdrawn': '已取消'
  };
  return statusMap[status] || '未知状态';
};

/**
 * 获取论文状态类型
 * @param {string} status - 状态码
 * @returns {string}
 */
export const getPaperStatusType = (status) => {
  const typeMap = {
    'pending': 'info',
    'assigned': 'primary',
    'checking': 'primary',
    'auditing': 'warning',
    'completed': 'success',
    'rejected': 'danger',
    'withdrawn': 'info'
  };
  return typeMap[status] || 'info';
};
