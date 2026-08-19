<template>
  <el-container class="main-container">
    <!-- 移动端遮罩层 -->
    <div 
      v-if="isMobile && sidebarVisible" 
      class="mobile-overlay" 
      @click="toggleSidebar"
    ></div>
    
    <!-- 侧边栏 -->
    <el-aside 
      :width="sidebarWidth" 
      class="aside-container" 
      :class="{ 'mobile-sidebar': isMobile, 'sidebar-hidden': isMobile && !sidebarVisible }"
    >
      <div class="logo">
        <div class="logo-icon">
          <el-icon>
            <Notebook />
          </el-icon>
        </div>
        <span class="logo-text" :class="{ 'hidden': isMobile && !sidebarVisible }">论文管理系统</span>
      </div>

      <!-- 移动端菜单开关 -->
      <div v-if="isMobile" class="mobile-menu-toggle" @click="toggleSidebar">
        <el-icon>
          <component :is="sidebarVisible ? 'Close' : 'Menu'" />
        </el-icon>
      </div>

      <!-- 学生端菜单 -->
      <el-menu v-if="userStore.role === 'STUDENT'" :default-active="activeMenu" class="aside-menu" router
        background-color="#2c3e50" text-color="#bdc3c7" active-text-color="#409EFF">
        <el-menu-item index="/dashboard/student">
          <el-icon>
            <DataAnalysis />
          </el-icon>
          <span>论文工作台</span>
        </el-menu-item>

        <el-menu-item index="/student/paper-submit">
          <el-icon>
            <UploadFilled />
          </el-icon>
          <span>论文提交</span>
        </el-menu-item>

        <el-menu-item index="/student/my-papers">
          <el-icon>
            <FolderOpened />
          </el-icon>
          <span>我的论文</span>
        </el-menu-item>

        <el-menu-item index="/student/advisor-interaction">
          <el-icon>
            <ChatDotRound />
          </el-icon>
          <span>导师互动</span>
        </el-menu-item>

        <!-- 查重功能菜单 -->
        <el-sub-menu index="/student/check">
          <template #title>
            <el-icon>
              <Document />
            </el-icon>
            <span>查重管理</span>
          </template>
          <el-menu-item index="/student/check-history">
            <el-icon>
              <Histogram />
            </el-icon>
            <span>查重历史</span>
          </el-menu-item>
          <el-menu-item index="/student/academic-integrity">
            <el-icon>
              <Notebook />
            </el-icon>
            <span>学术诚信</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/student/settings">
          <el-icon>
            <User />
          </el-icon>
          <span>个人设置</span>
        </el-menu-item>

        <el-menu-item index="/student/help-center">
          <el-icon>
            <Service />
          </el-icon>
          <span>帮助中心</span>
        </el-menu-item>
      </el-menu>

      <!-- 教师端菜单 -->
      <el-menu v-if="userStore.role === 'TEACHER'" :default-active="activeMenu" class="aside-menu" router
        background-color="#2c3e50" text-color="#bdc3c7" active-text-color="#409EFF">
        <el-menu-item index="/teacher">
          <el-icon>
            <DataBoard />
          </el-icon>
          <span>审核工作台</span>
        </el-menu-item>

        <el-menu-item index="/teacher/student-list">
          <el-icon>
            <UserFilled />
          </el-icon>
          <span>学生管理</span>
        </el-menu-item>

        <el-sub-menu index="/teacher/paper-review">
          <template #title>
            <el-icon>
              <EditPen />
            </el-icon>
            <span>论文审核</span>
          </template>
          <el-menu-item index="/teacher/paper-review/pending">
            <el-icon>
              <Clock />
            </el-icon>
            <span>待审核论文</span>
          </el-menu-item>
          <el-menu-item index="/teacher/paper-review/audit-records">
            <el-icon>
              <Histogram />
            </el-icon>
            <span>审核记录</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/teacher/data-statistics">
          <el-icon>
            <TrendCharts />
          </el-icon>
          <span>数据统计</span>
        </el-menu-item>

        <el-menu-item index="/teacher/profile">
          <el-icon>
            <Setting />
          </el-icon>
          <span>我的设置</span>
        </el-menu-item>
      </el-menu>

      <!-- 管理员端菜单 -->
      <el-menu v-if="userStore.role === 'ADMIN'" :default-active="activeMenu" class="aside-menu" router
        background-color="#2c3e50" text-color="#bdc3c7" active-text-color="#409EFF">
        <el-menu-item index="/dashboard/admin">
          <el-icon>
            <Monitor />
          </el-icon>
          <span>系统概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/school-overview">
          <el-icon>
            <DataAnalysis />
          </el-icon>
          <span>全校概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/paper-library">
          <el-icon>
            <Files />
          </el-icon>
          <span>论文库</span>
        </el-menu-item>

        <el-menu-item index="/admin/user-management">
          <el-icon>
            <UserFilled />
          </el-icon>
          <span>人员管理</span>
        </el-menu-item>

        <el-sub-menu index="/admin/paper-assignment">
          <template #title>
            <el-icon>
              <Connection />
            </el-icon>
            <span>论文分配</span>
          </template>
          <el-menu-item index="/admin/paper-assignment/manual">
            <el-icon>
              <Pointer />
            </el-icon>
            <span>手动分配</span>
          </el-menu-item>
          <el-menu-item index="/admin/paper-assignment/auto">
            <el-icon>
              <MagicStick />
            </el-icon>
            <span>自动分配</span>
          </el-menu-item>
          <el-menu-item index="/admin/paper-assignment/history">
            <el-icon>
              <Notebook />
            </el-icon>
            <span>分配记录</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/system-config">
          <el-icon>
            <Tools />
          </el-icon>
          <span>系统配置</span>
        </el-menu-item>
        <el-menu-item index="/admin/log-center">
          <el-icon>
            <Document />
          </el-icon>
          <span>日志中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header-container">
        <div class="header-left">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index" :to="item.path">
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>

        <div class="header-right">
          <!-- 通知铃铛 -->
          <el-dropdown trigger="click" placement="bottom-end" class="notification-dropdown"
            @visible-change="handleNotificationDropdownChange">
            <el-badge :value="unreadCount" :max="99" class="notification-badge" :hidden="unreadCount === 0">
              <el-button circle :icon="Bell" class="notification-btn" />
            </el-badge>

            <template #dropdown>
              <el-dropdown-menu class="notification-menu">
                <!-- 通知列表 -->
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
                        <div class="notification-title">
                          {{ notification.title }}
                          <el-tag v-if="notification.status === 'pending'" size="small" type="warning">待处理</el-tag>
                          <el-tag v-else-if="notification.status === 'accepted'" size="small"
                            type="success">已接受</el-tag>
                          <el-tag v-else-if="notification.status === 'rejected'" size="small" type="danger">已拒绝</el-tag>
                        </div>
                        <div class="notification-desc">
                          {{ notification.content }}
                        </div>
                        <!-- 显示额外信息 -->
                        <div v-if="notification.studentName" class="notification-meta">
                          <span>学生：{{ notification.studentName }}</span>
                          <span v-if="notification.paperTitle">论文：{{ notification.paperTitle }}</span>
                        </div>

                        <div class="notification-time">
                          {{ formatTime(notification.createTime) }}
                          <span v-if="notification.deadline" class="deadline">
                            截止：{{ formatTime(notification.deadline) }}
                          </span>
                        </div>
                      </div>
                      <div v-if="userStore.role === 'TEACHER' && notification.status === 'pending'"
                        class="notification-actions">
                        <el-button size="small" type="success" @click.stop="handleAccept(notification)">
                          接受
                        </el-button>
                        <el-button size="small" type="danger" @click.stop="handleReject(notification)">
                          拒绝
                        </el-button>
                      </div>

                      <div class="notification-status">
                        <el-badge v-if="!notification.isRead" dot type="danger" />
                      </div>
                    </div>
                  </template>
                  <div v-else class="empty-notification">
                    <el-empty description="暂无通知" :image-size="80" />
                  </div>
                </div>

                <!-- 通知底部 -->
                <div class="notification-footer">
                  <el-button type="primary" link @click="goToMessageCenter" class="view-all-btn">
                    查看全部通知
                  </el-button>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 用户信息下拉 -->
          <el-dropdown trigger="click" class="user-dropdown">
            <span class="user-info">
              <el-avatar :size="36" :src="userStore.avatarSrc" class="user-avatar">
                {{ getUserAvatarText }}
              </el-avatar>
              <div class="user-details">
                <span class="user-name">{{ displayUserName }}</span>
                <span class="user-role">{{ getRoleName }}</span>
              </div>
              <el-icon>
                <ArrowDown />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToProfile">
                  <el-icon>
                    <User />
                  </el-icon>
                  <span>个人中心</span>
                </el-dropdown-item>
                <el-dropdown-item @click="goToSettings">
                  <el-icon>
                    <Setting />
                  </el-icon>
                  <span>账号设置</span>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon>
                    <SwitchButton />
                  </el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <component 
              :is="Component" 
              :on-message-click="closeNotificationDropdown"
            />
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUnreadCount, getMessageList } from '@/api/user.js'
import { useMessageStore } from '@/stores/message'


