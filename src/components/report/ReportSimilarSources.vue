<template>
  <div class="report-similar-sources">
    <div 
      v-for="(source, index) in sources" 
      :key="index"
      class="source-item"
    >
      <div class="source-header">
        <h4 class="source-title">{{ source.title }}</h4>
        <el-tag :type="getSimilarityTagType(source.similarity)">
          相似度: {{ source.similarity }}%
        </el-tag>
        <el-button v-if="showCompareButton" type="primary" size="small" @click="viewComparison(source)">
          详细对比
        </el-button>
      </div>
      <div class="source-meta">
        <span><el-icon><User /></el-icon> {{ source.author }}</span>
        <span><el-icon><Document /></el-icon> {{ source.type || '学术论文' }}</span>
      </div>
      <div class="matched-paragraphs">
        <h5>匹配段落:</h5>
        <div 
          v-for="(paragraph, pIndex) in source.matchedParagraphs" 
          :key="pIndex"
          class="paragraph-item"
        >
          <div class="source-text">
            <strong>原文:</strong> {{ paragraph.sourceText }}
          </div>
          <div class="paper-text">
            <strong>本文:</strong> {{ paragraph.paperText }}
          </div>
          <div class="match-similarity">
            匹配度: {{ paragraph.similarity }}%
          </div>
        </div>
      </div>
    </div>
    <div v-if="!sources || sources.length === 0" class="empty-sources">
      <el-empty description="暂无相似来源数据" />
    </div>
  </div>
</template>

<script setup>
import { User, Document } from '@element-plus/icons-vue'

import { getSimilarityTagType } from '@/utils/reviewStatus.js'

const props = defineProps({
  sources: {
    type: Array,
    default: () => []
  },
  showCompareButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['compare'])

const viewComparison = (source) => {
  emit('compare', source)
}
</script>

<style scoped>
.report-similar-sources {
  padding: 20px;
}

.source-item {
  background: #f8fafc;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
  transition: border-color 0.2s ease;
}

.source-item:hover {
  border-color: #0066cc;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.source-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
  margin-right: 20px;
  line-height: 1.4;
}

.source-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  color: #64748b;
  font-size: 14px;
}

.source-meta .el-icon {
  margin-right: 6px;
  color: #3b82f6;
}

.matched-paragraphs {
  margin-top: 20px;
}

.matched-paragraphs h5 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.paragraph-item {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border-left: 3px solid #0066cc;
  transition: background-color 0.15s ease;
}

.paragraph-item:hover {
  background-color: #f5f5f7;
}

.source-text,
.paper-text {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.match-similarity {
  text-align: right;
  font-size: 14px;
  color: var(--apple-danger);
  font-weight: 600;
}

.empty-sources {
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .source-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .source-title {
    margin-right: 0;
  }
  
  .source-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .paragraph-item {
    padding: 16px;
  }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.report-similar-sources { padding: var(--apple-spacing-lg); }

.source-item {
  padding: var(--apple-spacing-lg);
  margin-bottom: var(--apple-spacing-lg);
  background: var(--apple-surface-pearl);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
  transition: border-color var(--apple-transition-normal);
}

.source-item:hover { border-color: var(--apple-primary); }

.source-header {
  gap: var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-md);
}

.source-title {
  margin-right: var(--apple-spacing-lg);
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-body-strong);
  color: var(--apple-ink);
}

.source-meta {
  gap: var(--apple-spacing-lg);
  margin-bottom: var(--apple-spacing-md);
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink-muted-48);

  .el-icon {
    margin-right: var(--apple-spacing-xxs);
    color: var(--apple-primary);
  }
}

.matched-paragraphs { margin-top: var(--apple-spacing-md); }

.matched-paragraphs h5 {
  margin: 0 0 var(--apple-spacing-md);
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-body-strong);
  color: var(--apple-ink);
}

.paragraph-item {
  padding: var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-md);
  border: 0;
  border-left: 3px solid var(--apple-primary);
  border-radius: var(--apple-rounded-md);
  background: var(--apple-surface);

  &:hover { background-color: var(--apple-canvas-parchment); }
}

.source-text,
.paper-text {
  margin-bottom: var(--apple-spacing-sm);
  font-size: var(--apple-fs-caption);
  line-height: var(--apple-lh-body);
}

.match-similarity { font-size: var(--apple-fs-caption); }

.empty-sources { padding: var(--apple-spacing-xl) var(--apple-spacing-lg); }

@media (max-width: 768px) {
  .source-header { gap: var(--apple-spacing-xs); }
  .source-meta { gap: var(--apple-spacing-xs); }
  .paragraph-item { padding: var(--apple-spacing-md); }
}
</style>
