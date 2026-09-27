<template>
  <div class="form-validator">
    <!-- 表单验证组件 -->
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 表单验证规则
const validateRules = {
  required: (value, message = '此项为必填项') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return message
    }
    return true
  },
  email: (value, message = '请输入有效的邮箱地址') => {
    if (!value) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return message
    }
    return true
  },
  minLength: (value, min, message = `最少需要${min}个字符`) => {
    if (!value) return true
    if (value.length < min) {
      return message
    }
    return true
  },
  maxLength: (value, max, message = `最多允许${max}个字符`) => {
    if (!value) return true
    if (value.length > max) {
      return message
    }
    return true
  },
  number: (value, message = '请输入数字') => {
    if (!value) return true
    if (isNaN(Number(value))) {
      return message
    }
    return true
  },
  positive: (value, message = '请输入正数') => {
    if (!value) return true
    if (Number(value) <= 0) {
      return message
    }
    return true
  }
}

// 验证表单
const validateForm = (formData, rules) => {
  const errors = {}
  let isValid = true

  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      if (typeof rule === 'function') {
        const error = rule(formData[field])
        if (error !== true) {
          errors[field] = error
          isValid = false
          break
        }
      } else if (typeof rule === 'object') {
        const { validator, message, ...params } = rule
        const error = validateRules[validator](formData[field], ...Object.values(params), message)
        if (error !== true) {
          errors[field] = error
          isValid = false
          break
        }
      }
    }
  }

  return { isValid, errors }
}

// 导出验证规则和方法
defineExpose({
  validateRules,
  validateForm
})
</script>

<style lang="scss" scoped>
.form-validator {
  /* 表单验证组件样式 */
}
</style>
