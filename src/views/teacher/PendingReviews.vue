<template>
  <div class="teacher-pending">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">待审核论文</h1>
          <p class="page-subtitle">需要您审核的学生论文</p>
        </div>
        <div class="header-right">
          <el-button type="danger" :icon="Bell" @click="batchRemind">
            批量提醒 ({{ selectedPapers.length }})
          </el-button>
        </div>
      </div>
    </div>

    <el-alert
      v-if="overduePapers.length > 0"
      title="已超时提醒"
      type="error"
      :closable="false"
      show-icon
      class="urgent-alert"
    >
      <template #default>
        您有 {{ overduePapers.length }} 篇论文已超时，请立即处理！
      </template>
      <template #action>
        <el-button type="danger" size="small" @click="viewOverduePapers">
          立即处理
        </el-button>
        <el-button size="small" @click="clearOverdueFilter">
          显示全部
        </el-button>
      </template>
    </el-alert>
    <!-- 紧急提醒 -->
    <el-alert
      v-if="urgentPapers.length > 0"
      title="紧急提醒"
      type="warning"
      :closable="false"
      show-icon
      class="urgent-alert"
    >
      <template #default>
        您有 {{ urgentPapers.length }} 篇论文即将超时，请尽快处理！
      </template>
      <template #action>
        <el-button type="warning" size="small" @click="viewUrgentPapers">
          立即处理
        </el-button>
      </template>
    </el-alert>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalPending }}</div>
          <div class="stat-label">待审核总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon urgent-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.urgentPending }}</div>
          <div class="stat-label">紧急待审</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon time-icon">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.avgWaitingTime }}天</div>
          <div class="stat-label">平均等待时间</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon reviewed-icon">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayReviewed }}</div>
          <div class="stat-label">今日已审</div>
        </div>
      </div>
    </div>

    <!-- 筛选和操作栏 -->
    <el-card class="action-card" shadow="never">
      <div class="action-content">
        <div class="action-left">
          <el-space>
            <el-select v-model="filterPriority" placeholder="优先级" clearable>
              <el-option label="全部" value="" />
              <el-option label="紧急" value="urgent" />
              <el-option label="高" value="high" />
              <el-option label="普通" value="normal" />
            </el-select>
            
            <el-select v-model="filterCollege" placeholder="学院" clearable>
              <el-option label="全部学院" value="" />
              <el-option v-for="college in collegeList" :key="college.value" :label="college.label" :value="college.value" />
            </el-select>
            
            <el-select v-model="filterSimilarity" placeholder="相似度" clearable>
              <el-option label="全部" value="" />
              <el-option label="低相似度 (0-15%)" value="low" />
              <el-option label="中相似度 (15-30%)" value="medium" />
              <el-option label="高相似度 (30%以上)" value="high" />
            </el-select>
          </el-space>
        </div>
        
        <div class="action-right">
          <el-space>
            <el-button :icon="Sort" @click="toggleSort">
              {{ sortDesc ? '时间正序' : '时间倒序' }}
            </el-button>
            <el-button type="primary" :icon="Refresh" @click="refreshList">
              刷新
            </el-button>
          </el-space>
        </div>
      </div>
    </el-card>

    <!-- 论文列表 -->
    <el-card class="list-card enhanced-table-card" shadow="never">
      <el-table
        ref="tableRef"
        :data="filteredPapers"
        class="enhanced-table"
        row-class-name="table-row"
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <PriorityBadge :priority="row.priority" />
          </template>
        </el-table-column>

        <el-table-column prop="studentName" label="学生信息" min-width="250">
          <template #default="{ row }">
            <div class="student-info-enhanced">
              <div class="student-details">
                <div class="student-main-info">
                  <span class="student-name">{{ row.studentName }}</span>
                  <el-tag size="small" type="info" effect="plain">{{ row.studentId }}</el-tag>
                </div>
                <div class="student-secondary-info">
                  <div class="college-tag">
                    <el-icon><OfficeBuilding /></el-icon>
                    <span>{{ row.college }}</span>
                  </div>
                  <div class="contact-info">
                    <el-icon><Message /></el-icon>
                    <span>{{ row.email }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="paperTitle" label="论文信息" min-width="320">
          <template #default="{ row }">
            <div class="paper-info-enhanced">
              <div class="paper-title-section">
                <el-tooltip :content="row.paperTitle" placement="top">
                  <div class="paper-title">{{ truncateText(row.paperTitle, 45) }}</div>
                </el-tooltip>
                <div class="paper-tags">
                  <el-tag size="small" type="primary" effect="dark">V{{ row.version }}</el-tag>
                  <el-tag size="small" type="success" effect="plain">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(row.submitTime, 'YYYY-MM-DD HH:mm:ss') }}
                  </el-tag>
                </div>
              </div>
              <div class="paper-meta-enhanced">
                <div class="meta-chip">
                  <el-icon><Document /></el-icon>
                  <span>字数: {{ row.wordCount || 'N/A' }}</span>
                </div>
                <div class="meta-chip">
                  <el-icon><Files /></el-icon>
                  <span>页数: {{ row.pageCount || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="similarity" label="查重结果" min-width="220">
          <template #default="{ row }">
            <div class="similarity-info-enhanced">
              <div class="similarity-header">
                <div class="similarity-score-display">
                  <span class="similarity-percentage" :class="getSimilarityClass(row.similarity)">
                    {{ row.similarity }}%
                  </span>
                  <el-tag 
                    :type="getSimilarityTagType(row.similarity)" 
                    size="small" 
                    effect="dark"
                  >
                    {{ getSimilarityLevel(row.similarity) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="similarity-visual">
                <el-progress 
                  :percentage="row.similarity" 
                  :stroke-width="12" 
                  :color="getSimilarityColor(row.similarity)"
                  :show-text="false"
                  class="similarity-progress"
                />
                
                <div class="similarity-indicators">
                  <div 
                    v-for="level in similarityLevels" 
                    :key="level.value"
                    class="indicator-dot"
                    :class="{
                      'active': row.similarity >= level.min,
                      'current': getSimilarityLevel(row.similarity) === level.label
                    }"
                    :style="{ backgroundColor: level.color }"
                  ></div>
                </div>
              </div>
              
              <div class="similarity-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  plain
                  @click.stop="viewSimilarityReport(row)"
                  class="report-btn"
                >
                  <el-icon><Document /></el-icon>
                  查看重报
                </el-button>
                <el-button 
                  v-if="row.similarity > 30"
                  type="warning" 
                  size="small" 
                  plain
                  @click.stop="requestRecheck(row)"
                  class="recheck-btn"
                >
                  <el-icon><Refresh /></el-icon>
                  重新检测
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="waitingTime" label="等待时间" width="120" sortable>
          <template #default="{ row }">
            <div class="waiting-time" :class="getWaitingTimeClass(row.waitingTime)">
              {{ row.waitingTime }}天
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="deadline" label="截止时间" width="150">
          <template #default="{ row }">
            <div class="deadline-cell">
              <div>{{ formatDateTime(row.deadline, 'YYYY-MM-DD HH:mm:ss') }}</div>
              <div v-if="isOverdue(row)" class="deadline-overdue">
                <el-icon><Warning /></el-icon>
                <span>已超时</span>
              </div>
              <div v-else-if="isUrgent(row)" class="deadline-warning">
                <el-icon><Warning /></el-icon>
                <span>即将超时</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons-enhanced">
              <el-button-group>
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="View" 
                  @click.stop="reviewPaper(row)"
                  class="action-btn primary-action"
                >
                  审核
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  :icon="ChatDotRound" 
                  @click.stop="contactStudent(row)"
                  class="action-btn secondary-action"
                >
                  联系
                </el-button>
              </el-button-group>
              
              <el-dropdown @command="handleMoreAction(row, $event)" trigger="click" class="more-dropdown">
                <el-button size="small" class="more-btn">
                  更多<el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="viewPaper" :icon="View">
                      查看原文
                    </el-dropdown-item>
                    <el-dropdown-item command="download" :icon="Download">
                      下载论文
                    </el-dropdown-item>
                    <el-dropdown-item command="viewReport" :icon="Document">
                      查看报告
                    </el-dropdown-item>
                    <el-dropdown-item command="remind" :icon="Bell" divided>
                      提醒学生
                    </el-dropdown-item>
                    <el-dropdown-item command="delegate" :icon="User">
                      委托审核
                    </el-dropdown-item>
                    <el-dropdown-item 
                      v-if="row.similarity > 30" 
                      command="recheck" 
                      :icon="Refresh"
                      divided
                    >
                      重新检测
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="filteredPapers.length === 0 && !loading"
        description="暂无待审核论文"
        :image-size="200"
      >
        <template #image>
          <el-icon :size="80"><DocumentChecked /></el-icon>
        </template>
        <el-button type="primary" @click="refreshList">
          刷新查看
        </el-button>
      </el-empty>

      <!-- 批量操作 -->
      <div v-if="selectedPapers.length > 0" class="batch-actions">
        <el-space>
          <span>已选择 {{ selectedPapers.length }} 篇论文</span>
          <el-button type="primary" @click="batchReview">
            批量审核
          </el-button>
          <el-button type="warning" @click="batchRemind">
            批量提醒
          </el-button>
          <el-button @click="clearSelection">
            取消选择
          </el-button>
        </el-space>
      </div>
    </el-card>

    <!-- 审核对话框 -->
    <ReviewDialog
      v-model="reviewDialogVisible"
      :paper-id="currentPaperId"
      :is-batch="selectedPapers.length > 1"
      :papers="selectedPapers"
      @review-complete="handleReviewCompleted"
    />

    <!-- 相似度报告对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="查重报告详情"
      :width="isFullscreen ? '100%' : '90%'"
      :height="isFullscreen ? '100vh' : '80vh'"
      class="report-dialog"
      :fullscreen="isFullscreen"
      append-to-body
    >
      <PlagiarismReportViewer 
        v-if="currentPaperId" 
        :paper-id="currentPaperId"
        @close="reportDialogVisible = false"
        @approve="handleReportApprove"
        @revision="handleReportRevision"
      />
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            {{ isFullscreen ? '退出全屏' : '全屏查看' }}
          </el-button>
          <el-button @click="reportDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 论文预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="论文预览"
      :width="isFullscreen ? '100%' : '90%'"
      :fullscreen="isFullscreen"
      :class="['preview-dialog', { 'fullscreen': isFullscreen }]"
      append-to-body
      @close="closePreview"
    >
      <div class="preview-container">
        <div v-if="previewLoading" class="loading-placeholder">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="p" style="width: 100%; height: 800px" />
            </template>
          </el-skeleton>
        </div>
        
        <iframe
          v-show="!previewLoading && !previewError && previewUrl"
          :src="previewUrl"
          class="preview-frame"
          @load="handlePreviewLoad"
          @error="handlePreviewError"
          frameborder="0"
        ></iframe>
        
        <div v-if="(previewError || !previewUrl) && !previewLoading" class="error-placeholder">
          <el-icon :size="60"><Warning /></el-icon>
          <p v-if="currentPaper && currentPaper.title">
            论文：{{ currentPaper.title }}
          </p>
          <p>{{ previewError ? '论文预览加载失败' : '暂无预览URL' }}</p>
          <div v-if="currentPaper">
            <p>论文信息：</p>
            <ul>
              <li v-if="currentPaper.abstract">摘要：{{ currentPaper.abstract }}</li>
              <li v-if="currentPaper.wordCount">字数：{{ currentPaper.wordCount }}</li>
              <li v-if="currentPaper.pageCount">页数：{{ currentPaper.pageCount }}</li>
            </ul>
          </div>
          <!-- 备用操作 -->
          <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffeaa7;">
            <p><strong>🔧 备用方案：</strong></p>
            <el-button 
              type="warning" 
              size="small" 
              @click="openInNewWindow"
              style="margin-right: 10px;"
            >
              在新窗口打开预览
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              @click="copyPreviewUrl"
            >
              复制预览链接
            </el-button>
          </div>
          <el-button v-if="currentPaper" type="primary" @click="retryPreview(currentPaper)">
            重新加载
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            {{ isFullscreen ? '退出全屏' : '全屏查看' }}
          </el-button>
          <el-button @click="previewVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.teacher-pending {
  min-height: 100vh;
  background: var(--apple-canvas-parchment);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--apple-surface);
  padding: var(--apple-spacing-xl);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--apple-hairline);
  }
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--apple-ink);
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--apple-ink-muted-48);
}

