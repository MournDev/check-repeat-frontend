<template>
  <div class="log-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">智能运维中心</h1>
        <p class="page-desc">系统监控、日志分析和智能预警</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshLogs">
          刷新数据
        </el-button>
        <el-button :icon="Setting" @click="showAlertConfig">
          预警设置
        </el-button>
        <el-button :icon="Download" @click="exportLogs">
          导出日志
        </el-button>
      </div>
    </div>

    <!-- 实时监控概览 -->
    <el-row :gutter="16" class="monitor-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="monitor-card" shadow="hover">
          <div class="monitor-content">
            <div class="monitor-icon bg-success">
              <el-icon><User /></el-icon>
            </div>
            <div class="monitor-info">
              <div class="monitor-value">{{ realtimeStats.onlineUsers }}</div>
              <div class="monitor-label">在线用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="monitor-card" shadow="hover">
          <div class="monitor-content">
            <div class="monitor-icon bg-warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="monitor-info">
              <div class="monitor-value">{{ realtimeStats.warningCount }}</div>
              <div class="monitor-label">警告事件</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="monitor-card" shadow="hover">
          <div class="monitor-content">
            <div class="monitor-icon bg-danger">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="monitor-info">
              <div class="monitor-value">{{ realtimeStats.errorCount }}</div>
              <div class="monitor-label">错误事件</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="monitor-card" shadow="hover">
          <div class="monitor-content">
            <div class="monitor-icon bg-info">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="monitor-info">
              <div class="monitor-value">{{ realtimeStats.systemLoad }}</div>
              <div class="monitor-label">系统负载</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 智能预警 -->
    <el-card class="alert-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Bell /></el-icon>
            智能预警
          </span>
          <el-switch 
            v-model="alertEnabled" 
            active-text="启用预警" 
            inactive-text="关闭预警"
          />
        </div>
      </template>
      
      <div class="alerts-container">
        <div 
          v-for="alert in activeAlerts" 
          :key="alert.id"
          class="alert-item"
          :class="`alert-${alert.level}`"
        >
          <div class="alert-icon">
            <el-icon v-if="alert.level === 'high'"><CircleCloseFilled /></el-icon>
            <el-icon v-else-if="alert.level === 'medium'"><WarningFilled /></el-icon>
            <el-icon v-else><InfoFilled /></el-icon>
          </div>
          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-time">{{ formatDate(alert.time) }}</div>
          </div>
          <div class="alert-actions">
            <el-button size="small" type="primary" text @click="handleProcessAlert(alert)">
              处理
            </el-button>
            <el-button size="small" text @click="dismissAlert(alert.id)">
              忽略
            </el-button>
          </div>
        </div>
        
        <div v-if="activeAlerts.length === 0" class="no-alerts">
          <el-empty description="暂无预警信息" :image-size="80" />
        </div>
      </div>
    </el-card>

    <!-- 日志分类展示 -->
    <el-tabs v-model="activeTab" class="log-tabs">
      <!-- 操作日志 -->
      <el-tab-pane label="操作日志" name="operation">
        <el-card shadow="never">
          <template #header>
            <div class="tab-header">
              <div class="header-filters">
                <el-date-picker
                  v-model="operationFilters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 240px"
                />
                <el-select 
                  v-model="operationFilters.userType" 
                  placeholder="用户类型" 
                  clearable 
                  style="width: 120px"
                >
                  <el-option label="学生" value="student"></el-option>
                  <el-option label="教师" value="teacher"></el-option>
                  <el-option label="管理员" value="admin"></el-option>
                </el-select>
                <el-select 
                  v-model="operationFilters.operationType" 
                  placeholder="操作类型" 
                  clearable 
                  style="width: 150px"
                >
                  <el-option label="登录" value="login"></el-option>
                  <el-option label="登出" value="logout"></el-option>
                  <el-option label="论文提交" value="submit_paper"></el-option>
                  <el-option label="论文审核" value="review_paper"></el-option>
                  <el-option label="分配导师" value="assign_advisor"></el-option>
                </el-select>
                <el-button type="primary" :icon="Search" @click="loadOperationLogs">
                  查询
                </el-button>
              </div>
            </div>
          </template>
          
          <el-table :data="operationLogs" style="width: 100%" v-loading="operationLoading">
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" width="120"></el-table-column>
            <el-table-column prop="userType" label="用户类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getUserTypeTag(row.userType)">
                  {{ getUserTypeName(row.userType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operation" label="操作类型" width="150">
              <template #default="{ row }">
                <el-tag>{{ getOperationName(row.operation) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target" label="操作对象" width="200"></el-table-column>
            <el-table-column prop="ipAddress" label="IP地址" width="150"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="详情" width="100">
              <template #default="{ row }">
                <el-button size="small" type="primary" text @click="viewLogDetail(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 性能监控 -->
      <el-tab-pane label="性能监控" name="performance">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>响应时间趋势</span>
              </template>
              <div class="chart-container">
                <div id="response-time-chart" style="width: 100%; height: 300px;"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span>资源使用率</span>
              </template>
              <div class="resource-stats">
                <div class="resource-item">
                  <div class="resource-label">
                    <span>CPU使用率</span>
                    <span class="resource-value">{{ resourceUsage.cpu }}%</span>
                  </div>
                  <el-progress :percentage="resourceUsage.cpu" status="success" />
                </div>
                <div class="resource-item">
                  <div class="resource-label">
                    <span>内存使用率</span>
                    <span class="resource-value">{{ resourceUsage.memory }}%</span>
                  </div>
                  <el-progress :percentage="resourceUsage.memory" status="warning" />
                </div>
                <div class="resource-item">
                  <div class="resource-label">
                    <span>磁盘使用率</span>
                    <span class="resource-value">{{ resourceUsage.disk }}%</span>
                  </div>
                  <el-progress :percentage="resourceUsage.disk" status="exception" />
                </div>
                <div class="resource-item">
                  <div class="resource-label">
                    <span>数据库连接</span>
                    <span class="resource-value">{{ resourceUsage.dbConnections }}%</span>
                  </div>
                  <el-progress :percentage="resourceUsage.dbConnections" status="info" />
                </div>

              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 安全日志 -->
      <el-tab-pane label="安全日志" name="security">
        <el-card shadow="never">
          <template #header>
            <div class="tab-header">
              <div class="header-filters">
                <el-date-picker
                  v-model="securityFilters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 240px"
                />
                <el-select 
                  v-model="securityFilters.eventType" 
                  placeholder="事件类型" 
                  clearable 
                  style="width: 150px"
                >
                  <el-option label="登录失败" value="login_failed"></el-option>
                  <el-option label="权限拒绝" value="permission_denied"></el-option>
                  <el-option label="异常访问" value="abnormal_access"></el-option>
                  <el-option label="数据修改" value="data_modified"></el-option>
                </el-select>
                <el-button type="primary" :icon="Search" @click="loadSecurityLogs">
                  查询
                </el-button>
                <el-button @click="testSecurityLogs">
                  测试加载
                </el-button>
              </div>
            </div>
          </template>
          
          <el-table :data="securityLogs" style="width: 100%" v-loading="securityLoading">
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="eventType" label="事件类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getSecurityEventTag(row.eventType)">
                  {{ getSecurityEventName(row.eventType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" width="120"></el-table-column>
            <el-table-column prop="ipAddress" label="来源IP" width="150"></el-table-column>
            <el-table-column prop="location" label="地理位置" width="150"></el-table-column>
            <el-table-column prop="riskLevel" label="风险等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getRiskLevelTag(row.riskLevel)">
                  {{ getRiskLevelName(row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="事件描述" show-overflow-tooltip></el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="日志详情"
      width="600px"
    >
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">{{ formatDate(currentLog.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentLog.userName }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">{{ getUserTypeName(currentLog.userType) }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ getOperationName(currentLog.operation) }}</el-descriptions-item>
          <el-descriptions-item label="操作对象">{{ currentLog.target }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'">
              {{ currentLog.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细信息" v-if="currentLog.details">
            {{ currentLog.details }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// ECharts 通过 CDN 引入，全局 window.echarts 可用

// 导入管理员 API
import { 
  getOperationLogs,
  exportOperationLogs,
  getLoginLogs,
  getSystemLogs,
  getSecurityLogs,
  getRealtimeStats,
  getActiveAlerts,
  handleAlert,
  getResourceUsage,
  getPerformanceData,
  getApiResponseTimes,
  getSystemOverview
} from '@/api/admin/logs'

// 图标导入
import {
  Refresh, Setting, Download, Search, User, Warning, CircleClose,
  DataLine, Bell, CircleCloseFilled, WarningFilled, InfoFilled,
  DataAnalysis
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('operation')
const operationLoading = ref(false)
const securityLoading = ref(false)
const detailDialogVisible = ref(false)
const alertEnabled = ref(true)
const currentLog = ref(null)

// 实时监控数据
const realtimeStats = ref({
  onlineUsers: 0,
  warningCount: 0,
  errorCount: 0,
  systemLoad: '正常'
})

// 活跃预警
const activeAlerts = ref([])

// 资源使用率
const resourceUsage = ref({
  cpu: 0,
  memory: 0,
  disk: 0,
  dbConnections: 0
})

// 响应时间趋势数据
const responseTimeData = ref({
  timestamps: [],
  responseTimes: []
})

// API响应时间数据
const apiResponseTimeData = ref({
  timestamps: [],
  avgResponseTimes: [],
  minResponseTimes: [],
  maxResponseTimes: []
})

// 图表实例
const chartInstance = ref(null)

// 防抖控制
let updateTimer = null

// 筛选条件
const operationFilters = reactive({
  dateRange: [],
  userType: '',
  operationType: ''
})

const securityFilters = reactive({
  dateRange: [],
  eventType: ''
})

// 日志数据
const operationLogs = ref([])
const securityLogs = ref([])

// 方法
const refreshLogs = async (showMessage = true) => {
  try {
    await Promise.all([
      loadOperationLogs(),
      loadSecurityLogs(),
      updateRealtimeStats(),
      loadActiveAlerts(),
      loadApiResponseTimes(),
      loadResourceUsage()
    ])
    if (showMessage) {
      ElMessage.success('数据已刷新')
    }
  } catch (error) {
    console.error('刷新日志失败:', error)
    if (showMessage) {
      ElMessage.error('刷新数据失败')
    }
  }
}

const showAlertConfig = () => {
  ElMessage.info('预警设置功能开发中...')
}

const exportLogs = async () => {
  try {
    ElMessage.info('正在导出日志...')
    
    const params = {
      startDate: operationFilters.dateRange?.[0],
      endDate: operationFilters.dateRange?.[1],
      userType: operationFilters.userType,
      operationType: operationFilters.operationType
    }
    
    const response = await exportOperationLogs(params)
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `operation-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('日志导出成功')
  } catch (error) {
    console.error('导出日志失败:', error)
    ElMessage.error('日志导出失败')
  }
}

const updateRealtimeStats = async () => {
  try {
    const response = await getRealtimeStats()
    if (response.code === 200) {
      realtimeStats.value = {
        onlineUsers: response.data.onlineUsers || 0,
        warningCount: response.data.warningCount || 0,
        errorCount: response.data.errorCount || 0,
        systemLoad: response.data.systemLoad || '正常'
      }
    }
  } catch (error) {
    console.error('获取实时统计失败:', error)
    ElMessage.error('获取实时统计数据失败')
  }
}

const loadOperationLogs = async () => {
  operationLoading.value = true
  try {
    const params = {
      page: 1,
      size: 10,
      startDate: operationFilters.dateRange?.[0],
      endDate: operationFilters.dateRange?.[1],
      userType: operationFilters.userType,
      operationType: operationFilters.operationType
    }
    
    const response = await getOperationLogs(params)
    if (response.code === 200) {
      operationLogs.value = response.data.records || []
    }
    operationLoading.value = false
  } catch (error) {
    console.error('加载操作日志失败:', error)
    ElMessage.error('加载操作日志失败')
    operationLoading.value = false
  }
}

const initChart = () => {
  const chartDom = document.getElementById('response-time-chart')
  console.log('图表DOM元素:', chartDom)
  console.log('DOM尺寸:', chartDom ? { width: chartDom.clientWidth, height: chartDom.clientHeight } : 'DOM未找到')
  
  if (chartDom && chartDom.clientWidth > 0 && chartDom.clientHeight > 0) {
    chartInstance.value = echarts.init(chartDom)
    console.log('图表实例创建成功:', !!chartInstance.value)
    updateChart()
  } else {
    console.log('图表容器尺寸无效，延迟重试...')
    // 如果尺寸仍为0，继续重试
    setTimeout(() => {
      initChart()
    }, 300)
  }
}

const throttledUpdateChart = () => {
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  updateTimer = setTimeout(() => {
    updateChart()
  }, 300) // 300ms节流
}

const updateChart = () => {
  console.log('updateChart 调用:', {
    chartInstance: !!chartInstance.value,
    timestampsLength: responseTimeData.value.timestamps.length,
    timestamps: responseTimeData.value.timestamps,
    responseTimes: responseTimeData.value.responseTimes
  })
  
  if (!chartInstance.value || responseTimeData.value.timestamps.length === 0) {
    console.log('图表更新被阻止：chartInstance存在=', !!chartInstance.value, ', timestamps长度=', responseTimeData.value.timestamps.length)
    return
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}ms'
    },
    xAxis: {
      type: 'category',
      data: responseTimeData.value.timestamps.map(t => `${t}`)
    },
    yAxis: {
      type: 'value',
      name: '响应时间(ms)',
      min: 0,
      axisLabel: {
        formatter: '{value}ms'
      }
    },
    series: [{
      data: responseTimeData.value.responseTimes,
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.3
      },
      lineStyle: {
        width: 2
      }
    }],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '10%'
    }
  }
  
  chartInstance.value.setOption(option)
}

const loadApiResponseTimes = async () => {
  try {
    console.log('正在调用 getApiResponseTimes 接口...')
    const response = await getApiResponseTimes({ period: '1h' })
    console.log('getApiResponseTimes 响应:', response)
    
    if (response.code === 200 && response.data) {
      // 处理响应时间数据
      apiResponseTimeData.value = {
        timestamps: response.data.timestamps || [],
        avgResponseTimes: response.data.avgResponseTime || [],
        minResponseTimes: response.data.minResponseTime || [],
        maxResponseTimes: response.data.maxResponseTime || [],
        p95ResponseTimes: response.data.p95ResponseTime || []
      }
      
      console.log('API响应时间数据设置:', apiResponseTimeData.value)
      
      // 更新图表数据 - 使用平均响应时间
      responseTimeData.value = {
        timestamps: apiResponseTimeData.value.timestamps,
        responseTimes: apiResponseTimeData.value.avgResponseTimes
      }
      
      throttledUpdateChart()
    }
  } catch (error) {
    console.error('加载API响应时间失败:', error)
  }
}

const loadResourceUsage = async () => {
  try {
    console.log('正在调用 getResourceUsage 接口...')
    const response = await getResourceUsage()
    console.log('getResourceUsage 响应:', response)
    if (response.code === 200 && response.data) {
      resourceUsage.value = {
        cpu: response.data.cpuUsage || 0,
        memory: response.data.memoryUsage || 0,
        disk: response.data.diskUsage || 0,
        dbConnections: response.data.connections || 0
      }
      console.log('资源使用率更新:', resourceUsage.value)
    }
  } catch (error) {
    console.error('加载资源使用率失败:', error)
  }
}

const loadPerformanceData = async () => {
  try {
    console.log('正在调用 getPerformanceData 接口...')
    const response = await getPerformanceData()
    console.log('getPerformanceData 响应:', response)
    if (response.code === 200 && response.data) {
      // 使用CPU使用率作为响应时间趋势的示例数据
      const cpuUsage = response.data.cpuUsage || []
      const memoryUsage = response.data.memoryUsage || []
      const diskUsage = response.data.diskUsage || []
      const dbConnections = response.data.dbConnections || []
      const timestamps = response.data.timestamps || []
      
      responseTimeData.value = {
        timestamps: timestamps,
        responseTimes: cpuUsage
      }
      
      console.log('设置responseTimeData:', responseTimeData.value)
      
      // 如果需要显示其他指标，可以存储到相应变量中
      resourceUsage.value = {
        cpu: cpuUsage.length > 0 ? cpuUsage[cpuUsage.length - 1] : 0,
        memory: memoryUsage.length > 0 ? memoryUsage[memoryUsage.length - 1] : 0,
        disk: diskUsage.length > 0 ? diskUsage[diskUsage.length - 1] : 0,
        dbConnections: dbConnections.length > 0 ? dbConnections[dbConnections.length - 1] : 0
      }
      console.log('资源使用率更新:', resourceUsage.value)
      
      // 更新图表（使用节流）
      throttledUpdateChart()
    }
  } catch (error) {
    console.error('加载性能数据失败:', error)
  }
}

const loadActiveAlerts = async () => {
  try {
    const response = await getActiveAlerts()
    if (response.code === 200) {
      activeAlerts.value = response.data || []
    }
  } catch (error) {
    console.error('加载活跃预警失败:', error)
  }
}

const testSecurityLogs = async () => {
  console.log('=== 测试安全日志加载 ===')
  await loadSecurityLogs()
  console.log('当前安全日志数据:', securityLogs.value)
}

const loadSecurityLogs = async () => {
  securityLoading.value = true
  try {
    const params = {
      page: 1,
      size: 50,
      startDate: securityFilters.dateRange?.[0],
      endDate: securityFilters.dateRange?.[1],
      eventType: securityFilters.eventType
    }
    
    console.log('安全日志请求参数:', params)
    const response = await getSecurityLogs(params)
    console.log('安全日志响应:', response)
    
    if (response.code === 200) {
      securityLogs.value = response.data.records || []
      console.log('安全日志数据:', securityLogs.value)
    } else {
      console.error('安全日志接口返回错误:', response.message)
      ElMessage.error(response.message || '加载安全日志失败')
    }
    securityLoading.value = false
  } catch (error) {
    console.error('加载安全日志失败:', error)
    ElMessage.error('加载安全日志失败')
    securityLoading.value = false
  }
}

const viewLogDetail = (log) => {
  currentLog.value = log
  detailDialogVisible.value = true
}

const handleProcessAlert = async (alert) => {
  try {
    const response = await handleAlert({
      alertId: alert.id,
      action: 'resolve',
      remark: `处理预警：${alert.title}`
    })
    
    if (response.code === 200) {
      dismissAlert(alert.id)
      ElMessage.success('预警处理完成')
    } else {
      ElMessage.error(response.message || '处理预警失败')
    }
  } catch (error) {
    console.error('处理预警失败:', error)
    ElMessage.error('处理预警失败')
  }
}

const dismissAlert = (alertId) => {
  const index = activeAlerts.value.findIndex(a => a.id === alertId)
  if (index > -1) {
    activeAlerts.value.splice(index, 1)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const getUserTypeName = (userType) => {
  const typeMap = {
    'student': '学生',
    'teacher': '教师',
    'admin': '管理员'
  }
  return typeMap[userType] || userType
}

const getUserTypeTag = (userType) => {
  const tagMap = {
    'student': 'primary',
    'teacher': 'success',
    'admin': 'warning'
  }
  return tagMap[userType] || 'info'
}

const getOperationName = (operation) => {
  const opMap = {
    'login': '登录',
    'logout': '登出',
    'submit_paper': '论文提交',
    'review_paper': '论文审核',
    'assign_advisor': '分配导师'
  }
  return opMap[operation] || operation
}

const getSecurityEventName = (eventType) => {
  const eventMap = {
    'login_success': '登录成功',
    'login_failed': '登录失败',
    'logout': '用户登出',
    'permission_denied': '权限拒绝',
    'abnormal_access': '异常访问',
    'data_modified': '数据修改',
    'password_changed': '密码修改',
    'account_locked': '账户锁定',
    'account_unlocked': '账户解锁',
    'session_expired': '会话过期'
  }
  return eventMap[eventType] || eventType
}

const getSecurityEventTag = (eventType) => {
  const tagMap = {
    'login_success': 'success',
    'login_failed': 'danger',
    'logout': 'info',
    'permission_denied': 'warning',
    'abnormal_access': 'warning',
    'data_modified': 'info',
    'password_changed': 'success',
    'account_locked': 'danger',
    'account_unlocked': 'success',
    'session_expired': 'warning'
  }
  return tagMap[eventType] || 'info'
}

const getRiskLevelName = (level) => {
  const levelMap = {
    'high': '高风险',
    'medium': '中风险',
    'low': '低风险'
  }
  return levelMap[level] || level
}

const getRiskLevelTag = (level) => {
  const tagMap = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return tagMap[level] || 'info'
}

// 生命周期
onMounted(async () => {
  try {
    await refreshLogs(false) // 首次加载不显示消息
    // 初始化图表 - 增加延迟确保DOM渲染完成
    setTimeout(() => {
      initChart()
    }, 500)
    
    // 设置定时刷新 - 降低频率到2分钟
    setInterval(async () => {
      // 无感更新各类数据
      try {
        await updateRealtimeStats()
        await loadActiveAlerts()
        await loadApiResponseTimes()
        await loadResourceUsage()
      } catch (error) {
        console.warn('定时更新数据失败:', error)
      }
    }, 120000) // 2分钟更新一次
  } catch (error) {
    console.error('初始化日志中心失败:', error)
  }
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  // 清理所有定时器
  const intervalId = setInterval(() => {}, 1000)
  for (let i = 1; i < intervalId; i++) {
    clearInterval(i)
  }
})
</script>

<style lang="scss" scoped>
.log-center {
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
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.monitor-cards {
  margin-bottom: 1.5rem;
  
  .monitor-card {
    border: none;
    border-radius: 12px;
    
    .monitor-content {
      display: flex;
      align-items: center;
      
      .monitor-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        margin-right: 1rem;
        
        &.bg-success {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        
        &.bg-warning {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        
        &.bg-danger {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        }
        
        &.bg-info {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
        }
        
        .el-icon {
          color: white;
          font-size: 1.5rem;
        }
      }
      
      .monitor-info {
        .monitor-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }
        
        .monitor-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin-top: 0.25rem;
        }
      }
    }
  }
}

.alert-card {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  
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
  
  .alerts-container {
    .alert-item {
      display: flex;
      align-items: flex-start;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 8px;
      border-left: 4px solid;
      
      &.alert-high {
        background-color: rgba(255, 107, 107, 0.1);
        border-left-color: #ff6b6b;
      }
      
      &.alert-medium {
        background-color: rgba(240, 147, 251, 0.1);
        border-left-color: #f093fb;
      }
      
      &.alert-low {
        background-color: rgba(67, 233, 123, 0.1);
        border-left-color: #43e97b;
      }
      
      .alert-icon {
        margin-right: 1rem;
        margin-top: 0.25rem;
        
        .el-icon {
          font-size: 1.25rem;
        }
      }
      
      .alert-content {
        flex: 1;
        
        .alert-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }
        
        .alert-message {
          color: #5a6c7d;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
        
        .alert-time {
          font-size: 0.875rem;
          color: #7f8c8d;
        }
      }
      
      .alert-actions {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
    }
    
    .no-alerts {
      padding: 2rem 0;
      text-align: center;
    }
  }
}

.log-tabs {
  :deep(.el-tabs__content) {
    padding: 0;
  }
  
  .tab-header {
    .header-filters {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
  }
}

.resource-stats {
  .resource-item {
    margin-bottom: 1.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .resource-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.375rem;
      
      > span:first-child {
        font-size: 0.875rem;
        color: #5a6c7d;
      }
      
      .resource-value {
        font-weight: 600;
        color: #2c3e50;
        font-size: 1rem;
      }
    }
    
    > span {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #5a6c7d;
    }
  }
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .placeholder-chart {
    text-align: center;
    color: #7f8c8d;
    
    .el-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    p {
      margin: 0;
      font-size: 1rem;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    
    .header-actions {
      width: 100%;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .monitor-cards {
    .el-col {
      margin-bottom: 0.75rem;
    }
  }
  
  .alert-card {
    .alerts-container {
      .alert-item {
        flex-direction: column;
        
        .alert-icon {
          margin-right: 0;
          margin-bottom: 0.5rem;
        }
        
        .alert-actions {
          flex-direction: row;
          justify-content: flex-end;
          margin-top: 0.5rem;
        }
      }
    }
  }
  
  .log-tabs {
    .tab-header {
      .header-filters {
        flex-direction: column;
        align-items: stretch;
        
        .el-date-editor,
        .el-select,
        .el-button {
          width: 100%;
        }
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.log-center {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  .header-content {
    .page-title { margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 600; color: #2c3e50; }
    .page-desc { margin: 0; color: #7f8c8d; font-size: 0.95rem; }
  }
}
</style>