<template>
  <div class="paper-assignment">
    <PageHeader description="管理学生论文指导老师分配">
      <template #actions>
        <el-button type="primary" :icon="MagicStick" @click="handleAutoAssign">自动分配</el-button>
        <el-button :icon="Pointer" @click="handleManualAssign">手动分配</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
      </template>
    </PageHeader>

    <el-alert
      v-if="showUnassignedNotice"
      class="drilldown-alert"
      type="info"
      :closable="false"
      show-icon
      title="已按「待分配论文」筛选进入，列表仅展示尚未分配导师的学生"
    />
    
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
    
    <ListPageShell
      v-model:page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      title="待分配学生列表"
      :icon="User"
      :total="pagination.total"
      :page-sizes="[10, 20, 50]"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange"
    >
      <el-table :data="pendingStudents" style="width: 100%" v-loading="loading">
        <el-table-column prop="studentName" label="学生姓名" width="120"></el-table-column>
        <el-table-column prop="studentNo" label="学号" width="140"></el-table-column>
        <el-table-column prop="majorName" label="专业" width="150"></el-table-column>
        <el-table-column prop="grade" label="年级" width="100"></el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="assignAdvisor(row)">分配导师</el-button>
            <el-button size="small" @click="viewDetails(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </ListPageShell>

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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入管理员API
import {
  getAssignmentStats, 
  getUnassignedStudents, 
  getAvailableTeachers,
  assignSingleStudent
} from '@/api/admin/assignment'
import {
  getAlgorithmConfig,
  getAssignmentPreview,
  startAutoAssignment,
  getAssignmentProgress
} from '@/api/admin/autoAssignment'

// 导入其他必要API
import { getStudentDetail } from '@/api/admin/users'

// 图标导入
import {
  MagicStick, Pointer, Refresh, User, Checked, UserFilled, DataAnalysis
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ListPageShell from '@/components/common/ListPageShell.vue'
import { formatDateTime } from '@/utils/dataType.js'

// 响应式数据
const route = useRoute()
const loading = ref(false)
const showUnassignedNotice = ref(false)
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
    assignmentStats.value = response.data || {}
  } catch (error) {
    console.error('加载分配统计失败:', error)
    ElMessage.error('加载统计数据失败')
    // API 失败时保持空态，不再展示编造的降级数字
    assignmentStats.value = {}
  }
}

const loadPendingStudents = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.currentPage,
      size: pagination.pageSize
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
    // 后端返回的是分页对象，这里只需要当前页的教师列表
    availableAdvisors.value = response.data?.records || []
  } catch (error) {
    console.error('加载可用导师失败:', error)
    availableAdvisors.value = []
  }
}

// 自动分配进度轮询
const autoAssignPolling = ref(null)

const stopAutoAssignPolling = () => {
  if (autoAssignPolling.value) {
    clearInterval(autoAssignPolling.value)
    autoAssignPolling.value = null
  }
}

const pollAutoAssignProgress = (taskId) => {
  stopAutoAssignPolling()
  let attempts = 0
  autoAssignPolling.value = setInterval(async () => {
    attempts++
    try {
      const res = await getAssignmentProgress(taskId)
      const progress = res.data
      if (!progress) return
      if (progress.status === 'completed') {
        stopAutoAssignPolling()
        ElMessage.success(
          `自动分配完成：已分配 ${progress.processedCount || 0} / ${progress.totalCount || 0}`
        )
        await refreshData()
      } else if (progress.status === 'failed') {
        stopAutoAssignPolling()
        ElMessage.error('自动分配失败，请在“分配记录”中查看原因')
        await refreshData()
      } else if (attempts > 150) {
        // 5 分钟仍未结束：停止轮询，避免页面长期挂请求
        stopAutoAssignPolling()
        ElMessage.warning('自动分配仍在执行，请稍后点击刷新查看结果')
      }
    } catch (e) {
      console.error('查询自动分配进度失败:', e)
    }
  }, 2000)
}

const handleAutoAssign = async () => {
  try {
    // 先取预览，避免没有待分配数据时白跑一次后端任务
    const previewRes = await getAssignmentPreview()
    const preview = previewRes.data || {}
    if (!preview.unassigned) {
      ElMessage.warning('当前没有待分配学生')
      return
    }

    await ElMessageBox.confirm(
      `将按当前算法配置为 ${preview.unassigned} 名待分配学生执行自动分配`
        + `（可用教师 ${preview.availableTeachers || 0} 人，预计可分配 ${preview.expectedAssigned || 0} 人）。确定继续？`,
      '自动分配确认',
      {
        confirmButtonText: '开始分配',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 使用后台已保存的算法配置启动自动分配
    const configRes = await getAlgorithmConfig()
    const config = configRes.data
    if (!config) {
      ElMessage.error('未获取到自动分配算法配置')
      return
    }

    const startRes = await startAutoAssignment({ config })
    const taskId = startRes.data?.taskId
    if (!taskId) {
      ElMessage.error(startRes.message || '启动自动分配失败')
      return
    }
    ElMessage.success('自动分配已启动，完成后将自动刷新')
    pollAutoAssignProgress(taskId)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      // 响应拦截器已按后端 message 提示
      console.error('自动分配失败:', error)
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
      // 后端 singleAssign 的 studentId 字段实际接收论文ID；教师ID字段名是 teacherId
      await assignSingleStudent({
        studentId: student.paperId || student.id,
        teacherId: selectedAdvisor.value
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
    if (!student.studentId) {
      ElMessage.warning('未找到该论文对应的学生账号')
      return
    }
    // studentId 是学生用户ID（不是论文ID）
    const response = await getStudentDetail(student.studentId)
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

// 生命周期
onMounted(() => {
  // 全校概览「待分配论文」钻取：/admin/paper-assignment?status=unassigned
  showUnassignedNotice.value = String(route.query.status || '') === 'unassigned'
  if (showUnassignedNotice.value) {
    pagination.currentPage = 1
  }
  refreshData()
})

onUnmounted(() => {
  stopAutoAssignPolling()
})
</script>

<style lang="scss" scoped>
.paper-assignment {
  padding: 0;
  font-family: var(--app-font-family);
}

.drilldown-alert {
  margin-bottom: var(--app-space-4);
}

.stats-card {
  margin-bottom: var(--app-space-6);
  border-radius: var(--app-radius-lg);

  :deep(.el-card__body) {
    padding: var(--app-space-6);
  }
}

.assignment-stats {
  .el-col {
    text-align: center;
  }

  :deep(.el-statistic) {
    .el-statistic__head {
      font-size: var(--app-fs-meta);
      color: var(--app-color-text-secondary);
      margin-bottom: var(--app-space-2);
    }

    .el-statistic__content {
      font-size: var(--app-fs-metric);
      font-weight: 700;
      color: var(--app-color-ink);
    }
  }
}

.students-card {
  border-radius: var(--app-radius-lg);

  :deep(.el-card__header) {
    padding: var(--app-space-3) var(--app-space-4);
    border-bottom: 1px solid var(--app-color-border);
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

@media (max-width: 768px) {
  .assignment-stats {
    :deep(.el-row) .el-col {
      margin-bottom: var(--app-space-3);
    }
  }
}
</style>
