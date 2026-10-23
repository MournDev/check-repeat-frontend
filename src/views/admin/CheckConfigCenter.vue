<template>
  <div class="check-config-center">
    <!-- 子导航：查重规则/比对库/学科三页合一，菜单只露出「查重配置」一项 -->
    <el-tabs :model-value="activeTab" @tab-click="handleTabChange">
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

:deep(.el-tabs) {
  margin-bottom: var(--app-space-6);

  .el-tabs__header {
    margin-bottom: var(--app-space-6);

    .el-tabs__nav {
      border-bottom: 1px solid var(--app-color-border);

      .el-tabs__item {
        font-size: var(--app-fs-caption);
        font-weight: 400;
        color: var(--app-color-text-muted);
        padding: var(--app-space-3) var(--app-space-4);
        margin-right: var(--app-space-6);
        transition: border-color var(--app-transition-normal);

        &:hover {
          color: var(--app-color-ink);
        }

        &.is-active {
          color: var(--app-color-primary);
          font-weight: 600;

          &::after {
            background-color: var(--app-color-primary);
            height: 2px;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  :deep(.el-tabs) {
    .el-tabs__header {
      margin-bottom: var(--app-space-4);

      .el-tabs__nav .el-tabs__item {
        margin-right: var(--app-space-4);
        padding: var(--app-space-3) var(--app-space-2);
      }
    }
  }
}
</style>
