<template>
  <div class="list-page">
    <el-card class="list-page__card console-card" shadow="never">
      <template v-if="title || showTotal || $slots.toolbar || $slots['header-extra']" #header>
        <div class="list-page__header">
          <div class="list-page__heading">
            <span v-if="title" class="list-page__title">
              <el-icon v-if="icon"><component :is="icon" /></el-icon>
              {{ title }}
            </span>
            <span v-if="showTotal" class="list-page__total">共 {{ total }} {{ totalSuffix }}</span>
          </div>
          <div class="list-page__extra">
            <slot name="toolbar" />
            <slot name="header-extra" />
          </div>
        </div>
      </template>

      <!-- 筛选区：与数据同卡、无独立白底，单行高度固定 44px -->
      <div v-if="$slots.filters" class="list-page__filters">
        <slot name="filters" />
      </div>
      <el-divider v-if="$slots.filters" class="list-page__divider" />

      <div class="list-page__body">
        <slot />
      </div>

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
// 列表页骨架：页头工具栏 → 紧凑筛选行 → 分割线 → 数据 → 分页，全部在同一张卡内。
// 只收敛布局与分页，不接管各页的查询参数与接口调用，迁移时页面逻辑不变。
// toolbar：主操作（新增/刷新等）；header-extra：批量/导出等上下文操作（兼容旧用法）。
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
  display: block;
}

/* 卡头统一 48px：标题/总数在左，toolbar + header-extra 在右 */
.list-page__card :deep(.el-card__header) {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 var(--app-card-padding);
}

.list-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  width: 100%;
  min-height: 48px;
}

.list-page__heading {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  min-width: 0;
}

.list-page__title {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-fs-heading);
  font-weight: 600;
  color: var(--app-color-ink);
}

.list-page__total {
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.list-page__extra {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  margin-left: auto;
}

/* flex 间距统一由 gap 控制，避免 Element 的按钮左外边距叠加 */
.list-page__extra :deep(.el-button + .el-button) {
  margin-left: 0;
}

/* 筛选区：无背景/边框，单行约 40px；用块级流保证任意插槽内容都能占满整行 */
.list-page__filters {
  min-height: 40px;
  padding: var(--app-space-1) 0;
  box-sizing: border-box;
}

/* inline 表单：行内排布，用 gap 代替 Element 默认的 32/18px 外边距 */
.list-page__filters :deep(.el-form--inline) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2) var(--app-space-4);
}

.list-page__filters :deep(.el-form--inline .el-form-item) {
  margin: 0;
}

/* 最后一个表单项视为筛选操作区（搜索/重置），始终贴右 */
.list-page__filters :deep(.el-form--inline .el-form-item:last-child) {
  margin-left: auto;
}

.list-page__divider {
  --el-border-color: var(--app-color-divider);
  margin: var(--app-space-3) 0 var(--app-space-4);
}

.list-page__body {
  min-width: 0;
}

.list-page__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--app-space-4);
}

@media (max-width: 640px) {
  .list-page__header {
    align-items: flex-start;
  }

  .list-page__extra {
    width: 100%;
    margin-left: 0;
    flex-wrap: wrap;
  }

  .list-page__pagination {
    justify-content: center;
  }

  /* Element 分页器默认 display:flex + white-space:nowrap，手机上会撑破卡片；
     允许换行，并隐藏可选的每页条数/跳页，只保留总数与翻页 */
  .list-page__pagination :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
    row-gap: var(--app-space-2);
    white-space: normal;
  }

  .list-page__pagination :deep(.el-pagination__sizes),
  .list-page__pagination :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
