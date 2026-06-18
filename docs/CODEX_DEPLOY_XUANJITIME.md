# Codex 接手指令 · 部署 xuanjitime.com 到 main 最新

> 给具备 **Computer Use（浏览器操控）** 能力的 Codex 用。
> 本文件自包含——你不需要 Claude Code 之前对话的上下文。

---

## 目标（一句话）

把 main 分支 `2fc1bf1` 之后的最新代码部署到 **xuanjitime.com**（用户在腾讯云的轻量应用服务器/CVM）。完成后通过 `https://xuanjitime.com/api/redeem` 真线 curl 返回 `{"ok":true,...}` 即闭环。

## 背景（你需要知道的事）

- 项目：「玄机·发布择时」React + Vite 算命 Web App
- 仓库：https://github.com/jzhang7-art/yuanji-fortune
- xuanjitime.com 跑在用户的腾讯云 VPS 上（nginx + 自建），**与 Vercel 备用站独立**
- 本次变更核心：邀请码门控从「明文白名单进 bundle」改成「HMAC 签名 + 服务端校验」
  - 前端调 `/api/redeem`
  - 后端是个零依赖 Node 服务 `server/invite-server.mjs`，nginx 反代到 127.0.0.1:3001
- 用户之前自己工作流：本机 build → rsync `dist/` 到 nginx web root
- 现在 deploy script 已封装"git pull + build + rsync + 起服务 + 改 nginx"全部步骤

## 你要做什么

进入用户已登录的 **腾讯云控制台 Chrome 标签页**，导航到 VPS 实例，打开网页 Terminal，**按序粘贴 4 条命令**，盯着输出。

---

## 步骤

### Step 1 · 找 VPS

打开任一链接（不知道哪个的话先开第 1 个，没找到再开第 2 个）：

1. 轻量应用服务器列表：https://console.cloud.tencent.com/lighthouse/instance/index
2. CVM 列表：https://console.cloud.tencent.com/cvm/instance/index

**99% 在第 1 个**。

实例列表里找到状态是 **"运行中"** 的那台（多半就一台，名字可能含 "xuanji"、"yuanji"、"fortune" 或就是默认名）。

### Step 2 · 打开网页 Terminal

1. 点实例名称进入详情页
2. 右上角找橙色 **"登录"** 按钮（或操作栏里的 "登录"）
3. 弹窗里选 **"OrcaTerm"** 或 **"标准登录"**（首选 OrcaTerm，复制粘贴更顺手）
4. 用户密码默认走密钥，免填
5. 新标签页/弹窗里出现黑色 Terminal，提示符类似 `root@VM-xxx:~#` 或 `ubuntu@VM-xxx:~$`

### Step 3 · 按顺序粘贴 4 条命令（一条一条来，不要一次粘多条）

**关键**：网页 Terminal 会吃掉行内 `&&`，所以 **必须分开粘**。每粘一条，回车，等命令结束（看到新提示符）再粘下一条。

```
cd /tmp
```

```
rm -rf yj
```

```
git clone https://github.com/jzhang7-art/yuanji-fortune.git yj
```

→ 看到 `Receiving objects: 100% ... done.` 算成功。

```
bash yj/server/deploy-on-vps.sh
```

→ 这条会跑 3-8 分钟。脚本会自己打印进度 `[deploy] 1/7 ...` 直到 `[deploy] 7/7 ...`，最后一行如果是 **`✅ 部署成功！https://xuanjitime.com/api/redeem 返回 ok:true`** 就成了。

### Step 4 · 真线 curl 验证（本地或 Terminal 里都行）

在同一个 Terminal 里粘：

```
curl -sS -X POST https://xuanjitime.com/api/redeem -H "Content-Type: application/json" -d '{"code":"LOTUS-4LGW-59FD6AE4"}'
```

期望输出 `{"ok":true,"code":"LOTUS4LGW59FD6AE4","token":"LOTUS4LGW59FD6AE4","redeemedAt":...}`。

