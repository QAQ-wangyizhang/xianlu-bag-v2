/** 加载游戏常量数据（从 /api/constants）*/
"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameConstants } from "@/types";
import { apiGet } from "@/lib/api";

let _cache: GameConstants | null = null;

export function useGameConstants() {
  const [constants, setConstants] = useState<GameConstants | null>(_cache);
  const [loading, setLoading] = useState(!_cache);

  const load = useCallback(async () => {
    if (_cache) { setConstants(_cache); return; }
    try {
      setLoading(true);
      const data = await apiGet<GameConstants>("/api/constants");
      _cache = data;
      setConstants(data);
    } catch (e) {
      console.error("Failed to load constants:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { constants, loading };
}
