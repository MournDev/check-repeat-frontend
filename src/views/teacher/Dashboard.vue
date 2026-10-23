<template>
  <div class="teacher-dashboard">
    <!-- 页面标题和快速操作 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-left">
          <p class="welcome-subtitle">欢迎回来，{{ userStore.userInfo?.realName || '老师' }}！这里是您的论文审核中心</p>
        </div>
        <div class="welcome-actions">
          <button class="primary-button" @click="goToPaperReview">
            <el-icon><EditPen /></el-icon>
            开始审核
          </button>
          <button class="secondary-button" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </button>
        </div>
      </div>
      
      <!-- 今日统计 -->
      <div class="today-stats" v-if="stats.todayStats">
        <div class="today-stat-item">
          <div class="stat-value">{{ stats.todayStats.todayReviewed || 0 }}</div>
          <div class="stat-label">今日审核</div>
        </div>
        <div class="today-stat-item">
          <div class="stat-value">{{ stats.todayStats.todayPassed || 0 }}</div>
          <div class="stat-label">今日通过</div>
        </div>
        <div class="today-stat-item">
          <div class="stat-value">{{ stats.todayStats.todayNewSubmissions || 0 }}</div>
          <div class="stat-label">新提交</div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-loading="loading.stats">
        <div class="stat-icon student-icon">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.studentCount || 0 }}</div>
          <div class="stat-label">指导学生</div>
        </div>
      </div>
      <div class="stat-card" v-loading="loading.stats">
        <div class="stat-icon pending-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingCount || 0 }}</div>
          <div class="stat-label">待审核</div>
        </div>
        <div class="stat-trend" :class="(stats.pendingCount || 0) > 5 ? 'negative' : 'positive'">
          <el-icon v-if="(stats.pendingCount || 0) > 5"><ArrowUp /></el-icon>
          <el-icon v-else><ArrowDown /></el-icon>
          <span>{{ (stats.pendingCount || 0) > 5 ? '高压' : '低压' }}</span>
        </div>
      </div>
      <div class="stat-card" v-loading="loading.stats">
        <div class="stat-icon reviewed-icon">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.reviewedCount || 0 }}</div>
          <div class="stat-label">已审核</div>
        </div>
      </div>
      <div class="stat-card" v-loading="loading.stats">
        <div class="stat-icon rate-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.passRate || 0 }}%</div>
          <div class="stat-label">通过率</div>
        </div>
        <div class="stat-trend" :class="(stats.passRate || 0) < 80 ? 'negative' : 'positive'">
          <el-icon v-if="(stats.passRate || 0) < 80"><ArrowDown /></el-icon>
          <el-icon v-else><ArrowUp /></el-icon>
          <span>{{ (stats.passRate || 0) < 80 ? '需关注' : '良好' }}</span>
        </div>
      </div>
    </div>

    <!-- 待办事项提醒 -->
    <div class="section" v-if="stats.todoItems && stats.todoItems.length > 0">
      <div class="section-header">
        <div class="section-title">
          <el-icon><Bell /></el-icon>
          待办事项
        </div>
      </div>
      <div class="todo-list">
        <div 
          v-for="(item, index) in stats.todoItems" 
          :key="index"
          class="todo-item"
          :class="item.priority.toLowerCase()"
        >
          <div class="todo-icon">
            <el-icon v-if="item.type === 'PENDING_REVIEW'">
              <Document />
            </el-icon>
            <el-icon v-else-if="item.type === 'NEW_SUBMISSION'">
              <Notification />
            </el-icon>
            <el-icon v-else>
              <User />
            </el-icon>
          </div>
          <div class="todo-content">
            <div class="todo-title">{{ item.title }}</div>
            <div class="todo-desc">{{ item.description }}</div>
          </div>
          <div class="todo-meta">
            <span class="priority-badge" :class="item.priority.toLowerCase()">
              {{ item.priority === 'HIGH' ? '高' : item.priority === 'MEDIUM' ? '中' : '低' }}优先级
            </span>
            <span class="todo-count">{{ item.count }}项</span>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧：待办事项和学生进度 -->
      <div class="main-left">
        <!-- 待审核论文 -->
        <div class="card" v-loading="loading.pending">
          <div class="card-header">
            <div class="card-title">
              <el-icon><Document /></el-icon>
              待审核论文
              <span v-if="stats.pendingCount > 0" class="badge danger">{{ stats.pendingCount }}</span>
            </div>
            <button class="text-button" @click="goToPaperReview">
              <el-icon><More /></el-icon>
              查看全部
            </button>
          </div>
          
          <div class="pending-list">
            <div 
              v-for="paper in pendingPapers" 
              :key="paper.id" 
              class="pending-item"
              :class="paper.priority"
            >
              <div class="paper-info">
                <div class="paper-header">
                  <h4 class="paper-title">{{ paper.paperTitle || paper.title }}</h4>
                  <div class="paper-tags">
                    <span class="tag warning">待审核</span>
                    <span v-if="paper.priority" :class="'tag ' + (paper.priority === 'urgent' ? 'danger' : paper.priority === 'high' ? 'warning' : 'info')">
                      {{ paper.priority === 'urgent' ? '紧急' : paper.priority === 'high' ? '高' : '普通' }}
                    </span>
                    <span v-if="paper.similarity" :class="'tag ' + getSimilarityTagType(paper.similarity)">
                      {{ formatPercent(paper.similarity) }}相似
                    </span>
                  </div>
                </div>
                <div class="paper-meta">
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    {{ paper.studentName }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    {{ formatTime(paper.submitTime) }}
                  </span>
                  <span class="meta-item" v-if="paper.waitingTime">
                    <el-icon><Timer /></el-icon>
                    等待{{ paper.waitingTime }}天
                  </span>
                  <span class="meta-item">
                    <el-icon><Files /></el-icon>
                    版本 v{{ paper.version }}
                  </span>
                </div>
                <div class="paper-details" v-if="paper.college">
                  <span class="college">{{ paper.college }}</span>
                  <span class="word-count" v-if="paper.wordCount">
                    <el-icon><Reading /></el-icon>
                    {{ paper.wordCount }}字
                  </span>
                </div>
              </div>
              <div class="paper-actions">
                <button class="primary-button" @click="reviewPaper(paper.id || paper.paperId)">
                  <el-icon><View /></el-icon>
                  审核
                </button>
                <button class="secondary-button" @click="downloadPaperFile(paper.id || paper.paperId)">
                  <el-icon><Download /></el-icon>
                  下载
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="pendingPapers.length === 0" class="empty-state">
            <div class="empty-icon">
              <el-icon><Document /></el-icon>
            </div>
            <h4>暂无待审核论文</h4>
            <p>所有论文都已审核完成</p>
          </div>
        </div>

        <!-- 审核进度统计 -->
        <div class="card" v-loading="loading.review || loading.college">
          <div class="card-header">
            <div class="card-title">
              <el-icon><DataLine /></el-icon>
              审核进度统计
            </div>
          </div>
          
          <div class="charts-grid">
            <div class="chart-card">
              <div class="chart-title">论文状态分布</div>
              <div class="chart-container" v-if="reviewChartData && hasValidData(reviewChartData)">
                <!-- ECharts饼图容器 -->
                <div
                  :ref="statusChart.chartRef"
                  class="echarts-container"
                ></div>
                <!-- 状态详情 -->
                <div class="status-details" v-if="reviewStatusDistribution.length > 0">
                  <div 
                    v-for="item in reviewStatusDistribution" 
                    :key="item.status"
                    class="status-detail-item"
                  >
                    <div class="status-info">
                      <span 
                        class="status-color" 
                        :style="{ backgroundColor: item.color }"
                      ></span>
                      <span class="status-name">{{ item.statusName }}</span>
                    </div>
                    <div class="status-metrics">
                      <span class="status-count">{{ item.count }}</span>
                      <span class="status-percentage">{{ item.percentage }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="chart-container" v-else>
                <!-- 无有效数据时的提示 -->
                <div class="empty-chart">
                  <div class="empty-icon">
                    <el-icon><DataLine /></el-icon>
                  </div>
                  <div class="empty-text">暂无审核数据</div>
                  <div class="empty-subtext">还没有审核记录</div>
                </div>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-title">各专业审核情况</div>
              <div class="chart-container">
                <div v-if="collegeDistribution.length > 0">
                  <div 
                    v-for="item in collegeDistribution.slice(0, 5)" 
                    :key="item.label"
                    class="bar-item"
                  >
                    <span class="bar-label">{{ item.label }}</span>
                    <div class="bar-container">
                      <div class="bar-fill" :style="{ width: calculateCollegePercentage(item.value, collegeDistribution) + '%' }"></div>
                    </div>
                    <span class="bar-value">{{ item.value }}</span>
                  </div>
                </div>
                <div v-else class="empty-chart">
                  <div class="empty-icon">
                    <el-icon><Histogram /></el-icon>
                  </div>
                  <div class="empty-text">暂无专业数据</div>
                  <div class="empty-subtext">还没有审核记录</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：学生统计和快速操作 -->
      <div class="main-right">
        <!-- 学生状态统计 -->
        <div class="card" v-loading="loading.student">
          <div class="card-header">
            <div class="card-title">
              <el-icon><UserFilled /></el-icon>
              学生状态
            </div>
          </div>
          
          <div class="students-stats">
            <!-- 已提交 -->
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.submitted }}</div>
                <div class="status-label">已提交</div>
                <div class="status-percentage">{{ studentStats.total > 0 ? Math.min(Math.round((studentStats.submitted / studentStats.total) * 100), 100) : 0 }}%</div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (studentStats.total > 0 ? Math.min((studentStats.submitted / studentStats.total) * 100, 100) : 0) + '%' }"></div>
              </div>
            </div>
            
            <!-- 审核中 -->
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.reviewing }}</div>
                <div class="status-label">审核中</div>
                <div class="status-percentage">{{ studentStats.total > 0 ? Math.round((studentStats.reviewing / studentStats.total) * 100) : 0 }}%</div>
              </div>
              <div v-if="studentStats.reviewing > 0" class="progress-bar">
                <div class="progress-fill warning" :style="{ width: (studentStats.total > 0 ? Math.min((studentStats.reviewing / studentStats.total) * 100, 100) : 0) + '%' }"></div>
              </div>
              <div v-else class="empty-progress">无进行中审核</div>
            </div>
            
            <!-- 已通过 -->
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.approved }}</div>
                <div class="status-label">已通过</div>
                <div class="status-percentage">{{ studentStats.total > 0 ? Math.round((studentStats.approved / studentStats.total) * 100) : 0 }}%</div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill success" :style="{ width: (studentStats.total > 0 ? Math.min((studentStats.approved / studentStats.total) * 100, 100) : 0) + '%' }"></div>
              </div>
            </div>
            
            <!-- 需修改 -->
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.rejected }}</div>
                <div class="status-label">需修改</div>
                <div class="status-percentage">{{ studentStats.total > 0 ? Math.min(Math.round((studentStats.rejected / studentStats.total) * 100), 100) : 0 }}%</div>
              </div>
              <div v-if="studentStats.rejected > 0" class="progress-bar">
                <div class="progress-fill danger" :style="{ width: (studentStats.total > 0 ? Math.min((studentStats.rejected / studentStats.total) * 100, 100) : 0) + '%' }"></div>
              </div>
              <div v-else class="empty-progress">无需修改论文</div>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><Operation /></el-icon>
              快速操作
            </div>
          </div>
          
          <div class="action-buttons">
            <button 
              class="action-button primary"
              @click="goToPaperReview"
            >
              <el-icon><EditPen /></el-icon>
              论文审核
            </button>
            <button 
              class="action-button"
              @click="goToStudentManagement"
            >
              <el-icon><UserFilled /></el-icon>
              学生管理
            </button>
            <button 
              class="action-button"
              @click="goToStatistics"
            >
              <el-icon><TrendCharts /></el-icon>
              数据统计
            </button>
            <button 
              class="action-button"
              @click="exportData"
            >
              <el-icon><Download /></el-icon>
              导出数据
            </button>
            <button 
              class="action-button"
              @click="goToMessageCenter"
            >
              <el-icon><Message /></el-icon>
              消息中心
            </button>
          </div>
        </div>

        <!-- 审核效率 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><Timer /></el-icon>
              审核效率
            </div>
          </div>
          
          <div class="efficiency-stats" v-if="stats.todayStats">
            <div class="efficiency-item">
              <div class="efficiency-label">平均审核时间</div>
              <div class="efficiency-value">{{ stats.todayStats.averageReviewTime || 0 }}分钟</div>
            </div>
            <div class="efficiency-item">
              <div class="efficiency-label">今日审核量</div>
              <div class="efficiency-value">{{ stats.todayStats.todayReviewed || 0 }}篇</div>
            </div>
            <div class="efficiency-item">
              <div class="efficiency-label">审核通过率</div>
              <div class="efficiency-value">
                {{ stats.todayStats.todayReviewed > 0 ? Math.round((stats.todayStats.todayPassed / stats.todayStats.todayReviewed) * 100) : 0 }}%
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <p>暂无效率数据</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { getPaperStatusText, getPaperStatusType, formatPercent, formatDate, formatDateTime } from '@/utils/dataType'
import { getSimilarityTagType } from '@/utils/similarity.js'