.urgent-alert {
  margin-bottom: var(--apple-spacing-xl);

  :deep(.el-alert) {
    border-radius: var(--apple-rounded-lg);
    border-left: none;
  }
  
  :deep(.el-alert__content) {
    font-size: 0.875rem;
  }
  
  :deep(.el-alert__closebtn) {
    font-size: 16px;
  }
  
  :deep(.el-button) {
    font-size: 0.75rem;
    padding: 4px 12px;
    border-radius: 8px;
    
    &:hover {
      /* translateY removed for Apple HIG */;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--apple-hairline);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    
    &.pending-icon {
      background: #fef3c7;
      color: var(--apple-warning);
    }

    &.urgent-icon {
      background: #fee2e2;
      color: var(--apple-danger);
    }

    &.time-icon {
      background: #dbeafe;
      color: var(--apple-primary);
    }

    &.reviewed-icon {
      background: #d1fae5;
      color: var(--apple-success);
    }
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--apple-ink);
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--apple-ink-muted-48);
    }
  }
}

.action-card {
  margin-bottom: var(--apple-spacing-xl);
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  padding: 20px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--apple-hairline);
  }
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.action-left, .action-right {
  display: flex;
  gap: 12px;
  align-items: center;
  
  @media (max-width: 1200px) {
    width: 100%;
  }
}

