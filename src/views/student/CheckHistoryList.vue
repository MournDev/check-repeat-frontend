<template>
  <div class="check-history-list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-title">查重历史</span>
        </template>
      </el-page-header>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="论文状态">
          <el-select
            v-model="filterForm.paperStatus"
            placeholder="全部状态"
            clearable
            @change="fetchPapers"
          >
            <el-option label="草稿" value="DRAFT"></el-option>
            <el-option label="已提交" value="SUBMITTED"></el-option>
            <el-option label="审核中" value="UNDER_REVIEW"></el-option>
            <el-option label="通过" value="PASSED"></el-option>
            <el-option label="驳回" value="REJECTED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="论文类型">
          <el-select
            v-model="filterForm.paperType"
            placeholder="全部类型"
            clearable
            @change="fetchPapers"
          >
            <el-option label="学位论文" value="THESIS"></el-option>
            <el-option label="期刊论文" value="JOURNAL"></el-option>
            <el-option label="会议论文" value="CONFERENCE"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="请输入论文标题或关键词"
            clearable
            @keyup.enter="fetchPapers"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchPapers">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetFilter">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 论文列表 -->
    <el-card class="papers-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>选择论文查看查重历史</span>
          <div class="header-right">
            <span class="total-count">共 {{ total }} 篇论文</span>
          </div>
        </div>
      </template>

      <!-- 论文列表 -->
      <el-table 
        :data="papers" 
        stripe 
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无论文数据"
      >
        <el-table-column prop="paperTitle" label="论文标题" min-width="200">
          <template #default="{ row }">
            <div class="paper-title-cell">
              <el-icon><Document /></el-icon>
              <span class="paper-title">{{ row.paperTitle }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="paperType" label="论文类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPaperTypeTagType(row.paperType)">
              {{ getPaperTypeText(row.paperType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="submitTime" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.submitTime) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="similarityRate" label="相似度" width="100">
          <template #default="{ row }">
            <span :class="getSimilarityClass(row.similarityRate)">
              {{ row.similarityRate }}%
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="paperStatus" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.paperStatus)">
              {{ getStatusText(row.paperStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              text 
              size="small"
              :icon="Histogram"
              @click="viewCheckHistory(row.id)"
            >
              查看历史
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Histogram, Document, Search, Refresh } from '@element-plus/icons-vue'
import { getStudentPaperPage } from '@/api/student'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const papers = ref([])
const loading = ref(false)
const total = ref(0)

const filterForm = reactive({
  paperStatus: '',
  paperType: '',
  keyword: ''
})

const pagination = reactive({
  current: 1,
  size: 10
})

// 方法
const goBack = () => {
  router.back()
}

const fetchPapers = async () => {
  loading.value = true
  try {
    const params = {
      studentId: userStore.userInfo?.userId, // 显式传递学生ID
      pageNum: pagination.current,
      pageSize: pagination.size,
      paperStatus: filterForm.paperStatus || null,
      paperType: filterForm.paperType || null,
      paperTitle: filterForm.keyword || null
    }
    
    const res = await getStudentPaperPage(params)
    
    if (res.code === 200) {
      // 处理不同的响应格式
      if (res.data && Array.isArray(res.data)) {
        papers.value = res.data
        total.value = res.data.length
      } else if (res.data && res.data.records) {
        papers.value = res.data.records
        total.value = res.data.total || 0
      } else if (res.rows) {
        papers.value = res.rows
        total.value = res.total || res.rows.length
      } else {
        papers.value = []
        total.value = 0
      }
      
      if (papers.value.length === 0) {
        ElMessage.info('暂无论文数据')
      }
    } else {
      ElMessage.error(res.message || '获取论文列表失败')
      papers.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取论文列表失败:', error)
    ElMessage.error('获取论文列表失败: ' + (error.message || '网络错误'))
    papers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.paperStatus = ''
  filterForm.paperType = ''
  filterForm.keyword = ''
  pagination.current = 1
  fetchPapers()
  ElMessage.success('已重置筛选条件')
}

const handleSizeChange = (newSize) => {
  pagination.size = newSize
  pagination.current = 1
  fetchPapers()
}

const handleCurrentChange = (newPage) => {
  pagination.current = newPage
  fetchPapers()
}

const viewCheckHistory = (paperId) => {
  router.push(`/student/check-history/${paperId}`)
}

const getPaperTypeTagType = (type) => {
  const typeMap = {
    'THESIS': 'primary',
    'JOURNAL': 'success',
    'CONFERENCE': 'warning'
  }
  return typeMap[type] || 'info'
}

const getPaperTypeText = (type) => {
  const textMap = {
    'graduation': '毕业论文',
    'course': '课程论文',
    'other': '其他'
  }
  return textMap[type] || '未知类型'
}

const getStatusTagType = (status) => {
  const statusMap = {
    'DRAFT': 'info',
    'SUBMITTED': 'primary',
    'UNDER_REVIEW': 'warning',
    'PASSED': 'success',
    'REJECTED': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'auditing': '待审核',
    'pending': '待分配',
    'checking': '待查重',
    'completed': '审核通过',
    'rejected': '审核驳回'
  }
  return textMap[status] || '未知状态'
}

const getSimilarityClass = (rate) => {
  if (rate < 20) return 'similarity-excellent'
  if (rate < 40) return 'similarity-good'
  if (rate < 60) return 'similarity-warning'
  return 'similarity-danger'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  fetchPapers()
})
</script>

<style lang="scss" scoped>
.check-history-list-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .filter-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .papers-card {
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-weight: 600;
      color: #303133;
      
      .header-right {
        .total-count {
          font-size: 14px;
          color: #909399;
          font-weight: normal;
        }
      }
    }
    
    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .paper-title-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .paper-title {
      font-weight: 500;
      color: #303133;
      cursor: pointer;
      
      &:hover {
        color: #409eff;
      }
    }
  }

  .similarity-excellent { color: #67c23a; }
  .similarity-good { color: #409eff; }
  .similarity-warning { color: #e6a23c; }
  .similarity-danger { color: #f56c6c; }
  
  .pagination-container {
    padding: 20px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #ebeef5;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .check-history-list-page {
    padding: 12px;
    
    .papers-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
    
    .pagination-container {
      padding: 12px;
      justify-content: center;
    }
  }
}
</style>