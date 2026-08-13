/** API 封装 —— fetch wrapper */

const API_BASE = "";

export async function api<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || (data && data.error)) {
    throw new Error(data?.error || `HTTP ${resp.status}`);
  }
  return data as T;
}

export const apiGet = <T = any>(path: string) => api<T>(path);
export const apiPost = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
