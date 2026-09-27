<template>
  <AuthLayout
    page-type="register"
    title="用户注册"
    subtitle="创建您的账户，开启学术之旅"
    :is-typing="isTyping"
    :show-password="showPassword"
    :password-length="passwordLength"
    :is-error="!!error"
  >
    <el-form
      :model="registerForm"
      :rules="registerRules"
      ref="registerFormRef"
      size="large"
      class="auth-form"
    >
      <div class="field-label">用户名</div>
      <el-form-item prop="username">
        <el-input
          v-model="registerForm.username"
          placeholder="请输入用户名"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="field-label">密码</div>
      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码"
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

      <div class="field-label">确认密码</div>
      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请确认密码"
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

      <div class="field-label">真实姓名</div>
      <el-form-item prop="realName">
        <el-input
          v-model="registerForm.realName"
          placeholder="请输入真实姓名"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="field-label">用户类型</div>
      <el-form-item prop="roleCode">
        <el-select
          v-model="registerForm.roleId"
          placeholder="请选择用户类型"
          style="width: 100%"
          @focus="isTyping = true"
          @blur="isTyping = false"
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.value"
            :label="role.label"
            :value="role.value"
          >
          </el-option>
        </el-select>
      </el-form-item>

      <div class="field-label">邮箱</div>
      <el-form-item prop="email">
        <el-input
          v-model="registerForm.email"
          placeholder="请输入邮箱"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="field-label">手机号</div>
      <el-form-item prop="phone">
        <el-input
          v-model="registerForm.phone"
          placeholder="请输入手机号"
          @focus="isTyping = true; error = ''"
          @blur="isTyping = false"
        >
          <template #prefix>
            <el-icon><Phone /></el-icon>
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
          @click="handleRegister"
          :loading="loading"
          class="submit-btn"
        >
          {{ loading ? '注册中...' : '立即注册' }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="divider">
      <span>或</span>
    </div>

    <div class="signup-row">
      已有账号？
      <el-button link @click="handleLogin" class="signup-link">
        立即登录
      </el-button>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone, Message, View, Hide } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)
const userStore = useUserStore()

// 新增响应式变量
const isTyping = ref(false)
const showPassword = ref(false)
const error = ref('')

// 注册表单
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  roleId: '',
  email: '',
  phone: ''
})

// 监听密码长度变化
const passwordLength = ref(0)

watch(() => registerForm.value.password, (newVal) => {
  passwordLength.value = newVal ? newVal.length : 0
})

const roleOptions = ref([
  { label: '学生', value: '1001', code: 'STUDENT' },    // value 是角色ID
  { label: '指导老师', value: '2001', code: 'TEACHER' }, // value 是角色ID  
  { label: '管理员', value: '3001', code: 'ADMIN' }      // value 是角色ID
])

// 表单校验规则
const registerRules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: ['blur', 'change'] }
  ]
})

// 注册操作
const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
    loading.value = true
    error.value = ''
    
    //调用注册接口
    const res = await userStore.register(registerForm.value)
    
    ElMessage.success('注册成功')
    router.push('/login')
    
  } catch (err) {
    console.error('注册失败：', err)
    error.value = err.message || '注册失败，请检查表单信息'
  } finally {
    loading.value = false
  }
}

// 跳转到登录页
const handleLogin = () => {
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.auth-form {
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
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.12) !important;
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

  :deep(.el-select .el-input__wrapper) {
    height: 48px !important;
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
</style>