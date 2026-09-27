<template>
  <div class="template-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">消息模板管理</h1>
        <p class="page-desc">管理系统通知的消息模板，支持变量渲染预览</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">新增模板</el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="模板类型">
          <el-input v-model="filterForm.templateType" placeholder="请输入模板类型" clearable style="width: 160px" @change="fetchList" />
        </el-form-item>
        <el-form-item label="模板名称">
          <el-input v-model="filterForm.templateName" placeholder="请输入模板名称" clearable style="width: 160px" @change="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="templateList" v-loading="loading" stripe style="width: 100%">
        <el-table-column type="index" :index="(idx) => (currentPage - 1) * pageSize + idx + 1" label="序号" width="70" />
        <el-table-column prop="templateCode" label="模板编码" width="160" show-overflow-tooltip />
        <el-table-column prop="templateName" label="模板名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="templateType" label="模板类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.templateType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="titleTemplate" label="标题模板" min-width="200" show-overflow-tooltip />
        <el-table-column label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" :active-value="1" :inactive-value="0" @change="handleToggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" text type="success" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" @size-change="handleSizeChange" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="模板编码" prop="templateCode">
          <el-input v-model="form.templateCode" placeholder="如: SUBMIT_SUCCESS" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="form.templateName" placeholder="如: 提交通知" />
        </el-form-item>
        <el-form-item label="模板类型" prop="templateType">
          <el-input v-model="form.templateType" placeholder="如: 通知、提醒、告警" />
        </el-form-item>
        <el-form-item label="标题模板" prop="titleTemplate">
          <el-input v-model="form.titleTemplate" placeholder="如: 论文提交成功通知" />
        </el-form-item>
        <el-form-item label="内容模板" prop="contentTemplate">
          <el-input v-model="form.contentTemplate" type="textarea" :rows="6" placeholder="支持变量: ${userName}, ${paperTitle}, ${submitTime} 等" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="模板预览" width="600px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="变量输入">
          <el-input v-model="previewVars" type="textarea" :rows="4" placeholder='JSON格式，如: {"userName": "张三", "paperTitle": "毕业论文"}' />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRender">渲染预览</el-button>
        </el-form-item>
      </el-form>
      <el-divider v-if="renderResult" />
      <div v-if="renderResult" class="preview-result">
        <div class="preview-title">
          <strong>渲染标题:</strong> {{ renderResult.title }}
        </div>
        <div class="preview-content">
          <strong>渲染内容:</strong>
          <div class="content-box">{{ renderResult.content }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTemplateList, createTemplate, updateTemplate, deleteTemplate, toggleTemplateStatus, renderTemplate } from '@/api/admin/templates'

const loading = ref(false)
const templateList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const previewVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentTemplate = ref(null)
const previewVars = ref('')
const renderResult = ref(null)

const filterForm = reactive({
  templateType: '',
  templateName: ''
})

const form = reactive({
  id: null,
  templateCode: '',
  templateName: '',
  templateType: '',
  titleTemplate: '',
  contentTemplate: '',
  isActive: 1
})

const rules = {
  templateCode: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  templateType: [{ required: true, message: '请输入模板类型', trigger: 'blur' }],
  titleTemplate: [{ required: true, message: '请输入标题模板', trigger: 'blur' }],
  contentTemplate: [{ required: true, message: '请输入内容模板', trigger: 'blur' }]
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = { pageNum: currentPage.value, pageSize: pageSize.value }
    if (filterForm.templateType) params.templateType = filterForm.templateType
    if (filterForm.templateName) params.templateName = filterForm.templateName
    const res = await getTemplateList(params)
    if (res.code === 200 && res.data) {
      templateList.value = res.data.records || res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    console.error('查询模板列表失败', e)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.templateType = ''
  filterForm.templateName = ''
  currentPage.value = 1
  fetchList()
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchList()
}

const resetForm = () => {
  form.id = null
  form.templateCode = ''
  form.templateName = ''
  form.templateType = ''
  form.titleTemplate = ''
  form.contentTemplate = ''
  form.isActive = 1
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.id = row.id
  form.templateCode = row.templateCode
  form.templateName = row.templateName
  form.templateType = row.templateType
  form.titleTemplate = row.titleTemplate
  form.contentTemplate = row.contentTemplate
  form.isActive = row.isActive
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    const data = { ...form }
    let res
    if (isEdit.value) {
      res = await updateTemplate(data)
    } else {
      res = await createTemplate(data)
    }
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchList()
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除模板"${row.templateName}"吗？`, '确认删除', { type: 'warning' })
    const res = await deleteTemplate(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchList()
    }
  } catch {}
}

const handleToggleStatus = async (row) => {
  try {
    const res = await toggleTemplateStatus(row.id, row.isActive)
    if (res.code === 200) {
      ElMessage.success(row.isActive === 1 ? '已启用' : '已禁用')
    } else {
      row.isActive = row.isActive === 1 ? 0 : 1
    }
  } catch {
    row.isActive = row.isActive === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

const handlePreview = (row) => {
  currentTemplate.value = row
  previewVars.value = ''
  renderResult.value = null
  previewVisible.value = true
}

const handleRender = async () => {
  if (!currentTemplate.value) return
  let variables = {}
  try {
    if (previewVars.value.trim()) {
      variables = JSON.parse(previewVars.value)
    }
  } catch {
    ElMessage.error('变量格式错误，请输入有效的JSON')
    return
  }
  try {
    const res = await renderTemplate(currentTemplate.value.templateCode, variables)
    if (res.code === 200 && res.data) {
      renderResult.value = {
        title: res.data.title || res.data.titleTemplate || currentTemplate.value.titleTemplate,
        content: res.data.content || res.data.contentTemplate || currentTemplate.value.contentTemplate
      }
    }
  } catch {
    ElMessage.error('渲染失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.template-management { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; margin: 0 0 4px 0; }
.page-desc { color: #909399; margin: 0; font-size: 14px; }
.header-actions { display: flex; gap: 8px; }
.filter-card { margin-bottom: 16px; }
.table-card { margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.preview-result { padding: 12px; background: #f5f7fa; border-radius: 8px; }
.preview-title { margin-bottom: 12px; }
.preview-content .content-box { margin-top: 8px; padding: 12px; background: #fff; border: 1px solid #dcdfe6; border-radius: 4px; white-space: pre-wrap; line-height: 1.6; }
</style>
