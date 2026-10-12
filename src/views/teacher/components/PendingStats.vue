<template>
  <!-- 统计卡片（紧凑、可点击过滤） -->
  <div class="stats-grid">
    <div
      class="stat-card clickable"
      role="button"
      tabindex="0"
      aria-label="查看全部待审核论文"
      @click="$emit('filter', null)"
      @keydown.enter.prevent="$emit('filter', null)"
      @keydown.space.prevent="$emit('filter', null)"
    >
      <div class="stat-icon pending-icon">
        <el-icon><Clock /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.totalPending }}</div>
        <div class="stat-label">待审核</div>
      </div>
    </div>

    <div
      class="stat-card clickable"
      :class="{ active: activeQuickFilter === 'urgent' }"
      role="button"
      tabindex="0"
      :aria-label="activeQuickFilter === 'urgent' ? '取消仅看紧急过滤' : '仅看紧急论文'"
      @click="$emit('filter', 'urgent')"
      @keydown.enter.prevent="$emit('filter', 'urgent')"
      @keydown.space.prevent="$emit('filter', 'urgent')"
    >
      <div class="stat-icon urgent-icon">
        <el-icon><Warning /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.urgentPending }}</div>
        <div class="stat-label">紧急</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon time-icon">
        <el-icon><Timer /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.avgWaitingTime }}天</div>
        <div class="stat-label">平均等待</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon reviewed-icon">
        <el-icon><Check /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.todayReviewed }}</div>
        <div class="stat-label">今日已审</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Clock, Warning, Timer, Check } from '@element-plus/icons-vue'

defineProps({
  stats: {
    type: Object,
    required: true
  },
  activeQuickFilter: {
    type: String,
    default: null
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

    &.pending-icon {
      background: color-mix(in srgb, var(--apple-warning) 14%, transparent);
      color: var(--apple-warning);
    }

    &.urgent-icon {
      background: color-mix(in srgb, var(--apple-danger) 12%, transparent);
      color: var(--apple-danger);
    }

    &.time-icon {
      background: color-mix(in srgb, var(--apple-primary) 12%, transparent);
      color: var(--apple-primary);
    }

    &.reviewed-icon {
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
