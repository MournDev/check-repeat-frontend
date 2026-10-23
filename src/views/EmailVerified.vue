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

<style lang="scss" scoped>
.verify-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--apple-canvas-parchment);
  font-family: var(--apple-font-text);
  padding: var(--apple-spacing-lg);
}

.loading-container,
.success-container,
.error-container {
  width: 100%;
  max-width: 500px;
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
  padding: var(--apple-spacing-xxl);
  transition: all 0.2s ease;

  :deep(.el-result) {
    .el-result__title {
      color: var(--apple-ink);
      font-family: var(--apple-font-display);
      font-weight: 600;
    }

    .el-result__subtitle {
      color: var(--apple-ink-muted-48);
      font-size: var(--apple-fs-caption);
      line-height: 1.5;
    }

    .el-result__extra {
      margin-top: var(--apple-spacing-xl);

      .el-button {
        border-radius: var(--apple-rounded-sm);
        transition: all 0.2s ease;
        border: 1px solid var(--apple-slate-border);
        padding: var(--apple-spacing-xs) var(--apple-spacing-lg);
        font-size: var(--apple-fs-caption);
        margin: 0 var(--apple-spacing-xs);

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

@media (max-width: 768px) {
  .verify-email-page {
    padding: var(--apple-spacing-md);
  }

  .loading-container,
  .success-container,
  .error-container {
    padding: var(--apple-spacing-lg);
  }
}
</style>