// API 接口导入
import {
  getTeacherDashboardStats,
  getPendingReviewList,
  getStudentStats,
  downloadPaper,
  exportTeacherData,
  getReviewStatusDistribution,
  getCollegeDistribution
} from '@/api/teacher.js'
import { useChart } from '@/composables/useChart'

// 图标引入
import {
  EditPen, Refresh, UserFilled, Clock, Check, TrendCharts,
  Document, More, User, Files, View, Download, DataLine,
  Operation, Histogram, ArrowUp, ArrowDown, Bell,
  Timer, Reading, Message
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const stats = reactive({})
const pendingPapers = ref([])
const studentStats = reactive({})
const reviewStatusDistribution = ref([])
const reviewChartData = ref(null) // 新增：存储图表数据
const collegeDistribution = ref([])
const recentActivities = ref([])
const loading = reactive({
  stats: false,
  pending: false,
  student: false,
  review: false,
  college: false
})

// 计算属性：检查是否有任何加载状态为 true
const isLoading = computed(() => {
  return Object.values(loading).some(value => value)
})

// 论文状态分布饼图（useChart 托管容器/dispose/resize；空态由模板 hasValidData 分支承载）
const statusChart = useChart()

// 监听图表数据变化，自动重绘
watch(reviewChartData, () => {
  renderStatusChart()
})

// 方法
const refreshData = async () => {
  try {
    loading.stats = true
    await loadDashboardData()
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.stats = false
  }
}

const loadDashboardData = async () => {
  // 设置所有加载状态为 true
  Object.keys(loading).forEach(key => {
    loading[key] = true
  })
  
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) {
      throw new Error('未获取到教师信息，请重新登录')
    }

    // 并行请求多个接口，使用更优雅的错误处理
    const [dashboardRes, pendingRes, studentRes, reviewStatusDistRes, collegeDistRes] = await Promise.all([
      getTeacherDashboardStats(teacherId),
      getPendingReviewList(1, 10),
      getStudentStats(teacherId),
      getReviewStatusDistribution({ teacherId, timeRange: 'all' }),
      getCollegeDistribution({ teacherId, timeRange: 'all' })
    ])

    // 处理仪表盘统计数据
    if (dashboardRes.code === 200) {
      Object.assign(stats, {
        studentCount: dashboardRes.data.totalStudents || 0,
        pendingCount: dashboardRes.data.pendingPapers || 0,
        reviewedCount: dashboardRes.data.reviewedPapers || 0,
        passRate: dashboardRes.data.passRate || 0,
        todoItems: dashboardRes.data.todoItems || [],
        todayStats: dashboardRes.data.todayStats || {}
      })
    }
    loading.stats = false

    // 处理待审核论文列表
    if (pendingRes.code === 200) {
      pendingPapers.value = (pendingRes.data?.records || pendingRes.data || []).map(item => ({
        id: item.paperBaseInfo?.paperId || item.paperId || item.id,
        title: item.paperBaseInfo?.paperTitle || item.paperTitle || item.title,
        studentName: item.paperBaseInfo?.studentName || item.studentName,
        submitTime: item.taskBaseInfo?.checkEndTime || item.submitTime,
        version: item.version || 1,
        waitingTime: item.waitingTime,
        priority: item.priority,
        similarity: item.similarity,
        college: item.college,
        wordCount: item.wordCount
      }))
    }
    loading.pending = false

    // 处理学生状态统计（total = 各状态论文数之和，保证百分比之和=100%）
    if (studentRes.code === 200) {
      const submitted = Number(studentRes.data.submittedPapers) || 0
      const reviewing = Number(studentRes.data.auditingPapers) || 0
      const approved = Number(studentRes.data.passedPapers) || 0
      const rejected = Number(studentRes.data.needModifyPapers) || 0
      const paperTotal = submitted + reviewing + approved + rejected

      Object.assign(studentStats, {
        total: paperTotal,
        totalStudents: Number(studentRes.data.totalStudents) || 0,
        submitted,
        reviewing,
        approved,
        rejected
      })
    }
    loading.student = false

    // 处理审核状态分布数据（用于论文状态分布饼图）
    if (reviewStatusDistRes.code === 200) {
      const distData = reviewStatusDistRes.data || []
      const colors = ['#34c759', '#ff9500', '#007aff', '#ff3b30', '#af52de']
      const totalCount = distData.reduce((sum, item) => sum + (Number(item.value) || 0), 0)

      reviewStatusDistribution.value = distData.map((item, index) => ({
        status: index,
        statusName: item.name,
        count: Number(item.value) || 0,
        percentage: totalCount > 0 ? Math.round((Number(item.value) || 0) / totalCount * 100) : 0,
        color: colors[index % colors.length]
      }))

      // 构建图表数据
      reviewChartData.value = {
        labels: distData.map(item => item.name),
        values: distData.map(item => Number(item.value) || 0),
        colors: distData.map((_, i) => colors[i % colors.length])
      }
      // 重绘由 reviewChartData 的 watch 触发
    }
    loading.review = false

    // 处理学院分布数据（用于各专业审核情况图表）
    if (collegeDistRes.code === 200 && collegeDistRes.data) {
      const categories = collegeDistRes.data.categories || []
      const seriesData = collegeDistRes.data.series?.[0]?.data || []
      collegeDistribution.value = categories.map((label, i) => ({
        label,
        value: Number(seriesData[i]) || 0
      }))
    }
    loading.college = false



  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('数据加载失败，请稍后重试')
  } finally {
    // 确保所有加载状态都被设置为 false
    Object.keys(loading).forEach(key => {
      loading[key] = false
    })
  }
}

