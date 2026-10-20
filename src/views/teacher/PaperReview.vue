<template>
  <div class="paper-review">
    <!-- 待审核论文已迁移到审核工作台，这里仅承载审核记录子页 -->
    <router-view />
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.paper-review {
  min-height: 100vh;
  background: var(--apple-canvas-parchment);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}
</style>