<template>
  <div class="dashboard-page">
    <PageHeader
      :description="`欢迎回来，${userStore.userInfo?.realName || '同学'} · ${currentDate}`"
    >
      <template #actions>
        <el-button type="primary" :icon="UploadFilled" @click="goToPaperSubmit">提交新论文</el-button>
        <el-button :icon="Download" @click="exportDashboardData">导出数据</el-button>
      </template>
    </PageHeader>

    <!-- 关键指标 -->
    <div class="kpi-grid" v-loading="loading.stats">
      <div class="kpi-card">
        <span class="kpi-label">总提交数</span>
        <span class="kpi-value">{{ stats.submittedCount || 0 }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">待审核</span>
        <span class="kpi-value">{{ stats.pendingCount || 0 }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">已通过</span>
        <span class="kpi-value">{{ stats.approvedCount || 0 }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">需修改</span>
        <span class="kpi-value">{{ stats.revisionCount || 0 }}</span>
      </div>
    </div>

    <div class="dashboard-main">
      <!-- 左列：任务主线 -->
      <div class="dashboard-col">
        <!-- 当前论文 -->
        <section class="dash-card">
          <header class="dash-card-head">
            <div class="dash-card-title">
              <el-icon><Document /></el-icon>
              <span>当前论文</span>
            </div>
            <el-button v-if="latestPaper && latestPaper.id" text @click="goToPaperStatus">论文状态</el-button>
          </header>

          <div v-if="latestPaper && latestPaper.id" class="paper-body">
            <div class="paper-headline">
              <h2 class="paper-title">{{ latestPaper.title }}</h2>
              <el-tag :type="getStatusType(latestPaper.status)" size="small" round>
                {{ getStatusText(latestPaper.status) }}
              </el-tag>
            </div>

            <div class="paper-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDateTime(latestPaper.submitTime) }}
              </span>
              <span class="meta-item">
                <el-icon><EditPen /></el-icon>
                {{ latestPaper.wordCount ? latestPaper.wordCount + ' 字' : '字数暂无' }}
              </span>
              <span v-if="latestPaper.version" class="meta-item">
                <el-icon><Files /></el-icon>
                V{{ latestPaper.version }}
              </span>
              <span v-if="latestPaper.advisorName" class="meta-item">
                <el-icon><User /></el-icon>
                {{ latestPaper.advisorName }}
                <el-tag size="small" :type="getAllocationStatusTagType(latestPaper.allocationStatus)">
                  {{ getAllocationStatusText(latestPaper.allocationStatus) }}
                </el-tag>
              </span>
            </div>

            <div class="paper-similarity">
              <div class="similarity-top">
                <span class="similarity-label">总相似比</span>
                <span class="similarity-value" :class="getSimilarityStatusClass(latestPaperSimilarity)">
                  {{ hasSimilarityData ? latestPaperSimilarity + '%' : '未检测' }}
                </span>
              </div>
              <div v-if="hasSimilarityData" class="similarity-track">
                <div
                  class="similarity-fill"
                  :class="getSimilarityClass(latestPaperSimilarity)"
                  :style="{ width: Math.min(latestPaperSimilarity, 100) + '%' }"
                ></div>
              </div>
              <p class="similarity-note">
                {{ hasSimilarityData ? getSimilarityLabel(latestPaperSimilarity) : '该论文暂未生成查重结果' }}
              </p>
            </div>

            <div v-if="latestPaper.feedback" class="paper-feedback">
              <div class="feedback-title">
                <el-icon><ChatLineRound /></el-icon>
                <span>导师反馈</span>
              </div>
              <p class="feedback-text">{{ latestPaper.feedback }}</p>
            </div>

            <div class="paper-actions">
              <el-button type="primary" :icon="View" @click="viewPaperDetails">查看详情</el-button>
            </div>
          </div>

          <div v-else-if="!loading.paper" class="card-empty">
            <el-icon class="empty-icon"><Document /></el-icon>
            <p>暂无论文提交记录</p>
            <el-button type="primary" @click="goToPaperSubmit">提交第一篇论文</el-button>
          </div>
          <div v-else class="card-empty" v-loading="true"></div>
        </section>

        <!-- 待办事项 -->
        <section class="dash-card">
          <header class="dash-card-head">
            <div class="dash-card-title">
              <el-icon><List /></el-icon>
              <span>待办事项</span>
            </div>
            <span class="dash-card-hint">按完成状态与截止时间排序</span>
          </header>

          <div class="todo-list" v-loading="todosLoading">
            <div
              v-for="item in sortedTodos"
              :key="item.id"
              class="todo-item"
              :class="{ 'is-done': item.completed }"
            >
              <span class="todo-dot" :class="getPriorityClass(item.priority)"></span>
              <div class="todo-main">
                <div class="todo-title">{{ item.title }}</div>
                <div v-if="item.description" class="todo-desc">{{ item.description }}</div>
              </div>
              <span v-if="item.dueDate" class="todo-due">{{ formatDateTime(item.dueDate) }}</span>
            </div>

            <div v-if="sortedTodos.length === 0 && !todosLoading" class="card-empty compact">
              <el-icon class="empty-icon"><CircleCheck /></el-icon>
              <p>暂无待办事项</p>
            </div>
          </div>
        </section>

        <!-- 论文处理进度 -->
        <section class="dash-card">
          <header class="dash-card-head">
            <div class="dash-card-title">
              <el-icon><DataLine /></el-icon>
              <span>论文处理进度</span>
            </div>
            <el-tag :type="getProgressStatusType(currentProgress)" size="small" round>
              {{ getProgressStatusText(currentProgress) }}
            </el-tag>
          </header>

          <div class="progress-body" v-loading="loading.progress">
            <ol class="progress-steps">
              <li
                v-for="(step, index) in progressSteps"
                :key="index"
                class="progress-step"
                :class="{
                  'step-done': index < currentProgress,
                  'step-current': index === currentProgress
                }"
              >
                <span class="step-index">{{ index + 1 }}</span>
                <div class="step-text">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-desc">{{ step.description }}</div>
                </div>
              </li>
            </ol>

            <div class="progress-summary">
              <span class="summary-item">
                <el-icon><Timer /></el-icon>
                预计完成：{{ estimatedCompletion }}
              </span>
              <span class="summary-item">
                <el-icon><Lightning /></el-icon>
                处理速度：{{ processingSpeed }}
              </span>
            </div>
          </div>
        </section>

      </div>

      <!-- 右列：节点 / 导师 / 通知 -->
      <aside class="dashboard-aside">
        <!-- 重要时间节点 -->
        <section class="dash-card">
          <header class="dash-card-head">
            <div class="dash-card-title">
              <el-icon><Calendar /></el-icon>
              <span>重要时间节点</span>
            </div>
            <el-button text :icon="Download" @click="addAllToCalendar">加入日历</el-button>
          </header>

          <ul class="deadline-list" v-loading="loading.deadlines">
            <li class="deadline-item">
              <span class="deadline-icon">
                <el-icon><EditPen /></el-icon>
              </span>
              <div class="deadline-text">
                <span class="deadline-label">论文提交截止</span>
                <span class="deadline-date">{{ deadlines.submissionDeadline || '待公布' }}</span>
              </div>
              <span
                v-if="deadlines.submissionDeadline"
                class="countdown-badge"
                :class="getCountdownClass(deadlines.submissionDeadline)"
              >
                剩余 {{ getCountdownDays(deadlines.submissionDeadline) }} 天
              </span>
            </li>

            <li class="deadline-item">
              <span class="deadline-icon">
                <el-icon><Check /></el-icon>
              </span>
              <div class="deadline-text">
                <span class="deadline-label">审核截止</span>
                <span class="deadline-date">{{ deadlines.reviewDeadline || '待公布' }}</span>
              </div>
              <span
                v-if="deadlines.reviewDeadline"
                class="countdown-badge"
                :class="getCountdownClass(deadlines.reviewDeadline)"
              >
                剩余 {{ getCountdownDays(deadlines.reviewDeadline) }} 天
              </span>
            </li>

            <li class="deadline-item">
              <span class="deadline-icon">
                <el-icon><Microphone /></el-icon>
              </span>
              <div class="deadline-text">
                <span class="deadline-label">答辩时间</span>
                <span class="deadline-date">{{ deadlines.defenseDate || '待公布' }}</span>
              </div>
              <span
                v-if="deadlines.defenseDate"
                class="countdown-badge"
                :class="getCountdownClass(deadlines.defenseDate)"
              >
                剩余 {{ getCountdownDays(deadlines.defenseDate) }} 天
              </span>
            </li>

            <li class="deadline-item">
              <span class="deadline-icon">
                <el-icon><Trophy /></el-icon>
              </span>
              <div class="deadline-text">
                <span class="deadline-label">预计毕业</span>
                <span class="deadline-date">{{ deadlines.graduationDate || '待公布' }}</span>
              </div>
              <span v-if="deadlines.graduationDate" class="countdown-badge goal">目标</span>
            </li>
          </ul>
        </section>

        <!-- 指导老师 -->
        <section class="dash-card">
          <header class="dash-card-head">
            <div class="dash-card-title">
              <el-icon><UserFilled /></el-icon>
              <span>我的指导老师</span>
            </div>
            <el-button v-if="hasAdvisor" text @click="contactAdvisor">联系</el-button>
          </header>

          <div v-if="hasAdvisor" class="advisor-profile">
            <div class="advisor-avatar-section">
              <div
                class="advisor-avatar"
                :style="{ backgroundImage: `url(${getAvatarUrl(advisorInfo.avatar)})` }"
              >
                {{ advisorInfo.name?.charAt(0) }}
              </div>
              <div class="advisor-status">
                <span class="status-indicator" :class="advisorOnlineStatus.className"></span>
                <span>{{ advisorOnlineStatus.text }}</span>
              </div>
            </div>

            <div class="advisor-info">
              <h3 class="advisor-name">{{ advisorInfo.name }}</h3>
              <p class="advisor-title">{{ advisorInfo.title || '暂无' }}</p>
              <div v-if="advisorInfo.expertise && advisorInfo.expertise.length" class="advisor-expertise">
                <span v-for="field in advisorInfo.expertise" :key="field" class="expertise-tag">
                  {{ field }}
                </span>
              </div>
              <div class="advisor-contact">
                <div class="contact-item">
                  <el-icon><Phone /></el-icon>
                  <span>{{ advisorInfo.phone || '暂无' }}</span>
                </div>
                <div class="contact-item">
                  <el-icon><Message /></el-icon>
                  <span>{{ advisorInfo.email || '暂无' }}</span>
                </div>
                <div class="contact-item">
                  <el-icon><OfficeBuilding /></el-icon>
                  <span>{{ advisorInfo.office || '暂无' }}</span>
                </div>
              </div>
            </div>

            <div class="advisor-stats">
              <div class="advisor-stat">
                <div class="stat-number">{{ advisorInfo.guidedPapersCount ?? '暂无' }}</div>
                <div class="stat-label">指导论文</div>
              </div>
              <div class="advisor-stat">
                <div class="stat-number">
                  {{ advisorInfo.approvalRate != null ? advisorInfo.approvalRate + '%' : '暂无' }}
                </div>
                <div class="stat-label">通过率</div>
              </div>
              <div class="advisor-stat">
                <div class="stat-number">{{ advisorInfo.averageScore ?? '暂无' }}</div>
                <div class="stat-label">评分</div>
              </div>
            </div>
          </div>

          <div v-else-if="!loading.advisor" class="card-empty">
            <el-icon class="empty-icon"><UserFilled /></el-icon>
            <p>暂未分配指导老师</p>
            <span class="empty-hint">系统将在论文提交后自动为您分配指导老师</span>
            <el-button type="primary" @click="goToPaperSubmit">立即提交论文</el-button>
          </div>
          <div v-else class="card-empty" v-loading="true"></div>
        </section>

        <!-- 通知消息 -->
        <section class="dash-card">
          <header class="dash-card-head">
            <div class="dash-card-title">
              <el-icon><Bell /></el-icon>
              <span>通知消息</span>
            </div>
            <el-button text @click="viewAllNotifications">查看全部</el-button>
          </header>

          <div v-if="notifications.length > 0" class="notification-list">
            <div v-for="(item, index) in notifications" :key="item.id ?? index" class="notification-item">
              <div class="notification-title">{{ item.title || '系统通知' }}</div>
              <div v-if="item.content || item.message" class="notification-content">
                {{ item.content || item.message }}
              </div>
              <div class="notification-time">{{ formatDateTime(item.createTime || item.createdAt) }}</div>
            </div>
          </div>
          <div v-else-if="!loading.notifications" class="card-empty compact">
            <el-icon class="empty-icon"><Bell /></el-icon>
            <p>暂无通知消息</p>
          </div>
          <div v-else class="card-empty compact" v-loading="true"></div>
        </section>
      </aside>

      <!-- 数据分析：横跨两列，避免右栏底部留白 -->
      <section class="dash-card charts-section">
        <header class="dash-card-head">
          <div class="dash-card-title">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </div>
          <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
        </header>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-head">
              <el-icon><DataAnalysis /></el-icon>
              <span>个人能力评估</span>
            </div>
            <div v-if="hasRadarData" :ref="radarChart.chartRef" class="chart-container"></div>
            <div v-else-if="!loading.radar" class="chart-empty">
              <el-icon class="empty-icon"><DataAnalysis /></el-icon>
              <p>暂无评估数据</p>
            </div>
            <div v-else class="chart-empty" v-loading="true"></div>
          </div>

          <div class="chart-card">
            <div class="chart-head">
              <el-icon><TrendCharts /></el-icon>
              <span>总相似比变化趋势</span>
            </div>
            <div v-if="hasTrendData" :ref="trendChart.chartRef" class="chart-container"></div>
            <div v-else-if="!loading.trend" class="chart-empty">
              <el-icon class="empty-icon"><TrendCharts /></el-icon>
              <p>暂无检测数据</p>
            </div>
            <div v-else class="chart-empty" v-loading="true"></div>
          </div>
        </div>

        <div class="chart-card full-width">
          <div class="chart-head">
            <el-icon><Histogram /></el-icon>
            <span>与专业平均水平对比</span>
          </div>
          <div v-if="hasComparisonData" :ref="comparisonChart.chartRef" class="chart-container-large"></div>
          <div v-else-if="!loading.comparison" class="chart-empty">
            <el-icon class="empty-icon"><Histogram /></el-icon>
            <p>暂无专业对比数据</p>
          </div>
          <div v-else class="chart-empty" v-loading="true"></div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getLatestPaper, getAdvisorInfo, getStudentDashboardStats, getDashboardDeadlines, getAbilityRadarData, getSimilarityTrendChart, getMajorComparisonData, getNotifications, getProgressTracking, exportDashboardStats, getTodoList } from "@/api/student.js"
import { useChart } from '@/composables/useChart'
import PageHeader from '@/components/common/PageHeader.vue'

// 图标导入
import {
  UploadFilled, Download, Document, Clock, Check, EditPen,
  DataLine, Refresh, View, Edit, List, UserFilled, Phone,
  Message, ChatDotRound, Bell, Lightning, CircleCheck,
  OfficeBuilding, ChatLineRound, TrendCharts, PieChart as PieChartIcon, Calendar, QuestionFilled,
  Delete, Setting, Files, Warning, Trophy, ScaleToOriginal, Star, Timer,
  Collection, Plus, DataAnalysis, User, Histogram, Microphone
} from '@element-plus/icons-vue'
import { getAvatarUrl } from '@/utils/avatar'
import { handleSimilarity, getPaperStatusText, getPaperStatusType, formatDateTime } from '@/utils/dataType'
import { getSimilarityClass, getSimilarityLabel, getSimilarityLevel } from '@/utils/similarity.js'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据

const stats = reactive({
  submittedCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  revisionCount: 0
})
const latestPaper = ref(null)
const advisorInfo = ref(null)
const notifications = ref([])
const todos = ref([])
const todosLoading = ref(false)
const loading = reactive({
  stats: false,
  paper: false,
  advisor: false,
  deadlines: false,
  radar: false,
  trend: false,
  comparison: false,
  notifications: false,
  progress: false
})

// 时间节点相关数据
const deadlines = reactive({
  submissionDeadline: '',
  reviewDeadline: '',
  defenseDate: '',
  graduationDate: ''
})

// 图表相关数据
const abilityRadarData = reactive({
  paperCount: 0,
  passRate: 0,
  averageSimilarity: 0,
  revisionTimes: 0,
  onTimeSubmission: 0,
  advisorRating: 0
})

const similarityTrendData = reactive({
  versions: [],
  similarities: []
})

const majorComparisonData = reactive({
  dimensions: [],
  myLevel: [],
  majorAverage: []
})

const progressTrackingData = reactive({
  currentStep: 0,
  estimatedCompletion: '',
  processingSpeed: '',
  steps: []
})

// 监听图表数据变化，自动更新图表
watch([abilityRadarData, similarityTrendData, majorComparisonData], () => {
  renderRadarChart()
  renderTrendChart()
  renderComparisonChart()
}, { deep: true })

// 图表相关引用（useChart 托管容器/dispose/resize；空态由模板 hasXxxData 分支承载）
const radarChart = useChart()
const trendChart = useChart()
const comparisonChart = useChart()

// 计算属性
const currentProgress = computed(() => {
  // 优先使用进度跟踪接口返回的数据
  if (progressTrackingData.currentStep !== undefined && progressTrackingData.currentStep !== null) {
    return progressTrackingData.currentStep;
  }
  // 如果没有论文，返回 0
  if (!latestPaper.value) return 0;
  const status = latestPaper.value.status;
  const progressMap = {
    'draft': 0,
    'submitted': 1,
    'pending': 1,
    'auditing': 2,
    'reviewed': 2,
    'rejected': 3,
    'revised': 3,
    'completed': 4
  };
  return progressMap[status] || 0;
});

// 进度步骤数据
const progressSteps = computed(() => {
  // 如果有进度跟踪接口返回的步骤数据，优先使用
  if (progressTrackingData.steps && progressTrackingData.steps.length > 0) {
    return progressTrackingData.steps.map(step => ({
      title: step.name,
      description: step.description
    }));
  }

  // 否则根据当前进度计算步骤状态
  const progress = currentProgress.value;
  return [
    {
      title: '论文提交',
      description: progress >= 1 ? '已完成' : (progress === 0 && latestPaper.value ? '进行中' : '等待提交')
    },
    {
      title: '查重检测',
      description: progress >= 2 ? '已完成' : (progress === 1 ? '进行中' : '等待检测')
    },
    {
      title: '导师审核',
      description: getReviewStatus(latestPaper.value)
    },
    {
      title: '审核通过',
      description: progress >= 4 ? '已完成' : (progress === 3 ? '需修改' : '等待审核')
    }
  ];
});

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 新增计算属性
const averageSimilarity = computed(() => {
  return abilityRadarData.averageSimilarity || 0
})

const advisorRating = computed(() => {
  return abilityRadarData.advisorRating || 0
})

// 导师在线状态：null 显示未知
const advisorOnlineStatus = computed(() => {
  const status = advisorInfo.value?.onlineStatus
  if (status === null || status === undefined || status === '') {
    return { className: 'unknown', text: '未知' }
  }
  if (status === true || status === 'online' || status === 'ONLINE') {
    return { className: 'online', text: '在线' }
  }
  return { className: 'offline', text: '离线' }
})

// 是否已分配导师（接口无导师时会回填「暂未分配」占位）
const hasAdvisor = computed(() => {
  const name = advisorInfo.value?.name
  return !!name && name !== '暂未分配'
})

// 待办排序：未完成优先，截止时间升序（无截止时间排后），最多 5 条
const sortedTodos = computed(() => {
  return [...todos.value]
    .sort((a, b) => {
      const aDone = a.completed ? 1 : 0
      const bDone = b.completed ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      if (aTime !== bTime) return aTime - bTime
      return new Date(b.createTime || 0) - new Date(a.createTime || 0)
    })
    .slice(0, 5)
})

// 趋势图是否有数据
const hasTrendData = computed(() => {
  return Array.isArray(similarityTrendData.similarities) && similarityTrendData.similarities.length > 0
})

// 雷达图是否有数据：六个指标全为 0/空时视为无评估数据，展示空态
const hasRadarData = computed(() => {
  const d = abilityRadarData
  return [d.paperCount, d.passRate, d.revisionTimes, d.averageSimilarity, d.onTimeSubmission, d.advisorRating]
    .some(v => v !== null && v !== undefined && Number(v) !== 0)
})

// 专业对比图是否有数据
const hasComparisonData = computed(() => {
  return Array.isArray(majorComparisonData.dimensions) && majorComparisonData.dimensions.length > 0
})

const estimatedCompletion = computed(() => {
  if (progressTrackingData.estimatedCompletion) {
    // 如果是日期格式，格式化显示
    const dateStr = progressTrackingData.estimatedCompletion;
    if (dateStr === '已完成') return '已完成';
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (e) {
      // 解析失败直接返回原值
    }
    return dateStr;
  }
  // 后端未返回预估时间
  return '暂无预估';
})

const processingSpeed = computed(() => {
  // 后端根据最近查重任务的真实耗时返回（快速/正常/较慢），无记录返回 null → 暂无
  return progressTrackingData.processingSpeed || '暂无';
})

// 方法
// 加载待办事项（失败静默，不阻塞其他区块）
const loadTodos = async () => {
  todosLoading.value = true
  try {
    const res = await getTodoList()
    const data = res?.data
    todos.value = Array.isArray(data) ? data : (Array.isArray(data?.records) ? data.records : [])
  } catch (error) {
    console.error('加载待办事项失败:', error)
    todos.value = []
  } finally {
    todosLoading.value = false
  }
}

// 加载仪表盘数据
const loadDashboardData = async () => {
  // 设置所有加载状态为 true
  Object.keys(loading).forEach(key => {
    loading[key] = true
  })
  
  try {
    // 并行请求所有数据
    const [statsRes, paperRes, advisorRes, deadlinesRes, radarRes, trendRes, comparisonRes, notifRes, progressRes] = await Promise.all([
      getStudentDashboardStats(),
      getLatestPaper(),
      getAdvisorInfo(),
      getDashboardDeadlines(),
      getAbilityRadarData(),
      getSimilarityTrendChart(),
      getMajorComparisonData(),
      getNotifications(5),
      getProgressTracking()
    ])
    
    // 处理统计数据
    if (statsRes.code === 200) {
      Object.assign(stats, statsRes.data || {})
    } else {
      ElMessage.error(statsRes.message || '获取统计数据失败')
    }
    loading.stats = false
    
    // 处理最新论文数据
    if (paperRes.code === 200) {
      latestPaper.value = paperRes.data
      // 如果没有最新论文，显示默认状态
      if (!latestPaper.value) {
        latestPaper.value = {
          id: null,
          title: '暂无论文',
          status: 'SUBMITTED',
          similarity: null,
          submitTime: null,
          advisorName: null,
          feedback: null,
          wordCount: 0
        }
      }
    } else {
      ElMessage.error(paperRes.message || '获取论文信息失败')
    }
    loading.paper = false
    
    //处理导师信息
    if (advisorRes.code === 200) {
      advisorInfo.value = advisorRes.data
      // 如果没有导师信息，显示默认状态
      if (!advisorInfo.value) {
        advisorInfo.value = {
          name: '暂未分配',
          title: '待分配',
          researchField: '待分配导师后显示',
          phone: '待分配',
          email: '待分配',
          office: '待分配',
          avatar: '',
          expertise: []
        }
      }
    } else {
      ElMessage.error(advisorRes.message || '获取导师信息失败')
    }
    loading.advisor = false
    
    // 处理时间节点数据
    if (deadlinesRes.code === 200) {
      Object.assign(deadlines, deadlinesRes.data || {})
    } else {
      ElMessage.error(deadlinesRes.message || '获取时间节点失败')
    }
    loading.deadlines = false
    
    // 处理能力评估雷达图数据
    if (radarRes.code === 200) {
      Object.assign(abilityRadarData, radarRes.data || {})
    } else {
      ElMessage.error(radarRes.message || '获取能力评估数据失败')
    }
    loading.radar = false
    
    // 处理相似度趋势数据
    if (trendRes.code === 200) {
      const trendData = trendRes.data || {}
      if (trendData.similarities) {
        trendData.similarities = trendData.similarities.map(v => handleSimilarity(v))
      }
      Object.assign(similarityTrendData, trendData)
    } else {
      ElMessage.error(trendRes.message || '获取相似度趋势失败')
    }
    loading.trend = false
    
    // 处理专业对比数据
    if (comparisonRes.code === 200) {
      Object.assign(majorComparisonData, comparisonRes.data || {})
    } else {
      ElMessage.error(comparisonRes.message || '获取专业对比数据失败')
    }
    loading.comparison = false
    
    // 处理通知消息
    if (notifRes.code === 200) {
      notifications.value = notifRes.data || []
    } else {
      ElMessage.error(notifRes.message || '获取通知消息失败')
    }
    loading.notifications = false
    
    // 处理进度跟踪数据
    if (progressRes.code === 200) {
      Object.assign(progressTrackingData, progressRes.data || {})
    } else {
      ElMessage.error(progressRes.message || '获取进度跟踪数据失败')
    }
    loading.progress = false
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('网络错误，请检查连接后重试')
    // 出错时设置所有加载状态为 false
    Object.keys(loading).forEach(key => {
      loading[key] = false
    })
  } finally {
    // 数据加载完成后初始化图表
    renderRadarChart()
    renderTrendChart()
    renderComparisonChart()
  }
}

const refreshData = async () => {
  ElMessage.info('正在刷新数据...')
  await Promise.all([loadDashboardData(), loadTodos()])
  ElMessage.success('数据已刷新')
}

const exportDashboardData = () => {
  ElMessageBox.confirm('确定要导出当前数据吗？', '导出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      ElMessage.info('正在导出数据...')
      const res = await exportDashboardStats()
      const blob = res.data || res
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `工作台数据_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      ElMessage.success('数据导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error(error.message || '数据导出失败')
    }
  })
}

const goToPaperSubmit = () => {
  router.push('/student/paper-submit')
}

const goToPaperStatus = () => {
  router.push('/student/my-papers')
}

const viewPaperDetails = () => {
  if (latestPaper.value) {
    router.push({
      path: '/student/paper-details',
      query: { id: latestPaper.value.id }
    })
  }
}

const contactAdvisor = () => {
  if (advisorInfo.value) {
    ElMessageBox.alert(
      `您可以通过以下方式联系${advisorInfo.value.name}老师：\n\n📞 电话：${advisorInfo.value.phone}\n📧 邮箱：${advisorInfo.value.email}\n🏢 办公室：${advisorInfo.value.office}`,
      '联系指导老师',
      {
        confirmButtonText: '我知道了',
        callback: () => {
        }
      }
    )
  }
}

const viewAllNotifications = () => {
  router.push('/message-center')
}

const getStatusType = (status) => {
  return getPaperStatusType(status)
}

const getStatusText = (status) => {
  return getPaperStatusText(status)
}

const getAllocationStatusText = (allocationStatus) => {
  const map = {
    'pending': '等待教师确认',
    'confirmed': '教师已确认',
    'rejected': '已拒绝',
    'pending_reassign': '导师拒绝，正在重新分配'
  }
  return map[allocationStatus] || allocationStatus || '未知'
}

const getAllocationStatusTagType = (allocationStatus) => {
  const map = {
    'pending': 'warning',
    'confirmed': 'success',
    'rejected': 'danger'
  }
  return map[allocationStatus] || 'info'
}

// 重复率分档统一走 utils/similarity.js，本页只保留展示类名与文案
const SIMILARITY_TREND_TONE = {
  unknown: 'neutral',
  low: 'positive',
  medium: 'warning',
  high: 'negative'
}
const SIMILARITY_TREND_TEXT = {
  unknown: '稳定',
  low: '优秀',
  medium: '良好',
  high: '需关注'
}

const getSimilarityTrendClass = (similarity) => SIMILARITY_TREND_TONE[getSimilarityLevel(similarity)]

const getSimilarityTrend = (similarity) => SIMILARITY_TREND_TEXT[getSimilarityLevel(similarity)]

// 相似度字段兼容：后端详情接口用 similarityRate/checkRate，列表接口用 similarity
// checkRate 可能是小数(0.23)或整数(23)，统一转为整数百分比
const latestPaperSimilarity = computed(() => {
  if (!latestPaper.value) return 0
  const raw = latestPaper.value.checkRate
    ?? latestPaper.value.similarityRate
    ?? latestPaper.value.similarity
  return raw !== undefined && raw !== null ? handleSimilarity(raw) : 0
})

// 检查是否有相似度数据
const hasSimilarityData = computed(() => {
  if (!latestPaper.value) return false
  // 检查是否存在任何相似度相关字段，包括值为0的情况
  return 'checkRate' in latestPaper.value ||
         'similarityRate' in latestPaper.value ||
         'similarity' in latestPaper.value
})

// 待办优先级圆点
const getPriorityClass = (priority) => {
  const map = {
    high: 'priority-high',
    normal: 'priority-normal',
    low: 'priority-low'
  }
  return map[priority] || 'priority-normal'
}

const getTimeTrendClass = (time) => {
  if (!time) return 'neutral'
  if (time <= 2) return 'positive'
  if (time <= 5) return 'warning'
  return 'negative'
}

const getTimeTrend = (time) => {
  if (!time) return '正常'
  if (time <= 2) return '很快'
  if (time <= 5) return '适中'
  return '较慢'
}

const getProgressStatusType = (progress) => {
  const typeMap = {
    0: 'info',
    1: 'primary',
    2: 'warning',
    3: 'danger',
    4: 'success'
  }
  return typeMap[progress] || 'info'
}

const getProgressStatusText = (progress) => {
  const textMap = {
    0: '未开始',
    1: '已提交',
    2: '审核中',
    3: '需修改',
    4: '已完成'
  }
  return textMap[progress] || '未知'
}

const getReviewStepStatus = (paper) => {
  // 如果有进度跟踪数据，使用接口返回的步骤状态
  if (progressTrackingData.steps && progressTrackingData.steps.length > 2) {
    const reviewStep = progressTrackingData.steps[2];
    return reviewStep?.status || 'wait';
  }
  
  if (!paper) return 'wait';
  if (paper.status === 'auditing') return 'process';
  if (paper.status === 'rejected') return 'error';
  if (paper.status === 'completed') return 'finish';
  return 'wait';
};

const getReviewStatus = (paper) => {
  // 如果有进度跟踪数据，优先使用接口返回的描述
  if (progressTrackingData.steps && progressTrackingData.steps.length > 2) {
    const reviewStep = progressTrackingData.steps[2];
    if (reviewStep?.description) {
      return reviewStep.description;
    }
  }
  
  if (!paper) return '等待提交';
  const statusMap = {
    'draft': '草稿中，可随时提交',
    'submitted': '已提交，等待审核',
    'auditing': '审核中，请耐心等待',
    'rejected': '审核未通过，需要修改',
    'completed': '审核通过，恭喜完成',
    'revised': '已修改，重新提交审核'
  };
  return statusMap[paper.status] || '未知状态';
}

onMounted(() => {
  // 确保 userStore.token 存在
  if (userStore.token) {
    loadDashboardData()
    loadTodos()
  } else {
    // 等待一段时间后再尝试
    setTimeout(() => {
      if (userStore.token) {
        loadDashboardData()
        loadTodos()
      } else {
        ElMessage.error('登录状态未初始化，请刷新页面')
      }
    }, 500)
  }
})

// 时间节点相关方法
const getCountdownDays = (targetDate) => {
  if (!targetDate) return 0;
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getCountdownType = (targetDate) => {
  const days = getCountdownDays(targetDate);
  if (days <= 3) return 'danger';
  if (days <= 7) return 'warning';
  return 'success';
};

const getCountdownClass = (targetDate) => {
  const days = getCountdownDays(targetDate);
  if (days <= 3) return 'danger';
  if (days <= 7) return 'warning';
  return 'success';
};

const getSimilarityStatusClass = (similarity) => {
  if (!hasSimilarityData.value) return 'status-info'
  const map = {
    low: 'status-success',
    medium: 'status-warning',
    high: 'status-danger',
    unknown: 'status-info',
  }
  return map[getSimilarityLevel(similarity)]
};

const addAllToCalendar = () => {
  const formatICSDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  const events = [
    { title: '论文提交截止', date: deadlines.submissionDeadline },
    { title: '审核截止', date: deadlines.reviewDeadline },
    { title: '答辩时间', date: deadlines.defenseDate },
    { title: '预计毕业', date: deadlines.graduationDate }
  ].filter(e => e.date)
  if (events.length === 0) {
    ElMessage.warning('暂无可用的时间节点')
    return
  }
  const icsLines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CheckRepeatSystem//CN']
  events.forEach((e, i) => {
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:deadline-${i}@checkrepeat`,
      `DTSTART:${formatICSDate(e.date)}`,
      `SUMMARY:${e.title}`,
      'END:VEVENT'
    )
  })
  icsLines.push('END:VCALENDAR')
  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = '论文时间节点.ics'; link.click()
  window.URL.revokeObjectURL(url)
  ElMessage.success('日历文件已下载')
};

