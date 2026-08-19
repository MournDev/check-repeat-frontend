<template>
  <div class="student-dashboard">
    <!-- 顶部欢迎区域 -->
    <el-card class="welcome-card gradient-card" shadow="never">
      <div class="welcome-content">
        <div class="welcome-left">
          <div class="welcome-greeting">
            <h1 class="welcome-title">欢迎回来，{{ userStore.userInfo?.realName || '同学' }}！</h1>
            <p class="welcome-subtitle">今天是 {{ currentDate }}</p>
          </div>
          <div class="welcome-stats">
            <div class="stat-badge">
              <el-tag type="primary" size="large" effect="dark">
                <el-icon><Document /></el-icon>
                {{ stats.submittedCount || 0 }} 篇论文
              </el-tag>
            </div>
            <div class="stat-badge">
              <el-tag type="warning" size="large" effect="dark">
                <el-icon><Clock /></el-icon>
                {{ stats.pendingCount || 0 }} 待审核
              </el-tag>
            </div>
          </div>
          <div class="welcome-actions">
            <el-button type="primary" :icon="UploadFilled" @click="goToPaperSubmit" size="large" round>
              提交新论文
            </el-button>
            <el-button :icon="Download" @click="exportDashboardData" size="large" round>
              导出数据
            </el-button>
          </div>
        </div>
        <div class="welcome-right">
          <div class="achievement-badge">
            <div class="badge-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="badge-content">
              <div class="badge-number">{{ stats.approvedCount || 0 }}</div>
              <div class="badge-label">已通过</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 主要统计卡片 -->
    <el-row :gutter="16" class="main-stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="main-stat-card" shadow="hover">
          <div class="stat-main">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon>
                <Document />
              </el-icon>
            </div>
            <div class="stat-numbers">
              <div class="stat-value">{{ stats.submittedCount || 0 }}</div>
              <div class="stat-label">总提交数</div>
            </div>
          </div>
          <div class="stat-trend">
            <span class="trend-up">+2 本周</span>
            <el-icon color="#52c41a">
              <TrendCharts />
            </el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="main-stat-card" shadow="hover">
          <div class="stat-main">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon>
                <Clock />
              </el-icon>
            </div>
            <div class="stat-numbers">
              <div class="stat-value">{{ stats.pendingCount || 0 }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
          <div class="stat-trend">
            <span class="trend-neutral">持 平</span>
            <el-icon color="#faad14">
              <PieChart />
            </el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="main-stat-card" shadow="hover">
          <div class="stat-main">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon>
                <Check />
              </el-icon>
            </div>
            <div class="stat-numbers">
              <div class="stat-value">{{ stats.approvedCount || 0 }}</div>
              <div class="stat-label">已通过</div>
            </div>
          </div>
          <div class="stat-trend">
            <span class="trend-up">+1 本周</span>
            <el-icon color="#52c41a">
              <TrendCharts />
            </el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="main-stat-card" shadow="hover">
          <div class="stat-main">
            <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon>
                <EditPen />
              </el-icon>
            </div>
            <div class="stat-numbers">
              <div class="stat-value">{{ stats.revisionCount || 0 }}</div>
              <div class="stat-label">需修改</div>
            </div>
          </div>
          <div class="stat-trend">
            <span class="trend-down">-1 本周</span>
            <el-icon color="#ff4d4f">
              <TrendCharts />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 时间节点管理 -->
    <el-card class="timeline-card" shadow="hover">
      <template #header>
        <div class="card-header-custom">
          <div class="header-title">
            <el-icon>
              <Calendar />
            </el-icon>
            <span>重要时间节点</span>
          </div>
          <el-button type="primary" text @click="addAllToCalendar">
            <el-icon>
              <Download />
            </el-icon>
            添加到日历
          </el-button>
        </div>
      </template>

      <div class="timeline-grid">
        <el-row :gutter="16">
          <!-- 提交截止 -->
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="deadline-item submission">
              <div class="deadline-icon">
                <el-icon size="24">
                  <EditPen />
                </el-icon>
              </div>
              <div class="deadline-content">
                <div class="deadline-label">论文提交截止</div>
                <div class="deadline-date">{{ deadlines.submissionDeadline }}</div>
                <div class="deadline-countdown">
                  <el-tag :type="getCountdownType(deadlines.submissionDeadline)" size="small">
                    剩余 {{ getCountdownDays(deadlines.submissionDeadline) }} 天
                  </el-tag>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 审核截止 -->
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="deadline-item review">
              <div class="deadline-icon">
                <el-icon size="24">
                  <Check />
                </el-icon>
              </div>
              <div class="deadline-content">
                <div class="deadline-label">审核截止</div>
                <div class="deadline-date">{{ deadlines.reviewDeadline }}</div>
                <div class="deadline-countdown">
                  <el-tag :type="getCountdownType(deadlines.reviewDeadline)" size="small">
                    剩余 {{ getCountdownDays(deadlines.reviewDeadline) }} 天
                  </el-tag>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 答辩时间 -->
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="deadline-item defense">
              <div class="deadline-icon">
                <el-icon size="24">
                  <Microphone />
                </el-icon>
              </div>
              <div class="deadline-content">
                <div class="deadline-label">答辩时间</div>
                <div class="deadline-date">{{ deadlines.defenseDate }}</div>
                <div class="deadline-countdown">
                  <el-tag :type="getCountdownType(deadlines.defenseDate)" size="small">
                    剩余 {{ getCountdownDays(deadlines.defenseDate) }} 天
                  </el-tag>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 毕业时间 -->
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="deadline-item graduation">
              <div class="deadline-icon">
                <el-icon size="24">
                  <Trophy />
                </el-icon>
              </div>
              <div class="deadline-content">
                <div class="deadline-label">预计毕业</div>
                <div class="deadline-date">{{ deadlines.graduationDate }}</div>
                <div class="deadline-countdown">
                  <el-tag type="success" size="small">
                    目标
                  </el-tag>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 数据统计可视化 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 个人能力雷达图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header-custom">
              <div class="header-title">
                <el-icon>
                  <DataAnalysis />
                </el-icon>
                <span>个人能力评估</span>
              </div>
            </div>
          </template>
          <div ref="radarChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 相似度趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header-custom">
              <div class="header-title">
                <el-icon>
                  <TrendCharts />
                </el-icon>
                <span>相似度变化趋势</span>
              </div>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 专业对比图 -->
    <el-card class="chart-card full-width" shadow="hover">
      <template #header>
        <div class="card-header-custom">
          <div class="header-title">
            <el-icon>
              <Histogram />
            </el-icon>
            <span>与专业平均水平对比</span>
          </div>
        </div>
      </template>
      <div ref="comparisonChartRef" class="chart-container-large"></div>
    </el-card>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content-row">
      <!-- 左侧：论文进度和最新论文 -->
      <el-col :xs="24" :lg="16">
        <!-- 论文进度卡片 -->
        <el-card class="paper-progress-card" shadow="hover">
          <template #header>
            <div class="card-header-custom">
              <div class="header-title">
                <el-icon>
                  <DataLine />
                </el-icon>
                <span>论文进度跟踪</span>
              </div>
              <div class="header-actions">
                <el-button text @click="goToPaperStatus">查看全部</el-button>
                <el-button type="primary" text @click="refreshData">
                  <el-icon>
                    <Refresh />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <div class="progress-section enhanced">
            <div class="progress-header">
              <h3>论文处理进度</h3>
              <el-tag :type="getProgressStatusType(currentProgress)" effect="plain">
                {{ getProgressStatusText(currentProgress) }}
              </el-tag>
            </div>
            <el-steps :active="currentProgress" finish-status="success" align-center process-status="process">
              <el-step 
                title="论文提交" 
                description="已完成" 
                status="finish"
              />
              <el-step 
                title="分配导师" 
                :description="latestPaper?.advisorName ? '已完成' : '进行中'"
                :status="latestPaper?.advisorName ? 'finish' : 'process'"
              />
              <el-step 
                title="导师审核" 
                :description="getReviewStatus(latestPaper)"
                :status="getReviewStepStatus(latestPaper)"
              />
              <el-step 
                title="审核通过" 
                description="目标" 
                status="wait"
              />
            </el-steps>
            <div class="progress-summary">
              <div class="summary-item">
                <el-icon color="#667eea"><Timer /></el-icon>
                <span>预计完成时间：{{ estimatedCompletion }}</span>
              </div>
              <div class="summary-item">
                <el-icon color="#52c41a"><Lightning /></el-icon>
                <span>处理速度：{{ processingSpeed }}</span>
              </div>
            </div>
          </div>

          <!-- 当前论文详情 -->
          <div v-if="latestPaper" class="current-paper-section">
            <div class="paper-header">
              <h4>当前论文详情</h4>
              <div class="paper-status">
                <el-tag :type="getStatusType(latestPaper.status)" effect="light" size="large">
                  {{ getStatusText(latestPaper.status) }}
                </el-tag>
                <span class="paper-id">ID: {{ latestPaper.id }}</span>
              </div>
            </div>

            <div class="paper-details-enhanced">
              <div class="detail-row">
                <div class="detail-item">
                  <div class="detail-label">论文标题</div>
                  <div class="detail-value title-value">
                    <el-tooltip :content="latestPaper.title" placement="top">
                      <span>{{ latestPaper.title }}</span>
                    </el-tooltip>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">提交时间</div>
                  <div class="detail-value">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(latestPaper.submitTime) }}
                  </div>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-item" v-if="latestPaper.advisorName">
                  <div class="detail-label">指导老师</div>
                  <div class="detail-value">
                    <el-icon><User /></el-icon>
                    {{ latestPaper.advisorName }}
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">相似度检测</div>
                  <div class="detail-value similarity-value">
                    <div class="similarity-display">
                      <el-progress 
                        :percentage="latestPaperSimilarity" 
                        :stroke-width="8" 
                        :color="getSimilarityColor(latestPaperSimilarity)"
                        :show-text="false"
                        class="similarity-progress-mini"
                      />
                      <span :class="['similarity-text', getSimilarityClass(latestPaperSimilarity)]">
                        {{ latestPaperSimilarity }}%
                      </span>
                    </div>
                    <el-tag 
                      :type="getSimilarityTagType(latestPaperSimilarity)" 
                      size="small" 
                      effect="plain"
                    >
                      {{ getSimilarityStatus(latestPaperSimilarity) }}
                    </el-tag>
                  </div>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-item">
                  <div class="detail-label">字数统计</div>
                  <div class="detail-value">
                    <el-icon><EditPen /></el-icon>
                    <el-tag type="success" size="small">{{ latestPaper.wordCount || '9999+' }} 字</el-tag>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">版本信息</div>
                  <div class="detail-value">
                    <el-icon><Files /></el-icon>
                    <el-tag type="primary" size="small">V{{ latestPaper.version || 1 }}</el-tag>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="latestPaper.feedback" class="paper-feedback">
              <div class="feedback-header">
                <el-icon>
                  <ChatLineRound />
                </el-icon>
                <span>导师反馈</span>
              </div>
              <div class="feedback-content">
                {{ latestPaper.feedback }}
              </div>
            </div>

            <div class="paper-actions">
              <el-button type="primary" :icon="View" @click="viewPaperDetails">查看详情</el-button>
            </div>
          </div>

          <div v-else class="no-paper-section">
            <el-empty description="暂无论文提交记录" :image-size="120">
              <el-button type="primary" :icon="UploadFilled" @click="goToPaperSubmit">
                开始您的第一篇论文
              </el-button>
            </el-empty>
          </div>
        </el-card>
      </el-col>
      <!-- 右侧：指导老师 -->
      <el-col :xs="24" :lg="8">
        <!-- 指导老师卡片 -->
        <el-card class="advisor-profile-card" shadow="hover">
          <template #header>
            <div class="card-header-custom">
              <div class="header-title">
                <el-icon>
                  <UserFilled />
                </el-icon>
                <span>我的指导老师</span>
              </div>
              <el-button text @click="contactAdvisor">
                <el-icon>
                  <ChatDotRound />
                </el-icon>
                联系
              </el-button>
            </div>
          </template>

          <div v-if="advisorInfo" class="advisor-profile">
            <div class="advisor-avatar-section">
              <el-avatar :size="80" :src="getAvatarUrl(advisorInfo.avatar)" class="advisor-avatar">
                {{ advisorInfo.name?.charAt(0) }}
              </el-avatar>
              <div class="advisor-online-status">
                <el-tag type="success" size="small" effect="light">
                  <el-icon>
                    <CircleCheck />
                  </el-icon>
                  在线
                </el-tag>
              </div>
            </div>

            <div class="advisor-info-section">
              <h3 class="advisor-name">{{ advisorInfo.name }}</h3>
              <p class="advisor-title">{{ advisorInfo.title || '教授' }}</p>

              <div class="advisor-expertise">
                <el-tag v-for="field in advisorInfo.expertise" :key="field" type="info" size="small" effect="plain">
                  {{ field }}
                </el-tag>
              </div>

              <div class="advisor-contact-info">
                <div class="contact-item">
                  <el-icon>
                    <Phone />
                  </el-icon>
                  <span>{{ advisorInfo.phone }}</span>
                </div>
                <div class="contact-item">
                  <el-icon>
                    <Message />
                  </el-icon>
                  <span>{{ advisorInfo.email }}</span>
                </div>
                <div class="contact-item">
                  <el-icon>
                    <OfficeBuilding />
                  </el-icon>
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

          <div v-else class="no-advisor-section">
            <el-empty description="暂未分配指导老师" :image-size="100">
              <p class="no-advisor-tips">系统将在论文提交后自动为您分配指导老师</p>
              <el-button type="primary" @click="goToPaperSubmit">立即提交论文</el-button>
            </el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
