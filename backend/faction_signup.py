"""势力战自动报名模块

- 每个账号可独立开关（data/signup_config.json）
- 后台定时器：报名窗口（15:30-15:50，周一/周三/周五）内自动报名
- 每日结果记录（data/signup_logs.json），供前端展示"今天报名成功了"
- 不能报名的原因：炼气5段以下 / 未加入势力 / 今日无场次 / 不在报名窗口 / 已报名
"""

import asyncio
import json
from datetime import datetime, timedelta

from .config import DATA_DIR
from .client_manager import get_client
from .store import accounts, find_account
from .atomic import atomic_write_text

CONFIG_FILE = DATA_DIR / "signup_config.json"
LOG_FILE = DATA_DIR / "signup_logs.json"

# 报名窗口
REGISTER_OPEN_HOUR = 15
REGISTER_OPEN_MINUTE = 30
REGISTER_CLOSE_HOUR = 15
REGISTER_CLOSE_MINUTE = 50

# 报名生效日：周一(1)~周五(5)
ACTIVE_WEEKDAYS = {1, 2, 3, 4, 5}

_config: dict[str, dict] = {}  # {username: {"enabled": bool}}
_logs: dict[str, dict] = {}  # {username: {week_key: {status, reason, time, session_name}}}
_lock = asyncio.Lock()


def load():
    """启动时加载配置与日志"""
    global _config, _logs
    try:
        if CONFIG_FILE.exists():
            _config = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        _config = {}
    try:
        if LOG_FILE.exists():
            _logs = json.loads(LOG_FILE.read_text(encoding="utf-8"))
    except Exception:
        _logs = {}


def _save_config():
    atomic_write_text(CONFIG_FILE, json.dumps(_config, ensure_ascii=False, indent=2))


def _save_logs():
    atomic_write_text(LOG_FILE, json.dumps(_logs, ensure_ascii=False, indent=2))


def is_enabled(username: str) -> bool:
    return bool(_config.get(username, {}).get("enabled"))


def set_enabled(username: str, enabled: bool):
    entry = _config.setdefault(username, {})
    entry["enabled"] = bool(enabled)
    _save_config()


def _today_key() -> str:
    return datetime.now().astimezone().strftime("%Y-%m-%d")


def _parse_dt(s: str) -> datetime:
    """解析 ISO 时间（带时区），无时区按本地处理"""
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.astimezone()
    return dt


async def fetch_war(username: str) -> dict | None:
    """获取某账号的势力战场次信息"""
    client = await get_client(username)
    return await client.request("/api/v1/faction/war", "GET")


async def fetch_faction(username: str) -> dict | None:
    """获取势力信息（解锁条件等）"""
    client = await get_client(username)
    return await client.request("/api/v1/faction", "GET")


def check_realm_ok(player: dict | None, faction: dict | None) -> bool:
    """境界是否满足报名条件（≥ unlock_realm/unlock_stage，默认炼气5段）"""
    if not player:
        return False
    need_realm = (faction or {}).get("unlock_realm") or "lianqi"
    need_stage = (faction or {}).get("unlock_stage") or 5
    realm_order = ["lianqi", "zhuji", "jindan", "yuanying", "huashen", "lianxu", "heti", "dacheng", "dujie"]
    cur_realm = player.get("major_realm") or ""
    cur_stage = player.get("stage") or 0
    idx_cur = realm_order.index(cur_realm) if cur_realm in realm_order else -1
    idx_need = realm_order.index(need_realm) if need_realm in realm_order else 0
    return idx_cur > idx_need or (idx_cur == idx_need and cur_stage >= need_stage)


async def signup_once(username: str) -> dict:
    """单账号一轮报名检查与执行，返回结果"""
    now = datetime.now().astimezone()
    result = {"username": username, "enabled": is_enabled(username), "signed": False, "reason": ""}
    try:
        client = await get_client(username)
        war = await client.request("/api/v1/faction/war", "GET")

        if not war or not war.get("has_event"):
            result["reason"] = "今日无场次"
            return result

        # 已报名
        if war.get("my_registered"):
            result["signed"] = True
            result["reason"] = "已报名"
            _record(username, war, "signed", now)
            return result

        # 报名窗口判断
        open_at = _parse_dt(war["registers_open_at"])
        close_at = _parse_dt(war["registers_close_at"])
        if now < open_at:
            result["reason"] = f"报名未开始（{open_at.strftime('%H:%M')} 开放）"
            return result
        if now > close_at:
            result["reason"] = "报名窗口已过"
            return result

        # 境界 / 势力检查
        faction = await client.request("/api/v1/faction", "GET")
        me = client._last_me or await client.me()
        player = me.get("player", {}) if isinstance(me, dict) else {}
        if not check_realm_ok(player, faction):
            hint = (faction or {}).get("unlock_hint") or "境界不足"
            result["reason"] = f"不能报名：{hint}"
            _record(username, war, "failed", now, result["reason"])
            return result
        if not (faction or {}).get("my_faction_key"):
            result["reason"] = "不能报名：未加入势力"
            _record(username, war, "failed", now, result["reason"])
            return result

        # 执行报名
        await client.request("/api/v1/faction/war/register", "POST",
                             body={"event_id": war["event_id"]})
        result["signed"] = True
        result["reason"] = "报名成功"
        _record(username, war, "signed", now)
    except Exception as e:
        result["reason"] = f"报名失败：{e}"
        _record(username, {"session_name": ""}, "failed", now, result["reason"])
    return result


def _record(username: str, war: dict, status: str, now: datetime, reason: str = ""):
    """记录今日报名结果"""
    key = _today_key()
    entry = _logs.setdefault(username, {})
    entry[key] = {
        "status": status,
        "reason": reason,
        "time": now.strftime("%H:%M:%S"),
        "session_name": war.get("session_name") or "",
        "session_id": war.get("session_id") or "",
    }
    _save_logs()


async def run_all() -> list[dict]:
    """遍历所有开启的账号执行一轮报名"""
    results = []
    async with _lock:
        for acc in accounts:
            username = acc["username"]
            if not is_enabled(username):
                continue
            try:
                results.append(await signup_once(username))
            except Exception as e:
                results.append({"username": username, "enabled": True, "signed": False, "reason": f"错误：{e}"})
    return results


async def run_loop():
    """后台定时器：报名窗口前后 5 分钟内每 30s 轮询一次（仅周一至周五）"""
    while True:
        try:
            await asyncio.sleep(30)
            now = datetime.now().astimezone()
            # 仅周一至周五报名，其余日期直接跳过
            if now.weekday() not in ACTIVE_WEEKDAYS:
                continue
            # 找到第一个开启的账号，看今日场次窗口
            enabled_users = [a["username"] for a in accounts if is_enabled(a["username"])]
            if not enabled_users:
                continue
            try:
                war = await fetch_war(enabled_users[0])
            except Exception:
                continue
            if not war or not war.get("has_event"):
                continue
            open_at = _parse_dt(war["registers_open_at"])
            close_at = _parse_dt(war["registers_close_at"])
            # 窗口前 5 分钟到窗口后 1 分钟内轮询
            if open_at - timedelta(minutes=5) <= now <= close_at + timedelta(minutes=1):
                await run_all()
        except Exception:
            pass
