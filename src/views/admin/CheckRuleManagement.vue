<template>
  <div class="check-rule-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">查重规则管理</h1>
        <p class="page-desc">管理论文查重的规则配置，包括阈值、次数限制和关联比对库</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
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
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">规则列表</span>
          <el-button type="primary" @click="openDialog(null)">新增规则</el-button>
        </div>
      </template>

      <el-table :data="ruleList" v-loading="loading" stripe style="width: 100%">
        <el-table-column type="index" :index="(idx) => (currentPage - 1) * pageSize + idx + 1" label="序号" width="70" />
        <el-table-column prop="ruleName" label="规则名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="ruleCode" label="规则编码" width="160" show-overflow-tooltip />
        <el-table-column label="通过阈值" width="100" align="center">
          <template #default="{ row }">
            {{ row.passThreshold }}%
          </template>
        </el-table-column>
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

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" @size-change="fetchList" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑规则' : '新增规则'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="form.ruleName" placeholder="如：本科毕业论文规则" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="规则编码" prop="ruleCode">
          <el-input v-model="form.ruleCode" placeholder="如：UNDERGRADUATE" maxlength="50" show-word-limit :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="通过阈值(%)" prop="passThreshold">
          <el-input-number v-model="form.passThreshold" :min="0" :max="100" :precision="2" :step="1" style="width: 100%" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCheckRuleList, saveOrUpdateCheckRule, deleteCheckRule, getRuleRelatedLibs, getCompareLibList } from '@/api/admin/config'

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
  passThreshold: 20,
  maxCheckCount: 3,
  checkInterval: 0,
  libIds: [],
  isDefault: 0,
  description: ''
})

const rules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleCode: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  passThreshold: [{ required: true, message: '请输入通过阈值', trigger: 'blur' }],
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
    const res = await getCompareLibList({ pageSize: 1000 })
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
    form.passThreshold = row.passThreshold
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
    form.passThreshold = 20
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

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.check-rule-management {
  padding: 0;
}
.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px 0;
}
.page-desc {
  color: #909399;
  margin: 0;
  font-size: 14px;
}
.filter-card {
  margin-bottom: 16px;
}
.table-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 15px;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.lib-tag {
  margin: 2px 4px 2px 0;
}
.empty-text {
  color: #c0c4cc;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