// 图表渲染方法
const renderRadarChart = () => {
  if (!hasRadarData.value) {
    radarChart.render(null);
    return;
  }

  radarChart.render({
    tooltip: {},
    radar: {
      indicator: [
        { name: '论文数量', max: 10 },
        { name: '通过率', max: 100 },
        { name: '平均相似度', max: 100 },
        { name: '修改次数', max: 10 },
        { name: '按时提交', max: 100 },
        { name: '导师评分', max: 100 }
      ],
      radius: '65%'
    },
    series: [{
      name: '个人能力评估',
      type: 'radar',
      data: [
        {
          value: [
            abilityRadarData.paperCount ?? 0,
            abilityRadarData.passRate ?? 0,
            // 相似度取反：100 - 相似度，这样越低越好
            (100 - (abilityRadarData.averageSimilarity ?? 0)),
            abilityRadarData.revisionTimes ?? 0,
            abilityRadarData.onTimeSubmission ?? 0,
            abilityRadarData.advisorRating ?? 0
          ],
          name: '我的能力',
          areaStyle: {
            color: 'rgba(0, 102, 204, 0.3)'
          },
          lineStyle: {
            color: '#0066cc'
          },
          itemStyle: {
            color: '#0066cc'
          }
        }
      ]
    }]
  });
};

