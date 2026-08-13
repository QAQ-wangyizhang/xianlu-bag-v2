# xianlu-bag-v2

修仙录 · 多账号工具 —— 修仙放置游戏多账号管理辅助。

## 功能

- 背包总览：多账号背包材料 / 体力 / 修为进度（瀑布流卡片）
- 升段缺口：计算每个账号升满装备还差哪些材料、需要刷多久
- 闭关修炼：查看闭关状态与日志，一键启动 / 停止
- 归属人：把账号分配给不同人，按人查看体力 / 背包 / 缺口
- 账号管理：创建归属人、拖拽分配账号、配置游戏服爬取地址

## 技术栈

- 前端：Next.js 14（App Router）+ React 18 + Ant Design 5（静态导出）
- 后端：Python FastAPI + httpx（异步游戏服客户端）
- 存储：accounts.json / sessions.json / owners.json / SQLite（闭关日志）

## 运行

```bash
# 后端（默认端口 5917）
cd backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 5917

# 前端（先构建，由后端托管静态文件）
cd frontend
npm install
npm run build
```

## 目录

```
backend/    FastAPI 后端 + 游戏服客户端
frontend/   Next.js 前端
data/       运行数据（账号/会话/日志，本地敏感，不入库）
```
