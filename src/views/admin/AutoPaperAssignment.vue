<template>
  <div class="auto-assignment">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">自动论文分配</h1>
        <p class="page-desc">基于智能算法自动分配指导老师，支持多种分配策略</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="MagicStick" @click="handleStartAutoAssignment" :loading="processing">
          开始自动分配
        </el-button>
        <el-button :icon="Setting" @click="showAlgorithmConfig">
          算法配置
        </el-button>
        <el-button :icon="Refresh" @click="refreshData">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 算法配置面板 -->
    <el-row :gutter="16" class="config-panel">
      <el-col :span="16">
        <el-card class="algorithm-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Setting /></el-icon>
                分配算法配置
              </span>
            </div>
          </template>
          
          <el-form :model="algorithmConfig" label-width="120px" class="config-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="分配策略">
                  <el-select v-model="algorithmConfig.strategy" style="width: 100%">
                    <el-option label="专业优先" value="major_first"></el-option>
                    <el-option label="负载均衡" value="load_balanced"></el-option>
                    <el-option label="综合匹配" value="comprehensive"></el-option>
                    <el-option label="随机分配" value="random"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="最大指导人数">
                  <el-input-number 
                    v-model="algorithmConfig.maxLoad" 
                    :min="1" 
                    :max="30" 
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="专业匹配权重">
                  <el-slider 
                    v-model="algorithmConfig.majorWeight" 
                    :min="0" 
                    :max="100" 
                    show-input
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="兴趣匹配权重">
                  <el-slider 
                    v-model="algorithmConfig.interestWeight" 
                    :min="0" 
                    :max="100" 
                    show-input
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="负载均衡权重">
                  <el-slider 
                    v-model="algorithmConfig.loadWeight" 
                    :min="0" 
                    :max="100" 
                    show-input
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="经验权重">
                  <el-slider 
                    v-model="algorithmConfig.experienceWeight" 
                    :min="0" 
                    :max="100" 
                    show-input
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="排除已满教师">
              <el-switch v-model="algorithmConfig.excludeFullTeachers" />
            </el-form-item>
            
            <el-form-item label="允许跨专业分配">
              <el-switch v-model="algorithmConfig.allowCrossMajor" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveAlgorithmConfigMethod">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Histogram /></el-icon>
                分配预览
              </span>
            </div>
          </template>
          
          <div class="preview-stats">
            <div class="preview-item">
              <div class="preview-label">待分配学生</div>
              <div class="preview-value">{{ previewStats.unassigned }}</div>
            </div>
            <div class="preview-item">
              <div class="preview-label">可用教师</div>
              <div class="preview-value">{{ previewStats.availableTeachers }}</div>
            </div>
            <div class="preview-item">
              <div class="preview-label">预计分配</div>
              <div class="preview-value success">{{ previewStats.expectedAssigned }}</div>
            </div>
            <div class="preview-item">
              <div class="preview-label">可能冲突</div>
              <div class="preview-value warning">{{ previewStats.potentialConflicts }}</div>
            </div>
          </div>
          
          <div class="weight-distribution" v-if="algorithmConfig.strategy === 'comprehensive'">
            <h4>权重分布</h4>
            <div class="weights">
              <div class="weight-item">
                <span>专业匹配</span>
                <el-progress 
                  :percentage="algorithmConfig.majorWeight" 
                  :show-text="false" 
                  stroke-width="8"
                />
              </div>
              <div class="weight-item">
                <span>兴趣匹配</span>
                <el-progress 
                  :percentage="algorithmConfig.interestWeight" 
                  :show-text="false" 
                  stroke-width="8"
                  status="success"
                />
              </div>
              <div class="weight-item">
                <span>负载均衡</span>
                <el-progress 
                  :percentage="algorithmConfig.loadWeight" 
                  :show-text="false" 
                  stroke-width="8"
                  status="warning"
                />
              </div>
              <div class="weight-item">
                <span>经验因素</span>
                <el-progress 
                  :percentage="algorithmConfig.experienceWeight" 
                  :show-text="false" 
                  stroke-width="8"
                  status="exception"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 执行历史 -->
    <el-card class="history-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Document /></el-icon>
            执行历史
          </span>
          <el-button text :icon="Refresh" @click="loadHistory">刷新</el-button>
        </div>
      </template>
      
      <el-table :data="executionHistory" style="width: 100%" v-loading="historyLoading">
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="strategy" label="策略" width="120">
          <template #default="{ row }">
            <el-tag :type="getStrategyTag(row.strategy)">
              {{ getStrategyName(row.strategy) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalStudents" label="学生数" width="100"></el-table-column>
        <el-table-column prop="assignedCount" label="已分配" width="100"></el-table-column>
        <el-table-column prop="successRate" label="成功率" width="100">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.successRate" 
              :status="row.successRate >= 90 ? 'success' : row.successRate >= 70 ? 'warning' : 'exception'"
              :show-text="false"
              style="width: 80px"
            />
            <span style="margin-left: 8px">{{ row.successRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="viewExecutionDetail(row)">
              查看详情
            </el-button>
            <el-button 
              v-if="row.status === 'completed'" 
              size="small" 
              type="success" 
              text 
              @click="applyAssignment(row)"
            >
              应用结果
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 执行进度对话框 -->
    <el-dialog
      v-model="progressDialogVisible"
      title="自动分配进度"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="progress-content">
        <div class="progress-info">
          <div class="current-step">当前步骤: {{ currentStep }}</div>
          <div class="progress-stats">
            已处理: {{ processedCount }}/{{ totalCount }} 学生
          </div>
        </div>
        
        <el-progress 
          :percentage="progressPercentage" 
          :status="processingStatus"
          :stroke-width="12"
          striped
          striped-flow
        />
        
        <div class="step-details" v-if="currentDetails">
          <h4>详细信息</h4>
          <div class="details-content">
            <div 
              v-for="(detail, index) in currentDetails" 
              :key="index"
              class="detail-item"
            >
              <span class="student-name">{{ detail.studentName }}</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              <span class="teacher-name">{{ detail.teacherName }}</span>
              <el-tag 
                :type="detail.conflict ? 'danger' : 'success'" 
                size="small"
              >
                {{ detail.conflict ? '冲突' : '匹配' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button 
          v-if="processingStatus === 'exception'" 
          type="primary" 
          @click="retryAssignment"
        >
          重试
        </el-button>
        <el-button @click="cancelAssignment">取消</el-button>
      </template>
    </el-dialog>

    <!-- 执行详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="执行详情"
      width="800px"
    >
      <div v-if="currentExecution" class="execution-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行时间">
            {{ formatDate(currentExecution.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="分配策略">
            {{ getStrategyName(currentExecution.strategy) }}
          </el-descriptions-item>
          <el-descriptions-item label="处理学生数">
            {{ currentExecution.totalStudents }}
          </el-descriptions-item>
          <el-descriptions-item label="成功分配">
            {{ currentExecution.assignedCount }}
          </el-descriptions-item>
          <el-descriptions-item label="成功率">
            <el-progress 
              :percentage="currentExecution.successRate" 
              :status="currentExecution.successRate >= 90 ? 'success' : currentExecution.successRate >= 70 ? 'warning' : 'exception'"
              :show-text="false"
              style="width: 100px; display: inline-block; vertical-align: middle;"
            />
            <span style="margin-left: 8px">{{ currentExecution.successRate }}%</span>
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            {{ formatDuration(currentExecution.duration) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-section">
          <h3>分配结果详情</h3>
          <el-table :data="currentExecution.results" style="width: 100%" max-height="400">
            <el-table-column prop="studentName" label="学生姓名" width="120"></el-table-column>
            <el-table-column prop="studentId" label="学号" width="120"></el-table-column>
            <el-table-column prop="major" label="专业" width="150">
              <template #default="{ row }">
                <el-tag size="small">{{ getMajorName(row.major) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignedTeacher" label="分配导师" width="120"></el-table-column>
            <el-table-column prop="matchScore" label="匹配度" width="100">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.matchScore" 
                  :status="row.matchScore >= 80 ? 'success' : row.matchScore >= 60 ? 'warning' : 'exception'"
                  :show-text="false"
                  style="width: 60px"
                />
                <span style="margin-left: 5px">{{ row.matchScore }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="conflict" label="冲突状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.conflict ? 'danger' : 'success'">
                  {{ row.conflict ? '有冲突' : '无冲突' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="currentExecution?.status === 'completed'" 
          type="primary" 
          @click="applyAssignment(currentExecution)"
        >
          应用此次分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入API接口
import {
  getAlgorithmConfig,
  saveAlgorithmConfig,
  getAssignmentPreview,
  startAutoAssignment,
  getAssignmentProgress,
  cancelAssignmentTask,
  getAssignmentHistory,
  getAssignmentDetail,
  applyAssignmentResult,
  refreshAssignmentData
} from '@/api/admin/autoAssignment'

// 图标导入
import {
  MagicStick, Setting, Refresh, Histogram, Document, ArrowRight
} from '@element-plus/icons-vue'

// 响应式数据
const processing = ref(false)
const historyLoading = ref(false)
const progressDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentExecution = ref(null)
const currentStep = ref('')
const processedCount = ref(0)
const totalCount = ref(0)
const currentDetails = ref([])
const currentTaskId = ref(null)
const progressInterval = ref(null)

// 算法配置
const algorithmConfig = reactive({
  strategy: 'comprehensive',
  maxLoad: 12,
  majorWeight: 40,
  interestWeight: 25,
  loadWeight: 20,
  experienceWeight: 15,
  excludeFullTeachers: true,
  allowCrossMajor: false
})

// 预览统计数据
const previewStats = ref({
  unassigned: 0,
  availableTeachers: 0,
  expectedAssigned: 0,
  potentialConflicts: 0
})

// 执行历史
const executionHistory = ref([])

// 计算属性
const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((processedCount.value / totalCount.value) * 100)
})

const processingStatus = computed(() => {
  if (processing.value) return 'active'
  return 'success'
})

// 方法
const refreshData = async () => {
  try {
    // 然后刷新其他数据
    await Promise.all([
      loadPreviewData(),
      loadHistory()
    ])
    await refreshAssignmentData()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败: ' + error.message)
  }
}

const showAlgorithmConfig = async () => {
  try {
    const res = await getAlgorithmConfig()
    if (res.code === 200) {
      Object.assign(algorithmConfig, res.data)
      ElMessage.success('算法配置加载成功')
    }
  } catch (error) {
    ElMessage.error('获取算法配置失败: ' + error.message)
  }
}

const saveAlgorithmConfigMethod = async () => {
  try {
    const res = await saveAlgorithmConfig(algorithmConfig)
    if (res.code === 200) {
      ElMessage.success('算法配置保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存算法配置失败: ' + error.message)
  }
}

const loadPreviewData = async () => {
  try {
    const res = await getAssignmentPreview()
    if (res.code === 200) {
      previewStats.value = res.data
    }
  } catch (error) {
    console.error('加载预览数据失败:', error)
    ElMessage.error('加载预览数据失败: ' + error.message)
  }
}

const handleStartAutoAssignment = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要开始自动分配吗？系统将根据当前配置进行智能分配。',
      '确认自动分配',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    processing.value = true
    progressDialogVisible.value = true
    processedCount.value = 0
    totalCount.value = previewStats.value.unassigned
    currentStep.value = '初始化算法引擎'
    
    // 调用后端接口启动分配
    const res = await startAutoAssignment({ config: algorithmConfig })
    if (res.code === 200) {
      currentTaskId.value = res.data.taskId
      // 开始轮询进度
      startProgressPolling()
    } else {
      throw new Error(res.message || '启动分配失败')
    }
  } catch (error) {
    processing.value = false
    progressDialogVisible.value = false
    if (error.message !== 'cancel') {
      ElMessage.error('启动自动分配失败: ' + error.message)
    }
  }
}

const startProgressPolling = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
  }
  
  progressInterval.value = setInterval(async () => {
    try {
      const res = await getAssignmentProgress(currentTaskId.value)
      if (res.code === 200) {
        const progress = res.data
        currentStep.value = progress.currentStep
        processedCount.value = progress.processedCount
        totalCount.value = progress.totalCount
        currentDetails.value = progress.details || []
        
        if (progress.status === 'completed' || progress.status === 'failed') {
          stopProgressPolling()
          processing.value = false
          if (progress.status === 'completed') {
            ElMessage.success('自动分配完成！')
          } else {
            ElMessage.error('自动分配失败')
          }
          await loadHistory()
        }
      }
    } catch (error) {
      console.error('获取进度失败:', error)
    }
  }, 2000) // 每2秒轮询一次
}

const stopProgressPolling = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
}

const cancelAssignment = async () => {
  try {
    if (currentTaskId.value) {
      await cancelAssignmentTask(currentTaskId.value)
    }
    stopProgressPolling()
    processing.value = false
    progressDialogVisible.value = false
    ElMessage.info('已取消自动分配')
  } catch (error) {
    ElMessage.error('取消分配失败: ' + error.message)
  }
}

const retryAssignment = () => {
  handleStartAutoAssignment()
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const params = {
      page: 1,
      size: 10
    }
    const res = await getAssignmentHistory(params)
    if (res.code === 200) {
      executionHistory.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败: ' + error.message)
  } finally {
    historyLoading.value = false
  }
}

const viewExecutionDetail = async (record) => {
  try {
    const res = await getAssignmentDetail(record.id)
    if (res.code === 200) {
      currentExecution.value = res.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取详情失败')
    }
  } catch (error) {
    ElMessage.error('获取执行详情失败: ' + error.message)
  }
}

const applyAssignment = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确定要应用 ${formatDate(record.startTime)} 的分配结果吗？这将覆盖当前的所有分配关系。`,
      '应用分配结果',
      {
        confirmButtonText: '确定应用',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await applyAssignmentResult(record.id)
    if (res.code === 200) {
      ElMessage.success('分配结果应用成功！')
      detailDialogVisible.value = false
      // 刷新数据
      await refreshData()
    } else {
      ElMessage.error(res.message || '应用失败')
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error('应用分配结果失败: ' + error.message)
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${seconds}秒`
}

const getStrategyName = (strategy) => {
  const strategyMap = {
    'major_first': '专业优先',
    'load_balanced': '负载均衡',
    'comprehensive': '综合匹配',
    'random': '随机分配'
  }
  return strategyMap[strategy] || strategy
}

const getStrategyTag = (strategy) => {
  const tagMap = {
    'major_first': 'primary',
    'load_balanced': 'success',
    'comprehensive': 'warning',
    'random': 'info'
  }
  return tagMap[strategy] || 'default'
}

const getStatusText = (status) => {
  const statusMap = {
    'completed': '已完成',
    'failed': '失败',
    'running': '运行中'
  }
  return statusMap[status] || status
}

const getStatusTag = (status) => {
  const tagMap = {
    'completed': 'success',
    'failed': 'danger',
    'running': 'warning'
  }
  return tagMap[status] || 'info'
}

const getMajorName = (majorCode) => {
  const majorMap = {
    'CS': '计算机科学与技术',
    'SE': '软件工程',
    'EE': '电子信息工程',
    'ME': '机械工程'
  }
  return majorMap[majorCode] || majorCode
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadPreviewData(),
    loadHistory(),
    showAlgorithmConfig()
  ])
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopProgressPolling()
})
</script>

<style lang="scss" scoped>
.auto-assignment {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  
  .header-content {
    .page-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .page-desc {
      margin: 0;
      color: #7f8c8d;
      font-size: 0.95rem;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.config-panel {
  margin-bottom: 1.5rem;
  
  .algorithm-card,
  .preview-card {
    border-radius: 12px;
    
    :deep(.el-card__header) {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f2f6;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .card-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: #2c3e50;
          
          .el-icon {
            margin-right: 0.5rem;
            color: #667eea;
          }
        }
      }
    }
  }
  
  .config-form {
    :deep(.el-form-item) {
      margin-bottom: 1.5rem;
    }
  }
  
  .preview-stats {
    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f8f9fa;
      
      &:last-child {
        border-bottom: none;
      }
      
      .preview-label {
        font-size: 0.9rem;
        color: #5a6c7d;
      }
      
      .preview-value {
        font-size: 1.2rem;
        font-weight: 600;
        color: #2c3e50;
        
        &.success {
          color: #4facfe;
        }
        
        &.warning {
          color: #f5576c;
        }
      }
    }
  }
  
  .weight-distribution {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f1f2f6;
    
    h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1rem;
    }
    
    .weights {
      .weight-item {
        margin-bottom: 1rem;
        
        span {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #5a6c7d;
        }
      }
    }
  }
}

.history-card {
  border-radius: 12px;
  margin-bottom: 1.5rem;
  
  :deep(.el-card__header) {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f1f2f6;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .card-title {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #2c3e50;
        
        .el-icon {
          margin-right: 0.5rem;
          color: #667eea;
        }
      }
    }
  }
}

.progress-content {
  .progress-info {
    margin-bottom: 1.5rem;
    
    .current-step {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    
    .progress-stats {
      font-size: 0.95rem;
      color: #5a6c7d;
    }
  }
  
  .step-details {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f1f2f6;
    
    h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }
    
    .details-content {
      max-height: 200px;
      overflow-y: auto;
      
      .detail-item {
        display: flex;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f8f9fa;
        
        &:last-child {
          border-bottom: none;
        }
        
        .student-name {
          font-weight: 500;
          color: #2c3e50;
          min-width: 80px;
        }
        
        .arrow-icon {
          margin: 0 0.75rem;
          color: #7f8c8d;
        }
        
        .teacher-name {
          color: #5a6c7d;
          min-width: 80px;
        }
      }
    }
  }
}

.execution-detail {
  .detail-section {
    margin-top: 1.5rem;
    
    h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    
    .header-actions {
      width: 100%;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .config-panel {
    .el-col {
      margin-bottom: 1rem;
    }
    
    .weight-distribution {
      .weights {
        .weight-item {
          margin-bottom: 0.75rem;
        }
      }
    }
  }
  
  .progress-content {
    .step-details {
      .details-content {
        max-height: 150px;
      }
    }
  }
}
</style>