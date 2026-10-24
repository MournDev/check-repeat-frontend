<template>
  <div class="student-management">
    <!-- 页面说明：主操作收进列表卡工具栏 -->
    <PageHeader description="管理所有学生信息，分配导师，跟踪论文进度" />

    <!-- 统计卡片（可点击过滤） -->
    <StudentStats
      :stats="stats"
      :active-filter="filterStatus"
      @filter="onStatFilter"
    />

    <ListPageShell
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      title="学生列表"
      :icon="List"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      show-total
      total-suffix="人"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <!-- 建号与导入归管理员（/admin/user-management）：教师端只做查阅、跟踪与批量沟通 -->
      <template #toolbar>
        <el-button :icon="Download" @click="exportData">导出数据</el-button>
        <el-button text :icon="Refresh" @click="refreshList">刷新</el-button>
      </template>

      <template #filters>
        <StudentFilterBar
          v-model:keyword="searchQuery"
          v-model:status="filterStatus"
          v-model:college="filterCollege"
          :college-list="collegeList"
          @search="handleSearch"
          @reset="resetFilters"
        />
      </template>

      <StudentTable
        ref="studentTableRef"
        :students="students"
        :loading="loading"
        :selected-count="selectedStudents.length"
        @selection-change="onSelectionChange"
        @view-paper="viewPaper"
        @view-all-papers="viewAllPapers"
        @assign-tutor="handleAssignTutor"
        @message="handleMessage"
        @delete="deleteStudent"
        @batch-send-message="handleBatchSendMessage"
        @batch-export="batchExport"
        @batch-delete="batchDelete"
      />
    </ListPageShell>

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
            <span class="value">{{ formatDate(currentPaper.submitTime, '--') }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件大小：</span>
            <span class="value">{{ currentPaper.fileSize }}</span>
          </div>
          <div class="info-item">
            <span class="label">相似度：</span>
            <span class="value">{{ formatPercent(currentPaper.similarity) }}</span>
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
              <span class="submit-time">{{ formatDate(row.submitTime, '--') }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="similarity" label="相似度" width="100">
            <template #default="{ row }">
              <div v-if="row.similarity !== null && row.similarity !== undefined">
                <el-progress :percentage="row.similarity" :stroke-width="6" :show-text="false"
                  :color="getSimilarityColor(row.similarity)" class="similarity-progress" />
                <span class="similarity-value">{{ formatPercent(row.similarity) }}</span>
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
  batchSendMessage,
  batchDeleteStudents,
  exportStudentData,
  getColleges,
  getStudentPaper,
  getStudentPapers
} from '@/api/teacher'
import { useUserStore } from '@/stores/user'
import { getSimilarityColor } from '@/utils/similarity.js'
import { formatPercent, formatDate, getPaperStatusText, getPaperStatusType } from '@/utils/dataType.js'
import { getPreviewUrl, downloadFileBlob } from '@/utils/filePreview'
import StudentStats from './components/StudentStats.vue'
import StudentFilterBar from './components/StudentFilterBar.vue'
import StudentTable from './components/StudentTable.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ListPageShell from '@/components/common/ListPageShell.vue'

// 图标引入
import {
  Download, Refresh, Document, List
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

// 学院列表：供筛选栏与（只读的）学生信息展示使用
const colleges = ref([])

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

const handlePageChange = (page) => {
  currentPage.value = page
  loadStudents()
}

const handleSizeChange = (size) => {
  pageSize.value = size
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
// 论文状态文案与标签色统一走 utils/reviewStatus.js（与 DB 字典 paper_status 对齐）
const getStatusType = (status) => getPaperStatusType(status)
const getStatusText = (status) => getPaperStatusText(status)

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

// ── 导出 ────────────────────────────────────────────────────
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
    loadStats(),
    // 学院列表此前只在「添加学生」弹窗里懒加载，入口移除后改在首屏拉取，
    // 否则筛选栏的学院下拉永远是空
    loadColleges()
  ])
})
</script>

<style lang="scss" scoped>

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
    gap: var(--app-space-4);
    padding: var(--app-space-3) var(--app-space-4);
    background: var(--app-color-fill);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);
    margin-bottom: var(--app-space-4);

    .info-item {
      font-size: var(--app-fs-caption);

      .label {
        font-weight: 400;
        color: var(--app-color-text-muted);
        margin-right: var(--app-space-1);
      }
      .value {
        color: var(--app-color-ink);
      }
    }
  }

  .preview-wrapper {
    flex: 1;
    position: relative;

    .preview-iframe {
      width: 100%;
      height: 100%;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
    }

    .preview-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;

      .error-detail {
        color: var(--app-color-text-muted);
        margin: var(--app-space-3) 0;
        font-size: var(--app-fs-caption);
      }
    }
  }

  .preview-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--app-space-3);
    padding-top: var(--app-space-4);
    border-top: 1px solid var(--app-color-border);
  }
}

// 论文列表弹层内部样式
.papers-container {
  .papers-table {
    width: 100%;

    :deep(.el-table__header-wrapper) {
      background-color: var(--app-color-fill);

      th {
        color: var(--app-color-ink);
        font-weight: 600;
        border-bottom: 2px solid var(--app-color-border);
        padding: var(--app-space-2) var(--app-space-3);
      }
    }

    :deep(.el-table__row:hover) {
      background-color: var(--app-color-fill);
      transition: background-color var(--app-transition-normal);
    }

    :deep(.el-table__row.el-table__row--striped) {
      background-color: var(--app-color-fill);
    }

    :deep(.el-table__cell) {
      padding: var(--app-space-2);
      font-size: var(--app-fs-caption);
      color: var(--app-color-ink);
    }
  }

  .paper-title {
    color: var(--app-color-ink);
    font-weight: 400;
    padding: var(--app-space-1) var(--app-space-2);
    background: var(--app-color-fill);
    border-radius: var(--app-radius-sm);
  }

  .submit-time {
    color: var(--app-color-text-muted);
    font-size: var(--app-fs-meta);
    padding: var(--app-space-1) var(--app-space-2);
    background: var(--app-color-fill);
    border-radius: var(--app-radius-sm);
  }

  .similarity-progress {
    display: inline-block;
    width: 80px;
    margin-right: var(--app-space-2);

    :deep(.el-progress__bar__outer) {
      background: var(--app-color-border);
      border-radius: 8px;
    }
  }

  .similarity-value {
    font-size: var(--app-fs-meta);
    color: var(--app-color-text-muted);
    font-weight: 400;
  }

  .action-buttons {
    display: flex;
    gap: var(--app-space-2);
  }

  .empty-papers {
    text-align: center;
    padding: var(--app-space-8) 0;
  }
}

@media (max-width: 768px) {
  .paper-preview-dialog .preview-container {
    height: 60vh;
  }
}
</style>
