<template>
  <div class="message-center">
    <div class="header">
      <h1>消息中心</h1>
      <div class="header-actions">
        <el-button type="primary" link @click="markAllAsRead" :disabled="unreadCount === 0">
          全部标记已读
        </el-button>
        <el-button type="danger" link @click="clearAllRead" :disabled="readCount === 0">
          清空已读
        </el-button>
        <el-button type="default" link @click="refreshMessages">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="stats-info">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ totalCount }}</div>
            <div class="stat-label">总消息数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card unread">
            <div class="stat-number">{{ unreadCount }}</div>
            <div class="stat-label">未读消息</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card read">
            <div class="stat-number">{{ readCount }}</div>
            <div class="stat-label">已读消息</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card today">
            <div class="stat-number">{{ todayCount }}</div>
            <div class="stat-label">今日消息</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="filter-tabs">
      <el-radio-group v-model="filterType" @change="handleFilterChange">
        <el-radio-button label="all">全部消息</el-radio-button>
        <el-radio-button label="unread">未读消息</el-radio-button>
        <el-radio-button label="read">已读消息</el-radio-button>
        <el-radio-button v-if="userStore.role === 'TEACHER'" label="pending">待处理</el-radio-button>
      </el-radio-group>
    </div>

    <div class="message-list" v-loading="loading">
      <template v-if="displayedNotifications && displayedNotifications.length > 0">
        <div v-for="notification in displayedNotifications" :key="notification.id" class="message-item" :class="{
          unread: !notification.isRead,
          pending: notification.status === 'pending' && userStore.role === 'TEACHER'
        }">
          <div class="message-checkbox">
            <el-checkbox v-model="notification.selected" />
          </div>
          <div class="message-icon">
            <el-icon :style="{ color: getNotificationColor(notification.messageType) }">
              <component :is="getNotificationIcon(notification.messageType)" />
            </el-icon>
          </div>
          <div class="message-content" @click="handleMessageClick(notification)">
            <div class="message-title">
              <span class="title-text">{{ notification.title }}</span>
              <el-tag v-if="!notification.isRead" size="small" type="danger">未读</el-tag>
              <el-tag v-else size="small" type="info">已读</el-tag>
              <!-- 教师端显示处理状态 -->
              <el-tag v-if="userStore.role === 'TEACHER' && notification.status === 'pending'" size="small"
                type="warning">
                待确认
              </el-tag>
              <el-tag v-else-if="userStore.role === 'TEACHER' && notification.status === 'confirmed'" size="small"
                type="success">
                已接收
              </el-tag>
              <el-tag v-else-if="userStore.role === 'TEACHER' && notification.status === 'rejected'" size="small"
                type="danger">
                已拒绝
              </el-tag>
              <el-tag size="small" :type="getMessageTypeTag(notification.messageType)">
                {{ getMessageTypeText(notification.messageType) }}
              </el-tag>
            </div>
            <div class="message-desc">
              {{ notification.content }}
            </div>
            <!-- 显示论文分配详情 -->
            <div v-if="userStore.role === 'TEACHER' && notification.relatedType === 'paper'" class="assignment-details">
              <div class="detail-item">
                <span class="label">论文标题：</span>
                <span class="value">{{ notification.paperTitle || '未知论文' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">学生：</span>
                <span class="value">{{ notification.studentName || '未知学生' }}</span>
              </div>
              <div class="detail-item" v-if="notification.deadline">
                <span class="label">处理截止：</span>
                <span class="value deadline">{{ formatTime(notification.deadline) }}</span>
              </div>
            </div>
            <div class="message-meta">
              <span class="message-time">{{ notification.formattedTime || formatTime(notification.createTime) }}</span>
              <span class="message-sender" v-if="notification.sender">来自：{{ notification.sender }}</span>
            </div>
          </div>
          <div class="message-actions">
            <!-- 教师端论文分配消息的操作按钮 -->
            <template v-if="userStore.role === 'TEACHER' && notification.relatedId && !notification.isRead">
              <el-button size="small" type="success" @click.stop="showConfirmDialog(notification)">
                确认接收
              </el-button>
              <el-button size="small" type="danger" @click.stop="showRejectDialog(notification)">
                拒绝接收
              </el-button>
            </template>
            <template v-else>
              <el-button v-if="!notification.isRead" type="primary" link @click.stop="markAsRead(notification)">
                标记已读
              </el-button>
              <el-button type="danger" link @click.stop="deleteMessage(notification)">
                删除
              </el-button>
            </template>
          </div>
        </div>
      </template>
      <div v-else class="empty-message">
        <el-empty description="暂无消息" :image-size="120" />
      </div>
    </div>

    <div class="batch-actions" v-if="hasSelected">
      <span class="selected-count">已选择 {{ selectedCount }} 项</span>
      <el-button type="primary" @click="batchMarkAsRead">
        标记已读
      </el-button>
      <el-button type="danger" @click="batchDelete">
        删除
      </el-button>
    </div>

    <div class="pagination" v-if="total > 0">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
        :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>
    <!-- 确认接收弹框 -->
    <el-dialog v-model="confirmDialogVisible" title="确认接收论文" width="500px" :before-close="handleConfirmDialogClose">
      <div class="dialog-content">
        <el-alert type="info" title="确认接收后将开始审核此论文" :closable="false" style="margin-bottom: 16px;" />
        <div class="paper-info">
          <h4>任务信息</h4>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="论文标题">
              {{ currentAssignment?.paperTitle || '待确认论文' }}
            </el-descriptions-item>
            <el-descriptions-item label="学生姓名">
              {{ currentAssignment?.studentName || '待确认学生' }}
            </el-descriptions-item>
            <el-descriptions-item label="消息标题">
              {{ currentAssignment?.title || '未知任务' }}
            </el-descriptions-item>
            <el-descriptions-item label="通知时间">
              {{ formatTime(currentAssignment?.createTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmAssignment" :loading="confirmLoading">
            确认接收
          </el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 拒绝接收弹框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝接收论文" width="500px" :before-close="handleRejectDialogClose">
      <div class="dialog-content">
        <el-alert type="warning" title="拒绝接收后该论文将重新分配" :closable="false" style="margin-bottom: 16px;" />
        <div class="paper-info">
          <h4>任务信息</h4>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="论文标题">
              {{ currentAssignment?.paperTitle || '待确认论文' }}
            </el-descriptions-item>
            <el-descriptions-item label="学生姓名">
              {{ currentAssignment?.studentName || '待确认学生' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" style="margin-top: 16px;">
          <el-form-item label="拒绝原因" prop="reason">
            <el-input v-model="rejectForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝接收的原因（选填）" maxlength="200"
              show-word-limit />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleRejectAssignment" :loading="rejectLoading">
            确认拒绝
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch,onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheckFilled,
  InfoFilled,
  WarningFilled,
  CircleCloseFilled,
  Refresh
} from '@element-plus/icons-vue'
import {
  getMessageList, markAsRead as markAsReadApi, batchMarkAsRead as batchMarkAsReadApi, deleteMessage as deleteMessageApi, deleteAllMessages,
  confirmPaper, rejectPaper as rejectAssignment, getPendingPapers, getPaperDetail
} from '@/api/user.js'

const props = defineProps({
  onMessageClick: {
    type: Function,
    default: () => { }
  }
})

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

// 数据
const loading = ref(false)
const filterType = ref('all')
const messageTypeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
// 添加一个专门用于统计的完整数据列表
const allNotifications = ref([])

// 新增弹框相关数据
const confirmDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const confirmLoading = ref(false)
const rejectLoading = ref(false)
const currentAssignment = ref(null)
const rejectFormRef = ref(null)

// 拒绝表单
const rejectForm = ref({
  reason: ''
})

// 使用 store 中的数据
const notifications = computed(() => messageStore.notifications)

// 计算属性
const totalCount = computed(() => allNotifications.value.length)

const unreadCount = computed(() =>
  allNotifications.value.filter(item => !item.isRead).length
)

const readCount = computed(() =>
  allNotifications.value.filter(item => item.isRead).length
)

const todayCount = computed(() => {
  const today = new Date().toDateString()
  return allNotifications.value.filter(item => {
    if (!item.createTime) return false
    const itemDate = new Date(item.createTime).toDateString()
    return itemDate === today
  }).length
})
// 分页显示的数据（当前页）
const displayedNotifications = computed(() => {
  const filtered = filteredNotifications.value
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const filteredNotifications = computed(() => {
  let filtered = [...allNotifications.value] // 使用完整数据过滤

  if (filterType.value === 'unread') {
    filtered = filtered.filter(item => !item.isRead)
  } else if (filterType.value === 'read') {
    filtered = filtered.filter(item => item.isRead)
  }

  if (messageTypeFilter.value) {
    filtered = filtered.filter(item => item.messageType === messageTypeFilter.value)
  }

  return filtered
})

const hasSelected = computed(() =>
  notifications.value.some(item => item.selected)
)

const selectedCount = computed(() =>
  notifications.value.filter(item => item.selected).length
)
//获取当前用户Id
const getCurrentUserId = () => {
  return userStore.userInfo?.userId
}
// 获取当前教师ID
const getCurrentTeacherId = () => {
  return userStore.userInfo?.userId
}
// 方法
const showConfirmDialog = async (notification) => {
  const paperId = notification.relatedId
  if (!paperId) {
    ElMessage.warning('无法获取论文')
    return
  }
  console.log('显示确认弹窗，paperId:', paperId)
  //获取论文详情
  const paperDetail = await getPaperDetail(paperId)
  currentAssignment.value = {
    ...notification,
    paperId: paperId,  // 使用relatedId作为paperId
    paperTitle: paperDetail.data.paperTitle || `论文 {paperId}`,
    studentName: paperDetail.data.author || '待确认学生'
  }
  confirmDialogVisible.value = true
}

const showRejectDialog = async (notification) => {
  // relatedId就是paperId
  const paperId = notification.relatedId

  if (!paperId) {
    ElMessage.warning('无法获取论文ID')
    return
  }

  console.log('显示拒绝弹窗，paperId:', paperId)
  const paperDetail = await getPaperDetail(paperId)
  currentAssignment.value = {
    ...notification,
    paperId: paperId,  // 使用relatedId作为paperId
    paperTitle: paperDetail.data.paperTitle || `论文 {paperId}`,
    studentName: paperDetail.data.author || '待确认学生'
  }

  rejectForm.value.reason = ''
  rejectDialogVisible.value = true
}

const handleConfirmDialogClose = (done) => {
  ElMessageBox.confirm('确定要关闭吗？未保存的更改将会丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done()
  }).catch(() => {
    // 取消关闭
  })
}

const handleRejectDialogClose = (done) => {
  ElMessageBox.confirm('确定要关闭吗？未保存的更改将会丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done()
  }).catch(() => {
    // 取消关闭
  })
}
const handleConfirmAssignment = async () => {
  try {
    confirmLoading.value = true

    const paperId = currentAssignment.value.relatedId
    const teacherId = getCurrentTeacherId()

    if (!teacherId) {
      ElMessage.warning('教师信息不存在')
      return
    }

    // 调用后端确认API
    const response = await confirmPaper(paperId, teacherId)

    if (response.code === 200) {
      ElMessage.success('确认接收成功')
      await markCurrentMessageAsRead()
      confirmDialogVisible.value = false
      // 更新通知状态
      // currentAssignment.value.status = 'confirmed'
      // currentAssignment.value.isRead = true

      // 更新未读数量
      messageStore.setUnreadCount(messageStore.unreadCount - 1)
      // 重新加载消息列表
      loadMessages()
    } else {
      ElMessage.error(response.message || '确认接收失败')
    }
  } catch (error) {
    console.error('确认接收失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    confirmLoading.value = false
  }
}
const handleRejectAssignment = async () => {
  try {
    // 验证表单
    if (rejectFormRef.value) {
      await rejectFormRef.value.validate()
    }

    rejectLoading.value = true

    const paperId = currentAssignment.value.relatedId
    const teacherId = getCurrentTeacherId()

    if (!teacherId) {
      ElMessage.warning('教师信息不存在')
      return
    }

    // 调用后端拒绝API
    const response = await rejectAssignment(
      paperId,
      teacherId
    )

    if (response.code === 200) {
      ElMessage.success('拒绝接收成功')

      await markCurrentMessageAsRead()

      rejectDialogVisible.value = false

      // 更新未读数量
      messageStore.setUnreadCount(messageStore.unreadCount - 1)
      // 重新加载消息列表
      loadMessages()
    } else {
      ElMessage.error(response.message || '拒绝接收失败')
    }
  } catch (error) {
    if (error instanceof Error) {
      // 表单验证错误，不显示错误消息
      return
    }
    console.error('拒绝接收失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    rejectLoading.value = false
  }
}
// 标记当前消息为已读的辅助方法
const markCurrentMessageAsRead = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId || !currentAssignment.value) return

    const response = await markAsReadApi(currentAssignment.value.id, userId)
    if (response.code === 200) {
      console.log('消息标记为已读成功')
    }
  } catch (error) {
    console.error('标记消息为已读失败:', error)
  }
}
const loadMessages = async () => {
  loading.value = true
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) {
      ElMessage.warning('用户信息不存在')
      return
    }
    const params = {
      userId: userId,
      pageNum: 1,
      pageSize: 1000,
      messageType: messageTypeFilter.value || undefined
    }

    const response = await getMessageList(params)
    if (response.code === 200) {
      const data = response.data
      const messages = data.records || data.list || []
      // 添加选中状态
      allNotifications.value = messages.map(msg => ({
        ...msg,
        selected: false,
        status: msg.status
      }))
      total.value = messages.length
      const unread = messages.filter(msg => !msg.isRead).length
      messageStore.setUnreadCount(unread)
      // 分页数据（当前页）
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      const pageMessages = messages.slice(start, end).map(msg => ({
        ...msg,
        selected: false,
        status: msg.status || 'pending'
      }))

      messageStore.setNotifications(pageMessages)
    } else {
      ElMessage.error(response.message || '加载消息失败')
    }
  } catch (error) {
    console.error('加载消息列表失败:', error)
    ElMessage.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

const getNotificationIcon = (messageType) => {
  const iconMap = {
    'SUCCESS': CircleCheckFilled,
    'INFO': InfoFilled,
    'WARNING': WarningFilled,
    'ERROR': CircleCloseFilled
  }
  return iconMap[messageType] || InfoFilled
}

const getNotificationColor = (messageType) => {
  const colorMap = {
    'SUCCESS': '#67C23A',
    'INFO': '#409EFF',
    'WARNING': '#E6A23C',
    'ERROR': '#F56C6C'
  }
  return colorMap[messageType] || '#409EFF'
}

const getMessageTypeText = (messageType) => {
  const typeMap = {
    'SUCCESS': '成功',
    'INFO': '信息',
    'WARNING': '警告',
    'ERROR': '错误'
  }
  return typeMap[messageType] || '信息'
}

const getMessageTypeTag = (messageType) => {
  const tagMap = {
    'SUCCESS': 'success',
    'INFO': 'primary',
    'WARNING': 'warning',
    'ERROR': 'danger'
  }
  return tagMap[messageType] || 'primary'
}

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
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const handleMessageClick = async (notification) => {
  if (!notification.isRead) {
    await markAsRead(notification)
  }
  // 调用父组件传递的关闭通知窗方法
  props.onMessageClick()
  // 根据消息类型进行路由跳转
  switch (notification.messageType) {
    case 'PAPER_REVIEW':
      router.push('/teacher/paper-review/pending')
      break
    case 'ADVISOR_MESSAGE':
      router.push('/student/advisor-interaction')
      break
    case 'SYSTEM_NOTICE':
      // 可以跳转到消息详情页
      break
    default:
      // 默认不跳转
      break
  }
}

const markAsRead = async (notification) => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      ElMessage.warning('用户信息不存在')
      return
    }
    const response = await markAsReadApi(notification.id, userId)
    if (response.code === 200) {
      notification.isRead = true
      messageStore.setUnreadCount(messageStore.unreadCount - 1)
      ElMessage.success('标记为已读')
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('操作失败')
  }
}

const deleteMessage = async (notification) => {
  try {
    await ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const userId = getCurrentUserId()
    if (!userId) {
      ElMessage.warning('用户信息不存在')
      return
    }
    const response = await deleteMessageApi(notification.id, userId)
    if (response.code === 200) {
      // 从列表中移除
      const updatedNotifications = notifications.value.filter(item => item.id !== notification.id)
      messageStore.setNotifications(updatedNotifications)

      // 更新未读数量
      if (!notification.isRead) {
        messageStore.setUnreadCount(messageStore.unreadCount - 1)
      }

      ElMessage.success('删除成功')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

const markAllAsRead = async () => {
  try {
    await ElMessageBox.confirm('确定要标记所有消息为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const userId = getCurrentUserId()
    if (!userId) {
      ElMessage.warning('用户信息不存在')
      return
    }
    const unreadIds = notifications.value
      .filter(item => !item.isRead)
      .map(item => item.id)

    if (unreadIds.length > 0) {
      const response = await batchMarkAsReadApi(unreadIds)
      if (response.code === 200) {
        // 更新所有消息状态
        notifications.value.forEach(item => {
          item.isRead = true
        })
        messageStore.setUnreadCount(0)
        ElMessage.success('全部标记为已读')
      } else {
        ElMessage.error(response.message || '操作失败')
      }
    }
  } catch (error) {
    // 用户取消操作
  }
}

const clearAllRead = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有已读消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const userId = getCurrentUserId()
    if (!userId) {
      ElMessage.warning('用户信息不存在')
      return
    }
    const readIds = notifications.value
      .filter(item => item.isRead)
      .map(item => item.id)
    if (readIds.length === 0) {
      ElMessage.info('没有已读消息需要清空')
      done()
      return
    }
    if (readIds.length > 0) {
      // 这里可以调用批量删除API
      // 暂时直接从前端移除
      const response = await deleteAllMessages(readIds, userId)
      if (response.code === 200) {
        const updatedNotifications = notifications.value.filter(item => !item.isRead)
        messageStore.setNotifications(updatedNotifications)
        ElMessage.success('已成功清空 ${readIds.length} 条已读消息')
      } else {
        ElMessage.error('清空失败')
      }
    }
  } catch (error) {
    console.error('清空已读消息失败:', error)
    ElMessage.error('清空失败，请重试')
  }
  finally {
    loading.value = false
  }
}

const batchMarkAsRead = async () => {
  const selectedIds = notifications.value
    .filter(item => item.selected)
    .map(item => item.id)

  if (selectedIds.length === 0) return

  try {
    const response = await batchMarkAsReadApi(selectedIds)
    if (response.code === 200) {
      notifications.value.forEach(item => {
        if (item.selected) {
          item.isRead = true
          item.selected = false
        }
      })

      const newUnreadCount = notifications.value.filter(item => !item.isRead).length
      messageStore.setUnreadCount(newUnreadCount)

      ElMessage.success(`已标记 ${selectedIds.length} 条消息为已读`)
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('批量标记已读失败:', error)
    ElMessage.error('操作失败')
  }
}

const batchDelete = async () => {
  const selectedIds = notifications.value
    .filter(item => item.selected)
    .map(item => item.id)

  if (selectedIds.length === 0) return

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.length} 条消息吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 这里可以调用批量删除API
    // 暂时直接从前端移除
    const updatedNotifications = notifications.value.filter(item => !item.selected)
    messageStore.setNotifications(updatedNotifications)

    // 更新未读数量
    const newUnreadCount = updatedNotifications.filter(item => !item.isRead).length
    messageStore.setUnreadCount(newUnreadCount)

    ElMessage.success(`已删除 ${selectedIds.length} 条消息`)
  } catch (error) {
    // 用户取消操作
  }
}

const refreshMessages = () => {
  currentPage.value = 1
  loadMessages()
}
const handleFilterChange = () => {
  currentPage.value = 1
  loadMessages()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadMessages()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadMessages()
}

// 自动关闭通知下拉菜单
const closeNotificationDropdown = () => {
  // 调用父组件传递的关闭方法
  props.onMessageClick()
}

// 页面加载时自动关闭下拉菜单
// 在 MessageCenter.vue 的 onMounted 中添加
onMounted(() => {
  console.log('消息中心页面加载，强制关闭通知下拉菜单')
  
  // 首先尝试调用父组件传递的方法
  if (props.onMessageClick && typeof props.onMessageClick === 'function') {
    console.log('调用父组件传递的关闭方法')
    props.onMessageClick()
  }
  // 加载消息数据
  if (messageStore.notifications.length === 0) {
    loadMessages()
  }
})

// 添加路由守卫，确保离开页面时也关闭
onUnmounted(() => {
  closeNotificationDropdown()
})

// 监听用户信息变化
// 分别定义两个独立的 watch
watch(
  () => userStore.userInfo?.userId,
  (newUserId) => {
    if (newUserId) {
      loadMessages()
    }
  },
  { immediate: true }
)

</script>

<style lang="scss" scoped>
.message-item {
  &.pending {
    border-left: 4px solid #e6a23c;
    background-color: #fdf6ec;
  }

  .assignment-details {
    margin: 8px 0;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;

    .detail-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      font-size: 12px;

      .label {
        color: #7f8c8d;
        min-width: 60px;
      }

      .value {
        color: #2c3e50;
        flex: 1;

        &.deadline {
          color: #f56c6c;
          font-weight: 500;
        }
      }
    }
  }
}

.dialog-content {
  .paper-info {
    h4 {
      margin: 0 0 12px 0;
      color: #2c3e50;
      font-size: 14px;
    }

    .deadline-text {
      color: #f56c6c;
      font-weight: 500;
    }
  }
}

.message-center {
  padding: 20px;
  background: white;
  border-radius: 8px;
  min-height: 600px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;

    h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 24px;
    }

    .header-actions {
      display: flex;
      gap: 16px;
    }
  }

  .stats-info {
    margin-bottom: 24px;

    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #409EFF;

      &.unread {
        border-left-color: #F56C6C;
      }

      &.read {
        border-left-color: #67C23A;
      }

      &.today {
        border-left-color: #E6A23C;
      }

      .stat-number {
        font-size: 28px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #7f8c8d;
      }
    }
  }

  .filter-tabs {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    .filter-right {
      display: flex;
      gap: 12px;
    }
  }

  .message-list {
    min-height: 400px;

    .message-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        border-color: #409EFF;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
      }

      &.unread {
        background-color: #f0f8ff;
        border-left: 4px solid #409EFF;
      }

      .message-checkbox {
        margin-right: 12px;
        padding-top: 4px;
      }

      .message-icon {
        margin-right: 12px;
        padding-top: 4px;

        .el-icon {
          font-size: 20px;
        }
      }

      .message-content {
        flex: 1;
        min-width: 0;

        .message-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
          font-size: 14px;

          .title-text {
            flex: 1;
          }

          .el-tag {
            height: 20px;
            line-height: 18px;
          }
        }

        .message-desc {
          color: #7f8c8d;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 8px;
          word-break: break-all;
        }

        .message-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #bdc3c7;

          .message-sender {
            color: #95a5a6;
          }
        }
      }

      .message-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover .message-actions {
        opacity: 1;
      }
    }
  }

  .batch-actions {
    position: sticky;
    bottom: 0;
    background: white;
    padding: 16px;
    border-top: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 20px;

    .selected-count {
      color: #409EFF;
      font-weight: 500;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  .empty-message {
    padding: 60px 0;
  }
}

@media (max-width: 768px) {
  .message-center {
    padding: 16px;

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }
    }

    .stats-info {
      .el-col {
        margin-bottom: 12px;
      }
    }

    .filter-tabs {
      flex-direction: column;
      align-items: stretch;

      .filter-right {
        justify-content: flex-end;
      }
    }

    .message-item {
      .message-actions {
        opacity: 1 !important;
        flex-direction: column;

        .el-button {
          margin-bottom: 4px;
        }
      }
    }

    .batch-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>