// 引入所有图标
import {
  Notebook, User, UserFilled, Setting, SwitchButton, ArrowDown,
  UploadFilled, FolderOpened, ChatDotRound, DataAnalysis,
  DataBoard, EditPen, TrendCharts, Clock, Histogram,
  Monitor, Avatar, Lock, Connection, Pointer, MagicStick,
  Tools, Document, Bell, Files
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

const notificationDropdown = ref()
const previewNotifications = ref([])
const isMobile = ref(window.innerWidth <= 768)
const sidebarVisible = ref(false)

// 计算侧边栏宽度
const sidebarWidth = computed(() => {
  if (isMobile.value) {
    return sidebarVisible.value ? '240px' : '0px'
  }
  return '240px'
})

const unreadCount = computed(() => messageStore.unreadCount)
const notifications = computed(() => previewNotifications.value)
const loading = computed(() => messageStore.loading)

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})
// 显示的用户名 - 优先显示真实姓名
const displayUserName = computed(() => {
  // 优先显示真实姓名
  if (userStore.userInfo?.realName) {
    return userStore.userInfo.realName
  }
  // 其次显示用户名
  if (userStore.userInfo?.username) {
    return userStore.userInfo.username
  }
  return '未知用户'
})

// 用户头像显示文字
const getUserAvatarText = computed(() => {
  const name = userStore.userInfo?.realName || userStore.userInfo?.username || ''
  return name ? name.charAt(0) : ''
})

