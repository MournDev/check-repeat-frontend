<template>
  <div class="knowledge-base">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="keyword"
        size="large"
        placeholder="搜索帮助文档..."
        :prefix-icon="Search"
        clearable
        @keyup.enter="onSearch"
        @clear="onSearch"
      >
        <template #append>
          <el-button :icon="Search" :loading="loading" @click="onSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <div class="kb-body" v-loading="loading">
      <!-- 左侧：分类 + 热门 -->
      <aside class="kb-sidebar">
        <!-- 分类导航 -->
        <el-card shadow="never" class="category-card">
          <template #header><span class="card-title">分类导航</span></template>
          <div
            v-for="cat in categories"
            :key="cat.code"
            :class="['category-item', { active: activeCategory === cat.code }]"
            @click="selectCategory(cat.code)"
          >
            <el-icon v-if="cat.icon"><component :is="cat.icon" /></el-icon>
            <span class="cat-name">{{ cat.name }}</span>
            <el-badge :value="cat.articleCount" :max="99" class="cat-badge" />
          </div>
          <div v-if="activeCategory" class="clear-filter" @click="selectCategory('')">
            清除筛选
          </div>
        </el-card>

        <!-- 热门文章 -->
        <el-card shadow="never" class="popular-card">
          <template #header><span class="card-title">热门文章</span></template>
          <div
            v-for="item in popularArticles"
            :key="item.id"
            class="popular-item"
            @click="openDetail(item.id)"
          >
            <el-icon><Notebook /></el-icon>
            <span class="pop-title">{{ item.title }}</span>
            <span class="pop-views">{{ item.viewCount }}次</span>
          </div>
        </el-card>
      </aside>

      <!-- 右侧：文章列表 / 文章详情 -->
      <main class="kb-main">
        <!-- 列表视图 -->
        <template v-if="!detailId">
          <div class="list-toolbar" v-if="articles.length > 0">
            <span class="list-info">共 {{ total }} 篇文章</span>
          </div>
          <div class="article-grid" v-if="articles.length > 0">
            <el-card
              v-for="item in articles"
              :key="item.id"
              shadow="hover"
              class="article-card"
              @click="openDetail(item.id)"
            >
              <h3 class="article-title">{{ item.title }}</h3>
              <p class="article-summary">{{ item.summary || item.content?.replace(/[#*>`\-\s]/g, '').slice(0, 120) }}</p>
              <div class="article-meta">
                <span><el-icon><View /></el-icon> {{ item.viewCount }}</span>
                <span><el-icon><Clock /></el-icon> {{ formatDate(item.createTime) }}</span>
              </div>
            </el-card>
          </div>
          <el-empty v-else description="暂无相关内容" :image-size="80" />

          <!-- 分页 -->
          <div class="kb-pagination" v-if="total > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="fetchArticles"
            />
          </div>
        </template>

        <!-- 详情视图 -->
        <template v-else>
          <div class="detail-header">
            <el-button :icon="ArrowLeft" @click="closeDetail" type="primary" link>返回列表</el-button>
          </div>
          <el-card shadow="never" class="detail-card" v-loading="detailLoading">
            <template v-if="detail">
              <h1 class="detail-title">{{ detail.title }}</h1>
              <div class="detail-meta">
                <span><el-icon><Clock /></el-icon> {{ formatDate(detail.createTime) }}</span>
                <span><el-icon><View /></el-icon> {{ detail.viewCount }} 次浏览</span>
                <span><el-icon><User /></el-icon> {{ detail.authorName }}</span>
              </div>
              <el-divider />
              <div class="markdown-body" v-html="renderedContent"></div>
            </template>
          </el-card>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  Search, Notebook, View, Clock, ArrowLeft, User,
  Document, QuestionFilled, Service, Upload
} from '@element-plus/icons-vue'
import {
  getCategories, getArticles, getPopular, getArticle, searchArticles
} from '@/api/knowledge'
import { renderMarkdown } from '@/utils/markdown'

// 状态
const keyword = ref('')
const categories = ref([])
const articles = ref([])
const total = ref(0)
const popularArticles = ref([])
const activeCategory = ref('')
const currentPage = ref(1)
const pageSize = 12
const loading = ref(false)
const detailId = ref(null)
const detail = ref(null)
const detailLoading = ref(false)

const renderedContent = computed(() => {
  if (!detail.value?.content) return ''
  return renderMarkdown(detail.value.content)
})

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchPopular(), fetchArticles()])
})

async function fetchCategories() {
  try {
    const res = await getCategories()
    if (res?.code === 200) categories.value = res.data || []
  } catch { /* ignore */ }
}

