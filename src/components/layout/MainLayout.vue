<template>
  <div class="app-shell">
    <!-- 键盘用户跳过导航直达内容 -->
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <!-- Global Nav (ultra-thin, pure black) -->
    <header class="global-nav">
      <div class="global-nav-left">
        <button class="nav-menu-toggle" @click="toggleSidebar" v-if="isMobile">
          <el-icon><component :is="sidebarVisible ? Close : Menu" /></el-icon>
        </button>
        <div class="brand">
          <svg class="brand-mark" width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="var(--app-color-primary-on-dark)" fill-opacity="0.9"/>
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="var(--app-color-on-primary)" fill-opacity="0.5"/>
          </svg>
          <span class="brand-name">{{ systemName }}</span>
        </div>
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
              <el-dropdown-item v-if="userStore.role !== 'SUPER_ADMIN'" @click="goToSettings">
                <el-icon><Setting /></el-icon><span>个人设置</span>
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
      <div :class="['sub-nav-inner', { 'sub-nav-inner--full': route.meta.fullBleed }]">
        <div class="sub-nav-left">
          <el-breadcrumb separator="/" class="sub-nav-breadcrumb">
            <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index" :to="item.path || undefined">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <h1 class="sub-nav-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="sub-nav-right">
          <span class="role-badge">{{ getRoleName }}</span>
        </div>
      </div>
    </div>

    <!-- Main Layout: Sidebar + Content -->
    <div class="app-body">
      <!-- Mobile overlay 必须是 aside 的兄弟节点：
           移动端 aside 带 transform，会成为 fixed 子元素的包含块，
           放在 aside 内会让遮罩只覆盖抽屉自身，菜单点击会被遮罩拦截 -->
      <div v-if="isMobile && sidebarVisible" class="sidebar-overlay" @click="toggleSidebar"></div>

      <!-- Sidebar (near-black, Apple-style) -->
      <aside :class="['sidebar', { 'sidebar-open': sidebarVisible, 'sidebar-closed': !sidebarVisible && isMobile }]">
        <nav class="sidebar-nav">
          <!-- 菜单项从路由表（asyncRoutes 的 meta.menu）按角色派生，见 src/utils/menu.js -->
          <div class="sidebar-section">
            <div class="sidebar-section-label">{{ sidebarMenu.label }}</div>
            <template v-for="(group, index) in sidebarMenu.groups" :key="group.key || `plain-${index}`">
              <button
                v-if="group.label"
                type="button"
                class="sidebar-group-toggle"
                :aria-expanded="isGroupOpen(group)"
                @click="toggleGroup(group.key)"
              >
                <span>{{ group.label }}</span>
                <el-icon :class="['sidebar-group-chevron', { open: isGroupOpen(group) }]"><ArrowDown /></el-icon>
              </button>
              <div v-if="!group.label || isGroupOpen(group)" class="sidebar-group-items">
                <template v-for="item in group.items" :key="item.path">
                  <div v-if="item.spacer" class="sidebar-spacer"></div>
                  <router-link :to="item.path" :class="['sidebar-item', { active: activeMenu === item.path }]">
                    <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                    <span>{{ item.label }}</span>
                    <el-badge v-if="item.badge === 'chat' && chatUnread > 0" :value="chatUnread" :max="99" class="sidebar-item-badge" />
                  </router-link>
                </template>
              </div>
            </template>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main id="main-content" class="main-content" tabindex="-1">
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
          <div :class="['content-inner', { 'content-inner--full': route.meta.fullBleed }]">
            <router-view v-slot="{ Component }">
              <component :is="Component" />
            </router-view>
          </div>

          <!-- Footer -->
          <footer class="app-footer">
            <div class="footer-inner">
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
import { formatDate } from '@/utils/dataType.js'
import { asyncRoutes, ROLE_HOME } from '@/router'