const goToPaperReview = () => {
  router.push('/teacher/review-workbench')
}

const goToStudentManagement = () => {
  router.push({
    name: 'StudentList'  // 使用路由名称而不是路径
  })
}

const goToStatistics = () => {
  router.push('/teacher/data-statistics')
}

const goToMessageCenter = () => {
  router.push('/message-center')
}

const reviewPaper = (paperId) => {
  router.push(`/teacher/review-workbench?paperId=${paperId}`)
}

const downloadPaperFile = async (paperId) => {
  try {
    const response = await downloadPaper(paperId)
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `论文_${paperId}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('论文下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error(`论文下载失败: ${error.message || '网络错误'}`)
  }
}

const exportData = async () => {
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) {
      ElMessage.warning('未获取到教师信息，请重新登录')
      return
    }
    
    const response = await exportTeacherData({ teacherId })
    // 处理文件下载
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `教师数据统计_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error(`数据导出失败: ${error.message || '网络错误'}`)
  }
}

const formatTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const target = new Date(date)
  
  if (now.toDateString() === target.toDateString()) {
    return formatDateTime(target, 'HH:mm')
  } else {
    return formatDate(target)
  }
}

// 检查图表数据是否有效（至少有一个非零值）
const hasValidData = (chartData) => {
  if (!chartData || !chartData.values || chartData.values.length === 0) return false
  return chartData.values.some(value => value > 0)
}

