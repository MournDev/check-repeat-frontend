import request from '../request'

export const triggerBackup = () => {
  return request({
    url: '/api/v1/admin/backup/trigger',
    method: 'post'
  })
}

export const getBackupHistory = (params) => {
  return request({
    url: '/api/v1/admin/backup/history',
    method: 'get',
    params
  })
}

export const getLastBackup = () => {
  return request({
    url: '/api/v1/admin/backup/last',
    method: 'get'
  })
}

export const getBackupStatus = () => {
  return request({
    url: '/api/v1/admin/backup/status',
    method: 'get'
  })
}

export const getBackupSettings = () => {
  return request({
    url: '/api/v1/admin/backup/settings',
    method: 'get'
  })
}

export const updateBackupSettings = (data) => {
  return request({
    url: '/api/v1/admin/backup/settings',
    method: 'put',
    data
  })
}