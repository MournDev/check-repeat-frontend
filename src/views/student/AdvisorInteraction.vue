<template>
  <div class="advisor-interaction-page">
    <!-- 页面标题 -->
    <PageHeader description="与指导老师沟通交流，获取论文指导" />

    <el-row :gutter="20" class="interaction-content">
      <!-- 左侧：消息会话列表 -->
      <el-col :xs="24" :lg="8">
        <!-- 消息会话列表 -->
        <el-card class="sessions-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><ChatLineRound /></el-icon>
                消息会话
              </span>
            </div>
          </template>

          <div class="sessions-list">
            <div 
              v-for="session in messageSessions" 
              :key="session.id"
              class="session-item"
              :class="{ 'session-active': session.id === activeSessionId }"
              @click="switchSession(session.id)"
            >
              <div class="session-avatar">
                <el-avatar :size="40" :src="getSessionAvatar(session)">
                  {{ session.name?.charAt(0) }}
                </el-avatar>
              </div>
              <div class="session-content">
                <div class="session-header">
                  <span class="session-name">{{ session.name }}</span>
                  <span class="session-time">{{ formatMessageTime(session.lastTime) }}</span>
                </div>
                <div class="session-preview">
                  {{ session.lastMessage }}
                </div>
                <div class="session-meta">
                  <el-tag v-if="session.unreadCount > 0" type="danger" size="small">
                    {{ session.unreadCount }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- 没导师时列表本来就是空的，别让卡片空着不给说法 -->
            <el-empty
              v-if="messageSessions.length === 0"
              :image-size="60"
              :description="advisorInfo ? '暂无消息会话' : '暂未分配指导老师'"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：消息对话区域 -->
      <el-col :xs="24" :lg="16">
        <el-card class="chat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><ChatDotRound /></el-icon>
                {{ currentSession?.name || '消息对话' }}
                <el-tag 
                  v-if="currentSession?.unreadCount && currentSession.unreadCount > 0" 
                  type="danger" 
                  size="small" 
                  effect="dark"
                >
                  {{ currentSession.unreadCount }} 条未读
                </el-tag>
              </span>
              <div class="chat-actions">
                <el-button text :icon="User" @click="showAdvisorDialog = true">
                  导师信息
                </el-button>
                <el-button text :icon="Refresh" @click="refreshMessages">
                  刷新
                </el-button>
                <el-dropdown trigger="click">
                  <el-button text :icon="MoreFilled">
                    更多
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :icon="Delete" @click="clearMessages">清空消息</el-dropdown-item>
                      <el-dropdown-item :icon="Download" @click="exportChatHistory">导出聊天记录</el-dropdown-item>

                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>

          <!-- 消息区域 -->
          <div class="chat-container" ref="chatContainerRef" @scroll="handleMessagesScroll">
            <div v-if="activeSessionId" class="messages-area">
              <!-- 加载提示 -->
              <div v-if="loadingMessages && currentPage > 1" class="loading-more">
                <span>加载中...</span>
              </div>
              
              <!-- 快捷回复按钮 -->
              <div class="quick-replies">
                <el-tag
                  v-for="(reply, index) in quickReplyOptions"
                  :key="index"
                  type="info"
                  size="small"
                  effect="plain"
                  round
                  @click="insertQuickReply(reply)"
                >
                  {{ reply }}
                </el-tag>
              </div>
              
              <div 
                v-for="(message, index) in currentMessages" 
                :key="message.id"
              >
                <div v-if="shouldShowTimeSeparator(index, message)" class="time-separator">{{ formatMessageTime(message.time) }}</div>
                <div
                  class="message-item"
                  :class="{
                    'message-sent': String(message.senderId) === String(userStore.userInfo?.userId),
                    'message-received': String(message.senderId) !== String(userStore.userInfo?.userId)
                  }"
                >
                  <div class="message-avatar">
                    <el-avatar
                      :size="36"
                      :src="getAvatarUrl(userMap[message.senderId]?.avatar || message.avatar || message.senderAvatar)"
                      :alt="userMap[message.senderId]?.realName || message.senderName"
                    >
                      {{ (userMap[message.senderId]?.realName || message.senderName)?.charAt(0) }}
                    </el-avatar>
                  </div>
                  <div class="message-content">
                    <div class="message-info">
                      <span v-if="message.senderId !== userStore.userInfo?.userId" class="message-sender">
                        {{ userMap[message.senderId]?.realName || message.senderName || '未知用户' }}
                      </span>
                      <span class="message-time">{{ formatMessageTime(message.time || message.sendTime) }}</span>
                    </div>
                  </div>
                  <div class="message-bubble">
                    <div class="message-text">{{ message.content }}</div>
                  </div>
                  <div v-if="message.attachments" class="message-attachments">
                    <div 
                      v-for="file in message.attachments" 
                      :key="file.id"
                      class="attachment-item"
                    >
                      <el-icon><Document /></el-icon>
                      <span>{{ file.name }}</span>
                      <el-button type="primary" text size="small" @click="downloadAttachment(file)">
                        下载
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-loading="loadingMessages" class="loading-mask">
                <span></span>
              </div>
            </div>
            <div v-else class="no-session">
              <el-empty description="请选择一个会话开始聊天" :image-size="120" />
            </div>
          </div>

          <!-- 消息输入区域 -->
          <div v-if="activeSessionId" class="message-input">
            <div class="input-toolbar">
              <el-button text @click="showEmojiPicker = !showEmojiPicker">
                😊
              </el-button>
              <el-button text :icon="Paperclip" @click="attachFile">
                附件
              </el-button>
              <el-button text :icon="Picture" @click="attachImage">
                图片
              </el-button>
              <el-divider direction="vertical" />
              <span class="toolbar-tip">支持表情、附件、图片</span>
            </div>
            
            <!-- 表情选择器 -->
            <div v-if="showEmojiPicker" class="emoji-picker">
              <div class="emoji-grid">
                <span v-for="emoji in emojiList" :key="emoji" class="emoji-item" @click="insertEmoji(emoji)">
                  {{ emoji }}
                </span>
              </div>
            </div>
            
            <el-input
              v-model="newMessage"
              type="textarea"
              :rows="3"
              placeholder="输入消息内容，按 Ctrl+Enter 发送.."
              resize="none"
              @keydown.ctrl.enter.exact="sendMessage"
            />
            <div class="input-actions">
              <div class="input-info">
                <span v-if="attachments.length > 0" class="attachment-count">
                  <el-icon><Paperclip /></el-icon>
                  已添加{{ attachments.length }} 个附件
                </span>
              </div>
              <el-button 
                type="primary" 
                :icon="Promotion" 
                :disabled="!newMessage.trim() && attachments.length === 0"
                @click="sendMessage"
                class="send-button"
              >
                发送
              </el-button>
            </div>
          </div>
        </el-card>

      </el-col>
    </el-row>

    <!-- 发送消息对话框 -->
    <el-dialog 
      v-model="messageDialogVisible" 
      title="发送新消息" 
      width="500px"
    >
      <el-form :model="messageForm" label-width="80px">
        <el-form-item label="收件人">
          <el-input :value="advisorInfo?.name" disabled />
        </el-form-item>
        <el-form-item label="主题">
          <el-input v-model="messageForm.subject" placeholder="请输入消息主题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input 
            v-model="messageForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入消息内容"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            action="#"
            multiple
            :file-list="messageForm.attachments"
            :auto-upload="false"
          >
            <el-button type="primary" text :icon="Paperclip">添加附件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="messageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendNewMessage">
          发送
        </el-button>
      </template>
    </el-dialog>

    <!-- 导师信息对话框 -->
    <el-dialog v-model="showAdvisorDialog" title="导师信息" width="480px" center>
      <div v-if="advisorInfo" class="advisor-dialog-content">
        <div class="advisor-dialog-header">
          <el-avatar :size="72" :src="getAvatarUrl(advisorInfo.avatar)" :alt="advisorInfo.name">
            {{ advisorInfo.name?.charAt(0) }}
          </el-avatar>
          <div class="advisor-dialog-title">
            <h3>{{ advisorInfo.name }}</h3>
            <p>{{ advisorInfo.title }}</p>
            <p class="advisor-dialog-field">
              <el-icon><School /></el-icon>
              {{ advisorInfo.researchField }}
            </p>
          </div>
        </div>
        <div class="advisor-dialog-grid">
          <div class="detail-item">
            <el-icon class="detail-icon"><Message /></el-icon>
            <div class="detail-content">
              <span class="detail-label">邮箱</span>
              <span class="detail-value">{{ advisorInfo.email }}</span>
            </div>
          </div>
          <div class="detail-item">
            <el-icon class="detail-icon"><Phone /></el-icon>
            <div class="detail-content">
              <span class="detail-label">电话</span>
              <span class="detail-value">{{ advisorInfo.phone }}</span>
            </div>
          </div>
          <div class="detail-item">
            <el-icon class="detail-icon"><OfficeBuilding /></el-icon>
            <div class="detail-content">
              <span class="detail-label">办公室</span>
              <span class="detail-value">{{ advisorInfo.office }}</span>
            </div>
          </div>
          <div class="detail-item">
            <el-icon class="detail-icon"><Clock /></el-icon>
            <div class="detail-content">
              <span class="detail-label">办公时间</span>
              <span class="detail-value">{{ advisorInfo.officeHours }}</span>
            </div>
          </div>
        </div>
        <div v-if="advisorInfo.bio" class="advisor-dialog-bio">
          <h4>导师简介</h4>
          <p>{{ advisorInfo.bio }}</p>
        </div>
      </div>
      <div v-else class="no-advisor-dialog">
        <el-empty description="暂未分配指导老师" :image-size="80" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import PageHeader from '@/components/common/PageHeader.vue'

