<template>
  <div class="file-manager">
    <div class="fm-layout">
      <!-- 左侧：会话列表 -->
      <aside class="fm-sidebar">
        <div class="fm-sidebar-header">
          <h3 class="fm-sidebar-title">会话列表</h3>
        </div>
        <div class="fm-session-list" v-loading="sessionsLoading">
          <div v-if="sessions.length === 0 && !sessionsLoading" class="fm-empty-sessions">
            <el-empty description="暂无会话" :image-size="60" />
          </div>
          <div
            v-for="session in sessions"
            :key="session.id"
            class="fm-session-item"
            :class="{ active: activeSessionId === session.id }"
            @click="selectSession(session)"
          >
            <el-avatar :size="40" :src="getSessionAvatar(session)">
              {{ getSessionInitial(session) }}
            </el-avatar>
            <div class="fm-session-info">
              <span class="fm-session-name">{{ session.name }}</span>
              <span class="fm-session-meta">{{ session.fileCount || 0 }} 个文件</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧：文件管理 -->
      <main class="fm-main">
        <div v-if="!activeSessionId" class="fm-placeholder">
          <el-empty description="请选择一个会话查看共享文件" :image-size="120" />
        </div>
        <template v-else>
          <!-- 工具栏 -->
          <div class="fm-toolbar">
            <div class="fm-toolbar-left">
              <el-input
                v-model="fileSearch"
                placeholder="搜索文件"
                :prefix-icon="Search"
                clearable
                style="width: 260px"
              />
            </div>
            <div class="fm-toolbar-right">
              <el-button @click="refreshFiles" :icon="Refresh" :loading="filesLoading">
                刷新
              </el-button>
              <el-button type="primary" @click="handleUpload">
                <el-icon><UploadFilled /></el-icon>上传文件
              </el-button>
            </div>
          </div>

          <!-- 文件网格 -->
          <div v-loading="filesLoading" class="fm-files-area">
            <div v-if="files.length === 0 && !filesLoading" class="fm-empty-files">
              <el-empty description="暂无共享文件，点击上方按钮上传" :image-size="100" />
            </div>
            <div v-else class="fm-files-grid">
              <div v-for="file in filteredFiles" :key="file.id" class="fm-file-card">
                <div class="fm-file-preview" @click="previewFile(file)">
                  <el-icon :size="56">
                    <component :is="getFileIcon(file.type || file.name)" />
                  </el-icon>
                </div>
                <div class="fm-file-body">
                  <div class="fm-file-name" :title="file.name">{{ file.name }}</div>
                  <div class="fm-file-meta">
                    <span>{{ formatFileSize(file.size) }}</span>
                    <span>{{ file.uploader }}</span>
                  </div>
                  <div class="fm-file-time">{{ formatDate(file.uploadTime) }}</div>
                </div>
                <div class="fm-file-actions">
                  <el-button type="primary" text size="small" @click="previewFile(file)">
                    <el-icon><View /></el-icon>预览
                  </el-button>
                  <el-button type="primary" text size="small" @click="downloadFile(file)">
                    <el-icon><Download /></el-icon>下载
                  </el-button>
                  <el-button type="danger" text size="small" @click="deleteFile(file)">
                    <el-icon><Delete /></el-icon>删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- 隐藏的上传文件input -->
    <input
      ref="uploadInput"
      type="file"
      multiple
      accept=".doc,.docx,.pdf,.txt,.xls,.xlsx,.jpg,.jpeg,.png,.ppt,.pptx"
      style="display: none"
      @change="onFileSelected"
    />

    <!-- 预览对话框 -->
    <PaperPreviewDialog
      v-if="previewVisible"
      v-model="previewVisible"
      :file-id="previewFileId"
      :file-name="previewFileName"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, UploadFilled, View, Download, Delete
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getFileIcon } from '@/utils/fileType.js'
import { formatFileSize } from '@/utils/common.js'
import PaperPreviewDialog from '@/components/PaperPreviewDialog.vue'

const props = defineProps({
  role: { type: String, required: true, validator: v => ['student', 'teacher'].includes(v) }
})

const userStore = useUserStore()

// Dynamic API imports
const api = props.role === 'student'
  ? () => import('@/api/student.js')
  : () => import('@/api/teacher.js')

let studentApi = null
let teacherApi = null

const getApi = async () => {
  if (props.role === 'student') {
    if (!studentApi) studentApi = await import('@/api/student.js')
    return studentApi
  }
  if (!teacherApi) teacherApi = await import('@/api/teacher.js')
  return teacherApi
}

// State
const sessions = ref([])
const activeSessionId = ref(null)
const sessionsLoading = ref(false)
const files = ref([])
const filesLoading = ref(false)
const fileSearch = ref('')
const uploadInput = ref(null)

// Preview state
const previewVisible = ref(false)
const previewFileId = ref(null)
const previewFileName = ref('')

const filteredFiles = computed(() => {
  if (!fileSearch.value) return files.value
  const q = fileSearch.value.toLowerCase()
  return files.value.filter(f => f.name.toLowerCase().includes(q))
})

// Load sessions
const loadSessions = async () => {
  sessionsLoading.value = true
  try {
    const apiModule = await getApi()
    const res = await apiModule.getMessageSessions()
    if (res.code === 200) {
      const list = res.data || []
      list.forEach(s => {
        if (s.members && s.members.length > 0) {
          const other = s.members.find(m => m.userId !== userStore.userInfo?.userId) || s.members[0]
          s.name = s.name || other?.name || other?.userName || `会话 ${s.id}`
          s.avatar = s.avatar || other?.avatar
        }
        s.name = s.name || `会话 ${s.id}`
      })
      sessions.value = list
    }
  } catch (e) {
    console.error('加载会话列表失败:', e)
    ElMessage.error('加载会话列表失败')
  } finally {
    sessionsLoading.value = false
  }
}