// ECharts 通过 CDN 引入，全局 window.echarts 可用

import { getLatestPaper, getAdvisorInfo, getStudentDashboardStats, getDashboardDeadlines, getAbilityRadarData, getSimilarityTrendChart, getMajorComparisonData, getTodoList, getNotifications, getProgressTracking } from "@/api/student.js"

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

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const stats = ref({
  submittedCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  revisionCount: 0
})
const latestPaper = ref(null)
const todoList = ref([])
const advisorInfo = ref(null)
const notifications = ref([])
const loading = ref(false)

// 时间节点相关数据
const deadlines = ref({
  submissionDeadline: '',
  reviewDeadline: '',
  defenseDate: '',
  graduationDate: ''
})

// 图表相关数据
const abilityRadarData = ref({
  paperCount: 0,
  passRate: 0,
  averageSimilarity: 0,
  revisionTimes: 0,
  onTimeSubmission: 0,
  advisorRating: 0
})

const similarityTrendData = ref({
  versions: [],
  similarities: []
})

const majorComparisonData = ref({
  dimensions: [],
  myLevel: [],
  majorAverage: []
})

const progressTrackingData = ref({
  currentStep: 0,
  estimatedCompletion: '',
  processingSpeed: '',
  steps: []
})

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
  if (progressTrackingData.value.currentStep !== undefined) {
    return progressTrackingData.value.currentStep;
  }
  // 如果没有论文，返回 0
  if (!latestPaper.value) return 0;
  const status = latestPaper.value.status;
  const progressMap = {
    'submitted': 1,
    'assigned': 2,
    'auditing': 2,
    'completed': 4,
    'rejected': 3
  };
  return progressMap[status] || 0;
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
  return abilityRadarData.value.averageSimilarity || 0
})

