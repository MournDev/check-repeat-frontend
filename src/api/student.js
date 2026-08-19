import request from "./request";

/**
 * 获取专业列表
 */
export const getMajorList = () => {
  return request({
    url: "/student/major/list",
    method: "get",
  });
};

export const uploadPaper = (data) => {
  return request({
    url: "/api/papers/submit",
    method: "post",
    data: data,
  });
};

/**
 * 更新论文信息
 * @param paperId 论文ID
 * @param data 更新数据
 */
export const updatePaper = (paperId, data) => {
  return request({
    url: `/api/papers/${paperId}/update`,
    method: "put",
    data: data,
  });
};

export const getStudentPaperPage = (params) => {
  return request({
    url: "/api/papers/page",
    method: "post",
    data: params,
  });
};

/**
 * 获取学生的查重任务列表
 * @param params 查询参数
 */
export const getStudentCheckTasks = (params) => {
  return request({
    url: "/api/student/check-tasks/list",
    method: "get",
    params: params,
  });
};

export const createCheckTask = (paperId) => {
  return request({
    url: "/api/student/check-tasks/create",
    method: "post",
    params: {
      paperId: paperId,
    },
  });
};

/**
 * 批量创建查重任务
 * @param paperIds 论文ID数组
 */
export const createBatchCheckTasks = (paperIds) => {
  return request({
    url: "/api/student/check-tasks/batch-create",
    method: "post",
    data: {
      paperIds: paperIds
    }
  });
};

export const autoAssign = (paperSubmitId) => {
  return request({
    url: "/api/advisor/assign/auto",
    method: "post",
    params: {
      paperSubmitId: paperSubmitId,
    },
  });
};

/**
 * 手动分配导师
 * @param paperId 论文ID
 * @param teacherId 导师ID
 */
export const manualAssignAdvisor = (paperId, teacherId) => {
  return request({
    url: "/api/advisor/assign/manual",
    method: "post",
    data: {
      paperId: paperId,
      teacherId: teacherId
    }
  });
};

export const getLatestPaper = (token) => {
  return request({
    url: '/api/student/dashboard/latest-paper',
    method: 'get',
    params: {token},
  })
}

/**
 * 获取学生仪表盘统计数据
 * @param token 用户令牌
 */
export const getStudentDashboardStats = (token) => {
  return request({
    url: '/api/student/dashboard/stats',
    method: 'get',
    params: {token},
  })
}

export const getAdvisorInfo = (token) => {
  return request({
    url: '/api/student/dashboard/advisor',
    method: 'get',
    params: {token},
  })
}

/**
 * 获取时间节点信息
 */
export const getDashboardDeadlines = () => {
  return request({
    url: '/api/student/dashboard/deadlines',
    method: 'get'
  })
}

/**
 * 获取个人能力评估数据（雷达图）
 */
export const getAbilityRadarData = () => {
  return request({
    url: '/api/student/dashboard/ability-radar',
    method: 'get'
  })
}

/**
 * 获取相似度变化趋势（折线图）
 */
export const getSimilarityTrendChart = () => {
  return request({
    url: '/api/student/dashboard/similarity-trend',
    method: 'get'
  })
}

/**
 * 获取专业对比数据（柱状图）
 */
export const getMajorComparisonData = () => {
  return request({
    url: '/api/student/dashboard/major-comparison',
    method: 'get'
  })
}

/**
 * 获取待办事项列表
 */
export const getTodoList = () => {
  return request({
    url: '/api/student/dashboard/todo-list',
    method: 'get'
  })
}

/**
 * 获取通知消息列表
 * @param limit 获取数量，默认 5
 */
