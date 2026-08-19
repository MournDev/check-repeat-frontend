<template>
  <div class="help-center-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">帮助中心</h1>
      <p class="page-desc">获取论文提交、查重、审核等相关帮助</p>
    </div>

    <!-- 搜索框 -->
    <el-card class="search-card" shadow="never">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索帮助文档，如：如何提交论文？"
        :prefix-icon="Search"
        size="large"
        clearable
        @input="filterHelpContent"
      />
    </el-card>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧导航 -->
      <el-col :xs="24" :sm="8" :lg="6">
        <el-card class="nav-card" shadow="hover">
          <el-menu
            :default-active="activeCategory"
            class="help-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="beginner">
              <el-icon><User /></el-icon>
              <span>新手指南</span>
            </el-menu-item>
            <el-menu-item index="submit">
              <el-icon><Upload /></el-icon>
              <span>论文提交</span>
            </el-menu-item>
            <el-menu-item index="check">
              <el-icon><Search /></el-icon>
              <span>查重说明</span>
            </el-menu-item>
            <el-menu-item index="review">
              <el-icon><Document /></el-icon>
              <span>审核流程</span>
            </el-menu-item>
            <el-menu-item index="faq">
              <el-icon><QuestionFilled /></el-icon>
              <span>常见问题</span>
            </el-menu-item>
            <el-menu-item index="contact">
              <el-icon><Service /></el-icon>
              <span>联系我们</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧内容 -->
      <el-col :xs="24" :sm="16" :lg="18">
        <!-- 新手指南 -->
        <div v-show="activeCategory === 'beginner'" class="help-content">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><User /></el-icon>
                <span>新手指南</span>
              </div>
            </template>
            
            <el-timeline>
              <el-timeline-item timestamp="第 1 步" placement="top" size="large">
                <el-card>
                  <h4>注册账号</h4>
                  <p>使用学号和身份证号注册个人账号</p>
                  <el-image 
                    src="/images/help/register.png" 
                    fit="cover"
                    class="guide-image"
                  />
                </el-card>
              </el-timeline-item>
              
              <el-timeline-item timestamp="第 2 步" placement="top" size="large">
                <el-card>
                  <h4>完善个人信息</h4>
                  <p>填写学院、专业、班级等基本信息</p>
                </el-card>
              </el-timeline-item>
              
              <el-timeline-item timestamp="第 3 步" placement="top" size="large">
                <el-card>
                  <h4>提交论文</h4>
                  <p>上传论文文件并填写相关信息</p>
                </el-card>
              </el-timeline-item>
              
              <el-timeline-item timestamp="第 4 步" placement="top" size="large">
                <el-card>
                  <h4>等待分配导师</h4>
                  <p>系统会自动分配指导老师</p>
                </el-card>
              </el-timeline-item>
              
              <el-timeline-item timestamp="第 5 步" placement="top" size="large">
                <el-card>
                  <h4>查看审核结果</h4>
                  <p>在"我的论文"中查看审核状态和导师反馈</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>

        <!-- 论文提交 -->
        <div v-show="activeCategory === 'submit'" class="help-content">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Upload /></el-icon>
                <span>论文提交指南</span>
              </div>
            </template>
            
            <el-collapse accordion>
              <el-collapse-item title="支持的文件格式有哪些？" name="1">
                <div class="guide-content">
                  <el-alert 
                    title="支持的格式：PDF、DOC、DOCX" 
                    type="info" 
                    :closable="false" 
                    show-icon 
                  />
                  <p style="margin-top: 12px;">
                    建议使用 PDF 格式，可以保证排版不变形。文件大小不超过 50MB。
                  </p>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="如何提交论文？" name="2">
                <div class="guide-content">
                  <ol>
                    <li>进入"论文提交"页面</li>
                    <li>点击上传区域或拖拽文件到上传框</li>
                    <li>填写论文标题、摘要等信息</li>
                    <li>选择论文类型（本科/硕士/博士）</li>
                    <li>点击"提交"按钮</li>
                  </ol>
                  <el-image 
                    src="/images/help/submit-flow.png" 
                    fit="contain"
                    class="guide-image"
                  />
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="提交后可以修改吗？" name="3">
                <div class="guide-content">
                  <el-alert 
                    title="提交后如需修改，可申请撤回或申请修改" 
                    type="warning" 
                    :closable="false" 
                    show-icon 
                  />
                  <ul style="margin-top: 12px;">
                    <li><strong>撤回：</strong>论文待审核前可申请撤回，撤回后可直接修改重新提交</li>
                    <li><strong>申请修改：</strong>已通过审核的论文需申请修改，说明原因后由导师审批</li>
                  </ul>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="提交次数有限制吗？" name="4">
                <div class="guide-content">
                  <p>每篇论文最多提交 <strong>5 个版本</strong>，请谨慎操作。</p>
                  <p>建议每次提交前仔细检查，避免重复提交。</p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>

        <!-- 查重说明 -->
        <div v-show="activeCategory === 'check'" class="help-content">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Search /></el-icon>
                <span>查重系统说明</span>
              </div>
            </template>
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="检测范围">
                学术期刊、学位论文、会议论文、网络资源等
              </el-descriptions-item>
              <el-descriptions-item label="检测语言">
                中文、英文及其他小语种
              </el-descriptions-item>
              <el-descriptions-item label="检测时间">
                一般 10-30 分钟，高峰期可能延长
              </el-descriptions-item>
              <el-descriptions-item label="合格标准">
                本科≤30%，硕士≤20%，博士≤10%（仅供参考，以学校要求为准）
              </el-descriptions-item>
              <el-descriptions-item label="报告内容">
                总文字复制比、去除引用复制比、章节复制比、相似文献列表
              </el-descriptions-item>
            </el-descriptions>
            
            <div class="tips-section">
              <h4>降低重复率的方法：</h4>
              <ul>
                <li>用自己的话复述原文观点</li>
                <li>适当增加原创性分析</li>
                <li>规范引用格式</li>
                <li>对图表进行重新绘制</li>
                <li>调整句式结构和段落顺序</li>
              </ul>
            </div>
          </el-card>
        </div>

        <!-- 审核流程 -->
        <div v-show="activeCategory === 'review'" class="help-content">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>审核流程说明</span>
              </div>
            </template>
            
            <el-steps direction="vertical" :active="3">
              <el-step 
                title="提交成功" 
                description="论文提交后进入待分配状态"
                status="finish"
              />
              <el-step 
                title="分配导师" 
                description="系统根据专业方向自动分配指导老师"
                status="finish"
              />
              <el-step 
                title="导师审核" 
                description="导师对论文进行评审并提出修改意见"
                status="process"
              />
              <el-step 
                title="审核通过" 
                description="审核通过后可参加答辩"
                status="wait"
              />
            </el-steps>
            
            <div class="review-tips">
              <h4>审核时间说明：</h4>
              <p>一般情况下，导师会在 <strong>3-5 个工作日</strong>内完成审核。</p>
              <p>如遇高峰期（如毕业季），审核时间可能延长至 7-10 个工作日。</p>
            </div>
          </el-card>
        </div>

        <!-- 常见问题 -->
        <div v-show="activeCategory === 'faq'" class="help-content">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><QuestionFilled /></el-icon>
                <span>常见问题 FAQ</span>
              </div>
            </template>
            
            <el-collapse accordion>
              <el-collapse-item title="忘记密码怎么办？" name="1">
                <p>可在登录页面点击"忘记密码"，通过注册时预留的邮箱重置密码。</p>
              </el-collapse-item>
              
              <el-collapse-item title="论文提交失败怎么办？" name="2">
                <p>可能原因：</p>
                <ul>
                  <li>文件格式不支持 → 转换为 PDF/DOC/DOCX 格式</li>
                  <li>文件过大 → 压缩至 50MB 以内</li>
                  <li>网络问题 → 检查网络连接后重试</li>
                </ul>
              </el-collapse-item>
              
              <el-collapse-item title="查重报告在哪里查看？" name="3">
                <p>进入"我的论文"页面，找到对应论文，点击"查看报告"即可查看详细的查重报告。</p>
              </el-collapse-item>
              
              <el-collapse-item title="相似度多少算合格？" name="4">
                <p>不同学历层次要求不同：</p>
                <ul>
                  <li>本科生：一般≤30%</li>
                  <li>硕士研究生：一般≤20%</li>
                  <li>博士研究生：一般≤10%</li>
                </ul>
                <p><em>具体标准请以学校最新文件为准</em></p>
              </el-collapse-item>
              
              <el-collapse-item title="如何联系导师？" name="5">
                <p>在"师生互动"页面可以看到导师的联系方式和留言功能。</p>
              </el-collapse-item>
              
              <el-collapse-item title="系统支持手机访问吗？" name="6">
                <p>系统已做响应式设计，支持手机、平板等移动设备访问。</p>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>

        <!-- 联系我们 -->
        <div v-show="activeCategory === 'contact'" class="help-content">
          <el-card class="content-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Service /></el-icon>
                <span>联系我们</span>
              </div>
            </template>
            
            <el-result icon="success" title="技术支持" sub-title="工作日 9:00-18:00 在线服务">
              <template #extra>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="联系电话">
                    400-XXX-XXXX
                  </el-descriptions-item>
                  <el-descriptions-item label="客服邮箱">
                    support@example.com
                  </el-descriptions-item>
                  <el-descriptions-item label="QQ 群">
                    123456789
                  </el-descriptions-item>
                  <el-descriptions-item label="办公地址">
                    XX 大学信息中心 X 楼
                  </el-descriptions-item>
                </el-descriptions>
                
                <div class="feedback-section">
                  <h4>问题反馈</h4>
                  <p>如果您遇到任何问题，请扫描下方二维码加入 QQ 群咨询：</p>
                  <el-image 
                    src="/images/help/qq-group.png" 
                    fit="contain"
                    class="qr-code"
                  />
                </div>
              </template>
            </el-result>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, User, Upload, Document, QuestionFilled, Service } from '@element-plus/icons-vue'

