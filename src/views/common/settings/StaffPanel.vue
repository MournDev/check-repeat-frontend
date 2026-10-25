<template>
  <!-- ADMIN/TEACHER 布局：左主区 + 右侧栏，角色差异字段内联分支 -->
  <div :class="['main-content', 'role-' + role]">
    <el-row :gutter="24">
      <el-col :xs="24" :lg="15">
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="section-header"><el-icon><User /></el-icon><span>基本信息</span></div>
          </template>
          <div class="profile-section">
            <div class="avatar-upload">
              <div class="avatar-preview">
                <AvatarUploader :size="role === 'ADMIN' ? 96 : 120" />
              </div>
            </div>
            <el-form :model="formData" :rules="formRules" ref="settingsForm" label-width="80px" class="settings-form">
              <div class="form-grid">
                <el-form-item label="姓名" prop="realName"><el-input v-model="formData.realName" /></el-form-item>
                <el-form-item :label="role==='ADMIN'?'用户名':'工号'" prop="username"><el-input v-model="formData.username" disabled /></el-form-item>

                <!-- ADMIN fields -->
                <template v-if="role === 'ADMIN'">
                  <el-form-item label="职位" prop="position"><el-input v-model="formData.position" /></el-form-item>
                  <el-form-item label="所属部门" prop="department"><el-input v-model="formData.department" /></el-form-item>
                </template>

                <!-- TEACHER fields -->
                <template v-if="role === 'TEACHER'">
                  <el-form-item label="职称" prop="title">
                    <el-select v-model="formData.title" placeholder="请选择职称">
                      <el-option label="教授" value="professor" /><el-option label="副教授" value="associate_professor" />
                      <el-option label="讲师" value="lecturer" /><el-option label="助教" value="assistant" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="所属学院" prop="collegeId">
                    <el-select v-model="formData.collegeId" placeholder="请选择学院" :loading="collegeLoading">
                      <el-option v-for="c in collegeList" :key="c.value" :label="c.label" :value="c.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="研究方向" prop="researchFields" class="span-2">
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

                <el-form-item label="个人简介" prop="introduce" class="span-2">
                  <el-input v-model="formData.introduce" type="textarea" :rows="4" :placeholder="role==='TEACHER'?'请简要介绍您的研究方向和教学经验':'请简要介绍您的职责和专长'" maxlength="500" show-word-limit />
                </el-form-item>
              </div>
            </el-form>
          </div>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="section-header"><el-icon><Phone /></el-icon><span>联系方式</span></div>
          </template>
          <el-form :model="formData" :rules="contactRules" ref="contactForm" label-width="80px">
            <div class="form-grid">
              <el-form-item label="手机号码" prop="phone"><el-input v-model="formData.phone" /></el-form-item>
              <el-form-item label="邮箱" prop="email"><el-input v-model="formData.email" /></el-form-item>

              <!-- ADMIN office address -->
              <el-form-item v-if="role === 'ADMIN'" label="办公地址" prop="officeAddress" class="span-2">
                <el-input v-model="formData.officeAddress" />
              </el-form-item>

              <!-- TEACHER office + officeHours -->
              <template v-if="role === 'TEACHER'">
                <el-form-item label="办公室地址" prop="office" class="span-2">
                  <el-input v-model="formData.office" />
                </el-form-item>
                <el-form-item label="办公时间" prop="officeHours" class="span-2">
                  <el-input v-model="formData.officeHours" type="textarea" :rows="3" maxlength="200" show-word-limit />
                </el-form-item>
              </template>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右栏：安全 / 通知 / 偏好合为一张卡，滚动时吸顶，避免三张卡与左栏高度失衡 -->
      <el-col :xs="24" :lg="9" class="side-column">
        <el-card class="section-card side-card" shadow="never">
          <div class="settings-group">
            <div class="group-head"><el-icon><Lock /></el-icon><span>账户安全</span></div>
            <div class="security-section">
              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">登录密码</div>
                  <div class="security-desc">定期更改密码以保证账户安全</div>
                </div>
                <el-button link :icon="Edit" @click="changePasswordDialog">修改密码</el-button>
              </div>
              <div v-if="role === 'TEACHER'" class="security-item">
                <div class="security-info">
                  <div class="security-title">两步验证</div>
                  <div class="security-desc">为账户增加额外的安全保护</div>
                </div>
                <el-switch v-model="formData.twoFactorAuth" @change="toggleTwoFactorAuth" />
              </div>
            </div>
          </div>

          <div class="settings-group">
            <div class="group-head"><el-icon><Bell /></el-icon><span>通知设置</span></div>
            <div class="notification-section">
              <div v-for="item in notifications" :key="item.key" class="notification-item">
                <div class="notification-info"><div class="notification-title">{{ item.title }}</div><div class="notification-desc">{{ item.desc }}</div></div>
                <el-switch v-model="formData[item.key]" />
              </div>
            </div>
          </div>

          <div class="settings-group">
            <div class="group-head"><el-icon><Setting /></el-icon><span>{{ role === 'ADMIN' ? '系统偏好' : '审核偏好' }}</span></div>

            <!-- ADMIN preferences -->
            <div v-if="role === 'ADMIN'" class="preference-section">
              <div class="preference-item">
                <div class="preference-label">操作日志保留天数</div>
                <div class="pref-control">
                  <el-slider v-model="formData.logRetentionDays" :min="30" :max="365" :step="30" show-stops />
                  <span class="pref-value">{{ formData.logRetentionDays }} 天</span>
                </div>
              </div>
              <div class="preference-item">
                <div class="preference-label">数据备份频率</div>
                <div class="pref-control">
                  <el-select v-model="formData.backupFrequency" style="width:100%">
                    <el-option label="每日" value="daily" /><el-option label="每周" value="weekly" /><el-option label="每月" value="monthly" />
                  </el-select>
                </div>
              </div>
            </div>

            <!-- TEACHER preferences -->
            <div v-else class="preference-section">
              <div class="preference-item">
                <div class="preference-label">最大同时审核数</div>
                <div class="pref-control">
                  <el-slider v-model="formData.maxReviewCount" :min="1" :max="10" :step="1" show-stops />
                  <span class="pref-value">{{ formData.maxReviewCount }} 篇</span>
                </div>
              </div>
              <div class="preference-item">
                <div class="preference-label">审核期限（天）</div>
                <div class="pref-control">
                  <el-input-number v-model="formData.reviewDeadline" :min="3" :max="14" :step="1" controls-position="right" style="width:100%" />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改密码：教师/管理员统一走 /api/user/update-password（@RequestBody，oldPassword 必填），
         与学生端同一契约。此前的 prompt 单输入分支打不通后端校验（见 confirmStaffChangePassword 注释） -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="staffPwdRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword"><el-input v-model="passwordForm.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码" prop="newPassword"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword"><el-input v-model="passwordForm.confirmPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="changingPassword" @click="confirmStaffChangePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Phone, Lock, Bell, Setting, Edit } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { updatePassword, getSubjectFieldTree } from '@/api/user'
