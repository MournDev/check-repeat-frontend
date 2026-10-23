<template>
  <div :class="['user-settings', 'role-' + role.toLowerCase()]">
    <!-- 页面头部 -->
    <PageHeader :description="pageSubtitle">
      <template #actions>
        <el-button type="primary" :icon="Check" @click="saveSettings" size="large">
          保存设置
        </el-button>
      </template>
    </PageHeader>

    <!-- 角色面板：学生与教职工是两套完全不同的布局，各自自洽；
         页头「保存设置」转发到当前面板的 save() -->
    <StudentPanel v-if="role === 'STUDENT'" ref="panelRef" />
    <StaffPanel v-else :role="role" ref="panelRef" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import StudentPanel from './settings/StudentPanel.vue'
import StaffPanel from './settings/StaffPanel.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const userStore = useUserStore()

const role = computed(() => userStore.role || 'STUDENT')
const pageSubtitle = computed(() => ({ ADMIN: '管理您的个人资料和系统偏好设置', TEACHER: '管理您的个人资料和系统偏好设置', STUDENT: '管理您的个人信息和账户设置' }[role.value] || ''))

const panelRef = ref()
function saveSettings() { panelRef.value?.save() }
</script>

<style lang="scss" scoped>

// 学生版页面无整体卡片，去掉外层留白
.role-student { padding: 0; }

@media (max-width: 768px) {
  .user-settings:not(.role-student) {
    padding: var(--app-space-3);
  }
}
</style>
