# 论文查重管理系统 · 前端

面向高校论文查重业务的 B 端管理前端，基于 Vue 3 + Element Plus 构建。覆盖学生、指导教师、管理员、超级管理员四类角色，包含论文提交、查重检测、报告查看、审核签核、答辩管理、消息通知、系统配置与监控等完整流程。

前端为纯静态应用，接口与鉴权依赖后端服务，生产环境由独立网关统一转发 `/check` 与 `/ws`。

## 功能概览

### 学生端

- 学生工作台：KPI、当前论文、待办、处理进度、时间节点、导师信息
- 论文提交、我的论文、版本历史与版本对比
- 查重历史、查重监控、相似来源与句级明细
- 查重报告、学术规范指引、导师互动与评价、我的答辩

### 教师端

- 教师工作台：待审核、审核统计、学生状态、审核效率
- 待审核论文工作台：三栏布局、队列筛选、查重报告、签核、初审结论
- 审核记录、学生管理、指导进度看板、学生评价汇总
- 答辩工作台、答辩记录、成绩与附件
- 在线聊天、审核意见模板、数据统计

### 管理端

- 管理工作台：用户/论文/待分配、系统监控、业务指标、响应时间趋势
- 用户管理、论文库、论文分配（总览/手动/自动/记录）
- 报告管理、统计报表、导师评价汇总
- 查重配置：规则、比对库、学科领域
- 系统监控、日志中心、数据备份、系统公告、消息模板、系统设置

### 超级管理员

- 查重策略、审核流程、相似度阈值等全局策略配置

## 技术栈

| 技术 | 版本 | 说明 |
| --- | --- | --- |
| Vue | 3.5 | Composition API + `<script setup>` |
| Vite | rolldown-vite 7.2.2 | 构建与开发服务器 |
| Element Plus | 2.8 | UI 组件库，全量注册 |
| Pinia | 2.2 | 状态管理 |
| Vue Router | 4.4 | 路由与角色守卫 |
| Axios | 1.7 | HTTP 客户端 |
| ECharts | 5.5 | 图表 |
| STOMP + SockJS | 7.3 / 1.6 | 实时消息与查重进度 |
| Sass | 1.93 | 样式预处理 |

运行环境：**Node.js >= 20.19**（推荐 22 LTS），**npm >= 10**。CI 在 Node 20.x / 22.x 上执行构建。

## 快速开始

```bash
# 使用锁文件安装，保证依赖一致
npm ci

# 启动开发服务器（默认 http://localhost:3000）
npm run dev

# 生产构建，产物输出到 dist/
npm run build

# 本地预览构建产物
npm run preview
```

开发服务器监听 `0.0.0.0:3000`，并配置两条代理：

- `/check` → `http://localhost:8080`，不重写路径
- `/ws` → `http://localhost:8080`，重写为 `/check` + 原路径

## 环境变量

`.env`、`.env.development`、`.env.production` 在本仓库中**故意入库**，用于保证 Docker 构建与部署时 VITE_* 变量可复现。本机私有覆盖请写入 `.env.local`、`.env.production.local`（已被 `.gitignore` 忽略）。

| 变量 | 开发示例 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/check` | Axios baseURL，开发环境走 Vite 代理 |
| `VITE_WS_BASE_URL` | `http://localhost:8080/check` | 实时通信地址；生产只写到域名，代码自动补 `/ws` |
| `VITE_SYSTEM_NAME` | `论文查重管理系统` | 顶栏品牌、页脚、浏览器标题兜底 |

注意：

- 生产 `.env` 中不要写 `localhost`，否则会把本机地址打进构建产物。
- SockJS 建连前会请求 `/ws/info`，地址必须是 `http(s)://`；代码会把 `ws(s)://` 自动转换，但配置时建议直接写 `https://` / `http://`。

## 项目结构

```text
src/
├─ api/
│  ├─ request.js                 # Axios 实例、JWT 注入、401/业务错误处理
│  ├─ student.js / teacher.js    # 角色接口
│  ├─ user.js / login.js         # 用户、认证与刷新
│  ├─ defense.js / p5.js         # 答辩、指导进度等
│  └─ admin/                     # 管理端接口（用户、论文、分配、报告、日志、监控等）
├─ components/
│  ├─ common/                    # PageHeader、ListPageShell
│  ├─ layout/                    # MainLayout、AuthLayout
│  ├─ report/                    # 报告相关展示组件
│  ├─ FileManager.vue            # 文件管理
│  ├─ MessageCenter.vue          # 消息中心
│  └─ PaperPreviewDialog.vue     # 论文预览
├─ composables/                  # useChart、useCheckProgress、useMessageWebSocket 等
├─ directives/                   # v-permission
├─ router/                       # 路由、角色守卫、菜单元数据
├─ stores/                       # user、message、maintenance
├─ styles/                       # design-tokens、app-tokens、主题、全局样式
├─ utils/                        # tokenManager、stompClient、similarity、reviewStatus、menu 等
├─ views/
│  ├─ login/                     # 登录、注册、重置
│  ├─ common/                    # 公共页面与设置面板
│  ├─ student/                   # 学生端
│  ├─ teacher/                   # 教师端
│  ├─ admin/                     # 管理端
│  └─ super-admin/               # 超级管理员策略页
├─ App.vue
└─ main.js
```

