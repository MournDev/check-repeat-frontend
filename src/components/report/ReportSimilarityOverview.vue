<template>
  <div class="report-similarity-overview">
    <div class="similarity-card">
      <div class="similarity-value">
        <el-progress
          :percentage="similarity"
          :stroke-width="20"
          :color="getSimilarityColor(similarity)"
          :show-text="false"
        />
        <div class="similarity-text">
          <div class="percentage">{{ similarity }}%</div>
          <div class="rating">{{ getSimilarityRating(similarity) }}</div>
        </div>
      </div>
      <div class="similarity-stats">
        <div class="stat-item">
          <div class="stat-value">{{ wordCount }}</div>
          <div class="stat-label">总字数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ similarWords }}</div>
          <div class="stat-label">相似字数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ similarSources }}</div>
          <div class="stat-label">相似来源</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getSimilarityColor } from '@/utils/dataType.js'

const props = defineProps({
  similarity: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  similarWords: {
    type: Number,
    default: 0
  },
  similarSources: {
    type: Number,
    default: 0
  }
})

const getSimilarityRating = (similarity) => {
  if (similarity < 15) return '优秀'
  if (similarity < 30) return '良好'
  return '需要修改'
}
</script>

<style scoped>
.report-similarity-overview {
  padding: 20px;
}

.similarity-card {
  text-align: center;
  padding: 32px;
  background: #f5f5f7;
  border-radius: 18px;
  border: 1px solid #e0e0e0;
  transition: border-color 0.2s ease;
}

.similarity-card:hover {
  border-color: #d0d0d0;
}

.similarity-value {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.similarity-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.percentage {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.rating {
  font-size: 16px;
  color: #64748b;
  margin-top: 4px;
}

.similarity-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 32px;
}

.stat-item {
  text-align: center;
  padding: 17px;
  background: #fafafc;
  border-radius: 11px;
  border: 1px solid #f0f0f0;
  flex: 1;
  margin: 0 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #0066cc;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

@media (max-width: 768px) {
  .similarity-card {
    padding: 24px;
  }
  
  .similarity-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    margin: 0;
  }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.report-similarity-overview { padding: var(--apple-spacing-lg); }

.similarity-card {
  padding: var(--apple-spacing-xl);
  background: var(--apple-canvas-parchment);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
}

.similarity-card:hover { border-color: var(--apple-hairline); }

.similarity-value { margin-bottom: var(--apple-spacing-md); }

.percentage {
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-display-md);
  color: var(--apple-ink);
}

.rating {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-body-strong);
  color: var(--apple-ink-muted-48);
}

.similarity-stats { margin-top: var(--apple-spacing-xl); }

.stat-item {
  margin: 0 var(--apple-spacing-xs);
  padding: var(--apple-spacing-md);
  background: var(--apple-surface-pearl);
  border: 1px solid var(--apple-divider-soft);
  border-radius: var(--apple-rounded-md);
}

.stat-value {
  margin-bottom: var(--apple-spacing-xs);
  font-size: var(--apple-fs-lead);
  color: var(--apple-primary);
}

.stat-label {
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink-muted-48);
}

@media (max-width: 768px) {
  .similarity-card { padding: var(--apple-spacing-lg); }
  .similarity-stats { gap: var(--apple-spacing-sm); }
  .stat-item { margin: 0; }
}
</style>
