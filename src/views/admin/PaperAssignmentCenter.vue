<template>
  <div class="assignment-center">
    <!-- 子导航：论文分配四页合一，菜单只露出「论文分配」一项 -->
    <el-tabs :model-value="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="分配总览" name="/admin/paper-assignment" />
      <el-tab-pane label="手动分配" name="/admin/paper-assignment/manual" />
      <el-tab-pane label="自动分配" name="/admin/paper-assignment/auto" />
      <el-tab-pane label="分配记录" name="/admin/paper-assignment/history" />
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

// 绑定当前路由路径作为标签页激活状态
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
      border-bottom: 1px solid var(--app-color-border-strong);

      .el-tabs__item {
        font-size: var(--app-fs-caption);
        font-weight: 400;
        color: var(--app-color-text-muted);
        padding: var(--app-space-3) var(--app-space-4);
        margin-right: var(--app-space-6);
        transition: border-color 0.2s ease;

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

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
:deep(.el-tabs) {
  margin-bottom: var(--app-space-6);

  .el-tabs__header {
    margin-bottom: var(--app-space-6);

    .el-tabs__nav {
      border-bottom-color: var(--app-color-border);

      .el-tabs__item {
        padding: var(--app-space-3) var(--app-space-4);
        margin-right: var(--app-space-6);
        font-size: var(--app-fs-caption);
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