// 渲染状态分布饼图（数据无效时走空态；容器由模板 v-if 切换，render 内部 nextTick 兜底挂载时机）
const renderStatusChart = () => {
  const d = reviewChartData.value
  if (!d || !hasValidData(d)) {
    statusChart.render(null)
    return
  }
  statusChart.render({
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `${params.seriesName}<br/>${params.name}: ${params.value} (${params.percent}%)`
      },
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#0066cc',
      borderWidth: 1,
      textStyle: {
        color: 'var(--app-color-ink)'
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'var(--app-color-ink)'
      }
    },
    series: [
      {
        name: '审核状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold',
            color: 'var(--app-color-ink)'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: d.labels.map((label, index) => ({
          value: d.values[index],
          name: label,
          itemStyle: {
            color: d.colors[index],
            borderRadius: 4
          }
        })).filter(item => item.value > 0) // 过滤掉值为0的数据项
      }
    ]
  })
}

// 计算审核完成率
const calculateCompletionRate = (statusData) => {
  if (!statusData || statusData.length === 0) return 0
  
  // 查找通过状态的数量
  const passedStatus = statusData.find(item => item.status === '3' || item.statusName.includes('通过'))
  const passedCount = passedStatus ? passedStatus.count : 0
  
  // 计算总数
  const totalCount = statusData.reduce((sum, item) => sum + (item.count || 0), 0)
  
  // 返回通过率
  return totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0
}

