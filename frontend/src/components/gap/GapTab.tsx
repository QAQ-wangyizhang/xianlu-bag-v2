"use client";

import { useState, useEffect } from "react";
import {
  Alert, Button, Card, Checkbox, Empty, InputNumber, Progress,
  Select, Space, Tag, Typography,
} from "antd";
import type { Bag, GameConstants, GradeTier } from "@/types";
import { fmt, realmText } from "@/lib/format";
import { calcFarmPlan, defaultTierForRealm } from "@/lib/farm";
import DungeonToday from "./DungeonToday";
import StoneCard from "./StoneCard";

const { Text } = Typography;

export default function GapTab({
  bags, constants, loadAll, loading,
}: {
  bags: Bag[]; constants: GameConstants | null; loadAll: () => void; loading: boolean;
}) {
  const [tierKey, setTierKey] = useState("");
  const [pieces, setPieces] = useState(10);
  const [onlyLack, setOnlyLack] = useState(true);

  const tiers = constants?.gradeTiers || [];
  const matNames = constants?.materialNames || {};
  const realmNames = constants?.realmNames || {};
  const dungeonSchedule = constants?.dungeonSchedule || { odd: {}, even: {} };
  const dungeonBonus = constants?.dungeonBonus || {};
  const realmOverride = constants?.realmOverride || {};
  const nameOf = (k: string) => matNames[k] || k;

  // 自动加载
  useEffect(() => {
    if (!bags.length && !loading) {
      loadAll();
    }
  }, [bags.length, loading, loadAll]);

  // 默认境界跟随
  useEffect(() => {
    if (!tierKey && tiers.length) {
      const firstOK = bags.find((b) => b.ok);
      const def = firstOK?.player?.major_realm
        ? defaultTierForRealm(firstOK.player.major_realm)
        : "huashen";
      setTierKey(def);
    }
  }, [tiers, bags, tierKey]);

  const tier = tiers.find((t) => t.key === tierKey);

  if (!bags.length) {
    return (
      <div>
        <DungeonToday bags={[]} constants={constants} />
        <Empty description="正在加载背包数据…" style={{ padding: "32px 0" }} />
      </div>
    );
  }

  if (!tier) {
    return <Empty description="请选择目标境界段" style={{ padding: "32px 0" }} />;
  }

  if (tier.placeholder || !Object.keys(tier.perItem).length) {
    return (
      <div>
        <GapControls tiers={tiers} tierKey={tierKey} setTierKey={setTierKey} pieces={pieces} setPieces={setPieces} onlyLack={onlyLack} setOnlyLack={setOnlyLack} />
        <Alert type="info" showIcon message={`「${tier.name}」消耗数据待实测补充。`} style={{ marginTop: 16 }} />
      </div>
    );
  }

  const okBags = bags.filter((b) => b.ok);

  return (
    <div>
      <GapControls tiers={tiers} tierKey={tierKey} setTierKey={setTierKey} pieces={pieces} setPieces={setPieces} onlyLack={onlyLack} setOnlyLack={setOnlyLack} />

      <DungeonToday bags={okBags} constants={constants} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {okBags.map((bag) => (
          <GapCard
            key={bag.username}
            bag={bag}
            tier={tier}
            pieces={pieces}
            onlyLack={onlyLack}
            nameOf={nameOf}
            realmNames={realmNames}
            dungeonSchedule={dungeonSchedule}
            dungeonBonus={dungeonBonus}
            realmOverride={realmOverride}
          />
        ))}
      </div>
    </div>
  );
}

function GapControls({ tiers, tierKey, setTierKey, pieces, setPieces, onlyLack, setOnlyLack }: any) {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Text strong style={{ fontSize: 16, color: "#d48806" }}>升段缺口计算</Text>
        <Text type="secondary">选择目标境界段，计算每个账号当前材料升满一套装备还差多少。</Text>
        <Space wrap>
          <Space>
            <Text type="secondary">目标境界段</Text>
            <Select
              value={tierKey}
              onChange={setTierKey}
              style={{ width: 240 }}
              options={tiers.map((t: GradeTier) => ({ value: t.key, label: `${t.name}（${t.range}级 · 单件）` }))}
            />
          </Space>
          <Space>
            <Text type="secondary">装备件数</Text>
            <InputNumber
              min={1}
              max={10}
              value={pieces}
              onChange={(v) => setPieces(Math.max(1, Number(v) || 10))}
            />
          </Space>
          <Checkbox checked={onlyLack} onChange={(e) => setOnlyLack(e.target.checked)}>
            仅显示缺口
          </Checkbox>
        </Space>
      </Space>
    </Card>
  );
}

