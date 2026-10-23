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
          <strong :style="{ color: getSimilarityColor(metrics?.repeatRate) }">{{ formatPercent(metrics?.repeatRate) }}</strong>
        </div>
        <div class="summary-item">
          <span>单篇最大</span>
          <strong>{{ formatPercent(metrics?.maxPerSource) }}</strong>
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
import { formatDateTime, formatPercent } from '@/utils/dataType.js'
import { getSimilarityColor } from '@/utils/similarity.js'

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

<style scoped lang="scss">
.signoff-panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  padding: var(--app-space-3) 0 var(--app-space-2);
  font-family: var(--app-font-family);
}

.signoff-panel :deep(.el-textarea__inner),
.signoff-panel :deep(.el-input__wrapper) {
  border-radius: var(--app-radius-md);
  font-size: var(--app-fs-caption);
}

.signoff-card {
  padding: var(--app-space-3);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
  background: var(--app-color-fill-light);
}

.signed-head {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-3);
}

.signed-label {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.signed-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--app-space-2);
  margin: 0;
}

.signed-grid dt,
.signed-comment dt {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.signed-grid dd,
.signed-comment dd {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-ink);
}

.signed-grid dd.score {
  font-size: var(--app-fs-body);
  font-weight: 700;
  color: var(--app-color-primary);
}

.signed-comment {
  margin-top: var(--app-space-3);
  padding-top: var(--app-space-2);
  border-top: 1px solid var(--app-color-divider);
}

.signed-comment dd {
  line-height: 1.6;
  color: var(--app-color-text);
  white-space: pre-wrap;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--app-space-2);
  padding: var(--app-space-2);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-color-card-bg);
}

.summary-item span {
  display: block;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.summary-item strong {
  display: block;
  margin-top: var(--app-space-1);
  font-size: var(--app-fs-caption);
  color: var(--app-color-ink);
}

.summary-item strong.time {
  font-weight: 500;
  font-size: var(--app-fs-meta);
}

.signoff-form :deep(.el-form-item) {
  margin-bottom: var(--app-space-4);
}

.signoff-form :deep(.el-form-item__label) {
  padding-bottom: var(--app-space-1);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.score-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
}

.quick-score {
  padding: 2px var(--app-space-2);
  font-size: var(--app-fs-meta);
  color: var(--app-color-primary);
  background: var(--app-color-info-bg);
  border: 1px solid var(--app-color-info-border);
  border-radius: var(--app-radius-pill);
  cursor: pointer;
}

.submit-signoff {
  width: 100%;
}

.signoff-hint {
  margin: 0;
  font-size: var(--app-fs-meta);
  line-height: 1.5;
  text-align: center;
  color: var(--app-color-text-muted);
}

@media (max-width: 768px) {
  .signed-grid,
  .report-summary {
    grid-template-columns: 1fr;
  }
}
</style>
