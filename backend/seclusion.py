"""闭关自动化引擎 —— 基于 asyncio 的状态机

状态流转：
  idle → enter(relic) → active → exit/start → wait 2min → exit/claim → re-enter
"""

import asyncio
from datetime import datetime
from typing import Any

from .config import VENUE_RELIC, EXIT_WAIT_MS
from .game_client import GameClient
from .store import set_session, get_session, db_insert_log, db_query_logs, find_account
from .client_manager import get_client

EXIT_WAIT_S = EXIT_WAIT_MS / 1000  # 转秒

# 内存中的闭关状态
_bots: dict[str, dict[str, Any]] = {}


def _now_ts() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


async def _slog(username: str, msg: str):
    """记录闭关日志（内存 + SQLite）"""
    bot = _bots.get(username)
    if bot:
        ts = _now_ts()
        bot["logs"].append({"timestamp": ts, "message": msg})
        if len(bot["logs"]) > 200:
            bot["logs"] = bot["logs"][-200:]
        await db_insert_log(username, ts, msg)
        print(f"[闭关][{username}] {msg}")


async def _seclusion_tick(username: str):
    """闭关状态机单次执行"""
    bot = _bots.get(username)
    if not bot or not bot["enabled"] or bot["busy"]:
        return
    bot["busy"] = True
    try:
        client = await get_client(username)
        status = await client.request("/api/v1/seclusion", "GET")
        session = status.get("session")

        if not session:
            # 未闭关 → 入关
            await client.request("/api/v1/seclusion/enter", "POST", body={"venue": VENUE_RELIC})
            await _slog(username, f"入关：{VENUE_RELIC}（上古遗迹）")
            await asyncio.sleep(3)
            await _seclusion_tick(username)
            return

        if session.get("status") == "active":
            exit_started = session.get("exit_started_at")
            if not exit_started:
                # 闭关中，开始出关
                await client.request("/api/v1/seclusion/exit/start", "POST")
                await _slog(username, "开始出关，等待 2 分钟…")
                # 等 2 分钟后领取
                asyncio.get_event_loop().call_later(
                    EXIT_WAIT_S,
                    lambda: asyncio.ensure_future(_claim_and_reenter(username))
                )
            else:
                # 已经在出关倒计时中，计算剩余时间
                elapsed = (datetime.now() - datetime.fromisoformat(exit_started)).total_seconds() * 1000
                remaining = max(0, EXIT_WAIT_MS - elapsed) / 1000
                if remaining <= 0:
                    await _claim_and_reenter(username)
                else:
                    bot["_timer"] = asyncio.get_event_loop().call_later(
                        remaining + 3,
                        lambda: asyncio.ensure_future(_seclusion_tick(username))
                    )
            return

        if session.get("status") == "exiting":
            await _claim_and_reenter(username)
            return

        # 未知状态
        await _slog(username, f"未知闭关状态：{session.get('status')}")

    except Exception as e:
        await _slog(username, f"错误：{e}，60 秒后重试")
        bot = _bots.get(username)
        if bot and bot["enabled"]:
            bot["_timer"] = asyncio.get_event_loop().call_later(
                60,
                lambda: asyncio.ensure_future(_seclusion_tick(username))
            )
    finally:
        bot = _bots.get(username)
        if bot:
            bot["busy"] = False


async def _claim_and_reenter(username: str):
    """领取出关奖励并重新入关"""
    bot = _bots.get(username)
    if not bot or not bot["enabled"]:
        return
    try:
        client = await get_client(username)
        result = await client.request("/api/v1/seclusion/exit/claim", "POST")
        bot["cycle_count"] = bot.get("cycle_count", 0) + 1
        exp = result.get("exp", 0) if result else 0
        await _slog(username, f"出关领取（第 {bot['cycle_count']} 轮）· 修为 +{exp}")
        # 重新入关
        await asyncio.sleep(3)
        await client.request("/api/v1/seclusion/enter", "POST", body={"venue": VENUE_RELIC})
        await _slog(username, f"重新入关：{VENUE_RELIC}")
        await asyncio.sleep(3)
        await _seclusion_tick(username)
    except Exception as e:
        await _slog(username, f"领取/重入失败：{e}，60 秒后重试")
        bot = _bots.get(username)
        if bot and bot["enabled"]:
            bot["_timer"] = asyncio.get_event_loop().call_later(
                60,
                lambda: asyncio.ensure_future(_seclusion_tick(username))
            )


def start_seclusion(username: str):
    """启动某账号的闭关自动化"""
    if username not in _bots:
        _bots[username] = {"enabled": False, "logs": [], "cycle_count": 0, "busy": False}
    bot = _bots[username]
    bot["enabled"] = True
    asyncio.ensure_future(_slog(username, "闭关自动化已启动"))
    asyncio.ensure_future(_seclusion_tick(username))


def stop_seclusion(username: str):
    """停止某账号的闭关自动化"""
    bot = _bots.get(username)
    if bot:
        bot["enabled"] = False
        timer = bot.get("_timer")
        if timer:
            timer.cancel()
            bot["_timer"] = None
        asyncio.ensure_future(_slog(username, "闭关自动化已停止"))


def is_running(username: str) -> bool:
    bot = _bots.get(username)
    return bool(bot and bot["enabled"])


def get_cycle_count(username: str) -> int:
    bot = _bots.get(username)
    return bot.get("cycle_count", 0) if bot else 0


async def get_recent_logs(username: str, limit: int = 80) -> list[dict[str, str]]:
    """获取闭关日志（从 SQLite）"""
    return await db_query_logs(username, limit)
