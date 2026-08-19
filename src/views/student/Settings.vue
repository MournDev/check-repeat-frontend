<template>
  <div class="profile-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">个人中心</h1>
      <p class="page-desc">管理您的个人信息和账户设置</p>
    </div>

    <el-row :gutter="20" class="profile-content">
      <!-- 左侧：个人信息卡片 -->
      <el-col :xs="24" :lg="8">
        <!-- 个人信息概览 -->
        <el-card class="profile-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon>
                  <User />
                </el-icon>
                个人信息
              </span>
              <el-button type="primary" text :icon="Edit" @click="editProfile">
                编辑
              </el-button>
            </div>
          </template>
          <div class="profile-overview">
            <div class="avatar-section">
              <el-avatar :size="80" :src="userStore.avatarSrc" :alt="displayUserInfo.realName">
                {{ userStore.realName?.charAt(0) }}
              </el-avatar>
              <div class="avatar-actions">
                <el-button text :icon="Camera" @click="changeAvatar">
                  更换头像
                </el-button>
                <input ref="avatarInput" type="file" accept="image/*" @change="onAvatarSelected"
                  style="display: none" />
              </div>
            </div>

            <div class="user-details">
              <h3 class="user-name">{{ displayUserInfo.realName }}</h3>

              <div class="detail-item">
                <el-icon>
                  <User />
                </el-icon>
                <span>用户名：</span>
                <strong>{{ displayUserInfo.username }}</strong>
              </div>

              <div class="detail-item">
                <el-icon>
                  <Message />
                </el-icon>
                <span>邮箱：</span>
                <strong>{{ displayUserInfo.email || "未设置" }}</strong>
              </div>

              <div class="detail-item">
                <el-icon>
                  <Phone />
                </el-icon>
                <span>手机：</span>
                <strong>{{ displayUserInfo.phone || "未设置" }}</strong>
              </div>

              <div v-if="displayUserInfo.major" class="detail-item">
                <el-icon>
                  <School />
                </el-icon>
                <span>专业：</span>
                <strong>{{ displayUserInfo.major }}</strong>
              </div>
              <div v-if="displayUserInfo.collegeName" class="detail-item">
                <el-icon>
                  <Ticket />
                </el-icon>
                <span>学院：</span>
                <strong>{{ displayUserInfo.collegeName }}</strong>
              </div>
              <div v-if="displayUserInfo.grade" class="detail-item">
                <el-icon>
                  <Calendar />
                </el-icon>
                <span>年级：</span>
                <strong>{{ displayUserInfo.grade }}</strong>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 账户安全 -->
        <el-card class="security-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon>
                  <Lock />
                </el-icon>
                账户安全
              </span>
            </div>
          </template>

          <div class="security-items">
            <div class="security-item">
              <div class="security-info">
                <el-icon>
                  <Key />
                </el-icon>
                <div class="security-details">
                  <div class="security-title">登录密码</div>
                  <div class="security-desc">
                    定期更换密码有助于保护账户安全
                  </div>
                </div>
              </div>
              <el-button type="primary" text @click="changePassword">
                修改
              </el-button>
            </div>

            <div class="security-item">
              <div class="security-info">
                <el-icon>
                  <Message />
                </el-icon>
                <div class="security-details">
                  <div class="security-title">邮箱验证</div>
                  <div class="security-desc">
                    {{ userInfo.emailVerified ? "已验证" : "未验证" }}
                  </div>
                </div>
              </div>
              <el-button :type="userInfo.emailVerified ? 'info' : 'primary'" text @click="showEmailVerifyDialog">
                {{ userInfo.emailVerified ? "查看" : "验证" }}
              </el-button>
            </div>
            <!-- 添加到模板中 -->
            <el-dialog v-model="emailVerifyDialogVisible" title="邮箱验证" width="500px" :close-on-click-modal="false">
              <div class="email-verify-dialog">
                <div v-if="!userInfo.emailVerified">
                  <p>
                    我们将向您的邮箱
                    <strong>{{ userInfo.email }}</strong> 发送验证链接
                  </p>

                  <div class="verify-actions">
                    <el-button type="primary" @click="sendVerificationEmail" :loading="sendingVerification"
                      :disabled="resendCountdown > 0">
                      {{
                        resendCountdown > 0
                          ? `重新发送(${resendCountdown}s)`
                          : "发送验证邮件"
                      }}
                    </el-button>

                    <el-button @click="updateEmail"> 更换邮箱 </el-button>
                  </div>

                  <div class="verify-tips">
                    <el-alert title="验证提示" type="info" :closable="false"
                      description="请查看您的邮箱，点击验证链接完成验证。验证链接24小时内有效。" />
                  </div>
                </div>

                <div v-else class="verified-status">
                  <el-result icon="success" title="邮箱已验证" :sub-title="`邮箱 ${userInfo.email} 已验证成功`">
                    <template #extra>
                      <el-button type="primary" @click="emailVerifyDialogVisible = false">
                        确定
                      </el-button>
                    </template>
                  </el-result>
                </div>
              </div>
            </el-dialog>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：详细信息 -->
      <el-col :xs="24" :lg="16">
        <!-- 基本信息编辑 -->
        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon>
                  <Edit />
                </el-icon>
                基本信息
              </span>
            </div>
          </template>

          <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="100px"
            label-position="left">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="真实姓名" prop="realName">
                  <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="profileForm.username" placeholder="请输入用户名" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="电子邮箱" prop="email">
                  <el-input v-model="profileForm.email" placeholder="请输入电子邮箱" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="手机号码" prop="phone">
                  <el-input v-model="profileForm.phone" placeholder="请输入手机号码" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="专业" prop="major">
                  <el-input v-model="profileForm.major" placeholder="请输入专业" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="学院" prop="collegeName">
                  <el-input v-model="profileForm.collegeName" placeholder="请输入学院" :disabled="!isEditing"/>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="年级" prop="grade">
                  <el-input v-model="profileForm.grade" placeholder="请输入年级" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="班级" prop="className">
                  <el-input v-model="profileForm.className" placeholder="请输入班级" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="个人简介" prop="introduce">
              <el-input v-model="profileForm.introduce" type="textarea" :rows="3" placeholder="请输入个人简介"
                :disabled="!isEditing" show-word-limit maxlength="200" />
            </el-form-item>

            <el-form-item>
              <el-button v-if="!isEditing" type="primary" :icon="Edit" @click="startEditing">
                编辑信息
              </el-button>
              <div v-else class="form-actions">
                <el-button :icon="Close" @click="cancelEditing">
                  取消
                </el-button>
                <el-button type="primary" :icon="Check" :loading="saving" @click="saveProfile">
                  保存更改
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 登录记录 -->
        <el-card class="login-log-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon>
                  <Clock />
                </el-icon>
                最近登录记录
              </span>
              <el-button text :icon="Refresh" @click="loadLoginLogs" :loading="loginLogsLoading">
                刷新
              </el-button>
            </div>
          </template>

          <el-table :data="loginLogs" stripe style="width: 100%" empty-text="暂无登录记录" v-loading="loginLogsLoading"
            :row-key="'id'">
            <el-table-column prop="loginTime" label="登录时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.loginTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="登录IP" width="140" />
            <el-table-column prop="location" label="登录地点" />
            <el-table-column prop="device" label="登录设备" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="isLoginSuccess(row) ? 'success' : 'danger'" size="small">
                  {{
                    row.statusText ||
                    row.status ||
                    (isLoginSuccess(row) ? "成功" : "失败")
                  }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-footer" style="
              margin-top: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
            <div class="page-size-selector" style="color: #606266">
              <span>每页显示：</span>
              <el-select v-model="pageSize" @change="handleSizeChange" style="width: 100px">
                <el-option label="5 条" :value="5" />
                <el-option label="10 条" :value="10" />
                <el-option label="20 条" :value="20" />
                <el-option label="50 条" :value="50" />
              </el-select>
            </div>
            <el-pagination background layout="prev, pager, next, jumper" :total="total" :page-size="pageSize"
              v-model:current-page="page" @current-change="onPageChange" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="changingPassword" @click="confirmChangePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>
    <!-- 在修改密码对话框之后添加 -->
    <el-dialog v-model="emailVerifyDialogVisible" title="邮箱验证" width="500px" :close-on-click-modal="false">
      <!-- 对话框内容保持不变 -->
    </el-dialog>

    <!-- 更新邮箱对话框 -->
    <el-dialog v-model="updateEmailDialogVisible" title="更换邮箱" width="400px">
      <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef">
        <el-form-item label="新邮箱地址" prop="email">
          <el-input v-model="emailForm.email" placeholder="请输入新的邮箱地址" type="email" />
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="emailForm.code" placeholder="请输入验证码" />
            <el-button :disabled="codeCountdown > 0" @click="sendEmailCode">
              {{ codeCountdown > 0 ? `${codeCountdown}s` : "获取验证码" }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="updateEmailDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateEmail">确认更换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter, useRoute } from "vue-router";

// 图标引入
import {
  User,
  Edit,
  Camera,
  Lock,
  Key,
  Message,
  Phone,
  Ticket,
  School,
  Calendar,
  Check,
  Close,
  Refresh,
  Clock,
} from "@element-plus/icons-vue";
import {
  updateUserInfo,
  uploadAvatar,
  getLoginHistory,
  updatePassword,
  sendVerifyEmail,
  verifyEmail as verifyEmailAPI,
  sendEmailCode as sendEmailCodeAPI,
  updateUserEmail,
} from "../../api/user";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 响应式数据
const isEditing = ref(false);
const saving = ref(false);
const passwordDialogVisible = ref(false);
const changingPassword = ref(false);
const avatarInput = ref(null);
const uploading = ref(false);

const loginLogs = ref([]);
const loginLogsLoading = ref(false);
const page = ref(1);
const pageSize = ref(5); // 根据后端默认或需求调整
const total = ref(0);

const userInfo = ref({});
const stats = ref({});

const profileFormRef = ref();
const passwordFormRef = ref();

// 邮箱验证相关
const emailVerifyDialogVisible = ref(false);
const sendingVerification = ref(false);
const resendCountdown = ref(0);
let countdownTimer = null;

// 更新邮箱相关
const updateEmailDialogVisible = ref(false);
const codeCountdown = ref(0);
let codeTimer = null;

const emailForm = reactive({
  email: "",
  code: "",
});

const emailFormRef = ref();

const emailRules = {
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { len: 6, message: "验证码长度为6位", trigger: "blur" },
  ],
};

