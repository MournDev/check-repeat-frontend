<template>
  <AuthLayout
    page-type="reset"
    title="找回密码"
    subtitle="通过邮箱重置账户密码"
    :is-typing="isTyping"
    :show-password="showPassword"
    :password-length="passwordLength"
    :is-error="!!error"
  >
    <el-form
      :model="resetForm"
      :rules="resetRules"
      ref="resetFormRef"
      size="large"
      class="auth-form"
    >
      <div class="field-label">用户名</div>
      <el-form-item prop="username">
        <el-input
          v-model="resetForm.username"
          placeholder="请输入用户名"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="field-label">邮箱</div>
      <el-form-item prop="email">
        <el-input
          v-model="resetForm.email"
          placeholder="请输入邮箱（用于身份验证）"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="field-label">验证码</div>
      <el-form-item prop="verificationCode">
        <div class="code-row">
          <el-input
            v-model="resetForm.verificationCode"
            placeholder="请输入邮箱验证码"
            maxlength="6"
            @focus="isTyping = true; error = ''"
            @blur="isTyping = false"
            class="code-input"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          <el-button
            type="primary"
            :disabled="codeCooldown > 0"
            @click="handleSendCode"
            :loading="sendingCode"
            class="send-code-btn"
          >
            {{ codeCooldown > 0 ? `${codeCooldown}s后重发` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>

      <div class="field-label">新密码</div>
      <el-form-item prop="newPassword">
        <el-input
          v-model="resetForm.newPassword"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入新密码"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
          <template #suffix>
            <span class="eye-toggle" @click="showPassword = !showPassword">
              <el-icon v-if="showPassword"><View /></el-icon>
              <el-icon v-else><Hide /></el-icon>
            </span>
          </template>
        </el-input>
      </el-form-item>

      <div class="field-label">确认新密码</div>
      <el-form-item prop="confirmPassword">
        <el-input
          v-model="resetForm.confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请确认新密码"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
          <template #suffix>
            <span class="eye-toggle" @click="showPassword = !showPassword">
              <el-icon v-if="showPassword"><View /></el-icon>
              <el-icon v-else><Hide /></el-icon>
            </span>
          </template>
        </el-input>
      </el-form-item>

      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      />

      <el-form-item :style="{ marginBottom: 0 }">
        <el-button
          type="primary"
          native-type="submit"
          @click="handleReset"
          :loading="loading"
          class="submit-btn"
        >
          {{ loading ? '重置中...' : '重置密码' }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="divider">
      <span>或</span>
    </div>

    <div class="signup-row">
      已有账号？
      <el-button link @click="goLogin" class="signup-link">
        返回登录
      </el-button>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, View, Hide, Key } from '@element-plus/icons-vue'
import { forgetPassword, sendPasswordResetCode } from '@/api/login'
import { tokenManager } from '@/utils/tokenManager'
import AuthLayout from '@/components/layout/AuthLayout.vue'
const router = useRouter()
const resetFormRef = ref(null)
const loading = ref(false)

// 新增响应式变量
const isTyping = ref(false)
const showPassword = ref(false)
const error = ref('')
const sendingCode = ref(false)
const codeCooldown = ref(0)
let cooldownTimer = null

const resetForm = ref({
  username: '',
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

// 监听密码长度变化
const passwordLength = ref(0)

watch(() => resetForm.value.newPassword, (newVal) => {
  passwordLength.value = newVal ? newVal.length : 0
})

const resetRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能少于3位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱用于身份验证', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleSendCode = async () => {
  if (!resetForm.value.username) {
    error.value = '请先输入用户名'
    return
  }
  if (!resetForm.value.email) {
    error.value = '请先输入邮箱'
    return
  }
  try {
    sendingCode.value = true
    error.value = ''
    await sendPasswordResetCode({
      username: resetForm.value.username,
      email: resetForm.value.email
    })
    ElMessage.success('验证码已发送到您的邮箱')
    codeCooldown.value = 60
    cooldownTimer = setInterval(() => {
      codeCooldown.value--
      if (codeCooldown.value <= 0) {
        clearInterval(cooldownTimer)
      }
    }, 1000)
  } catch (err) {
    error.value = err?.response?.data?.message || err.message || '发送验证码失败'
  } finally {
    sendingCode.value = false
  }
}

const handleReset = async () => {
  try {
    await resetFormRef.value.validate()
    loading.value = true
    error.value = ''


    // 构建请求数据
    const payload = {
      username: resetForm.value.username,
      email: resetForm.value.email,
      verificationCode: resetForm.value.verificationCode,
      newPassword: resetForm.value.newPassword
    }

    
    // 调用忘记密码接口
    const res = await forgetPassword(payload)

    // 后端已使该用户全部旧 token 失效：清掉本地可能残留的 cookie。否则
    // Login 页 onMounted 检测到未过期 token 会自动跳回应用，拿着作废令牌 401 循环
    tokenManager.remove()

    ElMessage.success('密码重置成功，请使用新密码登录')
    
    // 延迟跳转，让用户看到成功消息
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, 1500)
    
  } catch (err) {
    console.error('重置密码失败：', err)
    
    // 更精确的错误处理
    if (err?.response?.status === 404) {
      error.value = '用户不存在或邮箱不匹配'
    } else if (err?.response?.status === 400) {
      error.value = '请求参数错误，请检查输入'
    } else if (err?.message && !err.message.includes('validation')) {
      error.value = err.message || '重置失败，请重试'
    }
    // 表单验证错误不显示额外提示
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  router.push({ name: 'Login' })
}
</script>

<style lang="scss" scoped>
.code-row {
  display: flex;
  gap: var(--apple-spacing-sm);
  width: 100%;
}

.code-input {
  flex: 1;
}

/* 验证码按钮：与输入框同高、同胶囊圆角；其余表单样式统一在 AuthLayout */
.code-row :deep(.el-button) {
  height: 48px;
  border-radius: var(--apple-rounded-pill);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
