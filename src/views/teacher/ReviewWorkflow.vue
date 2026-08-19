<template>
  <div class="review-workflow">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">审核流程管理</h1>
          <p class="page-subtitle">跟踪和管理论文审核流程状态</p>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button :type="filterStatus === 'all' ? 'primary' : ''" @click="setFilter('all')">
              全部
            </el-button>
            <el-button :type="filterStatus === 'pending' ? 'primary' : ''" @click="setFilter('pending')">
              待审核
            </el-button>
            <el-button :type="filterStatus === 'reviewing' ? 'primary' : ''" @click="setFilter('reviewing')">
              审核中
            </el-button>
            <el-button :type="filterStatus === 'completed' ? 'primary' : ''" @click="setFilter('completed')">
              已完成
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 流程概览 -->
    <el-row :gutter="16" class="workflow-overview">
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-content">
            <div class="overview-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon><Document /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-number">{{ workflowStats.total }}</div>
              <div class="overview-label">总论文数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-content">
            <div class="overview-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-number">{{ workflowStats.pending }}</div>
              <div class="overview-label">待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-content">
            <div class="overview-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon><Edit /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-number">{{ workflowStats.reviewing }}</div>
              <div class="overview-label">审核中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-content">
            <div class="overview-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon><Check /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-number">{{ workflowStats.completed }}</div>
              <div class="overview-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 流程列表 -->
    <el-card class="workflow-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><List /></el-icon>
            <span>审核流程列表</span>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索论文标题或学生姓名"
              :prefix-icon="Search"
              clearable
              style="width: 300px; margin-right: 16px;"
            />
            <el-button type="primary" :icon="Refresh" @click="refreshWorkflows">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredWorkflows"
        stripe
        v-loading="loading"
        class="workflow-table"
      >
        <el-table-column prop="title" label="论文标题" min-width="200">
          <template #default="{ row }">
            <div class="paper-title-cell">
              <div class="title-text">{{ row.title }}</div>
              <el-tag size="small" :type="getSimilarityTagType(row.similarity)">
                相似度: {{ row.similarity }}%
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        
        <el-table-column prop="majorName" label="专业" width="150" />
        
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.submitTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="当前状态" width="150">
          <template #default="{ row }">
            <el-tag :type="getWorkflowStatusType(row.workflowStatus)">
              {{ getWorkflowStatusText(row.workflowStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="审核进度" width="200">
          <template #default="{ row }">
            <div class="progress-info">
              <el-progress
                :percentage="row.progress"
                :status="getProgressStatus(row.workflowStatus)"
                :show-text="false"
                style="margin-bottom: 8px;"
              />
              <div class="progress-text">
                {{ row.currentStep }} / {{ row.totalSteps }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="预计完成时间" width="180">
          <template #default="{ row }">
            <div class="deadline-info">
              <div :class="getDeadlineClass(row.deadline)">
                {{ formatDate(row.deadline) }}
              </div>
              <div class="time-remaining" v-if="row.timeRemaining">
                剩余: {{ row.timeRemaining }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                size="small"
                :type="row.workflowStatus === 'pending' ? 'primary' : 'default'"
                @click="startReview(row)"
              >
                {{ row.workflowStatus === 'pending' ? '开始审核' : '查看详情' }}
              </el-button>
              <el-button
                size="small"
                v-if="row.workflowStatus === 'reviewing'"
                @click="continueReview(row)"
              >
                继续审核
              </el-button>
              <el-dropdown @command="handleWorkflowAction">
                <el-button size="small">
                  更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{action: 'remind', data: row}">
                      催办提醒
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'extend', data: row}">
                      延长 deadline
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'transfer', data: row}">
                      转交他人
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'history', data: row}" divided>
                      审核历史
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 审核历史对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="审核历史"
      width="70%"
    >
      <el-timeline v-if="currentHistory.length > 0">
        <el-timeline-item
          v-for="(record, index) in currentHistory"
          :key="index"
          :timestamp="formatDateTime(record.time)"
          :type="getTimelineType(record.status)"
        >
          <div class="history-record">
            <div class="reviewer-info">
              <el-avatar :size="32" :src="getAvatarUrl(record.reviewerAvatar)">
                {{ record.reviewerName.charAt(0) }}
              </el-avatar>
              <span class="reviewer-name">{{ record.reviewerName }}</span>
              <el-tag :type="getStatusTagType(record.status)" size="small">
                {{ getStatusText(record.status) }}
              </el-tag>
            </div>
            <div class="review-opinion" v-if="record.opinion">
              {{ record.opinion }}
            </div>
            <div class="review-attachments" v-if="record.attachments?.length">
              <div class="attachment-label">附件：</div>
              <div class="attachments-list">
                <el-tag
                  v-for="attachment in record.attachments"
                  :key="attachment.id"
                  type="info"
                  size="small"
                  @click="downloadAttachment(attachment)"
                >
                  {{ attachment.name }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-else class="empty-history">
        <el-empty description="暂无审核历史记录" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAvatarUrl } from '@/utils/avatar'

// 图标导入
import {
  Document, Clock, Edit, Check, List, Search, Refresh, ArrowDown
} from '@element-plus/icons-vue'

// 响应式数据
const filterStatus = ref('all')
const searchKeyword = ref('')
const workflows = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const historyDialogVisible = ref(false)
const currentHistory = ref([])

// 计算属性
const filteredWorkflows = computed(() => {
  let filtered = workflows.value
  
  // 状态过滤
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(workflow => workflow.workflowStatus === filterStatus.value)
  }
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(workflow => 
      workflow.title.toLowerCase().includes(keyword) ||
      workflow.studentName.toLowerCase().includes(keyword)
    )
  }
  
  return filtered
})

