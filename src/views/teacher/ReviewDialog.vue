<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="80%"
    :before-close="handleClose"
    class="review-dialog"
    destroy-on-close
  >
    <!-- 论文基本信息 -->
    <div class="paper-header" v-if="paperInfo">
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

    <!-- 论文内容展示 -->
    <div class="paper-content">
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
          <el-button type="warning" @click="saveDraft">保存草稿</el-button>
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

    <!-- 审核意见对话框 -->
    <el-dialog
      v-model="opinionDialogVisible"
      :title="opinionDialogTitle"
      width="500px"
      append-to-body
    >
      <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef" label-width="80px">
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
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传评审意见附件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
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
import { ElMessage } from 'element-plus'
import PlagiarismReportViewer from './PlagiarismReportViewer.vue'

// 图标导入
import {
  Document, ZoomIn, ZoomOut, Download, ArrowDown, UploadFilled
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: Boolean,
  paperId: [String, Number],
  paperInfo: Object
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

const reviewFormRef = ref(null)

// 计算属性
const dialogTitle = computed(() => {
  return props.paperInfo ? `审核论文 - ${props.paperInfo.title}` : '论文审核'
})

const uploadUrl = computed(() => {
  return '/api/teacher/reviews/upload-attachment'
})

const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

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

const handleReviewAction = (command) => {
  reviewForm.value.status = command
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
  opinionDialogVisible.value = true
}

const saveDraft = () => {
  ElMessage.success('草稿已保存')
}

const submitReview = async () => {
  if (!reviewFormRef.value) return
  
  await reviewFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 调用审核接口
        const response = await doReview({
          paperIds: [props.paperId],
          reviewStatus: reviewForm.value.status,
          reviewOpinion: reviewForm.value.opinion,
          reviewAttach: reviewForm.value.attachment
        })
        
        if (response.code === 200) {
          ElMessage.success('审核提交成功')
          opinionDialogVisible.value = false
          emit('review-complete')
          handleClose()
        }
      } catch (error) {
        ElMessage.error('审核提交失败')
      }
    }
  })
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

const getSimilarityTagType = (similarity) => {
  if (similarity >= 30) return 'danger'
  if (similarity >= 20) return 'warning'
  return 'success'
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
    // 加载论文内容
    // 加载查重报告
    // 加载审核历史
  }
})
</script>

<style lang="scss" scoped>
.review-dialog {
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
          font-weight: 500;
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
          border-radius: 4px;
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
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .status {
            margin: 8px 0;
          }
          
          .opinion {
            color: #606266;
            font-size: 14px;
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

.upload-demo {
  :deep(.el-upload-dragger) {
    width: 100%;
  }
}
</style>