#!/usr/bin/env bash
# ============================================================
# 修仙录 · 多账号工具 —— 空白云服务器一键部署脚本
# 用法: sudo bash setup.sh
# 适用: Ubuntu 24.04 / Debian 12（全新实例）
# ============================================================
set -euo pipefail

APP_DIR=/opt/xianlu-bag-v2
REPO_URL=https://github.com/QAQ-wangyizhang/xianlu-bag-v2.git

echo "==> [1/6] 更新系统并安装基础依赖"
export DEBIAN_FRONTEND=noninteractive
apt update -y
apt install -y python3-venv python3-pip git curl

echo "==> [2/6] 内存不足 3G 时创建 2G swap（防止前端构建 OOM）"
MEM_KB=$(awk '/MemTotal/{print $2}' /proc/meminfo)
if [ "$MEM_KB" -lt 3145728 ] && [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    已创建 2G swap"
fi

echo "==> [3/6] 安装 Node.js 20（前端构建用）"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo "==> [4/6] 拉取代码"
mkdir -p /opt
if [ ! -d "$APP_DIR" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR" && git pull
fi
cd "$APP_DIR"

echo "==> [5/6] 创建 Python 虚拟环境并安装依赖"
python3 -m venv .venv
.venv/bin/pip install -U pip
.venv/bin/pip install fastapi "uvicorn[standard]" httpx

echo "==> [6/6] 构建前端（静态导出，由后端托管）"
cd frontend
npm install --no-audit --no-fund
npm run build
cd ..

mkdir -p data

echo ""
echo "================================================"
echo " 部署完成！接下来 3 步："
echo "  1. 注册系统服务："
echo "     cp deploy/xianlu.service /etc/systemd/system/"
echo "     systemctl daemon-reload"
echo "     systemctl enable --now xianlu"
echo "  2. 如有旧数据：把本地 data/ 目录上传到 $APP_DIR/（账号/归属/闭关记录）"
echo "  3. 云控制台安全组放行 TCP 5917（入方向）"
echo "  访问: http://服务器公网IP:5917"
echo "================================================"
