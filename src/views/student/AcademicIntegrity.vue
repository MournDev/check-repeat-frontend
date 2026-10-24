<template>
  <div class="academic-integrity-page">
    <!-- 页面头部 -->
    <PageHeader description="提升学术素养，规范引用行为" />

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
                          <h3><el-icon color="var(--app-color-success)"><SuccessFilled /></el-icon> 合理引用</h3>
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
                          <h3><el-icon color="var(--app-color-danger)"><CircleClose /></el-icon> 抄袭行为</h3>
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
                      <h3><el-icon color="var(--app-color-danger)"><Warning /></el-icon> 需要重点关注的章节</h3>
                      <div 
                        v-for="(area, index) in personalAdvice.highRiskAreas" 
                        :key="index"
                        class="advice-item"
                      >
                        <div class="area-header">
                          <el-tag type="danger">{{ area.section }}</el-tag>
                          <span class="similarity-rate">{{ formatPercent(area.similarity) }}</span>
                        </div>
                        <div class="area-issue">{{ area.issue }}</div>
                        <div class="area-suggestion">
                          <el-icon><Lightning /></el-icon>
                          {{ area.suggestion }}
                        </div>
                      </div>
                    </div>
                    
                    <div class="advice-section good-aspects">
                      <h3><el-icon color="var(--app-color-success)"><SuccessFilled /></el-icon> 表现良好的方面</h3>
                      <div 
                        v-for="(aspect, index) in personalAdvice.goodAspects" 
                        :key="index"
                        class="advice-item positive"
                      >
                        <div class="area-header">
                          <el-tag type="success">{{ aspect.section }}</el-tag>
                          <span class="similarity-rate good">{{ formatPercent(aspect.similarity) }}</span>
                        </div>
                        <div class="area-issue">{{ aspect.strength }}</div>
                        <div class="area-suggestion">
                          <el-icon><Star /></el-icon>
                          {{ aspect.encouragement }}
                        </div>
                      </div>
                    </div>
                    
                    <div class="advice-section general-tips">
                      <h3><el-icon color="var(--app-color-primary)"><InfoFilled /></el-icon> 通用改进建议</h3>
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
                      <p v-html="sanitizeHtml(faq.answer)"></p>
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
import { sanitizeHtml } from '@/utils/markdown'
import { formatPercent } from '@/utils/dataType.js'
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
  ChatLineSquare, Phone, Message, Reading, Link, VideoPlay, School
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

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
      citationChecklist.value = checklistRes.data || []
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
    if (resource.url) {
      window.open(resource.url, '_blank')
    } else {
      ElMessage.warning(`资源"${resource.title}"暂无可用链接`)
    }
  } catch (error) {
    ElMessage.error('打开资源失败')
  }
}

const getResourceColor = (type) => {
  const colors = {
    book: 'var(--app-color-success)',
    online: 'var(--app-color-primary)',
    video: 'var(--app-color-warning)',
    document: 'var(--app-color-info)',
    course: 'var(--app-color-primary)'
  }
  return colors[type] || 'var(--app-color-info)'
}

