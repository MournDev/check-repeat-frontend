<template>
  <div class="login-container">
    <!-- 背景遮罩层 -->
    <div class="background-overlay"></div>
    
    <!-- 登录卡片 -->
    <div class="login-content">
      <el-card class="login-card">
        <div class="card-header">
          <h2 class="login-title">学生论文管理系统</h2>
          <p class="login-subtitle">欢迎回来，请登录您的账户</p>
        </div>
        
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="0">
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名" 
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码" 
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
        
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleLogin" 
              class="login-btn" 
              :loading="loading"
              size="large"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-footer">
          <el-button type="text" @click="handleRegister" class="register-btn">
            还没有账号？立即注册
          </el-button>
          <el-divider direction="vertical" />
          <el-button type="text" @click="handleForgotPassword" class="forgot-btn">
            忘记密码？
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
})

// 表单校验规则
const loginRules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
})

// 登录操作
const handleLogin = async () => {
  try {
    // 表单校验
    await loginFormRef.value.validate()
    loading.value = true
    // 调用登录接口
    const res = await userStore.login(loginForm.value)

    if (res.data.success) {
      console.log('🎯 登录成功，立即检查userStore:')
      console.log('  - userStore.userInfo:', userStore.userInfo)
      console.log('  - userStore.userInfo.userId:', userStore.userInfo.userId)
      console.log('  - 与返回数据对比:', res.data.userId === userStore.userInfo.userId)
      
      // 立即检查localStorage
      const stored = localStorage.getItem('userInfo')
      console.log('  - localStorage userInfo:', stored)
    }
    ElMessage.success('登录成功')
    // 优先从接口响应读取 roleCode，回退到 store 中的 role
    const role = res?.data?.roleCode || userStore.role
    console.log('用户角色:', role)
    // 根据 role 跳转到对应仪表盘（使用 route name，避免相对路径问题）
    try {
      if (role === 'STUDENT') {
        await router.push({ name: 'StudentDashboard' })
        console.log('跳转到学生仪表盘')
      } else if (role === 'TEACHER') {
        await router.push({ name: 'TeacherDashboard' })
        console.log('跳转到教师仪表盘')
      } else if (role === 'ADMIN') {
        await router.push({ name: 'AdminDashboard' })
        console.log('跳转到管理员仪表盘')
      } else {
        // 默认跳到总览仪表盘
        console.log('未知角色，跳转到总览仪表盘')
        await router.push({ name: 'Dashboard' })
      }
    } catch (navErr) {
      // 忽略重复导航等非致命错误，但在控制台记录
      console.warn('导航失败：', navErr)
    }
  } catch (error) {
    ElMessage.error('登录失败，请检查用户名或密码')
    console.error('登录失败：', error)
  } finally {
    loading.value = false
  }
}

// 注册操作
const handleRegister = () => {
  router.push('/register');
}

// 忘记密码操作
const handleForgotPassword = () => {
  router.push('/reset')
}
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  // 使用本地图片作为背景
  background-image: url('@/assets/images/login.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

// 背景遮罩层 - 让文字更清晰
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4); // 可调整透明度 0.3-0.5
  z-index: 1;
}

// 内容区域
.login-content {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  width: 100%;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.98);
  position: relative;
  z-index: 2; // 确保卡片在遮罩层之上
  
  :deep(.el-card__body) {
    padding: 0;
  }
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.75rem;
  font-weight: 600;
}

.login-subtitle {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
}

// 表单样式
:deep(.el-form-item) {
  margin-bottom: 1.25rem;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.2s;
  margin-top: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 底部链接
.login-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eaeaea;
}

.register-btn {
  color: #667eea;
  font-weight: 500;
  
  &:hover {
    color: #764ba2;
  }
}

.forgot-btn {
  color: #a0aec0;
  font-weight: 400;
  
  &:hover {
    color: #718096;
  }
}

:deep(.el-divider--vertical) {
  height: 1em;
  margin: 0 12px;
}

// 响应式设计
@media (max-width: 480px) {
  .login-content {
    max-width: 360px;
    padding: 15px;
  }
  
  .login-card {
    padding: 2rem 1.5rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}
</style>