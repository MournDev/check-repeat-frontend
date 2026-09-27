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
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon-wrapper">
            <el-icon>
              <User />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.totalStudents || 0 }}</div>
            <div class="stat-label">总学生数</div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon-wrapper">
            <el-icon>
              <Document />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.submittedStudents || 0 }}</div>
            <div class="stat-label">已提交论文</div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon-wrapper">
            <el-icon>
              <UserFilled />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.assignedStudents || 0 }}</div>
            <div class="stat-label">已分配导师</div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon-wrapper">
            <el-icon>
              <Check />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.completedStudents || 0 }}</div>
            <div class="stat-label">已完成审核</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索区域 -->
    <div class="filter-card">
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
    </div>

    <!-- 学生列表 -->
    <div class="list-card">
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

      <el-table :data="filteredStudents" v-loading="loading" stripe class="student-table"
        @sort-change="handleSortChange">
        <el-table-column type="index" label="序号" width="55" align="center" />

        <el-table-column prop="username" label="学号" width="130" sortable>
          <template #default="{ row }">
            <span class="student-id">{{ row.username }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="studentName" label="姓名" min-width="90" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <div class="student-info">
              <div class="student-name">
                <div class="name">{{ row.studentName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="collegeName" label="学院" min-width="120" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.collegeName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="major" label="专业" min-width="140" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <span class="major">{{ row.major }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="grade" label="年级" width="80" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <span class="grade">{{ row.grade }}级</span>
          </template>
        </el-table-column>

        <el-table-column prop="paperStatus" label="论文状态" min-width="110" sortable>
          <template #default="{ row }">
            <template v-if="row.paperCount && row.paperCount > 1">
              <el-tag type="info" effect="light" size="small" @click="viewAllPapers(row)" style="cursor: pointer;">
                多篇论文 ({{ row.paperCount }})
              </el-tag>
            </template>
            <template v-else>
              <el-tag :type="getStatusType(row.paperStatus)" effect="light" size="small">
                {{ getStatusText(row.paperStatus) }}
              </el-tag>
            </template>
          </template>
        </el-table-column>

        <el-table-column prop="advisorName" label="指导老师" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.advisorName" class="advisor-info">
              <span class="advisor-name">{{ row.advisorName }}</span>
            </div>
            <span v-else class="no-advisor">未分配</span>
          </template>
        </el-table-column>

        <el-table-column prop="submitTime" label="提交时间" width="155" sortable>
          <template #default="{ row }">
            <span v-if="row.submitTime" class="submit-time">
              {{ formatDate(row.submitTime) }}
            </span>
            <span v-else class="no-submit">--</span>
          </template>
        </el-table-column>

        <el-table-column prop="similarity" label="相似度" width="115" sortable>
          <template #default="{ row }">
            <div v-if="row.similarity !== null && row.similarity !== undefined">
              <el-progress :percentage="row.similarity" :stroke-width="6" :show-text="false"
                :color="getSimilarityColor(row.similarity)" class="similarity-progress" />
              <span class="similarity-value">{{ row.similarity }}%</span>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
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
        <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 批量操作区域 -->
    <div class="batch-operations" v-if="selectedStudents?.length > 0">
      <div class="batch-card">
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
      </div>
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

    <!-- 论文列表对话框 -->
    <el-dialog 
      v-model="papersDialogVisible" 
      :title="`${currentStudent?.studentName} 的论文列表`" 
      width="80%" 
      top="5vh"
    >
      <div class="papers-container">
        <el-table :data="studentPapers" stripe class="papers-table">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="paperTitle" label="论文标题">
            <template #default="{ row }">
              <span class="paper-title">{{ row.paperTitle }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submitTime" label="提交时间" width="140">
            <template #default="{ row }">
              <span class="submit-time">{{ formatDate(row.submitTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="similarity" label="相似度" width="100">
            <template #default="{ row }">
              <div v-if="row.similarity !== null && row.similarity !== undefined">
                <el-progress :percentage="row.similarity" :stroke-width="6" :show-text="false"
                  :color="getSimilarityColor(row.similarity)" class="similarity-progress" />
                <span class="similarity-value">{{ row.similarity }}%</span>
              </div>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button type="primary" :icon="Document" size="small" @click="viewPaperFromList(row)" title="查看论文" />
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="studentPapers.length === 0" class="empty-papers">
          <el-empty description="暂无论文" :image-size="120" />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="papersDialogVisible = false">关闭</el-button>
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
  getStudentPaper,
  getStudentPapers
} from '@/api/teacher'
import { useUserStore } from '@/stores/user'
import { getSimilarityColor } from '@/utils/reviewStatus.js'

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

// 论文列表相关数据
const papersDialogVisible = ref(false)
const studentPapers = ref([])
const currentStudent = ref(null)

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
      // 检查返回的数据结构
      if (res.data.records) {
        // 后端返回的是Page对象
        students.value = res.data.records || []
        total.value = res.data.total || 0
      } else if (res.data.list) {
        // 后端返回的是自定义结构
        students.value = res.data.list || []
        total.value = res.data.totalCount || 0
      } else {
        // 其他结构
        students.value = []
        total.value = 0
      }
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
    const loadingRef = ElLoading.service({
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
        const previewApiUrl = `/check/api/v1/file/smartPreview?fileId=${res.data.fileId}`
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
      loadingRef?.close()
    }, 500)
  }
}

const viewAllPapers = async (student) => {
  try {
    // 显示加载状态
    const loadingRef2 = ElLoading.service({
      lock: true,
      text: '正在加载论文列表...',
      background: 'rgba(0,0,0,0.4)'
    })
    
    // 获取学生所有论文
    const res = await getStudentPapers(student.studentId)
    
    if (res.code === 200 && res.data) {
      studentPapers.value = res.data
      currentStudent.value = student
      papersDialogVisible.value = true
    } else {
      ElMessage.warning(res.message || '未找到该学生的论文信息')
    }
  } catch (error) {
    console.error('获取论文列表失败:', error)
    ElMessage.error('获取论文列表失败: ' + error.message)
  } finally {
    // 关闭加载状态
    setTimeout(() => {
      loadingRef2?.close()
    }, 500)
  }
}

const viewPaperFromList = (paper) => {
  currentPaper.value = paper
  
  // 如果有文件ID，则进行预览
  if (paper.fileId) {
    // 使用已有的KKFileView预览逻辑
    const previewApiUrl = `/check/api/v1/file/smartPreview?fileId=${paper.fileId}`
    previewUrl.value = previewApiUrl
    previewVisible.value = true
    previewLoading.value = true
    previewError.value = false
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
    const previewApiUrl = `/check/api/v1/file/smartPreview?fileId=${currentPaper.value.fileId}`
    previewUrl.value = previewApiUrl
  }
}

const downloadPaper = () => {
  if (currentPaper.value?.fileId) {
    // 实现下载逻辑
    const link = document.createElement('a')
    link.href = `/api/v1/file/download/${currentPaper.value.fileId}`
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
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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
  min-height: 100vh;
  background: var(--apple-canvas-parchment);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
  padding: var(--apple-spacing-xl);
}

// 页面头部
.page-header {
  margin-bottom: var(--apple-spacing-xxl);
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  padding: var(--apple-spacing-xl);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--apple-hairline);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--apple-ink);
      }

      .page-subtitle {
        margin: 0;
        color: var(--apple-ink-muted-48);
        font-size: 0.875rem;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
      
      .el-button {
        border-radius: var(--apple-rounded-lg);
        transition: border-color 0.2s ease;
        border: 1px solid var(--apple-hairline);

        &:hover {
          /* translateY + box-shadow removed for Apple HIG */
          border-color: var(--apple-hairline);
        }
      }
    }
  }
}

// 统计卡片
.stats-row {
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;

  .stat-card {
    background: var(--apple-surface);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-xl);
    padding: 20px;
    transition: border-color 0.2s ease;
    
    &:hover {
      /* translateY removed for Apple HIG */;
      /* box-shadow removed for Apple HIG */;
      border-color: var(--apple-hairline);
    }

    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: var(--apple-rounded-lg);
        margin-right: 16px;
        background: var(--apple-canvas-parchment);

        .el-icon {
          color: var(--apple-ink-muted-48); // Slate-600
          font-size: 1.5rem;
        }
      }

      .stat-info {
        .stat-number {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--apple-ink); // Slate-900
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--apple-ink-muted-48); // Slate-500
          margin: 0;
        }
      }
    }
  }
}

