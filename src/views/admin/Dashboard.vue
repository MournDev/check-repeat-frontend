<template>
  <div class="admin-dashboard">
    <!-- 页面说明：与其它工作台统一使用去白卡后的 PageHeader -->
    <PageHeader :description="`欢迎回来，${userStore.userInfo?.realName || '管理员'}！这里是业务数据总览`">
      <template #actions>
        <el-button :icon="Refresh" @click="refreshData">刷新数据</el-button>
      </template>
    </PageHeader>

    <!-- 系统统计卡片：与其它工作台一致，只保留标签 + 数值 -->
    <div class="stats-grid" v-loading="overviewLoading">
      <div class="stat-card">
        <span class="stat-label">总用户数</span>
        <span class="stat-value">{{ stats.totalUsers || 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">总论文数</span>
        <span class="stat-value">{{ stats.totalPapers || 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">待分配</span>
        <span class="stat-value">{{ stats.unassignedCount || 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">系统健康度</span>
        <span class="stat-value">{{ stats.systemHealth == null ? '—' : stats.systemHealth + '%' }}</span>
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
              <el-tag type="success" size="small" round>
                <el-icon><SuccessFilled /></el-icon>
                运行正常
              </el-tag>
            </div>
          </div>
          
          <div class="monitor-content" v-loading="overviewLoading">
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-value">{{ systemMonitorData.cpuUsage }}%</div>
                <div class="metric-label">CPU使用率</div>
                <el-progress
                  :percentage="clampPct(systemMonitorData.cpuUsage)"
                  :stroke-width="6"
                  :show-text="false"
                  color="var(--app-color-primary)"
                />
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ systemMonitorData.memoryUsage }}%</div>
                <div class="metric-label">内存使用率</div>
                <el-progress
                  :percentage="clampPct(systemMonitorData.memoryUsage)"
                  :stroke-width="6"
                  :show-text="false"
                  color="var(--app-color-primary)"
                />
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ systemMonitorData.todayVisits }}</div>
                <div class="metric-label">今日访问</div>
                <div class="metric-bar-spacer" aria-hidden="true"></div>
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
            <span class="dist-total">共 {{ userDistribution.total }} 人</span>
          </div>
          
          <div class="users-distribution" v-loading="overviewLoading">
            <div class="distribution-item">
              <div class="dist-info">
                <span class="dist-label">学生</span>
                <span class="dist-metrics">
                  <span class="dist-value">{{ userDistribution.students }}</span>
                  <span class="dist-percentage">{{ safePercent(userDistribution.students, userDistribution.total) }}%</span>
                </span>
              </div>
              <el-progress
                :percentage="safePercent(userDistribution.students, userDistribution.total)"
                :stroke-width="6"
                :show-text="false"
                color="var(--app-color-primary)"
              />
            </div>
            <div class="distribution-item">
              <div class="dist-info">
                <span class="dist-label">教师</span>
                <span class="dist-metrics">
                  <span class="dist-value">{{ userDistribution.teachers }}</span>
                  <span class="dist-percentage">{{ safePercent(userDistribution.teachers, userDistribution.total) }}%</span>
                </span>
              </div>
              <el-progress
                :percentage="safePercent(userDistribution.teachers, userDistribution.total)"
                :stroke-width="6"
                :show-text="false"
                color="var(--app-color-warning)"
              />
            </div>
            <div class="distribution-item">
              <div class="dist-info">
                <span class="dist-label">管理员</span>
                <span class="dist-metrics">
                  <span class="dist-value">{{ userDistribution.admins }}</span>
                  <span class="dist-percentage">{{ safePercent(userDistribution.admins, userDistribution.total) }}%</span>
                </span>
              </div>
              <el-progress
                :percentage="safePercent(userDistribution.admins, userDistribution.total)"
                :stroke-width="6"
                :show-text="false"
                color="var(--app-color-success)"
              />
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
      <div class="business-metrics" v-loading="bizLoading">
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
      <div class="chart-wrap" v-loading="rtLoading">
        <div v-if="rtChart.error" class="chart-error">
          <el-icon class="error-icon"><WarningFilled /></el-icon>
          <p>图表加载失败</p>
          <el-button size="small" type="primary" plain @click="loadResponseTimeTrend(rtTrendPeriod)">重试</el-button>
        </div>
        <el-empty v-else-if="rtChart.empty" description="暂无响应时间数据" :image-size="60" />
        <div v-else :ref="rtChart.chartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 论文全生命周期漏斗 + 超期预警（超管视角同样可见） -->
    <div class="wave3-panels">
      <LifecycleFunnel />
      <OverdueAlertPanel />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 导入管理员API
import { getDashboardStats, getBusinessMetrics, getResponseTimeTrend } from '@/api/admin/dashboard'
import { useChart } from '@/composables/useChart'
import PageHeader from '@/components/common/PageHeader.vue'
import LifecycleFunnel from '@/views/admin/components/LifecycleFunnel.vue'
import OverdueAlertPanel from '@/views/admin/components/OverdueAlertPanel.vue'
import { getUserList } from '@/api/admin/users'
import { getPaperList } from '@/api/admin/papers'
import { getAssignmentStats } from '@/api/admin/assignment'
import { formatDate, formatDateTime } from '@/utils/dataType.js'

// 图标引入
import {
  Refresh, TrendCharts, Monitor, SuccessFilled, PieChart, Timer, WarningFilled
} from '@element-plus/icons-vue'

const userStore = useUserStore()

// 响应时间趋势（useChart 托管容器/dispose/resize/空态）
const rtChart = useChart()
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

// 加载状态
const overviewLoading = ref(false)
const bizLoading = ref(false)
const rtLoading = ref(false)

// 安全计算百分比，避免除以 0 或产生 NaN
const safePercent = (count, total) => {
  const t = Number(total) || 0
  const c = Number(count) || 0
  if (t <= 0 || !isFinite(t) || !isFinite(c)) return 0
  const p = Math.max(0, Math.min(100, (c / t) * 100))
  return Math.round(p * 100) / 100
}

// el-progress 只接受 0-100 的有限数值，空值按 0 处理
const clampPct = (value) => {
  const n = Number(value)
  if (!isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
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
  overviewLoading.value = true
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
      systemHealth: statsResponse.data.systemMonitor?.healthScore ?? null
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
        ? formatDateTime(statsResponse.data.lastBackup)
        : '暂无'
    }
  } catch (error) {
    // 错误提示由 request 拦截器统一弹出（401/500 等），页面不重复弹
    console.error('加载统计数据失败:', error)
  } finally {
    overviewLoading.value = false
  }
}

const loadBusinessMetrics = async () => {
  bizLoading.value = true
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
  } finally {
    bizLoading.value = false
  }
}

