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
    console.log('开始验证，token:', token);
    
    const response = await verifyEmailAPI(token);
    console.log('验证响应:', response);
    
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
  console.log('路由参数:', route.query);
  
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
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loading-container,
.success-container,
.error-container {
  width: 100%;
  max-width: 500px;
}
</style>