const renderTrendChart = () => {
  if (!hasTrendData.value) {
    trendChart.render(null);
    return;
  }

  trendChart.render({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: similarityTrendData.versions
    },
    yAxis: {
      type: 'value',
      name: '总相似比 (%)',
      min: 0,
      max: 100
    },
    series: [{
      name: '总相似比',
      type: 'line',
      smooth: true,
      data: similarityTrendData.similarities,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 87, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
          ]
        }
      },
      lineStyle: {
        width: 3,
        color: '#f5576c'
      },
      itemStyle: {
        color: '#f5576c'
      }
    }]
  });
};

const renderComparisonChart = () => {
  if (!hasComparisonData.value) {
    comparisonChart.render(null);
    return;
  }

  comparisonChart.render({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['我的水平', '专业平均']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: majorComparisonData.dimensions
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '我的水平',
        type: 'bar',
        data: majorComparisonData.myLevel,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#0066cc' },
              { offset: 1, color: '#0055aa' }
            ]
          }
        }
      },
      {
        name: '专业平均',
        type: 'bar',
        data: majorComparisonData.majorAverage,
        itemStyle: {
          color: '#e0e0e0'
        }
      }
    ]
  });
};
</script>

<style lang="scss" scoped>
// 颜色/圆角/间距一律引用 design-tokens.scss（唯一真源）