const workflowStats = computed(() => {
  return {
    total: workflows.value.length,
    pending: workflows.value.filter(w => w.workflowStatus === 'pending').length,
    reviewing: workflows.value.filter(w => w.workflowStatus === 'reviewing').length,
    completed: workflows.value.filter(w => w.workflowStatus === 'completed').length
  }
})

// 方法
const setFilter = (status) => {
  filterStatus.value = status
}

const refreshWorkflows = async () => {
  try {
    loading.value = true
    await loadWorkflows()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

const loadWorkflows = async () => {
  try {
    // 模拟数据
    workflows.value = [
      {
        id: 1,
        title: '基于深度学习的图像识别算法研究',
        studentName: '张三',
        majorName: '计算机科学与技术',
        submitTime: '2024-01-15T10:30:00',
        similarity: 15,
        workflowStatus: 'pending',
        progress: 0,
        currentStep: 0,
        totalSteps: 3,
        deadline: '2024-01-25T23:59:59',
        timeRemaining: '7天'
      },
      {
        id: 2,
        title: '大数据分析在电商推荐系统中的应用',
        studentName: '李四',
        majorName: '软件工程',
        submitTime: '2024-01-14T14:20:00',
        similarity: 8,
        workflowStatus: 'reviewing',
        progress: 66,
        currentStep: 2,
        totalSteps: 3,
        deadline: '2024-01-24T23:59:59',
        timeRemaining: '6天'
      }
    ]
    total.value = workflows.value.length
  } catch (error) {
    console.error('加载流程数据失败:', error)
  }
}

const startReview = (workflow) => {
  // 开始审核逻辑
  ElMessage.info(`开始审核论文：${workflow.title}`)
}

const continueReview = (workflow) => {
  // 继续审核逻辑
  ElMessage.info(`继续审核论文：${workflow.title}`)
}

const handleWorkflowAction = async ({ action, data }) => {
  switch (action) {
    case 'remind':
      await sendReminder(data)
      break
    case 'extend':
      await extendDeadline(data)
      break
    case 'transfer':
      await transferWorkflow(data)
      break
    case 'history':
      await showHistory(data)
      break
  }
}

const sendReminder = async (workflow) => {
  try {
    await ElMessageBox.confirm(
      `确定要向学生 ${workflow.studentName} 发送催办提醒吗？`,
      '催办提醒',
      { type: 'warning' }
    )
    // 发送提醒逻辑
    ElMessage.success('催办提醒已发送')
  } catch {
    // 用户取消
  }
}

const extendDeadline = async (workflow) => {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入延期天数：',
      '延长 deadline',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d+$/,
        inputErrorMessage: '请输入有效的天数'
      }
    )
    
    // 延期逻辑
    ElMessage.success(`deadline 已延长 ${value} 天`)
  } catch {
    // 用户取消
  }
}

