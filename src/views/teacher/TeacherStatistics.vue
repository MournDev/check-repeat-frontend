<template>
  <div class="teacher-statistics">
    <!-- 三合一：审核统计 / 指导进度 / 学生评价，菜单只露出「数据统计」一项 -->
    <el-tabs class="route-tabs" :model-value="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="审核统计" name="/teacher/data-statistics" />
      <el-tab-pane label="指导进度" name="/teacher/data-statistics/guidance" />
      <el-tab-pane label="学生评价" name="/teacher/data-statistics/evaluation" />
    </el-tabs>

    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => route.path)

const handleTabChange = (tab) => {
  router.push(tab.props.name)
}
</script>
