<template>
  <div class="academic-integrity-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">学术诚信指导中心</h1>
      <p class="page-subtitle">提升学术素养，规范引用行为</p>
    </div>

    <!-- 导航Tabs -->
    <el-card class="navigation-card" shadow="never">
      <el-tabs v-model="activeTab" class="guide-tabs">
        <el-tab-pane label="基础知识" name="basics">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="content-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Warning /></el-icon>
                      <span>什么是学术不端？</span>
                    </div>
                  </template>
                  <div class="content-body">
                    <p>学术不端是指在学术活动中违反学术道德规范的行为，主要包括：</p>
                    <ul class="definition-list">
                      <li><strong>抄袭：</strong>未经允许使用他人作品或 ideas</li>
                      <li><strong>剽窃：</strong>盗用他人学术成果</li>
                      <li><strong>伪造数据：</strong>编造或篡改研究数据</li>
                      <li><strong>重复发表：</strong>同一研究成果多次发表</li>
                    </ul>
                    <div class="consequence-box">
                      <el-alert
                        title="严重后果"
                        type="error"
                        description="可能导致学位撤销、学术声誉受损、法律责任等严重后果"
                        show-icon
                        :closable="false"
                      />
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="content-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><DataLine /></el-icon>
                      <span>查重检测原理</span>
                    </div>
                  </template>
                  <div class="content-body">
                    <p>查重系统通过以下方式检测文本相似度：</p>
                    <div class="process-steps">
                      <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                          <h4>文本预处理</h4>
                          <p>去除格式、分词、标准化处理</p>
                        </div>
                      </div>
                      <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                          <h4>特征提取</h4>
                          <p>提取关键词、短语、句子结构</p>
                        </div>
                      </div>
                      <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                          <h4>相似度计算</h4>
                          <p>比对已有文献库，计算匹配程度</p>
                        </div>
                      </div>
                      <div class="step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                          <h4>结果判定</h4>
                          <p>根据阈值判断是否存在抄袭风险</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="引用规范" name="citation">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="content-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Document /></el-icon>
                      <span>合理引用 vs 抄袭</span>
                    </div>
                  </template>
                  <div class="content-body">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <div class="comparison-section good">
                          <h3><el-icon color="#67c23a"><SuccessFilled /></el-icon> 合理引用</h3>
                          <ul>
                            <li>明确标注引用来源</li>
                            <li>用自己的话表述核心观点</li>
                            <li>适当引用，不过度依赖</li>
                            <li>遵守引用格式规范</li>
                            <li>注明出处和页码</li>
                          </ul>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="comparison-section bad">
                          <h3><el-icon color="#f56c6c"><CircleClose /></el-icon> 抄袭行为</h3>
                          <ul>
                            <li>未标注任何引用信息</li>
                            <li>大量复制原文内容</li>
                            <li>逐字逐句照搬他人文字</li>
                            <li>断章取义，歪曲原意</li>
                            <li>自我抄袭（重复发表）</li>
                          </ul>
                        </div>
                      </el-col>
                    </el-row>
                    
                    <div class="citation-examples">
                      <h3>常用引用格式示例</h3>
                      <el-tabs type="border-card">
                        <el-tab-pane label="中文格式">
                          <div class="format-example">
                            <h4>图书引用</h4>
                            <p class="example">作者. 书名[M]. 出版地: 出版社, 出版年份.</p>
                            <p class="example-text">例如：张三. 人工智能导论[M]. 北京: 清华大学出版社, 2023.</p>
                            
                            <h4>期刊文章</h4>
                            <p class="example">作者. 文章标题[J]. 期刊名, 年份, 卷号(期号): 页码.</p>
                            <p class="example-text">例如：李四. 深度学习在医学图像中的应用[J]. 计算机学报, 2023, 46(3): 456-468.</p>
                          </div>
                        </el-tab-pane>
                        <el-tab-pane label="英文格式">
                          <div class="format-example">
                            <h4>APA格式</h4>
                            <p class="example">Author, A. A. (Year). Title of work. Publisher.</p>
                            <p class="example-text">例如：Smith, J. (2023). Artificial Intelligence Basics. MIT Press.</p>
                            
                            <h4>MLA格式</h4>
                            <p class="example">Author Last Name, First Name. Title of Book. Publisher, Year.</p>
                            <p class="example-text">例如：Johnson, Mary. Machine Learning Fundamentals. Cambridge UP, 2023.</p>
                          </div>
                        </el-tab-pane>
                      </el-tabs>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="sidebar-card" shadow="hover" v-loading="loading">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Lightning /></el-icon>
                      <span>快速检查清单</span>
                    </div>
                  </template>
                  <div class="checklist">
                    <div 
                      v-for="(item, index) in citationChecklist" 
                      :key="index"
                      class="checklist-item"
                      :class="{ checked: item.checked }"
                    >
                      <el-checkbox 
                        v-model="item.checked" 
                        @change="updateChecklist(item, index)"
                      >
                        {{ item.text }}
                      </el-checkbox>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="个人指导" name="personal">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="content-card personal-guide" shadow="hover" v-loading="loading">
                  <template #header>
                    <div class="card-header">
                      <el-icon><User /></el-icon>
                      <span>基于您查重报告的个性化建议</span>
                      <el-tag type="info" size="small" v-if="personalAdvice.version > 0">基于最新报告 V{{ personalAdvice.version }}</el-tag>
                    </div>
                  </template>
                  
                  <div class="personal-content">
                    <div class="advice-section high-risk">
                      <h3><el-icon color="#f56c6c"><Warning /></el-icon> 需要重点关注的章节</h3>
                      <div 
                        v-for="(area, index) in personalAdvice.highRiskAreas" 
                        :key="index"
                        class="advice-item"
                      >
                        <div class="area-header">
                          <el-tag type="danger">{{ area.section }}</el-tag>
                          <span class="similarity-rate">{{ area.similarity }}%</span>
                        </div>
                        <div class="area-issue">{{ area.issue }}</div>
                        <div class="area-suggestion">
                          <el-icon><Lightning /></el-icon>
                          {{ area.suggestion }}
                        </div>
                      </div>
                    </div>
                    
                    <div class="advice-section good-aspects">
                      <h3><el-icon color="#67c23a"><SuccessFilled /></el-icon> 表现良好的方面</h3>
                      <div 
                        v-for="(aspect, index) in personalAdvice.goodAspects" 
                        :key="index"
                        class="advice-item positive"
                      >
                        <div class="area-header">
                          <el-tag type="success">{{ aspect.section }}</el-tag>
                          <span class="similarity-rate good">{{ aspect.similarity }}%</span>
                        </div>
                        <div class="area-issue">{{ aspect.strength }}</div>
                        <div class="area-suggestion">
                          <el-icon><Star /></el-icon>
                          {{ aspect.encouragement }}
                        </div>
                      </div>
                    </div>
                    
                    <div class="advice-section general-tips">
                      <h3><el-icon color="#409eff"><InfoFilled /></el-icon> 通用改进建议</h3>
                      <div class="tips-list">
                        <div 
                          v-for="(tip, index) in personalAdvice.generalTips" 
                          :key="index"
                          class="tip-item"
                        >
                          <el-icon><Check /></el-icon>
                          <span>{{ tip }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="resource-card" shadow="hover" v-loading="loading">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Collection /></el-icon>
                      <span>推荐学习资源</span>
                    </div>
                  </template>
                  <div class="resources">
                    <div 
                      v-for="(resource, index) in recommendedResources" 
                      :key="index"
                      class="resource-item"
                      @click="openResource(resource)"
                    >
                      <div class="resource-icon">
                        <el-icon :color="getResourceColor(resource.type)">
                          <component :is="getResourceIcon(resource.type)" />
                        </el-icon>
                      </div>
                      <div class="resource-info">
                        <div class="resource-title">{{ resource.title }}</div>
                        <div class="resource-type">{{ getResourceTypeName(resource.type) }}</div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="案例分析" name="cases">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="case-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><DocumentChecked /></el-icon>
                      <span>正面案例</span>
                      <el-tag type="success" size="small">合规引用</el-tag>
                    </div>
                  </template>
                  <div class="case-content">
                    <div class="case-description">
                      <h4>案例背景</h4>
                      <p>某学生在撰写关于机器学习的论文时，需要引用相关研究。</p>
                    </div>
                    <div class="case-example">
                      <h4>正确做法</h4>
                      <div class="example-content">
                        <p class="quote">正如Wang等人(2023)所指出的，"深度学习在图像识别领域展现出了卓越的性能"[1]。基于这一观点，本研究提出了...</p>
                        <div class="citation">[1] Wang, L., et al. (2023). Deep learning for image recognition. Journal of AI Research, 15(2), 123-145.</div>
                      </div>
                    </div>
                    <div class="case-analysis">
                      <h4>分析要点</h4>
                      <ul>
                        <li>明确标注了作者和年份</li>
                        <li>使用引号标识直接引用</li>
                        <li>提供了完整的参考文献</li>
                        <li>用自己的话衔接引用内容</li>
                      </ul>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="case-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><DocumentDelete /></el-icon>
                      <span>反面案例</span>
                      <el-tag type="danger" size="small">抄袭行为</el-tag>
                    </div>
                  </template>
                  <div class="case-content">
                    <div class="case-description">
                      <h4>案例背景</h4>
                      <p>同样是关于机器学习的论文，但处理方式不当。</p>
                    </div>
                    <div class="case-example">
                      <h4>错误做法</h4>
                      <div class="example-content">
                        <p class="quote">深度学习在图像识别领域展现出了卓越的性能。基于这一技术，我们可以实现更高的识别准确率...</p>
                        <div class="citation warning">（未标注任何引用信息）</div>
                      </div>
                    </div>
                    <div class="case-analysis">
                      <h4>问题分析</h4>
                      <ul>
                        <li>未标明原始作者</li>
                        <li>未使用引号标识引用</li>
                        <li>未列入参考文献</li>
                        <li>构成实质性抄袭</li>
                      </ul>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="常见问题" name="faq">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-collapse v-model="activeFAQ" accordion>
                  <el-collapse-item
                    v-for="(faq, index) in faqList"
                    :key="index"
                    :name="index"
                  >
                    <template #title>
                      <el-icon><QuestionFilled /></el-icon>
                      {{ faq.question }}
                    </template>
                    <div class="faq-answer">
                      <p v-html="faq.answer"></p>
                      <div v-if="faq.example" class="faq-example">
                        <h4>示例：</h4>
                        <p>{{ faq.example }}</p>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </el-col>
              <el-col :span="8">
                <el-card class="contact-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Service /></el-icon>
                      <span>需要帮助？</span>
                    </div>
                  </template>
                  <div class="contact-content">
                    <p>如果还有疑问，可以通过以下方式获得帮助：</p>
                    <div class="contact-methods">
                      <div class="contact-item">
                        <el-icon><ChatLineSquare /></el-icon>
                        <span>在线咨询</span>
                      </div>
                      <div class="contact-item">
                        <el-icon><Phone /></el-icon>
                        <span>学术支持热线</span>
                      </div>
                      <div class="contact-item">
                        <el-icon><Message /></el-icon>
                        <span>邮件咨询</span>
                      </div>
                    </div>
                    <el-button type="primary" class="contact-button">
                      联系学术顾问
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { 
  getPersonalAcademicAdvice,
  getAcademicResources,
  getAcademicChecklist,
  updateChecklistItem
} from '@/api/student'
import { 
  Warning, DataLine, Document, SuccessFilled, CircleClose,
  Lightning, User, Check, Star, InfoFilled, Collection,
  DocumentChecked, DocumentDelete, QuestionFilled, Service,
  ChatLineSquare, Phone, Message
} from '@element-plus/icons-vue'

const userStore = useUserStore()

// 响应式数据
const activeTab = ref('basics')
const activeFAQ = ref(0)
const loading = ref(false)

const citationChecklist = ref([])

const personalAdvice = ref({
  version: 0,
  highRiskAreas: [],
  goodAspects: [],
  generalTips: []
})

const recommendedResources = ref([])

const faqList = ref([
  {
    question: '查重相似度多少算正常？',
    answer: '一般来说，相似度在15%以下属于正常范围，15-30%需要关注，超过30%建议认真修改。不同学校和期刊的要求可能有所不同。',
    example: '本科毕业论文通常要求相似度不超过20%，硕士论文要求不超过15%。'
  },
  {
    question: '自己写的论文为什么会标红？',
    answer: '可能原因包括：<br>1. 引用了自己以前发表的作品（自我抄袭）<br>2. 使用了过于常见的表述<br>3. 专业术语和公式被广泛使用<br>4. 系统误判'
  },
  {
    question: '如何降低论文相似度？',
    answer: '有效方法包括：<br>1. 增加原创性内容<br>2. 改写引用部分<br>3. 完善引用标注<br>4. 删除不必要的引用<br>5. 重新组织语言表达'
  },
  {
    question: '引用格式不对会影响查重吗？',
    answer: '引用格式本身不会直接影响查重结果，但：<br>1. 格式不规范可能被系统误判为抄袭<br>2. 影响评审专家的印象<br>3. 可能违反学术规范要求'
  }
])

// 方法
const loadData = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  loading.value = true
  try {
    // 并行请求所有数据
    const [adviceRes, resourcesRes, checklistRes] = await Promise.all([
      getPersonalAcademicAdvice(),
      getAcademicResources(),
      getAcademicChecklist()
    ])
    
    // 如果组件已卸载，不更新数据
    if (isUnmounted) return
    
    // 处理个性化学术建议
    if (adviceRes.code === 200) {
      personalAdvice.value = adviceRes.data || {
        version: 0,
        highRiskAreas: [],
        goodAspects: [],
        generalTips: []
      }
    }
    
    // 处理推荐资源
    if (resourcesRes.code === 200) {
      recommendedResources.value = resourcesRes.data || []
    }
    
    // 处理检查清单
    if (checklistRes.code === 200) {
      citationChecklist.value = checklistRes.data?.items || []
    }
    
  } catch (error) {
    console.error('加载学术诚信数据失败:', error)
    ElMessage.error('数据加载失败：' + (error.message || '网络错误'))
  } finally {
    if (!isUnmounted) {
      loading.value = false
    }
  }
}

