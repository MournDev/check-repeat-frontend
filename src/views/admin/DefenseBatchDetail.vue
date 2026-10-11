<template>
  <div class="batch-detail">
    <!-- 页头：批次概要 -->
    <el-card class="console-card console-page-head-card" shadow="never" v-loading="loading">
      <div class="head-row">
        <div class="head-left">
          <el-button link @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <h2 class="head-title">
            {{ batch.batchNo || '批次详情' }}
            <el-tag :type="statusTagType(batch.status)" effect="light" round class="status-tag">
              {{ batch.statusDesc || statusText(batch.status) }}
            </el-tag>
          </h2>
          <p class="head-desc">
            {{ batchTypeText(batch.batchType) }} · {{ batch.collegeName || '全校' }} ·
            {{ formatDateTime(batch.defenseDate) }} · {{ batch.modeDesc || modeText(batch.mode) }}
            <template v-if="batch.location"> · {{ batch.location }}</template>
          </p>
        </div>
        <div class="head-actions">
          <el-button :disabled="batch.status === 2" @click="openAssignDialog">
            <el-icon><UserFilled /></el-icon>
            分配答辩组
          </el-button>
          <el-button type="primary" :disabled="batch.status === 2" @click="openEnrollDialog">
            <el-icon><Plus /></el-icon>
            学生入批
          </el-button>
        </div>
      </div>
      <div class="stat-strip">
        <div class="stat-block">
          <div class="stat-value">{{ batch.memberCount ?? 0 }}</div>
          <div class="stat-label">组成员数</div>
        </div>
        <div class="stat-block">
          <div class="stat-value">{{ batch.paperCount ?? 0 }}</div>
          <div class="stat-label">入册论文数</div>
        </div>
        <div class="stat-block">
          <div class="stat-value">{{ batch.submittedCount ?? 0 }}</div>
          <div class="stat-label">已提交结论数</div>
        </div>
        <div class="stat-block stat-wide">
          <div class="stat-value stat-text">{{ batch.leaderName || '待定' }} / {{ batch.secretaryName || '待定' }}</div>
          <div class="stat-label">组长 / 秘书</div>
        </div>
      </div>
      <p v-if="batch.remark" class="remark-line">备注：{{ batch.remark }}</p>
    </el-card>

    <!-- 记录列表 -->
    <el-card class="console-card" shadow="never">
      <template #header>
        <span class="section-title">批次内答辩记录</span>
      </template>

      <div class="filter-row">
        <el-input
          v-model="recordFilters.studentId"
          placeholder="学生ID"
          clearable
          class="filter-item"
          @keyup.enter="handleRecordSearch"
        />
        <el-select v-model="recordFilters.result" placeholder="结论" clearable class="filter-item" @change="handleRecordSearch">
          <el-option label="通过" value="pass" />
          <el-option label="不通过" value="fail" />
          <el-option label="缓辩" value="postpone" />
        </el-select>
        <el-button @click="handleRecordSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="handleRecordReset">重置</el-button>
      </div>

      <el-table :data="records" v-loading="recordLoading" row-key="id">
        <el-table-column prop="defenseOrder" label="顺序号" width="80" align="center">
          <template #default="{ row }">{{ row.defenseOrder ?? '—' }}</template>
        </el-table-column>
        <el-table-column prop="paperTitle" label="论文标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="学生" min-width="130">
          <template #default="{ row }">
            <span>{{ row.studentName || '—' }}</span>
            <span v-if="row.studentUsername" class="stu-no">（{{ row.studentUsername }}）</span>
          </template>
        </el-table-column>
        <el-table-column label="得分" width="80" align="center">
          <template #default="{ row }">{{ row.score ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="等级" width="80" align="center">
          <template #default="{ row }">{{ row.grade || '—' }}</template>
        </el-table-column>
        <el-table-column label="结论" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.result" :type="resultTagType(row.result)" effect="light" round>
              {{ row.resultDesc || resultText(row.result) }}
            </el-tag>
            <span v-else class="muted">未出结论</span>
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="答辩记录" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.comment || '—' }}</template>
        </el-table-column>
        <el-table-column label="结论提交" min-width="150">
          <template #default="{ row }">
            <span v-if="row.submitTime">
              {{ row.submitByName || '' }} · {{ formatDateTime(row.submitTime) }}
            </span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无答辩记录，可通过「学生入批」安排论文进入本批次" />
        </template>
      </el-table>

      <div class="pager-row">
        <el-pagination
          v-model:current-page="recordPagination.current"
          v-model:page-size="recordPagination.size"
          :total="recordTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchRecords(1)"
          @current-change="fetchRecords()"
        />
      </div>
    </el-card>

    <!-- 分配答辩组弹窗 -->
    <el-dialog v-model="assignDialog.visible" title="分配答辩组" width="520px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="答辩组教师" required>
          <el-select
            v-model="assignDialog.teacherIds"
            multiple
            filterable
            placeholder="选择参与答辩的教师（可多选）"
            style="width: 100%"
          >
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="组长" required>
          <el-select v-model="assignDialog.leaderTeacherId" placeholder="从已选教师中指定组长" style="width: 100%">
            <el-option
              v-for="t in selectedTeacherOptions"
              :key="t.id"
              :label="t.name"
              :value="t.id"
            />
          </el-select>
          <div class="form-tip">组长主持答辩并汇总结论；已在组内的教师重复提交会被跳过。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="assignDialog.submitting" :disabled="!assignDialog.teacherIds.length || !assignDialog.leaderTeacherId" @click="handleAssignSubmit">
          提交分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 学生入批弹窗 -->
    <el-dialog v-model="enrollDialog.visible" title="学生入批" width="680px" destroy-on-close>
      <div class="enroll-hint">
        <el-icon><InfoFilled /></el-icon>
        仅「{{ enrollPreStatusText }}」状态的论文可入本批次，其余状态将被跳过并列出原因。
      </div>
      <div class="filter-row enroll-filter">
        <el-input
          v-model="enrollDialog.keyword"
          placeholder="论文标题关键词"
          clearable
          class="filter-item"
          @keyup.enter="fetchPapers(1)"
        />
        <el-button @click="fetchPapers(1)">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <span class="picked-count">已选 {{ enrollDialog.selectedIds.length }} 篇</span>
      </div>
      <el-table
        ref="enrollTableRef"
        :data="papers"
        v-loading="enrollDialog.loading"
        row-key="id"
        max-height="360"
        @selection-change="handlePaperSelectionChange"
      >
        <el-table-column type="selection" width="46" reserve-selection />
        <el-table-column prop="paperTitle" label="论文标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="当前状态" width="110">
          <template #default="{ row }">
            <el-tag :type="paperStatusTagType(row.paperStatus)" effect="plain" round>{{ paperStatusText(row.paperStatus) }}</el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="没有符合前置状态的论文" />
        </template>
      </el-table>
      <div class="pager-row">
        <el-pagination
          v-model:current-page="enrollDialog.current"
          v-model:page-size="enrollDialog.size"
          :total="enrollDialog.total"
          layout="total, prev, pager, next"
          background
          small
          @current-change="fetchPapers()"
        />
      </div>
      <template #footer>
        <el-button @click="enrollDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="enrollDialog.submitting" :disabled="!enrollDialog.selectedIds.length" @click="handleEnrollSubmit">
          入批（{{ enrollDialog.selectedIds.length }}）
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDefenseBatchDetail,
  assignDefenseMembers,
  enrollDefenseStudents,
  getDefenseBatchRecords
} from '@/api/defense'
import { getPaperList } from '@/api/admin/papers'
import { getReviewWorkflowTeachers } from '@/api/admin/config'