import {
  Setting, SwitchButton, ArrowDown,
  Bell, Menu, Close, Tools,
  CircleCheckFilled, InfoFilled, WarningFilled, CircleCloseFilled, Document, ChatDotRound
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
// 与 CSS 的 @media (max-width: 1024px) 保持一致：iPad 竖屏/横屏统一走抽屉模式
const MOBILE_BREAKPOINT = 1024
const isMobile = ref(window.innerWidth <= MOBILE_BREAKPOINT)
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
const menuItems = computed(() => sidebarMenu.value.groups.flatMap(group => group.items))

const activeMenu = computed(() => {
  const path = route.path
  let best = ''
  for (const item of menuItems.value) {
    const base = item.path
    const aliasHit = (item.activeMatch || []).some(
      alias => path === alias || path.startsWith(`${alias}/`)
    )
    if ((path === base || path.startsWith(`${base}/`) || aliasHit) && base.length > best.length) {
      best = base
    }
  }
  return best
})

// 分组折叠：默认全部展开，只记录用户主动收起的 key。
// （此前用 expandedGroups 白名单，初始只展开当前页面所在分组，
//   一登录侧栏就是大片空黑，二级菜单还需要多点一次才出现。）
const collapsedGroups = ref([])

const activeGroupKey = computed(() => {
  const group = sidebarMenu.value.groups.find(
    g => g.items.some(item => item.path === activeMenu.value)
  )
  return group?.key || ''
})

const isGroupOpen = (group) => !group.label || !collapsedGroups.value.includes(group.key)

const toggleGroup = (key) => {
  collapsedGroups.value = collapsedGroups.value.includes(key)
    ? collapsedGroups.value.filter(k => k !== key)
    : [...collapsedGroups.value, key]
}

// 深链/跳转进入被用户收起的所属分组时，自动把它重新展开
watch(activeGroupKey, (key) => {
  if (key && collapsedGroups.value.includes(key)) {
    collapsedGroups.value = collapsedGroups.value.filter(k => k !== key)
  }
}, { immediate: true })

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

// 移动端点击菜单完成路由跳转后自动收起抽屉：
// router-link 没有点击回调，统一监听路由变化兜底，避免抽屉继续遮挡内容
watch(() => route.fullPath, () => {
  if (isMobile.value) sidebarVisible.value = false
})

const settingsPath = computed(() => {
  const r = userStore.role.toLowerCase()
  if (r === 'super_admin') return '/admin/settings'
  if (r === 'teacher') return '/teacher/profile'
  return `/${r}/settings`
})

const goToSettings = () => {
  router.push(settingsPath.value)
  if (isMobile.value) sidebarVisible.value = false
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    // 必须 await：logout 内部要等 apiLogout 返回后才清 token。
    // 不 await 的话跳转登录页时 token 仍在，Login onMounted 的「已登录跳角色首页」
    // 会把人弹回工作台，卡在无菜单无数据的空壳页
    await userStore.logout()
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
  // 未识别的返回空由模板 v-if 隐藏，避免业务消息永远拿不到图标。
  // 值为组件对象（非字符串名）：全局图标注册已移除，字符串无法解析。
  const iconMap = {
    SUCCESS: CircleCheckFilled,
    INFO: InfoFilled,
    WARNING: WarningFilled,
    ERROR: CircleCloseFilled,
    PAPER_REVIEW: Document,
    ADVISOR_MESSAGE: ChatDotRound,
    SYSTEM_NOTICE: Bell
  }
  return iconMap[messageType]
}

const formatTime = (time) => {
  if (!time) return ''
  const diff = new Date() - new Date(time)
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return formatDate(time)
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
        router.push(userStore.role === 'TEACHER' ? '/teacher/review-workbench' : '/message-center')
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
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
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
  // 移动浏览器地址栏会吞掉 100vh 的底部，dvh 取真实可视高度
  height: 100dvh;
  background: var(--app-color-page-bg);
  font-family: var(--app-font-family);
}

// ── Skip link：仅键盘聚焦时出现 ───────────────────────────
.skip-link {
  position: fixed;
  top: -60px;
  left: var(--app-space-3);
  z-index: 300;
  padding: var(--app-space-2) var(--app-space-3);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-color-card-bg);
  color: var(--app-color-ink);
  font-size: var(--app-fs-caption);
  font-weight: 600;
  transition: top var(--app-transition-fast);

  &:focus { top: var(--app-space-2); }
}

