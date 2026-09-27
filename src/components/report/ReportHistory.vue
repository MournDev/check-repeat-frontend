<template>
  <div class="report-history">
    <el-timeline>
      <el-timeline-item 
        v-for="(record, index) in records" 
        :key="index"
        :timestamp="record.createTime"
        :type="record.type"
        :icon="record.icon"
      >
        <div class="history-item">
          <div class="version-info">
            <span class="version-label">版本 {{ record.version }}</span>
            <el-tag :type="record.similarityType">
              相似度: {{ record.checkRate }}%
            </el-tag>
          </div>
          <div class="change-description">{{ record.description }}</div>
          <div class="history-actions">
            <el-button link @click="viewHistoryReport(record)">
              查看报告
            </el-button>
            <el-button v-if="showExportButton" link @click="exportHistoryReport(record)">
              导出报告
            </el-button>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <div v-if="!records || records.length === 0" class="empty-history">
      <el-empty description="暂无历史记录" />
    </div>
  </div>
</template>

<script setup>
import { Check } from '@element-plus/icons-vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  showExportButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['view', 'export'])

const viewHistoryReport = (record) => {
  emit('view', record)
}

const exportHistoryReport = (record) => {
  emit('export', record)
}
</script>

<style scoped>
.report-history {
  padding: 20px;
}

.history-item {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;
  transition: border-color 0.2s ease;
  border: 1px solid #e0e0e0;
}

.history-item:hover {
  border-color: #0066cc;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.version-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.change-description {
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.6;
  font-size: 14px;
}

.history-actions {
  display: flex;
  gap: 12px;
}

.empty-history {
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .history-item {
    padding: 16px;
  }
  
  .version-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .history-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
