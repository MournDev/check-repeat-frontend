<template>
  <div class="paper-assignment">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">论文分配管理</h1>
        <p class="page-desc">管理学生论文指导老师分配</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="MagicStick" @click="handleAutoAssign">自动分配</el-button>
        <el-button :icon="Pointer" @click="handleManualAssign">手动分配</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
      </div>
    </div>
    
    <el-card class="stats-card">
      <div class="assignment-stats">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-statistic title="待分配学生" :value="assignmentStats.pendingStudents || 0">
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="已分配学生" :value="assignmentStats.assignedStudents || 0">
              <template #prefix>
                <el-icon><Checked /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="指导老师" :value="assignmentStats.advisorsCount || 0">
              <template #prefix>
                <el-icon><UserFilled /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="平均指导数" :value="assignmentStats.avgAssigned || 0" :precision="1">
              <template #prefix>
                <el-icon><DataAnalysis /></el-icon>
              </template>
            </el-statistic>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <!-- 待分配学生列表 -->
    <el-card class="students-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            待分配学生列表
          </span>
        </div>
      </template>
      
      <el-table :data="pendingStudents" style="width: 100%">
        <el-table-column prop="studentName" label="学生姓名" width="120"></el-table-column>
        <el-table-column prop="studentId" label="学号" width="120"></el-table-column>
        <el-table-column prop="major" label="专业" width="150"></el-table-column>
        <el-table-column prop="grade" label="年级" width="100"></el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.submitTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="assignAdvisor(row)">分配导师</el-button>
            <el-button size="small" @click="viewDetails(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="学生详细信息" width="600px" destroy-on-close>
      <template v-if="studentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ studentDetail.realName || studentDetail.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ studentDetail.username || studentDetail.studentNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ studentDetail.collegeName || studentDetail.college || '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ studentDetail.majorName || studentDetail.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ studentDetail.grade || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ studentDetail.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ studentDetail.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="论文数">{{ studentDetail.paperCount ?? '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入管理员API
import {
  getAssignmentStats, 
  getUnassignedStudents, 
  getAvailableTeachers,
  assignSingleStudent,
  assignBatchStudents
} from '@/api/admin/assignment'

// 导入其他必要API
import { getStudentDetail } from '@/api/admin/users'

// 图标导入
import {
  MagicStick, Pointer, Refresh, User, Checked, UserFilled, DataAnalysis
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const assignmentStats = ref({})
const pendingStudents = ref([])
const availableAdvisors = ref([])
const studentDetail = ref(null)
const detailDialogVisible = ref(false)

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 方法
const refreshData = async () => {
  await Promise.all([
    loadAssignmentStats(),
    loadPendingStudents()
  ])
  ElMessage.success('数据已刷新')
}

const loadAssignmentStats = async () => {
  try {
    const response = await getAssignmentStats()
    assignmentStats.value = response.data
  } catch (error) {
    console.error('加载分配统计失败:', error)
    ElMessage.error('加载统计数据失败')
    // 降级数据
    assignmentStats.value = {
      pendingStudents: 12,
      assignedStudents: 89,
      advisorsCount: 25,
      avgAssigned: 3.6
    }
  }
}

const loadPendingStudents = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    const response = await getUnassignedStudents(params)
    pendingStudents.value = response.data.records || []
    pagination.total = response.data.total || 0
    loading.value = false
  } catch (error) {
    console.error('加载待分配学生失败:', error)
    ElMessage.error('加载学生列表失败')
    loading.value = false
    // 降级数据
    pendingStudents.value = []
    pagination.total = 0
  }
}

const loadAvailableAdvisors = async () => {
  try {
    const response = await getAvailableTeachers()
    availableAdvisors.value = response.data || []
  } catch (error) {
    console.error('加载可用导师失败:', error)
    availableAdvisors.value = []
  }
}

const handleAutoAssign = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要执行自动分配吗？此操作将为所有待分配学生自动匹配指导老师。',
      '自动分配确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await assignBatchStudents({ algorithm: 'balanced' })
    ElMessage.success(`自动分配完成，共分配 ${response.data.assignedCount} 名学生`)
    refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('自动分配失败:', error)
      ElMessage.error('自动分配失败')
    }
  }
}

const handleManualAssign = () => {
  ElMessage.info('请在学生列表中选择具体学生进行手动分配')
}

const assignAdvisor = async (student) => {
  try {
    // 先加载可用导师
    await loadAvailableAdvisors()
    
    if (availableAdvisors.value.length === 0) {
      ElMessage.warning('暂无可用的指导老师')
      return
    }
    
    // 简化版导师选择 - 实际项目中应该使用更友好的UI
    const advisorOptions = availableAdvisors.value.map(advisor => ({
      value: advisor.id,
      label: `${advisor.name} (${advisor.department}) - 已指导${advisor.assignedCount || 0}人`
    }))
    
    const { value } = await ElMessageBox.prompt(
      '请选择指导老师',
      '手动分配',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入导师姓名或选择',
        inputPattern: /.+/,
        inputErrorMessage: '请选择一位导师'
      }
    )
    
    const selectedAdvisor = advisorOptions.find(opt => opt.label.includes(value) || opt.value === value)
    if (selectedAdvisor) {
      await manualAssign({
        studentId: student.id,
        advisorId: selectedAdvisor.value
      })
      ElMessage.success('分配成功')
      refreshData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('分配导师失败:', error)
      ElMessage.error('分配失败')
    }
  }
}

const viewDetails = async (student) => {
  try {
    const response = await getStudentDetail(student.id)
    if (response.code === 200 && response.data) {
      studentDetail.value = response.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取学生详情失败')
    }
  } catch (error) {
    console.error('获取学生详情失败:', error)
    ElMessage.error('获取学生详情失败')
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  loadPendingStudents()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  loadPendingStudents()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.paper-assignment {
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
      color: #1d1d1f; 
    }
    
    .page-desc { 
      margin: 0; 
      color: #86868b; 
      font-size: 0.95rem; 
    }
  }
  
  .header-actions { 
    display: flex; 
    gap: 0.75rem; 
  }
}

.stats-card {
  margin-bottom: 1.5rem;
  border-radius: 18px;
  
  :deep(.el-card__body) {
    padding: 1.5rem;
  }
}

.assignment-stats {
  .el-col {
    text-align: center;
  }
  
  :deep(.el-statistic) {
    .el-statistic__head {
      font-size: 0.875rem;
      color: #86868b;
      margin-bottom: 0.5rem;
    }
    
    .el-statistic__content {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1d1d1f;
    }
  }
}

.students-card {
  border-radius: 18px;
  
  :deep(.el-card__header) {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #d2d2d7;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .card-title {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #1d1d1f;
        
        .el-icon {
          margin-right: 0.5rem;
          color: #0066cc;
        }
      }
    }
  }
  
  :deep(.el-card__body) {
    padding: 0;
  }
}

.pagination-container {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #d2d2d7;
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
  
  .assignment-stats {
    :deep(.el-row) {
      .el-col {
        margin-bottom: 1rem;
      }
    }
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>