// 计算学院占比
const calculateCollegePercentage = (value, allData) => {
  if (!allData || allData.length === 0) return 0
  
  const total = allData.reduce((sum, item) => sum + (item.value || 0), 0)
  return total > 0 ? Math.round((value / total) * 100) : 0
}

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
</script>

<style lang="scss" scoped>

// 欢迎区域
.welcome-section {
  margin-bottom: var(--app-space-8);
  
  .welcome-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--app-space-6);
    
    .welcome-left {

      .welcome-subtitle {
        font-size: var(--app-fs-body);
        color: var(--app-color-text-muted);
        margin: 0;
      }
    }
    
    .welcome-actions {
      display: flex;
      gap: var(--app-space-3);
    }
  }
  
  // 今日统计
  .today-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--app-space-4);
    padding: var(--app-space-6);
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);

    .today-stat-item {
      text-align: center;

      .stat-value {
        font-size: var(--app-fs-title);
        font-weight: 700;
        color: var(--app-color-ink);
        margin-bottom: var(--app-space-2);
      }

      .stat-label {
        font-size: var(--app-fs-caption);
        color: var(--app-color-text-muted);
      }
    }
  }
}

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--app-space-4);
  margin-bottom: var(--app-space-8);

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-6);
  display: flex;
  align-items: center;
  gap: var(--app-space-4);
  transition: border-color var(--app-transition-normal);

  &:hover {
    border-color: var(--app-color-border);
  }
  &:active {
    transform: scale(0.985);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--app-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--app-fs-title);
    flex-shrink: 0;
    
    &.student-icon {
      background: var(--app-color-info-bg);
      color: var(--app-color-primary);
    }
    
    &.pending-icon {
      background: var(--app-color-warning-bg);
      color: var(--app-color-warning);
    }
    
    &.reviewed-icon {
      background: var(--app-color-success-bg);
      color: var(--app-color-success);
    }
    
    &.rate-icon {
      background: var(--app-color-info-bg);
      color: var(--app-color-primary);
    }
  }
  
  .stat-content {
    flex: 1;

    .stat-value {
      font-size: var(--app-fs-metric);
      font-weight: 700;
      color: var(--app-color-ink);
      line-height: 1.2;
      margin-bottom: var(--app-space-2);
    }

    .stat-label {
      font-size: var(--app-fs-caption);
      color: var(--app-color-text-muted);
    }
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: var(--app-space-3);
    font-size: var(--app-fs-caption);
    font-weight: 400;

    &.positive {
      color: var(--app-color-success);
    }

    &.negative {
      color: var(--app-color-danger);
    }

    .el-icon {
      font-size: var(--app-fs-caption);
    }
  }
}

