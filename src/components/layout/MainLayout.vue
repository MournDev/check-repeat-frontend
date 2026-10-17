<template>
  <div class="app-shell">
    <!-- Global Nav (ultra-thin, pure black) -->
    <header class="global-nav">
      <div class="global-nav-left">
        <button class="nav-menu-toggle" @click="toggleSidebar" v-if="isMobile">
          <el-icon><component :is="sidebarVisible ? 'Close' : 'Menu'" /></el-icon>
        </button>
        <div class="brand">
          <svg class="brand-mark" width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="#2997ff" fill-opacity="0.9"/>
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="#ffffff" fill-opacity="0.5"/>
          </svg>
          <span class="brand-name">{{ systemName }}</span>
        </div>
        <nav class="global-nav-links">
          <!-- 顶栏导航用 router-link：可键盘聚焦、可中键新开，与侧边栏同一可访问性约定 -->
          <router-link
            v-for="item in topNavItems"
            :key="item.key"
            :to="item.path"
            :class="['nav-link', { active: isActiveSection(item.key) }]"
          >{{ item.label }}</router-link>
        </nav>
      </div>
      <div class="global-nav-right">
        <!-- Notifications -->
        <el-dropdown trigger="click" placement="bottom-end" @visible-change="handleNotificationDropdownChange">
          <el-badge :value="totalUnread" :max="99" :hidden="totalUnread === 0" class="nav-badge">
            <button class="nav-icon-btn" aria-label="通知">
              <el-icon><Bell /></el-icon>
            </button>
          </el-badge>
          <template #dropdown>
            <el-dropdown-menu class="notification-menu">
              <div class="notification-list" v-loading="loading">
                <template v-if="notifications.length > 0">
                  <div v-for="notification in notifications" :key="notification.id" class="notification-item"
                    :class="{ unread: !notification.isRead }" @click="handleNotificationClick(notification)">
                    <div class="notification-icon">
                      <el-icon v-if="getNotificationIcon(notification.messageType)">
                        <component :is="getNotificationIcon(notification.messageType)" />
                      </el-icon>
                    </div>
                    <div class="notification-content">
                      <div class="notification-title">{{ notification.title }}</div>
                      <div class="notification-desc">{{ notification.content }}</div>
                      <div class="notification-time">{{ formatTime(notification.createTime) }}</div>
                    </div>
                    <el-badge v-if="!notification.isRead" dot type="danger" />
                  </div>
                </template>
                <div v-else class="empty-notification">
                  <el-empty description="暂无通知" :image-size="60" />
                </div>
              </div>
              <div class="notification-footer">
                <el-button type="primary" link @click="goToMessageCenter">查看全部通知</el-button>
              </div>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- User -->
        <el-dropdown trigger="click" class="nav-user-dropdown">
          <button class="nav-user-btn">
            <el-avatar :size="28" :src="userStore.avatarSrc" class="nav-avatar">
              {{ getUserInitial }}
            </el-avatar>
            <span class="nav-user-name">{{ displayUserName }}</span>
            <el-icon class="nav-chevron"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="userStore.role !== 'SUPER_ADMIN'" @click="goToProfile">
                <el-icon><User /></el-icon><span>个人中心</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="userStore.role !== 'SUPER_ADMIN'" @click="goToSettings">
                <el-icon><Setting /></el-icon><span>账号设置</span>
              </el-dropdown-item>
              <el-dropdown-item :divided="userStore.role !== 'SUPER_ADMIN'" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon><span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- Sub Nav (frosted parchment, context title) -->
    <div class="sub-nav">
      <div class="sub-nav-left">
        <el-breadcrumb separator="/" class="sub-nav-breadcrumb">
          <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index" :to="item.path || undefined">
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
        <h2 class="sub-nav-title">{{ currentPageTitle }}</h2>
      </div>
      <div class="sub-nav-right">
        <span class="role-badge">{{ getRoleName }}</span>
      </div>
    </div>

    <!-- Main Layout: Sidebar + Content -->
    <div class="app-body">
      <!-- Sidebar (near-black, Apple-style) -->
      <aside :class="['sidebar', { 'sidebar-open': sidebarVisible, 'sidebar-closed': !sidebarVisible && isMobile }]">
        <!-- Mobile overlay -->
        <div v-if="isMobile && sidebarVisible" class="sidebar-overlay" @click="toggleSidebar"></div>

        <nav class="sidebar-nav">
          <!-- 菜单项从路由表（asyncRoutes 的 meta.menu）按角色派生，见 src/utils/menu.js -->
          <div class="sidebar-section">
            <div class="sidebar-section-label">{{ sidebarMenu.label }}</div>
            <template v-for="item in sidebarMenu.items" :key="item.path">
              <div v-if="item.groupLabel" class="sidebar-sub-label">{{ item.groupLabel }}</div>
              <div v-if="item.spacer" class="sidebar-spacer"></div>
              <router-link :to="item.path" :class="['sidebar-item', { active: activeMenu === item.path }]">
                <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                <span>{{ item.label }}</span>
                <el-badge v-if="item.badge === 'chat' && chatUnread > 0" :value="chatUnread" :max="99" class="sidebar-item-badge" />
              </router-link>
            </template>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- 系统公告/维护模式（非管理员角色）：横幅 + 维护面板替代业务内容 -->
        <el-alert
          v-if="maintenanceStore.showBanner"
          type="error"
          :closable="false"
          show-icon
          class="maintenance-banner"
          :title="maintenanceBannerText"
        />
        <div v-if="maintenanceStore.showBanner" class="maintenance-overlay">
          <div class="maintenance-panel">
            <el-icon class="maintenance-icon"><Tools /></el-icon>
            <h2>系统维护中</h2>
            <p class="maintenance-notice">{{ maintenanceStore.notice || '系统维护中，请稍后再试' }}</p>
            <p v-if="maintenanceStore.startTime || maintenanceStore.endTime" class="maintenance-time">
              {{ [maintenanceStore.startTime, maintenanceStore.endTime].filter(Boolean).join(' ~ ') }}
            </p>
            <el-button type="primary" @click="maintenanceStore.fetchStatus()">刷新状态</el-button>
          </div>
        </div>
        <template v-else>
          <div class="content-inner">
            <router-view v-slot="{ Component }">
              <component :is="Component" />
            </router-view>
          </div>

          <!-- Footer -->
          <footer class="app-footer">
            <div class="footer-inner">
              <div class="footer-links">
                <a href="#">关于我们</a>
                <a href="#">帮助中心</a>
                <a href="#">隐私政策</a>
                <a href="#">使用条款</a>
              </div>
              <p class="footer-copy">&copy; 2026 {{ systemName }} 版权所有</p>
            </div>
          </footer>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMaintenanceStore } from '@/stores/maintenance'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { getMessageList, markAsRead } from '@/api/user.js'
