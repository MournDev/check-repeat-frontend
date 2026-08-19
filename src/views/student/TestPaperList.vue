<template>
  <div class="test-paper-list">
    <h2>论文列表接口测试</h2>
    
    <el-button @click="testApi" :loading="loading">测试接口调用</el-button>
    
    <div v-if="result" class="result">
      <h3>接口返回结果:</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
    
    <div v-if="error" class="error">
      <h3>错误信息:</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getStudentPaperPage } from '@/api/student'

const loading = ref(false)
const result = ref(null)
const error = ref(null)

const testApi = async () => {
  loading.value = true
  result.value = null
  error.value = null
  
  try {
    const params = {
      pageNum: 1,
      pageSize: 10
    }
    
    console.log('发送请求参数:', params)
    const res = await getStudentPaperPage(params)
    console.log('接口响应:', res)
    
    result.value = res
  } catch (err) {
    console.error('接口调用失败:', err)
    error.value = err.message || err.toString()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.test-paper-list {
  padding: 20px;
}

.result, .error {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
}

.result {
  background-color: #f0f9ff;
  border: 1px solid #b3e0ff;
}

.error {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>