// 显示邮箱验证对话框
const showEmailVerifyDialog = () => {
  emailVerifyDialogVisible.value = true;
};

// 发送验证邮件
const sendVerificationEmail = async () => {
  console.log("🔍 发送验证邮件开始");

  if (userInfo.value.emailVerified) {
    ElMessage.info("邮箱已验证");
    return;
  }

  if (!userInfo.value.email) {
    ElMessage.warning("请先设置邮箱地址");
    return;
  }

  try {
    sendingVerification.value = true;

    // 提示用户等待
    ElMessage.info("正在发送验证邮件，邮件服务器处理可能需要较长时间，请耐心等待...");

    // 调用发送验证邮件接口
    const res = await sendVerifyEmail({
      email: userInfo.value.email,
    }, {
      timeout: 60000, // 设置超时时间为60秒
    });

    ElMessage.success("验证邮件已发送，请查看您的邮箱并点击验证链接");
    startResendCountdown();
  } catch (error) {
    console.error("发送验证邮件失败:", error);
    ElMessage.error(error.response?.data?.message || "发送验证邮件失败");
  } finally {
    sendingVerification.value = false;
  }
};

// 开始重新发送倒计时
const startResendCountdown = () => {
  resendCountdown.value = 60;
  clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    resendCountdown.value--;
    if (resendCountdown.value <= 0) {
      clearInterval(countdownTimer);
    }
  }, 1000);
};

