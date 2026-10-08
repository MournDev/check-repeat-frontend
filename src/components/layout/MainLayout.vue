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
          <span class="brand-name">论文管理系统</span>
        </div>
        <nav class="global-nav-links">
          <a
            v-for="item in topNavItems"
            :key="item.key"
            :class="['nav-link', { active: isActiveSection(item.key) }]"
            @click="navigateTo(item.path)"
          >{{ item.label }}</a>
        </nav>
      </div>
      <div class="global-nav-right">
        <!-- Notifications -->
        <el-dropdown trigger="click" placement="bottom-end" @visible-change="handleNotificationDropdownChange">
          <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="nav-badge">
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
          <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index" :to="item.path">
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
          <!-- Student Menu -->
          <div v-if="userStore.role === 'STUDENT'" class="sidebar-section">
            <div class="sidebar-section-label">学生</div>
            <a :class="['sidebar-item', { active: activeMenu === '/dashboard/student' }]" @click="navigateTo('/dashboard/student')">
              <el-icon><DataAnalysis /></el-icon><span>论文工作台</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/student/paper-submit' }]" @click="navigateTo('/student/paper-submit')">
              <el-icon><UploadFilled /></el-icon><span>论文提交</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/student/my-papers' }]" @click="navigateTo('/student/my-papers')">
              <el-icon><FolderOpened /></el-icon><span>我的论文</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/student/advisor-interaction' }]" @click="navigateTo('/student/advisor-interaction')">
              <el-icon><ChatDotRound /></el-icon><span>导师互动</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/student/file-management' }]" @click="navigateTo('/student/file-management')">
              <el-icon><Folder /></el-icon><span>文件管理</span>
            </a>
            <div class="sidebar-sub-label">查重管理</div>
            <a :class="['sidebar-item', { active: activeMenu === '/student/student-check-with-websocket' }]" @click="navigateTo('/student/student-check-with-websocket')">
              <el-icon><Document /></el-icon><span>查重任务</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/student/check-history' }]" @click="navigateTo('/student/check-history')">
              <el-icon><Histogram /></el-icon><span>查重历史</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/student/academic-integrity' }]" @click="navigateTo('/student/academic-integrity')">
              <el-icon><Notebook /></el-icon><span>学术诚信</span>
            </a>
            <div class="sidebar-spacer"></div>
            <a :class="['sidebar-item', { active: activeMenu === '/student/settings' }]" @click="navigateTo('/student/settings')">
              <el-icon><Setting /></el-icon><span>个人设置</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/student/help-center' }]" @click="navigateTo('/student/help-center')">
              <el-icon><Service /></el-icon><span>帮助中心</span>
            </a>
          </div>

          <!-- Teacher Menu -->
          <div v-if="userStore.role === 'TEACHER'" class="sidebar-section">
            <div class="sidebar-section-label">教师</div>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher' }]" @click="navigateTo('/teacher')">
              <el-icon><DataBoard /></el-icon><span>审核工作台</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/student-list' }]" @click="navigateTo('/teacher/student-list')">
              <el-icon><UserFilled /></el-icon><span>学生管理</span>
            </a>
            <div class="sidebar-sub-label">论文审核</div>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/paper-review/pending' }]" @click="navigateTo('/teacher/paper-review/pending')">
              <el-icon><Clock /></el-icon><span>待审核论文</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/paper-review/audit-records' }]" @click="navigateTo('/teacher/paper-review/audit-records')">
              <el-icon><Histogram /></el-icon><span>审核记录</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/data-statistics' }]" @click="navigateTo('/teacher/data-statistics')">
              <el-icon><TrendCharts /></el-icon><span>数据统计</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/review-templates' }]" @click="navigateTo('/teacher/review-templates')">
              <el-icon><Document /></el-icon><span>审核意见模板</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/student-groups' }]" @click="navigateTo('/teacher/student-groups')">
              <el-icon><UserFilled /></el-icon><span>学生分组管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/chat-center' }]" @click="navigateTo('/teacher/chat-center')">
              <el-icon><ChatDotRound /></el-icon><span>在线聊天</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/file-management' }]" @click="navigateTo('/teacher/file-management')">
              <el-icon><Folder /></el-icon><span>文件管理</span>
            </a>
            <div class="sidebar-spacer"></div>
            <a :class="['sidebar-item', { active: activeMenu === '/teacher/profile' }]" @click="navigateTo('/teacher/profile')">
              <el-icon><Setting /></el-icon><span>我的设置</span>
            </a>
          </div>

          <!-- Admin Menu (业务管理员 — 管"事") -->
          <div v-if="userStore.role === 'ADMIN'" class="sidebar-section">
            <div class="sidebar-section-label">业务管理</div>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/school-overview' }]" @click="navigateTo('/admin/school-overview')">
              <el-icon><DataAnalysis /></el-icon><span>全校概览</span>
            </a>
            <div class="sidebar-sub-label">论文管理</div>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/paper-library' }]" @click="navigateTo('/admin/paper-library')">
              <el-icon><Files /></el-icon><span>论文库</span>
            </a>
            <div class="sidebar-sub-label">论文分配</div>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/paper-assignment' }]" @click="navigateTo('/admin/paper-assignment')">
              <el-icon><Connection /></el-icon><span>导师分配</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/paper-assignment/manual' }]" @click="navigateTo('/admin/paper-assignment/manual')">
              <el-icon><Pointer /></el-icon><span>手动分配</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/paper-assignment/auto' }]" @click="navigateTo('/admin/paper-assignment/auto')">
              <el-icon><MagicStick /></el-icon><span>自动分配</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/paper-assignment/history' }]" @click="navigateTo('/admin/paper-assignment/history')">
              <el-icon><Notebook /></el-icon><span>分配记录</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/report-management' }]" @click="navigateTo('/admin/report-management')">
              <el-icon><Histogram /></el-icon><span>报告管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/knowledge-management' }]" @click="navigateTo('/admin/knowledge-management')">
              <el-icon><Collection /></el-icon><span>知识库管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/check-rule-management' }]" @click="navigateTo('/admin/check-rule-management')">
              <el-icon><Setting /></el-icon><span>查重规则</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/compare-lib-management' }]" @click="navigateTo('/admin/compare-lib-management')">
              <el-icon><Files /></el-icon><span>比对库管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/subject-management' }]" @click="navigateTo('/admin/subject-management')">
              <el-icon><Grid /></el-icon><span>学科领域管理</span>
            </a>
            <div class="sidebar-sub-label">系统管理</div>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/system-notice-management' }]" @click="navigateTo('/admin/system-notice-management')">
              <el-icon><Bell /></el-icon><span>通知管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/message-template-management' }]" @click="navigateTo('/admin/message-template-management')">
              <el-icon><Document /></el-icon><span>消息模板</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/log-center' }]" @click="navigateTo('/admin/log-center')">
              <el-icon><Document /></el-icon><span>日志中心</span>
            </a>
            <div class="sidebar-spacer"></div>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/settings' }]" @click="navigateTo('/admin/settings')">
              <el-icon><Setting /></el-icon><span>个人设置</span>
            </a>
          </div>

          <!-- Super Admin Menu (系统管理员 — 管"人" + 系统运维) -->
          <div v-if="userStore.role === 'SUPER_ADMIN'" class="sidebar-section">
            <div class="sidebar-section-label">人员管理</div>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/user-management' }]" @click="navigateTo('/admin/user-management')">
              <el-icon><UserFilled /></el-icon><span>用户管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/school-overview' }]" @click="navigateTo('/admin/school-overview')">
              <el-icon><DataAnalysis /></el-icon><span>全校概览</span>
            </a>
            <div class="sidebar-sub-label">系统运维</div>
            <a :class="['sidebar-item', { active: activeMenu === '/super-admin' }]" @click="navigateTo('/super-admin')">
              <el-icon><Monitor /></el-icon><span>系统概览</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/super-admin/system-config' }]" @click="navigateTo('/super-admin/system-config')">
              <el-icon><Tools /></el-icon><span>系统配置</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/super-admin/similarity-thresholds' }]" @click="navigateTo('/super-admin/similarity-thresholds')">
              <el-icon><TrendCharts /></el-icon><span>相似度阈值</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/super-admin/review-workflow' }]" @click="navigateTo('/super-admin/review-workflow')">
              <el-icon><Connection /></el-icon><span>审核工作流</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/check-rule-management' }]" @click="navigateTo('/admin/check-rule-management')">
              <el-icon><Setting /></el-icon><span>查重规则</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/compare-lib-management' }]" @click="navigateTo('/admin/compare-lib-management')">
              <el-icon><Files /></el-icon><span>比对库管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/subject-management' }]" @click="navigateTo('/admin/subject-management')">
              <el-icon><Grid /></el-icon><span>学科领域管理</span>
            </a>
            <div class="sidebar-sub-label">监控与日志</div>
            <a :class="['sidebar-item', { active: activeMenu === '/super-admin/log-center' }]" @click="navigateTo('/super-admin/log-center')">
              <el-icon><Document /></el-icon><span>日志中心</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/super-admin/system-monitoring' }]" @click="navigateTo('/super-admin/system-monitoring')">
              <el-icon><Monitor /></el-icon><span>系统监控</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/system-notice-management' }]" @click="navigateTo('/admin/system-notice-management')">
              <el-icon><Bell /></el-icon><span>通知管理</span>
            </a>
            <a :class="['sidebar-item', { active: activeMenu === '/admin/message-template-management' }]" @click="navigateTo('/admin/message-template-management')">
              <el-icon><Document /></el-icon><span>消息模板</span>
            </a>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
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
            <p class="footer-copy">&copy; 2026 论文管理系统 版权所有</p>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUnreadCount, getMessageList } from '@/api/user.js'
