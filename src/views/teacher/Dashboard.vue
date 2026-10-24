<template>
  <div class="teacher-dashboard">
    <PageHeader :description="`欢迎回来，${userStore.userInfo?.realName || '老师'}！这里是您的论文审核中心`">
      <template #actions>
        <el-button type="primary" :icon="EditPen" @click="goToPaperReview">开始审核</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新数据</el-button>
      </template>
    </PageHeader>

    <!-- 今日概览：轻量状态行，避免与关键指标形成两条并列的卡片带 -->
    <div class="today-strip" v-if="stats.todayStats">
      <span class="today-strip-label">今日</span>
      <span class="today-item">
        <span class="today-label">已审核</span>
        <span class="today-value">{{ stats.todayStats.todayReviewed || 0 }}</span>
      </span>
      <span class="today-item">
        <span class="today-label">通过</span>
        <span class="today-value">{{ stats.todayStats.todayPassed || 0 }}</span>
      </span>
      <span class="today-item">
        <span class="today-label">新提交</span>
        <span class="today-value">{{ stats.todayStats.todayNewSubmissions || 0 }}</span>
      </span>
      <span class="today-item">
        <span class="today-label">平均用时</span>
        <span class="today-value">{{ stats.todayStats.averageReviewTime || 0 }} <em>分钟</em></span>
      </span>
    </div>

    <!-- 关键指标 -->
    <div class="kpi-grid" v-loading="loading.stats">
      <div class="kpi-card">
        <span class="kpi-label">指导学生</span>
        <span class="kpi-value">{{ stats.studentCount || 0 }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">待审核</span>
        <span class="kpi-value">{{ stats.pendingCount || 0 }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">已审核</span>
        <span class="kpi-value">{{ stats.reviewedCount || 0 }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">通过率</span>
        <span class="kpi-value">{{ stats.passRate || 0 }}%</span>
      </div>
    </div>

    <!-- 待办提醒：单行紧凑提醒条，不再占用一整块首屏高度 -->
    <div class="todo-strip" v-if="stats.todoItems && stats.todoItems.length > 0">
      <div class="todo-strip-label">
        <el-icon><Bell /></el-icon>
        待办提醒
      </div>
      <div class="todo-chips">
        <div
          v-for="(item, index) in stats.todoItems"
          :key="index"
          class="todo-chip"
        >
          <el-icon class="todo-chip-icon">
            <Document v-if="item.type === 'PENDING_REVIEW'" />
            <Notification v-else-if="item.type === 'NEW_SUBMISSION'" />
            <User v-else />
          </el-icon>
          <span class="todo-chip-title">{{ item.title }}</span>
          <span class="todo-chip-count">{{ item.count }}项</span>
          <el-tag size="small" round :type="todoPriorityType(item.priority)">
            {{ todoPriorityLabel(item.priority) }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 待审核论文：首屏主任务 -->
      <div class="card focus-card pending-card" v-loading="loading.pending">
        <div class="card-header">
          <div class="card-title">
            <el-icon><Document /></el-icon>
            待审核论文
            <span v-if="stats.pendingCount > 0" class="badge danger">{{ stats.pendingCount }}</span>
          </div>
          <el-button text size="small" :icon="More" @click="goToPaperReview">查看全部</el-button>
        </div>
          
        <div class="pending-list" v-if="pendingPapers.length > 0">
          <div
            v-for="paper in pendingPapers"
            :key="paper.id"
            class="pending-item"
          >
            <div class="paper-info">
              <div class="paper-header">
                <h4 class="paper-title">{{ paper.paperTitle || paper.title }}</h4>
                <div class="paper-tags">
                  <el-tag size="small" type="warning" round>待审核</el-tag>
                  <el-tag
                    v-if="paper.priority"
                    size="small"
                    round
                    :type="paper.priority === 'urgent' ? 'danger' : paper.priority === 'high' ? 'warning' : 'info'"
                  >
                    {{ paper.priority === 'urgent' ? '紧急' : paper.priority === 'high' ? '高' : '普通' }}
                  </el-tag>
                  <el-tag
                    v-if="paper.similarity"
                    size="small"
                    round
                    :type="getSimilarityTagType(paper.similarity)"
                  >
                    {{ formatPercent(paper.similarity) }}相似
                  </el-tag>
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
              <el-button type="primary" size="small" :icon="View" @click="reviewPaper(paper.id || paper.paperId)">
                审核
              </el-button>
              <el-button size="small" :icon="Download" @click="downloadPaperFile(paper.id || paper.paperId)">
                下载
              </el-button>
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

      <!-- 审核进度统计：两张分析卡并排，整行展开以消除右栏空档 -->
      <div class="analytics-grid" v-loading="loading.review || loading.college">
        <div class="card analysis-card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><DataLine /></el-icon>
              论文状态分布
            </div>
          </div>

          <div class="pie-layout" v-if="reviewChartData && hasValidData(reviewChartData)">
            <!-- ECharts饼图容器 -->
            <div
              :ref="statusChart.chartRef"
              class="echarts-container"
            ></div>
            <!-- 状态详情承担图例职责，图表内置图例已移除，避免同一信息出现两次 -->
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
          <div v-else class="empty-chart">
            <div class="empty-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="empty-text">暂无审核数据</div>
            <div class="empty-subtext">还没有审核记录</div>
          </div>
        </div>

        <div class="card analysis-card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><Histogram /></el-icon>
              各专业审核情况
            </div>
          </div>

          <div v-if="collegeDistribution.length > 0" class="bar-list">
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

      <!-- 学生状态 -->
      <div class="card status-card" v-loading="loading.student">
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
              <div class="status-label">已提交</div>
              <div class="status-value">{{ studentStats.submitted }}</div>
              <div class="status-percentage">{{ studentStats.total > 0 ? Math.min(Math.round((studentStats.submitted / studentStats.total) * 100), 100) : 0 }}%</div>
            </div>
            <el-progress
              :percentage="studentStats.total > 0 ? Math.min((studentStats.submitted / studentStats.total) * 100, 100) : 0"
              :stroke-width="6"
              :show-text="false"
              color="var(--app-color-primary)"
            />
          </div>

          <!-- 审核中 -->
          <div class="status-item">
            <div class="status-info">
              <div class="status-label">审核中</div>
              <div class="status-value">{{ studentStats.reviewing }}</div>
              <div class="status-percentage">{{ studentStats.total > 0 ? Math.round((studentStats.reviewing / studentStats.total) * 100) : 0 }}%</div>
            </div>
            <el-progress
              v-if="studentStats.reviewing > 0"
              :percentage="studentStats.total > 0 ? Math.min((studentStats.reviewing / studentStats.total) * 100, 100) : 0"
              :stroke-width="6"
              :show-text="false"
              color="var(--app-color-warning)"
            />
            <div v-else class="empty-progress"></div>
          </div>

          <!-- 已通过 -->
          <div class="status-item">
            <div class="status-info">
              <div class="status-label">已通过</div>
              <div class="status-value">{{ studentStats.approved }}</div>
              <div class="status-percentage">{{ studentStats.total > 0 ? Math.round((studentStats.approved / studentStats.total) * 100) : 0 }}%</div>
            </div>
            <el-progress
              :percentage="studentStats.total > 0 ? Math.min((studentStats.approved / studentStats.total) * 100, 100) : 0"
              :stroke-width="6"
              :show-text="false"
              color="var(--app-color-success)"
            />
          </div>

          <!-- 需修改 -->
          <div class="status-item">
            <div class="status-info">
              <div class="status-label">需修改</div>
              <div class="status-value">{{ studentStats.rejected }}</div>
              <div class="status-percentage">{{ studentStats.total > 0 ? Math.min(Math.round((studentStats.rejected / studentStats.total) * 100), 100) : 0 }}%</div>
            </div>
            <el-progress
              v-if="studentStats.rejected > 0"
              :percentage="studentStats.total > 0 ? Math.min((studentStats.rejected / studentStats.total) * 100, 100) : 0"
              :stroke-width="6"
              :show-text="false"
              color="var(--app-color-danger)"
            />
            <div v-else class="empty-progress"></div>
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
import { formatPercent, formatDate, formatDateTime } from '@/utils/dataType'
import { getSimilarityTagType } from '@/utils/similarity.js'
import PageHeader from '@/components/common/PageHeader.vue'

// API 接口导入
import {
  getTeacherDashboardStats,
  getPendingReviewList,
  getStudentStats,
  downloadPaper,
  getReviewStatusDistribution,
  getCollegeDistribution
} from '@/api/teacher.js'
import { useChart } from '@/composables/useChart'

// 图标引入
import {
  EditPen, Refresh, UserFilled, Clock,
  Document, More, User, Files, View, Download, DataLine,
  Histogram, Bell, Notification,
  Timer, Reading
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

// 待办优先级 → el-tag 语义（HIGH/MEDIUM/LOW）
const todoPriorityType = (priority) => {
  if (priority === 'HIGH') return 'danger'
  if (priority === 'MEDIUM') return 'warning'
  return 'success'
}

const todoPriorityLabel = (priority) => {
  if (priority === 'HIGH') return '高'
  if (priority === 'MEDIUM') return '中'
  return '低'
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
        color: '#1d1d1f'
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

// 今日概览：轻量状态行，只承担"今天发生了什么"的补充信息
.today-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--app-space-2) var(--app-space-5);
  margin-bottom: var(--app-space-6);
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);

  .today-strip-label {
    font-weight: 600;
    color: var(--app-color-ink);
  }

  .today-item {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
  }

  .today-value {
    font-size: var(--app-fs-body);
    font-weight: 600;
    color: var(--app-color-ink);
    font-variant-numeric: tabular-nums;

    em {
      margin-left: 2px;
      font-style: normal;
      font-size: var(--app-fs-meta);
      font-weight: 400;
      color: var(--app-color-text-muted);
    }
  }
}

// 关键指标：标签在上、数值在下，四项同构且无附加装饰
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--app-space-4);
  margin-bottom: var(--app-space-6);

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
  padding: var(--app-space-4) var(--app-space-6);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);

  .kpi-label {
    font-size: var(--app-fs-caption);
    color: var(--app-color-text-muted);
  }

  .kpi-value {
    font-size: var(--app-fs-metric);
    font-weight: 600;
    line-height: 1.1;
    color: var(--app-color-ink);
    font-variant-numeric: tabular-nums;
  }
}

