<template>
  <div class="check-history-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-title">查重历史记录</span>
        </template>
        <template #extra>
          <div class="header-actions">
            <el-button :icon="Refresh" @click="refreshHistory">刷新</el-button>
          </div>
        </template>
      </el-page-header>
    </div>

    <!-- 论文信息 -->
    <el-card class="paper-info-card" shadow="never">
      <div class="paper-header">
        <div class="paper-title">{{ paperInfo.title }}</div>
        <div class="paper-stats">
          <span>当前相似度: <strong :class="getCurrentSimilarityClass(paperInfo.currentSimilarity)">{{ paperInfo.currentSimilarity }}%</strong></span>
          <span>历史最低: <strong class="lowest">{{ paperInfo.lowestSimilarity }}%</strong></span>
          <span>版本数: <strong>{{ paperInfo.versionCount }}</strong></span>
        </div>
      </div>
    </el-card>

    <!-- 相似度趋势图 -->
    <el-card class="trend-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><DataLine /></el-icon>
          <span>相似度趋势</span>
          <div class="trend-controls">
            <el-radio-group v-model="trendPeriod" size="small" @change="loadTrendData">
              <el-radio-button label="7">近7天</el-radio-button>
              <el-radio-button label="30">近30天</el-radio-button>
              <el-radio-button label="90">近90天</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      
      <div class="trend-chart-container">
        <div class="chart-wrapper">
          <canvas ref="trendChart" width="800" height="400"></canvas>
        </div>
        <div class="trend-summary">
          <div class="summary-item">
            <div class="summary-label">总体趋势</div>
            <div class="summary-value" :class="trendAnalysis.direction">
              {{ getTrendText(trendAnalysis.direction) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">总改进幅度</div>
            <div class="summary-value improvement">
              ↓{{ Math.abs(trendAnalysis.totalImprovement) }}%
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">平均每版改进</div>
            <div class="summary-value">
              {{ trendAnalysis.averageImprovementPerVersion > 0 ? '+' : '' }}{{ trendAnalysis.averageImprovementPerVersion.toFixed(1) }}%
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">最佳版本</div>
            <div class="summary-value best">
              V{{ trendAnalysis.bestVersion }}
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 版本历史时间轴 -->
    <el-card class="history-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Timer /></el-icon>
          <span>版本历史</span>
          <el-button text @click="toggleCompactView">
            {{ compactView ? '展开详情' : '紧凑显示' }}
          </el-button>
        </div>
      </template>
      
      <div class="timeline-container">
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in historyRecords"
            :key="record.version"
            :timestamp="formatDateTime(record.checkTime)"
            :type="getTimelineType(record.rating)"
            :hollow="index !== 0"
            placement="top"
          >
            <div class="history-record" :class="{ 'current-version': record.isCurrent }">
              <div class="record-header">
                <div class="version-info">
                  <el-tag 
                    :type="record.isCurrent ? 'primary' : 'info'" 
                    size="large"
                    effect="dark"
                  >
                    V{{ record.version }}
                  </el-tag>
                  <span class="similarity-badge" :class="getSimilarityClass(record.similarity)">
                    {{ record.similarity }}%
                  </span>
                  <el-tag :type="getRatingType(record.rating)" size="small">
                    {{ getRatingText(record.rating) }}
                  </el-tag>
                </div>
                <div class="record-actions" v-if="!compactView">
                  <el-button 
                    text 
                    size="small" 
                    @click="viewReport(record.reportId)"
                  >
                    查看报告
                  </el-button>
                  <el-button 
                    text 
                    size="small" 
                    @click="compareWithCurrent(record.version)"
                    v-if="!record.isCurrent"
                  >
                    对比当前
                  </el-button>
                </div>
              </div>
              
              <div class="record-content" v-if="!compactView">
                <div class="changes-description">
                  <el-icon><EditPen /></el-icon>
                  <span>{{ record.changes }}</span>
                </div>
                
                <div class="improvement-info" v-if="record.improvementFromPrevious !== undefined">
                  <div class="improvement-badge" :class="getImprovementClass(record.improvementFromPrevious)">
                    {{ record.improvementFromPrevious > 0 ? '+' : '' }}{{ record.improvementFromPrevious.toFixed(1) }}%
                  </div>
                  <span>相比上一版本</span>
                </div>
                
                <div class="section-changes" v-if="record.sectionChanges">
                  <div class="section-change" v-for="(change, section) in record.sectionChanges" :key="section">
                    <span class="section-name">{{ getSectionName(section) }}:</span>
                    <span class="change-value" :class="getChangeClass(change.change)">
                      {{ change.to }}% ({{ change.change > 0 ? '+' : '' }}{{ change.change.toFixed(1) }}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>

    <!-- 版本对比面板 -->
    <el-drawer
      v-model="showCompareDrawer"
      title="版本对比分析"
      direction="rtl"
      size="60%"
    >
      <div class="compare-content" v-if="compareData">
        <div class="compare-header">
          <div class="version-tags">
            <el-tag type="info">V{{ compareData.fromVersion }}</el-tag>
            <span class="vs">VS</span>
            <el-tag type="primary">V{{ compareData.toVersion }}</el-tag>
          </div>
          <div class="overall-change" :class="getImprovementClass(compareData.overallChange)">
            总体变化: {{ compareData.overallChange > 0 ? '+' : '' }}{{ compareData.overallChange.toFixed(1) }}%
          </div>
        </div>
        
        <div class="compare-sections">
          <el-card 
            v-for="section in compareData.sectionComparison" 
            :key="section.name"
            class="section-compare-card"
            shadow="hover"
          >
            <template #header>
              <div class="section-header">
                <span>{{ section.name }}</span>
                <el-tag :type="getChangeTagType(section.change)" size="small">
                  {{ section.change > 0 ? '+' : '' }}{{ section.change.toFixed(1) }}%
                </el-tag>
              </div>
            </template>
            
            <div class="section-details">
              <div class="similarity-compare">
                <div class="similarity-item">
                  <div class="version-label">V{{ compareData.fromVersion }}</div>
                  <el-progress 
                    :percentage="section.from" 
                    :stroke-width="8"
                    :color="getSimilarityColor(section.from)"
                    :show-text="false"
                  />
                  <span class="similarity-value">{{ section.from }}%</span>
                </div>
                <div class="similarity-item">
                  <div class="version-label">V{{ compareData.toVersion }}</div>
                  <el-progress 
                    :percentage="section.to" 
                    :stroke-width="8"
                    :color="getSimilarityColor(section.to)"
                    :show-text="false"
                  />
                  <span class="similarity-value">{{ section.to }}%</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-drawer>

    <!-- 统计分析卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: '#67c23a' }">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.improvementRate }}%</div>
              <div class="stat-label">改进效率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: '#409eff' }">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.averageSimilarity }}%</div>
              <div class="stat-label">平均相似度</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: '#e6a23c' }">
              <el-icon><Lightning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.improvementSpeed }}</div>
              <div class="stat-label">改进速度</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Refresh, DataLine, Timer, EditPen, TrendCharts, 
  DataAnalysis, Lightning, ArrowRight
} from '@element-plus/icons-vue'
// ECharts 通过 CDN 引入，全局 window.echarts 可用