const transferWorkflow = async (workflow) => {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入要转交给的教师姓名：',
      '转交审核',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    
    // 转交逻辑
    ElMessage.success(`已转交给 ${value}`)
  } catch {
    // 用户取消
  }
}

const showHistory = async (workflow) => {
  try {
    // 加载审核历史
    currentHistory.value = [
      {
        reviewerName: '王教授',
        reviewerAvatar: '',
        status: 'approve',
        opinion: '论文质量较高，建议通过。',
        time: '2024-01-16T09:30:00',
        attachments: []
      }
    ]
    historyDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载审核历史失败')
  }
}

const downloadAttachment = (attachment) => {
  // 下载附件逻辑
  ElMessage.info(`下载附件：${attachment.name}`)
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  refreshWorkflows()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  refreshWorkflows()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const getSimilarityTagType = (similarity) => {
  if (similarity >= 30) return 'danger'
  if (similarity >= 20) return 'warning'
  return 'success'
}

const getWorkflowStatusType = (status) => {
  const statusMap = {
    'pending': 'info',
    'reviewing': 'warning',
    'completed': 'success'
  }
  return statusMap[status] || 'info'
}

const getWorkflowStatusText = (status) => {
  const statusMap = {
    'pending': '待审核',
    'reviewing': '审核中',
    'completed': '已完成'
  }
  return statusMap[status] || '未知状态'
}

const getProgressStatus = (status) => {
  const statusMap = {
    'pending': '',
    'reviewing': 'warning',
    'completed': 'success'
  }
  return statusMap[status] || ''
}

const getDeadlineClass = (deadline) => {
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diff = deadlineDate - now
  
  if (diff < 0) return 'deadline-expired'
  if (diff < 24 * 60 * 60 * 1000) return 'deadline-urgent'
  if (diff < 3 * 24 * 60 * 60 * 1000) return 'deadline-warning'
  return 'deadline-normal'
}

const getStatusTagType = (status) => {
  const statusMap = {
    'approve': 'success',
    'reject': 'danger',
    'modify': 'warning',
    'defer': 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'approve': '审核通过',
    'reject': '审核不通过',
    'modify': '需要修改',
    'defer': '暂缓审核'
  }
  return statusMap[status] || '未知状态'
}

const getTimelineType = (status) => {
  const typeMap = {
    'approve': 'success',
    'reject': 'danger',
    'modify': 'warning',
    'defer': 'info'
  }
  return typeMap[status] || 'info'
}

// 生命周期
onMounted(() => {
  refreshWorkflows()
})
</script>

<style lang="scss" scoped>
.review-workflow {
  .page-header {
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      .page-subtitle {
        margin: 0;
        color: #606266;
      }
    }
  }
  
  .workflow-overview {
    margin-bottom: 20px;
    
    .overview-card {
      .overview-content {
        display: flex;
        align-items: center;
        
        .overview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 12px;
          margin-right: 16px;
          
          .el-icon {
            color: white;
            font-size: 24px;
          }
        }
        
        .overview-info {
          .overview-number {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1;
          }
          
          .overview-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }
  
  .workflow-list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-left {
        display: flex;
        align-items: center;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
        }
      }
    }
    
    .workflow-table {
      .paper-title-cell {
        .title-text {
          margin-bottom: 8px;
          font-weight: 500;
        }
      }
      
      .progress-info {
        .progress-text {
          font-size: 12px;
          color: #909399;
          text-align: center;
        }
      }
      
      .deadline-info {
        .deadline-expired {
          color: #f56c6c;
          font-weight: 500;
        }
        
        .deadline-urgent {
          color: #e6a23c;
          font-weight: 500;
        }
        
        .deadline-warning {
          color: #409eff;
        }
        
        .deadline-normal {
          color: #606266;
        }
        
        .time-remaining {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
    
    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }
  }
  
  .history-record {
    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      
      .reviewer-name {
        font-weight: 500;
      }
    }
    
    .review-opinion {
      color: #606266;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    
    .review-attachments {
      .attachment-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }
      
      .attachments-list {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
  }
  
  .empty-history {
    padding: 40px 0;
    text-align: center;
  }
}
</style>