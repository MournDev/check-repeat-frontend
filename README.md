# 论文查重管理系统 - 前端

论文查重管理系统的前端项目，提供学生、教师、管理员三类角色的论文提交、查重、审核与统计分析功能。

## 技术栈

- **Vue 3** + **Vite**（`rolldown-vite`）
- **Element Plus**（UI 组件库）
- **Pinia**（状态管理）
- **Vue Router**（路由）
- **Axios**（HTTP 请求）
- **ECharts**（数据可视化）
- **STOMP / SockJS**（WebSocket 实时进度推送）
- **Day.js**、**GSAP**、**SparkMD5** 等

## 环境要求

- Node.js >= 20（推荐 20.x）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 3000，host 0.0.0.0）
npm run dev

# 构建生产产物
npm run build

# 本地预览构建产物
npm run preview
```

开发环境下，`/check` 开头的接口请求会通过 Vite 代理转发到后端（默认 `http://localhost:8080`），代理配置见 [vite.config.js](vite.config.js)。

## 环境变量

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 接口基础路径 | `/check` |
| `VITE_WS_BASE_URL` | WebSocket 基础路径 | `/check` |
| `VITE_SYSTEM_NAME` | 系统名称 | 论文查重管理系统 |

- 开发环境：[.env.development](.env.development)
- 生产环境：[.env.production](.env.production)

## 目录结构

```
check-repeat-frontend/
├── src/
│   ├── api/            # 接口封装（按角色 / 模块划分）
│   ├── assets/         # 静态资源（图片、SCSS）
│   ├── components/     # 公共组件
│   ├── composables/    # 组合式函数（查重进度轮询等）
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia 状态管理
│   ├── utils/          # 工具函数（查重算法、状态映射等）
│   ├── views/          # 页面
│   │   ├── admin/      # 管理员端
│   │   ├── teacher/    # 教师端
│   │   ├── student/    # 学生端
│   │   ├── login/      # 登录 / 注册 / 重置密码
│   │   └── common/     # 404 等公共页面
│   ├── App.vue
│   └── main.js
├── deploy/             # 部署与 CI/CD 制品
│   ├── README.md                    # 完整执行手册（配置 / 切换 / 回滚 / 排错）
│   ├── docker-compose.yml           # 本仓库编排（仅含 frontend 服务）
│   ├── nginx-gateway.conf           # 网关主配置（交基础设施侧维护）
│   ├── gateway-compose.yml          # 网关独立编排（不并入后端 compose）
│   ├── nginx-jenkins.conf           # Jenkins 子域片段，阶段四才启用
│   ├── jenkins.d/                   # 上述片段的挂载目录（初始只有占位文件）
│   ├── deploy-frontend.sh           # 宿主机部署脚本（受限 sudo 执行）
│   └── sudoers.deploy-frontend      # sudo 最小授权配置
├── nginx.conf          # 前端容器 Nginx 配置（仅托管静态产物，不代理后端）
├── Dockerfile          # Docker 多阶段构建：Node 编译 → Nginx 运行
├── Jenkinsfile         # CI/CD 流水线（SSH 触发宿主机部署）
├── .dockerignore       # 构建上下文排除清单
├── vite.config.js
└── package.json
```

## 部署

### 架构与职责划分

三层容器架构，前后端各自独立维护，由独立的**网关容器**统一入口：

```
                        Internet
                           │ 80 / 443
                           ▼
            ┌──────────────────────────────────┐
            │  gateway  (nginx:1.28-alpine)     │  ← 唯一入口
            │  挂 /opt/check-repeat/nginx/conf  │     证书 + ACME webroot
            └──────────────────────────────────┘
                 │                      │
          location /              location /check/ + /ws/
                 ▼                      ▼
       ┌──────────────────┐   ┌──────────────────┐
       │ frontend 容器      │   │  app  后端容器    │
       │ 纯静态，不占端口    │   │     :8080        │
       └──────────────────┘   └──────────────────┘
              └──────── check-repeat_app-network ────────┘
```

关键点：

- **三方各自独立编排，生命周期互不影响**：后端 `/opt/check-repeat/docker-compose.yml`、
  网关 `/opt/check-repeat/nginx/docker-compose.yml`、前端 `/opt/check-repeat-frontend/docker-compose.yml`。
  任何一方 `docker compose down` 都不会波及其余两方。
- **网关归基础设施目录**，不属本仓库。本仓库只含 `frontend` 服务。
- **前端容器只做静态托管**，不承担任何后端代理。因此 [nginx.conf](nginx.conf) 中**没有也不应有** `/check/` 代理配置。
- 前端容器**不对外发布端口**，外部流量一律经网关进入。
- 三方通过一个**手动创建、各自以 `external: true` 引用**的网络互通
  （`check-repeat_app-network`，见 [deploy/docker-compose.yml](deploy/docker-compose.yml)）。
  网络不归属任何一方，因此不会被谁的 `compose down` 删掉。
- 前端容器**不需要访问后端**，它唯一需要互通的对象是网关。

### CI/CD 自动发布

推送到 Gitee `master` 分支后，Jenkins 自动执行 [Jenkinsfile](Jenkinsfile)，经 **SSH 最小权限**触发宿主机部署脚本：拉取代码 → 构建镜像 → 替换容器 → 健康检查，**失败自动回滚**。

设计要点：

- Jenkins 容器**不挂载 `docker.sock`**，不具备任何 Docker 权限
- Jenkins **不安装 Node**，也不执行构建——构建发生在宿主机 `docker build` 内部的 `node:22-alpine` 阶段
- 宿主机 `deploy` 用户**不在 docker 组**，其全部权限是 `sudo` 执行一个 root 所有的部署脚本
- 镜像 tag 为 commit 短 SHA，保留最近 5 个供回滚

### 手动部署（用于排查问题）

```bash
cd /opt/check-repeat-frontend
FRONTEND_TAG=manual docker compose build frontend
FRONTEND_TAG=manual docker compose up -d

# 自检（容器不对外暴露端口，读自身健康状态）
docker inspect --format '{{.State.Health.Status}}' check-repeat-frontend
```

### 完整部署手册

服务器一次性准备、**证书续期修复**、网关改造、受限 SSH 用户、Jenkins 任务配置、Gitee webhook、
带回滚预案的切换步骤、验收清单与排错，全部见 **[deploy/README.md](deploy/README.md)**。

网关配置模板见 [deploy/nginx-gateway.conf](deploy/nginx-gateway.conf)（由基础设施侧维护，非本仓库部署内容）。
Jenkins 子域因涉及证书签发的前后依赖，拆为 [deploy/nginx-jenkins.conf](deploy/nginx-jenkins.conf) 单独启用，
启用顺序见手册的「执行顺序总览」。

## 相关链接

- 后端项目：论文查重管理系统后端（独立部署）
