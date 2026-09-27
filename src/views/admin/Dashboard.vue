<template>
  <div class="admin-dashboard">
    <!-- 页面标题和快速操作 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-left">
          <h1 class="welcome-title">运营概览</h1>
          <p class="welcome-subtitle">欢迎回来，{{ userStore.userInfo?.realName || '管理员' }}！这里是业务数据总览</p>
        </div>
        <div class="welcome-actions">
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 系统统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon user-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon paper-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalPapers || 0 }}</div>
          <div class="stat-label">总论文数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon unassigned-icon">
          <el-icon><Connection /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.unassignedCount || 0 }}</div>
          <div class="stat-label">待分配</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon health-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.systemHealth || 0 }}%</div>
          <div class="stat-label">系统健康度</div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧：系统监控 -->
      <div class="main-left">
        <!-- 系统监控 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><Monitor /></el-icon>
              系统监控
            </div>
            <div class="monitor-status">
              <span class="status-badge success">
                <el-icon><SuccessFilled /></el-icon>
                运行正常
              </span>
            </div>
          </div>
          
          <div class="monitor-content">
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-value">{{ systemMonitorData.cpuUsage }}%</div>
                <div class="metric-label">CPU使用率</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: systemMonitorData.cpuUsage + '%' }"></div>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ systemMonitorData.memoryUsage }}%</div>
                <div class="metric-label">内存使用率</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: systemMonitorData.memoryUsage + '%' }"></div>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ systemMonitorData.todayVisits }}</div>
                <div class="metric-label">今日访问</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: Math.min(100, systemMonitorData.todayVisits / 2) + '%' }"></div>
                </div>
              </div>
            </div>
            
            <div class="server-info">
              <h4>服务器信息</h4>
              <div class="server-details">
                <div class="server-detail-item">
                  <span class="detail-label">系统版本</span>
                  <span class="detail-value">{{ systemMonitorData.systemVersion }}</span>
                </div>
                <div class="server-detail-item">
                  <span class="detail-label">运行时间</span>
                  <span class="detail-value">{{ systemMonitorData.uptime }}</span>
                </div>
                <div class="server-detail-item">
                  <span class="detail-label">数据库</span>
                  <span class="detail-value">{{ systemMonitorData.database }}</span>
                </div>
                <div class="server-detail-item">
                  <span class="detail-label">最后备份</span>
                  <span class="detail-value">{{ systemMonitorData.lastBackup }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：数据统计和快速操作 -->
      <div class="main-right">
        <!-- 用户分布 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><PieChart /></el-icon>
              用户分布
            </div>
          </div>
          
          <div class="users-distribution">
            <div class="distribution-item">
              <div class="dist-info">
                <div class="dist-value">{{ userDistribution.students }}</div>
                <div class="dist-label">学生</div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill student" :style="{ width: safePercent(userDistribution.students, userDistribution.total) + '%' }"></div>
              </div>
            </div>
            <div class="distribution-item">
              <div class="dist-info">
                <div class="dist-value">{{ userDistribution.teachers }}</div>
                <div class="dist-label">教师</div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill teacher" :style="{ width: safePercent(userDistribution.teachers, userDistribution.total) + '%' }"></div>
              </div>
            </div>
            <div class="distribution-item">
              <div class="dist-info">
                <div class="dist-value">{{ userDistribution.admins }}</div>
                <div class="dist-label">管理员</div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill admin" :style="{ width: safePercent(userDistribution.admins, userDistribution.total) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 业务指标（仅 ADMIN 可见） -->
    <div v-if="userStore.role === 'ADMIN' || userStore.role === 'SUPER_ADMIN'" class="card business-metrics-card">
      <div class="card-header">
        <div class="card-title">
          <el-icon><TrendCharts /></el-icon>
          业务指标
        </div>
        <el-button text size="small" @click="loadBusinessMetrics">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="business-metrics">
        <div class="metric-item">
          <div class="metric-value">{{ bizMetrics.loginSuccess || 0 }}</div>
          <div class="metric-label">登录成功</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ bizMetrics.loginFailure || 0 }}</div>
          <div class="metric-label">登录失败</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ bizMetrics.registerSuccess || 0 }}</div>
          <div class="metric-label">注册成功</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ bizMetrics.paperSubmit || 0 }}</div>
          <div class="metric-label">论文提交</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ bizMetrics.paperReviewPass || 0 }}</div>
          <div class="metric-label">审核通过</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ bizMetrics.paperReviewReject || 0 }}</div>
          <div class="metric-label">审核驳回</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ bizMetrics.queueDepth ?? '--' }}</div>
          <div class="metric-label">待处理查重任务</div>
        </div>
      </div>
    </div>

    <!-- 响应时间趋势图（仅 ADMIN 可见） -->
    <div v-if="userStore.role === 'ADMIN' || userStore.role === 'SUPER_ADMIN'" class="card response-time-card">
      <div class="card-header">
        <div class="card-title">
          <el-icon><Timer /></el-icon>
          响应时间趋势
        </div>
        <div class="header-right">
          <el-button-group size="small">
            <el-button :type="rtTrendPeriod === 5 ? 'primary' : ''" @click="loadResponseTimeTrend(5)">5分钟</el-button>
            <el-button :type="rtTrendPeriod === 15 ? 'primary' : ''" @click="loadResponseTimeTrend(15)">15分钟</el-button>
            <el-button :type="rtTrendPeriod === 30 ? 'primary' : ''" @click="loadResponseTimeTrend(30)">30分钟</el-button>
          </el-button-group>
        </div>
      </div>
      <div ref="responseTimeChartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 导入管理员API
