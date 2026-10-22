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
  // 报告验真：面向用人单位/期刊等任何访客，不进登录守卫（P5 清单第 6 节）
  {
    path: "/report-verify",
    name: "ReportVerify",
    component: () => import("@/views/ReportVerify.vue"),
    meta: { title: "报告验真", requiresAuth: false },
  },
];

// 各角色的落地页（单一出处，供路由守卫 403 兜底、MainLayout 面包屑「首页」、
// Login 已登录重定向共用）。以前 MainLayout 里一律拼 `/dashboard/<role>`，但
// /dashboard 下只有 student 和 admin 两个子路由：TEACHER 会拼出并不存在的
// /dashboard/teacher，教师点面包屑「首页」直接落 404。取值与侧边栏 topNavItems
// 里那条「工作台」保持一致 —— 教师的工作台就是 /teacher。
// 认不出的角色（LAB_ASSISTANT 等）在侧边栏没有入口，退回不需要角色权限的消息中心。
export const ROLE_HOME = {
  STUDENT: '/dashboard/student',
  TEACHER: '/teacher',
  ADMIN: '/dashboard/admin',
  SUPER_ADMIN: '/super-admin',
}

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
        meta: { roles: ["STUDENT"], title: "论文工作台", menu: { icon: "DataAnalysis", label: "论文工作台", group: "论文", order: 1, top: { order: 1, label: "工作台" } } },
      },
      {
        path: "admin",
        name: "AdminDashboard",
        component: () => import("@/views/admin/Dashboard.vue"),
        // roles 是 ADMIN+SUPER_ADMIN（超管超集），但菜单里只给 ADMIN 显示：
        // 超管的概览入口是 /super-admin「系统概览」，运营数据归业务管理员。
        meta: { roles: ["ADMIN", "SUPER_ADMIN"], title: "运营概览", menu: { icon: "DataBoard", label: "运营概览", roles: ["ADMIN"], group: "概览", order: 1, top: { order: 1, label: "工作台" } } },
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
        // 路由本身不限角色（四个角色都能收站内消息），菜单 roles 必须显式写全，
        // 否则 buildMenus 继承链上找不到任何 roles 而一项都不显示。
        // order 统一插在各角色菜单尾部的设置/帮助区：学生 9.5（个人设置与帮助之间）、
        // 教师/管理员 10.5/12.5（设置之后）、超管 13（最末，spacer 分区）。
        meta: { title: "消息中心", menu: { icon: "Message", roles: ["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"], STUDENT: { order: 9.5, group: "设置与支持" }, TEACHER: { order: 10.5, group: "设置与支持" }, ADMIN: { order: 12.5, group: "设置" }, SUPER_ADMIN: { order: 13, spacer: true } } },
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
      { path: "paper-submit", name: "PaperSubmit", component: () => import("@/views/student/PaperSubmit.vue"), meta: { title: "论文提交", menu: { icon: "UploadFilled", group: "论文", order: 2 } } },
      // 详情/监控/报告页从列表跳入，不是导航目标，menu.hidden 仅作文档标注
      { path: "paper-details", name: "PaperDetail", component: () => import("@/views/student/PaperDetail.vue"), meta: { title: "论文详情", menu: { hidden: true } } },
      { path: "my-papers", name: "MyPapers", component: () => import("@/views/student/MyPapers.vue"), meta: { title: "我的论文", menu: { icon: "FolderOpened", group: "论文", order: 3, top: { order: 2, label: "论文管理", match: ["/student/paper", "/student/my-papers"] } } } },
      // order 3.5 有意插在我的论文(3)与导师互动(4)之间
      { path: "my-defense", name: "MyDefense", component: () => import("@/views/student/MyDefense.vue"), meta: { title: "我的答辩", menu: { icon: "Trophy", group: "论文", order: 3.5 } } },
      // order 3.6 有意插在我的答辩(3.5)与导师互动(4)之间（P6a 导师评价）
      { path: "advisor-evaluation", name: "AdvisorEvaluation", component: () => import("@/views/student/AdvisorEvaluation.vue"), meta: { title: "导师评价", menu: { icon: "Star", group: "论文", order: 3.6 } } },
      { path: "advisor-interaction", name: "AdvisorInteraction", component: () => import("@/views/student/AdvisorInteraction.vue"), meta: { title: "导师互动", menu: { icon: "ChatDotRound", group: "交流与文件", order: 4, badge: "chat" } } },
      { path: "file-management", name: "StudentFileManagement", component: () => import("@/views/student/FileManagement.vue"), meta: { title: "文件管理", menu: { icon: "Folder", group: "交流与文件", order: 5 } } },
      { path: "settings", name: "StudentSettings", component: () => import("@/views/student/Settings.vue"), meta: { title: "个人设置", menu: { icon: "Setting", group: "设置与支持", order: 9, spacer: true } } },
      { path: "help-center", name: "HelpCenter", component: () => import("@/views/student/HelpCenter.vue"), meta: { title: "帮助中心", menu: { icon: "Service", group: "设置与支持", order: 10 } } },
      { path: "check-monitor/:paperId", name: "CheckMonitor", component: () => import("@/views/student/CheckMonitor.vue"), meta: { title: "查重监控", menu: { hidden: true } } },
      { path: "plagiarism-report/:paperId", name: "PlagiarismReport", component: () => import("@/views/student/PlagiarismReport.vue"), meta: { title: "查重报告", menu: { hidden: true } } },
      { path: "check-history", name: "CheckHistoryList", component: () => import("@/views/student/CheckHistoryList.vue"), meta: { title: "查重历史", menu: { icon: "Histogram", group: "查重管理", order: 7 } } },
      { path: "check-history/:paperId", name: "CheckHistory", component: () => import("@/views/student/CheckHistory.vue"), meta: { title: "查重历史详情", menu: { hidden: true } } },
      { path: "student-check-with-websocket", name: "StudentCheckWithWebSocket", component: () => import("@/views/student/StudentCheckWithWebSocket.vue"), meta: { title: "查重任务", menu: { icon: "Document", label: "查重任务", group: "查重管理", order: 6, top: { order: 3, label: "查重任务", match: ["/student/check", "/student/student-check"] } } } },
      { path: "academic-integrity", name: "AcademicIntegrity", component: () => import("@/views/student/AcademicIntegrity.vue"), meta: { title: "学术诚信", menu: { icon: "Notebook", group: "查重管理", order: 8 } } },
      // P5 句级检测明细（从任务列表/详情跳入，非导航目标）
      { path: "sentence-detail/:taskId", name: "SentenceDetail", component: () => import("@/views/student/SentenceDetail.vue"), meta: { title: "句级检测明细", menu: { hidden: true } } },
    ],
  },
  {
    path: "/teacher",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, roles: ["TEACHER"], title: "教师" },
    children: [
      { path: "", name: "TeacherDashboard", component: () => import("@/views/teacher/Dashboard.vue"), meta: { title: "审核工作台", menu: { icon: "DataBoard", label: "审核工作台", group: "工作台", order: 1, top: { order: 1, label: "工作台", exact: true } } } },
      { path: "student-list", name: "StudentList", component: () => import("@/views/teacher/StudentList.vue"), meta: { title: "学生管理", menu: { icon: "UserFilled", group: "学生管理", order: 5, top: { order: 3, label: "学生管理", match: ["/teacher/student"] } } } },
      // PaperReview 容器仅承载「审核记录」；待审核论文已统一到 review-workbench
      { path: "paper-review", name: "PaperReview", component: () => import("@/views/teacher/PaperReview.vue"), redirect: "/teacher/review-workbench", meta: { title: "论文审核", menu: { hidden: true } }, children: [
        { path: "audit-records", name: "AuditRecords", component: () => import("@/views/teacher/AuditRecords.vue"), meta: { title: "审核记录", menu: { icon: "Histogram", group: "论文管理", order: 4 } } }
      ]},
      { path: "data-statistics", name: "DataStatistics", component: () => import("@/views/teacher/DataStatistics.vue"), meta: { title: "数据统计", menu: { icon: "TrendCharts", group: "工作台", order: 2 } } },
      // order 9 排在学生组之后、设置组之前
      { path: "defense-workbench", name: "DefenseWorkbench", component: () => import("@/views/teacher/DefenseWorkbench.vue"), meta: { title: "答辩工作台", menu: { icon: "Microphone", group: "答辩管理", order: 9 } } },
      // order 7 插在学生分组(6)与学生评价汇总(8)之间（P5 指导进度看板）
      { path: "guidance-progress", name: "TeacherGuidanceProgress", component: () => import("@/views/teacher/GuidanceProgress.vue"), meta: { title: "指导进度看板", menu: { icon: "Odometer", group: "学生管理", order: 7 } } },
      // 待审核论文统一入口（原 paper-review/pending 已下线）
      { path: "review-workbench", name: "TeacherReviewWorkbench", component: () => import("@/views/teacher/ReviewWorkbench.vue"), meta: { title: "待审核论文", menu: { icon: "Clock", label: "待审核论文", group: "论文管理", order: 3, top: { order: 2, label: "论文审核", match: ["/teacher/paper-review", "/teacher/review-workbench"] } } } },
      // order 8 排在与学生相关的最后一项（学生评价汇总）
      { path: "advisor-eval-summary", name: "AdvisorEvalSummary", component: () => import("@/views/teacher/AdvisorEvalSummary.vue"), meta: { title: "学生评价汇总", menu: { icon: "Star", group: "学生管理", order: 8 } } },
      { path: "profile", name: "TeacherProfile", component: () => import("@/views/teacher/Profile.vue"), meta: { title: "个人设置", menu: { icon: "Setting", label: "个人设置", group: "设置与支持", order: 11, spacer: true } } },
      { path: "review-templates", name: "ReviewTemplates", component: () => import("@/views/teacher/ReviewTemplates.vue"), meta: { title: "审核意见模板", menu: { icon: "Document", group: "论文管理", order: 4.5 } } },
      { path: "student-groups", name: "StudentGroups", component: () => import("@/views/teacher/StudentGroups.vue"), meta: { title: "学生分组管理", menu: { icon: "UserFilled", group: "学生管理", order: 6 } } },
      { path: "chat-center", name: "ChatCenter", component: () => import("@/views/teacher/ChatCenter.vue"), meta: { title: "在线聊天", menu: { icon: "ChatDotRound", group: "学生管理", order: 8.5, badge: "chat" } } },
      { path: "file-management", name: "TeacherFileManagement", component: () => import("@/views/teacher/FileManagement.vue"), meta: { title: "文件管理", menu: { icon: "Folder", group: "设置与支持", order: 10 } } },
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
      { path: "user-management", name: "UserManagement", component: () => import("@/views/admin/UserManagement.vue"), meta: { title: "用户管理", menu: { icon: "UserFilled", roles: ["SUPER_ADMIN"], group: "用户与权限", order: 1, top: { order: 1, label: "用户管理", match: ["/admin/user"] } } } },
      // 论文分配四页合一：容器挂 Tabs，菜单只露出「论文分配」一项，子页 URL 不变
      { path: "paper-assignment", name: "PaperAssignmentCenter", component: () => import("@/views/admin/PaperAssignmentCenter.vue"), meta: { title: "论文分配", menu: { roles: ["ADMIN"], icon: "Connection", group: "论文管理", order: 5, top: { order: 3, label: "论文分配" } } }, children: [
        { path: "", name: "PaperAssignment", component: () => import("@/views/admin/PaperAssignment.vue"), meta: { title: "分配总览" } },
        { path: "manual", name: "ManualPaperAssignment", component: () => import("@/views/admin/ManualPaperAssignment.vue"), meta: { title: "手动分配" } },
        { path: "auto", name: "AutoPaperAssignment", component: () => import("@/views/admin/AutoPaperAssignment.vue"), meta: { title: "自动分配" } },
        { path: "history", name: "PaperAssignmentHistory", component: () => import("@/views/admin/PaperAssignmentHistory.vue"), meta: { title: "分配记录" } },
      ]},
      { path: "system-config", name: "SystemConfig", component: () => import("@/views/admin/SystemConfig.vue"), meta: { title: "系统配置", menu: { icon: "Tools", roles: ["SUPER_ADMIN"], group: "系统运维", order: 4, top: { order: 3, label: "系统配置" } } } },
      { path: "log-center", name: "LogCenter", component: () => import("@/views/admin/LogCenter.vue"), meta: { title: "日志中心", menu: { icon: "Document", ADMIN: { group: "系统管理", order: 11 }, SUPER_ADMIN: { group: "监控与日志", order: 9, top: { order: 4, label: "日志中心" } } } } },
      { path: "settings", name: "AdminSettings", component: () => import("@/views/admin/Settings.vue"), meta: { title: "个人设置", menu: { icon: "Setting", roles: ["ADMIN"], group: "设置", order: 12, spacer: true } } },
      { path: "school-overview", name: "SchoolOverview", component: () => import("@/views/admin/SchoolOverview.vue"), meta: { title: "全校概览", menu: { icon: "DataAnalysis", label: "全校概览", group: "概览", order: 2 } } },
      { path: "paper-library", name: "PaperLibrary", component: () => import("@/views/admin/PaperLibrary.vue"), meta: { title: "论文库管理", menu: { roles: ["ADMIN"], icon: "Files", label: "论文库", group: "论文管理", order: 3, top: { order: 2, label: "论文管理" } } } },
      { path: "defense-batches", name: "DefenseBatches", component: () => import("@/views/admin/DefenseBatches.vue"), meta: { title: "答辩批次管理", menu: { roles: ["ADMIN"], icon: "Calendar", label: "答辩批次", group: "论文管理", order: 4 } } },
      { path: "defense-batches/:id", name: "DefenseBatchDetail", component: () => import("@/views/admin/DefenseBatchDetail.vue"), meta: { title: "批次详情", menu: { hidden: true } } },
      // 数据报表三页合一：容器挂 Tabs，菜单只露出「数据报表」一项
      { path: "report-center", name: "ReportCenter", component: () => import("@/views/admin/ReportCenter.vue"), meta: { title: "数据报表", menu: { roles: ["ADMIN"], icon: "TrendCharts", group: "论文管理", order: 6 } }, children: [
        { path: "", redirect: "/admin/report-center/reports" },
        { path: "reports", name: "ReportManagement", component: () => import("@/views/admin/ReportManagement.vue"), meta: { title: "报告管理" } },
        { path: "statistics", name: "StatReport", component: () => import("@/views/admin/StatReport.vue"), meta: { title: "统计报表" } },
        { path: "advisor-eval", name: "AdvisorEvalManagement", component: () => import("@/views/admin/AdvisorEvalManagement.vue"), meta: { title: "导师评价" } },
      ]},
      // 旧 URL 兼容跳转（合并前进过菜单/书签的三个地址）
      { path: "report-management", redirect: "/admin/report-center/reports" },
      { path: "stat-report", redirect: "/admin/report-center/statistics" },
      { path: "advisor-evaluation", redirect: "/admin/report-center/advisor-eval" },
      { path: "knowledge-management", name: "KnowledgeManagement", component: () => import("@/views/admin/KnowledgeManagement.vue"), meta: { title: "知识库管理", menu: { roles: ["ADMIN"], icon: "Collection", label: "知识库", group: "论文管理", order: 7 } } },
      // 查重配置三页合一：容器挂 Tabs，菜单只露出「查重配置」一项
      { path: "check-config", name: "CheckConfigCenter", component: () => import("@/views/admin/CheckConfigCenter.vue"), meta: { title: "查重配置", menu: { icon: "Operation", ADMIN: { group: "系统管理", order: 8 }, SUPER_ADMIN: { group: "系统运维", order: 8 } } }, children: [
        { path: "", redirect: "/admin/check-config/rules" },
        { path: "rules", name: "CheckRuleManagement", component: () => import("@/views/admin/CheckRuleManagement.vue"), meta: { title: "查重规则" } },
        { path: "compare-lib", name: "CompareLibManagement", component: () => import("@/views/admin/CompareLibManagement.vue"), meta: { title: "比对库管理" } },
        { path: "subjects", name: "SubjectManagement", component: () => import("@/views/admin/SubjectManagement.vue"), meta: { title: "学科领域管理" } },
      ]},
      // 旧 URL 兼容跳转
      { path: "check-rule-management", redirect: "/admin/check-config/rules" },
      { path: "compare-lib-management", redirect: "/admin/check-config/compare-lib" },
      { path: "subject-management", redirect: "/admin/check-config/subjects" },
      { path: "system-notice-management", name: "SystemNoticeManagement", component: () => import("@/views/admin/SystemNoticeManagement.vue"), meta: { title: "系统公告与维护", menu: { icon: "Bell", ADMIN: { group: "系统管理", order: 9 }, SUPER_ADMIN: { group: "监控与日志", order: 11 } } } },
      { path: "message-template-management", name: "MessageTemplateManagement", component: () => import("@/views/admin/MessageTemplateManagement.vue"), meta: { title: "消息模板", menu: { icon: "Document", ADMIN: { group: "系统管理", order: 10 }, SUPER_ADMIN: { group: "监控与日志", order: 12 } } } },
    ],
  },
  {
    path: "/super-admin",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, roles: ["SUPER_ADMIN"], title: "超级管理员" },
    children: [
      { path: "", name: "SuperAdminDashboard", component: () => import("@/views/admin/Dashboard.vue"), meta: { title: "系统概览", menu: { icon: "Monitor", group: "概览", order: 3, top: { order: 2, label: "系统概览", exact: true } } } },
      // 系统配置 / 日志中心与 /admin 下是同一组件，这里只保留 URL 兼容跳转，
      // 不再重复注册路由（同一页面两条 URL 会分裂面包屑、高亮与埋点语义）。
      // /admin 的 roles 含 SUPER_ADMIN，超管可直接访问 /admin/*。
      { path: "system-config", redirect: "/admin/system-config" },
      { path: "log-center", redirect: "/admin/log-center" },
      { path: "similarity-thresholds", name: "SuperAdminSimilarityThresholds", component: () => import("@/views/super-admin/SimilarityThreshold.vue"), meta: { title: "相似度阈值设置", menu: { icon: "TrendCharts", label: "相似度阈值", group: "系统运维", order: 5 } } },
      { path: "review-workflow", name: "SuperAdminReviewWorkflow", component: () => import("@/views/super-admin/ReviewWorkflow.vue"), meta: { title: "审核工作流配置", menu: { icon: "Connection", label: "审核工作流", group: "系统运维", order: 6 } } },
      { path: "check-policy", name: "SuperAdminCheckPolicy", component: () => import("@/views/super-admin/CheckPolicy.vue"), meta: { title: "检测策略", menu: { icon: "SetUp", label: "检测策略", group: "系统运维", order: 7 } } },
      { path: "system-monitoring", name: "SystemMonitoring", component: () => import("@/views/admin/SystemMonitoring.vue"), meta: { title: "系统监控", menu: { icon: "Monitor", group: "监控与日志", order: 10 } } },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/common/NotFound.vue"),
    // requiresAuth: false：未登录访问不存在的路径也应该看到 404，
    // 而不是被守卫弹去登录页（404 与认证无关）
    meta: { title: "页面不存在", requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...constantRoutes, ...asyncRoutes],
});

// 路由守卫：统一使用tokenManager
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - ${import.meta.env.VITE_SYSTEM_NAME}`;

  const noAuthPaths = ['/login', '/register', '/reset', '/verify-email', '/report-verify'];
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
      // 兜底回该角色的落地页：此前 next(from.path) 在「直接打开越权 URL」时
      // from 是 '/'（登录页），已登录用户会被弹回登录页，体验割裂
      return next(ROLE_HOME[role] || '/message-center');
    }
  }

  next();
});

export default router;
