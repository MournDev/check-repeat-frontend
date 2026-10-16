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
              <!-- 学院在前、专业在后：专业列表按学院过滤，顺序反了就是在让人先挑一个还够不着的专业 -->
              <el-col :xs="24" :sm="12">
                <el-form-item label="学院" prop="collegeId">
                  <el-select v-model="profileForm.collegeId" :disabled="!isEditing" :loading="collegeLoading"
                             filterable placeholder="请选择学院" style="width: 100%" @change="handleCollegeChange">
                    <el-option v-for="c in collegeList" :key="c.value" :label="c.label" :value="c.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="专业" prop="majorId">
                  <el-select v-model="profileForm.majorId" :disabled="!isEditing || !profileForm.collegeId"
                             :loading="majorLoading" filterable placeholder="请先选择学院" style="width: 100%"
                             @change="handleMajorChange">
                    <el-option v-for="m in majorOptions" :key="m.value" :label="m.label" :value="m.value" />
                  </el-select>
                </el-form-item>
              </el-col>
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
                    <el-tree-select v-model="formData.researchFields" :data="subjectTree" multiple show-checkbox
                      check-strictly filterable :loading="subjectLoading" placeholder="请选择研究方向（可多选）"
                      style="width:100%" :props="subjectTreeProps" />
                    <!-- 迁移遗留的旧短码：既不在学科树里、也不再是有效取值，
                         静默丢弃等于把教师填过的信息抹掉，所以先明说再让他决定 -->
                    <div v-if="legacyResearchFields.length" class="legacy-tip">
                      以下研究方向已失效（不属于现有学科领域），保存后将被清除：
                      <el-tag v-for="f in legacyResearchFields" :key="f" type="info" size="small" class="legacy-tag">{{ f }}</el-tag>
                    </div>
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
  getCurrentUserInfo, updateUserInfo, uploadAvatar, updatePassword, getAllColleges, getAllMajors, getLoginHistory,
  sendVerifyEmail, verifyEmail as verifyEmailAPI, sendEmailCode as sendEmailCodeAPI, updateUserEmail,
  getSubjectFieldTree
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
const majorList = ref([])

// 研究方向 = 学科领域树（与论文的学科、阈值维度同一套取值域），提交的是学科 code
const subjectTree = ref([])
const subjectLoading = ref(false)
const subjectTreeProps = { label: 'label', value: 'value', children: 'children' }
// 迁移遗留、认不出学科的旧值；只做提示，不参与提交
const legacyResearchFields = ref([])
const majorLoading = ref(false)

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
  // 学院/专业：ID 是下拉框的绑定值（也是落库的依据），名称跟着 ID 一起提交
  collegeId: '', collegeName: '', majorId: '', major: '',
  grade: '', className: '', introduce: '',
})

/** 专业下拉的可选项：只列当前学院下的专业（字典接口一次性给了全部专业及其 collegeId） */
const majorOptions = computed(() => {
  const rows = majorList.value
  const current = dictRowById(rows, profileForm.majorId)
  if (!profileForm.collegeId) return current ? [current] : []
  const inCollege = rows.filter(m => String(m.collegeId) === String(profileForm.collegeId))
  // 存量数据里专业与学院可能对不上：选中的那个专业即使不在这所学院的名下也要留着，
  // 否则选项里没有它，el-select 会退化成把 ID 当文本显示
  return current && !inCollege.includes(current) ? [current, ...inCollege] : inCollege
})

/** 按 value 在字典列表里找一行；ID 在 JSON 里是数字、在下发时是字符串，一律转成字符串比 */
function dictRowById(list, id) {
  if (id === null || id === undefined || id === '') return null
  return list.find(item => String(item.value) === String(id)) || null
}

function handleCollegeChange() {
  // 换了学院，原专业大概率不属于新学院：连带清掉，免得存出一份学院与专业对不上的资料
  profileForm.majorId = ''
  profileForm.major = ''
  profileForm.collegeName = dictRowById(collegeList.value, profileForm.collegeId)?.label || ''
}

function handleMajorChange() {
  profileForm.major = dictRowById(majorList.value, profileForm.majorId)?.label || ''
}

/*
 * 把用户信息里的学院/专业写进表单：ID 和名称一起写。
 * 下拉框的显示值取自 ID，所以库里只有名称（历史自由输入、或该项已不在字典里）时，
 * 按名称回查一次字典；查不到就留空 ID，保存时后端会退化成只存名称 —— 不会把原本的
 * 名称抹掉。
 */