// 待办提醒：单行胶囊组合，替代此前的整块卡片列表
.todo-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-3) var(--app-space-4);
  margin-bottom: var(--app-space-6);
  padding: var(--app-space-3) var(--app-space-4);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);

  .todo-strip-label {
    display: flex;
    align-items: center;
    gap: var(--app-space-2);
    font-size: var(--app-fs-caption);
    font-weight: 600;
    color: var(--app-color-ink);

    .el-icon {
      color: var(--app-color-text-muted);
    }
  }

  .todo-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-2);
  }

  .todo-chip {
    display: flex;
    align-items: center;
    gap: var(--app-space-2);
    padding: var(--app-space-1) var(--app-space-2) var(--app-space-1) var(--app-space-3);
    background: var(--app-color-fill);
    border-radius: var(--app-radius-pill);
    font-size: var(--app-fs-meta);
    color: var(--app-color-text-secondary);

    .todo-chip-icon {
      font-size: var(--app-fs-caption);
      color: var(--app-color-text-muted);
    }

    .todo-chip-title {
      color: var(--app-color-ink);
    }

    .todo-chip-count {
      font-weight: 600;
      color: var(--app-color-ink);
      font-variant-numeric: tabular-nums;
    }
  }
}

// 首行：待审核论文 + 学生状态；次行：两张分析卡整行展开
.main-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  grid-template-areas:
    "pending status"
    "analytics analytics";
  align-items: start;
  gap: var(--app-space-6);

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "pending"
      "status"
      "analytics";
  }
}

