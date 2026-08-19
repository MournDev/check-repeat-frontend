import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMessageList, getUnreadCount } from '@/api/user.js'

export const useMessageStore = defineStore('message', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)

  // 获取消息列表
  const loadNotifications = async (userId) => {
    loading.value = true
    try {
      const params = {
        userId: userId,
        pageNum: 1,
        pageSize: 5
      }
      const response = await getMessageList(params)
      if (response.code === 200) {
        notifications.value = response.data.records || []
      }
    } catch (error) {
      console.error('加载通知列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取未读数量
  const loadUnreadCount = async (userId) => {
    try {
      const response = await getUnreadCount(userId)
      if (response.code === 200) {
        unreadCount.value = response.data
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  }
// 设置未读数量
  const setUnreadCount = (count) => {
    unreadCount.value = count
  }

  // 设置通知列表
  const setNotifications = (list) => {
    notifications.value = list
  }

  // 设置加载状态
  const setLoading = (status) => {
    loading.value = status
  }

  // 标记为已读
  const markAsRead = (notificationId) => {
    const notification = notifications.value.find(item => item.id === notificationId)
    if (notification && !notification.isRead) {
      notification.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    setUnreadCount,
    setNotifications,
    setLoading,
    markAsRead
  }
})