import { useMessageStore } from '@/stores/message'
import { useMessageWebSocket } from '@/composables/useMessageWebSocket'
import { subscribeTopic } from '@/utils/stompClient'
import { buildMenus, SECTION_LABELS } from '@/utils/menu'
import { asyncRoutes, ROLE_HOME } from '@/router'

import {
  User, Setting, SwitchButton, ArrowDown,
  Bell, Menu, Close, Tools
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()
const maintenanceStore = useMaintenanceStore()

// 品牌名唯一来源：.env 的 VITE_SYSTEM_NAME（顶栏品牌、footer、页标题兜底共用）
const systemName = import.meta.env.VITE_SYSTEM_NAME

// WebSocket实时通知
const { connect: wsConnect, disconnect: wsDisconnect } = useMessageWebSocket()

const connectNotificationWebSocket = () => {
  const userId = userStore.userInfo?.userId
  if (!userId) return
  wsConnect(userId, (payload) => {
    // 全站消息 WS 统一分发点：按帧类型回源对应通道的未读计数（SSOT 在 messageStore）
    const type = String(payload?.type || '').toUpperCase()
    if (type === 'NOTIFICATION') {
      // 站内消息帧 { type: 'NOTIFICATION', content: {...SystemMessage} }
      // 角标以服务端为准重新取一次，比本地 +1 可靠（多端登录/漏推都不会错）
      messageStore.loadSystemUnread(userId)
      const title = payload.content?.title
      ElMessage({ message: title ? `新通知：${title}` : '收到一条新通知', type: 'info', duration: 3000 })
      return
    }
    // 其余帧（聊天 NEW_MESSAGE 等）：刷新聊天未读合计，点亮菜单/铃铛角标
    messageStore.loadChatUnread(userStore.role)
  })
}

// ============ 系统公告广播 + 维护模式实时感知（/topic/announcements） ============
// 后端约定：
// - 公告广播帧 { type:'NOTIFICATION'|'ANNOUNCEMENT', noticeType, title, content, ... }
//   （若后端选择按人推 /user/queue/messages，上面的 NOTIFICATION 处理已能弹提示，
//     这里的 topic 订阅作为兜底广播通道，同一公告两种推送都可能到达）
// - 维护模式开/关帧 { type:'MAINTENANCE_STATUS_CHANGED', maintenanceStatus, maintenanceNotice, ... }
const maintenanceBannerText = computed(() => {
  const notice = maintenanceStore.notice || '系统维护中，请稍后再试'
  return maintenanceStore.endTime ? `${notice}（预计恢复：${maintenanceStore.endTime}）` : notice
})

let unsubscribeAnnouncements = null
const handleAnnouncementFrame = (payload) => {
  const type = String(payload?.type || '')
  // 维护模式开/关：实时更新全局维护状态（横幅/遮罩立即出现或消失）
  if (type === 'MAINTENANCE_STATUS_CHANGED') {
    maintenanceStore.setFromWs(payload)
    return
  }
  // 公告兜底广播：按人推送的 NOTIFICATION 已在上方弹过提示，topic 直接广播的公告在这里补齐
  if (type === 'NOTIFICATION' || type === 'ANNOUNCEMENT' || !type) {
    messageStore.loadSystemUnread(currentUserId.value)
    const title = payload?.title || payload?.content?.title
    const noticeType = payload?.noticeType || payload?.content?.noticeType
    ElNotification({
      title: noticeType === 'MAINTENANCE' ? '维护通知' : '系统公告',
      message: title || '收到一条新的系统公告',
      type: noticeType === 'MAINTENANCE' ? 'warning' : 'info',
      duration: 6000
    })
  }
}

const notificationDropdown = ref()
const previewNotifications = ref([])
const isMobile = ref(window.innerWidth <= 833)
const sidebarVisible = ref(false)

const totalUnread = computed(() => messageStore.totalUnread)
const chatUnread = computed(() => messageStore.chatUnread)
const notifications = computed(() => previewNotifications.value)
const loading = computed(() => messageStore.loading)

// 侧边栏菜单：从路由表（asyncRoutes 的 meta.menu）按当前角色派生，见 src/utils/menu.js。
// 顶部大标题也在这里一并给出，不再按角色写四份模板块。
const sidebarMenu = computed(() => buildMenus(asyncRoutes, userStore.role))

// 高亮用「最长前缀」匹配：详情页（/student/check-history/:paperId 等）
// 能点亮所属列表项；同族路径（/admin/paper-assignment 与其 /manual 等子项）
// 只亮最精确的一条，不会双高亮。前缀集合直接取派生菜单项的 path，不再手写数组。
const activeMenu = computed(() => {
  const path = route.path
  let best = ''
  for (const item of sidebarMenu.value.items) {
    const base = item.path
    if ((path === base || path.startsWith(`${base}/`)) && base.length > best.length) {
      best = base
    }
  }
  return best
})

const displayUserName = computed(() => {
  if (userStore.userInfo?.realName) return userStore.userInfo.realName
  if (userStore.userInfo?.username) return userStore.userInfo.username
  return '用户'
})

const getUserInitial = computed(() => {
  const name = userStore.userInfo?.realName || userStore.userInfo?.username || ''
  return name ? name.charAt(0) : ''
})

const currentUserId = computed(() => userStore.userInfo.userId || userStore.userId)

const getRoleName = computed(() => {
  const roleMap = { STUDENT: '学生', TEACHER: '指导教师', ADMIN: '管理员', SUPER_ADMIN: '超级管理员' }
  return roleMap[userStore.role] || '用户'
})

// Top nav items based on role
const topNavItems = computed(() => {
  const role = userStore.role
  if (role === 'STUDENT') return [
    { key: 'dashboard', label: '工作台', path: '/dashboard/student' },
    { key: 'paper', label: '论文管理', path: '/student/my-papers' },
    { key: 'check', label: '查重检测', path: '/student/student-check-with-websocket' },
  ]
  if (role === 'TEACHER') return [
    { key: 'dashboard', label: '工作台', path: '/teacher' },
    { key: 'review', label: '论文审核', path: '/teacher/paper-review/pending' },
    { key: 'students', label: '学生管理', path: '/teacher/student-list' },
  ]
  if (role === 'ADMIN') return [
    { key: 'dashboard', label: '工作台', path: '/dashboard/admin' },
    { key: 'papers', label: '论文管理', path: '/admin/paper-library' },
    { key: 'assign', label: '论文分配', path: '/admin/paper-assignment' },
  ]
  if (role === 'SUPER_ADMIN') return [
    { key: 'users', label: '人员管理', path: '/admin/user-management' },
    { key: 'dashboard', label: '系统运维', path: '/super-admin' },
    { key: 'config', label: '系统配置', path: '/admin/system-config' },
    { key: 'logs', label: '日志中心', path: '/admin/log-center' },
  ]
  return []
})

const isActiveSection = (key) => {
  const path = route.path
  const role = userStore.role
  // 'dashboard' 是三个角色共用 key，按角色各判各的，学生/管理员的工作台此前永远不亮
  if (key === 'dashboard') {
    if (role === 'STUDENT') return path === '/dashboard/student'
    if (role === 'ADMIN') return path === '/dashboard/admin'
    if (role === 'SUPER_ADMIN') return path === '/super-admin'
    return false
  }
  if (key === 'paper') return path.includes('/student/paper') || path.includes('/student/my-papers')
  if (key === 'check') return path.includes('/student/check') || path.includes('/student/student-check')
  if (key === 'review') return path.includes('/teacher/paper-review')
  if (key === 'students') return path.includes('/teacher/student')
  if (key === 'users') return path.includes('/admin/user')
  if (key === 'papers') return path.includes('/admin/paper-library')
  if (key === 'assign') return path.includes('/admin/paper-assignment')
  if (key === 'config') return path.includes('/admin/system-config')
  if (key === 'logs') return path.includes('/admin/log-center')
  return false
}

// 面包屑直接读路由的 meta.title —— 文案只有路由这一处出处。
//
// 这是拿掉一张 45 项的中文映射表换来的：那张表按 URL 片段查，与 router 的 meta.title
// 两份并存，已经漂了 5 处（user-management、paper-library、school-overview、
// profile/settings 互换），而且新页面漏加时兜底会把 URL 片段原样当文案显示
// （/admin/subject-management 就那样露过一版）。
//
// 层级改由路由嵌套决定，不再按 URL 分段拆：好处是 /student/check-monitor/:paperId
// 这类不再把雪花 ID 当成一级面包屑显示出来；代价是扁平注册的路由少一层
// （/admin/paper-assignment/manual 由「论文分配 / 手动分配」变成「手动论文分配」）。
// 面包屑「首页」指向的 ROLE_HOME 也统一从 @/router 导入（原本地定义已迁走，
// 与路由守卫 403 兜底、Login 已登录重定向共用同一张表）。

// 角色分区父路由（/student /teacher /admin /super-admin）的面包屑父级按当前
// 角色显示侧边栏同款分区名：超管访问 /admin/* 时「管理员」这个父级对不上
// 他的视角，应显示「系统管理」；ADMIN 同理显示「业务管理」。
const ROLE_SECTION_PATHS = new Set(['/student', '/teacher', '/admin', '/super-admin'])

// 无默认子路由的父级容器：点击只会落到没有内容的空 MainLayout（白屏），
// 面包屑里渲染为纯文本，不给 :to。/teacher、/super-admin 有 '' 子路由可正常跳转。
const BREADCRUMB_TEXT_ONLY = new Set(['/dashboard', '/student', '/admin'])

const breadcrumbItems = computed(() => {
  const homePath = ROLE_HOME[userStore.role] || '/message-center'
  const items = [{ title: '首页', path: homePath }]
  route.matched.forEach(record => {
    const raw = record.meta?.title
    if (!raw) return
    const title = ROLE_SECTION_PATHS.has(record.path)
      ? (SECTION_LABELS[userStore.role] || raw)
      : raw
    // 父级布局与默认子路由可能同标题（/message-center 两级都是「消息中心」），
    // 连出两条一模一样的面包屑没有意义，跳过重复的那条
    if (title === items[items.length - 1].title) return
    // path 为 null 的项只显示文字不可点击
    items.push({ title, path: BREADCRUMB_TEXT_ONLY.has(record.path) ? null : record.path })
  })
  return items
})

const currentPageTitle = computed(() => {
  const last = breadcrumbItems.value[breadcrumbItems.value.length - 1]
  return last?.title || systemName
})

const toggleSidebar = () => { sidebarVisible.value = !sidebarVisible.value }

const settingsPath = computed(() => {
  const r = userStore.role.toLowerCase()
  if (r === 'super_admin') return '/admin/settings'
  if (r === 'teacher') return '/teacher/profile'
  return `/${r}/settings`
})

const goToProfile = () => {
  router.push(settingsPath.value)
  if (isMobile.value) sidebarVisible.value = false
}

const goToSettings = () => {
  router.push(settingsPath.value)
  if (isMobile.value) sidebarVisible.value = false
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    userStore.logout()
    ElMessage.success('退出登录成功')
    router.push({ name: 'Login' })
  } catch {}
}