import { useMessageStore } from '@/stores/message'
import { useMessageWebSocket } from '@/composables/useMessageWebSocket'

import {
  Notebook, User, UserFilled, Setting, SwitchButton, ArrowDown,
  UploadFilled, Folder, FolderOpened, ChatDotRound, DataAnalysis,
  DataBoard, EditPen, TrendCharts, Clock, Histogram,
  Monitor, Avatar, Lock, Connection, Pointer, MagicStick,
  Tools, Document, Bell, Files, Service, Check, Menu, Close, Collection, Grid
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

// WebSocket实时通知
const { connect: wsConnect, disconnect: wsDisconnect } = useMessageWebSocket()

const connectNotificationWebSocket = () => {
  const userId = userStore.userInfo?.userId
  if (!userId) return
  wsConnect(userId, (payload) => {
    // 后端推的帧：{ type: 'NOTIFICATION', content: {...SystemMessage} }
    if (String(payload?.type || '').toUpperCase() !== 'NOTIFICATION') return
    // 角标以服务端为准重新取一次，比本地 +1 可靠（多端登录/漏推都不会错）
    loadUnreadCount()
    const title = payload.content?.title
    ElMessage({ message: title ? `新通知：${title}` : '收到一条新通知', type: 'info', duration: 3000 })
  })
}

const notificationDropdown = ref()
const previewNotifications = ref([])
const isMobile = ref(window.innerWidth <= 833)
const sidebarVisible = ref(false)

const unreadCount = computed(() => messageStore.unreadCount)
const notifications = computed(() => previewNotifications.value)
const loading = computed(() => messageStore.loading)

const activeMenu = computed(() => route.path)

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
    { key: 'papers', label: '论文管理', path: '/admin/paper-library' },
    { key: 'assign', label: '论文分配', path: '/admin/paper-assignment/manual' },
  ]
  if (role === 'SUPER_ADMIN') return [
    { key: 'users', label: '人员管理', path: '/admin/user-management' },
    { key: 'dashboard', label: '系统运维', path: '/super-admin' },
    { key: 'config', label: '系统配置', path: '/super-admin/system-config' },
    { key: 'logs', label: '日志中心', path: '/super-admin/log-center' },
  ]
  return []
})

