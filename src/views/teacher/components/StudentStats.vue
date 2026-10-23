<template>
  <!-- 统计卡片（可点击过滤） -->
  <div class="stats-grid">
    <div
      class="stat-card clickable"
      :class="{ active: activeFilter === '' }"
      role="button"
      tabindex="0"
      aria-label="查看全部学生"
      @click="$emit('filter', '')"
      @keydown.enter.prevent="$emit('filter', '')"
      @keydown.space.prevent="$emit('filter', '')"
    >
      <div class="stat-icon total-icon">
        <el-icon><User /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.totalStudents || 0 }}</div>
        <div class="stat-label">总学生数</div>
      </div>
    </div>

    <div
      class="stat-card clickable"
      :class="{ active: activeFilter === 'submitted' }"
      role="button"
      tabindex="0"
      :aria-label="activeFilter === 'submitted' ? '取消仅看已提交过滤' : '仅看已提交论文学生'"
      @click="$emit('filter', 'submitted')"
      @keydown.enter.prevent="$emit('filter', 'submitted')"
      @keydown.space.prevent="$emit('filter', 'submitted')"
    >
      <div class="stat-icon submitted-icon">
        <el-icon><Document /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.submittedStudents || 0 }}</div>
        <div class="stat-label">已提交论文</div>
      </div>
    </div>

    <div
      class="stat-card clickable"
      :class="{ active: activeFilter === 'assigned' }"
      role="button"
      tabindex="0"
      :aria-label="activeFilter === 'assigned' ? '取消仅看已分配导师过滤' : '仅看已分配导师学生'"
      @click="$emit('filter', 'assigned')"
      @keydown.enter.prevent="$emit('filter', 'assigned')"
      @keydown.space.prevent="$emit('filter', 'assigned')"
    >
      <div class="stat-icon assigned-icon">
        <el-icon><UserFilled /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.assignedStudents || 0 }}</div>
        <div class="stat-label">已分配导师</div>
      </div>
    </div>

    <div
      class="stat-card clickable"
      :class="{ active: activeFilter === 'completed' }"
      role="button"
      tabindex="0"
      :aria-label="activeFilter === 'completed' ? '取消仅看已完成审核过滤' : '仅看已完成审核学生'"
      @click="$emit('filter', 'completed')"
      @keydown.enter.prevent="$emit('filter', 'completed')"
      @keydown.space.prevent="$emit('filter', 'completed')"
    >
      <div class="stat-icon completed-icon">
        <el-icon><Check /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.completedStudents || 0 }}</div>
        <div class="stat-label">已完成审核</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { User, Document, UserFilled, Check } from '@element-plus/icons-vue'

defineProps({
  stats: {
    type: Object,
    required: true
  },
  activeFilter: {
    type: String,
    default: ''
  }
})

defineEmits(['filter'])
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-4);
}

.stat-card {
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-3) var(--app-space-4);
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  transition: border-color var(--app-transition-normal);

  &.clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--app-color-border-strong);
    }

    &:focus-visible {
      outline: 2px solid var(--app-color-primary);
      outline-offset: 2px;
    }

    &:active {
      border-color: var(--app-color-primary);
    }
  }

  &.active {
    border-color: var(--app-color-primary);
    box-shadow: 0 0 0 1px var(--app-color-primary);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--app-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--app-fs-body);
    flex-shrink: 0;

    &.total-icon {
      background: color-mix(in srgb, var(--app-color-primary) 12%, transparent);
      color: var(--app-color-primary);
    }

    &.submitted-icon {
      background: color-mix(in srgb, var(--app-color-info) 12%, transparent);
      color: var(--app-color-info);
    }

    &.assigned-icon {
      background: color-mix(in srgb, var(--app-color-warning) 14%, transparent);
      color: var(--app-color-warning);
    }

    &.completed-icon {
      background: color-mix(in srgb, var(--app-color-success) 12%, transparent);
      color: var(--app-color-success);
    }
  }

  .stat-content {
    flex: 1;
    min-width: 0;

    .stat-value {
      font-family: var(--app-font-family);
      font-size: var(--app-fs-title);
      font-weight: 600;
      color: var(--app-color-ink);
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: var(--app-fs-meta);
      color: var(--app-color-text-muted);
    }
  }
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--app-space-3);
    margin-bottom: var(--app-space-3);
  }
}
</style>