export const getNotifications = (limit = 5) => {
  return request({
    url: '/api/student/dashboard/notifications',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取论文处理进度跟踪
 */
export const getProgressTracking = () => {
  return request({
    url: '/api/student/dashboard/progress-tracking',
    method: 'get'
  })
}

/**
 * 获取导师反馈信息
 * @param paperId 论文ID
 */
export const getAdvisorFeedback = (paperId) => {
  return request({
    url: `/api/student/papers/${paperId}/feedback`,
    method: 'get'
  })
}

export const getPaperDetails = (paperId) => {
  return request({
    url: '/api/papers/detail',
    method: 'get',
    params: {
      paperId: paperId
    }
  })
}

/**
 * 获取论文版本历史
 * @param paperId 论文ID
 */
export const getPaperVersions = (paperId) => {
  return request({
    url: `/api/papers/${paperId}/versions`,
    method: 'get'
  })
}

export const getFileInfo = (fileId) => {
  return request({
    url: '/api/file/info',
    method: 'get',
    params: {
      fileId: fileId
    }
  })
}

/**
 * 获取文件内容（用于查重分析）
 * @param fileId 文件ID
 */
export const getFileContent = (fileId) => {
  return request({
    url: `/api/file/${fileId}/content`,
    method: 'get'
  })
}

export const previewFile = (fileId) => {
  return request({
    url:'/api/file/preview',
    method: 'get',
    params: {
      fileId: fileId
    }
  })
}

/**
 * 文件在线预览（支持多种格式）
 * @param fileId 文件ID
 * @param fileType 文件类型
 */
export const onlinePreview = (fileId, fileType) => {
  return request({
    url: '/api/file/online-preview',
    method: 'get',
    params: {
      fileId: fileId,
      fileType: fileType
    }
  })
}

/**
 * 查询论文查重报告
 * @param reportId 报告ID
 */
export const getPaperReport = (reportId) => {
  return request({
    url: '/api/student/reports/preview',
    method: "get",
    params: { reportId }
  });
};

/**
 * 获取简化的查重报告（用于列表展示）
 * @param paperId 论文ID
 */
export const getSimpleCheckReport = (paperId) => {
  return request({
    url: '/api/student/reports/list',
    method: "get",
    params: { paperId }
  });
};

export const deletePaper = (paperId) => {
  return request({
    url: `/api/papers/delete`,
    method: "post",
    params: {
      paperId: paperId
    }
  });
};

/**
 * 删除查重任务
 * @param taskId 任务ID
 */
export const deleteCheckTask = (taskId) => {
  return request({
    url: `/api/student/check-tasks/${taskId}/delete`,
    method: "delete"
  });
};

export const deleteFile = (fileId) => {
  return request({
    url: `/api/file/delete/file`,
    method: "delete",
    params: {
      fileId: fileId
    }
  });
};

/**
 * 批量删除文件
 * @param fileIds 文件ID数组
 */
export const batchDeleteFiles = (fileIds) => {
  return request({
    url: `/api/file/batch-delete`,
    method: "delete",
    data: {
      fileIds: fileIds
    }
  });
};

export const getCheckTaskDetail = (paperId) => {
  return request({
    url: `/api/student/check-tasks/taskDetail`,
    method: "get",
    params: {
      paperId: paperId
    }
  });
}

/**
 * 获取查重任务详情
 * @param taskId 任务ID
 */
export const getCheckTaskById = (taskId) => {
  return request({
    url: `/api/student/check-tasks/${taskId}`,
    method: "get"
  });
}

/**
 * 获取详细的查重报告
 * @param reportId 报告ID
 */
export const getDetailedCheckReport = (reportId) => {
  return request({
    url: '/api/student/reports/preview',
    method: "get",
    params: { reportId }
  });
};

/**
 * 获取查重历史记录
 * @param paperId 论文ID
 */
export const getCheckHistory = (paperId) => {
  return request({
    url: `api/student/papers/${paperId}/check-history`,
    method: "get"
  });
};

/**
 * 获取查重统计信息
 * @param paperId 论文ID
 * @param period 时间周期（天数）
 */
export const getSimilarityTrend = (paperId, period = 30) => {
  return request({
    url: `api/student/papers/${paperId}/similarity-trend`,
    method: "get",
    params: { period }
  });
};

/**
 * 订阅查重状态更新（WebSocket）
 * @param paperId 论文ID
 * @param callback 回调函数
 */
export const subscribeCheckStatus = (paperId, callback) => {
  // WebSocket连接实现
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsBase = import.meta.env.VITE_WS_BASE_URL || `${wsProtocol}//${window.location.host}`;
  const wsUrl = `${wsBase}/ws/check-status/${paperId}`;
  const socket = new WebSocket(wsUrl);
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (error) {
      console.error('WebSocket消息解析失败:', error);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket连接错误:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket连接已关闭');
  };
  
  return socket;
};

/**
 * 重新查重检测
 * @param paperId 论文ID
 */
export const recheckPlagiarism = (paperId) => {
  return request({
    url: `api/student/papers/${paperId}/recheck`,
    method: "post"
  });
};

/**
 * 获取查重状态
 * @param taskId 查重任务 ID
 */
export const getCheckStatus = (taskId) => {
  return request({
    url: `/student/check-task/${taskId}/status`,
    method: "get"
  });
};

/**
 * 导出查重报告
 * @param reportId 报告 ID
 * @param format 导出格式 (pdf/html)
 */
export const exportCheckReport = (reportId, format) => {
  return request({
    url: '/api/student/reports/download',
    method: "post",
    data: { reportId, format },
    responseType: 'blob'
  });
};

/**
 * 回复导师反馈
 * @param paperId 论文 ID
 * @param content 回复内容
 */
export const replyFeedback = (paperId, content) => {
  return request({
    url: `/student/paper/${paperId}/feedback/reply`,
    method: "post",
    data: { content }
  });
};

/**
 * 撤回论文
 * @param paperId 论文 ID
 * @param withdrawReasonType 撤回原因类型
 * @param reasonDetail 详细原因描述
 */
export const withdrawPaper = (paperId, withdrawReasonType, reasonDetail) => {
  return request({
    url: `/api/papers/${paperId}/withdraw`,
    method: "post",
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      withdrawReasonType,
      reasonDetail: reasonDetail || '' // 确保不传 undefined
    }
  });
};

/**
 * 撤回后重新提交论文
 * @param paperId 论文 ID
 * @param data 提交数据
 */
export const resubmitAfterWithdraw = (paperId, data) => {
  return request({
    url: `/api/papers/${paperId}/resubmit-after-withdraw`,
    method: "post",
    data
  });
};

/**
 * 申请修改已通过论文
 * @param paperId 论文 ID
 * @param reason 修改原因
 */
export const requestModification = (paperId, reason) => {
  return request({
    url: `/api/papers/${paperId}/modify-request`,
    method: "post",
    data: { reason }
  });
};

/**
 * 下载论文
 * @param paperId 论文 ID
 */
export const downloadPaper = (paperId) => {
  return request({
    url: `/api/papers/${paperId}/download`,
    method: "get",
    params: { paperId },
    responseType: 'blob'
  });
};

/**
 * 批量下载论文
 * @param paperIds 论文 ID 数组
 */
export const batchDownloadPapers = (paperIds) => {
  return request({
    url: `/api/papers/batch-download`,
    method: "post",
    data: { paperIds },
    responseType: 'blob'
  });
};

/**
 * 批量删除论文
 * @param paperIds 论文 ID 数组
 */
export const batchDeletePapers = (paperIds) => {
  return request({
    url: `/api/papers/batch-delete`,
    method: "delete",
    data: { paperIds }
  });
};

/**
 * 获取论文版本详情
 * @param paperId 论文 ID
 * @param versionId 版本 ID
 */
export const getVersionDetail = (paperId, versionId) => {
  return request({
    url: `/api/papers/${paperId}/versions/${versionId}`,
    method: "get"
  });
};

/**
 * 对比两个论文版本
 * @param paperId 论文 ID
 * @param versionIds 版本 ID 数组
 */
export const comparePaperVersions = (paperId, versionIds) => {
  return request({
    url: `/api/papers/compare-versions`,
    method: "post",
    data: {
      paperId,
      versionIds
    }
  });
};

/**
 * 下载版本对比报告
 * @param paperId 论文 ID
 * @param versionIds 版本 ID 数组
 */
export const downloadVersionCompare = (paperId, versionIds) => {
  return request({
    url: `/api/papers/download-version-compare`,
    method: "post",
    data: {
      paperId,
      versionIds
    },
    responseType: 'blob'
  });
};

/**
 * 下载指定版本的论文
 * @param versionId 版本 ID
 */
export const downloadVersion = (versionId) => {
  return request({
    url: `/api/papers/versions/${versionId}/download`,
    method: "get",
    responseType: 'blob'
  });
};

/**
 * 下载附件
 * @param attachmentId 附件 ID
 */
export const downloadAttachment = (attachmentId) => {
  return request({
    url: `/api/attachments/${attachmentId}/download`,
    method: "get",
    responseType: 'blob'
  });
};

/**
 * 获取导师互动页面的导师信息
 */
export const getAdvisorInteractionInfo = () => {
  return request({
    url: '/api/student/advisor/info',
    method: 'get'
  });
};

/**
 * 获取消息会话列表
 */
export const getMessageSessions = () => {
  return request({
    url: '/api/student/messages/sessions',
    method: 'get'
  });
};

/**
 * 获取消息列表
 * @param sessionId 会话ID
 * @param pageNum 页码
 * @param pageSize 每页数量
 */
export const getMessages = (sessionId, pageNum = 1, pageSize = 20) => {
  return request({
    url: '/api/student/messages/list',
    method: 'get',
    params: {
      sessionId,
      pageNum,
      pageSize
    }
  });
};

/**
 * 发送消息
 * @param data 消息数据
 */
export const sendMessage = (data) => {
  return request({
    url: '/api/student/messages/send',
    method: 'post',
    data
  });
};

/**
 * 上传文件
 * @param formData 文件表单数据
 */
export const uploadMessageFile = (formData) => {
  return request({
    url: '/api/student/messages/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 下载消息附件
 * @param attachmentId 附件ID
 */
export const downloadMessageAttachment = (attachmentId) => {
  return request({
    url: `/api/student/messages/attachment/${attachmentId}`,
    method: 'get',
    responseType: 'blob'
  });
};

/**
 * 清空消息
 * @param sessionId 会话ID
 */
export const clearMessages = (sessionId) => {
  return request({
    url: `/api/student/messages/session/${sessionId}/clear`,
    method: 'delete'
  });
};

/**
 * 导出聊天记录
 * @param data 导出参数
 */
export const exportChatHistory = (data) => {
  return request({
    url: '/api/student/messages/export',
    method: 'post',
    data,
    responseType: 'blob'
  });
};

/**
 * 获取共享文件列表
 * @param sessionId 会话ID
 */
export const getSharedFiles = (sessionId) => {
  return request({
    url: '/api/student/messages/shared-files',
    method: 'get',
    params: { sessionId }
  });
};

/**
 * 下载共享文件
 * @param fileId 文件ID
 */
export const downloadSharedFile = (fileId) => {
  return request({
    url: `/api/student/messages/shared-file/${fileId}`,
    method: 'get',
    responseType: 'blob'
  });
};

/**
 * 标记消息已读
 * @param sessionId 会话ID
 */
export const markMessagesAsRead = (sessionId) => {
  return request({
    url: `/api/student/messages/session/${sessionId}/read`,
    method: 'put'
  });
};

/**
 * 撤回消息
 * @param messageId 消息ID
 */
export const recallMessage = (messageId) => {
  return request({
    url: `/api/student/messages/${messageId}/recall`,
    method: 'delete'
  });
};

/**
 * 获取个性化学术建议
 */
export const getPersonalAcademicAdvice = () => {
  return request({
    url: '/api/student/academic-integrity/personal-advice',
    method: 'get'
  });
};

/**
 * 获取推荐学习资源
 */
export const getAcademicResources = (params) => {
  return request({
    url: '/api/student/academic-integrity/resources',
    method: 'get',
    params
  });
};

/**
 * 获取用户检查清单状态
 */
export const getAcademicChecklist = () => {
  return request({
    url: '/api/student/academic-integrity/checklist',
    method: 'get'
  });
};

/**
 * 更新检查项状态
 * @param itemId 检查项ID
 * @param checked 是否完成
 */
export const updateChecklistItem = (itemId, checked) => {
  return request({
    url: `/api/student/academic-integrity/checklist/${itemId}`,
    method: 'put',
    data: { checked }
  });
};
