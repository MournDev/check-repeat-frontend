<template>
  <div class="student-panel">
    <!-- 学生布局：左资料卡 + 右表单 -->
    <el-row :gutter="24" class="profile-content">
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
              <AvatarUploader :size="80">
                <template #default="{ trigger }">
                  <el-button text :icon="Camera" @click="trigger">更换头像</el-button>
                </template>
              </AvatarUploader>
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
            <el-row :gutter="24">
              <el-col :xs="24" :sm="12"><el-form-item label="真实姓名" prop="realName"><el-input v-model="profileForm.realName" :disabled="!isEditing" /></el-form-item></el-col>
              <el-col :xs="24" :sm="12"><el-form-item label="用户名" prop="username"><el-input v-model="profileForm.username" :disabled="!isEditing" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :xs="24" :sm="12"><el-form-item label="电子邮箱" prop="email"><el-input v-model="profileForm.email" :disabled="!isEditing" /></el-form-item></el-col>
              <el-col :xs="24" :sm="12"><el-form-item label="手机号码" prop="phone"><el-input v-model="profileForm.phone" :disabled="!isEditing" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
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
            <el-row :gutter="24">
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

    <!-- 邮箱验证弹窗 -->
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

    <!-- 更换邮箱弹窗 -->
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

    <!-- 修改密码弹窗 -->
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRoute, useRouter } from 'vue-router'
import {
  User, Phone, Lock, Check, Edit, Camera, Key, Message,
  Ticket, School, Calendar, Close, Refresh, Clock
} from '@element-plus/icons-vue'
import {
  getCurrentUserInfo, updateUserInfo, updatePassword, getLoginHistory,
  sendVerifyEmail, verifyEmail as verifyEmailAPI, sendEmailCode as sendEmailCodeAPI, updateUserEmail,
} from '@/api/user'
import AvatarUploader from './AvatarUploader.vue'
import { useCollegeMajor, dictRowById } from '@/composables/useCollegeMajor'
import { formatDateTime } from '@/utils/dataType.js'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

// 学院/专业字典（级联：专业按学院过滤）
const { collegeList, collegeLoading, majorList, majorLoading, fetchColleges, fetchMajors } = useCollegeMajor()

// ============ 表单状态 ============
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

// ============ 登录记录 ============
const loginLogs = ref([])
const loginLogsLoading = ref(false)
const logPage = ref(1)
const logPageSize = ref(5)
const logTotal = ref(0)

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

// ============ 邮箱 ============
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

// ============ 密码 ============
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
      // await 确保 token 已清再跳登录页，否则 Login 的「已登录跳角色首页」会把人弹回应用
      await userStore.logout()
      passwordDialogVisible.value = false
      setTimeout(() => router.push({ name: 'Login' }), 500)
    } else ElMessage.error(res.message || '密码修改失败')
  } catch (e) { ElMessage.error(e?.response?.data?.message || e?.message || '修改密码失败') }
  finally { changingPassword.value = false }
}

// ============ 编辑与保存 ============
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

// ============ 初始化 ============
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

onMounted(async () => {
  // 先取字典再填表单：学院/专业下拉的显示值由 ID 反查字典得来，顺序反了会先渲染两个空框
  await Promise.all([fetchColleges(), fetchMajors()])
  initStudent()
  loadLoginLogs()
  checkEmailVerification()
})

onUnmounted(() => {
  clearInterval(countdownTimer)
  clearInterval(codeTimer)
})

// 页头「保存设置」按钮经父组件转发到这里
defineExpose({ save: saveProfile })
</script>

<style lang="scss" scoped>
.profile-content {
  .el-card { border-radius: var(--app-radius-lg); border: 1px solid var(--app-color-border); margin-bottom: var(--app-space-6);
    :deep(.el-card__header) { padding: var(--app-space-3) var(--app-space-4); border-bottom: 1px solid var(--app-color-divider); }
    :deep(.el-card__body) { padding: 1.25rem; }
  }
  .card-header { display: flex; justify-content: space-between; align-items: center;
    .card-title { display: flex; align-items: center; font-weight: 600; color: var(--app-color-ink); .el-icon { margin-right: 0.5rem; color: var(--app-color-primary); } }
  }
}
.profile-overview { text-align: center;
  .avatar-section { margin-bottom: 1.5rem; .avatar-actions { margin-top: 0.75rem; } }
  .user-details {
    .user-name { margin: 0 0 var(--app-space-2); color: var(--app-color-ink); font-size: var(--app-fs-title); }
    .detail-item { display: flex; align-items: center; justify-content: flex-start; margin: 0.75rem 0; color: var(--app-color-text-secondary);
      .el-icon { margin-right: 0.5rem; color: var(--app-color-primary); width: 16px; }
      span { margin-right: 0.5rem; min-width: 60px; text-align: right; }
      strong { color: var(--app-color-ink); }
    }
  }
}
.security-items .security-item {
  display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--app-color-divider);
  &:last-child { border-bottom: none; }
  .security-info { display: flex; align-items: center;
    .el-icon { margin-right: var(--app-space-3); color: var(--app-color-primary); font-size: var(--app-fs-title); }
    .security-details { .security-title { font-weight: 600; color: var(--app-color-ink); margin-bottom: 0.25rem; } .security-desc { font-size: var(--app-fs-caption); color: var(--app-color-text-secondary); } }
  }
}
.form-actions { display: flex; gap: 0.75rem; }
.email-verify-dialog {
  .verify-actions { display: flex; gap: 12px; margin: 20px 0; .el-button { flex: 1; } }
  .verify-tips { margin-top: 20px; }
}
.code-input { display: flex; align-items: center; .el-input { flex: 1; } .el-button { margin-left: 10px; white-space: nowrap; } }
.table-footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; }
.page-size-selector { color: var(--app-color-text-secondary); }

@media (max-width: 768px) {
  .security-item { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .profile-content .el-col { margin-bottom: 1rem; }
}
</style>
