<template>
  <div class="virtual-scroll" ref="containerRef" @scroll="handleScroll">
    <div 
      class="virtual-scroll-content" 
      :style="{ height: totalHeight + 'px' }"
    >
      <div 
        v-for="item in visibleItems" 
        :key="item[itemKey]"
        class="virtual-scroll-item"
        :style="{ 
          position: 'absolute', 
          top: getTop(item) + 'px',
          width: '100%'
        }"
      >
        <slot name="item" :item="item" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  itemHeight: {
    type: Number,
    default: 50
  },
  buffer: {
    type: Number,
    default: 5
  },
  itemKey: {
    type: String,
    default: 'id'
  }
})

const containerRef = ref(null)
const containerHeight = ref(0)
const scrollTop = ref(0)

// 计算总高度
const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

// 计算可见项的索引范围
const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
  const end = Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.buffer
  )
  return { start, end }
})

// 计算可见项
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  return props.items.slice(start, end)
})

// 获取项目的顶部位置
const getTop = (item) => {
  const index = props.items.indexOf(item)
  return index * props.itemHeight
}

// 处理滚动事件
const handleScroll = () => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
}

// 监听容器大小变化
const updateContainerHeight = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
}

// 监听项目变化
watch(() => props.items.length, () => {
  // 当项目数量变化时，重新计算
  updateContainerHeight()
})

// 组件挂载后初始化
onMounted(() => {
  updateContainerHeight()
  // 监听窗口大小变化
  window.addEventListener('resize', updateContainerHeight)
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)
})
</script>

<style lang="scss" scoped>
.virtual-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
}

.virtual-scroll-content {
  position: relative;
  width: 100%;
}

.virtual-scroll-item {
  height: v-bind('itemHeight + "px"');
  box-sizing: border-box;
  padding: 12px;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
}
</style>
