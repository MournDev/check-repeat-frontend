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

const reportNo = ref('')
const loading = ref(false)
const inputError = ref('')
const result = ref(null)
const rateLimitTip = ref('')
const networkTip = ref('')

// 百分比统一 2 位小数拼 %；存量报告 maxPerSource/citationRate 为 null 时显示「—」
const formatPercent = (v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(2)}%`)

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
  padding: 32px 20px;
  background: var(--apple-canvas-parchment);
}

.verify-card {
  width: 100%;
  max-width: 520px;
  background: var(--apple-canvas);
  border-radius: var(--apple-rounded-lg);
  box-shadow: var(--apple-shadow-product);
  padding: 40px 36px;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--apple-ink);
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.card-subtitle {
  font-size: 14px;
  color: var(--apple-ink-secondary);
  margin: 0;
  line-height: 1.6;
}

.verify-form {
  :deep(.el-input__wrapper) {
    height: 48px !important;
    background: var(--apple-canvas-parchment) !important;
    border: 1px solid var(--apple-surface-chip-translucent) !important;
    border-radius: var(--apple-rounded-pill) !important;
    box-shadow: none !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
  }

  :deep(.el-input__wrapper:hover) {
    border-color: var(--apple-primary) !important;
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: var(--apple-primary) !important;
    outline: 2px solid var(--apple-primary);
    outline-offset: -2px;
    background: var(--apple-canvas) !important;
  }
}

.verify-btn {
  width: 100%;
  height: 48px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: var(--apple-rounded-pill) !important;
  background: var(--apple-primary) !important;
  border-color: var(--apple-primary) !important;
  letter-spacing: 1px;
  transition: background 0.2s, opacity 0.2s !important;
}

.verify-btn:hover {
  background: var(--apple-primary-hover) !important;
  border-color: var(--apple-primary-hover) !important;
  opacity: 1 !important;
}

.verify-btn:active {
  opacity: 0.85 !important;
}

.tip-bar {
  margin-top: 20px;
  border-radius: var(--apple-rounded-sm);
}

.result-card {
  margin-top: 24px;
  border-radius: var(--apple-rounded-md);
  padding: 20px;
  border: 1px solid;

  &.result-success {
    background: rgba(52, 199, 89, 0.08);
    border-color: rgba(52, 199, 89, 0.35);

    .result-head { color: var(--apple-success); }
  }

  &.result-warning {
    background: rgba(255, 149, 0, 0.08);
    border-color: rgba(255, 149, 0, 0.35);

    .result-head { color: var(--apple-warning); }
  }

  &.result-error {
    background: rgba(255, 59, 48, 0.08);
    border-color: rgba(255, 59, 48, 0.35);

    .result-head { color: var(--apple-danger); }
  }
}

.result-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.result-title {
  font-size: 17px;
  font-weight: 600;
}

.result-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
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
    font-size: 17px;
    font-weight: 600;
  }
}

.result-message {
  margin: 0;
  font-size: 14px;
  color: var(--apple-ink);
  line-height: 1.6;
}

@media (max-width: 480px) {
  .verify-card {
    padding: 28px 20px;
  }

  .card-title {
    font-size: 22px;
  }
}
</style>
