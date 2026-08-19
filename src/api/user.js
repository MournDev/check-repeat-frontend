import request from './request'

export const updateUserInfo = (data) => {
  return request({
    url: '/api/user/update-info',
    method: 'post',
    data: data
  })
}

export const uploadAvatar = (formData) => {
  return request({
    url: '/api/user/upload-avatar',
    method: 'post',
    data: formData,
  })
}

export const getLoginHistory = (params) => {
  return request({
    url: '/api/user/login-history',
    method: 'post',
    data: params
  })
}

export const updatePassword = (data) => {
  return request({
    url: '/api/user/update-password', 
    method: 'put',
    data: data
  })
}

// 发送邮箱验证邮件
export const sendVerifyEmail = (params) => {
  return request({
    url: '/api/user/send-verify-email',
    method: 'post',
    params: params
  });
}

// 验证邮箱
export const verifyEmail = (token) => {
  return request({
    url: '/api/user/verify-email',
    method: 'get',
    params: { token }
  });
}

// 发送邮箱验证码
export const sendEmailCode = (data) => {
  return request({
    url: '/api/user/send-email-code',
    method: 'post',
    data
  });
}

// 更新邮箱
export const updateUserEmail = (data) => {
  return request({
    url: '/user/update-email',
    method: 'post',
    data
  });
}

/// 获取所有学院
export const getAllColleges = () => {
  return request({
    url: '/api/common/dict/colleges',
    method: 'get'
  });
}

// 获取对应学院下的专业
export const getMajorsByCollegeId = (params) => {
  return request({
    url: '/api/common/dict/majors',
    method: 'get',
    params: params
  });
} 
// 根据字典类型获取字典数据
export const getDictDataByType = (dictType) => {
  return request({
    url: `/api/dict/data/type/${dictType}`, 
    method: 'get',
  });
};

export const getSubjectFieldTree = () => {
  return request({
    url: `/api/dict/subject/tree`,
    method: 'get'
  })
};

export const getPaperDictData = () => {
  return request({
    url: '/api/dict/paper/all', // 无参数，直接请求
    method: 'get',
  });
};

export const getDictLabel = (params) => {
  return request({
    url: '/api/dict/label', 
    method: 'get',
    params, 
  });
};

//获取未读消息数量
export const getUnreadCount = (userId) => {
  return request({
    url: 'api/message/unread-count',
    method: 'get',
    params: {
      userId: userId
    }
  })
}

//获取消息列表
export const getMessageList = (params) => {
  return request({
    url: 'api/message/list',
    method: 'get',
    params: params
  });
}
//标记已读
export const markAsRead = (messageId, userId) => {
  return request({
    url: '/api/message/read',
    method: 'post',
    params: {
      messageId: messageId,
      userId: userId
    }
  })
}
//批量标记已读
export const batchMarkAsRead = (messageIds, userId) => {
  return request({
    url: '/api/message/batch-read',
    method: 'post',
    data: messageIds,
    params: {
      userId: userId
    }
  })
}

//删除信息
export const deleteMessage = (messageId, userId) => {
  return request({
    url: '/api/message/delete',
    method: 'delete',
    params: {
      messageId: messageId,
      userId: userId
    }
  })
}
//批量删除信息
export const deleteAllMessages = (messageIds, userId) => {
  return request({
    url: '/api/message/delete-all',
    method: 'delete',
    data: messageIds,
    params: {
      userId: userId
    }
  })
}
//确认接收分配申请
export const confirmPaper = (paperId,teacherId) => {
  return request({
    url: '/api/assignment/confirm',
    method: 'post',
    params: {
      paperId,
      teacherId
    }
  })
}
//拒绝分配申请
export const rejectPaper = (paperId,teacherId) => {
  return request({
    url: '/api/assignment/reject',
    method: 'post',
    params: {
      paperId,
      teacherId
    }
  })
}
//获取分配列表
export const getPendingPapers =(teacherId,pageNum=1,pageSize=10) => {
  return request({
    url: '/api/assignment/pending-papers',
    method: 'get',
    params: {
      teacherId,
      pageNum,
      pageSize
    }
  })
}
//查询论文详情接口
export const getPaperDetail = (paperId) => {
  return request({
    url: '/api/papers/detail',
    method: 'get',
    params: {
      paperId,
    }
  })
}