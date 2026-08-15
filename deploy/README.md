# 修仙录 · 多账号工具 —— 空白云服务器部署指南

适用于全新（空白）云服务器：Ubuntu 24.04 / Debian 12，2核2G 起。

## 一、云控制台准备（先做）

1. 创建实例（Ubuntu 24.04，2C2G，40G ESSD，带宽 3M 起）
2. **安全组放行入方向**：
   - `TCP 5917`（网页/API，必开）
   - `TCP 22`（SSH）
3. SSH 登录服务器

## 二、一键部署

```bash
# 把项目里的 deploy/ 目录整个传到服务器（或用 git clone 后取 deploy/）
scp -r deploy/ root@服务器IP:/opt/deploy

cd /opt/deploy
sudo bash setup.sh     # 自动完成：系统依赖 + swap + Node + 代码 + venv + 前端构建
```

脚本会自动：
- 安装 python3-venv / pip / git / Node.js 20
- 内存 <3G 自动创建 2G swap（防止 `next build` OOM）
- 克隆项目到 `/opt/xianlu-bag-v2`
- 创建 venv 并安装 fastapi / uvicorn / httpx
- 构建前端静态导出

## 三、注册系统服务（常驻 + 开机自启 + 崩溃自动拉起）

```bash
cp /opt/deploy/xianlu.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now xianlu
systemctl status xianlu          # 看到 active (running) 即成功
journalctl -u xianlu -f          # 实时看日志
```

## 四、迁移本地数据（可选但推荐）

本地 `data/` 目录含账号、登录态、归属人、闭关日志：

```bash
# 在本地 Mac 上
tar czf data-backup.tgz data/
scp data-backup.tgz root@服务器IP:/tmp/
# 在服务器上
cd /opt/xianlu-bag-v2 && tar xzf /tmp/data-backup.tgz
systemctl restart xianlu
```

## 五、验证

```bash
curl -s http://localhost:5917/api/constants | head -c 200   # API 通
# 浏览器访问 http://服务器公网IP:5917 → 看到页面
# 「设置」页确认爬取地址（默认 http://121.41.170.75:18251，可改）
```

## 六、日常运维

| 操作 | 命令 |
|---|---|
| 查看状态 | `systemctl status xianlu` |
| 看日志 | `journalctl -u xianlu -f` |
| 重启 | `systemctl restart xianlu` |
| 更新代码 | `sudo bash /opt/xianlu-bag-v2-live/deploy/deploy.sh`（git pull + 前端重建 + 重启，一步完成） |
| 备份数据 | `sudo bash /opt/xianlu-bag-v2-live/deploy/backup.sh` |
| 定时备份 | `crontab -e` 加：`0 3 * * * /opt/xianlu-bag-v2-live/deploy/backup.sh >> /var/log/xianlu-backup.log 2>&1` |

## 七、常见问题

| 现象 | 原因与处理 |
|---|---|
| 网页打不开 | 安全组没放行 5917；或服务没起来（`systemctl status xianlu`） |
| 背包拉取失败 | 「设置」页游戏服地址不对；服务器出站被限制（少见） |
| 前端构建 OOM | 2G 内存已自动加 swap；仍失败可本地构建 `frontend/out` 后上传 |
| 数据丢失 | `data/` 未备份 —— 账号密码只存在服务器本地，务必配 crontab 备份 |

## 八、安全提示

- `data/accounts.json` 存有**游戏账号明文密码**，切勿把 `data/` 提交到仓库或公开分享
- 建议安全组把 5917 限制为常用 IP（也可全开放后用系统防火墙 ufw 控制）
- 定期 `apt update && apt upgrade` 保持系统补丁