// API 导入
import { 
  getAdvisorInteractionInfo, 
  getMessageSessions, 
  getMessages, 
  sendMessage as sendMsgApi,
  uploadMessageFile,
  downloadMessageAttachment,
  clearMessages as clearMsgApi,
  exportChatHistory as exportHistoryApi,
  markMessagesAsRead,
  recallMessage
} from "@/api/student.js";

// 图标引入
import {
  School, Message, Phone, OfficeBuilding, Clock,
  ChatLineRound, ChatDotRound, Promotion, Paperclip, Picture,
  Download, Document, Refresh, MoreFilled, Delete, User
} from '@element-plus/icons-vue'
import { getAvatarUrl } from '@/utils/avatar'
import { useMessageWebSocket } from '@/composables/useMessageWebSocket'

// 响应式数据
const userStore = useUserStore()
const messageStore = useMessageStore()
const advisorInfo = ref(null)
const messageSessions = ref([])
const activeSessionId = ref(null)
const currentMessages = ref([])
const newMessage = ref('')
const attachments = ref([])
const messageDialogVisible = ref(false)
const showAdvisorDialog = ref(false)
const loadingMessages = ref(false)
const showEmojiPicker = ref(false)
const chatContainerRef = ref(null)
const chatContainer = ref(null)
const currentPage = ref(1)
const totalMessages = ref(0)
const hasMoreMessages = ref(true)

