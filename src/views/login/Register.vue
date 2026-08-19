<template>
  <div class="register-container">
    <!-- 背景遮罩层 -->
    <div class="background-overlay"></div>
    
    <!-- 注册卡片 -->
    <div class="register-content">
      <el-card class="register-card">
        <div class="card-header">
          <h2 class="register-title">用户注册</h2>
          <p class="register-subtitle">创建您的账户，开启学术之旅</p>
        </div>
        
        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="0">
          <el-form-item prop="username">
            <el-input 
              v-model="registerForm.username" 
              placeholder="请输入用户名" 
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="请输入密码" 
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="请确认密码" 
              size="large"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="realName">
            <el-input 
              v-model="registerForm.realName" 
              placeholder="请输入真实姓名" 
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="roleCode">
            <el-select 
              v-model="registerForm.roleId" 
              placeholder="请选择用户类型" 
              size="large"
              style="width: 100%"
            >
              <el-option 
              v-for="role in roleOptions" 
              :key="role.value"
              :label="role.label" 
              :value="role.value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item prop="email">
            <el-input 
              v-model="registerForm.email" 
              placeholder="请输入邮箱" 
              size="large"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>
          <el-form-item prop="phone">
            <el-input 
              v-model="registerForm.phone" 
              placeholder="请输入手机号"
              size="large"
              :prefix-icon="Phone"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleRegister" 
              class="register-btn" 
              :loading="loading"
              size="large"
            >
              {{ loading ? '注册中...' : '立即注册' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="register-footer">
          <span class="footer-text">已有账号？</span>
          <el-button type="text" @click="handleLogin" class="login-btn">
            立即登录
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)
const userStore = useUserStore()

const roleOptions = ref([
  { label: '学生', value: '1001', code: 'STUDENT' },    // value 是角色ID
  { label: '指导老师', value: '2001', code: 'TEACHER' }, // value 是角色ID  
  { label: '管理员', value: '3001', code: 'ADMIN' }      // value 是角色ID
])

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
    
    //调用注册接口
    const res = await userStore.register(registerForm.value)
    console.log('注册数据:', registerForm.value)
    
    ElMessage.success('注册成功')
    router.push('/login')
    
  } catch (error) {
    console.error('注册失败：', error)
    ElMessage.error('注册失败，请检查表单信息')
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
.register-container {
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

// 背景遮罩层
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.register-content {
  width: 100%;
  max-width: 480px;
  padding: 20px;
  position: relative;
  z-index: 2;
}

.register-card {
  width: 100%;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.98);
  
  :deep(.el-card__body) {
    padding: 0;
  }
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-title {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.75rem;
  font-weight: 600;
}

.register-subtitle {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
}

:deep(.el-form-item) {
  margin-bottom: 1rem;
}

:deep(.el-input__wrapper),
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.register-btn {
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

.register-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eaeaea;
}

.footer-text {
  color: #a0aec0;
  font-size: 0.9rem;
  margin-right: 8px;
}

.login-btn {
  color: #667eea;
  font-weight: 500;
  font-size: 0.95rem;
  
  &:hover {
    color: #764ba2;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .register-content {
    max-width: 380px;
    padding: 15px;
  }
  
  .register-card {
    padding: 2rem 1.5rem;
  }
  
  .register-title {
    font-size: 1.6rem;
  }
}
</style>