import { getDashboardStats, getBusinessMetrics, getResponseTimeTrend } from '@/api/admin/dashboard'
import * as echarts from 'echarts'
import { getUserList } from '@/api/admin/users'
import { getPaperList } from '@/api/admin/papers'
import { getAssignmentStats } from '@/api/admin/assignment'

// 图标引入
import {
  Refresh, User, Document, Connection, TrendCharts,
  Monitor, SuccessFilled, PieChart, Timer
} from '@element-plus/icons-vue'

const userStore = useUserStore()

// 响应时间趋势
const responseTimeChartRef = ref(null)
let responseTimeChart = null
const rtTrendPeriod = ref(15)

// 响应式数据
const stats = ref({})
const userDistribution = ref({ total: 0, students: 0, teachers: 0, admins: 0 })
const systemMonitorData = ref({
  cpuUsage: 0,
  memoryUsage: 0,
  todayVisits: 0,
  systemVersion: '',
  uptime: '',
  database: '',
  lastBackup: '暂无'
})
const bizMetrics = ref({
  loginSuccess: 0,
  loginFailure: 0,
  registerSuccess: 0,
  paperSubmit: 0,
  paperReviewPass: 0,
  paperReviewReject: 0,
  queueDepth: null
})

// 安全计算百分比，避免除以 0 或产生 NaN
const safePercent = (count, total) => {
  const t = Number(total) || 0
  const c = Number(count) || 0
  if (t <= 0 || !isFinite(t) || !isFinite(c)) return 0
  const p = Math.max(0, Math.min(100, (c / t) * 100))
  return Math.round(p * 100) / 100
}

