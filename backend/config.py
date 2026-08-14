"""全局配置"""
import json
import os
from pathlib import Path

from .atomic import atomic_write_text

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# 服务端口
PORT = int(os.environ.get("PORT", 5917))

# 游戏服地址
GAME_HOST = os.environ.get("GAME_HOST", "121.41.170.75")
GAME_PORT = int(os.environ.get("GAME_PORT", 18251))

# 数据文件路径
ACCOUNTS_FILE = DATA_DIR / "accounts.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"
OWNERS_FILE = DATA_DIR / "owners.json"
SQLITE_FILE = DATA_DIR / "seclusion.db"

# 闭关配置
VENUE_RELIC = "relic"  # 上古遗迹
EXIT_WAIT_MS = 2 * 60 * 1000 + 5000  # 出关 2 分钟 + 5 秒容差

# 前端静态文件目录
FRONTEND_OUT = BASE_DIR / "frontend" / "out"

# 确保数据目录存在
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 用户可配置的游戏服地址（存 data/config.json，覆盖环境变量默认值）
CONFIG_FILE = DATA_DIR / "config.json"


def _read_config() -> dict:
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def get_game_host() -> str:
    """当前游戏服 host（用户配置优先，其次环境变量/默认值）"""
    return _read_config().get("host") or GAME_HOST


def get_game_port() -> int:
    try:
        return int(_read_config().get("port") or GAME_PORT)
    except (TypeError, ValueError):
        return GAME_PORT


def set_game_config(host: str, port: int):
    """持久化游戏服地址"""
    cfg = _read_config()
    cfg["host"] = str(host).strip()
    cfg["port"] = int(port)
    atomic_write_text(CONFIG_FILE, json.dumps(cfg, ensure_ascii=False, indent=2))
