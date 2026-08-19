import { ref, onUnmounted } from 'vue'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

/**
 * 查重进度订阅 Composable
 * 使用 STOMP over SockJS 连接后端 WebSocket
 */
export function useCheckProgress() {
  let stompClient = null
  const isConnected = ref(false)
  const error = ref(null)

  /**
   * 连接并订阅查重进度
   * @param {string|number} paperId - 论文ID
   * @param {Function} onMessage - 收到消息时的回调，参数为解析后的数据对象
   * @param {Function} [onError] - 连接失败时的回调
   */
  const connect = (paperId, onMessage, onError) => {
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080'

    stompClient = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        isConnected.value = true
        error.value = null

        stompClient.subscribe(`/topic/check-status/${paperId}`, (frame) => {
          try {
            const data = JSON.parse(frame.body)
            onMessage && onMessage(data)
          } catch (e) {
            console.error('[useCheckProgress] 消息解析失败:', e)
          }
        })
      },
      onStompError: (frame) => {
        console.error('[useCheckProgress] STOMP 错误:', frame)
        error.value = frame.headers?.message || 'STOMP连接错误'
        isConnected.value = false
        onError && onError(error.value)
      },
      onDisconnect: () => {
        isConnected.value = false
      },
      onWebSocketError: (evt) => {
        console.error('[useCheckProgress] WebSocket 错误:', evt)
        error.value = 'WebSocket连接失败'
        isConnected.value = false
        onError && onError(error.value)
      }
    })

    stompClient.activate()
  }

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (stompClient && stompClient.active) {
      stompClient.deactivate()
    }
    stompClient = null
    isConnected.value = false
  }

  // 组件卸载时自动断开
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    error,
    connect,
    disconnect
  }
}
