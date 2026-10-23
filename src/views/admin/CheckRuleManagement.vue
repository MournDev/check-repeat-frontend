<template>
  <div class="check-rule-management">
    <PageHeader description="管理论文查重的规则配置，包括阈值、次数限制和关联比对库" />

    <ListPageShell
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      title="规则列表"
      :total="total"
      :page-sizes="[10, 20, 50]"
      :show-pagination="total > pageSize"
      @size-change="fetchList"
      @page-change="fetchList"
    >
      <template #filters>
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="规则名称">
          <el-input v-model="filterForm.ruleName" placeholder="搜索规则名称" clearable style="width: 200px" @keyup.enter="fetchList" @clear="fetchList" />
        </el-form-item>
        <el-form-item label="是否默认">
          <el-select v-model="filterForm.isDefault" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
      </template>

      <template #header-extra>
        <el-button type="primary" @click="openDialog(null)">新增规则</el-button>
      </template>

      <el-table :data="ruleList" v-loading="loading" stripe style="width: 100%">
        <el-table-column type="index" :index="(idx) => (currentPage - 1) * pageSize + idx + 1" label="序号" width="70" />
        <el-table-column prop="ruleName" label="规则名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="ruleCode" label="规则编码" width="160" show-overflow-tooltip />
        <el-table-column label="最大查重次数" width="120" align="center">
          <template #default="{ row }">
            {{ row.maxCheckCount }}次
          </template>
        </el-table-column>
        <el-table-column label="查重间隔" width="110" align="center">
          <template #default="{ row }">
            {{ formatInterval(row.checkInterval) }}
          </template>
        </el-table-column>
        <el-table-column label="是否默认" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isDefault === 1 ? 'success' : 'info'" size="small">
              {{ row.isDefault === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联比对库" min-width="200">
          <template #default="{ row }">
            <template v-if="row.compareLibNames">
              <el-tag v-for="name in row.compareLibNames.split(',')" :key="name" size="small" class="lib-tag">{{ name.trim() }}</el-tag>
            </template>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

    </ListPageShell>

    <ListPageShell
      v-model:page="quotaCurrentPage"
      v-model:page-size="quotaPageSize"
      title="学院查重额度"
      :total="quotaTotal"
      :page-sizes="[10, 20, 50]"
      :show-pagination="quotaTotal > quotaPageSize"
      @size-change="handleQuotaSearch"
      @page-change="fetchQuotaList"
    >
      <template #filters>
      <el-form label-width="80px" inline class="quota-filter">
        <el-form-item label="额度月份">
          <el-date-picker
            v-model="quotaFilter.quotaMonth"
            type="month"
            value-format="YYYY-MM"
            placeholder="选择月份"
            :clearable="false"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuotaSearch">查询</el-button>
        </el-form-item>
      </el-form>
      </template>

      <template #header-extra>
        <el-button type="primary" @click="openQuotaDialog(null)">新增额度</el-button>
      </template>

      <el-table :data="quotaList" v-loading="quotaLoading" stripe style="width: 100%">
        <el-table-column prop="collegeName" label="学院" min-width="180" show-overflow-tooltip />
        <el-table-column prop="quotaMonth" label="额度月份" width="110" align="center" />
        <el-table-column prop="totalQuota" label="总额度(次)" width="110" align="center" />
        <el-table-column prop="usedQuota" label="已用(次)" width="110" align="center" />
        <el-table-column label="使用进度" min-width="200">
          <template #default="{ row }">
            <el-progress :percentage="quotaPercent(row)" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openQuotaDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="当月暂无额度配置" />
        </template>
      </el-table>

    </ListPageShell>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑规则' : '新增规则'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="form.ruleName" placeholder="如：本科毕业论文规则" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="规则编码" prop="ruleCode">
          <el-input v-model="form.ruleCode" placeholder="如：UNDERGRADUATE" maxlength="50" show-word-limit :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="最大查重次数" prop="maxCheckCount">
          <el-input-number v-model="form.maxCheckCount" :min="1" :max="100" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="查重间隔(秒)" prop="checkInterval">
          <el-input-number v-model="form.checkInterval" :min="0" :max="604800" :step="3600" style="width: 100%" />
          <div class="form-tip">0表示无间隔限制，86400=1天</div>
        </el-form-item>
        <el-form-item label="关联比对库" prop="libIds">
          <el-select v-model="form.libIds" multiple placeholder="请选择比对库" style="width: 100%" :loading="libLoading">
            <el-option v-for="lib in libOptions" :key="lib.id" :label="lib.libName" :value="lib.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="规则描述（可选）" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑额度对话框 -->
    <el-dialog v-model="quotaDialogVisible" :title="quotaEditing ? '编辑额度' : '新增额度'" width="480px" destroy-on-close>
      <el-form ref="quotaFormRef" :model="quotaForm" :rules="quotaRules" label-width="100px">
        <el-form-item label="学院" prop="collegeId">
          <el-select v-model="quotaForm.collegeId" placeholder="请选择学院" filterable style="width: 100%" :disabled="quotaEditing">
            <el-option v-for="c in collegeOptions" :key="c.value" :label="c.label" :value="String(c.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="额度月份" prop="quotaMonth">
          <el-date-picker
            v-model="quotaForm.quotaMonth"
            type="month"
            value-format="YYYY-MM"
            placeholder="缺省当前月"
            :disabled="quotaEditing"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="总额度(次)" prop="totalQuota">
          <el-input-number v-model="quotaForm.totalQuota" :min="0" :max="1000000" :step="10" style="width: 100%" />
        </el-form-item>
        <div class="form-tip">同一学院同一月份重复保存将覆盖原额度</div>
      </el-form>
      <template #footer>
        <el-button @click="quotaDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="quotaSubmitting" @click="handleQuotaSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getCheckRuleList, saveOrUpdateCheckRule, deleteCheckRule, getRuleRelatedLibs, getCompareLibList } from '@/api/admin/config'
import { getColleges } from '@/api/admin/common'
import { getCheckQuotaList, saveCheckQuota } from '@/api/p5'
import PageHeader from '@/components/common/PageHeader.vue'
import ListPageShell from '@/components/common/ListPageShell.vue'

const loading = ref(false)
const submitting = ref(false)
const libLoading = ref(false)
const ruleList = ref([])
const libOptions = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  ruleName: '',
  isDefault: ''
})

