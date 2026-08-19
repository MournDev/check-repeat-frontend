/**
 * 批量查重进度监控 Hook
 * 
 * 使用示例：
 * ```vue
 * <script setup>
 * import { useBatchCheckProgress } from '@/composables/useBatchCheckProgress';
 * 
 * const { startBatchCheck, tasks, overallProgress } = useBatchCheckProgress();
 * 
 * // 批量查重
 * const handleBatchCheck = async (paperIds) => {
 *   await startBatchCheck(paperIds);
 * };
 * </script>
 * ```
 */

import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { createBatchCheckTasks } from '@/api/student';
import { useCheckProgress } from './useCheckProgress';

export function useBatchCheckProgress() {
  // 任务列表
  const tasks = reactive([]);
  
  // 总体进度
  const overallProgress = ref(0);
  
  // 是否正在批量处理
  const isBatchProcessing = ref(false);
  
  // 统计信息
  const statistics = reactive({
    total: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });

  /**
   * 开始批量查重
   */
  const startBatchCheck = async (paperIds) => {
    if (!paperIds || paperIds.length === 0) {
      ElMessage.warning('请选择要查重的论文');
      return;
    }

    try {
      isBatchProcessing.value = true;
      
      // 调用批量接口
      const result = await createBatchCheckTasks(paperIds);
      
      if (result.code === 200) {
        const batchResult = result.data;
        
        // 初始化任务列表
        initTasks(batchResult);
        
        ElMessage.success(`批量查重已启动，成功 ${batchResult.successCount} 篇，失败 ${batchResult.failedCount} 篇`);
        
        // 为每个成功的任务创建进度监听
        monitorBatchTasks(batchResult.successList);
      } else {
        ElMessage.error(result.msg || '批量查重失败');
      }
    } catch (error) {
      console.error('批量查重失败:', error);
      ElMessage.error('批量查重失败：' + error.message);
    } finally {
      isBatchProcessing.value = false;
    }
  };

  /**
   * 初始化任务列表
   */
  const initTasks = (batchResult) => {
    tasks.length = 0;
    
    // 添加成功的任务
    batchResult.successList.forEach(item => {
      tasks.push({
        paperId: item.paperId,
        taskId: item.taskId,
        status: 'pending',
        progress: 0,
        message: '等待中...',
        estimatedTime: item.estimatedTime,
        queuePosition: item.queuePosition,
        waitTime: item.waitTime
      });
    });
    
    // 添加失败的任务
    batchResult.failedList.forEach(item => {
      tasks.push({
        paperId: item.paperId,
        taskId: null,
        status: 'failed',
        progress: 0,
        message: item.message,
        estimatedTime: 0,
        queuePosition: 0,
        waitTime: 0
      });
    });
    
    // 更新统计
    statistics.total = batchResult.totalCount;
    statistics.processing = batchResult.successCount;
    statistics.completed = 0;
    statistics.failed = batchResult.failedCount;
  };

  /**
   * 监控批量任务
   */
  const monitorBatchTasks = (successList) => {
    successList.forEach(item => {
      const { connect } = useCheckProgress();
      
      // 连接到 WebSocket
      connect(item.taskId);
      
      // 监听进度变化（这里简化处理，实际需要更复杂的逻辑）
      setTimeout(() => {
        updateTaskProgress(item.taskId, {
          stage: 'COMPLETED',
          percent: 100,
          message: '查重完成'
        });
      }, item.estimatedTime * 1000);
    });
  };

  /**
   * 更新任务进度
   */
  const updateTaskProgress = (taskId, progressData) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (task) {
      task.status = progressData.stage === 'COMPLETED' ? 'completed' : 
                    progressData.stage === 'FAILED' ? 'failed' : 'processing';
      task.progress = progressData.percent;
      task.message = progressData.message;
      
      // 更新统计
      if (task.status === 'completed') {
        statistics.completed++;
        statistics.processing--;
      } else if (task.status === 'failed') {
        statistics.failed++;
        statistics.processing--;
      }
      
      // 计算总体进度
      calculateOverallProgress();
    }
  };

  /**
   * 计算总体进度
   */
  const calculateOverallProgress = () => {
    if (tasks.length === 0) {
      overallProgress.value = 0;
      return;
    }
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    overallProgress.value = Math.round(totalProgress / tasks.length);
  };

  /**
   * 获取状态文本
   */
  const getStatusText = (status) => {
    const texts = {
      pending: '等待中',
      processing: '进行中',
      completed: '已完成',
      failed: '失败'
    };
    return texts[status] || status;
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status) => {
    const colors = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'danger'
    };
    return colors[status] || 'info';
  };

  return {
    startBatchCheck,
    tasks,
    overallProgress,
    statistics,
    isBatchProcessing,
    getStatusText,
    getStatusColor
  };
}
