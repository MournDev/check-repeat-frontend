/**
 * 头像处理工具函数
 * 统一处理系统中所有头像的 URL 拼接和默认值逻辑
 */

import { computed } from 'vue'

/**
 * 获取完整的头像 URL
 * @param {string} avatarRaw - 原始头像 URL 或 base64 数据
 * @returns {string} - 完整的头像 URL 或空字符串
 */
export const getAvatarUrl = (avatarRaw) => {
  if (!avatarRaw || avatarRaw === 'null' || avatarRaw === 'undefined' || avatarRaw === '') {
    return ''
  }
  
  // 如果已经是完整 URL 或 base64 数据，直接返回
  if (/^(https?:|\/\/|data:)/.test(avatarRaw)) {
    return avatarRaw
  }
  
  // 使用环境变量中的 API 基础 URL
  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '')
  
  // 拼接路径
  return baseUrl ? `${baseUrl}${avatarRaw.startsWith('/') ? '' : '/'}${avatarRaw}` : avatarRaw
}

/**
 * 获取头像显示文本（姓名首字母）
 * @param {string} name - 用户姓名
 * @returns {string} - 姓名首字母或默认字符
 */
export const getAvatarText = (name) => {
  if (!name) return '用'
  
  // 中文姓名取第一个字
  const firstChar = name.charAt(0)
  return firstChar
}

/**
 * 创建响应式的头像源计算属性
 * @param {Ref<Object>} userInfoRef - 用户信息的 ref
 * @returns {ComputedRef<string>} - 头像 URL 的计算属性
 */
export const createAvatarSrc = (userInfoRef) => {
  return computed(() => getAvatarUrl(userInfoRef.value?.avatar))
}

/**
 * 批量处理用户列表的头像
 * @param {Array} userList - 用户列表
 * @returns {Array} - 处理后的用户列表，每个用户都有 avatarUrl 属性
 */
export const processUserAvatars = (userList) => {
  if (!userList || !Array.isArray(userList)) {
    return []
  }
  
  return userList.map(user => ({
    ...user,
    avatarUrl: getAvatarUrl(user.avatar)
  }))
}

export default {
  getAvatarUrl,
  getAvatarText,
  createAvatarSrc,
  processUserAvatars
}