// ── KPI ─────────────────────────────────────────────────────
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--app-space-4);
  margin-bottom: var(--app-space-6);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
  padding: var(--app-space-4) var(--app-space-6);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}

.kpi-label {
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.kpi-value {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-metric);
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

// ── 布局 ────────────────────────────────────────────────────
.dashboard-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--app-space-6);
  align-items: start;
}

// 宽图表独占一行，不参与左右分栏的高度竞争
.charts-section {
  grid-column: 1 / -1;
}

.dashboard-col,
.dashboard-aside {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-6);
  min-width: 0;
}

// ── 卡片 ────────────────────────────────────────────────────
.dash-card {
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-6);
}

.dash-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-4);
}

.dash-card-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  font-family: var(--app-font-family);
  font-size: var(--app-fs-heading);
  font-weight: 600;
  color: var(--app-color-ink);
}

.dash-card-title .el-icon {
  color: var(--app-color-text-muted);
}

.dash-card-hint {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
}

.card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-2);
  padding: var(--app-space-8) var(--app-space-6);
  color: var(--app-color-text-muted);
  text-align: center;

  p {
    margin: 0;
    font-size: var(--app-fs-caption);
  }

  &.compact {
    padding: var(--app-space-6) var(--app-space-3);
  }
}

.card-empty .empty-icon {
  font-size: 28px;
  color: var(--app-color-text-secondary);
}