const loadResponseTimeTrend = async (minutes) => {
  rtTrendPeriod.value = minutes
  rtLoading.value = true
  try {
    await rtChart.run(
      () => getResponseTimeTrend(minutes),
      (res) => {
        if (res?.code !== 200) throw new Error(res?.message || '响应时间接口返回异常')
        const d = res.data
        if (!d) return null
        const hasValue = [
          ...(d.avgResponseTime || []),
          ...(d.p95ResponseTime || []),
          ...(d.requestCount || [])
        ].some(value => Number(value) > 0)
        if (!hasValue) return null
        return {
          tooltip: { trigger: 'axis' },
          legend: { data: ['平均响应(ms)', 'P95响应(ms)', '请求数'] },
          grid: { left: 60, right: 60, top: 20, bottom: 30 },
          xAxis: { type: 'category', data: d.timestamps || [], boundaryGap: false, axisLabel: { hideOverlap: true } },
          yAxis: [
            { type: 'value', name: 'ms', min: 0 },
            { type: 'value', name: '次', min: 0 }
          ],
          series: [
            {
              name: '平均响应(ms)', type: 'line', smooth: true,
              data: d.avgResponseTime || [],
              itemStyle: { color: '#0066cc' },
              areaStyle: { color: 'rgba(14,165,233,0.1)' }
            },
            {
              name: 'P95响应(ms)', type: 'line', smooth: true,
              data: d.p95ResponseTime || [],
              itemStyle: { color: '#ff9500' },
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
        }
      }
    )
  } catch (error) {
    console.error('加载响应时间趋势失败:', error)
  } finally {
    rtLoading.value = false
  }
}

// 待办相关功能已移除

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

onMounted(() => {
  loadDashboardData()
  if (userStore.role === 'ADMIN' || userStore.role === 'SUPER_ADMIN') {
    loadBusinessMetrics()
    loadResponseTimeTrend(15)
  }
})
</script>

<style lang="scss" scoped>

// 统计卡片：4 列等宽，移动端保持 2 列，与教师工作台一致
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--app-space-4);
  margin-bottom: var(--app-space-6);

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

// 纯数值卡：标签在上、数值在下，不使用图标色块
.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
  padding: var(--app-space-4) var(--app-space-6);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border-soft);
  border-radius: var(--app-radius-lg);

  .stat-label {
    font-size: var(--app-fs-caption);
    color: var(--app-color-text-muted);
  }

  .stat-value {
    font-size: var(--app-fs-metric);
    font-weight: 600;
    line-height: 1.1;
    color: var(--app-color-ink);
    font-variant-numeric: tabular-nums;
  }
}

// 主要内容区域：左右两栏等高，右栏用垂直居中填满，避免底部留白
.wave3-panels {
  display: grid;
  grid-template-columns: minmax(0, 13fr) minmax(0, 11fr);
  gap: var(--app-space-4);
  margin-top: var(--app-space-4);

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.main-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--app-space-6);
  margin-bottom: var(--app-space-6);

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.main-left,
.main-right {
  display: flex;
}

.main-left > .card,
.main-right > .card {
  flex: 1;
  margin-bottom: 0;
}

