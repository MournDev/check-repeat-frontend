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
  background: var(--apple-canvas-parchment); /* Slate-50 */
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 24px;
}

.not-found-content {
  background: var(--apple-surface);
  border: 1px solid var(--apple-slate-border);
  border-radius: 18px;
  padding: 48px;
  transition: all 0.2s ease;
  max-width: 500px;
  width: 100%;

  &:hover {
    border-color: var(--apple-slate-border-strong);
  }

  h1 {
    font-size: 120px;
    margin: 0;
    color: var(--apple-primary); /* Blue-500 */
    font-weight: 700;
  }
  
  h2 {
    font-size: 24px;
    margin: 16px 0;
    color: var(--apple-slate-ink); /* Slate-900 */
    font-weight: 600;
  }
  
  p {
    color: var(--apple-slate-sub); /* Slate-500 */
    margin-bottom: 32px;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  .el-button {
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid var(--apple-slate-border);
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

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.not-found-container {
  padding: var(--apple-spacing-lg);
  font-family: var(--apple-font-text);
}

.not-found-content {
  padding: var(--apple-spacing-xxl);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);

  h2 {
    margin: var(--apple-spacing-md) 0;
    font-size: var(--apple-fs-lead-airy);
    font-family: var(--apple-font-display);
    color: var(--apple-ink);
  }

  p {
    margin-bottom: var(--apple-spacing-xl);
    font-size: var(--apple-fs-body-strong);
    color: var(--apple-ink-muted-48);
  }

  .el-button {
    padding: var(--apple-spacing-xs) var(--apple-spacing-lg);
    border-radius: var(--apple-rounded-sm);
    font-size: var(--apple-fs-caption);
  }
}

@media (max-width: 768px) {
  .not-found-content {
    padding: var(--apple-spacing-lg);

    h1 {
      font-size: 80px;
    }
  }
}
</style>