<template>
  <div class="check-monitor-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-title">查重进度监控</span>
        </template>
      </el-page-header>
    </div>

    <!-- 当前状态显示 -->
    <el-card class="status-card" shadow="never">
      <div class="current-status">
        <div class="status-icon">
          <el-icon size="32" :color="getStatusColor(currentStatus.status)">
            <component :is="getStatusIcon(currentStatus.status)" />
          </el-icon>
        </div>
        <div class="status-content">
          <h2 class="status-message">{{ getStatusMessage(currentStatus.status) }}</h2>
          <div class="status-details">
            <span v-if="currentStatus.estimatedRemainingTime">
              预计完成时间: {{ formatEstimatedTime(currentStatus.estimatedRemainingTime) }}
            </span>
            <span>已用时: {{ formatDuration(currentStatus.elapsedTime || 0) }}</span>
          </div>
        </div>
        <div class="refresh-button">
          <el-button :icon="Refresh" circle @click="refreshStatus" />
        </div>
      </div>
    </el-card>

    <!-- 整体进度 -->
    <el-card class="progress-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><DataLine /></el-icon>
          <span>整体进度</span>
          <el-tag :type="getProgressTagType(currentStatus.overallProgress)">
            {{ currentStatus.overallProgress }}%
          </el-tag>
        </div>
      </template>
      
      <div class="overall-progress">
        <el-progress
          :percentage="currentStatus.overallProgress"
          :stroke-width="16"
          :color="getProgressColor"
          striped
          striped-flow
        />
        <div class="progress-stages">
          <div 
            v-for="(stage, index) in checkStages" 
            :key="stage.key"
            class="stage-item"
            :class="{
              'completed': stage.status === 'completed',
              'current': stage.key === currentStatus.currentStage,
              'pending': stage.status === 'pending'
            }"
          >
            <div class="stage-icon">
              <el-icon v-if="stage.status === 'completed'"><Check /></el-icon>
              <el-icon v-else-if="stage.key === currentStatus.currentStage"><Loading /></el-icon>
              <el-icon v-else><Clock /></el-icon>
            </div>
            <div class="stage-info">
              <div class="stage-name">{{ stage.name }}</div>
              <div v-if="stage.status === 'processing'" class="stage-progress">
                {{ stage.progress }}%
              </div>
              <div v-else-if="stage.duration" class="stage-duration">
                {{ formatDuration(stage.duration) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 实时日志 -->
    <el-card class="log-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Tickets /></el-icon>
          <span>实时日志</span>
          <el-button text @click="clearLogs">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
      </template>
      
      <div class="log-container" ref="logContainer">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
          :class="`log-${log.level}`"
        >
          <div class="log-time">[{{ log.time }}]</div>
          <div class="log-content">{{ log.message }}</div>
        </div>
        <div v-if="logs.length === 0" class="no-logs">
          <el-icon><InfoFilled /></el-icon>
          <span>暂无日志信息</span>
        </div>
      </div>
    </el-card>

    <!-- 预估完成卡片 -->
    <el-card class="estimate-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Timer /></el-icon>
          <span>进度预估</span>
        </div>
      </template>
      
      <div class="estimate-content">
        <div class="estimate-item">
          <div class="estimate-label">已完成阶段</div>
          <div class="estimate-value">{{ completedStages }}/{{ totalStages }}</div>
        </div>
        <div class="estimate-item">
          <div class="estimate-label">平均处理速度</div>
          <div class="estimate-value">{{ averageSpeed }}篇/分钟</div>
        </div>
        <div class="estimate-item">
          <div class="estimate-label">预计剩余时间</div>
          <div class="estimate-value">{{ formatEstimatedTime(currentStatus.estimatedRemainingTime) }}</div>
        </div>
      </div>
    </el-card>

    <!-- 完成提示 -->
    <el-dialog
      v-model="showCompletionDialog"
      title="查重完成"
      width="400px"
      :show-close="false"
    >
      <div class="completion-content">
        <div class="completion-icon">
          <el-icon color="#67c23a" size="48"><SuccessFilled /></el-icon>
        </div>
        <p>论文查重检测已完成！</p>
        <p>总体相似度: <strong>{{ finalSimilarity }}%</strong></p>
      </div>
      <template #footer>
        <el-button @click="viewReport">查看报告</el-button>
        <el-button type="primary" @click="closeCompletionDialog">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Refresh, DataLine, Tickets, Delete, InfoFilled, SuccessFilled,
  Check, Loading, Clock, Document, Files, Connection, DocumentChecked
} from '@element-plus/icons-vue'
import { getCheckStatus } from '@/api/student'
import { useCheckProgress } from '@/composables/useCheckProgress'

const route = useRoute()
const router = useRouter()

// 响应式数据
const currentStatus = ref({
  status: 'processing',
  currentStage: 'internal_check',
  overallProgress: 45,
  stageProgress: 65,
  elapsedTime: 1680, // 秒
  estimatedRemainingTime: 1800, // 秒
  stages: {
    upload: { status: 'completed', duration: 120 },
    internal_check: { status: 'processing', progress: 65, duration: 900 },
    third_party_check: { status: 'pending' },
    report_generation: { status: 'pending' }
  }
})

const logs = ref([
  { time: '15:42:30', message: '开始校内查重检测', level: 'info' },
  { time: '15:43:15', message: '已比对文献库中 1,250 篇论文', level: 'info' },
  { time: '15:44:02', message: '发现 8 篇高相似度文献', level: 'warning' },
  { time: '15:45:20', message: '正在进行详细段落比对...', level: 'info' }
])

const showCompletionDialog = ref(false)
const finalSimilarity = ref(23.5)
const logContainer = ref(null)

// WebSocket（STOMP）
const { connect: wsConnect, disconnect: wsDisconnect, isConnected: wsConnected } = useCheckProgress()

// 计算属性
const checkStages = ref([
  { key: 'upload', name: '文件上传', status: 'completed', progress: 100, duration: 120 },
  { key: 'internal_check', name: '校内查重', status: 'processing', progress: 65, duration: 900 },
  { key: 'third_party_check', name: '第三方查重', status: 'pending', progress: 0 },
  { key: 'report_generation', name: '报告生成', status: 'pending', progress: 0 }
])

const completedStages = computed(() => {
  return checkStages.value.filter(stage => stage.status === 'completed').length
})

const totalStages = computed(() => {
  return checkStages.value.length
})

const averageSpeed = computed(() => {
  const completedDocs = 1 // 假设处理了1篇文档
  const totalTime = currentStatus.value.elapsedTime / 60 // 转换为分钟
  return totalTime > 0 ? (completedDocs / totalTime).toFixed(2) : '0.00'
})

const getProgressColor = computed(() => {
  const progress = currentStatus.value.overallProgress
  if (progress < 30) return '#67c23a'
  if (progress < 70) return '#e6a23c'
  return '#f56c6c'
})

// 方法
const goBack = () => {
  router.back()
}

const refreshStatus = async () => {
  try {
    const res = await getCheckStatus(route.params.taskId)
    if (res.code === 200) {
      updateStatus(res.data)
      ElMessage.success('状态已刷新')
    }
  } catch (error) {
    ElMessage.error('刷新失败: ' + error.message)
  }
}

const updateStatus = (data) => {
  currentStatus.value = {
    ...currentStatus.value,
    ...data
  }
  
  // 更新阶段状态
  checkStages.value = checkStages.value.map(stage => ({
    ...stage,
    ...data.stages[stage.key]
  }))
  
  // 添加日志
  if (data.logs) {
    logs.value = [...logs.value, ...data.logs]
    scrollToBottom()
  }
  
  // 检查是否完成
  if (data.status === 'completed') {
    finalSimilarity.value = data.finalSimilarity || 23.5
    showCompletionDialog.value = true
  }
}

const getStatusMessage = (status) => {
  const messages = {
    'pending': '准备开始查重检测...',
    'processing': '正在进行查重检测...',
    'completed': '查重检测已完成',
    'failed': '查重检测失败',
    'cancelled': '查重检测已取消'
  }
  return messages[status] || '未知状态'
}

const getStatusColor = (status) => {
  const colors = {
    'pending': '#909399',
    'processing': '#409eff',
    'completed': '#67c23a',
    'failed': '#f56c6c',
    'cancelled': '#e6a23c'
  }
  return colors[status] || '#909399'
}

const getStatusIcon = (status) => {
  const icons = {
    'pending': 'Clock',
    'processing': 'Loading',
    'completed': 'SuccessFilled',
    'failed': 'CircleClose',
    'cancelled': 'Warning'
  }
  return icons[status] || 'Info'
}

const getProgressTagType = (progress) => {
  if (progress < 30) return 'success'
  if (progress < 70) return 'warning'
  return 'danger'
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟${secs}秒`
}

const formatEstimatedTime = (seconds) => {
  if (!seconds) return '计算中...'
  const now = new Date()
  const finishTime = new Date(now.getTime() + seconds * 1000)
  return finishTime.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const clearLogs = () => {
  logs.value = []
}

const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const viewReport = () => {
  router.push(`/student/plagiarism-report/${route.params.paperId}`)
}

const closeCompletionDialog = () => {
  showCompletionDialog.value = false
}

const connectWebSocket = () => {
  const paperId = route.query.paperId || route.params.taskId
  wsConnect(
    paperId,
    (data) => {
      if (data.type === 'status_update') {
        updateStatus(data.data)
        addLog('info', data.data.message || '状态更新')
      }
    },
    (err) => {
      console.error('WebSocket连接失败，降级到轮询:', err)
      addLog('warning', 'WebSocket连接失败，切换为轮询模式')
      startPolling()
    }
  )
}

const disconnectWebSocket = () => {
  wsDisconnect()
}

const pollingTimer = ref(null)
const startPolling = () => {
  pollingTimer.value = setInterval(async () => {
    try {
      const res = await getCheckStatus(route.params.taskId)
      if (res.code === 200) {
        updateStatus(res.data)
      }
    } catch (error) {
      console.error('轮询状态失败:', error)
    }
  }, 5000) // 每5秒轮询一次
}

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

const addLog = (level, message) => {
  const now = new Date()
  const time = now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  logs.value.push({
    time,
    message,
    level
  })
  
  scrollToBottom()
}

// 生命周期
onMounted(() => {
  // 参数校验
  if (!route.params.taskId || route.params.taskId === 'undefined') {
    ElMessage.error('缺少任务ID参数');
    router.back();
    return;
  }
  
  connectWebSocket();
  // 添加初始日志
  addLog('info', '连接到查重服务...');
})

onUnmounted(() => {
  disconnectWebSocket()
  stopPolling()
})

</script>

<style lang="scss" scoped>
.check-monitor-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .status-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .current-status {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .status-icon {
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        color: white;
      }
      
      .status-content {
        flex: 1;
        
        .status-message {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
        
        .status-details {
          display: flex;
          gap: 24px;
          color: #606266;
          font-size: 14px;
        }
      }
      
      .refresh-button {
        .el-button {
          border: 1px solid #dcdfe6;
        }
      }
    }
  }

  .progress-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
      
      .el-tag {
        margin-left: auto;
      }
    }
    
    .overall-progress {
      .progress-stages {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 40px;
          right: 40px;
          height: 2px;
          background: #e4e7ed;
          z-index: 1;
        }
        
        .stage-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
          width: 80px;
          
          &.completed {
            .stage-icon {
              background: #67c23a;
              color: white;
            }
          }
          
          &.current {
            .stage-icon {
              background: #409eff;
              color: white;
              animation: pulse 2s infinite;
            }
          }
          
          &.pending {
            .stage-icon {
              background: #e4e7ed;
              color: #909399;
            }
          }
          
          .stage-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            transition: all 0.3s ease;
          }
          
          .stage-info {
            text-align: center;
            
            .stage-name {
              font-size: 12px;
              color: #606266;
              margin-bottom: 4px;
            }
            
            .stage-progress, .stage-duration {
              font-size: 11px;
              font-weight: 500;
              color: #409eff;
            }
          }
        }
      }
    }
  }

  .log-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
      
      .el-button {
        margin-left: auto;
        color: #909399;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
    
    .log-container {
      max-height: 300px;
      overflow-y: auto;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      
      .log-item {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #e4e7ed;
        
        &:last-child {
          border-bottom: none;
        }
        
        &.log-info {
          color: #409eff;
        }
        
        &.log-warning {
          color: #e6a23c;
        }
        
        &.log-error {
          color: #f56c6c;
        }
        
        &.log-success {
          color: #67c23a;
        }
        
        .log-time {
          font-family: monospace;
          font-size: 12px;
          min-width: 80px;
        }
        
        .log-content {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }
      }
      
      .no-logs {
        text-align: center;
        padding: 40px 0;
        color: #909399;
        
        .el-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
      }
    }
  }

  .estimate-card {
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
    }
    
    .estimate-content {
      display: flex;
      justify-content: space-around;
      
      .estimate-item {
        text-align: center;
        
        .estimate-label {
          font-size: 14px;
          color: #606266;
          margin-bottom: 8px;
        }
        
        .estimate-value {
          font-size: 18px;
          font-weight: 700;
          color: #667eea;
        }
      }
    }
  }

  .completion-content {
    text-align: center;
    padding: 20px 0;
    
    .completion-icon {
      margin-bottom: 16px;
    }
    
    p {
      margin: 8px 0;
      color: #606266;
      
      strong {
        color: #303133;
        font-size: 18px;
      }
    }
  }
}

// 动画
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .check-monitor-page {
    padding: 12px;
    
    .current-status {
      flex-direction: column;
      text-align: center;
      gap: 16px;
      
      .status-content {
        .status-details {
          flex-direction: column;
          gap: 8px;
        }
      }
    }
    
    .progress-stages {
      flex-direction: column;
      gap: 20px;
      
      &::before {
        display: none;
      }
      
      .stage-item {
        flex-direction: row;
        width: 100%;
        gap: 12px;
        
        .stage-info {
          text-align: left;
        }
      }
    }
    
    .estimate-content {
      flex-direction: column;
      gap: 20px;
    }
  }
}
</style>
