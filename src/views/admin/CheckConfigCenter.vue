<template>
  <div class="check-config-center">
    <!-- 查重与流程配置：规则/比对库/学科 + 超管专属的阈值/策略/工作流，六页合一 -->
    <el-tabs class="route-tabs" :model-value="activeTab" @tab-click="handleTabChange">
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.path"
        :label="tab.label"
        :name="tab.path"
      />
    </el-tabs>

    <!-- 子路由组件渲染 -->
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 后三个 Tab 是超管专属（路由 meta.roles 同样限制），ADMIN 不渲染，
// 否则点了会被守卫弹回落地页
const tabs = computed(() => {
  const base = [
    { label: '查重规则', path: '/admin/check-config/rules' },
    { label: '比对库管理', path: '/admin/check-config/compare-lib' },
    { label: '学科领域', path: '/admin/check-config/subjects' },
  ]
  if (!userStore.isSuperAdmin) return base
  return base.concat([
    { label: '相似度阈值', path: '/admin/check-config/threshold' },
    { label: '检测策略', path: '/admin/check-config/policy' },
    { label: '审核工作流', path: '/admin/check-config/workflow' },
  ])
})

const activeTab = computed(() => route.path)

const handleTabChange = (tab) => {
  router.push(tab.props.name)
}
</script>