const advisorRating = computed(() => {
  return abilityRadarData.value.advisorRating || 0
})

const avgReviewTime = computed(() => {
  return '3'
})

const collectionCount = computed(() => {
  return '12'
})

const estimatedCompletion = computed(() => {
  return progressTrackingData.value.estimatedCompletion || '2024 年 2 月 25 日'
})

const processingSpeed = computed(() => {
  return progressTrackingData.value.processingSpeed || '较快'
})

// 方法
// 加载仪表盘数据
const loadDashboardData = async () => {
  loading.value = true
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
      stats.value = statsRes.data || {}
    } else {
      ElMessage.error(statsRes.message || '获取统计数据失败')
    }
    
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
    
    // 处理时间节点数据
    if (deadlinesRes.code === 200) {
      deadlines.value = deadlinesRes.data || {}
    } else {
      ElMessage.error(deadlinesRes.message || '获取时间节点失败')
    }
    
    // 处理能力评估雷达图数据
    if (radarRes.code === 200) {
      abilityRadarData.value = radarRes.data || {}
    } else {
      ElMessage.error(radarRes.message || '获取能力评估数据失败')
    }
    
    // 处理相似度趋势数据
    if (trendRes.code === 200) {
      similarityTrendData.value = trendRes.data || {}
    } else {
      ElMessage.error(trendRes.message || '获取相似度趋势失败')
    }
    
    // 处理专业对比数据
    if (comparisonRes.code === 200) {
      majorComparisonData.value = comparisonRes.data || {}
    } else {
      ElMessage.error(comparisonRes.message || '获取专业对比数据失败')
    }
    
    // 处理待办事项
    if (todoRes.code === 200) {
      todoList.value = todoRes.data || []
    } else {
      ElMessage.error(todoRes.message || '获取待办事项失败')
    }
    
    // 处理通知消息
    if (notifRes.code === 200) {
      notifications.value = notifRes.data || []
    } else {
      ElMessage.error(notifRes.message || '获取通知消息失败')
    }
    
    // 处理进度跟踪数据
    if (progressRes.code === 200) {
      progressTrackingData.value = progressRes.data || {}
    } else {
      ElMessage.error(progressRes.message || '获取进度跟踪数据失败')
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('网络错误，请检查连接后重试')
  } finally {
    loading.value = false
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
  }).then(() => {
    ElMessage.success('数据导出开始，请稍候...')
    // 实际导出逻辑
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
          console.log('联系导师')
        }
      }
    )
  }
}

