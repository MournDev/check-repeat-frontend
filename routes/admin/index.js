/**
 * 管理员配置接口主路由文件
 * 文件路径: routes/admin/index.js
 */

const express = require('express');
const router = express.Router();

// 导入各个子路由
const configRouter = require('./config');

// 挂载子路由
router.use('/', configRouter);

// 根路径欢迎信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '管理员配置接口服务正常运行',
    version: '1.0.0',
    endpoints: {
      'GET /config/performance': '获取性能配置',
      'PUT /config/performance': '更新性能配置',
      'GET /config/system': '获取系统配置',
      'PUT /config/basic': '更新基础配置',
      'PUT /config/plagiarism': '更新查重配置',
      'PUT /config/security': '更新安全配置',
      'PUT /config/email': '更新邮件配置'
    }
  });
});

module.exports = router;