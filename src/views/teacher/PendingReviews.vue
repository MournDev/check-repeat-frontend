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
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalPending }}</div>
              <div class="stat-label">待审核总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.urgentPending }}</div>
              <div class="stat-label">紧急待审</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.avgWaitingTime }}天</div>
              <div class="stat-label">平均等待时间</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.todayReviewed }}</div>
              <div class="stat-label">今日已审</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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
              <el-option label="计算机学院" value="computer" />
              <el-option label="电子信息学院" value="electronic" />
              <el-option label="机械工程学院" value="mechanical" />
              <el-option label="管理学院" value="management" />
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
        :data="filteredPapers"
        class="enhanced-table"
        row-class-name="table-row"
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <PriorityBadge :priority="row.priority" />
          </template>
        </el-table-column>

        <el-table-column prop="studentName" label="学生信息" width="220">
          <template #default="{ row }">
            <div class="student-info-enhanced">
              <div class="student-avatar">
                <el-avatar :size="32" :src="getAvatarUrl(row.avatar)">
                  {{ row.studentName.charAt(0) }}
                </el-avatar>
              </div>
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

        <el-table-column prop="paperTitle" label="论文信息" min-width="280">
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
                    {{ formatDate(row.submitTime) }}
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

        <el-table-column prop="similarity" label="查重结果" width="200">
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
              <div>{{ formatDateTime(row.deadline) }}</div>
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
      :selected-papers="selectedPapers"
      @review-completed="handleReviewCompleted"
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
        <!-- 调试信息 -->
        <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 5px; z-index: 1000; font-size: 12px;">
          调试: loading={{ previewLoading }}, error={{ previewError }}, url={{ !!previewUrl }}, fullscreen={{ isFullscreen }}
        </div>
        
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
          <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <p><strong>调试信息：</strong></p>
            <p>预览URL: {{ previewUrl || '无' }}</p>
            <p>加载状态: {{ previewLoading ? '加载中' : '已完成' }}</p>
            <p>错误状态: {{ previewError ? '有错误' : '无错误' }}</p>
          </div>
          
          <!-- 备用操作 -->
          <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffeaa7;">
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

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useUserStore } from '@/stores/user'
import ReviewDialog from '@/views/teacher/ReviewDialog.vue'
import PlagiarismReportViewer from '@/views/teacher/PlagiarismReportViewer.vue'
// import SimilarityReportDialog from './components/SimilarityReportDialog.vue'
import PriorityBadge from '@/views/teacher/PriorityBadge.vue'
import { getAvatarUrl } from '@/utils/avatar'
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
  getReviewHistory,
  getTeacherReviewHistory,
  getDetailedPlagiarismReport
} from '@/api/teacher.js'
import { convertToBackendStatus } from '@/utils/reviewStatus.js'
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
  ArrowDown
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

