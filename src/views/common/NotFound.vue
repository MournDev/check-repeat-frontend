<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>页面不存在</h2>
      <p>抱歉，您访问的页面不存在。</p>
      <el-button type="primary" @click="$router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
// 可以添加一些逻辑
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

.not-found-content h1 {
  font-size: 120px;
  margin: 0;
  color: #409EFF;
}

.not-found-content h2 {
  font-size: 24px;
  margin: 10px 0;
}

.not-found-content p {
  color: #666;
  margin-bottom: 20px;
}
</style>