<template>
  <div class="student-communication">
    <!-- 二合一：导师互动 + 文件管理，菜单只露出「交流」一项 -->
    <el-tabs class="route-tabs" :model-value="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="导师互动" name="/student/communication/interaction" />
      <el-tab-pane label="文件管理" name="/student/communication/files" />
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
