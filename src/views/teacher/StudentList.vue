<template>
  <div class="student-management">
    <!-- 页面头部 -->
    <PageHeader description="管理所有学生信息，分配导师，跟踪论文进度">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="addNewStudent" size="large">
          添加学生
        </el-button>
        <el-button :icon="Upload" @click="importStudents" size="large">
          批量导入
        </el-button>
        <el-button :icon="Download" @click="exportData" size="large">
          导出数据
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计卡片（可点击过滤） -->
    <StudentStats
      :stats="stats"
      :active-filter="filterStatus"
      @filter="onStatFilter"
    />

    <!-- 筛选工具条 -->
    <StudentFilterBar
      v-model:keyword="searchQuery"
      v-model:status="filterStatus"
      v-model:college="filterCollege"
      :college-list="collegeList"
      @reset="resetFilters"
    />

    <!-- 学生列表 -->
    <StudentTable
      ref="studentTableRef"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :students="students"
      :loading="loading"
      :total="total"
      :selected-count="selectedStudents.length"
      @selection-change="onSelectionChange"
      @refresh="refreshList"
      @view-paper="viewPaper"
      @view-all-papers="viewAllPapers"
      @assign-tutor="handleAssignTutor"
      @message="handleMessage"
      @delete="deleteStudent"
      @batch-assign-advisor="handleBatchAssignAdvisor"
      @batch-send-message="handleBatchSendMessage"
      @batch-export="batchExport"
      @batch-delete="batchDelete"
    />

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
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import {
  getStudentListFull,
  deleteStudent as deleteStudentapi,
  getStudentStats,
  assignAdvisor as assignAdvisorApi,
  sendSystemMessage as sendMessageApi,
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
import { getSimilarityColor } from '@/utils/similarity.js'
import { getPreviewUrl, downloadFileBlob } from '@/utils/filePreview'
import StudentStats from './components/StudentStats.vue'
import StudentFilterBar from './components/StudentFilterBar.vue'
import StudentTable from './components/StudentTable.vue'
import PageHeader from '@/components/common/PageHeader.vue'

// 图标引入
import {
  Plus, Upload, Download, Refresh, Document
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const teacherId = userStore.userInfo?.userId

// 子组件 ref
const studentTableRef = ref(null)

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

// collegeList：把 colleges 转 [{value,label}] 给 StudentFilterBar
const collegeList = computed(() => {
  return (colleges.value || []).map(c => ({
    value: c.collegeCode,
    label: c.collegeName
  }))
})

// ── stat-card 点击过滤 ──────────────────────────────────────
const onStatFilter = async (status) => {
  // 点击 active 卡片 → 取消过滤
  filterStatus.value = filterStatus.value === status ? '' : status
  currentPage.value = 1
  await loadStudents()
  await nextTick()
  studentTableRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const onSelectionChange = (selection) => {
  selectedStudents.value = selection
}

// ── 数据加载 ────────────────────────────────────────────────
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
      if (res.data.records) {
        students.value = res.data.records || []
        total.value = res.data.total || 0
      } else if (res.data.list) {
        students.value = res.data.list || []
        total.value = res.data.totalCount || 0
      } else {
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
    // 刷新后清跨页勾选（范式见 usePendingPapers.js onLoaded）
    await nextTick()
    studentTableRef.value?.clearSelection()
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
}

// ── 展示工具方法（供 dialog 内部使用） ──────────────────────
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

// ── 学生行操作 ──────────────────────────────────────────────
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
  let loadingRef = null
  try {
    loadingRef = ElLoading.service({
      lock: true,
      text: '正在加载论文信息...',
      background: 'rgba(0,0,0,0.4)'
    })

    const res = await getStudentPaper(student.studentId)

    if (res.code === 200 && res.data) {
      currentPaper.value = res.data

      if (res.data.fileId) {
        // 先带 JWT 取回后端给出的预览地址，再交给 iframe 直接加载：
        // office 是 kkFileView 的预览页、其余是直出的文件流，两者都不能包成 blob
        previewVisible.value = true
        previewLoading.value = true
        previewError.value = false
        try {
          previewUrl.value = await getPreviewUrl(res.data.fileId)
        } catch (error) {
          previewError.value = true
          errorMessage.value = error.message || '论文预览加载失败'
        } finally {
          previewLoading.value = false
        }
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
    setTimeout(() => {
      loadingRef?.close()
    }, 500)
  }
}

const viewAllPapers = async (student) => {
  let loadingRef2 = null
  try {
    loadingRef2 = ElLoading.service({
      lock: true,
      text: '正在加载论文列表...',
      background: 'rgba(0,0,0,0.4)'
    })

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
    setTimeout(() => {
      loadingRef2?.close()
    }, 500)
  }
}

const viewPaperFromList = async (paper) => {
  currentPaper.value = paper

  if (paper.fileId) {
    previewVisible.value = true
    previewLoading.value = true
    previewError.value = false
    try {
      previewUrl.value = await getPreviewUrl(paper.fileId)
    } catch (error) {
      previewError.value = true
      errorMessage.value = error.message || '论文预览加载失败'
    } finally {
      previewLoading.value = false
    }
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
      const idx = students.value.findIndex(s =>
        String(s.studentId) === String(student.studentId)
      )
      if (idx > -1) {
        students.value.splice(idx, 1)
        total.value = Math.max(0, (total.value || 0) - 1)
      }

      if (students.value.length === 0 && currentPage.value > 1) {
        currentPage.value = currentPage.value - 1
        await loadStudents()
      }

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

// ── 论文预览相关 ────────────────────────────────────────────
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

const retryPreview = async () => {
  if (currentPaper.value?.fileId) {
    previewLoading.value = true
    previewError.value = false
    try {
      previewUrl.value = await getPreviewUrl(currentPaper.value.fileId)
    } catch (error) {
      previewError.value = true
      errorMessage.value = error.message || '论文预览加载失败'
    } finally {
      previewLoading.value = false
    }
  }
}

const downloadPaper = async () => {
  if (currentPaper.value?.fileId) {
    try {
      await downloadFileBlob(
        `/api/file/download/${currentPaper.value.fileId}/${encodeURIComponent(currentPaper.value.fileName || '论文文件')}`,
        currentPaper.value.fileName || '论文文件'
      )
    } catch (error) {
      ElMessage.error(error.message || '下载失败，请重试')
    }
    closePreview()
  }
}

// ── 添加学生 ────────────────────────────────────────────────
const addNewStudent = () => {
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
      let loading = null
      try {
        loading = ElLoading.service({
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

// ── 批量导入 / 导出 ─────────────────────────────────────────
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
  let loading = null
  try {
    loading = ElLoading.service({
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

// ── 批量操作 ────────────────────────────────────────────────
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
            studentTableRef.value?.clearSelection()
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
            studentTableRef.value?.clearSelection()
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

  let loading = null
  try {
    loading = ElLoading.service({
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
          students.value = students.value.filter(student =>
            !studentIds.includes(student.studentId)
          )
          total.value = Math.max(0, (total.value || 0) - studentIds.length)
          studentTableRef.value?.clearSelection()
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

// 论文预览弹层样式（append-to-body，scoped :deep() 不生效，外壳依赖全局；slot 内元素可正常 scoped）
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
        color: var(--apple-ink-muted-48);
        margin-right: 4px;
      }
      .value {
        color: var(--apple-ink);
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
        color: var(--apple-ink-muted-48);
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
  }
}

// 论文列表弹层内部样式
.papers-container {
  .papers-table {
    width: 100%;

    :deep(.el-table__header-wrapper) {
      background-color: var(--apple-canvas-parchment);

      th {
        color: var(--apple-ink);
        font-weight: 600;
        border-bottom: 2px solid var(--apple-hairline);
        padding: 12px 16px;
      }
    }

    :deep(.el-table__row:hover) {
      background-color: var(--apple-canvas-parchment);
      transition: background-color 0.2s ease;
    }

    :deep(.el-table__row.el-table__row--striped) {
      background-color: var(--apple-canvas-parchment);
    }

    :deep(.el-table__cell) {
      padding: 12px;
      color: var(--apple-ink);
    }
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
  }

  .empty-papers {
    text-align: center;
    padding: 40px 0;
  }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.student-management {
  padding: var(--apple-spacing-xl);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);

  :deep(.el-dialog) {
    border-radius: var(--apple-rounded-lg);
  }
}

.paper-preview-dialog {
  .paper-info-bar {
    gap: var(--apple-spacing-md);
    padding: var(--apple-spacing-sm) var(--apple-spacing-md);
    margin-bottom: var(--apple-spacing-md);
    border-radius: var(--apple-rounded-lg);

    .info-item {
      font-size: var(--apple-fs-caption);

      .label {
        margin-right: var(--apple-spacing-xxs);
      }
    }
  }

  .preview-wrapper {
    .preview-iframe {
      border-radius: var(--apple-rounded-lg);
    }

    .preview-error .error-detail {
      margin: var(--apple-spacing-sm) 0;
      font-size: var(--apple-fs-caption);
    }
  }

  .preview-footer {
    gap: var(--apple-spacing-sm);
    padding-top: var(--apple-spacing-md);
  }
}

.papers-container {
  .papers-table {
    :deep(.el-table__header-wrapper) th {
      padding: var(--apple-spacing-xs) var(--apple-spacing-sm);
    }

    :deep(.el-table__cell) {
      padding: var(--apple-spacing-xs);
      font-size: var(--apple-fs-caption);
    }
  }

  .paper-title {
    padding: var(--apple-spacing-xxs) var(--apple-spacing-xs);
    border-radius: var(--apple-rounded-sm);
  }

  .submit-time {
    padding: var(--apple-spacing-xxs) var(--apple-spacing-xs);
    border-radius: var(--apple-rounded-sm);
    font-size: var(--apple-fs-fine-print);
  }

  .similarity-value {
    font-size: var(--apple-fs-fine-print);
  }

  .action-buttons {
    gap: var(--apple-spacing-xs);
  }

  .empty-papers {
    padding: var(--apple-spacing-xl) 0;
  }
}

@media (max-width: 768px) {
  .student-management {
    padding: var(--apple-spacing-md) var(--apple-spacing-sm);
  }

  .paper-preview-dialog .preview-container {
    height: 60vh;
  }
}
</style>
