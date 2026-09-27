<template>
  <div :class="['user-settings', 'role-' + role.toLowerCase()]">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <p class="page-subtitle">{{ pageSubtitle }}</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Check" @click="saveSettings" size="large">
            保存设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- Student layout: left profile card + right form -->
    <el-row v-if="role === 'STUDENT'" :gutter="20" class="profile-content">
      <el-col :xs="24" :lg="8">
        <el-card class="profile-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><User /></el-icon> 个人信息</span>
              <el-button type="primary" text :icon="Edit" @click="startEditing">编辑</el-button>
            </div>
          </template>
          <div class="profile-overview">
            <div class="avatar-section">
              <el-avatar :size="80" :src="userStore.avatarSrc">{{ userStore.realName?.charAt(0) }}</el-avatar>
              <div class="avatar-actions">
                <el-button text :icon="Camera" @click="changeAvatar">更换头像</el-button>
                <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarChange" style="display:none" />
              </div>
            </div>
            <div class="user-details">
              <h3 class="user-name">{{ displayUserInfo.realName }}</h3>
              <div class="detail-item"><el-icon><User /></el-icon><span>用户名：</span><strong>{{ displayUserInfo.username }}</strong></div>
              <div class="detail-item"><el-icon><Message /></el-icon><span>邮箱：</span><strong>{{ displayUserInfo.email || '未设置' }}</strong></div>
              <div class="detail-item"><el-icon><Phone /></el-icon><span>手机：</span><strong>{{ displayUserInfo.phone || '未设置' }}</strong></div>
              <div v-if="displayUserInfo.major" class="detail-item"><el-icon><School /></el-icon><span>专业：</span><strong>{{ displayUserInfo.major }}</strong></div>
              <div v-if="displayUserInfo.collegeName" class="detail-item"><el-icon><Ticket /></el-icon><span>学院：</span><strong>{{ displayUserInfo.collegeName }}</strong></div>
              <div v-if="displayUserInfo.grade" class="detail-item"><el-icon><Calendar /></el-icon><span>年级：</span><strong>{{ displayUserInfo.grade }}</strong></div>
            </div>
          </div>
        </el-card>

        <el-card class="security-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><Lock /></el-icon> 账户安全</span>
            </div>
          </template>
          <div class="security-items">
            <div class="security-item">
              <div class="security-info">
                <el-icon><Key /></el-icon>
                <div class="security-details">
                  <div class="security-title">登录密码</div>
                  <div class="security-desc">定期更换密码有助于保护账户安全</div>
                </div>
              </div>
              <el-button type="primary" text @click="changePasswordDialog">修改</el-button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <el-icon><Message /></el-icon>
                <div class="security-details">
                  <div class="security-title">邮箱验证</div>
                  <div class="security-desc">{{ userInfo.emailVerified ? '已验证' : '未验证' }}</div>
                </div>
              </div>
              <el-button :type="userInfo.emailVerified ? 'info' : 'primary'" text @click="showEmailVerifyDialog">
                {{ userInfo.emailVerified ? '查看' : '验证' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><Edit /></el-icon> 基本信息</span>
            </div>
          </template>
          <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="100px" label-position="left">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12"><el-form-item label="真实姓名" prop="realName"><el-input v-model="profileForm.realName" :disabled="!isEditing" /></el-form-item></el-col>
              <el-col :xs="24" :sm="12"><el-form-item label="用户名" prop="username"><el-input v-model="profileForm.username" :disabled="!isEditing" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12"><el-form-item label="电子邮箱" prop="email"><el-input v-model="profileForm.email" :disabled="!isEditing" /></el-form-item></el-col>
              <el-col :xs="24" :sm="12"><el-form-item label="手机号码" prop="phone"><el-input v-model="profileForm.phone" :disabled="!isEditing" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12"><el-form-item label="专业" prop="major"><el-input v-model="profileForm.major" :disabled="!isEditing" /></el-form-item></el-col>
              <el-col :xs="24" :sm="12"><el-form-item label="学院" prop="collegeName"><el-input v-model="profileForm.collegeName" :disabled="!isEditing" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12"><el-form-item label="年级" prop="grade"><el-input v-model="profileForm.grade" :disabled="!isEditing" /></el-form-item></el-col>
              <el-col :xs="24" :sm="12"><el-form-item label="班级" prop="className"><el-input v-model="profileForm.className" :disabled="!isEditing" /></el-form-item></el-col>
            </el-row>
            <el-form-item label="个人简介" prop="introduce">
              <el-input v-model="profileForm.introduce" type="textarea" :rows="3" :disabled="!isEditing" show-word-limit maxlength="200" />
            </el-form-item>
            <el-form-item>
              <el-button v-if="!isEditing" type="primary" :icon="Edit" @click="startEditing">编辑信息</el-button>
              <div v-else class="form-actions">
                <el-button :icon="Close" @click="cancelEditing">取消</el-button>
                <el-button type="primary" :icon="Check" :loading="saving" @click="saveProfile">保存更改</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="login-log-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><Clock /></el-icon> 最近登录记录</span>
              <el-button text :icon="Refresh" @click="loadLoginLogs" :loading="loginLogsLoading">刷新</el-button>
            </div>
          </template>
          <el-table :data="loginLogs" stripe style="width:100%" empty-text="暂无登录记录" v-loading="loginLogsLoading">
            <el-table-column prop="loginTime" label="登录时间" width="180"><template #default="{row}">{{ formatDateTime(row.loginTime) }}</template></el-table-column>
            <el-table-column prop="ip" label="登录IP" width="140" />
            <el-table-column prop="location" label="登录地点" />
            <el-table-column prop="device" label="登录设备" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{row}">
                <el-tag :type="isLoginSuccess(row) ? 'success' : 'danger'" size="small">{{ row.statusText || row.status || (isLoginSuccess(row) ? '成功' : '失败') }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div class="table-footer">
            <div class="page-size-selector">
              <span>每页显示：</span>
              <el-select v-model="logPageSize" @change="handleLogSizeChange" style="width:100px">
                <el-option label="5条" :value="5" /><el-option label="10条" :value="10" /><el-option label="20条" :value="20" /><el-option label="50条" :value="50" />
              </el-select>
            </div>
            <el-pagination background layout="prev,pager,next,jumper" :total="logTotal" :page-size="logPageSize" v-model:current-page="logPage" @current-change="onLogPageChange" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Admin/Teacher layout: left main + right sidebar -->
    <div v-else class="main-content">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header"><el-icon><User /></el-icon><span>基本信息</span></div>
            </template>
            <div class="profile-section">
              <div class="avatar-upload">
                <div class="avatar-preview">
                  <el-avatar :size="120" :src="userStore.avatarSrc">{{ userStore.realName?.charAt(0) }}</el-avatar>
                  <div class="avatar-actions">
                    <el-button :icon="Edit" @click="changeAvatar">更换头像</el-button>
                    <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarChange" style="display:none" />
                  </div>
                </div>
              </div>
              <el-form :model="formData" :rules="formRules" ref="settingsForm" label-width="100px" class="settings-form">
                <el-row :gutter="20">
                  <el-col :span="12"><el-form-item label="姓名" prop="realName"><el-input v-model="formData.realName" /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item :label="role==='ADMIN'?'用户名':'工号'" prop="username"><el-input v-model="formData.username" disabled /></el-form-item></el-col>
                </el-row>

                <!-- ADMIN fields -->
                <template v-if="role === 'ADMIN'">
                  <el-row :gutter="20">
                    <el-col :span="12"><el-form-item label="职位" prop="position"><el-input v-model="formData.position" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item label="所属部门" prop="department"><el-input v-model="formData.department" /></el-form-item></el-col>
                  </el-row>
                </template>

                <!-- TEACHER fields -->
                <template v-if="role === 'TEACHER'">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="职称" prop="title">
                        <el-select v-model="formData.title" placeholder="请选择职称">
                          <el-option label="教授" value="professor" /><el-option label="副教授" value="associate_professor" />
                          <el-option label="讲师" value="lecturer" /><el-option label="助教" value="assistant" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="所属学院" prop="collegeId">
                        <el-select v-model="formData.collegeId" placeholder="请选择学院" :loading="collegeLoading">
                          <el-option v-for="c in collegeList" :key="c.value" :label="c.label" :value="c.value" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-form-item label="研究方向" prop="researchFields">
                    <el-select v-model="formData.researchFields" multiple placeholder="请选择研究方向" style="width:100%">
                      <el-option label="人工智能" value="ai" /><el-option label="机器学习" value="machine_learning" />
                      <el-option label="数据挖掘" value="data_mining" /><el-option label="计算机网络" value="computer_network" />
                      <el-option label="软件工程" value="software_engineering" /><el-option label="数据库" value="database" />
                      <el-option label="信息安全" value="information_security" />
                    </el-select>
                  </el-form-item>
                </template>

                <el-form-item label="个人简介" prop="introduce">
                  <el-input v-model="formData.introduce" type="textarea" :rows="4" :placeholder="role==='TEACHER'?'请简要介绍您的研究方向和教学经验':'请简要介绍您的职责和专长'" maxlength="500" show-word-limit />
                </el-form-item>
              </el-form>
            </div>
          </el-card>

          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header"><el-icon><Phone /></el-icon><span>联系方式</span></div>
            </template>
            <el-form :model="formData" :rules="contactRules" ref="contactForm" label-width="100px">
              <el-row :gutter="20">
                <el-col :span="12"><el-form-item label="手机号码" prop="phone"><el-input v-model="formData.phone" /></el-form-item></el-col>
                <el-col :span="12"><el-form-item label="邮箱" prop="email"><el-input v-model="formData.email" /></el-form-item></el-col>
              </el-row>

              <!-- ADMIN office address -->
              <el-form-item v-if="role === 'ADMIN'" label="办公地址" prop="officeAddress">
                <el-input v-model="formData.officeAddress" />
              </el-form-item>

              <!-- TEACHER office + officeHours -->
              <template v-if="role === 'TEACHER'">
                <el-form-item label="办公室地址" prop="office">
                  <el-input v-model="formData.office" />
                </el-form-item>
                <el-form-item label="办公时间" prop="officeHours">
                  <el-input v-model="formData.officeHours" type="textarea" :rows="3" maxlength="200" show-word-limit />
                </el-form-item>
              </template>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header"><el-icon><Lock /></el-icon><span>账户安全</span></div>
            </template>
            <div class="security-section">
              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">登录密码</div>
                  <div class="security-desc">定期更改密码以保证账户安全</div>
                </div>
                <el-button link :icon="Edit" @click="changePasswordPrompt">修改密码</el-button>
              </div>
              <div v-if="role === 'TEACHER'" class="security-item">
                <div class="security-info">
                  <div class="security-title">两步验证</div>
                  <div class="security-desc">为账户增加额外的安全保护</div>
                </div>
                <el-switch v-model="formData.twoFactorAuth" @change="toggleTwoFactorAuth" />
              </div>
            </div>
          </el-card>

          <!-- ADMIN notifications -->
          <el-card v-if="role === 'ADMIN'" class="section-card" shadow="hover">
            <template #header>
              <div class="section-header"><el-icon><Bell /></el-icon><span>通知设置</span></div>
            </template>
            <div class="notification-section">
              <div v-for="item in adminNotifications" :key="item.key" class="notification-item">
                <div class="notification-info"><div class="notification-title">{{ item.title }}</div><div class="notification-desc">{{ item.desc }}</div></div>
                <el-switch v-model="formData[item.key]" />
              </div>
            </div>
          </el-card>

          <!-- TEACHER notifications -->
          <el-card v-if="role === 'TEACHER'" class="section-card" shadow="hover">
            <template #header>
              <div class="section-header"><el-icon><Bell /></el-icon><span>通知设置</span></div>
            </template>
            <div class="notification-section">
              <div v-for="item in teacherNotifications" :key="item.key" class="notification-item">
                <div class="notification-info"><div class="notification-title">{{ item.title }}</div><div class="notification-desc">{{ item.desc }}</div></div>
                <el-switch v-model="formData[item.key]" />
              </div>
            </div>
          </el-card>

          <!-- ADMIN system prefs -->
          <el-card v-if="role === 'ADMIN'" class="section-card" shadow="hover">
            <template #header>
              <div class="section-header"><el-icon><Setting /></el-icon><span>系统偏好</span></div>
            </template>
            <div class="preference-section">
              <div class="preference-item">
                <div class="preference-label">操作日志保留天数</div>
                <el-slider v-model="formData.logRetentionDays" :min="30" :max="365" :step="30" show-stops show-input style="width:100%" />
              </div>
              <div class="preference-item">
                <div class="preference-label">数据备份频率</div>
                <el-select v-model="formData.backupFrequency" style="width:100%">
                  <el-option label="每日" value="daily" /><el-option label="每周" value="weekly" /><el-option label="每月" value="monthly" />
                </el-select>
              </div>
            </div>
          </el-card>

          <!-- TEACHER review prefs -->
          <el-card v-if="role === 'TEACHER'" class="section-card" shadow="hover">
            <template #header>
              <div class="section-header"><el-icon><Setting /></el-icon><span>审核偏好</span></div>
            </template>
            <div class="preference-section">
              <div class="preference-item">
                <div class="preference-label">最大同时审核数</div>
                <el-slider v-model="formData.maxReviewCount" :min="1" :max="10" :step="1" show-stops show-input style="width:100%" />
              </div>
              <div class="preference-item">
                <div class="preference-label">审核期限（天）</div>
                <el-input-number v-model="formData.reviewDeadline" :min="3" :max="14" :step="1" controls-position="right" style="width:100%" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Student: email verify dialog -->
    <el-dialog v-model="emailVerifyDialogVisible" title="邮箱验证" width="500px" :close-on-click-modal="false">
      <div class="email-verify-dialog">
        <div v-if="!userInfo.emailVerified">
          <p>我们将向您的邮箱 <strong>{{ userInfo.email }}</strong> 发送验证链接</p>
          <div class="verify-actions">
            <el-button type="primary" @click="sendVerificationEmail" :loading="sendingVerification" :disabled="resendCountdown>0">
              {{ resendCountdown>0 ? `重新发送(${resendCountdown}s)` : '发送验证邮件' }}
            </el-button>
            <el-button @click="updateEmail">更换邮箱</el-button>
          </div>
          <div class="verify-tips"><el-alert title="验证提示" type="info" :closable="false" description="请查看您的邮箱，点击验证链接完成验证。验证链接24小时内有效。" /></div>
        </div>
        <div v-else class="verified-status">
          <el-result icon="success" title="邮箱已验证" :sub-title="`邮箱 ${userInfo.email} 已验证成功`">
            <template #extra><el-button type="primary" @click="emailVerifyDialogVisible=false">确定</el-button></template>
          </el-result>
        </div>
      </div>
    </el-dialog>

    <!-- Student: change email dialog -->
    <el-dialog v-model="updateEmailDialogVisible" title="更换邮箱" width="400px">
      <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef">
        <el-form-item label="新邮箱地址" prop="email"><el-input v-model="emailForm.email" type="email" /></el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="emailForm.code" />
            <el-button :disabled="codeCountdown>0" @click="sendEmailCode">{{ codeCountdown>0 ? `${codeCountdown}s` : '获取验证码' }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updateEmailDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateEmail">确认更换</el-button>
      </template>
    </el-dialog>

    <!-- Student: password dialog -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="studentPwdRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword"><el-input v-model="passwordForm.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码" prop="newPassword"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword"><el-input v-model="passwordForm.confirmPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="changingPassword" @click="confirmStudentChangePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRoute, useRouter } from 'vue-router'
import {
  User, Phone, Lock, Bell, Setting, Check, Edit, Camera, Key, Message,
  Ticket, School, Calendar, Close, Refresh, Clock
} from '@element-plus/icons-vue'
import {
  updateUserInfo, uploadAvatar, updatePassword, getAllColleges, getLoginHistory,
  sendVerifyEmail, verifyEmail as verifyEmailAPI, sendEmailCode as sendEmailCodeAPI, updateUserEmail,
  getCurrentUserInfo
} from '@/api/user'
import { updateUser } from '@/api/admin/users'
import { updateInfo, getInfo, changePassword } from '@/api/teacher'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const role = computed(() => userStore.role || 'STUDENT')
const pageTitle = computed(() => ({ ADMIN: '管理员设置', TEACHER: '个人设置', STUDENT: '个人中心' }[role.value] || '个人设置'))
const pageSubtitle = computed(() => ({ ADMIN: '管理您的个人资料和系统偏好设置', TEACHER: '管理您的个人资料和系统偏好设置', STUDENT: '管理您的个人信息和账户设置' }[role.value] || ''))

// ============ Shared state ============
const avatarInput = ref(null)
const uploading = ref(false)
const contactForm = ref()
const settingsForm = ref()
const collegeList = ref([])
const collegeLoading = ref(false)

// ============ Admin/Teacher form data ============
const formData = reactive({
  avatar: '', realName: '', username: '',
  position: '', department: '', introduce: '',
  phone: '', email: '', officeAddress: '',
  title: '', collegeId: '', researchFields: [],
  office: '', officeHours: '',
  twoFactorAuth: false,
  notifySystemError: true, notifySecurityWarning: true,
  notifySystemAnnouncement: true, notifyEmail: true,
  notifyNewPaper: true, notifyReviewReminder: true,
  logRetentionDays: 90, backupFrequency: 'daily',
  maxReviewCount: 5, reviewDeadline: 7,
})

const adminNotifications = [
  { key: 'notifySystemError', title: '系统异常', desc: '当系统出现异常时及时通知' },
  { key: 'notifySecurityWarning', title: '安全警告', desc: '安全相关的警告和提醒' },
  { key: 'notifySystemAnnouncement', title: '系统公告', desc: '重要的系统更新和公告' },
  { key: 'notifyEmail', title: '邮件通知', desc: '通过邮件接收重要通知' },
]
const teacherNotifications = [
  { key: 'notifyNewPaper', title: '新论文提交', desc: '当有新论文提交给您审核时' },
  { key: 'notifyReviewReminder', title: '审核提醒', desc: '待审核论文的截止日期提醒' },
  { key: 'notifySystemAnnouncement', title: '系统公告', desc: '重要的系统更新和公告' },
  { key: 'notifyEmail', title: '邮件通知', desc: '通过邮件接收重要通知' },
]

const formRules = computed(() => {
  const base = {
    realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  }
  if (role.value === 'ADMIN') {
    base.position = [{ required: true, message: '请输入职位', trigger: 'blur' }]
    base.department = [{ required: true, message: '请输入部门', trigger: 'blur' }]
  }
  if (role.value === 'TEACHER') {
    base.title = [{ required: true, message: '请选择职称', trigger: 'change' }]
    base.collegeId = [{ required: true, message: '请选择学院', trigger: 'change' }]
  }
  return base
})

const contactRules = {
  phone: [{ required: true, message: '请输入手机号码', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
}

// ============ Student state ============
const isEditing = ref(false)
const saving = ref(false)
const userInfo = ref({})
const profileFormRef = ref()
const profileForm = reactive({
  realName: '', username: '', email: '', phone: '',
  major: '', collegeName: '', grade: '', className: '', introduce: '',
})

const profileRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }],
}

const displayUserInfo = computed(() => {
  const source = userInfo.value && Object.keys(userInfo.value).length > 0 ? userInfo.value : userStore.userInfo || {}
  return source
})

// ============ Student: login logs ============
const loginLogs = ref([])
const loginLogsLoading = ref(false)
const logPage = ref(1)
const logPageSize = ref(5)
const logTotal = ref(0)

// ============ Student: email ============
const emailVerifyDialogVisible = ref(false)
const sendingVerification = ref(false)
const resendCountdown = ref(0)
let countdownTimer = null
const updateEmailDialogVisible = ref(false)
const codeCountdown = ref(0)
let codeTimer = null
const emailForm = reactive({ email: '', code: '' })
const emailFormRef = ref()
const emailRules = {
  email: [{ required: true, message: '请输入邮箱地址', trigger: 'blur' }, { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }, { len: 6, message: '验证码长度为6位', trigger: 'blur' }],
}

// ============ Student: password ============
const passwordDialogVisible = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const studentPwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (rule, value, callback) => { callback(value !== passwordForm.newPassword ? new Error('两次输入密码不一致') : undefined) }, trigger: 'blur' },
  ],
}

