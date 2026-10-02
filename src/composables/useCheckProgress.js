import { ref, reactive, getCurrentInstance, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { tokenManager } from '@/utils/tokenManager'
import { subscribeTopic, onConnectionStateChange } from '@/utils/stompClient'

/**
 * 查重任务进度监听 Hook（STOMP over SockJS）
 *
 * 后端从 /topic/check-progress/{taskId} 推 CheckProgressEvent：
 *   { taskId, paperId, stage, percent, message, estimatedRemainingSeconds }
 * stage 取值：FILE_PARSING / TEXT_COMPARING / REPORT_GENERATING / COMPLETED / FAILED
 *
 * 这里把它归一化成组件习惯的契约：
 *   { type: 'progress' | 'complete' | 'error', progress: percent, ...原始字段 }
 *
 * ⚠️ 订阅用的是【taskId】（查重任务ID），不是 paperId —— 后端主题按 taskId 分片。
 */
const destinationOf = (taskId) => `/topic/check-progress/${taskId}`

/** 后端事件 → 前端契约 */
const normalize = (payload) => {
  const stage = String(payload?.stage || '').toUpperCase()
  const type = stage === 'COMPLETED' ? 'complete' : stage === 'FAILED' ? 'error' : 'progress'
  return {
    ...payload,
    type,
    stage,
    progress: payload?.percent ?? 0
  }
}

export function useCheckProgress() {
  let unsubscribe = null
  let stopStateWatch = null
  let onMessageRef = null

  // 响应式进度数据
  const progress = reactive({
    taskId: null,
    paperId: null,
    percent: 0,
    message: '',
    similarity: 0,
    riskLevel: '',
    stage: '', // 后端阶段码：FILE_PARSING / TEXT_COMPARING / REPORT_GENERATING / COMPLETED / FAILED
    status: 'active' // active | exception | success
  })

  // 连接状态
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const error = ref(null)

  /**
   * 连接并订阅指定查重任务的进度
   * @param {string|number} taskId 查重任务ID（不是论文ID）
   * @param {Function} [onMessage] 收到进度时的回调，参数为归一化后的数据
   */
  const connect = (taskId, onMessage) => {
    if (!taskId) {
      console.error('taskId 不能为空')
      return
    }
    if (!tokenManager.get()) {
      console.error('❌ 未找到 Token，无法建立 WebSocket 连接')
      return
    }

    // 幂等：重复调用只保留最后一个回调
    disconnect()

    isConnecting.value = true
    error.value = null
    onMessageRef = onMessage

    unsubscribe = subscribeTopic(destinationOf(taskId), (payload) => {
      const data = normalize(payload)
      progress.taskId = data.taskId ?? taskId
      if (data.paperId != null) progress.paperId = data.paperId

      updateProgress(data)

      if (data.type === 'complete') {
        progress.status = 'success'
        ElMessage.success('查重完成！')
      } else if (data.type === 'error') {
        progress.status = 'exception'
        ElMessage.error(data.message || '查重失败')
      }

      onMessageRef?.(data)
    })

    let everConnected = false
    stopStateWatch = onConnectionStateChange((ok) => {
      isConnected.value = ok
      if (ok) {
        everConnected = true
        isConnecting.value = false
        error.value = null
      } else if (everConnected) {
        error.value = '查重进度连接已断开，正在重连'
      }
    })
  }

  /**
   * 更新进度数据
   */
  const updateProgress = (data) => {
    if (data.paperId != null) progress.paperId = data.paperId
    if (data.taskId != null) progress.taskId = data.taskId
    if (data.progress != null) progress.percent = data.progress
    if (data.message) progress.message = data.message
    if (data.similarity != null) progress.similarity = data.similarity
    if (data.riskLevel) progress.riskLevel = data.riskLevel
    if (data.stage) progress.stage = data.stage
  }

  /**
   * 退订（不再监听这个任务的进度）
   */
  const disconnect = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (stopStateWatch) {
      stopStateWatch()
      stopStateWatch = null
    }
    isConnected.value = false
    isConnecting.value = false
  }

  // 组件卸载时自动清理。
  // 批量监控会在事件回调里（而非 setup 中）调用本 Hook，那种场景没有组件实例，
  // 此时不该注册 onUnmounted，由调用方自己 disconnect。
  if (getCurrentInstance()) {
    onUnmounted(() => {
      disconnect()
    })
  }

  return {
    connect,
    disconnect,
    progress,
    isConnected,
    isConnecting,
    error
  }
}
