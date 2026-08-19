<template>
  <div class="teacher-dashboard">
    <!-- 页面标题和快速操作 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">审核工作台</h1>
        <p class="page-desc">欢迎回来，{{ userStore.userInfo?.realName || '老师' }}！这里是您的论文审核中心</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" :icon="EditPen" @click="goToPaperReview">
          开始审核
        </el-button>
        <el-button :icon="Refresh" @click="refreshData">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-cards" v-loading="loading">
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.studentCount || 0 }}</div>
              <div class="stat-label">指导学生</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingCount || 0 }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.reviewedCount || 0 }}</div>
              <div class="stat-label">已审核</div>
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
              <div class="stat-value">{{ stats.passRate || 0 }}%</div>
              <div class="stat-label">通过率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="dashboard-content">
      <!-- 左侧：待办事项和学生进度 -->
      <el-col :xs="24" :lg="16">
        <!-- 待审核论文 -->
        <el-card class="pending-papers-card" shadow="never" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Document /></el-icon>
                待审核论文
                <el-tag v-if="stats.pendingCount > 0" type="danger" size="small">
                  {{ stats.pendingCount }}
                </el-tag>
              </span>
              <el-button text :icon="More" @click="goToPaperReview"></el-button>
            </div>
          </template>
          
          <div class="pending-list">
            <div 
              v-for="paper in pendingPapers" 
              :key="paper.id" 
              class="pending-item"
            >
              <div class="paper-info">
                <div class="paper-header">
                  <h4 class="paper-title">{{ paper.title }}</h4>
                  <el-tag type="warning" size="small">待审核</el-tag>
                </div>
                <div class="paper-meta">
                  <span class="student-name">
                    <el-icon><User /></el-icon>
                    {{ paper.studentName }}
                  </span>
                  <span class="submit-time">
                    <el-icon><Clock /></el-icon>
                    {{ formatTime(paper.submitTime) }}
                  </span>
                  <span class="paper-version">
                    <el-icon><Files /></el-icon>
                    版本 v{{ paper.version }}
                  </span>
                </div>
              </div>
              <div class="paper-actions">
                <el-button type="primary" text :icon="View" @click="reviewPaper(paper.id)">
                  审核
                </el-button>
                <el-button text :icon="Download" @click="downloadPaperFile(paper.id)">
                  下载
                </el-button>
              </div>
            </div>
          </div>
          
          <div v-if="pendingPapers.length === 0" class="empty-pending">
            <el-empty description="暂无待审核论文" :image-size="80" />
          </div>
        </el-card>

        <!-- 审核进度统计 -->
        <el-card class="progress-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataLine /></el-icon>
                审核进度统计
              </span>
            </div>
          </template>
          
          <div class="progress-charts">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="chart-container">
                  <div class="chart-title">论文状态分布</div>
                  <div class="pie-chart">
                    <div class="chart-placeholder" v-if="reviewChartData && hasValidData(reviewChartData)">
                      <!-- ECharts饼图容器 -->
                      <div 
                        ref="statusChartRef" 
                        class="echarts-container"
                        style="width: 300px; height: 300px;"
                      ></div>
                      <!-- 状态详情 -->
                      <div class="status-details" v-if="reviewStatusDistribution.length > 0">
                        <div 
                          v-for="item in reviewStatusDistribution" 
                          :key="item.status"
                          class="status-detail-item"
                        >
                          <div class="status-info-wrapper">
                            <span 
                              class="status-color-indicator" 
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
                    <div class="chart-placeholder" v-else>
                      <!-- 无有效数据时的提示 -->
                      <div class="no-data-placeholder">
                        <div class="no-data-icon">📊</div>
                        <div class="no-data-text">暂无审核数据</div>
                        <div class="no-data-subtext">还没有审核记录</div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="chart-container">
                  <div class="chart-title">各专业审核情况</div>
                  <div class="bar-chart">
                    <div class="chart-placeholder" v-if="collegeDistribution.length > 0">
                      <div 
                        v-for="item in collegeDistribution.slice(0, 5)" 
                        :key="item.label"
                        class="bar-item"
                      >
                        <span class="bar-label">{{ item.label }}</span>
                        <el-progress 
                          :percentage="calculateCollegePercentage(item.value, collegeDistribution)" 
                          :show-text="false" 
                        />
                        <span class="bar-value">{{ item.value }}</span>
                      </div>
                    </div>
                    <div class="chart-placeholder" v-else>
                      <div class="bar-item">
                        <span class="bar-label">计算机</span>
                        <el-progress :percentage="80" :show-text="false" />
                      </div>
                      <div class="bar-item">
                        <span class="bar-label">软件工程</span>
                        <el-progress :percentage="65" :show-text="false" />
                      </div>
                      <div class="bar-item">
                        <span class="bar-label">人工智能</span>
                        <el-progress :percentage="90" :show-text="false" />
                      </div>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：学生统计和快速操作 -->
      <el-col :xs="24" :lg="8">
        <!-- 学生状态统计 -->
        <el-card class="students-card" shadow="never" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><UserFilled /></el-icon>
                学生状态
              </span>
            </div>
          </template>
          
          <div class="students-stats">
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.submitted }}</div>
                <div class="status-label">已提交</div>
              </div>
              <el-progress :percentage="(studentStats.submitted / studentStats.total) * 100" />
            </div>
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.reviewing }}</div>
                <div class="status-label">审核中</div>
              </div>
              <el-progress 
                v-if="studentStats.reviewing > 0" 
                :percentage="(studentStats.reviewing / studentStats.total) * 100" 
              />
              <div v-else class="empty-progress">无进行中审核</div>
            </div>
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.approved }}</div>
                <div class="status-label">已通过</div>
              </div>
              <el-progress :percentage="(studentStats.approved / studentStats.total) * 100" />
            </div>
            <div class="status-item">
              <div class="status-info">
                <div class="status-value">{{ studentStats.rejected }}</div>
                <div class="status-label">需修改</div>
              </div>
              <el-progress 
                v-if="studentStats.rejected > 0" 
                type="exception" 
                :percentage="(studentStats.rejected / studentStats.total) * 100" 
              />
              <div v-else class="empty-progress">无需修改论文</div>
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
              :icon="EditPen" 
              class="action-button"
              @click="goToPaperReview"
            >
              论文审核
            </el-button>
            <el-button 
              :icon="UserFilled" 
              class="action-button"
              @click="goToStudentManagement"
            >
              学生管理
            </el-button>
            <el-button 
              :icon="TrendCharts" 
              class="action-button"
              @click="goToStatistics"
            >
              数据统计
            </el-button>
            <el-button 
              :icon="Download" 
              class="action-button"
              @click="exportData"
            >
              导出数据
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
// ECharts 通过 CDN 引入，全局 window.echarts 可用

