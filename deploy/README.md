# 前端部署与 CI/CD 执行手册

Gitee + Jenkins + 阿里云服务器，三层容器架构，SSH 最小权限部署。

---

## 架构总览

```
                        Internet
                           │ 80 / 443
                           ▼
            ┌──────────────────────────────────┐
            │  gateway  (nginx:1.28-alpine)     │  ← 唯一入口，占 80/443
            │  /opt/check-repeat/nginx/conf     │     证书 + ACME webroot
            └──────────────────────────────────┘
                 │                      │
          location /              location /check/ + /ws/
                 ▼                      ▼
       ┌──────────────────┐   ┌──────────────────┐
       │ frontend 容器      │   │  app  后端容器    │
       │ 纯静态，不占端口    │   │     :8080        │
       │ /opt/check-repeat- │   │ /opt/check-repeat│
       │    frontend        │   └──────────────────┘
       └──────────────────┘
              └──────── check-repeat_app-network ────────┘
                         （external，跨 compose 项目）


  Jenkins 容器 ──SSH（受限密钥）──▶ 宿主机 deploy 用户
                                      │ 仅能 sudo 执行一个脚本
                                      ▼
                             deploy-frontend.sh
                             git fetch → docker build → 换容器 → 健康检查 → 失败回滚
```

**关键设计**

| 项 | 说明 |
| --- | --- |
| 职责边界 | 网关归基础设施目录，前端仓库只含 frontend 服务，两边靠 external network 互通 |
| Jenkins 权限 | **不挂 `docker.sock`**，Jenkins 侧无任何 Docker 权限 |
| 部署权限 | `deploy` 用户**不在 docker 组**，其全部权限是 `sudo` 执行一个 root 所有的脚本 |
| 密钥爆炸半径 | 密钥泄露也只能触发「部署 master 上的某个提交」，无法执行任意命令 |
| 构建位置 | 宿主机（`docker build` 内的 `node:22-alpine`），Jenkins 和宿主机**都不需要装 Node** |
| 回滚 | 镜像按 commit 短 SHA 打 tag，健康检查失败自动回滚，保留最近 5 个 |

---

## 执行顺序总览（先看这个）

各节编号按「配置内容」组织，**不是**执行顺序。实际执行请按下面五阶段走：

| 阶段 | 内容 | 线上影响 | 章节 |
| --- | --- | --- | --- |
| **一** | 准备：备份、克隆仓库、建 certbot webroot 目录 | 无 | 二、三、四、五 |
| **二** | 网关切换（旧前端容器 → gateway + 新 frontend 容器） | **数十秒中断** | 七 · 阶段 A/B/C |
| **三** | 修复证书续期（此时 ACME 通道才真正打通） | 无 | 一 · 1.1~1.4 |
| **四** | 签发 Jenkins 子域证书并启用其 server 块 | 无 | 一 · 1.5 |
| **五** | Jenkins 任务、Gitee webhook、验收 | 无 | 五.5、六、八 |

### ⚠️ 为什么「网关切换」必须排在「证书续期」之前

这是本手册最容易踩的坑，单独说明：

```
   要修续期   ──需要──▶  网关提供 /var/www/certbot   ──需要──▶  网关已切换上线
       ▲                                                          │
       │                                                          │
       └──────────── 证书又要由这个网关来签发 ◀───────────────────┘
```

改造前 ACME 路径指向 `root /usr/share/nginx/html`，那是**前端容器镜像内部**的路径，
宿主机上的 certbot 根本写不进去 —— 也就是说原配置里的 ACME location 从来没有
真正工作过。必须先把网关换成挂在 `/opt/check-repeat/certbot-www` 的新配置，
certbot 才有地方落验证文件。

**同理，Jenkins 子域不能在网关切换时一起启用**：它的 server 块引用一个尚不存在的
证书文件，nginx 会因此拒绝启动，整个主站跟着挂掉。所以 Jenkins 子域被拆到
`deploy/nginx-jenkins.conf`，等阶段四证书签好之后再单独放入。

---

## 零、前置信息

执行前需确认：

| 项 | 值 |
| --- | --- |
| 前端域名 | `check-repeat-system.xyz`（含 `www`） |
| Jenkins 子域 | `jenkins.check-repeat-system.xyz`（需 DNS A 记录） |
| 服务器公网 IP | — |
| 前端目录 | `/opt/check-repeat-frontend` |
| 基础设施目录 | `/opt/check-repeat` |

### 宿主机依赖（先确认，缺了后面一步都走不了）

```bash
git --version            # 【必需】首次 clone、部署脚本的 fetch/checkout/merge-base 全依赖它
docker --version
certbot --version
```

`git` 缺失时装上（阿里云 Linux 3 为 RHEL 系）：

```bash
dnf install -y git       # 若报错改用 yum
```

> 这条**容易漏**：宿主机上既有的服务都是容器化的，日常运维用不到 git，
> 但本方案的部署链路每一环都是 git 驱动的（构建内容完全由提交决定），
> 所以宿主机必须有 git。

---

## 一、🔴 修复证书续期（最高优先级，先做这个）

