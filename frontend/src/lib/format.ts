/** 格式化工具函数 */

export function fmt(n: number | undefined | null): string {
  if (n == null) return "-";
  return n.toLocaleString("zh-CN");
}

/** 万单位显示：>=1万 显示 "X.X万"，否则原样 */
export function fmtWan(n: number | undefined | null): string {
  if (n == null) return "-";
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

export function fmtDur(sec: number | undefined | null): string {
  if (!sec || sec <= 0) return "-";
  if (sec >= 3600) return `${Math.floor(sec / 3600)}时${Math.floor((sec % 3600) / 60)}分`;
  return `${Math.floor(sec / 60)}分${sec % 60}秒`;
}

export function staminaText(st: { current?: number | null; max?: number | null; seconds_to_next?: number | null } | null | undefined): string {
  if (!st || st.current == null) return "-";
  const next = st.seconds_to_next;
  const regen = next ? ` · ${Math.ceil(next / 60)}分回1` : "";
  return `${st.current}/${st.max ?? "?"}${regen}`;
}

export function realmText(p: { major_realm?: string; stage?: number }, realmNames?: Record<string, string>): string {
  const names = realmNames || {};
  const r = names[p.major_realm || ""] || p.major_realm || "-";
  return `${r} · ${p.stage ?? "?"}阶`;
}