const route = useRoute()
const router = useRouter()
const batchId = String(route.params.id)

// ==================== 批次信息 ====================
const loading = ref(false)
const batch = ref({})

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getDefenseBatchDetail(batchId)
    batch.value = res.data || {}
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push('/admin/defense-batches')

// ==================== 记录列表 ====================
const recordLoading = ref(false)
const records = ref([])
const recordTotal = ref(0)
const recordPagination = reactive({ current: 1, size: 10 })
const recordFilters = reactive({ studentId: '', result: '' })

const fetchRecords = async (page) => {
  if (page) recordPagination.current = page
  recordLoading.value = true
  try {
    const params = {
      currentPage: recordPagination.current,
      pageSize: recordPagination.size
    }
    const sid = String(recordFilters.studentId || '').trim()
    if (sid) params.studentId = sid
    if (recordFilters.result) params.result = recordFilters.result
    const res = await getDefenseBatchRecords(batchId, params)
    records.value = res.data?.records || []
    recordTotal.value = Number(res.data?.total || 0)
  } finally {
    recordLoading.value = false
  }
}

const handleRecordSearch = () => fetchRecords(1)

const handleRecordReset = () => {
  recordFilters.studentId = ''
  recordFilters.result = ''
  fetchRecords(1)
}

// ==================== 分配答辩组 ====================
const teachers = ref([])
const assignDialog = reactive({
  visible: false,
  submitting: false,
  teacherIds: [],
  leaderTeacherId: ''
})

