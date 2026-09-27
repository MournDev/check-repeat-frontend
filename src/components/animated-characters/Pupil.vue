<template>
  <div 
    class="pupil" 
    :style="pupilStyle"
    :data-max-distance="maxDistance"
  ></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: '12px'
  },
  maxDistance: {
    type: Number,
    default: 5
  },
  pupilColor: {
    type: String,
    default: '#2D2D2D'
  }
})

const maxDistance = computed(() => props.maxDistance)

const pupilStyle = computed(() => ({
  width: props.size,
  height: props.size,
  borderRadius: '50%',
  backgroundColor: props.pupilColor,
  willChange: 'transform'
}))
</script>

<style scoped>
.pupil {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease-out;
}
</style>