// 筛选区域
.filter-card {
  margin-bottom: 24px;
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  padding: 20px;
  transition: border-color 0.2s ease;
  
  &:hover {
    /* box-shadow removed for Apple HIG */;
    border-color: var(--apple-hairline);
  }

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
        
        :deep(.el-input__wrapper) {
          border-radius: var(--apple-rounded-lg);
          border: 1px solid var(--apple-hairline);
          transition: border-color 0.2s ease;
          
          &:hover {
            border-color: var(--apple-hairline);
            /* box-shadow removed for Apple HIG */
          }
        }
      }

      .filter-select {
        width: 150px;
        
        :deep(.el-select__wrapper) {
          border-radius: var(--apple-rounded-lg);
          border: 1px solid var(--apple-hairline);
          transition: border-color 0.2s ease;
          
          &:hover {
            border-color: var(--apple-hairline);
            /* box-shadow removed for Apple HIG */
          }
        }
      }
    }

    .filter-right {
      display: flex;
      gap: 8px;
      
      .el-button {
        border-radius: var(--apple-rounded-lg);
        transition: border-color 0.2s ease;
        border: 1px solid var(--apple-hairline);

        &:hover {
          /* translateY + box-shadow removed for Apple HIG */
          border-color: var(--apple-hairline);
        }
      }
    }
  }
}