// 方法
const refreshData = async () => {
  try {
    await loadDashboardData()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

const loadDashboardData = async () => {
  try {
    // 并行加载多个API数据
    const [
      statsResponse, 
      assignmentStatsResponse, 
      usersResponse, 
      papersResponse
    ] = await Promise.all([
      getDashboardStats(),
      getAssignmentStats(),
      getUserList({ page: 1, size: 500 }),
      getPaperList({ page: 1, size: 1 })
    ])

    // 处理统计数据
    stats.value = {
      totalUsers: statsResponse.data.totalUsers ?? 0,
      totalPapers: statsResponse.data.validPapers ?? 0,
      validPapers: statsResponse.data.validPapers ?? 0,
      unassignedCount: statsResponse.data.pendingPapers ?? 0,
      systemHealth: statsResponse.data.systemMonitor?.healthScore ?? 95
    }

    // 处理用户分布
    const allUsers = usersResponse.data.list || []
    const totalUsers = usersResponse.data.total ?? allUsers.length ?? statsResponse.data.totalUsers ?? 0
    userDistribution.value = {
      total: Number(totalUsers) || allUsers.length || statsResponse.data.totalUsers || 0,
      students: Number(statsResponse.data.students ?? allUsers.filter(user => user.roleCode === 'STUDENT').length) || 0,
      teachers: Number(statsResponse.data.teachers ?? allUsers.filter(user => user.roleCode === 'TEACHER').length) || 0,
      admins: Number(statsResponse.data.admins ?? allUsers.filter(user => user.roleCode === 'ADMIN').length) || 0
    }

    // 从stats接口获取系统监控数据
    const monitorData = statsResponse.data.systemMonitor || {}
    systemMonitorData.value = {
      cpuUsage: monitorData.cpuUsage !== undefined ? Math.round(monitorData.cpuUsage) : 0,
      memoryUsage: monitorData.memoryUsage !== undefined ? monitorData.memoryUsage : 0,
      todayVisits: statsResponse.data.todayVisits || 0,
      systemVersion: monitorData.javaVersion ? `Java ${monitorData.javaVersion}` : '未知',
      uptime: monitorData.uptime || '未知',
      database: monitorData.databaseType || '未知',
      lastBackup: statsResponse.data.lastBackup
        ? new Date(statsResponse.data.lastBackup).toLocaleString('zh-CN')
        : '暂无'
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  }
}

const loadBusinessMetrics = async () => {
  try {
    const res = await getBusinessMetrics()
    if (res.code === 200 && res.data) {
      const counters = res.data.counters || {}
      const gauges = res.data.gauges || {}
      bizMetrics.value = {
        loginSuccess: Math.round(counters['business.event.count[event=user_login,result=success]'] || 0),
        loginFailure: Math.round(counters['business.event.count[event=user_login,result=failure]'] || 0),
        registerSuccess: Math.round(counters['business.event.count[event=user_register,result=success]'] || 0),
        paperSubmit: Math.round(counters['business.event.count[event=paper_submit,result=success]'] || 0),
        paperReviewPass: Math.round(counters['business.event.count[event=paper_review,result=pass]'] || 0),
        paperReviewReject: Math.round(counters['business.event.count[event=paper_review,result=reject]'] || 0),
        queueDepth: gauges['check.task.queue.depth'] !== undefined ? Math.round(gauges['check.task.queue.depth']) : null
      }
    }
  } catch (error) {
    console.error('加载业务指标失败:', error)
  }
}

const loadResponseTimeTrend = async (minutes) => {
  rtTrendPeriod.value = minutes
  try {
    const res = await getResponseTimeTrend(minutes)
    if (res.code === 200 && res.data) {
      const d = res.data
      if (responseTimeChart) {
        responseTimeChart.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['平均响应(ms)', 'P95响应(ms)', '请求数'] },
          grid: { left: 60, right: 60, top: 20, bottom: 30 },
          xAxis: { type: 'category', data: d.timestamps || [], boundaryGap: false },
          yAxis: [
            { type: 'value', name: 'ms', min: 0 },
            { type: 'value', name: '次', min: 0 }
          ],
          series: [
            {
              name: '平均响应(ms)', type: 'line', smooth: true,
              data: d.avgResponseTime || [],
              itemStyle: { color: '#0ea5e9' },
              areaStyle: { color: 'rgba(14,165,233,0.1)' }
            },
            {
              name: 'P95响应(ms)', type: 'line', smooth: true,
              data: d.p95ResponseTime || [],
              itemStyle: { color: '#f59e0b' },
              lineStyle: { type: 'dashed' }
            },
            {
              name: '请求数', type: 'bar',
              data: d.requestCount || [],
              yAxisIndex: 1,
              itemStyle: { color: 'rgba(0,102,204,0.2)', borderColor: '#0066cc', borderRadius: [4, 4, 0, 0] },
              barMaxWidth: 20
            }
          ]
        }, true)
      }
    }
  } catch (error) {
    console.error('加载响应时间趋势失败:', error)
  }
}

