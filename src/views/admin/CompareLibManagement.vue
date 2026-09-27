<template>
  <div class="compare-lib-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">比对库管理</h1>
        <p class="page-desc">管理查重系统使用的比对数据源（本地库/远程库）</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="库名称">
          <el-input v-model="filterForm.libName" placeholder="搜索比对库名称" clearable style="width: 200px" @keyup.enter="fetchList" @clear="fetchList" />
        </el-form-item>
        <el-form-item label="库类型">
          <el-select v-model="filterForm.libType" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option label="本地库" value="LOCAL" />
            <el-option label="远程库" value="REMOTE" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select v-model="filterForm.isEnabled" placeholder="全部" clearable style="width: 120px" @change="fetchList">
            <el-option label="已启用" :value="1" />
            <el-option label="已禁用" :value="0" />
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
          <span class="card-title">比对库列表</span>
          <el-button type="primary" @click="openDialog(null)">新增比对库</el-button>
        </div>
      </template>

      <el-table :data="libList" v-loading="loading" stripe style="width: 100%">
        <el-table-column type="index" :index="(idx) => (currentPage - 1) * pageSize + idx + 1" label="序号" width="70" />
        <el-table-column prop="libName" label="库名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="libCode" label="库编码" width="180" show-overflow-tooltip />
        <el-table-column label="库类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.libType === 'LOCAL' ? 'primary' : 'warning'" size="small">
              {{ row.libType === 'LOCAL' ? '本地库' : '远程库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="libUrl" label="库地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="启用状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.isEnabled" :active-value="1" :inactive-value="0" active-color="#13ce66" inactive-color="#ff4949" @change="handleToggleEnabled(row, $event)" />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" @size-change="fetchList" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑比对库' : '新增比对库'" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="库名称" prop="libName">
          <el-input v-model="form.libName" placeholder="如：校内本科论文库" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="库编码" prop="libCode">
          <el-input v-model="form.libCode" placeholder="如：CAMPUS_UNDERGRADUATE" maxlength="50" show-word-limit :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="库类型" prop="libType">
          <el-select v-model="form.libType" placeholder="请选择库类型" style="width: 100%">
            <el-option label="本地库" value="LOCAL" />
            <el-option label="远程库" value="REMOTE" />
          </el-select>
        </el-form-item>
        <el-form-item label="库地址" prop="libUrl">
          <el-input v-model="form.libUrl" :placeholder="form.libType === 'REMOTE' ? 'https://example.com/api/data' : '/data/compare-lib/campus/'" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="启用状态" prop="isEnabled">
          <el-switch v-model="form.isEnabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="比对库描述（可选）" maxlength="500" show-word-limit />
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
import { getCompareLibList, saveOrUpdateCompareLib, toggleLibEnabled } from '@/api/admin/config'

const loading = ref(false)
const submitting = ref(false)
const libList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  libName: '',
  libType: '',
  isEnabled: ''
})

const form = reactive({
  libName: '',
  libCode: '',
  libType: 'LOCAL',
  libUrl: '',
  isEnabled: 1,
  description: ''
})

const rules = {
  libName: [{ required: true, message: '请输入比对库名称', trigger: 'blur' }],
  libCode: [{ required: true, message: '请输入库编码', trigger: 'blur' }],
  libType: [{ required: true, message: '请选择库类型', trigger: 'change' }],
  libUrl: [{ required: true, message: '请输入库地址', trigger: 'blur' }],
  isEnabled: [{ required: true, message: '请选择启用状态', trigger: 'change' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value
    }
    if (filterForm.libName) params.libName = filterForm.libName
    if (filterForm.libType) params.libType = filterForm.libType
    if (filterForm.isEnabled !== '' && filterForm.isEnabled !== null) params.isEnabled = filterForm.isEnabled

    const res = await getCompareLibList(params)
    if (res.code === 200 && res.data) {
      libList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    console.error('查询比对库列表失败', e)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.libName = ''
  filterForm.libType = ''
  filterForm.isEnabled = ''
  currentPage.value = 1
  fetchList()
}

const openDialog = (row) => {
  if (row) {
    editingId.value = row.id
    form.libName = row.libName
    form.libCode = row.libCode
    form.libType = row.libType
    form.libUrl = row.libUrl
    form.isEnabled = row.isEnabled
    form.description = row.description || ''
  } else {
    editingId.value = null
    form.libName = ''
    form.libCode = ''
    form.libType = 'LOCAL'
    form.libUrl = ''
    form.isEnabled = 1
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
    if (editingId.value) data.libId = editingId.value

    const res = await saveOrUpdateCompareLib(data)
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

const handleToggleEnabled = async (row, val) => {
  try {
    const res = await toggleLibEnabled(row.id, val)
    if (res.code === 200) {
      ElMessage.success(val === 1 ? '已启用' : '已禁用')
    } else {
      // 回滚
      row.isEnabled = val === 1 ? 0 : 1
      if (res.message && res.message.includes('是否继续')) {
        await ElMessageBox.confirm(res.message, '提示', { type: 'warning', confirmButtonText: '继续', cancelButtonText: '取消' }).then(async () => {
          // 二次确认后强制执行（需要后端支持，此处仅提示）
          ElMessage.warning('请联系后端支持强制禁用')
        }).catch(() => {})
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    }
  } catch (e) {
    row.isEnabled = val === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.compare-lib-management {
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
</style>
