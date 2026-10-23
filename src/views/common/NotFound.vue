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

<style lang="scss" scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--app-color-fill);
  text-align: center;
  font-family: var(--app-font-family);
  padding: var(--app-space-6);
}

.not-found-content {
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-12);
  transition: border-color var(--app-transition-normal), background-color var(--app-transition-normal);
  max-width: 500px;
  width: 100%;

  &:hover {
    border-color: var(--app-color-border-strong);
  }

  h1 {
    font-size: 120px;
    margin: 0;
    color: var(--app-color-primary);
    font-weight: 700;
  }

  h2 {
    margin: var(--app-space-4) 0;
    font-size: var(--app-fs-display);
    font-family: var(--app-font-family);
    color: var(--app-color-ink);
    font-weight: 600;
  }

  p {
    color: var(--app-color-text-muted);
    margin-bottom: var(--app-space-8);
    font-size: var(--app-fs-body);
    line-height: 1.5;
  }

  .el-button {
    border-radius: var(--app-radius-sm);
    transition: background-color var(--app-transition-normal), border-color var(--app-transition-normal), color var(--app-transition-normal);
    border: 1px solid var(--app-color-border-soft);
    padding: var(--app-space-2) var(--app-space-6);
    font-size: var(--app-fs-caption);

    &:hover {
      filter: brightness(0.95);
    }

    &:active {
      transform: scale(0.95);
      transition: transform var(--app-transition-fast);
    }
  }
}

@media (max-width: 768px) {
  .not-found-content {
    padding: var(--app-space-6);

    h1 {
      font-size: 80px;
    }
  }
}
</style>
