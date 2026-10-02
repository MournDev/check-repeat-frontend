import { ref, getCurrentInstance, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { tokenManager } from '@/utils/tokenManager'
import { subscribeTopic, onConnectionStateChange } from '@/utils/stompClient'

/**
 * 站内信实时推送 Hook（STOMP over SockJS）
 *
 * 后端在站内信落库后经 WebSocketSender.sendToUser(receiverId, "/queue/messages", ...)
 * 推过来，客户端订阅 /user/queue/messages 即可（用户身份由 CONNECT 帧的
 * Authorization 头解析，不靠 URL 参数）。
 *
 * 收到的帧形如：{ "type": "NOTIFICATION", "content": { ...SystemMessage }, ... }
 */
const DESTINATION = '/user/queue/messages'

export function useMessageWebSocket() {
  let unsubscribe = null
  let stopStateWatch = null
  let onMessageRef = null

  const isConnected = ref(false)
  const isConnecting = ref(false)
  const error = ref(null)

  /**
   * 连接并监听站内信
   * @param {string|number} userId 当前用户ID（仅用于日志，身份以令牌为准）
   * @param {Function} [onMessage] 收到消息时的回调，参数为已解析的消息体
   */
  const connect = (userId, onMessage) => {
    if (!tokenManager.get()) {
      console.error('❌ 未找到 Token，无法建立 WebSocket 连接')
      ElMessage.warning('请先登录')
      return
    }

    // 幂等：重复调用（MainLayout 会在用户信息到位前后各调一次）只保留最后一个回调，
    // 否则同一条消息会触发多次提示
    disconnect()

    isConnecting.value = true
    error.value = null
    onMessageRef = onMessage

    unsubscribe = subscribeTopic(DESTINATION, (payload) => {
      onMessageRef?.(payload)
    })

    // 首次回调会立刻带出"当前未连接"，那不是失败，别急着标记 error
    let everConnected = false
    stopStateWatch = onConnectionStateChange((ok) => {
      isConnected.value = ok
      if (ok) {
        everConnected = true
        isConnecting.value = false
        error.value = null
      } else if (everConnected) {
        // 连上过又断了：stompjs 会按 reconnectDelay 自动重连，这里只记录状态
        error.value = 'WebSocket连接已断开，正在重连'
      }
      console.log(`[useMessageWebSocket] 连接状态: ${ok ? '已连接' : '未连接'}（用户ID: ${userId}）`)
    })
  }

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

  // 组件卸载时自动清理（只退订，连接由 stompClient 在无订阅时统一关闭）
  if (getCurrentInstance()) {
    onUnmounted(() => {
      disconnect()
    })
  }

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error
  }
}
