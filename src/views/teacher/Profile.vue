<template>
  <div class="teacher-settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">个人设置</h1>
          <p class="page-subtitle">管理您的个人资料和系统偏好设置</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Check" @click="saveSettings" size="large">
            保存设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <el-row :gutter="24">
        <!-- 左侧：个人资料 -->
        <el-col :xs="24" :lg="16">
          <!-- 基本信息 -->
          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-icon>
                  <User />
                </el-icon>
                <span>基本信息</span>
              </div>
            </template>

            <div class="profile-section">
              <div class="avatar-upload">
                <div class="avatar-preview">
                  <el-avatar :size="120" :src="userStore.avatarSrc" class="teacher-avatar">
                    {{ userStore.realName?.charAt(0) }}
                  </el-avatar>
                  <div class="avatar-actions">
                    <el-button :icon="Edit" @click="changeAvatar">更换头像</el-button>
                    <input type="file" ref="avatarInput" @change="handleAvatarChange" accept="image/*"
                      style="display: none;">
                  </div>
                </div>
              </div>

              <el-form :model="formData" :rules="formRules" ref="settingsForm" label-width="100px"
                class="settings-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="姓名" prop="realName">
                      <el-input v-model="formData.realName" placeholder="请输入姓名" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="工号" prop="username">
                      <el-input v-model="formData.username" placeholder="请输入工号" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="职称" prop="title">
                      <el-select v-model="formData.title" placeholder="请选择职称">
                        <el-option label="教授" value="professor" />
                        <el-option label="副教授" value="associate_professor" />
                        <el-option label="讲师" value="lecturer" />
                        <el-option label="助教" value="assistant" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="所属学院" prop="collegeId">
                      <el-select v-model="formData.collegeId" placeholder="请选择学院" @change="handleCollegeChange"
                        :loading="collegeLoading">
                        <el-option v-for="college in collegeList" :key="college.value" :label="college.label"
                          :value="college.value"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="研究方向" prop="researchFields">
                  <el-select v-model="formData.researchFields" multiple placeholder="请选择研究方向" style="width: 100%">
                    <el-option label="人工智能" value="ai" />
                    <el-option label="机器学习" value="machine_learning" />
                    <el-option label="数据挖掘" value="data_mining" />
                    <el-option label="计算机网络" value="computer_network" />
                    <el-option label="软件工程" value="software_engineering" />
                    <el-option label="数据库" value="database" />
                    <el-option label="信息安全" value="information_security" />
                  </el-select>
                </el-form-item>

                <el-form-item label="个人简介" prop="introduce">
                  <el-input v-model="formData.introduce" type="textarea" :rows="4" placeholder="请简要介绍您的研究方向和教学经验"
                    maxlength="500" show-word-limit />
                </el-form-item>
              </el-form>
            </div>
          </el-card>

          <!-- 联系方式 -->
          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-icon>
                  <Phone />
                </el-icon>
                <span>联系方式</span>
              </div>
            </template>

            <el-form :model="formData" :rules="contactRules" ref="contactForm" label-width="100px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="手机号码" prop="phone">
                    <el-input v-model="formData.phone" placeholder="请输入手机号码" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="formData.email" placeholder="请输入邮箱" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="办公室地址" prop="office">
                <el-input v-model="formData.office" placeholder="请输入办公室地址" />
              </el-form-item>

              <el-form-item label="办公时间" prop="officeHours">
                <el-input v-model="formData.officeHours" type="textarea" :rows="3" placeholder="请输入您的办公时间安排"
                  maxlength="200" show-word-limit />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 右侧：系统设置 -->
        <el-col :xs="24" :lg="8">
          <!-- 账户安全 -->
          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-icon>
                  <Lock />
                </el-icon>
                <span>账户安全</span>
              </div>
            </template>

            <div class="security-section">
              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">登录密码</div>
                  <div class="security-desc">定期更改密码以保证账户安全</div>
                </div>
                <el-button type="text" :icon="Edit" @click="changePasswordAPI">
                  修改密码
                </el-button>
              </div>

              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">登录设备</div>
                  <div class="security-desc">查看您账户的登录设备记录</div>
                </div>
                <el-button type="text" :icon="View" @click="viewDevices">
                  查看设备
                </el-button>
              </div>

              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">两步验证</div>
                  <div class="security-desc">为账户增加额外的安全保护</div>
                </div>
                <el-switch v-model="formData.twoFactorAuth" active-text="开启" inactive-text="关闭"
                  @change="toggleTwoFactorAuth" />
              </div>
            </div>
          </el-card>

          <!-- 通知设置 -->
          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-icon>
                  <Bell />
                </el-icon>
                <span>通知设置</span>
              </div>
            </template>

            <div class="notification-section">
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">新论文提交</div>
                  <div class="notification-desc">当有新论文提交给您审核时</div>
                </div>
                <el-switch v-model="formData.notifyNewPaper" />
              </div>

              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">审核提醒</div>
                  <div class="notification-desc">待审核论文的截止日期提醒</div>
                </div>
                <el-switch v-model="formData.notifyReviewReminder" />
              </div>

              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">系统公告</div>
                  <div class="notification-desc">重要的系统更新和公告</div>
                </div>
                <el-switch v-model="formData.notifySystemAnnouncement" />
              </div>

              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">邮件通知</div>
                  <div class="notification-desc">通过邮件接收重要通知</div>
                </div>
                <el-switch v-model="formData.notifyEmail" />
              </div>
            </div>
          </el-card>

          <!-- 审核偏好 -->
          <el-card class="section-card" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-icon>
                  <Setting />
                </el-icon>
                <span>审核偏好</span>
              </div>
            </template>

            <div class="preference-section">
              <div class="preference-item">
                <div class="preference-label">最大同时审核数</div>
                <el-slider v-model="formData.maxReviewCount" :min="1" :max="10" :step="1" show-stops show-input
                  style="width: 100%" />
              </div>

              <div class="preference-item">
                <div class="preference-label">审核期限（天）</div>
                <el-input-number v-model="formData.reviewDeadline" :min="3" :max="14" :step="1"
                  controls-position="right" style="width: 100%" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { getAllColleges } from '@/api/user'