// 列表卡片
.list-card {
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  margin-bottom: 24px;
  transition: border-color 0.2s ease;
  
  &:hover {
    /* box-shadow removed for Apple HIG */;
    border-color: var(--apple-hairline);
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: var(--apple-canvas-parchment);
    border-bottom: 1px solid var(--apple-hairline);

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 1.125rem;
      color: var(--apple-ink); // Slate-900

      .el-icon {
        color: var(--apple-ink-muted-48); // Slate-600
      }

      .total-count {
        font-size: 0.875rem;
        color: var(--apple-ink-muted-48); // Slate-500
        margin-left: 8px;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
      
      .el-button {
        border-radius: var(--apple-rounded-lg);
        transition: border-color 0.2s ease;
        border: 1px solid var(--apple-hairline);

        &:hover {
          /* translateY + box-shadow removed for Apple HIG */
          border-color: var(--apple-hairline);
        }
      }
    }
  }

  .student-table {
    width: 100%;

    :deep(.el-table__header-wrapper) {
      background-color: var(--apple-canvas-parchment);
      
      th {
        color: var(--apple-ink); // Slate-900
        font-weight: 600;
        border-bottom: 2px solid var(--apple-hairline);
        padding: 12px 16px;
      }
    }
    
    :deep(.el-table__row:hover) {
      background-color: var(--apple-canvas-parchment);
      transition: background-color 0.2s ease;
    }
    
    :deep(.el-table__row) {
      transition: border-color 0.2s ease;
      padding: 16px 0;
    }
    
    :deep(.el-table__row.el-table__row--striped) {
      background-color: var(--apple-canvas-parchment);
    }
    
    :deep(.el-table__cell) {
      padding: 16px;
      color: var(--apple-ink); // Slate-900
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: var(--apple-canvas-parchment);
      border-radius: var(--apple-rounded-lg);
      transition: border-color 0.2s ease;
      
      &:hover {
        background: var(--apple-canvas-parchment);
      }

      .student-name {
        .name {
          font-weight: 600;
          color: var(--apple-ink); // Slate-900
        }
      }
    }

    .student-id {
      font-family: 'Monaco', 'Consolas', monospace;
      color: var(--apple-primary); // Blue-500
      font-weight: 600;
      padding: 4px 8px;
      background: var(--apple-canvas-parchment);
      border-radius: 8px;
    }

    .major,
    .grade {
      color: var(--apple-ink-muted-48); // Slate-500
      padding: 4px 8px;
      background: var(--apple-canvas-parchment);
      border-radius: 8px;
    }

    .advisor-info {
      .advisor-name {
        color: var(--apple-ink); // Slate-900
        font-weight: 600;
        padding: 4px 8px;
        background: var(--apple-canvas-parchment);
        border-radius: 8px;
      }
    }

    .no-advisor,
    .no-submit {
      color: var(--apple-ink-muted-48); // Slate-400
      font-style: italic;
      padding: 4px 8px;
      background: var(--apple-canvas-parchment);
      border-radius: 8px;
    }

    .submit-time {
      color: var(--apple-ink-muted-48); // Slate-500
      font-size: 0.875rem;
      padding: 4px 8px;
      background: var(--apple-canvas-parchment);
      border-radius: 8px;
    }

    .similarity-progress {
      display: inline-block;
      width: 80px;
      margin-right: 8px;
      
      :deep(.el-progress__bar) {
        border-radius: 8px;
      }
      
      :deep(.el-progress__bar__outer) {
        background: var(--apple-hairline);
        border-radius: 8px;
      }
    }

    .similarity-value {
      font-size: 0.875rem;
      color: var(--apple-ink-muted-48); // Slate-500
      font-weight: 400;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      
      .el-button {
        border-radius: var(--apple-rounded-lg);
        transition: border-color 0.2s ease;
        border: 1px solid var(--apple-hairline);

        &:hover {
          /* translateY + box-shadow removed for Apple HIG */
          border-color: var(--apple-hairline);
        }
      }
    }
  }

  .pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    padding: 0 20px 20px;
    
    :deep(.el-pagination) {
      .el-pagination__item {
        border-radius: var(--apple-rounded-lg);
        border: 1px solid var(--apple-hairline);
        
        &:hover {
          color: var(--apple-primary); // Blue-500
          border-color: var(--apple-primary);
        }
        
        &.is-active {
          background-color: var(--apple-primary);
          border-color: var(--apple-primary);
        }
      }
    }
  }
}

