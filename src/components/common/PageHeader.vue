<template>
  <div class="page-header console-page-head-card">
    <div class="page-header-left">
      <h1 class="page-header-title">{{ title }}</h1>
      <p v-if="description" class="page-header-desc">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
// 全站统一页头：白卡形态（复用 global-styles.scss 的 console-page-head-card 公共类）
// 33 个页面此前各自 scoped 重复定义 .page-header/.page-title/.page-desc，由本组件收敛
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 16px;
}

.page-header-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--apple-ink);
  line-height: 1.2;
}

.page-header-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
