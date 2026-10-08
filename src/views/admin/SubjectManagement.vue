<template>
  <div class="subject-management">
    <div class="page-header">
      <h1 class="page-title">学科领域管理</h1>
      <p class="page-desc">
        学科领域只支持两级：一级门类与二级学科。论文的学科领域、相似度阈值、教师研究方向都用这一套取值域。
      </p>
    </div>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">学科领域列表</span>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              placeholder="按名称或编码筛选"
              clearable
              style="width: 200px"
            />
            <el-button type="primary" @click="openCreateDialog">新增学科领域</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredTree"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children' }"
        style="width: 100%"
      >
        <!-- 树形表格的展开箭头只画在第一列，所以名称必须排在第一位 -->
        <el-table-column prop="name" label="名称" min-width="200" />
        <el-table-column prop="code" label="编码" width="180">
          <template #default="{ row }">
            <span class="code-text">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column label="层级" width="110">
          <template #default="{ row }">
            <el-tag :type="row.level === 1 ? 'primary' : 'info'" size="small">
              {{ row.level === 1 ? '一级门类' : '二级学科' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortNo" label="排序" width="80" />
        <el-table-column label="引用" width="110">
          <template #default="{ row }">
            <!-- 0 也要显式写出来：空白会让人以为是"还没查"，而它其实是"没被任何东西用" -->
            <span :class="{ 'ref-zero': !row.referenceCount }">{{ row.referenceCount || 0 }} 处</span>
          </template>
        </el-table-column>
        <el-table-column label="启用状态" width="110">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              :active-value="1"
              :inactive-value="0"
              active-color="#13ce66"
              inactive-color="#ff4949"
              @change="handleToggleEnabled(row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑学科领域' : '新增学科领域'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="层级" prop="level">
          <el-radio-group v-model="form.level" :disabled="!!form.id" @change="handleLevelChange">
            <el-radio :label="1">一级门类</el-radio>
            <el-radio :label="2">二级学科</el-radio>
          </el-radio-group>
          <div v-if="form.id" class="form-tip">层级与所属门类创建后不可调整</div>
        </el-form-item>

        <el-form-item v-if="form.level === 2" label="上级门类" prop="parentId">
          <el-select
            v-model="form.parentId"
            placeholder="请选择上级门类"
            :disabled="!!form.id"
            style="width: 100%"
          >
            <el-option
              v-for="parent in parentOptions"
              :key="parent.id"
              :label="parent.name"
              :value="parent.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="编码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="如 ENG、ENG-CS"
            maxlength="50"
            :disabled="!!form.id"
          />
          <div class="form-tip">
            只允许大写字母、数字和连字符。论文里存的就是这个编码，创建后不可修改。
          </div>
        </el-form-item>

        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如 工学、人工智能" maxlength="128" show-word-limit />
        </el-form-item>

        <el-form-item label="排序" prop="sortNo">
          <el-input-number v-model="form.sortNo" :min="0" :max="9999" />
          <div class="form-tip">数值越小越靠前；留空则排在同级末尾</div>
        </el-form-item>

        <el-form-item label="启用状态" prop="isEnabled">
          <el-switch v-model="form.isEnabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
          <div class="form-tip">停用后不再出现在论文提交与阈值配置的候选中，已被引用的数据不受影响</div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getSubjectTree,
  createSubject,
  updateSubject,
  setSubjectEnabled,
  deleteSubject
} from '@/api/admin/subject'

const loading = ref(false)
const submitting = ref(false)
const subjectTree = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  level: 1,
  parentId: '',
  code: '',
  name: '',
  sortNo: undefined,
  isEnabled: 1
})

const rules = {
  code: [
    { required: true, message: '请输入学科编码', trigger: 'blur' },
    {
      pattern: /^[A-Z0-9-]+$/,
      // 小写要在这里就拦住：后端也只收大写，但让管理员在本地就看到原因，
      // 比提交后弹一条后端文案强（而且 ENG-CS 与 eng-cs 真的是两个学科）
      message: '只能包含大写字母、数字和连字符（如 ENG-CS）',
      trigger: 'blur'
    }
  ],
  name: [{ required: true, message: '请输入学科名称', trigger: 'blur' }],
  parentId: [{ required: true, message: '请选择上级门类', trigger: 'change' }]
}