// 通用区域样式
.section {
  margin-bottom: var(--app-space-8);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--app-space-4);
    
    .section-title {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      font-family: var(--app-font-family);
      font-size: var(--app-fs-body);
      font-weight: 600;
      color: var(--app-color-ink);
      
      .el-icon {
        color: var(--app-color-text-muted);
      }
    }
  }
}

// 待办事项
.todo-list {
  display: grid;
  gap: var(--app-space-4);

  .todo-item {
    display: flex;
    align-items: center;
    padding: var(--app-space-4);
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);
    transition: border-color var(--app-transition-normal);

    &:hover {
      border-color: var(--app-color-border);
    }

    &.high {
      background: var(--app-color-danger-bg);
      border-color: var(--app-color-danger-bg);
    }

    &.medium {
      background: var(--app-color-warning-bg);
      border-color: var(--app-color-warning-bg);
    }

    &.low {
      background: var(--app-color-success-bg);
      border-color: var(--app-color-success-border);
    }
    
    .todo-icon {
      margin-right: var(--app-space-4);

      .el-icon {
        font-size: var(--app-fs-title);
        color: var(--app-color-text-muted);
      }
    }

    .todo-content {
      flex: 1;

      .todo-title {
        font-weight: 600;
        color: var(--app-color-ink);
        margin-bottom: var(--app-space-2);
      }

      .todo-desc {
        font-size: var(--app-fs-caption);
        color: var(--app-color-text-muted);
      }
    }

    .todo-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--app-space-3);

      .priority-badge {
        padding: var(--app-space-1) var(--app-space-3);
        border-radius: var(--app-radius-pill);
        font-size: var(--app-fs-meta);
        font-weight: 400;

        &.high {
          background: var(--app-color-danger-bg);
          color: var(--app-color-danger);
        }

        &.medium {
          background: var(--app-color-warning-bg);
          color: var(--app-color-warning);
        }

        &.low {
          background: var(--app-color-success-bg);
          color: var(--app-color-success);
        }
      }

      .todo-count {
        font-size: var(--app-fs-caption);
        font-weight: 600;
        color: var(--app-color-text-muted);
      }
    }
  }
}

// 主要内容区域
.main-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--app-space-6);

  @media (max-width: 1400px) {
    grid-template-columns: 1fr 280px;
  }
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

// 通用卡片样式
.card {
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-8);
  margin-bottom: var(--app-space-8);
  transition: border-color var(--app-transition-normal);

  &:hover {
    border-color: var(--app-color-border);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--app-space-6);

    .card-title {
      display: flex;
      align-items: center;
      gap: var(--app-space-3);
      font-size: var(--app-fs-title);
      font-weight: 600;
      color: var(--app-color-ink);

      .el-icon {
        color: var(--app-color-text-muted);
      }

      .badge {
        padding: 2px var(--app-space-2);
        border-radius: var(--app-radius-pill);
        font-size: var(--app-fs-meta);
        font-weight: 400;

        &.danger {
          background: var(--app-color-danger-bg);
          color: var(--app-color-danger);
        }
      }
    }
  }
}

