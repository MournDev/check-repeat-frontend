<!-- src/views/VerifyEmail.vue -->
<template>
  <div class="verify-email-page">
    <div v-if="loading" class="loading-container">
      <el-result icon="info" title="验证中..." sub-title="请稍候，正在验证您的邮箱" />
    </div>
    
    <div v-else-if="success" class="success-container">
      <el-result
        icon="success"
        title="验证成功"
        :sub-title="`邮箱 ${email} 验证成功`"
      >
        <template #extra>
          <el-button type="primary" @click="goToProfile">返回个人中心</el-button>
          <el-button @click="goToHome">返回首页</el-button>
        </template>
      </el-result>
    </div>
    
    <div v-else class="error-container">
      <el-result
        icon="error"
        title="验证失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="retryVerify">重新验证</el-button>
          <el-button @click="goToProfile">返回个人中心</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { verifyEmail as verifyEmailAPI } from '@/api/user';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const success = ref(false);
const errorMessage = ref('');
const email = ref('');

const verifyEmail = async (token) => {
  try {
    loading.value = true;
    
    const response = await verifyEmailAPI(token);
    
    if (response.success || response.code === 200) {
      success.value = true;
      email.value = response.data?.email || '您的';
      ElMessage.success('邮箱验证成功！');
    } else {
      throw new Error(response.message || '验证失败');
    }
  } catch (error) {
    console.error('邮箱验证错误:', error);
    errorMessage.value = error.response?.data?.message || error.message || '验证失败，请重试';
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

const retryVerify = () => {
  const token = route.query.token || route.query.verify_token;
  if (token) {
    verifyEmail(token);
  } else {
    errorMessage.value = '验证链接无效';
  }
};

const goToProfile = () => {
  router.push('/student/settings');
};

const goToHome = () => {
  router.push('/');
};

onMounted(() => {
  
  const token = route.query.token || route.query.verify_token;
  
  if (!token) {
    loading.value = false;
    errorMessage.value = '验证链接无效，缺少验证令牌';
    ElMessage.error('验证链接无效');
    return;
  }
  
  verifyEmail(token);
});
</script>

<style scoped>
.verify-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f7; /* Slate-50 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 24px;
}

.loading-container,
.success-container,
.error-container {
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 48px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
  }
  
  :deep(.el-result) {
    .el-result__title {
      color: #0f172a; /* Slate-900 */
      font-weight: 600;
    }
    
    .el-result__subtitle {
      color: #64748b; /* Slate-500 */
      font-size: 1rem;
      line-height: 1.5;
    }
    
    .el-result__extra {
      margin-top: 32px;
      
      .el-button {
        border-radius: 8px;
        transition: all 0.2s ease;
        border: 1px solid #e2e8f0;
        padding: 10px 24px;
        font-size: 1rem;
        margin: 0 8px;
        
        &:hover {
          filter: brightness(0.95);
        }

        &:active {
          transform: scale(0.95);
          transition: transform 0.15s ease;
        }
      }
    }
  }
}
</style>