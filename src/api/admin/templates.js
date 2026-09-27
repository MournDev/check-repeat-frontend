import request from '../request'

// 获取模板列表
export const getTemplateList = (params) => {
  return request({
    url: '/api/v1/message-templates/list',
    method: 'get',
    params
  })
}

// 按编码查询模板
export const getTemplateByCode = (templateCode) => {
  return request({
    url: `/api/v1/message-templates/code/${templateCode}`,
    method: 'get'
  })
}

// 按类型查询模板
export const getTemplatesByType = (templateType) => {
  return request({
    url: `/api/v1/message-templates/type/${templateType}`,
    method: 'get'
  })
}

// 创建模板
export const createTemplate = (data) => {
  return request({
    url: '/api/v1/message-templates/create',
    method: 'post',
    data
  })
}

// 更新模板
export const updateTemplate = (data) => {
  return request({
    url: '/api/v1/message-templates/update',
    method: 'put',
    data
  })
}

// 删除模板
export const deleteTemplate = (id) => {
  return request({
    url: `/api/v1/message-templates/delete/${id}`,
    method: 'delete'
  })
}

// 启用/禁用模板
export const toggleTemplateStatus = (id, isActive) => {
  return request({
    url: `/api/v1/message-templates/status/${id}`,
    method: 'put',
    params: { isActive }
  })
}

// 渲染模板
export const renderTemplate = (templateCode, variables) => {
  return request({
    url: `/api/v1/message-templates/render/${templateCode}`,
    method: 'post',
    data: variables
  })
}
