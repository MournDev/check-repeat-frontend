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

    <!-- 实时连接断开提示：页面会自动降级轮询，避免学生误以为进度卡死 -->
    <el-alert
      v-if="connectionLost && !isCompleted"
      class="connection-alert"
      type="warning"
      :closable="false"
      show-icon
      title="实时连接已断开，正在尝试自动刷新…"
      description="页面每 10 秒自动获取一次最新进度，也可以手动刷新。"
    />

    <!-- 当前状态显示 -->
    <el-card class="status-card" shadow="never">
      <div class="current-status">
        <div class="status-icon">
          <el-icon size="32" :color="getStatusColor(currentStatus.status)">
            <component :is="getStatusIcon(currentStatus.status)" />
          </el-icon>
        </div>
        <div class="status-content">
          <h2 class="status-message">{{ displayStatusMessage }}</h2>
          <div class="status-details">
            <span v-if="queueHint">{{ queueHint }}</span>
            <span>已用时: {{ elapsedTime }}</span>
            <span class="update-hint">上次更新: {{ lastUpdatedText }}</span>
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
          <el-tag :type="progressTagType">
            {{ progressTagText }}
          </el-tag>
        </div>
      </template>
      
      <div class="overall-progress">
        <el-progress
          :percentage="displayProgress"
          :indeterminate="progressIndeterminate"
          :stroke-width="16"
          :color="getProgressColor"
          :show-text="false"
          striped
          striped-flow
        />
        <p v-if="progressIndeterminate" class="progress-hint">
          后端暂未返回真实百分比，正在等待进度更新…
        </p>
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
          <div class="estimate-value">{{ remainingText }}</div>
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
          <el-icon color="var(--app-color-success)" size="48"><SuccessFilled /></el-icon>
        </div>
        <p>论文查重检测已完成！</p>
        <p>总相似比: <strong>{{ formatPercent(finalSimilarity) }}</strong></p>
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
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
import { formatDateTime, formatPercent } from '@/utils/dataType.js'
import { getCheckStatusMessage, normalizeCheckStatus } from '@/utils/checkStatus.js'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const currentStatus = ref({
  status: 'checking',
  currentStage: 'queue',
  overallProgress: 0,
  stageProgress: 0,
  elapsedTime: 0, // 秒
  estimatedRemainingTime: 0, // 秒
  stages: {
    queue: { status: 'processing' },
    upload: { status: 'pending' },
    internal_check: { status: 'pending' },
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
const { connect, disconnect, isConnected, error: progressError } = useCheckProgress();

// 根据后端status映射阶段状态。
// 后端 CheckTask.status 实际是字符串码（pending/checking/completed/failure/cancelled，
// 见 CheckTaskStatusEnum），老代码只比数字码 '0'/'1'/'2' 所以永远匹配不上，
// 这里两种写法都认。
const mapCheckStatusToStages = (checkStatus) => {
  const code = String(checkStatus ?? '').toLowerCase()
  if (code === '0' || code === 'pending') return [
    { key: 'queue', name: '排队中', status: 'processing', progress: 0 },
    { key: 'upload', name: '文件上传', status: 'pending', progress: 0 },
    { key: 'check', name: '论文查重', status: 'pending', progress: 0 },
    { key: 'report', name: '报告生成', status: 'pending', progress: 0 }
  ]
  if (code === '1' || code === 'checking') return [
    { key: 'queue', name: '排队中', status: 'completed', progress: 100 },
    { key: 'upload', name: '文件上传', status: 'completed', progress: 100 },
    { key: 'check', name: '论文查重', status: 'processing', progress: 0 },
    { key: 'report', name: '报告生成', status: 'pending', progress: 0 }
  ]
  if (code === '2' || code === 'completed') return [
    { key: 'queue', name: '排队中', status: 'completed', progress: 100 },
    { key: 'upload', name: '文件上传', status: 'completed', progress: 100 },
    { key: 'check', name: '论文查重', status: 'completed', progress: 100 },
    { key: 'report', name: '报告生成', status: 'completed', progress: 100 }
  ]
  return [
    { key: 'queue', name: '排队中', status: 'completed', progress: 100 },
    { key: 'upload', name: '文件上传', status: 'completed', progress: 100 },
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
  const diff = nowTick.value - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '小于1分钟'
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainMin = minutes % 60
  return `${hours}小时${remainMin}分钟`
})

// ── 进度真实性 / 排队提示 / 断线降级 ──────────────────────
const connectionLost = ref(false)
const lastUpdatedAt = ref(null)
// 只有后端明确返回百分比时才算真实进度；否则显示不确定态，不用相似度硬凑
const hasRealProgress = ref(false)
const nowTick = ref(Date.now())
let clockTimer = null
let connectionGuardTimer = null
let hasConnectedOnce = false

const statusKey = computed(() => {
  const raw = String(currentStatus.value.status ?? '').toLowerCase()
  if (raw === '0') return 'pending'
  if (raw === '1') return 'checking'
  if (raw === '2') return 'completed'
  return normalizeCheckStatus(raw)
})

const isCompleted = computed(() => statusKey.value === 'completed')

const progressIndeterminate = computed(() =>
  ['pending', 'checking'].includes(statusKey.value) && !hasRealProgress.value
)

const displayProgress = computed(() => {
  if (isCompleted.value) return 100
  if (!hasRealProgress.value) return 0
  return Math.min(100, Math.max(0, Number(currentStatus.value.overallProgress) || 0))
})

const progressTagText = computed(() => {
  if (isCompleted.value) return '100%'
  if (progressIndeterminate.value) return '计算中'
  return `${Math.round(displayProgress.value)}%`
})

const progressTagType = computed(() =>
  progressIndeterminate.value ? 'info' : getProgressTagType(displayProgress.value)
)

const lastUpdatedText = computed(() =>
  lastUpdatedAt.value ? formatDateTime(lastUpdatedAt.value, 'HH:mm:ss') : '等待更新'
)

const waitedMinutes = computed(() => {
  const start = currentStatus.value.startTime
  if (!start) return null
  return Math.max(0, Math.floor((nowTick.value - new Date(start).getTime()) / 60000))
})

const queueHint = computed(() => {
  if (statusKey.value === 'pending') {
    return waitedMinutes.value == null
      ? '排队中，等待分配查重资源'
      : `排队中 · 已等待 ${waitedMinutes.value} 分钟`
  }
  if (statusKey.value === 'checking') {
    return waitedMinutes.value == null
      ? '查重进行中'
      : `查重进行中 · 已等待 ${waitedMinutes.value} 分钟`
  }
  return ''
})

const displayStatusMessage = computed(() =>
  statusKey.value === 'pending' ? '正在排队等待查重…' : getStatusMessage(currentStatus.value.status)
)

const remainingText = computed(() => {
  if (isCompleted.value) return '已完成'
  if (statusKey.value === 'pending') return '排队中，暂无预估'
  if (!currentStatus.value.estimatedRemainingTime) return '暂无预估'
  return formatEstimatedTime(currentStatus.value.estimatedRemainingTime)
})

const getProgressColor = computed(() => 'var(--app-color-primary)')

// 方法
const goBack = () => {
  router.back()
}

const refreshStatus = async () => {
  try {
    const res = await getCheckTaskDetail(route.params.paperId)
    if (res.code === 200 && res.data) {
      updateStatus(res.data)
      ElMessage.success('状态已刷新')
    } else if (res.code === 200) {
      // 论文还没有查重任务：空态不是错误
      ElMessage.warning('该论文暂无查重任务')
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
  lastUpdatedAt.value = new Date()

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

  // 优先使用后端真实开始时间；后端未返回时才从本次进入页面起算（仅用于"已等待"文案）
  if (!currentStatus.value.startTime) {
    currentStatus.value.startTime = data.startTime || data.createTime || data.checkStartTime || new Date().toISOString()
  }

  const statusRaw = String(currentStatus.value.status || '').toLowerCase()
  const completed = statusRaw === '2' || statusRaw === 'completed'

  // 根据后端状态更新阶段状态
  const stageSource = data.checkStatus || data.status
  if (stageSource) {
    checkStages.value = mapCheckStatusToStages(stageSource)
  } else if (data.stages) {
    checkStages.value = checkStages.value.map(stage => ({
      ...stage,
      ...data.stages[stage.key]
    }))
  }

  // 进度只认后端真实百分比；拿不到时保持"计算中"不确定态，不用相似度换算
  const realPercent = [data.overallProgress, data.percent, data.progress, data.checkProgress]
    .find(value => typeof value === 'number' && Number.isFinite(value))

  if (completed) {
    currentStatus.value.overallProgress = 100
    hasRealProgress.value = true
  } else if (realPercent != null) {
    currentStatus.value.overallProgress = realPercent
    hasRealProgress.value = true
  } else if (statusRaw === '0' || statusRaw === 'pending' || statusRaw === 'cancelled') {
    currentStatus.value.overallProgress = 0
    hasRealProgress.value = false
  }

  // 添加日志
  if (data.logs) {
    logs.value = [...logs.value, ...data.logs]
    scrollToBottom()
  }

  // 只有实时推送到达的完成事件才弹完成框（announce=true）
  if (completed) {
    finalSimilarity.value = data.checkRate || 0
    if (announce) announceCompletion()
  }
}

// 状态文案统一由 utils/checkStatus.js 提供（SSOT），本页不再维护第二套状态词表
const getStatusMessage = (status) => getCheckStatusMessage(status)

const getStatusColor = (status) => {
  const colors = {
    pending: 'var(--app-color-info)',
    checking: 'var(--app-color-primary)',
    completed: 'var(--app-color-success)',
    failure: 'var(--app-color-danger)',
    cancelled: 'var(--app-color-warning)'
  }
  return colors[normalizeCheckStatus(status)] || 'var(--app-color-info)'
}

const getStatusIcon = (status) => {
  // 值为组件对象（非字符串名）：全局图标注册已移除，字符串无法解析
  const icons = {
    pending: Clock,
    checking: Loading,
    completed: SuccessFilled,
    failure: CircleClose,
    cancelled: Warning
  }
  return icons[normalizeCheckStatus(status)] || InfoFilled
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
  return formatDateTime(finishTime, 'HH:mm')
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
    lastUpdatedAt.value = new Date()
    // data.type 已由 useCheckProgress 归一化为 progress | complete | error
    if (data.type === 'progress') {
      addLog('info', data.message || '查重进度更新');
      if (typeof data.percent === 'number' && Number.isFinite(data.percent)) {
        currentStatus.value.overallProgress = data.percent;
        hasRealProgress.value = true;
      }
    } else if (data.type === 'complete') {
      addLog('success', data.message || '查重完成');
      currentStatus.value.overallProgress = 100;
      currentStatus.value.status = 'completed';
      hasRealProgress.value = true;
      checkStages.value = mapCheckStatusToStages('completed');
      // 推送事件里不带完整数据，完成后再查一次任务详情
      getCheckTaskDetail(route.params.paperId)
        .then((res) => {
          if (res.code === 200 && res.data) {
            updateStatus(res.data)
          }
        })
        .catch(() => {});
      announceCompletion();
    } else if (data.type === 'error') {
      addLog('error', data.message || '查重失败');
      currentStatus.value.status = 'failed';
      hasRealProgress.value = false;
    }
  });
  // 首次连接迟迟不成功时，8 秒后自动降级轮询
  armConnectionGuard();
  // 注：这里原先还挂了两个 watch 监听 hook 的 checkProgress.percent/status，
  // 但上面的回调已经处理了同样的事，结果每帧完成事件都会写两条日志、并重复弹框。
  // 现在只保留回调这一条路径。
};

const disconnectWebSocket = () => {
  disconnect();
};

const pollingTimer = ref(null)
const startPolling = () => {
  if (pollingTimer.value) return
  pollingTimer.value = setInterval(async () => {
    try {
      const res = await getCheckTaskDetail(route.params.paperId)
      if (res.code === 200 && res.data) {
        updateStatus(res.data)
      }
    } catch (error) {
      console.error('轮询状态失败:', error)
    }
  }, 10000) // 实时连接断开后每 10 秒兜底刷新一次
}

// 实时连接状态：断开时显示横幅并自动降级为轮询
watch([isConnected, progressError], ([connected, error]) => {
  if (connected) {
    hasConnectedOnce = true
    connectionLost.value = false
    if (connectionGuardTimer) {
      clearTimeout(connectionGuardTimer)
      connectionGuardTimer = null
    }
    stopPolling()
    return
  }
  if (hasConnectedOnce || error) {
    connectionLost.value = true
    startPolling()
  }
})

// 首次连接 8 秒仍未成功：不再让学生干等，直接降级轮询
const armConnectionGuard = () => {
  connectionGuardTimer = setTimeout(() => {
    if (!isConnected.value) {
      connectionLost.value = true
      startPolling()
    }
  }, 8000)
}

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

const addLog = (level, message) => {
  const now = new Date()
  const time = formatDateTime(now, 'HH:mm:ss')
  
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
  // "已等待 X 分钟"每 30 秒刷新一次，不依赖推送是否连通
  clockTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 30000)

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
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
  if (connectionGuardTimer) {
    clearTimeout(connectionGuardTimer)
    connectionGuardTimer = null
  }
})

</script>

<style lang="scss" scoped>
.check-monitor-page {

  .connection-alert {
    margin-bottom: var(--app-space-4);
  }

  .status-card,
  .progress-card,
  .log-card,
  .estimate-card {
    margin-bottom: var(--app-space-4);
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .status-card {
    .current-status {
      display: flex;
      align-items: center;
      gap: var(--app-space-4);

      .status-icon {
        padding: var(--app-space-4);
        background: var(--app-color-primary);
        border-radius: var(--app-radius-lg);
        color: var(--app-color-on-primary);
      }

      .status-content {
        flex: 1;

        .status-message {
          margin: 0 0 var(--app-space-2);
          font-family: var(--app-font-family);
          font-size: var(--app-fs-title);
          font-weight: 600;
          color: var(--app-color-ink);
        }

        .status-details {
          display: flex;
          gap: var(--app-space-6);
          color: var(--app-color-text-muted);
          font-size: var(--app-fs-caption);
        }
      }

      .refresh-button {
        .el-button {
          border: 1px solid var(--app-color-border);
        }
      }
    }
  }

  .progress-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      font-family: var(--app-font-family);
      font-size: var(--app-fs-body);
      font-weight: 600;
      color: var(--app-color-ink);

      .el-tag {
        margin-left: auto;
      }
    }

    .overall-progress {
      .progress-hint {
        margin: var(--app-space-2) 0 0;
        font-size: var(--app-fs-meta);
        color: var(--app-color-text-muted);
      }

      .progress-stages {
        display: flex;
        justify-content: space-between;
        margin-top: var(--app-space-8);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          // 连接线对齐 40px 圆点的中线（组件几何，非间距令牌）
          top: 20px;
          left: 40px;
          right: 40px;
          height: 2px;
          background: var(--app-color-divider);
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
              background: var(--app-color-success);
              color: var(--app-color-on-primary);
            }
          }

          &.current {
            .stage-icon {
              background: var(--app-color-primary);
              color: var(--app-color-on-primary);
              animation: pulse 2s infinite;
            }
          }

          &.pending {
            .stage-icon {
              background: var(--app-color-border);
              color: var(--app-color-text-muted);
            }
          }

          .stage-icon {
            width: 40px;
            height: 40px;
            border-radius: var(--app-radius-pill);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--app-space-2);
          }

          .stage-info {
            text-align: center;

            .stage-name {
              font-size: var(--app-fs-meta);
              color: var(--app-color-text-muted);
              margin-bottom: var(--app-space-1);
            }

            .stage-progress, .stage-duration {
              font-size: var(--app-fs-meta);
              font-weight: 600;
              color: var(--app-color-primary);
            }
          }
        }
      }
    }
  }

  .log-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      font-family: var(--app-font-family);
      font-size: var(--app-fs-body);
      font-weight: 600;
      color: var(--app-color-ink);

      .el-button {
        margin-left: auto;
        color: var(--app-color-text-muted);

        .el-icon {
          margin-right: var(--app-space-1);
        }
      }
    }

    .log-container {
      max-height: 300px;
      overflow-y: auto;
      background: var(--app-color-fill);
      border-radius: var(--app-radius-md);
      padding: var(--app-space-4);

      .log-item {
        display: flex;
        gap: var(--app-space-3);
        padding: var(--app-space-2) 0;
        border-bottom: 1px solid var(--app-color-divider);

        &:last-child {
          border-bottom: none;
        }

        &.log-info {
          color: var(--app-color-primary);
        }

        &.log-warning {
          color: var(--app-color-warning);
        }

        &.log-error {
          color: var(--app-color-danger);
        }

        &.log-success {
          color: var(--app-color-success);
        }

        .log-time {
          font-family: var(--app-font-mono);
          font-size: var(--app-fs-meta);
          min-width: 80px;
        }

        .log-content {
          flex: 1;
          font-size: var(--app-fs-caption);
          line-height: 1.4;
        }
      }

      .no-logs {
        text-align: center;
        padding: var(--app-space-8) 0;
        color: var(--app-color-text-muted);

        .el-icon {
          font-size: var(--app-fs-title);
          margin-bottom: var(--app-space-2);
        }
      }
    }
  }

  .estimate-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      font-family: var(--app-font-family);
      font-size: var(--app-fs-body);
      font-weight: 600;
      color: var(--app-color-ink);
    }

    .estimate-content {
      display: flex;
      justify-content: space-around;

      .estimate-item {
        text-align: center;

        .estimate-label {
          font-size: var(--app-fs-caption);
          color: var(--app-color-text-muted);
          margin-bottom: var(--app-space-2);
        }

        .estimate-value {
          font-family: var(--app-font-family);
          font-size: var(--app-fs-body);
          font-weight: 600;
          color: var(--app-color-primary);
        }
      }
    }
  }

  .completion-content {
    text-align: center;
    padding: var(--app-space-4) 0;

    .completion-icon {
      margin-bottom: var(--app-space-4);
    }

    p {
      margin: var(--app-space-2) 0;
      color: var(--app-color-text-muted);

      strong {
        color: var(--app-color-ink);
        font-size: var(--app-fs-body);
      }
    }
  }
}

// 动画
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--app-color-primary-rgb), 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(var(--app-color-primary-rgb), 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--app-color-primary-rgb), 0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .check-monitor-page {
    .current-status {
      flex-direction: column;
      text-align: center;
      gap: var(--app-space-4);

      .status-content {
        .status-details {
          flex-direction: column;
          gap: var(--app-space-2);
        }
      }
    }

    .progress-stages {
      flex-direction: column;
      gap: var(--app-space-4);
      margin-top: var(--app-space-6);

      &::before {
        display: none;
      }

      .stage-item {
        flex-direction: row;
        width: 100%;
        gap: var(--app-space-3);

        .stage-info {
          text-align: left;
        }
      }
    }

    .estimate-content {
      flex-direction: column;
      gap: var(--app-space-4);
    }
  }
}
</style>