const form = reactive({
  ruleName: '',
  ruleCode: '',
  maxCheckCount: 3,
  checkInterval: 0,
  libIds: [],
  isDefault: 0,
  description: ''
})

const rules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleCode: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  maxCheckCount: [{ required: true, message: '请输入最大查重次数', trigger: 'blur' }],
  checkInterval: [{ required: true, message: '请输入查重间隔', trigger: 'blur' }],
  libIds: [{ required: true, type: 'array', min: 1, message: '请至少选择一个比对库', trigger: 'change' }],
  isDefault: [{ required: true, message: '请选择是否默认', trigger: 'change' }]
}

const formatInterval = (seconds) => {
  if (!seconds || seconds === 0) return '无限制'
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  return `${Math.floor(seconds / 86400)}天`
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value
    }
    if (filterForm.ruleName) params.ruleName = filterForm.ruleName
    if (filterForm.isDefault !== '' && filterForm.isDefault !== null) params.isDefault = filterForm.isDefault

    const res = await getCheckRuleList(params)
    if (res.code === 200 && res.data) {
      ruleList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    console.error('查询规则列表失败', e)
  } finally {
    loading.value = false
  }
}

const fetchLibOptions = async () => {
  libLoading.value = true
  try {
    const res = await getCompareLibList({ currentPage: 1, pageSize: 1000 })
    if (res.code === 200 && res.data) {
      libOptions.value = res.data.records || []
    }
  } catch (e) {
    console.error('查询比对库列表失败', e)
  } finally {
    libLoading.value = false
  }
}

const resetFilter = () => {
  filterForm.ruleName = ''
  filterForm.isDefault = ''
  currentPage.value = 1
  fetchList()
}

