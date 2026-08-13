"""数据持久化：accounts.json + sessions.json + SQLite（闭关日志）"""

import json
import sqlite3
import asyncio
from typing import Any

from .config import ACCOUNTS_FILE, SESSIONS_FILE, OWNERS_FILE, SQLITE_FILE

# ---- 内存状态 ----
accounts: list[dict[str, str]] = []  # [{username, password, owner?}]
sessions: dict[str, dict[str, str]] = {}  # {username: {cookie_key: cookie_val}}
owners: list[str] = []  # 归属人名单（独立存储，可先建归属人再分配）

# SQLite 连接（线程安全用 Lock 保护）
_db: sqlite3.Connection | None = None
_db_lock = asyncio.Lock()


def load():
    """启动时从文件加载（原地修改，不重新绑定变量）"""
    try:
        if ACCOUNTS_FILE.exists():
            loaded = json.loads(ACCOUNTS_FILE.read_text(encoding="utf-8"))
            accounts.clear()
            accounts.extend(loaded)
    except Exception:
        accounts.clear()
    try:
        if SESSIONS_FILE.exists():
            loaded = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
            sessions.clear()
            sessions.update(loaded)
    except Exception:
        sessions.clear()
    try:
        if OWNERS_FILE.exists():
            loaded = json.loads(OWNERS_FILE.read_text(encoding="utf-8"))
            owners.clear()
            owners.extend(loaded if isinstance(loaded, list) else [])
    except Exception:
        owners.clear()
    _init_db()


def save_accounts():
    ACCOUNTS_FILE.write_text(json.dumps(accounts, ensure_ascii=False, indent=2), encoding="utf-8")


def save_owners():
    OWNERS_FILE.write_text(json.dumps(owners, ensure_ascii=False, indent=2), encoding="utf-8")


def save_sessions():
    SESSIONS_FILE.write_text(json.dumps(sessions, ensure_ascii=False, indent=2), encoding="utf-8")


def _init_db():
    """初始化 SQLite 表"""
    global _db
    _db = sqlite3.connect(str(SQLITE_FILE), check_same_thread=False)
    _db.execute("""
        CREATE TABLE IF NOT EXISTS seclusion_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            message TEXT NOT NULL
        )
    """)
    _db.commit()


async def db_insert_log(username: str, timestamp: str, message: str):
    """写入闭关日志到 SQLite"""
    async with _db_lock:
        _db.execute(
            "INSERT INTO seclusion_logs (username, timestamp, message) VALUES (?, ?, ?)",
            (username, timestamp, message)
        )
        _db.commit()


async def db_query_logs(username: str, limit: int = 80) -> list[dict[str, str]]:
    """查询某账号的闭关日志"""
    async with _db_lock:
        cursor = _db.execute(
            "SELECT timestamp, message FROM seclusion_logs WHERE username = ? ORDER BY id DESC LIMIT ?",
            (username, limit)
        )
        rows = cursor.fetchall()
    # 返回正序（旧→新）
    return [{"timestamp": ts, "message": msg} for ts, msg in reversed(rows)]


async def db_clear_logs(username: str):
    """清空某账号的闭关日志"""
    async with _db_lock:
        _db.execute("DELETE FROM seclusion_logs WHERE username = ?", (username,))
        _db.commit()


# ---- 账号操作 ----
def find_account(username: str) -> dict | None:
    return next((a for a in accounts if a["username"] == username), None)


def add_account(username: str, password: str):
    accounts.append({"username": username, "password": password})
    save_accounts()


def set_account_owner(username: str, owner: str):
    """设置账号归属人（空字符串表示清除归属）"""
    acc = find_account(username)
    if not acc:
        raise ValueError(f"未找到账号 {username}")
    owner = (owner or "").strip()
    if owner:
        acc["owner"] = owner
    else:
        acc.pop("owner", None)
    save_accounts()


# ---- 归属人操作 ----
def add_owner(name: str):
    """创建归属人（可先创建、后分配账号）"""
    name = name.strip()
    if name and name not in owners:
        owners.append(name)
        save_owners()


def remove_owner(name: str):
    """删除归属人，其名下账号全部置为未分配"""
    if name in owners:
        owners.remove(name)
        save_owners()
    for a in accounts:
        if a.get("owner") == name:
            a.pop("owner", None)
    save_accounts()


def remove_account(username: str):
    # 原地删除，不重新绑定（保持引用一致性）
    to_remove = [a for a in accounts if a["username"] == username]
    for a in to_remove:
        accounts.remove(a)
    sessions.pop(username, None)
    save_accounts()
    save_sessions()


def get_session(username: str) -> dict | None:
    return sessions.get(username)


def set_session(username: str, cookies: dict):
    sessions[username] = cookies
    save_sessions()
