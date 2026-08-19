<template>
  <div class="plagiarism-report-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-title">查重报告详情</span>
        </template>
        <template #extra>
          <div class="header-actions">
            <el-button :icon="Share" @click="shareReport">分享</el-button>
            <el-dropdown @command="handleExport">
              <el-button :icon="Download">
                导出报告<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pdf">导出PDF</el-dropdown-item>
                  <el-dropdown-item command="doc">导出Word</el-dropdown-item>
                  <el-dropdown-item command="html">导出HTML</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-page-header>
    </div>

    <!-- 论文基本信息 -->
    <el-card class="paper-info-card" shadow="never">
      <div class="paper-basic-info">
        <div class="info-icon">
          <el-icon size="24" color="#667eea"><Document /></el-icon>
        </div>
        <div class="info-content">
          <h2 class="paper-title">{{ reportData.paperTitle || '暂无标题' }}</h2>
          <div class="paper-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              作者: {{ reportData.author || '未知' }} ({{ reportData.studentId || '未知学号' }})
            </span>
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              提交时间: {{ formatDateTime(reportData.submitTime) || '暂无' }}
            </span>
            <span class="meta-item">
              <el-icon><Timer /></el-icon>
              检测时间: {{ formatDateTime(reportData.checkTime) || '暂无' }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Tab导航 -->
    <el-card class="tab-card" shadow="never">
      <el-tabs v-model="activeTab" class="report-tabs">
        <el-tab-pane label="概览" name="overview">
          <div class="overview-content">
            <!-- 总体相似度 -->
            <div class="similarity-overview">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="similarity-card">
                    <div class="similarity-value">
                      <el-progress
                        type="circle"
                        :percentage="Math.round(reportData.totalSimilarity || 0)"
                        :width="120"
                        :stroke-width="10"
                        :color="getSimilarityColor(reportData.totalSimilarity || 0)"
                      />
                      <div class="similarity-text">
                        <div class="percentage">{{ Math.round(reportData.totalSimilarity || 0) }}%</div>
                        <div class="rating">{{ getSimilarityRating(reportData.totalSimilarity || 0) }}</div>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="16">
                  <div class="distribution-chart">
                    <h3>相似度分布</h3>
                    <div class="chart-container">
                      <div 
                        v-for="(item, index) in distributionData" 
                        :key="index" 
                        class="distribution-bar"
                      >
                        <div class="bar-label">{{ item.range }}</div>
                        <div class="bar-container">
                          <div 
                            class="bar-fill" 
                            :style="{ 
                              width: item.percentage + '%',
                              backgroundColor: getBarColor(index)
                            }"
                          ></div>
                          <span class="bar-percentage">{{ item.percentage }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <!-- 检测统计 -->
            <div class="check-statistics">
              <el-row :gutter="20">
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value">{{ reportData.wordCount || 0 }}</div>
                    <div class="stat-label">总字数</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value">{{ reportData.citationCount || 0 }}</div>
                    <div class="stat-label">引用文献</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value">{{ reportData.similarSources || 0 }}</div>
                    <div class="stat-label">相似文献</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value">{{ (reportData.checkEngines || []).join(' + ') || '暂无数据' }}</div>
                    <div class="stat-label">检测引擎</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="详细分析" name="analysis">
          <div class="analysis-content">
            <!-- 按章节分析 -->
            <el-card class="section-analysis-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>按章节相似度分析</span>
                </div>
              </template>
              
              <div class="sections-list">
                <div 
                  v-for="(section, key) in (reportData.sections || {})" 
                  :key="key"
                  class="section-item"
                >
                  <div class="section-info">
                    <div class="section-name">{{ getSectionName(key) }}</div>
                    <div class="section-stats">
                      <span>相似度: {{ section.similarity }}%</span>
                      <span>字数: {{ section.wordCount }}字</span>
                    </div>
                  </div>
                  <div class="section-progress">
                    <el-progress 
                      :percentage="Math.round(section.similarity)"
                      :stroke-width="8"
                      :color="getSimilarityColor(section.similarity)"
                      :show-text="false"
                    />
                    <span class="progress-text">{{ Math.round(section.similarity) }}%</span>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 关键词分析 -->
            <el-card class="keywords-card" shadow="never" style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <el-icon><Search /></el-icon>
                  <span>关键词分析</span>
                </div>
              </template>
              
              <div class="keywords-analysis">
                <div class="normal-keywords">
                  <span 
                    v-for="keyword in normalKeywords" 
                    :key="keyword"
                    class="keyword-tag"
                  >
                    {{ keyword }}
                  </span>
                </div>
                <div class="high-risk-keywords">
                  <div class="risk-label">高风险词汇:</div>
                  <span 
                    v-for="keyword in highRiskKeywords" 
                    :key="keyword"
                    class="keyword-tag risk"
                  >
                    {{ keyword }}
                  </span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="相似文献" name="sources">
          <div class="sources-content">
            <el-card 
              v-for="source in similarSources" 
              :key="source.sourceId"
              class="source-card" 
              shadow="hover"
            >
              <div class="source-header">
                <h3 class="source-title">{{ source.title }}</h3>
                <el-tag :type="getSimilarityTagType(source.similarity)">
                  相似度: {{ source.similarity }}%
                </el-tag>
              </div>
              <div class="source-meta">
                <span><el-icon><User /></el-icon> {{ source.author }}</span>
                <span><el-icon><Document /></el-icon> 学术论文</span>
              </div>
              <div class="matched-paragraphs">
                <h4>匹配段落:</h4>
                <div 
                  v-for="(paragraph, index) in source.matchedParagraphs" 
                  :key="index"
                  class="paragraph-item"
                >
                  <div class="source-text">
                    <strong>原文:</strong> {{ paragraph.sourceText }}
                  </div>
                  <div class="paper-text">
                    <strong>本文:</strong> {{ paragraph.paperText }}
                  </div>
                  <div class="match-similarity">
                    匹配度: {{ paragraph.similarity }}%
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="修改建议" name="suggestions">
          <div class="suggestions-content">
            <el-alert
              :title="getOverallAssessment(reportData.totalSimilarity || 0)"
              :type="getAssessmentType(reportData.totalSimilarity || 0)"
              show-icon
              :closable="false"
            />
            
            <el-card class="recommendations-card" shadow="never" style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <el-icon><Lightning /></el-icon>
                  <span>针对性建议</span>
                </div>
              </template>
              
              <div class="recommendations-list">
                <div 
                  v-for="(rec, index) in recommendations" 
                  :key="index"
                  class="recommendation-item"
                >
                  <el-icon color="#667eea"><Check /></el-icon>
                  <span>{{ rec }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="历史记录" name="history">
          <div class="history-content">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in historyRecords"
                :key="index"
                :timestamp="formatDateTime(record.checkTime)"
                :type="getTimelineType(record.rating)"
              >
                <div class="history-item">
                  <div class="version-info">
                    <el-tag type="primary">V{{ record.version }}</el-tag>
                    <span class="similarity-score">{{ record.similarity }}%</span>
                  </div>
                  <div class="change-description">
                    {{ record.changes }}
                  </div>
                  <div class="history-actions">
                    <el-button text size="small" @click="viewHistoricalReport(record.reportId)">
                      查看报告
                    </el-button>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Share, Download, ArrowDown, Document, User, Calendar, 
  Timer, DataAnalysis, Search, Check, Lightning
} from '@element-plus/icons-vue'
import { getPaperReport, exportCheckReport } from '@/api/student'

const route = useRoute()
const router = useRouter()

// 响应式数据
const activeTab = ref('overview')
const reportData = ref({})
const loading = ref(false)

// 计算属性数据
const distributionData = ref([
  { range: '0-10%', percentage: 45 },
  { range: '10-20%', percentage: 23 },
  { range: '20-30%', percentage: 18 },
  { range: '30-40%', percentage: 9 },
  { range: '40%+', percentage: 5 }
])

const similarSources = ref([
  {
    sourceId: 'src_001',
    title: '深度学习在图像识别中的应用',
    author: '李明等',
    similarity: 35.2,
    matchedParagraphs: [
      {
        sourceText: '在实验过程中，我们采用了卷积神经网络...',
        paperText: '本文在实验中使用了卷积神经网络...',
        similarity: 89.5
      }
    ]
  }
])

const normalKeywords = ref(['人工智能', '深度学习', '图像识别', '卷积神经网络'])
const highRiskKeywords = ref(['直接引用', '数据来源', '实验方法'])

const recommendations = ref([
  '建议完善参考文献标注',
  '第15-18段需要特别注意引用规范',
  '部分表述可以更加原创化'
])

const historyRecords = ref([
  {
    version: 3,
    reportId: 'rep_003',
    checkTime: '2024-01-15T15:45:30Z',
    similarity: 15.2,
    rating: 'excellent',
    changes: '完善了文献引用格式'
  },
  {
    version: 2,
    reportId: 'rep_002',
    checkTime: '2024-01-12T14:20:15Z',
    similarity: 28.7,
    rating: 'good',
    changes: '删除了重复段落内容'
  }
])

// 方法
const goBack = () => {
  router.back()
}

const shareReport = () => {
  ElMessage.info('分享功能开发中...')
}

const handleExport = (command) => {
  ElMessageBox.confirm(`确定要导出为${command.toUpperCase()}格式吗？`, '导出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    exportReport(command)
  })
}

