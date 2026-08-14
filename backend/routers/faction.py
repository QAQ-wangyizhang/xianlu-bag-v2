"""势力战自动报名路由"""
import asyncio

from fastapi import APIRouter
from pydantic import BaseModel

from ..store import accounts, find_account
from ..client_manager import get_client
from .. import faction_signup as fs

router = APIRouter()


class SignupToggle(BaseModel):
    username: str
    enabled: bool


async def _account_item(username: str) -> dict:
    """单个账号的状态（并发调用）"""
    item: dict = {"username": username, "enabled": fs.is_enabled(username),
                  "today": (fs._logs.get(username) or {}).get(fs._today_key())}
    try:
        client = await get_client(username)
        faction = await client.request("/api/v1/faction", "GET")
        me = client._last_me or await client.me()
        player = (me or {}).get("player", {})
        item["realm_ok"] = fs.check_realm_ok(player, faction)
        item["faction_joined"] = bool((faction or {}).get("my_faction_key"))
        item["player_name"] = player.get("name")
        item["sect_name"] = player.get("sect_name")
        item["major_realm"] = player.get("major_realm")
        item["stage"] = player.get("stage")
    except Exception:
        item["realm_ok"] = False
        item["faction_joined"] = False
    return item


@router.get("/api/faction/signup/status")
async def signup_status():
    """每账号自动报名状态 + 今日场次信息（并发拉取）"""
    # 今日场次与账号状态并发
    async def _war_info():
        for acc in accounts:
            try:
                war = await fs.fetch_war(acc["username"])
                if war and war.get("has_event"):
                    return {
                        "session_id": war.get("session_id"),
                        "session_name": war.get("session_name"),
                        "status": war.get("status"),
                        "registers_open_at": war.get("registers_open_at"),
                        "registers_close_at": war.get("registers_close_at"),
                        "seconds_to_register": war.get("seconds_to_register"),
                        "seconds_to_reg_close": war.get("seconds_to_reg_close"),
                        "can_register": war.get("can_register"),
                        "has_event": True,
                    }
            except Exception:
                continue
        return None

    today, account_list = await asyncio.gather(
        _war_info(),
        asyncio.gather(*[_account_item(a["username"]) for a in accounts]),
    )
    return {"today": today, "accounts": account_list}


@router.post("/api/faction/signup/toggle")
async def signup_toggle(req: SignupToggle):
    """设置某账号自动报名开关"""
    if not find_account(req.username):
        return {"error": "未找到账号"}
    fs.set_enabled(req.username, req.enabled)
    return {"ok": True, "enabled": req.enabled}


@router.post("/api/faction/signup/run")
async def signup_run():
    """立即执行一轮报名（手动触发）"""
    results = await fs.run_all()
    return {"results": results}