// ── Global Nav (44px, 深色，与侧边栏同色) ─────────────────
// 原背景引用 --app-color-card-bg-black（全项目未定义），退化为透明，
// 露出 app-shell 的浅灰页底，而品牌名用的是白色 --app-color-card-bg，
// 白字压浅灰几乎不可辨。改为与侧边栏统一取 --app-color-nav-bg，
// 形成「深色顶栏 + 深色侧栏 + 浅色内容区」的包围结构。
.global-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--app-global-nav-height);
  padding: 0 var(--app-space-6);
  background: var(--app-color-nav-bg);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.global-nav-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-6);
}

.nav-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--app-color-nav-text-strong);
  padding: var(--app-space-1);
  cursor: pointer;
  font-size: 20px;
  &:active { transform: scale(0.95); }
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
}

.brand-mark {
  flex-shrink: 0;
}

.brand-name {
  font-family: "SF Pro Text", "Inter", system-ui, sans-serif;
  font-size: var(--app-fs-body);
  font-weight: 600;
  letter-spacing: 0;
  color: var(--app-color-nav-text-strong);
  white-space: nowrap;
}

.global-nav-right {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
}

.nav-badge {
  :deep(.el-badge__content) { border: none; }
}

.nav-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--app-radius-sm);
  background: rgba(var(--app-color-white-rgb), 0.08);
  border: none;
  color: var(--app-color-nav-text-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-size: var(--app-fs-heading);
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover { color: var(--app-color-nav-text-strong); background: rgba(var(--app-color-white-rgb), 0.16); }
  &:active { transform: scale(0.95); }
}

.nav-user-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--app-space-1) 10px var(--app-space-1) var(--app-space-1);
  border-radius: var(--app-radius-sm);
  background: rgba(var(--app-color-white-rgb), 0.08);
  border: none;
  color: var(--app-color-nav-text-strong);
  cursor: pointer;
  font-size: var(--app-fs-meta);
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover { color: var(--app-color-nav-text-strong); background: rgba(var(--app-color-white-rgb), 0.16); }
  &:active { transform: scale(0.95); }
}

.nav-avatar {
  background: var(--app-color-primary-on-dark);
  color: var(--app-color-ink);
  font-weight: 600;
  font-size: 12px;
  border-radius: var(--app-radius-pill);
}

.nav-user-name { font-size: var(--app-fs-meta); font-weight: 600; color: var(--app-color-nav-text-strong); white-space: nowrap; }
.nav-chevron { font-size: 10px; margin-left: 2px; color: var(--app-color-nav-text-strong); }

// ── Sub Nav (48px, 白底，与页面底色分层) ────────────────────
// 原为毛玻璃羊皮纸色（rgba(245,245,247,.8)），与页面底色同色，
// 只靠 1px 分隔线区分，顶栏层级实际是「平的」；改实心白底后
// 与 --app-color-page-bg 形成明确的前后层次。
.sub-nav {
  height: var(--app-subnav-height);
  padding: 0;
  background: var(--app-color-card-bg);
  border-bottom: 1px solid var(--app-color-border);
  flex-shrink: 0;
  position: sticky;
  top: var(--app-global-nav-height);
  z-index: 99;
}

.sub-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-4);
  width: 100%;
  // 顶栏横跨全宽，内层按「侧边栏宽度 + 内容最大宽度」居中，
  // 左内边距补上侧边栏宽度与内容区 gutter，使标题与内容区文字左边缘对齐
  max-width: calc(var(--app-content-max) + var(--app-sidebar-width));
  height: 100%;
  margin: 0 auto;
  padding-left: calc(var(--app-sidebar-width) + var(--app-page-gutter));
  padding-right: var(--app-page-gutter);
}

// fullBleed 页面（ReviewWorkbench）使用更宽的内容上限，子导航同步放宽，
// 避免超宽屏下标题比内容左边缘向右偏移
.sub-nav-inner--full {
  max-width: calc(var(--app-content-max-wide) + var(--app-sidebar-width));
}