// 批量操作区域
.batch-operations {
  margin-top: 16px;
  position: sticky;
  bottom: 24px;
  z-index: 100;

  .batch-card {
    background: var(--apple-surface);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-xl);
    padding: 16px 24px;
    transition: border-color 0.2s ease;
    
    &:hover {
      /* box-shadow removed for Apple HIG */;
      border-color: var(--apple-hairline);
    }
  }

  .batch-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .batch-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 400;
      color: var(--apple-ink); // Slate-900

      .el-icon {
        color: var(--apple-ink-muted-48); // Slate-600
      }
    }

    .batch-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      .el-button {
        border-radius: var(--apple-rounded-lg);
        transition: border-color 0.2s ease;
        border: 1px solid var(--apple-hairline);

        &:hover {
          /* translateY + box-shadow removed for Apple HIG */
          border-color: var(--apple-hairline);
        }
      }
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
    padding: 16px;
    background: var(--apple-canvas-parchment);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-lg);
    margin-bottom: 16px;
    
    .info-item {
      .label {
        font-weight: 400;
        color: var(--apple-ink-muted-48); // Slate-500
        margin-right: 4px;
      }
      .value {
        color: var(--apple-ink); // Slate-900
      }
    }
  }
  
  .preview-wrapper {
    flex: 1;
    position: relative;
    
    .preview-iframe {
      width: 100%;
      height: 100%;
      border: 1px solid var(--apple-hairline);
      border-radius: var(--apple-rounded-lg);
    }
    
    .preview-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      
      .error-detail {
        color: var(--apple-ink-muted-48); // Slate-400
        margin: 16px 0;
      }
    }
  }
  
  .preview-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--apple-hairline);
    
    .el-button {
      border-radius: var(--apple-rounded-lg);
      transition: border-color 0.2s ease;
      border: 1px solid var(--apple-hairline);
      
      &:hover {
        /* translateY + box-shadow removed for Apple HIG */
        border-color: var(--apple-hairline);
      }
    }
  }
}

// 论文列表对话框样式
.papers-container {
  .papers-table {
    width: 100%;

    :deep(.el-table__header-wrapper) {
      background-color: var(--apple-canvas-parchment);
      
      th {
        color: var(--apple-ink); // Slate-900
        font-weight: 600;
        border-bottom: 2px solid var(--apple-hairline);
        padding: 12px 16px;
      }
    }
    
    :deep(.el-table__row:hover) {
      background-color: var(--apple-canvas-parchment);
      transition: background-color 0.2s ease;
    }
    
    :deep(.el-table__row) {
      transition: border-color 0.2s ease;
      padding: 16px 0;
    }
    
    :deep(.el-table__row.el-table__row--striped) {
      background-color: var(--apple-canvas-parchment);
    }
    
    :deep(.el-table__cell) {
      padding: 12px;
      color: var(--apple-ink); // Slate-900
    }

    .paper-title {
      color: var(--apple-ink);
      font-weight: 400;
      padding: 4px 8px;
      background: var(--apple-canvas-parchment);
      border-radius: 8px;
    }

    .submit-time {
      color: var(--apple-ink-muted-48);
      font-size: 0.875rem;
      padding: 4px 8px;
      background: var(--apple-canvas-parchment);
      border-radius: 8px;
    }

    .similarity-progress {
      display: inline-block;
      width: 80px;
      margin-right: 8px;
      
      :deep(.el-progress__bar) {
        border-radius: 8px;
      }
      
      :deep(.el-progress__bar__outer) {
        background: var(--apple-hairline);
        border-radius: 8px;
      }
    }

    .similarity-value {
      font-size: 0.875rem;
      color: var(--apple-ink-muted-48);
      font-weight: 400;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      
      .el-button {
        border-radius: 8px;
        transition: border-color 0.2s ease;
        
        &:hover {
          /* translateY + box-shadow removed for Apple HIG */
        }
      }
    }
  }
  
  .empty-papers {
    text-align: center;
    padding: 40px 0;
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

  .papers-table {
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