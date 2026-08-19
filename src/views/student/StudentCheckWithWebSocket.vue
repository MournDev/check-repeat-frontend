<!--
学生端查重页面 - WebSocket 实时进度推送示例

使用步骤：
1. 在 StudentCheck.vue 或其他组件中引入
2. 调用 startCheckTask(paperId) 发起查重
3. 自动连接 WebSocket 并监听进度
4. 实时显示进度条和状态消息
-->

<template>
  <div class="check-container">
    <!-- 查重任务列表 -->
    <a-table :dataSource="taskList" :columns="columns" rowKey="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.checkStatus)">
            {{ getStatusText(record.checkStatus) }}
          </a-tag>
        </template>

        <template v-if="column.key === 'progress'">
          <div v-if="record.checkStatus === 'CHECKING'">
            <a-progress 
              :percent="getProgress(record.id).percent" 
              :status="getProgress(record.id).status"
            >
              <template #format="percent">
                {{ getProgress(record.id).message || `${percent}%` }}
              </template>
            </a-progress>
          </div>
          <span v-else>-</span>
        </template>

        <template v-if="column.key === 'action'">
          <a-button 
            type="primary" 
            @click="startCheckTask(record.id)"
            :disabled="record.checkStatus === 'CHECKING'"
          >
            开始查重
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- WebSocket 连接状态指示器 -->
    <div class="ws-status">
      <a-badge :status="isConnected ? 'success' : 'error'" :text="connectionText" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { useCheckProgress } from '@/composables/useCheckProgress';
import studentApi from '@/api/student';

// WebSocket 连接
const { connect, disconnect, progress, isConnected } = useCheckProgress();

// 当前查重的任务 ID
const currentTaskId = ref(null);

// 任务列表
const taskList = ref([]);

// 表格列定义
const columns = [
  { title: '论文标题', dataIndex: 'paperTitle', key: 'paperTitle' },
  { title: '状态', dataIndex: 'checkStatus', key: 'status' },
  { title: '相似度', dataIndex: 'similarityRate', key: 'similarity' },
  { title: '进度', key: 'progress' },
  { title: '操作', key: 'action', width: 150 }
];

// WebSocket 连接状态文本
const connectionText = computed(() => {
  return isConnected.value ? '实时推送已连接' : '未连接';
});

/**
 * 开始查重任务
 */
const startCheckTask = async (paperId) => {
  try {
    // 1. 调用后端接口创建查重任务
    const result = await studentApi.createCheckTask(paperId);
    
    if (result.code === 200) {
      const taskId = result.data.id;
      currentTaskId.value = taskId;
      
      // 2. 连接到 WebSocket
      connect(taskId);
      
      message.success(result.msg || '查重任务已创建，正在处理中...');
      
      // 3. 轮询兜底（如果 WebSocket 失败）
      startPolling(taskId, paperId);
    } else {
      message.error(result.msg || '查重任务创建失败');
    }
  } catch (error) {
    console.error('创建查重任务失败', error);
    message.error('查重任务创建失败，请稍后重试');
  }
};

/**
 * 获取任务进度（从响应式对象）
 */
const getProgress = (taskId) => {
  if (currentTaskId.value !== taskId) {
    return { percent: 0, status: 'active', message: '' };
  }
  
  return {
    percent: progress.percent,
    status: progress.status,
    message: progress.message
  };
};

/**
 * 轮询兜底机制（WebSocket + 轮询双保险）
 */
let pollingTimer = null;
const startPolling = (taskId, paperId) => {
  const poll = async () => {
    try {
      const res = await studentApi.getCheckTaskDetail(taskId);
      const task = res.data;
      
      // 如果任务已完成或失败，停止轮询
      if (task.checkStatus === 'COMPLETED' || task.checkStatus === 'FAILURE') {
        stopPolling();
        // 刷新列表
        loadTaskList();
      }
    } catch (error) {
      console.error('轮询失败', error);
    }
  };

  // 每 3 秒轮询一次
  pollingTimer = setInterval(poll, 3000);
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

/**
 * 加载任务列表
 */
const loadTaskList = () => {
  // TODO: 调用 API 加载任务列表
};

/**
 * 获取状态颜色
 */
const getStatusColor = (status) => {
  const colors = {
    PENDING: 'orange',
    CHECKING: 'blue',
    COMPLETED: 'green',
    FAILURE: 'red'
  };
  return colors[status] || 'default';
};

/**
 * 获取状态文本
 */
const getStatusText = (status) => {
  const texts = {
    PENDING: '待处理',
    CHECKING: '查重中',
    COMPLETED: '已完成',
    FAILURE: '失败'
  };
  return texts[status] || status;
};

// 组件卸载时清理
onUnmounted(() => {
  disconnect();
  stopPolling();
});
</script>

<style scoped lang="scss">
.check-container {
  padding: 24px;
}

.ws-status {
  margin-top: 16px;
  text-align: right;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