.empty-hint {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
}

// ── 当前论文 ────────────────────────────────────────────────
.paper-headline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-3);

  .el-tag {
    flex-shrink: 0;
  }
}

.paper-title {
  margin: 0;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-display);
  font-weight: 600;
  line-height: 1.3;
  color: var(--app-color-ink);
  word-break: break-word;
}

.status-success {
  color: var(--app-color-success);
  background: var(--app-color-success-bg);
}

.status-warning {
  color: var(--app-color-warning);
  background: var(--app-color-warning-bg);
}

.status-danger {
  color: var(--app-color-danger);
  background: var(--app-color-danger-bg);
}

.status-info {
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
}

.paper-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-2) var(--app-space-6);
  margin-bottom: var(--app-space-4);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.paper-similarity {
  padding: var(--app-space-3) var(--app-space-4);
  background: var(--app-color-fill);
  border-radius: var(--app-radius-md);
}

.similarity-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.similarity-label {
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.similarity-value {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-title);
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  &.status-success { color: var(--app-color-success); }
  &.status-warning { color: var(--app-color-warning); }
  &.status-danger { color: var(--app-color-danger); }
  &.status-info { color: var(--app-color-text-secondary); }
}

.similarity-track {
  height: 6px;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-border);
  overflow: hidden;
}