// ============ Avatar (all roles) ============
function changeAvatar() { avatarInput.value?.click() }
async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { ElMessage.error('请选择图片文件'); event.target.value = ''; return }
  if (file.size / 1024 / 1024 > 3) { ElMessage.error('图片大小不能超过3MB'); event.target.value = ''; return }
  const fd = new FormData(); fd.append('file', file)
  try {
    uploading.value = true
    const res = await uploadAvatar(fd)
    const url = res.data
    if (url) { userStore.updateAvatar(url); await nextTick(); ElMessage.success('头像上传成功') }
  } catch (e) { ElMessage.error(e?.response?.data?.message || e?.message || '上传失败') }
  finally { uploading.value = false; event.target.value = '' }
}

// ============ Save (Admin/Teacher) ============
async function saveSettings() {
  if (role.value === 'STUDENT') { await saveProfile(); return }
  try { await settingsForm.value?.validate(); await contactForm.value?.validate() } catch { ElMessage.error('请完善所有必填项后再保存'); return }
  const submitData = { ...formData, userId: userStore.userInfo.userId }
  try {
    let res
    if (role.value === 'ADMIN') res = await updateUser(userStore.userInfo.userId, submitData)
    else res = await updateInfo(submitData)
    if (res.code === 200) {
      const updated = { ...userStore.userInfo, ...submitData }
      userStore.userInfo = updated
      localStorage.setItem('userInfo', JSON.stringify(updated))
      ElMessage.success('个人设置保存成功')
    } else ElMessage.error(res.message || '保存失败')
  } catch (e) { ElMessage.error(e?.message || '保存失败') }
}