import { updateUser } from '@/api/admin/users'
import { updateInfo, getInfo } from '@/api/teacher'
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

const notifications = computed(() => (role.value === 'ADMIN' ? adminNotifications : teacherNotifications))

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

// ============ 未保存提示 ============
// 用整体快照对比，避免给十几个字段逐个加 watch；保存或初始化后刷新基线
const snapshot = ref('')
const dirty = ref(false)
const serialize = () => JSON.stringify(formData)
const takeSnapshot = () => { snapshot.value = serialize(); dirty.value = false }

watch(formData, () => {
  dirty.value = snapshot.value !== '' && serialize() !== snapshot.value
}, { deep: true })

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
      takeSnapshot()
      ElMessage.success('个人设置保存成功')
    } else ElMessage.error(res.message || '保存失败')
  } catch (e) { ElMessage.error(e?.message || '保存失败') }
}

// ============ 修改密码 ============
// 与学生端同一契约：PUT /api/user/update-password（@RequestBody UpdatePasswordReq，
// oldPassword 必填）。此前是 ElMessageBox.prompt 只收一个新密码：教师分支把新密码
// 同时当旧密码发给 @RequestParam 端点（读不到 JSON body 且缺 userId），管理员分支
// 缺 oldPassword 被 @NotBlank 拦下，两条路都过不了后端校验，故改为表单弹窗。
const passwordDialogVisible = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const staffPwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度必须在6-50位之间', trigger: 'blur' },
  ],
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

async function confirmStaffChangePassword() {
  try { await passwordFormRef.value.validate() } catch { return }
  changingPassword.value = true
  try {
    const res = await updatePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      // 后端已使该用户全部旧 token 失效（含当前设备），清干净本地会话再回登录页；
      // await 确保 reload 前 token 已清，否则刷新后守卫见到有效 token 又进应用
      await userStore.logout()
      passwordDialogVisible.value = false
      setTimeout(() => location.reload(), 500)
    } else ElMessage.error(res.message || '密码修改失败')
  } catch (e) { ElMessage.error(e?.response?.data?.message || e?.message || '密码修改失败') }
  finally { changingPassword.value = false }
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

onMounted(async () => {
  initAdminTeacher()
  if (role.value === 'TEACHER') {
    fetchColleges()
    fetchSubjectTree()
    await initTeacherInfo()
  }
  await nextTick()
  takeSnapshot()
})

// 页头「保存设置」按钮经父组件转发到这里；isDirty 用于页头的未保存提示
defineExpose({ save: saveSettings, isDirty: dirty })
</script>

<style lang="scss" scoped>
.main-content {
  width: 100%;

  .section-card {
    margin-bottom: var(--app-space-4);
    border-radius: var(--app-radius-lg);
    border: 1px solid var(--app-color-border);
    box-shadow: none;

    &:last-child { margin-bottom: 0; }

    :deep(.el-card__header) { padding: var(--app-space-3) var(--app-space-4); border-bottom: 1px solid var(--app-color-border); }
    :deep(.el-card__body) { padding: var(--app-space-4); }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--app-space-2);
    font-family: var(--app-font-family);
    font-size: var(--app-fs-body);
    font-weight: 600;
    color: var(--app-color-ink);

    .el-icon { color: var(--app-color-primary); }
  }
}

