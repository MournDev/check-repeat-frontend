<template>
  <div :class="['user-settings', 'role-' + role.toLowerCase()]">
    <!-- 页头与表单放进同一个限宽容器，宽屏下保存按钮与卡片右边缘对齐 -->
    <div class="settings-shell">
      <PageHeader :description="pageSubtitle">
        <template #actions>
          <el-tag v-if="isDirty" size="small" type="warning" effect="light" class="dirty-tag">未保存</el-tag>
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
const isDirty = computed(() => Boolean(panelRef.value?.isDirty))

const panelRef = ref()
function saveSettings() { panelRef.value?.save() }
</script>

<style lang="scss" scoped>
.settings-shell { width: 100%; }

// 教职工设置页内容限宽 1200 并居中，页头随卡片一起对齐
.role-admin .settings-shell,
.role-teacher .settings-shell {
  max-width: 1200px;
  margin: 0 auto;
}

.dirty-tag { margin-right: var(--app-space-2); }

// 学生版页面无整体卡片，去掉外层留白
.role-student { padding: 0; }

@media (max-width: 768px) {
  .user-settings:not(.role-student) {
    padding: var(--app-space-3);
  }
}
</style>
