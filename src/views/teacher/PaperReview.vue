<template>
  <div class="paper-review">
    <!-- 子导航 -->
    <el-tabs :model-value="activeTab" class="mb-4" @tab-click="handleTabChange">
      <el-tab-pane label="待审核论文" name="/teacher/paper-review/pending" />
      <el-tab-pane label="审核记录" name="/teacher/paper-review/audit-records" />
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

// 监听标签页切换
const handleTabChange = (tab) => {
  // tab参数是一个对象，包含tab实例，需要获取其paneName属性
  const tabName = tab.props.name
  router.push(tabName)
}
</script>

<style scoped>
.paper-review {
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