:deep(.el-select) {
  width: 180px;
  
  :deep(.el-input__wrapper) {
    border-radius: 11px;
    
    &:hover {
      box-shadow: none;
      border-color: var(--apple-hairline);
    }

    &.is-focus {
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.15);
    }
  }
}

:deep(.el-button) {
  border-radius: var(--apple-rounded-lg);
  font-size: 0.875rem;
  padding: 8px 16px;
  transition: border-color 0.2s ease;

  &:hover {
    /* translateY removed for Apple HIG */;
  }

  &:active {
    transform: scale(0.985);
  }

  &.el-button--primary {
    background: var(--apple-primary);
    border-color: var(--apple-primary);

    &:hover {
      background: var(--apple-primary-hover);
      border-color: var(--apple-primary-hover);
    }
  }
}

.list-card {
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-xl);
  overflow: hidden;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--apple-hairline);
  }
}

:deep(.el-table) {
  border-radius: var(--apple-rounded-xl);
  overflow: hidden;

  .el-table__header-wrapper {
    .el-table__header {
      background: var(--apple-canvas-parchment);

      th {
        background: var(--apple-canvas-parchment);
        color: var(--apple-ink-muted-48);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--apple-hairline);
      }
    }
  }

  .el-table__body-wrapper {
    .el-table__row {
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--apple-canvas-parchment) !important;
      }

      td {
        padding: 16px;
        border-bottom: 1px solid var(--apple-hairline);
        font-size: 0.875rem;
        color: var(--apple-ink);
      }
    }
  }

  .el-table__empty-block {
    padding: 64px 0;

    .el-empty__description {
      color: var(--apple-ink-muted-48);
    }

    .el-button {
      border-radius: var(--apple-rounded-lg);

      &:hover {
        /* translateY removed for Apple HIG */;
      }
    }
  }
}

.student-info-enhanced {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.student-details {
  flex: 1;
  min-width: 0;
}

.student-main-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.student-name {
  font-weight: 600;
  color: var(--apple-ink);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  
  @media (max-width: 1200px) {
    max-width: 100%;
  }
}

:deep(.el-tag) {
  border-radius: 8px;
  font-size: 0.75rem;
  padding: 2px 8px;
  
  &.el-tag--info {
    background: #e0f2fe;
    border-color: #e0f2fe;
    color: var(--apple-info);
  }
  
  &.el-tag--primary {
    background: #dbeafe;
    border-color: #dbeafe;
    color: var(--apple-primary);
  }
  
  &.el-tag--success {
    background: #d1fae5;
    border-color: #d1fae5;
    color: var(--apple-success);
  }
  
  &.el-tag--warning {
    background: #fef3c7;
    border-color: #fef3c7;
    color: var(--apple-warning);
  }
  
  &.el-tag--danger {
    background: #fee2e2;
    border-color: #fee2e2;
    color: var(--apple-danger);
  }
}

.student-secondary-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.college-tag, .contact-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);

  .el-icon {
    font-size: 17px;
  }
}