// 用户信息Map（userId→用户信息）
const userMap = ref({})

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐'
]

// 快捷回复选项
const quickReplyOptions = ref([
  '谢谢老师，我会尽快修改',
  '收到，老师辛苦了',
  '请问老师什么时候有空？',
  '我已经按照您的意见修改了'
])

const messageForm = reactive({
  subject: '',
  content: '',
  attachments: []
})

// 计算属性
const currentSession = computed(() => {
  return messageSessions.value.find(session => session.id === activeSessionId.value)
})

// 方法：从会话成员中提取对方（非当前用户）的头像
const getSessionAvatar = (session) => {
  if (!session || !session.members) return undefined
  
  // 找到不是当前用户的成员（即导师联系人）
  const otherMember = session.members.find(member => member.userId !== userStore.userInfo?.userId)
  
  // 如果有其他成员，返回其头像；否则返回第一个成员的头像
  const avatar = otherMember ? otherMember.avatar : session.members[0]?.avatar
  
  // 如果 avatar 为空、null 或undefined，返回undefined（让 el-avatar 显示插槽内容)
  if (!avatar || avatar === 'null' || avatar === 'undefined') return undefined
  
  // 使用导入的 getAvatarUrl 函数处理头像 URL
  return getAvatarUrl(avatar)
}

// 方法
// 聊天未读合计回写全站 SSOT（messageStore），供侧边栏角标/铃铛合计使用
const syncChatUnread = () => {
  messageStore.setChatUnread(
    messageSessions.value.reduce((sum, s) => sum + (s.unreadCount || 0), 0)
  );
};

const loadAdvisorData = async () => {
  try {
    // 获取导师信息
    const advisorRes = await getAdvisorInteractionInfo();
    if (advisorRes.code === 200 && advisorRes.data) {
      advisorInfo.value = advisorRes.data;
      // 收集导师信息到userMap
      if (advisorInfo.value.userId) {
        userMap.value[advisorInfo.value.userId] = {
          userId: advisorInfo.value.userId,
          realName: advisorInfo.value.name,
          avatar: advisorInfo.value.avatar
        }
      }
      // 确保当前用户信息也存在于 userMap（用于渲染自己发送的消息）
      if (userStore.userInfo?.userId && !userMap.value[userStore.userInfo.userId]) {
        userMap.value[userStore.userInfo.userId] = {
          userId: userStore.userInfo.userId,
          realName: userStore.userInfo.realName || userStore.userInfo.username,
          avatar: userStore.userInfo.avatar
        }
      }
    } else {
      // 空态，不是错误：「没分配导师」在 api/student.js 里已被归一成 200 + null，
      // 模板据此显示「暂未分配指导老师」。真失败会在那里就抛出来。
      console.info('该学生暂未分配指导老师');
      advisorInfo.value = null;
    }
    // 获取消息会话列表
    const sessionsRes = await getMessageSessions();
    if (sessionsRes.code === 200) {
      messageSessions.value = sessionsRes.data;
      // 聊天未读合计回写全站 SSOT（messageStore），供侧边栏角标/铃铛合计使用
      syncChatUnread();
      // 收集会话成员到userMap
      sessionsRes.data.forEach(session => {
        if (session.members) {
          session.members.forEach(member => {
            if (member.userId) {
              userMap.value[member.userId] = {
                userId: member.userId,
                realName: member.name || member.realName || member.username,
                avatar: member.avatar
              }
            }
          })
        }
      })
      // 补全会话的显示信息（avatar/name/lastTime），保证左侧列表与消息区一致
      messageSessions.value.forEach(session => {
        // 优先使用已有字段，否则从成员中取
        const otherMember = (session.members || []).find(m => m.userId !== userStore.userInfo?.userId) || session.members?.[0];
        session.avatar = session.avatar || getSessionAvatar(session) || otherMember?.avatar;
        session.name = session.name || session.displayName || otherMember?.name || otherMember?.realName || otherMember?.username || '会话';
        // 兼容多种后端时间字段：lastTime, updatedAt, lastMessageTime, lastMessage?.time
        session.lastTime = session.lastTime || session.updatedAt || session.lastMessageTime || session.lastMessage?.time || session.updatedTime || null;
      })
    } else {
      console.warn('获取会话列表失败:', sessionsRes.message);
      messageSessions.value = [];
    }
  } catch (error) {
    console.error('加载导师数据失败:', error);
    // 接口失败（业务码失败 / axios 失败）在拦截器和 api/student.js 里已经提示过，
    // 这里再弹一根红条就是同一句话在屏幕上出现两次；只有意料之外的报错才补提示。
    const isApiError = error?.isAxiosError || (error && !(error instanceof Error) && 'code' in error);
    if (!isApiError) {
      ElMessage.error('加载数据失败: ' + (error.message || '未知错误'));
    }
  }
};