export function GapCard({ bag, tier, pieces, onlyLack, nameOf, realmNames, dungeonSchedule, dungeonBonus, realmOverride }: any) {
  const [showAll, setShowAll] = useState(false);
  const p = bag.player;
  const mats = { ...(bag.materials || {}), spirit_stone: p?.spirit_stone || 0 };

  // 计算缺口
  const gaps: { key: string; name: string; need: number; have: number; lack: number }[] = [];
  let stoneNeed = 0, stoneHave = mats.spirit_stone || 0, stoneLack = 0;

  for (const [k, v] of Object.entries(tier.perItem)) {
    if ((v as number) <= 0) continue;
    const total = (v as number) * pieces;
    if (k === "spirit_stone") { stoneNeed = total; stoneLack = Math.max(0, total - stoneHave); continue; }
    const have = Number(mats[k] || 0);
    const lack = Math.max(0, total - have);
    gaps.push({ key: k, name: nameOf(k), need: total, have, lack });
  }
  gaps.sort((a, b) => b.lack - a.lack || b.need - a.need);
  const allMet = gaps.every((g) => g.lack === 0) && stoneLack === 0;
  const lackCount = gaps.filter((g) => g.lack > 0).length + (stoneLack > 0 ? 1 : 0);
  const filtered = onlyLack ? gaps.filter((g) => g.lack > 0) : gaps;

  // 默认每卡显示 8 种，超出点「查看更多」
  const VISIBLE_GAPS = 8;
  const shown = showAll ? filtered : filtered.slice(0, VISIBLE_GAPS);
  const hasMore = filtered.length > VISIBLE_GAPS;
  const hiddenCount = filtered.length - shown.length;

  const title = (
    <Space wrap size={8}>
      <Text strong>{p.name || bag.username}</Text>
      <Tag>{bag.username}</Tag>
      <Tag color="gold">{realmText(p, realmNames)}</Tag>
      <Text type="warning">灵石 {fmt(p.spirit_stone)}</Text>
      {allMet ? (
        <Tag color="success">材料齐全 ✓</Tag>
      ) : (
        <Tag color="error">缺 {lackCount} 种</Tag>
      )}
    </Space>
  );

  return (
    <Card size="small" title={title}>
      <Text type="secondary">
        升满 <Text strong style={{ color: "#d48806" }}>{tier.name}</Text> 共 {pieces} 件装备的材料缺口：
      </Text>

      {stoneNeed > 0 && <div style={{ marginTop: 12 }}><StoneCard have={stoneHave} need={stoneNeed} lack={stoneLack} /></div>}

      {!filtered.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无" style={{ marginTop: 12 }} />}

      {/* 材料缺口：紧凑网格，一个材料一个小卡片（完整文案不省略） */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 8,
          marginTop: 12,
        }}
      >
        {shown.map((g) => {
          const pct = g.need > 0 ? Math.min(100, Math.round((g.have / g.need) * 100)) : 0;
          const plan = g.lack > 0 ? calcFarmPlan(g.key, g.lack, p.major_realm, dungeonSchedule, dungeonBonus, realmOverride) : null;
          const s0 = plan?.schedule[0];

          const planText = !plan
            ? null
            : plan.days === 0
            ? "该材料不在秘境掉落（当前境界下），需去交易所购买"
            : plan.fulfilled
            ? `秘境刷取：约 ${plan.days} 天（${plan.weeks} 周）· 扫荡 ${plan.sweeps} 次＝${plan.staminaTotal} 体力${s0 ? ` · 每次 ${s0.yieldPer} 个 · 最早：${["周日","周一","周二","周三","周四","周五","周六"][s0.weekday]}「${s0.name}」` : ""}`
            : `秘境每次仅 ${s0?.yieldPer || "?"} 个，单靠秘境需太久，建议搭配交易所购买`;

          return (
            <Card key={g.key} size="small" style={{ borderColor: g.lack > 0 ? "#ffccc7" : "#b7eb8f" }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }} size={4}>
                <Text strong={g.lack > 0} type={g.lack === 0 ? "success" : undefined} ellipsis style={{ maxWidth: 130 }}>
                  {g.name}
                </Text>
                {g.lack > 0
                  ? <Tag color="error" style={{ marginInlineEnd: 0 }}>缺 {fmt(g.lack)}</Tag>
                  : <Tag color="success" style={{ marginInlineEnd: 0 }}>✓</Tag>}
              </Space>
              <Progress
                percent={pct}
                showInfo={false}
                size="small"
                strokeColor={g.lack === 0 ? "#52c41a" : "#d48806"}
                style={{ margin: "8px 0 4px" }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{fmt(g.have)} / {fmt(g.need)}</Text>
              {planText && (
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                  📍 {planText}
                </Text>
              )}
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Button type="link" onClick={() => setShowAll((o) => !o)}>
            {showAll ? "收起" : `查看更多（还有 ${hiddenCount} 种）`}
          </Button>
        </div>
      )}
    </Card>
  );
}
