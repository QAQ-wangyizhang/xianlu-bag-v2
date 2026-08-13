"use client";

import { useState } from "react";
import { Card, Checkbox, Empty, Input, Space } from "antd";
import type { Account, Bag, GameConstants } from "@/types";
import BagCard from "./BagCard";

export default function BagTab({
  bags, accounts, constants,
}: {
  bags: Bag[]; accounts: Account[]; constants: GameConstants | null;
}) {
  const [search, setSearch] = useState("");
  const [onlyHas, setOnlyHas] = useState(true);

  if (!bags.length) {
    return <Empty description="点击右上角「全部刷新」加载" style={{ padding: "48px 0" }} />;
  }

  const ownerOf = (username: string) =>
    accounts.find((a) => a.username === username)?.owner || "";

  return (
    <div>
      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="搜索材料名…"
            style={{ width: 260 }}
            onSearch={(v) => setSearch(v.toLowerCase())}
            onChange={(e) => setSearch(e.target.value.toLowerCase())}
          />
          <Checkbox checked={onlyHas} onChange={(e) => setOnlyHas(e.target.checked)}>
            仅显示有持有
          </Checkbox>
          <span style={{ color: "#999" }}>点击账号卡片可展开/折叠背包详情</span>
        </Space>
      </Card>

      {/* 账号卡片瀑布流（CSS 多列：桌面约 3 列，移动端 1 列；展开/收起时下方自动上移） */}
      <div style={{ columnWidth: 340, columnGap: 12 }}>
        {bags.map((bag) => (
          <div key={bag.username} style={{ breakInside: "avoid", marginBottom: 12 }}>
            <BagCard
              bag={bag}
              owner={ownerOf(bag.username)}
              search={search.toLowerCase()}
              onlyHas={onlyHas}
              constants={constants}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
