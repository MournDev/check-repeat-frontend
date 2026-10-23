<template>
  <div class="check-history-list-page">
    <!-- 页面标题 -->
    <PageHeader>
      <template #actions>
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
      </template>
    </PageHeader>

    <ListPageShell
      v-model:page="pagination.current"
      v-model:page-size="pagination.size"
      title="选择论文查看查重历史"
      :icon="Document"
      :total="total"
      show-total
      total-suffix="篇论文"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange"
    >
      <template #filters>
        <el-form :model="filterForm" inline>
        <el-form-item label="论文状态">
          <el-select
            v-model="filterForm.paperStatus"
            placeholder="全部状态"
            clearable
            @change="fetchPapers"
          >
            <el-option label="待分配" value="pending"></el-option>
            <el-option label="待查重" value="checking"></el-option>
            <el-option label="待审核" value="auditing"></el-option>
            <el-option label="审核通过" value="completed"></el-option>
            <el-option label="审核不通过" value="rejected"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="论文类型">
          <!--
            选项来自后端 PaperTypeEnum（经 /api/dict/data/type/paper_type 合成），
            不是前端硬编码。原先这里写死的是 THESIS/JOURNAL/CONFERENCE —— 一套
            后端从未存在过的取值，选中任何一个都必然筛出 0 条。
          -->
          <el-select
            v-model="filterForm.paperType"
            placeholder="全部类型"
            clearable
            :loading="!paperTypesLoaded"
            @change="fetchPapers"
          >
            <el-option
              v-for="item in paperTypeOptions"
              :key="item.code"
              :label="item.label"
              :value="item.code"
            ></el-option>
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
      </template>

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
            {{ formatDateTime(row.submitTime, 'YYYY-MM-DD HH:mm', '-') }}
          </template>
        </el-table-column>
        
        <el-table-column prop="similarityRate" label="总相似比" width="100">
          <template #default="{ row }">
            <span :class="getSimilarityClass(row.similarityRate)">
              {{ row.similarityRate != null ? row.similarityRate + '%' : '未检测' }}
            </span>
          </template>
        </el-table-column>

        <!-- P5 新指标：存量数据字段为 null，展示「—」不按 0 处理 -->
        <el-table-column label="单篇最大" width="100">
          <template #default="{ row }">
            <span>{{ row.maxPerSource != null ? row.maxPerSource + '%' : '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="引用率" width="100">
          <template #default="{ row }">
            <span>{{ row.citationRate != null ? row.citationRate + '%' : '—' }}</span>
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
    </ListPageShell>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Histogram, Document, Search, Refresh, ArrowLeft } from '@element-plus/icons-vue'
import { getStudentPaperPage } from '@/api/student'
import { useUserStore } from '@/stores/user'
import {
  loadPaperTypes,
  getPaperTypeText,
  getPaperTypeTagType,
  usePaperTypeOptions,
  usePaperTypesLoaded
} from '@/utils/paperType.js'
import PageHeader from '@/components/common/PageHeader.vue'
import ListPageShell from '@/components/common/ListPageShell.vue'
import { formatDateTime } from '@/utils/dataType.js'
import { getSimilarityClass } from '@/utils/similarity.js'
import { getStatusText, getStatusType } from '@/utils/reviewStatus.js'

const router = useRouter()
const userStore = useUserStore()

// 论文类型选项与文案统一走 utils/paperType.js（模块级缓存，多页并发只发一次请求）
const paperTypeOptions = usePaperTypeOptions()
const paperTypesLoaded = usePaperTypesLoaded()

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

// 论文类型的属性与文案不再由本页维护：getPaperTypeTagType / getPaperTypeText
// 来自 utils/paperType.js。原先这里的两份映射同时持有 THESIS/JOURNAL/CONFERENCE
// （幽灵值）和 graduation/course/other（真值）两套值域，未命中时还回 "未知类型"。

// 论文状态的文案与标签色统一走 utils/reviewStatus.js（与 DB 字典 paper_status 对齐），
// 本页不再维护第二套映射（原「审核驳回 / 已撤回 / 需修改」等文案已废弃）。
const getStatusTagType = (status) => getStatusType(status)


// 生命周期
onMounted(() => {
  // 预取论文类型，填充筛选下拉并让列表里的 code 渲染成中文。
  // 失败不在这里提示：全局 axios 拦截器已经 toast 过，这里只避免未处理的 rejection。
  loadPaperTypes().catch(() => {})
  fetchPapers()
})
</script>

<style lang="scss" scoped>
.check-history-list-page {

  .paper-title-cell {
    display: flex;
    align-items: center;
    gap: var(--app-space-2);

    .paper-title {
      font-weight: 600;
      font-size: var(--app-fs-caption);
      color: var(--app-color-ink);
      cursor: pointer;

      &:hover {
        color: var(--app-color-primary);
      }
    }
  }

  .similarity-low { color: var(--app-color-rate-low); }
  .similarity-medium { color: var(--app-color-rate-medium); }
  .similarity-high { color: var(--app-color-rate-high); }
}

@media (max-width: 768px) {
  .check-history-list-page {
    padding: var(--app-space-3);
  }
}
</style>