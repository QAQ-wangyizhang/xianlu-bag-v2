"""客户端管理器 —— 缓存每个账号的 GameClient 实例"""

from .game_client import GameClient, ApiError
from .store import find_account, get_session, set_session

# 客户端缓存 {username: GameClient}
_clients: dict[str, GameClient] = {}


def clear_clients():
    """清空客户端缓存（游戏服地址变更后调用，旧连接全部作废）"""
    _clients.clear()


async def get_client(username: str) -> GameClient:
    """获取已登录的客户端（重用 session 或重新登录）"""
    acc = find_account(username)
    if not acc:
        raise ValueError(f"未找到账号 {username}")

    # 优先复用缓存实例
    if username in _clients:
        client = _clients[username]
        try:
            client._last_me = await client.me()
            return client
        except ApiError:
            pass  # session 失效，继续重新登录

    client = GameClient()

    # 尝试导入已有 session
    sess = get_session(username)
    if sess:
        client.import_session(sess)
        try:
            client._last_me = await client.me()
            _clients[username] = client
            return client
        except ApiError:
            pass

    # 重新登录
    await client.login(acc["username"], acc["password"])
    set_session(username, client.export_session())
    client._last_me = await client.me()
    _clients[username] = client
    return client


async def fetch_bag(username: str) -> dict:
    """获取某账号的背包（me + panel + tower + realm 并行）"""
    client = await get_client(username)
    # 复用缓存的 me
    me = client._last_me or await client.me()
    client._last_me = None  # 用完即弃

    import asyncio
    panel_result, tower_result, realm_result = await asyncio.gather(
        client.request("/api/v1/player/panel"),
        client.request("/api/v1/tower"),
        client.request("/api/v1/player/realm"),
        return_exceptions=True,
    )

    p = me.get("player", {})
    panel = panel_result if not isinstance(panel_result, Exception) else None
    tower = tower_result if not isinstance(tower_result, Exception) else None
    realm = realm_result if not isinstance(realm_result, Exception) else None

    # 合并 materials（panel 优先）
    mats = {}
    if panel and panel.get("player", {}).get("materials"):
        mats.update(panel["player"]["materials"])
    if p.get("materials"):
        mats.update(p["materials"])

    # 体力
    stamina = None
    if tower:
        stamina = {
            "current": tower.get("stamina"),
            "max": tower.get("stamina_max"),
            "seconds_to_next": tower.get("seconds_to_next_stamina"),
            "regen_minutes": tower.get("stamina_regen_minutes"),
        }

    # 修为进度（当前段升级所需修为 / 能否突破）
    rp = (realm or {}).get("realm") or {}
    realm_progress = {
        "exp": rp.get("exp"),
        "exp_needed": rp.get("exp_needed"),
        "stage": rp.get("stage"),
        "next_stage": rp.get("next_stage"),
        "next_realm_name": rp.get("next_realm_name"),
        "can_break": rp.get("can_break"),
        "at_wall": rp.get("at_wall"),
        "at_cap": rp.get("at_cap"),
        "block_reason": rp.get("block_reason"),
        "level_wall_name": rp.get("level_wall_name"),
    }

    return {
        "player": {
            "name": p.get("name"),
            "sect_name": p.get("sect_name"),
            "faction_name": p.get("faction_name"),
            "major_realm": p.get("major_realm"),
            "stage": p.get("stage"),
            "exp": p.get("exp"),
            "spirit_stone": p.get("spirit_stone"),
            "great_dao_origin": p.get("great_dao_origin"),
        },
        "materials": mats,
        "stamina": stamina,
        "realm": realm_progress,
    }
