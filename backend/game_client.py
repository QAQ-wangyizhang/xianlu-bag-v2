"""异步游戏服客户端 —— 基于 httpx + 手动 Cookie 管理"""

import httpx
from .config import get_game_host, get_game_port


class ApiError(Exception):
    def __init__(self, status: int, message: str, code: str | None = None):
        self.status = status
        self.code = code
        super().__init__(f"{code + ': ' if code else ''}{message}")


class GameClient:
    """每个账号一个实例，管理自己的 Cookie jar"""

    def __init__(self, host: str | None = None, port: int | None = None):
        # 未显式指定时使用当前配置（支持运行时修改游戏服地址）
        self.host = host or get_game_host()
        self.port = port or get_game_port()
        self.cookies: dict[str, str] = {}
        self._client: httpx.AsyncClient | None = None
        # 缓存上一次 me() 结果，避免重复请求
        self._last_me: dict | None = None

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}"

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    def _cookie_header(self) -> str:
        return "; ".join(f"{k}={v}" for k, v in self.cookies.items())

    def _capture_cookies(self, response: httpx.Response):
        """从响应头中提取 Set-Cookie"""
        raw = response.headers.get_list("set-cookie")
        for line in raw:
            parts = line.split(";")[0].strip()
            if "=" not in parts:
                continue
            k, _, v = parts.partition("=")
            k, v = k.strip(), v.strip()
            # 空值或过期 → 删除
            if not v:
                self.cookies.pop(k, None)
            else:
                self.cookies[k] = v

    async def request(self, path: str, method: str = "GET", body: dict | None = None,
                      query: dict | None = None) -> dict | None:
        """通用请求：自动带 Cookie、捕获 Set-Cookie"""
        client = self._get_client()
        headers = {"Content-Type": "application/json"}
        cookie = self._cookie_header()
        if cookie:
            headers["Cookie"] = cookie

        url = f"{self.base_url}{path}"
        if query:
            params = "&".join(f"{k}={v}" for k, v in query.items())
            url += f"?{params}"

        content = None
        if body is not None:
            import json
            content = json.dumps(body)

        resp = await client.request(method, url, headers=headers, content=content)
        self._capture_cookies(resp)

        if resp.status_code == 204:
            return None
        data = resp.json()
        if resp.status_code >= 400:
            code = data.get("code") if isinstance(data, dict) else None
            msg = data.get("message", data.get("error", "")) if isinstance(data, dict) else str(data)
            raise ApiError(resp.status_code, msg or "请求失败", code)
        return data

    async def login(self, username: str, password: str) -> dict:
        return await self.request("/api/v1/auth/login", "POST",
                                  body={"username": username, "password": password})

    async def me(self) -> dict:
        return await self.request("/api/v1/auth/me", "GET")

    async def logout(self) -> dict:
        return await self.request("/api/v1/auth/logout", "POST")

    # ---- 会话序列化 ----
    def export_session(self) -> dict[str, str]:
        return dict(self.cookies)

    def import_session(self, cookies: dict[str, str]):
        self.cookies = dict(cookies)

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
