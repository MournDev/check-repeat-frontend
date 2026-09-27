#!/usr/bin/env bash
# ============================================================
# 前端部署脚本
# 部署位置：/usr/local/bin/deploy-frontend.sh
# 权限：root:root 755（deploy 用户【不可写】，否则等于给了 root）
#
# 调用方：Jenkins 经 SSH 以 deploy 用户登录，
#         authorized_keys 中以 command= 强制只允许执行本脚本。
#         deploy 用户【不属于 docker 组】，其全部权限就是本脚本。
#
# 用法：deploy-frontend.sh [commit-sha]
#       不带参数  -> 部署 origin/master 当前 HEAD
#       带 40 位   -> 部署指定提交（必须存在于 origin/master 历史中）
# ============================================================
set -Eeuo pipefail

APP_DIR=/opt/check-repeat-frontend
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
CONTAINER=check-repeat-frontend
IMAGE=check-repeat-frontend
KEEP_TAGS=5
HEALTH_TIMEOUT=60          # 秒
LOG_FILE=/var/log/deploy-frontend.log

# 仅 root 可执行（脚本会经由 sudo 调用）
if [ "$(id -u)" -ne 0 ]; then
    echo "错误：本脚本必须以 root 身份运行（请通过 sudo 调用）" >&2
    exit 1
fi

log() {
    echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"
}

# ------------------------------------------------------------
# 1. 参数校验
#    这是权限边界的关键：脚本是 deploy 用户唯一能做的事，
#    因此参数必须严格白名单校验，且拒绝任何多余参数。
# ------------------------------------------------------------
if [ "$#" -gt 1 ]; then
    echo "错误：只接受 0 或 1 个参数，收到 $#" >&2
    exit 1
fi

TARGET_INPUT="${1:-}"

if [ -n "$TARGET_INPUT" ] && ! printf '%s' "$TARGET_INPUT" | grep -qE '^[0-9a-f]{7,40}$'; then
    echo "错误：参数必须是 7-40 位十六进制 commit SHA，收到：$TARGET_INPUT" >&2
    exit 1
fi

exec 9>"$LOG_FILE.lock"
flock -n 9 || { echo "错误：已有部署在进行中" >&2; exit 1; }

log "===== 开始部署（请求参数：${TARGET_INPUT:-<master HEAD>}）====="

# ------------------------------------------------------------
# 2. 拉取代码并解析目标提交
# ------------------------------------------------------------
cd "$APP_DIR"

log "拉取 origin..."
git fetch --prune --tags origin

if [ -n "$TARGET_INPUT" ]; then
    # 必须能解析出完整 SHA
    if ! TARGET_SHA=$(git rev-parse --verify --quiet "${TARGET_INPUT}^{commit}"); then
        log "错误：提交不存在：$TARGET_INPUT"
        exit 1
    fi
    # 必须在 origin/master 历史中，防止被用来部署任意分支或未合并提交
    if ! git merge-base --is-ancestor "$TARGET_SHA" origin/master; then
        log "错误：提交 $TARGET_SHA 不在 origin/master 历史中，拒绝部署"
        exit 1
    fi
else
    TARGET_SHA=$(git rev-parse origin/master)
fi

SHORT_SHA=$(git rev-parse --short=8 "$TARGET_SHA")
log "目标提交：$TARGET_SHA（短 SHA：$SHORT_SHA）"
log "提交信息：$(git log -1 --pretty='%s' "$TARGET_SHA")"

# 记录回滚目标：当前正在运行的镜像 tag
PREV_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || echo "")
PREV_TAG="${PREV_IMAGE##*:}"
if [ -n "$PREV_TAG" ] && [ "$PREV_TAG" != "$PREV_IMAGE" ]; then
    log "回滚目标：$IMAGE:$PREV_TAG"
else
    PREV_TAG=""
    log "未发现既有容器，本次为首发部署（无回滚目标）"
fi

# ------------------------------------------------------------
# 3. 切到目标提交并构建
# ------------------------------------------------------------
git checkout --detach --force "$TARGET_SHA"

log "构建镜像 $IMAGE:$SHORT_SHA ..."
FRONTEND_TAG="$SHORT_SHA" docker compose -f "$COMPOSE_FILE" build frontend

# ------------------------------------------------------------
# 4. 滚动替换容器
# ------------------------------------------------------------
log "启动容器..."
FRONTEND_TAG="$SHORT_SHA" docker compose -f "$COMPOSE_FILE" up -d --no-deps frontend

# ------------------------------------------------------------
# 5. 健康检查（读容器自身的 healthcheck 状态，无需对外暴露端口）
# ------------------------------------------------------------
wait_healthy() {
    local waited=0 status
    while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
        status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER" 2>/dev/null || echo "missing")
        case "$status" in
            healthy) return 0 ;;
            unhealthy|exited|dead|missing) return 1 ;;
        esac
        sleep 2
        waited=$((waited + 2))
    done
    return 1
}

if wait_healthy; then
    log "✅ 健康检查通过，部署成功：$IMAGE:$SHORT_SHA"
else
    log "❌ 健康检查失败（等待 ${HEALTH_TIMEOUT}s）"

    if [ -z "$PREV_TAG" ]; then
        log "无可用回滚镜像，保持当前状态（失败）"
        exit 1
    fi

    if ! docker image inspect "$IMAGE:$PREV_TAG" >/dev/null 2>&1; then
        log "回滚镜像 $IMAGE:$PREV_TAG 在本地已不存在，无法回滚"
        exit 1
    fi

    log "开始回滚到 $IMAGE:$PREV_TAG ..."
    if FRONTEND_TAG="$PREV_TAG" docker compose -f "$COMPOSE_FILE" up -d --no-deps frontend && wait_healthy; then
        log "✅ 已回滚到 $IMAGE:$PREV_TAG，本次部署标记为失败"
    else
        log "❌ 回滚后健康检查仍失败，需要人工介入！"
    fi
    exit 1
fi

# ------------------------------------------------------------
# 6. 清理旧镜像
#
# 注意：镜像 tag 是 commit 短 SHA，排序必须按【创建时间】而非 tag 本身。
# 用 sort -r 直接排 SHA 是字母序，与时间无关，会保留随机的 5 个 tag。
# CreatedAt 形如 "2026-09-27 16:04:33 +0800 CST"，以它作首字段做
# 反向字典序即等价于「新→旧」，故用 '{{.CreatedAt}}|{{.Tag}}' 排序。
#
# 正在运行的镜像无法被删除（docker rmi 会失败），因此回滚目标天然受保护；
# 这里再显式跳过当前运行 tag，避免噪声日志。
# ------------------------------------------------------------
log "清理旧镜像（保留最近 $KEEP_TAGS 个，跳过运行中的 $SHORT_SHA）..."
docker images "$IMAGE" --format '{{.CreatedAt}}|{{.Tag}}' \
    | grep -v '|<none>$' \
    | grep -v '|latest$' \
    | sort -r \
    | tail -n +$((KEEP_TAGS + 1)) \
    | cut -d'|' -f2 \
    | while read -r tag; do
        if [ "$tag" = "$SHORT_SHA" ] || [ "$tag" = "$PREV_TAG" ]; then
            log "  保留 $IMAGE:$tag（当前运行 / 回滚目标）"
            continue
        fi
        docker rmi "$IMAGE:$tag" >/dev/null 2>&1 \
            && log "  已删除 $IMAGE:$tag" \
            || log "  跳过 $IMAGE:$tag（仍被使用）"
    done

log "===== 部署完成 ====="