import { getCheckHistory, getSimilarityTrend, comparePaperVersions } from '@/api/student'

const route = useRoute()
const router = useRouter()

// 响应式数据
const paperInfo = ref({
  title: '',
  currentSimilarity: 0,
  lowestSimilarity: 0,
  versionCount: 0
})

const trendPeriod = ref('30')
const compactView = ref(false)
const showCompareDrawer = ref(false)
const trendChart = ref(null)
const chartInstance = ref(null)

const historyRecords = ref([])

const trendAnalysis = ref({
  direction: 'decreasing',
  totalImprovement: -27.1,
  averageImprovementPerVersion: -13.55,
  bestVersion: 3
})

const compareData = ref(null)
const stats = ref({
  improvementRate: 0,
  averageSimilarity: 0,
  improvementSpeed: ''
})

// 计算属性
const getCurrentSimilarityClass = computed(() => (similarity) => {
  if (similarity < 20) return 'excellent'
  if (similarity < 40) return 'good'
  return 'warning'
})

// 方法
const goBack = () => {
  router.back()
}

const refreshHistory = async () => {
  const paperId = route.params.paperId
  
  // 参数验证
  if (!paperId || paperId === 'undefined') {
    ElMessage.error('缺少论文ID参数')
    return
  }
  
  try {
    const res = await getCheckHistory(paperId)
    if (res.code === 200) {
      // 处理历史记录数据
      historyRecords.value = res.data.history || []
      
      // 处理趋势分析数据
      trendAnalysis.value = res.data.trendAnalysis || {
        direction: 'decreasing',
        totalImprovement: 0,
        averageImprovementPerVersion: 0,
        bestVersion: 1
      }
      
      // 处理论文信息
      paperInfo.value = {
        title: res.data.paperInfo?.title || '',
        currentSimilarity: res.data.paperInfo?.currentSimilarity || 0,
        lowestSimilarity: res.data.paperInfo?.lowestSimilarity || 0,
        versionCount: res.data.paperInfo?.versionCount || 0
      }
      
      // 处理统计数据
      stats.value = {
        improvementRate: res.data.statistics?.improvementRate || 0,
        averageSimilarity: res.data.statistics?.averageSimilarity || 0,
        improvementSpeed: res.data.statistics?.improvementSpeed || ''
      }
      
      ElMessage.success('历史记录已刷新')
    } else {
      ElMessage.error(res.message || '获取历史记录失败')
    }
  } catch (error) {
    console.error('刷新历史记录失败:', error)
    ElMessage.error('刷新失败: ' + (error.message || '网络错误'))
  }
}

