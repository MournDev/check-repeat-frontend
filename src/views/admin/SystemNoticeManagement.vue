<template>
  <div class="notice-management">
    <PageHeader title="系统公告与维护" description="管理系统站内通知；超级管理员可向全员广播公告并控制维护模式" />

    <el-tabs v-model="activeTab" class="notice-tabs" @tab-change="handleTabChange">
      <!-- ============ 页签 1：通知列表（管理员/超管可见） ============ -->
      <el-tab-pane label="通知列表" name="list">
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
      </el-tab-pane>

      <!-- ============ 页签 2：发布公告（仅超级管理员） ============ -->
      <el-tab-pane v-if="userStore.isSuperAdmin" label="发布公告" name="publish">
        <el-card class="publish-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">发布系统公告</span>
            </div>
          </template>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="publish-tip"
            title="公告将实时推送至目标角色的所有在线用户（浏览器弹窗 + 通知铃铛），离线用户登录后在通知列表中查看。"
          />

          <el-form ref="publishFormRef" :model="publishForm" :rules="publishRules" label-width="90px" class="publish-form" v-loading="publishing">
            <el-form-item label="公告标题" prop="title">
              <el-input v-model="publishForm.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
            </el-form-item>
            <el-form-item label="公告类型" prop="noticeType">
              <el-radio-group v-model="publishForm.noticeType">
                <el-radio-button value="GENERAL">一般公告</el-radio-button>
                <el-radio-button value="VERSION">版本升级</el-radio-button>
                <el-radio-button value="MAINTENANCE">维护通知</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="优先级" prop="priority">
              <el-radio-group v-model="publishForm.priority">
                <el-radio-button :value="0">普通</el-radio-button>
                <el-radio-button :value="1">重要</el-radio-button>
                <el-radio-button :value="2">紧急</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="目标角色" prop="targetRoles">
              <el-checkbox-group v-model="publishForm.targetRoles">
                <el-checkbox v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="公告内容" prop="content">
              <el-input v-model="publishForm.content" type="textarea" :rows="6" maxlength="2000" show-word-limit placeholder="请输入公告内容" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="publishing" @click="handlePublish">发布广播</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ============ 页签 3：维护模式（仅超级管理员） ============ -->
      <el-tab-pane v-if="userStore.isSuperAdmin" label="维护模式" name="maintenance">
        <el-card class="maintenance-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">维护模式控制</span>
            </div>
          </template>

          <el-alert
            :type="maintenanceForm.maintenanceStatus ? 'error' : 'success'"
            :closable="false"
            show-icon
            class="maintenance-status"
            :title="maintenanceForm.maintenanceStatus ? '当前状态：维护中 — 普通用户的业务请求已被后端拒绝并返回维护公告' : '当前状态：正常运行'"
          />

          <el-form :model="maintenanceForm" label-width="100px" class="maintenance-form" v-loading="savingMaintenance">
            <el-form-item label="维护开关">
              <el-switch v-model="maintenanceForm.maintenanceStatus" @change="handleToggleMaintenance" />
              <span class="form-hint">开启后学生/教师/管理员的所有业务请求返回 503，仅超级管理员可继续操作</span>
            </el-form-item>
            <el-form-item label="维护公告">
              <el-input
                v-model="maintenanceForm.maintenanceNotice"
                type="textarea"
                :rows="4"
                maxlength="500"
                show-word-limit
                placeholder="维护期间展示给全体用户的公告文案，例如：系统将于 22:00-23:00 升级维护，期间暂停服务"
              />
            </el-form-item>
            <el-form-item label="开始时间">
              <el-date-picker v-model="maintenanceForm.maintenanceStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可选" style="width: 220px" />
            </el-form-item>
            <el-form-item label="预计结束">
              <el-date-picker v-model="maintenanceForm.maintenanceEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可选" style="width: 220px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingMaintenance" @click="saveMaintenance">保存维护设置</el-button>
              <el-button @click="resetMaintenanceForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

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
import { getNoticeList, getNoticeStats, markAsRead, batchMarkAsRead, markAllAsRead, deleteNotice, batchDeleteNotice, clearAllNotice, broadcastNotice } from '@/api/admin/notices'
import { updateMaintenance } from '@/api/admin/systemStatus'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { useMaintenanceStore } from '@/stores/maintenance'
import PageHeader from '@/components/common/PageHeader.vue'

