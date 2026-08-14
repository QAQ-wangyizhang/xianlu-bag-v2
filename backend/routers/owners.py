"""归属人管理路由"""
import re

from fastapi import APIRouter

from ..models import OwnerColorUpdate, OwnerCreate, OwnerRemove
from ..store import owners, find_owner, add_owner, set_owner_color, remove_owner

router = APIRouter()

_HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


@router.get("/api/owners")
async def list_owners():
    """归属人名单（含自定义标签色）"""
    return {
        "owners": [
            {"name": o["name"], "color": o.get("color")}
            for o in owners
            if isinstance(o, dict)
        ]
    }


@router.post("/api/owners")
async def create_owner(req: OwnerCreate):
    """创建归属人"""
    name = req.name.strip()
    if not name:
        return {"error": "名字不能为空"}
    if find_owner(name):
        return {"error": "该归属人已存在"}
    color = req.color.strip() if req.color else None
    if color and not _HEX_RE.match(color):
        return {"error": "颜色格式不正确，示例：#5B7B8C"}
    add_owner(name, color)
    return {"ok": True}


@router.post("/api/owners/color")
async def update_owner_color(req: OwnerColorUpdate):
    """设置归属人标签颜色"""
    color = req.color.strip()
    if not _HEX_RE.match(color):
        return {"error": "颜色格式不正确，示例：#5B7B8C"}
    try:
        set_owner_color(req.name.strip(), color)
    except ValueError as e:
        return {"error": str(e)}
    return {"ok": True}


@router.post("/api/owners/remove")
async def delete_owner(req: OwnerRemove):
    """删除归属人（其名下账号自动置为未分配）"""
    remove_owner(req.name.strip())
    return {"ok": True}
