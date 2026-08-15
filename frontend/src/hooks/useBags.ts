/** 多账号背包数据管理（流式加载：拉一个展示一个）*/
"use client";

import { useState, useCallback, useRef } from "react";
import type { Account, Bag, Owner } from "@/types";
import { apiGet } from "@/lib/api";

// 并发拉取数：5 个同时拉，每完成一个立即展示
const CONCURRENCY = 5;

export function useBags() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadHint, setLoadHint] = useState("");
  // 共享忙碌锁：全部刷新 / 归属人刷新互斥，避免并发覆盖状态
  const busyRef = useRef(false);

  const loadOwners = useCallback(async () => {
    try {
      const data = await apiGet<{ owners: Owner[] }>("/api/owners");
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

  /** 按用户名列表拉取背包（并发池流式），每完成一个回调 onOne */
  const fetchBagsStream = useCallback(async (
    usernames: string[],
    onOne?: (index: number, bag: Bag) => void,
  ) => {
    const queue = usernames.map((u, i) => ({ u, i }));
    let done = 0;
    const worker = async () => {
      while (queue.length) {
        const item = queue.shift();
        if (!item) break;
        try {
          const r = await apiGet<Bag>(`/api/bag?username=${encodeURIComponent(item.u)}`);
          const bag: Bag = { ...r, username: item.u, ok: true, loading: false };
          onOne?.(item.i, bag);
        } catch (e: any) {
          onOne?.(item.i, { username: item.u, ok: false, loading: false, error: e.message });
        }
        done++;
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, usernames.length) }, () => worker()));
    return done;
  }, []);

  const loadAll = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const accs = await loadAccounts();
      if (!accs.length) return;

      // 占位（加载中）
      setBags(accs.map((a) => ({ username: a.username, ok: false, loading: true })));
      setLoadHint("加载中…");

      const total = accs.length;
      let done = 0;
      await fetchBagsStream(accs.map((a) => a.username), (i, bag) => {
        done++;
        setBags((prev) => {
          const next = [...prev];
          next[i] = bag;
          return next;
        });
        setLoadHint(`加载中 ${done}/${total}…`);
      });
    } catch (e: any) {
      setBags((prev) => prev.map((b) => ({ ...b, loading: false, ok: false, error: e.message })));
    } finally {
      busyRef.current = false;
      setLoading(false);
      setLoadHint("");
    }
  }, [loadAccounts, fetchBagsStream]);

  /** 拉取指定用户名列表（归属人详情用） */
  const loadBagsFor = useCallback(async (usernames: string[], onOne?: (i: number, bag: Bag) => void) => {
    if (busyRef.current) return;  // 另一路刷新进行中，忽略本次，避免状态被并发覆盖
    busyRef.current = true;
    try {
      const idxMap = new Map(usernames.map((u, i) => [u, i]));
      await fetchBagsStream(usernames, (i, bag) => {
        onOne?.(idxMap.get(bag.username) ?? i, bag);
      });
    } finally {
      busyRef.current = false;
    }
  }, [fetchBagsStream]);

  return { accounts, owners, bags, loading, loadHint, loadAccounts, loadAll, loadBagsFor };
}
