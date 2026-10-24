<template>
  <div class="chat-center">
    <div class="header">
      <div class="header-actions">
        <el-button type="default" link @click="refreshSessions">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="session-list">
        <div class="session-search">
          <el-input v-model="searchKeyword" placeholder="搜索学生" clearable @input="handleSearch" />
        </div>
        <div class="session-items">
          <div 
            v-for="session in filteredSessions" 
            :key="session.id" 
            class="session-item" 
            :class="{ active: activeSessionId === session.id }"
            @click="selectSession(session)"
          >
            <div class="session-avatar">
              <el-avatar :size="40" :src="session.avatar || defaultAvatar">
                {{ session.name.charAt(0) }}
              </el-avatar>
            </div>
            <div class="session-info">
              <div class="session-name">
                {{ session.name }}
                <el-badge v-if="session.unreadCount > 0" :value="session.unreadCount" type="danger" />
              </div>
              <div class="session-last-message">
                <span class="last-message">{{ session.lastMessage }}</span>
                <span class="last-time">{{ formatTime(session.lastTime) }}</span>
              </div>
            </div>
          </div>
          <div v-if="filteredSessions.length === 0" class="empty-sessions">
            <el-empty description="暂无会话" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 右侧聊天窗口 -->
      <div class="chat-window" v-if="activeSession">
        <div class="chat-header">
          <div class="chat-header-info">
            <el-avatar :size="32" :src="activeSession.avatar || defaultAvatar">
              {{ activeSession.name.charAt(0) }}
            </el-avatar>
            <div class="chat-header-details">
              <div class="chat-header-name">{{ activeSession.name }}</div>
              <div class="chat-header-members" v-if="activeSession.members && activeSession.members.length > 1">
                {{ activeSession.members.length }} 人
              </div>
            </div>
          </div>
          <div class="chat-header-actions">
            <el-dropdown @command="handleChatAction">
              <el-button link>
                <el-icon><Setting /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="clear">清空聊天记录</el-dropdown-item>
                  <el-dropdown-item command="export">导出聊天记录</el-dropdown-item>
                  <el-dropdown-item command="info">查看学生信息</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="chat-messages" ref="chatMessagesRef" v-loading="loadingMessages">
          <div v-for="message in messages" :key="message.id" class="message-item" :class="{ 'own-message': String(message.senderId) === String(userStore.userInfo?.userId) }">
            <div class="message-avatar">
              <el-avatar :size="32" :src="message.senderAvatar || defaultAvatar">
                {{ message.senderName.charAt(0) }}
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-sender">{{ message.senderName }}</div>
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.sendTime) }}</div>
            </div>
          </div>
          <div v-if="messages.length === 0" class="empty-messages">
            <el-empty description="暂无消息" :image-size="80" />
          </div>
        </div>

        <div class="chat-input">
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            @change="handleFileSelect"
          />
          <el-button link @click="$refs.fileInput.click()">
            <el-icon><Document /></el-icon>
          </el-button>
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            @keyup.enter.exact="sendMessage"
          />
          <el-button type="primary" @click="sendMessage" :loading="sending">
            发送
          </el-button>
        </div>
      </div>
      <div class="chat-empty" v-else>
        <el-empty description="请选择一个会话" :image-size="120" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Document, Setting } from '@element-plus/icons-vue'
import {
  getMessageSessions, getMessageList, sendMessage as sendMessageApi, markMessagesRead,
  clearMessages, exportChatRecords, getStudentInfo, uploadFile
} from '@/api/teacher.js'
import { useMessageWebSocket } from '@/composables/useMessageWebSocket'
import { formatDateTime } from '@/utils/dataType.js'

const userStore = useUserStore()
const messageStore = useMessageStore()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// WebSocket
const { connect, disconnect, isConnected } = useMessageWebSocket()

// 数据
const sessions = ref([])
const messages = ref([])
const activeSessionId = ref(null)
const inputMessage = ref('')
const searchKeyword = ref('')
const loadingSessions = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const chatMessagesRef = ref(null)
const uploadRef = ref(null)

// 计算属性
const activeSession = computed(() => {
  return sessions.value.find(session => session.id === activeSessionId.value)
})

const filteredSessions = computed(() => {
  if (!searchKeyword.value) return sessions.value
  const keyword = searchKeyword.value.toLowerCase()
  return sessions.value.filter(session => 
    session.name.toLowerCase().includes(keyword)
  )
})

