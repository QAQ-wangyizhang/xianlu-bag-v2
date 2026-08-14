"""拉取日志：记录每次账号拉取结果，每日 0 点自动清理"""

import asyncio
import json
from datetime import datetime, timedelta

from .config import DATA_DIR
from .atomic import atomic_write_text

LOG_FILE = DATA_DIR / "fetch_logs.json"
MAX_ENTRIES = 500

_logs: list[dict] = []
_last_date: str | None = None


def load():
    """启动时加载日志"""
    global _logs, _last_date
    try:
        if LOG_FILE.exists():
            _logs = json.loads(LOG_FILE.read_text(encoding="utf-8"))
            if not isinstance(_logs, list):
                _logs = []
    except Exception:
        _logs = []
    _last_date = datetime.now().astimezone().strftime("%Y-%m-%d")


def _save():
    try:
        atomic_write_text(LOG_FILE, json.dumps(_logs, ensure_ascii=False, indent=2))
    except Exception:
        pass


def log_fetch(username: str, ok: bool, ms: int, error: str = ""):
    """记录一次拉取"""
    global _logs
    entry = {
        "time": datetime.now().astimezone().strftime("%H:%M:%S"),
        "date": datetime.now().astimezone().strftime("%Y-%m-%d"),
        "username": username,
        "ok": ok,
        "ms": ms,
        "error": error,
    }
    _logs.append(entry)
    if len(_logs) > MAX_ENTRIES:
        _logs = _logs[-MAX_ENTRIES:]
    _save()


def recent(limit: int = 100) -> list[dict]:
    """最近日志（新的在前）"""
    return list(reversed(_logs[-limit:]))


async def cleanup_loop():
    """每日 0 点清理日志"""
    global _logs, _last_date
    while True:
        try:
            now = datetime.now().astimezone()
            today = now.strftime("%Y-%m-%d")
            if _last_date is not None and _last_date != today:
                _logs.clear()
                _save()
                print(f"[拉取日志] {today} 0 点已清理")
            _last_date = today
            # 睡到明天 0 点 + 10 秒
            tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=10, microsecond=0)
            await asyncio.sleep(max(10, (tomorrow - now).total_seconds()))
        except Exception:
            await asyncio.sleep(3600)
