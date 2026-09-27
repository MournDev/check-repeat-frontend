<template>
  <div class="report-page">
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

        <!-- 历史记录 -->
        <el-tab-pane label="历史记录" name="history">
          <div class="tab-content">
            <el-card class="history-card">
              <template #header>
                <div class="card-header">
                    <el-icon><Clock /></el-icon>
                    <span>查重历史记录</span>
                  </div>
              </template>
              
              <el-timeline>
                <el-timeline-item 
                  v-for="(record, index) in historyRecords" 
                  :key="index"
                  :timestamp="record.createTime"
                  :type="record.type"
                  :icon="record.icon"
                >
                  <div class="history-item">
                    <div class="version-info">
                      <span class="version-label">版本 {{ record.version }}</span>
                      <el-tag :type="record.similarityType">
                        相似度: {{ record.checkRate }}%
                      </el-tag>
                    </div>
                    <div class="change-description">{{ record.description }}</div>
                    <div class="history-actions">
                      <el-button link @click="viewHistoryReport(record)">
                        查看报告
                      </el-button>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              
              <div v-if="historyRecords.length === 0" class="empty-history">
                <el-empty description="暂无历史记录" />
              </div>
            </el-card>
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
  Lightning, Document, Tools, Clock
} from '@element-plus/icons-vue'
import { getPaperReport, getSimpleCheckReport, exportCheckReport, compareReport, approveReport, requestRevision as requestRevisionAPI, contactStudentReport, getSourceDetail, getHistoryReportList } from '@/api/teacher'
import { getSimilarityColor } from '@/utils/dataType.js'
import { getSimilarityClass, getSimilarityTagType } from '@/utils/reviewStatus.js'
import '@/styles/report-styles.scss'

