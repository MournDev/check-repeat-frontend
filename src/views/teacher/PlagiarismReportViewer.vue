<template>
  <div class="report-viewer">
    <!-- 报告头部 -->
    <div class="report-header">
      <div class="header-main">
        <div class="paper-info">
          <h2 class="paper-title">{{ reportData.paperTitle }}</h2>
          <div class="paper-meta">
            <el-tag type="info" size="small">{{ reportData.studentName }}</el-tag>
            <el-tag type="success" size="small">{{ reportData.submitTime }}</el-tag>
            <el-tag :type="getSimilarityTagType(reportData.similarity)" size="small">
              相似度: {{ reportData.similarity }}%
            </el-tag>
          </div>
        </div>
        <div class="header-actions">
          <el-button-group>
            <el-button type="primary" :icon="Download" @click="downloadReport">
              下载报告
            </el-button>
            <el-button :icon="Share" @click="shareReport">
              分享
            </el-button>
            <el-button :icon="Printer" @click="printReport">
              打印
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <!-- 相似度概览 -->
      <div class="similarity-overview">
        <div class="similarity-meter">
          <div class="meter-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e6e8eb" stroke-width="8"/>
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                fill="none" 
                stroke="url(#gradient)" 
                stroke-width="8"
                :stroke-dasharray="`${calculateStrokeDash(reportData.similarity)} 339`"
                stroke-linecap="round"
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" :stop-color="getSimilarityColor(reportData.similarity)" />
                  <stop offset="100%" :stop-color="getSimilarityColor(reportData.similarity)" />
                </linearGradient>
              </defs>
            </svg>
            <div class="meter-center">
              <div class="similarity-percent" :class="getSimilarityClass(reportData.similarity)">
                {{ reportData.similarity }}%
              </div>
              <div class="similarity-label">{{ getSimilarityLevel(reportData.similarity) }}</div>
            </div>
          </div>
        </div>
        
        <div class="similarity-details">
          <div class="detail-item">
            <div class="detail-label">检测时间</div>
            <div class="detail-value">{{ reportData.checkTime }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">检测范围</div>
            <div class="detail-value">{{ reportData.checkScope }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">引用文献</div>
            <div class="detail-value">{{ reportData.citations }} 篇</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">网络资源</div>
            <div class="detail-value">{{ reportData.webSources }} 处</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 报告内容 -->
    <div class="report-content">
      <el-tabs v-model="activeTab" class="report-tabs">
        <!-- 总体分析 -->
        <el-tab-pane label="总体分析" name="overview">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="analysis-card">
                  <template #header>
                    <div class="card-header">
                      <el-icon><PieChart /></el-icon>
                      <span>相似度分布</span>
                    </div>
                  </template>
                  <div class="chart-container">
                    <div class="distribution-bars">
                      <div class="bar-item">
                        <div class="bar-label">原创内容</div>
                        <div class="bar-track">
                          <div 
                            class="bar-fill" 
                            :style="{ width: `${100 - reportData.similarity}%`, backgroundColor: '#67c23a' }"
                          ></div>
                        </div>
                        <div class="bar-percent">{{ 100 - reportData.similarity }}%</div>
                      </div>
                      <div class="bar-item">
                        <div class="bar-label">相似内容</div>
                        <div class="bar-track">
                          <div 
                            class="bar-fill" 
                            :style="{ width: `${reportData.similarity}%`, backgroundColor: '#f56c6c' }"
                          ></div>
                        </div>
                        <div class="bar-percent">{{ reportData.similarity }}%</div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="analysis-card">
                  <template #header>
                    <div class="card-header">
                      <el-icon><DataAnalysis /></el-icon>
                      <span>详细统计</span>
                    </div>
                  </template>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <div class="stat-value">{{ reportData.totalWords }}</div>
                      <div class="stat-label">总字数</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ reportData.similarWords }}</div>
                      <div class="stat-label">相似字数</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ reportData.uniqueSentences }}</div>
                      <div class="stat-label">独特句段</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ reportData.similarSources }}</div>
                      <div class="stat-label">相似来源</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        
        <!-- 相似来源 -->
        <el-tab-pane label="相似来源" name="sources">
          <div class="tab-content">
            <el-table 
              :data="similarSources" 
              class="sources-table"
              row-key="id"
              default-expand-all
            >
              <el-table-column prop="source" label="相似来源" min-width="300">
                <template #default="{ row }">
                  <div class="source-info">
                    <div class="source-title">{{ row.title }}</div>
                    <div class="source-meta">
                      <el-tag size="small" :type="getSourceTypeTag(row.type)">
                        {{ getSourceTypeName(row.type) }}
                      </el-tag>
                      <span class="source-author" v-if="row.author">作者: {{ row.author }}</span>
                      <span class="source-year" v-if="row.year">({{ row.year }})</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="similarity" label="相似度" width="120">
                <template #default="{ row }">
                  <div class="source-similarity">
                    <el-progress 
                      :percentage="row.similarity" 
                      :stroke-width="6"
                      :color="getSimilarityColor(row.similarity)"
                      :show-text="false"
                    />
                    <span class="similarity-text">{{ row.similarity }}%</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="matchedWords" label="匹配字数" width="100">
                <template #default="{ row }">
                  <span class="matched-count">{{ row.matchedWords }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="viewSourceDetail(row)">
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <!-- 详细对比 -->
        <el-tab-pane label="详细对比" name="comparison">
          <div class="tab-content">
            <div class="comparison-container">
              <div class="comparison-header">
                <el-select v-model="selectedSource" placeholder="选择对比来源" style="width: 300px">
                  <el-option 
                    v-for="source in similarSources" 
                    :key="source.id"
                    :label="source.title"
                    :value="source.id"
                  />
                </el-select>
                <el-button type="primary" @click="compareWithSource">开始对比</el-button>
              </div>
              
              <div class="comparison-content" v-if="comparisonData">
                <div class="side-by-side-comparison">
                  <div class="comparison-panel">
                    <div class="panel-header">
                      <h4>原文内容</h4>
                    </div>
                    <div class="panel-content">
                      <div 
                        v-for="(segment, index) in comparisonData.originalSegments" 
                        :key="index"
                        class="text-segment"
                        :class="{ 'highlight': segment.isSimilar }"
                      >
                        {{ segment.text }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="comparison-panel">
                    <div class="panel-header">
                      <h4>相似内容 ({{ selectedSourceTitle }})</h4>
                    </div>
                    <div class="panel-content">
                      <div 
                        v-for="(segment, index) in comparisonData.sourceSegments" 
                        :key="index"
                        class="text-segment"
                        :class="{ 'highlight': segment.isSimilar }"
                      >
                        {{ segment.text }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 建议与意见 -->
        <el-tab-pane label="建议与意见" name="suggestions">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="suggestion-card">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Lightning /></el-icon>
                      <span>修改建议</span>
                    </div>
                  </template>
                  <div class="suggestions-list">
                    <div 
                      v-for="(suggestion, index) in suggestions" 
                      :key="index"
                      class="suggestion-item"
                      :class="`priority-${suggestion.priority}`"
                    >
                      <div class="suggestion-header">
                        <el-tag :type="getPriorityTag(suggestion.priority)" size="small">
                          {{ getPriorityLabel(suggestion.priority) }}
                        </el-tag>
                        <span class="suggestion-location">{{ suggestion.location }}</span>
                      </div>
                      <div class="suggestion-content">
                        <div class="suggestion-desc">{{ suggestion.description }}</div>
                        <div class="suggestion-action">{{ suggestion.suggestedAction }}</div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="summary-card">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Document /></el-icon>
                      <span>报告总结</span>
                    </div>
                  </template>
                  <div class="summary-content">
                    <div class="summary-item">
                      <div class="summary-label">整体评价</div>
                      <div class="summary-value">{{ overallEvaluation }}</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-label">风险等级</div>
                      <el-tag :type="getRiskLevelTag(reportData.similarity)" size="small">
                        {{ getRiskLevel(reportData.similarity) }}
                      </el-tag>
                    </div>
                    <div class="summary-item">
                      <div class="summary-label">修改建议</div>
                      <div class="summary-value">{{ suggestions.length }} 条</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-label">预计修改时间</div>
                      <div class="summary-value">{{ estimatedRevisionTime }}</div>
                    </div>
                  </div>
                </el-card>
                
                <el-card class="actions-card" style="margin-top: 20px;">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Tools /></el-icon>
                      <span>快速操作</span>
                    </div>
                  </template>
                  <div class="quick-actions">
                    <el-button type="primary" @click="approvePaper" style="width: 100%; margin-bottom: 10px;">
                      通过审核
                    </el-button>
                    <el-button type="warning" @click="requestRevision" style="width: 100%; margin-bottom: 10px;">
                      要求修改
                    </el-button>
                    <el-button @click="contactStudent" style="width: 100%;">
                      联系学生
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <el-spinner size="large" />
        <p>正在加载查重报告...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Download, Share, Printer, PieChart, DataAnalysis, 
  Lightning, Document, Tools
} from '@element-plus/icons-vue'

const props = defineProps({
  paperId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'approve', 'revision'])

// 数据状态
const loading = ref(false)
const activeTab = ref('overview')
const selectedSource = ref('')
const comparisonData = ref(null)
const reportData = ref({
  paperTitle: '',
  studentName: '',
  submitTime: '',
  similarity: 0,
  checkTime: '',
  checkScope: '全网数据库',
  citations: 0,
  webSources: 0,
  totalWords: 0,
  similarWords: 0,
  uniqueSentences: 0,
  similarSources: 0
})

const similarSources = ref([])
const suggestions = ref([])

// 计算属性
const selectedSourceTitle = computed(() => {
  const source = similarSources.value.find(s => s.id === selectedSource.value)
  return source ? source.title : ''
})

const overallEvaluation = computed(() => {
  if (reportData.value.similarity <= 15) return '优秀 - 原创性很高'
  if (reportData.value.similarity <= 30) return '良好 - 基本符合要求'
  return '需要修改 - 相似度过高'
})

const estimatedRevisionTime = computed(() => {
  if (reportData.value.similarity <= 15) return '1-2天'
  if (reportData.value.similarity <= 30) return '3-5天'
  return '1-2周'
})

// 方法
const calculateStrokeDash = (percent) => {
  return (percent / 100) * 339
}

const getSimilarityColor = (similarity) => {
  if (similarity <= 15) return '#67c23a'
  if (similarity <= 30) return '#e6a23c'
  return '#f56c6c'
}

const getSimilarityClass = (similarity) => {
  if (similarity <= 15) return 'similarity-low'
  if (similarity <= 30) return 'similarity-medium'
  return 'similarity-high'
}

const getSimilarityTagType = (similarity) => {
  if (similarity <= 15) return 'success'
  if (similarity <= 30) return 'warning'
  return 'danger'
}

const getSimilarityLevel = (similarity) => {
  if (similarity <= 15) return '低风险'
  if (similarity <= 30) return '中风险'
  return '高风险'
}

const getSourceTypeTag = (type) => {
  const tagMap = {
    'academic': 'primary',
    'web': 'success',
    'book': 'warning',
    'thesis': 'info'
  }
  return tagMap[type] || 'default'
}

const getSourceTypeName = (type) => {
  const nameMap = {
    'academic': '学术期刊',
    'web': '网络资源',
    'book': '图书著作',
    'thesis': '学位论文'
  }
  return nameMap[type] || '其他'
}

const getPriorityTag = (priority) => {
  const tagMap = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return tagMap[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const labelMap = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级'
  }
  return labelMap[priority] || '一般'
}

const getRiskLevelTag = (similarity) => {
  if (similarity <= 15) return 'success'
  if (similarity <= 30) return 'warning'
  return 'danger'
}

const getRiskLevel = (similarity) => {
  if (similarity <= 15) return '低风险'
  if (similarity <= 30) return '中等风险'
  return '高风险'
}

const downloadReport = () => {
  ElMessage.success('开始下载查重报告')
  // 实现下载逻辑
}

const shareReport = () => {
  ElMessage.success('分享链接已复制到剪贴板')
  // 实现分享逻辑
}

const printReport = () => {
  window.print()
}

const viewSourceDetail = (source) => {
  ElMessage.info(`查看来源详情: ${source.title}`)
  // 实现查看详情逻辑
}

const compareWithSource = () => {
  if (!selectedSource.value) {
    ElMessage.warning('请选择要对比的来源')
    return
  }
  
  loading.value = true
  setTimeout(() => {
    comparisonData.value = {
      originalSegments: [
        { text: '这是一个示例段落，用于演示文本对比功能...', isSimilar: false },
        { text: '这部分内容与某个学术论文存在高度相似...', isSimilar: true },
        { text: '这是另一段原创内容，不与其他文献重复...', isSimilar: false }
      ],
      sourceSegments: [
        { text: '这是原始学术论文中的对应段落内容...', isSimilar: false },
        { text: '这部分内容与某个学术论文存在高度相似...', isSimilar: true },
        { text: '这里是该论文的后续内容描述...', isSimilar: false }
      ]
    }
    loading.value = false
    ElMessage.success('对比分析完成')
  }, 1500)
}

const approvePaper = () => {
  ElMessageBox.confirm('确定要通过这篇论文的审核吗？', '审核通过', {
    type: 'success',
    confirmButtonText: '确认通过',
    cancelButtonText: '取消'
  }).then(() => {
    emit('approve', props.paperId)
    ElMessage.success('论文审核已通过')
  })
}

const requestRevision = () => {
  ElMessageBox.prompt('请输入修改建议', '要求修改', {
    inputType: 'textarea',
    inputPlaceholder: '请详细说明需要修改的地方...',
    confirmButtonText: '发送修改要求',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    if (value) {
      emit('revision', { paperId: props.paperId, suggestion: value })
      ElMessage.success('修改要求已发送给学生')
    }
  })
}

const contactStudent = () => {
  ElMessageBox.prompt('请输入联系内容', '联系学生', {
    inputType: 'textarea',
    inputPlaceholder: '请输入要传达给学生的信息...',
    confirmButtonText: '发送',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    if (value) {
      ElMessage.success('消息已发送')
    }
  })
}

// 初始化数据
const loadReportData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    setTimeout(() => {
      reportData.value = {
        paperTitle: '基于深度学习的图像识别技术研究',
        studentName: '张三',
        submitTime: '2024-01-15 14:30',
        similarity: 23,
        checkTime: '2024-01-15 15:45',
        checkScope: '中国知网、万方数据、维普资讯',
        citations: 12,
        webSources: 8,
        totalWords: 15680,
        similarWords: 3607,
        uniqueSentences: 89,
        similarSources: 5
      }
      
      similarSources.value = [
        {
          id: '1',
          title: '深度学习在图像识别中的应用研究',
          author: '李四',
          year: '2023',
          type: 'academic',
          similarity: 45,
          matchedWords: 1623
        },
        {
          id: '2',
          title: '卷积神经网络图像分类算法优化',
          author: '王五',
          year: '2022',
          type: 'thesis',
          similarity: 32,
          matchedWords: 1156
        },
        {
          id: '3',
          title: '机器学习图像处理技术综述',
          author: '赵六',
          year: '2023',
          type: 'web',
          similarity: 28,
          matchedWords: 892
        }
      ]
      
      suggestions.value = [
        {
          priority: 'high',
          location: '第3章 第2节',
          description: '关于CNN网络结构的描述与已有文献高度相似',
          suggestedAction: '建议重新组织语言表达，增加原创性分析'
        },
        {
          priority: 'medium',
          location: '第4章 实验部分',
          description: '实验参数设置描述过于简单',
          suggestedAction: '补充详细的实验参数和设置说明'
        },
        {
          priority: 'low',
          location: '参考文献部分',
          description: '缺少最近两年的相关文献引用',
          suggestedAction: '建议补充最新的研究成果引用'
        }
      ]
      
      loading.value = false
    }, 1000)
  } catch (error) {
    console.error('加载报告数据失败:', error)
    ElMessage.error('加载报告数据失败')
    loading.value = false
  }
}

