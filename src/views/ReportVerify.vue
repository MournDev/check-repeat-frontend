<template>
  <div class="verify-page">
    <div class="verify-card">
      <div class="card-header">
        <h1 class="card-title">查重报告验真</h1>
        <p class="card-subtitle">
          面向用人单位、期刊编辑部等报告接收方：输入查重报告编号，即可核验报告真实性及关键查重指标。
        </p>
      </div>

      <el-form @submit.prevent="handleVerify" class="verify-form" size="large">
        <el-form-item :error="inputError">
          <el-input
            v-model="reportNo"
            placeholder="请输入报告编号"
            clearable
            @keyup.enter="handleVerify"
            @input="inputError = ''"
          />
        </el-form-item>
        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="verify-btn"
        >
          {{ loading ? '验真中...' : '验真' }}
        </el-button>
      </el-form>

      <!-- 限流提示条（内联，不弹窗） -->
      <el-alert
        v-if="rateLimitTip"
        :title="rateLimitTip"
        type="warning"
        show-icon
        :closable="false"
        class="tip-bar"
      />

      <!-- 网络异常提示条 -->
      <el-alert
        v-if="networkTip"
        :title="networkTip"
        type="error"
        show-icon
        :closable="false"
        class="tip-bar"
      />

      <!-- 三态结果卡 -->
      <div v-if="result" class="result-card" :class="`result-${result.type}`">
        <div class="result-head">
          <el-icon :size="22">
            <CircleCheckFilled v-if="result.type === 'success'" />
            <WarningFilled v-else-if="result.type === 'warning'" />
            <CircleCloseFilled v-else />
          </el-icon>
          <span class="result-title">{{ result.title }}</span>
        </div>

        <template v-if="result.type === 'success'">
          <div class="result-rows">
            <div class="result-row">
              <span class="row-label">论文标题</span>
              <span class="row-value">{{ result.data.paperTitle }}</span>
            </div>
            <div class="result-row">
              <span class="row-label">总相似比</span>
              <span class="row-value rate">{{ formatPercent(result.data.checkRate) }}</span>
            </div>
            <div class="result-row">
              <span class="row-label">单篇最大</span>
              <span class="row-value">{{ formatPercent(result.data.maxPerSource) }}</span>
            </div>
            <div class="result-row">
              <span class="row-label">引用率</span>
              <span class="row-value">{{ formatPercent(result.data.citationRate) }}</span>
            </div>
            <div class="result-row">
              <span class="row-label">查重完成时间</span>
              <span class="row-value">{{ result.data.checkTime }}</span>
            </div>
            <div class="result-row">
              <span class="row-label">报告编号</span>
              <span class="row-value">{{ result.data.reportNo }}</span>
            </div>
          </div>
        </template>
        <p v-else class="result-message">{{ result.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton, ElAlert, ElIcon } from 'element-plus'
import { CircleCheckFilled, WarningFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { verifyReport } from '@/api/p5'
import { formatPercent } from '@/utils/dataType.js'

const reportNo = ref('')
const loading = ref(false)
const inputError = ref('')
const result = ref(null)
const rateLimitTip = ref('')
const networkTip = ref('')

// 存量报告 maxPerSource/citationRate 为 null 时显示「—」
const handleVerify = async () => {
  const no = reportNo.value.trim()
  if (!no) {
    inputError.value = '请输入报告编号'
    return
  }

  loading.value = true
  inputError.value = ''
  result.value = null
  rateLimitTip.value = ''
  networkTip.value = ''

  try {
    const res = await verifyReport(no)
    if (res.code === 200) {
      const data = res.data || {}
      if (data.valid) {
        result.value = { type: 'success', title: '验真通过', data }
      } else if (data.message && data.message.includes('历史报告')) {
        result.value = { type: 'warning', title: '无法验真', message: data.message }
      } else {
        result.value = { type: 'error', title: '验真不通过', message: data.message || '报告编号不存在或内容不一致' }
      }
    }
  } catch (err) {
    // silent 模式下业务失败（code≠200）以响应体 reject；网络层错误为 axios error
    if (err && err.code === 500 && typeof err.message === 'string' && err.message.includes('验真请求过于频繁')) {
      rateLimitTip.value = err.message
    } else if (!err || err.code === undefined) {
      networkTip.value = '网络异常，请稍后重试'
    } else {
      networkTip.value = err.message || '验真失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.verify-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--apple-spacing-xl) var(--apple-spacing-lg);
  background: var(--apple-canvas-parchment);
}

.verify-card {
  width: 100%;
  max-width: 520px;
  background: var(--apple-canvas);
  border-radius: var(--apple-rounded-lg);
  box-shadow: var(--apple-shadow-product);
  padding: var(--apple-spacing-xl);
}

.card-header {
  text-align: center;
  margin-bottom: var(--apple-spacing-xl);
}

.card-title {
  font-size: var(--apple-fs-lead-airy);
  font-family: var(--apple-font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--apple-ink);
  margin: 0 0 var(--apple-spacing-xs) 0;
  line-height: 1.3;
}

.card-subtitle {
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink-secondary);
  margin: 0;
  line-height: 1.6;
}

/* 胶囊输入框与主按钮：与登录/注册页共用同一套视觉（AuthLayout） */
.verify-form :deep(.el-input__wrapper) {
  height: 48px;
  background: var(--apple-canvas-parchment);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-pill);
  box-shadow: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.verify-form :deep(.el-input__wrapper:hover) {
  border-color: var(--apple-primary);
}

.verify-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--apple-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.12);
  background: var(--apple-surface);
}

.verify-form :deep(.el-input__inner) {
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink);
}

