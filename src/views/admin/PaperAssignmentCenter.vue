<template>
  <div class="assignment-center">
    <!-- 子导航：论文分配四页合一，菜单只露出「论文分配」一项 -->
    <el-tabs class="route-tabs" :model-value="activeTab" @tab-click="handleTabChange">
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
