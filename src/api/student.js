import request from "./request";

export const getMajorList = () => {
  return request({
    url: "/api/v1/papers/major/list",
    method: "get",
  });
};

export const uploadPaper = (data) => {
  return request({
    url: "/api/v1/papers/submit",
    method: "post",
    data: data,
  });
};

export const getStudentPaperPage = (params) => {
  return request({
    url: "/api/v1/papers/page",
    method: "post",
    data: params,
  });
};

export const getStudentCheckTasks = (params) => {
  return request({
    url: "/api/v1/student/check-tasks/list",
    method: "get",
    params: params,
  });
};

export const createCheckTask = (paperId) => {
  return request({
    url: "/api/v1/student/check-tasks/create",
    method: "post",
    params: {
      paperId: paperId,
    },
  });
};

export const createBatchCheckTasks = (paperIds) => {
  return request({
    url: "/api/v1/student/batch-check/create",
    method: "post",
    data: {
      paperIds: paperIds
    }
  });
};

export const autoAssign = (paperSubmitId) => {
  return request({
    url: "/api/v1/advisor/assign/auto",
    method: "post",
    params: {
      paperSubmitId: paperSubmitId,
    },
  });
};

export const getLatestPaper = () => {
  return request({
    url: '/api/v1/student/dashboard/latest-paper',
    method: 'get'
  })
}

export const getStudentDashboardStats = () => {
  return request({
    url: '/api/v1/student/dashboard/stats',
    method: 'get'
  })
}

export const getAdvisorInfo = () => {
  return request({
    url: '/api/v1/student/dashboard/advisor',
    method: 'get'
  })
}

export const getDashboardDeadlines = () => {
  return request({
    url: '/api/v1/student/dashboard/deadlines',
    method: 'get'
  })
}

export const getAbilityRadarData = () => {
  return request({
    url: '/api/v1/student/dashboard/ability-radar',
    method: 'get'
  })
}

export const getSimilarityTrendChart = () => {
  return request({
    url: '/api/v1/student/dashboard/similarity-trend',
    method: 'get'
  })
}

export const getMajorComparisonData = () => {
  return request({
    url: '/api/v1/student/dashboard/major-comparison',
    method: 'get'
  })
}

export const getTodoList = () => {
  return request({
    url: '/api/v1/student/dashboard/todo-list',
    method: 'get'
  })
}

export const getNotifications = (limit = 5) => {
  return request({
    url: '/api/v1/student/dashboard/notifications',
    method: 'get',
    params: { limit }
  })
}

export const getProgressTracking = () => {
  return request({
    url: '/api/v1/student/dashboard/progress-tracking',
    method: 'get'
  })
}

export const exportDashboardStats = () => {
  return request({
    url: '/api/v1/student/dashboard/export',
    method: 'get',
    responseType: 'blob'
  })
}

export const getPaperDetails = (paperId) => {
  return request({
    url: '/api/v1/papers/detail',
    method: 'get',
    params: {
      paperId: paperId
    }
  })
}

export const getFileInfo = (fileId) => {
  return request({
    url: '/api/v1/file/info',
    method: 'get',
    params: {
      fileId: fileId
    }
  })
}

export const getPaperReport = (reportId) => {
  return request({
    url: '/api/v1/student/reports/data',
    method: "get",
    params: { reportId }
  });
};

export const getSimpleCheckReport = (paperId) => {
  return request({
    url: '/api/v1/student/reports/list',
    method: "get",
    params: { paperId }
  });
};

export const deletePaper = (paperId) => {
  return request({
    url: `/api/v1/papers/delete`,
    method: "post",
    params: {
      paperId: paperId
    }
  });
};

export const deleteCheckTask = (taskId) => {
  return request({
    url: `/api/v1/student/check-tasks/${taskId}/delete`,
    method: "delete"
  });
};

export const deleteFile = (fileId) => {
  return request({
    url: `/api/v1/file/delete/file`,
    method: "delete",
    params: {
      fileId: fileId
    }
  });
};

export const getCheckTaskDetail = (paperId) => {
  return request({
    url: `/api/v1/student/check-tasks/taskDetail`,
    method: "get",
    params: {
      paperId: paperId
    }
  });
}