async function fetchPopular() {
  try {
    const res = await getPopular()
    if (res?.code === 200) popularArticles.value = res.data || []
  } catch { /* ignore */ }
}

async function fetchArticles() {
  loading.value = true
  try {
    const params = { page: currentPage.value, size: pageSize }
    if (activeCategory.value) params.category = activeCategory.value
    if (keyword.value) params.keyword = keyword.value
    const fn = keyword.value ? searchArticles : getArticles
    const res = await fn(params)
    if (res?.code === 200) {
      articles.value = res.data?.items || []
      total.value = res.data?.total || 0
    }
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function selectCategory(code) {
  activeCategory.value = activeCategory.value === code ? '' : code
  currentPage.value = 1
  fetchArticles()
}

function onSearch() {
  currentPage.value = 1
  fetchArticles()
}

async function openDetail(id) {
  detailId.value = id
  detailLoading.value = true
  try {
    const res = await getArticle(id)
    if (res?.code === 200) detail.value = res.data
  } catch { detail.value = null }
  finally { detailLoading.value = false }
}

function closeDetail() {
  detailId.value = null
  detail.value = null
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.knowledge-base { max-width: 1100px; margin: 0 auto; padding: 16px 24px; }
.search-bar { margin-bottom: 20px; }
.search-bar :deep(.el-input-group__append) { background: #2997ff; border-color: #2997ff; color: #fff; }

.kb-body { display: flex; gap: 20px; align-items: flex-start; }
.kb-sidebar { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
.kb-main { flex: 1; min-width: 0; }

.card-title { font-weight: 600; font-size: 14px; }

.category-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border-radius: 8px; cursor: pointer; transition: background 0.15s;
  font-size: 13px;
}
.category-item:hover { background: #f5f5f7; }
.category-item.active { background: #e8f0fe; color: #2997ff; font-weight: 500; }
.cat-name { flex: 1; }
.clear-filter { text-align: center; color: #999; font-size: 12px; cursor: pointer; margin-top: 8px; }

.popular-item {
  display: flex; align-items: center; gap: 8px; padding: 7px 0;
  cursor: pointer; font-size: 13px; border-bottom: 1px solid #f0f0f0;
}
.popular-item:last-child { border-bottom: none; }
.popular-item:hover { color: #2997ff; }
.pop-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pop-views { color: #999; font-size: 12px; flex-shrink: 0; }

.list-toolbar { margin-bottom: 12px; }
.list-info { font-size: 13px; color: #999; }

.article-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.article-card { cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
.article-card:hover { transform: translateY(-2px); }
.article-title { font-size: 15px; margin: 0 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.article-summary { font-size: 13px; color: #666; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.article-meta { display: flex; gap: 16px; font-size: 12px; color: #999; }
.article-meta span { display: flex; align-items: center; gap: 4px; }

.kb-pagination { display: flex; justify-content: center; margin-top: 24px; }

.detail-header { margin-bottom: 12px; }
.detail-card { padding: 24px; }
.detail-title { font-size: 22px; margin: 0 0 12px; }
.detail-meta { display: flex; gap: 20px; font-size: 13px; color: #999; }
.detail-meta span { display: flex; align-items: center; gap: 4px; }

/* 通用样式 */
.markdown-body { font-size: 15px; line-height: 1.8; color: #333; }
.markdown-body :deep(h2) { font-size: 18px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
.markdown-body :deep(h3) { font-size: 16px; margin: 20px 0 8px; }
.markdown-body :deep(p) { margin: 0 0 12px; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 20px; margin: 0 0 12px; }
.markdown-body :deep(li) { margin-bottom: 4px; }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin: 12px 0; }
.markdown-body :deep(th), .markdown-body :deep(td) { border: 1px solid #e8e8e8; padding: 8px 12px; text-align: left; font-size: 14px; }
.markdown-body :deep(th) { background: #fafafa; font-weight: 600; }
.markdown-body :deep(code) { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.markdown-body :deep(pre) { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; }
.markdown-body :deep(pre code) { background: none; padding: 0; }
.markdown-body :deep(blockquote) { border-left: 4px solid #2997ff; padding: 8px 16px; margin: 12px 0; background: #f0f6ff; color: #555; }
.markdown-body :deep(a) { color: #2997ff; }
.markdown-body :deep(hr) { border: none; border-top: 1px solid #eee; margin: 20px 0; }

@media (max-width: 768px) {
  .knowledge-base { padding: 12px 16px; }
  .kb-body { flex-direction: column; }
  .kb-sidebar { width: 100%; flex-direction: row; gap: 12px; overflow-x: auto; }
  .kb-sidebar > * { min-width: 200px; }
  .article-grid { grid-template-columns: 1fr; }
}
</style>