const handleNotificationDropdownChange = (visible) => {
  if (visible) { loadNotifications(); messageStore.loadSystemUnread(currentUserId.value) }
}

const loadNotifications = async () => {
  messageStore.setLoading(true)
  try {
    const userId = currentUserId.value
    if (!userId) { messageStore.setNotifications([]); return }
    const response = await getMessageList({ userId, pageNum: 1, pageSize: 5 })
    if (response.code === 200) {
      const data = response.data.records || response.data.list || []
      previewNotifications.value = data
    }
  } catch {} finally { messageStore.setLoading(false) }
}

const getNotificationIcon = (messageType) => {
  // 后端 messageType 存在两族取值：严重级（SUCCESS/INFO/WARNING/ERROR）与
  // 业务型（PAPER_REVIEW/ADVISOR_MESSAGE/SYSTEM_NOTICE）。两族都给图标，
  // 未识别的返回空由模板 v-if 隐藏，避免业务消息永远拿不到图标
  const iconMap = {
    SUCCESS: 'CircleCheckFilled',
    INFO: 'InfoFilled',
    WARNING: 'WarningFilled',
    ERROR: 'CircleCloseFilled',
    PAPER_REVIEW: 'Document',
    ADVISOR_MESSAGE: 'ChatDotRound',
    SYSTEM_NOTICE: 'Bell'
  }
  return iconMap[messageType]
}