const selectSession = async (session) => {
  activeSessionId.value = session.id
  fileSearch.value = ''
  await loadFiles()
}

const loadFiles = async () => {
  if (!activeSessionId.value) return
  filesLoading.value = true
  try {
    const apiModule = await getApi()
    const res = await apiModule.getSharedFiles(activeSessionId.value)
    if (res.code === 200) {
      files.value = (res.data || []).map(f => ({
        ...f,
        id: f.id || f.fileId
      }))
      // Update fileCount on the session
      const session = sessions.value.find(s => s.id === activeSessionId.value)
      if (session) session.fileCount = files.value.length
    }
  } catch (e) {
    console.error('加载文件列表失败:', e)
    ElMessage.error('加载文件列表失败')
  } finally {
    filesLoading.value = false
  }
}

const refreshFiles = () => loadFiles()

// Upload
const handleUpload = () => {
  if (!activeSessionId.value) {
    ElMessage.warning('请先选择一个会话')
    return
  }
  uploadInput.value?.click()
}

const onFileSelected = async (e) => {
  const selectedFiles = Array.from(e.target.files || [])
  if (selectedFiles.length === 0) return
  const apiModule = await getApi()
  for (const file of selectedFiles) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sessionId', String(activeSessionId.value))
    try {
      const res = await apiModule.uploadMessageFile(formData)
      if (res.code === 200) {
        ElMessage.success(`${file.name} 上传成功`)
      }
    } catch (err) {
      console.error('上传失败:', err)
      ElMessage.error(`${file.name} 上传失败`)
    }
  }
  await loadFiles()
  // Reset input so same file can be re-uploaded
  e.target.value = ''
}

// Download
const downloadFile = async (file) => {
  try {
    const apiModule = await getApi()
    const res = await apiModule.downloadSharedFile(file.id)
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('下载失败:', e)
    ElMessage.error('下载失败')
  }
}

// Delete
const deleteFile = async (file) => {
  try {
    await ElMessageBox.confirm(`确定要删除"${file.name}"吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const apiModule = await getApi()
    if (apiModule.deleteSharedFile) {
      await apiModule.deleteSharedFile(file.id)
    } else if (apiModule.deleteFile) {
      await apiModule.deleteFile(file.id)
    }
    ElMessage.success('文件已删除')
    await loadFiles()
  } catch (e) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      console.error('删除失败:', e)
    }
  }
}

// Preview
const previewFile = (file) => {
  previewFileId.value = file.id
  previewFileName.value = file.name
  previewVisible.value = true
}

// Helpers
const getSessionAvatar = (session) => {
  return session.avatar || undefined
}

const getSessionInitial = (session) => {
  const name = session.name || ''
  return name.charAt(0).toUpperCase()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  loadSessions()
})
</script>

<style lang="scss" scoped>
.file-manager {
  height: calc(100vh - 120px);
  min-height: 600px;
}

.fm-layout {
  display: flex;
  height: 100%;
  gap: 0;
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  overflow: hidden;
}

// Sidebar
.fm-sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--apple-hairline);
  background: var(--apple-canvas-parchment);
  display: flex;
  flex-direction: column;
}

.fm-sidebar-header {
  padding: var(--apple-spacing-lg);
  border-bottom: 1px solid var(--apple-hairline);
}

.fm-sidebar-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--apple-ink);
}

.fm-session-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--apple-spacing-sm);
}

.fm-empty-sessions {
  padding: var(--apple-spacing-xl) 0;
}

.fm-session-item {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
  padding: var(--apple-spacing-sm);
  border-radius: var(--apple-rounded-lg);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--apple-surface);
  }

  &.active {
    background: #ecf5ff;
    border: 1px solid var(--apple-primary);
  }

  & + & {
    margin-top: 4px;
  }
}

.fm-session-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fm-session-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--apple-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-session-meta {
  font-size: 12px;
  color: var(--apple-ink-muted-48);
}

// Main area
.fm-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fm-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

// Toolbar
.fm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--apple-spacing-md) var(--apple-spacing-lg);
  border-bottom: 1px solid var(--apple-hairline);
  gap: var(--apple-spacing-md);
  flex-wrap: wrap;
}

.fm-toolbar-left,
.fm-toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
}

// Files area
.fm-files-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--apple-spacing-lg);
}

.fm-empty-files {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.fm-files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--apple-spacing-md);
}

.fm-file-card {
  display: flex;
  flex-direction: column;
  background: var(--apple-canvas-parchment);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
  padding: var(--apple-spacing-lg);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--apple-primary);
  }
}

.fm-file-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  margin-bottom: var(--apple-spacing-sm);
  color: var(--apple-ink-muted-48);
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--apple-primary);
  }
}

.fm-file-body {
  flex: 1;
  min-width: 0;
}

.fm-file-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--apple-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.fm-file-meta {
  display: flex;
  gap: var(--apple-spacing-sm);
  font-size: 12px;
  color: var(--apple-ink-muted-48);
  margin-bottom: 4px;
}

.fm-file-time {
  font-size: 12px;
  color: var(--apple-ink-muted-48);
}

.fm-file-actions {
  display: flex;
  gap: 4px;
  margin-top: var(--apple-spacing-sm);
  padding-top: var(--apple-spacing-sm);
  border-top: 1px solid var(--apple-hairline);
}
</style>
