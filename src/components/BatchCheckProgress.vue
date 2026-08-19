<template>
  <div class="batch-check-progress">
    <!-- 总体进度卡片 -->
    <el-card class="overall-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><DataLine /></el-icon>
          <span>批量查重进度</span>
          <el-tag :type="getOverallTagType">{{ overallProgress }}%</el-tag>
        </div>
      </template>
      
      <div class="overall-content">
        <el-progress 
          :percentage="overallProgress" 
          :stroke-width="20"
          striped
          striped-flow
        />
        
        <div class="statistics">
          <div class="stat-item">
            <el-icon><Document /></el-icon>
            <span class="label">总数</span>
            <span class="value">{{ statistics.total }}</span>
          </div>
          <div class="stat-item processing">
            <el-icon><Loading /></el-icon>
            <span class="label">进行中</span>
            <span class="value">{{ statistics.processing }}</span>
          </div>
          <div class="stat-item completed">
            <el-icon><Check /></el-icon>
            <span class="label">已完成</span>
            <span class="value">{{ statistics.completed }}</span>
          </div>
          <div class="stat-item failed">
            <el-icon><Close /></el-icon>
            <span class="label">失败</span>
            <span class="value">{{ statistics.failed }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="tasks-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><List /></el-icon>
          <span>任务详情</span>
          <el-button text @click="refreshAll">
            <el-icon><Refresh /></el-icon>
            刷新全部
          </el-button>
        </div>
      </template>
      
      <div class="task-list">
        <div 
          v-for="(task, index) in tasks" 
          :key="index"
          class="task-item"
          :class="task.status"
        >
          <div class="task-header">
            <div class="task-info">
              <span class="task-title">论文 #{{ task.paperId }}</span>
              <el-tag :type="getStatusColor(task.status)" size="small">
                {{ getStatusText(task.status) }}
              </el-tag>
            </div>
            <div class="task-progress">
              <span>{{ task.progress }}%</span>
            </div>
          </div>
          
          <el-progress 
            :percentage="task.progress" 
            :status="task.status === 'failed' ? 'exception' : undefined"
            :stroke-width="12"
          />
          
          <div class="task-message">
            <el-icon><Bell /></el-icon>
            <span>{{ task.message }}</span>
          </div>
          
          <div v-if="task.waitTime > 0" class="task-estimate">
            <el-icon><Timer /></el-icon>
            <span>预计等待：{{ formatTime(task.waitTime) }}</span>
          </div>
        </div>
        
        <el-empty v-if="tasks.length === 0" description="暂无批量查重任务" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 
  DataLine, Document, Loading, Check, Close, List, Refresh, Bell, Timer
} from '@element-plus/icons-vue';
import { useBatchCheckProgress } from '@/composables/useBatchCheckProgress';

const props = defineProps({
  paperIds: {
    type: Array,
    default: () => []
  }
});

const { 
  startBatchCheck, 
  tasks, 
  overallProgress, 
  statistics,
  isBatchProcessing,
  getStatusText,
  getStatusColor
} = useBatchCheckProgress();

// 计算总体标签类型
const getOverallTagType = computed(() => {
  if (overallProgress.value < 30) return 'success';
  if (overallProgress.value < 70) return 'warning';
  return 'danger';
});

/**
 * 格式化时间
 */
const formatTime = (seconds) => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};

/**
 * 刷新全部
 */
const refreshAll = () => {
  // TODO: 实现刷新逻辑
};

// 监听 paperIds 变化，自动开始
watch(() => props.paperIds, (newVal) => {
  if (newVal && newVal.length > 0) {
    startBatchCheck(newVal);
  }
}, { immediate: true });
</script>

<style scoped lang="scss">
.batch-check-progress {
  .overall-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
      
      .el-tag {
        margin-left: auto;
      }
    }
    
    .overall-content {
      .statistics {
        display: flex;
        justify-content: space-around;
        margin-top: 24px;
        padding: 16px 0;
        background: #f5f7fa;
        border-radius: 8px;
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          
          .el-icon {
            font-size: 24px;
            color: #909399;
          }
          
          .label {
            font-size: 14px;
            color: #909399;
          }
          
          .value {
            font-size: 20px;
            font-weight: 700;
            color: #606266;
          }
          
          &.processing {
            .el-icon, .value {
              color: #409eff;
            }
          }
          
          &.completed {
            .el-icon, .value {
              color: #67c23a;
            }
          }
          
          &.failed {
            .el-icon, .value {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
  
  .tasks-card {
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
      
      .el-button {
        margin-left: auto;
      }
    }
    
    .task-list {
      .task-item {
        padding: 16px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        margin-bottom: 16px;
        transition: all 0.3s ease;
        
        &.pending {
          background: #f5f7fa;
        }
        
        &.processing {
          background: #ecf5ff;
          border-color: #409eff;
        }
        
        &.completed {
          background: #f0f9eb;
          border-color: #67c23a;
        }
        
        &.failed {
          background: #fef0f0;
          border-color: #f56c6c;
        }
        
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          
          .task-info {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .task-title {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }
          }
          
          .task-progress {
            font-size: 14px;
            font-weight: 600;
            color: #409eff;
          }
        }
        
        .task-message {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          font-size: 13px;
          color: #606266;
        }
        
        .task-estimate {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}
</style>