const formatTime = (time) => {
  if (!time) return ''
  const diff = new Date() - new Date(time)
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return new Date(time).toLocaleDateString()
}

// 通知点击：未读的先调已读接口并回源角标（SSOT 约定：页面操作后 loadSystemUnread 回源，
// 不做本地加减），再按消息类型深链。深链按角色兜底——学生点教师的 PAPER_REVIEW、
// 教师点学生的 ADVISOR_MESSAGE 都会被路由守卫 403 弹回，这里先判角色再跳。
const handleNotificationClick = async (notification) => {
  const userId = currentUserId.value
  if (!notification.isRead && userId) {
    try {
      const res = await markAsRead(notification.id)
      if (res.code === 200) {
        notification.isRead = true
        messageStore.loadSystemUnread(userId)
      }
    } catch { /* 已读失败不阻断跳转，角标以服务端下次回源为准 */ }
  }
  setTimeout(() => {
    switch (notification.messageType) {
      case 'PAPER_REVIEW':
        router.push(userStore.role === 'TEACHER' ? '/teacher/paper-review/pending' : '/message-center')
        break
      case 'ADVISOR_MESSAGE':
        router.push(userStore.role === 'STUDENT' ? '/student/advisor-interaction' : '/message-center')
        break
      default: router.push('/message-center')
    }
  }, 50)
}

