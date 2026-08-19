<template>
  <div class="system-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">系统配置</h1>
        <p class="page-desc">管理系统各项配置参数和运行设置</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshConfig">
          刷新配置
        </el-button>
        <el-button type="success" :icon="Check" @click="saveAllConfig" :loading="saving">
          保存全部
        </el-button>
      </div>
    </div>

    <!-- 配置导航 -->
    <el-card class="nav-card" shadow="never">
      <el-steps :active="activeTab" finish-status="success" simple>
        <el-step title="基础配置" @click="activeTab = 0"></el-step>
        <el-step title="查重配置" @click="activeTab = 1"></el-step>
        <el-step title="安全配置" @click="activeTab = 2"></el-step>
        <el-step title="邮件配置" @click="activeTab = 3"></el-step>
        <el-step title="性能配置" @click="activeTab = 4"></el-step>
        <el-step title="时间节点" @click="activeTab = 5"></el-step>
      </el-steps>
    </el-card>

    <!-- 配置内容区 -->
    <el-row :gutter="16">
      <!-- 左侧配置表单 -->
      <el-col :span="16">
        <el-card class="config-card" shadow="never">
          <div v-show="activeTab === 0" class="config-tab">
            <h3 class="tab-title">基础配置</h3>
            <el-form :model="basicConfig" label-width="120px" class="config-form">
              <el-form-item label="系统名称">
                <el-input v-model="basicConfig.systemName" placeholder="请输入系统名称"></el-input>
              </el-form-item>
              <el-form-item label="系统版本">
                <el-input v-model="basicConfig.version" disabled></el-input>
              </el-form-item>
              <el-form-item label="默认语言">
                <el-select v-model="basicConfig.defaultLanguage" style="width: 100%">
                  <el-option label="中文" value="zh-CN"></el-option>
                  <el-option label="English" value="en-US"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="时区设置">
                <el-select v-model="basicConfig.timezone" style="width: 100%">
                  <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai"></el-option>
                  <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo"></el-option>
                  <el-option label="纽约时间 (UTC-5)" value="America/New_York"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="维护模式">
                <el-switch v-model="basicConfig.maintenanceMode"></el-switch>
                <div class="form-tip">开启后系统将暂停对外服务</div>
              </el-form-item>
              <el-form-item label="维护公告">
                <el-input 
                  v-model="basicConfig.maintenanceNotice" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="维护期间的公告信息"
                  :disabled="!basicConfig.maintenanceMode"
                ></el-input>
              </el-form-item>
            </el-form>
          </div>

          <div v-show="activeTab === 1" class="config-tab">
            <h3 class="tab-title">查重配置</h3>
            <el-form :model="plagiarismConfig" label-width="140px" class="config-form">
              <el-form-item label="校内查重阈值">
                <el-slider 
                  v-model="plagiarismConfig.internalThreshold" 
                  :min="0" 
                  :max="100" 
                  show-input
                  show-stops
                  :marks="thresholdMarks"
                ></el-slider>
                <div class="form-tip">超过此阈值将标记为高重复率</div>
              </el-form-item>
              <el-form-item label="第三方查重阈值">
                <el-slider 
                  v-model="plagiarismConfig.thirdPartyThreshold" 
                  :min="0" 
                  :max="100" 
                  show-input
                  show-stops
                ></el-slider>
                <div class="form-tip">第三方查重的预警阈值</div>
              </el-form-item>
              <el-form-item label="查重算法">
                <el-radio-group v-model="plagiarismConfig.algorithm">
                  <el-radio label="cosine">余弦相似度</el-radio>
                  <el-radio label="jaccard">Jaccard系数</el-radio>
                  <el-radio label="combined">组合算法</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="最小匹配长度">
                <el-input-number 
                  v-model="plagiarismConfig.minMatchLength" 
                  :min="5" 
                  :max="50"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">字符</span>
              </el-form-item>
              <el-form-item label="查重缓存时间">
                <el-input-number 
                  v-model="plagiarismConfig.cacheHours" 
                  :min="1" 
                  :max="168"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">小时</span>
                <div class="form-tip">相同论文在缓存期内不会重复查重</div>
              </el-form-item>
            </el-form>
          </div>

          <div v-show="activeTab === 2" class="config-tab">
            <h3 class="tab-title">安全配置</h3>
            <el-form :model="securityConfig" label-width="140px" class="config-form">
              <el-form-item label="密码最小长度">
                <el-input-number 
                  v-model="securityConfig.passwordMinLength" 
                  :min="6" 
                  :max="32"
                  controls-position="right"
                ></el-input-number>
              </el-form-item>
              <el-form-item label="密码复杂度">
                <el-checkbox-group v-model="securityConfig.passwordRequirements">
                  <el-checkbox label="uppercase">大写字母</el-checkbox>
                  <el-checkbox label="lowercase">小写字母</el-checkbox>
                  <el-checkbox label="numbers">数字</el-checkbox>
                  <el-checkbox label="special">特殊字符</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="登录失败锁定">
                <el-switch v-model="securityConfig.loginLockEnabled"></el-switch>
              </el-form-item>
              <el-form-item label="最大失败次数" v-if="securityConfig.loginLockEnabled">
                <el-input-number 
                  v-model="securityConfig.maxFailedAttempts" 
                  :min="1" 
                  :max="10"
                  controls-position="right"
                ></el-input-number>
              </el-form-item>
              <el-form-item label="锁定时长" v-if="securityConfig.loginLockEnabled">
                <el-input-number 
                  v-model="securityConfig.lockDuration" 
                  :min="1" 
                  :max="1440"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">分钟</span>
              </el-form-item>
              <el-form-item label="会话超时时间">
                <el-input-number 
                  v-model="securityConfig.sessionTimeout" 
                  :min="5" 
                  :max="1440"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">分钟</span>
              </el-form-item>
              <el-form-item label="IP访问限制">
                <el-switch v-model="securityConfig.ipRestriction"></el-switch>
                <div class="form-tip">限制特定IP地址访问系统</div>
              </el-form-item>
            </el-form>
          </div>

          <div v-show="activeTab === 3" class="config-tab">
            <h3 class="tab-title">邮件配置</h3>
            <el-form :model="emailConfig" label-width="120px" class="config-form">
              <el-form-item label="SMTP服务器">
                <el-input v-model="emailConfig.smtpServer" placeholder="smtp.example.com"></el-input>
              </el-form-item>
              <el-form-item label="SMTP端口">
                <el-input-number 
                  v-model="emailConfig.smtpPort" 
                  :min="1" 
                  :max="65535"
                  controls-position="right"
                ></el-input-number>
              </el-form-item>
              <el-form-item label="加密方式">
                <el-radio-group v-model="emailConfig.encryption">
                  <el-radio label="none">无加密</el-radio>
                  <el-radio label="ssl">SSL</el-radio>
                  <el-radio label="tls">TLS</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="发件人邮箱">
                <el-input v-model="emailConfig.senderEmail" placeholder="sender@example.com"></el-input>
              </el-form-item>
              <el-form-item label="发件人名称">
                <el-input v-model="emailConfig.senderName" placeholder="系统名称"></el-input>
              </el-form-item>
              <el-form-item label="测试连接">
                <el-button type="primary" @click="testEmailConnection" :loading="testingEmail">
                  测试邮件发送
                </el-button>
                <div class="form-tip">发送测试邮件验证配置是否正确</div>
              </el-form-item>
            </el-form>
          </div>

          <div v-show="activeTab === 4" class="config-tab">
            <h3 class="tab-title">性能配置</h3>
            <el-form :model="performanceConfig" label-width="140px" class="config-form">
              <el-form-item label="最大并发数">
                <el-slider 
                  v-model="performanceConfig.maxConcurrent" 
                  :min="1" 
                  :max="100" 
                  show-input
                  show-stops
                ></el-slider>
                <div class="form-tip">同时处理的最大请求数</div>
              </el-form-item>
              <el-form-item label="查重队列大小">
                <el-input-number 
                  v-model="performanceConfig.queueSize" 
                  :min="10" 
                  :max="1000"
                  controls-position="right"
                ></el-input-number>
                <div class="form-tip">等待查重的任务队列容量</div>
              </el-form-item>
              <el-form-item label="缓存策略">
                <el-radio-group v-model="performanceConfig.cacheStrategy">
                  <el-radio label="lru">LRU缓存</el-radio>
                  <el-radio label="fifo">FIFO缓存</el-radio>
                  <el-radio label="ttl">TTL缓存</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="缓存大小">
                <el-input-number 
                  v-model="performanceConfig.cacheSize" 
                  :min="100" 
                  :max="10000"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">MB</span>
              </el-form-item>
              <el-form-item label="自动清理">
                <el-switch v-model="performanceConfig.autoCleanup"></el-switch>
                <div class="form-tip">定期清理过期缓存和临时文件</div>
              </el-form-item>
              <el-form-item label="清理周期" v-if="performanceConfig.autoCleanup">
                <el-input-number 
                  v-model="performanceConfig.cleanupInterval" 
                  :min="1" 
                  :max="168"
                  controls-position="right"
                ></el-input-number>
                <span class="unit">小时</span>
              </el-form-item>
            </el-form>
          </div>
        </el-card>

    <!-- 时间节点配置 -->
    <div v-show="activeTab === 5" class="config-tab-container">
      <el-card class="config-card" shadow="never">
        <h3 class="tab-title">时间节点配置</h3>
        <el-form :model="deadlinesConfig" label-width="140px" class="config-form">
          <el-form-item label="论文提交截止">
            <el-date-picker
              v-model="deadlinesConfig.submissionDeadline"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
            <div class="form-tip">学生论文提交的最终截止时间</div>
          </el-form-item>
          
          <el-form-item label="审核截止">
            <el-date-picker
              v-model="deadlinesConfig.reviewDeadline"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
            <div class="form-tip">导师完成论文审核的截止时间</div>
          </el-form-item>
          
          <el-form-item label="答辩时间">
            <el-date-picker
              v-model="deadlinesConfig.defenseDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
            <div class="form-tip">论文答辩的开始时间</div>
          </el-form-item>
          
          <el-form-item label="预计毕业时间">
            <el-date-picker
              v-model="deadlinesConfig.graduationDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
            <div class="form-tip">学生预计毕业的时间</div>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveDeadlinesConfig" :loading="savingDeadlines">
              保存时间节点配置
            </el-button>
            <el-button @click="resetDeadlinesConfig">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
      </el-col>

      <!-- 右侧配置说明 -->
      <el-col :span="8">
        <el-card class="help-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><QuestionFilled /></el-icon>
                配置说明
              </span>
            </div>
          </template>
          
          <div class="config-help">
            <div v-show="activeTab === 0" class="help-content">
              <h4>基础配置说明</h4>
              <ul>
                <li><strong>系统名称</strong>：显示在页面标题和邮件中的系统名称</li>
                <li><strong>维护模式</strong>：开启后只有管理员可以访问系统</li>
                <li><strong>时区设置</strong>：影响所有时间显示和日志记录的时间戳</li>
              </ul>
            </div>
            
            <div v-show="activeTab === 1" class="help-content">
              <h4>查重配置说明</h4>
              <ul>
                <li><strong>阈值设置</strong>：建议校内查重设为20-30%，第三方查重设为15-25%</li>
                <li><strong>算法选择</strong>：组合算法准确率最高但性能消耗较大</li>
                <li><strong>缓存时间</strong>：建议设置24-48小时以平衡性能和准确性</li>
              </ul>
            </div>
            
            <div v-show="activeTab === 2" class="help-content">
              <h4>安全配置说明</h4>
              <ul>
                <li><strong>密码要求</strong>：建议至少包含大小写字母和数字</li>
                <li><strong>登录锁定</strong>：防止暴力破解攻击</li>
                <li><strong>会话超时</strong>：建议设置30-60分钟</li>
              </ul>
            </div>
            
            <div v-show="activeTab === 3" class="help-content">
              <h4>邮件配置说明</h4>
              <ul>
                <li><strong>SMTP设置</strong>：需要联系邮件服务商获取配置信息</li>
                <li><strong>加密方式</strong>：现代邮件服务通常使用TLS加密</li>
                <li><strong>测试功能</strong>：修改配置后务必测试连接</li>
              </ul>
            </div>
                      
            <div v-show="activeTab === 4" class="help-content">
              <h4>性能配置说明</h4>
              <ul>
                <li><strong>并发数</strong>：根据服务器配置调整，一般设为 CPU 核心数×2</li>
                <li><strong>缓存策略</strong>：LRU 适合大多数场景</li>
                <li><strong>自动清理</strong>：建议开启，避免磁盘空间不足</li>
              </ul>
            </div>
                      
            <div v-show="activeTab === 5" class="help-content">
              <h4>时间节点配置说明</h4>
              <ul>
                <li><strong>论文提交截止</strong>：学生必须在此日期前提交论文</li>
                <li><strong>审核截止</strong>：导师必须在此日期前完成审核</li>
                <li><strong>答辩时间</strong>：论文答辩的开始日期</li>
                <li><strong>预计毕业</strong>：学生预计毕业的日期</li>
                <li><strong>修改生效</strong>：保存后立即生效，学生会看到更新后的倒计时</li>
              </ul>
            </div>
          </div>
        </el-card>

        <!-- 配置备份 -->
        <el-card class="backup-card" shadow="never" style="margin-top: 1rem">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Upload /></el-icon>
                配置备份
              </span>
            </div>
          </template>
          
          <div class="backup-actions">
            <el-button type="primary" @click="exportConfig" :loading="exporting">
              导出配置
            </el-button>
            <el-button @click="importConfig">
              导入配置
            </el-button>
            <el-button type="warning" @click="resetConfig">
              恢复默认
            </el-button>
          </div>
          <div class="backup-info">
            <p>上次备份：{{ lastBackupTime }}</p>
            <p>配置版本：{{ configVersion }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入管理员 API
import { 
  getSystemConfig,
  updateBasicConfig,
  updatePlagiarismConfig,
  updateSecurityConfig,
  updateEmailConfig,
  updatePerformanceConfig,
  saveAllConfig as saveAllApiConfig,
  testEmailConfig as testEmailApi,
  exportConfig as exportApiConfig,
  resetDefaultConfig,
  getDeadlinesConfig,
  updateDeadlinesConfig
} from '@/api/admin/config'


// 图标导入
import {
  Refresh, Check, QuestionFilled, Upload
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref(0)
const saving = ref(false)
const testingEmail = ref(false)
const exporting = ref(false)

// 配置数据
const basicConfig = reactive({
  systemName: '论文查重管理系统',
  version: 'v2.1.0',
  defaultLanguage: 'zh-CN',
  timezone: 'Asia/Shanghai',
  maintenanceMode: false,
  maintenanceNotice: '系统维护中，请稍后再试...'
})

const plagiarismConfig = reactive({
  internalThreshold: 25,
  thirdPartyThreshold: 20,
  algorithm: 'combined',
  minMatchLength: 15,
  cacheHours: 48
})

const securityConfig = reactive({
  passwordMinLength: 8,
  passwordRequirements: ['uppercase', 'lowercase', 'numbers'],
  loginLockEnabled: true,
  maxFailedAttempts: 5,
  lockDuration: 30,
  sessionTimeout: 60,
  ipRestriction: false
})

const emailConfig = reactive({
  smtpServer: 'smtp.example.com',
  smtpPort: 587,
  encryption: 'tls',
  senderEmail: 'noreply@example.com',
  senderName: '论文查重系统'
})

const performanceConfig = reactive({
  maxConcurrent: 20,
  queueSize: 100,
  cacheStrategy: 'lru',
  cacheSize: 1024,
  autoCleanup: true,
  cleanupInterval: 24
})

const deadlinesConfig = reactive({
  submissionDeadline: '',
  reviewDeadline: '',
  defenseDate: '',
  graduationDate: ''
})

const savingDeadlines = ref(false)

// 计算属性
const thresholdMarks = computed(() => ({
  0: '0%',
  20: '低',
  50: '中',
  80: '高',
  100: '100%'
}))

const lastBackupTime = ref('2024-01-15 14:30:25')
const configVersion = ref('2.1.0-20240115')

// 方法
const refreshConfig = async () => {
  try {
    ElMessage.info('正在刷新配置...')
    const response = await getSystemConfig()
    
    // 更新各个配置项
    Object.assign(basicConfig, response.data.basicConfig || {})
    Object.assign(plagiarismConfig, response.data.plagiarismConfig || {})
    Object.assign(securityConfig, response.data.securityConfig || {})
    Object.assign(emailConfig, response.data.emailConfig || {})
    Object.assign(performanceConfig, response.data.performanceConfig || {})
    
    ElMessage.success('配置刷新成功')
  } catch (error) {
    console.error('刷新配置失败:', error)
    ElMessage.error('配置刷新失败')
  }
}

const saveAllConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要保存所有配置更改吗？',
      '保存配置',
      {
        confirmButtonText: '确定保存',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    saving.value = true
    
    // 并行保存所有配置
    await Promise.all([
      updateBasicConfig(basicConfig),
      updatePlagiarismConfig(plagiarismConfig),
      updateSecurityConfig(securityConfig),
      updateEmailConfig(emailConfig),
      updatePerformanceConfig(performanceConfig)
    ])
    
    // 调用保存全部接口，传递所有配置数据
    const allConfigData = {
      basicConfig: { ...basicConfig },
      plagiarismConfig: { ...plagiarismConfig },
      securityConfig: { ...securityConfig },
      emailConfig: { ...emailConfig },
      performanceConfig: { ...performanceConfig }
    }
    await saveAllApiConfig(allConfigData)
    ElMessage.success('配置保存成功')
    saving.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存配置失败:', error)
      ElMessage.error('配置保存失败')
    }
    saving.value = false
  }
}