export const getCheckTaskById = (taskId) => {
  return request({
    url: `/api/v1/student/check-tasks/${taskId}`,
    method: "get"
  });
}

export const getDetailedCheckReport = (reportId) => {
  return request({
    url: '/api/v1/student/reports/preview',
    method: "get",
    params: { reportId }
  });
};

export const getCheckHistory = (paperId) => {
  return request({
    url: `/api/v1/student/papers/${paperId}/check-history`,
    method: "get"
  });
};

export const getSimilarityTrend = (paperId, period = 30) => {
  return request({
    url: `/api/v1/student/papers/${paperId}/similarity-trend`,
    method: "get",
    params: { period }
  });
};

export const recheckPlagiarism = (paperId) => {
  return request({
    url: `/api/v1/student/check-tasks/recheck`,
    params: { paperId },
    method: "post"
  });
};

export const getCheckStatus = (taskId) => {
  return request({
    url: `/api/v1/student/check-tasks/status`,
    params: { taskId },
    method: "get"
  });
};

export const exportCheckReport = (reportId, format) => {
  return request({
    url: '/api/v1/student/reports/download',
    method: "post",
    data: { reportId, format },
    responseType: 'blob'
  });
};

export const withdrawPaper = (paperId, withdrawReasonType, reasonDetail) => {
  return request({
    url: `/api/v1/papers/${paperId}/withdraw`,
    method: "post",
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      withdrawReasonType,
      reasonDetail: reasonDetail || ''
    }
  });
};

export const resubmitAfterWithdraw = (paperId, data) => {
  return request({
    url: `/api/v1/papers/${paperId}/resubmit-after-withdraw`,
    method: "post",
    data
  });
};

export const resubmitAfterRevision = (paperId, data) => {
  return request({
    url: `/api/v1/papers/${paperId}/resubmit-after-revision`,
    method: "post",
    data
  });
};

export const requestModification = (paperId, reason) => {
  return request({
    url: `/api/v1/papers/${paperId}/modify-request`,
    method: "post",
    data: { reason }
  });
};

export const downloadPaper = (paperId) => {
  return request({
    url: `/api/v1/papers/${paperId}/download`,
    method: "get",
    params: { paperId },
    responseType: 'blob'
  });
};

export const batchDownloadPapers = (paperIds) => {
  return request({
    url: `/api/v1/papers/batch-download`,
    method: "post",
    data: { paperIds },
    responseType: 'blob'
  });
};

export const batchDeletePapers = (paperIds) => {
  return request({
    url: `/api/v1/papers/batch-delete`,
    method: "delete",
    data: { paperIds }
  });
};

export const getPaperVersions = (paperId) => {
  return request({
    url: `/api/v1/papers/${paperId}/versions`,
    method: "get"
  });
};

export const getVersionDetail = (paperId, versionId) => {
  return request({
    url: `/api/v1/papers/${paperId}/versions/${versionId}`,
    method: "get"
  });
};

export const comparePaperVersions = (paperId, versionIds) => {
  return request({
    url: `/api/v1/papers/compare-versions`,
    method: "post",
    data: {
      paperId,
      versionIds
    }
  });
};

export const compareVersionHistory = (paperId, fromVersion, toVersion) => {
  return request({
    url: `/api/v1/student/papers/${paperId}/compare-versions`,
    method: "post",
    data: {
      fromVersion,
      toVersion
    }
  });
};

export const downloadVersionCompare = (paperId, versionIds) => {
  return request({
    url: `/api/v1/papers/download-version-compare`,
    method: "post",
    data: {
      paperId,
      versionIds
    },
    responseType: 'blob'
  });
};

export const downloadVersion = (versionId) => {
  return request({
    url: `/api/v1/papers/versions/${versionId}/download`,
    method: "get",
    responseType: 'blob'
  });
};

export const downloadAttachment = (attachmentId) => {
  return request({
    url: `/api/v1/papers/attachments/${attachmentId}/download`,
    method: "get",
    responseType: 'blob'
  });
};

export const getAdvisorInteractionInfo = () => {
  return request({
    url: '/api/v1/student/advisor/info',
    method: 'get'
  });
};

export const getMessageSessions = () => {
  return request({
    url: '/api/v1/student/messages/sessions',
    method: 'get'
  });
};

