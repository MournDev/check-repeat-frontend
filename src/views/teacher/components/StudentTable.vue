<template>
  <el-card class="list-card console-card" shadow="never">
    <!-- 列表头 -->
    <div class="list-header">
      <div class="header-title">
        <el-icon><List /></el-icon>
        <span>学生列表</span>
        <span class="total-count">(共 {{ total }} 人)</span>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" text @click="$emit('refresh')">
          刷新
        </el-button>
      </div>
    </div>

    <el-table
      ref="tableRef"
      :data="students"
      row-key="studentId"
      stripe
      class="student-table"
      v-loading="loading"
      @selection-change="$emit('selection-change', $event)"
      @sort-change="$emit('sort-change', $event)"
    >
      <el-table-column type="selection" width="50" reserve-selection />
      <el-table-column type="index" label="序号" width="55" align="center" />

      <el-table-column prop="username" label="学号" width="130" sortable>
        <template #default="{ row }">
          <span class="student-id">{{ row.username }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="studentName" label="姓名" min-width="90" sortable show-overflow-tooltip>
        <template #default="{ row }">
          <div class="student-info">
            <div class="name">{{ row.studentName }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="collegeName" label="学院" min-width="120" sortable show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag type="info" size="small">{{ row.collegeName }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="major" label="专业" min-width="140" sortable show-overflow-tooltip>
        <template #default="{ row }">
          <span class="major">{{ row.major }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="grade" label="年级" width="80" sortable show-overflow-tooltip>
        <template #default="{ row }">
          <span class="grade">{{ row.grade }}级</span>
        </template>
      </el-table-column>

      <el-table-column prop="paperStatus" label="论文状态" min-width="110" sortable>
        <template #default="{ row }">
          <template v-if="row.paperCount && row.paperCount > 1">
            <el-tag type="info" effect="light" size="small" style="cursor: pointer;" @click="$emit('view-all-papers', row)">
              多篇论文 ({{ row.paperCount }})
            </el-tag>
          </template>
          <template v-else>
            <el-tag :type="getStatusType(row.paperStatus)" effect="light" size="small">
              {{ getStatusText(row.paperStatus) }}
            </el-tag>
          </template>
        </template>
      </el-table-column>

      <el-table-column prop="advisorName" label="指导老师" min-width="100" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.advisorName" class="advisor-info">
            <span class="advisor-name">{{ row.advisorName }}</span>
          </div>
          <span v-else class="no-advisor">未分配</span>
        </template>
      </el-table-column>

      <el-table-column prop="submitTime" label="提交时间" width="155" sortable>
        <template #default="{ row }">
          <span v-if="row.submitTime" class="submit-time">
            {{ formatDate(row.submitTime, '--') }}
          </span>
          <span v-else class="no-submit">--</span>
        </template>
      </el-table-column>

      <el-table-column prop="similarity" label="相似度" width="115" sortable>
        <template #default="{ row }">
          <div v-if="row.similarity !== null && row.similarity !== undefined">
            <el-progress :percentage="row.similarity" :stroke-width="6" :show-text="false"
              :color="getSimilarityColor(row.similarity)" class="similarity-progress" />
            <span class="similarity-value">{{ formatPercent(row.similarity) }}</span>
          </div>
          <span v-else>--</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button type="primary" :icon="Message" size="small" @click="$emit('message', row)" title="发送消息" circle />
            <el-button v-if="!row.advisorName" type="success" :icon="UserFilled" size="small"
              @click="$emit('assign-tutor', row)" title="分配导师" circle />
            <el-dropdown @command="handleMoreActions(row, $event)" trigger="click">
              <el-button :icon="More" size="small" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Document" command="paper">
                    论文详情
                  </el-dropdown-item>
                  <el-dropdown-item :icon="Delete" command="delete" divided style="color: var(--app-color-danger);">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>

      <template #empty>
        <div class="table-empty">
          <el-icon :size="48"><UserFilled /></el-icon>
          <p>暂无学生数据</p>
        </div>
      </template>
    </el-table>

    <!-- 底栏：批量操作 + 分页 -->
    <div class="table-footer">
      <div v-if="selectedCount > 0" class="batch-bar">
        <span class="batch-summary">已选择 {{ selectedCount }} 个学生（跨页保留）</span>
        <el-button type="primary" size="small" @click="$emit('batch-assign-advisor')">
          批量分配导师
        </el-button>
        <el-button size="small" @click="$emit('batch-send-message')">
          批量发送消息
        </el-button>
        <el-button size="small" @click="$emit('batch-export')">
          批量导出
        </el-button>
        <el-button type="danger" size="small" @click="$emit('batch-delete')">
          批量删除
        </el-button>
        <el-button size="small" @click="clearSelection">
          取消选择
        </el-button>
      </div>
      <el-pagination
        class="pagination"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @update:current-page="$emit('update:current-page', $event)"
        @update:page-size="handleSizeChange"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import {
  List, Refresh, Message, UserFilled, More, Document, Delete
} from '@element-plus/icons-vue'
import { getSimilarityColor } from '@/utils/similarity.js'
import { formatPercent, formatDate } from '@/utils/dataType.js'

defineProps({
  students: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  selectedCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:current-page',
  'update:page-size',
  'selection-change',
  'sort-change',
  'refresh',
  'view-paper',
  'view-all-papers',
  'assign-tutor',
  'message',
  'delete',
  'batch-assign-advisor',
  'batch-send-message',
  'batch-export',
  'batch-delete'
])

const tableRef = ref(null)

const handleSizeChange = (size) => {
  emit('update:page-size', size)
  emit('update:current-page', 1)
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

defineExpose({ clearSelection })

// ── 行内"更多"操作分发 ──────────────────────────────────────
const handleMoreActions = (row, command) => {
  switch (command) {
    case 'paper':
      emit('view-paper', row)
      break
    case 'delete':
      emit('delete', row)
      break
  }
}

// ── 展示工具方法（自包含，纯展示） ──────────────────────────
const getStatusType = (status) => {
  const typeMap = {
    'not_submitted': 'info',
    'submitted': 'info',
    'assigned': 'primary',
    'auditing': 'warning',
    'rejected': 'danger',
    'completed': 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'not_submitted': '未提交',
    'submitted': '已提交',
    'assigned': '已分配',
    'auditing': '审核中',
    'rejected': '需修改',
    'completed': '已完成'
  }
  return textMap[status] || '未知状态'
}
</script>

<style lang="scss" scoped>
.list-card {
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-3) var(--app-space-4);
  background: var(--app-color-fill);
  border-bottom: 1px solid var(--app-color-border);

  .header-title {
    display: flex;
    align-items: center;
    gap: var(--app-space-2);
    font-weight: 600;
    font-size: var(--app-fs-body);
    color: var(--app-color-ink);

    .el-icon {
      color: var(--app-color-text-muted);
    }

    .total-count {
      font-size: var(--app-fs-meta);
      color: var(--app-color-text-muted);
      margin-left: var(--app-space-2);
      font-weight: 400;
    }
  }
}

:deep(.student-table) {
  .el-table__header th {
    background: var(--app-color-fill);
    color: var(--app-color-ink);
    font-weight: 600;
    border-bottom: 1px solid var(--app-color-border);
    padding: var(--app-space-2) var(--app-space-3);
    font-size: var(--app-fs-caption);
  }

  .el-table__row {
    transition: background-color var(--app-transition-normal);

    &:hover > td.el-table__cell {
      background-color: var(--app-color-fill);
    }

    td.el-table__cell {
      padding: var(--app-space-2) var(--app-space-3);
      border-bottom: 1px solid var(--app-color-divider);
      font-size: var(--app-fs-caption);
      color: var(--app-color-ink);
    }
  }

  .student-id {
    font-family: var(--app-font-family);
    color: var(--app-color-ink);
    font-weight: 500;
  }

  .student-info .name {
    color: var(--app-color-ink);
    font-weight: 500;
  }

  .major, .grade {
    color: var(--app-color-ink);
  }

  .advisor-info .advisor-name {
    color: var(--app-color-ink);
    font-weight: 500;
  }

  .no-advisor {
    color: var(--app-color-text-muted);
    font-size: var(--app-fs-meta);
  }

  .submit-time {
    color: var(--app-color-text-muted);
    font-size: var(--app-fs-meta);
  }

  .no-submit {
    color: var(--app-color-text-muted);
  }

  .similarity-progress {
    display: inline-block;
    width: 60px;
    vertical-align: middle;
    margin-right: 6px;
  }

  .similarity-value {
    font-size: var(--app-fs-meta);
    color: var(--app-color-ink);
    font-weight: 600;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: var(--app-space-2);
  }
}

/* 底栏：批量 + 分页 */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4);
  border-top: 1px solid var(--app-color-border);
  background: var(--app-color-card-bg);
}

.batch-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
}

.batch-bar .batch-summary {
  font-size: var(--app-fs-meta);
  color: var(--app-color-ink);
  margin-right: var(--app-space-1);
}

.pagination {
  margin-left: auto;
}

/* 空状态 */
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-2);
  padding: var(--app-space-12) 0;
  color: var(--app-color-text-muted);

  .el-icon {
    color: var(--app-color-border-strong);
  font-size: 48px;
  }

  p {
    margin: 0;
    font-size: var(--app-fs-caption);
  }
}

@media (max-width: 768px) {
  .list-header {
    padding: var(--app-space-3);
  }

  .table-footer {
    flex-direction: column;
    align-items: stretch;
    padding: var(--app-space-3);
  }

  .pagination {
    margin-left: 0;
    justify-content: center;
  }
}
</style>