// API 接口导入
import {
  getTeacherDashboardStats,
  getPendingReviewList,
  getStudentStats,
  doReview,
  downloadPaper,
  exportTeacherData,
  getReviewStats,
  getCollegeDistribution
} from '@/api/teacher.js'

import {
  getMessageList,
  markAsRead
} from '@/api/user.js'

// 图标引入
import {
  EditPen, Refresh, UserFilled, Clock, Check, TrendCharts,
  Document, More, User, Files, View, Download, DataLine,
  Operation, Histogram
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const stats = ref({})
const pendingPapers = ref([])
const studentStats = ref({})
const reviewStatusDistribution = ref([])
const reviewChartData = ref(null) // 新增：存储图表数据
const collegeDistribution = ref([])
const recentActivities = ref([])
const loading = ref(false)

// 图表引用
const statusChartRef = ref(null)
let statusChartInstance = null

// 方法
const refreshData = async () => {
  try {
    loading.value = true
    await loadDashboardData()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

const loadDashboardData = async () => {
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) {
      throw new Error('未获取到教师信息')
    }

    // 并行请求多个接口
    const [dashboardRes, pendingRes, studentRes, reviewStatsRes, collegeDistRes, messageRes] = await Promise.all([
      getTeacherDashboardStats(teacherId),
      getPendingReviewList(),
      getStudentStats(teacherId),
      getReviewStats(teacherId, 'all'), // 获取所有历史数据
      getCollegeDistribution(teacherId, 'month'),
      getMessageList({ userId: teacherId, pageNum: 1, pageSize: 5 })
    ])

    // 处理仪表盘统计数据
    if (dashboardRes.code === 200) {
      stats.value = {
        studentCount: dashboardRes.data.totalStudents || 0,
        pendingCount: dashboardRes.data.pendingPapers || 0,
        reviewedCount: dashboardRes.data.reviewedPapers || 0,
        passRate: dashboardRes.data.passRate || 0
      }
    }

    // 处理待审核论文列表
    if (pendingRes.code === 200) {
      pendingPapers.value = (pendingRes.data?.records || pendingRes.data || []).map(item => ({
        id: item.paperBaseInfo?.paperId || item.paperId || item.id,
        title: item.paperBaseInfo?.paperTitle || item.paperTitle || item.title,
        studentName: item.paperBaseInfo?.studentName || item.studentName,
        submitTime: item.taskBaseInfo?.checkEndTime || item.submitTime,
        version: item.version || 1
      }))
    }

    // 处理学生状态统计
    if (studentRes.code === 200) {
      studentStats.value = {
        total: studentRes.data.totalStudents || 0,
        submitted: studentRes.data.submittedPapers || 0,
        reviewing: studentRes.data.auditingPapers || 0,
        approved: studentRes.data.passedPapers || 0,
        rejected: studentRes.data.needModifyPapers || 0
      }
    }

    // 处理审核统计数据（用于论文状态分布图表）
    if (reviewStatsRes.code === 200) {
      // 存储原始数据用于详情显示
      if (reviewStatsRes.data.chartData) {
        reviewStatusDistribution.value = reviewStatsRes.data.chartData.labels.map((label, index) => ({
          status: index === 0 ? '3' : '4', // 0=通过, 1=拒绝
          statusName: label,
          count: reviewStatsRes.data.chartData.values[index],
          percentage: reviewStatsRes.data.chartData.values[index] > 0 ? 
            Math.round((reviewStatsRes.data.chartData.values[index] / 
              reviewStatsRes.data.chartData.values.reduce((a, b) => a + b, 0)) * 100) : 0,
          color: reviewStatsRes.data.chartData.colors[index]
        }))
      }
      
      // 存储图表数据
      reviewChartData.value = reviewStatsRes.data.chartData || null
      console.log('审核统计图表数据:', reviewStatsRes.data.chartData)
      
      // 初始化或更新图表
      setTimeout(() => {
        if (reviewChartData.value) {
          if (statusChartInstance) {
            updateStatusChart()
          } else {
            initStatusChart()
          }
        }
      }, 100)
    }

    // 处理学院分布数据（用于各专业审核情况图表）
    if (collegeDistRes.code === 200) {
      collegeDistribution.value = collegeDistRes.data || []
    }

    // 处理近期活动（从消息中提取）
    if (messageRes.code === 200) {
      recentActivities.value = (messageRes.data?.records || []).slice(0, 3).map(msg => ({}))
    }

  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('数据加载失败，请稍后重试')
  }
}

const goToPaperReview = () => {
  router.push('/teacher/paper-review')
}

const goToStudentManagement = () => {
  router.push({
    name: 'StudentList'  // 使用路由名称而不是路径
  })
}

const goToStatistics = () => {
  router.push('/teacher/data-statistics')
}

const reviewPaper = (paperId) => {
  router.push(`/teacher/paper-review?paperId=${paperId}`)
}

const downloadPaperFile = async (paperId) => {
  try {
    const response = await downloadPaper(paperId)
    // 处理文件下载逻辑
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `论文_${paperId}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('论文下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('论文下载失败')
  }
}

const exportData = async () => {
  try {
    const teacherId = userStore.userInfo?.userId
    if (!teacherId) {
      ElMessage.warning('未获取到教师信息')
      return
    }
    
    const response = await exportTeacherData({ teacherId })
    // 处理文件下载
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `教师数据统计_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('数据导出失败')
  }
}

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

// 检查图表数据是否有效（至少有一个非零值）
const hasValidData = (chartData) => {
  if (!chartData || !chartData.values || chartData.values.length === 0) return false
  return chartData.values.some(value => value > 0)
}

// 窗口大小改变时重绘图表
const handleResize = () => {
  if (statusChartInstance) {
    statusChartInstance.resize()
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  if (statusChartInstance) {
    statusChartInstance.dispose()
    statusChartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})

// 组件挂载时添加事件监听
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 初始化状态分布图表
const initStatusChart = () => {
  if (!statusChartRef.value || !reviewChartData.value) return
  
  // 销毁现有实例
  if (statusChartInstance) {
    statusChartInstance.dispose()
  }
  
  // 创建新实例
  statusChartInstance = echarts.init(statusChartRef.value)
  
  // 配置选项
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
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
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: reviewChartData.value.labels.map((label, index) => ({
          value: reviewChartData.value.values[index],
          name: label,
          itemStyle: {
            color: reviewChartData.value.colors[index]
          }
        })).filter(item => item.value > 0) // 过滤掉值为0的数据项
      }
    ]
  }
  
  // 设置配置项
  statusChartInstance.setOption(option)
  
  // 添加点击事件
  statusChartInstance.on('click', function(params) {
    console.log('点击了:', params.name, params.value)
  })
}

