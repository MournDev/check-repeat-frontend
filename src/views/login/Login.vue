<template>
  <div class="login-page">
    <!-- 左侧：角色视觉区 -->
    <div class="left-panel">
      <div class="left-top">
        <div class="brand-mark">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="white" fill-opacity="0.15" />
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9" />
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5" />
          </svg>
        </div>
        <span class="brand-name">论文查重管理系统</span>
      </div>

      <div class="characters-area">
        <AnimatedCharacters
          :is-typing="isTyping"
          :show-password="showPassword"
          :password-length="passwordLength"
          :is-login-failed="!!error"
        />
      </div>

      <!-- 底部链接已移除 -->

    </div>

    <!-- 右侧：登录表单 -->
    <div class="right-panel">
      <div class="form-wrapper">
        <div class="mobile-logo">
          <div class="mobile-logo-icon">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="#0066cc" fill-opacity="0.9" />
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="#5ac8fa" fill-opacity="0.7" />
            </svg>
          </div>
          <span>论文查重管理系统</span>
        </div>

        <div class="form-header">
          <h1 class="form-title">登录到工作台</h1>
          <p class="form-subtitle">
            统一接入论文管理系统
          </p>
        </div>

        <el-form
          name="login"
          :model="loginForm"
          @submit.prevent="handleLogin"
          autocomplete="off"
          size="large"
          class="login-form"
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
            style="margin-bottom: 16px;"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import AnimatedCharacters from '@/components/animated-characters/AnimatedCharacters.vue'

const router = useRouter()
const userStore = useUserStore()

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
        targetRoute = { name: 'SchoolOverview' }
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
    error.value = err?.message || '账号或密码有误，请重新输入'
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
.login-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

/* 左侧面板 */
.left-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  background: #272729;
  overflow: hidden;
}

.left-top {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.brand-name {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

.characters-area {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 500px;
}

.left-footer {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 24px;
}

.left-footer a {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.left-footer a:hover {
  color: rgba(255, 255, 255, 0.85);
}

/* 右侧面板 */
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #ffffff;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.mobile-logo {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 48px;
}

.mobile-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.form-subtitle {
  font-size: 14px;
  color: #86868b;
  margin: 0;
  line-height: 1.6;
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    height: 48px !important;
    background: #f5f5f7 !important;
    border: 1px solid #d2d2d7 !important;
    border-radius: 9999px !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
  }

  :deep(.el-input__wrapper:hover) {
    border-color: #0066cc !important;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-input__wrapper:focus) {
    border-color: #0066cc !important;
    outline: 2px solid #0066cc;
    outline-offset: -2px;
    background: #ffffff !important;
  }

  :deep(.el-input__inner) {
    background: transparent !important;
    font-size: 14px !important;
    color: #1d1d1f !important;
  }

  :deep(.el-input__inner::placeholder) {
    color: #86868b !important;
  }
}

.field-label {
  font-size: 13px;
  font-weight: 400;
  color: #1d1d1f;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}

.eye-toggle {
  color: #86868b;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.eye-toggle:hover {
  color: #1d1d1f;
}

.submit-btn {
  width: 100%;
  height: 48px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: 9999px !important;
  background: #0066cc !important;
  border-color: #0066cc !important;
  letter-spacing: 1px;
  transition: background 0.2s, opacity 0.2s !important;
  cursor: pointer;
}

.submit-btn:hover {
  background: #0055aa !important;
  border-color: #0055aa !important;
  opacity: 1 !important;
}

.submit-btn:active {
  opacity: 0.85 !important;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 0;
  color: #d2d2d7;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #d2d2d7;
}

.divider span {
  color: #86868b;
  white-space: nowrap;
}

.signup-row {
  text-align: center;
  font-size: 13px;
  color: #86868b;
  margin-top: 28px;
}

.signup-link {
  color: #0066cc !important;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
}

.signup-link:hover {
  text-decoration: underline;
  color: #0055aa !important;
}

.password-forgot {
  text-align: right;
  margin-top: 12px;
  margin-bottom: 16px;
}

.forgot-link {
  color: #86868b !important;
  font-size: 13px;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
}

.forgot-link:hover {
  color: #0066cc !important;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .left-panel {
    display: none;
  }

  .mobile-logo {
    display: flex;
  }
}

@media (max-width: 480px) {
  .right-panel {
    padding: 20px;
  }

  .form-title {
    font-size: 22px;
  }
}
</style>
