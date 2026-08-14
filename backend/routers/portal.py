"""游戏官网免登录代理

原理：官网与游戏 API 同源同 Cookie（immortal_session）。
通过 /portal/u/{username}/... 代理官网请求并注入该账号 Cookie，
同时重写 SPA 的绝对路径资源（/assets、/api/v1），实现免登录访问官网。

入口：GET /portal/u/{username}（跟随 base url 配置）
"""

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, Response

from ..config import get_game_host, get_game_port
from ..store import get_session, find_account

router = APIRouter()

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=30, follow_redirects=False)
    return _client


def _cookie_header(username: str) -> str:
    sess = get_session(username) or {}
    return "; ".join(f"{k}={v}" for k, v in sess.items())


def _rewrite_html(text: str, prefix: str) -> str:
    """HTML 里的绝对资源路径 → 代理前缀"""
    return (
        text.replace('src="/assets/', f'src="{prefix}/assets/')
        .replace('href="/assets/', f'href="{prefix}/assets/')
        .replace('src="/favicon', f'src="{prefix}/favicon')
        .replace('href="/favicon', f'href="{prefix}/favicon')
    )


def _rewrite_js(text: str, prefix: str) -> str:
    """压缩 JS 里的 API 调用路径 → 代理前缀"""
    return (
        text.replace('`/api/v1', f'`{prefix}/api/v1')
        .replace('"/api/v1', f'"{prefix}/api/v1')
        .replace("'/api/v1", f"'{prefix}/api/v1")
    )


@router.get("/portal/u/{username}")
async def portal_root(username: str, request: Request):
    return await _proxy(username, "", request)


@router.get("/portal/u/{username}/{full_path:path}")
async def portal_path(username: str, full_path: str, request: Request):
    return await _proxy(username, full_path, request)


async def _proxy(username: str, path: str, request: Request):
    if not find_account(username):
        return HTMLResponse("<h3>未找到该账号</h3>", status_code=404)
    cookie = _cookie_header(username)
    if not cookie:
        return HTMLResponse(
            "<h3>该账号还没有登录会话，请先在工具里点一次「全部刷新」</h3>",
            status_code=400,
        )

    base = f"http://{get_game_host()}:{get_game_port()}"
    url = f"{base}/{path}" if path else f"{base}/"
    # 透传 query 参数
    if request.url.query:
        url += f"?{request.url.query}"

    try:
        resp = await get_client().request("GET", url, headers={"Cookie": cookie})
    except Exception as e:
        return HTMLResponse(f"<h3>代理失败：{e}</h3>", status_code=502)

    ct = resp.headers.get("content-type", "")
    prefix = f"/portal/u/{username}"

    if "text/html" in ct:
        return HTMLResponse(_rewrite_html(resp.text, prefix), status_code=resp.status_code)
    if "javascript" in ct or "text/css" in ct:
        content = _rewrite_js(resp.text, prefix) if "javascript" in ct else resp.text
        return Response(content=content, media_type=ct, status_code=resp.status_code)

    return Response(content=resp.content, media_type=ct or "application/octet-stream",
                    status_code=resp.status_code)
