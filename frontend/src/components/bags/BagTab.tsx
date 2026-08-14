"use client";

import { useEffect, useState } from "react";
import { Card, Checkbox, Empty, Input, Skeleton, Space } from "antd";
import type { Account, Bag, GameConstants, Owner } from "@/types";
import { apiGet } from "@/lib/api";
import BagCard from "./BagCard";

export default function BagTab({
  bags, accounts, owners, constants, loading,
}: {
  bags: Bag[]; accounts: Account[]; owners: Owner[]; constants: GameConstants | null; loading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [onlyHas, setOnlyHas] = useState(true);
  // 游戏官网地址 = 设置里的爬取地址（游戏服 Base），供「进入官网」按钮使用
  const [gameBase, setGameBase] = useState("");

  useEffect(() => {
    apiGet<{ host: string; port: number }>("/api/config")
      .then((c) => setGameBase(`http://${c.host}:${c.port}`))
      .catch(() => {});
  }, []);

  const matNames = constants?.materialNames || {};

  // 首次加载：骨架屏
  if (!bags.length) {
    if (loading) {
      return (
        <div style={{ columnWidth: 340, columnGap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ breakInside: "avoid", marginBottom: 16 }}>
              <Card size="small">
                <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
              </Card>
            </div>
          ))}
        </div>
      );
    }
    return <Empty description="点击右上角「全部刷新」加载" style={{ padding: "48px 0" }} />;
  }

  const ownerInfo = (username: string) => {
    const name = accounts.find((a) => a.username === username)?.owner || "";
    const color = owners.find((o) => o.name === name)?.color;
    return { name, color };
  };

  const kw = search.trim().toLowerCase();

  // 搜索：只显示拥有该材料的账号（没有的不展示），匹配账号自动展开
  const visibleBags = kw
    ? bags.filter(
        (b) =>
          b.ok &&
          Object.keys(b.materials || {}).some(
            (k) => matNames[k]?.toLowerCase().includes(kw) || k.toLowerCase().includes(kw)
          )
      )
    : bags;

  return (
    <div>
      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="搜索材料名，只显示拥有该材料的账号"
            style={{ width: 300 }}
            onSearch={(v) => setSearch(v)}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Checkbox checked={onlyHas} onChange={(e) => setOnlyHas(e.target.checked)}>
            仅显示有持有
          </Checkbox>
          {kw && (
            <span style={{ color: "var(--ink-2)", fontSize: 12 }}>
              匹配 {visibleBags.length} 个账号
            </span>
          )}
        </Space>
      </Card>

      {/* 账号卡片瀑布流 */}
      <div style={{ columnWidth: 340, columnGap: 16 }}>
        {visibleBags.map((bag) => {
          const o = ownerInfo(bag.username);
          return (
            <div key={bag.username} style={{ breakInside: "avoid", marginBottom: 16 }}>
              <BagCard
                bag={bag}
                owner={o.name}
                ownerColor={o.color}
                search={kw}
                onlyHas={onlyHas}
                constants={constants}
                forceOpen={!!kw}
                gameBase={gameBase}
              />
            </div>
          );
        })}
        {!visibleBags.length && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`没有账号拥有「${search}」`} />
        )}
      </div>
    </div>
  );
}