const loadMessages = async (sessionId, isPrepend = false) => {
  loadingMessages.value = true;
  
  let scrollHeightBefore = 0;
  if (isPrepend && chatContainerRef.value) {
    scrollHeightBefore = chatContainerRef.value.scrollHeight;
  }
  
  try {
    const res = await getMessages({
      sessionId,
      pageNum: isPrepend ? currentPage.value + 1 : 1,
      pageSize: 20
    });
    if (res.code === 200) {
      const newMessages = res.data.records || [];
      totalMessages.value = res.data.total || 0;
      
      if (isPrepend) {
        currentMessages.value = [...currentMessages.value, ...newMessages];
        currentPage.value++;
      } else {
        currentMessages.value = newMessages;
        currentPage.value = 1;
      }
      
      // 收集消息发送者到 userMap，并补全消息的 senderName/avatar
      currentMessages.value.forEach(msg => {
        const sid = msg.senderId;
        if (sid && !userMap.value[sid]) {
          userMap.value[sid] = {
            userId: sid,
            realName: msg.senderName || msg.realName || msg.username || '未知用户',
            avatar: msg.avatar
          }
        }
        // 优先使用 userMap 中的信息渲染消息
        if (sid) {
          msg.senderName = (userMap.value[sid] && userMap.value[sid].realName) || msg.senderName || '未知用户';
          msg.avatar = (userMap.value[sid] && userMap.value[sid].avatar) || msg.avatar;
        }
        // 如果 API 使用其他字段表示发送者，兼容处理
        if (!msg.senderId && (msg.fromUserId || msg.from)) {
          const altId = msg.fromUserId || msg.from;
          msg.senderId = altId;
          if (altId && userMap.value[altId]) {
            msg.senderName = userMap.value[altId].realName || msg.senderName;
            msg.avatar = userMap.value[altId].avatar || msg.avatar;
          }
        }
      });
      
      hasMoreMessages.value = currentMessages.value.length < totalMessages.value;
      
      if (!isPrepend) {
        // 标记消息为已读 - 这会自动更新 unreadCount
        try {
          const readRes = await markMessagesAsRead({
            sessionId
          });
          if (readRes.code === 200) {
            // 手动更新当前会话的未读数
            const sessionIndex = messageSessions.value.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
              messageSessions.value[sessionIndex].unreadCount = 0;
              syncChatUnread();
              // 更新该会话的最后时间和预览信息，使用最新一条消息的时间和内容
              const latestMsg = currentMessages.value.length ? currentMessages.value[currentMessages.value.length - 1] : null;
              messageSessions.value[sessionIndex].lastTime = latestMsg?.time || messageSessions.value[sessionIndex].lastTime;
              messageSessions.value[sessionIndex].lastMessage = latestMsg?.content || messageSessions.value[sessionIndex].lastMessage;
            }
          }
        } catch (error) {
          console.warn('标记消息已读失败:', error);
        }
        // 滚动到底部
        nextTick(() => {
          scrollToBottom();
        });
      } else {
        // 加载更多时保持滚动位置
        nextTick(() => {
          if (chatContainerRef.value) {
            chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight - scrollHeightBefore;
          }
        });
      }
    }
  } catch (error) {
    console.error('加载消息失败:', error);
    ElMessage.error('加载消息失败');
  } finally {
    loadingMessages.value = false;
    await nextTick()
    scrollToBottom()
  }
};

const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

const handleMessagesScroll = async (e) => {
  const target = e.target;
  if (!target) return;
  
  const isNearTop = target.scrollTop < 50;
  
  if (isNearTop && hasMoreMessages.value && !loadingMessages.value) {
    await loadMessages(activeSessionId.value, true);
  }
}

const getMessageSenderName = (message) => {
  if (!message) return ''
  const sid = message.senderId
  const nameFromMap = sid ? (userMap.value[sid] && userMap.value[sid].realName) : null
  if (nameFromMap && nameFromMap !== '未知用户') return nameFromMap
  if (message.senderName && message.senderName !== '未知用户') return message.senderName
  // fallback to current session name (conversation partner)
  return currentSession.value?.name || ''
}

const switchSession = (sessionId) => {
  activeSessionId.value = sessionId;
  currentPage.value = 1;
  hasMoreMessages.value = true;
  loadMessages(sessionId);
  // 切换会话时，同时更新该会话的未读数
  const sessionIndex = messageSessions.value.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    messageSessions.value[sessionIndex].unreadCount = 0;
    syncChatUnread();
  }
}

const startNewMessage = () => {
  messageDialogVisible.value = true
}

