<template>
  <div class="filter-bar">
    <el-input
      :model-value="keyword"
      class="filter-search"
      placeholder="搜索学生姓名 / 学号 / 专业"
      :prefix-icon="Search"
      clearable
      aria-label="搜索学生姓名、学号或专业"
      @update:model-value="$emit('update:keyword', $event)"
      @keyup.enter="$emit('search')"
      @clear="$emit('search')"
    />

    <el-select
      :model-value="status"
      class="filter-select"
      placeholder="论文状态"
      clearable
      aria-label="按论文状态筛选"
      @update:model-value="$emit('update:status', $event)"
      @change="$emit('search')"
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
      @change="$emit('search')"
    >
      <el-option label="全部学院" value="" />
      <el-option
        v-for="item in collegeList"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>

    <div class="filter-actions">
      <el-button type="primary" :icon="Search" @click="$emit('search')">搜索</el-button>
      <el-button :icon="RefreshLeft" @click="$emit('reset')">重置</el-button>
    </div>
  </div>
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

defineEmits(['update:keyword', 'update:status', 'update:college', 'search', 'reset'])
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-3);
}

.filter-search {
  width: 260px;
}

.filter-select {
  width: 160px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  margin-left: auto;
}

.filter-search,
.filter-select {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: var(--app-radius-md);
    font-size: var(--app-fs-caption);
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-search,
  .filter-select {
    width: 100%;
  }

  .filter-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