**现状**：`crontab` 为空、无 certbot systemd timer，证书 **2026-12-26 到期**，
到期后 HTTPS 失效、整站不可访问。且原 ACME 验证路径 `root /usr/share/nginx/html`
指向容器镜像内部，宿主机 certbot 写不进去——**该流程从未真正跑通**。

### 1.1 先查清当前签发方式

```bash
cat /etc/letsencrypt/renewal/check-repeat-system.xyz.conf
```

看 `authenticator` 字段：

- `webroot` → 记下 `webroot_path`，按 1.2 调整
- `standalone` → **必须**改为 webroot，否则续期时 certbot 会尝试独占 80 端口，而 80 被网关容器占用，必然失败

### 1.2 建立 webroot 并修正续期配置

```bash
mkdir -p /opt/check-repeat/certbot-www

# 编辑续期配置
vim /etc/letsencrypt/renewal/check-repeat-system.xyz.conf
```

确保包含（`webroot_path` 需与实际一致）：

```ini
[renewalparams]
authenticator = webroot
webroot_path = /opt/check-repeat/certbot-www,
[[webroot_map]]
check-repeat-system.xyz = /opt/check-repeat/certbot-www
www.check-repeat-system.xyz = /opt/check-repeat/certbot-www
```

### 1.3 验证（必须先通过这步）

```bash
certbot renew --dry-run --webroot -w /opt/check-repeat/certbot-www
```

> `--dry-run` 会走完整个验证流程但不消耗签发配额。**这一步通过之前不要继续。**
> 若报 404，说明网关的 ACME location 还没生效——先完成第二节，再回来跑这步。

### 1.4 配置自动续期 + 续期后重载 Nginx

证书文件是只读挂进网关容器的，续期后容器内的 Nginx **不会自动感知**，必须 reload。
用 deploy-hook 解决：

```bash
cat > /etc/cron.d/certbot-renew <<'EOF'
# 每天两次尝试续期（certbot 自身只在剩余 <30 天时才真正续期），
# 续期成功后重载网关容器内的 Nginx 使新证书生效
0 3,15 * * * root certbot renew --quiet --deploy-hook "docker exec check-repeat-gateway nginx -s reload" >> /var/log/certbot-renew.log 2>&1
EOF

chmod 0644 /etc/cron.d/certbot-renew
```

> `--deploy-hook` 只在**实际发生续期**时执行，不会每次都 reload。

### 1.5 签发 Jenkins 子域证书（阶段四）

> **前置条件**：阶段二（网关切换）已完成，且 1.3 的 `--dry-run` 已通过。
> 否则 ACME 通道不通，这步必然失败。

#### ① 确认 DNS 已生效

```bash
dig +short jenkins.check-repeat-system.xyz
```

必须返回本机公网 IP。返回空值说明记录还没生效，等几分钟再试——
certbot 失败次数过多会触发 Let's Encrypt 的速率限制。

#### ② 签发

```bash
certbot certonly --webroot -w /opt/check-repeat/certbot-www \
  -d jenkins.check-repeat-system.xyz
```

成功后会自动并入 `/etc/letsencrypt/renewal/` 的续期体系，无需额外配置。
验证：

```bash
ls -l /etc/letsencrypt/live/jenkins.check-repeat-system.xyz/fullchain.pem
```

#### ③ 把 Jenkins 容器接入共享网络（带别名）

网关里写的是 `proxy_pass http://jenkins:8080`，而 **Jenkins 是用 `docker run`
启的，不在 compose 里，因此它在 `check-repeat_app-network` 上没有任何别名**。
缺这步日志会报 `host not found in upstream "jenkins"`。

```bash
docker network connect --alias jenkins check-repeat_app-network jenkins

# 验证：能从网关容器里解析到 jenkins
docker exec check-repeat-gateway getent hosts jenkins
```

> 该命令是**立即生效且可热执行**的，不需要重启 Jenkins 容器。
> 但它是运行时的、不落盘：**宿主机重启或 Jenkins 容器被重建后需要重新执行**。
> 想持久化，就把 Jenkins 也纳入 compose 管理，或写进开机脚本。

#### ④ 启用 Jenkins server 块

```bash
install -m 0644 /opt/check-repeat-frontend/deploy/nginx-jenkins.conf \
    /opt/check-repeat/nginx/conf/jenkins.d/10-jenkins.conf

# 先校验再 reload —— nginx -t 失败时【不要】reload
docker exec check-repeat-gateway nginx -t \
  && docker exec check-repeat-gateway nginx -s reload
```

> `nginx -s reload` 是平滑重载，**不会**中断已有连接，与阶段二的切换不同。

#### ⑤ 验证

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://jenkins.check-repeat-system.xyz/login
# 预期 200（或 403，若你启用了 allow/deny 白名单而当前 IP 不在名单内）
```

#### 紧急回退

若启用后主站异常，删掉片段再 reload 即可（主站配置本身没动过）：

```bash
rm /opt/check-repeat/nginx/conf/jenkins.d/10-jenkins.conf
docker exec check-repeat-gateway nginx -t \
  && docker exec check-repeat-gateway nginx -s reload