// 加载状态
const loading = ref(false)

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
const viewPaper = async (paper) => {
  try {
    console.log('查看论文:', paper)
    
    // 重置所有状态
    previewLoading.value = true
    previewError.value = false
    previewUrl.value = ''
    currentPaper.value = null
    
    const loading = ElLoading.service({
      lock: true,
      text: '正在加载论文信息...',
      background: 'rgba(0,0,0,0.4)'
    })
    
    const paperId = paper.paperId || paper.id || paper.paperBaseInfo?.paperId
    console.log('论文ID:', paperId)
    
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
    
    console.log('论文内容响应:', contentRes)
    console.log('预览URL响应:', previewRes)
    
    // 处理论文内容
    if (contentRes.code === 200 && contentRes.data) {
      currentPaper.value = contentRes.data
      console.log('当前论文数据:', currentPaper.value)
    } else {
      console.warn('获取论文内容失败:', contentRes.message)
    }
    
    // 处理预览URL
    if (previewRes.code === 200 && previewRes.data) {
      console.log('预览响应完整数据:', previewRes)
      
      // 检查多种可能的数据结构
      const rawUrl = previewRes.data.previewUrl || 
                    previewRes.data.url || 
                    previewRes.data.onlineUrl || 
                    previewRes.data.preview_url ||
                    (typeof previewRes.data === 'string' ? previewRes.data : null)
      
      console.log('提取的原始URL:', rawUrl)
      
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
      
      let finalUrl = rawUrl
      
      // 如果是KKFileView的onlinePreview URL，直接使用
      if (rawUrl && rawUrl.includes('onlinePreview')) {
        finalUrl = rawUrl
        console.log('使用KKFileView预览URL:', finalUrl)
      } else {
        // 如果是文件下载URL，尝试包装成KKFileView格式
        try {
          if (rawUrl && rawUrl.includes('url=')) {
            const urlParam = new URLSearchParams(rawUrl.split('?')[1]).get('url')
            if (urlParam) {
              finalUrl = decodeURIComponent(atob(urlParam))
              console.log('解码后的文件URL:', finalUrl)
              
              // 重新包装为KKFileView格式
              const encodedFileUrl = btoa(finalUrl)
              finalUrl = `http://192.168.30.138:8080/onlinePreview?url=${encodedFileUrl}`
              console.log('重新包装的KKFileView URL:', finalUrl)
            }
          }
        } catch (decodeError) {
          console.warn('URL处理失败:', decodeError)
          finalUrl = rawUrl
        }
      }
      
      previewUrl.value = finalUrl
      console.log('最终预览URL:', previewUrl.value)
      
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
      ElLoading.service().close()
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
  console.log('iframe加载完成')
  previewLoading.value = false
  
  // 显示成功信息
  if (currentPaper.value && currentPaper.value.title) {
    ElMessage.success(`论文《${currentPaper.value.title}》预览加载完成`)
  }
}

const handlePreviewError = (event) => {
  console.error('iframe加载错误:', event)
  console.log('当前previewUrl:', previewUrl.value)
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
  console.log('重新加载预览:', paper)
  previewError.value = false
  previewLoading.value = true
  previewUrl.value = ''
  
  try {
    const paperId = paper.paperId || paper.id || paper.paperBaseInfo?.paperId
    const res = await getPaperPreviewUrl(paperId)
    
    if (res.code === 200 && res.data) {
      const rawUrl = res.data.previewUrl || res.data.url
      let finalUrl = rawUrl
      
      // 使用相同的URL处理逻辑
      if (rawUrl && rawUrl.includes('onlinePreview')) {
        finalUrl = rawUrl
      } else {
        try {
          if (rawUrl && rawUrl.includes('url=')) {
            const urlParam = new URLSearchParams(rawUrl.split('?')[1]).get('url')
            if (urlParam) {
              const decodedUrl = decodeURIComponent(atob(urlParam))
              const encodedFileUrl = btoa(decodedUrl)
              finalUrl = `http://192.168.30.138:8080/onlinePreview?url=${encodedFileUrl}`
            }
          }
        } catch (decodeError) {
          console.warn('URL处理失败:', decodeError)
        }
      }
      
      previewUrl.value = finalUrl
      console.log('重试预览URL:', previewUrl.value)
      
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
  // 确保papers.value是数组
  if (showOnlyOverdue.value) {
    const list = overduePapers.value.slice()
    list.sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
    return list
  }
  const papersArray = Array.isArray(papers.value) ? [...papers.value] : []
  let result = papersArray
  
  // 按优先级筛选
  if (filterPriority.value) {
    result = result.filter(paper => paper.priority === filterPriority.value)
  }
  
  // 按学院筛选
  if (filterCollege.value) {
    result = result.filter(paper => paper.college.includes(filterCollege.value))
  }
  
  // 按相似度筛选
  if (filterSimilarity.value) {
    result = result.filter(paper => {
      const similarity = paper.similarity
      if (filterSimilarity.value === 'low') return similarity < 15
      if (filterSimilarity.value === 'medium') return similarity >= 15 && similarity < 30
      if (filterSimilarity.value === 'high') return similarity >= 30
      return true
    })
  }
  
  // 排序
  result.sort((a, b) => {
    if (sortDesc.value) {
      return new Date(b.submitTime) - new Date(a.submitTime)
    } else {
      return new Date(a.submitTime) - new Date(b.submitTime)
    }
  })
  
  return result
})

// 工具函数
const getSimilarityColor = (similarity) => {
  if (!similarity) return '#909399'
  if (similarity < 15) return '#52c41a'
  if (similarity < 30) return '#faad14'
  return '#ff4d4f'
}

const getSimilarityClass = (similarity) => {
  if (similarity < 15) return 'similarity-low'
  if (similarity < 30) return 'similarity-medium'
  return 'similarity-high'
}

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

const formatDate = (dateString) => {
  const datePart = dateString?.split(' ')[0];
  return datePart ?? '-';
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const truncateText = (text, maxLength = 50) => {
  if (text == null) return '';
  
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

// 事件处理
const handleSelectionChange = (selection) => {
  selectedPapers.value = selection
}

const handleRowClick = (row) => {
  // 可以选择查看详情
  console.log('点击行:', row)
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

    // 将 paperBaseInfo 展平并做字段兜底
    const normalize = (item) => {
      const base = item?.paperBaseInfo || {}
      const submit = item.submitTime ?? base.submitTime ?? base.createTime ?? null
      const backendDeadline = item.deadline ?? base.deadline ?? item.taskBaseInfo?.deadline ?? item.reviewOperateInfo?.deadline ?? null
      const reviewDays = item.reviewDays ?? base.reviewDays ?? 7
      const finalDeadline = backendDeadline ?? computeDeadlineFromSubmit(submit, reviewDays)

      return {
        ...item,
        paperId: item.paperId ?? base.paperId ?? base.paperId ?? null,
        paperTitle: item.paperTitle ?? base.paperTitle ?? base.paperName ?? '',
        studentName: item.studentName ?? base.studentName ?? base.realName ?? '',
        studentId: item.studentId ?? base.studentId ?? base.studentNo ?? item.studentNo ?? '',
        studentNo: item.studentNo ?? base.studentNo ?? '',
        submitTime: submit,
        similarity: item.similarity ?? base.similarity ?? base.similarityRate ?? 0,
        waitingTime: item.waitingTime ?? item.daysWaiting ?? 0,
        priority: item.priority ?? 'normal',
        deadline: finalDeadline,
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

const getSimilarityTagType = (similarity) => {
  if (similarity <= 15) return 'success'
  if (similarity <= 30) return 'warning'
  return 'danger'
}

const getSimilarityLevel = (similarity) => {
  if (similarity <= 15) return '低风险'
  if (similarity <= 30) return '中风险'
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
  console.log('全屏状态切换:', isFullscreen.value)
  
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
  loadPendingPapers()
}

const handleReportRevision = ({ paperId, suggestion }) => {
  ElMessage.success('修改要求已发送')
  reportDialogVisible.value = false
  loadPendingPapers()
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
        // 这里应该调用下载接口
        ElMessage.success('开始下载论文文件')
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
          // 这里需要选择委托教师，简化处理
          ElMessage.info('委托审核功能开发中')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('委托操作失败')
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
    // 弹出审核对话框进行审核决策
    ElMessageBox.confirm(
      `确定要批量审核 ${selectedPapers.value.length} 篇论文吗？`,
      '批量审核',
      {
        type: 'warning',
        confirmButtonText: '开始审核',
        cancelButtonText: '取消'
      }
    ).then(() => {
      // 打开审核对话框，传递多个论文ID以支持批量操作
      currentPaperId.value = selectedPapers.value[0]?.paperId || selectedPapers.value[0]?.id || null
      reviewDialogVisible.value = true
    })
  } catch (error) {
    console.error('批量审核操作失败:', error)
    ElMessage.error('批量审核操作失败，请重试')
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
    // 如果有审核结果，则调用doReview接口
    if (reviewResult) {
      // 根据是否有选中论文来决定是单个审核还是批量审核
      let paperIds = []
      
      if (selectedPapers.value.length > 1) {
        // 批量审核：使用选中的论文ID
        paperIds = selectedPapers.value.map(paper => paper.paperId || paper.id)
      } else {
        // 单个审核：使用当前论文ID
        paperIds = [currentPaperId.value]
      }
      
      const reviewData = {
        paperIds: paperIds,
        reviewStatus: convertToBackendStatus(statusValue), // 统一转换为后端期望的整型状态
        reviewOpinion: reviewResult.opinion || '',
        reviewAttach: reviewResult.attach || null
      }
      
      await doReview(reviewData)
      
      if (paperIds.length > 1) {
        ElMessage.success(`成功审核 ${paperIds.length} 篇论文`)
        // 批量审核后清空选择
        clearSelection()
      } else {
        ElMessage.success('论文审核成功')
      }
    }
    
    // 刷新列表并关闭对话框
    await refreshList()
    reviewDialogVisible.value = false
  } catch (error) {
    console.error('审核操作失败:', error)
    ElMessage.error('审核操作失败，请重试')
  }
}

onMounted(async () => {
  await refreshList()
})

onUnmounted(() => {
  // 组件卸载时清理全屏状态
  if (isFullscreen.value) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.teacher-pending {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left .page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-left .page-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #909399;
}

.urgent-alert {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 4px 0;
}

.action-card {
  margin-bottom: 16px;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.action-left,
.action-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-card {
  margin-bottom: 20px;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-name {
  font-weight: 500;
  color: #303133;
}

.student-college {
  font-size: 12px;
  color: #909399;
}

.student-contact {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.paper-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paper-title {
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  cursor: pointer;
}

.paper-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.similarity-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.similarity-score {
  display: flex;
  align-items: center;
  gap: 12px;
}

.similarity-bar {
  flex: 1;
}

.similarity-value {
  min-width: 45px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
}

.similarity-low {
  color: #52c41a;
}

.similarity-medium {
  color: #faad14;
}

.similarity-high {
  color: #ff4d4f;
}

.similarity-detail {
  text-align: right;
}

.waiting-time {
  font-weight: 500;
  font-size: 14px;
}

.waiting-short {
  color: #52c41a;
}

.waiting-medium {
  color: #faad14;
}

.waiting-long {
  color: #ff4d4f;
}

.deadline-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.deadline-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff4d4f;
  font-size: 12px;
}

.enhanced-table-card {
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.enhanced-table .table-row:hover {
  background-color: #f5f7fa;
  transition: background-color 0.3s ease;
}

/* 学生信息增强样式 */
.student-info-enhanced {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar {
  flex-shrink: 0;
}

.student-details {
  flex: 1;
  min-width: 0;
}

.student-main-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.student-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.student-secondary-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.college-tag, .contact-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 论文信息增强样式 */
.paper-info-enhanced {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paper-title-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.paper-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  line-height: 1.4;
}

.paper-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.paper-meta-enhanced {
  display: flex;
  gap: 12px;
}

.meta-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background-color: #f0f2f5;
  border-radius: 12px;
  font-size: 12px;
  color: #606266;
}

/* 相似度信息增强样式 */
.similarity-info-enhanced {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.similarity-low {
  color: #67c23a;
}

.similarity-medium {
  color: #e6a23c;
}

.similarity-high {
  color: #f56c6c;
}

.similarity-visual {
  position: relative;
}

.similarity-progress {
  border-radius: 6px;
}

.similarity-indicators {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.indicator-dot.active {
  opacity: 1;
  transform: scale(1.2);
}

.indicator-dot.current {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.similarity-actions {
  display: flex;
  gap: 8px;
}

.report-btn, .recheck-btn {
  flex: 1;
  justify-content: center;
}

/* 操作按钮增强样式 */
.action-buttons-enhanced {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  transition: all 0.3s ease;
}

.primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.secondary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.more-dropdown {
  margin-left: 8px;
}

.more-btn {
  transition: all 0.3s ease;
}

.more-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 报告对话框样式 */
.report-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.report-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: calc(100vh - 200px);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e6e8eb;
  background: #f5f7fa;
}

/* 论文预览对话框样式 */
.preview-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: v-bind('isFullscreen ? "100vh" : "calc(100vh - 200px)"');
}

.preview-dialog.fullscreen :deep(.el-dialog__body) {
  height: 100vh;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-placeholder {
  padding: 20px;
}

.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.error-placeholder p {
  margin: 16px 0;
  font-size: 16px;
}

.batch-actions {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 20px;
  border: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .teacher-pending {
    padding: 12px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-right {
    display: flex;
    justify-content: center;
  }
  
  .action-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-left,
  .action-right {
    width: 100%;
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .batch-actions {
    padding: 12px;
  }
  
  .batch-actions .el-space {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .student-main,
  .paper-meta {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .similarity-score {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .similarity-bar {
    width: 100%;
  }
}
</style>