const currentUserId = computed(() => {
  return userStore.userInfo.userId || userStore.userId
})

// 面包屑导航
const breadcrumbItems = computed(() => {
  const pathArray = route.path.split('/').filter(item => item)
  const items = []

  // 添加首页
  items.push({ title: '首页', path: `/dashboard/${userStore.role.toLowerCase()}` })

  // 根据当前路由生成面包屑
  pathArray.forEach((path, index) => {
    const fullPath = '/' + pathArray.slice(0, index + 1).join('/')
    const title = getBreadcrumbTitle(path, index)
    if (title) {
      items.push({ title, path: fullPath })
    }
  })

  return items
})

// 获取面包屑标题
const getBreadcrumbTitle = (path, index) => {
  const titleMap = {
    'message-center': '通知中心',
    'student': '学生',
    'teacher': '教师',
    'admin': '管理员',
    'dashboard': '工作台',
    'paper-submit': '论文提交',
    'my-papers': '我的论文',
    'advisor-interaction': '导师互动',
    'student-list': '学生管理',
    'data-statistics': '数据统计',
    'audit-records': '审核记录',
    'paper-review': '论文审核',
    'profile': '个人设置',
    'paper-details': '论文详情',
    'pending': '待审核',
    'history': '历史记录',
    'user-management': '人员管理',
    'permissions': '权限设置',
    'paper-assignment': '论文分配',
    'manual': '手动分配',
    'auto': '自动分配',
    'system-config': '系统配置',
    'log-center': '日志中心',
    'settings': '个人设置',
    'school-overview': '全校概览',
    'paper-library': '论文库',
    // 查重功能相关
    'check': '查重管理',
    'check-history': '查重历史',
    'academic-integrity': '学术诚信',
    'check-monitor': '查重监控',
    'plagiarism-report': '查重报告'
  }
  return titleMap[path] || path
}