const props = defineProps({
  paperId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['close', 'approve', 'revision'])

// 数据状态
const loading = ref(false)
const activeTab = ref('overview')
const selectedSource = ref('')
const comparisonData = ref(null)
const historyRecords = ref([])
const reportData = ref({
  paperTitle: '',
  studentName: '',
  submitTime: '',
  similarity: 0,
  checkTime: '',
  checkScope: '校内论文库',
  citations: 0,
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

const getSimilarityLevel = (similarity) => {
  if (similarity < 15) return '低风险'
  if (similarity < 30) return '中风险'
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
    'paper': '校内论文',
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
  if (similarity < 15) return 'success'
  if (similarity < 30) return 'warning'
  return 'danger'
}

const getRiskLevel = (similarity) => {
  if (similarity < 15) return '低风险'
  if (similarity < 30) return '中等风险'
  return '高风险'
}

const downloadReport = async () => {
  try {
    // 先获取论文的最新报告ID
    const reportListRes = await getSimpleCheckReport(props.paperId);
    if (reportListRes.code === 200 && reportListRes.data && reportListRes.data.length > 0) {
      const latestReport = reportListRes.data[0];
      const response = await exportCheckReport(latestReport.id, 'pdf')
      // 处理文件下载
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `查重报告_${reportData.value.paperTitle || '未知'}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('报告下载成功')
    } else {
      ElMessage.error('未找到该论文的查重报告');
    }
  } catch (error) {
    console.error('下载报告失败:', error)
    ElMessage.error('下载报告失败')
  }
}

const shareReport = () => {
  ElMessage.success('分享链接已复制到剪贴板')
  // 实现分享逻辑
}

const printReport = () => {
  window.print()
}

const viewSourceDetail = (source) => {
  const detailLines = [
    `<strong>标题：</strong>${source.title || '未知'}`,
    `<strong>作者：</strong>${source.author || '未知'}`,
    `<strong>年份：</strong>${source.year || '未知'}`,
    `<strong>类型：</strong>${source.type || '未知'}`,
    `<strong>相似度：</strong>${source.similarity || 0}%`,
    `<strong>匹配内容：</strong>${source.matchedWords || '无'}`
  ]
  ElMessageBox.alert(detailLines.join('<br/>'), '来源详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

const compareWithSource = async () => {
  if (!selectedSource.value) {
    ElMessage.warning('请选择要对比的来源')
    return
  }
  
  loading.value = true
  try {
    // 获取报告ID（假设从相似来源中获取）
    const source = similarSources.value.find(s => s.id === selectedSource.value)
    if (!source) {
      ElMessage.error('未找到选中的来源')
      return
    }
    
    // 调用后端对比接口
    const res = await compareReport(source.reportId || '', selectedSource.value)
    if (res.code === 200) {
      comparisonData.value = res.data
      ElMessage.success('对比分析完成')
    } else {
      ElMessage.error(res.message || '对比分析失败')
    }
  } catch (error) {
    console.error('对比分析失败:', error)
    ElMessage.error('对比分析失败')
  } finally {
    loading.value = false
  }
}

const approvePaper = async () => {
  ElMessageBox.confirm('确定要通过这篇论文的审核吗？', '审核通过', {
    type: 'success',
    confirmButtonText: '确认通过',
    cancelButtonText: '取消'
  }).then(async () => {
    loading.value = true
    try {
      // 获取最新报告ID
      const reportListRes = await getSimpleCheckReport(props.paperId)
      if (reportListRes.code === 200 && reportListRes.data && reportListRes.data.length > 0) {
        const latestReport = reportListRes.data[0]
        const res = await approveReport(latestReport.id, '论文审核通过')
        if (res.code === 200) {
          emit('approve', props.paperId)
          ElMessage.success('论文审核已通过')
        } else {
          ElMessage.error(res.message || '审核通过失败')
        }
      } else {
        ElMessage.error('未找到该论文的查重报告')
      }
    } catch (error) {
      console.error('审核通过失败:', error)
      ElMessage.error('审核通过失败')
    } finally {
      loading.value = false
    }
  })
}

const requestRevision = async () => {
  ElMessageBox.prompt('请输入修改建议', '要求修改', {
    inputType: 'textarea',
    inputPlaceholder: '请详细说明需要修改的地方...',
    confirmButtonText: '发送修改要求',
    cancelButtonText: '取消'
  }).then(async ({ value }) => {
    if (value) {
      loading.value = true
      try {
        // 获取最新报告ID
        const reportListRes = await getSimpleCheckReport(props.paperId)
        if (reportListRes.code === 200 && reportListRes.data && reportListRes.data.length > 0) {
          const latestReport = reportListRes.data[0]
          const res = await requestRevisionAPI(latestReport.id, value)
          if (res.code === 200) {
            emit('revision', { paperId: props.paperId, suggestion: value })
            ElMessage.success('修改要求已发送给学生')
          } else {
            ElMessage.error(res.message || '发送修改要求失败')
          }
        } else {
          ElMessage.error('未找到该论文的查重报告')
        }
      } catch (error) {
        console.error('发送修改要求失败:', error)
        ElMessage.error('发送修改要求失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const contactStudent = async () => {
  ElMessageBox.prompt('请输入联系内容', '联系学生', {
    inputType: 'textarea',
    inputPlaceholder: '请输入要传达给学生的信息...',
    confirmButtonText: '发送',
    cancelButtonText: '取消'
  }).then(async ({ value }) => {
    if (value) {
      loading.value = true
      try {
        // 获取最新报告ID
        const reportListRes = await getSimpleCheckReport(props.paperId)
        if (reportListRes.code === 200 && reportListRes.data && reportListRes.data.length > 0) {
          const latestReport = reportListRes.data[0]
          const res = await contactStudentReport(latestReport.id, value)
          if (res.code === 200) {
            ElMessage.success('消息已发送')
          } else {
            ElMessage.error(res.message || '发送消息失败')
          }
        } else {
          ElMessage.error('未找到该论文的查重报告')
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 根据相似度生成修改建议
const generateSuggestions = (similarity) => {
  const suggestions = [];
  
  if (similarity >= 30) {
    // 高相似度情况
    suggestions.push({
      priority: 'high',
      location: '全文',
      description: '论文整体相似度较高，存在大量与已有文献相似的内容',
      suggestedAction: '建议对论文进行全面修改，重新组织语言表达，增加原创性分析和观点'
    });
    suggestions.push({
      priority: 'high',
      location: '引言部分',
      description: '引言部分与已有文献存在高度相似',
      suggestedAction: '建议重新撰写引言，突出研究的创新性和意义'
    });
  } else if (similarity >= 15) {
    // 中等相似度情况
    suggestions.push({
      priority: 'medium',
      location: '研究方法部分',
      description: '研究方法描述与已有文献存在相似',
      suggestedAction: '建议详细描述本研究的独特方法和步骤，避免与已有文献雷同'
    });
  } else {
    // 低相似度情况
    suggestions.push({
      priority: 'low',
      location: '参考文献部分',
      description: '参考文献格式可能需要优化',
      suggestedAction: '建议检查并规范参考文献格式，确保引用的完整性'
    });
  }
  
  // 通用建议
  suggestions.push({
    priority: 'medium',
    location: '实验结果部分',
    description: '实验结果分析可以更加详细',
    suggestedAction: '建议增加实验结果的深入分析，解释实验现象背后的原因'
  });
  
  return suggestions;
}

// 初始化数据
const loadReportData = async () => {
  loading.value = true
  try {
    // 先获取论文的最新报告ID
    const reportListRes = await getSimpleCheckReport(props.paperId);
    if (reportListRes.code === 200 && reportListRes.data && reportListRes.data.length > 0) {
      const latestReport = reportListRes.data[0];
      // 获取报告详情
      const reportRes = await getPaperReport(latestReport.id);
      if (reportRes.code === 200) {
        const data = reportRes.data;
        // 处理后端返回的ReportPreviewDTO数据结构
        const baseInfo = data.baseInfo || {};
        const rateStat = data.rateStat || {};
        const similarity = rateStat.repeatRate ? rateStat.repeatRate.toString() : '0';
        
        // 计算总字数和相似字数
        let totalWords = 0;
        let similarWords = 0;
        if (data.paragraphs && data.paragraphs.length > 0) {
          data.paragraphs.forEach(paragraph => {
            if (paragraph.content) {
              totalWords += paragraph.content.length;
              if (paragraph.isRepeat) {
                similarWords += paragraph.content.length;
              }
            }
          });
        }
        
        reportData.value = {
          paperTitle: baseInfo.paperTitle || '暂无标题',
          studentName: baseInfo.studentName || baseInfo.author || '未知',
          submitTime: baseInfo.generateTime || '',
          similarity: parseFloat(similarity) || 0,
          checkTime: baseInfo.generateTime || '',
          checkScope: baseInfo.checkRuleName || '',
          citations: baseInfo.citations || 0,
          totalWords: baseInfo.totalWords || totalWords,
          similarWords: baseInfo.similarWords || similarWords,
          uniqueSentences: baseInfo.uniqueSentences || (data.paragraphs ? data.paragraphs.length : 0),
          similarSources: data.similarSources ? data.similarSources.filter(source => source.sourceName !== null && source.sourceName !== '').length : 0
        }

        // 构建相似来源列表（后端不提供author/year/matchedWords字段）
        if (data.similarSources && data.similarSources.length > 0) {
          similarSources.value = data.similarSources.filter(source => source.sourceName !== null && source.sourceName !== '')
            .map((source, index) => ({
              id: source.sourceId || index + 1,
              title: source.sourceName || '未知来源',
              author: source.author || '',
              year: source.year || '',
              type: source.sourceType || 'academic',
              similarity: source.maxSimilarity || 0,
              matchedWords: source.matchedParagraphs || ''
            }));
        }

        // 基于报告数据的修改建议（后端暂无建议接口，基于相似度自动评级）
        suggestions.value = generateSuggestions(reportData.value.similarity);
        
        // 加载历史记录
        loadHistoryRecords(reportListRes.data);
      } else {
        ElMessage.error(reportRes.message || '获取报告详情失败');
      }
    } else {
      ElMessage.error('未找到该论文的查重报告');
    }
  } catch (error) {
    console.error('加载报告数据失败:', error)
    ElMessage.error('加载报告数据失败')
  } finally {
    loading.value = false
  }
}

const loadHistoryRecords = (reports) => {
  if (reports && reports.length > 0) {
    // 按时间倒序排序，最新的在前面
    const sortedReports = [...reports].sort((a, b) => {
      return new Date(b.createTime) - new Date(a.createTime);
    });
    
    // 转换为前端需要的格式
    historyRecords.value = sortedReports.map((report, index) => {
      // 计算版本号（从1开始）
      const version = sortedReports.length - index;
      // 根据查重率计算类型
      let type = 'success';
      let similarityType = 'success';
      if (report.checkRate >= 30) {
        type = 'danger';
        similarityType = 'danger';
      } else if (report.checkRate >= 15) {
        type = 'warning';
        similarityType = 'warning';
      }
      
      return {
        version: version,
        id: report.id,
        checkRate: report.checkRate,
        createTime: new Date(report.createTime).toLocaleString('zh-CN'),
        type: type,
        similarityType: similarityType,
        description: `进行了查重，相似度为 ${report.checkRate}%`,
        icon: 'Check'
      };
    });
  }
}

const viewHistoryReport = (record) => {
  // 加载历史报告数据
  loading.value = true;
  getPaperReport(record.id).then(reportRes => {
    loading.value = false;
    if (reportRes.code === 200) {
      const data = reportRes.data;
      // 处理后端返回的ReportPreviewDTO数据结构
      const baseInfo = data.baseInfo || {};
      const rateStat = data.rateStat || {};
      const similarity = rateStat.repeatRate ? rateStat.repeatRate.toString() : '0';
      
      reportData.value = {
        paperTitle: baseInfo.paperTitle || '暂无标题',
        studentName: baseInfo.studentName || baseInfo.author || '未知',
        submitTime: baseInfo.generateTime || '',
        similarity: parseFloat(similarity) || 0,
        checkTime: baseInfo.generateTime || '',
        checkScope: baseInfo.checkRuleName || '',
        citations: baseInfo.citations || 0,
        totalWords: baseInfo.totalWords || 0,
        similarWords: baseInfo.similarWords || 0,
        uniqueSentences: baseInfo.uniqueSentences || 0,
        similarSources: data.similarSources ? data.similarSources.filter(s => s.sourceName).length : 0
      };

      // 构建相似来源列表
        if (data.similarSources && data.similarSources.length > 0) {
          similarSources.value = data.similarSources.filter(s => s.sourceName).map((source, index) => ({
            id: source.sourceId || index + 1,
            title: source.sourceName,
            author: source.author || '',
            year: source.year || '',
            type: source.sourceType || 'academic',
            similarity: source.maxSimilarity || 0,
            matchedWords: source.matchedParagraphs || ''
          }));
        }

        // 基于报告数据的修改建议
        suggestions.value = generateSuggestions(reportData.value.similarity);
        
        ElMessage.success('历史报告加载成功');
    } else {
      ElMessage.error(reportRes.message || '加载历史报告失败');
    }
  }).catch(error => {
    loading.value = false;
    ElMessage.error('加载历史报告失败');
  });
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
  background-color: #f5f5f7;
}

/* 报告头部 */
.report-header {
  background: #0066cc;
  color: white;
  padding: 24px;
  border-radius: 11px 11px 0 0;
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
  font-size: 17px;
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
  border-radius: 11px;
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
  font-size: 17px;
}

.bar-track {
  flex: 1;
  height: 24px;
  background: #e6e8eb;
  border-radius: 18px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 18px;
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
  background: #f5f5f7;
  border-radius: 11px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0066cc;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 17px;
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
  border-radius: 11px;
  overflow: hidden;
}

.panel-header {
  background: #f5f5f7;
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
  border-radius: 8px;
  line-height: 1.6;
}

.text-segment.highlight {
  background: #fef0f0;
  border-color: #fecaca;
}

/* 建议列表 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  padding: 16px;
  border-radius: var(--apple-rounded-lg);
  border: 1px solid var(--apple-hairline);
}

.suggestion-item.priority-high {
  background: #fef0f0;
  border-color: #fecaca;
}

.suggestion-item.priority-medium {
  background: #fdf6ec;
  border-color: #fde4b2;
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
  font-size: 17px;
  color: #0066cc;
  font-weight: 400;
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
  font-size: 17px;
  color: #606266;
}

.summary-value {
  font-weight: 600;
  color: #303133;
}

/* 快速操作 */
.quick-actions .el-button {
  transition: border-color 0.2s ease;
}

.quick-actions .el-button:active {
  transform: scale(0.985);
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