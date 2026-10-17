import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import router from '@/router'
import { tokenManager } from '@/utils/tokenManager'

let isRefreshing = false
let refreshSubscribers = []

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

// 结束会话：清令牌并回到登录页。
// 只在「确认令牌已过期且刷新不回来」时调用，别把它当成所有 401 的默认动作。
function endSession(errorData) {
  tokenManager.remove()
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
  ElMessage.error(errorData?.message || '登录已过期，请重新登录')
}

// 通用请求方法
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 120000
})

let loadingInstance = null
let loadingTimer = null
let pendingRequests = 0

function showLoading() {
  pendingRequests++
  if (!loadingInstance && !loadingTimer) {
    loadingTimer = setTimeout(() => {
      loadingInstance = ElLoading.service({ text: '处理中...', lock: true })
      loadingTimer = null
    }, 300)
  }
}

function hideLoading() {
  pendingRequests = Math.max(0, pendingRequests - 1)
  if (pendingRequests === 0) {
    if (loadingTimer) {
      clearTimeout(loadingTimer)
      loadingTimer = null
    }
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }
}

service.interceptors.request.use(
  async (config) => {
    if (!config) config = {}
    if (!config.headers) config.headers = {}
    if (!config.method) config.method = 'get'

    // 跳过刷新接口本身，避免死循环
    if (config.url?.includes('/auth/refresh-token')) {
      const token = tokenManager.get()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    }

    let token = tokenManager.get()

    // 主动检测：token即将过期时提前刷新
    if (token && tokenManager.isNearExpiry()) {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const newToken = await tokenManager.refresh()
          if (newToken) {
            token = newToken
            onTokenRefreshed(newToken)
          } else {
            onTokenRefreshed(null)
          }
        } catch {
          onTokenRefreshed(null)
        }
        isRefreshing = false
      } else {
        token = await new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            resolve(newToken || tokenManager.get())
          })
        })
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${String(token).trim()}`
    }

    // 加载提示（文件上传等大请求不需要）
    if (!config.headers['Content-Type']?.includes('multipart/form-data')) {
      showLoading()
    }
    return config
  },
  (error) => {
    hideLoading()
    ElMessage.error('请求发送失败')
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    hideLoading()
    if (response.config?.responseType === 'blob') {
      return response
    }
    const res = response.data
    if (res.code === 200) {
      return res
    } else {
      // silent：这类业务失败由调用方自己决定怎么呈现——例如「学生还没分配导师」
      // 是正常空态，不该弹红条。只挡提示，照旧 reject，调用方不接就会原样冒出来。
      if (!response.config?.silent) {
        ElMessage.error(res.message || '操作失败')
      }
      return Promise.reject(res)
    }
  },
  async (error) => {
    hideLoading()

    if (!error.response) {
      ElMessage.error('网络错误，请检查网络连接')
      return Promise.reject(error)
    }

    const status = error.response?.status
    const errorData = error.response?.data

    // blob 错误体（导出接口返回的 JSON 报错等）：先读出真实 message 再提示，
    // 否则 errorData 是 Blob 对象，各状态分支只能弹「请求参数错误」这类通用文案。
    // 401 维持既有语义：文件下载的会话失效直接报错，不进入刷新重试链。
    if (error.config?.responseType === 'blob' && errorData instanceof Blob) {
      const message = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            resolve(JSON.parse(reader.result)?.message || '')
          } catch {
            resolve('')
          }
        }
        reader.onerror = () => resolve('')
        reader.readAsText(errorData)
      })
      if (status === 401) {
        ElMessage.error(message || '登录已过期，请重新登录')
      } else {
        ElMessage.error(message || '请求失败，请重试')
      }
      return Promise.reject(error)
    }

    if (status === 401) {
      if (error.config?._skipLoginRedirect) {
        return Promise.reject(error)
      }
      // 已重试过一次仍401：刷新出来的新令牌服务端也不认，此时才真正结束会话
      if (error.config?._retry) {
        endSession(errorData)
        return Promise.reject(error)
      }
      const token = tokenManager.get()
      if (!token) {
        endSession(errorData)
        return Promise.reject(error)
      }
      // 本地解析出令牌尚未过期，却收到 401 —— 这不是「登录过期」，而是服务端拒绝了这个会话
      // （权限域不匹配、实例间 JWT 密钥不一致、错误页被鉴权等）。
      // 以前这里一律清令牌并跳登录，等于把服务端的拒绝伪装成掉线：用户看不到真实原因，
      // 还会丢掉当前页面与未保存的输入。这种情况保留会话，只把错误报出来。
      if (!tokenManager.isExpired()) {
        ElMessage.error(errorData?.message || '登录状态异常，请重新登录')
        return Promise.reject(error)
      }
      // 确实已过期：尝试刷新一次，成功则原请求重发
      if (!isRefreshing) {
        isRefreshing = true
        let newToken = null
        try {
          newToken = await tokenManager.refresh()
        } catch {
          // 刷新失败，newToken 保持 null
        }
        if (newToken) {
          onTokenRefreshed(newToken)
          isRefreshing = false
          error.config.headers.Authorization = `Bearer ${newToken}`
          error.config._retry = true
          return service(error.config)
        }
        onTokenRefreshed(null)
        isRefreshing = false
        endSession(errorData)
        return Promise.reject(error)
      }
      // 已有刷新在进行：等它出结果再决定。
      // 注意两条分支都必须 settle —— 刷新失败时若只 reject 内部 promise，
      // 外层 promise 会永远悬着，调用方（await 的那些页面）就永久卡住。
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`
            error.config._retry = true
            resolve(service(error.config))
          } else {
            endSession(errorData)
            resolve(Promise.reject(error))
          }
        })
      })
    }
    else if (status === 403) {
      ElMessage.error(errorData?.message || '权限不足，无法操作')
    }
    else if (status === 404) {
      ElMessage.error(errorData?.message || '请求接口不存在')
    }
    else if (status === 400) {
      ElMessage.error(errorData?.message || '请求参数错误，请检查输入')
    }
    else if (status === 429) {
      // 登录防爆破锁定（错误码 42901）：后端 message 带具体锁定原因，优先透出
      ElMessage.error(errorData?.message || '请求过于频繁，请稍后再试')
    }
    else if (status === 500) {
      ElMessage.error(errorData?.message || '服务器内部错误，请联系管理员')
    }
    else if (status === 502) {
      ElMessage.error('网关错误，请稍后再试')
    }
    else if (status === 503) {
      // 维护模式专属响应（errorCode=SYSTEM_MAINTENANCE）：更新全局维护状态，
      // MainLayout 据此显示维护横幅/遮罩；动态导入避免 request → store → api → request 循环依赖
      if (errorData?.errorCode === 'SYSTEM_MAINTENANCE') {
        import('@/stores/maintenance').then(({ useMaintenanceStore }) => {
          useMaintenanceStore().setFrom503(errorData)
        })
      } else {
        ElMessage.error('服务暂时不可用，请稍后再试')
      }
    }
    else if (status === 504) {
      ElMessage.error('网关超时，请稍后再试')
    }
    else {
      ElMessage.error(errorData?.message || '请求失败，请重试')
    }
    return Promise.reject(error)
  }
)

export default service