const updateChecklist = async (item, index) => {
  try {
    const res = await updateChecklistItem(item.itemId, item.checked)
    if (res.code === 200) {
      ElMessage.success('检查项状态已更新')
    } else {
      // 恢复原状态
      item.checked = !item.checked
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    // 恢复原状态
    item.checked = !item.checked
    console.error('更新检查项失败:', error)
    ElMessage.error('更新失败: ' + (error.message || '网络错误'))
  }
}

const openResource = async (resource) => {
  try {
    // 如果资源有URL，打开链接
    if (resource.url) {
      window.open(resource.url, '_blank')
    } else {
      ElMessage.info(`正在打开资源: ${resource.title}`)
    }
  } catch (error) {
    ElMessage.error('打开资源失败')
  }
}

const getResourceColor = (type) => {
  const colors = {
    book: '#67c23a',
    online: '#409eff',
    video: '#e6a23c',
    document: '#909399',
    course: '#764ba2'
  }
  return colors[type] || '#909399'
}

const getResourceIcon = (type) => {
  const icons = {
    book: 'Reading',
    online: 'Link',
    video: 'VideoPlay',
    document: 'Document',
    course: 'School'
  }
  return icons[type] || 'Document'
}

const getResourceTypeName = (type) => {
  const names = {
    book: '图书',
    online: '在线资源',
    video: '视频教程',
    document: '文档资料',
    course: '课程'
  }
  return names[type] || '资源'
}

// 标记组件是否已卸载
let isUnmounted = false

// 生命周期
onMounted(() => {
  loadData()
})

onUnmounted(() => {
  isUnmounted = true
})
</script>

<style lang="scss" scoped>
.academic-integrity-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    text-align: center;
    margin-bottom: 30px;
    
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 12px;
    }
    
    .page-subtitle {
      font-size: 16px;
      color: #606266;
      margin: 0;
    }
  }

  .navigation-card {
    border-radius: 16px;
    overflow: hidden;
    
    :deep(.el-tabs__content) {
      padding: 30px 20px;
    }
  }

  .tab-content {
    .content-card {
      border-radius: 12px;
      height: 100%;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
        
        .el-tag {
          margin-left: auto;
        }
      }
      
      .content-body {
        line-height: 1.6;
        
        .definition-list {
          padding-left: 20px;
          margin: 16px 0;
          
          li {
            margin-bottom: 8px;
            color: #606266;
            
            strong {
              color: #303133;
            }
          }
        }
        
        .consequence-box {
          margin-top: 20px;
        }
        
        .process-steps {
          .step {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            
            .step-number {
              width: 32px;
              height: 32px;
              background: #667eea;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              flex-shrink: 0;
            }
            
            .step-content {
              h4 {
                margin: 0 0 8px 0;
                color: #303133;
              }
              
              p {
                margin: 0;
                color: #606266;
              }
            }
          }
        }
        
        .comparison-section {
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          
          &.good {
            background: #f0f9ff;
            border: 1px solid #b3e0ff;
            
            h3 {
              color: #67c23a;
            }
          }
          
          &.bad {
            background: #fef0f0;
            border: 1px solid #fab6b6;
            
            h3 {
              color: #f56c6c;
            }
          }
          
          h3 {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 16px 0;
            font-size: 18px;
          }
          
          ul {
            padding-left: 20px;
            
            li {
              margin-bottom: 12px;
              color: #303133;
            }
          }
        }
        
        .citation-examples {
          margin-top: 30px;
          
          h3 {
            margin: 0 0 20px 0;
            color: #303133;
          }
          
          .format-example {
            h4 {
              margin: 0 0 12px 0;
              color: #606266;
              font-size: 16px;
            }
            
            .example {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 6px;
              font-family: monospace;
              margin-bottom: 8px;
              color: #303133;
            }
            
            .example-text {
              color: #606266;
              font-size: 14px;
              margin-bottom: 20px;
            }
          }
        }
      }
    }
    
    .sidebar-card {
      border-radius: 12px;
      height: fit-content;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
      }
      
      .checklist {
        .checklist-item {
          padding: 12px 0;
          border-bottom: 1px solid #f0f2f5;
          
          &:last-child {
            border-bottom: none;
          }
          
          &.checked {
            :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
              background-color: #67c23a;
              border-color: #67c23a;
            }
          }
        }
      }
    }
    
    .personal-guide {
      .personal-content {
        .advice-section {
          margin-bottom: 30px;
          
          h3 {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 2px solid #f0f2f5;
          }
          
          .advice-item {
            background: #fef0f0;
            border: 1px solid #fab6b6;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            
            &.positive {
              background: #f0f9ff;
              border-color: #b3e0ff;
            }
            
            .area-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              
              .similarity-rate {
                font-weight: 700;
                font-size: 18px;
                color: #f56c6c;
                
                &.good {
                  color: #67c23a;
                }
              }
            }
            
            .area-issue {
              color: #303133;
              margin-bottom: 12px;
              font-weight: 500;
            }
            
            .area-suggestion {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              color: #606266;
              line-height: 1.5;
              
              .el-icon {
                margin-top: 3px;
                color: #409eff;
              }
            }
          }
          
          .tips-list {
            .tip-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 16px;
              background: #f8f9fa;
              border-radius: 8px;
              margin-bottom: 12px;
              
              .el-icon {
                color: #67c23a;
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
    }
    
    .resource-card {
      border-radius: 12px;
      height: fit-content;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
      }
      
      .resources {
        .resource-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background: #f0f2f5;
            transform: translateX(4px);
          }
          
          .resource-icon {
            font-size: 24px;
          }
          
          .resource-info {
            flex: 1;
            
            .resource-title {
              font-weight: 500;
              color: #303133;
              margin-bottom: 4px;
            }
            
            .resource-type {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
    
    .case-card {
      border-radius: 12px;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
        
        .el-tag {
          margin-left: auto;
        }
      }
      
      .case-content {
        .case-description {
          margin-bottom: 20px;
          
          h4 {
            margin: 0 0 8px 0;
            color: #303133;
          }
          
          p {
            color: #606266;
            line-height: 1.5;
          }
        }
        
        .case-example {
          margin-bottom: 20px;
          
          h4 {
            margin: 0 0 12px 0;
            color: #303133;
          }
          
          .example-content {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            
            .quote {
              font-style: italic;
              margin: 0 0 16px 0;
              color: #303133;
              line-height: 1.6;
            }
            
            .citation {
              text-align: right;
              color: #606266;
              font-size: 14px;
              
              &.warning {
                color: #f56c6c;
                font-weight: 500;
              }
            }
          }
        }
        
        .case-analysis {
          h4 {
            margin: 0 0 12px 0;
            color: #303133;
          }
          
          ul {
            padding-left: 20px;
            
            li {
              margin-bottom: 8px;
              color: #606266;
            }
          }
        }
      }
    }
    
    .contact-card {
      border-radius: 12px;
      height: fit-content;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
      }
      
      .contact-content {
        p {
          color: #606266;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        
        .contact-methods {
          .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 12px;
            
            .el-icon {
              color: #409eff;
            }
            
            span {
              color: #303133;
            }
          }
        }
        
        .contact-button {
          width: 100%;
          margin-top: 20px;
        }
      }
    }
  }

  :deep(.el-collapse) {
    .el-collapse-item__header {
      font-size: 16px;
      font-weight: 500;
      padding: 20px;
      
      .el-icon {
        margin-right: 12px;
        color: #409eff;
      }
    }
    
    .el-collapse-item__wrap {
      border-bottom: 1px solid #e4e7ed;
    }
    
    .el-collapse-item__content {
      padding: 20px;
      
      .faq-answer {
        p {
          color: #606266;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        
        .faq-example {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          
          h4 {
            margin: 0 0 8px 0;
            color: #303133;
          }
          
          p {
            margin: 0;
            color: #606266;
            font-style: italic;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .academic-integrity-page {
    padding: 12px;
    
    .page-header {
      .page-title {
        font-size: 24px;
      }
    }
    
    .comparison-section {
      .el-col {
        width: 100%;
        margin-bottom: 20px;
      }
    }
    
    .process-steps {
      .step {
        flex-direction: column;
        text-align: center;
      }
    }
  }
}
</style>