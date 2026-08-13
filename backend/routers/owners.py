"""归属人管理路由"""
from fastapi import APIRouter

from ..models import OwnerCreate, OwnerRemove
from ..store import owners, add_owner, remove_owner

router = APIRouter()


@router.get("/api/owners")
async def list_owners():
    """归属人名单"""
    return {"owners": list(owners)}


@router.post("/api/owners")
async def create_owner(req: OwnerCreate):
    """创建归属人"""
    name = req.name.strip()
    if not name:
        return {"error": "名字不能为空"}
    if name in owners:
        return {"error": "该归属人已存在"}
    add_owner(name)
    return {"ok": True}


@router.post("/api/owners/remove")
async def delete_owner(req: OwnerRemove):
    """删除归属人（其名下账号自动置为未分配）"""
    remove_owner(req.name.strip())
    return {"ok": True}
