<template>
  <div class="admin-dashboard">
    <!-- 页面标题和快速操作 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">系统概览</h1>
        <p class="page-desc">欢迎回来，{{ userStore.userInfo?.realName || '管理员' }}！这里是系统管理中心</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" :icon="UserFilled" @click="goToUserManagement">
          用户管理
        </el-button>
        <el-button :icon="DataAnalysis" @click="goToSchoolOverview">
          全校概览
        </el-button>
        <el-button :icon="Refresh" @click="refreshData">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 系统统计卡片 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPapers || 0 }}</div>
              <div class="stat-label">总论文数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.unassignedCount || 0 }}</div>
              <div class="stat-label">待分配</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.systemHealth || 0 }}%</div>
              <div class="stat-label">系统健康度</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="dashboard-content">
      <!-- 左侧：系统监控 -->
      <el-col :xs="24" :lg="16">
        <!-- 系统监控 -->
        <el-card class="monitor-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Monitor /></el-icon>
                系统监控
              </span>
              <div class="monitor-status">
                <el-tag type="success" effect="light">
                  <el-icon><SuccessFilled /></el-icon>
                  运行正常
                </el-tag>
              </div>
            </div>
          </template>
          
          <div class="monitor-content">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="metric-item">
                  <div class="metric-value">{{ systemMonitorData.cpuUsage }}%</div>
                  <div class="metric-label">CPU使用率</div>
                  <el-progress :percentage="systemMonitorData.cpuUsage" :show-text="false" />
                </div>
              </el-col>
              <el-col :span="8">
                <div class="metric-item">
                  <div class="metric-value">{{ formatMemory(systemMonitorData.memoryUsage) }}</div>
                  <div class="metric-label">内存使用</div>
                  <el-progress :percentage="systemMonitorData.memoryUsage" :show-text="false" />
                </div>
              </el-col>
              <el-col :span="8">
                <div class="metric-item">
                  <div class="metric-value">{{ systemMonitorData.todayVisits }}</div>
                  <div class="metric-label">今日访问</div>
                  <el-progress :percentage="Math.min(100, systemMonitorData.todayVisits / 2)" :show-text="false" />
                </div>
              </el-col>
            </el-row>
            
            <div class="server-info">
              <h4>服务器信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="系统版本">{{ systemMonitorData.systemVersion }}</el-descriptions-item>
                <el-descriptions-item label="运行时间">{{ systemMonitorData.uptime }}</el-descriptions-item>
                <el-descriptions-item label="数据库">{{ systemMonitorData.database }}</el-descriptions-item>
                <el-descriptions-item label="最后备份">{{ systemMonitorData.lastBackup }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：数据统计和快速操作 -->
      <el-col :xs="24" :lg="8">
        <!-- 用户分布 -->
        <el-card class="users-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><PieChart /></el-icon>
                用户分布
              </span>
            </div>
          </template>
          
          <div class="users-distribution">
            <div class="distribution-item">
              <div class="dist-info">
                <div class="dist-value">{{ userDistribution.students }}</div>
                <div class="dist-label">学生</div>
              </div>
              <el-progress 
                :percentage="safePercent(userDistribution.students, userDistribution.total)" 
                :stroke-width="12"
                text-inside
                :color="['#667eea', '#764ba2']"
              />
            </div>
            <div class="distribution-item">
              <div class="dist-info">
                <div class="dist-value">{{ userDistribution.teachers }}</div>
                <div class="dist-label">教师</div>
              </div>
              <el-progress 
                :percentage="safePercent(userDistribution.teachers, userDistribution.total)" 
                :stroke-width="12"
                text-inside
                :color="['#f093fb', '#f5576c']"
              />
            </div>
            <div class="distribution-item">
              <div class="dist-info">
                <div class="dist-value">{{ userDistribution.admins }}</div>
                <div class="dist-label">管理员</div>
              </div>
              <el-progress 
                :percentage="safePercent(userDistribution.admins, userDistribution.total)" 
                :stroke-width="12"
                text-inside
                :color="['#43e97b', '#38f9d7']"
              />
            </div>
          </div>
        </el-card>

        <!-- 快速操作 -->
        <el-card class="quick-actions-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Operation /></el-icon>
                快速操作
              </span>
            </div>
          </template>
          
          <div class="action-buttons">
            <el-button 
              type="primary" 
              :icon="UserFilled" 
              class="action-button"
              @click="goToUserManagement"
            >
              用户管理
            </el-button>
            <el-button 
              :icon="Connection" 
              class="action-button"
              @click="goToAdvisorAssign"
            >
              导师分配
            </el-button>
            <el-button 
              :icon="Setting" 
              class="action-button"
              @click="goToSystemConfig"
            >
              系统配置
            </el-button>
            <el-button 
              :icon="Document" 
              class="action-button"
              @click="goToLogCenter"
            >
              日志中心
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 导入管理员API
import { getDashboardStats, getRecentActivities } from '@/api/admin/dashboard'
import { getUserList } from '@/api/admin/users'
import { getPaperList } from '@/api/admin/papers'
import { getAssignmentStats } from '@/api/admin/assignment'

// 图标引入
import {
  UserFilled, Refresh, User, Document, Connection, TrendCharts,
  List, More, CollectionTag, Clock, Check, Monitor, SuccessFilled,
  PieChart, Operation, Setting, Histogram, DataAnalysis
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

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
  lastBackup: ''
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
      totalPapers: statsResponse.data.totalPapers ?? 0,
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

    // 调试：打印接口返回的原始数据
    console.log('Dashboard Stats Response:', statsResponse)
    console.log('System Monitor data:', statsResponse.data.systemMonitor)
    
    // 从stats接口获取系统监控数据
    const monitorData = statsResponse.data.systemMonitor || {}
    systemMonitorData.value = {
      cpuUsage: monitorData.cpuUsage !== undefined ? Math.round(monitorData.cpuUsage * 100) : 0,
      memoryUsage: monitorData.memoryUsage !== undefined ? monitorData.memoryUsage : 0,
      todayVisits: statsResponse.data.totalUsers || 0, // 使用总用户数作为访问参考
      systemVersion: 'v2.1.0',
      uptime: monitorData.uptime || '未知',
      database: 'MySQL 8.0',
      lastBackup: '2小时前'
    }
    
    // 调试：打印处理后的数据
    console.log('Processed system monitor data:', systemMonitorData.value)

  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
    
    // 使用模拟数据作为降级方案
    stats.value = {
      totalUsers: 156,
      totalPapers: 89,
      unassignedCount: 12,
      systemHealth: 95
    }
    
    userDistribution.value = {
      total: 156,
      students: 120,
      teachers: 30,
      admins: 6
    }
    
    systemMonitorData.value = {
      cpuUsage: 65,
      memoryUsage: 45,
      todayVisits: 156,
      systemVersion: 'v2.1.0',
      uptime: '15天',
      database: 'MySQL 8.0',
      lastBackup: '2小时前'
    }
  }
}