```

---

## 二、基础设施侧改动

> 网关归基础设施目录，由后端/基础设施侧执行。前端仓库不包含这些文件。

### 2.1 替换网关配置

```bash
cd /opt/check-repeat/nginx/conf

# 备份
cp nginx.conf nginx.conf.bak-$(date +%F-%H%M)

# 建 Jenkins 片段的挂载目录，并放入占位文件
mkdir -p jenkins.d
install -m 0644 /opt/check-repeat-frontend/deploy/jenkins.d/00-placeholder.conf \
    jenkins.d/00-placeholder.conf

# 覆盖主配置
install -m 0644 /opt/check-repeat-frontend/deploy/nginx-gateway.conf \
    nginx.conf
```

> ⚠️ **不要**把 `deploy/nginx-jenkins.conf` 一起放进去。它引用尚未签发的
> 证书，一旦被 include，nginx 会拒绝启动、整站不可用。
> 它要等阶段四（1.5）才启用，源文件也刻意放在 `jenkins.d/` 目录【之外】，
> 就是为了避免误拷。

主配置已不含任何 Jenkins server 块，只留一行
`include /etc/nginx/jenkins.d/*.conf;`，此时该目录里只有纯注释的占位文件。

> ⚠️ 这里的 `install` 是**一次性**的：网关配置不随前端部署更新。
> 之后在仓库里改了它，必须按 **3.5** 重新安装并 reload，否则改动不会生效
> 且没有任何提示。

### 2.2 显式创建共享网络（重要）

改造前后端/前端/网关三方分属**三个独立 compose 项目**，靠一个共享网络互通。
这个网络【不要】由任何一方的 compose 隐式创建——否则那一方执行
`docker compose down` 时会把网络一并删除，另外两方下次启动直接失败。

改为手动创建一次，三方全部以 `external: true` 引用：

```bash
docker network create check-repeat_app-network
```

再把 `/opt/check-repeat/docker-compose.yml`（后端的）底部 networks 段
改为下列形式——既固定了网络名，也把它声明为 external：

```yaml
networks:
  app-network:
    name: check-repeat_app-network
    external: true
```

- **固定名字**：否则项目目录一旦改名，网络名会跟着变，另外两方的
  `external: true` 就找不到网络了（项目名默认取目录名）
- **external**：`docker compose down` 不会删除它，也不会因网络已存在而报错

> 若该网络已存在（当前线上就是），上面的 `create` 会提示已存在，
> 属正常，跳过即可。

### 2.3 网关独立编排

**删除** `/opt/check-repeat/docker-compose.yml` 中的 `frontend` 服务
（已迁至 `/opt/check-repeat-frontend`）。

网关**不**加进这个文件，而是用它自己的编排——原因见文件头注释：

```bash
install -m 0644 /opt/check-repeat-frontend/deploy/gateway-compose.yml \
    /opt/check-repeat/nginx/docker-compose.yml

cd /opt/check-repeat/nginx
docker compose -f /opt/check-repeat/nginx/docker-compose.yml config >/dev/null \
    && echo "网关编排 OK"
```

> ⚠️ **必须显式带 `-f`**。Docker Compose v2 在当前目录找不到 compose 文件时会
> **向上级目录查找**，而 `/opt/check-repeat/docker-compose.yml`（后端那份）就在上一级。
> 不带 `-f` 的后果：
>   - `docker compose config` 会静默校验**后端**文件并报 OK，让你以为网关没问题
>   - `docker compose up -d` 会去**启动后端**，而不是网关
>
> 判断有没有踩到：看输出里的路径。校验通过时 `grep '^name:'` 应回显
> `check-repeat-gateway`，回显 `check-repeat` 就说明校验的是后端。

三方生命周期互相独立，没有任何启动顺序依赖：

| 目录 | 编排 | 归属 |
| --- | --- | --- |
| `/opt/check-repeat/` | `docker-compose.yml` | 后端 |
| `/opt/check-repeat/nginx/` | `docker-compose.yml` | 网关（本文件） |
| `/opt/check-repeat-frontend/` | `docker-compose.yml` | 前端仓库 |

网关的四个挂载**缺一不可**：

| 挂载 | 作用 | 缺了会怎样 |
| --- | --- | --- |
| `nginx.conf` | 网关主配置 | 容器起不来 |
| `jenkins.d` | Jenkins 子域片段目录 | `include` 指向不存在的路径，**nginx 拒绝启动** |
| `/etc/letsencrypt` | 证书（只读） | 找不到证书，nginx 拒绝启动 |
| `certbot-www` | ACME 验证文件 | 续期报 404，**证书到期后整站挂** |

`certbot-www` 目录需先建好。不写 `:ro` 是为了让容器内自检时也能写入，
但**真正的写入方是宿主机上的 certbot**：

```bash
mkdir -p /opt/check-repeat/certbot-www
```

### 2.4 新增 `.dockerignore`

`app` 的构建上下文是整个 `/opt/check-repeat/`，其中含 `.env`（MySQL/Redis/JWT 密钥）。
新增 `/opt/check-repeat/.dockerignore` 防止密钥被打进后端镜像：

```
.env
.env.*
!.env.example
certbot-www
nginx
*.log
.git
```

### 2.5 校验

```bash
docker compose -f /opt/check-repeat/nginx/docker-compose.yml config \
    | grep -E '^name:'          # 应回显 check-repeat-gateway

docker compose -f /opt/check-repeat/nginx/docker-compose.yml config >/dev/null \
    && echo "网关编排 OK"

# 注意：此时【不要】执行 docker compose up -d
# 80/443 还被旧前端容器占着，现在起会因端口冲突失败。
# 网关的启动属于阶段二（第七节·阶段 C）。
```

`app` 的构建上下文 `nginx/` 目录现在多了一个 compose 文件，
`.dockerignore` 已覆盖（见 2.4），不会被打进后端镜像。

---

## 三、部署前端仓库到服务器

### 3.1 克隆

```bash
git clone https://gitee.com/Sc0102_1129/check-repeat-frontend.git \
  /opt/check-repeat-frontend

# 所有权归 root，deploy 用户不可写（否则可篡改构建上下文 = 提权）
chown -R root:root /opt/check-repeat-frontend
chmod -R go-w /opt/check-repeat-frontend

# 避免 git 报 dubious ownership
git config --global --add safe.directory /opt/check-repeat-frontend
```

### 3.2 确认外网（external）网络已存在

```bash
docker network ls | grep check-repeat_app-network
```

必须存在，否则前端 compose 会启动失败。它由基础设施侧**手动创建一次**
（见 2.2），三方均以 `external: true` 引用，谁都不会删除它。

### 3.3 首次手工构建验证

```bash
cd /opt/check-repeat-frontend
FRONTEND_TAG=manual docker compose build frontend
FRONTEND_TAG=manual docker compose up -d
docker inspect --format '{{.State.Health.Status}}' check-repeat-frontend
```

> ⚠️ 此时旧的前端容器仍占用 80/443 且同名，**先不要执行这步**，
> 等第四节切换时再一起做。这里仅说明验证方法。

### 3.4 安装部署脚本与 sudo 授权

```bash
install -m 0755 -o root -g root \
  /opt/check-repeat-frontend/deploy/deploy-frontend.sh \
  /usr/local/bin/deploy-frontend.sh

install -m 0440 -o root -g root \
  /opt/check-repeat-frontend/deploy/sudoers.deploy-frontend \
  /etc/sudoers.d/deploy-frontend

visudo -cf /etc/sudoers.d/deploy-frontend    # 必须通过
```

### 3.5 ⚠️ 这四个文件改了必须重装

本方案里有四个文件**在 git 仓库中**，却**不在部署流水线上**：

| 文件（仓库内） | 系统上的位置 | 安装模式 |
| --- | --- | --- |
| `deploy/deploy-frontend.sh` | `/usr/local/bin/deploy-frontend.sh` | `0755` |
| `deploy/sudoers.deploy-frontend` | `/etc/sudoers.d/deploy-frontend` | `0440` |
| `deploy/nginx-gateway.conf` | `/opt/check-repeat/nginx/conf/nginx.conf` | `0644` |
| `deploy/gateway-compose.yml` | `/opt/check-repeat/nginx/docker-compose.yml` | `0644` |

**`deploy-frontend.sh` 只重建前端容器，永远不会碰这四个文件。** 所以你在仓库里改了它们、
推送到 master、Jenkins 跑绿——**服务器上的那份仍然没变**。

这就是静默漂移：改动看起来"发布了"，实际系统上跑的还是旧版，而且没有任何提示。
其中 `deploy-frontend.sh` 和 sudoers 最危险——它们决定部署行为与权限边界，改错不生效
会让你以为新规则已经生效。

#### 已内置的自检

部署脚本会在每次部署时自动比对前两个文件（系统版本 vs 本次提交里的版本），
不一致就在日志里告警：

```
⚠️  部署脚本 与仓库版本不一致，改动【未生效】，本次仍按旧版执行：
      运行中：/usr/local/bin/deploy-frontend.sh
      仓库中：/opt/check-repeat-frontend/deploy/deploy-frontend.sh  （提交 a1b2c3d4 的版本）
      重装：install -m 0755 -o root -g root .../deploy-frontend.sh /usr/local/bin/deploy-frontend.sh
```

> 只告警不阻断。同一提交若同时改了脚本与业务代码，阻断会让这次部署永远无法推进
> （脚本要下次才生效），陷入死锁。
>
> 每次触发部署后翻一眼 Jenkins 控制台日志，搜 `⚠️` 即可确认有无漂移。

#### 后两个文件没有自检，只能靠人工

网关配置与网关编排不在部署脚本的视野内（它们跑在另一个容器里），改了必须手工重装：

```bash
install -m 0644 /opt/check-repeat-frontend/deploy/nginx-gateway.conf \
    /opt/check-repeat/nginx/conf/nginx.conf
install -m 0644 /opt/check-repeat-frontend/deploy/gateway-compose.yml \
    /opt/check-repeat/nginx/docker-compose.yml

# 网关配置改了就 reload（平滑重载，不断连接）；编排改了才需要 up -d
docker exec check-repeat-gateway nginx -t \
  && docker exec check-repeat-gateway nginx -s reload
```

> 为什么网关不并入流水线：网关同时承载前端与后端两个上游，
> 若前端发一次版就能覆盖它，一个坏提交会连带把后端也打挂。
> 高频变更的前端与低频变更的入口配置，发布节奏本就应当分开。

---

## 四、受限用户与 SSH（生产标准核心）

### 4.1 建用户（**不要**加入 docker 组）

```bash
useradd --create-home --shell /bin/bash deploy
# 关键：不执行 usermod -aG docker deploy
```

> 能执行 docker 命令 ≡ 宿主机 root（`docker run -v /:/host` 即可逃逸）。
> 本方案让 `deploy` 完全不具备 Docker 权限，其唯一能力是 sudo 执行那个脚本。

### 4.2 生成密钥对

```bash
ssh-keygen -t ed25519 -f /tmp/deploy_frontend_key -N "" -C "jenkins-deploy-frontend"
```

- **私钥** `/tmp/deploy_frontend_key` → 存入 Jenkins 凭据（第 6.2 节），之后**从服务器删除**
- **公钥** `/tmp/deploy_frontend_key.pub` → 装进 authorized_keys

### 4.3 写入受限 authorized_keys

```bash
mkdir -p /home/deploy/.ssh
cat > /home/deploy/.ssh/authorized_keys <<'EOF'
command="sudo /usr/local/bin/deploy-frontend.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding ssh-ed25519 AAAA...你的公钥... jenkins-deploy-frontend
EOF

chmod 0700 /home/deploy/.ssh
chmod 0600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

这行的效果：**该密钥无论请求执行什么，都只会运行那一个脚本**，且不能开 PTY、不能端口转发、不能转发 agent。

#### ⚠️ `command=` 里绝不能写 `$SSH_ORIGINAL_COMMAND`

sshd 执行 `command=` 时是交给**登录 shell** 跑的。一旦把客户端命令插值进去，
其中的 `;`、`|`、反引号会被 shell 解释：

```
客户端：ssh deploy@host 'id; whoami'
shell ：sudo /usr/local/bin/deploy-frontend.sh id; whoami
                                                  └── 这段以 deploy 身份跑掉了
```

`sudo` 那半截会被 sudoers 的参数限制挡下，但 `;` 后面那截不会 —— 等于把受限密钥
变成任意命令执行。`origin/master` 校验、sudoers 白名单都发生在脚本内部，在那之后，
挡不住这个。

**commit SHA 的传递方式是环境变量，不是命令行参数。** sshd 会把客户端原始命令放进
`SSH_ORIGINAL_COMMAND` 环境变量（见 `sshd(8)`），脚本自己读它，全程不经过 shell。
配合 sudoers 里的 `env_keep`（[sudoers.deploy-frontend](sudoers.deploy-frontend)）
保证 `sudo` 不把它清掉。

### 4.4 验证密钥限制确实生效

```bash
ssh -i /tmp/deploy_frontend_key deploy@127.0.0.1 "id; whoami"
```

预期：只会触发部署脚本并因参数不合规而报错，**不会**返回 `id`/`whoami` 的输出。
若真返回了 uid，说明 `command=` 里插值了 `$SSH_ORIGINAL_COMMAND`（见 4.3 的警告），
或 `command=` 根本没生效，检查 authorized_keys 格式。

再验一次**正常路径**，确认 SHA 确实通过环境变量传到了脚本：

```bash
# 取一个真实存在的 commit SHA（这一步本身就会触发一次真实部署）
SHA=$(git -C /opt/check-repeat-frontend rev-parse origin/master)
ssh -i /tmp/deploy_frontend_key deploy@127.0.0.1 "$SHA"
```

预期：脚本日志里出现 `请求参数：<该 SHA>`。

- 若报 `请求参数：<master HEAD>`（拿不到 SHA）→ sudoers 缺 `env_keep += "SSH_ORIGINAL_COMMAND"`
- 若报 `sudo: a password is required` 或 `not allowed` → sudoers 末尾的 `""` 写法有问题，
  它表示「不允许任何参数」，确认已按 [sudoers.deploy-frontend](sudoers.deploy-frontend) 安装并
  `visudo -cf` 通过

### 4.5 记录主机指纹（供 Jenkins 校验，防中间人）

```bash
ssh-keyscan -t ed25519 <宿主机IP> >> /tmp/known_hosts
cat /tmp/known_hosts
```

---

## 五、Jenkins 配置

### 5.1 确认 Jenkins 容器具备条件

```bash
# 是否有 SSH 客户端（jenkins/jenkins 镜像不保证自带）
docker exec jenkins sh -c 'command -v ssh ssh-keyscan || echo "缺少 ssh 客户端"'

# 容器视角下宿主机的地址（通常是默认网关）
docker exec jenkins sh -c 'ip route | grep default'

# /var/jenkins_home 已持久化（前面已确认）
docker exec jenkins ls -d /var/jenkins_home/.ssh
```

> **网络接入不在本节**：把 Jenkins 接入 `check-repeat_app-network` 并设别名
> 属于网关侧配置的前置条件，见 1.5 ③。不先做那步，5.5 里配好的
> webhook 地址会返回 502。

**若缺少 `ssh` 客户端**，需重建 Jenkins 容器并安装（`jenkins_home` 已持久化，安全）：

```bash
docker exec -u root jenkins sh -c 'apt-get update && apt-get install -y openssh-client'
```

> 注意：这种方式装的包在容器重建后会丢失。若要持久，建议自建镜像
> `FROM jenkins/jenkins:lts-jdk17` + `RUN apt-get install -y openssh-client`。

### 5.2 添加 SSH 凭据

**系统管理 → 凭据 → 全局 → 添加凭据**

| 字段 | 值 |
| --- | --- |
| 类型 | `SSH Username with private key` |
| ID | `deploy-frontend-ssh-key`（必须与 Jenkinsfile 一致） |
| Username | `deploy` |
| Private Key | 粘贴 `/tmp/deploy_frontend_key` 内容 |

添加后**删除服务器上的私钥**：

```bash
shred -u /tmp/deploy_frontend_key
```

### 5.3 写入 known_hosts

```bash
docker exec -u jenkins jenkins sh -c 'mkdir -p /var/jenkins_home/.ssh'
docker exec -i -u jenkins jenkins sh -c 'cat >> /var/jenkins_home/.ssh/known_hosts' < /tmp/known_hosts
```

### 5.4 安装插件

**系统管理 → 插件管理 → 可选插件**：

- `Generic Webhook Trigger` — 接收 Gitee 回调
- `Git` — 拉取代码
- `Credentials Binding` — 注入 SSH 私钥（通常已默认安装）

### 5.5 新建流水线任务

**新建任务 → `check-repeat-frontend` → 流水线**

- 定义：`Pipeline script from SCM`
- SCM：`Git`
- Repository URL：`https://gitee.com/Sc0102_1129/check-repeat-frontend.git`
- 分支：`*/master`
- 脚本路径：`Jenkinsfile`

**构建触发器**：勾选 `Generic Webhook Trigger`，**Token** 填长随机串：

```bash
openssl rand -hex 24
```

回调地址即：

```
https://jenkins.check-repeat-system.xyz/generic-webhook-trigger/invoke?token=<你的token>
```

### 5.6 按实际值调整 Jenkinsfile

部署前确认 `Jenkinsfile` 中 `DEPLOY_HOST` 与 5.1 查到的默认网关一致（默认 bridge 下通常是 `172.17.0.1`）。

---

## 六、Gitee Webhook

仓库 → **管理 → Web Hooks → 添加**：

| 字段 | 值 |
| --- | --- |
| URL | `https://jenkins.check-repeat-system.xyz/generic-webhook-trigger/invoke?token=<token>` |
| 密码/签名 | 留空（鉴权由 URL token 承担） |
| 事件 | 勾选 **Push** |
| 激活 | ✅ |