.paper-info-enhanced {
  padding: 8px 0;
}

.paper-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.paper-title {
  font-weight: 600;
  color: var(--apple-ink);
  font-size: 0.875rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  min-width: 0;
}

.paper-tags {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    align-self: flex-start;
  }
}

.paper-meta-enhanced {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--apple-ink-muted-48);
  background: var(--apple-canvas-parchment);
  padding: 4px 12px;
  border-radius: var(--apple-rounded-lg);
  
  .el-icon {
    font-size: 17px;
  }
}

.similarity-info-enhanced {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.similarity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.similarity-score-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.similarity-percentage {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--apple-ink);

  &.high {
    color: var(--apple-danger);
  }

  &.medium {
    color: var(--apple-warning);
  }

  &.low {
    color: var(--apple-success);
  }
}

.similarity-visual {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-progress) {
  width: 100%;
  
  .el-progress__bar {
    border-radius: 3px;
    
    .el-progress__inner {
      border-radius: 3px;
    }
  }
}

.similarity-indicators {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--apple-hairline);
  transition: transform 0.2s ease;
  
  &.active {
    transform: scale(1.2);
  }
  
  &.current {
    transform: scale(1.4);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8), 0 0 0 4px currentColor;
  }
}

.similarity-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

:deep(.el-button--small) {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 8px;
  
  &:hover {
    /* translateY removed for Apple HIG */;
  }
}

.waiting-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--apple-ink);
  text-align: center;
  padding: 8px 0;

  &.urgent {
    color: var(--apple-danger);
  }

  &.high {
    color: var(--apple-warning);
  }

  &.normal {
    color: var(--apple-success);
  }
}

.deadline-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.deadline-overdue, .deadline-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 4px;
  
  .el-icon {
    font-size: 17px;
  }
}

.deadline-overdue {
  color: var(--apple-danger);
}

.deadline-warning {
  color: var(--apple-warning);
}

.action-buttons-enhanced {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

:deep(.el-button-group) {
  @media (max-width: 768px) {
    width: 100%;
    
    .el-button {
      flex: 1;
      text-align: center;
    }
  }
}

.more-dropdown {
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 100%;
    
    .more-btn {
      width: 100%;
    }
  }
}

:deep(.el-dropdown-menu) {
  border-radius: 11px;
  /* box-shadow removed for Apple HIG */
  border: 1px solid var(--apple-hairline);

  .el-dropdown-menu__item {
    font-size: 0.875rem;
    padding: 8px 16px;
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--apple-canvas-parchment);
      color: var(--apple-ink);
    }
  }
}

.batch-actions {
  padding: 16px;
  background: var(--apple-canvas-parchment);
  border-top: 1px solid var(--apple-hairline);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.preview-dialog {
  border-radius: var(--apple-rounded-xl);
  overflow: hidden;

  :deep(.el-dialog__header) {
    background: var(--apple-canvas-parchment);
    border-bottom: 1px solid var(--apple-hairline);
    padding: 20px var(--apple-spacing-xl);

    .el-dialog__title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--apple-ink);
    }

    .el-dialog__headerbtn {
      top: 20px;

      .el-dialog__close {
        font-size: 20px;
        color: var(--apple-ink-muted-48);

        &:hover {
          color: var(--apple-ink);
        }
      }
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.preview-container {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 500px;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
}

.loading-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--apple-canvas-parchment);
}

.error-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  color: var(--apple-ink-muted-48);
  background: var(--apple-canvas-parchment);
  padding: 48px;
  
  .el-icon {
    font-size: 48px;
    color: #94a3b8;
  }
  
  p {
    margin: 0;
    line-height: 1.5;
  }
  
  ul {
    text-align: left;
    margin: 16px 0;
    padding-left: 24px;
  }
  
  li {
    margin-bottom: 8px;
  }
}