// 更新图表数据
const updateStatusChart = () => {
  if (statusChartInstance && reviewChartData.value) {
    const option = {
      series: [{
        data: reviewChartData.value.labels.map((label, index) => ({
          value: reviewChartData.value.values[index],
          name: label,
          itemStyle: {
            color: reviewChartData.value.colors[index]
          }
        })).filter(item => item.value > 0) // 过滤掉值为0的数据项
      }]
    }
    statusChartInstance.setOption(option)
  }
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
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.teacher-dashboard {
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

.pending-list {
  .pending-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #f1f2f6;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }
    
    .paper-info {
      flex: 1;
      
      .paper-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
        
        .paper-title {
          margin: 0;
          color: #2c3e50;
          font-size: 1rem;
          flex: 1;
          margin-right: 1rem;
        }
      }
      
      .paper-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #7f8c8d;
        
        span {
          display: flex;
          align-items: center;
          
          .el-icon {
            margin-right: 0.25rem;
          }
        }
      }
    }
    
    .paper-actions {
      display: flex;
      gap: 0.5rem;
    }
  }
}

.empty-pending {
  padding: 2rem 0;
  text-align: center;
}

.progress-charts {
  .chart-container {
    .chart-title {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 350px;
      
      .echarts-container {
        margin-bottom: 1rem;
      }
      
      .loading-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 300px;
        
        .loading-text {
          color: #7f8c8d;
          font-size: 1rem;
        }
      }
      
      .no-data-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: #7f8c8d;
        
        .no-data-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .no-data-text {
          font-size: 1.2rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .no-data-subtext {
          font-size: 0.9rem;
        }
      }
      
      .progress-text {
        text-align: center;
        
        .progress-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .progress-label {
          font-size: 0.875rem;
          color: #7f8c8d;
        }
      }
      
      .status-details {
        margin-top: 1rem;
        width: 100%;
        
        .status-detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #f1f2f6;
          
          &:last-child {
            border-bottom: none;
          }
          
          .status-info-wrapper {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            
            .status-color-indicator {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              flex-shrink: 0;
            }
            
            .status-name {
              color: #2c3e50;
              font-size: 0.9rem;
              font-weight: 500;
            }
          }
          
          .status-metrics {
            display: flex;
            gap: 1rem;
            align-items: center;
            
            .status-count {
              color: #667eea;
              font-weight: 700;
              font-size: 1rem;
              min-width: 20px;
              text-align: right;
            }
            
            .status-percentage {
              color: #7f8c8d;
              font-size: 0.8rem;
              background-color: #f8f9fa;
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              min-width: 40px;
              text-align: center;
            }
          }
        }
      }
      
      .bar-item {
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        .bar-label {
          display: block;
          min-width: 80px;
          color: #2c3e50;
          font-size: 0.875rem;
        }
        
        .bar-value {
          min-width: 30px;
          text-align: right;
          color: #667eea;
          font-weight: 600;
          font-size: 0.875rem;
        }
      }
    }
  }
}

