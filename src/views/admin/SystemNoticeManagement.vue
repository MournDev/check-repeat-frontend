<template>
  <div class="notice-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">通知管理</h1>
        <p class="page-desc">管理系统站内通知，查看已读状态和优先级</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleSendTest">发送测试通知</el-button>
        <el-button @click="handleSendTestPriority">发送紧急测试</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-card shadow="never" class="stat-card">
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-label">总通知数</div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-value unread">{{ stats.unread || 0 }}</div>
        <div class="stat-label">未读通知</div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-value urgent">{{ stats.urgent || 0 }}</div>
        <div class="stat-label">紧急通知</div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-value read">{{ stats.read || 0 }}</div>
        <div class="stat-label">已读通知</div>
      </el-card>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="通知类型">
          <el-select v-model="filterForm.noticeType" placeholder="全部" clearable style="width: 140px" @change="fetchList">
            <el-option label="提交成功" :value="1" />
            <el-option label="查重完成" :value="2" />
            <el-option label="审核结果" :value="3" />
            <el-option label="截止提醒" :value="4" />
            <el-option label="系统通知" :value="5" />
            <el-option label="教师分配" :value="6" />
            <el-option label="修改请求" :value="7" />
            <el-option label="其他" :value="8" />
          </el-select>
        </el-form-item>
        <el-form-item label="已读状态">
          <el-select v-model="filterForm.isRead" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option label="未读" :value="0" />
            <el-option label="已读" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filterForm.priority" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option label="普通" :value="0" />
            <el-option label="重要" :value="1" />
            <el-option label="紧急" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">通知列表</span>
          <div class="card-actions">
            <el-button size="small" @click="handleMarkAllRead">全部已读</el-button>
            <el-button size="small" type="danger" @click="handleClearAll">清空全部</el-button>
          </div>
        </div>
      </template>

      <el-table :data="noticeList" v-loading="loading" stripe style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" :index="(idx) => (currentPage - 1) * pageSize + idx + 1" label="序号" width="70" />
        <el-table-column prop="noticeTitle" label="通知标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="通知类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getNoticeTypeTag(row.noticeType)" size="small">{{ getNoticeTypeName(row.noticeType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.priority)" size="small">{{ getPriorityName(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已读状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRead === 1 ? 'info' : 'danger'" size="small">{{ row.isRead === 1 ? '已读' : '未读' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="viewDetail(row)">查看</el-button>
            <el-button v-if="row.isRead === 0" size="small" text type="success" @click="handleMarkRead(row)">已读</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer" v-if="selectedRows.length > 0">
        <span class="selected-count">已选 {{ selectedRows.length }} 项</span>
        <el-button size="small" type="success" @click="handleBatchRead">批量已读</el-button>
        <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
      </div>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" @size-change="handleSizeChange" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="通知详情" width="550px" destroy-on-close>
      <el-descriptions :column="1" border v-if="currentNotice">
        <el-descriptions-item label="通知标题">{{ currentNotice.noticeTitle }}</el-descriptions-item>
        <el-descriptions-item label="通知类型">{{ getNoticeTypeName(currentNotice.noticeType) }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityTag(currentNotice.priority)">{{ getPriorityName(currentNotice.priority) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="已读状态">
          <el-tag :type="currentNotice.isRead === 1 ? 'info' : 'danger'">{{ currentNotice.isRead === 1 ? '已读' : '未读' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="通知内容">{{ currentNotice.noticeContent }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentNotice.createTime) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentNotice.readTime" label="阅读时间">{{ formatDate(currentNotice.readTime) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentNotice.relatedType" label="关联类型">{{ currentNotice.relatedType }}</el-descriptions-item>
        <el-descriptions-item v-if="currentNotice.relatedId" label="关联ID">{{ currentNotice.relatedId }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getNoticeList, getNoticeStats, markAsRead, batchMarkAsRead, markAllAsRead, deleteNotice, batchDeleteNotice, clearAllNotice, sendTestNotice, sendTestNoticeWithPriority } from '@/api/admin/notices'

const loading = ref(false)
const noticeList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])
const detailVisible = ref(false)
const currentNotice = ref(null)
const stats = reactive({ total: 0, unread: 0, urgent: 0, read: 0 })

const filterForm = reactive({
  noticeType: '',
  isRead: '',
  priority: ''
})

const NOTICE_TYPES = {
  1: '提交成功', 2: '查重完成', 3: '审核结果', 4: '截止提醒',
  5: '系统通知', 6: '教师分配', 7: '修改请求', 8: '其他'
}
const NOTICE_TYPE_TAGS = {
  1: 'success', 2: 'primary', 3: 'warning', 4: 'danger',
  5: 'info', 6: '', 7: 'warning', 8: 'info'
}

const getNoticeTypeName = (type) => NOTICE_TYPES[type] || '未知'
const getNoticeTypeTag = (type) => NOTICE_TYPE_TAGS[type] || 'info'
const getPriorityName = (p) => ({ 0: '普通', 1: '重要', 2: '紧急' })[p] || '未知'
const getPriorityTag = (p) => ({ 0: 'info', 1: 'warning', 2: 'danger' })[p] || 'info'

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = { pageNum: currentPage.value, pageSize: pageSize.value }
    if (filterForm.noticeType !== '') params.noticeType = filterForm.noticeType
    if (filterForm.isRead !== '') params.isRead = filterForm.isRead
    if (filterForm.priority !== '') params.priority = filterForm.priority
    const res = await getNoticeList(params)
    if (res.code === 200 && res.data) {
      noticeList.value = res.data.records || res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    console.error('查询通知列表失败', e)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getNoticeStats()
    if (res.code === 200 && res.data) {
      Object.assign(stats, res.data)
    }
  } catch {}
}

const resetFilter = () => {
  filterForm.noticeType = ''
  filterForm.isRead = ''
  filterForm.priority = ''
  currentPage.value = 1
  fetchList()
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchList()
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const viewDetail = (row) => {
  currentNotice.value = row
  detailVisible.value = true
}

const handleMarkRead = async (row) => {
  try {
    const res = await markAsRead(row.id)
    if (res.code === 200) {
      row.isRead = 1
      ElMessage.success('已标记为已读')
      fetchStats()
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确定将所有未读通知标记为已读吗？', '提示', { type: 'warning' })
    const res = await markAllAsRead()
    if (res.code === 200) {
      ElMessage.success(res.message || '操作成功')
      fetchList()
      fetchStats()
    }
  } catch {}
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该通知吗？', '确认删除', { type: 'warning' })
    const res = await deleteNotice(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchList()
      fetchStats()
    }
  } catch {}
}

const handleBatchRead = async () => {
  const ids = selectedRows.value.map(r => r.id)
  try {
    const res = await batchMarkAsRead(ids)
    if (res.code === 200) {
      ElMessage.success(res.message || '操作成功')
      fetchList()
      fetchStats()
    }
  } catch {}
}

const handleBatchDelete = async () => {
  const ids = selectedRows.value.map(r => r.id)
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条通知吗？`, '确认删除', { type: 'warning' })
    const res = await batchDeleteNotice(ids)
    if (res.code === 200) {
      ElMessage.success(res.message || '删除成功')
      fetchList()
      fetchStats()
    }
  } catch {}
}

const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm('确定清空所有通知吗？此操作不可恢复。', '确认清空', { type: 'warning' })
    const res = await clearAllNotice()
    if (res.code === 200) {
      ElMessage.success(res.message || '清空成功')
      fetchList()
      fetchStats()
    }
  } catch {}
}

const handleSendTest = async () => {
  const res = await sendTestNotice()
  if (res.code === 200) {
    ElMessage.success('测试通知发送成功')
    fetchList()
    fetchStats()
  }
}

const handleSendTestPriority = async () => {
  const res = await sendTestNoticeWithPriority()
  if (res.code === 200) {
    ElMessage.success('紧急测试通知发送成功')
    fetchList()
    fetchStats()
  }
}

onMounted(() => {
  fetchList()
  fetchStats()
})
</script>

<style scoped>
.notice-management { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; margin: 0 0 4px 0; }
.page-desc { color: #909399; margin: 0; font-size: 14px; }
.header-actions { display: flex; gap: 8px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-value.unread { color: #E6A23C; }
.stat-value.urgent { color: #F56C6C; }
.stat-value.read { color: #67C23A; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.filter-card { margin-bottom: 16px; }
.table-card { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; font-size: 15px; }
.card-actions { display: flex; gap: 8px; }
.table-footer { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #EBEEF5; margin-top: 12px; }
.selected-count { font-size: 13px; color: #606266; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