.pending-card {
  grid-area: pending;
  // 只拉长主任务卡去对齐右栏，学生状态卡保持内容高度
  align-self: stretch;
  display: flex;
  flex-direction: column;

  .pending-list {
    flex: 1;
  }
}

.status-card {
  grid-area: status;
}

// 分析区：饼图与专业条形图各占一卡，整行展开给图表留出宽度
.analytics-grid {
  grid-area: analytics;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-6);

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

// 通用卡片样式
.card {
  min-width: 0;
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-6);
  margin-bottom: 0;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--app-space-3);
    margin-bottom: var(--app-space-4);

    .card-title {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      font-size: var(--app-fs-heading);
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

// 待审核论文为首屏主任务：只用主色描边区分层级，平面体系不加投影
.card.focus-card {
  border-color: rgba(var(--app-color-primary-rgb), 0.32);
}

// 待审核论文：扁平行 + 分隔线，避免卡片内再套卡片
.pending-list {
  .pending-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--app-space-5);
    padding: var(--app-space-4) 0;
    border-bottom: 1px solid var(--app-color-divider);

    &:last-child {
      border-bottom: none;
    }

    .paper-info {
      flex: 1;
      min-width: 0;

      .paper-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--app-space-4);
        margin-bottom: var(--app-space-2);

        .paper-title {
          margin: 0;
          color: var(--app-color-ink);
          font-size: var(--app-fs-heading);
          font-weight: 600;
          flex: 1;
          min-width: 0;
          line-height: var(--app-lh-heading);
        }

        .paper-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: var(--app-space-2);
          flex-shrink: 0;
        }
      }

      .paper-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-2) var(--app-space-4);
        font-size: var(--app-fs-caption);
        color: var(--app-color-text-muted);
        margin-bottom: var(--app-space-2);

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;

          .el-icon {
            font-size: var(--app-fs-body);
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
            font-size: var(--app-fs-body);
            color: var(--app-color-text-muted);
          }
        }
      }
    }

    .paper-actions {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-2);
      flex-shrink: 0;
    }
  }
}

