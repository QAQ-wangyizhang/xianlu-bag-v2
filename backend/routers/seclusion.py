"""闭关修炼路由"""
from datetime import datetime

from fastapi import APIRouter, Query

from ..models import SeclusionAction
from ..seclusion import (
    start_seclusion, stop_seclusion, is_running,
    get_cycle_count, get_recent_logs,
)
from ..client_manager import get_client
from ..config import EXIT_WAIT_MS

router = APIRouter()


@router.get("/api/seclusion/status")
async def seclusion_status(username: str = Query(...)):
    """获取闭关状态"""
    enabled = is_running(username)
    cycle = get_cycle_count(username)
    logs = await get_recent_logs(username)

    # 实时探测闭关状态
    realtime = None
    try:
        client = await get_client(username)
        s = await client.request("/api/v1/seclusion", "GET")
        session = s.get("session") or {}
        exit_started = session.get("exit_started_at")
        exit_remaining_ms = None
        if exit_started:
            try:
                elapsed = (datetime.now() - datetime.fromisoformat(exit_started)).total_seconds() * 1000
                exit_remaining_ms = max(0, EXIT_WAIT_MS - elapsed)
            except Exception:
                pass
        realtime = {
            "venue": session.get("venue"),
            "status": session.get("status"),
            "pending_exp": session.get("pending_exp"),
            "solidified_exp": session.get("solidified_exp"),
            "exit_started_at": exit_started,
            "exit_remaining_ms": exit_remaining_ms,
        }
    except Exception as e:
        realtime = {"error": str(e)}

    return {
        "enabled": enabled,
        "logs": logs[-80:],
        "cycleCount": cycle,
        "realtime": realtime,
    }


@router.post("/api/seclusion/start")
async def seclusion_start(req: SeclusionAction):
    """启动闭关自动化"""
    start_seclusion(req.username)
    return {"ok": True}


@router.post("/api/seclusion/stop")
async def seclusion_stop(req: SeclusionAction):
    """停止闭关自动化"""
    stop_seclusion(req.username)
    return {"ok": True}
