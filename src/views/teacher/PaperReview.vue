<template>
  <div class="paper-review">
    <!-- 子导航 -->
    <el-tabs v-model="activeTab" class="mb-4">
      <el-tab-pane label="待审核论文" name="/teacher/paper-review/pending" />
      <el-tab-pane label="审核记录" name="/teacher/paper-review/audit-records" />
    </el-tabs>

    <!-- 子路由组件渲染 -->
    <router-view />
  </div>
</template>

<script setup>
import { ElTabs, ElTabPane } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 绑定当前路由路径作为标签页激活状态
const activeTab = route.path

// 监听标签页切换
const handleTabChange = (tab) => {
  router.push(tab)
}
</script>

<style scoped>
.paper-review {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>