// 更新邮箱
const updateEmail = () => {
  emailForm.email = userInfo.value.email || "";
  emailForm.code = "";
  updateEmailDialogVisible.value = true;
  emailFormRef.value?.clearValidate();
};

// 发送邮箱验证码
const sendEmailCode = async () => {
  if (!emailForm.email) {
    ElMessage.warning("请输入邮箱地址");
    return;
  }

  try {
    await sendEmailCodeAPI({
      email: emailForm.email,
      type: "change_email",
    });

    ElMessage.success("验证码已发送到您的邮箱");
    startCodeCountdown();
  } catch (error) {
    console.error("发送验证码失败:", error);
    ElMessage.error(error.response?.data?.message || "发送验证码失败");
  }
};

// 开始验证码倒计时
const startCodeCountdown = () => {
  codeCountdown.value = 60;
  clearInterval(codeTimer);

  codeTimer = setInterval(() => {
    codeCountdown.value--;
    if (codeCountdown.value <= 0) {
      clearInterval(codeTimer);
    }
  }, 1000);
};

// 确认更新邮箱
const confirmUpdateEmail = async () => {
  try {
    await emailFormRef.value.validate();

    const loading = ElLoading.service({
      lock: true,
      text: "更新邮箱中...",
    });

    await updateUserEmail({
      email: emailForm.email,
      code: emailForm.code,
    });

    loading.close();

    // 更新本地用户信息
    const updatedUserInfo = {
      ...userStore.userInfo,
      email: emailForm.email,
      emailVerified: false, // 更换邮箱后需要重新验证
    };

    userStore.userInfo = updatedUserInfo;
    localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
    userInfo.value = { ...updatedUserInfo };

    ElMessage.success("邮箱更新成功，请重新验证");

    updateEmailDialogVisible.value = false;
    emailVerifyDialogVisible.value = true;

    // 自动发送验证邮件
    await verifyEmail();
  } catch (error) {
    console.error("更新邮箱失败:", error);
    if (error.errors) {
      // 表单验证错误，不显示消息
      return;
    }
    ElMessage.error(error.response?.data?.message || "更新邮箱失败");
  }
};