// 图标引入
import {
  User, Phone, Lock, Bell, Setting,
  Check, Edit, View
} from '@element-plus/icons-vue'
import { uploadAvatar } from '../../api/user'
import { updateInfo, getInfo, changePassword } from '@/api/teacher'



const uploading = ref(false)
const userStore = useUserStore()
const avatarInput = ref(null);
const collegeList = ref([])
const collegeLoading = ref(false)
const contactForm = ref()
const settingsForm = ref()
const formData = reactive({
  avatar: '',
  realName: '',
  username: '',
  title: '',
  collegeId: '',
  researchFields: [],
  introduce: '',
  phone: '',
  email: '',
  office: '',
  officeHours: '',
  maxReviewCount: '',
  reviewDeadline: ''
})

const formRules = {
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请选择职称', trigger: 'change' }
  ],
  college: [
    { required: true, message: '请选择学院', trigger: 'change' }
  ]
}

const contactRules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}



const saveSettings = async () => {
  // 校验基本信息和联系方式表单
  try {
    await settingsForm.value.validate();
    await contactForm.value.validate();
  } catch (err) {
    ElMessage.error("请完善所有必填项后再保存");
    return;
  }
  const submitData = {
    ...formData,
    avatar: formData.avatar || userInfo.value.avatar || userStore.userInfo.avatar || "",
    userId: userStore.userInfo.userId||userInfo.value.userId,
    // 其他需要后端的字段可在此补充
  };
  try {
    const res = await updateInfo(submitData);
    if (res.code === 200) {
      // 更新本地 userStore
      const updatedUserInfo = { ...userStore.userInfo, ...submitData };
      userStore.userInfo = updatedUserInfo;
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      userInfo.value = { ...updatedUserInfo };
      ElMessage.success("个人设置保存成功");
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (error) {
    console.error("保存设置失败：", error);
    ElMessage.error(error?.message || "保存失败，请稍后重试");
  }
};

const changeAvatar = () => {
  avatarInput.value.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  // 文件校验：类型 & 大小（示例最大 3MB）
  const maxMB = 3;
  if (!file.type.startsWith("image/")) {
    ElMessage.error("请选择图片文件");
    event.target.value = "";
    return;
  }
  if (file.size / 1024 / 1024 > maxMB) {
    ElMessage.error(`图片大小不能超过 ${maxMB}MB`);
    event.target.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", file); // 后端期待的字段名为 file

  try {
    uploading.value = true;
    const res = await uploadAvatar(formData);
    // 根据后端返回结构调整取值
    const avatarUrl = res.data;
    if (avatarUrl) {
      console.log("上传成功，头像 URL：", avatarUrl);
      // 使用 userStore 的 updateAvatar 方法
      userStore.updateAvatar(avatarUrl);
      await nextTick();
      ElMessage.success("头像上传成功");
    } else {
      ElMessage.success("上传成功，请刷新查看");
    }
  } catch (err) {
    console.error("上传头像失败：", err);
    const msg = err?.response?.data?.message || err?.message || "上传失败";
    ElMessage.error(msg);
  } finally {
    uploading.value = false;
    // 允许重复上传同一文件
    event.target.value = "";
  }
};

const changePasswordAPI = async() => {
  ElMessageBox.prompt('请输入新密码：', '修改密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password'
  }).then(async ({ value }) => {
    if (!value) {
      ElMessage.error('新密码不能为空');
      return;
    }
    try {
      const res = await changePassword({
        userId: userStore.userInfo.userId,
        newPassword: value
      });
      if (res.code === 200) {
        ElMessage.success('密码修改成功，请重新登录');
        userStore.logout();
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        ElMessage.error(res.message || '密码修改失败');
      }
    } catch (err) {
      ElMessage.error(err?.message || '密码修改失败');
    }
  }).catch(() => {
    // 用户取消
  });
};

const viewDevices = () => {
  ElMessage.info('查看登录设备功能开发中')
}

const toggleTwoFactorAuth = (value) => {
  if (value) {
    ElMessageBox.confirm('确定要开启两步验证吗？', '开启两步验证', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }).then(() => {
      ElMessage.success('两步验证已开启')
    }).catch(() => {
      formData.twoFactorAuth = false
    })
  }
}
// 获取所有学院
const getColleges = async () => {
  try {
    collegeLoading.value = true
    const res = await getAllColleges()
    if (res.code === 200) {
      collegeList.value = res.data
    } else {
      ElMessage.error('获取学院列表失败：' + res.message)
    }
  } catch (error) {
    ElMessage.error('获取学院列表失败')
    console.error('获取学院列表失败：', error)
  } finally {
    collegeLoading.value = false
  }
}
//获取当前用户信息
const getAllInfo = async () => {
  try {
    console.log("获取用户信息，用户ID：", userStore.userInfo?.userId);
    const res = await getInfo(userStore.userInfo.userId);
    if (res.code === 200) {
      // 合并时优先保留已有 userId
      const merged = {
        ...userStore.userInfo,
        ...res.data,
        userId: userStore.userInfo.userId || res.data.userId || res.data.id // 兜底
      };
      Object.assign(formData, merged);
      userStore.userInfo = merged;
      localStorage.setItem("userInfo", JSON.stringify(merged));
      userInfo.value = { ...merged };
    } else {
      ElMessage.error('获取个人信息失败：' + res.message)
    }
  } catch (error) {
    ElMessage.error('获取个人信息失败')
    console.error('获取个人信息失败：', error)
  }
}

onMounted(() => {
  getColleges();
  // 初始化表单数据
  getAllInfo();

});
</script>

<style lang="scss" scoped>
.teacher-settings {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea0d 0%, #764ba20d 100%);
}

// 页面头部
.page-header {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #2c3e50;
      }

      .page-subtitle {
        margin: 0;
        color: #7f8c8d;
        font-size: 0.875rem;
      }
    }
  }
}