用 Gitee 的「测试」按钮验证返回 200。

---

## 七、切换上线（带回滚预案）

> 要把正在服务的 80/443 从旧前端容器挪到新网关容器，**必然有一小段中断**。
> 下面分三阶段，前两阶段不影响线上，第三阶段才切换。
>
> **后端全程不受影响**：`app` 等容器不动，也不重建。

### 阶段 A：准备（线上无影响）

```bash
# 备份一切
cp /opt/check-repeat/docker-compose.yml /opt/check-repeat/docker-compose.yml.bak-$(date +%F-%H%M)
cp /opt/check-repeat/nginx/conf/nginx.conf /opt/check-repeat/nginx/conf/nginx.conf.bak-$(date +%F-%H%M)

# 建 ACME 落盘目录（certbot 的 -w 指向它）
mkdir -p /opt/check-repeat/certbot-www

# 克隆前端仓库并预热构建（构建不冲突，容器还不起）
cd /opt/check-repeat-frontend
git fetch origin
FRONTEND_TAG=manual docker compose build frontend
```

### 阶段 B：网关预演（线上无影响）

在**临时端口**上验证网关配置正确，确认后再切换：

```bash
# 临时用 8080 起一个网关测试实例
# 挂载必须与正式 gateway 服务【完全一致】，否则预演通过、正式切换失败
docker run -d --rm --name gateway-test \
  --network check-repeat_app-network \
  -p 8080:80 \
  -v /opt/check-repeat/nginx/conf/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /opt/check-repeat/nginx/conf/jenkins.d:/etc/nginx/jenkins.d:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /opt/check-repeat/certbot-www:/var/www/certbot \
  nginx:1.28-alpine

sleep 3
docker logs gateway-test          # 确认无 "host not found in upstream"

# 配置语法自检（在正式切换前就能发现括号、指令拼写问题）
docker exec gateway-test nginx -t

# 验证 ACME 通道已打通：这一步是阶段三能成功的前提
docker exec gateway-test sh -c \
  'mkdir -p /var/www/certbot/.well-known/acme-challenge && \
   echo acme-ok > /var/www/certbot/.well-known/acme-challenge/probe'
curl -sS -H 'Host: check-repeat-system.xyz' \
  http://127.0.0.1:8080/.well-known/acme-challenge/probe
# 预期输出 acme-ok；返回 301 或 404 说明 ACME location 没生效，必须先解决
docker exec gateway-test rm -rf /var/www/certbot/.well-known

# 注意：此时 frontend 容器还没起来，location / 会 502，这是预期的；
# 重点确认 nginx 本身能启动、/check/ 能通
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/check/actuator/health/liveness

docker rm -f gateway-test
```

