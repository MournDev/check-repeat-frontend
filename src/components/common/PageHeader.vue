<template>
  <div v-if="title || description || $slots.actions" class="page-header">
    <div class="page-header-main">
      <h2 v-if="title" class="page-header-title">{{ title }}</h2>
      <p v-if="description" class="page-header-desc">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
// 页面标题默认由 MainLayout 子导航承载（route.meta.title，唯一出处），
// 这里只渲染可选的补充标题、说明与右侧操作，不再生成白色卡片。
// title 仅用于脱离子导航的独立页面，避免同一标题在子导航与内容区重复出现。
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' }
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  min-height: 32px;
  margin-bottom: var(--app-section-gap);
  padding: 0;
  background: none;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.page-header-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.page-header-title {
  margin: 0;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-heading);
  font-weight: 600;
  line-height: var(--app-lh-heading);
  color: var(--app-color-ink);
}

.page-header-desc {
  margin: 0;
  font-size: var(--app-fs-caption);
  line-height: var(--app-lh-body);
  color: var(--app-color-text-muted);
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  margin-left: auto;
}

@media (max-width: 640px) {
  .page-header {
    align-items: flex-start;
  }

  .page-header-actions {
    width: 100%;
    margin-left: 0;
    flex-wrap: wrap;
  }
}
</style>
