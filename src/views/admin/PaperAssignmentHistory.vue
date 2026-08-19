<template>
  <div class="assignment-history">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">分配记录</h1>
        <p class="page-desc">查看和管理所有论文指导老师分配的历史记录</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshHistory">
          刷新记录
        </el-button>
        <el-button :icon="Download" @click="handleExportHistory">
          导出记录
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="分配时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="分配类型">
          <el-select v-model="filterForm.assignmentType" placeholder="请选择类型" clearable style="width: 120px">
            <el-option label="手动分配" value="manual"></el-option>
            <el-option label="自动分配" value="auto"></el-option>
            <el-option label="重新分配" value="reassign"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-select v-model="filterForm.major" placeholder="请选择专业" clearable style="width: 150px">
            <el-option label="计算机科学与技术" value="CS"></el-option>
            <el-option label="软件工程" value="SE"></el-option>
            <el-option label="电子信息工程" value="EE"></el-option>
            <el-option label="机械工程" value="ME"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="已生效" value="active"></el-option>
            <el-option label="已撤销" value="revoked"></el-option>
            <el-option label="待确认" value="pending"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="学生姓名/学号/教师姓名"
            clearable
            style="width: 200px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="RefreshLeft" @click="resetFilter">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计概览 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-primary">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ historyStats.totalRecords }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-success">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ historyStats.activeAssignments }}</div>
              <div class="stat-label">有效分配</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-warning">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ historyStats.uniqueStudents }}</div>
              <div class="stat-label">涉及学生</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-info">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ historyStats.uniqueTeachers }}</div>
              <div class="stat-label">涉及教师</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分配记录表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Files /></el-icon>
            分配记录列表
          </span>
          <div class="table-actions">
            <el-button 
              type="danger" 
              :icon="Delete" 
              :disabled="selectedRecords.length === 0"
              @click="batchDelete"
            >
              批量删除 ({{ selectedRecords.length }})
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="assignmentRecords"
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="studentName" label="学生姓名" width="100"></el-table-column>
        <el-table-column prop="studentId" label="学号" width="120"></el-table-column>
        <el-table-column prop="major" label="专业" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ getMajorName(row.major) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="80"></el-table-column>
        <el-table-column prop="teacherName" label="指导老师" width="100"></el-table-column>
        <el-table-column prop="teacherTitle" label="职称" width="100"></el-table-column>
        <el-table-column prop="department" label="院系" width="120"></el-table-column>
        <el-table-column prop="assignmentType" label="分配类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.assignmentType)">
              {{ getTypeName(row.assignmentType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignTime" label="分配时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.assignTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="100"></el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="viewRecordDetail(row)">
              查看详情
            </el-button>
            <el-button 
              v-if="row.status === 'active'" 
              size="small" 
              type="warning" 
              text 
              @click="reassignStudent(row)"
            >
              重新分配
            </el-button>
            <el-button 
              v-if="row.status === 'active'" 
              size="small" 
              type="danger" 
              text 
              @click="handleRevokeAssignment(row)"
            >
              撤销分配
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 记录详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="分配记录详情"
      width="700px"
    >
      <div v-if="currentRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学生姓名">{{ currentRecord.studentName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentRecord.studentId }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ getMajorName(currentRecord.major) }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ currentRecord.grade }}级</el-descriptions-item>
          <el-descriptions-item label="指导老师">{{ currentRecord.teacherName }}</el-descriptions-item>
          <el-descriptions-item label="教师职称">{{ currentRecord.teacherTitle }}</el-descriptions-item>
          <el-descriptions-item label="所在院系">{{ currentRecord.department }}</el-descriptions-item>
          <el-descriptions-item label="分配类型">
            <el-tag :type="getTypeTag(currentRecord.assignmentType)">
              {{ getTypeName(currentRecord.assignmentType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分配时间">{{ formatDate(currentRecord.assignTime) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentRecord.status)">
              {{ getStatusName(currentRecord.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentRecord.operator }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatDate(currentRecord.operateTime) }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-section" v-if="currentRecord.reason">
          <h3>分配原因</h3>
          <p class="reason">{{ currentRecord.reason }}</p>
        </div>
        
        <div class="detail-section" v-if="currentRecord.notes">
          <h3>备注说明</h3>
          <p class="notes">{{ currentRecord.notes }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="currentRecord?.status === 'active'" 
          type="warning" 
          @click="reassignStudent(currentRecord)"
        >
          重新分配
        </el-button>
        <el-button 
          v-if="currentRecord?.status === 'active'" 
          type="danger" 
          @click="handleRevokeAssignment(currentRecord)"
        >
          撤销分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 重新分配对话框 -->
    <el-dialog
      v-model="reassignDialogVisible"
      title="重新分配指导老师"
      width="500px"
    >
      <el-form
        :model="reassignForm"
        :rules="reassignRules"
        ref="reassignFormRef"
        label-width="100px"
      >
        <el-form-item label="原分配信息">
          <div class="original-info">
            <div><strong>{{ reassignStudentInfo?.studentName }}</strong> ({{ reassignStudentInfo?.studentId }})</div>
            <div>原导师: {{ reassignStudentInfo?.teacherName }}</div>
          </div>
        </el-form-item>
        <el-form-item label="新导师" prop="newTeacherId">
          <el-select 
            v-model="reassignForm.newTeacherId" 
            placeholder="请选择新的指导老师" 
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="teacher in availableTeachers"
              :key="teacher.id"
              :label="`${teacher.name} (${teacher.title}) - ${teacher.department}`"
              :value="teacher.id"
              :disabled="teacher.currentLoad >= teacher.maxLoad"
            >
              <div class="teacher-option">
                <div>
                  <span class="teacher-name">{{ teacher.name }}</span>
                  <el-tag size="small" :type="getLoadTagType(teacher.currentLoad)">
                    {{ teacher.currentLoad }}/{{ teacher.maxLoad }}
                  </el-tag>
                </div>
                <div class="teacher-detail">
                  <span>{{ teacher.title }} · {{ teacher.department }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="重新分配原因">
          <el-input
            v-model="reassignForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入重新分配的原因"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reassignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReassign" :loading="reassigning">
          确认重新分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入API接口
import {
  getHistoryStats,
  getHistoryList,
  deleteHistoryRecords,
  revokeAssignment,
  reassignTeacher,
  getAvailableTeachers,
  exportHistory,
  refreshHistoryData
} from '@/api/admin/assignmentHistory'

// 图标导入
import {
  Refresh, Download, Search, RefreshLeft, Document, Check,
  User, UserFilled, Files, Delete
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const detailDialogVisible = ref(false)
const reassignDialogVisible = ref(false)
const reassigning = ref(false)
const selectedRecords = ref([])
const currentRecord = ref(null)
const reassignStudentInfo = ref(null)

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  assignmentType: '',
  major: '',
  status: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 统计数据
const historyStats = ref({
  totalRecords: 0,
  activeAssignments: 0,
  uniqueStudents: 0,
  uniqueTeachers: 0
})

// 分配记录数据
const assignmentRecords = ref([])

// 可用教师数据
const availableTeachers = ref([])

// 重新分配表单
const reassignForm = reactive({
  newTeacherId: '',
  reason: ''
})

const reassignFormRef = ref()

// 表单验证规则
const reassignRules = {
  newTeacherId: [
    { required: true, message: '请选择新的指导老师', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入重新分配原因', trigger: 'blur' }
  ]
}

// 方法
const refreshHistory = async () => {
  try {
    await Promise.all([
      loadHistoryStats(),
      loadHistoryData()
    ])
    await refreshHistoryData()
    ElMessage.success('记录已刷新')
  } catch (error) {
    ElMessage.error('刷新记录失败: ' + error.message)
  }
}

const handleExportHistory = async () => {
  try {
    const params = {
      startDate: filterForm.dateRange?.[0],
      endDate: filterForm.dateRange?.[1],
      assignmentType: filterForm.assignmentType,
      major: filterForm.major,
      status: filterForm.status,
      keyword: filterForm.keyword
    }
    
    const res = await exportHistory(params)
    // 处理文件下载
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `分配记录_${new Date().toISOString().slice(0,10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadHistoryData()
}

const resetFilter = () => {
  filterForm.dateRange = []
  filterForm.assignmentType = ''
  filterForm.major = ''
  filterForm.status = ''
  filterForm.keyword = ''
  pagination.currentPage = 1
  loadHistoryData()
}

const handleSelectionChange = (selection) => {
  selectedRecords.value = selection
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  loadHistoryData()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  loadHistoryData()
}

const loadHistoryData = async () => {
  loading.value = true
  try {
    const params = {
      startDate: filterForm.dateRange?.[0],
      endDate: filterForm.dateRange?.[1],
      assignmentType: filterForm.assignmentType,
      major: filterForm.major,
      status: filterForm.status,
      keyword: filterForm.keyword,
      page: pagination.currentPage,
      size: pagination.pageSize
    }
    
    const res = await getHistoryList(params)
    if (res.code === 200) {
      assignmentRecords.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载记录失败:', error)
    ElMessage.error('加载记录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadHistoryStats = async () => {
  try {
    const res = await getHistoryStats()
    if (res.code === 200) {
      historyStats.value = res.data
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const loadAvailableTeachers = async () => {
  try {
    const res = await getAvailableTeachers()
    if (res.code === 200) {
      availableTeachers.value = res.data || []
    }
  } catch (error) {
    console.error('加载可用教师失败:', error)
    ElMessage.error('加载可用教师失败: ' + error.message)
  }
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

const getTypeName = (type) => {
  const typeMap = {
    'manual': '手动分配',
    'auto': '自动分配',
    'reassign': '重新分配'
  }
  return typeMap[type] || type
}

const getTypeTag = (type) => {
  const tagMap = {
    'manual': 'primary',
    'auto': 'success',
    'reassign': 'warning'
  }
  return tagMap[type] || 'info'
}

const getStatusName = (status) => {
  const statusMap = {
    'active': '已生效',
    'revoked': '已撤销',
    'pending': '待确认'
  }
  return statusMap[status] || status
}

const getStatusTag = (status) => {
  const tagMap = {
    'active': 'success',
    'revoked': 'danger',
    'pending': 'warning'
  }
  return tagMap[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const getLoadTagType = (currentLoad) => {
  if (currentLoad >= 12) return 'danger'
  if (currentLoad >= 8) return 'warning'
  return 'success'
}

const viewRecordDetail = (record) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

const reassignStudent = (record) => {
  reassignStudentInfo.value = record
  reassignForm.newTeacherId = ''
  reassignForm.reason = ''
  reassignDialogVisible.value = true
}

const handleRevokeAssignment = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤销 ${record.studentName} 的指导老师分配吗？`,
      '撤销分配确认',
      {
        confirmButtonText: '确定撤销',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await revokeAssignment({
      recordId: record.id,
      reason: '管理员手动撤销'
    })
    
    if (res.code === 200) {
      ElMessage.success('分配撤销成功')
      await loadHistoryData()
      await loadHistoryStats()
    } else {
      ElMessage.error(res.message || '撤销失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('撤销分配失败: ' + error.message)
    }
  }
}

const batchDelete = async () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 条记录吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    const ids = selectedRecords.value.map(record => record.id)
    const res = await deleteHistoryRecords({ ids })
    
    if (res.code === 200) {
      ElMessage.success('记录删除成功')
      selectedRecords.value = []
      await loadHistoryData()
      await loadHistoryStats()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除记录失败: ' + error.message)
    }
  }
}

const confirmReassign = async () => {
  if (!reassignFormRef.value) return
  
  try {
    await reassignFormRef.value.validate()
    reassigning.value = true
    
    const res = await reassignTeacher({
      recordId: reassignStudentInfo.value.id,
      newTeacherId: reassignForm.newTeacherId,
      reason: reassignForm.reason
    })
    
    if (res.code === 200) {
      ElMessage.success(`成功为 ${reassignStudentInfo.value.studentName} 重新分配指导老师`)
      reassignDialogVisible.value = false
      await loadHistoryData()
      await loadHistoryStats()
    } else {
      ElMessage.error(res.message || '重新分配失败')
    }
  } catch (error) {
    if (error.validator) {
      console.log('表单验证失败')
    } else {
      ElMessage.error('重新分配失败: ' + error.message)
    }
  } finally {
    reassigning.value = false
  }
}

// 生命周期
onMounted(() => {
  Promise.all([
    loadHistoryStats(),
    loadHistoryData(),
    loadAvailableTeachers()
  ])
})
</script>

<style lang="scss" scoped>
.assignment-history {
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

.filter-card {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  
  :deep(.el-card__body) {
    padding: 1.25rem;
  }
}

.stats-cards {
  margin-bottom: 1.5rem;
  
  .stat-card {
    border: none;
    border-radius: 12px;
    
    .stat-content {
      display: flex;
      align-items: center;
      
      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        margin-right: 1rem;
        
        &.bg-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }
        
        &.bg-success {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        
        &.bg-warning {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        
        &.bg-info {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
        }
        
        .el-icon {
          color: white;
          font-size: 1.5rem;
        }
      }
      
      .stat-info {
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin-top: 0.25rem;
        }
      }
    }
  }
}

.table-card {
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
  
  :deep(.el-card__body) {
    padding: 0;
  }
}

.pagination-container {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f1f2f6;
}

.record-detail {
  .detail-section {
    margin: 1.5rem 0;
    
    h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }
    
    .reason,
    .notes {
      line-height: 1.6;
      color: #5a6c7d;
      padding: 0.75rem;
      background-color: #f8f9fa;
      border-radius: 6px;
    }
  }
}

.original-info {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  
  div {
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.teacher-option {
  .teacher-name {
    font-weight: 600;
    margin-right: 0.5rem;
  }
  
  .teacher-detail {
    font-size: 0.875rem;
    color: #7f8c8d;
    margin-top: 0.25rem;
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
  
  .stats-cards {
    .el-col {
      margin-bottom: 0.75rem;
    }
  }
  
  .filter-card {
    :deep(.el-form) {
      .el-form-item {
        margin-bottom: 1rem;
        width: 100%;
        
        .el-input,
        .el-select,
        .el-date-editor {
          width: 100% !important;
        }
      }
    }
  }
  
  .table-card {
    :deep(.el-table) {
      .el-table__cell {
        padding: 8px 0;
      }
    }
  }
  
  .pagination-container {
    justify-content: center;
    
    :deep(.el-pagination) {
      .el-pagination__sizes,
      .el-pagination__jump {
        display: none;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.assignment-history {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  .header-content {
    .page-title { margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 600; color: #2c3e50; }
    .page-desc { margin: 0; color: #7f8c8d; font-size: 0.95rem; }
  }
}
</style>