.verify-form :deep(.el-button.verify-btn) {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: var(--apple-rounded-pill);
  background: var(--apple-primary);
  border-color: var(--apple-primary);
  transition: background 0.2s, opacity 0.2s;
}

.verify-form :deep(.el-button.verify-btn:hover) {
  background: var(--apple-primary-hover);
  border-color: var(--apple-primary-hover);
  opacity: 1;
}

.verify-form :deep(.el-button.verify-btn:active) {
  opacity: 0.85;
}

.tip-bar {
  margin-top: var(--apple-spacing-md);
  border-radius: var(--apple-rounded-sm);
}

.result-card {
  margin-top: var(--apple-spacing-lg);
  padding: var(--apple-spacing-md);
  border-radius: var(--apple-rounded-md);
  border: 1px solid;

  &.result-success {
    background: var(--apple-success-bg);
    border-color: var(--apple-success-border);

    .result-head { color: var(--apple-success); }
  }

  &.result-warning {
    background: var(--apple-warning-bg);
    border-color: var(--apple-warning-border);

    .result-head { color: var(--apple-warning); }
  }

  &.result-error {
    background: var(--apple-danger-bg);
    border-color: var(--apple-danger-border);

    .result-head { color: var(--apple-danger); }
  }
}

.result-head {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
  margin-bottom: var(--apple-spacing-sm);
}

.result-title {
  font-size: var(--apple-fs-body-strong);
  font-family: var(--apple-font-display);
  font-weight: 600;
}

.result-rows {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-xs);
}

.result-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--apple-spacing-md);
  font-size: var(--apple-fs-caption);
  line-height: 1.5;
}

.row-label {
  color: var(--apple-ink-secondary);
  flex-shrink: 0;
}

.row-value {
  color: var(--apple-ink);
  font-weight: 500;
  text-align: right;
  word-break: break-all;

  &.rate {
    font-size: var(--apple-fs-body-strong);
    font-weight: 600;
  }
}

.result-message {
  margin: 0;
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink);
  line-height: 1.6;
}

@media (max-width: 480px) {
  .verify-card {
    padding: var(--apple-spacing-lg);
  }

  .card-title {
    font-size: var(--apple-fs-tagline);
  }
}
</style>
