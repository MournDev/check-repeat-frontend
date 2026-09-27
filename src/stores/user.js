import { defineStore } from "pinia";
import { login as userLogin, register, logout as apiLogout } from "@/api/login";
import { tokenManager } from "@/utils/tokenManager";

// localStorage中只保留非敏感的展示字段（敏感信息如email/phone从后端实时获取）
const SAFE_STORAGE_FIELDS = ['userId', 'username', 'realName', 'avatar', 'major', 'grade', 'className', 'position', 'collegeName'];

function filterSafeInfo(data) {
  if (!data) return null;
  const safe = {};
  SAFE_STORAGE_FIELDS.forEach(k => {
    if (data[k] !== undefined && data[k] !== null) safe[k] = data[k];
  });
  return safe;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    token: tokenManager.get(),
    role: "",
    userInfo: JSON.parse(localStorage.getItem("userInfo")) || null,
    lastActivityTime: Date.now(),
  }),
  actions: {
    async login(loginForm) {
      const { username, password } = loginForm;
      const res = await userLogin({ username, password });
      this.token = res.data.token;
      this.role = tokenManager.getRole() || res.data.roleCode || "";
      this.userInfo = {
        userId: res.data.userId,
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
        expireDate: res.data.expireDate,
        expireTime: res.data.expireTime,
        position: res.data.position,
        department: res.data.department,
        officeAddress: res.data.officeAddress,
        collegeName: res.data.collegeName,
      };
      tokenManager.set(this.token);
      localStorage.setItem("userInfo", JSON.stringify(filterSafeInfo(this.userInfo)));
      this.lastActivityTime = Date.now();
      return res;
    },
    async register(registerForm) {
      const res = await register(registerForm);
      return res;
    },
    async logout() {
      try {
        await apiLogout();
      } catch {
        // 即使后端调用失败也继续清除本地状态
      }
      this.token = "";
      this.role = "";
      this.userInfo = null;
      this.lastActivityTime = 0;
      tokenManager.remove();
      localStorage.removeItem("userInfo");
    },
    setUserInfo(userData) {
      this.userInfo = userData;
      localStorage.setItem("userInfo", JSON.stringify(filterSafeInfo(userData)));
    },
    updateAvatar(avatarRaw) {
      this.userInfo = { ...(this.userInfo || {}), avatar: avatarRaw };
      localStorage.setItem("userInfo", JSON.stringify(filterSafeInfo(this.userInfo)));
    },
    restoreFromStorage() {
      try {
        const s = localStorage.getItem("userInfo");
        if (s) this.userInfo = JSON.parse(s);
        const t = tokenManager.get();
        if (t) {
          this.token = t;
          this.role = tokenManager.getRole();
        }
        this.lastActivityTime = Date.now();
      } catch {
        /* ignore */
      }
    },
    isTokenValid() {
      return !!this.token && !tokenManager.isExpired();
    },
    updateActivityTime() {
      this.lastActivityTime = Date.now();
    },
    async verifySensitiveOperation() {
      if (!this.token) return false;
      return !tokenManager.isNearExpiry();
    },
  },
  getters: {
    avatarSrc: (state) => {
      const raw = state.userInfo?.avatar || "";
      if (!raw || raw === "null" || raw === "undefined") return "";
      if (/^(https?:|\/\/|data:)/.test(raw)) return raw;
      const base = (
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
      ).replace(/\/$/, "");
      return base ? `${base}${raw.startsWith("/") ? "" : "/"}${raw}` : raw;
    },
    realName: (state) => state.userInfo?.realName || "",
    userName: (state) => state.userInfo?.username || "",
    isLoggedIn: (state) => !!state.token,
    isStudent: (state) => state.role === "STUDENT",
    isTeacher: (state) => state.role === "TEACHER",
    isAdmin: (state) => state.role === "ADMIN" || state.role === "SUPER_ADMIN",
    isSuperAdmin: (state) => state.role === "SUPER_ADMIN",
    lastLoginTime: (state) => state.userInfo?.lastLoginTime || "",
  },
});