.similarity-fill {
  height: 100%;
  border-radius: var(--app-radius-pill);
  transition: width var(--app-transition-slow);

  &.similarity-low { background: var(--app-color-rate-low); }
  &.similarity-medium { background: var(--app-color-rate-medium); }
  &.similarity-high { background: var(--app-color-rate-high); }
  &.similarity-neutral { background: var(--app-color-border); }
}

.similarity-note {
  margin: 6px 0 0;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
}

.paper-feedback {
  margin-top: var(--app-space-4);
  padding: var(--app-space-3) var(--app-space-4);
  background: var(--app-color-info-bg);
  border-radius: var(--app-radius-md);
}

.feedback-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--app-space-1);
  font-size: var(--app-fs-meta);
  font-weight: 600;
  color: var(--app-color-primary);
}

.feedback-text {
  margin: 0;
  font-size: var(--app-fs-caption);
  line-height: var(--app-lh-body);
  color: var(--app-color-ink);
}

.paper-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--app-space-4);
}

// ── 待办 ────────────────────────────────────────────────────
.todo-list {
  min-height: 40px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-3);
  padding: var(--app-space-3) 0;
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child {
    border-bottom: none;
  }

  &.is-done .todo-title {
    text-decoration: line-through;
    color: var(--app-color-text-muted);
  }
}