// 待审核论文
.pending-list {
  .pending-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--app-space-6);
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);
    margin-bottom: var(--app-space-4);
    transition: border-color var(--app-transition-normal);

    &:hover {
      border-color: var(--app-color-border);
    }

    &:last-child {
      margin-bottom: 0;
    }

    &.urgent {
      background: var(--app-color-danger-bg);
      border-color: var(--app-color-danger-bg);
    }

    &.high {
      background: var(--app-color-warning-bg);
      border-color: var(--app-color-warning-bg);
    }

    &.normal {
      background: var(--app-color-success-bg);
      border-color: var(--app-color-success-border);
    }
    
    .paper-info {
      flex: 1;
      margin-right: var(--app-space-5);
      
      .paper-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--app-space-4);
        
        .paper-title {
          margin: 0;
          color: var(--app-color-ink);
          font-size: var(--app-fs-heading);
          font-weight: 600;
          flex: 1;
          margin-right: var(--app-space-4);
          line-height: 1.4;
        }
        
        .paper-tags {
          display: flex;
          gap: var(--app-space-2);
          
          .tag {
            padding: var(--app-space-1) var(--app-space-3);
            border-radius: 18px;
            font-size: var(--app-fs-meta);
            font-weight: 400;
            
            &.warning {
              background: var(--app-color-warning-bg);
              color: var(--app-color-warning);
            }
            
            &.danger {
              background: var(--app-color-danger-bg);
              color: var(--app-color-danger);
            }
            
            &.info {
              background: var(--app-color-info-bg);
              color: var(--app-color-primary);
            }
            
            &.success {
              background: var(--app-color-success-bg);
              color: var(--app-color-success);
            }
          }
        }
      }
      
      .paper-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-4);
        font-size: var(--app-fs-caption);
        color: var(--app-color-text-muted);
        margin-bottom: var(--app-space-4);
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .el-icon {
            font-size: var(--app-fs-heading);
            color: var(--app-color-text-muted);
          }
        }
      }
      
      .paper-details {
        display: flex;
        gap: var(--app-space-4);
        font-size: var(--app-fs-caption);
        color: var(--app-color-text-muted);
        
        .college {
          font-weight: 400;
        }
        
        .word-count {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .el-icon {
            font-size: var(--app-fs-heading);
            color: var(--app-color-text-muted);
          }
        }
      }
    }
    
    .paper-actions {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-3);
      flex-shrink: 0;

      @media (max-width: 768px) {
        flex-direction: row;
      }
    }
  }
}

// 空状态
.empty-state {
  padding: var(--app-space-10) 0;
  text-align: center;
  
  .empty-icon {
    font-size: 48px;
    color: var(--app-color-text-muted);
    margin-bottom: var(--app-space-4);
  }
  
  h4 {
    margin: 0 0 var(--app-space-2) 0;
    font-size: var(--app-fs-heading);
    font-weight: 600;
    color: var(--app-color-ink);
  }
  
  p {
    margin: 0;
    color: var(--app-color-text-muted);
    font-size: var(--app-fs-caption);
  }
}

// 图表区域
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--app-space-6);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  
  .chart-title {
    font-size: var(--app-fs-heading);
    font-weight: 600;
    color: var(--app-color-ink);
    margin-bottom: var(--app-space-4);
  }
  
  .chart-container {
    
  }
  
  .echarts-container {
    width: 100%;
    height: 300px;
    margin-bottom: var(--app-space-4);
  }
  
  .status-details {
    
    .status-detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--app-space-3);
      border-bottom: 1px solid var(--app-color-border);
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--app-color-fill);
        border-radius: var(--app-radius-lg);
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .status-info {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        
        .status-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .status-name {
          color: var(--app-color-ink);
          font-size: var(--app-fs-caption);
          font-weight: 400;
        }
      }
      
      .status-metrics {
        display: flex;
        gap: var(--app-space-4);
        align-items: center;
        
        .status-count {
          color: var(--app-color-ink);
          font-weight: 600;
          font-size: var(--app-fs-caption);
        }
        
        .status-percentage {
          color: var(--app-color-text-muted);
          font-size: var(--app-fs-meta);
          background-color: var(--app-color-fill);
          padding: var(--app-space-1) var(--app-space-3);
          border-radius: 18px;
        }
      }
    }
  }
  
  .bar-item {
    display: flex;
    align-items: center;
    gap: var(--app-space-3);
    margin-bottom: var(--app-space-3);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .bar-label {
      min-width: 100px;
      font-size: var(--app-fs-caption);
      color: var(--app-color-ink);
      font-weight: 400;
    }
    
    .bar-container {
      flex: 1;
      height: 6px;
      background: var(--app-color-border);
      border-radius: 8px;
      overflow: hidden;
      
      .bar-fill {
        height: 100%;
        background: var(--app-color-primary);
        border-radius: 8px;
        transition: width 0.5s ease;
      }
    }
    
    .bar-value {
      min-width: 40px;
      font-size: var(--app-fs-caption);
      font-weight: 600;
      color: var(--app-color-ink);
      text-align: right;
    }
  }
  
  .empty-chart {
    padding: var(--app-space-10) 0;
    text-align: center;
    
    .empty-icon {
      font-size: 48px;
      color: var(--app-color-text-muted);
      margin-bottom: var(--app-space-4);
    }
    
    .empty-text {
      font-size: var(--app-fs-heading);
      font-weight: 600;
      color: var(--app-color-ink);
      margin-bottom: var(--app-space-2);
    }
    
    .empty-subtext {
      font-size: var(--app-fs-caption);
      color: var(--app-color-text-muted);
    }
  }
}

