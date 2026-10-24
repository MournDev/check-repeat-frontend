<template>
  <div class="my-papers-center">
    <!-- 三合一：论文列表 / 查重任务 / 查重历史，菜单只露出「我的论文」一项 -->
    <el-tabs class="route-tabs" :model-value="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="论文列表" name="/student/my-papers" />
      <el-tab-pane label="查重任务" name="/student/my-papers/check-tasks" />
      <el-tab-pane label="查重历史" name="/student/my-papers/check-history" />
    </el-tabs>

    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 详情页（/check-history/:paperId）不在页签列表里，按前缀归到「查重历史」
const SUB_PATHS = ['/student/my-papers/check-tasks', '/student/my-papers/check-history']
const activeTab = computed(() =>
  SUB_PATHS.find(path => route.path.startsWith(path)) || '/student/my-papers'
)

const handleTabChange = (tab) => {
  router.push(tab.props.name)
}
</script>
