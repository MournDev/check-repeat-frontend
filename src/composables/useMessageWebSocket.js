import { ref, reactive, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import Cookies from 'js-cookie';
import { useUserStore } from '@/stores/user';
/**
 * 消息实时更新 Hook（Vue 3 Composition API）
 * 使用原生 WebSocket 连接后端
 */
export function useMessageWebSocket() {
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // 初始重连延迟1秒
  
  // 连接状态
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const error = ref(null);
  const userStore = useUserStore();

  /**
   * 连接 WebSocket 并订阅消息
   * @param {string|number} userId - 用户ID
   * @param {Function} [onMessage] - 收到消息时的回调
   */
  const connect = (userId, onMessage) => {
    if (!userId) {
      console.error('userId 不能为空');
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已连接，跳过');
      return;
    }

    isConnecting.value = true;
    error.value = null;

    try {
      const token = Cookies.get('token') 
      if (!token) {
        console.error('❌ 未找到 Token，无法建立 WebSocket 连接');
        ElMessage.warning('请先登录');
        isConnecting.value = false;
        return;
      }
      // 构建 WebSocket URL（开发环境用 localhost，生产从 env 读取）
      const wsBase = import.meta.env.VITE_WS_BASE_URL || (
        window.location.protocol === 'https:'
          ? `wss://${window.location.host}`
          : `ws://${window.location.host}`
      );
      const wsUrl = `${wsBase}/ws/messages/${userId}?token=${encodeURIComponent(token)}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket 连接成功');
        isConnected.value = true;
        isConnecting.value = false;
        // 连接成功后发送 token 进行认证
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'AUTH',
            token: token,
            userId: userId
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // 处理认证成功消息
          if (data.type === 'AUTH_SUCCESS') {
            console.log('WebSocket 认证成功');
            isConnected.value = true;
            reconnectAttempts = 0; // 重置重连次数
          }
          onMessage?.(data);
        } catch (e) {
          console.error('[useMessageWebSocket] 消息解析失败:', e);
        }
      };

      ws.onerror = (evt) => {
        console.error('[useMessageWebSocket] WebSocket 错误:', evt);
        error.value = 'WebSocket连接失败';
        isConnected.value = false;
        isConnecting.value = false;
        ElMessage.error('消息连接失败，正在尝试重连...');
        // 尝试重连
        scheduleReconnect(userId, onMessage);
      };

      ws.onclose = () => {
        console.log('WebSocket 连接关闭');
        isConnected.value = false;
        isConnecting.value = false;
        // 尝试重连
        scheduleReconnect(userId, onMessage);
      };
    } catch (err) {
      console.error('创建 WebSocket 客户端失败', err);
      isConnecting.value = false;
      error.value = '连接失败: ' + err.message;
    }
  };

  /**
   * 安排重连
   */
  const scheduleReconnect = (userId, onMessage) => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    
    // 指数退避重连策略
    reconnectAttempts++;
    if (reconnectAttempts > maxReconnectAttempts) {
      console.error('WebSocket 重连失败次数过多，停止尝试');
      ElMessage.error('消息连接失败，请刷新页面重试');
      return;
    }
    
    const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1);
    console.log(`尝试重新连接 WebSocket (${reconnectAttempts}/${maxReconnectAttempts})，延迟 ${delay}ms`);
    
    reconnectTimer = setTimeout(() => {
      connect(userId, onMessage);
    }, delay);
  };

  /**
   * 断开 WebSocket 连接
   */
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    if (ws) {
      ws.close();
      ws = null;
    }
    isConnected.value = false;
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    disconnect();
  });

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error
  };
}
