import { defineStore } from "pinia";
import { getSystemStatus } from "@/api/admin/systemStatus";
import { useUserStore } from "@/stores/user";

// 全局维护模式状态：
// - 启动时经 fetchStatus 拉取一次（失败静默降级为非维护，后端接口未上线期间无横幅无遮罩）
// - WS 主题 /topic/announcements 的 MAINTENANCE_STATUS_CHANGED 消息实时更新（setFromWs）
// - 任何业务请求收到 503 + errorCode=SYSTEM_MAINTENANCE 时兜底更新（setFrom503）
export const useMaintenanceStore = defineStore("maintenance", {
  state: () => ({
    maintenanceMode: false,
    notice: "",
    startTime: "",
    endTime: "",
    fetched: false,
  }),
  getters: {
    isAdminLike() {
      const userStore = useUserStore();
      return userStore.isAdmin;
    },
    // 普通用户在维护期间展示横幅与遮罩；管理员/超管不受影响（后端对其放行）
    showBanner() {
      return this.maintenanceMode && !this.isAdminLike;
    },
  },
  actions: {
    applyStatus(data) {
      this.maintenanceMode = !!(data && (data.maintenanceStatus ?? data.maintenanceMode));
      this.notice = data?.maintenanceNotice || "";
      this.startTime = data?.maintenanceStartTime || "";
      this.endTime = data?.maintenanceEndTime || "";
      this.fetched = true;
    },
    async fetchStatus() {
      try {
        const res = await getSystemStatus();
        if (res.code === 200 && res.data) {
          this.applyStatus(res.data);
        }
      } catch {
        // 后端接口未上线或网络异常：保持非维护状态，不打扰用户
      }
    },
    setFromWs(payload) {
      this.applyStatus(payload);
    },
    setFrom503(payload) {
      this.applyStatus({
        maintenanceStatus: true,
        maintenanceNotice: payload?.message || payload?.data?.maintenanceNotice || "系统维护中，请稍后再试",
        maintenanceStartTime: payload?.data?.maintenanceStartTime || "",
        maintenanceEndTime: payload?.data?.maintenanceEndTime || "",
      });
    },
  },
});
