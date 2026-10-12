<template>
  <!-- 查重报告签核对话框（论文全生命周期 P5，弹窗外壳样式在全局 global-styles.scss） -->
  <el-dialog
    v-model="visible"
    title="签核查重报告"
    width="560px"
    append-to-body
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <div v-if="paper.paperTitle" class="signoff-paper-info">
      <div class="signoff-paper-title">{{ paper.paperTitle }}</div>
      <div v-if="paper.studentName" class="signoff-paper-student">学生：{{ paper.studentName }}</div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="签核结论" prop="qualified">
        <el-radio-group v-model="form.qualified">
          <el-radio :value="1">合格放行</el-radio>
          <el-radio :value="0">不合格退回</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="指导评分" prop="guidanceScore">
        <el-input-number
          v-model="form.guidanceScore"
          :min="0"
          :max="100"
          :step="1"
          controls-position="right"
          placeholder="0 ~ 100"
          style="width: 160px"
        />
        <span class="form-tip-inline">0 ~ 100 分必填（不合格也必填，作为总评成绩合成的指导分）</span>
      </el-form-item>

      <el-form-item label="签核意见" prop="comment">
        <el-input
          v-model="form.comment"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="签核意见（可空，500 字以内）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交签核</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { signoffCheckReport } from '@/api/p5.js'

const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 签核对象：paperId 雪花 ID 按字符串持有，防 JS 精度丢失
const paper = reactive({ paperId: '', paperTitle: '', studentName: '' })
const form = reactive({ qualified: 1, guidanceScore: null, comment: '' })

const rules = {
  qualified: [{ required: true, message: '请选择签核结论', trigger: 'change' }],
  guidanceScore: [
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          return callback(new Error('请填写指导评分（0 ~ 100，不合格也必填）'))
        }
        if (value < 0 || value > 100) {
          return callback(new Error('指导评分必须在 0 ~ 100 之间'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

/** 打开签核弹窗（paper 需含 paperId；paperTitle/studentName 仅用于展示） */
const open = (p = {}) => {
  const paperId = p.paperId ?? p.id ?? ''
  if (!paperId) {
    ElMessage.error('无法获取论文ID')
    return
  }
  paper.paperId = String(paperId)
  paper.paperTitle = p.paperTitle || ''
  paper.studentName = p.studentName || ''
  Object.assign(form, { qualified: 1, guidanceScore: null, comment: '' })
  visible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, { qualified: 1, guidanceScore: null, comment: '' })
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const res = await signoffCheckReport(paper.paperId, {
      qualified: form.qualified,
      guidanceScore: form.guidanceScore,
      comment: form.comment?.trim() ? form.comment.trim() : undefined
    })
    ElMessage.success(res?.message || '查重报告签核成功')
    visible.value = false
    emit('success')
  } catch {
    // 40913（重复签核）等 403/409 业务错误码：响应拦截器已按后端返回的 message 精确提示
    //（项目约定禁止统一 500 兜底，也不在此二次弹窗避免双提示），弹窗保持打开供修正重试
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.signoff-paper-info {
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: var(--apple-rounded-md);
  background: var(--apple-canvas-parchment);
}

.signoff-paper-title {
  font-weight: 600;
  color: var(--apple-ink);
}

.signoff-paper-student {
  margin-top: 2px;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.form-tip-inline {
  margin-left: 12px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
}
</style>