// 在现有的 verifyEmail 方法基础上完善
const verifyEmail = async () => {
  if (userInfo.value.emailVerified) {
    // 已验证，查看详情
    ElMessage.info("邮箱已验证");
    return;
  }

  if (!userInfo.value.email) {
    ElMessage.warning("请先设置邮箱地址");
    return;
  }

  try {
    const loading = ElLoading.service({
      lock: true,
      text: "发送验证邮件中...",
    });

    // 调用发送验证邮件接口
    const res = await sendVerifyEmail({
      email: userInfo.value.email,
    });

    loading.close();

    ElMessage.success("验证邮件已发送，请查看您的邮箱并点击验证链接");

    // 可以显示一个倒计时，防止重复发送
    startResendCountdown();
  } catch (error) {
    console.error("发送验证邮件失败:", error);
    ElMessage.error(error.response?.data?.message || "发送验证邮件失败");
  }
};

// 重新发送验证邮件
const resendVerificationEmail = async () => {
  if (resendCountdown.value > 0) {
    ElMessage.warning(`请等待 ${resendCountdown.value} 秒后重新发送`);
    return;
  }

  await verifyEmail();
};

const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  page.value = 1; // 重置到第一页
  loadLoginLogs();
};

const onPageChange = (newPage) => {
  page.value = newPage;
  loadLoginLogs();
};

const isLoginSuccess = (row) => {
  if (!row) return false;
  // 优先使用数值型状态（1 成功，0 失败）
  const s = row.status ?? row.loginResult ?? row.result ?? row.success;
  if (typeof s === "number") return s === 1;
  if (typeof s === "boolean") return s;
  if (typeof s === "string") return /^(1|成功|ok|true)$/i.test(String(s));
  return false;
};
const loadLoginLogs = async () => {
  loginLogsLoading.value = true;
  try {
    const params = {
      pageNo: page.value,
      pageSize: pageSize.value,
    };
    const res = await getLoginHistory(params);
    // 兼容后端返回包装层：res -> res.data -> res.data.data
    const body = res && res.data ? res.data.data ?? res.data : res ?? {};
    // 优先读取 list / records / rows 等字段
    const list = body.list ?? body.records ?? body.rows ?? body.data ?? [];
    const tot =
      Number(body.total ?? body.totalCount ?? body.count ?? list.length) ||
      list.length;
    // 归一化每条记录字段
    loginLogs.value = (list || []).map((item, idx) => {
      const statusRaw =
        item.loginResult ?? item.status ?? item.result ?? item.success;
      const statusCode =
        typeof statusRaw === "number"
          ? statusRaw
          : typeof statusRaw === "string" && /^\d+$/.test(statusRaw)
            ? Number(statusRaw)
            : null;
      const statusText =
        statusCode === 1
          ? "成功"
          : statusCode === 0
            ? "失败"
            : item.statusText ??
            item.message ??
            (isLoginSuccess({ status: statusRaw }) ? "成功" : "失败");
      return {
        loginTime: item.loginTime,
        ip: item.loginIp,
        location: item.loginLocation,
        device: item.loginDevice,
        status: item.loginResult,
        statusText,
      };
    });

    total.value = tot;

    if (loginLogs.value.length === 0 && page.value > 1) {
      page.value = 1;
      await loadLoginLogs();
    }
  } catch (err) {
    console.error("加载登录记录失败：", err);
    ElMessage.error("加载登录记录失败");
    loginLogs.value = [];
    total.value = 0;
  } finally {
    loginLogsLoading.value = false;
  }
};