// 右栏吸顶：避开全局导航 + 面包屑条，滚动长表单时偏好设置保持可见
.side-column {
  position: sticky;
  top: calc(var(--app-global-nav-height) + var(--app-subnav-height) + var(--app-page-gutter));
  align-self: flex-start;
}

// 右侧合卡后的分组：用分隔线代替多张卡片的边框，降低视觉噪音
.side-card :deep(.el-card__body) { padding: var(--app-space-2) var(--app-space-4); }
.settings-group {
  padding: var(--app-space-3) 0;

  & + .settings-group { border-top: 1px solid var(--app-color-divider); }
}
.group-head {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-1);
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-ink);

  .el-icon { color: var(--app-color-primary); }
}

// 两列表单：用 grid 取代固定 12 栅格，输入框随可用宽度伸缩，避免右侧留白
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--app-space-6);

  .span-2 { grid-column: 1 / -1; }

  :deep(.el-form-item) { margin-bottom: var(--app-space-4); }
}

// 研究方向里「已失效」的旧值提示（迁移遗留短码，保存后会被清除）
.legacy-tip {
  margin-top: var(--app-space-1); font-size: var(--app-fs-meta); line-height: 1.8; color: var(--app-color-info);
  .legacy-tag { margin-right: var(--app-space-1); }
}

// Profile section
.profile-section {
  display: flex;
  gap: var(--app-space-5);
  align-items: flex-start;

  .avatar-upload { flex-shrink: 0; }

  .avatar-upload .avatar-preview {
    text-align: center;
    .avatar-actions { display: flex; justify-content: center; gap: var(--app-space-2); margin-top: var(--app-space-3); }
  }

  .settings-form {
    flex: 1;
    min-width: 0;
    :deep(.el-form-item__label) { font-weight: 400; color: var(--app-color-text-secondary); }
  }
}
.role-ADMIN .profile-section .avatar-upload { width: 120px; }
.role-TEACHER .profile-section .avatar-upload { display: flex; justify-content: center; margin-bottom: var(--app-space-6); width: 100%; }
// 教师端意图是「头像居上、表单居下」纵向布局
.role-TEACHER .profile-section { flex-direction: column; align-items: center;
  .settings-form { width: 100%; }
}

// Security section
.security-section .security-item {
  display: flex; justify-content: space-between; align-items: center; gap: var(--app-space-3);
  padding: var(--app-space-2) 0; border-bottom: 1px solid var(--app-color-divider);
  &:last-child { border-bottom: none; }
  .security-info { .security-title { font-weight: 400; color: var(--app-color-ink); margin-bottom: var(--app-space-1); } .security-desc { font-size: var(--app-fs-meta); color: var(--app-color-text-secondary); } }
}

// Notification section：右侧栏较窄，四项改为 2×2 排列，压缩卡片高度以平衡左栏
.notification-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--app-space-4);
}
.notification-section .notification-item {
  display: flex; justify-content: space-between; align-items: center; gap: var(--app-space-2);
  padding: var(--app-space-1) 0;
  .notification-info { min-width: 0; .notification-title { font-weight: 400; color: var(--app-color-ink); margin-bottom: 2px; } .notification-desc { font-size: var(--app-fs-meta); color: var(--app-color-text-secondary); line-height: 1.4; } }
}

// Preference section：标签在上、控件占满整行，滑块不再和数字框抢宽度
.preference-section .preference-item {
  padding: var(--app-space-2) 0;
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child { border-bottom: none; }
  .preference-label { margin-bottom: var(--app-space-2); font-weight: 400; color: var(--app-color-ink); }
}
.pref-control {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);

  :deep(.el-slider) { flex: 1; min-width: 0; }
}
.pref-value {
  flex: 0 0 auto;
  min-width: 52px;
  text-align: right;
  font-size: var(--app-fs-caption);
  font-variant-numeric: tabular-nums;
  color: var(--app-color-text-secondary);
}

// 两栏在 1200 以下堆叠；表单同步收为单列，避免 768–1024 之间出现窄输入框
@media (max-width: 1199px) {
  .side-column { position: static; }
}

@media (max-width: 1024px) {
  .form-grid { grid-template-columns: 1fr; }
  .profile-section { flex-direction: column; align-items: stretch; }
  .role-ADMIN .profile-section .avatar-upload { width: 100%; display: flex; justify-content: center; margin-bottom: var(--app-space-4); }

  // 堆叠后宽度充足，通知项恢复单列 + 分隔线
  .notification-section { grid-template-columns: 1fr; }
  .notification-section .notification-item {
    padding: var(--app-space-2) 0;
    border-bottom: 1px solid var(--app-color-divider);

    &:last-child { border-bottom: none; }
  }
}

@media (max-width: 768px) {
  .security-item, .notification-item { flex-direction: column; align-items: flex-start !important; gap: var(--app-space-2); }
  .pref-control { gap: var(--app-space-2); }
}
</style>
