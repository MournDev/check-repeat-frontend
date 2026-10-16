<template>
  <div class="check-config-center">
    <!-- 子导航：查重规则/比对库/学科三页合一，菜单只露出「查重配置」一项 -->
    <el-tabs :model-value="activeTab" class="mb-4" @tab-click="handleTabChange">
      <el-tab-pane label="查重规则" name="/admin/check-config/rules" />
      <el-tab-pane label="比对库管理" name="/admin/check-config/compare-lib" />
      <el-tab-pane label="学科领域" name="/admin/check-config/subjects" />
    </el-tabs>

    <!-- 子路由组件渲染 -->
    <router-view />
  </div>
</template>

<script setup>
import { ElTabs, ElTabPane } from 'element-plus'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => route.path)

const handleTabChange = (tab) => {
  router.push(tab.props.name)
}
</script>

<style lang="scss" scoped>
.check-config-center {
  min-height: 100vh;
  background: var(--apple-canvas-parchment);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

:deep(.el-tabs) {
  margin-bottom: 24px;

  .el-tabs__header {
    margin-bottom: 24px;

    .el-tabs__nav {
      border-bottom: 1px solid var(--apple-surface-chip-translucent);

      .el-tabs__item {
        font-size: 0.875rem;
        font-weight: 400;
        color: var(--apple-ink-muted-48);
        padding: 12px 16px;
        margin-right: 24px;
        transition: border-color 0.2s ease;

        &:hover {
          color: var(--apple-ink);
        }

        &.is-active {
          color: var(--apple-primary);
          font-weight: 600;

          &::after {
            background-color: var(--apple-primary);
            height: 2px;
          }
        }
      }
    }
  }
}
</style>
