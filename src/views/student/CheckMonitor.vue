<template>
  <div class="check-monitor-page">
    <!-- 页面头部 -->
    <PageHeader>
      <template #actions>
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
      </template>
    </PageHeader>

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
          <el-icon color="var(--apple-success)" size="48"><SuccessFilled /></el-icon>
        </div>
        <p>论文查重检测已完成！</p>
        <p>总相似比: <strong>{{ finalSimilarity }}%</strong></p>
        <!-- P5 新指标：存量任务为 null，显示「—」不按 0 处理 -->
        <p>单篇最大: <strong>{{ maxPerSource != null ? maxPerSource + '%' : '—' }}</strong></p>
        <p>引用率: <strong>{{ citationRate != null ? citationRate + '%' : '—' }}</strong></p>
      </div>
      <template #footer>
        <el-button v-if="taskId" type="primary" plain @click="viewSentenceDetail">查看检测明细</el-button>
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
  Check, Loading, Clock, Document, Files, Connection, DocumentChecked, ArrowLeft,
  CircleClose, Warning
} from '@element-plus/icons-vue'
// 注意：后端没有 /api/student/check-tasks/status 这个接口，
// 任务状态要用 taskDetail（按 paperId 查），它同时带回推送订阅需要的 taskId
import { getCheckTaskDetail } from '@/api/student'
import { useCheckProgress } from '@/composables/useCheckProgress'
import PageHeader from '@/components/common/PageHeader.vue'

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
// P5 新指标与句级明细入口所需的 taskId（任务详情接口带回，字符串）
const taskId = ref(null)
const maxPerSource = ref(null)
const citationRate = ref(null)
const logContainer = ref(null)

// 使用实时推送 Hook
const { connect, disconnect } = useCheckProgress();

// 根据后端status映射阶段状态。
// 后端 CheckTask.status 实际是字符串码（pending/checking/completed/failure/cancelled，
// 见 CheckTaskStatusEnum），老代码只比数字码 '0'/'1'/'2' 所以永远匹配不上，
// 这里两种写法都认。
const mapCheckStatusToStages = (checkStatus) => {
  const code = String(checkStatus ?? '').toLowerCase()
  if (code === '0' || code === 'pending') return [
    { key: 'upload', name: '文件上传', status: 'pending', progress: 0 },
    { key: 'check', name: '论文查重', status: 'pending', progress: 0 },
    { key: 'report', name: '报告生成', status: 'pending', progress: 0 }
  ]
  if (code === '1' || code === 'checking') return [
    { key: 'upload', name: '文件上传', status: 'completed', progress: 100 },
    { key: 'check', name: '论文查重', status: 'processing', progress: 0 },
    { key: 'report', name: '报告生成', status: 'pending', progress: 0 }
  ]
  if (code === '2' || code === 'completed') return [
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
  if (progress < 30) return '#34c759'
  if (progress < 70) return '#ff9500'
  return '#ff3b30'
})

// 方法
const goBack = () => {
  router.back()
}

const refreshStatus = async () => {
  try {
    const res = await getCheckTaskDetail(route.params.paperId)
    if (res.code === 200) {
      updateStatus(res.data)
      ElMessage.success('状态已刷新')
    }
  } catch (error) {
    ElMessage.error('刷新失败: ' + error.message)
  }
}

/**
 * 用任务详情刷新页面状态
 * @param {object} data 后端返回的任务详情
 * @param {{announce?: boolean}} [options] announce=true 时才弹"查重完成"对话框（仅实时推送用）
 */
