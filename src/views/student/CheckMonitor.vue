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
            v-for="stage in checkStages"
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
          <div class="estimate-label">已用时间</div>
          <div class="estimate-value">{{ elapsedTime }}</div>
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
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
  overallProgress: 0,
  stageProgress: 0,
  elapsedTime: 0, // 秒
  estimatedRemainingTime: 0, // 秒
  stages: {
    upload: { status: 'completed', duration: 120 },
    internal_check: { status: 'processing', progress: 0, duration: 0 },
    third_party_check: { status: 'pending' },
    report_generation: { status: 'pending' }
  }
})

const logs = ref([])

const showCompletionDialog = ref(false)
const finalSimilarity = ref(0)
const logContainer = ref(null)

// 使用实时推送 Hook
const { connect, disconnect, progress: checkProgress, isConnected } = useCheckProgress();

// 根据后端status映射阶段状态: 0-待执行 1-执行中 2-执行成功 3-执行失败
const mapCheckStatusToStages = (checkStatus) => {
  if (checkStatus === '0') return [
    { key: 'upload', name: '文件上传', status: 'pending', progress: 0 },
    { key: 'check', name: '论文查重', status: 'pending', progress: 0 },
    { key: 'report', name: '报告生成', status: 'pending', progress: 0 }
  ]
  if (checkStatus === '1') return [
    { key: 'upload', name: '文件上传', status: 'completed', progress: 100 },
    { key: 'check', name: '论文查重', status: 'processing', progress: 0 },
    { key: 'report', name: '报告生成', status: 'pending', progress: 0 }
  ]
  if (checkStatus === '2') return [
    { key: 'upload', name: '文件上传', status: 'completed', progress: 100 },
    { key: 'check', name: '论文查重', status: 'completed', progress: 100 },
    { key: 'report', name: '报告生成', status: 'completed', progress: 100 }
  ]
  return [
    { key: 'upload', name: '文件上传', status: 'failed', progress: 0 },
    { key: 'check', name: '论文查重', status: 'failed', progress: 0 },
    { key: 'report', name: '报告生成', status: 'failed', progress: 0 }
  ]
}

const checkStages = ref(mapCheckStatusToStages('0'))

const completedStages = computed(() => {
  return checkStages.value.filter(stage => stage.status === 'completed').length
})

const totalStages = computed(() => {
  return checkStages.value.length
})

const elapsedTime = computed(() => {
  const start = currentStatus.value.startTime
  if (!start) return '--'
  const diff = Date.now() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '小于1分钟'
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainMin = minutes % 60
  return `${hours}小时${remainMin}分钟`
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
    ...data,
    status: data.checkStatus || data.status || currentStatus.value.status
  }

  // 根据后端checkStatus更新阶段状态
  if (data.checkStatus) {
    checkStages.value = mapCheckStatusToStages(data.checkStatus)
  } else if (data.stages) {
    checkStages.value = checkStages.value.map(stage => ({
      ...stage,
      ...data.stages[stage.key]
    }))
  }

  // 更新WebSocket实时进度（处理中时）
  if (data.checkStatus === '1' && data.checkRate != null) {
    const progress = Math.min(data.checkRate * 3, 99) // 将查重率映射为进度
    const checkStage = checkStages.value.find(s => s.key === 'check')
    if (checkStage) checkStage.progress = progress
  }

  // 添加日志
  if (data.logs) {
    logs.value = [...logs.value, ...data.logs]
    scrollToBottom()
  }

  // 检查是否完成（checkStatus=2 表示成功）
  if (data.checkStatus === '2' || data.status === 'completed') {
    finalSimilarity.value = data.checkRate || 0
    showCompletionDialog.value = true
  }
}

