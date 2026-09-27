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
  min-height: 100vh;
  background: #f5f5f7; /* Slate-50 */
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 24px;
}

.not-found-content {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 48px;
  transition: all 0.2s ease;
  max-width: 500px;
  width: 100%;

  &:hover {
    border-color: #cbd5e1;
  }

  h1 {
    font-size: 120px;
    margin: 0;
    color: #0066cc; /* Blue-500 */
    font-weight: 700;
  }
  
  h2 {
    font-size: 24px;
    margin: 16px 0;
    color: #0f172a; /* Slate-900 */
    font-weight: 600;
  }
  
  p {
    color: #64748b; /* Slate-500 */
    margin-bottom: 32px;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  .el-button {
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
    padding: 10px 24px;
    font-size: 1rem;
    
    &:hover {
      filter: brightness(0.95);
    }

    &:active {
      transform: scale(0.95);
      transition: transform 0.15s ease;
    }
  }
}
</style>