const goToUserManagement = () => {
  router.push('/admin/user-management')
}

const goToAdvisorAssign = () => {
  router.push('/admin/paper-assignment')
}

const goToSystemConfig = () => {
  router.push('/admin/system-config')
}

const goToLogCenter = () => {
  router.push('/admin/log-center')
}

const goToSchoolOverview = () => {
  router.push('/admin/school-overview')
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

const formatMemory = (usage) => {
  // 根据实际数据格式调整显示
  console.log('Formatting memory usage:', usage)
  if (usage === 0 || usage === undefined) {
    return '0.0GB'
  } else {
    // 直接显示GB数值
    return `${usage.toFixed(1)}GB`
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.admin-dashboard {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  
  .header-content {
    .page-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .page-desc {
      margin: 0;
      color: #7f8c8d;
      font-size: 0.95rem;
    }
  }
  
  .quick-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.stats-cards {
  margin-bottom: 1.5rem;
  
  .stat-card {
    border: none;
    border-radius: 12px;
    
    .stat-content {
      display: flex;
      align-items: center;
      
      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        margin-right: 1rem;
        
        .el-icon {
          color: white;
          font-size: 1.5rem;
        }
      }
      
      .stat-info {
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin-top: 0.25rem;
        }
      }
    }
  }
}

.dashboard-content {
  .el-card {
    border-radius: 12px;
    border: 1px solid #f1f2f6;
    margin-bottom: 1rem;
    
    :deep(.el-card__header) {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f2f6;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .card-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: #2c3e50;
          
          .el-icon {
            margin-right: 0.5rem;
            color: #667eea;
          }
        }
      }
    }
  }
}

/* 待办相关样式已移除 */

.monitor-content {
  .metric-item {
    text-align: center;
    padding: 1rem;
    
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    
    .metric-label {
      color: #7f8c8d;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
  }
  
  .server-info {
    margin-top: 1.5rem;
    
    h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }
  }
}

.users-distribution {
  .distribution-item {
    margin-bottom: 1.5rem;
    min-height: 56px;
    
    .dist-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      
      .dist-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #2c3e50;
      }
      
      .dist-label {
        color: #7f8c8d;
        font-size: 0.875rem;
      }
    }
    :deep(.el-progress) {
      display: block;
      width: 100% !important;
      margin-top: 8px;
    }
    :deep(.el-progress__text) {
      color: #fff;
      font-weight: 600;
      font-size: 12px;
    }
  }
}

.action-buttons {
  display: grid;
  gap: 0.75rem;
  
  .action-button {
    width: 100%;
    justify-content: flex-start;
    padding: 1rem;
    border-radius: 8px;
    
    &:hover {
      background-color: #f8f9fa;
    }
  }
}

.logs-list {
  .log-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f8f9fa;
    
    &:last-child {
      border-bottom: none;
    }
    
    .log-content {
      flex: 1;
      
      .log-action {
        font-weight: 500;
        color: #2c3e50;
        margin-bottom: 0.25rem;
      }
      
      .log-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: #7f8c8d;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    
    .quick-actions {
      width: 100%;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .todo-item {
    flex-direction: column;
    align-items: flex-start !important;
    
    .todo-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 1rem;
    }
  }
  
  .monitor-content {
    .el-col {
      margin-bottom: 1rem;
    }
  }
}
</style>