.students-stats {
  .status-item {
    margin-bottom: 1.5rem;
    
    .status-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      
      .status-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #2c3e50;
      }
      
      .status-label {
        color: #7f8c8d;
        font-size: 0.875rem;
      }
    }
    
    .empty-progress {
      height: 6px;
      background-color: #f5f5f5;
      border-radius: 3px;
      font-size: 0.75rem;
      color: #909399;
      text-align: center;
      line-height: 6px;
      margin-top: 4px;
    }
    
    // 确保进度条正确显示
    :deep(.el-progress) {
      .el-progress-bar {
        .el-progress-bar__outer {
          background-color: #e4e7ed;
          border-radius: 100px;
          overflow: hidden;
        }
        
        .el-progress-bar__inner {
          background-color: #667eea;
          border-radius: 100px;
          transition: width 0.3s ease;
        }
      }
      
      // 审核中状态使用警告色
      &:nth-child(2) {
        .el-progress-bar__inner {
          background-color: #e6a23c;
        }
      }
      
      // 已通过状态使用成功色
      &:nth-child(3) {
        .el-progress-bar__inner {
          background-color: #67c23a;
        }
      }
      
      // 需修改状态使用错误色
      &:nth-child(4) {
        .el-progress-bar__inner {
          background-color: #f56c6c;
        }
      }
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

.activity-item {
  .activity-content {
    .activity-title {
      font-weight: 500;
      color: #2c3e50;
    }
    
    .activity-desc {
      margin: 0.25rem 0 0 0;
      color: #7f8c8d;
      font-size: 0.875rem;
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
  
  .pending-item {
    flex-direction: column;
    align-items: flex-start !important;
    
    .paper-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 1rem;
    }
  }
  
  .progress-charts {
    .el-col {
      margin-bottom: 1rem;
    }
  }
}
</style>