function applyCollegeMajor(info) {
  const college = dictRowById(collegeList.value, info.collegeId)
    || collegeList.value.find(c => c.label === (info.collegeName || ''))
  const major = dictRowById(majorList.value, info.majorId)
    || majorList.value.find(m => m.label === (info.major || ''))
  profileForm.collegeId = college ? college.value : ''
  profileForm.collegeName = college ? college.label : (info.collegeName || '')
  profileForm.majorId = major ? major.value : ''
  profileForm.major = major ? major.label : (info.major || '')
}

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
    // silent：失败提示统一在下面的 catch 里出一次，否则拦截器和 catch 会连弹两根红条
    const res = await uploadAvatar(fd, { silent: true })
    // code!==200 已经被拦截器 reject 到下面的 catch 了，这里只剩"成功但没给地址"这一种，
    // 曾经失败时 data 就是 null，而这里不判空，结果静默什么都不做、看起来像点了没反应
    if (!res.data) {
      ElMessage.error('头像上传失败：服务端未返回地址')
      return
    }
    userStore.updateAvatar(res.data)
    await nextTick()
    ElMessage.success('头像上传成功')
  } catch (e) { ElMessage.error(e?.response?.data?.message || e?.message || '头像上传失败') }
  finally { uploading.value = false; event.target.value = '' }
}

// ============ Save (Admin/Teacher) ============
async function saveSettings() {
  if (role.value === 'STUDENT') { await saveProfile(); return }
  try { await settingsForm.value?.validate(); await contactForm.value?.validate() } catch { ElMessage.error('请完善所有必填项后再保存'); return }
  const submitData = { ...formData, userId: userStore.userInfo.userId }
  delete submitData.avatar
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
    grade: userInfo.value.grade || '', className: userInfo.value.className || '',
    introduce: userInfo.value.introduce || '',
  })
  applyCollegeMajor(userInfo.value)
}

// ============ Student: save ============
async function saveProfile() {
  try { await profileFormRef.value?.validate() } catch { ElMessage.error('表单校验失败，请检查输入'); return }
  saving.value = true
  try {
    const submitData = {
      ...profileForm,
      userId: userInfo.value.userId || userStore.userInfo.userId,
      // 后端这两个字段是 Long，空字符串反序列化会直接报错，没选就发 null
      collegeId: profileForm.collegeId || null,
      majorId: profileForm.majorId || null,
    }
    const res = await updateUserInfo(submitData)
    // 后端失败时 HTTP 仍是 200（Result.code 才是真正的状态），不判 code 会把失败报成"更新成功"
    if (res.code !== 200) { ElMessage.error(res.message || '保存失败'); return }
    const updated = { ...userStore.userInfo, ...(res.data || submitData), avatar: res.data?.avatar || userStore.userInfo.avatar }
    userStore.setUserInfo(updated)
    userInfo.value = { ...updated }
    Object.assign(profileForm, {
      realName: res.data?.realName || '', username: res.data?.username || '',
      email: res.data?.email || '', phone: res.data?.phone || '',
      grade: res.data?.grade || '', className: res.data?.className || '',
      introduce: res.data?.introduce || '',
    })
    applyCollegeMajor(res.data || submitData)
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

// ============ 学院/专业字典（教师所属学院 + 学生学院/专业下拉共用） ============
async function fetchColleges() {
  collegeLoading.value = true
  try { const res = await getAllColleges(); if (res.code === 200) collegeList.value = res.data || [] }
  catch { /* ignore */ }
  finally { collegeLoading.value = false }
}

// 一次拿全部专业（每条带 collegeId），学生端按学院在前端过滤，换学院不用再等请求
async function fetchMajors() {
  majorLoading.value = true
  try { const res = await getAllMajors(); if (res.code === 200) majorList.value = res.data || [] }
  catch { /* ignore */ }
  finally { majorLoading.value = false }
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
    // 通知/偏好随登录下发（LoginVO），?? 保默认值：旧 localStorage 缓存里没有这些键时
    // 与 DB 列默认值一致（开/开/开/开，90 天，daily）；后端下发了 false/0 时必须原样回显
    notifySystemError: info.notifySystemError ?? true,
    notifySecurityWarning: info.notifySecurityWarning ?? true,
    notifySystemAnnouncement: info.notifySystemAnnouncement ?? true,
    notifyEmail: info.notifyEmail ?? true,
    logRetentionDays: info.logRetentionDays ?? 90,
    backupFrequency: info.backupFrequency || 'daily',
  })
}

