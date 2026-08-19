import { defineStore } from "pinia";
import Cookies from "js-cookie";
import { login as userLogin, register } from "@/api/login";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: Cookies.get("token") || "", // 从Cookie读取令牌（持久化）
    role: Cookies.get("role") || "", // 角色（STUDENT/TEACHER/ADMIN）
    userInfo: JSON.parse(localStorage.getItem("userInfo")) || null, // 用户信息
  }),
  actions: {
    // 登录：存储令牌和角色
    async login(loginForm) {
      console.log("loginForm", loginForm);
      const { username, password } = loginForm;
      const res = await userLogin({
        username: username,
        password: password,
      });
      this.token = res.data.token;
      this.role = res.data.roleCode;
      // 保存完整的用户信息到 userInfo
      this.userInfo = {
        userId: res.data.userId, // ✅ 正确存储userId
        username: res.data.username,
        realName: res.data.realName,
        major: res.data.major,
        grade: res.data.grade,
        className: res.data.className,
        phone: res.data.phone,
        email: res.data.email,
        emailVerified: res.data.emailVerified,
        introduce: res.data.introduce,
        avatar: res.data.avatar,
        lastLoginTime: res.data.lastLoginTime,
        // title: res.data.title,
        // collegeId: res.data.collegeId,
        // researchFields: res.data.researchFields,
        // office: res.data.office,
        // officeHours: res.data.officeHours,
        // maxReviewCount: res.data.maxReviewCount,
        // remainingReviewCount: res.data.remainingReviewCount,
        expireDate: res.data.expireDate,
        expireTime: res.data.expireTime,
      };
      // 持久化存储（防止页面刷新丢失）
      Cookies.set("token", this.token, { expires: 1 }); // 有效期1天
      Cookies.set("role", this.role, { expires: 1 });
      localStorage.setItem("userInfo", JSON.stringify(this.userInfo));
      return res;
    },
    // 添加注册方法
    async register(registerForm) {
      try {
        console.log("Store: 调用注册API", registerForm);

        // 调用注册API
        const res = await register(registerForm);
        console.log("Store: 注册成功", res);
        return res;
      } catch (error) {
        console.error("Store: 注册失败", error);
        throw error;
      }
    },
    // 退出登录：清除状态和存储
    logout() {
      this.token = "";
      this.role = "";
      this.userInfo = null;
      Cookies.remove("token");
      Cookies.remove("role");
      localStorage.removeItem("userInfo");
    },
    setUserInfo(userData) {
      this.userInfo = userData;
      // 同时更新本地存储
      localStorage.setItem("userInfo", JSON.stringify(userData));
    },
    updateAvatar(avatarRaw) {
      this.userInfo = { ...(this.userInfo || {}), avatar: avatarRaw };
      localStorage.setItem("userInfo", JSON.stringify(this.userInfo));
    },
    restoreFromStorage() {
      try {
        const s = localStorage.getItem("userInfo");
        if (s) this.userInfo = JSON.parse(s);
        const t = localStorage.getItem("token");
        if (t) this.token = t;
      } catch (e) {
        /* ignore */
      }
    },
  },
  getters: {
    // 计算可访问的头像地址
    avatarSrc: (state) => {
      const raw = state.userInfo?.avatar || "";
      if (!raw || raw === "null" || raw === "undefined") return "";
      if (/^(https?:|\/\/|data:)/.test(raw)) return raw;
      const base = (
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
      ).replace(/\/$/, "");
      return base ? `${base}${raw.startsWith("/") ? "" : "/"}${raw}` : raw;
    },
    // 获取用户真实姓名
    realName: (state) => state.userInfo?.realName || "",

    // 获取用户名
    userName: (state) => state.userInfo?.username || "",

    // 判断是否已登录
    isLoggedIn: (state) => !!state.token,

    // 判断用户角色
    isStudent: (state) => state.role === "STUDENT",
    isTeacher: (state) => state.role === "TEACHER",
    isAdmin: (state) => state.role === "ADMIN",

    // 获取最后登录时间
    lastLoginTime: (state) => state.userInfo?.lastLoginTime || "",
  },
});
