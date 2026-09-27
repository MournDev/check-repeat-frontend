<template>
  <div class="student-dashboard">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-left">
          <h1 class="welcome-title">欢迎回来，{{ userStore.userInfo?.realName || '同学' }}！</h1>
          <p class="welcome-subtitle">今天是 {{ currentDate }}</p>
        </div>
        <div class="welcome-actions">
          <button class="primary-button" @click="goToPaperSubmit">
            <el-icon><UploadFilled /></el-icon>
            提交新论文
          </button>
          <button class="secondary-button" @click="exportDashboardData">
            <el-icon><Download /></el-icon>
            导出数据
          </button>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon paper-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.submittedCount || 0 }}</div>
            <div class="stat-label">总提交数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingCount || 0 }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon approved-icon">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.approvedCount || 0 }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revision-icon">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.revisionCount || 0 }}</div>
            <div class="stat-label">需修改</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间节点管理 -->
    <div class="section time-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon><Calendar /></el-icon>
          <span>重要时间节点</span>
        </div>
        <button class="text-button" @click="addAllToCalendar">
          <el-icon><Download /></el-icon>
          添加到日历
        </button>
      </div>
      <div class="deadlines-grid">
        <!-- 提交截止 -->
        <div class="deadline-card submission">
          <div class="deadline-icon">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="deadline-content">
            <div class="deadline-label">论文提交截止</div>
            <div class="deadline-date">{{ deadlines.submissionDeadline }}</div>
            <div class="deadline-countdown">
              <span class="countdown-badge" :class="getCountdownClass(deadlines.submissionDeadline)">
                剩余 {{ getCountdownDays(deadlines.submissionDeadline) }} 天
              </span>
            </div>
          </div>
        </div>
        <!-- 审核截止 -->
        <div class="deadline-card review">
          <div class="deadline-icon">
            <el-icon><Check /></el-icon>
          </div>
          <div class="deadline-content">
            <div class="deadline-label">审核截止</div>
            <div class="deadline-date">{{ deadlines.reviewDeadline }}</div>
            <div class="deadline-countdown">
              <span class="countdown-badge" :class="getCountdownClass(deadlines.reviewDeadline)">
                剩余 {{ getCountdownDays(deadlines.reviewDeadline) }} 天
              </span>
            </div>
          </div>
        </div>
        <!-- 答辩时间 -->
        <div class="deadline-card defense">
          <div class="deadline-icon">
            <el-icon><Microphone /></el-icon>
          </div>
          <div class="deadline-content">
            <div class="deadline-label">答辩时间</div>
            <div class="deadline-date">{{ deadlines.defenseDate }}</div>
            <div class="deadline-countdown">
              <span class="countdown-badge" :class="getCountdownClass(deadlines.defenseDate)">
                剩余 {{ getCountdownDays(deadlines.defenseDate) }} 天
              </span>
            </div>
          </div>
        </div>
        <!-- 毕业时间 -->
        <div class="deadline-card graduation">
          <div class="deadline-icon">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="deadline-content">
            <div class="deadline-label">预计毕业</div>
            <div class="deadline-date">{{ deadlines.graduationDate }}</div>
            <div class="deadline-countdown">
              <span class="countdown-badge goal">
                目标
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：论文进度和图表 -->
      <div class="main-left">
        <!-- 论文进度卡片 -->
        <div class="card paper-progress-card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><DataLine /></el-icon>
              <span>论文进度跟踪</span>
            </div>
            <div class="card-actions">
              <button class="text-button" @click="goToPaperStatus">查看全部</button>
              <button class="icon-button" @click="refreshData">
                <el-icon><Refresh /></el-icon>
              </button>
            </div>
          </div>
          <div class="progress-content">
            <div class="progress-header">
              <h3>论文处理进度</h3>
              <span class="progress-status" :class="getProgressStatusClass(currentProgress)">
                {{ getProgressStatusText(currentProgress) }}
              </span>
            </div>
            <div class="progress-steps">
              <div 
                v-for="(step, index) in progressSteps" 
                :key="index"
                class="progress-step"
                :class="{
                  'step-active': index < currentProgress,
                  'step-current': index === currentProgress,
                  'step-pending': index > currentProgress
                }"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-description">{{ step.description }}</div>
                </div>
              </div>
            </div>
            <div class="progress-summary">
              <div class="summary-item">
                <el-icon><Timer /></el-icon>
                <span>预计完成时间：{{ estimatedCompletion }}</span>
              </div>
              <div class="summary-item">
                <el-icon><Lightning /></el-icon>
                <span>处理速度：{{ processingSpeed }}</span>
              </div>
            </div>
          </div>
          <!-- 当前论文详情 -->
          <div v-if="latestPaper" class="paper-details">
            <div class="paper-header">
              <h4>当前论文详情</h4>
              <div class="paper-status">
                <span class="status-badge" :class="getStatusClass(latestPaper.status)">
                  {{ getStatusText(latestPaper.status) }}
                </span>
                <span class="paper-id">ID: {{ latestPaper.id }}</span>
              </div>
            </div>
            <div class="paper-info">
              <div class="info-row">
                <div class="info-item">
                  <div class="info-label">论文标题</div>
                  <div class="info-value title">
                    <el-tooltip :content="latestPaper.title" placement="top">
                      <span>{{ latestPaper.title }}</span>
                    </el-tooltip>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">提交时间</div>
                  <div class="info-value">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(latestPaper.submitTime) }}
                  </div>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item" v-if="latestPaper.advisorName">
                  <div class="info-label">指导老师</div>
                  <div class="info-value">
                    <el-icon><User /></el-icon>
                    {{ latestPaper.advisorName }}
                    <el-tag size="small" :type="getAllocationStatusTagType(latestPaper.allocationStatus)" style="margin-left: 8px">
                      {{ getAllocationStatusText(latestPaper.allocationStatus) }}
                    </el-tag>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">相似度检测</div>
                  <div class="info-value similarity">
                    <div class="similarity-display">
                      <div class="similarity-bar" :style="{ width: latestPaperSimilarity + '%' }" :class="getSimilarityClass(latestPaperSimilarity)"></div>
                      <span class="similarity-text" :class="getSimilarityClass(latestPaperSimilarity)">
                        {{ latestPaperSimilarity }}%
                      </span>
                    </div>
                    <span class="similarity-status" :class="getSimilarityStatusClass(latestPaperSimilarity)">
                      {{ hasSimilarityData ? getSimilarityStatus(latestPaperSimilarity) : '未检测' }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <div class="info-label">字数统计</div>
                  <div class="info-value">
                    <el-icon><EditPen /></el-icon>
                    <span class="word-count">{{ latestPaper.wordCount || '9999+' }} 字</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">版本信息</div>
                  <div class="info-value">
                    <el-icon><Files /></el-icon>
                    <span class="version">V{{ latestPaper.version || 1 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="latestPaper.feedback" class="paper-feedback">
              <div class="feedback-header">
                <el-icon><ChatLineRound /></el-icon>
                <span>导师反馈</span>
              </div>
              <div class="feedback-content">
                {{ latestPaper.feedback }}
              </div>
            </div>
            <div class="paper-actions">
              <button class="primary-button" @click="viewPaperDetails">
                <el-icon><View /></el-icon>
                查看详情
              </button>
            </div>
          </div>
          <div v-else class="no-paper">
            <div class="no-paper-content">
              <el-icon class="empty-icon"><Document /></el-icon>
              <h4>暂无论文提交记录</h4>
              <p>开始您的第一篇论文提交之旅</p>
              <button class="primary-button" @click="goToPaperSubmit">
                <el-icon><UploadFilled /></el-icon>
                提交第一篇论文
              </button>
            </div>
          </div>
        </div>
        <!-- 数据统计可视化 -->
        <div class="charts-grid">
          <!-- 个人能力雷达图 -->
          <div class="card chart-card">
            <div class="card-header">
              <div class="card-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>个人能力评估</span>
              </div>
            </div>
            <div ref="radarChartRef" class="chart-container"></div>
          </div>
          <!-- 相似度趋势图 -->
          <div class="card chart-card">
            <div class="card-header">
              <div class="card-title">
                <el-icon><TrendCharts /></el-icon>
                <span>相似度变化趋势</span>
              </div>
            </div>
            <div ref="trendChartRef" class="chart-container"></div>
          </div>
        </div>
        <!-- 专业对比图 -->
        <div class="card chart-card full-width">
          <div class="card-header">
            <div class="card-title">
              <el-icon><Histogram /></el-icon>
              <span>与专业平均水平对比</span>
            </div>
          </div>
          <div ref="comparisonChartRef" class="chart-container-large"></div>
        </div>
      </div>
      <!-- 右侧：指导老师 -->
      <div class="main-right">
        <!-- 指导老师卡片 -->
        <div class="card advisor-card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><UserFilled /></el-icon>
              <span>我的指导老师</span>
            </div>
            <button class="text-button" @click="contactAdvisor">
              <el-icon><ChatDotRound /></el-icon>
              联系
            </button>
          </div>
          <div v-if="advisorInfo" class="advisor-profile">
            <div class="advisor-avatar-section">
              <div class="advisor-avatar" :style="{ backgroundImage: `url(${getAvatarUrl(advisorInfo.avatar)})` }">
                {{ advisorInfo.name?.charAt(0) }}
              </div>
              <div class="advisor-status">
                <div class="status-indicator online"></div>
                <span>在线</span>
              </div>
            </div>
            <div class="advisor-info">
              <h3 class="advisor-name">{{ advisorInfo.name }}</h3>
              <p class="advisor-title">{{ advisorInfo.title || '教授' }}</p>
              <div class="advisor-expertise">
                <span v-for="field in advisorInfo.expertise" :key="field" class="expertise-tag">
                  {{ field }}
                </span>
              </div>
              <div class="advisor-contact">
                <div class="contact-item">
                  <el-icon><Phone /></el-icon>
                  <span>{{ advisorInfo.phone }}</span>
                </div>
                <div class="contact-item">
                  <el-icon><Message /></el-icon>
                  <span>{{ advisorInfo.email }}</span>
                </div>
                <div class="contact-item">
                  <el-icon><OfficeBuilding /></el-icon>
                  <span>{{ advisorInfo.office || '信息楼 301室' }}</span>
                </div>
              </div>
            </div>
            <div class="advisor-stats">
              <div class="stat-item">
                <div class="stat-number">24</div>
                <div class="stat-label">指导论文</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">98%</div>
                <div class="stat-label">通过率</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">4.8</div>
                <div class="stat-label">评分</div>
              </div>
            </div>
          </div>
          <div v-else class="no-advisor">
            <div class="no-advisor-content">
              <el-icon class="empty-icon"><UserFilled /></el-icon>
              <h4>暂未分配指导老师</h4>
              <p>系统将在论文提交后自动为您分配指导老师</p>
              <button class="primary-button" @click="goToPaperSubmit">
                立即提交论文
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, nextTick, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getLatestPaper, getAdvisorInfo, getStudentDashboardStats, getDashboardDeadlines, getAbilityRadarData, getSimilarityTrendChart, getMajorComparisonData, getTodoList, getNotifications, getProgressTracking, exportDashboardStats } from "@/api/student.js"
import * as echarts from 'echarts'

// 图标导入
import {
  UploadFilled, Download, Document, Clock, Check, EditPen,
  DataLine, Refresh, View, Edit, List, UserFilled, Phone,
  Message, ChatDotRound, Bell, Lightning, CircleCheck,
  OfficeBuilding, ChatLineRound, TrendCharts, PieChart as PieChartIcon, Calendar, QuestionFilled,
  Delete, Setting, Files, Warning, Trophy, ScaleToOriginal, Star, Timer,
  Collection, Plus, DataAnalysis, User
} from '@element-plus/icons-vue'
import { getAvatarUrl } from '@/utils/avatar'
import { handleSimilarity, getSimilarityColor, getSimilarityStatus, getPaperStatusText, getPaperStatusType, formatDateTime } from '@/utils/dataType'
import { getSimilarityTagType as baseGetSimilarityTagType } from '@/utils/reviewStatus.js'

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
const todoList = ref([])
const advisorInfo = ref(null)
const notifications = ref([])
const loading = reactive({
  stats: false,
  paper: false,
  advisor: false,
  deadlines: false,
  radar: false,
  trend: false,
  comparison: false,
  todo: false,
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
  nextTick(() => {
    initRadarChart()
    initTrendChart()
    initComparisonChart()
  })
}, { deep: true })

// 图表相关引用和数据
const radarChartRef = ref(null)
const trendChartRef = ref(null)
const comparisonChartRef = ref(null)
let radarChartInstance = null
let trendChartInstance = null
let comparisonChartInstance = null

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

const pendingTasksCount = computed(() => {
  return todoList.value.filter(t => !t.completed).length
})

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

const avgReviewTime = computed(() => {
  return '3'
})

const collectionCount = computed(() => {
  return '12'
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
  // 根据当前进度计算默认值
  const progress = currentProgress.value;
  const now = new Date();
  switch (progress) {
    case 0: return '未开始';
    case 1: {
      const d = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    case 2: {
      const d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    case 3: {
      const d = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    case 4: return '已完成';
    default: return '计算中';
  }
})

const processingSpeed = computed(() => {
  if (progressTrackingData.processingSpeed) {
    return progressTrackingData.processingSpeed;
  }
  // 根据当前进度返回默认值
  const progress = currentProgress.value;
  const speedMap = {
    0: '未开始',
    1: '等待审核',
    2: '正常处理中',
    3: '需修改后重新提交',
    4: '已完成'
  };
  return speedMap[progress] || '未知';
})

// 方法
// 加载仪表盘数据
const loadDashboardData = async () => {
  // 设置所有加载状态为 true
  Object.keys(loading).forEach(key => {
    loading[key] = true
  })
  
  try {
    // 并行请求所有数据
    const [statsRes, paperRes, advisorRes, deadlinesRes, radarRes, trendRes, comparisonRes, todoRes, notifRes, progressRes] = await Promise.all([
      getStudentDashboardStats(),
      getLatestPaper(),
      getAdvisorInfo(),
      getDashboardDeadlines(),
      getAbilityRadarData(),
      getSimilarityTrendChart(),
      getMajorComparisonData(),
      getTodoList(),
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
    
    // 处理待办事项
    if (todoRes.code === 200) {
      todoList.value = todoRes.data || []
    } else {
      ElMessage.error(todoRes.message || '获取待办事项失败')
    }
    loading.todo = false
    
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
    nextTick(() => {
      initRadarChart()
      initTrendChart()
      initComparisonChart()
    })
  }
}

const refreshData = async () => {
  ElMessage.info('正在刷新数据...')
  await loadDashboardData()
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
  router.push('src/components/MessageCenter.vue')
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

const getSimilarityTrendClass = (similarity) => {
  if (!similarity) return 'neutral'
  if (similarity < 15) return 'positive'
  if (similarity < 30) return 'warning'
  return 'negative'
}

const getSimilarityTrend = (similarity) => {
  if (!similarity) return '稳定'
  if (similarity < 15) return '优秀'
  if (similarity < 30) return '良好'
  return '需关注'
}

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

// 相似度类名获取函数
const getSimilarityClass = (similarity) => {
  if (!similarity) return 'similarity-neutral'
  const sim = handleSimilarity(similarity)
  if (sim < 15) return 'similarity-low'
  if (sim < 30) return 'similarity-medium'
  return 'similarity-high'
}

// 相似度标签类型获取函数
const getSimilarityTagType = (similarity) => {
  if (!similarity) return 'info'
  return baseGetSimilarityTagType(handleSimilarity(similarity))
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
};

// 使用工具函数中的 formatDateTime
// const formatDateTime = (date) => {
//   if (!date) return '-'
//   return new Date(date).toLocaleString('zh-CN', {
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit'
//   })
// }

onMounted(() => {
  // 确保 userStore.token 存在
  if (userStore.token) {
    loadDashboardData()
  } else {
    // 等待一段时间后再尝试
    setTimeout(() => {
      if (userStore.token) {
        loadDashboardData()
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

const getProgressStatusClass = (progress) => {
  const classMap = {
    0: 'status-info',
    1: 'status-primary',
    2: 'status-warning',
    3: 'status-danger',
    4: 'status-success'
  };
  return classMap[progress] || 'status-info';
};

const getStatusClass = (status) => {
  const classMap = {
    'submitted': 'status-primary',
    'assigned': 'status-primary',
    'auditing': 'status-warning',
    'completed': 'status-success',
    'rejected': 'status-danger',
    'draft': 'status-info'
  };
  return classMap[status] || 'status-info';
};

const getSimilarityStatusClass = (similarity) => {
  if (!similarity) return 'status-info';
  const sim = handleSimilarity(similarity);
  if (sim < 15) return 'status-success';
  if (sim < 30) return 'status-warning';
  return 'status-danger';
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

// 图表初始化方法
const initRadarChart = () => {
  if (!radarChartRef.value) return;
  
  radarChartInstance = echarts.init(radarChartRef.value);
  
  const option = {
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
            abilityRadarData.paperCount || 3,
            abilityRadarData.passRate || 85,
            // 相似度取反：100 - 相似度，这样越低越好
            (100 - (abilityRadarData.averageSimilarity || 15.2)),
            abilityRadarData.revisionTimes || 2,
            abilityRadarData.onTimeSubmission || 100,
            abilityRadarData.advisorRating || 90
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
  };
  
  radarChartInstance.setOption(option);
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  
  trendChartInstance = echarts.init(trendChartRef.value);
  
  const option = {
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
      data: similarityTrendData.versions || ['V1', 'V2', 'V3', 'V4']
    },
    yAxis: {
      type: 'value',
      name: '相似度 (%)',
      min: 0,
      max: 100
    },
    series: [{
      name: '相似度',
      type: 'line',
      smooth: true,
      data: similarityTrendData.similarities || [25.8, 22.3, 18.5, 15.2],
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 87, 108, 0.3)' },
          { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
        ])
      },
      lineStyle: {
        width: 3,
        color: '#f5576c'
      },
      itemStyle: {
        color: '#f5576c'
      }
    }]
  };
  
  trendChartInstance.setOption(option);
};

const initComparisonChart = () => {
  if (!comparisonChartRef.value) return;
  
  comparisonChartInstance = echarts.init(comparisonChartRef.value);
  
  const option = {
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
      data: majorComparisonData.dimensions || ['论文质量', '创新性', '规范性', '工作量', '答辩表现']
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
        data: majorComparisonData.myLevel || [85, 78, 92, 88, 90],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0066cc' },
            { offset: 1, color: '#0055aa' }
          ])
        }
      },
      {
        name: '专业平均',
        type: 'bar',
        data: majorComparisonData.majorAverage || [75, 70, 80, 75, 78],
        itemStyle: {
          color: '#e4e7ed'
        }
      }
    ]
  };
  
  comparisonChartInstance.setOption(option);
};
</script>

<style lang="scss" scoped>
// 全局样式
.student-dashboard {
  padding: 24px;
  min-height: 100vh;
  background: #f5f5f7; // Slate-50
  color: #1d1d1f; // Slate-900
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// 欢迎区域
.welcome-section {
  margin-bottom: 32px;
  
  .welcome-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    
    .welcome-left {
      
      .welcome-title {
        font-size: 2rem;
        font-weight: 600;
        color: #1d1d1f;
        margin: 0 0 8px 0;
        line-height: 1.2;
      }
      
      .welcome-subtitle {
        font-size: 1rem;
        color: #86868b;
        margin: 0;
      }
    }
    
    .welcome-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
}

// 统计卡片
.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    /* translateY removed */
    /* box-shadow removed */
    border-color: #cbd5e1;
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
    
    &.paper-icon {
      background: #f5f5f7;
      color: #0066cc;
    }
    
    &.pending-icon {
      background: #f5f5f7;
      color: #ff9500;
    }
    
    &.approved-icon {
      background: #f5f5f7;
      color: #34c759;
    }
    
    &.revision-icon {
      background: #f5f5f7;
      color: #ff3b30;
    }
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1d1d1f;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #86868b;
      font-weight: 600;
    }
  }
}

// 通用区域样式
.section {
  margin-bottom: 32px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1d1d1f;
      
      .el-icon {
        color: #86868b;
      }
    }
  }
}

// 时间节点
.time-section {
  
  .deadlines-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
}

.deadline-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    /* translateY removed */
    /* box-shadow removed */
    border-color: #cbd5e1;
  }
  
  &.submission {
    border-left: 4px solid #34c759;
  }
  
  &.review {
    border-left: 4px solid #0066cc;
  }
  
  &.defense {
    border-left: 4px solid #ff9500;
  }
  
  &.graduation {
    border-left: 4px solid #0066cc;
  }
  
  .deadline-icon {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    background: #f5f5f7;
    color: #86868b;
  }
  
  .deadline-content {
    flex: 1;
    
    .deadline-label {
      font-size: 0.875rem;
      color: #86868b;
      margin-bottom: 6px;
      font-weight: 600;
    }
    
    .deadline-date {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 8px;
    }
    
    .deadline-countdown {
      
      .countdown-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 18px;
        font-size: 0.75rem;
        font-weight: 600;
        
        &.danger {
          background: #f5f5f7;
          color: #ff3b30;
        }
        
        &.warning {
          background: #f5f5f7;
          color: #ff9500;
        }
        
        &.success {
          background: #f5f5f7;
          color: #34c759;
        }
        
        &.goal {
          background: #f5f5f7;
          color: #0066cc;
        }
      }
    }
  }
}

