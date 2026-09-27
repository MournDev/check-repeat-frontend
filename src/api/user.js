import request from './request'

// 获取当前登录用户的完整信息（含 email/phone 等敏感字段）
export const getCurrentUserInfo = () => {
  return request({
    url: '/api/v1/user/info/get',
    method: 'get'
  })
}

export const updateUserInfo = (data) => {
  return request({
    url: '/api/v1/user/info/update-info',
    method: 'post',
    data: data
  })
}

export const uploadAvatar = (formData) => {
  return request({
    url: '/api/v1/user/info/upload-avatar',
    method: 'post',
    data: formData,
  })
}

export const updatePassword = (data) => {
  return request({
    url: '/api/v1/user/info/update-password',
    method: 'put',
    data: data
  })
}

// 验证邮箱
export const verifyEmail = (token) => {
  return request({
    url: '/api/v1/user/info/verify-email',
    method: 'get',
    params: { token }
  });
}

// 获取所有学院
export const getAllColleges = () => {
  return request({
    url: '/api/v1/common/dict/colleges',
    method: 'get'
  });
}

// 获取对应学院下的专业
export const getMajorsByCollegeId = (params) => {
  return request({
    url: '/api/v1/common/dict/majors',
    method: 'get',
    params: params
  });
}

// 根据字典类型获取字典数据
export const getDictDataByType = (dictType) => {
  return request({
    url: `/api/v1/dict/data/type/${dictType}`,
    method: 'get',
  });
};

export const getSubjectFieldTree = (subjectField) => {
  return request({
    url: `/api/v1/dict/subject/tree`,
    method: 'get'
  })
};

// 发送邮箱验证邮件
export const sendVerifyEmail = (params) => {
  return request({
    url: '/api/v1/user/info/send-verify-email',
    method: 'post',
    params: params
  });
}

// 发送邮箱验证码
export const sendEmailCode = (data) => {
  return request({
    url: '/api/v1/user/info/send-email-code',
    method: 'post',
    params: {
      email: data.email
    }
  });
}

// 更新邮箱
export const updateUserEmail = (data) => {
  return request({
    url: '/api/v1/user/info/update-email',
    method: 'post',
    data
  });
}

export const getLoginHistory = (params) => {
  return request({
    url: '/api/v1/user/info/login-history',
    method: 'post',
    data: params
  })
}

// 获取未读消息数量
export const getUnreadCount = (userId) => {
  return request({
    url: '/api/v1/message/unread-count',
    method: 'get',
    params: {
      userId: userId
    }
  })
}

// 获取消息列表
export const getMessageList = (params) => {
  return request({
    url: '/api/v1/message/list',
    method: 'get',
    params: params
  });
}

// 标记已读
export const markAsRead = (messageId) => {
  return request({
    url: `/api/v1/message/mark-read`,
    method: 'post',
    params: {
      messageId
    }
  })
}

// 批量标记已读
export const batchMarkAsRead = (messageIds, userId) => {
  return request({
    url: '/api/v1/message/batch-read',
    method: 'post',
    data: messageIds
  })
}

// 删除信息
export const deleteMessage = (messageId) => {
  return request({
    url: `/api/v1/message/delete/${messageId}`,
    method: 'delete'
  })
}

// 批量删除信息
export const deleteAllMessages = (messageIds) => {
  return request({
    url: '/api/v1/message/batch-delete',
    method: 'delete',
    data: messageIds
  })
}

// 确认接收分配申请
export const confirmPaper = (paperId, teacherId) => {
  return request({
    url: '/api/v1/assignment/confirm',
    method: 'post',
    params: {
      paperId,
      teacherId
    }
  })
}

// 拒绝分配申请
export const rejectPaper = (paperId, teacherId) => {
  return request({
    url: '/api/v1/assignment/reject',
    method: 'post',
    params: {
      paperId,
      teacherId
    }
  })
}

// 获取分配列表
export const getPendingPapers = (teacherId, pageNum = 1, pageSize = 10) => {
  return request({
    url: '/api/v1/assignment/pending-papers',
    method: 'get',
    params: {
      teacherId,
      pageNum,
      pageSize
    }
  })
}

// 查询论文详情接口
export const getPaperDetail = (paperId) => {
  return request({
    url: '/api/v1/papers/detail',
    method: 'get',
    params: {
      paperId,
    }
  })
}