export const getMessages = (params) => {
  let sessionId, pageNum = 1, pageSize = 20;
  if (typeof params === 'object' && params !== null) {
    sessionId = params.sessionId;
    pageNum = params.pageNum || 1;
    pageSize = params.pageSize || 20;
  } else {
    sessionId = params;
  }
  return request({
    url: '/api/v1/student/messages/list',
    method: 'get',
    params: {
      sessionId,
      pageNum,
      pageSize
    }
  });
};

export const sendMessage = (data) => {
  return request({
    url: '/api/v1/student/messages/send',
    method: 'post',
    data
  });
};

export const uploadMessageFile = (formData) => {
  return request({
    url: '/api/v1/student/messages/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const downloadMessageAttachment = (attachmentId) => {
  return request({
    url: `/api/v1/student/messages/attachment/${attachmentId}`,
    method: 'get',
    responseType: 'blob'
  });
};

export const clearMessages = (sessionId) => {
  return request({
    url: `/api/v1/student/messages/session/${sessionId}/clear`,
    method: 'delete'
  });
};

export const exportChatHistory = (data) => {
  return request({
    url: '/api/v1/student/messages/export',
    method: 'post',
    data,
    responseType: 'blob'
  });
};

export const getSharedFiles = (sessionId) => {
  return request({
    url: '/api/v1/student/messages/shared-files',
    method: 'get',
    params: { sessionId },
    _skipLoginRedirect: true
  });
};

export const downloadSharedFile = (fileId) => {
  return request({
    url: `/api/v1/student/messages/shared-file/${fileId}`,
    method: 'get',
    responseType: 'blob'
  });
};

export const deleteSharedFile = (fileId) => {
  return request({
    url: `/api/v1/student/messages/shared-file/${fileId}`,
    method: 'delete'
  });
};

export const markMessagesAsRead = (params) => {
  let sessionId;
  if (typeof params === 'object' && params !== null) {
    sessionId = params.sessionId;
  } else {
    sessionId = params;
  }
  return request({
    url: `/api/v1/student/messages/session/${sessionId}/read`,
    method: 'put'
  });
};

export const recallMessage = (messageId) => {
  return request({
    url: `/api/v1/student/messages/${messageId}/recall`,
    method: 'delete'
  });
};

export const getPersonalAcademicAdvice = () => {
  return request({
    url: '/api/v1/student/academic-integrity/personal-advice',
    method: 'get'
  });
};

export const getAcademicResources = (params) => {
  return request({
    url: '/api/v1/student/academic-integrity/resources',
    method: 'get',
    params
  });
};

export const getAcademicChecklist = () => {
  return request({
    url: '/api/v1/student/academic-integrity/checklist',
    method: 'get'
  });
};

export const updateChecklistItem = (itemId, checked) => {
  return request({
    url: `/api/v1/student/academic-integrity/checklist/${itemId}`,
    method: 'put',
    data: { checked }
  });
};

// ── 学生审核结果 ──

export const getStudentReviewList = (params) => {
  return request({
    url: '/api/v1/student/reviews/list',
    method: 'get',
    params
  });
};

export const getStudentReviewDetail = (params) => {
  return request({
    url: '/api/v1/student/reviews/detail',
    method: 'get',
    params
  });
};

export const downloadReviewAttach = (params) => {
  return request({
    url: '/api/v1/student/reviews/download-attach',
    method: 'get',
    params,
    responseType: 'blob'
  });
};

export const resubmitAfterReview = (formData) => {
  return request({
    url: '/api/v1/student/reviews/re-submit',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getResubmitRecord = (params) => {
  return request({
    url: '/api/v1/student/reviews/resubmit-record',
    method: 'get',
    params
  });
};

// ── 取消查重任务 ──

export const cancelCheckTask = (taskId) => {
  return request({
    url: '/api/v1/student/check-tasks/cancel',
    method: 'delete',
    params: { taskId }
  });
};

// ── 论文统计 ──

export const getPaperStatistics = (paperId) => {
  return request({
    url: `/api/v1/student/papers/${paperId}/statistics`,
    method: 'get'
  });
};

// ── 查重规则 ──

export const getDefaultCheckRule = () => {
  return request({
    url: '/api/v1/check-rules/default',
    method: 'get'
  });
};