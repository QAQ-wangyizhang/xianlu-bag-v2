"""FastAPI 应用入口"""
import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware

from .config import PORT, FRONTEND_OUT
from .store import load, accounts
from .routers import accounts as accounts_router
from .routers import bag as bag_router
from .routers import seclusion as seclusion_router
from .routers import config as config_router
from .routers import owners as owners_router
from .materials import MATERIAL_NAMES, MATERIAL_CATEGORY, REALM_NAMES
from .constants import GRADE_TIERS, DUNGEON_SCHEDULE, DUNGEON_BONUS, REALM_OVERRIDE, WEEKDAY_NAMES

app = FastAPI(title="修仙录 · 多账号工具 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(accounts_router.router)
app.include_router(bag_router.router)
app.include_router(seclusion_router.router)
app.include_router(config_router.router)
app.include_router(owners_router.router)


@app.on_event("startup")
async def startup():
    load()
    print(f"[启动] 已加载 {len(accounts)} 个账号，端口 {PORT}")


# ---- 游戏数据接口（供前端查询）----
@app.get("/api/constants")
async def get_constants():
    """返回所有游戏常量数据（供前端使用）"""
    return {
        "materialNames": MATERIAL_NAMES,
        "materialCategory": MATERIAL_CATEGORY,
        "realmNames": REALM_NAMES,
        "gradeTiers": GRADE_TIERS,
        "dungeonSchedule": DUNGEON_SCHEDULE,
        "dungeonBonus": DUNGEON_BONUS,
        "realmOverride": REALM_OVERRIDE,
        "weekdayNames": WEEKDAY_NAMES,
    }


# ---- 静态文件（Next.js export）----
if FRONTEND_OUT.exists():
    # SPA fallback：非 /api 路径尝试返回静态文件，否则返回 index.html
    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            return {"error": "Not Found", "path": full_path}
        file_path = FRONTEND_OUT / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # SPA fallback
        index = FRONTEND_OUT / "index.html"
        if index.exists():
            return FileResponse(index)
        return {"error": "Frontend not built. Run: cd frontend && npm run build"}
else:
    @app.get("/")
    async def root():
        return {
            "message": "修仙录 API 正在运行",
            "hint": "前端尚未构建。请执行: cd frontend && npm install && npm run build",
            "docs": "/docs",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(f"{__name__}:app", host="127.0.0.1", port=PORT, reload=True)
