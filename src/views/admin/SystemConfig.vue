<template>
  <div class="system-config">
    <!-- 页面头部 -->
    <PageHeader description="管理系统各项配置参数和运行设置">
      <template #actions>
        <el-button type="primary" :icon="Refresh" @click="refreshConfig">
          刷新配置
        </el-button>
        <el-button v-if="userStore.isSuperAdmin" type="success" :icon="Check" @click="savePerformanceConfig" :loading="saving">
          保存性能配置
        </el-button>
      </template>
    </PageHeader>

    <!-- 配置导航 -->
    <el-card class="nav-card" shadow="never">
      <el-steps :active="activeTab" finish-status="success" simple>
        <el-step title="性能配置" @click="activeTab = 0"></el-step>
        <el-step title="时间节点" @click="activeTab = 1"></el-step>
      </el-steps>
    </el-card>

    <!-- 配置内容区 -->
    <el-row :gutter="16">
      <!-- 左侧配置表单 -->
      <el-col :span="16">
        <el-card class="config-card" shadow="never">
          <div v-show="activeTab === 0" class="config-tab">
            <h3 class="tab-title">性能配置</h3>
            <el-alert
              v-if="!userStore.isSuperAdmin"
              type="info"
              :closable="false"
              show-icon
              title="性能配置仅超级管理员可修改保存，当前账号只读"
              class="config-alert"
            />
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
        <div v-show="activeTab === 1" class="config-tab-container">
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
              <h4>性能配置说明</h4>
              <ul>
                <li><strong>并发数</strong>：根据服务器配置调整，一般设为 CPU 核心数×2</li>
                <li><strong>缓存策略</strong>：LRU 适合大多数场景</li>
                <li><strong>自动清理</strong>：建议开启，避免磁盘空间不足</li>
                <li><strong>仅超级管理员</strong>：修改保存需要超级管理员权限</li>
              </ul>
            </div>

            <div v-show="activeTab === 1" class="help-content">
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

        <!-- 数据备份 -->
        <el-card class="backup-card" shadow="never" style="margin-top: 1rem">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Upload /></el-icon>
                数据备份
              </span>
            </div>
          </template>

          <div class="backup-settings">
            <el-form label-width="110px" size="default">
              <el-form-item label="自动备份">
                <el-switch v-model="backupSettingsForm.enabled" @change="saveBackupSettings" />
                <span class="setting-hint" style="margin-left: 0.5rem">{{ backupSettingsForm.enabled ? '每天凌晨2:00执行' : '已禁用' }}</span>
              </el-form-item>
              <el-form-item label="保留天数">
                <el-input-number
                  v-model="backupSettingsForm.retentionDays"
                  :min="7"
                  :max="365"
                  :step="7"
                  @change="saveBackupSettings"
                />
                <span class="setting-hint" style="margin-left: 0.5rem">超过天数的备份文件自动清理</span>
              </el-form-item>
            </el-form>
          </div>

          <el-divider />

          <div class="backup-actions">
            <el-button type="primary" @click="triggerDbBackup" :loading="backingUp">
              立即备份
            </el-button>
            <el-button @click="exportConfig">
              导出配置
            </el-button>
          </div>
          <div class="backup-info">
            <p>上次备份：{{ lastBackupTime }}</p>
            <p>备份目录：{{ backupDir }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入管理员 API
import {
  getSystemConfig,
  updatePerformanceConfig,
  exportConfig as exportApiConfig,
  getDeadlinesConfig,
  updateDeadlinesConfig
} from '@/api/admin/config'
import { triggerBackup, getBackupStatus, getBackupSettings, updateBackupSettings as updateBackupSettingsApi } from '@/api/admin/backup'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 图标导入
import {
  Refresh, Check, QuestionFilled, Upload
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

// 响应式数据
const activeTab = ref(0)
const saving = ref(false)
const backingUp = ref(false)
const exporting = ref(false)

// 配置数据
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

const lastBackupTime = ref('暂无')
const backupDir = ref('—')
const backupSettingsForm = reactive({ enabled: true, retentionDays: 30 })
let backupSettingsLoaded = false

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 方法
const refreshConfig = async () => {
  try {
    ElMessage.info('正在刷新配置...')
    const response = await getSystemConfig()
    Object.assign(performanceConfig, response.data.performanceConfig || {})
    await loadDeadlinesConfig()
    ElMessage.success('配置刷新成功')
  } catch (error) {
    console.error('刷新配置失败:', error)
    ElMessage.error('配置刷新失败')
  }
}

// 性能配置写操作后端仅开放给 SUPER_ADMIN（PUT /api/admin/config/performance @PreAuthorize），
// 保存按钮已按角色显隐，这里不再重复依赖后端 403 兜底
const savePerformanceConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要保存性能配置更改吗？',
      '保存配置',
      {
        confirmButtonText: '确定保存',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    saving.value = true
    await updatePerformanceConfig(performanceConfig)
    ElMessage.success('性能配置保存成功')
    saving.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存性能配置失败:', error)
      ElMessage.error('性能配置保存失败')
    }
    saving.value = false
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

const exportConfig = async () => {
  exporting.value = true
  try {
    const response = await exportApiConfig()
    
    // 创建下载链接
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/json' })
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

const triggerDbBackup = async () => {
  backingUp.value = true
  try {
    const response = await triggerBackup()
    if (response.code === 200) {
      const result = response.data
      if (result.status === 'SUCCESS') {
        ElMessage.success(`备份成功: ${result.fileName}`)
      } else {
        ElMessage.warning(result.message || '备份未正常完成')
      }
    } else {
      ElMessage.error(response.message || '备份失败')
    }
    await loadBackupStatus()
  } catch {
    ElMessage.error('备份请求失败')
  } finally {
    backingUp.value = false
  }
}

const loadBackupStatus = async () => {
  try {
    const [statusRes, settingsRes] = await Promise.all([
      getBackupStatus(),
      getBackupSettings()
    ])
    if (statusRes.code === 200) {
      const data = statusRes.data
      if (data.lastBackup) {
        lastBackupTime.value = formatDateTime(data.lastBackup.endTime || data.lastBackup.createTime)
      }
      backupDir.value = data.backupDir || '—'
    }
    if (settingsRes.code === 200 && !backupSettingsLoaded) {
      backupSettingsForm.enabled = settingsRes.data.enabled != null ? settingsRes.data.enabled : true
      backupSettingsForm.retentionDays = settingsRes.data.retentionDays || 30
      backupSettingsLoaded = true
    }
  } catch {
    // silently fail for backup status, not critical
  }
}

const saveBackupSettings = async () => {
  try {
    await updateBackupSettingsApi({
      enabled: backupSettingsForm.enabled,
      retentionDays: backupSettingsForm.retentionDays
    })
  } catch {
    // silently fail
  }
}

// 生命周期
onMounted(() => {
  // 加载配置数据（内部含时间节点）
  refreshConfig()
  // 加载备份状态
  loadBackupStatus()
})
</script>

<style lang="scss" scoped>
.system-config {
  min-height: 100vh;
  background: var(--apple-canvas-parchment); // Slate-50
  color: var(--apple-ink); // Slate-900
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 24px;
}

.config-alert {
  margin-bottom: 16px;
}

.nav-card {
  margin-bottom: 24px;
  background: var(--apple-surface);
  border: 1px solid var(--apple-surface-chip-translucent);
  border-radius: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--apple-surface-chip-translucent);
  }
  
  :deep(.el-card__body) {
    padding: 0;
  }
  
  :deep(.el-steps) {
    .el-step {
      cursor: pointer;
      
      &:hover {
        .el-step__title {
          color: var(--apple-primary); // Blue-500
        }
      }
    }
  }
}

.config-card {
  background: var(--apple-surface);
  border: 1px solid var(--apple-surface-chip-translucent);
  border-radius: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--apple-surface-chip-translucent);
  }
  
  :deep(.el-card__body) {
    padding: 24px;
  }
  
  .config-tab {
    .tab-title {
      margin: 0 0 24px 0;
      font-size: 1.25rem;
      color: var(--apple-ink); // Slate-900
      padding-bottom: 12px;
      border-bottom: 2px solid var(--apple-surface-chip-translucent);
    }
    
    .config-form {
      :deep(.el-form-item) {
        margin-bottom: 24px;
        
        .el-form-item__label {
          font-weight: 400;
          color: var(--apple-ink-secondary); // Slate-500
        }
        
        .el-input,
        .el-select,
        .el-date-picker {
          width: 100%;
          
          :deep(.el-input__wrapper) {
            border-radius: 8px;
            border: 1px solid var(--apple-surface-chip-translucent);
            transition: all 0.2s ease;
            
            &:hover {
              border-color: var(--apple-surface-chip-translucent);
              /* box-shadow removed for Apple HIG */
            }
          }
          
          :deep(.el-select__wrapper) {
            border-radius: 8px;
            border: 1px solid var(--apple-surface-chip-translucent);
            transition: all 0.2s ease;
            
            &:hover {
              border-color: var(--apple-surface-chip-translucent);
              /* box-shadow removed for Apple HIG */
            }
          }
        }
        
        .el-button {
          border-radius: 8px;
          transition: all 0.2s ease;
          border: 1px solid var(--apple-surface-chip-translucent);
          
          &:hover {
            border-color: var(--apple-ink-secondary);
          }
        }
      }
      
      .form-tip {
        font-size: 0.875rem;
        color: var(--apple-ink-secondary); // Slate-400
        margin-top: 4px;
        line-height: 1.4;
      }
      
      .unit {
        margin-left: 8px;
        color: var(--apple-ink-secondary); // Slate-400
        font-size: 0.875rem;
      }
    }
  }
}

