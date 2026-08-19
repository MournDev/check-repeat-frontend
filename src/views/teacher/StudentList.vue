<template>
  <div class="student-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">学生管理</h1>
          <p class="page-subtitle">管理所有学生信息，分配导师，跟踪论文进度</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Plus" @click="addNewStudent" size="large">
            添加学生
          </el-button>
          <el-button :icon="Upload" @click="importStudents" size="large">
            批量导入
          </el-button>
          <el-button :icon="Download" @click="exportData" size="large">
            导出数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon>
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalStudents || 0 }}</div>
              <div class="stat-label">总学生数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon>
                <Document />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.submittedStudents || 0 }}</div>
              <div class="stat-label">已提交论文</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon>
                <UserFilled />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.assignedStudents || 0 }}</div>
              <div class="stat-label">已分配导师</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon>
                <Check />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.completedStudents || 0 }}</div>
              <div class="stat-label">已完成审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和搜索区域 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-content">
        <div class="filter-left">
          <el-input v-model="searchQuery" placeholder="搜索学生姓名、学号或专业" :prefix-icon="Search" class="search-input"
            clearable @clear="handleSearch" @keyup.enter="handleSearch" />

          <el-select v-model="filterStatus" placeholder="论文状态" class="filter-select" clearable>
            <el-option label="全部状态" value="" />
            <el-option label="未提交" value="not_submitted" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已分配导师" value="assigned" />
            <el-option label="审核中" value="auditing" />
            <el-option label="需修改" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>

          <el-select v-model="filterCollege" placeholder="学院筛选" class="filter-select" clearable>
            <el-option label="全部学院" value="" />
            <el-option label="计算机学院" value="computer" />
            <el-option label="电子信息学院" value="electronics" />
            <el-option label="机械工程学院" value="mechanical" />
            <el-option label="管理学院" value="management" />
          </el-select>
        </div>

        <div class="filter-right">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetFilters">
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 学生列表 -->
    <el-card class="list-card" shadow="hover">
      <template #header>
        <div class="list-header">
          <div class="header-title">
            <el-icon>
              <List />
            </el-icon>
            <span>学生列表</span>
            <span class="total-count">(共 {{ students.length }} 人)</span>
          </div>
          <div class="header-actions">
            <el-button :icon="Refresh" text @click="refreshList">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredStudents" v-loading="loading" stripe class="student-table"
        @sort-change="handleSortChange">
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column prop="username" label="学号" width="120" sortable>
          <template #default="{ row }">
            <span class="student-id">{{ row.username }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="studentName" label="姓名" width="100" sortable>
          <template #default="{ row }">
            <div class="student-info">
              <div class="student-name">
                <div class="name">{{ row.studentName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="collegeName" label="学院" width="120" sortable>
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.collegeName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="major" label="专业" width="140" sortable>
          <template #default="{ row }">
            <span class="major">{{ row.major }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="grade" label="年级" width="80" sortable>
          <template #default="{ row }">
            <span class="grade">{{ row.grade }}级</span>
          </template>
        </el-table-column>

        <el-table-column prop="paperStatus" label="论文状态" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.paperStatus)" effect="light" size="small">
              {{ getStatusText(row.paperStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="advisorName" label="指导老师" width="120">
          <template #default="{ row }">
            <div v-if="row.advisorName" class="advisor-info">
              <span class="advisor-name">{{ row.advisorName }}</span>
            </div>
            <span v-else class="no-advisor">未分配</span>
          </template>
        </el-table-column>

        <el-table-column prop="submitTime" label="提交时间" width="140" sortable>
          <template #default="{ row }">
            <span v-if="row.submitTime" class="submit-time">
              {{ formatDate(row.submitTime) }}
            </span>
            <span v-else class="no-submit">--</span>
          </template>
        </el-table-column>

        <el-table-column prop="similarity" label="相似度" width="100" sortable>
          <template #default="{ row }">
            <div v-if="row.similarity !== null && row.similarity !== undefined">
              <el-progress :percentage="row.similarity" :stroke-width="6" :show-text="false"
                :color="getSimilarityColor(row.similarity)" class="similarity-progress" />
              <span class="similarity-value">{{ row.similarity }}%</span>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons" style="display: flex; align-items: center; gap: 8px;">
              <!-- 主要操作显式展示 -->
              <el-button type="primary" :icon="Message" size="small" @click="handleMessage(row)" title="发送消息" circle />
              <el-button v-if="!row.advisorName" type="success" :icon="UserFilled" size="small"
                @click="handleAssignTutor(row)" title="分配导师" circle />
              <!-- 更多操作放在下拉菜单 -->
              <el-dropdown @command="handleMoreActions(row, $event)" trigger="click">
                <el-button :icon="More" size="small" circle />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :icon="Document" command="paper">
                      论文详情
                    </el-dropdown-item>
                    <el-dropdown-item :icon="Delete" command="delete" divided style="color: #F56C6C;">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 批量操作区域 -->
    <div class="batch-operations" v-if="selectedStudents?.length > 0">
      <el-card shadow="hover">
        <div class="batch-content">
          <div class="batch-info">
            <el-icon>
              <Select />
            </el-icon>
            <span>已选择 {{ selectedStudents.length }} 个学生</span>
          </div>
          <div class="batch-actions">
            <el-button type="primary" :icon="UserFilled" @click="handleBatchAssignAdvisor">
              批量分配导师
            </el-button>
            <el-button :icon="Message" @click="handleBatchSendMessage">
              批量发送消息
            </el-button>
            <el-button :icon="Download" @click="batchExport">
              批量导出
            </el-button>
            <el-button type="danger" :icon="Delete" @click="batchDelete">
              批量删除
            </el-button>
            <el-button :icon="Close" @click="clearSelection">
              取消选择
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加学生对话框 -->
    <el-dialog v-model="dialogVisible" title="添加学生" width="500px" :before-close="() => { dialogVisible = false }">
      <el-form 
        :model="studentForm" 
        :rules="formRules" 
        ref="studentFormRef"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="学号" prop="username">
          <el-input v-model="studentForm.username" placeholder="请输入10位学号" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="studentName">
          <el-input v-model="studentForm.studentName" placeholder="请输入学生姓名" />
        </el-form-item>
        
        <el-form-item label="学院" prop="collegeName">
          <el-select 
            v-model="studentForm.collegeName" 
            placeholder="请选择学院" 
            @change="handleCollegeChange"
            style="width: 100%"
          >
            <el-option 
              v-for="college in colleges" 
              :key="college.collegeCode" 
              :label="college.collegeName" 
              :value="college.collegeCode"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="专业" prop="major">
          <el-select 
            v-model="studentForm.major" 
            placeholder="请选择专业" 
            style="width: 100%"
          >
            <el-option 
              v-for="major in majors" 
              :key="major.majorCode" 
              :label="major.majorName" 
              :value="major.majorCode"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="年级" prop="grade">
          <el-input v-model="studentForm.grade" placeholder="请输入入学年份，如2021" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="studentForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        
        <el-form-item label="手机" prop="phone">
          <el-input v-model="studentForm.phone" placeholder="请输入手机号码" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitStudentForm(studentFormRef)">
            确定添加
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 论文预览对话框 -->
    <el-dialog 
      v-model="previewVisible" 
      :title="currentPaper?.paperTitle || '论文预览'" 
      width="80%" 
      top="5vh"
      :before-close="closePreview"
      class="paper-preview-dialog"
    >
      <div class="preview-container" v-loading="previewLoading">
        <!-- 论文信息展示 -->
        <div class="paper-info-bar" v-if="currentPaper">
          <div class="info-item">
            <span class="label">学生：</span>
            <span class="value">{{ currentPaper.studentName }}</span>
          </div>
          <div class="info-item">
            <span class="label">提交时间：</span>
            <span class="value">{{ formatDate(currentPaper.submitTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件大小：</span>
            <span class="value">{{ currentPaper.fileSize }}</span>
          </div>
          <div class="info-item">
            <span class="label">相似度：</span>
            <span class="value">{{ currentPaper.similarity }}%</span>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-wrapper">
          <!-- 成功预览 -->
          <iframe 
            v-if="previewUrl && !previewError" 
            :src="previewUrl" 
            class="preview-iframe" 
            @load="onPreviewLoad"
            @error="onPreviewError"
          ></iframe>

          <!-- 错误状态 -->
          <div v-if="previewError" class="preview-error">
            <el-empty description="论文预览加载失败">
              <p class="error-detail">{{ errorMessage }}</p>
              <el-button type="primary" @click="retryPreview">
                <el-icon><Refresh /></el-icon>
                重新加载
              </el-button>
              <el-button @click="downloadPaper">
                <el-icon><Download /></el-icon>
                下载文件
              </el-button>
            </el-empty>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="preview-footer">
          <el-button @click="closePreview">关闭</el-button>
          <el-button type="primary" @click="downloadPaper">
            <el-icon><Download /></el-icon>
            下载论文
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox ,ElLoading} from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  getStudentListFull,
  deleteStudent as deleteStudentapi,
  getStudentStats,
  assignAdvisor as assignAdvisorApi,
  sendMessage as sendMessageApi,
  batchAssignAdvisor,
  batchSendMessage,
  batchDeleteStudents,
  exportStudentData,
  importStudentData,
  addStudent,
  getColleges,
  getMajors,
  getStudentPaper
} from '@/api/teacher'
import { useUserStore } from '@/stores/user'

// 图标引入
import {
  Plus, Upload, Download, Search, Refresh, Setting,
  User, Document, UserFilled, Check, List, View,
  Edit, More, Delete, Select, Close, Message
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const teacherId = userStore.userInfo?.userId

// 响应式数据
const stats = ref({
  totalStudents: 0,
  submittedStudents: 0,
  assignedStudents: 0,
  completedStudents: 0
})

const students = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedStudents = ref([])

// 筛选条件
const searchQuery = ref('')
const filterStatus = ref('')
const filterCollege = ref('')

// 添加学生表单数据
const dialogVisible = ref(false)
const colleges = ref([])
const majors = ref([])
const studentForm = ref({
  username: '',
  studentName: '',
  collegeName: '',
  major: '',
  grade: '',
  email: '',
  phone: ''
})
const formRules = {
  username: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{10}$/, message: '学号格式不正确', trigger: 'blur' }
  ],
  studentName: [
    { required: true, message: '请输入学生姓名', trigger: 'blur' }
  ],
  collegeName: [
    { required: true, message: '请选择学院', trigger: 'change' }
  ],
  major: [
    { required: true, message: '请选择专业', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请输入年级', trigger: 'blur' },
    { pattern: /^\d{4}$/, message: '年级格式不正确', trigger: 'blur' }
  ]
}

const studentFormRef = ref()

// 论文预览相关数据
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewError = ref(false)
const previewUrl = ref('')
const currentPaper = ref(null)
const errorMessage = ref('')

// 计算属性
const filteredStudents = computed(() => {
  let filtered = [...students.value]

  // 分页计算
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  total.value = filtered.length

  return filtered.slice(start, end)
})

// 方法
const loadStats = async () => {
  try {
    const res = await getStudentStats(teacherId)
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

const loadColleges = async () => {
  try {
    const res = await getColleges()
    if (res.code === 200) {
      colleges.value = res.data
    }
  } catch (error) {
    console.error('获取学院列表失败:', error)
  }
}

const loadMajors = async (collegeCode) => {
  try {
    const res = await getMajors(collegeCode)
    if (res.code === 200) {
      majors.value = res.data
    }
  } catch (error) {
    console.error('获取专业列表失败:', error)
  }
}

const handleCollegeChange = (collegeCode) => {
  studentForm.value.major = ''
  if (collegeCode) {
    loadMajors(collegeCode)
  } else {
    majors.value = []
  }
}

const loadStudents = async () => {
  loading.value = true
  try {
    const params = {
      teacherId,
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
      college: filterCollege.value || undefined
    }
    
    const res = await getStudentListFull(params)
    if (res.code === 200) {
      students.value = res.data.list || []
      total.value = res.data.totalCount || 0
    } else {
      ElMessage.error(res.message || '获取学生列表失败')
    }
  } catch (error) {
    ElMessage.error('获取学生列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadStudents()
}

const resetFilters = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  filterCollege.value = ''
  currentPage.value = 1
  loadStudents()
}

const refreshList = async () => {
  await loadStudents()
  await loadStats()
  ElMessage.success('数据已刷新')
}

const handleSortChange = ({ prop, order }) => {
  console.log('排序:', prop, order)
  // 实际应用中这里会重新请求排序后的数据
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadStudents()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadStudents()
}

const getStatusType = (status) => {
  const typeMap = {
    'not_submitted': 'info',
    'submitted': 'info',
    'assigned': 'primary',
    'auditing': 'warning',
    'rejected': 'danger',
    'completed': 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'not_submitted': '未提交',
    'submitted': '已提交',
    'assigned': '已分配',
    'auditing': '审核中',
    'rejected': '需修改',
    'completed': '已完成'
  }
  return textMap[status] || '未知状态'
}

const getSimilarityColor = (similarity) => {
  if (!similarity) return '#909399'
  if (similarity < 15) return '#52c41a'
  if (similarity < 30) return '#faad14'
  return '#ff4d4f'
}

const formatDate = (date) => {
  if (!date) return '--'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const handleMoreActions = (student, command) => {
  switch (command) {
    case 'assign':
      assignAdvisor(student)
      break
    case 'paper':
      viewPaper(student)
      break
    case 'message':
      sendMessage(student)
      break
    case 'delete':
      deleteStudent(student)
      break
  }
}

const handleMessage = (student) => {
  sendMessage(student)
}

const handleAssignTutor = (student) => {
  assignAdvisor(student)
}

const assignAdvisor = async (student) => {
  try {
    await ElMessageBox.prompt('请选择导师:', '分配导师', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '输入导师姓名或ID'
    }).then(async ({ value }) => {
      if (value) {
        const res = await assignAdvisorApi(student.studentId, {
          advisorName: value
        })
        if (res.code === 200) {
          ElMessage.success('导师分配成功')
          // 更新本地数据
          student.advisorName = value
        } else {
          ElMessage.error(res.message || '分配失败')
        }
      }
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

const viewPaper = async (student) => {
  try {
    // 显示加载状态
    const loading = ElLoading.service({
      lock: true,
      text: '正在加载论文信息...',
      background: 'rgba(0,0,0,0.4)'
    })
    
    // 获取学生论文信息
    const res = await getStudentPaper(student.studentId)
    
    if (res.code === 200 && res.data) {
      currentPaper.value = res.data
      
      // 如果有文件ID，则进行预览
      if (res.data.fileId) {
        // 使用已有的KKFileView预览逻辑
        const previewApiUrl = `/check/api/file/smartPreview?fileId=${res.data.fileId}`
        previewUrl.value = previewApiUrl
        previewVisible.value = true
        previewLoading.value = true
        previewError.value = false
      } else {
        ElMessage.info('该学生暂无论文文件')
      }
    } else {
      ElMessage.warning(res.message || '未找到该学生的论文信息')
    }
  } catch (error) {
    console.error('获取论文信息失败:', error)
    ElMessage.error('获取论文信息失败: ' + error.message)
  } finally {
    // 关闭加载状态
    setTimeout(() => {
      ElLoading.service().close()
    }, 500)
  }
}

const sendMessage = async (student) => {
  try {
    await ElMessageBox.prompt(`请输入给 ${student.studentName} 的消息：`, '发送消息', {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入消息内容...'
    }).then(async ({ value }) => {
      if (value) {
        const res = await sendMessageApi({
          receiverId: student.studentId,
          receiverType: 'student',
          content: value,
          title: '系统消息'
        })
        if (res.code === 200) {
          ElMessage.success('消息已发送')
        } else {
          ElMessage.error(res.message || '发送失败')
        }
      }
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发送失败: ' + error.message)
    }
  }
}

const deleteStudent = async (student) => {
  let loadingInstance = null
  try {
    const studentName = student?.studentName || '该学生'
    
    await ElMessageBox.confirm(
      `确定要删除学生 "${studentName}" 吗？删除后不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loadingInstance = ElLoading.service({
      lock: true,
      text: '正在删除...',
      background: 'rgba(0,0,0,0.4)'
    })
    
    const res = await deleteStudentapi(student.studentId)
    if (res?.code === 200) {
      // 从本地数组移除
      const idx = students.value.findIndex(s => 
        String(s.studentId) === String(student.studentId)
      )
      if (idx > -1) {
        students.value.splice(idx, 1)
        total.value = Math.max(0, (total.value || 0) - 1)
      }

      // 如果当前页没有数据且不是第一页，回到上一页
      if (students.value.length === 0 && currentPage.value > 1) {
        currentPage.value = currentPage.value - 1
        await loadStudents()  // 重新加载数据
      }

      // 从选中列表中移除
      selectedStudents.value = selectedStudents.value.filter(s => 
        String(s.studentId) !== String(student.studentId)
      )

      ElMessage.success('删除成功')
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败:', err)
      ElMessage.error(err?.message || '删除失败，请重试')
    }
  } finally {
    loadingInstance?.close()
  }
}

// 论文预览相关函数
const onPreviewLoad = () => {
  previewLoading.value = false
  console.log('论文预览加载完成')
}

const onPreviewError = () => {
  previewLoading.value = false
  previewError.value = true
  errorMessage.value = '论文预览加载失败，可能格式不受支持'
}

const closePreview = () => {
  previewVisible.value = false
  previewUrl.value = ''
  currentPaper.value = null
  previewError.value = false
  errorMessage.value = ''
}

const retryPreview = () => {
  if (currentPaper.value?.fileId) {
    previewLoading.value = true
    previewError.value = false
    const previewApiUrl = `/check/api/file/smartPreview?fileId=${currentPaper.value.fileId}`
    previewUrl.value = previewApiUrl
  }
}

const downloadPaper = () => {
  if (currentPaper.value?.fileId) {
    // 实现下载逻辑
    const link = document.createElement('a')
    link.href = `/api/file/download/${currentPaper.value.fileId}`
    link.download = currentPaper.value.fileName || '论文文件'
    link.click()
    closePreview()
  }
}

const addNewStudent = () => {
  // 重置表单
  studentForm.value = {
    username: '',
    studentName: '',
    collegeName: '',
    major: '',
    grade: '',
    email: '',
    phone: ''
  }
  dialogVisible.value = true
  loadColleges()
}

const submitStudentForm = async (formRef) => {
  if (!formRef) return
  
  await formRef.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: '正在添加...',
          background: 'rgba(0,0,0,0.4)'
        })
        
        const res = await addStudent(studentForm.value)
        if (res.code === 200) {
          ElMessage.success('学生添加成功')
          dialogVisible.value = false
          await loadStudents()
          await loadStats()
        } else {
          ElMessage.error(res.message || '添加失败')
        }
      } catch (error) {
        ElMessage.error('添加失败: ' + error.message)
      } finally {
        loading?.close()
      }
    }
  })
}

const importStudents = async () => {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        
        const loading = ElLoading.service({
          lock: true,
          text: '正在导入...',
          background: 'rgba(0,0,0,0.4)'
        })
        
        try {
          const res = await importStudentData(formData)
          if (res.code === 200) {
            ElMessage.success(`导入成功！成功: ${res.data.successCount}条，失败: ${res.data.failCount}条`)
            await loadStudents()
            await loadStats()
          } else {
            ElMessage.error(res.message || '导入失败')
          }
        } catch (error) {
          ElMessage.error('导入失败: ' + error.message)
        } finally {
          loading.close()
        }
      }
    }
    input.click()
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

const exportData = async () => {
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '正在导出...',
      background: 'rgba(0,0,0,0.4)'
    })
    
    const params = {
      teacherId,
      format: 'excel',
      search: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
      college: filterCollege.value || undefined
    }
    
    const res = await exportStudentData(params)
    
    // 创建下载链接
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `学生数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    loading?.close()
  }
}

const handleBatchAssignAdvisor = async () => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择学生')
    return
  }
  
  try {
    await ElMessageBox.prompt('请选择导师:', '批量分配导师', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '输入导师姓名或ID'
    }).then(async ({ value }) => {
      if (value) {
        const loading = ElLoading.service({
          lock: true,
          text: '正在分配...',
          background: 'rgba(0,0,0,0.4)'
        })
        
        try {
          const res = await batchAssignAdvisor({
            studentIds: selectedStudents.value.map(s => s.studentId),
            advisorName: value
          })
          if (res.code === 200) {
            ElMessage.success('批量分配成功')
            selectedStudents.value.forEach(student => {
              student.advisorName = value
            })
            clearSelection()
          } else {
            ElMessage.error(res.message || '分配失败')
          }
        } catch (error) {
          ElMessage.error('操作失败: ' + error.message)
        } finally {
          loading.close()
        }
      }
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

const handleBatchSendMessage = async () => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择学生')
    return
  }
  
  try {
    await ElMessageBox.prompt('请输入消息内容:', '批量发送消息', {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入要发送的消息内容...'
    }).then(async ({ value }) => {
      if (value) {
        const loading = ElLoading.service({
          lock: true,
          text: '正在发送...',
          background: 'rgba(0,0,0,0.4)'
        })
        
        try {
          const res = await batchSendMessage({
            receiverIds: selectedStudents.value.map(s => s.studentId),
            receiverType: 'student',
            content: value,
            title: '系统通知'
          })
          if (res.code === 200) {
            ElMessage.success('批量发送成功')
            clearSelection()
          } else {
            ElMessage.error(res.message || '发送失败')
          }
        } catch (error) {
          ElMessage.error('发送失败: ' + error.message)
        } finally {
          loading.close()
        }
      }
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

const batchExport = async () => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择学生')
    return
  }
  
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '正在导出...',
      background: 'rgba(0,0,0,0.4)'
    })
    
    const params = {
      teacherId,
      format: 'excel',
      studentIds: selectedStudents.value.map(s => s.studentId).join(',')
    }
    
    const res = await exportStudentData(params)
    
    // 创建下载链接
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `选中学生数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    loading?.close()
  }
}

const batchDelete = async () => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择学生')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedStudents.value.length} 个学生吗？删除后不可恢复！`, 
      '批量删除确认', 
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      const loading = ElLoading.service({
        lock: true,
        text: '正在删除...',
        background: 'rgba(0,0,0,0.4)'
      })
      
      try {
        const studentIds = selectedStudents.value.map(s => s.studentId)
        const res = await batchDeleteStudents(studentIds)
        if (res.code === 200) {
          ElMessage.success('批量删除成功')
          // 从本地数据中移除
          students.value = students.value.filter(student => 
            !studentIds.includes(student.studentId)
          )
          total.value = Math.max(0, (total.value || 0) - studentIds.length)
          clearSelection()
          // 重新加载数据以确保分页正确
          await loadStudents()
        } else {
          ElMessage.error(res.message || '删除失败')
        }
      } catch (error) {
        ElMessage.error('删除失败: ' + error.message)
      } finally {
        loading.close()
      }
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

const clearSelection = () => {
  selectedStudents.value = []
}

onMounted(async () => {
  await Promise.all([
    loadStudents(),
    loadStats()
  ])
})
</script>

<style lang="scss" scoped>
.student-management {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea0d 0%, #764ba20d 100%);
}

// 页面头部
.page-header {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #2c3e50;
      }

      .page-subtitle {
        margin: 0;
        color: #7f8c8d;
        font-size: 0.875rem;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }
}

// 统计卡片
.stats-row {
  margin-bottom: 24px;

  .stat-card {
    border-radius: 12px;
    border: none;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        margin-right: 16px;

        .el-icon {
          color: white;
          font-size: 1.5rem;
        }
      }

      .stat-info {
        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin-top: 4px;
        }
      }
    }
  }
}

// 筛选区域
.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;

  .filter-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    .filter-left {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      flex: 1;

      .search-input {
        width: 300px;
      }

      .filter-select {
        width: 150px;
      }
    }

    .filter-right {
      display: flex;
      gap: 8px;
    }
  }
}

// 列表卡片
.list-card {
  border-radius: 12px;
  border: none;

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 1.125rem;
      color: #2c3e50;

      .el-icon {
        color: #667eea;
      }

      .total-count {
        font-size: 0.875rem;
        color: #7f8c8d;
        margin-left: 8px;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .student-table {
    width: 100%;

    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .student-avatar {
        flex-shrink: 0;
      }

      .student-name {
        .name {
          font-weight: 500;
          color: #2c3e50;
        }

        .gender {
          font-size: 0.75rem;
          color: #7f8c8d;
          margin-top: 2px;
        }
      }
    }

    .student-id {
      font-family: 'Monaco', 'Consolas', monospace;
      color: #667eea;
      font-weight: 500;
    }

    .major,
    .grade {
      color: #5a6c7d;
    }

    .advisor-info {
      .advisor-name {
        color: #2c3e50;
        font-weight: 500;
      }
    }

    .no-advisor,
    .no-submit {
      color: #999;
      font-style: italic;
    }

    .submit-time {
      color: #5a6c7d;
      font-size: 0.875rem;
    }

    .similarity-progress {
      display: inline-block;
      width: 60px;
      margin-right: 8px;
    }

    .similarity-value {
      font-size: 0.875rem;
      color: #5a6c7d;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }
  }

  .pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
  }
}

// 批量操作区域
.batch-operations {
  margin-top: 16px;
  position: sticky;
  bottom: 20px;
  z-index: 100;

  .batch-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;

    .batch-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #2c3e50;

      .el-icon {
        color: #667eea;
      }
    }

    .batch-actions {
      display: flex;
      gap: 8px;
    }
  }
}

// 论文预览样式
.paper-preview-dialog {
  .preview-container {
    height: 70vh;
    display: flex;
    flex-direction: column;
  }
  
  .paper-info-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 16px;
    
    .info-item {
      .label {
        font-weight: 500;
        color: #606266;
        margin-right: 4px;
      }
      .value {
        color: #303133;
      }
    }
  }
  
  .preview-wrapper {
    flex: 1;
    position: relative;
    
    .preview-iframe {
      width: 100%;
      height: 100%;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
    }
    
    .preview-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      
      .error-detail {
        color: #909399;
        margin: 16px 0;
      }
    }
  }
  
  .preview-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    padding: 16px;

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .header-right {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
      }
    }
  }

  .filter-content {
    flex-direction: column;
    align-items: flex-start !important;

    .filter-left {
      width: 100%;

      .search-input,
      .filter-select {
        width: 100% !important;
      }
    }

    .filter-right {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .batch-content {
    flex-direction: column;
    gap: 16px !important;

    .batch-actions {
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  .student-table {
    :deep(.el-table__cell) {
      padding: 8px 0;
    }
  }
}

@media (max-width: 992px) {
  .stats-row {
    .el-col {
      margin-bottom: 16px;
    }
  }
}
</style>