const initResponseTimeChart = () => {
  nextTick(() => {
    if (responseTimeChartRef.value) {
      responseTimeChart = echarts.init(responseTimeChartRef.value)
      window.addEventListener('resize', () => responseTimeChart?.resize())
      loadResponseTimeTrend(15)
    }
  })
}

// 待办相关功能已移除

const formatTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const target = new Date(date)
  
  if (now.toDateString() === target.toDateString()) {
    return target.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return target.toLocaleDateString('zh-CN')
  }
}

onMounted(() => {
  loadDashboardData()
  if (userStore.role === 'ADMIN' || userStore.role === 'SUPER_ADMIN') {
    loadBusinessMetrics()
    initResponseTimeChart()
  }
})

onUnmounted(() => {
  if (responseTimeChart) {
    responseTimeChart.dispose()
    responseTimeChart = null
  }
})
</script>

<style lang="scss" scoped>
// 全局样式
.admin-dashboard {
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
        font-weight: 700;
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
}

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

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
    border-color: #cbd5e1;
  }

  &:active {
    transform: scale(0.95);
    transition: transform 0.15s ease;
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
    
    &.user-icon {
      background: #f0f9ff;
      color: #0ea5e9;
    }
    
    &.paper-icon {
      background: #fef3c7;
      color: #f59e0b;
    }
    
    &.unassigned-icon {
      background: #d1fae5;
      color: #10b981;
    }
    
    &.health-icon {
      background: #ede9fe;
      color: #8b5cf6;
    }
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1d1d1f;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #86868b;
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
  }
}

// 系统监控
.monitor-content {
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .metric-item {
    padding: 16px;
    background: #f5f5f7;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1d1d1f;
      margin-bottom: 8px;
    }
    
    .metric-label {
      color: #86868b;
      font-size: 0.875rem;
      margin-bottom: 12px;
    }
  }
  
  .server-info {
    margin-top: 24px;
    
    h4 {
      margin: 0 0 16px 0;
      color: #1d1d1f;
      font-weight: 600;
    }
    
    .server-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .server-detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f5f5f7;
      border-radius: 8px;
      
      .detail-label {
        color: #86868b;
        font-size: 0.875rem;
      }
      
      .detail-value {
        color: #1d1d1f;
        font-weight: 400;
      }
    }
  }
}

// 用户分布
.users-distribution {
  .distribution-item {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .dist-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .dist-value {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1d1d1f;
      }
      
      .dist-label {
        color: #86868b;
        font-size: 0.875rem;
      }
    }
  }
}

// 进度条
.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  
  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
    
    &:not(.student):not(.teacher):not(.admin) {
      background: #0ea5e9;
    }
    
    &.student {
      background: #0066cc;
    }
    
    &.teacher {
      background: #f5576c;
    }
    
    &.admin {
      background: #10b981;
    }
  }
}

// 状态标签
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 400;
  
  &.success {
    background: #d1fae5;
    color: #10b981;
  }
  
  .el-icon {
    font-size: 14px;
  }
}

// 业务指标
.business-metrics-card {
  margin-top: 24px;
}

// 响应时间趋势图
.response-time-card {
  margin-top: 24px;

  .header-right {
    display: flex;
    align-items: center;
  }

  .chart-container {
    width: 100%;
    height: 320px;
  }
}

.business-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;

  .metric-item {
    padding: 16px;
    background: #f5f5f7;
    border-radius: 8px;
    text-align: center;

    .metric-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1d1d1f;
      margin-bottom: 8px;
    }

    .metric-label {
      color: #86868b;
      font-size: 0.875rem;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .admin-dashboard {
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
    grid-template-columns: repeat(2, 1fr);
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .server-details {
    grid-template-columns: 1fr;
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