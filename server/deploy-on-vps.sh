#!/usr/bin/env bash
# 在 VPS 上一键部署 invite-api 后端 + nginx 反代。
#
# 使用方法（在 VPS 上以 root 或 sudo 用户执行）：
#   curl -sSL https://raw.githubusercontent.com/jzhang7-art/yuanji-fortune/main/server/deploy-on-vps.sh | bash
#
# 或本地下载后 INVITE_SECRET=... bash deploy-on-vps.sh
#
# 脚本特点：
#   - 幂等：重复执行不会损坏现有状态
#   - 自检：每一步失败立即停止并打印原因
#   - 不动 nginx 主配置，只往你站点配置里追加一个 location /api/
set -euo pipefail

# === 可配置项（按需修改） ===
SECRET="${INVITE_SECRET:-47e676927cbbfe82bc3e90b78ccb30bbeb01d0697b970bb220b42644cb13891c}"
REPO_URL="https://github.com/jzhang7-art/yuanji-fortune.git"
INSTALL_DIR="/opt/invite-api"
ENV_FILE="/etc/invite-api.env"
NGINX_SITE_GLOB="/etc/nginx/sites-enabled/*xuanjitime* /etc/nginx/conf.d/*xuanjitime*"
PORT=3001

log() { echo -e "\033[36m[deploy]\033[0m $*"; }
err() { echo -e "\033[31m[error]\033[0m $*" >&2; exit 1; }

# === 1. 环境检查 ===
log "1/7 检查环境"
command -v node >/dev/null || err "Node 未安装。请先 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash && sudo apt install -y nodejs'"
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\)\..*/\1/')
[ "$NODE_MAJOR" -ge 18 ] || err "Node 版本 $NODE_MAJOR 太旧，需 ≥18"
command -v git >/dev/null || err "git 未安装"
command -v nginx >/dev/null || err "nginx 未安装"
command -v pm2 >/dev/null || { log "  安装 pm2…"; npm i -g pm2; }

# === 2. 拉代码 ===
log "2/7 拉代码到 $INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"
sudo chown -R "$USER" "$INSTALL_DIR"
if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR" && git fetch --all && git reset --hard origin/main
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# === 3. 写 secret ===
log "3/7 写 $ENV_FILE"
echo "INVITE_SECRET=$SECRET" | sudo tee "$ENV_FILE" > /dev/null
sudo chmod 600 "$ENV_FILE"

# === 4. 启服务 ===
log "4/7 pm2 启动 invite-api"
pm2 delete invite-api 2>/dev/null || true
pm2 start "$INSTALL_DIR/server/ecosystem.config.cjs"
pm2 save
sleep 2
pm2 logs invite-api --lines 5 --nostream

# === 5. 本机自测 ===
log "5/7 本机 self-test"
for i in 1 2 3 4 5; do
  if curl -sS --max-time 2 -X POST "http://127.0.0.1:$PORT/api/redeem" \
       -H "Content-Type: application/json" \
       -d '{"code":"LOTUS-4LGW-59FD6AE4"}' 2>/dev/null | grep -q '"ok":true'; then
    log "  ✓ Node 服务返回 ok:true"
    break
  fi
  [ "$i" -eq 5 ] && err "Node 服务 5 次重试仍不返回 ok:true。查 'pm2 logs invite-api'"
  sleep 1
done

# === 6. nginx 反代配置 ===
log "6/7 找 xuanjitime nginx 站点配置"
SITE_CONF=""
for glob in $NGINX_SITE_GLOB; do
  for f in $glob; do
    [ -f "$f" ] || continue
    SITE_CONF="$f"; break 2
  done
done
[ -n "$SITE_CONF" ] || err "找不到 xuanjitime 的 nginx 站点配置。手动加 location /api/ proxy_pass 127.0.0.1:$PORT/api/"

if grep -q "location /api/" "$SITE_CONF"; then
  log "  ✓ $SITE_CONF 已有 /api/ 反代，跳过"
else
  log "  → 备份 $SITE_CONF 并插入 /api/ 反代"
  sudo cp "$SITE_CONF" "$SITE_CONF.bak.$(date +%s)"
  sudo python3 - "$SITE_CONF" "$PORT" <<'PY'
import sys, re
path, port = sys.argv[1], sys.argv[2]
src = open(path).read()
snippet = f"""
    location /api/ {{
        proxy_pass http://127.0.0.1:{port}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }}
"""
# 插到第一个 server {} 块的开头
out = re.sub(r"(server\s*\{)", r"\1" + snippet, src, count=1)
if out == src:
    sys.exit("无法识别 server 块")
open(path, "w").write(out)
PY
  sudo nginx -t || err "nginx 配置语法错误，已备份 $SITE_CONF.bak.*，请检查"
  sudo nginx -s reload
  log "  ✓ nginx 已 reload"
fi

# === 7. 域名层验证 ===
log "7/7 通过 xuanjitime.com 验证"
RESP=$(curl -sS --max-time 5 -X POST "https://xuanjitime.com/api/redeem" \
  -H "Content-Type: application/json" \
  -d '{"code":"LOTUS-4LGW-59FD6AE4"}' || true)
if echo "$RESP" | grep -q '"ok":true'; then
  log "✅ 部署成功！https://xuanjitime.com/api/redeem 返回 ok:true"
else
  err "域名层未通过。返回：$RESP"
fi

echo ""
echo "下一步：本机 'rsync -avz --delete dist/ user@vps:/var/www/xuanjitime.com/' 推送新前端。"
echo "pm2 startup 设开机自启（按它打印的命令再 sudo 执行一次）。"
