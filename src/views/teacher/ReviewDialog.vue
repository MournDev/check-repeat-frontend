<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="80%"
    :before-close="handleClose"
    class="review-dialog"
    destroy-on-close
  >
    <!-- 批量审核时的论文列表 -->
    <div v-if="isBatch && papers.length > 0" class="batch-papers">
      <el-card class="batch-info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>批量审核论文列表</span>
            <el-badge :value="papers.length" type="danger" class="ml-2" />
          </div>
        </template>
        <div class="papers-list">
          <el-checkbox-group v-model="selectedPapersForReview">
            <el-card 
              v-for="paper in papers" 
              :key="paper.paperId"
              class="paper-item-card"
              shadow="hover"
            >
              <div class="paper-item-header">
                <el-checkbox :label="paper.paperId" />
                <span class="paper-title">{{ paper.paperTitle }}</span>
                <el-tag size="small" :type="getSimilarityTagType(paper.similarity)">
                  {{ paper.similarity }}%
                </el-tag>
              </div>
              <div class="paper-item-info">
                <span class="student-name">{{ paper.studentName }}</span>
                <span class="submit-time">{{ formatDate(paper.submitTime) }}</span>
              </div>
            </el-card>
          </el-checkbox-group>
        </div>
      </el-card>
    </div>

    <!-- 单个论文基本信息 -->
    <div class="paper-header" v-else-if="paperInfo">
      <el-card class="paper-info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>论文基本信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>论文标题：</label>
              <span class="info-value">{{ paperInfo.title }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>学生姓名：</label>
              <span class="info-value">{{ paperInfo.studentName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>提交时间：</label>
              <span class="info-value">{{ formatDate(paperInfo.submitTime) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>论文版本：</label>
              <span class="info-value">v{{ paperInfo.version }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>专业：</label>
              <span class="info-value">{{ paperInfo.majorName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>相似度：</label>
              <el-tag :type="getSimilarityTagType(paperInfo.similarity)">
                {{ paperInfo.similarity }}%
              </el-tag>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 论文内容展示 (仅单个论文时显示) -->
    <div class="paper-content" v-if="!isBatch || papers.length === 0">
      <el-tabs v-model="activeTab" class="content-tabs">
        <!-- 论文原文 -->
        <el-tab-pane label="论文原文" name="content">
          <div class="content-viewer">
            <div class="toolbar">
              <el-button-group>
                <el-button :icon="ZoomIn" @click="zoomIn">放大</el-button>
                <el-button :icon="ZoomOut" @click="zoomOut">缩小</el-button>
                <el-button :icon="Download" @click="downloadPaper">下载原文</el-button>
              </el-button-group>
            </div>
            <div class="content-area" :style="{ fontSize: fontSize + 'px' }">
              <div class="paper-text" v-html="paperContent"></div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 查重报告 -->
        <el-tab-pane label="查重报告" name="plagiarism">
          <PlagiarismReportViewer 
            v-if="plagiarismReport" 
            :report-data="plagiarismReport"
            @update-report="updatePlagiarismReport"
          />
        </el-tab-pane>

        <!-- 历史记录 -->
        <el-tab-pane label="审核历史" name="history">
          <div class="history-content">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in reviewHistory"
                :key="index"
                :timestamp="formatDateTime(record.reviewTime)"
                :type="getTimelineType(record.status)"
              >
                <div class="history-item">
                  <div class="reviewer">{{ record.reviewerName }}</div>
                  <div class="status">
                    <el-tag :type="getStatusTagType(record.status)">
                      {{ getStatusText(record.status) }}
                    </el-tag>
                  </div>
                  <div class="opinion" v-if="record.opinion">
                    {{ record.opinion }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 审核操作区 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="review-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button @click="openTemplateDialog">使用模板</el-button>
          <el-dropdown @command="handleReviewAction">
            <el-button type="primary">
              审核操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="approve">审核通过</el-dropdown-item>
                <el-dropdown-item command="reject">审核不通过</el-dropdown-item>
                <el-dropdown-item command="modify">需要修改</el-dropdown-item>
                <el-dropdown-item command="defer">暂缓审核</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>

    <!-- 模板选择对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="选择审核模板"
      width="800px"
    >
      <div class="template-list">
        <el-card
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          shadow="hover"
          @click="selectTemplate(template)"
        >
          <template #header>
            <div class="template-header">
              <span class="template-title">{{ template.title }}</span>
              <el-tag size="small" :type="getTemplateType(template.type)">
                {{ template.type }}
              </el-tag>
            </div>
          </template>
          <div class="template-content">
            <div class="template-info">
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span>创建人: {{ template.createdBy }}</span>
              </div>
              <div class="info-item">
                <el-icon><Timer /></el-icon>
                <span>创建时间: {{ formatDate(template.createdAt) }}</span>
              </div>
              <div class="info-item">
                <el-icon><View /></el-icon>
                <span>使用次数: {{ template.usageCount || 0 }}</span>
              </div>
            </div>
            <div class="template-preview">
              <h4>模板内容预览:</h4>
              <div class="preview-content">{{ template.content }}</div>
            </div>
          </div>
        </el-card>
        <div v-if="templates.length === 0" class="empty-templates">
          <el-empty description="暂无审核模板" :image-size="120" />
          <el-button type="primary" @click="goToTemplatesPage">去创建模板</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 审核意见对话框 -->
    <el-dialog
      v-model="opinionDialogVisible"
      :title="opinionDialogTitle"
      width="800px"
      append-to-body
    >
      <!-- 单个论文审核 -->
      <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef" label-width="80px" v-if="!isBatch || papers.length === 0">
        <el-form-item label="审核意见" prop="opinion">
          <el-input
            v-model="reviewForm.opinion"
            type="textarea"
            :rows="4"
            placeholder="请输入您的审核意见..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="附件上传" prop="attachment">
          <el-upload
            class="upload-demo"
            drag
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            multiple
            :disabled="isBatch"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                {{ isBatch ? '批量审核时不支持上传附件' : '支持上传评审意见附件，且不超过 10MB' }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <!-- 批量论文审核 -->
      <div v-else-if="isBatch && papers.length > 0">
        <el-alert
          title="批量审核提示"
          type="info"
          :closable="false"
          show-icon
          class="mb-4"
        >
          <template #default>
            请为每篇选中的论文填写单独的审核意见
          </template>
        </el-alert>
        
        <div class="batch-opinions">
          <el-card 
            v-for="paper in papers" 
            :key="paper.paperId"
            class="batch-opinion-card"
            shadow="hover"
            v-if="selectedPapersForReview.includes(paper.paperId)"
          >
            <template #header>
              <div class="card-header">
                <span class="paper-title">{{ paper.paperTitle }}</span>
                <span class="student-name">{{ paper.studentName }}</span>
              </div>
            </template>
            <el-form :model="batchReviewForms[paper.paperId]" :rules="reviewRules" label-width="80px">
              <el-form-item label="审核意见" prop="opinion">
                <el-input
                  v-model="batchReviewForms[paper.paperId].opinion"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入审核意见..."
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="opinionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReview">提交审核</el-button>
        </span>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import PlagiarismReportViewer from './PlagiarismReportViewer.vue'
import { doReview, sendMessage, getReviewTemplates, useReviewTemplate, getPaperContent } from '@/api/teacher.js'
import { convertToBackendStatus, getSimilarityTagType } from '@/utils/reviewStatus.js'
import { sanitizeHtml } from '@/utils/markdown'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 图标导入
import {
  Document, ZoomIn, ZoomOut, Download, ArrowDown, UploadFilled, User, Timer, View
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// Props
const props = defineProps({
  modelValue: Boolean,
  paperId: [String, Number],
  paperInfo: Object,
  isBatch: Boolean,
  papers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'review-complete'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('content')
const fontSize = ref(14)
const paperContent = ref('')
const plagiarismReport = ref(null)
const reviewHistory = ref([])
const opinionDialogVisible = ref(false)
const opinionDialogTitle = ref('')
const reviewForm = ref({
  opinion: '',
  attachment: null,
  status: null
})
const selectedPapersForReview = ref([])
const batchReviewForms = ref({})

// 模板相关数据
const templateDialogVisible = ref(false)
const templates = ref([])
const loadingTemplates = ref(false)

const reviewFormRef = ref(null)

// 计算属性
const dialogTitle = computed(() => {
  if (props.isBatch && props.papers.length > 0) {
    return `批量审核 - ${props.papers.length} 篇论文`
  }
  return props.paperInfo ? `审核论文 - ${props.paperInfo.title}` : '论文审核'
})

const uploadUrl = computed(() => {
  return '/api/v1/teacher/reviews/upload-attachment'
})

const uploadHeaders = computed(() => ({
  'Authorization': `${userStore.token}`
}))

// 表单验证规则
const reviewRules = {
  opinion: [
    { required: true, message: '请输入审核意见', trigger: 'blur' },
    { min: 10, message: '审核意见至少10个字符', trigger: 'blur' }
  ]
}

// 方法
const handleClose = () => {
  dialogVisible.value = false
}

const zoomIn = () => {
  fontSize.value = Math.min(fontSize.value + 2, 24)
}

const zoomOut = () => {
  fontSize.value = Math.max(fontSize.value - 2, 12)
}

const downloadPaper = async () => {
  try {
    // 调用下载接口
    ElMessage.success('论文下载已开始')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

// 模板相关方法
const openTemplateDialog = async () => {
  await loadTemplates()
  templateDialogVisible.value = true
}

const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    const response = await getReviewTemplates()
    if (response.success) {
      templates.value = response.data
    } else {
      ElMessage.error('加载模板失败')
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败')
  } finally {
    loadingTemplates.value = false
  }
}

const selectTemplate = async (template) => {
  try {
    // 应用模板
    const response = await useReviewTemplate(template.id)
    if (response.success) {
      // 将模板内容填充到审核意见中
      reviewForm.value.opinion = template.content
      
      ElMessage.success(`模板 "${template.title}" 已应用`)
      templateDialogVisible.value = false
    } else {
      ElMessage.error('应用模板失败')
    }
  } catch (error) {
    console.error('应用模板失败:', error)
    ElMessage.error('应用模板失败')
  }
}

const getTemplateType = (type) => {
  const typeMap = {
    '通过': 'success',
    '不通过': 'danger',
    '修改': 'warning',
    '其他': 'info'
  }
  return typeMap[type] || 'info'
}

const goToTemplatesPage = () => {
  templateDialogVisible.value = false
  router.push('/teacher/review-templates')
}

const handleReviewAction = (command) => {
  // "暂缓审核" 映射为 "需要修改"，两者共用 revision_needed 状态
  const mappedCommand = command === 'defer' ? 'modify' : command
  reviewForm.value.status = mappedCommand
  switch (command) {
    case 'approve':
      opinionDialogTitle.value = '审核通过'
      break
    case 'reject':
      opinionDialogTitle.value = '审核不通过'
      break
    case 'modify':
      opinionDialogTitle.value = '需要修改'
      break
    case 'defer':
      opinionDialogTitle.value = '暂缓审核'
      break
  }
  
  // 初始化批量审核表单
  if (props.isBatch && props.papers.length > 0) {
    // 默认选中所有论文
    selectedPapersForReview.value = props.papers.map(paper => paper.paperId)
    // 初始化每个论文的审核表单
    batchReviewForms.value = {}
    props.papers.forEach(paper => {
      batchReviewForms.value[paper.paperId] = {
        opinion: '',
        attachment: null,
        status: command
      }
    })
  }
  
  opinionDialogVisible.value = true
}

const submitReview = async () => {
  // 单个论文审核
  if (!props.isBatch || props.papers.length === 0) {
    if (!reviewFormRef.value) return
    
    await reviewFormRef.value.validate(async (valid) => {
      if (valid) {
        try {
          const response = await doReview({
            paperIds: [props.paperId],
            reviewStatus: convertToBackendStatus(reviewForm.value.status),
            reviewOpinion: reviewForm.value.opinion,
            reviewAttach: reviewForm.value.attachment
          })
          
          if (response.code === 200) {
            // 发送审核结果通知
            if (props.paperInfo) {
              await sendReviewNotification({
                studentId: props.paperInfo.studentId,
                studentName: props.paperInfo.studentName,
                paperTitle: props.paperInfo.title,
                status: reviewForm.value.status,
                opinion: reviewForm.value.opinion
              })
            }
            
            ElMessage.success('审核提交成功')
            opinionDialogVisible.value = false
            emit('review-complete', {
              status: reviewForm.value.status,
              opinion: reviewForm.value.opinion,
              attach: reviewForm.value.attachment
            })
            handleClose()
          }
        } catch (error) {
          ElMessage.error('审核提交失败: ' + (error.message || '未知错误'))
        }
      }
    })
  } 
  // 批量论文审核
  else if (props.isBatch && props.papers.length > 0) {
    if (selectedPapersForReview.value.length === 0) {
      ElMessage.warning('请至少选择一篇论文进行审核')
      return
    }
    
    // 验证所有选中论文的审核意见
    let allValid = true
    const reviewData = []
    
    for (const paperId of selectedPapersForReview.value) {
      const form = batchReviewForms.value[paperId]
      if (!form || !form.opinion || form.opinion.trim().length < 10) {
        allValid = false
        break
      }
      const paper = props.papers.find(p => String(p.paperId) === String(paperId))
      reviewData.push({
        paperId: paperId,
        studentId: paper?.studentId || paper?.studentNo || '',
        studentName: paper?.studentName || '',
        paperTitle: paper?.paperTitle || '',
        reviewStatus: convertToBackendStatus(reviewForm.value.status),
        reviewOpinion: form.opinion,
        reviewAttach: form.attachment
      })
    }
    
    if (!allValid) {
      ElMessage.error('请为所有选中的论文填写完整的审核意见（至少10个字符）')
      return
    }
    
    try {
      // 批量审核，逐个调用接口
      let successCount = 0
      let errorCount = 0
      
      for (const data of reviewData) {
        try {
          const response = await doReview({
            paperIds: [data.paperId],
            reviewStatus: data.reviewStatus,
            reviewOpinion: data.reviewOpinion,
            reviewAttach: data.reviewAttach
          })
          if (response.code === 200) {
            // 发送审核结果通知
            await sendReviewNotification({
              studentId: data.studentId,
              studentName: data.studentName,
              paperTitle: data.paperTitle,
              status: reviewForm.value.status,
              opinion: data.reviewOpinion
            })
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
      
      if (successCount > 0) {
        ElMessage.success(`成功审核 ${successCount} 篇论文`)
      }
      if (errorCount > 0) {
        ElMessage.error(`有 ${errorCount} 篇论文审核失败，请重试`)
      }
      
      opinionDialogVisible.value = false
      emit('review-complete', {
        status: reviewForm.value.status,
        opinion: '',
        attach: null,
        batch: true,
        successCount,
        errorCount
      })
      handleClose()
    } catch (error) {
      ElMessage.error('批量审核提交失败: ' + (error.message || '未知错误'))
    }
  }
}

// 发送审核结果通知
const sendReviewNotification = async (data) => {
  try {
    const statusText = getStatusText(data.status)
    const messageContent = `您的论文《${data.paperTitle}》已完成审核，结果：${statusText}。\n\n审核意见：${data.opinion}`
    
    await sendMessage({
      recipientId: data.studentId,
      recipientType: 'student',
      content: messageContent,
      messageType: 'system',
      relatedId: data.paperId || props.paperId,
      relatedType: 'paper'
    })
  } catch (error) {
    console.warn('发送审核通知失败:', error)
    // 通知发送失败不影响审核流程
  }
}

const handleUploadSuccess = (response, file) => {
  reviewForm.value.attachment = response.data.url
  ElMessage.success('附件上传成功')
}

const handleUploadError = (error, file) => {
  ElMessage.error('附件上传失败')
}

const updatePlagiarismReport = (report) => {
  plagiarismReport.value = report
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
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
onMounted(async () => {
  if (props.paperId) {
    await loadPaperContent()
  }
  
  // 批量审核时初始化选中状态
  if (props.isBatch && props.papers.length > 0) {
    selectedPapersForReview.value = props.papers.map(paper => paper.paperId)
  }
})

// 加载论文内容
const loadPaperContent = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: '正在加载论文内容...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    const response = await getPaperContent(props.paperId)
    if (response.code === 200 && response.data) {
      paperContent.value = sanitizeHtml(response.data.content || response.data.abstract || '暂无论文内容')
    } else {
      paperContent.value = '暂无论文内容'
    }
  } catch (error) {
    console.error('加载论文内容失败:', error)
    paperContent.value = '加载论文内容失败'
    ElMessage.error('加载论文内容失败')
  } finally {
    loading.close()
  }
}
</script>

<style lang="scss" scoped>
.review-dialog {
  .batch-papers {
    margin-bottom: 20px;
    
    .batch-info-card {
      .card-header {
        display: flex;
        align-items: center;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
        }
        
        .ml-2 {
          margin-left: 8px;
        }
      }
      
      .papers-list {
        max-height: 400px;
        overflow-y: auto;
        
        .paper-item-card {
          margin-bottom: 12px;
          border: 1px solid #d2d2d7;
          border-radius: 11px;
          transition: border-color 0.2s ease;
          
          &:hover {
            border-color: #0066cc;
            /* box-shadow removed for Apple HIG */
          }

          .paper-item-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            
            .el-checkbox {
              margin-right: 12px;
            }
            
            .paper-title {
              flex: 1;
              font-weight: 400;
              color: #303133;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            .el-tag {
              margin-left: 12px;
            }
          }
          
          .paper-item-info {
            display: flex;
            justify-content: space-between;
            font-size: 17px;
            color: #606266;
            
            .student-name {
              margin-right: 20px;
            }
          }
        }
      }
    }
  }

  .paper-header {
    margin-bottom: 20px;
    
    .paper-info-card {
      .card-header {
        display: flex;
        align-items: center;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
        }
      }
      
      .info-item {
        margin-bottom: 12px;
        
        label {
          font-weight: 400;
          color: #606266;
          margin-right: 8px;
        }
        
        .info-value {
          color: #303133;
        }
      }
    }
  }
  
  .paper-content {
    .content-tabs {
      .content-viewer {
        .toolbar {
          margin-bottom: 16px;
          text-align: right;
        }
        
        .content-area {
          border: 1px solid #dcdfe6;
          border-radius: 8px;
          padding: 16px;
          min-height: 400px;
          max-height: 600px;
          overflow-y: auto;
          
          .paper-text {
            line-height: 1.8;
            white-space: pre-wrap;
          }
        }
      }
      
      .history-content {
        .history-item {
          .reviewer {
            font-weight: 400;
            margin-bottom: 4px;
          }
          
          .status {
            margin: 8px 0;
          }
          
          .opinion {
            color: #606266;
            font-size: 17px;
            line-height: 1.5;
          }
        }
      }
    }
  }
  
  .dialog-footer {
    .review-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
}

.batch-opinions {
  max-height: 500px;
  overflow-y: auto;
  
  .batch-opinion-card {
    margin-bottom: 16px;
    border: 1px solid #d2d2d7;
    border-radius: 11px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 400;
      
      .paper-title {
        flex: 1;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 16px;
      }
      
      .student-name {
        font-size: 17px;
        color: #606266;
      }
    }
  }
}

.upload-demo {
  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

/* 模板选择对话框样式 */
.template-list {
  .template-card {
    margin-bottom: 16px;
    cursor: pointer;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: #0066cc;
      /* box-shadow removed for Apple HIG */
    }

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .template-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
    
    .template-content {
      .template-info {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 12px;
        
        .info-item {
          display: flex;
          align-items: center;
          font-size: 17px;
          color: #606266;
          
          .el-icon {
            margin-right: 4px;
          }
        }
      }
      
      .template-preview {
        .preview-content {
          padding: 12px;
          background-color: #f5f5f7;
          border-radius: 8px;
          font-size: 17px;
          line-height: 1.5;
          color: #606266;
          max-height: 120px;
          overflow-y: auto;
        }
      }
    }
  }
  
  .empty-templates {
    text-align: center;
    padding: 40px 0;
    
    .el-button {
      margin-top: 20px;
    }
  }
}
</style>