// ============ Password change (Admin/Teacher) ============
function changePasswordPrompt() {
  ElMessageBox.prompt('请输入新密码：', '修改密码', { confirmButtonText: '确定', cancelButtonText: '取消', inputType: 'password' }).then(async ({ value }) => {
    if (!value) { ElMessage.error('新密码不能为空'); return }
    try {
      let res
      if (role.value === 'TEACHER') res = await changePassword({ oldPassword: value, newPassword: value })
      else res = await updatePassword({ userId: userStore.userInfo.userId, newPassword: value })
      if (res.code === 200) { ElMessage.success('密码修改成功，请重新登录'); userStore.logout(); setTimeout(() => location.reload(), 1000) }
      else ElMessage.error(res.message || '密码修改失败')
    } catch (e) { ElMessage.error(e?.message || '密码修改失败') }
  }).catch(() => {})
}

// ============ Student: editing ============
function startEditing() { isEditing.value = true }
function cancelEditing() {
  isEditing.value = false
  Object.assign(profileForm, {
    realName: userInfo.value.realName || '', username: userInfo.value.username || '',
    email: userInfo.value.email || '', phone: userInfo.value.phone || '',
    major: userInfo.value.major || '', collegeName: userInfo.value.collegeName || '',
    grade: userInfo.value.grade || '', className: userInfo.value.className || '',
    introduce: userInfo.value.introduce || '',
  })
}