.report-dialog {
  border-radius: var(--apple-rounded-xl);
  overflow: hidden;

  :deep(.el-dialog__header) {
    background: var(--apple-canvas-parchment);
    border-bottom: 1px solid var(--apple-hairline);
    padding: 20px var(--apple-spacing-xl);

    .el-dialog__title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--apple-ink);
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px var(--apple-spacing-xl);
  border-top: 1px solid var(--apple-hairline);
  background: var(--apple-canvas-parchment);

  :deep(.el-button) {
    font-size: 0.875rem;
    padding: 8px 16px;
    border-radius: var(--apple-rounded-lg);
    
    &:hover {
      /* translateY removed for Apple HIG */;
    }
  }
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .action-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-left, .action-right {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .teacher-pending {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .action-left, .action-right {
    flex-direction: column;
    align-items: stretch;
  }
  
  :deep(.el-select) {
    width: 100%;
  }
  
  :deep(.el-button) {
    width: 100%;
    justify-content: center;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .preview-container {
    height: 60vh;
    min-height: 400px;
  }
}
</style>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useUserStore } from '@/stores/user'
import ReviewDialog from '@/views/teacher/ReviewDialog.vue'
import PlagiarismReportViewer from '@/views/teacher/PlagiarismReportViewer.vue'// import SimilarityReportDialog from './components/SimilarityReportDialog.vue'
import PriorityBadge from '@/views/teacher/PriorityBadge.vue'
import { formatDateTime } from '@/utils/dataType.js'
import { getAllColleges } from '@/api/user'

import {
  getPendingReviewList, 
  doReview, 
  getPendingStats, 
  recheckPlagiarism, 
  sendReminder, 
  contactStudent as contactStudentApi, 
  getPlagiarismReport, 
  getTodayReviewedCount, 
  delegateReview,
  getPaperContent,
  getPaperPreviewUrl,
  getDetailedPlagiarismReport,
  downloadPaper
} from '@/api/teacher.js'
import { convertToBackendStatus, getSimilarityColor, getSimilarityClass, getSimilarityTagType } from '@/utils/reviewStatus.js'
import {
  Bell,
  Clock,
  Warning,
  Timer,
  Check,
  Sort,
  Refresh,
  Message,
  Document,
  Calendar,
  View,
  ChatDotRound,
  Download,
  User,
  DocumentChecked,
  ArrowDown,
  FullScreen,
  OfficeBuilding
} from '@element-plus/icons-vue'

// 统计数据
const stats = reactive({
  totalPending: 0,
  urgentPending: 0,
  avgWaitingTime: 0,
  todayReviewed: 0
})

// 用户存储
const userStore = useUserStore()

// 筛选条件
const filterPriority = ref('')
const filterCollege = ref('')
const filterSimilarity = ref('')
const sortDesc = ref(true)
const collegeList = ref([])

// 加载状态
const loading = ref(false)
let loadingInstance = null

// 表格引用
const tableRef = ref(null)

// 选择的行
const selectedPapers = ref([])

// 对话框控制
const reviewDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const currentPaperId = ref(null)
const isFullscreen = ref(false)

// 论文预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewLoading = ref(false)
const previewError = ref(false)
const currentPaper = ref(null)

// 论文数据
const papers = ref([])

// 只显示已超时开关
const showOnlyOverdue = ref(false)

// 论文预览功能
const buildPreviewUrl = (rawUrl) => {
  if (!rawUrl) return ''
  if (rawUrl.includes('onlinePreview')) return rawUrl
  try {
    if (rawUrl.includes('url=')) {
      const urlParam = new URLSearchParams(rawUrl.split('?')[1]).get('url')
      if (urlParam) {
        const decodedUrl = decodeURIComponent(atob(urlParam))
        const previewBase = import.meta.env.VITE_KKFILEVIEW_BASE_URL || ''
        return `${previewBase}/onlinePreview?url=${btoa(decodedUrl)}`
      }
    }
  } catch (e) {
    console.warn('URL处理失败:', e)
  }
  return rawUrl
}

const viewPaper = async (paper) => {
  try {
    // 重置所有状态
    previewLoading.value = true
    previewError.value = false
    previewUrl.value = ''
    currentPaper.value = null
    
    loadingInstance = ElLoading.service({
      lock: true,
      text: '正在加载论文信息...',
      background: 'rgba(0,0,0,0.4)'
    })
    
    const paperId = paper.paperId || paper.id || paper.paperBaseInfo?.paperId
    
    if (!paperId) {
      ElMessage.error('论文ID不存在')
      previewLoading.value = false
      return
    }
    
    // 并行获取论文内容和预览URL
    const [contentRes, previewRes] = await Promise.all([
      getPaperContent(paperId),
      getPaperPreviewUrl(paperId)
    ])
    
    
    // 处理论文内容
    if (contentRes.code === 200 && contentRes.data) {
      currentPaper.value = contentRes.data
    } else {
      console.warn('获取论文内容失败:', contentRes.message)
    }
    
    // 处理预览URL
    if (previewRes.code === 200 && previewRes.data) {
      
      // 检查多种可能的数据结构
      const rawUrl = previewRes.data.previewUrl || 
                    previewRes.data.url || 
                    previewRes.data.onlineUrl || 
                    previewRes.data.preview_url ||
                    (typeof previewRes.data === 'string' ? previewRes.data : null)
      
      
      // 检查是否为null值
      if (rawUrl === null || rawUrl === undefined) {
        console.error('后端返回的URL为null:', previewRes.data)
        ElMessage.error({
          message: '后端服务未返回有效的预览URL，请联系管理员检查文件存储和KKFileView服务配置',
          duration: 8000,
          showClose: true
        })
        
        previewLoading.value = false
        previewError.value = true
        
        // 显示论文基本信息作为降级方案
        if (currentPaper.value) {
          previewVisible.value = true
          previewLoading.value = false
          previewError.value = false
          ElMessage.info('已加载论文基本信息，预览功能暂不可用')
        }
        return
      }
      
      previewUrl.value = buildPreviewUrl(rawUrl)
      
      if (previewUrl.value) {
        previewVisible.value = true
        previewLoading.value = true
        previewError.value = false
        
        // 延长超时时间
        setTimeout(() => {
          if (previewLoading.value) {
            console.warn('预览加载超时')
            ElMessage.warning({
              message: '预览加载较慢，可能需要更多时间\n如果持续无法加载，请联系管理员',
              duration: 8000,
              showClose: true
            })
          }
        }, 10000) // 延长到10秒
      } else {
        previewLoading.value = false
        previewError.value = true
        ElMessage.warning('预览URL为空')
      }
    } else {
      previewLoading.value = false
      previewError.value = true
      ElMessage.info(previewRes.message || '该论文暂不支持在线预览')
      
      // 即使预览失败，如果有内容也显示内容
      if (currentPaper.value) {
        previewVisible.value = true
        previewLoading.value = false
        previewError.value = false
        ElMessage.info('已加载论文内容，但预览功能暂不可用')
      }
    }
  } catch (error) {
    console.error('获取论文信息失败:', error)
    previewLoading.value = false
    previewError.value = true
    ElMessage.error('获取论文信息失败: ' + error.message)
  } finally {
    setTimeout(() => {
      loadingInstance?.close()
      loadingInstance = null
    }, 500)
  }
}

const closePreview = () => {
  previewVisible.value = false
  previewUrl.value = ''
  previewLoading.value = false
  previewError.value = false
  currentPaper.value = null
  // 重置全屏状态
  isFullscreen.value = false
  document.body.style.overflow = ''
}

const handlePreviewLoad = () => {
  previewLoading.value = false
  
  // 显示成功信息
  if (currentPaper.value && currentPaper.value.title) {
    ElMessage.success(`论文《${currentPaper.value.title}》预览加载完成`)
  }
}

const handlePreviewError = (event) => {
  console.error('iframe加载错误:', event)
  previewLoading.value = false
  previewError.value = true
  
  // 显示详细错误信息
  ElMessage.error({
    message: `论文预览加载失败\nURL: ${previewUrl.value}\n请检查网络连接或联系管理员`,
    duration: 5000,
    showClose: true
  })
}

// 重试预览
const retryPreview = async (paper) => {
  previewError.value = false
  previewLoading.value = true
  previewUrl.value = ''
  
  try {
    const paperId = paper.paperId || paper.id || paper.paperBaseInfo?.paperId
    const res = await getPaperPreviewUrl(paperId)
    
    if (res.code === 200 && res.data) {
      const rawUrl = res.data.previewUrl || res.data.url
      previewUrl.value = buildPreviewUrl(rawUrl)
      
      if (previewUrl.value) {
        previewError.value = false
        previewLoading.value = true
      } else {
        previewError.value = true
        ElMessage.warning('预览URL为空')
      }
    } else {
      previewError.value = true
      ElMessage.error(res.message || '获取预览URL失败')
    }
  } catch (error) {
    console.error('重试预览失败:', error)
    previewError.value = true
    ElMessage.error('重试预览失败: ' + error.message)
  }
}

// 在新窗口打开预览
const openInNewWindow = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
    ElMessage.info('已在新窗口打开预览')
  } else {
    ElMessage.warning('暂无可用的预览链接')
  }
}

