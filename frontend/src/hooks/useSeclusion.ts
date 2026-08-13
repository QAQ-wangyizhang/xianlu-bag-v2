/** 闭关状态管理（含轮询）*/
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Account, SeclusionStatus } from "@/types";
import { apiGet, apiPost } from "@/lib/api";

export function useSeclusion(accounts: Account[], enabled: boolean) {
  const [statuses, setStatuses] = useState<Record<string, SeclusionStatus>>({});
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!accounts.length) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        accounts.map(async (a) => {
          try {
            const s = await apiGet<SeclusionStatus>(`/api/seclusion/status?username=${encodeURIComponent(a.username)}`);
            return { username: a.username, ...s } as SeclusionStatus & { username: string };
          } catch (e: any) {
            return { username: a.username, enabled: false, logs: [], cycleCount: 0, realtime: { error: e.message } };
          }
        })
      );
      setStatuses(Object.fromEntries(results.map((r) => [r.username, r])));
    } finally {
      setLoading(false);
    }
  }, [accounts]);

  const startOne = useCallback(async (username: string) => {
    await apiPost("/api/seclusion/start", { username });
    refresh();
  }, [refresh]);

  const stopOne = useCallback(async (username: string) => {
    await apiPost("/api/seclusion/stop", { username });
    refresh();
  }, [refresh]);

  const startAll = useCallback(async () => {
    for (const a of accounts) await apiPost("/api/seclusion/start", { username: a.username });
    refresh();
  }, [accounts, refresh]);

  const stopAll = useCallback(async () => {
    for (const a of accounts) await apiPost("/api/seclusion/stop", { username: a.username });
    refresh();
  }, [accounts, refresh]);

  // 挂载/账号变化时先拉一次；自动刷新开关打开后每 5s 轮询
  useEffect(() => {
    if (!accounts.length) return;
    refresh();
    if (!enabled) return;
    timerRef.current = setInterval(refresh, 5000);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [enabled, accounts, refresh]);

  return { statuses, loading, refresh, startOne, stopOne, startAll, stopAll };
}