// ============ Student: save ============
async function saveProfile() {
  try { await profileFormRef.value?.validate() } catch { ElMessage.error('表单校验失败，请检查输入'); return }
  saving.value = true
  try {
    const submitData = { ...profileForm, userId: userInfo.value.userId || userStore.userInfo.userId }
    const res = await updateUserInfo(submitData)
    const updated = { ...userStore.userInfo, ...(res.data || submitData), avatar: res.data?.avatar || userStore.userInfo.avatar }
    userStore.setUserInfo(updated)
    userInfo.value = { ...updated }
    Object.assign(profileForm, {
      realName: res.data?.realName || '', username: res.data?.username || '',
      email: res.data?.email || '', phone: res.data?.phone || '',
      major: res.data?.major || '', collegeName: res.data?.collegeName || '',
      grade: res.data?.grade || '', className: res.data?.className || '',
      introduce: res.data?.introduce || '',
    })
    ElMessage.success('个人信息更新成功')
    isEditing.value = false
  } catch (e) { ElMessage.error(e?.message || '保存失败') }
  finally { saving.value = false }
}

// ============ Student: password ============
function changePasswordDialog() {
  passwordDialogVisible.value = true
  Object.keys(passwordForm).forEach(k => passwordForm[k] = '')
  passwordFormRef.value?.clearValidate()
}
async function confirmStudentChangePassword() {
  try { await passwordFormRef.value.validate() } catch { return }
  changingPassword.value = true
  try {
    const res = await updatePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    if (res.code === 200 || (res.status >= 200 && res.status < 300)) {
      ElMessage.success('密码修改成功，请重新登录')
      userStore.logout()
      passwordDialogVisible.value = false
      setTimeout(() => router.push({ name: 'Login' }), 500)
    } else ElMessage.error(res.message || '密码修改失败')
  } catch (e) { ElMessage.error(e?.response?.data?.message || e?.message || '修改密码失败') }
  finally { changingPassword.value = false }
}

