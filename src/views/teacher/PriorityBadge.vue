<!-- src/views/teacher/components/PriorityBadge.vue -->
<template>
  <el-tag :type="getTagType" size="small">
    {{ getPriorityText }}
  </el-tag>
</template>

<script setup>
import { defineProps, computed } from 'vue'

// 接收父组件传递的优先级值（如 high/mid/low）
const props = defineProps({
  priority: {
    type: String,
    default: 'mid',
    validator: (val) => ['high', 'mid', 'low'].includes(val)
  }
})

// 根据优先级计算标签类型
const getTagType = computed(() => {
  switch (props.priority) {
    case 'high':
      return 'danger'
    case 'mid':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'info'
  }
})

// 根据优先级计算显示文本
const getPriorityText = computed(() => {
  switch (props.priority) {
    case 'high':
      return '高优先级'
    case 'mid':
      return '中优先级'
    case 'low':
      return '低优先级'
    default:
      return '普通'
  }
})
</script>