> 这一步专为验证第一节提到的「网关因解析不到 frontend 而拒绝启动」问题。
> 配置里已用 `resolver` + 变量规避，这里确认它真的生效。

### 阶段 C：正式切换（有中断）

> **前置确认（两条，缺一不可）**
>
> 1. `/opt/check-repeat/docker-compose.yml` 里的 `frontend` 服务**已经删掉**（见 2.3）。
>    否则一旦有人在该目录执行 `docker compose up -d`，compose 会因为服务定义还在
>    而重新创建一个前端容器，与网关争抢 80/443 端口。删掉后，旧容器最多成为
>    「孤立容器」，不会影响任何东西。
> 2. 后端容器（`app` 等）**不参与本次切换**，保持原样运行。
>    网络段的改动（改为 external）只影响该文件以后的编排行为，
>    **本次不需要**在该目录执行 `docker compose up -d` ——
>    那会重建后端容器，平白多一次后端中断。

```bash
# 1. 给旧容器改名，腾出容器名给新前端。
#    改名对运行中的容器是安全的，服务不受影响。
#    保留它（而不是删掉）是为了留一条回滚路径。
docker rename check-repeat-frontend check-repeat-frontend-legacy

# 2. 起新前端容器。它不发布端口，与旧容器不冲突，
#    此步线上仍由 legacy 容器正常服务。
cd /opt/check-repeat-frontend
FRONTEND_TAG=manual docker compose up -d
docker inspect --format '{{.State.Health.Status}}' check-repeat-frontend   # 必须 healthy

# 3. 停掉旧容器，释放 80/443 —— 中断从这里开始
docker stop check-repeat-frontend-legacy

# 4. 起网关，接住 80/443 —— 中断结束（整个窗口通常几秒）
#    必须带 -f，否则 compose 会向上找到后端编排并去启动后端（见 2.3 的警告）
docker compose -f /opt/check-repeat/nginx/docker-compose.yml up -d

# 5. 验证
docker exec check-repeat-gateway nginx -t
curl -sS -o /dev/null -w 'gateway healthz: %{http_code}\n' http://127.0.0.1/healthz
curl -sS -o /dev/null -w 'frontend via gateway: %{http_code}\n' https://check-repeat-system.xyz/
```