// ============ Student: email ============
function showEmailVerifyDialog() { emailVerifyDialogVisible.value = true }
async function sendVerificationEmail() {
  if (!userInfo.value.email) { ElMessage.warning('请先设置邮箱地址'); return }
  sendingVerification.value = true
  try {
    await sendVerifyEmail({ email: userInfo.value.email }, { timeout: 60000 })
    ElMessage.success('验证邮件已发送，请查看您的邮箱')
    startResendCountdown()
  } catch (e) { ElMessage.error(e?.response?.data?.message || '发送验证邮件失败') }
  finally { sendingVerification.value = false }
}
function startResendCountdown() {
  resendCountdown.value = 60; clearInterval(countdownTimer)
  countdownTimer = setInterval(() => { resendCountdown.value--; if (resendCountdown.value <= 0) clearInterval(countdownTimer) }, 1000)
}
function updateEmail() {
  emailForm.email = userInfo.value.email || ''; emailForm.code = ''
  updateEmailDialogVisible.value = true; emailFormRef.value?.clearValidate()
}
async function sendEmailCode() {
  if (!emailForm.email) { ElMessage.warning('请输入邮箱地址'); return }
  try {
    await sendEmailCodeAPI({ email: emailForm.email, type: 'change_email' })
    ElMessage.success('验证码已发送')
    codeCountdown.value = 60; clearInterval(codeTimer)
    codeTimer = setInterval(() => { codeCountdown.value--; if (codeCountdown.value <= 0) clearInterval(codeTimer) }, 1000)
  } catch (e) { ElMessage.error(e?.response?.data?.message || '发送验证码失败') }
}
async function confirmUpdateEmail() {
  try { await emailFormRef.value.validate() } catch { return }
  try {
    await updateUserEmail({ email: emailForm.email, code: emailForm.code })
    const updated = { ...userStore.userInfo, email: emailForm.email, emailVerified: false }
    userStore.userInfo = updated; localStorage.setItem('userInfo', JSON.stringify(updated))
    userInfo.value = { ...updated }
    ElMessage.success('邮箱更新成功，请重新验证')
    updateEmailDialogVisible.value = false; emailVerifyDialogVisible.value = true
  } catch (e) { ElMessage.error(e?.response?.data?.message || '更新邮箱失败') }
}