const sendNewMessage = () => {
  ElMessage.success('消息发送成功')
  messageDialogVisible.value = false
  // 重置表单
  Object.keys(messageForm).forEach(key => {
    if (key !== 'attachments') {
      messageForm[key] = ''
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim() && attachments.length === 0) return;

  try {
    // 从会话成员中找到非当前用户的成员（即导师）
    const otherMember = currentSession.value?.members?.find(member => member.userId !== userStore.userInfo?.userId);
    const receiverId = otherMember?.userId;
    
    if (!receiverId) {
      ElMessage.error('无法获取接收者信息');
      return;
    }
    
    // 确保当前用户信息存在于 userMap，便于立即渲染自己的头像和姓名
    if (userStore.userInfo?.userId && !userMap.value[userStore.userInfo.userId]) {
      userMap.value[userStore.userInfo.userId] = {
        userId: userStore.userInfo.userId,
        realName: userStore.userInfo.realName || userStore.userInfo.username,
        avatar: userStore.userInfo.avatar
      }
    }
    
    // 后端 MessageSendDTO.content 是 @NotBlank，而上面的按钮只要求"有文字或有附件"即可点。
    // 于是"只发附件"会被 400 挡掉，附件也跟着一起丢。这里补一个占位文案兜住这个组合，
    // 与教师端聊天页发文件的写法一致。
    const content = newMessage.value.trim()
      || (attachments.value.length > 0
        ? `[文件] ${attachments.value.map(att => att.name).join('、')}`
        : '')

    const messageData = {
      sessionId: activeSessionId.value,
      receiverId: receiverId,
      senderId: userStore.userInfo?.userId,
      content,
      attachmentIds: attachments.value.map(att => att.id),
      senderName: userStore.userInfo?.realName || userStore.userInfo?.username || '未知用户'
    };

    const res = await sendMsgApi(messageData);
    
    if (res.code === 200) {
      // 立即将本条消息加入本地消息列表，改善感知延迟
      try {
        const localMsg = {
          id: res.data?.id || Date.now(),
          senderId: userStore.userInfo?.userId,
          senderName: userStore.userInfo?.realName || userStore.userInfo?.username || '我',
          avatar: userStore.userInfo?.avatar,
          content: newMessage.value,
          time: new Date().toISOString(),
          attachments: attachments.value
        }
        currentMessages.value.push(localMsg);
        // 更新会话的 lastTime/lastMessage，保证左侧时间即时更新
        const sIndex = messageSessions.value.findIndex(s => s.id === activeSessionId.value);
        if (sIndex !== -1) {
          messageSessions.value[sIndex].lastTime = localMsg.time;
          messageSessions.value[sIndex].lastMessage = localMsg.content;
        }
      } catch (e) {
        // ignore local push error
      }
      // 发送成功后刷新消息列表
      await loadMessages(activeSessionId.value);
      newMessage.value = '';
      attachments.value = [];
      ElMessage.success('消息发送成功');
    } else {
      ElMessage.error(res.message || '发送失败');
    }
  } catch (error) {
    console.error('发送消息失败', error);
    ElMessage.error('发送失败');
  }
};

// 快捷回复
const insertQuickReply = (text) => {
  if (newMessage.value) {
    newMessage.value += '\n' + text
  } else {
    newMessage.value = text
  }
}

// 插入表情
const insertEmoji = (emoji) => {
  newMessage.value += emoji
  showEmojiPicker.value = false
}

// 刷新消息
const refreshMessages = async () => {
  if (!activeSessionId.value) return
  
  loadingMessages.value = true
  try {
    await loadMessages(activeSessionId.value)
    ElMessage.success('消息已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loadingMessages.value = false
  }
}

// 下载附件
const downloadAttachment = async (file) => {
  try {
    const res = await downloadMessageAttachment(file.id);
    // 创建下载链接
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success(`正在下载${file.name}`);
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败');
  }
}

const attachFile = async () => {
  try {
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.doc,.docx,.pdf,.txt,.xls,.xlsx';
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      for (let file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const res = await uploadMessageFile(formData);
          if (res.code === 200) {
            attachments.value.push(res.data);
            ElMessage.success(`${file.name} 上传成功`);
          }
        } catch (error) {
          console.error('文件上传失败:', error);
          ElMessage.error(`${file.name} 上传失败`);
        }
      }
    };
    
    input.click();
  } catch (error) {
    console.error('附件上传失败:', error);
    ElMessage.error('附件上传失败');
  }
};

const attachImage = async () => {
  try {
    // 创建图片选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      for (let file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const res = await uploadMessageFile(formData);
          if (res.code === 200) {
            attachments.value.push(res.data);
            ElMessage.success(`${file.name} 上传成功`);
          }
        } catch (error) {
          console.error('图片上传失败:', error);
          ElMessage.error(`${file.name} 上传失败`);
        }
      }
    };
    
    input.click();
  } catch (error) {
    console.error('图片上传失败:', error);
    ElMessage.error('图片上传失败');
  }
};

// 格式化消息时间- 更详细的时间显示
const formatMessageTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const target = new Date(date)
  const diff = now - target
  const oneDay = 24 * 60 * 60 * 1000
  
  // 今天
  if (now.toDateString() === target.toDateString()) {
    return target.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  // 昨天
  else if (diff < oneDay * 2 && diff >= oneDay) {
    return '昨天 ' + target.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  // 本周内
  else if (diff < oneDay * 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[target.getDay()] + ' ' + target.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  // 更早
  else {
    return target.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + 
           ' ' + target.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
}

// 是否在两条消息之间显示居中时间分隔（例如相邻消息间隔 >= 5 分钟）
const shouldShowTimeSeparator = (index, message) => {
  try {
    if (!message) return false
    if (index === 0) return true
    const prev = currentMessages.value[index - 1]
    if (!prev || !prev.time) return true
    const tPrev = new Date(prev.time).getTime()
    const tCurr = new Date(message.time).getTime()
    if (isNaN(tPrev) || isNaN(tCurr)) return false
    const diffMinutes = Math.abs(tCurr - tPrev) / 60000
    return diffMinutes >= 5 // 5 分钟阈值，可根据需求调整
  } catch (e) {
    return false
  }
}

onMounted(() => {
  loadAdvisorData();
  // 连接WebSocket，监听实时消息
  setTimeout(() => {
    if (userStore.userInfo?.userId) {
      try {
        // WebSocket 连接逻辑
        const { connect: connectWebSocket, isConnected: wsConnected } = useMessageWebSocket()
        const handleNewMessage = (message) => {
          // 如果是当前会话的消息，直接添加到消息列表
          if (message.sessionId === activeSessionId.value) {
            currentMessages.value.push(message)
          }
          // 刷新会话列表，更新未读消息数
          loadAdvisorData()
        }
        
        connectWebSocket(userStore.userInfo.userId, handleNewMessage);
      } catch (error) {
        console.error('WebSocket 连接失败:', error);
        // 不影响页面主功能，仅提示
        ElMessage.warning('实时消息连接失败，不影响其他功能');
      }
    }
  }, 1000); // 延迟 1 秒连接
});
</script>

<style lang="scss" scoped>
.advisor-interaction-page {
  padding: 0;
}

.interaction-content {
  .el-card {
    border-radius: 18px;
    border: 1px solid var(--apple-slate-border);
    margin-bottom: 1.5rem;
    
    :deep(.el-card__header) {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--apple-slate-border);
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .card-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: var(--apple-ink);
          
          .el-icon {
            margin-right: 0.5rem;
            color: var(--apple-primary);
          }
        }
      }
    }
  }
}