const selectedTeacherOptions = computed(() =>
  teachers.value.filter((t) => assignDialog.teacherIds.includes(t.id))
)

const openAssignDialog = () => {
  assignDialog.teacherIds = []
  assignDialog.leaderTeacherId = ''
  assignDialog.visible = true
}

const handleAssignSubmit = async () => {
  assignDialog.submitting = true
  try {
    const res = await assignDefenseMembers(batchId, {
      batchId,
      teacherIds: assignDialog.teacherIds,
      leaderTeacherId: assignDialog.leaderTeacherId
    })
    showBatchOpResult(res, '答辩组分配完成')
    assignDialog.visible = false
    fetchDetail()
  } finally {
    assignDialog.submitting = false
  }
}

// ==================== 学生入批 ====================
const enrollTableRef = ref(null)
const enrollDialog = reactive({
  visible: false,
  loading: false,
  submitting: false,
  keyword: '',
  papers: [],
  current: 1,
  size: 20,
  total: 0,
  selectedIds: []
})

// 前置状态随批次类型走：中期入批要求 reviewing，终期入批要求 mid_defense
const enrollPreStatus = computed(() =>
  batch.value.batchType === 'final' ? 'mid_defense' : 'reviewing'
)
const enrollPreStatusText = computed(() => paperStatusText(enrollPreStatus.value))

const openEnrollDialog = () => {
  enrollDialog.keyword = ''
  enrollDialog.current = 1
  enrollDialog.selectedIds = []
  enrollDialog.visible = true
  fetchPapers(1)
}

const fetchPapers = async (page) => {
  if (page) enrollDialog.current = page
  enrollDialog.loading = true
  try {
    // 管理端论文列表接口分页参数是 page/size（与答辩模块的 currentPage 不同）
    const res = await getPaperList({
      page: enrollDialog.current,
      size: enrollDialog.size,
      paperStatus: enrollPreStatus.value,
      keyword: enrollDialog.keyword || undefined
    })
    enrollDialog.papers = res.data?.records || []
    enrollDialog.total = Number(res.data?.total || 0)
  } finally {
    enrollDialog.loading = false
  }
}

const handlePaperSelectionChange = (rows) => {
  enrollDialog.selectedIds = rows.map((r) => String(r.id))
}

const handleEnrollSubmit = async () => {
  enrollDialog.submitting = true
  try {
    const res = await enrollDefenseStudents(batchId, {
      batchId,
      paperIds: enrollDialog.selectedIds
    })
    showBatchOpResult(res, '学生入批完成')
    enrollDialog.visible = false
    if (enrollTableRef.value) enrollTableRef.value.clearSelection()
    enrollDialog.selectedIds = []
    fetchDetail()
    fetchRecords(1)
  } finally {
    enrollDialog.submitting = false
  }
}