// ============ Student: login logs ============
function isLoginSuccess(row) {
  const s = row?.status ?? row?.loginResult ?? row?.result ?? row?.success
  if (typeof s === 'number') return s === 1
  if (typeof s === 'boolean') return s
  if (typeof s === 'string') return /^(1|成功|ok|true)$/i.test(s)
  return false
}
async function loadLoginLogs() {
  loginLogsLoading.value = true
  try {
    const res = await getLoginHistory({ pageNo: logPage.value, pageSize: logPageSize.value })
    const body = res?.data?.data ?? res?.data ?? res ?? {}
    const list = body.list ?? body.records ?? body.rows ?? body.data ?? []
    logTotal.value = Number(body.total ?? body.totalCount ?? body.count ?? list.length) || list.length
    loginLogs.value = (list || []).map(item => ({
      loginTime: item.loginTime, ip: item.loginIp, location: item.loginLocation,
      device: item.loginDevice, status: item.loginResult,
      statusText: item.loginResult === 1 ? '成功' : item.loginResult === 0 ? '失败' : (item.statusText || (isLoginSuccess(item) ? '成功' : '失败')),
    }))
  } catch { loginLogs.value = []; logTotal.value = 0 }
  finally { loginLogsLoading.value = false }
}
function handleLogSizeChange(sz) { logPageSize.value = sz; logPage.value = 1; loadLoginLogs() }
function onLogPageChange(p) { logPage.value = p; loadLoginLogs() }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }

// ============ TEACHER: college list ============
async function fetchColleges() {
  collegeLoading.value = true
  try { const res = await getAllColleges(); if (res.code === 200) collegeList.value = res.data || [] }
  catch { /* ignore */ }
  finally { collegeLoading.value = false }
}

// ============ TEACHER: two factor ============
function toggleTwoFactorAuth(v) {
  if (v) {
    ElMessageBox.confirm('确定要开启两步验证吗？', '开启两步验证', { confirmButtonText: '确定', cancelButtonText: '取消' })
      .then(() => ElMessage.success('两步验证已开启'))
      .catch(() => { formData.twoFactorAuth = false })
  }
}

// ============ Init ============
function initAdminTeacher() {
  const info = userStore.userInfo
  if (!info) return
  Object.assign(formData, {
    realName: info.realName || '', username: info.username || '',
    position: info.position || '', department: info.department || '',
    introduce: info.introduce || '', phone: info.phone || '', email: info.email || '',
    officeAddress: info.officeAddress || '',
    title: info.title || '', collegeId: info.collegeId || '',
    researchFields: info.researchFields || [], office: info.office || '', officeHours: info.officeHours || '',
  })
}

async function initStudent() {
  const info = userStore.userInfo
  if (!info) return
  // 先用本地缓存快速填充表单
  userInfo.value = { ...info, emailVerified: info.emailVerified ?? false }
  Object.assign(profileForm, {
    realName: info.realName || '', username: info.username || '',
    email: info.email || '', phone: info.phone || '',
    major: info.major || '', collegeName: info.collegeName || '',
    grade: info.grade || '', className: info.className || info.classInfo || '',
    introduce: info.introduce || '',
  })
  // 从后端获取完整信息（含 email/phone 等 localStorage 未保存的字段）
  try {
    const res = await getCurrentUserInfo()
    if (res.code === 200 && res.data) {
      const full = { ...info, ...res.data }
      userInfo.value = { ...full, emailVerified: full.emailVerified ?? false }
      userStore.setUserInfo(full)
      Object.assign(profileForm, {
        realName: full.realName || '', username: full.username || '',
        email: full.email || '', phone: full.phone || '',
        major: full.major || '', collegeName: full.collegeName || '',
        grade: full.grade || '', className: full.className || '',
        introduce: full.introduce || '',
      })
    }
  } catch { /* ignore, use cached data */ }
}

async function checkEmailVerification() {
  const token = route.query.verify_token || route.query.token
  if (!token) return
  try {
    await verifyEmailAPI(token)
    const updated = { ...userStore.userInfo, emailVerified: true }
    userStore.setUserInfo(updated)
    localStorage.setItem('userInfo', JSON.stringify({ ...JSON.parse(localStorage.getItem('userInfo') || '{}'), emailVerified: true }))
    userInfo.value = { ...updated, emailVerified: true }
    ElMessage.success('邮箱验证成功！')
    window.history.replaceState({}, '', window.location.pathname)
  } catch (e) { ElMessage.error(e?.response?.data?.message || '邮箱验证失败') }
}

async function initTeacherInfo() {
  try {
    const res = await getInfo(userStore.userInfo.userId)
    if (res.code === 200) {
      const merged = { ...userStore.userInfo, ...res.data, userId: userStore.userInfo.userId }
      Object.assign(formData, merged)
      userStore.userInfo = merged
      localStorage.setItem('userInfo', JSON.stringify(merged))
    }
  } catch { /* ignore */ }
}

onMounted(async () => {
  if (role.value === 'STUDENT') {
    initStudent()
    loadLoginLogs()
    checkEmailVerification()
  } else {
    initAdminTeacher()
    if (role.value === 'TEACHER') {
      fetchColleges()
      initTeacherInfo()
    }
  }
})

onUnmounted(() => {
  clearInterval(countdownTimer)
  clearInterval(codeTimer)
})
</script>

