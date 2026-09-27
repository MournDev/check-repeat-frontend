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
      ElMessage.error(res.message || '操作失败')
      return Promise.reject(res)
    }
  },
  async (error) => {
    hideLoading()

    if (!error.response) {
      ElMessage.error('网络错误，请检查网络连接')
      return Promise.reject(error)
    }

    // blob响应的401处理
    if (error.config?.responseType === 'blob' && error.response?.status === 401) {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result)
          ElMessage.error(errorData.message || '登录已过期')
        } catch {
          ElMessage.error('登录已过期，请重新登录')
        }
      }
      reader.readAsText(error.response.data)
      return Promise.reject(error)
    }

    const status = error.response?.status
    const errorData = error.response?.data

    if (status === 401) {
      if (error.config?._skipLoginRedirect) {
        return Promise.reject(error)
      }
      // 已重试过一次仍401，放弃
      if (error.config?._retry) {
        tokenManager.remove()
        router.push('/login')
        ElMessage.error(errorData?.message || '登录已过期，请重新登录')
        return Promise.reject(error)
      }
      // 主动刷新兜底：401时再尝试一次刷新
      const token = tokenManager.get()
      if (!token) {
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
        return Promise.reject(error)
      }
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const newToken = await tokenManager.refresh()
          if (newToken) {
            onTokenRefreshed(newToken)
            isRefreshing = false
            error.config.headers.Authorization = `Bearer ${newToken}`
            error.config._retry = true
            return service(error.config)
          }
        } catch {
          // 刷新失败
        }
        tokenManager.remove()
        onTokenRefreshed(null)
        isRefreshing = false
      }
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`
            error.config._retry = true
            resolve(service(error.config))
          } else {
            tokenManager.remove()
            router.push('/login')
            ElMessage.error('登录已过期，请重新登录')
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
      ElMessage.error('请求过于频繁，请稍后再试')
    }
    else if (status === 500) {
      ElMessage.error(errorData?.message || '服务器内部错误，请联系管理员')
    }
    else if (status === 502) {
      ElMessage.error('网关错误，请稍后再试')
    }
    else if (status === 503) {
      ElMessage.error('服务暂时不可用，请稍后再试')
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