const testEmailConnection = async () => {
  if (!validateEmailConfig()) return
  
  testingEmail.value = true
  try {
    const response = await testEmailApi(emailConfig.senderEmail)
    ElMessage.success('邮件发送测试成功')
  } catch (error) {
    console.error('邮件测试失败:', error)
    ElMessage.error('邮件发送测试失败：' + (error.message || '未知错误'))
  } finally {
    testingEmail.value = false
  }
}

// 时间节点配置方法
const loadDeadlinesConfig = async () => {
  try {
    const response = await getDeadlinesConfig()
    if (response.code === 200 && response.data) {
      deadlinesConfig.submissionDeadline = response.data.submissionDeadline || ''
      deadlinesConfig.reviewDeadline = response.data.reviewDeadline || ''
      deadlinesConfig.defenseDate = response.data.defenseDate || ''
      deadlinesConfig.graduationDate = response.data.graduationDate || ''
    }
  } catch (error) {
    console.error('加载时间节点配置失败:', error)
  }
}

const saveDeadlinesConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要保存时间节点配置吗？',
      '保存配置',
      {
        confirmButtonText: '确定保存',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    savingDeadlines.value = true
    
    await updateDeadlinesConfig({
      submissionDeadline: deadlinesConfig.submissionDeadline,
      reviewDeadline: deadlinesConfig.reviewDeadline,
      defenseDate: deadlinesConfig.defenseDate,
      graduationDate: deadlinesConfig.graduationDate
    })
    
    ElMessage.success('时间节点配置保存成功')
    savingDeadlines.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存时间节点配置失败:', error)
      ElMessage.error('保存时间节点配置失败')
    }
    savingDeadlines.value = false
  }
}