// 复制预览链接
const copyPreviewUrl = async () => {
  if (previewUrl.value) {
    try {
      await navigator.clipboard.writeText(previewUrl.value)
      ElMessage.success('预览链接已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制链接')
    }
  } else {
    ElMessage.warning('暂无可用的预览链接')
  }
}

const viewOverduePapers = () => {
  showOnlyOverdue.value = true
}

const clearOverdueFilter = () => {
  showOnlyOverdue.value = false
}

// 计算属性
const overduePapers = computed(() => {
  if (!Array.isArray(papers.value)) return []
  return papers.value.filter(p => isOverdue(p))
})

const computeDeadlineFromSubmit = (submitTime, days = 7) => {
  if (!submitTime) return null;
  const t = new Date(submitTime);
  if (isNaN(t.getTime())) return null;
  const deadline = new Date(t.getTime() + days * 24 * 60 * 60 * 1000);
  return deadline.toISOString();
}

const filteredPapers = computed(() => {
  if (showOnlyOverdue.value) {
    const list = overduePapers.value.slice()
    list.sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
    return list
  }
  const papersArray = Array.isArray(papers.value) ? [...papers.value] : []
  let result = papersArray

  // 按优先级筛选（兼容字符串和数字）
  if (filterPriority.value) {
    const priorityMap = { urgent: ['urgent', 2], high: ['high', 1], normal: ['normal', 0] }
    const match = priorityMap[filterPriority.value] || []
    result = result.filter(paper => match.includes(paper.priority))
  }

  // 按学院筛选（精确匹配）
  if (filterCollege.value) {
    result = result.filter(paper => paper.college === filterCollege.value)
  }

  // 按相似度筛选
  if (filterSimilarity.value) {
    result = result.filter(paper => {
      const s = paper.similarity
      if (filterSimilarity.value === 'low') return s < 15
      if (filterSimilarity.value === 'medium') return s >= 15 && s < 30
      if (filterSimilarity.value === 'high') return s >= 30
      return true
    })
  }

  // 排序
  result.sort((a, b) => sortDesc.value
    ? new Date(b.submitTime) - new Date(a.submitTime)
    : new Date(a.submitTime) - new Date(b.submitTime)
  )

  return result
})

const getWaitingTimeClass = (days) => {
  if (days >= 3) return 'waiting-long'
  if (days >= 1) return 'waiting-medium'
  return 'waiting-short'
}

const isOverdue = (paper) => {
  if (!paper) return false;
  const deadlineStr = paper.deadline;
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return false;
  const now = new Date();
  return deadline.getTime() < now.getTime();
}

const isUrgent = (paper) => {
  if (!paper) return false;
  const deadlineStr = paper.deadline;
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return false;
  const now = new Date();
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);
  return hoursLeft >= 0 && hoursLeft < 24;
}

const urgentPapers = computed(() => {
  if (!Array.isArray(papers.value)) return []
  return papers.value.filter(p => !isOverdue(p) && isUrgent(p))
})

// 使用导入的 formatDateTime 函数