const viewAllNotifications = () => {
  router.push('src/components/MessageCenter.vue')
}

const getStatusType = (status) => {
  const typeMap = {
    'submitted': 'info',
    'auditing': 'primary',
    'UNDER_REVIEW': 'warning',
    'completed': 'success',
    'rejected': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'submitted': '已提交',
    'assigned': '已分配导师',
    'auditing': '待审核',
    'completed': '已通过',
    'rejected': '需修改'
  }
  return textMap[status] || '未知状态'
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
    ?? 0
  if (!raw) return 0
  return raw > 0 && raw <= 1 ? Math.round(raw * 100) : Math.round(raw)
})

// 相似度颜色获取函数
const getSimilarityColor = (similarity) => {
  if (!similarity) return '#909399'
  if (similarity < 15) return '#67c23a'  // 绿色 - 优秀
  if (similarity < 30) return '#e6a23c'  // 黄色 - 良好
  return '#f56c6c'  // 红色 - 需关注
}

// 相似度类名获取函数
const getSimilarityClass = (similarity) => {
  if (!similarity) return 'similarity-neutral'
  if (similarity < 15) return 'similarity-low'
  if (similarity < 30) return 'similarity-medium'
  return 'similarity-high'
}

// 相似度标签类型获取函数
const getSimilarityTagType = (similarity) => {
  if (!similarity) return 'info'
  if (similarity < 15) return 'success'
  if (similarity < 30) return 'warning'
  return 'danger'
}

