"""账号管理路由"""
from fastapi import APIRouter

from ..models import AccountCreate, AccountOwner, AccountRemove
from ..store import accounts, add_account, remove_account, set_session, find_account, set_account_owner
from ..game_client import GameClient

router = APIRouter()


@router.get("/api/accounts")
async def list_accounts():
    """列出所有账号（不返回密码，含归属人）"""
    return [{"username": a["username"], "owner": a.get("owner", "")} for a in accounts]


@router.post("/api/accounts")
async def create_account(req: AccountCreate):
    """添加并验证账号"""
    if find_account(req.username):
        return {"error": "该账号已存在"}
    client = GameClient()
    try:
        result = await client.login(req.username, req.password)
        me = await client.me()
        name = me.get("player", {}).get("name", req.username)
        add_account(req.username, req.password)
        set_session(req.username, client.export_session())
        await client.close()
        return {"ok": True, "name": name}
    except Exception as e:
        await client.close()
        return {"error": str(e)}


@router.post("/api/accounts/remove")
async def delete_account(req: AccountRemove):
    """删除账号"""
    from ..seclusion import stop_seclusion
    stop_seclusion(req.username)
    remove_account(req.username)
    return {"ok": True}


@router.post("/api/accounts/owner")
async def update_owner(req: AccountOwner):
    """设置账号归属人（owner 传空字符串清除归属）"""
    try:
        set_account_owner(req.username, req.owner)
        return {"ok": True}
    except ValueError as e:
        return {"error": str(e)}
