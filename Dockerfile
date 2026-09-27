# ========================================
# 论文查重管理系统 - 前端 Dockerfile
# 多阶段构建：Node 编译 → Nginx 运行
#
# 职责：只托管 Vite 构建产物（纯静态）。
# 后端代理由独立的网关容器负责，本镜像不含任何代理配置。
# ========================================

# ---------- 阶段一：Node 编译 ----------
# 版本与服务器上已验证可用的构建环境保持一致（原为 node:22-alpine）
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层；
# 锁文件已锁定 registry.npmmirror.com 源，国内构建无需额外配置
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com

# 复制源码并构建。
# 依赖 .dockerignore 排除 node_modules，否则宿主机的依赖会覆盖容器内已装好的
# 平台相关原生二进制（rolldown-vite 含 Windows/Linux 不同的二进制），导致构建失败。
COPY . .
RUN npm run build

# ---------- 阶段二：Nginx 运行 ----------
# 固定版本，避免 :alpine 漂移导致行为变化
FROM nginx:1.28-alpine

# 删除默认配置，替换为纯静态托管配置
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# 供 compose 的 depends_on: condition: service_healthy 与部署脚本健康检查使用。
# 必须写 127.0.0.1，不能写 localhost：Docker 会给容器写入 "::1 localhost"，
# BusyBox wget 解析 localhost 取到 IPv6 的 ::1，而 nginx 只绑 IPv4 -> 连接被拒，
# 且 wget 不会回退到下一个地址。compose 里的 healthcheck 会覆盖本行，
# 两处保持一致以免互相误导。
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