// 主要内容区域
.main-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

// 通用卡片样式
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.2s ease;
  
  &:hover {
    /* box-shadow removed */
    border-color: #cbd5e1;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1d1d1f;
      
      .el-icon {
        color: #86868b;
      }
    }
    
    .card-actions {
      display: flex;
      gap: 8px;
    }
  }
}

// 论文进度卡片
.paper-progress-card {
  
  .progress-content {
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      
      h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1d1d1f;
      }
      
      .progress-status {
        padding: 4px 12px;
        border-radius: 18px;
        font-size: 0.75rem;
        font-weight: 600;
        
        &.status-info {
          background: #f5f5f7;
          color: #0066cc;
        }
        
        &.status-primary {
          background: #f5f5f7;
          color: #0066cc;
        }
        
        &.status-warning {
          background: #f5f5f7;
          color: #ff9500;
        }
        
        &.status-danger {
          background: #f5f5f7;
          color: #ff3b30;
        }
        
        &.status-success {
          background: #f5f5f7;
          color: #34c759;
        }
      }
    }
    
    .progress-steps {
      margin-bottom: 24px;
      
      .progress-step {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .step-content {
          flex: 1;
          
          .step-title {
            font-size: 14px;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 2px;
          }
          
          .step-description {
            font-size: 12px;
            color: #86868b;
          }
        }
        
        &.step-active {
          .step-number {
            background: #34c759;
            color: white;
          }
        }
        
        &.step-current {
          .step-number {
            background: #0066cc;
            color: white;
          }
        }
        
        &.step-pending {
          .step-number {
            background: #f5f5f7;
            color: #86868b;
          }
          
          .step-title {
            color: #86868b;
          }
        }
      }
    }
    
    .progress-summary {
      display: flex;
      gap: 24px;
      padding: 16px;
      background: #f5f5f7;
      border-radius: 11px;
      
      .summary-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: #86868b;
        
        .el-icon {
          color: #86868b;
        }
      }
    }
  }
  
  .paper-details {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
    
    .paper-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1d1d1f;
      }
      
      .paper-status {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 18px;
          font-size: 0.75rem;
          font-weight: 600;
          
          &.status-info {
            background: #f5f5f7;
            color: #0066cc;
          }
          &.status-primary {
            background: #f5f5f7;
            color: #0066cc;
          }
          &.status-warning {
            background: #f5f5f7;
            color: #ff9500;
          }
          &.status-danger {
            background: #f5f5f7;
            color: #ff3b30;
          }
          &.status-success {
            background: #f5f5f7;
            color: #34c759;
          }
        }
        
        .paper-id {
          font-size: 0.875rem;
          color: #86868b;
        }
      }
    }
    
    .paper-info {
      
      .info-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
        
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      .info-item {
        
        .info-label {
          font-size: 0.75rem;
          color: #86868b;
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          color: #1d1d1f;
          font-weight: 600;
          
          &.title {
            font-size: 1rem;
            font-weight: 600;
            color: #0066cc;
            
            span {
              display: block;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
          
          &.similarity {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            
            .similarity-display {
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              
              .similarity-bar {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                
                &.similarity-low {
                  background: #34c759;
                }
                &.similarity-medium {
                  background: #ff9500;
                }
                &.similarity-high {
                  background: #ff3b30;
                }
                &.similarity-neutral {
                  background: #86868b;
                }
              }
              
              .similarity-text {
                font-weight: 600;
                font-size: 0.95rem;
                min-width: 48px;
                
                &.similarity-low {
                  color: #34c759;
                }
                &.similarity-medium {
                  color: #ff9500;
                }
                &.similarity-high {
                  color: #ff3b30;
                }
                &.similarity-neutral {
                  color: #86868b;
                }
              }
            }
            
            .similarity-status {
              padding: 2px 8px;
              border-radius: 18px;
              font-size: 0.75rem;
              font-weight: 600;
              
              &.status-info {
                background: #f5f5f7;
                color: #0066cc;
              }
              &.status-success {
                background: #f5f5f7;
                color: #34c759;
              }
              &.status-warning {
                background: #f5f5f7;
                color: #ff9500;
              }
              &.status-danger {
                background: #f5f5f7;
                color: #ff3b30;
              }
            }
          }
          
          .word-count, .version {
            padding: 2px 8px;
            border-radius: 18px;
            font-size: 0.75rem;
            font-weight: 600;
            
            &.word-count {
              background: #f5f5f7;
              color: #34c759;
            }
            
            &.version {
              background: #f5f5f7;
              color: #0066cc;
            }
          }
        }
      }
    }
    
    .paper-feedback {
      margin: 20px 0;
      padding: 16px;
      background: #f5f5f7;
      border-radius: 11px;
      
      .feedback-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        
        .el-icon {
          color: #86868b;
        }
        
        span {
          font-weight: 600;
          color: #1d1d1f;
        }
      }
      
      .feedback-content {
        color: #86868b;
        line-height: 1.5;
        font-size: 0.875rem;
      }
    }
    
    .paper-actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .no-paper {
    padding: 40px 0;
    text-align: center;
    
    .no-paper-content {
      
      .empty-icon {
        font-size: 48px;
        color: #86868b;
        margin-bottom: 16px;
      }
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1d1d1f;
      }
      
      p {
        margin: 0 0 24px 0;
        color: #86868b;
        font-size: 0.875rem;
      }
    }
  }
}