const resetDeadlinesConfig = () => {
  loadDeadlinesConfig()
  ElMessage.info('已重置为上次保存的配置')
}

const validateEmailConfig = () => {
  if (!emailConfig.smtpServer) {
    ElMessage.warning('请输入SMTP服务器地址')
    return false
  }
  if (!emailConfig.senderEmail) {
    ElMessage.warning('请输入发件人邮箱')
    return false
  }
  return true
}

const exportConfig = async () => {
  exporting.value = true
  try {
    const response = await exportApiConfig()
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('配置导出成功')
    lastBackupTime.value = new Date().toLocaleString('zh-CN')
  } catch (error) {
    console.error('导出配置失败:', error)
    ElMessage.error('配置导出失败')
  } finally {
    exporting.value = false
  }
}

const importConfig = () => {
  ElMessage.info('配置导入功能开发中...')
}

const resetConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复所有配置到默认值吗？此操作不可恢复。',
      '恢复默认配置',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await resetDefaultConfig()
    ElMessage.success('配置已恢复到默认值')
    refreshConfig() // 重新加载默认配置
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复默认配置失败:', error)
      ElMessage.error('恢复默认配置失败')
    }
  }
}

// 生命周期
onMounted(() => {
  // 加载配置数据
  refreshConfig()
  // 加载时间节点配置
  loadDeadlinesConfig()
})
</script>

