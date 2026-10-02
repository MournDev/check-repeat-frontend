import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { tokenManager } from '@/utils/tokenManager'

/**
 * 全站共享的 STOMP 连接（一个页面只维持一条）
 *
 * 为什么不能用原生 WebSocket：
 *   1. 后端（WebSocketConfig）只注册了 /ws 的 SockJS 端点，并没有 /ws/messages/{id}
 *      这类路径；网关的 location /ws/ 也是按 SockJS 配的（Upgrade 头 + 关缓冲）
 *   2. 认证走 CONNECT 帧的 Authorization 头（WebSocketChannelInterceptor），
 *      不是 URL 上的 ?token= —— 后者会被 Spring Security 拦成 401
 *   3. 订阅是"连接级"的：@stomp/stompjs 每次重连都会重建 StompHandler
 *      （stomp-handler.js 里 _subscriptions 随之清空），所以必须在 onConnect
 *      里重新订阅，否则断线重连后消息就再也收不到了
 */

/** destination -> 回调集合（跨连接存在，是订阅的唯一事实来源） */
const handlers = new Map()

/** 当前连接上已建立的订阅；连接断开即作废，由 onConnect 重建 */
const subscriptions = new Map()

/** 连接状态变化的监听者（供各 composable 同步 isConnected） */
const stateListeners = new Set()

let client = null
let connected = false

/**
 * SockJS 地址。
 * 开发环境固定用相对路径，交给 vite.config.js 的 dev proxy
 * （/ws → http://localhost:8080/check/ws，已带 ws: true）。
 */
const sockJsUrl = () => {
  const explicit = import.meta.env.VITE_WS_BASE_URL
  if (!explicit || import.meta.env.DEV) return '/ws'
  // 显式配置时统一成 http(s)：SockJS 建连前要先请求 /info，给 ws:// 会直接失败
  return `${explicit.replace(/^ws/, 'http').replace(/\/+$/, '')}/ws`
}

const notifyState = () => {
  stateListeners.forEach((fn) => {
    try {
      fn(connected)
    } catch (e) {
      console.error('[stomp] 状态回调异常:', e)
    }
  })
}

/** 在 broker 上真正发起订阅（幂等：同一 destination 只订一次） */
const subscribeOnBroker = (destination) => {
  if (!client || !client.connected || subscriptions.has(destination)) return
  const set = handlers.get(destination)
  if (!set || set.size === 0) return

  subscriptions.set(
    destination,
    client.subscribe(destination, (frame) => {
      let payload
      try {
        payload = JSON.parse(frame.body)
      } catch (e) {
        console.error('[stomp] 消息解析失败:', e, frame.body)
        return
      }
      // 先复制再遍历：回调里可能退订，直接遍历 Set 会漏掉后面的回调
      Array.from(handlers.get(destination) || []).forEach((fn) => {
        try {
          fn(payload, frame)
        } catch (e) {
          console.error('[stomp] 回调异常:', e)
        }
      })
    })
  )
}

const ensureClient = () => {
  if (client) return client

  client = new Client({
    webSocketFactory: () => new SockJS(sockJsUrl()),
    reconnectDelay: 5000,
    maxReconnectDelay: 60000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // 重连时重新取一次令牌：刷新过之后不能再用旧的那串
    beforeConnect: () => {
      client.connectHeaders = { Authorization: `Bearer ${tokenManager.get()}` }
    },
    onConnect: () => {
      connected = true
      // 上一轮的订阅随旧 StompHandler 一起没了，这里按 handlers 全量重建
      subscriptions.clear()
      handlers.forEach((_set, destination) => subscribeOnBroker(destination))
      notifyState()
    },
    onWebSocketClose: () => {
      connected = false
      subscriptions.clear()
      notifyState()
    },
    onStompError: (frame) => {
      console.error('[stomp] 服务端错误帧:', frame.headers?.message, frame.body)
    },
    // 排查连接问题时改成 (...args) => console.log('[stomp]', ...args)
    debug: () => {}
  })

  return client
}

/**
 * 订阅一个目的地
 * @param {string} destination 例如 /user/queue/messages、/topic/check-progress/123
 * @param {(payload: object, frame: object) => void} handler 收到消息的回调（payload 已 JSON 解析）
 * @returns {() => void} 退订函数
 */
export const subscribeTopic = (destination, handler) => {
  let set = handlers.get(destination)
  if (!set) {
    set = new Set()
    handlers.set(destination, set)
  }
  set.add(handler)

  const c = ensureClient()
  if (!c.active) c.activate()
  subscribeOnBroker(destination) // 已连上则立即订阅；没连上由 onConnect 补

  return () => {
    const current = handlers.get(destination)
    if (current) {
      current.delete(handler)
      if (current.size === 0) handlers.delete(destination)
    }

    const sub = subscriptions.get(destination)
    if (sub && !handlers.has(destination)) {
      try {
        sub.unsubscribe()
      } catch (e) {
        console.error('[stomp] 退订失败:', e)
      }
      subscriptions.delete(destination)
    }

    // 没有任何订阅了就把连接关掉，别让退出登录后的页面还在后台重连
    if (handlers.size === 0) deactivate()
  }
}

/**
 * 监听连接状态（会立刻用当前状态回调一次）
 * @returns {() => void} 取消监听
 */
export const onConnectionStateChange = (fn) => {
  stateListeners.add(fn)
  fn(connected)
  return () => stateListeners.delete(fn)
}

/** 断开连接并清空订阅（退出登录时用） */
export const deactivate = () => {
  handlers.clear()
  subscriptions.clear()
  connected = false
  if (client?.active) client.deactivate()
  notifyState()
}

/** 供调试查看当前连接情况 */
export const getConnectionInfo = () => ({
  connected,
  active: !!client?.active,
  destinations: Array.from(handlers.keys())
})

// 线上排查用：控制台执行 __stomp() 即可看到连接状态与已订阅的目的地。
// 只读，不暴露任何能改状态的方法。
if (typeof window !== 'undefined') {
  window.__stomp = getConnectionInfo
}