const goToMessageCenter = () => { router.push('/message-center') }

const handleResize = () => {
  isMobile.value = window.innerWidth <= 833
  if (!isMobile.value) sidebarVisible.value = false
}

// 用户信息可能在挂载之后才填好，所以用 watch(immediate) 统一在这一处触发；
// 别再在 onMounted 里重复调一遍 —— 重复调用会重复订阅，收到一条消息弹多次提示
// （useMessageWebSocket 内部也做了幂等，这里只是不去制造无谓的调用）。
watch(() => userStore.userInfo?.userId, (newUserId) => {
  if (newUserId) {
    messageStore.loadSystemUnread(newUserId)
    messageStore.loadChatUnread(userStore.role)
    connectNotificationWebSocket()
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 维护模式状态：启动拉取一次（失败静默降级），并订阅实时变更
  maintenanceStore.fetchStatus()
  unsubscribeAnnouncements = subscribeTopic('/topic/announcements', handleAnnouncementFrame)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  unsubscribeAnnouncements?.()
  wsDisconnect()
})
</script>

<style lang="scss" scoped>
// ── App Shell ─────────────────────────────────────────────
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f7;
}

// ── Global Nav (44px, pure black) ────────────────────────
.global-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 24px;
  background: #000000;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.global-nav-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: #ffffff;
  padding: 4px;
  cursor: pointer;
  font-size: 20px;
  &:active { transform: scale(0.95); }
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-mark {
  flex-shrink: 0;
}

