#!/usr/bin/env bash
# ============================================================
# 修仙录 · 多账号工具 —— git 一键部署脚本
# 用法: sudo bash deploy.sh
# 作用: git pull 拉最新代码 → 前端有改动则重建 out/ → 重启服务
# 前端静态资源是构建产物（out/），不在 git 里，必须 build 后重启才生效。
# ============================================================
set -euo pipefail

APP_DIR=/opt/xianlu-bag-v2-live
SERVICE=xianlu

cd "$APP_DIR"
echo "==> [1/3] git pull"
git pull

# 判断前端源码是否有改动：对比 git 状态里的 frontend/ 改动 + 构建产物时间
echo "==> [2/3] 检查前端是否需要重建"
NEED_BUILD=0
# 有未提交的 frontend 改动（部署时的 package-lock 等）或 src 比 out 新 → 重建
if git status --porcelain -- frontend/src frontend/public frontend/package.json frontend/package-lock.json | grep -q .; then
  NEED_BUILD=1
elif [ -d frontend/out ] && [ "$(find frontend/src frontend/public -newer frontend/out/index.html 2>/dev/null | wc -l)" -gt 0 ]; then
  NEED_BUILD=1
elif [ ! -f frontend/out/index.html ]; then
  NEED_BUILD=1
fi

if [ "$NEED_BUILD" = "1" ]; then
  echo "    → 前端有改动，重新构建 out/"
  cd frontend
  npm run build
  cd "$APP_DIR"
else
  echo "    → 前端无改动，跳过构建"
fi

echo "==> [3/3] 重启服务 $SERVICE"
systemctl restart "$SERVICE"
sleep 3
systemctl is-active "$SERVICE" || { echo "服务启动失败，请查看: journalctl -u $SERVICE -n 50"; exit 1; }
echo "部署完成: $(git log --oneline -1)"