.sub-nav-left {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.sub-nav-breadcrumb {
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner { color: var(--app-color-text-muted) !important; font-size: var(--app-fs-meta); }
    // 分隔符原用 --app-color-text-on-dark(#ccc)，在白底 sub-nav 上几乎不可见
    .el-breadcrumb__separator { color: var(--app-color-text-muted) !important; }
  }
}

.sub-nav-title {
  margin: 0;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-title);
  font-weight: 600;
  letter-spacing: 0;
  line-height: var(--app-lh-heading);
  color: var(--app-color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  font-family: "SF Pro Text", "Inter", system-ui, sans-serif;
  font-size: var(--app-fs-caption);
  font-weight: 400;
  letter-spacing: -0.224px;
  color: var(--app-color-text-muted);
  padding: var(--app-space-1) var(--app-space-3);
  background: var(--app-color-fill-light);
  border-radius: 11px;
  border: 1px solid var(--app-color-divider);
}

// ── App Body (sidebar + content) ──────────────────────────
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ── Sidebar (near-black, Apple-style) ────────────────────
.sidebar {
  width: var(--app-sidebar-width);
  background: var(--app-color-nav-bg);
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
  padding: var(--app-space-2) var(--app-space-3);
  flex: 1;
}

.sidebar-section { display: flex; flex-direction: column; gap: 1px; }

.sidebar-section-label {
  font-size: var(--app-fs-meta);
  font-weight: 600;
  // 原 --app-color-text-muted(#7a7a7a) 在 #272729 上仅 3.4:1，低于 AA；
  // 提到 slate-faint 后约 5.7:1。
  color: var(--app-color-nav-text-muted);
  padding: var(--app-space-3) var(--app-space-3) var(--app-space-1);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.sidebar-group-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: var(--app-space-2);
  padding: var(--app-space-2) var(--app-space-3) var(--app-space-1);
  border: none;
  background: transparent;
  font-size: var(--app-fs-meta);
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--app-color-nav-text-muted);
  cursor: pointer;

  &:hover { color: var(--app-color-nav-text); }
}

.sidebar-group-chevron {
  font-size: 12px;
  transition: transform 0.2s ease;

  &.open { transform: rotate(180deg); }
}

.sidebar-group-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  padding: 0 var(--app-space-3);
  border-radius: var(--app-radius-sm);
  font-size: var(--app-fs-body);
  font-weight: 400;
  letter-spacing: -0.224px;
  color: var(--app-color-nav-text);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  text-decoration: none;
  height: var(--app-sidebar-item-h);

  &:hover { background: rgba(var(--app-color-white-rgb), 0.08); color: var(--app-color-card-bg); }
  &.active { background: rgba(var(--app-color-white-rgb), 0.12); color: var(--app-color-card-bg); font-weight: 600; }

  .el-icon { font-size: 18px; flex-shrink: 0; }
  span { white-space: nowrap; }

  // 聊天未读角标：右对齐，无边框（与 nav-badge 同一约定）
  .sidebar-item-badge {
    margin-left: auto;
    :deep(.el-badge__content) { border: none; position: static; transform: none; }
  }
}

.sidebar-spacer { height: var(--app-space-4); }

// 深色底上的键盘焦点环用亮蓝，保证对比度
.sidebar-item:focus-visible,
.sidebar-group-toggle:focus-visible,
.nav-icon-btn:focus-visible,
.nav-user-btn:focus-visible,
.nav-menu-toggle:focus-visible {
  outline: 2px solid var(--app-color-primary-on-dark);
  outline-offset: 2px;
}

// ── Main Content ──────────────────────────────────────────
.main-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  // 跳过导航的落点不需要焦点环（非交互区域）
  &:focus { outline: none; }
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
  background: var(--app-color-page-bg);
  padding: var(--app-page-gutter);
}