验证通过后再清理旧容器（**确认无误前不要删**，它是回滚依托）：

```bash
docker rm check-repeat-frontend-legacy
```

---

预期中断时间：**几秒**（步骤 3 与 4 之间的窗口）。
旧容器只停不删，因此新旧前端容器已同时在网络中就绪，网关一起来立刻有上游可用。

### 回滚预案（切换后异常时立即执行）

```bash
# 1. 停网关（释放 80/443）—— 同样必须带 -f
docker compose -f /opt/check-repeat/nginx/docker-compose.yml down

# 2. 恢复旧前端容器（它原名就是 check-repeat-frontend，
#    所以先把新前端容器改名让位）
docker rename check-repeat-frontend check-repeat-frontend-new
docker start check-repeat-frontend-legacy
docker rename check-repeat-frontend-legacy check-repeat-frontend

# 3. 确认恢复
curl -sS -o /dev/null -w '%{http_code}\n' https://check-repeat-system.xyz/
```

> 旧容器**未被改动过**（只改过名字），起回来即是原状态，无需恢复任何配置。
> 网关配置的备份（`nginx.conf.bak-<时间戳>`）只在你想彻底退回
> 「前端容器直接占 80/443」的旧架构时才需要。

---

## 八、验收清单

| # | 验证 | 命令 / 操作 | 失败含义 |
| --- | --- | --- | --- |
| 1 | 证书续期可用 | `certbot renew --dry-run --webroot -w /opt/check-repeat/certbot-www` | ACME 路径或 DNS 有问题，**到期会全站挂** |
| 2 | 续期任务已注册 | `cat /etc/cron.d/certbot-renew` | 证书无人续期 |
| 3 | 网关配置合法 | `docker exec check-repeat-gateway nginx -t` | 配置语法错误 |
| 4 | 主站可访问 | 浏览器打开 `https://check-repeat-system.xyz/` | 网关或证书问题 |
| 5 | 前端容器健康 | `docker inspect --format '{{.State.Health.Status}}' check-repeat-frontend` → `healthy` | 镜像或静态配置问题 |
| 6 | SPA 刷新不白屏 | 进内页按 F5 | `try_files` 回退未生效 |
| 7 | 接口链路 | 登录一次，F12 看 `/check/**` 返回 200 | 后端未起或 `/check/` 转发错 |
| 8 | **WebSocket 实时进度** | 学生查重页看进度是否实时更新 | `/ws/` 未透传 Upgrade 或未关 `proxy_buffering` |
| 9 | 论文上传 | 传一份大文件 | `client_max_body_size` 不足 |
| 10 | 图表渲染 | 打开统计/看板页 | echarts 打包问题 |
| 11 | 密钥未泄露 | `docker exec check-repeat-frontend ls /opt 2>/dev/null` | 构建上下文含 `.env` |
| 12 | 部署脚本权限 | `ssh -i <key> deploy@host "id"` **不应**返回 uid | `command=` 限制失效 |
| 13 | 自动触发 | 推一次代码看 Jenkins 是否自动构建 | webhook 未通 |
| 14 | 自动回滚 | 见下 | 回滚逻辑缺陷 |