## 架构与约定

### 布局骨架

- `MainLayout` 统一提供顶栏、子导航、侧边栏、内容区 `content-inner` 与页脚。
- 页面根容器**不再设置** `padding`、`background`、`min-height: 100vh`；这些由布局层负责。
- `PageHeader` 已去白卡化，只输出说明文字与右侧操作；页面标题由子导航的 `route.meta.title` 统一承载。
- 列表页统一使用 `ListPageShell`：单张卡片内完成「工具栏 → 40px 筛选行 → 分割线 → 表格 → 分页」。
- 登录、重置、邮件验证、报告验真等独立页面可使用展示层令牌与独立布局。

### 设计令牌

- `--apple-*`：展示层尺度（登录、注册、报告验真、邮件验证、AuthLayout）。
- `--app-color-*` / `--app-space-*` / `--app-fs-*` / `--app-radius-*`：控制台层；业务视图与通用组件只允许使用这一套。
- 栅格 gutter 统一为两档：列表/筛选/统计行 **16**，内容区块 **24**。
- 次要文本使用 `--app-color-text-muted` / `--app-color-text-secondary`，在页面底色上均达到 WCAG AA。

### 权限与菜单

- 角色：`STUDENT` / `TEACHER` / `ADMIN` / `SUPER_ADMIN`。
- 路由 `meta.roles` 控制访问，`meta.menu` 定义菜单归属、分组、排序与可见角色。
- 侧边栏菜单由 `utils/menu.js` 从路由表按角色派生，不在布局组件中硬编码。
- 按钮级权限使用 `v-permission` 指令。

### API 约定

- 业务代码统一通过 `src/api/` 调用，不在视图中直接使用 axios。
- `request.js` 的 `baseURL` 为 `/check`；成功响应约定为 `{ code, message, data }`，`code === 200` 时 `data` 为业务数据。
- 分页以 `pageNum` / `pageSize` 为主（个别管理接口使用 `page` / `size`），分页响应取 `records` / `total`。
- 支持 `silent: true`、`_skipLoginRedirect`、`responseType: 'blob'` 等请求级标志。
- Token 存于 cookie `token`，JWT payload 含 `userId` / `roleCode`；临近过期自动刷新。

### 实时通信

- STOMP over SockJS 单例封装在 `src/utils/stompClient.js`，认证走 CONNECT 帧的 `Authorization` 头。
- 消息与查重进度订阅统一在 composables 中管理；重连后由 `onConnect` 重建订阅。

### Element Plus 使用方式

- `main.js` 通过 `app.use(ElementPlus)` 全量注册组件，**不是**自动按需导入。
- 图标不做全局注册，各文件按需显式 `import { ... } from '@element-plus/icons-vue'`。
- 新增页面时不要假设组件或图标已经自动注入。

## 构建与部署

- `Dockerfile` 为多阶段构建：`node:22-alpine` 编译 → `nginx:1.28-alpine` 托管静态产物。
- 前端容器只负责静态文件，`/check` 与 `/ws` 由独立网关容器转发；镜像内不包含后端代理。
- `docker-compose.yml` 只包含 `frontend` 服务，镜像标签可通过 `FRONTEND_TAG` 注入 commit 短 SHA。
- CI：`.github/workflows/frontend.yaml` 在 push / PR 到 `master` 时执行 `npm ci` 与 `npm run build`，矩阵覆盖 Node 20.x / 22.x。

## 已知限制

- `UserManagement` 共 9 列，约 1200px 以下会出现横向滚动，这是列数决定的预期行为。
- ECharts 配置中的颜色仍为字面量，不参与 CSS 令牌换肤。
- 构建时 `element-plus` 与 `useChart` 分包约 1MB，会触发 chunk 体积提示；当前按已知警告处理。
- `.env*` 文件入库是部署设计的一部分，不要按常规习惯把它们加入 `.gitignore`。

## 仓库配置

- `package.json`：声明 Node / npm 版本要求、仓库地址与私有项目标识（`UNLICENSED`）。
- `.gitattributes`：部署敏感文件（sh、Dockerfile、nginx.conf、.env、yml）固定 LF。
- `.gitignore`：忽略 `node_modules`、`dist`、本机 Nginx、`PROJECT_CONTEXT.md` 与本地环境覆盖文件。
- `.github/workflows/frontend.yaml`：前端 CI。
- `Dockerfile` / `docker-compose.yml` / `nginx.conf` / `deploy/`：部署制品与说明。

## 联系

- 仓库：[Gitee · check-repeat-frontend](https://gitee.com/Sc0102_1129/check-repeat-frontend)
- 作者：Smile-h
- 邮箱：3070500838@qq.com

本项目为私有项目（`private: true`），未对外授权。
