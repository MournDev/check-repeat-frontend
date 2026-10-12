<template>
  <div class="defense-batches">
    <!-- 页头 -->
    <el-card class="console-card console-page-head-card" shadow="never">
      <div class="head-row">
        <div class="head-text">
          <h2 class="head-title">答辩批次管理</h2>
          <p class="head-desc">统一编排中期/终期答辩批次：分配答辩组、安排学生入批、跟踪结论提交进度。</p>
        </div>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建批次
        </el-button>
      </div>
    </el-card>

    <!-- 筛选 -->
    <el-card class="console-card filter-card" shadow="never">
      <div class="filter-row">
        <el-select v-model="filters.batchType" placeholder="批次类型" clearable class="filter-item" @change="handleSearch">
          <el-option v-for="o in batchTypeOpts" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="filters.collegeId" placeholder="学院（可空为全校）" clearable filterable class="filter-item filter-college" @change="handleSearch">
          <el-option v-for="c in colleges" :key="c.id" :label="c.collegeName" :value="String(c.id)" />
        </el-select>
        <el-select v-model="filters.status" placeholder="批次状态" clearable class="filter-item" @change="handleSearch">
          <el-option v-for="o in batchStatusOpts" :key="o.value" :label="o.label" :value="Number(o.value)" />
        </el-select>
        <el-button @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card class="console-card" shadow="never">
      <el-table :data="batches" v-loading="loading" row-key="id" class="batch-table">
        <el-table-column prop="batchNo" label="批次编号" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.batchType === 'final' ? 'warning' : 'primary'" effect="light" round>
              {{ row.batchTypeDesc || batchTypeText(row.batchType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="学院" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.collegeName || '全校' }}</template>
        </el-table-column>
        <el-table-column label="答辩时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.defenseDate) }}</template>
        </el-table-column>
        <el-table-column label="地点 / 方式" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="loc-cell">{{ row.location || '—' }}</span>
            <el-tag size="small" :type="row.mode === 'online' ? 'info' : 'success'" effect="plain" round class="mode-tag">
              {{ row.modeDesc || modeText(row.mode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="组长 / 秘书" min-width="140">
          <template #default="{ row }">
            <span>{{ row.leaderName || '待定' }}</span>
            <span class="sep">/</span>
            <span>{{ row.secretaryName || '待定' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="组员 / 论文 / 已出结论" width="170" align="center">
          <template #default="{ row }">
            <span class="stat-cell">
              {{ row.memberCount ?? 0 }} / {{ row.paperCount ?? 0 }} / {{ row.submittedCount ?? 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>{{ row.statusDesc || statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">详情</el-button>
            <el-button link type="primary" :disabled="row.status === 2" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-if="row.status === 0" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无答辩批次" />
        </template>
      </el-table>

      <div class="pager-row">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchBatches(1)"
          @current-change="fetchBatches()"
        />
      </div>
    </el-card>

    <!-- 新建 / 编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑答辩批次' : '新建答辩批次'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="批次编号" prop="batchNo">
          <el-input v-model="form.batchNo" :disabled="dialog.isEdit" maxlength="32" placeholder="如 M2026S-01（编辑时不可改）" />
        </el-form-item>
        <el-form-item label="批次类型" prop="batchType">
          <el-radio-group v-model="form.batchType" :disabled="dialog.isEdit">
            <el-radio v-for="o in batchTypeOpts" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
          </el-radio-group>
          <div v-if="!dialog.isEdit" class="form-tip">中期入批推进 reviewing → mid_defense；终期入批推进 mid_defense → final_defense</div>
        </el-form-item>
        <el-form-item label="学院" prop="collegeId">
          <el-select v-model="form.collegeId" placeholder="不选表示全校批次" clearable filterable style="width: 100%">
            <el-option v-for="c in colleges" :key="c.id" :label="c.collegeName" :value="String(c.id)" />
          </el-select>
        </el-form-item>
        <el-form-item label="答辩时间" prop="defenseDate">
          <el-date-picker
            v-model="form.defenseDate"
            type="datetime"
            placeholder="选择答辩时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="答辩方式" prop="mode">
          <el-radio-group v-model="form.mode">
            <el-radio v-for="o in modeOpts" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.mode === 'online' ? '会议链接' : '地点'" prop="location">
          <el-input v-model="form.location" maxlength="128" :placeholder="form.mode === 'online' ? '线上会议链接' : '教室地址'" />
        </el-form-item>
        <el-form-item label="答辩组长" prop="leaderId">
          <el-select v-model="form.leaderId" placeholder="选择组长教师" clearable filterable style="width: 100%">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="答辩秘书" prop="secretaryId">
          <el-select v-model="form.secretaryId" placeholder="选择秘书教师" clearable filterable style="width: 100%">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="255" show-word-limit placeholder="可空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createDefenseBatch, updateDefenseBatch, getDefenseBatchList, deleteDefenseBatch } from '@/api/defense'
import { getColleges } from '@/api/admin/common'
import { getReviewWorkflowTeachers } from '@/api/admin/config'
import {
  loadDefenseDict,
  useDefenseDictOptions,
  getDefenseDictText,
  DICT_BATCH_TYPE,
  DICT_BATCH_STATUS,
  DICT_MODE
} from '@/utils/defenseDict'

const router = useRouter()

// ==================== 列表 ====================
const loading = ref(false)
const batches = ref([])
const total = ref(0)
const pagination = reactive({ current: 1, size: 10 })
const filters = reactive({ batchType: '', collegeId: '', status: null })

const colleges = ref([])
const teachers = ref([])

const fetchBatches = async (page) => {
  if (page) pagination.current = page
  loading.value = true
  try {
    const params = {
      currentPage: pagination.current,
      pageSize: pagination.size
    }
    if (filters.batchType) params.batchType = filters.batchType
    if (filters.collegeId) params.collegeId = filters.collegeId
    if (filters.status !== null && filters.status !== '') params.status = filters.status
    const res = await getDefenseBatchList(params)
    batches.value = res.data?.records || []
    total.value = Number(res.data?.total || 0)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => fetchBatches(1)

const handleReset = () => {
  filters.batchType = ''
  filters.collegeId = ''
  filters.status = null
  fetchBatches(1)
}

const goDetail = (row) => {
  router.push(`/admin/defense-batches/${row.id}`)
}

// ==================== 新建 / 编辑 ====================
const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false, submitting: false, editId: null })
const form = reactive({
  batchNo: '',
  batchType: 'mid_term',
  collegeId: '',
  defenseDate: '',
  mode: 'offline',
  location: '',
  leaderId: '',
  secretaryId: '',
  remark: ''
})

const rules = {
  batchNo: [{ required: true, message: '请输入批次编号', trigger: 'blur' }],
  batchType: [{ required: true, message: '请选择批次类型', trigger: 'change' }],
  defenseDate: [{ required: true, message: '请选择答辩时间', trigger: 'change' }],
  mode: [{ required: true, message: '请选择答辩方式', trigger: 'change' }]
}

const openCreateDialog = () => {
  dialog.isEdit = false
  dialog.editId = null
  Object.assign(form, {
    batchNo: '',
    batchType: 'mid_term',
    collegeId: '',
    defenseDate: '',
    mode: 'offline',
    location: '',
    leaderId: '',
    secretaryId: '',
    remark: ''
  })
  dialog.visible = true
}

const openEditDialog = (row) => {
  dialog.isEdit = true
  dialog.editId = row.id
  Object.assign(form, {
    batchNo: row.batchNo,
    batchType: row.batchType,
    collegeId: row.collegeId ? String(row.collegeId) : '',
    defenseDate: row.defenseDate || '',
    mode: row.mode || 'offline',
    location: row.location || '',
    leaderId: row.leaderId ? String(row.leaderId) : '',
    secretaryId: row.secretaryId ? String(row.secretaryId) : '',
    remark: row.remark || ''
  })
  dialog.visible = true
}

const buildPayload = () => {
  const data = {
    batchNo: form.batchNo.trim(),
    batchType: form.batchType,
    defenseDate: form.defenseDate,
    mode: form.mode,
    remark: form.remark || null
  }
  // 雪花 ID 按字符串传；空值不传，避免把「全校」「待定」写成空串
  if (form.collegeId) data.collegeId = form.collegeId
  if (form.leaderId) data.leaderId = form.leaderId
  if (form.secretaryId) data.secretaryId = form.secretaryId
  if (form.location && form.location.trim()) data.location = form.location.trim()
  return data
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  dialog.submitting = true
  try {
    const data = buildPayload()
    if (dialog.isEdit) {
      await updateDefenseBatch(dialog.editId, data)
      ElMessage.success('答辩批次更新成功')
    } else {
      await createDefenseBatch(data)
      ElMessage.success('答辩批次创建成功')
    }
    dialog.visible = false
    fetchBatches()
  } finally {
    dialog.submitting = false
  }
}

// ==================== 删除 ====================
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除批次「${row.batchNo}」吗？仅筹备中状态的批次可删除，删除后不可恢复。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  ).then(async () => {
    await deleteDefenseBatch(row.id)
    ElMessage.success('答辩批次删除成功')
    fetchBatches()
  }).catch(() => {})
}

// ==================== 展示辅助（defense_* 字典驱动，本地兜底） ====================
const batchTypeOptions = useDefenseDictOptions(DICT_BATCH_TYPE)
const batchStatusOptions = useDefenseDictOptions(DICT_BATCH_STATUS)
const modeOptions = useDefenseDictOptions(DICT_MODE)

// 字典加载失败时兜底，保证筛选与表单始终可用；取值与 P3 播种 SQL 对齐
const localBatchTypeOptions = [
  { value: 'mid_term', label: '中期答辩' },
  { value: 'final', label: '终期答辩' }
]
const localBatchStatusOptions = [
  { value: 0, label: '筹备中' },
  { value: 1, label: '进行中' },
  { value: 2, label: '已结束' }
]
const localModeOptions = [
  { value: 'offline', label: '线下答辩' },
  { value: 'online', label: '线上答辩' }
]
const batchTypeOpts = computed(() => (batchTypeOptions.value.length ? batchTypeOptions.value : localBatchTypeOptions))
const batchStatusOpts = computed(() => (batchStatusOptions.value.length ? batchStatusOptions.value : localBatchStatusOptions))
const modeOpts = computed(() => (modeOptions.value.length ? modeOptions.value : localModeOptions))

const batchTypeText = (v) =>
  getDefenseDictText(DICT_BATCH_TYPE, v, v === 'final' ? '终期答辩' : v === 'mid_term' ? '中期答辩' : v || '—')
const modeText = (v) =>
  getDefenseDictText(DICT_MODE, v, v === 'online' ? '线上答辩' : v === 'offline' ? '线下答辩' : v || '—')
const statusText = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  return getDefenseDictText(DICT_BATCH_STATUS, v, { 0: '筹备中', 1: '进行中', 2: '已结束' }[v] ?? '—')
}
const statusTagType = (v) => ({ 0: 'info', 1: 'primary', 2: 'success' }[v] || 'info')

const formatDateTime = (val) => {
  if (!val) return '—'
  return String(val).replace('T', ' ').slice(0, 16)
}

onMounted(async () => {
  fetchBatches()
  // defense_* 字典：失败不阻塞页面（文案走本地兜底，选项走兜底数组；拦截器已 toast）
  loadDefenseDict(DICT_BATCH_TYPE).catch(() => {})
  loadDefenseDict(DICT_BATCH_STATUS).catch(() => {})
  loadDefenseDict(DICT_MODE).catch(() => {})
  // 学院与教师候选项失败不阻塞列表本身（全局拦截器已 toast）
  getColleges().then((res) => {
    // /api/common/dict/colleges 返回 {code,label,value}，value 为学院 ID，映射为页面使用的 id/collegeName
    colleges.value = (res.data || []).map((c) => ({ id: c.value, collegeName: c.label, code: c.code }))
  }).catch(() => {})
  getReviewWorkflowTeachers().then((res) => {
    teachers.value = res.data || []
  }).catch(() => {})
})
</script>

<style scoped lang="scss">
.defense-batches {
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

.head-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 600;
}

.head-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-item {
  width: 160px;
}

.filter-college {
  width: 210px;
}

.batch-table {
  width: 100%;
}

.loc-cell {
  margin-right: 8px;
}

.mode-tag {
  margin-left: 0;
}

.sep {
  margin: 0 6px;
  color: var(--apple-divider-soft);
}

.stat-cell {
  font-variant-numeric: tabular-nums;
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
</style>