function applyStudentInfo(info) {
  userInfo.value = { ...info, emailVerified: info.emailVerified ?? false }
  Object.assign(profileForm, {
    realName: info.realName || '', username: info.username || '',
    email: info.email || '', phone: info.phone || '',
    grade: info.grade || '', className: info.className || info.classInfo || '',
    introduce: info.introduce || '',
  })
  applyCollegeMajor(info)
}

async function initStudent() {
  const info = userStore.userInfo
  if (!info) return
  // 先用本地缓存渲染，接口没回来之前页面不空
  applyStudentInfo(info)
  // 再拉一次完整信息：localStorage 里只留了非敏感展示字段，
  // 邮箱 / 手机号 / 个人简介刷新后就丢了，只有后端能补回来
  try {
    const res = await getCurrentUserInfo()
    if (res.code === 200 && res.data) {
      // userId 沿用 store 里那份，避免雪花 ID 过一遍 JSON 再被截一次
      const merged = { ...userStore.userInfo, ...res.data, userId: userStore.userInfo.userId }
      userStore.setUserInfo(merged)
      applyStudentInfo(merged)
    }
  } catch { /* 拉不到就继续用缓存，不打扰用户 */ }
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

// 学科领域树（不传 majorId = 整棵树）：教师的研究方向是跨专业的，不该按专业收窄
async function fetchSubjectTree() {
  subjectLoading.value = true
  try {
    const res = await getSubjectFieldTree()
    if (res.code === 200) subjectTree.value = res.data || []
  } catch { /* 树拉不到时保留下拉为空，不阻断页面其它部分 */ }
  finally { subjectLoading.value = false }
}

async function initTeacherInfo() {
  try {
    const res = await getInfo(userStore.userInfo.userId)
    if (res.code === 200) {
      const merged = { ...userStore.userInfo, ...res.data, userId: userStore.userInfo.userId }
      Object.assign(formData, merged)
      legacyResearchFields.value = res.data.legacyResearchFields || []
      userStore.userInfo = merged
      localStorage.setItem('userInfo', JSON.stringify(merged))
    }
  } catch { /* ignore */ }
}

onMounted(async () => {
  if (role.value === 'STUDENT') {
    // 先取字典再填表单：学院/专业下拉的显示值由 ID 反查字典得来，顺序反了会先渲染两个空框
    await Promise.all([fetchColleges(), fetchMajors()])
    initStudent()
    loadLoginLogs()
    checkEmailVerification()
  } else {
    initAdminTeacher()
    if (role.value === 'TEACHER') {
      fetchColleges()
      fetchSubjectTree()
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
.user-settings { padding: 20px; min-height: 100vh; background: var(--apple-canvas-parchment); }

// Page header
.page-header {
  margin-bottom: 24px; border-radius: 18px; padding: 24px; border: 1px solid var(--apple-surface-chip-translucent);
  .header-content { display: flex; justify-content: space-between; align-items: center; }
  .header-left {
    .page-title { margin: 0 0 8px; font-size: 1.75rem; font-weight: 700; color: var(--apple-ink); }
    .page-subtitle { margin: 0; color: var(--apple-ink-secondary); font-size: 0.875rem; }
  }
}
.role-ADMIN .page-header { background: var(--apple-canvas-parchment); }
.role-TEACHER .page-header { background: var(--apple-surface); }
.role-STUDENT .page-header { background: none; border: none; padding: 0 0 16px; margin-bottom: 0; }

// 研究方向里「已失效」的旧值提示（迁移遗留短码，保存后会被清除）
.legacy-tip {
  margin-top: 6px; font-size: 12px; line-height: 1.8; color: var(--apple-info);
  .legacy-tag { margin-right: 6px; }
}

// Main content (Admin/Teacher)
.main-content {
  max-width: 1200px; margin: 0 auto;
  .section-card {
    margin-bottom: 16px; border-radius: 18px; border: 1px solid var(--apple-surface-chip-translucent);
    :deep(.el-card__header) { padding: 16px 20px; border-bottom: 1px solid var(--apple-surface-chip-translucent); }
    :deep(.el-card__body) { padding: 20px; }
  }
  .section-header { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--apple-ink); .el-icon { color: var(--apple-primary); } }
}
.role-TEACHER .main-content .section-card {
  border-color: var(--apple-slate-border);
  &:hover { border-color: var(--apple-ink-secondary); }
  :deep(.el-card__header) { border-bottom-color: var(--apple-slate-border); }
}

// Profile section (Admin/Teacher)
.profile-section {
  display: flex; gap: 24px; align-items: flex-start;
  .avatar-upload .avatar-preview { text-align: center; .avatar-actions { display: flex; justify-content: center; gap: 8px; margin-top: 12px; } }
  .settings-form { flex: 1; :deep(.el-form-item__label) { font-weight: 400; color: var(--apple-ink-secondary); } }
}
.role-ADMIN .profile-section .avatar-upload { width: 220px; }
.role-TEACHER .profile-section .avatar-upload { display: flex; justify-content: center; margin-bottom: 24px; width: 100%; }

// Security section
.security-section .security-item {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--apple-surface-chip-translucent);
  &:last-child { border-bottom: none; }
  .security-info { .security-title { font-weight: 400; color: var(--apple-ink); margin-bottom: 4px; } .security-desc { font-size: 0.875rem; color: var(--apple-ink-secondary); } }
}
.role-TEACHER .security-section .security-item { border-bottom-color: var(--apple-slate-border); }

// Notification section
.notification-section .notification-item {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--apple-surface-chip-translucent);
  &:last-child { border-bottom: none; }
  .notification-info { .notification-title { font-weight: 400; color: var(--apple-ink); margin-bottom: 4px; } .notification-desc { font-size: 0.875rem; color: var(--apple-ink-secondary); } }
}
.role-TEACHER .notification-section .notification-item { border-bottom-color: var(--apple-slate-border); }

// Preference section (Admin)
.preference-section .preference-item {
  padding: 12px 0; border-bottom: 1px solid var(--apple-surface-chip-translucent); display: flex; align-items: center; justify-content: space-between;
  &:last-child { border-bottom: none; }
  .preference-label { font-weight: 400; color: var(--apple-ink); flex: 1 1 55%; }
  :deep(.el-slider), :deep(.el-select) { flex: 0 0 45%; max-width: 260px; }
}
// Preference section (Teacher)
.role-TEACHER .preference-section .preference-item {
  padding: 16px 0; border-bottom-color: var(--apple-slate-border); display: block;
  .preference-label { margin-bottom: 12px; }
}

// ============ Student styles ============
.role-STUDENT { padding: 0; }
.profile-content {
  .el-card { border-radius: 18px; border: 1px solid var(--apple-slate-border); margin-bottom: 1.5rem;
    :deep(.el-card__header) { padding: 1rem 1.25rem; border-bottom: 1px solid var(--apple-slate-border); }
    :deep(.el-card__body) { padding: 1.25rem; }
  }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .card-title { display: flex; align-items: center; font-weight: 600; color: var(--apple-ink); .el-icon { margin-right: 0.5rem; color: var(--apple-primary); } }
  }
}
.profile-overview { text-align: center;
  .avatar-section { margin-bottom: 1.5rem; .avatar-actions { margin-top: 0.75rem; } }
  .user-details {
    .user-name { margin: 0 0 0.5rem; color: var(--apple-ink); font-size: 1.25rem; }
    .detail-item { display: flex; align-items: center; justify-content: flex-start; margin: 0.75rem 0; color: var(--apple-ink-secondary);
      .el-icon { margin-right: 0.5rem; color: var(--apple-primary); width: 16px; }
      span { margin-right: 0.5rem; min-width: 60px; text-align: right; }
      strong { color: var(--apple-ink); }
    }
  }
}
.security-items .security-item {
  display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--apple-canvas-parchment);
  &:last-child { border-bottom: none; }
  .security-info { display: flex; align-items: center;
    .el-icon { margin-right: 0.75rem; color: var(--apple-primary); font-size: 1.25rem; }
    .security-details { .security-title { font-weight: 600; color: var(--apple-ink); margin-bottom: 0.25rem; } .security-desc { font-size: 0.875rem; color: var(--apple-ink-secondary); } }
  }
}
.form-actions { display: flex; gap: 0.75rem; }
.email-verify-dialog {
  .verify-actions { display: flex; gap: 12px; margin: 20px 0; .el-button { flex: 1; } }
  .verify-tips { margin-top: 20px; }
}
.code-input { display: flex; align-items: center; .el-input { flex: 1; } .el-button { margin-left: 10px; white-space: nowrap; } }
.table-footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; }
.page-size-selector { color: var(--apple-ink-secondary); }

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
