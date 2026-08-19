<template>
  <div class="message-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">消息中心</h1>
          <p class="page-subtitle">与学生和同事的沟通交流</p>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :max="99" v-if="unreadCount > 0">
            <el-button type="primary" :icon="Bell" @click="refreshMessages">
              刷新消息
            </el-button>
          </el-badge>
          <el-button v-else type="primary" :icon="Bell" @click="refreshMessages">
            刷新消息
          </el-button>
        </div>
      </div>
    </div>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧：联系人列表 -->
      <el-col :span="6">
        <el-card class="contacts-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索联系人"
                :prefix-icon="Search"
                clearable
                class="search-input"
              />
            </div>
          </template>
          
          <div class="contacts-list">
            <div 
              v-for="contact in filteredContacts" 
              :key="contact.id"
              class="contact-item"
              :class="{ active: activeContact?.id === contact.id }"
              @click="selectContact(contact)"
            >
              <el-badge :value="contact.unreadCount" :max="99" v-if="contact.unreadCount > 0">
                <el-avatar :size="40" :src="getAvatarUrl(contact.avatar)">
                  {{ contact.name.charAt(0) }}
                </el-avatar>
              </el-badge>
              <el-avatar v-else :size="40" :src="getAvatarUrl(contact.avatar)">
                {{ contact.name.charAt(0) }}
              </el-avatar>
              
              <div class="contact-info">
                <div class="contact-name">{{ contact.name }}</div>
                <div class="contact-role">{{ contact.role }}</div>
                <div class="last-message" v-if="contact.lastMessage">
                  {{ truncateMessage(contact.lastMessage.content) }}
                </div>
              </div>
              
              <div class="contact-meta">
                <div class="message-time">
                  {{ formatTime(contact.lastMessage?.createTime) }}
                </div>
              </div>
            </div>
            
            <div v-if="filteredContacts.length === 0" class="empty-contacts">
              <el-empty description="暂无联系人" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：聊天窗口 -->
      <el-col :span="18">
        <el-card class="chat-card" shadow="never" v-if="activeContact">
          <template #header>
            <div class="chat-header">
              <div class="contact-profile">
                <el-avatar :size="40" :src="getAvatarUrl(activeContact.avatar)">
                  {{ activeContact.name.charAt(0) }}
                </el-avatar>
                <div class="contact-details">
                  <div class="contact-name">{{ activeContact.name }}</div>
                  <div class="contact-status">{{ activeContact.status }}</div>
                </div>
              </div>
              <div class="chat-actions">
                <el-button-group>
                  <el-button :icon="Phone" @click="makeCall"></el-button>
                  <el-button :icon="VideoCamera" @click="videoCall"></el-button>
                  <el-button :icon="More" @click="showContactInfo"></el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <!-- 消息列表 -->
          <div class="messages-container" ref="messagesContainer">
            <div 
              v-for="message in messages" 
              :key="message.id"
              class="message-item"
              :class="{ 'sent': message.senderId === currentUser.id, 'received': message.senderId !== currentUser.id }"
            >
              <div class="message-avatar">
                <el-avatar :size="32" :src="getAvatarUrl(message.senderAvatar)">
                  {{ message.senderName.charAt(0) }}
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="sender-name" v-if="message.senderId !== currentUser.id">
                  {{ message.senderName }}
                </div>
                <div class="message-bubble">
                  <div class="message-text" v-html="formatMessage(message.content)"></div>
                  <div class="message-files" v-if="message.attachments?.length">
                    <div 
                      v-for="file in message.attachments" 
                      :key="file.id"
                      class="file-item"
                      @click="downloadFile(file)"
                    >
                      <el-icon><Document /></el-icon>
                      <span>{{ file.name }}</span>
                      <span class="file-size">({{ formatFileSize(file.size) }})</span>
                    </div>
                  </div>
                </div>
                <div class="message-time">
                  {{ message.formattedTime || formatDateTime(message.createTime) }}
                  <el-icon v-if="message.senderId === currentUser.id && message.status === 'read'">
                    <Check />
                  </el-icon>
                </div>
              </div>
            </div>
            
            <div v-if="messages.length === 0" class="empty-messages">
              <el-empty description="暂无消息记录" :image-size="120" />
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="message-input-area">
            <div class="input-toolbar">
              <el-button-group>
                <el-button :icon="Folder" @click="showFilePicker"></el-button>
                <el-button :icon="Picture" @click="showImagePicker"></el-button>
                <el-button :icon="Link" @click="insertLink"></el-button>
              </el-button-group>
            </div>
            
            <div class="input-container">
              <el-input
                v-model="messageContent"
                type="textarea"
                :rows="3"
                placeholder="输入消息内容..."
                @keydown.ctrl.enter="sendMessage"
                maxlength="1000"
                show-word-limit
              />
              <div class="send-actions">
                <div class="typing-indicator" v-if="isTyping">
                  <span>{{ activeContact.name }} 正在输入...</span>
                </div>
                <el-button-group>
                  <el-button @click="clearInput">清空</el-button>
                  <el-button type="primary" @click="sendMessage" :disabled="!messageContent.trim()">
                    发送 (Ctrl+Enter)
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 未选择联系人时的提示 -->
        <div v-else class="no-contact-selected">
          <el-empty description="请选择一个联系人开始对话" :image-size="200">
            <template #image>
              <el-icon :size="100" color="#c0c4cc"><ChatDotRound /></el-icon>
            </template>
          </el-empty>
        </div>
      </el-col>
    </el-row>

    <!-- 文件选择对话框 -->
    <el-dialog
      v-model="fileDialogVisible"
      title="选择文件"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleFileUploadSuccess"
        multiple
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="fileDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmFileSelection">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 图标导入
import {
  Search, Bell, Phone, VideoCamera, More, Document, 
  Folder, Picture, Link, Check, ChatDotRound, UploadFilled
} from '@element-plus/icons-vue'
import { getAvatarUrl } from '@/utils/avatar'