### 回滚演练

```bash
# 手工触发一次必然失败的部署：传一个不存在的 SHA
sudo /usr/local/bin/deploy-frontend.sh deadbeef
```

预期：脚本拒绝（SHA 不在 origin/master 历史中）并退出非零。
再验证真正的回滚路径：临时把 Dockerfile 的 `CMD` 改坏、推送到 master，
观察部署失败后是否自动回滚并恢复服务，然后 `git revert` 掉。

---

## 九、日常发布

```bash
git add . && git commit -m "feat: xxx" && git push origin master
```

Jenkins 自动执行。镜像 tag 为 commit 短 SHA，宿主机保留最近 5 个。

> ⚠️ **若本次改动涉及 3.5 列出的四个文件**（`deploy-frontend.sh`、sudoers、
> 网关配置、网关编排），push 推送后它们**不会**自动生效，必须按 3.5 手工重装。
> 前两个会在下次部署时被自检告警出来；**后两个没有自检**，只能靠你记住。
>
> 判断方法：`git show --stat HEAD` 看本次提交动了哪些文件。

**手工回滚到指定提交**：

```bash
ssh -i <key> deploy@<host> "<目标commit短SHA>"
```

---

## 十、排错

| 现象 | 原因与处理 |
| --- | --- |
| 网关起不来，日志 `host not found in upstream` | `location /` 未用 `resolver`+变量；检查是否误写成字面主机名 |
| 502 且 frontend 容器在跑 | 两者不在同一网络：`docker inspect` 确认都在 `check-repeat_app-network` |
| 前端 compose 报 `network ... not found` | 基础设施侧 compose 尚未创建该网络，或网络名不匹配（见 2.2） |
| Jenkins 里 `ssh: not found` | 容器缺 openssh-client，见 5.1 |
| `Host key verification failed` | known_hosts 未写入，见 5.3 |
| `Permission denied (publickey)` | authorized_keys 权限不对（须 0600 且属主 deploy） |
| sudo 报 `no tty present` | sudoers 缺 `NOPASSWD`，或 authorized_keys 的 `command=` 未走 sudo |
| `docker: command not found` | **正常**，deploy 用户不应有 Docker 权限；说明有人误加进了 docker 组，应移除 |
| 构建报原生模块错误 | `.dockerignore` 未生效，宿主机 `node_modules` 混入镜像 |
| `npm ci` 报锁文件不同步 | 本地 `npm install` 后提交 `package-lock.json` |
| 发版后用户看到旧页面 | 检查 `location = /index.html` 的禁缓存是否生效 |
| 前端容器 `unhealthy` 但页面访问正常 | healthcheck 写成了 `localhost`：Docker 写入的 `::1 localhost` 让 BusyBox wget 解析到 IPv6，而 nginx 只绑 IPv4，连接被拒且 wget 不回退。改用 `127.0.0.1`。注意这不只影响显示——部署脚本的 `wait_healthy` 会因此判定发布失败并自动回滚 |
| 证书续期 404 | 网关 ACME location 未指到 `/var/www/certbot`，或 webroot 目录未挂载 |
| Jenkins 日志有 `⚠️ 部署脚本 与仓库版本不一致` | 正常告警，不是错误。改了脚本/sudoers 没重装，见 3.5 |
| 改了网关配置但行为没变 | 网关配置不随前端部署更新，需手工重装 + reload，见 3.5 |
| `docker compose config` 校验了错误的文件 | 未显式带 `-f`，compose 向上找到了后端编排，见 2.3 |

---

## 十一、遗留问题

1. **echarts 首屏体积**：echarts 在 `main.js` 静态引入并挂到 `window.echarts`，所有页面
   （含登录页）都会加载约 1.1MB（gzip 375KB）的 chunk。已独立分包可长期缓存。
   若在意首屏，可改为在 6 个图表页面各自 `import`，由 Vite 按路由分包。

2. **`subscribeCheckStatus` 是死代码**：`src/api/student.js` 中该函数用
   `new WebSocket('/check/ws/...')` 传相对路径，原生 `WebSocket` 要求绝对 URL，
   调用会抛 `SyntaxError`。全项目无调用点。若启用需改拼绝对地址
   （参考 `src/composables/useCheckProgress.js` 的 SockJS 写法）。

3. **Jenkins UI 暴露**：网关配置中 Jenkins 子域的 `location /` 默认未限制来源，
   `allow/deny` 两行是注释状态。**务必开启 Jenkins 登录认证并使用强密码**；
   若能确定运维出口 IP，建议取消注释做白名单。