// 空状态：待审核卡对齐右栏高度时，空态在卡内垂直居中
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

// 分析卡：饼图与状态明细并排，避免图例与图表上下堆叠拉高卡片
.analysis-card {
  display: flex;
  flex-direction: column;

  .pie-layout {
    display: flex;
    align-items: center;
    gap: var(--app-space-6);
  }

  .echarts-container {
    flex: 1 1 55%;
    min-width: 0;
    height: 220px;
  }

  .status-details {
    flex: 1 1 45%;
    min-width: 0;

    .status-detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--app-space-3);
      padding: var(--app-space-2) 0;
      border-bottom: 1px solid var(--app-color-divider);

      &:last-child {
        border-bottom: none;
      }

      .status-info {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        min-width: 0;

        .status-color {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-name {
          color: var(--app-color-text-secondary);
          font-size: var(--app-fs-caption);
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .status-metrics {
        display: flex;
        gap: var(--app-space-3);
        align-items: center;
        flex-shrink: 0;

        .status-count {
          color: var(--app-color-ink);
          font-weight: 600;
          font-size: var(--app-fs-caption);
          font-variant-numeric: tabular-nums;
        }

        .status-percentage {
          color: var(--app-color-text-muted);
          font-size: var(--app-fs-meta);
          background-color: var(--app-color-fill);
          padding: 2px var(--app-space-2);
          border-radius: var(--app-radius-pill);
          font-variant-numeric: tabular-nums;
        }
      }
    }
  }

  .bar-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--app-space-4);
    padding-top: var(--app-space-1);
  }

  .bar-item {
    display: flex;
    align-items: center;
    gap: var(--app-space-3);

    .bar-label {
      min-width: 96px;
      font-size: var(--app-fs-caption);
      color: var(--app-color-ink);
      font-weight: 400;
    }

    .bar-container {
      flex: 1;
      height: 6px;
      background: var(--app-color-border);
      border-radius: var(--app-radius-pill);
      overflow: hidden;

      .bar-fill {
        height: 100%;
        background: var(--app-color-primary);
        border-radius: var(--app-radius-pill);
        // 图表宽度动画专属过渡：条形图随数据补间宽度，固定 0.5s，不纳入全局过渡令牌
        transition: width 0.5s ease;
      }
    }

    .bar-value {
      min-width: 32px;
      font-size: var(--app-fs-caption);
      font-weight: 600;
      color: var(--app-color-ink);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
  }

  // 空态在拉伸后的卡片内垂直居中
  .empty-chart {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--app-space-6) 0;
    text-align: center;

    .empty-icon {
      font-size: 32px;
      color: var(--app-color-text-muted);
      margin-bottom: var(--app-space-2);
    }

    .empty-text {
      font-size: var(--app-fs-caption);
      font-weight: 600;
      color: var(--app-color-ink);
      margin-bottom: var(--app-space-1);
    }

    .empty-subtext {
      font-size: var(--app-fs-meta);
      color: var(--app-color-text-muted);
    }
  }

  @media (max-width: 768px) {
    .pie-layout {
      flex-direction: column;
      align-items: stretch;
    }

    .echarts-container {
      flex: none;
      width: 100%;
    }

    .status-details {
      flex: none;
    }
  }
}

// 学生状态统计：桌面右栏 2×2 紧凑矩阵，窄屏展开为单行四列
.students-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-4);

  .status-item {
    margin-bottom: 0;

    .status-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--app-space-1);
      margin-bottom: var(--app-space-2);

      .status-value {
        font-size: var(--app-fs-title);
        font-weight: 700;
        line-height: 1.1;
        color: var(--app-color-ink);
        font-variant-numeric: tabular-nums;
      }

      .status-label {
        font-size: var(--app-fs-meta);
        color: var(--app-color-text-muted);
        white-space: nowrap;
      }

      .status-percentage {
        font-size: var(--app-fs-meta);
        font-weight: 600;
        color: var(--app-color-ink);
        font-variant-numeric: tabular-nums;
      }
    }

    // 无进行中/无需修改时仅保留空轨道，不再把文字塞进 6px 高条内
    .empty-progress {
      height: 6px;
      background: var(--app-color-fill);
      border-radius: var(--app-radius-pill);
    }
  }

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

// 响应式：窄屏下待审核行改为纵向堆叠，操作按钮收到底部
@media (max-width: 768px) {
  .pending-list .pending-item {
    flex-direction: column;
    align-items: stretch;

    .paper-actions {
      flex-direction: row;
      justify-content: flex-end;
      margin-top: var(--app-space-3);
    }
  }

  .todo-strip {
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .card {
    padding: var(--app-card-padding);
  }
}
</style>