// 点击按钮触发文件选择
const changeAvatar = () => {
  avatarInput.value && avatarInput.value.click();
};
// 文件选中后上传
const onAvatarSelected = async (event) => {
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
// 表单数据
const profileForm = reactive({
  realName: "",
  username: "",
  email: "",
  phone: "",
  major: "",
  collegeName: "",
  grade: "",
  className: "",
  researchField: "",
  introduce: "",
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 表单验证规则
const profileRules = {
  realName: [{ required: true, message: "请输入真实姓名", trigger: "blur" }],
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入有效的手机号码",
      trigger: "blur",
    },
  ],
  major: [{ max: 50, message: "请输入专业名称", trigger: "blur" }],
  collegeName: [{ message: "请选择学院", trigger: "blur" }],
  grade: [{ max: 10, message: "请输入年级信息", trigger: "blur" }],
  className: [{ max: 50, message: "请输入班级名称", trigger: "blur" }],
  introduce: [{ max: 200, message: "请输入个人简介", trigger: "blur" }],
};

const passwordRules = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error("两次输入密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};
// 添加计算属性确保数据实时更新
const displayUserInfo = computed(() => {
  // 确保优先使用最新的 userInfo.value
  const source = userInfo.value && Object.keys(userInfo.value).length > 0
    ? userInfo.value
    : userStore.userInfo || {};

  console.log("🔄 displayUserInfo 计算:", {
    userInfo: userInfo.value?.emailVerified,
    userStore: userStore.userInfo?.emailVerified,
    result: source.emailVerified
  });

  return source;
});
// 计算属性
const getRoleTagType = (role) => {
  const typeMap = {
    STUDENT: "success",
    TEACHER: "warning",
    ADMIN: "danger",
  };
  return typeMap[role] || "info";
};

const startEditing = () => {
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  // 重置表单数据为当前用户信息
  Object.assign(profileForm, {
    realName: userInfo.value.realName || "",
    username: userInfo.value.username || "",
    email: userInfo.value.email || "",
    phone: userInfo.value.phone || "",
    major: userInfo.value.major || "",
    collegeName: userInfo.value.collegeName || "",
    grade: userInfo.value.grade || "",
    className: userInfo.value.className || "",
    introduce: userInfo.value.introduce || "",
  });
};

const saveProfile = async () => {
  try {
    if (!profileFormRef.value) {
      console.error("profileFormRef 未绑定");
      ElMessage.error("表单未就绪，请刷新重试");
      return;
    }

    // 先单独做表单校验，校验失败直接返回并打印错误详情
    try {
      await profileFormRef.value.validate();
    } catch (validationError) {
      console.error("表单校验失败：", validationError);
      ElMessage.error("表单校验失败，请检查输入");
      return;
    }
    saving.value = true;

    const submitData = {
      ...profileForm,
      userId: userInfo.value.userId || userStore.userInfo.userId,
    };

    // 保存操作
    const response = await updateUserInfo(submitData);
    console.log("更新用户信息接口响应：", response);
    if (response.data) {
      // 确保保留原有的头像信息
      const updatedUserInfo = {
        ...response.data,
        // 如果后端没有返回头像，保留原有的头像
        avatar: response.data.avatar || userStore.userInfo.avatar,
      };
      if (typeof userStore.setUserInfo === "function") {
        userStore.setUserInfo(updatedUserInfo);
      } else if (typeof userStore.$patch === "function") {
        userStore.$patch({ userInfo: updatedUserInfo });
      } else {
        userStore.userInfo = updatedUserInfo;
      }
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      userInfo.value = { ...updatedUserInfo };

      // 确保表单数据和存储数据一致
      Object.assign(profileForm, {
        realName: response.data.realName || "",
        username: response.data.username || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        major: response.data.major || "",
        collegeName: response.data.collegeName || "",
        grade: response.data.grade || "",
        className: response.data.className || "",
        introduce: response.data.introduce || "",
      });
    } else {
      // 如果接口没有返回完整数据，手动更新
      userStore.userInfo = { ...userStore.userInfo, ...profileForm };
      localStorage.setItem("userInfo", JSON.stringify(userStore.userInfo));
      userInfo.value = { ...userInfo.value, ...profileForm };
    }

    ElMessage.success("个人信息更新成功");
    isEditing.value = false;
  } finally {
    saving.value = false;
  }
};

const changePassword = () => {
  passwordDialogVisible.value = true;
  // 重置密码表单
  Object.keys(passwordForm).forEach((key) => {
    passwordForm[key] = "";
  });
  passwordFormRef.value?.clearValidate();
};

const confirmChangePassword = async () => {
  try {
    // 表单校验
    await passwordFormRef.value.validate();
    changingPassword.value = true;

    // 构建提交数据（按后端要求调整字段名）
    const payload = {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    };

    const res = await updatePassword(payload);
    const data = res?.data ?? res;

    // 通用成功判断：HTTP 2xx 且后端未明确返回失败
    const httpOK =
      res && typeof res.status === "number"
        ? res.status >= 200 && res.status < 300
        : true;
    const bizOK = !(
      data &&
      (data.success === false || data.code === 500 || data.code === "ERROR")
    );

    if (httpOK && bizOK) {
      ElMessage.success(data?.message || "密码修改成功，请重新登录");

      // 使用 store.logout()（若存在），否则回退到手动清理
      try {
        if (typeof userStore.logout === "function") {
          await userStore.logout();
        } else {
          if (typeof userStore.setToken === "function") userStore.setToken("");
          else userStore.token = "";
          if (typeof userStore.setUserInfo === "function")
            userStore.setUserInfo({});
          else if (typeof userStore.$patch === "function")
            userStore.$patch({ userInfo: {} });
          userStore.userInfo = {};
          localStorage.removeItem("token");
          localStorage.removeItem("userInfo");
        }
      } catch (e) {
        /* ignore */
      }
      passwordDialogVisible.value = false;
      Object.keys(passwordForm).forEach((key) => {
        passwordForm[key] = "";
      });
      passwordFormRef.value?.clearValidate();

      // 延迟跳转，保证提示可见
      setTimeout(() => {
        router.push({ name: "Login" });
      }, 500);
    } else {
      const msg = data?.message || "密码修改失败";
      ElMessage.error(msg);
    }
  } catch (err) {
    console.error("修改密码失败：", err);
    const msg = err?.response?.data?.message || err?.message || "修改密码失败";
    ElMessage.error(msg);
  } finally {
    changingPassword.value = false;
  }
};

const initializeUserData = () => {
  // 从 userStore 获取用户信息
  const storeInfo = userStore.userInfo;
  console.log("初始化数据源:", {
    storeInfo: storeInfo,
    storeEmailVerified: storeInfo?.emailVerified,
    currentUserInfo: userInfo.value?.emailVerified
  });

  if (storeInfo) {
    // 更新 userInfo 响应式数据
    const currentEmailVerified = userInfo.value?.emailVerified;
    userInfo.value = {
      ...storeInfo,
      emailVerified: storeInfo.emailVerified !== undefined ? storeInfo.emailVerified : (currentEmailVerified !== undefined ? currentEmailVerified : false)
    };
    // 添加邮箱验证状态的默认值
    if (userInfo.value.emailVerified === undefined) {
      userInfo.value.emailVerified = false;
    }

    // 更新 profileForm 表单数据
    Object.assign(profileForm, {
      realName: storeInfo.realName || "",
      username: storeInfo.username || "",
      email: storeInfo.email || "",
      phone: storeInfo.phone || "",
      major: storeInfo.major || "",
      collegeName: storeInfo.collegeName || "",
      grade: storeInfo.grade || "",
      className: storeInfo.className || storeInfo.classInfo || "",
      researchField: storeInfo.researchField || "",
      introduce: storeInfo.introduce || "",
    });

    // 初始化统计数据（根据实际接口调整）
    stats.value = {
      paperCount: storeInfo.paperCount || 0,
      reviewCount: storeInfo.reviewCount || 0,
      passedCount: storeInfo.passedCount || 0,
    };
  }
};

watch(
  () => userStore.userInfo,
  (newUserInfo) => {
    if (newUserInfo) {
      initializeUserData();
    }
  },
  { deep: true, immediate: true }
);
const formatDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("zh-CN");
};

onMounted(() => {
  initializeUserData();
  loadLoginLogs();

  // 检查邮箱验证token
  checkEmailVerification();
});
// 检查并处理邮箱验证
const checkEmailVerification = async () => {
  if (!route) {
    console.warn("route is not available");
    return;
  }

  const token = route.query.verify_token || route.query.token;
  console.log("检查邮箱验证token:", token); // 添加调试信息
  if (token) {
    try {
      const loading = ElLoading.service({
        lock: true,
        text: "验证邮箱中...",
      });

      const response = await verifyEmailAPI(token);
      console.log("邮箱响应:", response);

      loading.close();

      // 更新用户验证状态
      const updatedUserInfo = {
        ...userStore.userInfo,
        emailVerified: true,
      };

      userStore.setUserInfo(updatedUserInfo)
      const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updatedLocalInfo = {
        ...currentUserInfo,
        emailVerified: true
      };
      localStorage.setItem("userInfo", JSON.stringify(updatedLocalInfo));
      userInfo.value = {
        ...updatedUserInfo,
        emailVerified: true
      };

      ElMessage.success("邮箱验证成功！");

      // 清除URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      await initializeUserData();
    } catch (error) {
      console.error("邮箱验证失败:", error);
      ElMessage.error(error.response?.data?.message || "邮箱验证失败");
    }
  }
};
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 0;
}