// 导师信息对话框
.advisor-dialog-content {
  .advisor-dialog-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--apple-divider-soft);

    .advisor-dialog-title {
      h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--apple-ink);
      }

      p {
        margin: 0 0 0.25rem 0;
        color: var(--apple-primary);
        font-weight: 600;
        font-size: 0.9rem;
      }

      .advisor-dialog-field {
        margin: 0;
        color: var(--apple-ink-secondary);
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .el-icon {
          color: var(--apple-primary);
          font-size: 16px;
        }
      }
    }
  }

  .advisor-dialog-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .advisor-dialog-bio {
    padding: 1rem;
    background: var(--apple-canvas-parchment);
    border-radius: 11px;

    h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--apple-ink);
    }

    p {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.5;
      color: var(--apple-ink-secondary);
    }
  }
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--apple-canvas-parchment);
  border-radius: 11px;

  .detail-icon {
    color: var(--apple-primary);
    font-size: 16px;
    margin-top: 2px;
  }

  .detail-content {
    flex: 1;

    .detail-label {
      display: block;
      font-size: 0.75rem;
      color: var(--apple-ink-secondary);
      margin-bottom: 2px;
    }

    .detail-value {
      display: block;
      font-size: 0.85rem;
      color: var(--apple-ink);
      word-break: break-all;
    }
  }
}

.sessions-list {
  .session-item {
    display: flex;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    border-bottom: 1px solid var(--apple-divider-soft);
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: var(--apple-canvas-parchment);
    }
    
    &.session-active {
      background-color: var(--apple-success-bg);
    }
    
    .session-avatar {
      margin-right: 12px;
      flex-shrink: 0;
      position: relative;
      
      .el-avatar {
        width: 40px;
        height: 40px;
        border-radius: 11px;
      }
    }
    
    .session-content {
      flex: 1;
      min-width: 0;
      
      .session-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        
        .session-name {
          font-weight: 600;
          color: var(--apple-ink);
          font-size: 17px;
        }
        
        .session-time {
          font-size: 11px;
          color: var(--apple-ink-secondary);
          flex-shrink: 0;
          margin-left: 8px;
        }
      }
      
      .session-preview {
        font-size: 13px;
        color: var(--apple-ink-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
      }
      
      .session-meta {
        position: absolute;
        top: 12px;
        right: 16px;
        
        .el-tag {
          font-size: 10px;
          height: 16px;
          line-height: 16px;
          padding: 0 6px;
          border-radius: 10px;
          background: var(--apple-danger);
          color: white;
          font-weight: 600;
        }
      }
    }
  }
}

