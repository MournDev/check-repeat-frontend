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

    <!-- 签核前置：相似度摘要 + 报告入口。签核对象是最新一次 completed 查重报告，
         摘要为空说明无已完成报告，按方案 2 直接禁止提交（后端 40912 是兜底） -->
    <div class="signoff-report-summary">
      <div v-if="summaryLoading" class="summary-line summary-muted">报告信息加载中…</div>
      <el-alert
        v-else-if="noReport"
        type="warning"
        :closable="false"
        title="该论文暂无已完成的查重报告，无法签核"
        description="请先确认查重任务已完成；若长时间无报告，请联系管理员排查查重任务状态。"
      />
      <template v-else-if="summary">
        <div class="summary-line">
          <span class="summary-item">
            总相似比
            <strong :style="{ color: getSimilarityColor(summary.repeatRate) }">
              {{ formatRate(summary.repeatRate) }}
            </strong>
          </span>
          <span class="summary-item">单篇最大 <strong>{{ formatRate(summary.maxPerSource) }}</strong></span>
          <span class="summary-item">引用率 <strong>{{ formatRate(summary.citationRate) }}</strong></span>
          <el-button type="primary" link class="summary-report-btn" @click="emit('view-report', paper.paperId)">
            查看完整报告
          </el-button>
        </div>
        <div v-if="summary.checkTime" class="summary-line summary-muted">检测时间：{{ summary.checkTime }}</div>
      </template>
      <div v-else class="summary-line summary-muted">报告信息加载失败，可关闭弹窗后在列表行内查看报告；提交将以后端校验为准</div>
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
      <el-button type="primary" :loading="submitting" :disabled="summaryLoading || noReport" @click="handleSubmit">提交签核</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { signoffCheckReport } from '@/api/p5.js'
import { getSimpleCheckReport, getPaperReport } from '@/api/teacher.js'
import { getSimilarityColor } from '@/utils/similarity.js'

const emit = defineEmits(['success', 'view-report'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 签核对象：paperId 雪花 ID 按字符串持有，防 JS 精度丢失
const paper = reactive({ paperId: '', paperTitle: '', studentName: '' })
const form = reactive({ qualified: 1, guidanceScore: null, comment: '' })

// 最新 completed 报告摘要：null=加载失败/未加载；noReport=true=确定无已完成报告
const summaryLoading = ref(false)
const noReport = ref(false)
const summary = ref(null)

// 存量任务 maxPerSource/citationRate 可能为 null，按 P5 口径约定显「—」不按 0
const formatRate = (v) => (v === null || v === undefined ? '—' : `${v}%`)

/** 加载该论文最新一次 completed 查重报告的口径摘要（总相似比/单篇最大/引用率） */
const loadReportSummary = async () => {
  summaryLoading.value = true
  noReport.value = false
  summary.value = null
  try {
    const listRes = await getSimpleCheckReport(paper.paperId)
    const latest = listRes?.code === 200 && Array.isArray(listRes.data) ? listRes.data[0] : null
    if (!latest) {
      // 空列表 = 该论文没有任何已完成报告（区别于网络失败），前端先行拦截
      noReport.value = true
      return
    }
    const reportRes = await getPaperReport(latest.id)
    if (reportRes?.code === 200 && reportRes.data) {
      const rateStat = reportRes.data.rateStat || {}
      const sourceList = Array.isArray(reportRes.data.similarSources) ? reportRes.data.similarSources : []
      const maxPerSource = sourceList.length
        ? Math.max(...sourceList.map(item => Number(item.maxSimilarity) || 0))
        : null
      summary.value = {
        repeatRate: rateStat.repeatRate ?? reportRes.data.baseInfo?.similarityRate ?? null,
        maxPerSource,
        // 后端 ReportPreviewDTO 未提供引用率，展示「—」，不伪造 0
        citationRate: null,
        checkTime: reportRes.data.baseInfo?.generateTime || reportRes.data.baseInfo?.checkTime || ''
      }
    }
    // code 非 200 时 summary 保持 null，走「加载失败」提示，不阻断签核（后端兜底）
  } catch {
    // 网络/权限异常同样不阻断：摘要区显示加载失败，提交以后端 40912 校验为准
  } finally {
    summaryLoading.value = false
  }
}

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
  loadReportSummary()
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

.signoff-report-summary {
  margin-bottom: 16px;
}

.summary-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.8125rem;
  color: var(--apple-ink);
}

.summary-line + .summary-line {
  margin-top: 4px;
}

.summary-item strong {
  font-weight: 600;
}

.summary-report-btn {
  margin-left: auto;
  padding: 0;
}

.summary-muted {
  color: var(--apple-ink-muted-48);
}

.form-tip-inline {
  margin-left: 12px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.signoff-paper-info {
  padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-md);
}

.signoff-paper-student {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
}

.signoff-report-summary {
  margin-bottom: var(--apple-spacing-md);
}

.summary-line {
  gap: var(--apple-spacing-sm);
  font-size: var(--apple-fs-fine-print);
}

.summary-line + .summary-line {
  margin-top: var(--apple-spacing-xxs);
}

.form-tip-inline {
  margin-left: var(--apple-spacing-sm);
  font-size: var(--apple-fs-fine-print);
}

:deep(.el-form-item) {
  margin-bottom: var(--apple-spacing-md);
}

:deep(.el-form-item__label) {
  font-size: var(--apple-fs-fine-print);
}

:deep(.el-textarea__inner),
:deep(.el-input__wrapper) {
  border-radius: var(--apple-rounded-md);
  font-size: var(--apple-fs-caption);
}
</style>