const truncateText = (text, maxLength = 50) => {
  if (text == null) return '';
  
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

// 事件处理
const handleSelectionChange = (selection) => {
  selectedPapers.value = selection
}

const toggleSort = () => {
  sortDesc.value = !sortDesc.value
}

const refreshList = async () => {
  loading.value = true
  try {
    // 并行获取论文列表和统计信息
    const [listResponse, statsResponse] = await Promise.all([
      getPendingReviewList(),
      getPendingStats(userStore.userInfo?.userId)
    ])
    
    const raw = listResponse?.data?.records || []

    // 增强的 normalize 函数，支持从嵌套结构中获取字段
    const normalize = (item) => {
      // 从嵌套结构中获取数据
      const base = item?.paperBaseInfo || {}
      const task = item?.taskBaseInfo || {}
      
      return {
        ...item,
        // 保持兼容性，确保所有字段都有合理的默认值
        paperId: item.paperId ?? base.paperId ?? item.id ?? null,
        paperTitle: item.paperTitle ?? base.paperTitle ?? '',
        studentName: item.studentName ?? base.studentName ?? '',
        studentId: item.studentId ?? base.studentId ?? '',
        studentNo: item.studentNo ?? base.studentNo ?? '',
        submitTime: item.submitTime ?? base.submitTime ?? null,
        similarity: item.similarity ?? task.checkRate ?? 0,
        waitingTime: item.waitingTime ?? 0,
        priority: item.priority ?? 'normal',
        deadline: item.deadline ?? null,
        college: item.college ?? base.college ?? '未知学院',
        email: item.email ?? base.email ?? ''
      }
    }

    // 过滤掉完全为空的记录并规范化
    const list = raw
      .filter(it => it && typeof it === 'object' && (Object.keys(it).length > 0))
      .map(normalize)

    papers.value = list

    // 更新统计数据（使用后端返回的真实数据）
    if (statsResponse?.code === 200 && statsResponse?.data) {
      const backendStats = statsResponse.data
      stats.totalPending = backendStats.totalPending ?? list.length
      stats.urgentPending = backendStats.urgentPending ?? 0
      stats.avgWaitingTime = backendStats.avgWaitingTime ?? 0
      stats.todayReviewed = backendStats.todayReviewed ?? 0
    } else {
      // 后端接口异常时使用前端计算
      stats.totalPending = list.length
      const overdueCount = list.filter(p => isOverdue(p)).length
      const soonCount = list.filter(p => !isOverdue(p) && isUrgent(p)).length
      stats.urgentPending = overdueCount + soonCount
      
      if (list.length > 0) {
        const totalWaitingTime = list.reduce((sum, paper) => sum + (Number(paper.waitingTime) || 0), 0)
        stats.avgWaitingTime = parseFloat((totalWaitingTime / list.length).toFixed(1))
      } else {
        stats.avgWaitingTime = 0
      }
      // 获取今日审核数
      getTodayReviewedCountLocal()
    }
  } catch (error) {
    console.error('获取待审核论文列表失败:', error)
    ElMessage.error('获取数据失败，请重试')
  } finally {
    loading.value = false
  }
}

const reviewPaper = (paper) => {
  // 兼容多种 id 存放位置
  currentPaperId.value = paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null
  reviewDialogVisible.value = true
}

// 相似度等级定义
const similarityLevels = [
  { value: 'low', label: '低风险', min: 0, max: 15, color: '#67C23A' },
  { value: 'medium', label: '中风险', min: 15, max: 30, color: '#E6A23C' },
  { value: 'high', label: '高风险', min: 30, max: 100, color: '#F56C6C' }
]

const getSimilarityLevel = (similarity) => {
  if (similarity < 15) return '低风险'
  if (similarity < 30) return '中风险'
  return '高风险'
}

const requestRecheck = async (paper) => {
  try {
    await ElMessageBox.confirm(
      `确定要对论文《${paper.paperTitle}》重新进行查重检测吗？这可能需要一些时间。`,
      '重新查重检测',
      {
        type: 'warning',
        confirmButtonText: '确认检测',
        cancelButtonText: '取消'
      }
    )
    
    const response = await recheckPlagiarism(paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null)
    
    if (response?.code === 200) {
      ElMessage.success(response.message || '已提交重新检测请求')
      // 可以轮询检测状态或刷新列表
      setTimeout(() => {
        refreshList()
      }, 3000)
    } else {
      ElMessage.error(response?.message || '重新检测请求失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新查重检测失败:', error)
      ElMessage.error('重新检测请求失败，请重试')
    }
  }
}

const viewSimilarityReport = (paper) => {
  currentPaperId.value = paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null
  reportDialogVisible.value = true
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  // 给用户明确的视觉反馈
  if (isFullscreen.value) {
    ElMessage.success('已进入全屏模式')
  } else {
    ElMessage.info('已退出全屏模式')
  }
  
  // 强制重新计算布局
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}

const handleReportApprove = (paperId) => {
  ElMessage.success('论文审核已通过')
  reportDialogVisible.value = false
  refreshList()
}

const handleReportRevision = ({ paperId, suggestion }) => {
  ElMessage.success('修改要求已发送')
  reportDialogVisible.value = false
  refreshList()
}

const contactStudent = async (paper) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入联系内容', `联系学生：${paper.studentName}`, {
      inputType: 'textarea',
      inputPlaceholder: '请输入要传达给学生的信息...',
      confirmButtonText: '发送',
      cancelButtonText: '取消'
    })
    
    if (value) {
      const response = await contactStudentApi({
        studentId: paper.studentId ?? paper.studentNo ?? '',
        paperId: paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null,
        message: value,
        messageType: 'chat'
      })
      
      if (response?.code === 200) {
        ElMessage.success(response.message || '消息已发送')
      } else {
        ElMessage.error(response?.message || '消息发送失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('联系学生失败:', error)
      ElMessage.error('消息发送失败，请重试')
    }
  }
}