.todo-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: var(--app-radius-pill);

  &.priority-high { background: var(--app-color-danger); }
  &.priority-normal { background: var(--app-color-warning); }
  &.priority-low { background: var(--app-color-info); }
}

.todo-main {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: var(--app-fs-caption);
  font-weight: 500;
  color: var(--app-color-ink);
}

.todo-desc {
  margin-top: 2px;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.todo-due {
  flex-shrink: 0;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  font-variant-numeric: tabular-nums;
}

// ── 进度 ────────────────────────────────────────────────────
.progress-steps {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.progress-step {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-3);
  opacity: 0.55;
}

.progress-step.step-done,
.progress-step.step-current {
  opacity: 1;
}

.step-index {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-fill);
  color: var(--app-color-text-muted);
  font-size: var(--app-fs-meta);
  font-weight: 600;
}

.step-done .step-index {
  background: var(--app-color-success-bg);
  color: var(--app-color-success);
}

.step-current .step-index {
  background: var(--app-color-primary);
  color: var(--app-color-on-primary);
}

.step-title {
  font-size: var(--app-fs-caption);
  font-weight: 500;
}

.step-desc {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-secondary);
}

.progress-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-3) var(--app-space-6);
  margin-top: var(--app-space-4);
  padding-top: var(--app-space-3);
  border-top: 1px solid var(--app-color-divider);
}