// 主要内容
.main-content {
  .section-card {
    margin-bottom: 16px;
    border-radius: 12px;
    border: none;

    &:hover {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }

    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f2f6;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #2c3e50;

    .el-icon {
      color: #667eea;
    }
  }
}

// 个人资料部分
.profile-section {
  .avatar-upload {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;

    .avatar-preview {
      text-align: center;

      .teacher-avatar {
        border: 4px solid #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin-bottom: 12px;
      }

      .avatar-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
    }
  }

  .settings-form {
    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #5a6c7d;
    }
  }
}

// 安全设置部分
.security-section {
  .security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f1f2f6;

    &:last-child {
      border-bottom: none;
    }

    .security-info {
      .security-title {
        font-weight: 500;
        color: #2c3e50;
        margin-bottom: 4px;
      }

      .security-desc {
        font-size: 0.875rem;
        color: #7f8c8d;
      }
    }

    :deep(.el-switch) {
      margin-right: 8px;
    }
  }
}

// 通知设置部分
.notification-section {
  .notification-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f1f2f6;

    &:last-child {
      border-bottom: none;
    }

    .notification-info {
      .notification-title {
        font-weight: 500;
        color: #2c3e50;
        margin-bottom: 4px;
      }

      .notification-desc {
        font-size: 0.875rem;
        color: #7f8c8d;
      }
    }
  }
}

// 偏好设置部分
.preference-section {
  .preference-item {
    padding: 16px 0;
    border-bottom: 1px solid #f1f2f6;

    &:last-child {
      border-bottom: none;
    }

    .preference-label {
      font-weight: 500;
      color: #2c3e50;
      margin-bottom: 12px;
    }

    :deep(.el-slider) {
      .el-slider__input {
        width: 80px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    padding: 16px;

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .header-right {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }

  .settings-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    :deep(.el-col-12) {
      width: 100%;
    }
  }

  .security-item,
  .notification-item {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
}
</style>