<template>
  <AuthLayout
    page-type="login"
    title="登录到工作台"
    subtitle="统一接入论文管理系统"
    :is-typing="isTyping"
    :show-password="showPassword"
    :password-length="passwordLength"
    :is-error="!!error"
  >
    <el-form
      name="login"
      :model="loginForm"
      @submit.prevent="handleLogin"
      autocomplete="off"
      size="large"
      class="auth-form"
    >
      <div class="field-label">账号</div>
      <el-form-item
        prop="username"
        :rules="[
          { required: true, message: '请输入账号' },
          { min: 3, message: '账号长度不能少于 3 个字符' },
        ]"
      >
        <el-input
          v-model="loginForm.username"
          placeholder="输入您的账号"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="field-label">密码</div>
      <el-form-item
        prop="password"
        :rules="[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码长度不能少于 6 个字符' },
        ]"
      >
        <el-input
          v-model="loginForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="输入您的密码"
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
        class="login-error"
      />

      <el-form-item :style="{ marginBottom: 0 }">
        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="submit-btn"
        >
          {{ loading ? '登录中...' : '登录' }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="password-forgot">
      <el-button link @click="handleForgotPassword" class="forgot-link">
        忘记密码？
      </el-button>
    </div>

    <div class="divider">
      <span>或</span>
    </div>

    <div class="signup-row">
      暂无账号？
      <el-button link @click="handleRegister" class="signup-link">
        前往注册
      </el-button>
    </div>

    <div class="signup-row signup-row-tight">
      需要验证查重报告真伪？
      <el-button link @click="router.push('/report-verify')" class="signup-link">
        报告验真
      </el-button>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { tokenManager } from '@/utils/tokenManager'
import { ROLE_HOME } from '@/router'
import { ElMessage } from 'element-plus'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const router = useRouter()
const userStore = useUserStore()

// 已登录用户访问 / 或 /login 时直接送回角色落地页，避免重复登录覆盖会话
onMounted(() => {
  const token = tokenManager.get()
  if (token && !tokenManager.isExpired()) {
    router.replace(ROLE_HOME[tokenManager.getRole()] || '/message-center')
  }
})

const loading = ref(false)
const showPassword = ref(false)
const isTyping = ref(false)
const error = ref('')

const loginForm = ref({
  username: '',
  password: ''
})

// 监听密码长度变化
const passwordLength = ref(0)

watch(() => loginForm.value.password, (newVal) => {
  passwordLength.value = newVal ? newVal.length : 0
})

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await userStore.login(loginForm.value)

    if (res.code === 200) {
      ElMessage.success('登录成功')

      const role = res.data?.roleCode || userStore.role

      let targetRoute
      if (role === 'STUDENT') {
        targetRoute = { name: 'StudentDashboard' }
      } else if (role === 'TEACHER') {
        targetRoute = { name: 'TeacherDashboard' }
      } else if (role === 'ADMIN') {
        // 与 MainLayout 的 ROLE_HOME.ADMIN 对齐：登录落「运营概览」，
        // 也是侧边栏第一项和面包屑「首页」的目标
        targetRoute = { name: 'AdminDashboard' }
      } else if (role === 'SUPER_ADMIN') {
        targetRoute = { name: 'SuperAdminDashboard' }
      } else {
        targetRoute = { name: 'Dashboard' }
      }
      
      const result = await router.push(targetRoute)
      if (result) {
        console.error('跳转失败：', result)
      }
    } else {
      error.value = res.message || '登录失败，请检查账号密码'
    }
  } catch (err) {
    // HTTP 429 锁定等场景：真实原因在响应体 message，axios 的 error.message
    // 只是「Request failed with status code 429」，直接展示是天书
    error.value = err?.response?.data?.message || err?.message || '账号或密码有误，请重新输入'
    console.error('登录失败：', err)
  } finally {
    loading.value = false
  }
}

const handleRegister = () => {
  router.push('/register')
}

const handleForgotPassword = () => {
  router.push('/reset')
}
</script>

<style lang="scss" scoped>
/* 表单控件、按钮、分隔线与链接样式统一在 AuthLayout，本页只保留登录页特有元素 */
.login-error {
  margin-bottom: var(--apple-spacing-md);
}

.password-forgot {
  margin-top: var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-md);
  text-align: right;
}

.password-forgot :deep(.el-button) {
  font-size: var(--apple-fs-fine-print);
  font-weight: 400;
  color: var(--apple-ink-secondary);
  text-decoration: none;
  cursor: pointer;
}

.password-forgot :deep(.el-button:hover) {
  color: var(--apple-primary);
  text-decoration: underline;
}
</style>