// 方法
// 聊天未读合计回写全站 SSOT（messageStore），供侧边栏角标/铃铛合计使用
const syncChatUnread = () => {
  messageStore.setChatUnread(
    sessions.value.reduce((sum, s) => sum + (s.unreadCount || 0), 0)
  )
}

const loadSessions = async () => {
  loadingSessions.value = true
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) {
      ElMessage.warning('用户信息不存在')
      return
    }
    const response = await getMessageSessions()
    if (response.code === 200) {
      sessions.value = response.data
      syncChatUnread()
    } else {
      ElMessage.error(response.message || '加载会话失败')
    }
  } catch (error) {
    console.error('加载会话失败:', error)
    ElMessage.error('加载会话失败')
  } finally {
    loadingSessions.value = false
  }
}

const loadMessages = async (sessionId) => {
  loadingMessages.value = true
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId || !sessionId) return
    const response = await getMessageList({
      sessionId,
      pageNum: 1,
      pageSize: 100
    })
    if (response.code === 200) {
      messages.value = response.data.records || []
      // 标记消息为已读
      await markMessagesRead(sessionId)
      // 该会话未读已清零，同步本地会话与全站未读合计
      const session = sessions.value.find(s => s.id === sessionId)
      if (session) session.unreadCount = 0
      syncChatUnread()
      // 滚动到底部
      nextTick(() => {
        scrollToBottom()
      })
    } else {
      ElMessage.error(response.message || '加载消息失败')
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    ElMessage.error('加载消息失败')
  } finally {
    loadingMessages.value = false
  }
}

const selectSession = (session) => {
  activeSessionId.value = session.id
  loadMessages(session.id)
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || !activeSessionId.value) return
  sending.value = true
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) {
      ElMessage.warning('用户信息不存在')
      return
    }
    // 更可靠地获取学生ID
    const studentMember = activeSession.value.members?.find(member => 
      member.userRole === 'STUDENT' || member.role === 'STUDENT'
    )
    const studentId = studentMember?.userId || studentMember?.id
    if (!studentId) {
      ElMessage.warning('无法获取学生信息')
      return
    }
    const response = await sendMessageApi({
      sessionId: activeSessionId.value,
      receiverId: studentId,
      content: inputMessage.value,
      messageType: 'PRIVATE'
    })
    if (response.code === 200) {
      inputMessage.value = ''
      // 只重新加载当前会话的消息
      await loadMessages(activeSessionId.value)
      // 手动更新会话列表，因为发送者不会收到自己的WebSocket消息
      await loadSessions()
    } else {
      ElMessage.error(response.message || '发送消息失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  } finally {
    sending.value = false
  }
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await uploadFile(formData)
    if (response.code === 200) {
      const fileInfo = response.data
      // 发送文件消息
      await sendFileMessage(fileInfo)
    } else {
      ElMessage.error(response.message || '文件上传失败')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    ElMessage.error('文件上传失败')
  } finally {
    // 重置文件输入
    event.target.value = ''
  }
}

const sendFileMessage = async (fileInfo) => {
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId || !activeSessionId.value) return
    const studentId = activeSession.value.members.find(member => member.userRole === 'STUDENT')?.userId
    if (!studentId) return
    const response = await sendMessageApi({
      sessionId: activeSessionId.value,
      receiverId: studentId,
      content: `[文件] ${fileInfo.name}`,
      messageType: 'PRIVATE',
      // 关键：附件必须随消息一起发给后端，否则文件只躺在文件服务里，
      // 「文件管理」页的共享文件列表永远看不到它（列表是从带附件的消息里反查的）。
      // 后端只认 attachmentIds，不认这里传的 url；id 本来就是字符串（雪花 ID 不能走 JS 数字）。
      attachmentIds: [String(fileInfo.id)]
    })
    if (response.code === 200) {
      // 重新加载消息
      await loadMessages(activeSessionId.value)
      // 手动更新会话列表
      await loadSessions()
    }
  } catch (error) {
    console.error('发送文件消息失败:', error)
  }
}

const handleChatAction = async (command) => {
  if (!activeSessionId.value) return
  const teacherId = userStore.userInfo?.userId
  if (!teacherId) return
  switch (command) {
    case 'clear':
      await handleClearMessages()
      break
    case 'export':
      await handleExportChat()
      break
    case 'info':
      await handleViewStudentInfo()
      break
  }
}

