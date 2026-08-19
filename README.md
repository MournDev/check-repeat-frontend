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
├── nginx.conf          # Nginx 反向代理配置（部署用）
├── Dockerfile          # Docker 多阶段构建
├── vite.config.js
└── package.json
```

## 部署

### Docker 部署

项目提供了多阶段构建的 [Dockerfile](Dockerfile)：Node 阶段编译产物，Nginx 阶段运行。

```bash
# 构建镜像
docker build -t check-repeat-frontend .

# 运行容器（映射 80 端口）
docker run -d -p 80:80 check-repeat-frontend
```

### Nginx 反向代理配置

前后端已拆分独立部署。生产环境使用 [nginx.conf](nginx.conf) 作为 Nginx 配置，其中 `/check/` 路径会反向代理到后端服务（含 API 与 WebSocket）。

> ⚠️ 部署前请将 `nginx.conf` 中 `proxy_pass http://backend:8080/check/;` 的 `backend` 改为后端服务的实际地址/主机名，例如 `http://<后端服务器IP>:8080/`。

## 相关链接

- 后端项目：论文查重管理系统后端（独立部署）
