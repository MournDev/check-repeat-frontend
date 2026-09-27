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
    <!-- 页面标题 -->
    <h2 class="page-title">查重任务管理</h2>
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="loadTaskList">
        <template #icon><Refresh /></template>
        刷新任务列表
      </el-button>
      <el-button @click="goToPaperSubmit" style="margin-left: 8px">
        <template #icon><Upload /></template>
        提交新论文
      </el-button>
      
      <!-- 连接状态指示器 -->
      <div class="connection-status" style="margin-left: auto">
        <el-tooltip :content="isConnected ? '实时推送已连接，可实时查看查重进度' : '未连接实时推送，将使用轮询获取进度'">
          <el-badge :value="isConnected ? '已连接' : '未连接'" :type="isConnected ? 'success' : 'warning'" />
        </el-tooltip>
      </div>
    </div>

    <!-- 任务统计 -->
    <div class="task-stats">
      <el-card class="stat-card">
        <div class="stat-item">
          <span class="stat-label">总任务数</span>
          <span class="stat-value">{{ taskStats.total }}</span>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-item">
          <span class="stat-label">已完成</span>
          <span class="stat-value">{{ taskStats.completed }}</span>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-item">
          <span class="stat-label">查重中</span>
          <span class="stat-value">{{ taskStats.checking }}</span>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-item">
          <span class="stat-label">失败</span>
          <span class="stat-value">{{ taskStats.failure }}</span>
        </div>
      </el-card>
    </div>

    <!-- 当前查重规则 -->
    <el-card v-if="checkRule" class="rule-info-card">
      <template #header>
        <div class="table-header">
          <span>当前查重规则</span>
          <el-tag size="small" type="info">{{ checkRule.ruleName }}</el-tag>
        </div>
      </template>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="通过阈值">
          <el-tag :type="checkRule.passThreshold <= 20 ? 'success' : 'warning'">
            {{ checkRule.passThreshold }}%
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最大查重次数">
          {{ checkRule.maxCheckCount || '不限制' }}
        </el-descriptions-item>
        <el-descriptions-item label="最大重提次数">
          {{ checkRule.maxReSubmitCount || '不限制' }}
        </el-descriptions-item>
        <el-descriptions-item label="查重间隔">
          {{ checkRule.checkInterval ? checkRule.checkInterval + '秒' : '无限制' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 查重任务列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>查重任务列表</span>
        </div>
      </template>
      
      <el-table :data="currentPageData" style="width: 100%" :loading="loading">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="paperTitle" label="论文标题" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.paperTitle" placement="top">
              <span class="ellipsis">{{ row.paperTitle }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="checkStatus" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.checkStatus)">
              {{ getStatusText(row.checkStatus) }}
            </el-tag>
            <div v-if="row.checkStatus === 'FAILURE' && row.failReason" class="fail-reason">
              <el-tooltip :content="row.failReason" placement="top">
                <span class="fail-text">{{ row.failReason }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="相似度" width="150">
          <template #default="{ row }">
            <span v-if="row.checkRate != null">
              {{ row.checkRate }}%
              <el-tag :type="getSimilarityColor(row.checkRate)" size="small" style="margin-left: 4px">
                {{ getRiskLevel(row.checkRate) }}
              </el-tag>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="进度">
          <template #default="{ row }">
            <div v-if="row.checkStatus === 'checking'">
              <el-progress
                :percentage="getProgress(row.taskId).percent"
                :status="getProgress(row.taskId).status"
              >
                <template #default="{ percentage }">
                  {{ getProgress(row.taskId).message || `${percentage}%` }}
                </template>
              </el-progress>
            </div>
            <div v-else-if="row.checkStatus === 'completed'">
              <el-progress :percentage="100" status="success">
                <template #default>100%</template>
              </el-progress>
            </div>
            <div v-else-if="row.checkStatus === 'failure'">
              <el-progress :percentage="100" status="exception">
                <template #default>失败</template>
              </el-progress>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              @click="startCheckTask(row.paperId)"
              :disabled="row.checkStatus === 'checking'"
              style="margin-right: 8px"
              size="small"
            >
              开始查重
            </el-button>
            <el-button 
              v-if="row.checkStatus === 'completed' && row.reportId" 
              @click="viewReport(row.reportId)"
              style="margin-right: 8px"
              size="small"
            >
              查看报告
            </el-button>
            <el-button 
              v-else-if="row.checkStatus === 'completed'"
              @click="recheckPlagiarism(row.paperId)"
              style="margin-right: 8px"
              size="small"
            >
              重新查重
            </el-button>
            <el-button 
              v-if="row.checkStatus !== 'checking'" 
              type="danger" 
              @click="deleteTask(row.taskId)"
              size="small"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="taskList.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 报告查看对话框 -->
    <el-dialog
      v-model="reportModalVisible"
      title="查重报告"
      width="80%"
      destroy-on-close
    >
      <div v-if="reportData" class="report-content">
        <h3>{{ reportData.targetPaperTitle }}</h3>
        <p>总体相似度：{{ reportData.overallSimilarity }}%</p>
        <p>风险等级：<el-tag :type="getSimilarityColor(reportData.overallSimilarity)">{{ reportData.riskLevel }}</el-tag></p>
        <div class="report-sections">
          <h4>相似段落</h4>
          <div v-if="reportData.similarSegments && reportData.similarSegments.length > 0">
            <el-card v-for="(segment, index) in reportData.similarSegments" :key="index" class="mb-4">
              <template #header>
                <div class="card-header">
                  <span>{{ segment.paperTitle }}</span>
                  <span class="author-info">{{ segment.author }} - {{ segment.college }}</span>
                </div>
              </template>
              <div class="similarity-info">
                <el-progress :percentage="segment.similarity" :stroke-width="8" />
                <span class="similarity-value">{{ segment.similarity }}%</span>
              </div>
              <div v-if="segment.repeatedFragments && segment.repeatedFragments.length > 0" class="repeated-fragments">
                <h5>重复片段：</h5>
                <div v-for="(fragment, fragIndex) in segment.repeatedFragments" :key="fragIndex" class="fragment-item">
                  {{ fragment }}
                </div>
              </div>
            </el-card>
          </div>
          <p v-else>未发现相似内容</p>
        </div>
        <div class="report-recommendations">
          <h4>建议措施</h4>
          <div v-if="reportData.recommendations && reportData.recommendations.length > 0">
            <div v-for="(recommendation, index) in reportData.recommendations" :key="index" class="recommendation-item">
              {{ index + 1 }}. {{ recommendation }}
            </div>
          </div>
          <p v-else>无建议措施</p>
        </div>
      </div>
      <div v-else class="loading">
        <div class="loading-text">加载报告中...</div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportModalVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportReport(reportId)">
            导出报告
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElButton, ElTable, ElTag, ElProgress, ElTooltip, ElBadge, ElMessageBox, ElCard, ElPagination, ElDescriptions, ElDescriptionsItem } from 'element-plus';
import { Refresh, Upload } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useCheckProgress } from '@/composables/useCheckProgress';
import * as studentApi from '@/api/student';
import dayjs from 'dayjs';

const router = useRouter();

// WebSocket 连接
const { connect, disconnect, progress, isConnected } = useCheckProgress();

// 当前查重的任务 ID
const currentTaskId = ref(null);

// 任务进度映射，存储多个任务的进度
const taskProgressMap = ref(new Map());

// 任务列表
const taskList = ref([]);

// 加载状态
const loading = ref(false);

// 报告模态框
const reportModalVisible = ref(false);
const reportId = ref(null);
const reportData = ref(null);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 查重规则
const checkRule = ref(null);

// 任务统计
const taskStats = computed(() => {
  const total = taskList.value.length;
  const completed = taskList.value.filter(task => task.checkStatus === 'completed').length;
  const checking = taskList.value.filter(task => task.checkStatus === 'checking').length;
  const failure = taskList.value.filter(task => task.checkStatus === 'failure').length;
  
  return {
    total,
    completed,
    checking,
    failure
  };
});

// 当前页数据
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return taskList.value.slice(start, end);
});