// 图表区域
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  
  .chart-container {
    height: 300px;
    width: 100%;
  }
  
  .chart-container-large {
    height: 400px;
    width: 100%;
  }
  
  &.full-width {
    grid-column: 1 / -1;
  }
}

// 导师卡片
.advisor-card {
  
  .advisor-profile {
    
    .advisor-avatar-section {
      text-align: center;
      margin-bottom: 20px;
      
      .advisor-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #f5f5f7;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 600;
        color: #86868b;
        margin: 0 auto 12px;
        background-size: cover;
        background-position: center;
      }
      
      .advisor-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 0.75rem;
        color: #86868b;
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          
          &.online {
            background: #34c759;
          }
        }
      }
    }
    
    .advisor-info {
      text-align: center;
      margin-bottom: 20px;
      
      .advisor-name {
        margin: 0 0 4px 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1d1d1f;
      }
      
      .advisor-title {
        margin: 0 0 16px 0;
        font-size: 0.875rem;
        color: #86868b;
      }
      
      .advisor-expertise {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-bottom: 16px;
        
        .expertise-tag {
          padding: 4px 12px;
          border-radius: 18px;
          font-size: 0.75rem;
          background: #f5f5f7;
          color: #86868b;
        }
      }
      
      .advisor-contact {
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #86868b;
          margin-bottom: 8px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .el-icon {
            color: #86868b;
            flex-shrink: 0;
          }
        }
      }
    }
    
    .advisor-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      
      .stat-item {
        text-align: center;
        
        .stat-number {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #86868b;
          font-weight: 600;
        }
      }
    }
  }
  
  .no-advisor {
    padding: 40px 0;
    text-align: center;
    
    .no-advisor-content {
      
      .empty-icon {
        font-size: 48px;
        color: #86868b;
        margin-bottom: 16px;
      }
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1d1d1f;
      }
      
      p {
        margin: 0 0 24px 0;
        color: #86868b;
        font-size: 0.875rem;
      }
    }
  }
}

// 按钮样式
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 11px;
  background: #0066cc;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #0055aa;
    /* translateY and box-shadow removed */
  }

  &:active {
    transform: scale(0.95);
  }
  
  .el-icon {
    font-size: 16px;
  }
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 11px;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
    /* translateY removed */
  }

  &:active {
    transform: scale(0.95);
  }
  
  .el-icon {
    font-size: 16px;
  }
}

.text-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 11px;
  background: transparent;
  color: #86868b;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f7;
    color: #1d1d1f;
  }
  
  .el-icon {
    font-size: 14px;
  }
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 11px;
  background: transparent;
  color: #86868b;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f7;
    color: #1d1d1f;
  }
  
  .el-icon {
    font-size: 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .student-dashboard {
    padding: 16px;
  }
  
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .welcome-actions {
    width: 100%;
    
    .primary-button,
    .secondary-button {
      flex: 1;
      justify-content: center;
    }
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .deadlines-grid {
    grid-template-columns: 1fr;
  }
  
  .info-row {
    grid-template-columns: 1fr !important;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card.full-width {
    grid-column: 1;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .welcome-title {
    font-size: 1.5rem !important;
  }
  
  .card {
    padding: 20px;
  }
}
</style>