const isActiveSection = (key) => {
  const path = route.path
  if (key === 'dashboard') return path === '/super-admin'
  if (key === 'paper') return path.includes('/student/paper') || path.includes('/student/my-papers')
  if (key === 'check') return path.includes('/student/check') || path.includes('/student/student-check')
  if (key === 'review') return path.includes('/teacher/paper-review')
  if (key === 'students') return path.includes('/teacher/student')
  if (key === 'users') return path.includes('/admin/user')
  if (key === 'papers') return path.includes('/admin/paper-library')
  if (key === 'assign') return path.includes('/admin/paper-assignment')
  if (key === 'config') return path.includes('/super-admin/system-config')
  if (key === 'logs') return path.includes('/super-admin/log-center')
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
// 各角色的落地页。以前这里是一律拼 `/dashboard/<role>`，但 /dashboard 下只有 student
// 和 admin 两个子路由：TEACHER 会拼出并不存在的 /dashboard/teacher，教师点面包屑里的
// 「首页」直接落 404。取值与侧边栏 topNavItems 里那条「工作台」保持一致 ——
// 教师的工作台就是 /teacher，侧边栏一直是这么指的，只有这里拼错了。
// 认不出的角色（LAB_ASSISTANT 等）在侧边栏没有入口，退回不需要角色权限的消息中心，
// 否则「首页」会是个死链。
const ROLE_HOME = {
  STUDENT: '/dashboard/student',
  TEACHER: '/teacher',
  ADMIN: '/dashboard/admin',
  SUPER_ADMIN: '/super-admin',
}

const breadcrumbItems = computed(() => {
  const homePath = ROLE_HOME[userStore.role] || '/message-center'
  const items = [{ title: '首页', path: homePath }]
  route.matched.forEach(record => {
    const title = record.meta?.title
    if (!title) return
    // 父级布局与默认子路由可能同标题（/message-center 两级都是「消息中心」），
    // 连出两条一模一样的面包屑没有意义，跳过重复的那条
    if (title === items[items.length - 1].title) return
    items.push({ title, path: record.path })
  })
  return items
})

const currentPageTitle = computed(() => {
  const last = breadcrumbItems.value[breadcrumbItems.value.length - 1]
  return last?.title || '论文管理系统'
})

const navigateTo = (path) => {
  router.push(path)
  if (isMobile.value) sidebarVisible.value = false
}

const toggleSidebar = () => { sidebarVisible.value = !sidebarVisible.value }

const settingsPath = computed(() => {
  const r = userStore.role.toLowerCase()
  if (r === 'super_admin') return '/super-admin'
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
  if (visible) { loadNotifications(); loadUnreadCount() }
}

const loadUnreadCount = async () => {
  try {
    const userId = currentUserId.value
    if (!userId) { messageStore.setUnreadCount(0); return }
    const response = await getUnreadCount(userId)
    if (response.code === 200) messageStore.setUnreadCount(response.data)
  } catch { messageStore.setUnreadCount(0) }
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
  const iconMap = { SUCCESS: 'CircleCheckFilled', INFO: 'InfoFilled', WARNING: 'WarningFilled', ERROR: 'CircleCloseFilled' }
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

const handleNotificationClick = (notification) => {
  if (!notification.isRead) { notification.isRead = true }
  setTimeout(() => {
    switch (notification.messageType) {
      case 'PAPER_REVIEW': router.push('/teacher/paper-review/pending'); break
      case 'ADVISOR_MESSAGE': router.push('/student/advisor-interaction'); break
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
    loadUnreadCount()
    connectNotificationWebSocket()
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  wsDisconnect()
})
</script>

<style lang="scss" scoped>
// ── Icon sizing ───────────────────────────────────────────
:deep(.el-icon) {
  svg { width: 20px !important; height: 20px !important; max-width: 20px !important; max-height: 20px !important; }
}

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
}

.sidebar-spacer { height: 16px; }

// ── Main Content ──────────────────────────────────────────
.main-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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
