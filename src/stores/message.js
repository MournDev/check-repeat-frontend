import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUnreadCount } from '@/api/user.js'
import { getMessageSessions as getStudentMessageSessions } from '@/api/student.js'
import { getMessageSessions as getTeacherMessageSessions } from '@/api/teacher.js'

/**
 * 全站消息未读单一事实来源（SSOT）。
 *
 * 三条消息通道的未读在这里汇聚：
 *   A 站内消息（system_message，含公告按人落库）→ systemUnread，
 *     唯一真相是服务端计数接口 /api/message/unread-count，禁止用
 *     列表页本地条数覆盖（分页/筛选下必然失真）。
 *   B 系统公告：广播时已按人落 system_message，未读并入 A，无独立计数。
 *   C 师生聊天（会话 per-session unreadCount）→ chatUnread，按角色调
 *     学生/教师各自的会话接口求和；ADMIN/SUPER_ADMIN 无聊天通道恒为 0。
 *
 * 消费方：MainLayout 铃铛角标 = totalUnread，侧边栏聊天菜单项角标 = chatUnread。
 * 页面操作（已读/删除/清空）成功后一律调 loadSystemUnread 回源，不本地加减。
 */
export const useMessageStore = defineStore('message', () => {
  const notifications = ref([])
  const systemUnread = ref(0)
  const chatUnread = ref(0)
  const loading = ref(false)

  const totalUnread = computed(() => systemUnread.value + chatUnread.value)

  const setChatUnread = (count) => {
    chatUnread.value = Math.max(0, count || 0)
  }

  const setNotifications = (list) => {
    notifications.value = list
  }

  const setLoading = (status) => {
    loading.value = status
  }

  // 通道 A：以服务端计数为准回源
  const loadSystemUnread = async (userId) => {
    if (!userId) { systemUnread.value = 0; return }
    try {
      const response = await getUnreadCount(userId)
      if (response.code === 200) systemUnread.value = response.data
    } catch { /* 计数失败保持原值，下次 WS/操作回源 */ }
  }

  // 通道 C：会话未读合计；学生/教师各一套会话 API，其余角色无聊天通道
  const loadChatUnread = async (role) => {
    const api = role === 'STUDENT' ? getStudentMessageSessions
      : role === 'TEACHER' ? getTeacherMessageSessions : null
    if (!api) { chatUnread.value = 0; return }
    try {
      const res = await api()
      if (res.code === 200) {
        chatUnread.value = (res.data || []).reduce((sum, s) => sum + (s.unreadCount || 0), 0)
      }
    } catch { /* 同上，保持原值 */ }
  }

  return {
    notifications,
    systemUnread,
    chatUnread,
    totalUnread,
    loading,
    setChatUnread,
    setNotifications,
    setLoading,
    loadSystemUnread,
    loadChatUnread
  }
})
