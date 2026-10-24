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
  // 运营概览已并入「全校概览」，ADMIN 落地页改为该页
  ADMIN: '/admin/school-overview',
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
        meta: { roles: ["STUDENT"], title: "论文工作台", menu: { icon: "DataAnalysis", label: "论文工作台", group: "论文", order: 1 } },
      },
    ],
  },
  // 「运营概览」已并入 /admin/school-overview（核心指标合并，不再保留两块大盘），
  // 旧落地页地址保留跳转，避免书签/历史链接 404
  { path: "/dashboard/admin", redirect: "/admin/school-overview", meta: { requiresAuth: true, title: "全校概览" } },
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
      // 我的论文三合一：容器挂 Tabs（论文列表 / 查重任务 / 查重历史）。
      // 原「查重任务」「查重历史」两个独立菜单项降为子页，菜单只留这一项；
      // 查重历史详情仍是独立隐藏页，activeMatch 让详情页继续点亮本菜单。
      { path: "my-papers", name: "MyPapersCenter", component: () => import("@/views/student/MyPapersCenter.vue"), meta: { title: "我的论文", menu: { icon: "FolderOpened", group: "论文", order: 3, activeMatch: ["/student/paper-details", "/student/check-monitor", "/student/plagiarism-report", "/student/sentence-detail"] } }, children: [
        { path: "", name: "MyPapers", component: () => import("@/views/student/MyPapers.vue"), meta: { title: "论文列表" } },
        { path: "check-tasks", name: "StudentCheckWithWebSocket", component: () => import("@/views/student/StudentCheckWithWebSocket.vue"), meta: { title: "查重任务" } },
        { path: "check-history", name: "CheckHistoryList", component: () => import("@/views/student/CheckHistoryList.vue"), meta: { title: "查重历史" } },
        { path: "check-history/:paperId", name: "CheckHistory", component: () => import("@/views/student/CheckHistory.vue"), meta: { title: "查重历史详情" } },
      ]},
      // order 3.5 有意插在我的论文(3)与导师评价(3.6)之间
      { path: "my-defense", name: "MyDefense", component: () => import("@/views/student/MyDefense.vue"), meta: { title: "我的答辩", menu: { icon: "Trophy", group: "论文", order: 3.5 } } },
      // order 3.6 有意插在我的答辩(3.5)与交流(4)之间（P6a 导师评价）
      { path: "advisor-evaluation", name: "AdvisorEvaluation", component: () => import("@/views/student/AdvisorEvaluation.vue"), meta: { title: "导师评价", menu: { icon: "Star", group: "论文", order: 3.6 } } },
      // 交流二合一：导师互动 + 文件管理（双 Tab），只保留一个菜单入口
      { path: "communication", name: "StudentCommunication", component: () => import("@/views/student/StudentCommunication.vue"), meta: { title: "交流", menu: { icon: "ChatDotRound", group: "交流", order: 4, badge: "chat" } }, children: [
        { path: "", name: "StudentCommunicationHome", redirect: "/student/communication/interaction" },
        { path: "interaction", name: "AdvisorInteraction", component: () => import("@/views/student/AdvisorInteraction.vue"), meta: { title: "导师互动" } },
        { path: "files", name: "StudentFileManagement", component: () => import("@/views/student/FileManagement.vue"), meta: { title: "文件管理" } },
      ]},
      { path: "settings", name: "StudentSettings", component: () => import("@/views/student/Settings.vue"), meta: { title: "个人设置", menu: { icon: "Setting", group: "设置与支持", order: 9, spacer: true } } },
      // 帮助中心二合一：帮助文档 + 学术诚信（学术诚信不再是独立菜单）
      { path: "help-center", name: "HelpCenter", component: () => import("@/views/student/HelpCenter.vue"), meta: { title: "帮助中心", menu: { icon: "Service", group: "设置与支持", order: 10 } } },
      { path: "check-monitor/:paperId", name: "CheckMonitor", component: () => import("@/views/student/CheckMonitor.vue"), meta: { title: "查重监控", menu: { hidden: true } } },
      { path: "plagiarism-report/:paperId", name: "PlagiarismReport", component: () => import("@/views/student/PlagiarismReport.vue"), meta: { title: "查重报告", menu: { hidden: true } } },
      { path: "check-history/:paperId", redirect: to => `/student/my-papers/check-history/${to.params.paperId}` },
      // 旧地址兼容：原独立菜单入口（书签/历史链接不落 404）
      { path: "student-check-with-websocket", redirect: "/student/my-papers/check-tasks" },
      { path: "check-history", redirect: "/student/my-papers/check-history" },
      { path: "advisor-interaction", redirect: "/student/communication/interaction" },
      { path: "file-management", redirect: "/student/communication/files" },
      { path: "academic-integrity", redirect: "/student/help-center?tab=integrity" },
      // P5 句级检测明细（从任务列表/详情跳入，非导航目标）
      { path: "sentence-detail/:taskId", name: "SentenceDetail", component: () => import("@/views/student/SentenceDetail.vue"), meta: { title: "句级检测明细", menu: { hidden: true } } },
    ],
  },
  {
    path: "/teacher",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, roles: ["TEACHER"], title: "教师" },
    children: [
      { path: "", name: "TeacherDashboard", component: () => import("@/views/teacher/Dashboard.vue"), meta: { title: "审核工作台", menu: { icon: "DataBoard", label: "审核工作台", group: "工作台", order: 1 } } },
      { path: "student-list", name: "StudentList", component: () => import("@/views/teacher/StudentList.vue"), meta: { title: "学生管理", menu: { icon: "UserFilled", group: "学生管理", order: 5 } } },
      // PaperReview 容器仅承载「审核记录」；待审核论文已统一到 review-workbench
      { path: "paper-review", name: "PaperReview", component: () => import("@/views/teacher/PaperReview.vue"), redirect: "/teacher/review-workbench", meta: { title: "论文审核", menu: { hidden: true } }, children: [
        { path: "audit-records", name: "AuditRecords", component: () => import("@/views/teacher/AuditRecords.vue"), meta: { title: "审核记录", menu: { icon: "Histogram", group: "论文管理", order: 4 } } }
      ]},
      // 数据统计三合一：容器挂 Tabs（审核统计 / 指导进度 / 学生评价），
      // 原「指导进度看板」「学生评价汇总」两个菜单项降为子页
      { path: "data-statistics", name: "TeacherStatistics", component: () => import("@/views/teacher/TeacherStatistics.vue"), meta: { title: "数据统计", menu: { icon: "TrendCharts", group: "工作台", order: 2 } }, children: [
        { path: "", name: "DataStatistics", component: () => import("@/views/teacher/DataStatistics.vue"), meta: { title: "审核统计" } },
        { path: "guidance", name: "TeacherGuidanceProgress", component: () => import("@/views/teacher/GuidanceProgress.vue"), meta: { title: "指导进度" } },
        { path: "evaluation", name: "AdvisorEvalSummary", component: () => import("@/views/teacher/AdvisorEvalSummary.vue"), meta: { title: "学生评价" } },
      ]},
      // order 9 排在学生组之后、设置组之前
      { path: "defense-workbench", name: "DefenseWorkbench", component: () => import("@/views/teacher/DefenseWorkbench.vue"), meta: { title: "答辩工作台", menu: { icon: "Microphone", group: "答辩管理", order: 9 } } },
      // 待审核论文统一入口（原 paper-review/pending 已下线）
      { path: "review-workbench", name: "TeacherReviewWorkbench", component: () => import("@/views/teacher/ReviewWorkbench.vue"), meta: { title: "待审核论文", fullBleed: true, menu: { icon: "Clock", label: "待审核论文", group: "论文管理", order: 3 } } },
      { path: "profile", name: "TeacherProfile", component: () => import("@/views/teacher/Profile.vue"), meta: { title: "个人设置", menu: { icon: "Setting", label: "个人设置", group: "设置与支持", order: 11, spacer: true } } },
      { path: "review-templates", name: "ReviewTemplates", component: () => import("@/views/teacher/ReviewTemplates.vue"), meta: { title: "审核意见模板", menu: { icon: "Document", group: "论文管理", order: 4.5 } } },
      // 分组管理不再占菜单：入口收进「学生管理」列表页的分组抽屉
      { path: "student-groups", name: "StudentGroups", component: () => import("@/views/teacher/StudentGroups.vue"), meta: { title: "学生分组管理" } },
      // 在线聊天不再占菜单：入口移到顶栏消息图标旁
      { path: "chat-center", name: "ChatCenter", component: () => import("@/views/teacher/ChatCenter.vue"), meta: { title: "在线聊天" } },
      // 旧地址兼容
      { path: "guidance-progress", redirect: "/teacher/data-statistics/guidance" },
      { path: "advisor-eval-summary", redirect: "/teacher/data-statistics/evaluation" },
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
      // 用户管理归业务管理员与超管共有：账号与组织归属是管理员的职责，
      { path: "user-management", name: "UserManagement", component: () => import("@/views/admin/UserManagement.vue"), meta: { title: "用户管理", menu: { icon: "UserFilled", roles: ["SUPER_ADMIN", "ADMIN"], group: "用户与权限", SUPER_ADMIN: { order: 1 }, ADMIN: { order: 7.5 } } } },
      // 论文分配四页合一：容器挂 Tabs，菜单只露出「论文分配」一项，子页 URL 不变
      { path: "paper-assignment", name: "PaperAssignmentCenter", component: () => import("@/views/admin/PaperAssignmentCenter.vue"), meta: { title: "论文分配", menu: { roles: ["ADMIN"], icon: "Connection", group: "论文管理", order: 5 } }, children: [
        { path: "", name: "PaperAssignment", component: () => import("@/views/admin/PaperAssignment.vue"), meta: { title: "分配总览" } },
        { path: "manual", name: "ManualPaperAssignment", component: () => import("@/views/admin/ManualPaperAssignment.vue"), meta: { title: "手动分配" } },
        { path: "auto", name: "AutoPaperAssignment", component: () => import("@/views/admin/AutoPaperAssignment.vue"), meta: { title: "自动分配" } },
        { path: "history", name: "PaperAssignmentHistory", component: () => import("@/views/admin/PaperAssignmentHistory.vue"), meta: { title: "分配记录" } },
      ]},
      { path: "system-config", name: "SystemConfig", component: () => import("@/views/admin/SystemConfig.vue"), meta: { title: "系统配置", menu: { icon: "Tools", roles: ["SUPER_ADMIN"], group: "系统运维", order: 4 } } },
      { path: "log-center", name: "LogCenter", component: () => import("@/views/admin/LogCenter.vue"), meta: { title: "日志中心", menu: { icon: "Document", ADMIN: { group: "系统管理", order: 11 }, SUPER_ADMIN: { group: "监控与日志", order: 9 } } } },
      { path: "settings", name: "AdminSettings", component: () => import("@/views/admin/Settings.vue"), meta: { title: "个人设置", menu: { icon: "Setting", roles: ["ADMIN"], group: "设置", order: 12, spacer: true } } },
      { path: "school-overview", name: "SchoolOverview", component: () => import("@/views/admin/SchoolOverview.vue"), meta: { title: "全校概览", menu: { icon: "DataAnalysis", label: "全校概览", group: "概览", order: 2 } } },
      { path: "paper-library", name: "PaperLibrary", component: () => import("@/views/admin/PaperLibrary.vue"), meta: { title: "论文库管理", menu: { roles: ["ADMIN"], icon: "Files", label: "论文库", group: "论文管理", order: 3 } } },
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
      // 查重与流程配置六页合一：容器挂 Tabs，菜单只露出一项。
      // 前三个 Tab 对 ADMIN/SUPER_ADMIN 开放，后三个（阈值/策略/工作流）仅超管可见，
      // 由子路由 meta.roles 控制，ADMIN 直接访问会被守卫弹回落地页。
      { path: "check-config", name: "CheckConfigCenter", component: () => import("@/views/admin/CheckConfigCenter.vue"), meta: { title: "查重与流程配置", menu: { icon: "Operation", label: "查重与流程配置", ADMIN: { group: "系统管理", order: 8 }, SUPER_ADMIN: { group: "系统运维", order: 8 } } }, children: [
        { path: "", name: "CheckConfigHome", redirect: "/admin/check-config/rules" },
        { path: "rules", name: "CheckRuleManagement", component: () => import("@/views/admin/CheckRuleManagement.vue"), meta: { title: "查重规则" } },
        { path: "compare-lib", name: "CompareLibManagement", component: () => import("@/views/admin/CompareLibManagement.vue"), meta: { title: "比对库管理" } },
        { path: "subjects", name: "SubjectManagement", component: () => import("@/views/admin/SubjectManagement.vue"), meta: { title: "学科领域管理" } },
        { path: "threshold", name: "SuperAdminSimilarityThresholds", component: () => import("@/views/super-admin/SimilarityThreshold.vue"), meta: { title: "相似度阈值", roles: ["SUPER_ADMIN"] } },
        { path: "policy", name: "SuperAdminCheckPolicy", component: () => import("@/views/super-admin/CheckPolicy.vue"), meta: { title: "检测策略", roles: ["SUPER_ADMIN"] } },
        { path: "workflow", name: "SuperAdminReviewWorkflow", component: () => import("@/views/super-admin/ReviewWorkflow.vue"), meta: { title: "审核工作流", roles: ["SUPER_ADMIN"] } },
      ]},
      // 旧 URL 兼容跳转
      { path: "check-rule-management", redirect: "/admin/check-config/rules" },
      { path: "compare-lib-management", redirect: "/admin/check-config/compare-lib" },
      { path: "subject-management", redirect: "/admin/check-config/subjects" },
      { path: "system-notice-management", name: "SystemNoticeManagement", component: () => import("@/views/admin/SystemNoticeManagement.vue"), meta: { title: "系统公告与维护", menu: { icon: "Bell", ADMIN: { group: "系统管理", order: 9 }, SUPER_ADMIN: { group: "监控与日志", order: 11 } } } },
      // 消息模板并入「系统公告与维护」的页签
      { path: "message-template-management", redirect: "/admin/system-notice-management?tab=templates" },
    ],
  },
  {
    path: "/super-admin",
    component: () => import("@/components/layout/MainLayout.vue"),
    meta: { requiresAuth: true, roles: ["SUPER_ADMIN"], title: "超级管理员" },
    children: [
      { path: "", name: "SuperAdminDashboard", component: () => import("@/views/admin/Dashboard.vue"), meta: { title: "系统概览", menu: { icon: "Monitor", group: "概览", order: 3 } } },
      // 系统配置 / 日志中心与 /admin 下是同一组件，这里只保留 URL 兼容跳转，
      // 不再重复注册路由（同一页面两条 URL 会分裂面包屑、高亮与埋点语义）。
      // /admin 的 roles 含 SUPER_ADMIN，超管可直接访问 /admin/*。
      { path: "system-config", redirect: "/admin/system-config" },
      { path: "log-center", redirect: "/admin/log-center" },
      // 阈值/策略/工作流已并入 /admin/check-config（同一页面只保留一条 URL），
      // 这里只留旧地址兼容跳转
      { path: "similarity-thresholds", redirect: "/admin/check-config/threshold" },
      { path: "review-workflow", redirect: "/admin/check-config/workflow" },
      { path: "check-policy", redirect: "/admin/check-config/policy" },
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
