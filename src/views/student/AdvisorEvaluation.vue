<template>
  <div class="advisor-evaluation">
    <!-- 页头 -->
    <el-card class="console-card console-page-head-card" shadow="never">
      <div class="head-row">
        <div class="head-text">
          <h2 class="head-title">导师评价</h2>
          <p class="head-desc">终期答辩通过后对指导教师的指导工作进行评价，评价结果仅作教师考核数据源，不进入成绩合成。</p>
        </div>
      </div>
    </el-card>

    <!-- 状态卡：加载中 -->
    <el-card v-if="loading" class="console-card" shadow="never">
      <div class="state-block">
        <el-skeleton :rows="4" animated />
      </div>
    </el-card>

    <!-- 状态卡：不可评 -->
    <el-card v-else-if="!status.evaluable && !status.submitted" class="console-card" shadow="never">
      <div class="state-block">
        <el-icon :size="48" class="state-icon"><Lock /></el-icon>
        <h3 class="state-title">暂不可评价</h3>
        <p class="state-reason">{{ status.reason || '论文尚未通过终期答辩，暂不可评价' }}</p>
        <el-button v-if="status.paperId" type="primary" plain @click="goPaperDetail">
          查看论文详情
        </el-button>
      </div>
    </el-card>

    <!-- 已提交回显 -->
    <el-card v-else-if="status.submitted" class="console-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><CircleCheckFilled /></el-icon>
            已提交评价
          </span>
          <span class="submit-time">提交时间：{{ formatDateTime(status.submitTime, 'YYYY-MM-DD HH:mm:ss', '—') }}</span>
        </div>
      </template>
      <div class="readonly-body">
        <div class="paper-info">
          <div class="info-item">
            <span class="label">论文题目：</span>
            <span class="value">{{ status.paperTitle || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">指导教师：</span>
            <span class="value">{{ status.teacherName || '—' }}</span>
          </div>
        </div>
        <el-divider />
        <div class="score-grid">
          <div class="score-item" v-for="item in scoreFields" :key="item.key">
            <div class="score-label">{{ item.label }}</div>
            <el-rate :model-value="status[item.key]" disabled show-score score-template="{value} 分" />
          </div>
        </div>
        <div v-if="status.tags?.length" class="tags-block">
          <div class="block-label">评价标签</div>
          <el-tag
            v-for="tag in status.tags"
            :key="tag"
            :type="tagType(tag)"
            effect="light"
            round
            class="tag-item"
          >
            {{ tagLabel(tag) }}
          </el-tag>
        </div>
        <div v-if="status.comment" class="comment-block">
          <div class="block-label">文字评语</div>
          <p class="comment-text">{{ status.comment }}</p>
        </div>
        <el-alert type="info" :closable="false" show-icon class="readonly-tip">
          评价提交后不可修改，感谢您对教学工作的反馈。
        </el-alert>
      </div>
    </el-card>

    <!-- 评价表单 -->
    <el-card v-else class="console-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><EditPen /></el-icon>
            填写评价
          </span>
          <el-tag v-if="status.windowEndTime" type="warning" effect="light" round>
            请于 {{ status.windowEndTime }} 前完成评价
          </el-tag>
        </div>
      </template>
      <div class="form-body">
        <div class="paper-info">
          <div class="info-item">
            <span class="label">论文题目：</span>
            <span class="value">{{ status.paperTitle || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">指导教师：</span>
            <span class="value">{{ status.teacherName || '—' }}</span>
          </div>
        </div>
        <el-divider />
        <el-form ref="formRef" :model="form" label-position="top">
          <el-form-item
            v-for="item in scoreFields"
            :key="item.key"
            :label="item.label"
            :prop="item.key"
            :rules="[{ required: true, message: `请为${item.label}评分`, trigger: 'change' }]"
          >
            <el-rate v-model="form[item.key]" :max="5" show-score score-template="{value} 分" />
          </el-form-item>

          <el-form-item label="评价标签（可多选，最多 7 个）">
            <el-checkbox-group v-model="form.tags" :max="7">
              <el-checkbox
                v-for="opt in tagOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.value"
              >
                {{ opt.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="文字评语（可选，最多 500 字）">
            <el-input
              v-model="form.comment"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              placeholder="请输入对导师指导工作的具体反馈..."
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
              提交评价
            </el-button>
            <span class="form-tip">提交后不可修改，请确认填写无误。</span>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock, CircleCheckFilled, EditPen } from '@element-plus/icons-vue'
import { getMyAdvisorEvaluation, submitAdvisorEvaluation } from '@/api/advisorEvaluation'
import {
  ADVISOR_EVAL_TAG_OPTIONS,
  advisorEvalTagLabel,
  isNegativeAdvisorEvalTag
} from '@/utils/advisorEvalTag'
import { formatDateTime } from '@/utils/dataType.js'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const status = ref({
  paperId: null,
  paperTitle: '',
  teacherName: null,
  evaluable: false,
  reason: null,
  windowEndTime: null,
  submitted: false,
  scoreTimeliness: null,
  scoreQuality: null,
  scoreAttitude: null,
  scoreProfessional: null,
  scoreOverall: null,
  tags: [],
  comment: null,
  submitTime: null,
  tagOptions: []
})

const formRef = ref()
const form = ref({
  scoreTimeliness: null,
  scoreQuality: null,
  scoreAttitude: null,
  scoreProfessional: null,
  scoreOverall: null,
  tags: [],
  comment: ''
})

const scoreFields = [
  { key: 'scoreTimeliness', label: '指导及时性' },
  { key: 'scoreQuality', label: '反馈质量' },
  { key: 'scoreAttitude', label: '责任心态度' },
  { key: 'scoreProfessional', label: '专业能力' },
  { key: 'scoreOverall', label: '总体满意度' }
]

// 标签字典统一取 utils/advisorEvalTag.js（SSOT），此处仅做模板别名
const tagOptions = computed(() => {
  // 后端 /my 恒返回 tagOptions，直接用它；本地兜底防接口异常
  if (status.value.tagOptions?.length) return status.value.tagOptions
  return ADVISOR_EVAL_TAG_OPTIONS
})

const tagLabel = advisorEvalTagLabel
const tagType = (value) => (isNegativeAdvisorEvalTag(value) ? 'danger' : 'success')

const fetchStatus = async () => {
  loading.value = true
  try {
    const paperId = route.query.paperId ? String(route.query.paperId) : undefined
    const res = await getMyAdvisorEvaluation(paperId)
    status.value = res.data || {}
    // 已提交时把后端数据回填到表单，避免意外编辑
    if (status.value.submitted) {
      form.value = {
        scoreTimeliness: status.value.scoreTimeliness,
        scoreQuality: status.value.scoreQuality,
        scoreAttitude: status.value.scoreAttitude,
        scoreProfessional: status.value.scoreProfessional,
        scoreOverall: status.value.scoreOverall,
        tags: [...(status.value.tags || [])],
        comment: status.value.comment || ''
      }
    }
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm(
      '评价提交后不可修改，确认提交吗？',
      '提交确认',
      { type: 'warning', confirmButtonText: '确认提交', cancelButtonText: '再想想' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = {
      paperId: String(status.value.paperId),
      scoreTimeliness: form.value.scoreTimeliness,
      scoreQuality: form.value.scoreQuality,
      scoreAttitude: form.value.scoreAttitude,
      scoreProfessional: form.value.scoreProfessional,
      scoreOverall: form.value.scoreOverall,
      tags: form.value.tags,
      comment: form.value.comment || undefined
    }
    const res = await submitAdvisorEvaluation(payload)
    if (res?.code === 200) {
      ElMessage.success('评价提交成功')
      // 重新拉取状态，切换到回显态
      await fetchStatus()
    }
  } catch (err) {
    // 40917/40918/40919 已由拦截器按 message 提示；40918 额外刷新为已提交态
    if (err?.errorCode === 40918 || err?.code === 409) {
      await fetchStatus()
    }
  } finally {
    submitting.value = false
  }
}

const goPaperDetail = () => {
  if (status.value.paperId) {
    router.push({ name: 'PaperDetail', query: { paperId: status.value.paperId } })
  }
}

onMounted(() => {
  fetchStatus()
})
</script>

<style scoped lang="scss">
.advisor-evaluation {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  color: var(--app-color-ink);
  font-family: var(--app-font-family);
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-4);
}

.head-title {
  margin: 0 0 var(--app-space-2);
  font-family: var(--app-font-family);
  font-size: var(--app-fs-title);
  font-weight: 700;
  line-height: var(--app-lh-display);
  color: var(--app-color-ink);
}

.head-desc {
  margin: 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-3);
  padding: var(--app-space-8) var(--app-space-6);
  text-align: center;
}

.state-icon {
  color: var(--app-color-text-muted);
}

.state-title {
  margin: 0;
  font-size: var(--app-fs-body);
  font-weight: 600;
}

.state-reason {
  margin: 0;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
  max-width: 420px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  flex-wrap: wrap;

  .card-title {
    display: flex;
    align-items: center;
    font-family: var(--app-font-family);
    font-size: var(--app-fs-body);
    font-weight: 600;

    .el-icon {
      margin-right: var(--app-space-2);
      color: var(--app-color-primary);
    }
  }

  .submit-time {
    font-size: var(--app-fs-meta);
    color: var(--app-color-text-muted);
  }
}

.readonly-body,
.form-body {
  padding: var(--app-space-2) 0;
}

.paper-info {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
}

.info-item {
  display: flex;
  gap: var(--app-space-2);
  font-size: var(--app-fs-caption);

  .label {
    color: var(--app-color-text-muted);
    flex-shrink: 0;
  }

  .value {
    color: var(--app-color-ink);
  }
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--app-space-4);
  margin: var(--app-space-4) 0;
}

.score-item {
  .score-label {
    font-size: var(--app-fs-meta);
    color: var(--app-color-text-muted);
    margin-bottom: var(--app-space-2);
  }
}

.block-label {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  margin-bottom: var(--app-space-2);
}

.tags-block {
  margin: var(--app-space-4) 0;

  .tag-item {
    margin-right: var(--app-space-2);
    margin-bottom: var(--app-space-2);
  }
}

.comment-block {
  margin: var(--app-space-4) 0;

  .comment-text {
    margin: 0;
    font-size: var(--app-fs-caption);
    line-height: 1.6;
    color: var(--app-color-ink);
    white-space: pre-wrap;
  }
}

.readonly-tip {
  margin-top: var(--app-space-4);
}

.form-tip {
  margin-left: var(--app-space-3);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

:deep(.el-rate) {
  height: 22px;
}
</style>
