# 论文查重管理系统（前端）

## 项目简介

论文查重管理系统前端，基于 Vue 3 + Element Plus 构建，为学生、教师、管理员三种角色提供完整的论文查重管理界面。支持论文提交、查重报告查看、在线审核、实时消息、系统监控等功能。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3 | 前端框架（Composition API） |
| rolldown-vite | — | 构建工具（Vite 替代实现） |
| Element Plus | — | UI 组件库（自动导入） |
| Pinia | — | 状态管理 |
| Vue Router | — | 路由管理 |
| Axios | — | HTTP 客户端 |
| ECharts | — | 图表可视化 |
| Day.js | — | 时间处理 |
| SCSS | — | CSS 预处理器 |

## 核心功能

### 学生端
- **论文提交**：支持 Word/PDF 上传，自动计算 MD5 秒传
- **论文详情**：查看论文状态、导师反馈、审核历史、文件格式
- **查重报告**：相似度分析、章节对比、相似来源列表
- **查重历史**：历史查重记录、相似度趋势图
- **版本对比**：多版本论文差异对比
- **导师互动**：实时消息聊天、文件共享、消息撤回
- **个人工作台**：论文统计、待办事项、重要时间节点

### 教师端
- **待审核列表**：按优先级/相似度/等待时间排序筛选
- **论文审核**：通过/驳回/修改建议，支持批量操作
- **审核统计**：审核趋势图、通过率分析、工作量统计
- **学生管理**：学生分组、论文下载、联系学生
- **消息系统**：师生私信、系统通知

### 管理员端
- **系统概览**：用户/论文/查重统计数据、系统健康度
- **用户管理**：增删改查、角色分配、批量导入
- **论文管理**：论文分配、状态管理、批量操作、单篇/批量审核
- **报告管理**：查重报告查看与导出
- **系统配置**：查重规则、分配规则、系统参数
- **监控中心**：CPU/内存/磁盘实时监控、数据库连接池、API 响应时间趋势、ECharts 图表
- **日志管理**：操作日志、登录日志、安全审计、统计分析（热门操作/用户活跃度/模块使用率）、批量清理
- **数据备份**：手动/自动备份、备份恢复
- **通知管理**：站内通知列表、已读/未读筛选、优先级筛选、批量操作、发送测试通知
- **消息模板**：模板 CRUD、启用/禁用、变量渲染预览
- **查重规则管理**：规则配置、启用/禁用、设置默认规则
- **对比库管理**：对比库数据管理

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+（或 pnpm）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器运行在 `http://localhost:3000`，自动代理 `/check` 和 `/ws` 请求到后端 `http://localhost:8080`。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览构建结果

```bash
npm run preview
```

## 项目结构

```
src/
├── api/                    # API 接口定义
│   ├── request.js          #   Axios 实例（JWT 注入、401 拦截）
│   ├── student.js          #   学生端接口（62 个）
│   ├── teacher.js          #   教师端接口（78 个）
│   ├── user.js             #   用户/认证接口（25 个）
│   └── admin/              #   管理员接口（按模块拆分）
│       ├── monitoring.js   #     系统监控接口
│       ├── notices.js      #     系统通知接口
│       ├── templates.js    #     消息模板接口
│       ├── logs.js         #     日志管理接口（含统计分析）
│       └── papers.js       #     论文管理接口（含审核）
├── components/
│   ├── layout/             #   布局组件（侧边栏、顶栏）
│   ├── PaperPreviewDialog  #   论文预览对话框
│   └── UnifiedPreview      #   统一文件预览组件
├── composables/            #   组合式函数
│   ├── useCheckProgress.js #     查重进度 WebSocket
│   └── useMessageWebSocket.js #  消息 STOMP WebSocket
├── directives/             #   自定义指令（v-permission）
├── router/                 #   路由配置（角色守卫）
├── stores/                 #   Pinia 状态
│   ├── user.js             #     认证状态（token、角色）
│   └── message.js          #     消息状态
├── styles/                 #   全局样式
├── utils/                  #   工具函数
│   ├── jwt.js              #     JWT 解析工具
│   ├── tokenManager.js     #     Token 管理工具
│   └── download.js         #     文件下载工具
├── views/
│   ├── login/              #     登录页
│   ├── common/             #     公共页面（用户设置）
│   ├── student/            #     学生端页面
│   ├── teacher/            #     教师端页面
│   └── admin/              #     管理员页面
│       ├── SystemNoticeManagement    # 通知管理
│       ├── MessageTemplateManagement # 消息模板管理
│       ├── SystemMonitoring          # 系统监控面板
│       ├── CheckRuleManagement       # 查重规则管理
│       ├── CompareLibManagement      # 对比库管理
│       └── LogCenter                 # 日志中心（含统计分析）
├── App.vue                 #   根组件
└── main.js                 #   入口文件
```

## 环境变量

在项目根目录创建 `.env.development` 或 `.env.production`：

```bash
# 后端 API 地址
VITE_API_BACKEND_URL=http://localhost:8080

# 应用标题
VITE_APP_TITLE=论文查重管理系统
```

## 权限控制

- **路由守卫**：`router/index.js` 中根据 `userStore.roles` 控制页面访问
- **元素级权限**：`v-permission` 指令控制按钮/组件显示
- **API 拦截**：`request.js` 自动注入 JWT Token，401 时跳转登录

## WebSocket

系统使用两套 WebSocket：

1. **查重进度**（原生 WebSocket）：实时推送查重任务进度
   - `useCheckProgress.js` — 单任务进度
   - `useBatchCheckProgress.js` — 批量任务进度

2. **消息系统**（STOMP + SockJS）：师生私信与系统通知
   - `useMessageWebSocket.js`

## 开发规范

- 使用 Composition API（`<script setup>`）
- 组件命名 PascalCase，变量命名 camelCase
- Element Plus 组件通过 `unplugin-vue-components` 自动导入
- API 统一通过 `src/api/` 模块调用，不直接使用 axios

## 许可证

MIT License

## 联系方式

- 开发者：MournDev
- 邮箱：3070500838@qq.com
- 问题反馈：[GitHub Issues](https://github.com/MournDev/check-repeat-frontend/issues)

---

**备注**：本项目为前端部分，需配合后端 API 服务使用。