.help-card {
  background: #f9f9fb;
  border: 1px solid #e5e5ea;
  border-radius: 14px;
  transition: all 0.2s ease;

  :deep(.el-card__header) {
    padding: 12px 18px;
    border-bottom: 1px solid #e5e5ea;
    background: transparent;

    .card-header .card-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: #6e6e73;
      .el-icon { margin-right: 6px; color: var(--apple-ink-secondary); }
    }
  }

  :deep(.el-card__body) {
    padding: 14px 18px;
  }
}

.backup-card {
  background: var(--apple-surface);
  border: 1px solid var(--apple-surface-chip-translucent);
  border-radius: 18px;
  border-top: 3px solid var(--apple-primary);
  transition: all 0.2s ease;

  :deep(.el-card__header) {
    padding: 16px 20px 12px;
    border-bottom: none;
    background: transparent;

    .card-header .card-title {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 1rem;
      color: var(--apple-ink);
      .el-icon { margin-right: 8px; color: var(--apple-primary); }
    }
  }

  :deep(.el-card__body) {
    padding: 0 20px 20px;
  }
}

.config-help {
  .help-content {
    h4 {
      margin: 0 0 10px 0;
      color: #6e6e73;
      font-size: 0.875rem;
    }
    ul {
      padding-left: 18px;
      margin: 0;
      li {
        margin-bottom: 6px;
        line-height: 1.5;
        font-size: 0.8rem;
        color: var(--apple-ink-secondary);
        strong { color: #515154; }
      }
    }
  }
}
.backup-settings {
  margin-bottom: 0.5rem;

  .setting-hint {
    font-size: 0.8rem;
    color: var(--apple-ink-secondary);
  }
}

.backup-actions {
  display: flex;
  gap: 0.75rem;

  .el-button {
    border-radius: 8px;
  }
}

.backup-info {
  p {
    margin: 4px 0;
    font-size: 0.875rem;
    color: var(--apple-ink-secondary); // Slate-400
  }
}

.config-tab-container {
  margin-top: 24px;
}

@media (max-width: 768px) {
  .system-config {
    padding: 16px;
  }
  
  :deep(.el-row) {
    flex-direction: column;
    
    .el-col {
      width: 100% !important;
      margin-bottom: 16px;
    }
  }
  
  .config-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }
  
  .backup-actions {
    .el-button {
      margin-bottom: 8px;
    }
  }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.system-config {
  padding: var(--apple-spacing-lg);
  font-family: var(--apple-font-text);
}

.config-alert {
  margin-bottom: var(--apple-spacing-md);
}

.nav-card,
.config-card,
.backup-card {
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
}

.nav-card {
  margin-bottom: var(--apple-spacing-lg);
}

.config-card {
  :deep(.el-card__body) {
    padding: var(--apple-spacing-lg);
  }

  .config-tab {
    .tab-title {
      margin-bottom: var(--apple-spacing-lg);
      padding-bottom: var(--apple-spacing-sm);
      border-bottom: 1px solid var(--apple-hairline);
      font-size: var(--apple-fs-tagline);
      font-family: var(--apple-font-display);
    }

    .config-form {
      :deep(.el-form-item) {
        margin-bottom: var(--apple-spacing-md);
      }

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper) {
        border: 1px solid var(--apple-hairline);
        border-radius: var(--apple-rounded-md);
      }

      .form-tip {
        margin-top: var(--apple-spacing-xxs);
        font-size: var(--apple-fs-fine-print);
      }

      .unit {
        margin-left: var(--apple-spacing-xs);
        font-size: var(--apple-fs-fine-print);
      }
    }
  }
}