const loadTrendData = async () => {
  const paperId = route.params.paperId
  
  // 参数验证
  if (!paperId || paperId === 'undefined') {
    return
  }
  
  try {
    const res = await getSimilarityTrend(paperId, trendPeriod.value)
    if (res.code === 200) {
      renderTrendChart(res.data)
    } else {
      ElMessage.error(res.message || '获取趋势数据失败')
    }
  } catch (error) {
    console.error('加载趋势数据失败:', error)
    ElMessage.error('加载趋势数据失败: ' + (error.message || '网络错误'))
  }
}

const renderTrendChart = (data) => {
  nextTick(() => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
    
    if (!trendChart.value) return
    
    // 初始化 ECharts 实例
    chartInstance.value = echarts.init(trendChart.value)
    
    // 配置选项
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        textStyle: {
          color: '#fff',
          fontSize: 13
        },
        formatter: function(params) {
          const param = params[0]
          return `${param.name}<br/>相似度: ${param.value}%`
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.dates,
        axisLine: {
          lineStyle: {
            color: '#e4e7ed'
          }
        },
        axisLabel: {
          color: '#606266'
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: {
          show: false
        },
        axisLabel: {
          color: '#606266',
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      series: [{
        name: '相似度',
        type: 'line',
        data: data.similarities,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#409eff'
        },
        itemStyle: {
          color: '#409eff',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        }
      }]
    }
    
    // 设置配置项
    chartInstance.value.setOption(option)
    
    // 响应式调整
    window.addEventListener('resize', () => {
      chartInstance.value?.resize()
    })
  })
}

const toggleCompactView = () => {
  compactView.value = !compactView.value
}

const viewReport = (reportId) => {
  router.push(`/student/plagiarism-report/${reportId}`)
}

