<template>
  <div v-if="description || $slots.actions" class="page-header console-page-head-card">
    <p v-if="description" class="page-header-desc">{{ description }}</p>
    <div v-if="$slots.actions" class="page-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
// 页面标题由 MainLayout 子导航统一承载（route.meta.title，唯一出处），
// 页头只保留说明与操作区，避免同一标题在子导航和内容区重复出现。
defineProps({
  description: { type: String, default: '' }
})
</script>

<style scoped>
.page-header {
  margin-bottom: var(--app-section-gap);
}

.page-header-desc {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--app-fs-caption);
  color: var(--apple-ink-muted-48);
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  margin-left: auto;
}
</style>