.help-card {
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
  background: var(--apple-surface-pearl);

  :deep(.el-card__header) {
    padding: var(--apple-spacing-sm) var(--apple-spacing-md);
    border-bottom: 1px solid var(--apple-hairline);

    .card-header .card-title {
      font-size: var(--apple-fs-caption);

      .el-icon {
        margin-right: var(--apple-spacing-xxs);
      }
    }
  }

  :deep(.el-card__body) {
    padding: var(--apple-spacing-md);
  }
}

.backup-card {
  :deep(.el-card__header) {
    padding: var(--apple-spacing-md) var(--apple-spacing-md) var(--apple-spacing-sm);

    .card-header .card-title {
      font-size: var(--apple-fs-body-strong);

      .el-icon {
        margin-right: var(--apple-spacing-xs);
      }
    }
  }

  :deep(.el-card__body) {
    padding: 0 var(--apple-spacing-md) var(--apple-spacing-md);
  }
}

.config-help .help-content {
  h4 {
    margin-bottom: var(--apple-spacing-xs);
    font-size: var(--apple-fs-caption);
  }

  ul li {
    margin-bottom: var(--apple-spacing-xxs);
    font-size: var(--apple-fs-fine-print);
  }
}

.backup-settings {
  margin-bottom: var(--apple-spacing-xs);

  .setting-hint {
    font-size: var(--apple-fs-fine-print);
  }
}

.backup-actions {
  gap: var(--apple-spacing-sm);
}

.backup-info p {
  margin: var(--apple-spacing-xxs) 0;
  font-size: var(--apple-fs-caption);
}

.config-tab-container {
  margin-top: var(--apple-spacing-lg);
}

@media (max-width: 768px) {
  .system-config {
    padding: var(--apple-spacing-sm);
  }

  :deep(.el-row) .el-col {
    margin-bottom: var(--apple-spacing-sm);
  }

  .config-card :deep(.el-card__body) {
    padding: var(--apple-spacing-sm);
  }
}
</style>