// 相似度状态文本获取函数
const getSimilarityStatus = (similarity) => {
  if (!similarity) return '未检测'
  if (similarity < 15) return '优秀'
  if (similarity < 30) return '良好'
  return '需修改'
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
  if (progressTrackingData.value.steps && progressTrackingData.value.steps.length > 2) {
    const reviewStep = progressTrackingData.value.steps[2];
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
  if (progressTrackingData.value.steps && progressTrackingData.value.steps.length > 2) {
    const reviewStep = progressTrackingData.value.steps[2];
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

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadDashboardData()
  nextTick(() => {
    initRadarChart()
    initTrendChart()
    initComparisonChart()
  })
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

const addAllToCalendar = () => {
  ElMessage.success('已将所有时间节点添加到日历');
  // TODO: 实现添加到日历功能
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
        { name: '平均相似度', max: 30 },
        { name: '修改次数', max: 5 },
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
            abilityRadarData.value.paperCount || 3,
            abilityRadarData.value.passRate || 85,
            abilityRadarData.value.averageSimilarity || 15.2,
            abilityRadarData.value.revisionTimes || 2,
            abilityRadarData.value.onTimeSubmission || 100,
            abilityRadarData.value.advisorRating || 90
          ],
          name: '我的能力',
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.3)'
          },
          lineStyle: {
            color: '#409EFF'
          },
          itemStyle: {
            color: '#409EFF'
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
      data: similarityTrendData.value.versions || ['V1', 'V2', 'V3', 'V4']
    },
    yAxis: {
      type: 'value',
      name: '相似度 (%)',
      min: 0,
      max: 50
    },
    series: [{
      name: '相似度',
      type: 'line',
      smooth: true,
      data: similarityTrendData.value.similarities || [25.8, 22.3, 18.5, 15.2],
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
      data: majorComparisonData.value.dimensions || ['论文质量', '创新性', '规范性', '工作量', '答辩表现']
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
        data: majorComparisonData.value.myLevel || [85, 78, 92, 88, 90],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      },
      {
        name: '专业平均',
        type: 'bar',
        data: majorComparisonData.value.majorAverage || [75, 70, 80, 75, 78],
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
.student-dashboard {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf9 100%);
}

// 渐变卡片
.gradient-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: white !important;
  
  :deep(.el-card__body) {
    padding: 32px !important;
  }
}

// 欢迎卡片
.welcome-card {
  margin-bottom: 24px;
  border-radius: 16px;
  overflow: hidden;
  
  .welcome-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .welcome-left {
      flex: 1;
      
      .welcome-greeting {
        margin-bottom: 20px;
        
        .welcome-title {
          margin: 0 0 8px 0;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
        }
        
        .welcome-subtitle {
          margin: 0;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          opacity: 0.9;
        }
      }
      
      .welcome-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        
        .stat-badge {
          .el-tag {
            background: rgba(255, 255, 255, 0.2) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            
            .el-icon {
              margin-right: 6px;
            }
          }
        }
      }
      
      .welcome-actions {
        display: flex;
        gap: 16px;
        
        .el-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          
          &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
        }
      }
    }
    
    .welcome-right {
      .achievement-badge {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        backdrop-filter: blur(10px);
        
        .badge-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          color: #ffd700;
        }
        
        .badge-content {
          .badge-number {
            font-size: 2rem;
            font-weight: 800;
            color: white;
            line-height: 1;
          }
          
          .badge-label {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 4px;
          }
        }
      }
    }
  }
}