// 分页事件处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
};

/**
 * 加载任务列表
 */
const loadTaskList = async () => {
  try {
    loading.value = true;
    const result = await studentApi.getStudentCheckTasks();
    if (result.code === 200) {
      taskList.value = result.data || [];
    } else {
      ElMessage.error(result.msg || '获取任务列表失败');
      taskList.value = [];
    }
  } catch (error) {
    console.error('获取任务列表失败', error);
    ElMessage.error('获取任务列表失败，请稍后重试');
    taskList.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 开始查重任务
 */
const startCheckTask = async (paperId) => {
  if (!paperId) {
    ElMessage.error('论文ID不能为空');
    return;
  }
  
  try {
    // 1. 调用后端接口创建查重任务
    const result = await studentApi.createCheckTask(paperId);
    
    if (result.code === 200) {
      const taskId = result.data?.taskId;
      if (!taskId) {
        ElMessage.error('任务创建成功但未返回任务ID');
        return;
      }
      
      currentTaskId.value = taskId;
      
      // 2. 连接到 WebSocket
      connect(taskId, (data) => {
        // 处理 WebSocket 消息
        if (data.type === 'progress' || data.type === 'complete' || data.type === 'error') {
          // 更新任务进度映射
          taskProgressMap.value.set(taskId, {
            percent: data.progress || 0,
            status: data.type === 'error' ? 'exception' : (data.type === 'complete' ? 'success' : ''),
            message: data.message || ''
          });
          
          if (data.type === 'complete' || data.type === 'error') {
            // 任务完成或失败时，更新单个任务
            studentApi.getCheckTaskById(taskId).then(res => {
              if (res.code === 200 && res.data) {
                updateSingleTask(res.data);
              }
            });
          }
        }
      });
      
      ElMessage.success(result.msg || '查重任务已创建，正在处理中...');
      
      // 3. 轮询兜底（如果 WebSocket 失败）
      startPolling(taskId, paperId);
    } else {
      ElMessage.error(result.msg || '查重任务创建失败');
    }
  } catch (error) {
    console.error('创建查重任务失败', error);
    ElMessage.error('查重任务创建失败，请稍后重试');
  }
};

/**
 * 重新查重
 */
const recheckPlagiarism = async (paperId) => {
  if (!paperId) {
    ElMessage.error('论文ID不能为空');
    return;
  }
  
  try {
    const result = await studentApi.recheckPlagiarism(paperId);
    if (result.code === 200) {
      const taskId = result.data?.taskId;
      ElMessage.success('重新查重任务已创建');
      
      // 如果返回了任务ID，开始轮询更新
      if (taskId) {
        currentTaskId.value = taskId;
        connect(taskId, (data) => {
          if (data.type === 'progress' || data.type === 'complete' || data.type === 'error') {
            // 更新任务进度映射
            taskProgressMap.value.set(taskId, {
              percent: data.progress || 0,
              status: data.type === 'error' ? 'exception' : (data.type === 'complete' ? 'success' : ''),
              message: data.message || ''
            });
            
            if (data.type === 'complete' || data.type === 'error') {
              studentApi.getCheckTaskById(taskId).then(res => {
                if (res.code === 200 && res.data) {
                  updateSingleTask(res.data);
                }
              });
            }
          }
        });
        startPolling(taskId, paperId);
      } else {
        // 如果没有返回任务ID，刷新列表
        loadTaskList();
      }
    } else {
      ElMessage.error(result.msg || '重新查重失败');
    }
  } catch (error) {
    console.error('重新查重失败', error);
    ElMessage.error('重新查重失败，请稍后重试');
  }
};

/**
 * 查看报告
 */
const viewReport = async (reportIdValue) => {
  if (!reportIdValue) {
    ElMessage.error('报告ID不能为空');
    return;
  }
  
  try {
    reportId.value = reportIdValue;
    reportModalVisible.value = true;
    reportData.value = null;
    
    const result = await studentApi.getDetailedCheckReport(reportIdValue);
    if (result.code === 200) {
      reportData.value = result.data || {};
    } else {
      ElMessage.error(result.msg || '获取报告失败');
      reportData.value = {};
    }
  } catch (error) {
    console.error('获取报告失败', error);
    ElMessage.error('获取报告失败，请稍后重试');
    reportData.value = {};
  }
};

/**
 * 导出报告
 */
const exportReport = async (reportIdValue) => {
  if (!reportIdValue) {
    ElMessage.error('报告ID不能为空');
    return;
  }
  
  try {
    const result = await studentApi.exportCheckReport(reportIdValue, 'pdf');
    
    if (!result) {
      ElMessage.error('导出失败：未返回文件数据');
      return;
    }
    
    // 创建下载链接
    const blob = result.data instanceof Blob ? result.data : new Blob([result.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `查重报告_${new Date().getTime()}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success('报告导出成功');
  } catch (error) {
    console.error('导出报告失败', error);
    ElMessage.error('导出报告失败，请稍后重试');
  }
};

/**
 * 删除任务
 */
const deleteTask = async (taskId) => {
  if (!taskId) {
    ElMessage.error('任务ID不能为空');
    return;
  }
  
  ElMessageBox.confirm(
    '确定要删除该查重任务吗？删除后无法恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  .then(async () => {
    try {
      const result = await studentApi.deleteCheckTask(taskId);
      if (result.code === 200) {
        ElMessage.success('任务删除成功');
        loadTaskList();
      } else {
        ElMessage.error(result.msg || '删除任务失败');
      }
    } catch (error) {
      console.error('删除任务失败', error);
      ElMessage.error('删除任务失败，请稍后重试');
    }
  })
  .catch(() => {
    // 取消删除
  });
};

/**
 * 跳转到论文提交页面
 */
const goToPaperSubmit = () => {
  router.push('/student/paper-submit');
};

/**
 * 获取任务进度（从响应式对象）
 */
const getProgress = (taskId) => {
  // 首先从任务进度映射中获取进度
  if (taskProgressMap.value.has(taskId)) {
    return taskProgressMap.value.get(taskId);
  }
  
  // 如果是当前任务，使用全局进度
  if (currentTaskId.value === taskId) {
    return {
      percent: progress.percent,
      status: progress.status === 'exception' ? 'exception' : (progress.status === 'success' ? 'success' : ''),
      message: progress.message
    };
  }
  
  // 默认返回空进度
  return { percent: 0, status: '', message: '' };
};

/**
   * 轮询兜底机制（WebSocket + 轮询双保险）
   */
let pollingTimer = null;
const startPolling = (taskId, paperId) => {
  if (!taskId) {
    return;
  }
  
  const poll = async () => {
    try {
      const res = await studentApi.getCheckTaskById(taskId);
      if (res.code === 200 && res.data) {
        const task = res.data;
        
        // 如果任务已完成或失败，停止轮询
        if (task.checkStatus === 'COMPLETED' || task.checkStatus === 'FAILURE') {
          stopPolling();
          // 只更新单个任务，不刷新整个列表
          updateSingleTask(task);
        }
      }
    } catch (error) {
      console.error('轮询失败', error);
    }
  };

  // 每 5 秒轮询一次，减少频率
  pollingTimer = setInterval(poll, 5000);
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

/**
 * 更新单个任务状态，实现无感刷新
 */
const updateSingleTask = (updatedTask) => {
  if (!updatedTask || !updatedTask.taskId) {
    return;
  }
  
  // 找到任务列表中对应的任务
  const taskIndex = taskList.value.findIndex(task => task.taskId === updatedTask.taskId);
  
  if (taskIndex !== -1) {
    // 更新任务状态
    taskList.value[taskIndex] = { ...taskList.value[taskIndex], ...updatedTask };
    
    // 显示成功消息，但避免频繁提示
    if (updatedTask.checkStatus === 'COMPLETED') {
      ElMessage.success('查重完成！');
    } else if (updatedTask.checkStatus === 'FAILURE') {
      ElMessage.error(updatedTask.failReason || '查重失败');
    }
  }
};

/**
 * 获取状态颜色
 */
const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    checking: 'primary',
    completed: 'success',
    failure: 'danger',
    cancelled: 'info'
  };
  return colors[status] || 'info';
};

/**
 * 格式化时间
 */
const formatTime = (time) => {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 获取状态文本
 */
const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    checking: '查重中',
    completed: '已完成',
    failure: '失败',
    cancelled: '已取消'
  };
  return texts[status] || status;
};

/**
 * 获取相似度颜色
 */
const getSimilarityColor = (similarity) => {
  if (similarity < 15) return 'success';
  if (similarity < 30) return 'warning';
  if (similarity < 50) return 'danger';
  return 'danger';
};

/**
 * 获取风险等级
 */
const getRiskLevel = (similarity) => {
  if (similarity < 15) return '低风险';
  if (similarity < 30) return '中等风险';
  if (similarity < 50) return '高风险';
  return '极高风险';
};

// 组件挂载时加载任务列表和查重规则
onMounted(() => {
  loadTaskList();
  loadCheckRule();
});

/**
 * 加载查重规则
 */
const loadCheckRule = async () => {
  try {
    const res = await studentApi.getDefaultCheckRule();
    if (res.code === 200 && res.data) {
      checkRule.value = res.data;
    }
  } catch (e) {
    // 规则加载失败不影响主功能
    console.warn('加载查重规则失败:', e);
  }
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

  .page-title {
    margin-bottom: 24px;
    color: #1d1d1f;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .action-bar {
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: #f5f5f7;
    border-radius: 11px;
  }

  .connection-status {
    display: flex;
    align-items: center;
  }

  .task-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    flex: 1;
    min-width: 120px;
  }

  .rule-info-card {
    margin-bottom: 24px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
  }

  .stat-label {
    font-size: 17px;
    color: #86868b;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #0066cc;
  }

  .table-card {
    margin-bottom: 24px;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .fail-reason {
    margin-top: 4px;
  }

  .fail-text {
    font-size: 12px;
    color: #f5222d;
    word-break: break-all;
    max-width: 100%;
    display: block;
  }

  .report-content {
    max-height: 600px;
    overflow-y: auto;

    h3 {
      margin-bottom: 16px;
      color: #0066cc;
    }

    h4 {
      margin: 16px 0 8px 0;
      color: #1d1d1f;
    }

    h5 {
      margin: 8px 0;
      color: #86868b;
    }

    p {
      margin: 8px 0;
    }

    .report-sections {
      margin: 16px 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 11px;
    }

    .report-recommendations {
      margin: 16px 0;
      padding: 16px;
      background-color: #f5f5f7;
      border-radius: 11px;
    }

    .similarity-info {
      display: flex;
      align-items: center;
      margin: 8px 0;

      .similarity-value {
        margin-left: 8px;
        font-weight: bold;
      }
    }

    .repeated-fragments {
      margin-top: 8px;
      padding: 8px;
      background-color: #fff1f0;
      border-radius: 11px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .author-info {
    font-size: 12px;
    color: #86868b;
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  .fragment-item {
    padding: 8px;
    background-color: #fff;
    border-radius: 11px;
    margin-bottom: 8px;
    border-left: 3px solid #f56c6c;
  }

  .recommendation-item {
    padding: 8px;
    background-color: #f5f5f7;
    border-radius: 11px;
    margin-bottom: 8px;
    border-left: 3px solid #67c23a;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
  }

  .loading-text {
    font-size: 16px;
    color: #86868b;
  }
}
</style>