// 关闭通知下拉菜单的方法
const closeNotificationDropdown = () => {
  if (notificationDropdown.value && notificationDropdown.value.handleClose) {
    notificationDropdown.value.handleClose()
  }
  // 方法2: 强制关闭所有下拉菜单（作为备选）
  const dropdowns = document.querySelectorAll('.el-dropdown')
  dropdowns.forEach(dropdown => {
    const menu = dropdown.querySelector('.el-dropdown-menu')
    if (menu) {
      menu.style.display = 'none'
      console.log('强制隐藏下拉菜单')
    }
    // 移除焦点
    const trigger = dropdown.querySelector('.el-dropdown__trigger')
    if (trigger) {
      trigger.blur()
    }
  })
  
  // 方法3: 移除激活状态
  const activeElements = document.querySelectorAll('.el-dropdown__visible')
  activeElements.forEach(element => {
    element.classList.remove('el-dropdown__visible')
  })
}
// 当前页面标题
const currentPageTitle = computed(() => {
  const lastBreadcrumb = breadcrumbItems.value[breadcrumbItems.value.length - 1]
  return lastBreadcrumb?.title || '论文管理系统'
})

// 用户角色显示名称
const getRoleName = computed(() => {
  const roleMap = {
    'STUDENT': '学生',
    'TEACHER': '指导教师',
    'ADMIN': '系统管理员'
  }
  return roleMap[userStore.role] || '用户'
})


// 跳转到个人中心
const goToProfile = () => {
  const role = userStore.role.toLowerCase()
  router.push(`/${role}/settings`)
  // 移动端自动隐藏侧边栏
  if (isMobile.value) {
    sidebarVisible.value = false
  }
}

// 跳转到设置
const goToSettings = () => {
  const role = userStore.role.toLowerCase()
  router.push(`/${role}/settings`)
  // 移动端自动隐藏侧边栏
  if (isMobile.value) {
    sidebarVisible.value = false
  }
}

// 切换侧边栏显示状态
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    sidebarVisible.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    userStore.logout()
    ElMessage.success('退出登录成功')
    router.push({ name: 'Login' })
  } catch (error) {
    // 用户取消操作
  }
}
const handleNotificationDropdownChange = (visible) => {
  if (visible) {
    loadNotifications()
    // 每次打开下拉菜单时刷新未读数量
    loadUnreadCount()
  }
}

const loadUnreadCount = async () => {
  try {
    const userId = currentUserId.value
    if (!userId) {
      console.warn('用户ID不存在，无法获取未读消息数量')
      messageStore.setUnreadCount(0)
      return
    }

    console.log('发送请求的用户ID:', userId)
    const response = await getUnreadCount(userId)
    if (response.code === 200) {
      messageStore.setUnreadCount(response.data)
    } else {
      console.error('获取未读消息数量失败:', response.message)
      messageStore.setUnreadCount(0)
    }
  } catch (error) {
    console.error('获取未读消息数量异常:', error)
    ElMessage.error('获取未读消息数量失败')
    messageStore.setUnreadCount(0)
  }
}
// 加载通知数据
const loadNotifications = async () => {
  messageStore.setLoading(true)
  try {
    const userId = currentUserId.value
    if (!userId) {
      console.warn('用户ID不存在，无法加载通知')
      messageStore.setNotifications([])
      return
    }

    const params = {
      userId: userId,
      pageNum: 1,
      pageSize: 3
    }

    console.log('开始加载通知列表，参数:', params)
    const response = await getMessageList(params)
    console.log('通知列表API响应:', response)

    if (response.code === 200) {
      const notificationsData = response.data.records || response.data.list || []
      messageStore.setNotifications(notificationsData)
      console.log('成功加载通知数量:', notificationsData.length)
      previewNotifications.value = notificationsData
    } else {
      console.error('获取通知列表失败:', response.message)
      ElMessage.error('加载通知失败')
      messageStore.setNotifications([])
    }
  } catch (error) {
    console.error('加载通知列表异常:', error)
    ElMessage.error('加载通知失败')
    messageStore.setNotifications([])
  } finally {
    messageStore.setLoading(false)
  }
}

