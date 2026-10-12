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
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: border-color 0.2s ease;

  &.clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--apple-surface-chip-translucent);
    }

    &:focus-visible {
      outline: 2px solid var(--apple-primary);
      outline-offset: 2px;
    }

    &:active {
      border-color: var(--apple-primary);
    }
  }

  &.active {
    border-color: var(--apple-primary);
    box-shadow: 0 0 0 1px var(--apple-primary);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;

    &.total-icon {
      background: color-mix(in srgb, var(--apple-primary) 12%, transparent);
      color: var(--apple-primary);
    }

    &.submitted-icon {
      background: color-mix(in srgb, var(--apple-info) 12%, transparent);
      color: var(--apple-info);
    }

    &.assigned-icon {
      background: color-mix(in srgb, var(--apple-warning) 14%, transparent);
      color: var(--apple-warning);
    }

    &.completed-icon {
      background: color-mix(in srgb, var(--apple-success) 12%, transparent);
      color: var(--apple-success);
    }
  }

  .stat-content {
    flex: 1;
    min-width: 0;

    .stat-value {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--apple-ink);
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--apple-ink-muted-48);
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
  }
}
</style>
