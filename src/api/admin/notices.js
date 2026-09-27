import request from '../request'

// 获取通知列表
export const getNoticeList = (params) => {
  return request({
    url: '/api/v1/notices/list',
    method: 'get',
    params
  })
}

// 获取未读通知数量
export const getUnreadCount = () => {
  return request({
    url: '/api/v1/notices/unread-count',
    method: 'get'
  })
}

// 按优先级获取未读通知数量
export const getUnreadCountByPriority = () => {
  return request({
    url: '/api/v1/notices/unread-count-by-priority',
    method: 'get'
  })
}

// 标记通知已读
export const markAsRead = (noticeId) => {
  return request({
    url: `/api/v1/notices/read/${noticeId}`,
    method: 'put'
  })
}

// 批量标记已读
export const batchMarkAsRead = (noticeIds) => {
  return request({
    url: '/api/v1/notices/batch-read',
    method: 'put',
    data: noticeIds
  })
}

// 全部标记已读
export const markAllAsRead = () => {
  return request({
    url: '/api/v1/notices/read-all',
    method: 'put'
  })
}

// 删除通知
export const deleteNotice = (noticeId) => {
  return request({
    url: `/api/v1/notices/delete/${noticeId}`,
    method: 'delete'
  })
}

// 批量删除通知
export const batchDeleteNotice = (noticeIds) => {
  return request({
    url: '/api/v1/notices/batch-delete',
    method: 'delete',
    data: noticeIds
  })
}

// 清空所有通知
export const clearAllNotice = () => {
  return request({
    url: '/api/v1/notices/clear-all',
    method: 'delete'
  })
}

// 获取最新通知
export const getLatestNotice = (limit = 5) => {
  return request({
    url: '/api/v1/notices/latest',
    method: 'get',
    params: { limit }
  })
}

// 获取通知统计
export const getNoticeStats = () => {
  return request({
    url: '/api/v1/notices/stats',
    method: 'get'
  })
}

// 发送测试通知
export const sendTestNotice = () => {
  return request({
    url: '/api/v1/notices/test',
    method: 'post'
  })
}

// 发送带优先级测试通知
export const sendTestNoticeWithPriority = () => {
  return request({
    url: '/api/v1/notices/test-priority',
    method: 'post'
  })
}