.summary-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

// ── 图表 ────────────────────────────────────────────────────
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-4);
}

.chart-card {
  min-width: 0;

  &.full-width {
    margin-top: var(--app-space-4);
  }
}

.chart-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--app-space-2);
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.chart-container {
  width: 100%;
  height: 280px;
}

.chart-container-large {
  width: 100%;
  height: 300px;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-2);
  height: 280px;
  color: var(--app-color-text-muted);
  font-size: var(--app-fs-meta);
  background: var(--app-color-fill);
  border-radius: var(--app-radius-md);
}

.chart-empty .empty-icon {
  font-size: 24px;
  color: var(--app-color-text-secondary);
}

// ── 时间节点 ────────────────────────────────────────────────
.deadline-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.deadline-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: var(--app-space-3) 0;
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.deadline-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--app-radius-sm);
  background: var(--app-color-fill);
  color: var(--app-color-primary);
}

.deadline-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.deadline-label {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.deadline-date {
  font-size: var(--app-fs-caption);
  font-weight: 500;
  color: var(--app-color-ink);
  font-variant-numeric: tabular-nums;
}

.countdown-badge {
  flex-shrink: 0;
  padding: 2px var(--app-space-2);
  border-radius: var(--app-radius-pill);
  font-size: var(--app-fs-meta);
  white-space: nowrap;

  &.success {
    color: var(--app-color-success);
    background: var(--app-color-success-bg);
  }

  &.warning {
    color: var(--app-color-warning);
    background: var(--app-color-warning-bg);
  }

  &.danger {
    color: var(--app-color-danger);
    background: var(--app-color-danger-bg);
  }

  &.goal {
    color: var(--app-color-primary);
    background: var(--app-color-info-bg);
  }
}

// ── 导师 ────────────────────────────────────────────────────
.advisor-profile {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
}

.advisor-avatar-section {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
}

.advisor-avatar {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-radius-pill);
  background-color: var(--app-color-fill);
  background-size: cover;
  background-position: center;
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-primary);
}

.advisor-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-text-secondary);

  &.online { background: var(--app-color-success); }
  &.offline { background: var(--app-color-text-secondary); }
  &.unknown { background: var(--app-color-border); }
}

.advisor-name {
  margin: 0;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  font-weight: 600;
}

.advisor-title {
  margin: 2px 0 0;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.advisor-expertise {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--app-space-2);
}

.expertise-tag {
  padding: 2px var(--app-space-2);
  border-radius: var(--app-radius-pill);
  background: var(--app-color-fill);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.advisor-contact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: var(--app-space-3);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  word-break: break-all;
}

.advisor-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--app-space-2);
  padding-top: var(--app-space-3);
  border-top: 1px solid var(--app-color-divider);
}

.advisor-stat {
  text-align: center;
}

.advisor-stat .stat-number {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.advisor-stat .stat-label {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

// ── 通知 ────────────────────────────────────────────────────
.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  padding: var(--app-space-3) 0;
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.notification-title {
  font-size: var(--app-fs-caption);
  font-weight: 500;
  color: var(--app-color-ink);
}

.notification-content {
  margin-top: 2px;
  font-size: var(--app-fs-meta);
  line-height: 1.5;
  color: var(--app-color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  margin-top: var(--app-space-1);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  font-variant-numeric: tabular-nums;
}

// ── 响应式 ──────────────────────────────────────────────────
@media (max-width: 1200px) {
  .dashboard-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .paper-headline {
    flex-direction: column;
  }
}
</style>
