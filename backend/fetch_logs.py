"""拉取日志：记录每次账号拉取结果，每小时检查清理（跨天清空，超上限截断）"""

import asyncio
import json
from datetime import datetime

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
    """每小时清理日志（跨天时清空，不跨天仅按条数上限截断）"""
    global _logs, _last_date
    while True:
        try:
            now = datetime.now().astimezone()
            today = now.strftime("%Y-%m-%d")
            if _last_date is not None and _last_date != today:
                _logs.clear()
                _save()
                print(f"[拉取日志] 跨天 {today} 已清理")
            _last_date = today
            # 超上限则截断（每小时检查一次）
            if len(_logs) > MAX_ENTRIES:
                _logs = _logs[-MAX_ENTRIES:]
                _save()
            await asyncio.sleep(3600)
        except Exception:
            await asyncio.sleep(3600)