const updateStatus = (data, { announce = false } = {}) => {
  currentStatus.value = {
    ...currentStatus.value,
    ...data,
    status: data.checkStatus || data.status || currentStatus.value.status
  }

  // 任务详情带回 taskId（字符串雪花 ID）与 P5 新指标
  if (data.taskId) {
    taskId.value = data.taskId
  }
  if ('maxPerSource' in data) {
    maxPerSource.value = data.maxPerSource
  }
  if ('citationRate' in data) {
    citationRate.value = data.citationRate
  }

  // 记录首次拿到状态的时刻，供"已用时"计算。
  // 原先 updateStatus 从不写 startTime，而 elapsedTime 的计算恰恰依赖它。
  if (!currentStatus.value.startTime) {
    currentStatus.value.startTime = new Date().toISOString()
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
  if ((data.checkStatus === '1' || data.checkStatus === 'checking') && data.checkRate != null) {
    const progress = Math.min(data.checkRate * 3, 99) // 将查重率映射为进度
    const checkStage = checkStages.value.find(s => s.key === 'check')
    if (checkStage) checkStage.progress = progress
  }

  // 添加日志
  if (data.logs) {
    logs.value = [...logs.value, ...data.logs]
    scrollToBottom()
  }

  // 是否已完成（后端返回字符串码 completed，老代码只比数字码 '2'）。
  // 只有实时推送到达的完成事件才弹完成框（announce=true）：进页面时拉详情、
  // 手动刷新、轮询拿到的 completed 只是把状态如实显示出来，不该凭空弹模态框打断用户。
  const completed =
    data.checkStatus === '2' || data.checkStatus === 'completed' || data.status === 'completed'
  if (completed) {
    finalSimilarity.value = data.checkRate || 0
    if (announce) announceCompletion()
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
    'completed': '#34c759',
    'failed': '#ff3b30',
    'cancelled': '#ff9500'
  }
  return colors[status] || '#86868b'
}

const getStatusIcon = (status) => {
  // 值为组件对象（非字符串名）：全局图标注册已移除，字符串无法解析
  const icons = {
    'pending': Clock,
    'processing': Loading,
    'completed': SuccessFilled,
    'failed': CircleClose,
    'cancelled': Warning
  }
  return icons[status] || InfoFilled
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

// 查看句级检测明细（P5 新页，taskId 按字符串传递防雪花 ID 精度丢失）
const viewSentenceDetail = () => {
  if (!taskId.value) return
  showCompletionDialog.value = false
  router.push(`/student/sentence-detail/${taskId.value}`)
}

const closeCompletionDialog = () => {
  showCompletionDialog.value = false
}

/** 弹"查重完成"框，每次进入页面最多一次（推送重复到达或重连补推都不会连弹） */
let completionNotified = false
const announceCompletion = () => {
  if (completionNotified) return
  completionNotified = true
  showCompletionDialog.value = true
}

const connectWebSocket = (taskId) => {
  if (!taskId) {
    console.warn('[CheckMonitor] 未取到 taskId，跳过实时进度订阅');
    return;
  }

  // 订阅主题是 /topic/check-progress/{taskId}，传 paperId 会永远收不到消息
  connect(taskId, (data) => {
    // data.type 已由 useCheckProgress 归一化为 progress | complete | error
    if (data.type === 'progress') {
      addLog('info', data.message || '查重进度更新');
      currentStatus.value.overallProgress = data.progress || 0;
      // 已用时按任务开始时刻计算。原先写的是 Date.now() - new Date().getTime()，恒等于 0。
      const startedAt = currentStatus.value.startTime;
      if (startedAt) {
        currentStatus.value.elapsedTime = Math.floor(
          (Date.now() - new Date(startedAt).getTime()) / 1000
        );
      }
    } else if (data.type === 'complete') {
      addLog('success', data.message || '查重完成');
      currentStatus.value.overallProgress = 100;
      currentStatus.value.status = 'completed';
      // 推送事件里不带完整数据，完成后再查一次任务详情
      getCheckTaskDetail(route.params.paperId)
        .then((res) => {
          if (res.code === 200 && res.data) {
            if (res.data.checkRate != null) {
              finalSimilarity.value = res.data.checkRate;
              currentStatus.value.checkRate = res.data.checkRate;
            }
            if (res.data.taskId) {
              taskId.value = res.data.taskId;
            }
            if ('maxPerSource' in res.data) {
              maxPerSource.value = res.data.maxPerSource;
            }
            if ('citationRate' in res.data) {
              citationRate.value = res.data.citationRate;
            }
          }
        })
        .catch(() => {});
      announceCompletion();
    } else if (data.type === 'error') {
      addLog('error', data.message || '查重失败');
      currentStatus.value.status = 'failed';
    }
  });
  // 注：这里原先还挂了两个 watch 监听 hook 的 checkProgress.percent/status，
  // 但上面的回调已经处理了同样的事，结果每帧完成事件都会写两条日志、并重复弹框。
  // 现在只保留回调这一条路径。
};

const disconnectWebSocket = () => {
  disconnect();
};

const pollingTimer = ref(null)
const startPolling = () => {
  pollingTimer.value = setInterval(async () => {
    try {
      const res = await getCheckTaskDetail(route.params.paperId)
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
onMounted(async () => {
  // 参数校验：路由定义是 /student/check-monitor/:paperId，参数名是 paperId
  // （老代码校验的是 route.params.taskId，恒为 undefined，页面一进就退出）
  const paperId = route.params.paperId;
  if (!paperId || paperId === 'undefined') {
    ElMessage.error('缺少论文ID参数');
    router.back();
    return;
  }

  addLog('info', '连接到查重服务...');

  // 先取一次任务详情：既作为初始状态，也拿到推送订阅需要的 taskId
  try {
    const res = await getCheckTaskDetail(paperId);
    if (res.code === 200 && res.data) {
      updateStatus(res.data);
      connectWebSocket(res.data.taskId);
    } else {
      console.warn('[CheckMonitor] 获取查重任务详情失败:', res?.message);
    }
  } catch (error) {
    console.error('[CheckMonitor] 获取查重任务详情异常:', error);
  }
})

onUnmounted(() => {
  disconnectWebSocket()
  stopPolling()
})

</script>

<style lang="scss" scoped>
.check-monitor-page {
  padding: 20px;
  background-color: var(--apple-canvas-parchment);
  min-height: 100vh;

  .status-card {
    margin-bottom: 20px;
    border-radius: 18px;
    
    .current-status {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .status-icon {
        padding: 16px;
        background: var(--apple-primary);
        border-radius: 18px;
        color: white;
      }
      
      .status-content {
        flex: 1;
        
        .status-message {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--apple-ink);
        }
        
        .status-details {
          display: flex;
          gap: 24px;
          color: var(--apple-ink-secondary);
          font-size: 17px;
        }
      }
      
      .refresh-button {
        .el-button {
          border: 1px solid var(--apple-hairline);
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
      color: var(--apple-ink);
      
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
          background: var(--apple-hairline);
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
              background: var(--apple-success);
              color: white;
            }
          }
          
          &.current {
            .stage-icon {
              background: var(--apple-primary);
              color: white;
              animation: pulse 2s infinite;
            }
          }
          
          &.pending {
            .stage-icon {
              background: var(--apple-hairline);
              color: var(--apple-ink-secondary);
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
              color: var(--apple-ink-secondary);
              margin-bottom: 4px;
            }
            
            .stage-progress, .stage-duration {
              font-size: 11px;
              font-weight: 600;
              color: var(--apple-primary);
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
      color: var(--apple-ink);
      
      .el-button {
        margin-left: auto;
        color: var(--apple-ink-secondary);
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
    
    .log-container {
      max-height: 300px;
      overflow-y: auto;
      background: var(--apple-canvas-parchment);
      border-radius: 11px;
      padding: 16px;
      
      .log-item {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--apple-hairline);
        
        &:last-child {
          border-bottom: none;
        }
        
        &.log-info {
          color: var(--apple-primary);
        }
        
        &.log-warning {
          color: var(--apple-warning);
        }
        
        &.log-error {
          color: var(--apple-danger);
        }
        
        &.log-success {
          color: var(--apple-success);
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
        color: var(--apple-ink-secondary);
        
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
      color: var(--apple-ink);
    }
    
    .estimate-content {
      display: flex;
      justify-content: space-around;
      
      .estimate-item {
        text-align: center;
        
        .estimate-label {
          font-size: 17px;
          color: var(--apple-ink-secondary);
          margin-bottom: 8px;
        }
        
        .estimate-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--apple-primary);
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
      color: var(--apple-ink-secondary);
      
      strong {
        color: var(--apple-ink);
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

// ── 视觉统一（design-tokens 覆盖层） ────────────────────────
.check-monitor-page {
  padding: var(--apple-spacing-lg);
  background-color: var(--apple-canvas-parchment);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);

  .status-card,
  .progress-card,
  .log-card,
  .estimate-card {
    margin-bottom: var(--apple-spacing-md);
    background: var(--apple-surface);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-lg);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .status-card {
    .current-status {
      gap: var(--apple-spacing-md);

      .status-icon {
        padding: var(--apple-spacing-md);
        border-radius: var(--apple-rounded-lg);
        color: var(--apple-on-primary);
      }

      .status-content {
        .status-message {
          margin: 0 0 var(--apple-spacing-xs);
          font-family: var(--apple-font-display);
          font-size: var(--apple-fs-tagline);
          font-weight: 600;
          color: var(--apple-ink);
        }

        .status-details {
          gap: var(--apple-spacing-lg);
          font-size: var(--apple-fs-caption);
          color: var(--apple-ink-muted-48);
        }
      }
    }
  }

  .progress-card,
  .log-card,
  .estimate-card {
    .card-header {
      gap: var(--apple-spacing-xs);
      font-family: var(--apple-font-display);
      font-size: var(--apple-fs-body-strong);
      font-weight: 600;

      .el-button {
        color: var(--apple-ink-muted-48);
      }
    }
  }

  .overall-progress {
    .progress-stages {
      margin-top: var(--apple-spacing-xl);

      &::before {
        background: var(--apple-divider-soft);
      }

      .stage-item {
        .stage-icon {
          width: 40px;
          height: 40px;
          margin-bottom: var(--apple-spacing-xs);
          border-radius: var(--apple-rounded-full);
          transition: all var(--apple-transition-slow);
        }

        &.completed {
          .stage-icon {
            color: var(--apple-on-primary);
          }
        }

        &.current {
          .stage-icon {
            color: var(--apple-on-primary);
          }
        }

        &.pending {
          .stage-icon {
            color: var(--apple-ink-muted-48);
          }
        }

        .stage-info {
          .stage-name {
            margin-bottom: var(--apple-spacing-xxs);
            font-size: var(--apple-fs-fine-print);
            color: var(--apple-ink-muted-48);
          }

          .stage-progress,
          .stage-duration {
            font-size: var(--apple-fs-fine-print);
            font-weight: 600;
            color: var(--apple-primary);
          }
        }
      }
    }
  }

  .log-card {
    .log-container {
      max-height: 300px;
      padding: var(--apple-spacing-md);
      border-radius: var(--apple-rounded-md);

      .log-item {
        gap: var(--apple-spacing-sm);
        padding: var(--apple-spacing-xs) 0;
        border-bottom: 1px solid var(--apple-divider-soft);

        .log-time {
          font-size: var(--apple-fs-fine-print);
        }

        .log-content {
          font-size: var(--apple-fs-caption);
        }
      }

      .no-logs {
        padding: var(--apple-spacing-xl) 0;
        color: var(--apple-ink-muted-48);

        .el-icon {
          margin-bottom: var(--apple-spacing-xs);
          font-size: var(--apple-fs-tagline);
        }
      }
    }
  }

  .estimate-card {
    .estimate-content {
      .estimate-item {
        .estimate-label {
          margin-bottom: var(--apple-spacing-xs);
          font-size: var(--apple-fs-caption);
          color: var(--apple-ink-muted-48);
        }

        .estimate-value {
          font-family: var(--apple-font-display);
          font-size: var(--apple-fs-body-strong);
          color: var(--apple-primary);
        }
      }
    }
  }

  .completion-content {
    padding: var(--apple-spacing-md) 0;

    .completion-icon {
      margin-bottom: var(--apple-spacing-md);
    }

    p {
      margin: var(--apple-spacing-xs) 0;
      color: var(--apple-ink-muted-48);

      strong {
        font-size: var(--apple-fs-body-strong);
        color: var(--apple-ink);
      }
    }
  }
}

@media (max-width: 768px) {
  .check-monitor-page {
    padding: var(--apple-spacing-sm);

    .current-status {
      gap: var(--apple-spacing-md);

      .status-content {
        .status-details {
          gap: var(--apple-spacing-xs);
        }
      }
    }

    .progress-stages {
      gap: var(--apple-spacing-md);
      margin-top: var(--apple-spacing-lg);

      .stage-item {
        gap: var(--apple-spacing-sm);
      }
    }

    .estimate-content {
      gap: var(--apple-spacing-md);
    }
  }
}
</style>