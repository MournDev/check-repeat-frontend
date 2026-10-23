<template>
  <div class="knowledge-admin">
    <ListPageShell
      v-model:page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      :show-pagination="total > pageSize"
      @size-change="fetchList"
      @page-change="fetchList"
    >
      <template #filters>
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文章..."
            :prefix-icon="Search"
            clearable
            style="width: 240px"
            @keyup.enter="fetchList"
            @clear="fetchList"
          />
          <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px" @change="fetchList">
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已归档" value="ARCHIVED" />
          </el-select>
        </div>
      </template>

      <template #header-extra>
        <el-button type="primary" :icon="Plus" @click="openEditor(null)">新增文章</el-button>
      </template>

      <el-table :data="articles" v-loading="loading" stripe style="width: 100%">
      <el-table-column type="index" :index="(idx) => (page - 1) * pageSize + idx + 1" label="序号" width="70" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="authorName" label="作者" width="100" />
      <el-table-column prop="categoryName" label="分类" width="100" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览" width="80" align="right" />
      <el-table-column prop="createTime" label="创建时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.createTime, 'YYYY-MM-DD HH:mm') }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openEditor(row)">编辑</el-button>
          <el-button
            v-if="row.status !== 'PUBLISHED'"
            size="small"
            text
            type="success"
            @click="changeStatus(row, 'PUBLISHED')"
          >发布</el-button>
          <el-button
            v-if="row.status === 'PUBLISHED'"
            size="small"
            text
            type="warning"
            @click="changeStatus(row, 'ARCHIVED')"
          >下架</el-button>
          <el-popconfirm title="确定删除？" @confirm="doDelete(row.id)">
            <template #reference>
              <el-button size="small" text type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    </ListPageShell>

    <!-- 编辑抽屉 -->
    <el-drawer
      v-model="editorVisible"
      :title="editingId ? '编辑文章' : '新增文章'"
      size="700px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top" class="editor-form">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="文章标题" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="摘要（选填）" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="用逗号分隔多个标签" />
        </el-form-item>
        <el-form-item label="内容 (Markdown)" required>
          <div class="editor-layout">
            <div class="editor-pane">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="18"
                placeholder="使用 Markdown 语法编写文章内容..."
              />
            </div>
            <div class="preview-pane markdown-body" v-html="previewHtml"></div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button @click="saveDraft" :loading="saving">保存草稿</el-button>
        <el-button type="primary" @click="saveArticle('PUBLISHED')" :loading="saving">发布</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  adminListArticles, adminCreateArticle, adminUpdateArticle,
  adminDeleteArticle, adminUpdateArticleStatus
} from '@/api/knowledge'
import { getCategories } from '@/api/knowledge'
import { ElMessage } from 'element-plus'
import { renderMarkdown } from '@/utils/markdown'
import { formatDateTime } from '@/utils/dataType.js'
import ListPageShell from '@/components/common/ListPageShell.vue'

const articles = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const filterStatus = ref('')

// 编辑状态
const editorVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const categories = ref([])
const form = ref({ title: '', content: '', summary: '', categoryId: null, tags: '', status: 'DRAFT' })

const previewHtml = computed(() => {
  if (!form.value.content) return '<p style="color:var(--app-color-text-secondary)">预览区域</p>'
  return renderMarkdown(form.value.content)
})

onMounted(async () => {
  await loadCategories()
  await fetchList()
})

async function loadCategories() {
  try {
    const res = await getCategories()
    if (res?.code === 200) categories.value = res.data
  } catch (e) {
    console.error('加载分类失败:', e)
    ElMessage.error('加载分类失败')
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value) params.status = filterStatus.value
    const res = await adminListArticles(params)
    if (res?.code === 200) {
      // 后端统一返回 MyBatis-Plus Page：{ records, total, size, current, pages }
      articles.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('加载文章列表失败:', e)
    ElMessage.error('加载文章列表失败')
  } finally { loading.value = false }
}

function openEditor(row) {
  if (row) {
    editingId.value = row.id
    form.value = {
      title: row.title,
      content: row.content,
      summary: row.summary,
      categoryId: row.categoryId,
      tags: row.tags,
      status: row.status,
    }
  } else {
    editingId.value = null
    form.value = { title: '', content: '', summary: '', categoryId: null, tags: '', status: 'DRAFT' }
  }
  editorVisible.value = true
}

async function saveArticle(status) {
  saving.value = true
  try {
    const payload = { ...form.value, status }
    if (editingId.value) {
      await adminUpdateArticle(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await adminCreateArticle(payload)
      ElMessage.success('创建成功')
    }
    editorVisible.value = false
    await fetchList()
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

async function saveDraft() {
  await saveArticle('DRAFT')
}

async function changeStatus(row, status) {
  try {
    await adminUpdateArticleStatus(row.id, status)
    row.status = status
    ElMessage.success(status === 'PUBLISHED' ? '已发布' : '已下架')
  } catch { ElMessage.error('操作失败') }
}

async function doDelete(id) {
  try {
    await adminDeleteArticle(id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch { ElMessage.error('删除失败') }
}

function statusType(s) {
  return s === 'PUBLISHED' ? 'success' : s === 'DRAFT' ? 'info' : 'warning'
}
function statusLabel(s) {
  return s === 'PUBLISHED' ? '已发布' : s === 'DRAFT' ? '草稿' : '已归档'
}
</script>

<style scoped>
.knowledge-admin { padding: 4px 0; font-family: var(--app-font-family); }
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-4); gap: var(--app-space-3); }
.toolbar-left { display: flex; gap: var(--app-space-3); align-items: center; }
.kb-pagination { display: flex; justify-content: center; margin-top: var(--app-space-4); }

.editor-form { padding: 0 4px; }
.editor-layout { display: flex; gap: var(--app-space-4); width: 100%; }
.editor-pane { flex: 1; min-width: 0; }
.editor-pane :deep(.el-textarea__inner) { font-family: 'JetBrains Mono', monospace; font-size: var(--app-fs-caption); }
.preview-pane {
  flex: 1; min-width: 0; padding: var(--app-space-3); border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md); background: var(--app-color-fill-light); overflow-y: auto; max-height: 440px;
  font-size: var(--app-fs-caption); line-height: 1.7;
}
.preview-pane :deep(h2) { font-size: var(--app-fs-body); margin: var(--app-space-4) 0 var(--app-space-2); }
.preview-pane :deep(h3) { font-size: var(--app-fs-caption); }
.preview-pane :deep(table) { width: 100%; border-collapse: collapse; }
.preview-pane :deep(th), .preview-pane :deep(td) { border: 1px solid var(--app-color-border); padding: var(--app-space-1) var(--app-space-2); font-size: var(--app-fs-meta); }
.preview-pane :deep(th) { background: var(--app-color-divider); }
.preview-pane :deep(code) { background: var(--app-color-border); padding: 2px 5px; border-radius: var(--app-radius-xs); font-size: var(--app-fs-meta); }
.preview-pane :deep(pre) { background: var(--app-color-ink); color: var(--app-color-border-soft); padding: 10px; border-radius: var(--app-radius-sm); overflow-x: auto; }
.preview-pane :deep(pre code) { background: none; padding: 0; }
.preview-pane :deep(blockquote) { border-left: 3px solid var(--app-color-primary-on-dark); padding: var(--app-space-1) var(--app-space-3); margin: var(--app-space-2) 0; background: var(--app-color-info-bg); }

@media (max-width: 768px) {
  .editor-layout { flex-direction: column; }
}
</style>
