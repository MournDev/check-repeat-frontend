<template>
  <div :class="['user-settings', 'role-' + role.toLowerCase()]">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <p class="page-subtitle">{{ pageSubtitle }}</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Check" @click="saveSettings" size="large">
            保存设置
          </el-button>
        </div>
      </div>
    </div>

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

const userStore = useUserStore()

const role = computed(() => userStore.role || 'STUDENT')
const pageTitle = computed(() => ({ ADMIN: '管理员设置', TEACHER: '个人设置', STUDENT: '个人中心' }[role.value] || '个人设置'))
const pageSubtitle = computed(() => ({ ADMIN: '管理您的个人资料和系统偏好设置', TEACHER: '管理您的个人资料和系统偏好设置', STUDENT: '管理您的个人信息和账户设置' }[role.value] || ''))

const panelRef = ref()
function saveSettings() { panelRef.value?.save() }
</script>

<style lang="scss" scoped>
.user-settings { padding: 20px; min-height: 100vh; background: var(--apple-canvas-parchment); }

// Page header
.page-header {
  margin-bottom: 24px; border-radius: 18px; padding: 24px; border: 1px solid var(--apple-surface-chip-translucent);
  .header-content { display: flex; justify-content: space-between; align-items: center; }
  .header-left {
    .page-title { margin: 0 0 8px; font-size: 1.75rem; font-weight: 700; color: var(--apple-ink); }
    .page-subtitle { margin: 0; color: var(--apple-ink-secondary); font-size: 0.875rem; }
  }
}
.role-admin .page-header { background: var(--apple-canvas-parchment); }
.role-teacher .page-header { background: var(--apple-surface); }
.role-student .page-header { background: none; border: none; padding: 0 0 16px; margin-bottom: 0; }

// 学生版页面无整体卡片，去掉外层留白
.role-student { padding: 0; }

@media (max-width: 768px) {
  .page-header { padding: 16px;
    .header-content { flex-direction: column; align-items: flex-start; gap: 16px; .header-right { width: 100%; justify-content: flex-start; } }
  }
}
</style>
