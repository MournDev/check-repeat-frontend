import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建Axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 120000 // 超时时间120秒（适配大文件上传）
})

// 请求拦截器
let loadingInstance = null
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    // 添加JWT令牌
    if (userStore.token) {
      // 清理 token 中的空白字符
      const cleanToken = userStore.token.trim().replace(/\s+/g, '')
      console.log('🔍 发送的token:', JSON.stringify(cleanToken))
      config.headers[import.meta.env.VITE_JWT_HEADER || 'Authorization'] = cleanToken
    }
    // 显示加载动画（非文件上传请求）
    if (!config.headers['Content-Type']?.includes('multipart/form-data')) {
      loadingInstance = ElLoading.service({ text: '处理中...', lock: true })
    }
    return config
  },
  (error) => {
    loadingInstance?.close()
    ElMessage.error('请求发送失败')
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    loadingInstance?.close()
    // 如果是blob响应，直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }
    
    const res = response.data;
    // 成功状态（code=200）
    if (res.code === 200) {
      return res;
    } else {
      // 业务错误
      ElMessage.error(res.message || '操作失败');
      return Promise.reject(res);
    }
  },
  (error) => {
    loadingInstance?.close();
    
    // 如果是blob响应且是401错误
    if (error.config?.responseType === 'blob' && error.response?.status === 401) {
      // 尝试读取错误信息
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result);
          ElMessage.error(errorData.message || '登录已过期');
        } catch (e) {
          ElMessage.error('登录已过期，请重新登录');
        }
      };
      reader.readAsText(error.response.data);
      return Promise.reject(error);
    }
    
    const status = error.response?.status
    // 401：未登录或令牌过期
    if (status === 401) {
      const userStore = useUserStore()
      userStore.logout() // 清除用户信息
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } 
    // 403：权限不足
    else if (status === 403) {
      ElMessage.error('权限不足，无法操作')
    } 
    // 404：接口不存在
    else if (status === 404) {
      ElMessage.error('请求接口不存在')
    } 
    // 500：服务器错误
    else if (status === 500) {
      ElMessage.error('服务器内部错误，请联系管理员')
    } else {
      ElMessage.error('请求失败，请重试')
    }
    return Promise.reject(error)
  }
)

export default service