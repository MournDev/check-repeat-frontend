import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import { tokenManager } from "@/utils/tokenManager";

// 静态路由（无需权限）
const constantRoutes = [
  {
    path: "/",
    name: "Login",
    component: () => import("@/views/login/Login.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/login",
    name: "LoginAlias",
    component: () => import("@/views/login/Login.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/login/Register.vue"),
    // 补 title：路由守卫拿 to.meta.title 拼浏览器标签页，缺了会显示成
    // 「undefined - 系统名」。这几个静态路由都不在 MainLayout 下，只影响标签页。
    meta: { title: "注册" },
  },
  {
    path: "/reset",
    name: "Reset",
    component: () => import("@/views/login/Reset.vue"),
    meta: { title: "重置密码" },
  },
  {
    path: "/verify-email",
    name: "VerifyEmail",
    component: () => import("@/views/EmailVerified.vue"),
    meta: { title: "邮箱验证", requiresAuth: false },
  },
];

// 权限路由（需登录+对应角色）
//
// 侧边栏菜单的唯一事实来源（SSOT）就是这张表：需要出现在侧边栏的路由在
// meta.menu 上声明菜单元数据，MainLayout 用 buildMenus（src/utils/menu.js）
// 按当前角色过滤、排序后渲染。新增页面只要标注 meta.menu 就会自动进菜单。
// 字段说明见 src/utils/menu.js 顶部注释。
export const asyncRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("@/components/layout/MainLayout.vue"),
    // 叫「工作台」而不是「仪表盘」：侧边栏与登录页对这项都写「工作台」
    // （MainLayout 的 topNavItems、AuthLayout 的「登录到工作台」），
    // 面包屑改读 meta.title 后这里就是唯一出处，得跟它们对齐。
    meta: { requiresAuth: true, title: "工作台" },
    children: [
      {
        path: "student",
        name: "StudentDashboard",
        component: () => import("@/views/student/Dashboard.vue"),
        meta: { roles: ["STUDENT"], title: "学生仪表盘", menu: { icon: "DataAnalysis", label: "论文工作台", order: 1 } },
      },
      {
        path: "admin",
        name: "AdminDashboard",
        component: () => import("@/views/admin/Dashboard.vue"),
        // roles 是 ADMIN+SUPER_ADMIN（超管超集），但菜单里只给 ADMIN 显示：
        // 超管的概览入口是 /super-admin「系统概览」，运营数据归业务管理员。
        meta: { roles: ["ADMIN", "SUPER_ADMIN"], title: "运营概览", menu: { icon: "DataBoard", label: "运营概览", roles: ["ADMIN"], order: 1 } },
      },
    ],
  },
  {
    path: "/message-center",
    name: "MessageCenter",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, title: "消息中心" },
    children: [
      {
        path: "",
        component: () => import("@/components/MessageCenter.vue"),
        meta: { title: "消息中心" },
      },
    ],
  },
  {
    path: "/student",
    component: () => import("@/components/layout/MainLayout.vue"),
    // 这几个角色级父路由本身不带页面，但**必须给 title**：面包屑改读 route.matched
    // 后，没有 title 的记录会被整条跳过，/student/paper-submit 会掉成「首页/论文提交」，
    // 少掉「学生」这一级。
    meta: { requiresAuth: true, roles: ["STUDENT"], title: "学生" },
    children: [
      { path: "paper-submit", name: "PaperSubmit", component: () => import("@/views/student/PaperSubmit.vue"), meta: { title: "论文提交", menu: { icon: "UploadFilled", order: 2 } } },
      // 详情/监控/报告页从列表跳入，不是导航目标，menu.hidden 仅作文档标注
      { path: "paper-details", name: "PaperDetail", component: () => import("@/views/student/PaperDetail.vue"), meta: { title: "论文详情", menu: { hidden: true } } },
      { path: "my-papers", name: "MyPapers", component: () => import("@/views/student/MyPapers.vue"), meta: { title: "我的论文", menu: { icon: "FolderOpened", order: 3 } } },
      { path: "advisor-interaction", name: "AdvisorInteraction", component: () => import("@/views/student/AdvisorInteraction.vue"), meta: { title: "导师互动", menu: { icon: "ChatDotRound", order: 4 } } },
      { path: "file-management", name: "StudentFileManagement", component: () => import("@/views/student/FileManagement.vue"), meta: { title: "文件管理", menu: { icon: "Folder", order: 5 } } },
      { path: "settings", name: "StudentSettings", component: () => import("@/views/student/Settings.vue"), meta: { title: "个人设置", menu: { icon: "Setting", order: 9, spacer: true } } },
      { path: "help-center", name: "HelpCenter", component: () => import("@/views/student/HelpCenter.vue"), meta: { title: "帮助中心", menu: { icon: "Service", order: 10 } } },
      { path: "check-monitor/:paperId", name: "CheckMonitor", component: () => import("@/views/student/CheckMonitor.vue"), meta: { title: "查重监控", menu: { hidden: true } } },
      { path: "plagiarism-report/:paperId", name: "PlagiarismReport", component: () => import("@/views/student/PlagiarismReport.vue"), meta: { title: "查重报告", menu: { hidden: true } } },
      { path: "check-history", name: "CheckHistoryList", component: () => import("@/views/student/CheckHistoryList.vue"), meta: { title: "查重历史", menu: { icon: "Histogram", group: "查重管理", order: 7 } } },
      { path: "check-history/:paperId", name: "CheckHistory", component: () => import("@/views/student/CheckHistory.vue"), meta: { title: "查重历史详情", menu: { hidden: true } } },
      { path: "student-check-with-websocket", name: "StudentCheckWithWebSocket", component: () => import("@/views/student/StudentCheckWithWebSocket.vue"), meta: { title: "查重管理", menu: { icon: "Document", label: "查重任务", group: "查重管理", order: 6 } } },
      { path: "academic-integrity", name: "AcademicIntegrity", component: () => import("@/views/student/AcademicIntegrity.vue"), meta: { title: "学术诚信", menu: { icon: "Notebook", group: "查重管理", order: 8 } } },
    ],
  },
  {
    path: "/teacher",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, roles: ["TEACHER"], title: "教师" },
    children: [
      { path: "", name: "TeacherDashboard", component: () => import("@/views/teacher/Dashboard.vue"), meta: { title: "教师仪表盘", menu: { icon: "DataBoard", label: "审核工作台", order: 1 } } },
      { path: "student-list", name: "StudentList", component: () => import("@/views/teacher/StudentList.vue"), meta: { title: "学生管理", menu: { icon: "UserFilled", order: 2 } } },
      // PaperReview 是承载子页面的容器，本身不是导航目标；菜单里挂的是它的两个子页
      { path: "paper-review", name: "PaperReview", component: () => import("@/views/teacher/PaperReview.vue"), meta: { title: "论文审核", menu: { hidden: true } }, children: [
        { path: '', name: 'PendingReviewsDefault', component: () => import('@/views/teacher/PendingReviews.vue'), meta: { title: '待审核论文' } },
        { path: "pending", name: "PendingReviews", component: () => import("@/views/teacher/PendingReviews.vue"), meta: { title: "待审核论文", menu: { icon: "Clock", group: "论文审核", order: 3 } } },
        { path: "audit-records", name: "AuditRecords", component: () => import("@/views/teacher/AuditRecords.vue"), meta: { title: "审核记录", menu: { icon: "Histogram", group: "论文审核", order: 4 } } }
      ]},
      { path: "data-statistics", name: "DataStatistics", component: () => import("@/views/teacher/DataStatistics.vue"), meta: { title: "数据统计", menu: { icon: "TrendCharts", order: 5 } } },
      { path: "profile", name: "TeacherProfile", component: () => import("@/views/teacher/Profile.vue"), meta: { title: "个人中心", menu: { icon: "Setting", label: "我的设置", order: 10, spacer: true } } },
      { path: "review-templates", name: "ReviewTemplates", component: () => import("@/views/teacher/ReviewTemplates.vue"), meta: { title: "审核意见模板", menu: { icon: "Document", order: 6 } } },
      { path: "student-groups", name: "StudentGroups", component: () => import("@/views/teacher/StudentGroups.vue"), meta: { title: "学生分组管理", menu: { icon: "UserFilled", order: 7 } } },
      { path: "chat-center", name: "ChatCenter", component: () => import("@/views/teacher/ChatCenter.vue"), meta: { title: "在线聊天", menu: { icon: "ChatDotRound", order: 8 } } },
      { path: "file-management", name: "TeacherFileManagement", component: () => import("@/views/teacher/FileManagement.vue"), meta: { title: "文件管理", menu: { icon: "Folder", order: 9 } } },
    ],
  },
  {
    path: "/admin",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "SUPER_ADMIN"], title: "管理员" },
    // 这一批路由 ADMIN 与 SUPER_ADMIN 共用，但两个角色的菜单位置/分组不同
    // （如「查重规则」：ADMIN 无分组、超管归「系统运维」组），差异写在
    // menu 下以角色名为 key 的覆盖块里，buildMenus 按当前角色合并。
    children: [
      // 论文业务管理只进 ADMIN 菜单。menu.roles 仅控菜单露出，路由 roles 仍含
      // SUPER_ADMIN（超管可 URL 直达）；缺了这层会继承父路由双角色而泄漏进超管菜单
      { path: "user-management", name: "UserManagement", component: () => import("@/views/admin/UserManagement.vue"), meta: { title: "用户管理", menu: { icon: "UserFilled", roles: ["SUPER_ADMIN"], order: 1 } } },
      { path: "paper-assignment", name: "PaperAssignment", component: () => import("@/views/admin/PaperAssignment.vue"), meta: { title: "论文分配", menu: { roles: ["ADMIN"], icon: "Connection", label: "导师分配", group: "论文分配", order: 4 } } },
      { path: "paper-assignment/manual", name: "ManualPaperAssignment", component: () => import("@/views/admin/ManualPaperAssignment.vue"), meta: { title: "手动论文分配", menu: { roles: ["ADMIN"], icon: "Pointer", label: "手动分配", group: "论文分配", order: 5 } } },
      { path: "paper-assignment/auto", name: "AutoPaperAssignment", component: () => import("@/views/admin/AutoPaperAssignment.vue"), meta: { title: "自动论文分配", menu: { roles: ["ADMIN"], icon: "MagicStick", label: "自动分配", group: "论文分配", order: 6 } } },
      { path: "paper-assignment/history", name: "PaperAssignmentHistory", component: () => import("@/views/admin/PaperAssignmentHistory.vue"), meta: { title: "论文分配记录", menu: { roles: ["ADMIN"], icon: "Notebook", label: "分配记录", group: "论文分配", order: 7 } } },
      { path: "system-config", name: "SystemConfig", component: () => import("@/views/admin/SystemConfig.vue"), meta: { title: "系统配置", menu: { icon: "Tools", roles: ["SUPER_ADMIN"], group: "系统运维", order: 4 } } },
      { path: "log-center", name: "LogCenter", component: () => import("@/views/admin/LogCenter.vue"), meta: { title: "日志中心", menu: { icon: "Document", ADMIN: { group: "系统管理", order: 15 }, SUPER_ADMIN: { group: "监控与日志", order: 10 } } } },
      { path: "settings", name: "AdminSettings", component: () => import("@/views/admin/Settings.vue"), meta: { title: "个人设置", menu: { icon: "Setting", roles: ["ADMIN"], order: 16, spacer: true } } },
      { path: "school-overview", name: "SchoolOverview", component: () => import("@/views/admin/SchoolOverview.vue"), meta: { title: "全校数据概览", menu: { icon: "DataAnalysis", label: "全校概览", order: 2 } } },
      { path: "paper-library", name: "PaperLibrary", component: () => import("@/views/admin/PaperLibrary.vue"), meta: { title: "论文库管理", menu: { roles: ["ADMIN"], icon: "Files", label: "论文库", group: "论文管理", order: 3 } } },
      { path: "report-management", name: "ReportManagement", component: () => import("@/views/admin/ReportManagement.vue"), meta: { title: "报告管理", menu: { roles: ["ADMIN"], icon: "Histogram", order: 8 } } },
      { path: "knowledge-management", name: "KnowledgeManagement", component: () => import("@/views/admin/KnowledgeManagement.vue"), meta: { title: "知识库管理", menu: { roles: ["ADMIN"], icon: "Collection", order: 9 } } },
      { path: "check-rule-management", name: "CheckRuleManagement", component: () => import("@/views/admin/CheckRuleManagement.vue"), meta: { title: "查重规则", menu: { icon: "Setting", ADMIN: { order: 10 }, SUPER_ADMIN: { group: "系统运维", order: 7 } } } },
      { path: "compare-lib-management", name: "CompareLibManagement", component: () => import("@/views/admin/CompareLibManagement.vue"), meta: { title: "比对库管理", menu: { icon: "Files", ADMIN: { order: 11 }, SUPER_ADMIN: { group: "系统运维", order: 8 } } } },
      { path: "subject-management", name: "SubjectManagement", component: () => import("@/views/admin/SubjectManagement.vue"), meta: { title: "学科领域管理", menu: { icon: "Grid", ADMIN: { order: 12 }, SUPER_ADMIN: { group: "系统运维", order: 9 } } } },
      { path: "system-notice-management", name: "SystemNoticeManagement", component: () => import("@/views/admin/SystemNoticeManagement.vue"), meta: { title: "系统公告与维护", menu: { icon: "Bell", ADMIN: { group: "系统管理", order: 13 }, SUPER_ADMIN: { group: "监控与日志", order: 12 } } } },
      { path: "message-template-management", name: "MessageTemplateManagement", component: () => import("@/views/admin/MessageTemplateManagement.vue"), meta: { title: "消息模板", menu: { icon: "Document", ADMIN: { group: "系统管理", order: 14 }, SUPER_ADMIN: { group: "监控与日志", order: 13 } } } },
    ],
  },
  {
    path: "/super-admin",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, roles: ["SUPER_ADMIN"], title: "超级管理员" },
    children: [
      { path: "", name: "SuperAdminDashboard", component: () => import("@/views/admin/Dashboard.vue"), meta: { title: "系统概览", menu: { icon: "Monitor", order: 3 } } },
      // 系统配置 / 日志中心与 /admin 下是同一组件，这里只保留 URL 兼容跳转，
      // 不再重复注册路由（同一页面两条 URL 会分裂面包屑、高亮与埋点语义）。
      // /admin 的 roles 含 SUPER_ADMIN，超管可直接访问 /admin/*。
      { path: "system-config", redirect: "/admin/system-config" },
      { path: "log-center", redirect: "/admin/log-center" },
      { path: "similarity-thresholds", name: "SuperAdminSimilarityThresholds", component: () => import("@/views/super-admin/SimilarityThreshold.vue"), meta: { title: "相似度阈值设置", menu: { icon: "TrendCharts", label: "相似度阈值", group: "系统运维", order: 5 } } },
      { path: "review-workflow", name: "SuperAdminReviewWorkflow", component: () => import("@/views/super-admin/ReviewWorkflow.vue"), meta: { title: "审核工作流配置", menu: { icon: "Connection", label: "审核工作流", group: "系统运维", order: 6 } } },
      { path: "system-monitoring", name: "SystemMonitoring", component: () => import("@/views/admin/SystemMonitoring.vue"), meta: { title: "系统监控", menu: { icon: "Monitor", group: "监控与日志", order: 11 } } },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/common/NotFound.vue"),
    meta: { title: "页面不存在" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...constantRoutes, ...asyncRoutes],
});

// 路由守卫：统一使用tokenManager
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - ${import.meta.env.VITE_SYSTEM_NAME}`;

  const noAuthPaths = ['/login', '/register', '/reset', '/verify-email'];
  if (noAuthPaths.includes(to.path)) return next();

  if (to.meta.requiresAuth !== false) {
    const token = tokenManager.get();
    if (!token || tokenManager.isExpired()) {
      tokenManager.remove();
      return next('/login');
    }

    const role = tokenManager.getRole();
    const allowedRoles = to.meta.roles || [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      ElMessage.error("无权限访问该页面");
      return next(from.path);
    }
  }

  next();
});

export default router;