.page-header {
  margin-bottom: 1.5rem;

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

.profile-content {
  .el-card {
    border-radius: 12px;
    border: 1px solid #f1f2f6;
    margin-bottom: 1.5rem;

    :deep(.el-card__header) {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f2f6;

      .card-header {
        display: flex;
        justify-content: space-between;
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

    :deep(.el-card__body) {
      padding: 1.25rem;
    }
  }
}

.profile-overview {
  text-align: center;

  .avatar-section {
    margin-bottom: 1.5rem;

    .avatar-actions {
      margin-top: 0.75rem;
    }
  }

  .user-details {
    .user-name {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.25rem;
    }

    .user-role {
      margin: 0 0 1.5rem 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin: 0.75rem 0;
      color: #5a6c7d;

      .el-icon {
        margin-right: 0.5rem;
        color: #667eea;
        width: 16px;
      }

      span {
        margin-right: 0.5rem;
        min-width: 60px;
        text-align: right;
      }

      strong {
        color: #2c3e50;
      }
    }
  }
}

.profile-stats {
  .stat-item {
    text-align: center;

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #7f8c8d;
      margin-top: 0.25rem;
    }
  }
}

.security-items {
  .security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #f8f9fa;

    &:last-child {
      border-bottom: none;
    }

    .security-info {
      display: flex;
      align-items: center;

      .el-icon {
        margin-right: 0.75rem;
        color: #667eea;
        font-size: 1.25rem;
      }

      .security-details {
        .security-title {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .security-desc {
          font-size: 0.875rem;
          color: #7f8c8d;
        }
      }
    }
  }
}

.form-actions {
  display: flex;
  gap: 0.75rem;
}

.email-verify-dialog {
  .verify-actions {
    display: flex;
    gap: 12px;
    margin: 20px 0;

    .el-button {
      flex: 1;
    }
  }

  .verify-tips {
    margin-top: 20px;
  }

  .verified-status {
    text-align: center;
  }
}

.code-input {
  display: flex;
  align-items: center;

  .el-input {
    flex: 1;
  }

  .el-button {
    margin-left: 10px;
    white-space: nowrap;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .profile-content {
    .el-col {
      margin-bottom: 1rem;
    }
  }

  .user-details .detail-item {
    justify-content: center;
    text-align: left;
  }
}
</style>