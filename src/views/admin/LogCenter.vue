<template>
  <div class="log-center">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">日志中心</h1>
        <p class="page-desc">操作审计、登录记录与备份历史</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshLogs">刷新数据</el-button>
        <el-button :icon="Download" @click="exportLogs">导出日志</el-button>
        <el-button type="danger" :icon="Delete" @click="handleCleanExpired">清理过期日志</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="log-tabs" @tab-change="onTabChange">
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
                <el-select v-model="operationFilters.userType" placeholder="用户类型" clearable style="width: 120px">
                  <el-option label="学生" value="STUDENT" />
                  <el-option label="教师" value="TEACHER" />
                  <el-option label="管理员" value="ADMIN" />
                  <el-option label="super_admin" value="SUPER_ADMIN" />
                </el-select>
                <el-select v-model="operationFilters.module" placeholder="功能模块" clearable style="width: 140px" @change="onModuleChange">
                  <el-option
                    v-for="m in operationModules"
                    :key="m.value"
                    :label="m.label"
                    :value="m.value"
                  />
                </el-select>
                <el-select v-model="operationFilters.operationType" placeholder="操作类型" clearable filterable style="width: 180px">
                  <el-option
                    v-for="op in filteredOperationTypes"
                    :key="op.value"
                    :label="op.label"
                    :value="op.value"
                  />
                </el-select>
                <el-input v-model="operationFilters.keyword" placeholder="搜索用户/描述" clearable style="width: 180px" @keyup.enter="loadOperationLogs" />
                <el-button type="primary" :icon="Search" @click="loadOperationLogs">查询</el-button>
                <el-button @click="resetOperationFilters">重置</el-button>
              </div>
            </div>
          </template>

          <el-table :data="operationLogs" style="width: 100%" v-loading="operationLoading" stripe @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="operationTime" label="操作时间" min-width="170">
              <template #default="{ row }">{{ formatDate(row.operationTime) }}</template>
            </el-table-column>
            <el-table-column prop="userName" label="操作用户" min-width="120" />
            <el-table-column prop="userType" label="用户类型" min-width="100">
              <template #default="{ row }">
                <el-tag :type="getUserTypeTag(row.userType)" size="small">{{ getUserTypeName(row.userType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operationType" label="操作类型" min-width="160">
              <template #default="{ row }">
                <el-tag size="small" :type="getOperationTag(row.operationType)">{{ getOperationName(row.operationType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="操作描述" min-width="180" show-overflow-tooltip />
            <el-table-column prop="ipAddress" label="IP地址" min-width="140" />
            <el-table-column prop="status" label="状态" min-width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="详情" width="80" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click="viewLogDetail(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-footer" v-if="selectedRows.length > 0">
            <span class="selected-count">已选 {{ selectedRows.length }} 项</span>
            <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
          </div>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="operationPagination.pageNum"
              v-model:page-size="operationPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="operationPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadOperationLogs"
              @current-change="loadOperationLogs"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 登录日志 -->
      <el-tab-pane label="登录日志" name="login">
        <el-card shadow="never">
          <template #header>
            <div class="tab-header">
              <div class="header-filters">
                <el-date-picker
                  v-model="loginFilters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 240px"
                />
                <el-input v-model="loginFilters.username" placeholder="用户名" clearable style="width: 140px" />
                <el-input v-model="loginFilters.ip" placeholder="IP地址" clearable style="width: 140px" />
                <el-button type="primary" :icon="Search" @click="loadLoginLogs">查询</el-button>
                <el-button @click="resetLoginFilters">重置</el-button>
                <el-button :icon="Download" @click="exportLoginLogData">导出</el-button>
              </div>
            </div>
          </template>

          <el-table :data="loginLogs" style="width: 100%" v-loading="loginLoading" stripe>
            <el-table-column prop="loginTime" label="登录时间" min-width="170">
              <template #default="{ row }">{{ formatDate(row.loginTime) }}</template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="loginIp" label="登录IP" min-width="140" />
            <el-table-column prop="loginLocation" label="登录地点" min-width="140" />
            <el-table-column prop="loginDevice" label="登录设备" min-width="140" show-overflow-tooltip />
            <el-table-column prop="loginResult" label="登录结果" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.loginResult === 1 ? 'success' : 'danger'" size="small">
                  {{ row.loginResult === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="failReason" label="失败原因" min-width="150" show-overflow-tooltip />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="loginPagination.pageNum"
              v-model:page-size="loginPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="loginPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadLoginLogs"
              @current-change="loadLoginLogs"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 备份记录 -->
      <el-tab-pane label="备份记录" name="backup">
        <el-card shadow="never">
          <el-table :data="backupRecords" style="width: 100%" v-loading="backupLoading" stripe>
            <el-table-column prop="createTime" label="备份时间" min-width="170">
              <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
            </el-table-column>
            <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
            <el-table-column prop="fileSize" label="文件大小" width="100">
              <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column prop="backupType" label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.backupType === 'AUTO' ? 'info' : 'warning'" size="small">
                  {{ row.backupType === 'AUTO' ? '自动' : '手动' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="durationMs" label="耗时" width="90">
              <template #default="{ row }">{{ row.durationMs ? (row.durationMs / 1000).toFixed(1) + 's' : '—' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'SUCCESS' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="errorMessage" label="错误信息" min-width="160" show-overflow-tooltip />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="backupPagination.pageNum"
              v-model:page-size="backupPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="backupPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadBackupRecords"
              @current-change="loadBackupRecords"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 统计分析 -->
      <el-tab-pane label="统计分析" name="statistics">
        <!-- 统计卡片 -->
        <div class="stats-row">
          <el-card shadow="never" class="stat-card">
            <div class="stat-value">{{ logStats.totalCount || 0 }}</div>
            <div class="stat-label">总操作数</div>
          </el-card>
          <el-card shadow="never" class="stat-card">
            <div class="stat-value success">{{ logStats.successCount || 0 }}</div>
            <div class="stat-label">成功操作</div>
          </el-card>
          <el-card shadow="never" class="stat-card">
            <div class="stat-value danger">{{ logStats.failCount || 0 }}</div>
            <div class="stat-label">失败操作</div>
          </el-card>
          <el-card shadow="never" class="stat-card">
            <div class="stat-value primary">{{ logStats.dailyAvg || 0 }}</div>
            <div class="stat-label">日均操作</div>
          </el-card>
        </div>

        <div class="charts-row">
          <!-- 热门操作 TOP10 -->
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">热门操作 TOP10</span>
                <el-select v-model="statsDays" style="width: 100px" size="small" @change="loadStatsData">
                  <el-option label="最近7天" :value="7" />
                  <el-option label="最近30天" :value="30" />
                </el-select>
              </div>
            </template>
            <el-table :data="hotOperations" style="width: 100%" stripe size="small">
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="operationType" label="操作类型" min-width="160">
                <template #default="{ row }">{{ getOperationName(row.operationType) || row.operationType }}</template>
              </el-table-column>
              <el-table-column prop="count" label="操作次数" width="100" align="center" />
              <el-table-column label="占比" width="120">
                <template #default="{ row }">
                  <el-progress :percentage="calcPercent(row.count, hotOperationsTotal)" :stroke-width="6" :show-text="false" />
                  <span class="percent-text">{{ calcPercent(row.count, hotOperationsTotal) }}%</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 用户活跃度 TOP10 -->
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="card-title">用户活跃度 TOP10</span>
            </template>
            <el-table :data="userActivity" style="width: 100%" stripe size="small">
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="userName" label="用户" min-width="120" />
              <el-table-column prop="userType" label="类型" width="80">
                <template #default="{ row }">
                  <el-tag :type="getUserTypeTag(row.userType)" size="small">{{ getUserTypeName(row.userType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="count" label="操作次数" width="100" align="center" />
            </el-table>
          </el-card>
        </div>

        <!-- 模块使用率 -->
        <el-card shadow="never" class="module-card">
          <template #header>
            <span class="card-title">模块使用率</span>
          </template>
          <div ref="moduleChartRef" class="chart-container"></div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="操作日志详情" width="600px">
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="操作时间">{{ formatDate(currentLog.operationTime) }}</el-descriptions-item>
          <el-descriptions-item label="操作用户">{{ currentLog.userName }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">{{ getUserTypeName(currentLog.userType) }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ getOperationName(currentLog.operationType) }}</el-descriptions-item>
          <el-descriptions-item label="操作描述">{{ currentLog.description }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'">
              {{ currentLog.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLog.requestParams" label="请求参数">
            <span style="word-break: break-all; font-size: 0.875rem;">{{ currentLog.requestParams }}</span>
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOperationLogs, exportOperationLogsNew, getLoginLogs, getOperationStatistics, getHotOperations, getUserActivity, getModuleUsage, batchDeleteLogs, cleanExpiredLogs, exportLoginLogs } from '@/api/admin/logs'
import { getBackupHistory } from '@/api/admin/backup'
import { Refresh, Download, Search, Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// ==================== 操作类型字典 ====================
const OPERATION_MODULES = [
  {
    value: 'auth', label: '用户认证',
    types: [
      { value: 'user_login', label: '用户登录' },
      { value: 'user_logout', label: '用户登出' },
      { value: 'user_register', label: '用户注册' },
      { value: 'user_change_password', label: '修改密码' },
      { value: 'user_update_info', label: '更新个人信息' },
      { value: 'user_upload_avatar', label: '上传头像' },
      { value: 'user_login_history', label: '查询登录历史' },
      { value: 'user_send_verify_email', label: '发送验证邮件' },
      { value: 'user_verify_email', label: '验证邮箱' },
      { value: 'user_send_email_code', label: '发送邮箱验证码' },
      { value: 'user_update_email', label: '更新邮箱' }
    ]
  },
  {
    value: 'student', label: '学生论文',
    types: [
      { value: 'student_paper_submit', label: '论文提交' },
      { value: 'student_paper_update', label: '论文更新' },
      { value: 'student_paper_withdraw', label: '论文撤回' },
      { value: 'student_paper_resubmit', label: '论文重新提交' },
      { value: 'student_paper_modify_request', label: '论文修改请求' },
      { value: 'student_paper_batch_delete', label: '批量删除论文' },
      { value: 'student_paper_batch_download', label: '批量下载论文' },
      { value: 'student_attachment_upload', label: '附件上传' },
      { value: 'student_attachment_delete', label: '附件删除' },
      { value: 'add_student', label: '添加学生' },
      { value: 'delete_student', label: '删除学生' },
      { value: 'batch_delete_student', label: '批量删除学生' },
      { value: 'import_students', label: '导入学生' },
      { value: 'export_students', label: '导出学生' },
      { value: 'contact_student', label: '联系学生' },
      { value: 'send_reminder', label: '发送提醒' }
    ]
  },
  {
    value: 'check', label: '查重任务',
    types: [
      { value: 'check_task_create', label: '创建查重任务' },
      { value: 'check_task_cancel', label: '取消查重任务' },
      { value: 'check_task_list', label: '查询任务列表' },
      { value: 'check_task_detail', label: '查询任务详情' },
      { value: 'check_task_by_id', label: '按ID查询任务' },
      { value: 'check_task_delete', label: '删除查重任务' },
      { value: 'check_task_recheck', label: '重新查重' },
      { value: 'check_task_batch_create', label: '批量创建任务' },
      { value: 'check_task_status', label: '查询任务状态' },
      { value: 'recheck_plagiarism', label: '重新查重检测' }
    ]
  },
  {
    value: 'teacher', label: '教师管理',
    types: [
      { value: 'teacher_allocation_create', label: '创建教师分配' },
      { value: 'teacher_allocation_revoke', label: '撤销教师分配' },
      { value: 'teacher_allocation_batch_create', label: '批量教师分配' },
      { value: 'teacher_batch_review', label: '批量审核' },
      { value: 'teacher_paper_review', label: '论文审核' },
      { value: 'teacher_change_password', label: '教师修改密码' },
      { value: 'teacher_get_info', label: '获取教师信息' },
      { value: 'teacher_update_info', label: '更新教师信息' },
      { value: 'teacher_confirm_assignment', label: '确认分配' },
      { value: 'teacher_reject_assignment', label: '拒绝分配' },
      { value: 'paper_review', label: '论文评阅' },
      { value: 'send_message', label: '发送消息' },
      { value: 'batch_send_message', label: '批量发送消息' },
      { value: 'delegate_review', label: '委托审核' },
      { value: 'assign_advisor', label: '分配导师' },
      { value: 'batch_assign_advisor', label: '批量分配导师' }
    ]
  },
  {
    value: 'admin', label: '管理员操作',
    types: [
      { value: 'admin_user_create', label: '创建用户' },
      { value: 'admin_user_update', label: '更新用户' },
      { value: 'admin_user_delete', label: '删除用户' },
      { value: 'admin_user_batch_delete', label: '批量删除用户' },
      { value: 'admin_user_password_reset', label: '重置密码' },
      { value: 'admin_user_status_update', label: '更新用户状态' },
      { value: 'admin_paper_audit', label: '论文审核' },
      { value: 'admin_paper_batch_audit', label: '批量审核论文' },
      { value: 'admin_paper_delete', label: '删除论文' },
      { value: 'admin_auto_assign', label: '自动分配' },
      { value: 'admin_manual_assign', label: '手动分配' },
      { value: 'user_assign_role', label: '分配角色' }
    ]
  },
  {
    value: 'config', label: '系统配置',
    types: [
      { value: 'config_basic_update', label: '基础配置更新' },
      { value: 'config_email_update', label: '邮件配置更新' },
      { value: 'config_performance_update', label: '性能配置更新' },
      { value: 'config_plagiarism_update', label: '查重配置更新' },
      { value: 'config_security_update', label: '安全配置更新' },
      { value: 'config_save_all', label: '保存全部配置' },
      { value: 'config_get_all', label: '获取全部配置' },
      { value: 'config_refresh', label: '刷新配置' },
      { value: 'config_reset_default', label: '恢复默认配置' },
      { value: 'config_export', label: '导出配置' },
      { value: 'config_test_email', label: '测试邮件' },
      { value: 'system_param_update', label: '系统参数更新' },
      { value: 'system_param_init', label: '初始化系统参数' },
      { value: 'system_maintenance_status', label: '维护状态切换' }
    ]
  },
  {
    value: 'rule', label: '查重规则',
    types: [
      { value: 'check_rule_create', label: '创建规则' },
      { value: 'check_rule_update', label: '更新规则' },
      { value: 'check_rule_delete', label: '删除规则' },
      { value: 'check_rule_status', label: '规则状态变更' },
      { value: 'check_rule_set_default', label: '设为默认规则' }
    ]
  },
  {
    value: 'dict', label: '字典数据',
    types: [
      { value: 'dict_data_create', label: '创建字典' },
      { value: 'dict_data_update', label: '更新字典' },
      { value: 'dict_data_delete', label: '删除字典' },
      { value: 'dict_data_batch_delete', label: '批量删除字典' }
    ]
  },
  {
    value: 'role', label: '角色权限',
    types: [
      { value: 'role_create', label: '创建角色' },
      { value: 'role_update', label: '更新角色' },
      { value: 'role_delete', label: '删除角色' },
      { value: 'role_list', label: '查询角色列表' },
      { value: 'permission_tree', label: '获取权限树' }
    ]
  },
  {
    value: 'notification', label: '消息通知',
    types: [
      { value: 'notification_paper_status', label: '论文状态通知' },
      { value: 'notification_paper_review', label: '审核结果通知' },
      { value: 'notice_read', label: '标记已读' },
      { value: 'notice_batch_read', label: '批量标记已读' },
      { value: 'notice_read_all', label: '全部标记已读' },
      { value: 'notice_delete', label: '删除通知' },
      { value: 'notice_batch_delete', label: '批量删除通知' },
      { value: 'notice_clear_all', label: '清空通知' }
    ]
  },
  {
    value: 'template', label: '消息模板',
    types: [
      { value: 'message_template_create', label: '创建模板' },
      { value: 'message_template_update', label: '更新模板' },
      { value: 'message_template_delete', label: '删除模板' },
      { value: 'message_template_status', label: '模板状态变更' }
    ]
  },
  {
    value: 'auto', label: '自动分配',
    types: [
      { value: 'auto_allocation_create', label: '创建自动分配' },
      { value: 'auto_allocation_clean', label: '清理自动分配' }
    ]
  }
]

// 构建扁平化的操作类型映射
const operationTypeMap = {}
const operationTagMap = {}
OPERATION_MODULES.forEach(m => {
  m.types.forEach(t => {
    operationTypeMap[t.value] = t.label
    const tagColors = { auth: '', student: 'primary', check: 'success', teacher: 'warning', admin: 'danger', config: 'info', rule: '', dict: 'info', role: 'warning', notification: 'success', template: '', auto: 'info' }
    operationTagMap[t.value] = tagColors[m.value] || ''
  })
})

// ==================== 响应式数据 ====================
const activeTab = ref('operation')
const operationLoading = ref(false)
const loginLoading = ref(false)
const detailDialogVisible = ref(false)
const currentLog = ref(null)

// 操作日志筛选
const operationFilters = reactive({ dateRange: [], userType: '', module: '', operationType: '', keyword: '' })
const loginFilters = reactive({ dateRange: [], username: '', ip: '' })

// 分页
const operationPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const loginPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const operationLogs = ref([])
const loginLogs = ref([])
const backupRecords = ref([])
const backupLoading = ref(false)
const backupPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

// 统计分析相关
const selectedRows = ref([])
const statsDays = ref(7)
const logStats = reactive({ totalCount: 0, successCount: 0, failCount: 0, dailyAvg: 0 })
const hotOperations = ref([])
const hotOperationsTotal = ref(0)
const userActivity = ref([])
const moduleChartRef = ref(null)
let moduleChart = null

// 模块列表
const operationModules = computed(() => OPERATION_MODULES.map(m => ({ value: m.value, label: m.label })))

// 根据选中的模块过滤操作类型
const filteredOperationTypes = computed(() => {
  if (!operationFilters.module) {
    return OPERATION_MODULES.flatMap(m => m.types)
  }
  const module = OPERATION_MODULES.find(m => m.value === operationFilters.module)
  return module ? module.types : []
})

// 模块变更时清除操作类型选择
function onModuleChange() {
  operationFilters.operationType = ''
}

function resetOperationFilters() {
  operationFilters.dateRange = []
  operationFilters.userType = ''
  operationFilters.module = ''
  operationFilters.operationType = ''
  operationFilters.keyword = ''
  operationPagination.pageNum = 1
  loadOperationLogs()
}

// ==================== 数据加载 ====================
async function refreshLogs(showMessage = true) {
  try {
    await Promise.all([
      loadOperationLogs(),
      loadLoginLogs()
    ])
    if (showMessage) ElMessage.success('数据已刷新')
  } catch {
    if (showMessage) ElMessage.error('刷新数据失败')
  }
}

function onTabChange(tab) {
  if (tab === 'login') loadLoginLogs()
  else if (tab === 'backup') loadBackupRecords()
  else if (tab === 'statistics') {
    loadStatsData()
    initModuleChart()
  }
}

async function loadBackupRecords() {
  backupLoading.value = true
  try {
    const response = await getBackupHistory({ page: backupPagination.pageNum, size: backupPagination.pageSize })
    if (response.code === 200) {
      const data = response.data
      backupRecords.value = data.records || []
      backupPagination.total = Number(data.total) || 0
    }
  } catch {
    ElMessage.error('加载备份记录失败')
  } finally {
    backupLoading.value = false
  }
}

async function loadOperationLogs() {
  operationLoading.value = true
  try {
    const params = {
      page: operationPagination.pageNum,
      size: operationPagination.pageSize,
      startDate: operationFilters.dateRange?.[0] || undefined,
      endDate: operationFilters.dateRange?.[1] || undefined,
      userType: operationFilters.userType || undefined,
      operationType: operationFilters.operationType || undefined,
      keyword: operationFilters.keyword || undefined
    }
    const response = await getOperationLogs(params)
    if (response.code === 200) {
      const data = response.data
      operationLogs.value = data.records || []
      operationPagination.total = Number(data.total) || 0
    }
  } catch {
    ElMessage.error('加载操作日志失败')
  } finally {
    operationLoading.value = false
  }
}

async function loadLoginLogs() {
  loginLoading.value = true
  try {
    const params = {
      page: loginPagination.pageNum,
      size: loginPagination.pageSize,
      startDate: loginFilters.dateRange?.[0] || undefined,
      endDate: loginFilters.dateRange?.[1] || undefined,
      username: loginFilters.username || undefined,
      ip: loginFilters.ip || undefined
    }
    const response = await getLoginLogs(params)
    if (response.code === 200) {
      const data = response.data
      loginLogs.value = data.records || []
      loginPagination.total = Number(data.total) || 0
    }
  } catch {
    ElMessage.error('加载登录日志失败')
  } finally {
    loginLoading.value = false
  }
}

function resetLoginFilters() {
  loginFilters.dateRange = []
  loginFilters.username = ''
  loginFilters.ip = ''
  loginPagination.pageNum = 1
  loadLoginLogs()
}

async function exportLoginLogData() {
  try {
    ElMessage.info('正在导出登录日志...')
    const params = {
      startDate: loginFilters.dateRange?.[0],
      endDate: loginFilters.dateRange?.[1],
      username: loginFilters.username,
      ip: loginFilters.ip
    }
    const response = await exportLoginLogs(params)
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `login-logs-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('登录日志导出成功')
  } catch {
    ElMessage.error('登录日志导出失败')
  }
}

// ==================== 操作方法 ====================
function viewLogDetail(log) {
  currentLog.value = log
  detailDialogVisible.value = true
}

async function exportLogs() {
  try {
    ElMessage.info('正在导出日志...')
    const params = {
      startDate: operationFilters.dateRange?.[0],
      endDate: operationFilters.dateRange?.[1],
      userType: operationFilters.userType,
      operationType: operationFilters.operationType,
      keyword: operationFilters.keyword
    }
    const response = await exportOperationLogsNew(params)
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `operation-logs-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('日志导出成功')
  } catch {
    ElMessage.error('日志导出失败')
  }
}

// ==================== 统计分析功能 ====================
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const calcPercent = (value, total) => {
  if (!total || total <= 0) return 0
  return Math.round((value / total) * 100)
}

const loadStatsData = async () => {
  try {
    const days = statsDays.value
    const [statsRes, hotRes, activityRes, moduleRes] = await Promise.all([
      getOperationStatistics(days),
      getHotOperations(days, 10),
      getUserActivity(days),
      getModuleUsage(days)
    ])
    if (statsRes.code === 200 && statsRes.data) {
      Object.assign(logStats, statsRes.data)
    }
    if (hotRes.code === 200 && hotRes.data) {
      hotOperations.value = hotRes.data || []
      hotOperationsTotal.value = hotRes.data.reduce((sum, item) => sum + (item.count || 0), 0)
    }
    if (activityRes.code === 200 && activityRes.data) {
      userActivity.value = activityRes.data || []
    }
    if (moduleRes.code === 200 && moduleRes.data) {
      renderModuleChart(moduleRes.data)
    }
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const renderModuleChart = (data) => {
  if (!moduleChart || !data || data.length === 0) return
  const chartData = data.map(item => ({
    name: item.moduleName || item.module || '未知',
    value: item.count || 0
  }))
  moduleChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: chartData
    }]
  })
}

const handleModuleChartResize = () => { moduleChart?.resize() }

const initModuleChart = () => {
  nextTick(() => {
    if (moduleChartRef.value) {
      moduleChart = echarts.init(moduleChartRef.value)
      window.addEventListener('resize', handleModuleChartResize)
    }
  })
}

const handleBatchDelete = async () => {
  const ids = selectedRows.value.map(r => r.id)
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条日志吗？`, '确认删除', { type: 'warning' })
    const res = await batchDeleteLogs(ids)
    if (res.code === 200) {
      ElMessage.success(res.message || '删除成功')
      selectedRows.value = []
      loadOperationLogs()
    }
  } catch {}
}

const handleCleanExpired = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入清理天数（清理N天前的日志）', '清理过期日志', {
      inputPattern: /^\d+$/,
      inputErrorMessage: '请输入有效的天数',
      inputValue: '30',
      confirmButtonText: '确认清理',
      cancelButtonText: '取消'
    })
    const days = parseInt(value)
    await ElMessageBox.confirm(`确定清理 ${days} 天前的日志吗？此操作不可恢复。`, '确认清理', { type: 'warning' })
    const res = await cleanExpiredLogs(days)
    if (res.code === 200) {
      ElMessage.success(res.message || '清理成功')
      loadOperationLogs()
    }
  } catch {}
}

// ==================== 格式化工具函数 ====================
function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

function getUserTypeName(userType) {
  const map = { 'STUDENT': '学生', 'TEACHER': '教师', 'ADMIN': '管理员', 'SUPER_ADMIN': 'super_admin' }
  return map[userType] || userType || ''
}

function getUserTypeTag(userType) {
  const map = { 'STUDENT': 'primary', 'TEACHER': 'success', 'ADMIN': 'warning' }
  return map[userType] || 'info'
}

function getOperationName(type) {
  return operationTypeMap[type] || type || ''
}

function getOperationTag(type) {
  return operationTagMap[type] || 'info'
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

// ==================== 生命周期 ====================
onMounted(() => {
  refreshLogs(false)
})

onUnmounted(() => {
  if (moduleChart) {
    moduleChart.dispose()
    moduleChart = null
  }
  window.removeEventListener('resize', handleModuleChartResize)
})
</script>

<style lang="scss" scoped>
.log-center { padding: 0; }

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
      color: #1d1d1f;
    }
    .page-desc { margin: 0; color: #86868b; font-size: 0.95rem; }
  }
  .header-actions { display: flex; gap: 0.75rem; }
}

.log-tabs {
  :deep(.el-tabs__content) { padding: 0; }
  .tab-header {
    .header-filters {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.5rem;
}

.log-detail {
  :deep(.el-descriptions__label) { width: 100px; }
}

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-value.success { color: #67C23A; }
.stat-value.danger { color: #F56C6C; }
.stat-value.primary { color: #409EFF; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.chart-card { margin-bottom: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; font-size: 15px; }
.percent-text { font-size: 12px; color: #909399; margin-left: 8px; }

.module-card { margin-bottom: 16px; }
.chart-container { width: 100%; height: 300px; }

.table-footer { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #EBEEF5; margin-top: 12px; }
.selected-count { font-size: 13px; color: #606266; }

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    .header-actions { width: 100%; .el-button { flex: 1; } }
  }
  .log-tabs .tab-header .header-filters {
    flex-direction: column;
    align-items: stretch;
    .el-date-editor, .el-select, .el-input, .el-button { width: 100% !important; }
  }
}
</style>