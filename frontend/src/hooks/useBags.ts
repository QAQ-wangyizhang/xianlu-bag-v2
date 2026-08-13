/** 多账号背包数据管理（批量拉取，一次往返）*/
"use client";

import { useState, useCallback, useRef } from "react";
import type { Account, Bag } from "@/types";
import { apiGet } from "@/lib/api";

export function useBags() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadHint, setLoadHint] = useState("");
  const loadingRef = useRef(false);

  const loadOwners = useCallback(async () => {
    try {
      const data = await apiGet<{ owners: string[] }>("/api/owners");
      setOwners(data.owners || []);
    } catch {
      setOwners([]);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const [data] = await Promise.all([apiGet<Account[]>("/api/accounts"), loadOwners()]);
      setAccounts(data);
      return data;
    } catch {
      setAccounts([]);
      return [];
    }
  }, [loadOwners]);

  const loadAll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const accs = await loadAccounts();
      if (!accs.length) return;

      // 初始化占位，保持"加载中"展示
      setBags(accs.map((a) => ({ username: a.username, ok: false, loading: true })));
      setLoadHint("加载中…");

      // 一次批量请求拉全部账号（后端并发 + TTL 缓存）
      const results = await apiGet<Bag[]>("/api/bag/all");
      setBags(results.map((r) => ({ ...r, loading: false })));
    } catch (e: any) {
      // 批量请求整体失败：把占位标记为失败
      setBags((prev) => prev.map((b) => ({ ...b, loading: false, ok: false, error: e.message })));
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadHint("");
    }
  }, [loadAccounts]);

  return { accounts, owners, bags, loading, loadHint, loadAccounts, loadAll };
}
