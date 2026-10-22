<template>
  <div class="list-page">
    <el-card v-if="$slots.filters" class="list-page__filters console-card" shadow="never">
      <slot name="filters" />
    </el-card>

    <el-card class="list-page__body console-card" shadow="never">
      <template v-if="title || $slots['header-extra']" #header>
        <div class="list-page__header">
          <span v-if="title" class="list-page__title">
            <el-icon v-if="icon"><component :is="icon" /></el-icon>
            {{ title }}
          </span>
          <div class="list-page__extra">
            <span v-if="showTotal" class="list-page__total">共 {{ total }} {{ totalSuffix }}</span>
            <slot name="header-extra" />
          </div>
        </div>
      </template>

      <slot />

      <div v-if="showPagination && total > 0" class="list-page__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="pageSizes"
          :total="total"
          :layout="paginationLayout"
          @current-change="$emit('page-change', $event)"
          @size-change="$emit('size-change', $event)"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 列表页骨架：筛选卡 → 数据卡（标题栏/表格插槽/分页）统一结构。
// 只收敛布局与分页，不接管各页的查询参数与接口调用，迁移时页面逻辑不变。
defineProps({
  title: { type: String, default: '' },
  icon: { type: [String, Object, Function], default: null },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  paginationLayout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
  showPagination: { type: Boolean, default: true },
  showTotal: { type: Boolean, default: false },
  totalSuffix: { type: String, default: '条' },
})

const page = defineModel('page', { type: Number, default: 1 })
const pageSize = defineModel('pageSize', { type: Number, default: 10 })

defineEmits(['page-change', 'size-change'])
</script>

<style scoped>
.list-page {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);
}

.list-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
}

.list-page__title {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-fs-heading);
  font-weight: 600;
  color: var(--apple-ink);
}

.list-page__extra {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  margin-left: auto;
}

.list-page__total {
  font-size: var(--app-fs-caption);
  color: var(--apple-ink-muted-48);
}

.list-page__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--app-space-4);
}
</style>
