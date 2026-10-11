<template>
  <!-- 筛选工具条 -->
  <el-card class="filter-card console-card" shadow="never">
    <div class="filter-content">
      <el-input
        :model-value="keyword"
        class="filter-search"
        placeholder="搜索学生姓名 / 学号 / 论文标题"
        :prefix-icon="Search"
        clearable
        aria-label="搜索学生姓名、学号或论文标题"
        @update:model-value="$emit('update:keyword', $event)"
      />

      <el-select
        :model-value="priority"
        class="filter-select"
        placeholder="优先级"
        clearable
        aria-label="按优先级筛选"
        @update:model-value="$emit('update:priority', $event)"
      >
        <el-option label="全部" value="" />
        <el-option label="紧急" value="urgent" />
        <el-option label="高" value="high" />
        <el-option label="普通" value="normal" />
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
        <el-option v-for="item in collegeList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <el-select
        :model-value="similarity"
        class="filter-select"
        placeholder="相似度"
        clearable
        aria-label="按相似度筛选"
        @update:model-value="$emit('update:similarity', $event)"
      >
        <el-option label="全部" value="" />
        <el-option label="低相似度 (0-15%)" value="low" />
        <el-option label="中相似度 (15-30%)" value="medium" />
        <el-option label="高相似度 (30%以上)" value="high" />
      </el-select>

      <el-tag
        v-if="activeQuickFilter"
        closable
        :type="activeQuickFilter === 'overdue' ? 'danger' : 'warning'"
        effect="plain"
        size="small"
        @close="$emit('clear-quick-filter')"
      >
        {{ activeQuickFilter === 'overdue' ? '仅看超时' : '仅看紧急' }}
      </el-tag>

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
  priority: {
    type: String,
    default: ''
  },
  college: {
    type: String,
    default: ''
  },
  similarity: {
    type: String,
    default: ''
  },
  collegeList: {
    type: Array,
    default: () => []
  },
  activeQuickFilter: {
    type: String,
    default: null
  }
})

defineEmits(['update:keyword', 'update:priority', 'update:college', 'update:similarity', 'clear-quick-filter', 'reset'])
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
</style>