<style lang="scss" scoped>
.system-config {
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

.nav-card {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  
  :deep(.el-card__body) {
    padding: 0;
  }
  
  :deep(.el-steps) {
    .el-step {
      cursor: pointer;
      
      &:hover {
        .el-step__title {
          color: #667eea;
        }
      }
    }
  }
}

.config-card {
  border-radius: 12px;
  
  :deep(.el-card__body) {
    padding: 1.5rem;
  }
  
  .config-tab {
    .tab-title {
      margin: 0 0 1.5rem 0;
      font-size: 1.25rem;
      color: #2c3e50;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f1f2f6;
    }
    
    .config-form {
      :deep(.el-form-item) {
        margin-bottom: 1.5rem;
        
        .el-form-item__label {
          font-weight: 500;
          color: #5a6c7d;
        }
      }
      
      .form-tip {
        font-size: 0.875rem;
        color: #7f8c8d;
        margin-top: 0.25rem;
        line-height: 1.4;
      }
      
      .unit {
        margin-left: 0.5rem;
        color: #7f8c8d;
        font-size: 0.875rem;
      }
    }
  }
}

.help-card,
.backup-card {
  border-radius: 12px;
  
  :deep(.el-card__header) {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f1f2f6;
    
    .card-header {
      display: flex;
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

.config-help {
  .help-content {
    h4 {
      margin: 0 0 0.75rem 0;
      color: #2c3e50;
      font-size: 1rem;
    }
    
    ul {
      padding-left: 1.25rem;
      margin: 0;
      
      li {
        margin-bottom: 0.5rem;
        line-height: 1.5;
        color: #5a6c7d;
        
        strong {
          color: #2c3e50;
        }
      }
    }
  }
}

.backup-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  .el-button {
    width: 100%;
  }
}

.backup-info {
  p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
    color: #7f8c8d;
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
  
  :deep(.el-row) {
    flex-direction: column;
    
    .el-col {
      width: 100% !important;
      margin-bottom: 1rem;
    }
  }
  
  .config-card {
    :deep(.el-card__body) {
      padding: 1rem;
    }
  }
  
  .backup-actions {
    .el-button {
      margin-bottom: 0.5rem;
    }
  }
}
</style>

<style lang="scss" scoped>
.system-config {
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