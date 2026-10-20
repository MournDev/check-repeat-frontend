<template>
  <!-- 筛选工具条 -->
  <el-card class="filter-card console-card" shadow="never">
    <div class="filter-content">
      <el-input
        :model-value="keyword"
        class="filter-search"
        placeholder="搜索学生姓名 / 学号 / 专业"
        :prefix-icon="Search"
        clearable
        aria-label="搜索学生姓名、学号或专业"
        @update:model-value="$emit('update:keyword', $event)"
        @keyup.enter="$emit('update:keyword', $event)"
      />

      <el-select
        :model-value="status"
        class="filter-select"
        placeholder="论文状态"
        clearable
        aria-label="按论文状态筛选"
        @update:model-value="$emit('update:status', $event)"
      >
        <el-option label="全部状态" value="" />
        <el-option label="未提交" value="not_submitted" />
        <el-option label="已提交" value="submitted" />
        <el-option label="已分配导师" value="assigned" />
        <el-option label="审核中" value="auditing" />
        <el-option label="需修改" value="rejected" />
        <el-option label="已完成" value="completed" />
      </el-select>

      <el-select
        :model-value="college"
        class="filter-select"
        placeholder="学院"
        clearable
        aria-label="按学院筛选"
        @update:model-value="$emit('update:college', $event)"
      >
        <el-option label="全部学院" value="" />
        <el-option
          v-for="item in collegeList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>

      <el-button :icon="RefreshLeft" @click="$emit('reset')">
        重置
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { Search, RefreshLeft } from '@element-plus/icons-vue'

defineProps({
  keyword: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  college: {
    type: String,
    default: ''
  },
  collegeList: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:keyword', 'update:status', 'update:college', 'reset'])
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 14px 16px;
  }
}

.filter-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-search {
  width: 260px;
}

.filter-select {
  width: 160px;
}

@media (max-width: 768px) {
  .filter-content {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-search,
  .filter-select {
    width: 100%;
  }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.filter-card {
  margin-bottom: var(--apple-spacing-md);

  :deep(.el-card__body) {
    padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  }
}

.filter-content {
  gap: var(--apple-spacing-sm);
}

.filter-search,
.filter-select {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: var(--apple-rounded-md);
    font-size: var(--apple-fs-caption);
  }
}

@media (max-width: 768px) {
  .filter-card {
    margin-bottom: var(--apple-spacing-sm);
  }
}
</style>