const exportReport = async (format) => {
  try {
    const response = await exportCheckReport(route.params.paperId, format)
    // 处理文件下载
    const blob = new Blob([response])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `查重报告_${reportData.value.paperTitle}.${format}`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

const loadReportData = async () => {
  // 参数校验
  if (!route.params.paperId || route.params.paperId === 'undefined') {
    ElMessage.error('缺少论文 ID 参数');
    router.back();
    return;
  }
  
  loading.value = true;
  try {
    const res = await getPaperReport(route.params.paperId);
    
    // 如果组件已卸载，不更新数据
    if (isUnmounted) return;
    
    if (res.code === 200) {
      reportData.value = res.data;
    } else {
      ElMessage.error(res.message || '获取报告失败');
    }
  } catch (error) {
    ElMessage.error('网络错误：' + error.message);
  } finally {
    if (!isUnmounted) {
      loading.value = false;
    }
  }
};

const getSimilarityColor = (similarity) => {
  if (similarity < 15) return '#67c23a'
  if (similarity < 30) return '#e6a23c'
  return '#f56c6c'
}

const getSimilarityRating = (similarity) => {
  if (similarity < 15) return '优秀'
  if (similarity < 30) return '良好'
  if (similarity < 50) return '一般'
  return '需改进'
}

const getBarColor = (index) => {
  const colors = ['#67c23a', '#90c657', '#e6a23c', '#f59a4c', '#f56c6c']
  return colors[index] || '#909399'
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

const getSimilarityTagType = (similarity) => {
  if (similarity < 20) return 'success'
  if (similarity < 40) return 'warning'
  return 'danger'
}

const getOverallAssessment = (similarity) => {
  if (similarity < 20) return '该论文原创性较高，与其他文献相似度较低，符合学术规范要求。'
  if (similarity < 40) return '该论文存在一定程度相似性，建议仔细检查引用标注和表述方式。'
  return '该论文相似度较高，可能存在抄袭风险，请重点关注并认真修改。'
}

const getAssessmentType = (similarity) => {
  if (similarity < 20) return 'success'
  if (similarity < 40) return 'warning'
  return 'error'
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

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const viewHistoricalReport = (reportId) => {
  ElMessage.info(`查看历史报告: ${reportId}`)
}

// 标记组件是否已卸载
let isUnmounted = false

// 生命周期
onMounted(() => {
  loadReportData()
})

onUnmounted(() => {
  isUnmounted = true
})
</script>

<style lang="scss" scoped>
.plagiarism-report-page {
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
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .paper-info-card {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .paper-basic-info {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      
      .info-icon {
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        color: white;
      }
      
      .info-content {
        flex: 1;
        
        .paper-title {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
          line-height: 1.4;
        }
        
        .paper-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          
          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #606266;
            font-size: 14px;
            
            .el-icon {
              color: #667eea;
            }
          }
        }
      }
    }
  }

  .tab-card {
    border-radius: 12px;
    
    :deep(.el-tabs__content) {
      padding: 20px 0;
    }
  }

  // 概览Tab样式
  .overview-content {
    .similarity-overview {
      margin-bottom: 30px;
      
      .similarity-card {
        text-align: center;
        
        .similarity-value {
          position: relative;
          display: inline-block;
          
          .similarity-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            
            .percentage {
              font-size: 24px;
              font-weight: 700;
              color: #303133;
            }
            
            .rating {
              font-size: 14px;
              color: #606266;
              margin-top: 4px;
            }
          }
        }
      }
      
      .distribution-chart {
        h3 {
          margin: 0 0 16px 0;
          color: #303133;
          font-size: 16px;
        }
        
        .chart-container {
          .distribution-bar {
            margin-bottom: 12px;
            
            .bar-label {
              font-size: 14px;
              color: #606266;
              margin-bottom: 6px;
            }
            
            .bar-container {
              display: flex;
              align-items: center;
              gap: 12px;
              
              .bar-fill {
                height: 24px;
                border-radius: 12px;
                transition: width 0.3s ease;
              }
              
              .bar-percentage {
                min-width: 40px;
                font-size: 14px;
                font-weight: 500;
                color: #606266;
              }
            }
          }
        }
      }
    }
    
    .check-statistics {
      .stat-item {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }

  // 分析Tab样式
  .analysis-content {
    .section-analysis-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
      }
      
      .sections-list {
        .section-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid #f0f2f5;
          
          &:last-child {
            border-bottom: none;
          }
          
          .section-info {
            .section-name {
              font-weight: 500;
              color: #303133;
              margin-bottom: 4px;
            }
            
            .section-stats {
              display: flex;
              gap: 16px;
              font-size: 14px;
              color: #606266;
            }
          }
          
          .section-progress {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 200px;
            
            .progress-text {
              min-width: 40px;
              font-weight: 500;
              color: #303133;
            }
          }
        }
      }
    }
    
    .keywords-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
      }
      
      .keywords-analysis {
        .normal-keywords {
          margin-bottom: 16px;
          
          .keyword-tag {
            display: inline-block;
            padding: 4px 12px;
            margin: 4px;
            background: #ecf5ff;
            color: #409eff;
            border-radius: 16px;
            font-size: 12px;
          }
        }
        
        .high-risk-keywords {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          
          .risk-label {
            font-weight: 500;
            color: #f56c6c;
            white-space: nowrap;
          }
          
          .keyword-tag.risk {
            background: #fef0f0;
            color: #f56c6c;
          }
        }
      }
    }
  }

  // 相似文献Tab样式
  .sources-content {
    .source-card {
      margin-bottom: 20px;
      border-radius: 12px;
      
      .source-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        
        .source-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          flex: 1;
          margin-right: 16px;
        }
      }
      
      .source-meta {
        display: flex;
        gap: 20px;
        margin-bottom: 16px;
        color: #606266;
        font-size: 14px;
        
        .el-icon {
          margin-right: 4px;
          color: #667eea;
        }
      }
      
      .matched-paragraphs {
        h4 {
          margin: 0 0 12px 0;
          color: #303133;
          font-size: 14px;
        }
        
        .paragraph-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          
          .source-text, .paper-text {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
            
            strong {
              color: #606266;
            }
          }
          
          .match-similarity {
            text-align: right;
            font-size: 12px;
            color: #f56c6c;
            font-weight: 500;
          }
        }
      }
    }
  }

  // 建议Tab样式
  .suggestions-content {
    .recommendations-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
      }
      
      .recommendations-list {
        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f2f5;
          
          &:last-child {
            border-bottom: none;
          }
          
          .el-icon {
            margin-top: 3px;
          }
          
          span {
            flex: 1;
            color: #303133;
            line-height: 1.5;
          }
        }
      }
    }
  }

  // 历史Tab样式
  .history-content {
    .history-item {
      .version-info {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        
        .similarity-score {
          font-weight: 600;
          color: #303133;
        }
      }
      
      .change-description {
        color: #606266;
        margin-bottom: 12px;
        line-height: 1.5;
      }
      
      .history-actions {
        .el-button {
          padding: 0;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .plagiarism-report-page {
    padding: 12px;
    
    .paper-basic-info {
      flex-direction: column;
      
      .info-content {
        .paper-meta {
          flex-direction: column;
          gap: 8px;
        }
      }
    }
    
    .similarity-overview {
      .el-row {
        flex-direction: column;
        
        .el-col {
          width: 100%;
          margin-bottom: 20px;
        }
      }
    }
    
    .check-statistics {
      .el-row {
        .el-col {
          width: 50%;
          margin-bottom: 16px;
        }
      }
    }
  }
}
</style>