const handleClearMessages = async () => {
  try {
    await ElMessageBox.confirm('确定要清空聊天记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) return
    const response = await clearMessages(activeSessionId.value)
    if (response.code === 200) {
      messages.value = []
      ElMessage.success('聊天记录已清空')
      // 更新会话列表
      await loadSessions()
    } else {
      ElMessage.error(response.message || '清空聊天记录失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

const handleExportChat = async () => {
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) return
    
    const response = await exportChatRecords({
      sessionId: activeSessionId.value,
      format: 'txt'
    })
    
    // 处理文件下载
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat_${activeSession.value.name}_${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出聊天记录失败:', error)
    ElMessage.error('导出聊天记录失败')
  }
}

const handleViewStudentInfo = async () => {
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) return
    const studentId = activeSession.value.members.find(member => member.userRole === 'STUDENT')?.userId
    if (!studentId) return
    const response = await getStudentInfo(studentId)
    if (response.code === 200) {
      const student = response.data
      ElMessageBox.alert(
        `<div>
          <p><strong>姓名:</strong> ${student.name}</p>
          <p><strong>邮箱:</strong> ${student.email}</p>
          <p><strong>电话:</strong> ${student.phone}</p>
        </div>`,
        '学生信息',
        {
          dangerouslyUseHTMLString: true
        }
      )
    } else {
      ElMessage.error(response.message || '获取学生信息失败')
    }
  } catch (error) {
    console.error('获取学生信息失败:', error)
    ElMessage.error('获取学生信息失败')
  }
}

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const refreshSessions = async () => {
  await loadSessions()
}

const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
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
    return formatDateTime(date)
  }
}

// 生命周期
onMounted(() => {
  loadSessions()
  
  // 连接WebSocket
  const userId = userStore.userInfo?.userId
  if (userId) {
    connect(userId, handleWebSocketMessage)
  }
})

// WebSocket消息处理
const handleWebSocketMessage = async (data) => {
  if (data.type === 'NEW_MESSAGE') {
    const newMessage = data.content
    // 转换类型进行比较，确保类型匹配
    const msgConversationId = String(newMessage.conversationId)
    const currentSessionId = String(activeSessionId.value)
    
    // 如果是当前会话的消息，添加到消息列表
    if (msgConversationId === currentSessionId) {
      messages.value.push(newMessage)
      nextTick(() => scrollToBottom())
      // 自动标记消息为已读
      if (currentSessionId) {
        await markMessagesRead(currentSessionId)
      }
    }
    // 更新会话列表
    loadSessions()
  }
}

// 组件卸载时断开WebSocket连接
onUnmounted(() => {
  disconnect()
})

