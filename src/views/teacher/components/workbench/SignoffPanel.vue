<template>
  <div class="signoff-panel" v-loading="loading">
    <template v-if="signoff">
      <section class="signoff-card">
        <div class="signed-head">
          <el-tag :type="signoff.qualified === 1 ? 'success' : 'danger'" effect="light" size="small">
            {{ signoff.qualified === 1 ? '合格放行' : '不合格退回' }}
          </el-tag>
          <span class="signed-label">已签核</span>
        </div>
        <dl class="signed-grid">
          <div>
            <dt>指导评分</dt>
            <dd class="score">{{ formatScore(signoff.guidanceScore) }}</dd>
          </div>
          <div>
            <dt>签核教师</dt>
            <dd>{{ signoff.advisorName || '—' }}</dd>
          </div>
          <div>
            <dt>签核时间</dt>
            <dd>{{ formatDateTime(signoff.signTime, 'YYYY-MM-DD HH:mm') }}</dd>
          </div>
        </dl>
        <div class="signed-comment">
          <dt>签核意见</dt>
          <dd>{{ signoff.comment || '未填写意见' }}</dd>
        </div>
      </section>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="签核记录用于审计留痕，提交后不可修改"
      />
    </template>

    <template v-else>
      <section class="report-summary">
        <div class="summary-item">
          <span>总相似比</span>
          <strong :style="{ color: getSimilarityColor(metrics?.repeatRate) }">{{ formatRate(metrics?.repeatRate) }}</strong>
        </div>
        <div class="summary-item">
          <span>单篇最大</span>
          <strong>{{ formatRate(metrics?.maxPerSource) }}</strong>
        </div>
        <div class="summary-item">
          <span>检测时间</span>
          <strong class="time">{{ formatDateTime(baseInfo?.checkTime, 'MM-DD HH:mm') }}</strong>
        </div>
      </section>

      <el-alert
        v-if="noReport"
        type="warning"
        :closable="false"
        show-icon
        title="该论文暂无已完成的查重报告，暂不能签核"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="signoff-form"
      >
        <el-form-item label="签核结论" prop="qualified">
          <el-radio-group v-model="form.qualified">
            <el-radio :value="1">合格放行</el-radio>
            <el-radio :value="0">不合格退回</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="指导评分" prop="guidanceScore">
          <div class="score-row">
            <el-input-number
              v-model="form.guidanceScore"
              :min="0"
              :max="100"
              :precision="1"
              :step="1"
              controls-position="right"
            />
            <button
              v-for="score in quickScores"
              :key="score"
              type="button"
              class="quick-score"
              @click="form.guidanceScore = score"
            >
              {{ score }}
            </button>
          </div>
        </el-form-item>

        <el-form-item label="签核意见" prop="comment">
          <el-input
            v-model="form.comment"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="可填写报告版本核对、相似片段处理等说明"
          />
        </el-form-item>
      </el-form>

      <el-button
        type="primary"
        class="submit-signoff"
        :disabled="!canSign"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交签核
      </el-button>
      <p class="signoff-hint">签核仅记录查重结论，不改变论文审核状态；合格签核后可提交初审通过。</p>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/dataType.js'
import { getSimilarityColor } from '@/utils/reviewStatus.js'

const props = defineProps({
  paperId: { type: [String, Number], default: '' },
  signoff: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  canSign: { type: Boolean, default: false },
  noReport: { type: Boolean, default: false },
  metrics: { type: Object, default: () => ({}) },
  baseInfo: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['submit'])

const formRef = ref(null)
const quickScores = [80, 85, 90]

const form = reactive({
  qualified: 1,
  guidanceScore: null,
  comment: ''
})

const rules = {
  qualified: [{ required: true, message: '请选择签核结论', trigger: 'change' }],
  guidanceScore: [
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请填写指导评分'))
          return
        }
        const num = Number(value)
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          callback(new Error('指导评分需在 0-100 之间'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

const formatRate = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2)}%`
}

const formatScore = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, '')
}

const resetForm = () => {
  form.qualified = 1
  form.guidanceScore = null
  form.comment = ''
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!props.canSign || props.submitting) return
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (!props.canSign) {
    ElMessage.warning('该论文暂无已完成的查重报告，暂不能签核')
    return
  }

  emit('submit', {
    qualified: form.qualified,
    guidanceScore: form.guidanceScore,
    comment: form.comment.trim() || undefined
  })
}

watch(() => props.paperId, resetForm)
</script>

<style scoped>
.signoff-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 0 8px;
}

.signoff-card {
  padding: 14px;
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-md);
  background: var(--apple-surface-pearl);
}

.signed-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.signed-label {
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
}

.signed-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0;
}

.signed-grid dt,
.signed-comment dt {
  font-size: 0.6875rem;
  color: var(--apple-ink-muted-48);
}

.signed-grid dd,
.signed-comment dd {
  margin: 3px 0 0;
  font-size: 0.8125rem;
  color: var(--apple-ink);
}

.signed-grid dd.score {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--apple-primary);
}

.signed-comment {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--apple-divider-soft);
}

.signed-comment dd {
  line-height: 1.6;
  color: var(--apple-ink-muted-80);
  white-space: pre-wrap;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-sm);
  background: var(--apple-canvas);
}

.summary-item span {
  display: block;
  font-size: 0.6875rem;
  color: var(--apple-ink-muted-48);
}

.summary-item strong {
  display: block;
  margin-top: 3px;
  font-size: 0.875rem;
  color: var(--apple-ink);
}

.summary-item strong.time {
  font-weight: 500;
  font-size: 0.75rem;
}

.signoff-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.signoff-form :deep(.el-form-item__label) {
  padding-bottom: 4px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
}

.score-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-score {
  padding: 2px 9px;
  font-size: 0.75rem;
  color: var(--apple-primary);
  background: var(--apple-info-bg);
  border: 1px solid var(--apple-info-border);
  border-radius: var(--apple-rounded-pill);
  cursor: pointer;
}

.submit-signoff {
  width: 100%;
}

.signoff-hint {
  margin: 0;
  font-size: 0.6875rem;
  line-height: 1.5;
  text-align: center;
  color: var(--apple-ink-muted-48);
}
</style>