const userStore = useUserStore()
const messageStore = useMessageStore()
const maintenanceStore = useMaintenanceStore()
const activeTab = ref('list')

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

// ============ 通知列表（原有能力） ============
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
      // 已读/删除/清空一律回源铃铛未读数（message store SSOT），不本地加减
      messageStore.loadSystemUnread(userStore.userInfo?.userId)
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
      messageStore.loadSystemUnread(userStore.userInfo?.userId)
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
      messageStore.loadSystemUnread(userStore.userInfo?.userId)
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
      messageStore.loadSystemUnread(userStore.userInfo?.userId)
    }
  } catch {}
}

const handleBatchDelete = async () => {
  const ids = selectedRows.value.map(r => r.id)
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条通知吗？`, '确认删除', { type: 'warning' })
    const res = await batchDeleteNotice(ids)
    if (res.code === 200) {
      ElMessage.success(res.message || '操作成功')
      fetchList()
      fetchStats()
      messageStore.loadSystemUnread(userStore.userInfo?.userId)
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
      messageStore.loadSystemUnread(userStore.userInfo?.userId)
    }
  } catch {}
}

// ============ 发布公告（仅超级管理员） ============
const ROLE_OPTIONS = [
  { value: 'STUDENT', label: '学生' },
  { value: 'TEACHER', label: '教师' },
  { value: 'ADMIN', label: '管理员' }
]
const PUBLISH_TYPE_NAMES = { MAINTENANCE: '维护通知', VERSION: '版本升级', GENERAL: '一般公告' }

const publishFormRef = ref(null)
const publishing = ref(false)
const publishForm = reactive({
  title: '',
  noticeType: 'GENERAL',
  priority: 0,
  targetRoles: ['STUDENT', 'TEACHER', 'ADMIN'],
  content: ''
})
const publishRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
  targetRoles: [{ type: 'array', required: true, message: '请至少选择一个目标角色', trigger: 'change' }]
}

const handlePublish = async () => {
  try { await publishFormRef.value?.validate() } catch { return }
  const roleNames = publishForm.targetRoles
    .map(r => ROLE_OPTIONS.find(o => o.value === r)?.label || r)
    .join('、')
  try {
    await ElMessageBox.confirm(
      `确定向【${roleNames}】发布${PUBLISH_TYPE_NAMES[publishForm.noticeType] || '公告'}吗？目标角色的在线用户将实时收到弹窗通知。`,
      '发布公告',
      {
        confirmButtonText: '确认发布',
        cancelButtonText: '取消',
        type: publishForm.noticeType === 'MAINTENANCE' ? 'warning' : 'info'
      }
    )
  } catch { return }

  publishing.value = true
  try {
    const res = await broadcastNotice({
      title: publishForm.title,
      content: publishForm.content,
      noticeType: publishForm.noticeType,
      priority: publishForm.priority,
      targetRoles: publishForm.targetRoles
    })
    if (res.code === 200) {
      ElMessage.success(res.message || '公告发布成功，目标角色的在线用户将实时收到')
      publishFormRef.value?.resetFields()
      // 保留默认全选，避免下次发布漏选角色
      publishForm.targetRoles = ['STUDENT', 'TEACHER', 'ADMIN']
    }
  } catch {
    // 请求失败由 axios 封装统一提示（后端接口未上线时表现为 404 错误提示）
  } finally {
    publishing.value = false
  }
}

// ============ 维护模式（仅超级管理员） ============
const savingMaintenance = ref(false)
const maintenanceForm = reactive({
  maintenanceStatus: false,
  maintenanceNotice: '',
  maintenanceStartTime: '',
  maintenanceEndTime: ''
})

const syncMaintenanceForm = () => {
  maintenanceForm.maintenanceStatus = maintenanceStore.maintenanceMode
  maintenanceForm.maintenanceNotice = maintenanceStore.notice
  maintenanceForm.maintenanceStartTime = maintenanceStore.startTime
  maintenanceForm.maintenanceEndTime = maintenanceStore.endTime
}

const refreshMaintenanceStatus = async () => {
  await maintenanceStore.fetchStatus()
  syncMaintenanceForm()
}

const handleToggleMaintenance = async (val) => {
  try {
    await ElMessageBox.confirm(
      val
        ? '开启后学生、教师、管理员的所有业务请求将被拒绝并看到维护公告，仅超级管理员可继续操作。确定开启吗？'
        : '确定关闭维护模式、恢复正常服务吗？',
      val ? '开启维护模式' : '关闭维护模式',
      {
        confirmButtonText: val ? '确认开启' : '确认关闭',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    // 用户取消：回滚开关显示
    maintenanceForm.maintenanceStatus = !val
    return
  }
  await saveMaintenance()
}

const saveMaintenance = async () => {
  if (maintenanceForm.maintenanceStatus && !maintenanceForm.maintenanceNotice.trim()) {
    ElMessage.warning('开启维护模式前请先填写维护公告文案')
    maintenanceForm.maintenanceStatus = false
    return
  }
  savingMaintenance.value = true
  try {
    const res = await updateMaintenance({
      maintenanceStatus: maintenanceForm.maintenanceStatus,
      maintenanceNotice: maintenanceForm.maintenanceNotice,
      maintenanceStartTime: maintenanceForm.maintenanceStartTime || null,
      maintenanceEndTime: maintenanceForm.maintenanceEndTime || null
    })
    if (res.code === 200) {
      ElMessage.success(maintenanceForm.maintenanceStatus ? '维护模式已开启，在线用户将实时收到通知' : '维护模式已关闭，服务恢复正常')
      maintenanceStore.applyStatus(res.data || {
        maintenanceStatus: maintenanceForm.maintenanceStatus,
        maintenanceNotice: maintenanceForm.maintenanceNotice,
        maintenanceStartTime: maintenanceForm.maintenanceStartTime,
        maintenanceEndTime: maintenanceForm.maintenanceEndTime
      })
    }
  } catch {
    // 失败回滚开关到服务端真实状态（axios 封装已统一提示错误）
    maintenanceForm.maintenanceStatus = maintenanceStore.maintenanceMode
  } finally {
    savingMaintenance.value = false
  }
}

const resetMaintenanceForm = () => {
  syncMaintenanceForm()
  ElMessage.info('已重置为当前生效的维护配置')
}

const handleTabChange = (name) => {
  // 进入维护页签时重新拉取服务端最新状态，避免表单展示过期值
  if (name === 'maintenance' && userStore.isSuperAdmin) {
    refreshMaintenanceStatus()
  }
}

onMounted(() => {
  fetchList()
  fetchStats()
  if (userStore.isSuperAdmin) {
    refreshMaintenanceStatus()
  }
})
</script>

<style scoped>
.notice-management { padding: 0; }
.notice-tabs { margin-bottom: 16px; }
.notice-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--apple-ink); }
.stat-value.unread { color: var(--apple-warning); }
.stat-value.urgent { color: var(--apple-danger); }
.stat-value.read { color: var(--apple-success); }
.stat-label { font-size: 13px; color: var(--apple-info); margin-top: 4px; }
.filter-card { margin-bottom: 16px; }
.table-card { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; font-size: 15px; }
.card-actions { display: flex; gap: 8px; }
.table-footer { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--apple-hairline); margin-top: 12px; }
.selected-count { font-size: 13px; color: var(--apple-ink-muted-80); }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.publish-card { max-width: 760px; }
.publish-tip { margin-bottom: 16px; }
.maintenance-card { max-width: 760px; }
.maintenance-status { margin-bottom: 16px; }
.form-hint { font-size: 12px; color: var(--apple-info); margin-left: 12px; }
</style>