const compareWithCurrent = async (version) => {
  const paperId = route.params.paperId
  
  // 参数验证
  if (!paperId || paperId === 'undefined') {
    ElMessage.error('缺少论文ID参数')
    return
  }
  
  try {
    const res = await comparePaperVersions(paperId, [version, paperInfo.value.versionCount])
    
    if (res.code === 200) {
      compareData.value = {
        fromVersion: version,
        toVersion: paperInfo.value.versionCount,
        overallChange: res.data.overallChange || 0,
        sectionComparison: res.data.sectionComparison || []
      }
      showCompareDrawer.value = true
      ElMessage.success('版本对比数据加载成功')
    } else {
      ElMessage.error(res.message || '获取对比数据失败')
    }
  } catch (error) {
    console.error('版本对比失败:', error)
    ElMessage.error('版本对比失败: ' + (error.message || '网络错误'))
  }
}

const loadStatistics = async () => {
  const paperId = route.params.paperId
  
  // 参数验证
  if (!paperId || paperId === 'undefined') {
    return
  }
  
  try {
    // 如果有专门的统计接口，这里调用
    // 暂时使用查重历史接口中的统计数据
    const res = await getCheckHistory(paperId)
    if (res.code === 200 && res.data.statistics) {
      stats.value = res.data.statistics
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const getTimelineType = (rating) => {
  const typeMap = {
    excellent: 'success',
    good: 'primary',
    warning: 'warning',
    danger: 'danger'
  }
  return typeMap[rating] || 'info'
}

const getRatingType = (rating) => {
  const typeMap = {
    excellent: 'success',
    good: 'primary',
    warning: 'warning',
    danger: 'danger'
  }
  return typeMap[rating] || 'info'
}

const getRatingText = (rating) => {
  const textMap = {
    excellent: '优秀',
    good: '良好',
    warning: '一般',
    danger: '需改进'
  }
  return textMap[rating] || '未知'
}

const getSimilarityClass = (similarity) => {
  if (similarity < 20) return 'excellent'
  if (similarity < 40) return 'good'
  if (similarity < 60) return 'warning'
  return 'danger'
}

const getImprovementClass = (improvement) => {
  if (improvement < 0) return 'improved'
  if (improvement > 0) return 'regressed'
  return 'unchanged'
}

const getChangeClass = (change) => {
  if (change < 0) return 'decreased'
  if (change > 0) return 'increased'
  return 'unchanged'
}

const getChangeTagType = (change) => {
  if (change < 0) return 'success'
  if (change > 0) return 'danger'
  return 'info'
}

const getSectionName = (key) => {
  const nameMap = {
    introduction: '引言',
    literature_review: '文献综述',
    methodology: '研究方法',
    results: '实验结果',
    conclusion: '结论'
  }
  return nameMap[key] || key
}

const getTrendText = (direction) => {
  const textMap = {
    decreasing: '持续下降',
    increasing: '持续上升',
    stable: '相对稳定'
  }
  return textMap[direction] || '波动'
}

const getSimilarityColor = (similarity) => {
  if (similarity < 20) return '#67c23a'
  if (similarity < 40) return '#e6a23c'
  return '#f56c6c'
}

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

// 生命周期
onMounted(async () => {
  await refreshHistory()
  await loadTrendData()
  await loadStatistics()
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  window.removeEventListener('resize', () => {
    chartInstance.value?.resize()
  })
})
</script>

<style lang="scss" scoped>
.check-history-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .paper-info-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .paper-header {
      .paper-title {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
      }
      
      .paper-stats {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        
        span {
          color: #606266;
          
          strong {
            color: #303133;
            font-weight: 600;
            
            &.excellent { color: #67c23a; }
            &.good { color: #409eff; }
            &.warning { color: #e6a23c; }
            &.lowest { color: #67c23a; }
          }
        }
      }
    }
  }

  .trend-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
      
      .trend-controls {
        margin-left: auto;
      }
    }
    
    .trend-chart-container {
      display: flex;
      gap: 30px;
      
      .chart-wrapper {
        flex: 1;
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .trend-summary {
        width: 280px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        
        .summary-item {
          .summary-label {
            font-size: 14px;
            color: #606266;
            margin-bottom: 6px;
          }
          
          .summary-value {
            font-size: 18px;
            font-weight: 700;
            
            &.decreasing { color: #67c23a; }
            &.increasing { color: #f56c6c; }
            &.stable { color: #909399; }
            &.improvement { color: #67c23a; }
            &.best { color: #409eff; }
          }
        }
      }
    }
  }

  .history-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
    }
    
    .timeline-container {
      :deep(.el-timeline) {
        .el-timeline-item {
          .el-timeline-item__tail {
            border-left: 2px solid #e4e7ed;
          }
          
          .el-timeline-item__node {
            width: 16px;
            height: 16px;
          }
        }
      }
      
      .history-record {
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;
        border: 1px solid #e4e7ed;
        transition: all 0.3s ease;
        
        &.current-version {
          border-color: #409eff;
          background: #ecf5ff;
        }
        
        .record-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          
          .version-info {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .similarity-badge {
              padding: 4px 12px;
              border-radius: 16px;
              font-weight: 600;
              font-size: 14px;
              
              &.excellent { background: #f0f9ff; color: #67c23a; }
              &.good { background: #f0f7ff; color: #409eff; }
              &.warning { background: #fdf6ec; color: #e6a23c; }
              &.danger { background: #fef0f0; color: #f56c6c; }
            }
          }
        }
        
        .record-content {
          .changes-description {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 16px;
            color: #606266;
            line-height: 1.5;
            
            .el-icon {
              margin-top: 3px;
              color: #409eff;
            }
          }
          
          .improvement-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            
            .improvement-badge {
              padding: 4px 12px;
              border-radius: 16px;
              font-weight: 600;
              font-size: 12px;
              
              &.improved { background: #f0f9ff; color: #67c23a; }
              &.regressed { background: #fef0f0; color: #f56c6c; }
              &.unchanged { background: #f4f4f5; color: #909399; }
            }
          }
          
          .section-changes {
            .section-change {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e4e7ed;
              
              &:last-child {
                border-bottom: none;
              }
              
              .section-name {
                color: #606266;
                font-size: 14px;
              }
              
              .change-value {
                font-weight: 500;
                
                &.decreased { color: #67c23a; }
                &.increased { color: #f56c6c; }
                &.unchanged { color: #909399; }
              }
            }
          }
        }
      }
    }
  }

  .compare-content {
    .compare-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f2f5;
      
      .version-tags {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .vs {
          font-weight: 600;
          color: #606266;
        }
      }
      
      .overall-change {
        font-size: 18px;
        font-weight: 700;
        
        &.improved { color: #67c23a; }
        &.regressed { color: #f56c6c; }
        &.unchanged { color: #909399; }
      }
    }
    
    .compare-sections {
      .section-compare-card {
        margin-bottom: 20px;
        border-radius: 12px;
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #303133;
        }
        
        .similarity-compare {
          .similarity-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            
            .version-label {
              width: 60px;
              font-size: 14px;
              color: #606266;
            }
            
            .similarity-value {
              min-width: 50px;
              font-weight: 600;
              color: #303133;
            }
          }
        }
      }
    }
  }

  .stats-row {
    .stat-card {
      border-radius: 12px;
      
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          
          .el-icon {
            font-size: 24px;
          }
        }
        
        .stat-info {
          .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #303133;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 14px;
            color: #606266;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .check-history-page {
    padding: 12px;
    
    .trend-chart-container {
      flex-direction: column;
      
      .trend-summary {
        width: 100%;
        flex-direction: row;
        justify-content: space-around;
      }
    }
    
    .record-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 12px;
    }
    
    .paper-stats {
      flex-direction: column;
      gap: 12px !important;
    }
  }
}
</style>