const updateStatusFromHook = (progressData) => {
  const statusMap = {
    'STARTED': 'processing',
    'PROCESSING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed'
  }

  currentStatus.value = {
    ...currentStatus.value,
    status: statusMap[progressData.stage] || 'processing',
    overallProgress: progressData.percent,
    estimatedRemainingTime: progressData.estimatedRemainingSeconds
  }

  // 根据WebSocket数据更新阶段进度
  checkStages.value = mapCheckStatusToStages(progressData.stage === 'COMPLETED' ? '2' : '1')
  const checkStage = checkStages.value.find(s => s.key === 'check')
  if (checkStage && progressData.percent != null) {
    checkStage.progress = progressData.percent
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
    'pending': '#86868b',
    'processing': '#0066cc',
    'completed': '#67c23a',
    'failed': '#f56c6c',
    'cancelled': '#e6a23c'
  }
  return colors[status] || '#86868b'
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
  const paperId = route.query.paperId || route.params.taskId;
  
  // 使用新的 Hook 连接
  connect(paperId, (data) => {
    // 处理收到的消息
    if (data.type === 'START') {
      addLog('info', data.message || '查重任务已启动');
      currentStatus.value.overallProgress = data.progress || 0;
    } else if (data.type === 'PROGRESS') {
      addLog('info', data.message || '查重进度更新');
      currentStatus.value.overallProgress = data.progress || 0;
      currentStatus.value.elapsedTime = Math.floor((Date.now() - new Date().getTime()) / 1000);
    } else if (data.type === 'COMPLETE') {
      addLog('success', data.message || '查重完成');
      currentStatus.value.overallProgress = 100;
      currentStatus.value.status = 'completed';
      finalSimilarity.value = data.similarity || 0;
      showCompletionDialog.value = true;
    } else if (data.type === 'ERROR') {
      addLog('error', data.message || '查重失败');
      currentStatus.value.status = 'failed';
    }
  });
  
  // 监听进度变化
  watch(() => checkProgress.percent, (newPercent) => {
    if (newPercent !== undefined) {
      currentStatus.value.overallProgress = newPercent;
    }
  });
  
  watch(() => checkProgress.status, (newStatus) => {
    if (newStatus === 'success') {
      addLog('success', '查重完成！');
      finalSimilarity.value = checkProgress.similarity || 0;
      showCompletionDialog.value = true;
    } else if (newStatus === 'exception') {
      addLog('error', checkProgress.message || '查重失败');
      currentStatus.value.status = 'failed';
    }
  });
};

const disconnectWebSocket = () => {
  disconnect();
};

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
  background-color: #f5f5f7;
  min-height: 100vh;

  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #1d1d1f;
    }
  }

  .status-card {
    margin-bottom: 20px;
    border-radius: 18px;
    
    .current-status {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .status-icon {
        padding: 16px;
        background: #0066cc;
        border-radius: 18px;
        color: white;
      }
      
      .status-content {
        flex: 1;
        
        .status-message {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .status-details {
          display: flex;
          gap: 24px;
          color: #86868b;
          font-size: 17px;
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
    border-radius: 18px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #1d1d1f;
      
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
              background: #0066cc;
              color: white;
              animation: pulse 2s infinite;
            }
          }
          
          &.pending {
            .stage-icon {
              background: #e4e7ed;
              color: #86868b;
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
              color: #86868b;
              margin-bottom: 4px;
            }
            
            .stage-progress, .stage-duration {
              font-size: 11px;
              font-weight: 600;
              color: #0066cc;
            }
          }
        }
      }
    }
  }

  .log-card {
    margin-bottom: 20px;
    border-radius: 18px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #1d1d1f;
      
      .el-button {
        margin-left: auto;
        color: #86868b;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
    
    .log-container {
      max-height: 300px;
      overflow-y: auto;
      background: #f5f5f7;
      border-radius: 11px;
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
          color: #0066cc;
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
          font-size: 17px;
          line-height: 1.4;
        }
      }
      
      .no-logs {
        text-align: center;
        padding: 40px 0;
        color: #86868b;
        
        .el-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
      }
    }
  }

  .estimate-card {
    border-radius: 18px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #1d1d1f;
    }
    
    .estimate-content {
      display: flex;
      justify-content: space-around;
      
      .estimate-item {
        text-align: center;
        
        .estimate-label {
          font-size: 17px;
          color: #86868b;
          margin-bottom: 8px;
        }
        
        .estimate-value {
          font-size: 18px;
          font-weight: 600;
          color: #0066cc;
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
      color: #86868b;
      
      strong {
        color: #1d1d1f;
        font-size: 18px;
      }
    }
  }
}

// 动画
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 102, 204, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(0, 102, 204, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 102, 204, 0);
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