const getResourceIcon = (type) => {
  // 值为组件对象（非字符串名）：全局图标注册已移除，字符串无法解析
  const icons = {
    book: Reading,
    online: Link,
    video: VideoPlay,
    document: Document,
    course: School
  }
  return icons[type] || Document
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

  .navigation-card,
  .content-card,
  .sidebar-card,
  .case-card,
  .contact-card {
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-lg);
  }

  .navigation-card {
    overflow: hidden;
    
    :deep(.el-tabs__content) {
      padding: var(--app-space-6) var(--app-space-4);
    }
  }

  .tab-content {
    .content-card {
      height: 100%;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        font-family: var(--app-font-family);
        font-size: var(--app-fs-body);
        font-weight: 600;
        color: var(--app-color-ink);
        
        .el-tag {
          margin-left: auto;
        }
      }
      
      .content-body {
        line-height: 1.6;
        
        .definition-list {
          padding-left: var(--app-space-4);
          margin: var(--app-space-3) 0;
          
          li {
            margin-bottom: var(--app-space-2);
            font-size: var(--app-fs-caption);
            color: var(--app-color-text-muted);
            
            strong {
              color: var(--app-color-ink);
            }
          }
        }
        
        .consequence-box {
          margin-top: var(--app-space-4);
        }
        
        .process-steps {
          .step {
            display: flex;
            gap: var(--app-space-3);
            margin-bottom: var(--app-space-4);
            padding: var(--app-space-4);
            background: var(--app-color-fill);
            border-radius: var(--app-radius-md);
            
            .step-number {
              width: 32px;
              height: 32px;
              background: var(--app-color-primary);
              color: var(--app-color-on-primary);
              border-radius: var(--app-radius-pill);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: var(--app-fs-caption);
              font-weight: 600;
              flex-shrink: 0;
            }
            
            .step-content {
              h4 {
                margin: 0 0 var(--app-space-2) 0;
                font-size: var(--app-fs-caption);
                color: var(--app-color-ink);
              }
              
              p {
                margin: 0;
                font-size: var(--app-fs-caption);
                color: var(--app-color-text-muted);
              }
            }
          }
        }
        
        .comparison-section {
          padding: var(--app-space-4);
          border-radius: var(--app-radius-lg);
          margin-bottom: var(--app-space-4);
          
          &.good {
            background: var(--app-color-info-bg);
            border: 1px solid var(--app-color-info-border);
            
            h3 {
              color: var(--app-color-success);
            }
          }
          
          &.bad {
            background: var(--app-color-danger-bg);
            border: 1px solid var(--app-color-danger-border);
            
            h3 {
              color: var(--app-color-danger);
            }
          }
          
          h3 {
            display: flex;
            align-items: center;
            gap: var(--app-space-2);
            margin: 0 0 var(--app-space-3) 0;
            font-size: var(--app-fs-body);
            font-weight: 600;
          }
          
          ul {
            padding-left: var(--app-space-4);
            
            li {
              margin-bottom: var(--app-space-2);
              font-size: var(--app-fs-caption);
              color: var(--app-color-ink);
            }
          }
        }
        
        .citation-examples {
          margin-top: var(--app-space-6);
          
          h3 {
            margin: 0 0 var(--app-space-4) 0;
            font-family: var(--app-font-family);
            font-size: var(--app-fs-body);
            color: var(--app-color-ink);
          }
          
          .format-example {
            h4 {
              margin: 0 0 var(--app-space-2) 0;
              color: var(--app-color-text-muted);
              font-size: var(--app-fs-caption);
            }
            
            .example {
              background: var(--app-color-fill);
              padding: var(--app-space-3);
              border-radius: var(--app-radius-md);
              font-family: var(--app-font-mono);
              font-size: var(--app-fs-meta);
              margin-bottom: var(--app-space-2);
              color: var(--app-color-ink);
            }
            
            .example-text {
              color: var(--app-color-text-muted);
              font-size: var(--app-fs-caption);
              margin-bottom: var(--app-space-4);
            }
          }
        }
      }
    }
    
    .sidebar-card {
      height: fit-content;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        font-family: var(--app-font-family);
        font-size: var(--app-fs-body);
        font-weight: 600;
        color: var(--app-color-ink);
      }
      
      .checklist {
        .checklist-item {
          padding: var(--app-space-3) 0;
          border-bottom: 1px solid var(--app-color-divider);
          
          &:last-child {
            border-bottom: none;
          }
          
          &.checked {
            :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
              background-color: var(--app-color-success);
              border-color: var(--app-color-success);
            }
          }
        }
      }
    }
    
    .personal-guide {
      .personal-content {
        .advice-section {
          margin-bottom: var(--app-space-6);
          
          h3 {
            display: flex;
            align-items: center;
            gap: var(--app-space-2);
            margin: 0 0 var(--app-space-4) 0;
            padding-bottom: var(--app-space-3);
            border-bottom: 1px solid var(--app-color-divider);
            font-size: var(--app-fs-body);
          }
          
          .advice-item {
            background: var(--app-color-danger-bg);
            border: 1px solid var(--app-color-danger-border);
            border-radius: var(--app-radius-lg);
            padding: var(--app-space-4);
            margin-bottom: var(--app-space-3);
            
            &.positive {
              background: var(--app-color-info-bg);
              border-color: var(--app-color-info-border);
            }
            
            .area-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: var(--app-space-2);
              
              .similarity-rate {
                font-family: var(--app-font-family);
                font-weight: 600;
                font-size: var(--app-fs-body);
                color: var(--app-color-danger);
                
                &.good {
                  color: var(--app-color-success);
                }
              }
            }
            
            .area-issue {
              color: var(--app-color-ink);
              margin-bottom: var(--app-space-2);
              font-size: var(--app-fs-caption);
              font-weight: 600;
            }
            
            .area-suggestion {
              display: flex;
              align-items: flex-start;
              gap: var(--app-space-2);
              font-size: var(--app-fs-caption);
              color: var(--app-color-text-muted);
              line-height: 1.5;
              
              .el-icon {
                margin-top: 3px;
                color: var(--app-color-primary);
              }
            }
          }
          
          .tips-list {
            .tip-item {
              display: flex;
              align-items: flex-start;
              gap: var(--app-space-3);
              padding: var(--app-space-4);
              background: var(--app-color-fill);
              border-radius: var(--app-radius-md);
              margin-bottom: var(--app-space-3);
              
              .el-icon {
                color: var(--app-color-success);
                margin-top: 3px;
              }
              
              span {
                flex: 1;
                font-size: var(--app-fs-caption);
                color: var(--app-color-ink);
                line-height: 1.5;
              }
            }
          }
        }
      }
    }
    
    .resource-card {
      border-radius: var(--app-radius-lg);
      height: fit-content;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        font-family: var(--app-font-family);
        font-size: var(--app-fs-body);
        font-weight: 600;
        color: var(--app-color-ink);
      }
      
      .resources {
        .resource-item {
          display: flex;
          align-items: center;
          gap: var(--app-space-3);
          padding: var(--app-space-4);
          border-radius: var(--app-radius-md);
          margin-bottom: var(--app-space-3);
          cursor: pointer;
          transition: border-color var(--app-transition-slow), background-color var(--app-transition-slow);
          
          &:hover {
            background: var(--app-color-fill);
          }

          &:active {
            transform: scale(0.95);
          }
          
          .resource-icon {
            font-size: var(--app-fs-title);
          }
          
          .resource-info {
            flex: 1;
            
            .resource-title {
              font-size: var(--app-fs-caption);
              font-weight: 600;
              color: var(--app-color-ink);
              margin-bottom: var(--app-space-1);
            }
            
            .resource-type {
              font-size: var(--app-fs-meta);
              color: var(--app-color-text-muted);
            }
          }
        }
      }
    }
    
    .case-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        font-family: var(--app-font-family);
        font-size: var(--app-fs-body);
        font-weight: 600;
        color: var(--app-color-ink);
        
        .el-tag {
          margin-left: auto;
        }
      }
      
      .case-content {
        .case-description {
          margin-bottom: var(--app-space-4);
          
          h4 {
            margin: 0 0 var(--app-space-2) 0;
            color: var(--app-color-ink);
          }
          
          p {
            font-size: var(--app-fs-caption);
            color: var(--app-color-text-muted);
            line-height: 1.5;
          }
        }
        
        .case-example {
          margin-bottom: var(--app-space-4);
          
          h4 {
            margin: 0 0 var(--app-space-2) 0;
            color: var(--app-color-ink);
          }
          
          .example-content {
            background: var(--app-color-fill);
            border-radius: var(--app-radius-md);
            padding: var(--app-space-4);
            
            .quote {
              font-style: italic;
              margin: 0 0 var(--app-space-3) 0;
              font-size: var(--app-fs-caption);
              color: var(--app-color-ink);
              line-height: 1.6;
            }
            
            .citation {
              text-align: right;
              color: var(--app-color-text-muted);
              font-size: var(--app-fs-meta);
              
              &.warning {
                color: var(--app-color-danger);
                font-weight: 600;
              }
            }
          }
        }
        
        .case-analysis {
          h4 {
            margin: 0 0 var(--app-space-2) 0;
            color: var(--app-color-ink);
          }
          
          ul {
            padding-left: var(--app-space-4);
            
            li {
              margin-bottom: var(--app-space-2);
              font-size: var(--app-fs-caption);
              color: var(--app-color-text-muted);
            }
          }
        }
      }
    }
    
    .contact-card {
      height: fit-content;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        font-family: var(--app-font-family);
        font-size: var(--app-fs-body);
        font-weight: 600;
        color: var(--app-color-ink);
      }
      
      .contact-content {
        p {
          color: var(--app-color-text-muted);
          margin-bottom: var(--app-space-4);
          font-size: var(--app-fs-caption);
          line-height: 1.5;
        }
        
        .contact-methods {
          .contact-item {
            display: flex;
            align-items: center;
            gap: var(--app-space-3);
            padding: var(--app-space-3);
            background: var(--app-color-fill);
            border-radius: var(--app-radius-md);
            margin-bottom: var(--app-space-3);
            
            .el-icon {
              color: var(--app-color-primary);
            }
            
            span {
              font-size: var(--app-fs-caption);
              color: var(--app-color-ink);
            }
          }
        }
        
        .contact-button {
          width: 100%;
          margin-top: var(--app-space-5);
        }
      }
    }
  }

  :deep(.el-collapse) {
    .el-collapse-item__header {
      font-size: var(--app-fs-caption);
      font-weight: 600;
      padding: var(--app-space-4);
      
      .el-icon {
        margin-right: var(--app-space-3);
        color: var(--app-color-primary);
      }
    }
    
    .el-collapse-item__wrap {
      border-bottom: 1px solid var(--app-color-border);
    }
    
    .el-collapse-item__content {
      padding: var(--app-space-4);
      
      .faq-answer {
        p {
          color: var(--app-color-text-muted);
          font-size: var(--app-fs-caption);
          line-height: 1.6;
          margin-bottom: var(--app-space-4);
        }
        
        .faq-example {
          background: var(--app-color-fill);
          border-radius: var(--app-radius-md);
          padding: var(--app-space-4);
          margin-top: var(--app-space-3);
          
          h4 {
            margin: 0 0 var(--app-space-2) 0;
            color: var(--app-color-ink);
          }
          
          p {
            margin: 0;
            color: var(--app-color-text-muted);
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
    .comparison-section {
      .el-col {
        width: 100%;
        margin-bottom: var(--app-space-5);
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
