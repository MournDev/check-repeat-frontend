<template>
  <div class="check-config-center">
    <!-- 子导航：查重规则/比对库/学科三页合一，菜单只露出「查重配置」一项 -->
    <el-tabs class="route-tabs" :model-value="activeTab" @tab-click="handleTabChange">
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
