<template>
  <div class="report-center">
    <!-- 子导航：报告管理/统计报表/导师评价三页合一，菜单只露出「数据报表」一项 -->
    <el-tabs class="route-tabs" :model-value="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="报告管理" name="/admin/report-center/reports" />
      <el-tab-pane label="统计报表" name="/admin/report-center/statistics" />
      <el-tab-pane label="导师评价" name="/admin/report-center/advisor-eval" />
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