// 监听用户信息变化
watch(
  () => userStore.userInfo?.userId,
  (newUserId) => {
    if (newUserId) {
      loadSessions()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
// 聊天页为满屏工作区，隐藏全局页脚避免页面纵向滚动
:global(.main-content:has(.chat-center) .app-footer) {
  display: none;
}

.chat-center {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  height: calc(100vh - var(--app-global-nav-height) - var(--app-subnav-height) - (var(--app-page-gutter) * 2));
  height: calc(100dvh - var(--app-global-nav-height) - var(--app-subnav-height) - (var(--app-page-gutter) * 2));
  font-family: var(--app-font-family);

  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--app-space-4);
    flex-shrink: 0;

    .header-actions {
      display: flex;
      gap: var(--app-space-4);
    }
  }

  .chat-container {
    display: flex;
    flex: 1;
    min-height: 0;
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);
    overflow: hidden;

    .session-list {
      width: 300px;
      border-right: 1px solid var(--app-color-border);
      display: flex;
      flex-direction: column;

      .session-search {
        padding: var(--app-space-4);
        border-bottom: 1px solid var(--app-color-border);

        :deep(.el-input__wrapper) {
          border-radius: var(--app-radius-md);
          font-size: var(--app-fs-caption);
        }
      }

      .session-items {
        flex: 1;
        overflow-y: auto;

        .session-item {
          display: flex;
          align-items: center;
          padding: var(--app-space-3) var(--app-space-4);
          cursor: pointer;
          transition: background-color var(--app-transition-normal);

          &:hover {
            background-color: var(--app-color-fill);
          }

          &.active {
            background-color: var(--app-color-info-bg);
            border-color: var(--app-color-primary);
          }

          .session-avatar {
            margin-right: var(--app-space-3);
          }

          .session-info {
            flex: 1;
            min-width: 0;

            .session-name {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-weight: 600;
              color: var(--app-color-ink);
              margin-bottom: var(--app-space-1);
              font-size: var(--app-fs-body);
            }

            .session-last-message {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: var(--app-fs-meta);
              color: var(--app-color-text-muted);

              .last-message {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-right: var(--app-space-2);
              }

              .last-time {
                color: var(--app-color-text-muted);
              }
            }
          }
        }

        .empty-sessions {
          padding: var(--app-space-8) 0;
          text-align: center;
        }
      }
    }

    .chat-window {
      flex: 1;
      display: flex;
      flex-direction: column;

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--app-space-3) var(--app-space-4);
        border-bottom: 1px solid var(--app-color-border);

        .chat-header-info {
          display: flex;
          align-items: center;

          .chat-header-details {
            margin-left: var(--app-space-3);

            .chat-header-name {
              font-family: var(--app-font-family);
              font-weight: 600;
              color: var(--app-color-ink);
              font-size: var(--app-fs-body);
            }

            .chat-header-members {
              font-size: var(--app-fs-meta);
              color: var(--app-color-text-muted);
            }
          }
        }

        .chat-header-actions {
          display: flex;
          gap: var(--app-space-2);
        }
      }

      .chat-messages {
        flex: 1;
        padding: var(--app-space-6);
        overflow-y: auto;
        background-color: var(--app-color-fill);

        .message-item {
          display: flex;
          margin-bottom: var(--app-space-4);

          &.own-message {
            flex-direction: row-reverse;

            .message-content {
              align-items: flex-end;

              .message-text {
                background-color: var(--app-color-primary);
                color: var(--app-color-on-primary);
                border-radius: var(--app-radius-md) var(--app-radius-md) 0 var(--app-radius-md);
              }
            }
          }

          .message-avatar {
            margin: 0 var(--app-space-3);
          }

          .message-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            max-width: 70%;

            .message-sender {
              font-size: var(--app-fs-meta);
              color: var(--app-color-text-muted);
              margin-bottom: var(--app-space-1);
            }

            .message-text {
              background-color: var(--app-color-card-bg);
              padding: var(--app-space-3);
              font-size: var(--app-fs-caption);
              border-radius: var(--app-radius-md) var(--app-radius-md) var(--app-radius-md) 0;
              word-break: break-all;
            }

            .message-time {
              font-size: var(--app-fs-meta);
              color: var(--app-color-text-muted);
              margin-top: var(--app-space-1);
            }
          }
        }

        .empty-messages {
          padding: var(--app-space-8) 0;
          text-align: center;
        }
      }

      .chat-input {
        display: flex;
        align-items: flex-end;
        padding: var(--app-space-3) var(--app-space-4);
        border-top: 1px solid var(--app-color-border);
        gap: var(--app-space-3);

        .upload-demo {
          margin-bottom: var(--app-space-2);
        }

        .el-input {
          flex: 1;

          textarea {
            resize: none;
          }
        }

        :deep(.el-textarea__inner) {
          border-radius: var(--app-radius-md);
          font-size: var(--app-fs-caption);
        }
      }
    }

    .chat-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--app-color-fill);
    }
  }
}

@media (max-width: 768px) {
  .chat-center {
    height: auto;

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--app-space-3);

      .header-actions {
        width: 100%;
        justify-content: space-between;
        gap: var(--app-space-3);
      }
    }

    .chat-container {
      flex: none;
      flex-direction: column;
      height: auto;

      .session-list {
        width: 100%;
        height: 200px;
        border-right: none;
        border-bottom: 1px solid var(--app-color-border);

        .session-items {
          display: flex;
          overflow-x: auto;
          flex-direction: row;

          .session-item {
            flex-direction: column;
            width: 100px;
            text-align: center;

            .session-avatar {
              margin-right: 0;
              margin-bottom: var(--app-space-2);
            }

            .session-info {
              text-align: center;

              .session-name {
                justify-content: center;
              }

              .session-last-message {
                display: none;
              }
            }
          }
        }
      }

      .chat-window {
        flex: none;
        // 手机端给聊天窗一个明确高度，消息区才能恢复内部滚动；
        // 否则父级 auto 高度会把输入框一路推到页面底部
        height: 60vh;
        height: 60dvh;
        min-height: 360px;

        .chat-input {
          flex-direction: column;
          align-items: stretch;

          .el-input {
            margin: var(--app-space-2) 0;
          }

          .el-button {
            align-self: flex-end;
          }
        }
      }
    }
  }
}
</style>
