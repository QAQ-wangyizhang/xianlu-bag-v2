"""背包查询路由"""
import asyncio
import time

from fastapi import APIRouter, Query

from ..store import accounts
from ..client_manager import fetch_bag

router = APIRouter()

# TTL 缓存：避免重复点击「全部刷新」时反复打游戏服
BAG_CACHE_TTL = 10  # 秒
_bag_cache: dict[str, tuple[float, dict]] = {}


async def _fetch_bag_cached(username: str) -> dict:
    """带 TTL 缓存的背包获取"""
    now = time.monotonic()
    hit = _bag_cache.get(username)
    if hit and now - hit[0] < BAG_CACHE_TTL:
        return hit[1]
    data = await fetch_bag(username)
    _bag_cache[username] = (now, data)
    return data


@router.get("/api/bag")
async def get_bag(username: str = Query(...)):
    """单账号背包"""
    try:
        return await _fetch_bag_cached(username)
    except Exception as e:
        return {"error": str(e)}


@router.get("/api/bag/all")
async def get_all_bags():
    """全部账号背包（并发，走 TTL 缓存）"""
    async def fetch_one(acc):
        try:
            data = await _fetch_bag_cached(acc["username"])
            return {"username": acc["username"], **data, "ok": True}
        except Exception as e:
            return {"username": acc["username"], "ok": False, "error": str(e)}

    results = await asyncio.gather(*[fetch_one(a) for a in accounts])
    return list(results)