// Store
const userStore = useUserStore()

// 响应式数据
const searchKeyword = ref('')
const contacts = ref([])
const activeContact = ref(null)
const messages = ref([])
const messageContent = ref('')
const unreadCount = ref(0)
const isTyping = ref(false)
const fileDialogVisible = ref(false)
const selectedFiles = ref([])
const messagesContainer = ref(null)

// 计算属性
const currentUser = computed(() => ({
  id: userStore.userInfo?.userId,
  name: userStore.userInfo?.realName,
  avatar: userStore.userInfo?.avatar
}))

const filteredContacts = computed(() => {
  if (!searchKeyword.value) return contacts.value
  return contacts.value.filter(contact => 
    contact.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const uploadUrl = computed(() => {
  return '/api/message/upload'
})

const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

// 方法
const refreshMessages = async () => {
  try {
    // 加载联系人列表
    await loadContacts()
    // 加载未读消息数
    await loadUnreadCount()
    ElMessage.success('消息已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

const loadContacts = async () => {
  try {
    // 模拟联系人数据
    contacts.value = [
      {
        id: 1,
        name: '张三',
        role: '学生',
        avatar: '',
        status: '在线',
        unreadCount: 3,
        lastMessage: {
          content: '老师，我的论文初稿已经完成了，请您帮忙看看。',
          createTime: '2024-01-15T10:30:00'
        }
      },
      {
        id: 2,
        name: '李四',
        role: '学生',
        avatar: '',
        status: '离线',
        unreadCount: 0,
        lastMessage: {
          content: '谢谢老师的指导意见！',
          createTime: '2024-01-14T15:20:00'
        }
      }
    ]
  } catch (error) {
    console.error('加载联系人失败:', error)
  }
}

const loadUnreadCount = async () => {
  try {
    unreadCount.value = contacts.value.reduce((sum, contact) => sum + contact.unreadCount, 0)
  } catch (error) {
    console.error('加载未读数失败:', error)
  }
}

const selectContact = async (contact) => {
  activeContact.value = contact
  await loadMessages(contact.id)
  // 标记消息为已读
  await markAsRead(contact.id)
}

const loadMessages = async (contactId) => {
  try {
    // 模拟消息数据
    messages.value = [
      {
        id: 1,
        senderId: contactId,
        senderName: activeContact.value?.name,
        senderAvatar: '',
        content: '老师，我的论文初稿已经完成了，请您帮忙看看。',
        createTime: '2024-01-15T10:30:00',
        status: 'read',
        attachments: []
      },
      {
        id: 2,
        senderId: currentUser.value.id,
        senderName: currentUser.value.name,
        senderAvatar: currentUser.value.avatar,
        content: '好的，我这就查看一下。',
        createTime: '2024-01-15T10:35:00',
        status: 'read',
        attachments: []
      }
    ]
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

const sendMessage = async () => {
  if (!messageContent.value.trim()) return
  
  try {
    const newMessage = {
      id: Date.now(),
      senderId: currentUser.value.id,
      senderName: currentUser.value.name,
      senderAvatar: currentUser.value.avatar,
      content: messageContent.value,
      createTime: new Date().toISOString(),
      status: 'sent',
      attachments: selectedFiles.value
    }
    
    messages.value.push(newMessage)
    messageContent.value = ''
    selectedFiles.value = []
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
    
    // 发送消息到服务器
    await sendToServer(newMessage)
    
    ElMessage.success('消息发送成功')
  } catch (error) {
    ElMessage.error('消息发送失败')
  }
}

const sendToServer = async (message) => {
  // 实际的API调用
  // await sendMessageAPI(message)
}

const markAsRead = async (contactId) => {
  try {
    // 标记消息为已读
    const contact = contacts.value.find(c => c.id === contactId)
    if (contact) {
      contact.unreadCount = 0
      await loadUnreadCount()
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const clearInput = () => {
  messageContent.value = ''
  selectedFiles.value = []
}

const showFilePicker = () => {
  fileDialogVisible.value = true
}

const showImagePicker = () => {
  // 图片选择逻辑
}

const insertLink = () => {
  // 插入链接逻辑
}

const makeCall = () => {
  ElMessage.info('语音通话功能开发中')
}

const videoCall = () => {
  ElMessage.info('视频通话功能开发中')
}

const showContactInfo = () => {
  ElMessage.info('联系人详情功能开发中')
}

const downloadFile = (file) => {
  // 文件下载逻辑
}

const handleFileUploadSuccess = (response, file) => {
  selectedFiles.value.push({
    id: response.data.id,
    name: file.name,
    size: file.size,
    url: response.data.url
  })
  ElMessage.success('文件上传成功')
}

const confirmFileSelection = () => {
  fileDialogVisible.value = false
}

const truncateMessage = (content) => {
  if (!content) return ''
  return content.length > 30 ? content.substring(0, 30) + '...' : content
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

const formatDateTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatMessage = (content) => {
  // 简单的消息格式化，支持换行
  return content.replace(/\n/g, '<br>')
}

// 生命周期
onMounted(() => {
  refreshMessages()
  
  // 模拟WebSocket连接
  const ws = new WebSocket('ws://localhost:8080/websocket')
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'new_message') {
      // 处理新消息
    }
  }
})

onUnmounted(() => {
  // 清理WebSocket连接
})
</script>

<style lang="scss" scoped>
.message-center {
  height: 100%;
  
  .page-header {
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      .page-subtitle {
        margin: 0;
        color: #606266;
      }
    }
  }
  
  .main-content {
    height: calc(100vh - 200px);
    
    .contacts-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      :deep(.el-card__body) {
        flex: 1;
        padding: 0;
        overflow: hidden;
      }
      
      .search-input {
        margin-bottom: 16px;
      }
      
      .contacts-list {
        flex: 1;
        overflow-y: auto;
        
        .contact-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
          
          &:hover {
            background-color: #f5f7fa;
          }
          
          &.active {
            background-color: #ecf5ff;
            border-left: 3px solid #409eff;
          }
          
          .contact-info {
            flex: 1;
            margin-left: 12px;
            
            .contact-name {
              font-weight: 500;
              margin-bottom: 4px;
            }
            
            .contact-role {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }
            
            .last-message {
              font-size: 12px;
              color: #909399;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
          
          .contact-meta {
            .message-time {
              font-size: 12px;
              color: #909399;
            }
          }
        }
        
        .empty-contacts {
          padding: 40px 0;
          text-align: center;
        }
      }
    }
    
    .chat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      
      :deep(.el-card__body) {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      
      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .contact-profile {
          display: flex;
          align-items: center;
          
          .contact-details {
            margin-left: 12px;
            
            .contact-name {
              font-weight: 500;
              font-size: 16px;
            }
            
            .contact-status {
              font-size: 12px;
              color: #67c23a;
            }
          }
        }
      }
      
      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        
        .message-item {
          display: flex;
          margin-bottom: 20px;
          
          &.sent {
            flex-direction: row-reverse;
            
            .message-content {
              margin-right: 12px;
              margin-left: 0;
              align-items: flex-end;
              
              .message-bubble {
                background-color: #409eff;
                color: white;
                border-radius: 16px 4px 16px 16px;
              }
            }
          }
          
          &.received {
            .message-content {
              margin-left: 12px;
              
              .message-bubble {
                background-color: #f0f2f5;
                color: #333;
                border-radius: 4px 16px 16px 16px;
              }
            }
          }
          
          .message-content {
            display: flex;
            flex-direction: column;
            max-width: 70%;
            
            .sender-name {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }
            
            .message-bubble {
              padding: 12px 16px;
              position: relative;
              
              .message-text {
                line-height: 1.5;
                word-wrap: break-word;
              }
              
              .message-files {
                margin-top: 8px;
                
                .file-item {
                  display: flex;
                  align-items: center;
                  padding: 8px;
                  background: rgba(255, 255, 255, 0.2);
                  border-radius: 4px;
                  margin-top: 4px;
                  cursor: pointer;
                  
                  .el-icon {
                    margin-right: 8px;
                  }
                  
                  .file-size {
                    margin-left: 8px;
                    font-size: 12px;
                    opacity: 0.8;
                  }
                }
              }
            }
            
            .message-time {
              font-size: 12px;
              color: #909399;
              margin-top: 4px;
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }
        }
        
        .empty-messages {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
      }
      
      .message-input-area {
        border-top: 1px solid #f0f0f0;
        padding: 16px;
        
        .input-toolbar {
          margin-bottom: 12px;
        }
        
        .input-container {
          .send-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            
            .typing-indicator {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
    
    .no-contact-selected {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  }
}

.upload-demo {
  :deep(.el-upload-dragger) {
    width: 100%;
  }
}
</style>