import request from '../request'

// 获取系统运行状态（公开端点：维护模式状态与公告文案，所有用户可读）
export const getSystemStatus = () => {
  return request({
    url: '/api/system/status',
    method: 'get'
  })
}

// 更新维护模式（仅超级管理员）：开启/关闭维护、设置维护公告与起止时间
export const updateMaintenance = (data) => {
  return request({
    url: '/api/admin/system/maintenance',
    method: 'put',
    data
  })
}
