import Cookies from 'js-cookie'
import { parseJwtPayload } from '@/utils/jwt'

const TOKEN_KEY = 'token'
const NEAR_EXPIRY_MS = 5 * 60 * 1000 // 5分钟

export const tokenManager = {
  get() {
    return Cookies.get(TOKEN_KEY) || ''
  },

  set(token) {
    const isDevelopment = import.meta.env.DEV
    Cookies.set(TOKEN_KEY, token, {
      expires: 1,
      secure: !isDevelopment,
      sameSite: 'strict'
    })
  },

  remove() {
    Cookies.remove(TOKEN_KEY)
  },

  getPayload() {
    return parseJwtPayload(this.get())
  },

  isExpired() {
    const p = this.getPayload()
    return !p?.exp || Date.now() >= p.exp * 1000
  },

  isNearExpiry() {
    const p = this.getPayload()
    if (!p?.exp) return false
    return (p.exp * 1000 - Date.now()) < NEAR_EXPIRY_MS
  },

  getRole() {
    return this.getPayload()?.roleCode || ''
  },

  getUserId() {
    return this.getPayload()?.userId || null
  },

  /**
   * 刷新token（返回新token或null）
   */
  async refresh() {
    const token = this.get()
    if (!token) return null
    try {
      const axios = (await import('axios')).default
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh-token`,
        { oldToken: token },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.code === 200 && res.data?.data?.newToken) {
        this.set(res.data.data.newToken)
        return res.data.data.newToken
      }
    } catch {
      // 刷新失败
    }
    return null
  }
}