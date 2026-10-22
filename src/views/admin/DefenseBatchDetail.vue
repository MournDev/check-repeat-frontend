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
            {{ formatDateTime(batch.defenseDate, 'YYYY-MM-DD HH:mm', '—') }} · {{ batch.modeDesc || modeText(batch.mode) }}
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
      <div v-if="members.length" class="members-line">
        <span class="members-label">答辩组成员</span>
        <el-tag
          v-for="m in members"
          :key="m.id"
          :type="m.groupRole === 'leader' ? 'danger' : 'info'"
          effect="light"
          round
          size="small"
          class="member-tag"
        >
          {{ m.teacherName || m.teacherUsername || '未知' }}<template v-if="m.groupRole === 'leader'">（组长）</template>
        </el-tag>
      </div>
      <p v-if="batch.remark" class="remark-line">备注：{{ batch.remark }}</p>
    </el-card>

    <!-- 记录列表 -->
    <el-card class="console-card" shadow="never">
      <template #header>
        <div class="section-head">
          <span class="section-title">批次内答辩记录</span>
          <el-button :loading="exporting" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
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
          <el-option v-for="o in resultOpts" :key="o.value" :label="o.label" :value="o.value" />
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
              {{ row.submitByName || '' }} · {{ formatDateTime(row.submitTime, 'YYYY-MM-DD HH:mm', '—') }}
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
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  getDefenseBatchDetail,
  assignDefenseMembers,
  enrollDefenseStudents,
  getDefenseBatchRecords,
  exportDefenseBatchRecords,
  getDefenseBatchMembers
} from '@/api/defense'
import { getPaperList } from '@/api/admin/papers'
import { getReviewWorkflowTeachers } from '@/api/admin/config'
import {
  loadDefenseDict,
  useDefenseDictOptions,
  getDefenseDictText,
  DICT_BATCH_TYPE,
  DICT_BATCH_STATUS,
  DICT_MODE,
  DICT_RESULT,
  DICT_PAPER_STATUS
} from '@/utils/defenseDict'
import { getStatusText, getStatusType } from '@/utils/reviewStatus'
import { formatDateTime } from '@/utils/dataType.js'

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

// ==================== 答辩组成员名单 ====================
const members = ref([])

const fetchMembers = async () => {
  const res = await getDefenseBatchMembers(batchId)
  members.value = res.data || []
}

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

// ==================== 导出答辩记录 ====================
const exporting = ref(false)

const handleExport = async () => {
  exporting.value = true
  try {
    // request 在 responseType=blob 时返回原始 axios response
    const res = await exportDefenseBatchRecords(batchId)
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `答辩记录_${batch.value.batchNo || batchId}_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出已开始')
  } catch (error) {
    // 全局拦截器已提示错误，这里只留排查日志
    console.error('导出答辩记录失败', error)
  } finally {
    exporting.value = false
  }
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
    fetchMembers()
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

// ==================== 展示辅助（defense_* 字典驱动，本地兜底） ====================
const resultOptions = useDefenseDictOptions(DICT_RESULT)
const localResultOptions = [
  { value: 'pass', label: '通过' },
  { value: 'fail', label: '不通过' },
  { value: 'postpone', label: '缓辩' }
]
const resultOpts = computed(() => (resultOptions.value.length ? resultOptions.value : localResultOptions))

const batchTypeText = (v) =>
  getDefenseDictText(DICT_BATCH_TYPE, v, v === 'final' ? '终期答辩' : v === 'mid_term' ? '中期答辩' : v || '—')
const modeText = (v) =>
  getDefenseDictText(DICT_MODE, v, v === 'online' ? '线上答辩' : v === 'offline' ? '线下答辩' : v || '—')
const statusText = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  return getDefenseDictText(DICT_BATCH_STATUS, v, { 0: '筹备中', 1: '进行中', 2: '已结束' }[v] ?? '—')
}
const statusTagType = (v) => ({ 0: 'info', 1: 'primary', 2: 'success' }[v] || 'info')
const resultText = (v) => getDefenseDictText(DICT_RESULT, v, { pass: '通过', fail: '不通过', postpone: '缓辩' }[v] || v)
const resultTagType = (v) => ({ pass: 'success', fail: 'danger', postpone: 'warning' }[v] || 'info')

// 文案优先读数据库字典 paper_status，未加载时回落到前端统一字典
const paperStatusText = (v) => getDefenseDictText(DICT_PAPER_STATUS, v, getStatusText(v, v || '—'))
const paperStatusTagType = (v) => getStatusType(v)

onMounted(() => {
  fetchDetail()
  fetchRecords()
  fetchMembers()
  // defense_* / paper_status 字典：失败不阻塞页面（文案走本地兜底，选项走兜底数组）
  loadDefenseDict(DICT_BATCH_TYPE).catch(() => {})
  loadDefenseDict(DICT_BATCH_STATUS).catch(() => {})
  loadDefenseDict(DICT_MODE).catch(() => {})
  loadDefenseDict(DICT_RESULT).catch(() => {})
  loadDefenseDict(DICT_PAPER_STATUS).catch(() => {})
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

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
}

.members-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.members-label {
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.member-tag {
  margin: 0;
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

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.batch-detail {
  gap: var(--apple-spacing-md);
}

.head-row {
  gap: var(--apple-spacing-md);
}

.head-title {
  gap: var(--apple-spacing-xs);
  margin: var(--apple-spacing-xxs) 0;
  font-size: var(--apple-fs-tagline);
  font-family: var(--apple-font-display);
}

.head-desc {
  font-size: var(--apple-fs-fine-print);
}

.head-actions {
  gap: var(--apple-spacing-xs);
}

.stat-strip {
  gap: var(--apple-spacing-sm);
  margin-top: var(--apple-spacing-md);
}

.stat-block {
  padding: var(--apple-spacing-sm) var(--apple-spacing-md);
}

.stat-value {
  font-size: var(--apple-fs-tagline);
}

.stat-label {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
}

.remark-line {
  margin: var(--apple-spacing-sm) 0 0;
  font-size: var(--apple-fs-fine-print);
}

.section-title {
  font-size: var(--apple-fs-caption);
  font-family: var(--apple-font-display);
}

.members-line {
  gap: var(--apple-spacing-xs);
  margin-top: var(--apple-spacing-sm);
}

.members-label {
  font-size: var(--apple-fs-fine-print);
}

.filter-row {
  gap: var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-md);
}

.pager-row {
  margin-top: var(--apple-spacing-md);
}

.form-tip {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
}

.enroll-hint {
  gap: var(--apple-spacing-xxs);
  padding: var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-sm);
  font-size: var(--apple-fs-fine-print);
}

.enroll-filter {
  margin-bottom: var(--apple-spacing-sm);
}

.picked-count {
  font-size: var(--apple-fs-fine-print);
}

@media (max-width: 768px) {
  .head-row {
    flex-direction: column;
  }

  .head-actions {
    width: 100%;
  }

  .filter-item {
    width: 100%;
  }

  .pager-row {
    justify-content: center;
  }
}
</style>