const activeCategory = ref('beginner')
const searchKeyword = ref('')

const handleMenuSelect = (index) => {
  activeCategory.value = index
}

const filterHelpContent = () => {
  // TODO: 实现搜索功能
  console.log('搜索关键词:', searchKeyword.value)
}
</script>

<style lang="scss" scoped>
.help-center-page {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf9 100%);
}

.page-header {
  margin-bottom: 24px;
  
  .page-title {
    margin: 0 0 8px 0;
    font-size: 2rem;
    color: #2c3e50;
  }
  
  .page-desc {
    margin: 0;
    color: #7f8c8d;
    font-size: 1rem;
  }
}

.search-card {
  margin-bottom: 20px;
  border-radius: 12px;
  
  :deep(.el-input__wrapper) {
    padding: 12px 16px;
  }
}

.main-content {
  .nav-card {
    border-radius: 12px;
    
    .help-menu {
      border-right: none;
      
      .el-menu-item {
        height: 50px;
        line-height: 50px;
        border-radius: 8px;
        margin-bottom: 8px;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.is-active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
      }
    }
  }
  
  .content-card {
    border-radius: 12px;
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #2c3e50;
      
      .el-icon {
        font-size: 1.25rem;
      }
    }
    
    .guide-content {
      ol, ul {
        margin: 12px 0;
        padding-left: 24px;
        
        li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
      }
      
      p {
        line-height: 1.8;
        color: #5a6c7d;
      }
    }
    
    .guide-image {
      width: 100%;
      max-width: 600px;
      margin: 16px 0;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
    
    .tips-section, .review-tips {
      margin-top: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      
      h4 {
        margin-bottom: 12px;
        color: #2c3e50;
      }
      
      ul {
        padding-left: 20px;
        
        li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
      }
    }
    
    .feedback-section {
      margin-top: 24px;
      text-align: center;
      
      h4 {
        margin-bottom: 16px;
      }
      
      .qr-code {
        width: 200px;
        height: 200px;
        margin-top: 16px;
      }
    }
  }
}

@media (max-width: 768px) {
  .main-content {
    .nav-card {
      margin-bottom: 16px;
    }
  }
}
</style>