.chat-container {
  height: 500px;
  overflow-y: auto;
  padding: 1.25rem;
  background: var(--apple-canvas-parchment);
  border-radius: 18px;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: var(--apple-surface-chip-translucent) var(--apple-canvas-parchment);
  
  .loading-more {
    text-align: center;
    padding: 12px;
    color: var(--apple-ink-secondary);
    font-size: 13px;
  }
  
  .quick-replies {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px;
    background: var(--apple-canvas-parchment);
    border-radius: 18px;
    border: 1px solid var(--apple-slate-border);

    .el-tag {
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-width: 1.5px;

      &:hover {
        border-color: var(--apple-primary);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
  
  .messages-area {
      .time-separator {
        display: inline-block;
        margin: 10px auto;
        padding: 4px 10px;
        background: var(--apple-info-bg);
        color: var(--apple-slate-sub);
        font-size: 12px;
        border-radius: 18px;
        text-align: center;
      }
    .message-item {
        display: flex;
        margin-bottom: 1rem;
        animation: messageSlideIn 0.18s ease-out;
        align-items: flex-end;
        gap: 8px;
      
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      
      &.message-sent {
        flex-direction: row-reverse;

        .message-avatar {
          margin-left: 8px;
          margin-right: 0;
        }

        .message-content {
          align-items: flex-end;
        }

        .message-bubble {
          background: var(--apple-primary);
          color: white;
          border: none;
          position: relative;
          max-width: 80%;
          border-radius: 14px 14px 8px 14px;
          padding: 10px 14px;
          
          &::after {
            content: '';
            position: absolute;
            bottom: 8px;
            right: -8px;
            width: 0;
            height: 0;
            border-left: 8px solid var(--apple-primary);
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
          }
          
          .message-time {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .message-text { font-size: 17px; color: white; }
        }
      }

      &.message-received {
        flex-direction: row;

        .message-avatar {
          margin-right: 8px;
          margin-left: 0;
        }

        .message-content {
          align-items: flex-start;
        }

        .message-bubble {
          background: var(--apple-surface);
          color: var(--apple-ink);
          border: 1px solid var(--apple-hairline);
          position: relative;
          max-width: 80%;
          border-radius: 14px 14px 14px 8px;
          padding: 10px 14px;

          &::after {
            content: '';
            position: absolute;
            left: -8px;
            bottom: 8px;
            width: 0;
            height: 0;
            border-right: 8px solid var(--apple-surface);
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-left: 1px solid var(--apple-hairline);
          }

          .message-text { font-size: 17px; color: var(--apple-ink); }
        }
      }

      .message-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        margin: 0 0.5rem;
        flex-shrink: 0;
        border: 1px solid var(--apple-slate-border);
      }
      
      .message-content {
        display: flex;
        flex-direction: column;
        
        .message-info {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          font-size: 0.7rem;
          color: var(--apple-ink-secondary);
          padding: 0 4px;
          gap: 8px;
          
          .message-sender {
            font-weight: 600;
            color: var(--apple-ink-secondary);
            font-size: 0.75rem;
          }

          /* 隐藏自己发送消息的用户名，WeChat 风格 */
          .message-sent & .message-sender { display: none; }

          .message-time {
            opacity: 0.7;
            color: var(--apple-ink-secondary);
            font-size: 0.65rem;
          }
        }
      }

      .message-bubble {
        padding: 8px 12px;
        border-radius: 18px;
        margin-bottom: 4px;
        transition: all 0.2s ease;
        
        .message-text {
          line-height: 1.4;
          font-size: 15px;
          word-break: break-word;
        }
      }

      .message-attachments {
        margin-top: 8px;
        
        .attachment-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: var(--apple-canvas-parchment);
          border-radius: 11px;
          margin-top: 4px;
          
          .el-icon {
            color: var(--apple-primary);
          }
          
          span {
            flex: 1;
            font-size: 13px;
            color: var(--apple-ink);
            word-break: break-all;
          }
        }
      }
    }
  }
  
  .loading-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
  }
}

.no-session {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.message-input {
  margin-top: 1rem;
  
  .input-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    
    .el-button {
      font-size: 17px;
    }
    
    .toolbar-tip {
      font-size: 12px;
      color: var(--apple-ink-secondary);
      margin-left: auto;
    }
  }
  
  .emoji-picker {
    margin-bottom: 8px;
    padding: 12px;
    background: var(--apple-canvas-parchment);
    border-radius: 11px;
    
    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 8px;
      
      .emoji-item {
        font-size: 20px;
        cursor: pointer;
        text-align: center;
        padding: 4px;
        border-radius: 8px;
        transition: all 0.2s ease;
        
        &:hover {
          background: var(--apple-slate-border);
          transform: scale(1.1);
        }
      }
    }
  }
  
  :deep(.el-textarea__wrapper) {
    border-radius: 11px;
    border: 1px solid var(--apple-slate-border);
    
    &:hover {
      border-color: var(--apple-primary);
    }
    
    &:focus-within {
      border-color: var(--apple-primary);
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }
  }
  
  .input-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    
    .input-info {
      .attachment-count {
        font-size: 12px;
        color: var(--apple-primary);
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
    
    .send-button {
      border-radius: 11px;
      background: var(--apple-primary);
      border-color: var(--apple-primary);
      
      &:hover {
        background: var(--apple-primary);
        border-color: var(--apple-primary);
      }
    }
  }
}

// ── 视觉统一（design-tokens 覆盖层） ────────────────────────
.advisor-interaction-page {
  color: var(--apple-ink);
  font-family: var(--apple-font-text);

  .interaction-content {
    .el-card {
      margin-bottom: var(--apple-spacing-md);
      background: var(--apple-surface);
      border-color: var(--apple-hairline);
      border-radius: var(--apple-rounded-lg);

      :deep(.el-card__header) {
        padding: var(--apple-spacing-sm) var(--apple-spacing-md);
        border-bottom: 1px solid var(--apple-divider-soft);

        .card-header {
          gap: var(--apple-spacing-xs);

          .card-title {
            gap: var(--apple-spacing-xs);
            font-family: var(--apple-font-display);
            font-size: var(--apple-fs-body-strong);
            font-weight: 600;

            .el-icon {
              margin-right: 0;
              color: var(--apple-primary);
            }
          }
        }
      }
    }
  }

  .sessions-list {
    .session-item {
      padding: var(--apple-spacing-sm) var(--apple-spacing-md);
      border-bottom: 1px solid var(--apple-divider-soft);

      &:hover {
        background-color: var(--apple-canvas-parchment);
      }

      &.session-active {
        background-color: var(--apple-info-bg);
      }

      .session-avatar {
        margin-right: var(--apple-spacing-sm);

        .el-avatar {
          border-radius: var(--apple-rounded-md);
        }
      }

      .session-content {
        .session-header {
          margin-bottom: var(--apple-spacing-xxs);

          .session-name {
            font-size: var(--apple-fs-caption);
            color: var(--apple-ink);
          }

          .session-time {
            margin-left: var(--apple-spacing-xs);
            font-size: var(--apple-fs-fine-print);
            color: var(--apple-ink-muted-48);
          }
        }

        .session-preview {
          font-size: var(--apple-fs-fine-print);
          color: var(--apple-ink-muted-48);
        }

        .session-meta {
          top: var(--apple-spacing-sm);
          right: var(--apple-spacing-md);

          .el-tag {
            background: var(--apple-danger);
            color: var(--apple-on-primary);
            font-size: 10px;
          }
        }
      }
    }
  }

  .chat-container {
    padding: var(--apple-spacing-md);
    background: var(--apple-canvas-parchment);
    border-radius: var(--apple-rounded-lg);

    .loading-more {
      padding: var(--apple-spacing-sm);
      font-size: var(--apple-fs-fine-print);
      color: var(--apple-ink-muted-48);
    }

    .quick-replies {
      gap: var(--apple-spacing-xs);
      margin-bottom: var(--apple-spacing-sm);
      padding: var(--apple-spacing-sm);
      background: var(--apple-surface);
      border: 1px solid var(--apple-hairline);
      border-radius: var(--apple-rounded-lg);
    }

    .messages-area {
      .time-separator {
        margin: var(--apple-spacing-xs) auto;
        padding: 4px 10px;
        background: var(--apple-surface);
        color: var(--apple-ink-muted-48);
        font-size: var(--apple-fs-fine-print);
        border-radius: var(--apple-rounded-pill);
      }

      .message-item {
        gap: var(--apple-spacing-xs);
        margin-bottom: var(--apple-spacing-sm);

        .message-avatar {
          border-color: var(--apple-hairline);
        }

        .message-content {
          .message-info {
            gap: var(--apple-spacing-xs);
            margin-bottom: var(--apple-spacing-xxs);
            font-size: var(--apple-fs-fine-print);
            color: var(--apple-ink-muted-48);

            .message-sender,
            .message-time {
              font-size: var(--apple-fs-fine-print);
              color: var(--apple-ink-muted-48);
            }
          }
        }

        .message-bubble {
          padding: 9px 13px;
          border-radius: var(--apple-rounded-md);

          .message-text {
            font-size: var(--apple-fs-caption);
            line-height: 1.5;
          }
        }

        &.message-sent {
          .message-bubble {
            background: var(--apple-primary);
            color: var(--apple-on-primary);

            .message-text {
              color: var(--apple-on-primary);
            }

            .message-time {
              color: rgba(255, 255, 255, 0.7);
            }

            &::after {
              border-left-color: var(--apple-primary);
            }
          }
        }

        &.message-received {
          .message-bubble {
            background: var(--apple-surface);
            border: 1px solid var(--apple-hairline);

            .message-text {
              color: var(--apple-ink);
            }

            &::after {
              border-right-color: var(--apple-surface);
            }
          }
        }

        .message-attachments {
          .attachment-item {
            gap: var(--apple-spacing-xs);
            padding: var(--apple-spacing-xs);
            background: var(--apple-canvas-parchment);
            border-radius: var(--apple-rounded-sm);

            span {
              font-size: var(--apple-fs-fine-print);
              color: var(--apple-ink);
            }
          }
        }
      }
    }

    .loading-mask {
      border-radius: var(--apple-rounded-lg);
    }
  }

  .message-input {
    margin-top: var(--apple-spacing-sm);

    .input-toolbar {
      gap: var(--apple-spacing-sm);
      margin-bottom: var(--apple-spacing-xs);

      .el-button {
        font-size: var(--apple-fs-caption);
      }

      .toolbar-tip {
        margin-left: auto;
        font-size: var(--apple-fs-fine-print);
        color: var(--apple-ink-muted-48);
      }
    }

    .emoji-picker {
      padding: var(--apple-spacing-sm);
      margin-bottom: var(--apple-spacing-xs);
      background: var(--apple-canvas-parchment);
      border-radius: var(--apple-rounded-md);

      .emoji-grid {
        gap: var(--apple-spacing-xs);

        .emoji-item {
          padding: var(--apple-spacing-xxs);
          border-radius: var(--apple-rounded-sm);
        }
      }
    }

    :deep(.el-textarea__wrapper) {
      border-color: var(--apple-hairline);
      border-radius: var(--apple-rounded-md);
    }

    .input-actions {
      margin-top: var(--apple-spacing-xs);

      .input-info {
        .attachment-count {
          gap: var(--apple-spacing-xxs);
          font-size: var(--apple-fs-fine-print);
          color: var(--apple-primary);
        }
      }

      .send-button {
        background: var(--apple-primary);
        border-color: var(--apple-primary);
        border-radius: var(--apple-rounded-pill);
      }
    }
  }
}

// 导师信息对话框（弹窗内样式）
.advisor-dialog-content {
  .advisor-dialog-header {
    gap: var(--apple-spacing-md);
    margin-bottom: var(--apple-spacing-md);
    padding-bottom: var(--apple-spacing-md);
    border-bottom: 1px solid var(--apple-divider-soft);

    .advisor-dialog-title {
      h3 {
        margin: 0 0 var(--apple-spacing-xxs);
        font-family: var(--apple-font-display);
        font-size: var(--apple-fs-tagline);
        font-weight: 600;
        color: var(--apple-ink);
      }

      p {
        margin: 0 0 var(--apple-spacing-xxs);
        font-size: var(--apple-fs-caption);
        font-weight: 600;
        color: var(--apple-primary);
      }

      .advisor-dialog-field {
        gap: var(--apple-spacing-xs);
        font-size: var(--apple-fs-fine-print);
        color: var(--apple-ink-muted-48);

        .el-icon {
          font-size: var(--apple-fs-caption);
          color: var(--apple-primary);
        }
      }
    }
  }

  .advisor-dialog-grid {
    gap: var(--apple-spacing-sm);
    margin-bottom: var(--apple-spacing-md);
  }

  .advisor-dialog-bio {
    padding: var(--apple-spacing-md);
    background: var(--apple-canvas-parchment);
    border-radius: var(--apple-rounded-md);

    h4 {
      margin: 0 0 var(--apple-spacing-xs);
      font-size: var(--apple-fs-caption);
      font-weight: 600;
      color: var(--apple-ink);
    }

    p {
      font-size: var(--apple-fs-caption);
      line-height: 1.5;
      color: var(--apple-ink-muted-48);
    }
  }
}

.detail-item {
  gap: var(--apple-spacing-sm);
  padding: var(--apple-spacing-sm);
  background: var(--apple-canvas-parchment);
  border-radius: var(--apple-rounded-md);

  .detail-icon {
    font-size: var(--apple-fs-caption);
  }

  .detail-content {
    .detail-label {
      margin-bottom: var(--apple-spacing-xxs);
      font-size: var(--apple-fs-fine-print);
      color: var(--apple-ink-muted-48);
    }

    .detail-value {
      font-size: var(--apple-fs-caption);
      color: var(--apple-ink);
    }
  }
}
</style>