<style lang="scss" scoped>
.user-settings { padding: 20px; min-height: 100vh; background: #f5f5f7; }

// Page header
.page-header {
  margin-bottom: 24px; border-radius: 18px; padding: 24px; border: 1px solid #d2d2d7;
  .header-content { display: flex; justify-content: space-between; align-items: center; }
  .header-left {
    .page-title { margin: 0 0 8px; font-size: 1.75rem; font-weight: 700; color: #1d1d1f; }
    .page-subtitle { margin: 0; color: #86868b; font-size: 0.875rem; }
  }
}
.role-ADMIN .page-header { background: #f5f5f7; }
.role-TEACHER .page-header { background: #ffffff; }
.role-STUDENT .page-header { background: none; border: none; padding: 0 0 16px; margin-bottom: 0; }

// Main content (Admin/Teacher)
.main-content {
  max-width: 1200px; margin: 0 auto;
  .section-card {
    margin-bottom: 16px; border-radius: 18px; border: 1px solid #d2d2d7;
    :deep(.el-card__header) { padding: 16px 20px; border-bottom: 1px solid #d2d2d7; }
    :deep(.el-card__body) { padding: 20px; }
  }
  .section-header { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #1d1d1f; .el-icon { color: #0066cc; } }
}
.role-TEACHER .main-content .section-card {
  border-color: #f1f2f6;
  &:hover { border-color: #86868b; }
  :deep(.el-card__header) { border-bottom-color: #f1f2f6; }
}

// Profile section (Admin/Teacher)
.profile-section {
  display: flex; gap: 24px; align-items: flex-start;
  .avatar-upload .avatar-preview { text-align: center; .avatar-actions { display: flex; justify-content: center; gap: 8px; margin-top: 12px; } }
  .settings-form { flex: 1; :deep(.el-form-item__label) { font-weight: 400; color: #86868b; } }
}
.role-ADMIN .profile-section .avatar-upload { width: 220px; }
.role-TEACHER .profile-section .avatar-upload { display: flex; justify-content: center; margin-bottom: 24px; width: 100%; }

// Security section
.security-section .security-item {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #d2d2d7;
  &:last-child { border-bottom: none; }
  .security-info { .security-title { font-weight: 400; color: #1d1d1f; margin-bottom: 4px; } .security-desc { font-size: 0.875rem; color: #86868b; } }
}
.role-TEACHER .security-section .security-item { border-bottom-color: #f1f2f6; }

// Notification section
.notification-section .notification-item {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #d2d2d7;
  &:last-child { border-bottom: none; }
  .notification-info { .notification-title { font-weight: 400; color: #1d1d1f; margin-bottom: 4px; } .notification-desc { font-size: 0.875rem; color: #86868b; } }
}
.role-TEACHER .notification-section .notification-item { border-bottom-color: #f1f2f6; }

// Preference section (Admin)
.preference-section .preference-item {
  padding: 12px 0; border-bottom: 1px solid #d2d2d7; display: flex; align-items: center; justify-content: space-between;
  &:last-child { border-bottom: none; }
  .preference-label { font-weight: 400; color: #1d1d1f; flex: 1 1 55%; }
  :deep(.el-slider), :deep(.el-select) { flex: 0 0 45%; max-width: 260px; }
}
// Preference section (Teacher)
.role-TEACHER .preference-section .preference-item {
  padding: 16px 0; border-bottom-color: #f1f2f6; display: block;
  .preference-label { margin-bottom: 12px; }
}

// ============ Student styles ============
.role-STUDENT { padding: 0; }
.profile-content {
  .el-card { border-radius: 18px; border: 1px solid #f1f2f6; margin-bottom: 1.5rem;
    :deep(.el-card__header) { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f2f6; }
    :deep(.el-card__body) { padding: 1.25rem; }
  }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .card-title { display: flex; align-items: center; font-weight: 600; color: #1d1d1f; .el-icon { margin-right: 0.5rem; color: #0066cc; } }
  }
}
.profile-overview { text-align: center;
  .avatar-section { margin-bottom: 1.5rem; .avatar-actions { margin-top: 0.75rem; } }
  .user-details {
    .user-name { margin: 0 0 0.5rem; color: #1d1d1f; font-size: 1.25rem; }
    .detail-item { display: flex; align-items: center; justify-content: flex-start; margin: 0.75rem 0; color: #86868b;
      .el-icon { margin-right: 0.5rem; color: #0066cc; width: 16px; }
      span { margin-right: 0.5rem; min-width: 60px; text-align: right; }
      strong { color: #1d1d1f; }
    }
  }
}
.security-items .security-item {
  display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f5f5f7;
  &:last-child { border-bottom: none; }
  .security-info { display: flex; align-items: center;
    .el-icon { margin-right: 0.75rem; color: #0066cc; font-size: 1.25rem; }
    .security-details { .security-title { font-weight: 600; color: #1d1d1f; margin-bottom: 0.25rem; } .security-desc { font-size: 0.875rem; color: #86868b; } }
  }
}
.form-actions { display: flex; gap: 0.75rem; }
.email-verify-dialog {
  .verify-actions { display: flex; gap: 12px; margin: 20px 0; .el-button { flex: 1; } }
  .verify-tips { margin-top: 20px; }
}
.code-input { display: flex; align-items: center; .el-input { flex: 1; } .el-button { margin-left: 10px; white-space: nowrap; } }
.table-footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; }
.page-size-selector { color: #86868b; }

// Responsive
@media (max-width: 768px) {
  .page-header { padding: 16px;
    .header-content { flex-direction: column; align-items: flex-start; gap: 16px; .header-right { width: 100%; justify-content: flex-start; } }
  }
  .settings-form :deep(.el-col-12) { width: 100%; }
  .security-item, .notification-item { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .profile-content .el-col { margin-bottom: 1rem; }
  .profile-section { flex-direction: column; }
}
</style>
