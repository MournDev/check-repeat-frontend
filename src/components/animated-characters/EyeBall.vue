<template>
  <div class="eyeball" :style="eyeballStyle">
    <div 
      class="eyeball-pupil" 
      :style="pupilStyle"
      :data-max-distance="maxDistance"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: '48px'
  },
  pupilSize: {
    type: String,
    default: '16px'
  },
  maxDistance: {
    type: Number,
    default: 10
  },
  eyeColor: {
    type: String,
    default: 'white'
  },
  pupilColor: {
    type: String,
    default: '#2D2D2D'
  }
})

const maxDistance = computed(() => props.maxDistance)

const eyeballStyle = computed(() => ({
  width: props.size,
  height: props.size,
  borderRadius: '50%',
  backgroundColor: props.eyeColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  willChange: 'height'
}))

const pupilStyle = computed(() => ({
  width: props.pupilSize,
  height: props.pupilSize,
  borderRadius: '50%',
  backgroundColor: props.pupilColor,
  willChange: 'transform'
}))
</script>

<style scoped>
.eyeball {
  position: relative;
}

.eyeball-pupil {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease-out;
}
</style>
