<template>
  <div class="knowledge-admin">
    <div class="page-toolbar">
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
      <el-button type="primary" :icon="Plus" @click="openEditor(null)">新增文章</el-button>
    </div>

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
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
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

    <div class="kb-pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50]"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

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
          <el-select v-model="form.category_id" placeholder="选择分类" style="width: 100%">
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

const articles = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const searchKeyword = ref('')
const filterStatus = ref('')

// 编辑状态
const editorVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const categories = ref([])
const form = ref({ title: '', content: '', summary: '', category_id: null, tags: '', status: 'DRAFT' })

const previewHtml = computed(() => {
  if (!form.value.content) return '<p style="color:#999">预览区域</p>'
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
    const params = { page: page.value, size: pageSize }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value) params.status = filterStatus.value
    const res = await adminListArticles(params)
    if (res?.code === 200) {
      articles.value = res.data?.items || []
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
      category_id: row.category_id,
      tags: row.tags,
      status: row.status,
    }
  } else {
    editingId.value = null
    form.value = { title: '', content: '', summary: '', category_id: null, tags: '', status: 'DRAFT' }
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
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.knowledge-admin { padding: 4px 0; }
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
.toolbar-left { display: flex; gap: 12px; align-items: center; }
.kb-pagination { display: flex; justify-content: center; margin-top: 20px; }

.editor-form { padding: 0 4px; }
.editor-layout { display: flex; gap: 16px; width: 100%; }
.editor-pane { flex: 1; min-width: 0; }
.editor-pane :deep(.el-textarea__inner) { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
.preview-pane {
  flex: 1; min-width: 0; padding: 12px; border: 1px solid #e0e0e0;
  border-radius: 8px; background: #fafafa; overflow-y: auto; max-height: 440px;
  font-size: 14px; line-height: 1.7;
}
.preview-pane :deep(h2) { font-size: 16px; margin: 16px 0 8px; }
.preview-pane :deep(h3) { font-size: 14px; }
.preview-pane :deep(table) { width: 100%; border-collapse: collapse; }
.preview-pane :deep(th), .preview-pane :deep(td) { border: 1px solid #ddd; padding: 4px 8px; font-size: 13px; }
.preview-pane :deep(th) { background: #f0f0f0; }
.preview-pane :deep(code) { background: #eee; padding: 2px 5px; border-radius: 3px; font-size: 12px; }
.preview-pane :deep(pre) { background: #1e1e1e; color: #d4d4d4; padding: 10px; border-radius: 6px; overflow-x: auto; }
.preview-pane :deep(pre code) { background: none; padding: 0; }
.preview-pane :deep(blockquote) { border-left: 3px solid #2997ff; padding: 4px 12px; margin: 8px 0; background: #f0f6ff; }
</style>