// 统计卡片
.main-stats-row {
  margin-bottom: 24px;
  
  .stat-card {
    border-radius: 12px;
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
    cursor: pointer;
    
    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      
      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        margin-bottom: 16px;
        font-size: 1.5rem;
        color: white;
      }
      
      .stat-info {
        flex: 1;
        margin-bottom: 12px;
        
        .stat-number {
          font-size: 1.75rem;
          font-weight: 800;
          color: #2c3e50;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          font-weight: 500;
        }
      }
      
      .stat-trend {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        
        .el-icon {
          font-size: 0.875rem;
        }
        
        &.positive {
          color: #52c41a;
        }
        
        &.negative {
          color: #ff4d4f;
        }
        
        &.warning {
          color: #faad14;
        }
        
        &.neutral {
          color: #7f8c8d;
        }
      }
    }
  }
  
  // 不同主题色的卡片
  .primary-card {
    .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
  }
  
  .warning-card {
    .stat-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
  }
  
  .success-card {
    .stat-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); }
  }
  
  .danger-card {
    .stat-icon { background: linear-gradient(135deg, #ff6b6b, #ee5a24); }
  }
  
  .info-card {
    .stat-icon { background: linear-gradient(135deg, #48dbfb, #0abde3); }
  }
  
  .purple-card {
    .stat-icon { background: linear-gradient(135deg, #a55eea, #8854d0); }
  }
  
  .teal-card {
    .stat-icon { background: linear-gradient(135deg, #26de81, #20bf6b); }
  }
  
  .orange-card {
    .stat-icon { background: linear-gradient(135deg, #fd9644, #f39c12); }
  }
}

// 卡片头部样式
.card-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 1.125rem;
    color: #2c3e50;

    .el-icon {
      color: #667eea;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

// 主要内容区域
.main-content-row {
  margin-top: 16px;
}

// 时间节点卡片
.timeline-card {
  margin-bottom: 16px;
  border-radius: 12px;
  
  :deep(.el-card__header) {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-bottom: none;
    padding: 16px 20px;
  }
}

.timeline-grid {
  padding: 8px 0;
  
  .deadline-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 12px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &.submission {
      background: linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%);
      border-left: 4px solid #43e97b;
    }
    
    &.review {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-left: 4px solid #667eea;
    }
    
    &.defense {
      background: linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
      border-left: 4px solid #f5576c;
    }
    
    &.graduation {
      background: linear-gradient(135deg, rgba(255, 179, 71, 0.1) 0%, rgba(255, 153, 51, 0.1) 100%);
      border-left: 4px solid #ffb347;
    }
    
    .deadline-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
      
      .el-icon {
        color: white;
      }
    }
    
    .deadline-content {
      flex: 1;
      min-width: 0;
      
      .deadline-label {
        font-size: 0.85rem;
        color: #7f8c8d;
        margin-bottom: 6px;
        font-weight: 500;
      }
      
      .deadline-date {
        font-size: 1.1rem;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 8px;
      }
      
      .deadline-countdown {
        display: inline-block;
      }
    }
  }
}
  .el-card {
    border-radius: 12px;
    border: none;
    margin-bottom: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }
  }

// 进度卡片增强
.paper-progress-card {
  :deep(.el-card__body) {
    padding: 24px;
  }
  
  .progress-section.enhanced {
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f2f5;
      
      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #2c3e50;
        font-weight: 600;
      }
    }
    
    :deep(.el-steps) {
      margin-bottom: 24px;
      
      .el-step {
        .el-step__head {
          .el-step__icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
            border-width: 3px;
          }
        }
        
        .el-step__title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .el-step__description {
          font-size: 13px;
          color: #7f8c8d;
        }
      }
    }
    
    .progress-summary {
      display: flex;
      justify-content: space-around;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
      
      .summary-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: #5a6c7d;
        
        .el-icon {
          font-size: 1.1rem;
        }
      }
    }
  }
  
  .paper-details-enhanced {
    .detail-row {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .detail-item {
      flex: 1;
      
      .detail-label {
        font-size: 0.75rem;
        color: #7f8c8d;
        margin-bottom: 6px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .detail-value {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        color: #2c3e50;
        font-weight: 500;
        
        &.title-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #667eea;
          
          span {
            display: block;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
        
        &.similarity-value {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          
          .similarity-display {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            
            .similarity-progress-mini {
              flex: 1;
              max-width: 120px;
            }
            
            .similarity-text {
              font-weight: 700;
              font-size: 1.1rem;
              min-width: 50px;
              
              &.similarity-low { color: #52c41a; }
              &.similarity-medium { color: #faad14; }
              &.similarity-high { color: #ff4d4f; }
              &.similarity-normal { color: #909399; }
            }
          }
        }
      }
    }
  }
}

// 待办事项卡片
.todo-card {
  .todo-list {
    .todo-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      border-bottom: 1px solid #f1f2f6;

      &:last-child {
        border-bottom: none;
      }

      .todo-checkbox {
        flex: 1;

        :deep(.el-checkbox__label) {
          display: flex;
          flex-direction: column;
        }
      }

      .todo-content {
        .todo-title {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 4px;

          &.todo-completed {
            text-decoration: line-through;
            color: #7f8c8d;
          }
        }

        .todo-desc {
          font-size: 0.875rem;
          color: #7f8c8d;
        }
      }

      .todo-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

// 导师信息卡片
.advisor-profile-card {
  .advisor-profile {
    text-align: center;

    .advisor-avatar-section {
      position: relative;
      display: inline-block;
      margin-bottom: 20px;

      .advisor-avatar {
        border: 4px solid #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .advisor-online-status {
        position: absolute;
        bottom: 4px;
        right: 4px;
      }
    }

    .advisor-info-section {
      .advisor-name {
        margin: 0 0 8px 0;
        font-size: 1.25rem;
        color: #2c3e50;
      }

      .advisor-title {
        margin: 0 0 16px 0;
        color: #667eea;
        font-weight: 500;
      }

      .advisor-expertise {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        margin-bottom: 20px;
      }

      .advisor-contact-info {
        .contact-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #5a6c7d;
          font-size: 0.875rem;

          .el-icon {
            color: #667eea;
          }
        }
      }
    }

    .advisor-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #f1f2f6;

      .stat-item {
        text-align: center;

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #7f8c8d;
          margin-top: 4px;
        }
      }
    }
  }

  .no-advisor-section {
    text-align: center;
    padding: 32px 0;

    .no-advisor-tips {
      margin: 12px 0;
      color: #7f8c8d;
      font-size: 0.875rem;
    }
  }

  // 通知卡片
  .notifications-card {
    .notification-badge {
      :deep(.el-badge__content) {
        background-color: #ff4d4f;
      }
    }

    .notifications-list {
      .notification-item {
        display: flex;
        gap: 12px;
        padding: 16px 0;
        border-bottom: 1px solid #f1f2f6;

        &:last-child {
          border-bottom: none;
        }

        .notification-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          flex-shrink: 0;

          &.type-success {
            background-color: #f6ffed;
            color: #52c41a;
          }

          &.type-warning {
            background-color: #fffbe6;
            color: #faad14;
          }

          &.type-info {
            background-color: #f0f5ff;
            color: #667eea;
          }

          .el-icon {
            font-size: 1.25rem;
          }
        }

        .notification-content {
          flex: 1;

          .notification-title {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 4px;
          }

          .notification-time {
            font-size: 0.75rem;
            color: #7f8c8d;
            margin-bottom: 4px;
          }

          .notification-desc {
            font-size: 0.875rem;
            color: #5a6c7d;
            line-height: 1.4;
          }
        }
      }
    }
  }

  // 快速操作卡片
  .quick-actions-card {
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .quick-action-btn {
        height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 8px;

        .el-icon {
          font-size: 1.25rem;
        }

        span {
          font-size: 0.875rem;
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .student-dashboard {
      padding: 12px;
    }

    .welcome-content {
      flex-direction: column;
      text-align: center;
      gap: 24px;

      .welcome-left {
        .welcome-actions {
          justify-content: center;
        }
      }
    }

    .main-stats-row {
      .el-col {
        margin-bottom: 16px;
      }
    }

    .paper-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 12px;

      .paper-status {
        width: 100%;
        justify-content: space-between;
      }
    }

    .paper-actions {
      flex-wrap: wrap;
      justify-content: flex-start !important;
    }

    .quick-actions-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 1200px) {
    .paper-descriptions {
      :deep(.el-descriptions) {
        .el-descriptions-item__cell {
          display: block;
          width: 100%;
        }
      }
    }
  }
}

// 图表卡片
.chart-row {
  margin-top: 16px;
}

.chart-card {
  border-radius: 12px;
  margin-bottom: 16px;
  
  &.full-width {
    width: 100%;
  }
  
  .chart-container {
    height: 300px;
    width: 100%;
  }
  
  .chart-container-large {
    height: 400px;
    width: 100%;
  }
}
</style>