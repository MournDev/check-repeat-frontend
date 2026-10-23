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
  margin-bottom: var(--apple-spacing-lg);

  .el-tabs__header {
    margin-bottom: var(--apple-spacing-lg);

    .el-tabs__nav {
      border-bottom: 1px solid var(--apple-hairline);

      .el-tabs__item {
        font-size: var(--apple-fs-caption);
        font-weight: 400;
        color: var(--apple-ink-muted-48);
        padding: var(--apple-spacing-sm) var(--apple-spacing-md);
        margin-right: var(--apple-spacing-lg);
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

@media (max-width: 768px) {
  :deep(.el-tabs) {
    .el-tabs__header {
      margin-bottom: var(--apple-spacing-md);

      .el-tabs__nav .el-tabs__item {
        margin-right: var(--apple-spacing-md);
        padding: var(--apple-spacing-sm) var(--apple-spacing-xs);
      }
    }
  }
}
</style>
