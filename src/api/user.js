import request from './request'

// 获取当前登录用户信息。
// 登录响应（LoginVO）虽然带回了全部展示字段，但 userStore 落 localStorage 前会走
// filterSafeInfo 只保留非敏感字段（见 stores/user.js），email/phone/introduce/emailVerified
// 刷新后就没了。个人中心靠这个接口把完整信息取回来。
export const getCurrentUserInfo = () => {
  return request({
    url: '/api/user/info',
    method: 'get'
  })
}

export const updateUserInfo = (data) => {
  return request({
    url: '/api/user/update-info',
    method: 'post',
    data: data
  })
}

// options 透传给 axios config，调用方可以传 { silent: true } 挡掉全局红条、自己提示
export const uploadAvatar = (formData, options = {}) => {
  return request({
    url: '/api/user/upload-avatar',
    method: 'post',
    data: formData,
    ...options
  })
}

export const updatePassword = (data) => {
  return request({
    url: '/api/user/update-password',
    method: 'put',
    data: data
  })
}

// 验证邮箱
export const verifyEmail = (token) => {
  return request({
    url: '/api/user/verify-email',
    method: 'get',
    params: { token }
  });
}

// 获取所有学院
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

// 获取全部专业（不带 collegeId 时后端返回所有专业，每条含 collegeId，前端自行按学院过滤）
export const getAllMajors = () => {
  return request({
    url: '/api/common/dict/majors',
    method: 'get'
  });
}

// 根据字典类型获取字典数据
export const getDictDataByType = (dictType) => {
  return request({
    url: `/api/dict/data/type/${dictType}`,
    method: 'get',
  });
};

// 学科领域树。不传参 = 整棵树（教师研究方向选择、管理端用）；
// 传 { majorId } = 只返回该专业映射到的学科分支（论文提交页选完专业后重拉）。
// 兼容旧调用：老代码传的是字符串 'subject_field'（一个后端从来没读过的死参数），
// 这种形态直接当"空参数"处理，等价于要整棵树，三个旧调用点因此一行都不用改。
export const getSubjectFieldTree = (params = {}) => {
  const query = (params && typeof params === 'object') ? params : {};
  return request({
    url: `/api/dict/subject/tree`,
    method: 'get',
    params: query
  })
};

// 发送邮箱验证邮件
export const sendVerifyEmail = (params) => {
  return request({
    url: '/api/user/send-verify-email',
    method: 'post',
    params: params
  });
}

// 发送邮箱验证码
export const sendEmailCode = (data) => {
  return request({
    url: '/api/user/send-email-code',
    method: 'post',
    params: {
      email: data.email
    }
  });
}

// 更新邮箱
export const updateUserEmail = (data) => {
  return request({
    url: '/api/user/update-email',
    method: 'post',
    data
  });
}

export const getLoginHistory = (params) => {
  return request({
    url: '/api/user/login-history',
    method: 'post',
    data: params
  })
}

// 获取未读消息数量
export const getUnreadCount = (userId) => {
  return request({
    url: '/api/message/unread-count',
    method: 'get',
    params: {
      userId: userId
    }
  })
}

// 获取消息列表
export const getMessageList = (params) => {
  return request({
    url: '/api/message/list',
    method: 'get',
    params: params
  });
}

// 标记已读
export const markAsRead = (messageId) => {
  return request({
    url: `/api/message/mark-read`,
    method: 'post',
    params: {
      messageId
    }
  })
}

// 批量标记已读
export const batchMarkAsRead = (messageIds, userId) => {
  return request({
    url: '/api/notification/batch-mark-read',
    method: 'post',
    data: messageIds
  })
}

// 删除信息
export const deleteMessage = (messageId) => {
  return request({
    url: `/api/message/delete/${messageId}`,
    method: 'delete'
  })
}

// 批量删除信息
export const deleteAllMessages = (messageIds) => {
  return request({
    url: '/api/message/batch-delete',
    method: 'delete',
    data: messageIds
  })
}

// 确认接收分配申请
export const confirmPaper = (paperId, teacherId) => {
  return request({
    url: '/api/assignment/confirm',
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
    url: '/api/assignment/reject',
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
    url: '/api/assignment/pending-papers',
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
    url: '/api/papers/detail',
    method: 'get',
    params: {
      paperId,
    }
  })
}