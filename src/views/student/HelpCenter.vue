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
import { formatDate } from '@/utils/dataType.js'

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
      // 后端统一返回 MyBatis-Plus Page：{ records, total, size, current, pages }
      articles.value = res.data?.records || []
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
</script>

<style scoped lang="scss">
.knowledge-base {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--app-space-6) var(--app-space-4);
  color: var(--app-color-ink);
  font-family: var(--app-font-family);
}
.search-bar { margin-bottom: var(--app-space-4); }
.search-bar :deep(.el-input-group__append) { background: var(--app-color-primary); border-color: var(--app-color-primary); color: var(--app-color-on-primary); }

.kb-body { display: flex; gap: var(--app-space-4); align-items: flex-start; }
.kb-sidebar { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: var(--app-space-3); }
.kb-main { flex: 1; min-width: 0; }

.card-title { font-family: var(--app-font-family); font-weight: 600; font-size: var(--app-fs-caption); color: var(--app-color-ink); }

.category-item {
  display: flex; align-items: center; gap: var(--app-space-2); padding: var(--app-space-2) 10px;
  border-radius: var(--app-radius-sm); cursor: pointer; transition: background var(--app-transition-fast);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text);
}
.category-item:hover { background: var(--app-color-fill); }
.category-item.active { background: var(--app-color-info-bg); color: var(--app-color-primary); font-weight: 600; }
.cat-name { flex: 1; }
.clear-filter { text-align: center; color: var(--app-color-text-muted); font-size: var(--app-fs-meta); cursor: pointer; margin-top: var(--app-space-2); }

.popular-item {
  display: flex; align-items: center; gap: var(--app-space-2); padding: var(--app-space-2) 0;
  cursor: pointer; font-size: var(--app-fs-meta); color: var(--app-color-text); border-bottom: 1px solid var(--app-color-divider);
}
.popular-item:last-child { border-bottom: none; }
.popular-item:hover { color: var(--app-color-primary); }
.pop-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pop-views { color: var(--app-color-text-muted); font-size: var(--app-fs-meta); flex-shrink: 0; }

.list-toolbar { margin-bottom: var(--app-space-3); }
.list-info { font-size: var(--app-fs-meta); color: var(--app-color-text-muted); }

.article-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--app-space-3); }
.article-card {
  cursor: pointer;
  transition: transform var(--app-transition-fast);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}
.article-card:hover { transform: translateY(-2px); }
.article-title { font-family: var(--app-font-family); font-size: var(--app-fs-body); color: var(--app-color-ink); margin: 0 0 var(--app-space-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.article-summary { font-size: var(--app-fs-caption); color: var(--app-color-text-muted); margin: 0 0 var(--app-space-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.article-meta { display: flex; gap: var(--app-space-4); font-size: var(--app-fs-meta); color: var(--app-color-text-muted); }
.article-meta span { display: flex; align-items: center; gap: var(--app-space-1); }

.kb-pagination { display: flex; justify-content: center; margin-top: var(--app-space-6); }

.detail-header { margin-bottom: var(--app-space-3); }
.detail-card {
  padding: var(--app-space-6);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}
.detail-title { font-family: var(--app-font-family); font-size: var(--app-fs-title); color: var(--app-color-ink); margin: 0 0 var(--app-space-3); }
.detail-meta { display: flex; gap: var(--app-space-4); font-size: var(--app-fs-meta); color: var(--app-color-text-muted); }
.detail-meta span { display: flex; align-items: center; gap: var(--app-space-1); }

/* 通用样式 */
.markdown-body { font-size: var(--app-fs-caption); line-height: 1.8; color: var(--app-color-text); }
.markdown-body :deep(h2) { font-size: var(--app-fs-title); color: var(--app-color-ink); margin: var(--app-space-6) 0 var(--app-space-3); padding-bottom: var(--app-space-2); border-bottom: 1px solid var(--app-color-border); }
.markdown-body :deep(h3) { font-size: var(--app-fs-body); color: var(--app-color-ink); margin: var(--app-space-4) 0 var(--app-space-2); }
.markdown-body :deep(p) { margin: 0 0 var(--app-space-3); }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: var(--app-space-4); margin: 0 0 var(--app-space-3); }
.markdown-body :deep(li) { margin-bottom: var(--app-space-1); }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin: var(--app-space-3) 0; }
.markdown-body :deep(th), .markdown-body :deep(td) { border: 1px solid var(--app-color-border); padding: var(--app-space-2) var(--app-space-3); text-align: left; font-size: var(--app-fs-caption); }
.markdown-body :deep(th) { background: var(--app-color-fill-light); font-weight: 600; }
.markdown-body :deep(code) { background: var(--app-color-fill); padding: 2px 6px; border-radius: var(--app-radius-xs); font-size: var(--app-fs-meta); }
.markdown-body :deep(pre) { background: var(--app-color-ink); color: var(--app-color-border-soft); padding: var(--app-space-4); border-radius: var(--app-radius-md); overflow-x: auto; }
.markdown-body :deep(pre code) { background: none; padding: 0; }
.markdown-body :deep(blockquote) { border-left: 4px solid var(--app-color-primary); padding: var(--app-space-2) var(--app-space-4); margin: var(--app-space-3) 0; background: var(--app-color-info-bg); color: var(--app-color-text); }
.markdown-body :deep(a) { color: var(--app-color-primary); }
.markdown-body :deep(hr) { border: none; border-top: 1px solid var(--app-color-border); margin: var(--app-space-5) 0; }

@media (max-width: 768px) {
  .knowledge-base { padding: var(--app-space-3); }
  .kb-body { flex-direction: column; gap: var(--app-space-3); }
  .kb-sidebar { width: 100%; flex-direction: row; gap: var(--app-space-3); overflow-x: auto; }
  .kb-sidebar > * { min-width: 200px; }
  .article-grid { grid-template-columns: 1fr; }
  .kb-pagination { margin-top: var(--app-space-4); }
}
</style>