const openDialog = async (row) => {
  await fetchLibOptions()
  if (row) {
    editingId.value = row.id
    form.ruleName = row.ruleName
    form.ruleCode = row.ruleCode
    form.maxCheckCount = row.maxCheckCount
    form.checkInterval = row.checkInterval || 0
    form.isDefault = row.isDefault
    form.description = row.description || ''
    // 加载已关联的比对库
    try {
      const res = await getRuleRelatedLibs(row.id)
      if (res.code === 200 && res.data) {
        form.libIds = res.data.map(lib => lib.id)
      } else {
        form.libIds = []
      }
    } catch {
      form.libIds = []
    }
  } else {
    editingId.value = null
    form.ruleName = ''
    form.ruleCode = ''
    form.maxCheckCount = 3
    form.checkInterval = 0
    form.libIds = []
    form.isDefault = 0
    form.description = ''
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = { ...form }
    if (editingId.value) data.ruleId = editingId.value

    const res = await saveOrUpdateCheckRule(data)
    if (res.code === 200) {
      ElMessage.success(res.message || (editingId.value ? '编辑成功' : '新增成功'))
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败：' + (e.message || '网络异常'))
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除规则"${row.ruleName}"吗？删除后不可恢复。`, '确认删除', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    const res = await deleteCheckRule(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// ==================== 学院查重额度 ====================
const currentMonth = dayjs().format('YYYY-MM')

const quotaLoading = ref(false)
const quotaSubmitting = ref(false)
const quotaList = ref([])
const quotaTotal = ref(0)
const quotaCurrentPage = ref(1)
const quotaPageSize = ref(10)
const quotaDialogVisible = ref(false)
const quotaEditing = ref(false)
const quotaFormRef = ref(null)
const collegeOptions = ref([])

const quotaFilter = reactive({
  quotaMonth: currentMonth
})

const quotaForm = reactive({
  collegeId: '',
  totalQuota: 0,
  quotaMonth: currentMonth
})

const quotaRules = {
  collegeId: [{ required: true, message: '请选择学院', trigger: 'change' }],
  totalQuota: [{ required: true, message: '请输入总额度', trigger: 'blur' }]
}

const quotaPercent = (row) => {
  const total = Number(row.totalQuota) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.round(((Number(row.usedQuota) || 0) / total) * 100))
}

const fetchQuotaList = async () => {
  quotaLoading.value = true
  try {
    // 必须显式传 currentPage/pageSize（缺分页参数后端直接报错）
    const res = await getCheckQuotaList({
      quotaMonth: quotaFilter.quotaMonth || undefined,
      currentPage: quotaCurrentPage.value,
      pageSize: quotaPageSize.value
    })
    if (res.code === 200 && res.data) {
      quotaList.value = res.data.records || []
      quotaTotal.value = Number(res.data.total) || 0
    }
  } catch (e) {
    console.error('查询学院查重额度失败', e)
  } finally {
    quotaLoading.value = false
  }
}

const handleQuotaSearch = () => {
  quotaCurrentPage.value = 1
  fetchQuotaList()
}

const loadCollegeOptions = async () => {
  try {
    const res = await getColleges()
    if (res.code === 200) {
      collegeOptions.value = res.data || []
    }
  } catch (e) {
    console.error('获取学院列表失败', e)
  }
}

const openQuotaDialog = (row) => {
  if (row) {
    quotaEditing.value = true
    // 雪花 ID 按字符串回传
    quotaForm.collegeId = String(row.collegeId)
    quotaForm.totalQuota = Number(row.totalQuota) || 0
    quotaForm.quotaMonth = row.quotaMonth || currentMonth
  } else {
    quotaEditing.value = false
    quotaForm.collegeId = ''
    quotaForm.totalQuota = 0
    quotaForm.quotaMonth = currentMonth
  }
  quotaDialogVisible.value = true
}

const handleQuotaSubmit = async () => {
  if (!quotaFormRef.value) return
  const valid = await quotaFormRef.value.validate().catch(() => false)
  if (!valid) return

  quotaSubmitting.value = true
  try {
    // quotaMonth 留空时后端缺省当前月
    const data = {
      collegeId: quotaForm.collegeId,
      totalQuota: quotaForm.totalQuota
    }
    if (quotaForm.quotaMonth) data.quotaMonth = quotaForm.quotaMonth

    const res = await saveCheckQuota(data)
    if (res.code === 200) {
      ElMessage.success(res.message || '保存成功')
      quotaDialogVisible.value = false
      // 保存后若列表筛选月份与保存月份一致则立即可见；不一致时切到保存月份
      quotaFilter.quotaMonth = data.quotaMonth || currentMonth
      fetchQuotaList()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败：' + (e.message || '网络异常'))
  } finally {
    quotaSubmitting.value = false
  }
}

onMounted(() => {
  fetchList()
  fetchQuotaList()
  loadCollegeOptions()
})
</script>

<style scoped>
.check-rule-management {
  padding: 0;
  font-family: var(--app-font-family);
}
.lib-tag {
  margin: var(--app-space-1) var(--app-space-1) var(--app-space-1) 0;
}
.empty-text {
  color: var(--app-color-text-muted);
}
.form-tip {
  font-size: var(--app-fs-meta);
  color: var(--app-color-info);
  line-height: 1.5;
  margin-top: var(--app-space-1);
}
.quota-filter {
  margin-bottom: var(--app-space-2);
}
</style>