.main-right > .card {
  display: flex;
  flex-direction: column;
}

// 通用卡片样式
.card {
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border-soft);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-6);
  margin-bottom: 0;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--app-space-4);
    
    .card-title {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      font-family: var(--app-font-family);
      font-size: var(--app-fs-heading);
      font-weight: 600;
      color: var(--app-color-ink);
      
      .el-icon {
        color: var(--app-color-text-secondary);
      }
    }
  }
}

// 系统监控
.monitor-content {
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--app-space-4);
    margin-bottom: var(--app-space-6);
  }
  
  .metric-item {
    padding: var(--app-space-4);
    background: var(--app-color-fill);
    border-radius: var(--app-radius-sm);

    .metric-value {
      font-size: var(--app-fs-display);
      font-weight: 700;
      color: var(--app-color-ink);
      margin-bottom: var(--app-space-2);
    }
    
    .metric-label {
      color: var(--app-color-text-secondary);
      font-size: var(--app-fs-meta);
      margin-bottom: var(--app-space-3);
    }

    // 无进度条的指标保留同高占位，保证三块指标底部对齐
    .metric-bar-spacer {
      height: 6px;
    }
  }
  
  .server-info {
    margin-top: var(--app-space-6);
    
    h4 {
      margin: 0 0 var(--app-space-4) 0;
      color: var(--app-color-ink);
      font-weight: 600;
    }
    
    // 固定 2 列，避免 4 项在桌面按 auto-fit 排成 3+1 的孤立行
    .server-details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-4);
    }
    
    .server-detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--app-space-3);
      background: var(--app-color-fill);
      border-radius: var(--app-radius-sm);
      
      .detail-label {
        color: var(--app-color-text-secondary);
        font-size: var(--app-fs-meta);
      }
      
      .detail-value {
        color: var(--app-color-ink);
        font-weight: 400;
      }
    }
  }
}

// 用户分布：卡片被拉伸时用等距分布填满，避免内容居中后上下大片空白
.users-distribution {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-evenly;
  gap: var(--app-space-4);

  .distribution-item {
    margin-bottom: 0;

    .dist-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--app-space-2);
      margin-bottom: var(--app-space-2);
      
      .dist-label {
        color: var(--app-color-text-secondary);
        font-size: var(--app-fs-caption);
      }

      .dist-metrics {
        display: inline-flex;
        align-items: baseline;
        gap: var(--app-space-2);
      }
      
      .dist-value {
        font-size: var(--app-fs-title);
        font-weight: 700;
        line-height: 1.1;
        color: var(--app-color-ink);
        font-variant-numeric: tabular-nums;
      }

      .dist-percentage {
        font-size: var(--app-fs-meta);
        color: var(--app-color-text-muted);
        background: var(--app-color-fill);
        padding: 1px var(--app-space-2);
        border-radius: var(--app-radius-pill);
        font-variant-numeric: tabular-nums;
      }
    }
  }
}

// 分布卡头部总数
.dist-total {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  font-variant-numeric: tabular-nums;
}

// 状态标签
.monitor-status {
  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

// 业务指标
.business-metrics-card {
  margin-top: var(--app-space-6);
}

// 响应时间趋势图
.response-time-card {
  margin-top: var(--app-space-6);

  .header-right {
    display: flex;
    align-items: center;
  }

  .chart-wrap {
    min-height: 120px;
  }

  .chart-error {
    height: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--app-space-2);
    color: var(--app-color-danger);
    text-align: center;

    .error-icon {
      font-size: 28px;
    }

    p {
      margin: 0;
      font-size: var(--app-fs-caption);
    }
  }

  .chart-container {
    width: 100%;
    height: 320px;
  }

  @media (max-width: 768px) {
    .chart-container {
      height: 240px;
    }
  }
}

// 业务指标：7 项固定一行，平板 4 列，移动端 2 列，避免 auto-fill 产生孤立行
.business-metrics {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--app-space-4);

  @media (max-width: 1023px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-item {
    padding: var(--app-space-4);
    background: var(--app-color-fill);
    border-radius: var(--app-radius-sm);
    text-align: center;

    .metric-value {
      font-size: var(--app-fs-metric);
      font-weight: 700;
      color: var(--app-color-ink);
      margin-bottom: var(--app-space-2);
    }

    .metric-label {
      color: var(--app-color-text-secondary);
      font-size: var(--app-fs-meta);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .monitor-content .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  // 第三块“今日访问”跨两列，避免 2 列下只剩半行
  .monitor-content .metrics-grid .metric-item:last-child {
    grid-column: 1 / -1;
  }

  .monitor-content .server-info .server-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  // 窄屏下长数值改为上下排列，避免日期在 2 列里被挤压
  .monitor-content .server-info .server-detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--app-space-1);
  }
}

@media (max-width: 480px) {
  .monitor-content .server-info .server-details {
    grid-template-columns: minmax(0, 1fr);
  }

  .card {
    padding: var(--app-card-padding);
  }
}
</style>