// 获取通知图标
const getNotificationIcon = (messageType) => {
  const iconMap = {
    'SUCCESS': 'CircleCheckFilled',
    'INFO': 'InfoFilled',
    'WARNING': 'WarningFilled',
    'ERROR': 'CircleCloseFilled'
  }
  return iconMap[messageType]
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 处理通知点击
const handleNotificationClick = (notification) => {
  if (!notification.isRead) {
    // 标记为已读
    notification.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  // 立即关闭下拉菜单
  closeNotificationDropdown()
  // 使用 setTimeout 确保下拉菜单完全关闭后再跳转
  setTimeout(() => {
    switch (notification.messageType) {
      case 'PAPER_REVIEW':
        router.push('/teacher/paper-review/pending')
        break
      case 'ADVISOR_MESSAGE':
        router.push('/student/advisor-interaction')
        break
      default:
        router.push('/message-center')
        break
    }
  }, 50)
}

// 跳转到消息中心
const goToMessageCenter = () => {
  closeNotificationDropdown()
  // 延迟再次关闭，确保执行
  setTimeout(() => {
    closeNotificationDropdown()
  }, 50)
  router.push('/message-center')
}

// 监听用户信息变化，当用户信息加载完成后自动获取未读数量
watch(
  () => userStore.userInfo?.userId, // 监听用户ID的变化
  (newUserId) => {
    if (newUserId) {
      console.log('检测到用户ID变化，加载未读消息数量:', newUserId)
      loadUnreadCount()
    }
  },
  { immediate: true } // 立即执行一次
)
// 监听路由变化，自动关闭下拉菜单
watch(
  () => route.path,
  (newPath) => {
    // 如果跳转到消息中心页面，关闭下拉菜单
    if (newPath === '/message-center') {
      closeNotificationDropdown()
      // 多重延迟关闭，确保执行
      setTimeout(() => closeNotificationDropdown(), 50)
      setTimeout(() => closeNotificationDropdown(), 100)
      setTimeout(() => closeNotificationDropdown(), 200)
    }
  },
  { immediate: true }
)

// 页面加载时尝试获取未读数量
onMounted(() => {
  console.log('页面加载完成，用户信息:', userStore.userInfo)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 如果用户信息已经存在，直接加载
  if (userStore.userInfo?.userId) {
    loadUnreadCount()
  } else {
    // 如果用户信息还未加载，延迟一下再尝试
    setTimeout(() => {
      if (userStore.userInfo?.userId) {
        loadUnreadCount()
      } else {
        console.warn('用户信息尚未加载，无法获取未读消息数量')
      }
    }, 500)
  }
  // 如果当前就在消息中心页面，立即关闭
  if (route.path === '/message-center') {
    console.log('当前在消息中心页面，关闭下拉菜单')
    closeNotificationDropdown()
    setTimeout(() => closeNotificationDropdown(), 100)
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.main-container {
  height: 100vh;
  background: #f5f7fa;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: none;
}

@media (max-width: 768px) {
  .mobile-overlay {
    display: block;
  }
  
  .mobile-menu-toggle {
    display: flex !important;
  }
}

.aside-container {
  background: #2c3e50;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1001;

  &.mobile-sidebar {
    position: fixed;
    height: 100vh;
    top: 0;
    left: 0;
    z-index: 1001;
    transition: transform 0.3s ease;
    
    &.sidebar-hidden {
      transform: translateX(-100%);
    }
  }

  .logo {
    display: flex;
    align-items: center;
    padding: 1.5rem 1.25rem;
    border-bottom: 1px solid #34495e;

    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 10px;
      margin-right: 0.75rem;

      .el-icon {
        color: white;
        font-size: 1.5rem;
      }
    }

    .logo-text {
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      
      &.hidden {
        display: none;
      }
    }
  }

  .mobile-menu-toggle {
    display: none;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .el-icon {
      color: white;
      font-size: 18px;
    }
  }

  .aside-menu {
    height: calc(100vh - 88px);
    border-right: none;
    padding: 0.5rem;

    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;
      margin: 2px 0;
      border-radius: 8px;
      transition: all 0.3s ease;

      &.is-active {
        background: linear-gradient(135deg, #667eea, #764ba2) !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

        .el-icon {
          color: white !important;
        }
      }

      &:hover {
        background-color: #34495e;
        transform: translateX(4px);
      }

      .el-icon {
        color: #bdc3c7;
        font-size: 1.2rem;
        margin-right: 8px;
      }
    }

    :deep(.el-sub-menu) {
      .el-sub-menu__title {
        height: 48px;
        line-height: 48px;
        margin: 2px 0;
        border-radius: 8px;

        &:hover {
          background-color: #34495e;
        }

        .el-icon {
          color: #bdc3c7;
          font-size: 1.2rem;
          margin-right: 8px;
        }
      }

      .el-menu-item {
        padding-left: 56px !important;
      }
    }
  }
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e4e7ed;
  height: 64px;

  .header-left {
    .breadcrumb {
      margin-bottom: 4px;

      :deep(.el-breadcrumb) {
        font-size: 0.85rem;
      }
    }

    .page-title {
      margin: 0;
      color: #2c3e50;
      font-size: 1.5rem;
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;

    .notification-badge {
      .notification-btn {
        border: none;
        background: #f8f9fa;
        color: #6c757d;

        &:hover {
          background: #e9ecef;
          color: #495057;
        }
      }
    }

    .user-dropdown {
      .user-info {
        display: flex;
        align-items: center;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background-color: #f8f9fa;
        }

        .user-avatar {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-weight: 600;
          margin-right: 0.75rem;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          margin-right: 0.75rem;

          .user-name {
            font-weight: 600;
            color: #2c3e50;
            font-size: 0.9rem;
            line-height: 1.2;
          }

          .user-role {
            font-size: 0.75rem;
            color: #7f8c8d;
            line-height: 1.2;
          }
        }

        .el-icon {
          color: #7f8c8d;
          font-size: 0.875rem;
        }
      }
    }
  }
}

.main-content {
  padding: 0;
  background: #f5f7fa;
  overflow: hidden;

  .content-wrapper {
    height: 100%;
    padding: 1.5rem;
    overflow: auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin: 0 1.5rem 1.5rem 1.5rem;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .aside-container {
    width: 64px !important;
    
    &.mobile-sidebar {
      width: 240px !important;
    }

    .logo {
      justify-content: center;
      padding: 1rem 0;

      .logo-text {
        display: none;
      }

      .logo-icon {
        margin-right: 0;
      }
    }

    .aside-menu {
      :deep(.el-menu-item),
      :deep(.el-sub-menu__title) {
        span {
          display: inline !important;
        }

        .el-icon {
          margin-right: 8px;
        }
      }
    }
  }

  .header-container {
    padding: 0 1rem;

    .header-left {
      .page-title {
        font-size: 1.25rem;
      }
    }

    .user-info .user-details {
      display: none;
    }
  }

  .main-content .content-wrapper {
    padding: 1rem;
    margin: 0 1rem 1rem 1rem;
  }
}
</style>