闭环 ✅

---

## 失败排查

### Step 3 第 3 条 `git clone` 失败

| 报错 | 原因 | 处理 |
|---|---|---|
| `fatal: unable to access ... Connection refused` | github.com 被防火墙挡 | 改 jsdelivr：`curl -sSL https://cdn.jsdelivr.net/gh/jzhang7-art/yuanji-fortune@main/server/deploy-on-vps.sh \| bash` |
| `404` from raw.githubusercontent.com | raw CDN 在国内不稳 | 同上 |
| `command not found: git` | VPS 没装 git | `sudo apt install -y git` 或 `sudo yum install -y git` 后重试 |

### Step 3 第 4 条脚本中途报错

脚本每步带 `[deploy] N/7` 标签。看停在第几步：

| 停在 | 含义 | 处理 |
|---|---|---|
| `1/7` Node 未装 | VPS 没 Node ≥ 18 | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo bash && sudo apt install -y nodejs` 后重跑脚本 |
| `1/7` pm2 装失败 | npm 权限/网络 | `sudo npm i -g pm2 --registry=https://registry.npmmirror.com` 后重跑 |
| `4/7` pm2 启动报错 | 端口冲突 / 代码语法 | `pm2 logs invite-api --lines 30` 查日志贴出 |
| `5/7` self-test 失败 | INVITE_SECRET 没生效 / 端口被占 | 查 `/etc/invite-api.env` 是否存在，`ss -tlnp \| grep 3001` |
| `6/7` 找不到 nginx 配置 | 站点配置文件名不含 xuanjitime | 手动 grep：`sudo grep -rl xuanjitime /etc/nginx/`，找到后改脚本里的 `NGINX_SITE_GLOB` |
| `6.5/7` build OOM | VPS 内存 < 1GB | 加 swap：`sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`，重跑脚本 |
| `6.5/7` 找不到 root 指令 | nginx 配置用 alias 或 include | 手动 rsync：`sudo rsync -avz --delete /opt/invite-api/dist/ /var/www/xuanjitime.com/`（路径替换成你看到的真实 web root） |
| `7/7` 域名层 curl 失败 | DNS 缓存 / CDN 缓存 | 等 30 秒重跑：`curl -sS -X POST https://xuanjitime.com/api/redeem -H "Content-Type: application/json" -d '{"code":"LOTUS-4LGW-59FD6AE4"}'` |

### 通用兜底

不管什么报错，把输出贴回来即可。脚本设计了 `set -euo pipefail`，**任何失败都会停在原地**，不会继续往下污染状态。

---

## 不要做的事

- ❌ 不要碰 nginx 的 SSL 证书配置（路径 `/etc/letsencrypt/...`）
- ❌ 不要 `rm -rf /var/www/`——脚本只 rsync 到 web root 子目录
- ❌ 不要重启 nginx 之外的服务（不要 reboot VPS、不要重启 mysql 之类）
- ❌ 不要把 `INVITE_SECRET` 贴到聊天里或截屏——它在 `/etc/invite-api.env` 里 600 权限

## 完成后报告

成功的话报回：

```
✅ xuanjitime.com 部署完成
- 部署的 commit: <脚本里打印的 git log -1 简称>
- /api/redeem 真线验证: PASS / FAIL
- 当前 pm2 状态: <pm2 list 里 invite-api 的状态>
```

失败的话报回：

```
❌ 停在 step N
- 最后 30 行输出粘贴
- 已做的恢复尝试
```

---

## 引用文件（脚本本体在仓库里）

- `server/deploy-on-vps.sh` — 主部署脚本
- `server/invite-server.mjs` — Node 后端服务
- `server/ecosystem.config.cjs` — pm2 启动配置
- `api/_hmac.mjs` — HMAC 签名/校验共用模块
- `AGENTS.md` / `CLAUDE.md` — 项目背景（深度上下文，本次任务不必读）