// 学生状态统计
.students-stats {
  .status-item {
    margin-bottom: var(--app-space-5);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .status-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--app-space-3);
      
      .status-value {
        font-size: var(--app-fs-title);
        font-weight: 700;
        color: var(--app-color-ink);
      }
      
      .status-label {
        font-size: var(--app-fs-caption);
        color: var(--app-color-text-muted);
      }
      
      .status-percentage {
        font-size: var(--app-fs-caption);
        font-weight: 600;
        color: var(--app-color-ink);
      }
    }
    
    .progress-bar {
      height: 6px;
      background: var(--app-color-border);
      border-radius: 8px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        border-radius: 8px;
        transition: width 0.5s ease;
        
        &.warning {
          background: var(--app-color-warning);
        }
        
        &.success {
          background: var(--app-color-success);
        }
        
        &.danger {
          background: var(--app-color-danger);
        }
        
        &:not(.warning):not(.success):not(.danger) {
          background: var(--app-color-primary);
        }
      }
    }
    
    .empty-progress {
      height: 6px;
      background: var(--app-color-border);
      border-radius: 8px;
      font-size: var(--app-fs-meta);
      color: var(--app-color-text-muted);
      text-align: center;
      line-height: 6px;
    }
  }
}

// 快速操作
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--app-space-3);

  .action-button {
    display: flex;
    align-items: center;
    gap: var(--app-space-2);
    padding: var(--app-space-3) var(--app-space-4);
    border-radius: 11px;
    font-size: var(--app-fs-caption);
    font-weight: 400;
    transition: border-color 0.2s ease;

    &:active {
      transform: scale(0.985);
    }
    
    &.primary {
      background: var(--app-color-primary);
      color: var(--app-color-on-primary);
      border: none;
      
      &:hover {
        background: var(--app-color-primary-hover);
      }
    }
    
    &:not(.primary) {
      background: var(--app-color-fill);
      color: var(--app-color-ink);
      border: 1px solid var(--app-color-border);
      
      &:hover {
        background: var(--app-color-fill);
        border-color: var(--app-color-border);
      }
    }
    
    .el-icon {
      font-size: var(--app-fs-heading);
    }
  }
}

// 审核效率
.efficiency-stats {
  display: grid;
  gap: var(--app-space-4);
  
  .efficiency-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--app-space-4);
    background: var(--app-color-fill);
    border-radius: 11px;
    
    .efficiency-label {
      font-size: var(--app-fs-caption);
      color: var(--app-color-text-muted);
    }
    
    .efficiency-value {
      font-size: var(--app-fs-heading);
      font-weight: 700;
      color: var(--app-color-ink);
    }
  }
}

// 按钮样式
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: 10px var(--app-space-4);
  border-radius: var(--app-radius-pill);
  background: var(--app-color-primary);
  color: var(--app-color-on-primary);
  font-size: var(--app-fs-caption);
  font-weight: 400;
  border: none;
  cursor: pointer;
  transition: background-color var(--app-transition-normal);

  &:hover {
    background: var(--app-color-primary-hover);
  }

  &:active {
    transform: scale(0.985);
  }

  .el-icon {
    font-size: var(--app-fs-caption);
  }

  &:focus-visible {
    outline: 2px solid var(--app-color-primary);
    outline-offset: 2px;
  }
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: 10px var(--app-space-4);
  border-radius: var(--app-radius-pill);
  background: var(--app-color-fill);
  color: var(--app-color-ink);
  font-size: var(--app-fs-caption);
  font-weight: 400;
  border: 1px solid var(--app-color-border);
  cursor: pointer;
  transition: border-color var(--app-transition-normal);

  &:hover {
    border-color: var(--app-color-border-strong);
  }

  &:active {
    transform: scale(0.985);
  }

  .el-icon {
    font-size: var(--app-fs-caption);
  }

  &:focus-visible {
    outline: 2px solid var(--app-color-primary);
    outline-offset: 2px;
  }
}

.text-button {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-2);
  padding: 6px var(--app-space-3);
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: var(--app-color-text-muted);
  font-size: var(--app-fs-meta);
  font-weight: 400;
  border: none;
  cursor: pointer;
  transition: background-color var(--app-transition-normal);

  &:hover {
    background: var(--app-color-fill);
    color: var(--app-color-ink);
  }

  .el-icon {
    font-size: var(--app-fs-body);
  }

  &:focus-visible {
    outline: 2px solid var(--app-color-primary);
    outline-offset: 2px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .teacher-dashboard {
    padding: var(--app-space-4);
  }
  
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--app-space-3);
  }
  
  .welcome-actions {
    width: 100%;
    
    .primary-button,
    .secondary-button {
      flex: 1;
      justify-content: center;
    }
  }

  .section-title {
    font-size: var(--app-fs-caption);
  }
  
  .today-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .pending-item {
    flex-direction: column;
    align-items: flex-start;
    
    .paper-actions {
      width: 100%;
      flex-direction: row;
      justify-content: flex-end;
      margin-top: var(--app-space-4);
    }
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .today-stats {
    grid-template-columns: 1fr;
  }
  
  .card {
    padding: var(--app-space-5);
  }
}
</style>