const handleMoreAction = async (paper, command) => {
  switch (command) {
    case 'viewPaper':
      viewPaper(paper)
      break
    case 'download':
      try {
        const paperId = paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id
        if (!paperId) {
          ElMessage.error('无法获取论文ID')
          return
        }
        const res = await downloadPaper(paperId)
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data])
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `论文_${paper.paperTitle || paperId}.docx`
        link.click()
        window.URL.revokeObjectURL(url)
        ElMessage.success('论文下载成功')
      } catch (error) {
        console.error('下载失败:', error)
        ElMessage.error('下载失败，请重试')
      }
      break
    case 'viewReport':
      viewSimilarityReport(paper)
      break
    case 'remind':
      try {
        await ElMessageBox.confirm(`确定要提醒学生 ${paper.studentName} 吗？`, '提醒学生', {
          type: 'warning'
        })
        
        const response = await sendReminder({
          studentIds: [paper.studentId ?? paper.studentNo ?? ''],
          message: `请及时处理您的论文《${paper.paperTitle}》的审核反馈`,
          paperIds: [paper.paperId ?? paper.paperBaseInfo?.paperId ?? paper.id ?? null]
        })
        
        if (response?.code === 200) {
          ElMessage.success(response.message || '提醒已发送')
        } else {
          ElMessage.error(response?.message || '提醒发送失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('发送提醒失败:', error)
          ElMessage.error('提醒发送失败，请重试')
        }
      }
      break
    case 'delegate':
      try {
        const { value: reason } = await ElMessageBox.prompt('请输入委托原因', '委托审核', {
          inputPlaceholder: '请输入委托原因...',
          confirmButtonText: '确认委托',
          cancelButtonText: '取消'
        })

        if (reason) {
          const paperId = paper.paperId || paper.paperBaseInfo?.paperId || paper.id
          const res = await delegateReview({
            paperId: String(paperId),
            reason,
            studentId: String(paper.studentId ?? paper.studentNo ?? '')
          })
          if (res?.code === 200) {
            ElMessage.success(res.message || '委托审核请求已提交')
          } else {
            ElMessage.error(res?.message || '委托审核请求提交失败')
          }
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('委托操作失败:', error)
          ElMessage.error('委托操作失败，请重试')
        }
      }
      break
    case 'recheck':
      requestRecheck(paper)
      break
  }
}

const batchReview = async () => {
  if (selectedPapers.value.length === 0) {
    ElMessage.warning('请先选择要审核的论文')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量审核 ${selectedPapers.value.length} 篇论文吗？`,
      '批量审核',
      { type: 'warning', confirmButtonText: '开始审核', cancelButtonText: '取消' }
    )
    currentPaperId.value = selectedPapers.value[0]?.paperId || selectedPapers.value[0]?.id || null
    reviewDialogVisible.value = true
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核操作失败:', error)
      ElMessage.error('批量审核操作失败，请重试')
    }
  }
}

const batchRemind = async () => {
  if (selectedPapers.value.length === 0) {
    ElMessage.warning('请先选择要提醒的论文')
    return
  }
  
  try {
    const names = selectedPapers.value.map(p => p.studentName).join(', ')
    await ElMessageBox.confirm(
      `确定要批量提醒 ${selectedPapers.value.length} 位学生吗？\n${names}`,
      '批量提醒',
      {
        type: 'info',
        confirmButtonText: '发送提醒',
        cancelButtonText: '取消'
      }
    )
    
    const response = await sendReminder({
      studentIds: selectedPapers.value.map(p => p.studentId || p.studentNo || ''),
      message: '请及时处理您的论文审核反馈',
      paperIds: selectedPapers.value.map(p => p.paperId || p.paperBaseInfo?.paperId || p.id || null)
    })
    
    if (response?.code === 200) {
      ElMessage.success(`${response.message || '已向'} ${selectedPapers.value.length} 位学生发送提醒`)
      clearSelection()
    } else {
      ElMessage.error(response?.message || '批量提醒发送失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量提醒失败:', error)
      ElMessage.error('批量提醒发送失败，请重试')
    }
  }
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
  selectedPapers.value = []
}

const viewUrgentPapers = () => {
  filterPriority.value = 'urgent'
}

const getTodayReviewedCountLocal = async () => {
  try {
    const response = await getTodayReviewedCount(userStore.userInfo?.userId)
    if (response?.code === 200 && response?.data) {
      stats.todayReviewed = response.data.count || 0
    } else {
      stats.todayReviewed = 0
    }
  } catch (error) {
    console.error('获取今日审核数量失败:', error)
    stats.todayReviewed = 0
  }
}

const handleReviewCompleted = async (reviewResult) => {
  try {
    // 刷新列表并关闭对话框
    await refreshList()
    reviewDialogVisible.value = false
    
    // 批量审核后清空选择
    if (reviewResult && reviewResult.batch) {
      clearSelection()
    }
  } catch (error) {
    console.error('审核操作失败:', error)
    ElMessage.error('审核操作失败，请重试')
  }
}

const loadColleges = async () => {
  try {
    const res = await getAllColleges()
    if (res.code === 200) {
      collegeList.value = res.data || []
    }
  } catch (e) {
    console.error('获取学院列表失败:', e)
  }
}

onMounted(async () => {
  await Promise.all([refreshList(), loadColleges()])
})

onUnmounted(() => {
  // 组件卸载时清理全屏状态
  if (isFullscreen.value) {
    document.body.style.overflow = ''
  }
})
</script>
