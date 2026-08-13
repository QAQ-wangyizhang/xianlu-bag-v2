"""游戏服地址配置路由"""
from fastapi import APIRouter
from pydantic import BaseModel

from ..config import get_game_host, get_game_port, set_game_config
from ..client_manager import clear_clients

router = APIRouter()


class GameConfigUpdate(BaseModel):
    host: str
    port: int


@router.get("/api/config")
async def get_config():
    """当前游戏服地址"""
    return {"host": get_game_host(), "port": get_game_port()}


@router.post("/api/config")
async def update_config(req: GameConfigUpdate):
    """修改游戏服地址（持久化并清空旧连接）"""
    host = req.host.strip()
    if not host:
        return {"error": "host 不能为空"}
    if not (1 <= req.port <= 65535):
        return {"error": "端口必须在 1-65535 之间"}
    set_game_config(host, req.port)
    clear_clients()  # 旧地址的客户端连接全部作废，下次拉取走新地址
    return {"ok": True}
