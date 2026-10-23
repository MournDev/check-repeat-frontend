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

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
:deep(.el-tabs) {
  margin-bottom: var(--apple-spacing-lg);

  .el-tabs__header {
    margin-bottom: var(--apple-spacing-lg);

    .el-tabs__nav {
      border-bottom-color: var(--apple-hairline);

      .el-tabs__item {
        padding: var(--apple-spacing-sm) var(--apple-spacing-md);
        margin-right: var(--apple-spacing-lg);
        font-size: var(--apple-fs-caption);
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