// ==================== 批量操作结果呈现 ====================
// 后端返回 { total, success, skipped, skipReasons[] }：有跳过时用弹窗逐条列出原因
const showBatchOpResult = (res, fallbackLabel) => {
  const data = res?.data || {}
  const success = Number(data.success ?? 0)
  const skipped = Number(data.skipped ?? 0)
  const reasons = data.skipReasons || []
  const message = res?.message || fallbackLabel
  if (skipped > 0) {
    ElMessageBox.alert(
      h('div', null, [
        h('p', { style: 'margin:0 0 8px' }, `${message}：成功 ${success} 条，跳过 ${skipped} 条。`),
        h(
          'ul',
          { style: 'margin:0;padding-left:18px;max-height:240px;overflow:auto' },
          reasons.map((r) => h('li', { style: 'line-height:1.9' }, r))
        )
      ]),
      { type: 'warning', confirmButtonText: '知道了' }
    ).catch(() => {})
  } else {
    ElMessage.success(`${message}：成功 ${success}/${data.total ?? success}`)
  }
}

// ==================== 展示辅助 ====================
const batchTypeText = (v) => (v === 'final' ? '终期答辩' : v === 'mid_term' ? '中期答辩' : v || '—')
const modeText = (v) => (v === 'online' ? '线上答辩' : v === 'offline' ? '线下答辩' : v || '—')
const statusText = (v) => ({ 0: '筹备中', 1: '进行中', 2: '已结束' }[v] ?? '—')
const statusTagType = (v) => ({ 0: 'info', 1: 'primary', 2: 'success' }[v] || 'info')
const resultText = (v) => ({ pass: '通过', fail: '不通过', postpone: '缓辩' }[v] || v)
const resultTagType = (v) => ({ pass: 'success', fail: 'danger', postpone: 'warning' }[v] || 'info')

// paper_status 13 态文案与字典对齐（/api/dict/data/type/paper_status）
const PAPER_STATUS_TEXT = {
  pending: '待分配',
  assigned: '已分配',
  checking: '待查重',
  auditing: '待审核',
  completed: '初审通过',
  rejected: '审核不通过',
  withdrawn: '已取消',
  reviewing: '评阅中',
  mid_defense: '中期答辩',
  final_defense: '终期答辩',
  defense_passed: '答辩通过',
  finalized: '已定稿',
  archived: '已归档'
}
const paperStatusText = (v) => PAPER_STATUS_TEXT[v] || v || '—'
const paperStatusTagType = (v) => ({
  reviewing: 'primary',
  mid_defense: 'warning',
  final_defense: 'warning',
  defense_passed: 'success'
}[v] || 'info')

const formatDateTime = (val) => {
  if (!val) return '—'
  return String(val).replace('T', ' ').slice(0, 16)
}

onMounted(() => {
  fetchDetail()
  fetchRecords()
  getReviewWorkflowTeachers().then((res) => {
    teachers.value = res.data || []
  }).catch(() => {})
})
</script>

<style scoped lang="scss">
.batch-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.head-left {
  flex: 1;
  min-width: 0;
}

.head-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.status-tag {
  flex-shrink: 0;
}

.head-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.stat-strip {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.stat-block {
  min-width: 120px;
  padding: 12px 16px;
  border-radius: var(--apple-rounded-md);
  background: var(--apple-canvas);
}

.stat-wide {
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-text {
  font-size: 0.9375rem;
}

.stat-label {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
}

.remark-line {
  margin: 12px 0 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-item {
  width: 160px;
}

.stu-no {
  color: var(--apple-ink-muted-48);
}

.muted {
  color: var(--apple-ink-muted-48);
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.form-tip {
  width: 100%;
  margin-top: 4px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--apple-ink-muted-48);
}

.enroll-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  margin-bottom: 14px;
  border-radius: var(--apple-rounded-md);
  background: color-mix(in srgb, var(--apple-warning) 10%, transparent);
  color: var(--apple-warning);
  font-size: 0.8125rem;
}

.enroll-filter {
  margin-bottom: 12px;
}

.picked-count {
  margin-left: auto;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}
</style>