onMounted(() => {
  loadReportData()
})
</script>

<style scoped>
.report-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 报告头部 */
.report-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 8px 8px 0 0;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.paper-info h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
}

.paper-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions .el-button-group {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 相似度概览 */
.similarity-overview {
  display: flex;
  gap: 32px;
  align-items: center;
}

.meter-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.meter-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.similarity-percent {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.similarity-label {
  font-size: 14px;
  opacity: 0.9;
}

.similarity-details {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.detail-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
}

/* 报告内容 */
.report-content {
  flex: 1;
  background: white;
  padding: 24px;
  overflow-y: auto;
}

.report-tabs {
  height: 100%;
}

.tab-content {
  padding: 20px 0;
}

/* 卡片样式 */
.analysis-card, .suggestion-card, .summary-card, .actions-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* 图表容器 */
.chart-container {
  padding: 16px 0;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 80px;
  font-size: 14px;
}

.bar-track {
  flex: 1;
  height: 24px;
  background: #e6e8eb;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.bar-percent {
  width: 50px;
  text-align: right;
  font-weight: 600;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 来源表格 */
.sources-table {
  width: 100%;
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-title {
  font-weight: 600;
  color: #303133;
}

.source-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.source-similarity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.similarity-text {
  width: 40px;
  font-weight: 600;
}

.matched-count {
  font-weight: 600;
  color: #f56c6c;
}

/* 对比容器 */
.comparison-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.comparison-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.side-by-side-comparison {
  display: flex;
  gap: 20px;
  flex: 1;
}

.comparison-panel {
  flex: 1;
  border: 1px solid #e6e8eb;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  background: #f5f7fa;
  padding: 16px;
  border-bottom: 1px solid #e6e8eb;
}

.panel-header h4 {
  margin: 0;
  color: #303133;
}

.panel-content {
  padding: 16px;
  height: 400px;
  overflow-y: auto;
}

.text-segment {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 4px;
  line-height: 1.6;
}

.text-segment.highlight {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

/* 建议列表 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.suggestion-item.priority-high {
  background: #fef0f0;
  border-color: #f56c6c;
}

.suggestion-item.priority-medium {
  background: #fdf6ec;
  border-color: #e6a23c;
}

.suggestion-item.priority-low {
  background: #f0f9eb;
  border-color: #67c23a;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.suggestion-location {
  font-size: 12px;
  color: #909399;
}

.suggestion-content {
  margin-left: 4px;
}

.suggestion-desc {
  margin-bottom: 8px;
  color: #303133;
}

.suggestion-action {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

/* 总结卡片 */
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.summary-value {
  font-weight: 600;
  color: #303133;
}

/* 快速操作 */
.quick-actions .el-button {
  transition: all 0.3s ease;
}

.quick-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: #606266;
}

.loading-content p {
  margin-top: 16px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .report-header {
    padding: 16px;
  }
  
  .header-main {
    flex-direction: column;
    gap: 16px;
  }
  
  .similarity-overview {
    flex-direction: column;
    gap: 20px;
  }
  
  .similarity-details {
    grid-template-columns: 1fr;
  }
  
  .report-content {
    padding: 16px;
  }
  
  .side-by-side-comparison {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>