.brand-name {
  font-family: "SF Pro Text", "Inter", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.12px;
  color: #ffffff;
  white-space: nowrap;
}

.global-nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.12px;
  color: #cccccc;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
  text-decoration: none;
  white-space: nowrap;

  &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.08); }
  &.active { color: #2997ff; }
}

.global-nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-badge {
  :deep(.el-badge__content) { border: none; }
}

.nav-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #cccccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-size: 16px;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.15); }
  &:active { transform: scale(0.95); }
}

.nav-user-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #cccccc;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.15); }
  &:active { transform: scale(0.95); }
}

.nav-avatar {
  background: #2997ff;
  color: #ffffff;
  font-weight: 600;
  font-size: 12px;
}

.nav-user-name { font-size: 12px; white-space: nowrap; }
.nav-chevron { font-size: 10px; margin-left: 2px; }

// ── Sub Nav (52px, frosted parchment) ────────────────────
.sub-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 24px;
  background: rgba(245, 245, 247, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  position: sticky;
  top: 44px;
  z-index: 99;
}

.sub-nav-left {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sub-nav-breadcrumb {
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner { color: #7a7a7a !important; font-size: 11px; }
    .el-breadcrumb__separator { color: #cccccc !important; }
  }
}

.sub-nav-title {
  margin: 0;
  font-family: "SF Pro Display", "Inter", system-ui, sans-serif;
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 0.231px;
  line-height: 1.19;
  color: #1d1d1f;
}

.role-badge {
  font-family: "SF Pro Text", "Inter", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.224px;
  color: #7a7a7a;
  padding: 6px 14px;
  background: #fafafc;
  border-radius: 11px;
  border: 1px solid #f0f0f0;
}

// ── App Body (sidebar + content) ──────────────────────────
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ── Sidebar (near-black, Apple-style) ────────────────────
.sidebar {
  width: 240px;
  background: #272729;
  overflow-y: auto;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar-overlay {
  display: none;
}

.sidebar-nav {
  padding: 8px 12px;
  flex: 1;
}

.sidebar-section { display: flex; flex-direction: column; gap: 1px; }

.sidebar-section-label {
  font-size: 11px;
  font-weight: 600;
  color: #7a7a7a;
  padding: 12px 12px 4px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.sidebar-sub-label {
  font-size: 11px;
  font-weight: 600;
  color: #7a7a7a;
  padding: 16px 12px 4px;
  letter-spacing: 0.5px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.224px;
  color: #cccccc;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  text-decoration: none;
  height: 36px;

  &:hover { background: rgba(255, 255, 255, 0.08); color: #ffffff; }
  &.active { background: rgba(255, 255, 255, 0.12); color: #ffffff; font-weight: 600; }

  .el-icon { font-size: 18px; flex-shrink: 0; }
  span { white-space: nowrap; }

  // 聊天未读角标：右对齐，无边框（与 nav-badge 同一约定）
  .sidebar-item-badge {
    margin-left: auto;
    :deep(.el-badge__content) { border: none; position: static; transform: none; }
  }
}

.sidebar-spacer { height: 16px; }

// ── Main Content ──────────────────────────────────────────
.main-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

// ── 维护模式（横幅 + 面板，仅非管理员角色） ────────────────
.maintenance-banner {
  border-radius: 0;
  flex-shrink: 0;
}

.maintenance-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f7;
  padding: 32px;
}

.maintenance-panel {
  text-align: center;
  max-width: 520px;

  .maintenance-icon {
    font-size: 48px;
    color: var(--apple-danger);
    margin-bottom: 16px;
  }

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #1d1d1f;
    margin: 0 0 12px;
  }

  .maintenance-notice {
    font-size: 14px;
    color: var(--apple-ink-muted-80);
    white-space: pre-wrap;
    margin: 0;
  }

  .maintenance-time {
    font-size: 13px;
    color: var(--apple-ink-secondary);
    margin: 8px 0 0;
  }

  .el-button {
    margin-top: 24px;
  }
}

.content-inner {
  flex: 1;
  padding: 32px;
}

// ── Footer (parchment, dense) ────────────────────────────
.app-footer {
  background: #f5f5f7;
  border-top: 1px solid #e0e0e0;
  padding: 48px 32px 24px;
  margin-top: auto;
}

.footer-inner {
  max-width: 980px;
  margin: 0 auto;
}

.footer-links {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;

  a {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: #7a7a7a;
    text-decoration: none;
    &:hover { color: #1d1d1f; }
  }
}

.footer-copy {
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.12px;
  color: #7a7a7a;
  margin: 0;
}

// ── Notification Dropdown ─────────────────────────────────
.notification-menu {
  width: 360px;
  max-height: 400px;
}

.notification-list { max-height: 320px; overflow-y: auto; }

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid #f0f0f0;

  &:hover { background: #f5f5f7; }
  &.unread { background: #fafafc; }

  .notification-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: #f5f5f7;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #0066cc;
    font-size: 16px;
  }

  .notification-content { flex: 1; min-width: 0; }

  .notification-title {
    font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 2px;
  }

  .notification-desc {
    font-size: 12px; color: #7a7a7a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .notification-time { font-size: 11px; color: #cccccc; margin-top: 4px; }
}

.empty-notification { padding: 24px; }

.notification-footer {
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

// ── Responsive: Tablet (≤833px) ───────────────────────────
@media (max-width: 833px) {
  .nav-menu-toggle { display: flex; }
  .global-nav-links { display: none; }
  .nav-user-name { display: none; }

  .sidebar {
    position: fixed;
    top: 96px; // 44px + 52px
    left: 0;
    bottom: 0;
    z-index: 90;
    transform: translateX(-100%);
    box-shadow: none;

    &.sidebar-open {
      transform: translateX(0);
      box-shadow: 3px 5px 30px rgba(0, 0, 0, 0.22);
    }
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    top: 96px;
    background: rgba(0, 0, 0, 0.3);
    z-index: 89;
  }

  .content-inner { padding: 24px 17px; }

  .sub-nav { padding: 0 17px; }
  .global-nav { padding: 0 17px; }
}

// ── Responsive: Phone (≤640px) ────────────────────────────
@media (max-width: 640px) {
  .role-badge { display: none; }
  .sub-nav-title { font-size: 17px; }

  .content-inner { padding: 17px 12px; }

  .notification-menu { width: 300px; }
  .app-footer { padding: 32px 17px 17px; }
}
</style>
