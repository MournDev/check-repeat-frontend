<template>
  <!-- ADMIN/TEACHER 布局：左主区 + 右侧栏，角色差异字段内联分支 -->
  <div :class="['main-content', 'role-' + role]">
    <el-row :gutter="24">
      <el-col :xs="24" :lg="16">
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="section-header"><el-icon><User /></el-icon><span>基本信息</span></div>
          </template>
          <div class="profile-section">
            <div class="avatar-upload">
              <div class="avatar-preview">
                <AvatarUploader :size="120" />
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
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Phone, Lock, Bell, Setting, Edit } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { updatePassword, getSubjectFieldTree } from '@/api/user'
import { updateUser } from '@/api/admin/users'
import { updateInfo, getInfo, changePassword } from '@/api/teacher'
import AvatarUploader from './AvatarUploader.vue'
import { useCollegeMajor } from '@/composables/useCollegeMajor'

const props = defineProps({
  role: { type: String, required: true }, // 'ADMIN' | 'TEACHER'
})
// 模板里沿用 role==='ADMIN' 的写法，包一层 computed 保持模板零改动
const role = computed(() => props.role)

const userStore = useUserStore()

// 教师所属学院下拉（字典来自与学生端同一个接口）
const { collegeList, collegeLoading, fetchColleges } = useCollegeMajor()

// 研究方向 = 学科领域树（与论文的学科、阈值维度同一套取值域），提交的是学科 code
const subjectTree = ref([])
const subjectLoading = ref(false)
const subjectTreeProps = { label: 'label', value: 'value', children: 'children' }
// 迁移遗留、认不出学科的旧值；只做提示，不参与提交
const legacyResearchFields = ref([])

const contactForm = ref()
const settingsForm = ref()

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

// ============ 保存 ============
async function saveSettings() {
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

// ============ 修改密码 ============
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

// ============ TEACHER: two factor ============
function toggleTwoFactorAuth(v) {
  if (v) {
    ElMessageBox.confirm('确定要开启两步验证吗？', '开启两步验证', { confirmButtonText: '确定', cancelButtonText: '取消' })
      .then(() => ElMessage.success('两步验证已开启'))
      .catch(() => { formData.twoFactorAuth = false })
  }
}

// ============ 初始化 ============
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

onMounted(() => {
  initAdminTeacher()
  if (role.value === 'TEACHER') {
    fetchColleges()
    fetchSubjectTree()
    initTeacherInfo()
  }
})

// 页头「保存设置」按钮经父组件转发到这里
defineExpose({ save: saveSettings })
</script>

<style lang="scss" scoped>
.main-content {
  max-width: 1200px; margin: 0 auto;
  .section-card {
    margin-bottom: 16px; border-radius: 18px; border: 1px solid var(--apple-surface-chip-translucent);
    :deep(.el-card__header) { padding: 16px 20px; border-bottom: 1px solid var(--apple-surface-chip-translucent); }
    :deep(.el-card__body) { padding: 20px; }
  }
  .section-header { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--apple-ink); .el-icon { color: var(--apple-primary); } }
}
.role-TEACHER .section-card {
  border-color: var(--apple-slate-border);
  &:hover { border-color: var(--apple-ink-secondary); }
  :deep(.el-card__header) { border-bottom-color: var(--apple-slate-border); }
}

// 研究方向里「已失效」的旧值提示（迁移遗留短码，保存后会被清除）
.legacy-tip {
  margin-top: 6px; font-size: 12px; line-height: 1.8; color: var(--apple-info);
  .legacy-tag { margin-right: 6px; }
}

// Profile section
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

@media (max-width: 768px) {
  .settings-form :deep(.el-col-12) { width: 100%; }
  .security-item, .notification-item { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .profile-section { flex-direction: column; }
}
</style>