.maintenance-panel {
  text-align: center;
  max-width: 520px;

  .maintenance-icon {
    font-size: 48px;
    color: var(--app-color-danger);
    margin-bottom: var(--app-space-4);
  }

  h2 {
    font-size: var(--app-fs-title);
    font-weight: 600;
    color: var(--app-color-ink);
    margin: 0 0 var(--app-space-3);
  }

  .maintenance-notice {
    font-size: var(--app-fs-caption);
    color: var(--app-color-text);
    white-space: pre-wrap;
    margin: 0;
  }

  .maintenance-time {
    font-size: var(--app-fs-meta);
    color: var(--app-color-text-secondary);
    margin: var(--app-space-2) 0 0;
  }

  .el-button {
    margin-top: var(--app-space-6);
  }
}

.content-inner {
  flex: 1;
  width: 100%;
  max-width: var(--app-content-max);
  margin: 0 auto;
  padding: var(--app-page-gutter);
}

// 工作台类页面（route.meta.fullBleed）突破 1440 上限，但保留 1920 上限，
// 避免 4K/超宽屏下三栏与论文预览被无限拉伸
.content-inner--full {
  max-width: var(--app-content-max-wide);
}

// ── Footer (page bg, dense) ──────────────────────────────
.app-footer {
  background: var(--app-color-page-bg);
  border-top: 1px solid var(--app-color-border);
  padding: var(--app-space-8) 0 var(--app-space-4);
  margin-top: auto;
}

.footer-inner {
  max-width: var(--app-content-max);
  margin: 0 auto;
  padding: 0 var(--app-page-gutter);
}

.footer-copy {
  font-size: var(--app-fs-meta);
  font-weight: 400;
  color: var(--app-color-text-muted);
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
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4);
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid var(--app-color-divider);

  &:hover { background: var(--app-color-fill); }
  &.unread { background: var(--app-color-fill-light); }

  .notification-icon {
    width: 32px; height: 32px;
    border-radius: var(--app-radius-sm);
    background: var(--app-color-fill);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: var(--app-color-primary);
    font-size: var(--app-fs-heading);
  }

  .notification-content { flex: 1; min-width: 0; }

  .notification-title {
    font-size: var(--app-fs-caption); font-weight: 600; color: var(--app-color-ink); margin-bottom: var(--app-space-1);
  }

  .notification-desc {
    font-size: var(--app-fs-meta); color: var(--app-color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .notification-time { font-size: var(--app-fs-meta); color: var(--app-color-text-muted); margin-top: var(--app-space-1); }
}

.empty-notification { padding: var(--app-space-6); }

.notification-footer {
  padding: var(--app-space-3) var(--app-space-4);
  text-align: center;
  border-top: 1px solid var(--app-color-divider);
}

// ── Responsive: Tablet / iPad (≤1024px) ───────────────────
@media (max-width: 1024px) {
  .nav-menu-toggle { display: flex; }
  .nav-user-name { display: none; }

  .sidebar {
    position: fixed;
    top: calc(var(--app-global-nav-height) + var(--app-subnav-height));
    left: 0;
    bottom: 0;
    z-index: 90;
    transform: translateX(-100%);
    box-shadow: none;

    &.sidebar-open {
      transform: translateX(0);
      box-shadow: 0 8px 24px rgba(var(--app-color-shadow-rgb), 0.18);
    }
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    top: calc(var(--app-global-nav-height) + var(--app-subnav-height));
    background: rgba(var(--app-color-shadow-rgb), 0.3);
    z-index: 89;
  }

  .content-inner { padding: var(--app-space-4) var(--app-space-3); }

  .sub-nav-inner { padding: 0 var(--app-space-3); }
  .global-nav { padding: 0 var(--app-space-3); }
}

// ── Responsive: Phone (≤640px) ────────────────────────────
@media (max-width: 640px) {
  .role-badge { display: none; }
  .sub-nav-title { font-size: var(--app-fs-heading); }

  .sub-nav-breadcrumb,
  .sub-nav-right { display: none; }

  .content-inner { padding: var(--app-space-3) var(--app-page-gutter-mobile); }

  .notification-menu { width: 300px; }
  .app-footer { padding: var(--app-space-6) 0 var(--app-space-3); }
  .footer-inner { padding: 0 var(--app-page-gutter-mobile); }
}
</style>