// 上级门类候选：只有一级门类能当父节点（后端也拒绝三级）
const parentOptions = computed(() => subjectTree.value.filter(node => node.level === 1))

// 客户端筛选。命中门类时把它整枝留下；命中二级时保留其门类作为上下文。
// 注意这里产出的节点是**副本**（{...node}）——所以行上的所有写操作都必须
// 走 row.id 去后端改、然后整树重拉，不能指望改副本能同步回原树。
const filteredTree = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return subjectTree.value

  const hit = (node) =>
    (node.name || '').toLowerCase().includes(kw) || (node.code || '').toLowerCase().includes(kw)

  const walk = (nodes) => (nodes || []).flatMap(node => {
    const children = walk(node.children)
    if (!hit(node) && !children.length) return []
    return [{ ...node, children: children.length ? children : node.children }]
  })

  return walk(subjectTree.value)
})

const fetchTree = async () => {
  loading.value = true
  try {
    const res = await getSubjectTree()
    if (res.code === 200) {
      subjectTree.value = res.data || []
    } else {
      ElMessage.error(res.message || '加载学科领域失败')
    }
  } catch (error) {
    // 不重复弹提示：request 拦截器已按状态码弹过
    console.error('加载学科领域失败:', error)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.id = null
  form.level = 1
  form.parentId = ''
  form.code = ''
  form.name = ''
  form.sortNo = undefined
  form.isEnabled = 1
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  resetForm()
  form.id = row.id
  form.level = row.level
  form.parentId = row.parentId || ''
  form.code = row.code
  form.name = row.name
  form.sortNo = row.sortNo
  form.isEnabled = row.isEnabled
  dialogVisible.value = true
}

const handleLevelChange = (level) => {
  if (level === 1) {
    form.parentId = ''
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  // validate() 返回 Promise：用 catch 兜住校验失败，别让它变成 unhandled rejection
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    // parentId 只在二级学科时提交。编辑一级门类时它留空，后端把"没传"当成"不修改"。
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      parentId: form.level === 2 ? form.parentId : null,
      isEnabled: form.isEnabled
    }
    if (form.sortNo !== undefined && form.sortNo !== null) {
      payload.sortNo = form.sortNo
    }

    const res = form.id
      ? await updateSubject(form.id, payload)
      : await createSubject(payload)

    if (res.code === 200) {
      ElMessage.success(form.id ? '修改成功' : '新增成功')
      dialogVisible.value = false
      await fetchTree()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存学科领域失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleToggleEnabled = async (row, value) => {
  try {
    const res = await setSubjectEnabled(row.id, value === 1)
    if (res.code === 200) {
      ElMessage.success(value === 1 ? '已启用' : '已停用')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('启用/停用学科领域失败:', error)
  } finally {
    // 无论成败都重拉：失败时把开关拨回去（本地 v-model 已经先动了），
    // 成功时也让表格与服务端保持一致
    await fetchTree()
  }
}

const handleDelete = async (row) => {
  // 先在本地把"为什么可能删不掉"讲清楚，别让管理员点了才吃一个报错。
  // 但真正裁决在后端（这份数据可能是几分钟前拉的）。
  if (row.hasChildren) {
    ElMessage.warning(`「${row.name}」下还有二级学科，请先删除它们`)
    return
  }
  if (row.referenceCount > 0) {
    ElMessage.warning(
      `「${row.name}」已被 ${row.referenceCount} 处引用（论文 / 阈值配置 / 教师研究方向 / 专业映射），不能删除。如不再使用请改为「停用」。`
    )
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除学科领域「${row.name}」（${row.code}）吗？删除后不可恢复。`,
      '删除学科领域',
      { type: 'warning' }
    )
  } catch {
    return
  }

  try {
    const res = await deleteSubject(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await fetchTree()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除学科领域失败:', error)
    // 本地没查出引用、后端却拒绝了（例如刚被引用）：刷新让表格反映真实状态
    await fetchTree()
  }
}

onMounted(() => {
  fetchTree()
})
</script>

<style scoped>
.subject-management {
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
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.code-text {
  font-family: Consolas, Monaco, monospace;
}
.ref-zero {
  color: #909399;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
