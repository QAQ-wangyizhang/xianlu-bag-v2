"use client";

import { useState, useEffect } from "react";
import {
  Alert, Card, Checkbox, Empty, InputNumber, Progress,
  Select, Space, Tag, Typography,
} from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import type { Account, Bag, GameConstants, GradeTier, Owner } from "@/types";
import { fmt, fmtWan, realmText } from "@/lib/format";
import { realmIcon } from "@/lib/realm";
import { calcFarmPlan, defaultTierForRealm } from "@/lib/farm";
import DungeonToday from "./DungeonToday";
import StoneCard from "./StoneCard";
import SectTag from "@/components/SectTag";
import OwnerTag from "@/components/OwnerTag";
import RealmTag from "@/components/RealmTag";
import CollapseBox from "@/components/CollapseBox";

/** 五行本源材料 key → 图标路径 */
const ELEM_ICONS: Record<string, string> = {
  fire_essence: "/icons/elem-fire.png",
  water_essence: "/icons/elem-water.png",
  thunder_essence: "/icons/elem-thunder.png",
};

const { Text } = Typography;

export default function GapTab({
  bags, accounts, owners, constants, loadAll, loading,
}: {
  bags: Bag[]; accounts: Account[]; owners: Owner[]; constants: GameConstants | null; loadAll: () => void; loading: boolean;
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
  const ownerInfo = (username: string) => {
    const name = accounts.find((a) => a.username === username)?.owner || "";
    const color = owners.find((o) => o.name === name)?.color;
    return { name, color };
  };

  return (
    <div>
      <GapControls tiers={tiers} tierKey={tierKey} setTierKey={setTierKey} pieces={pieces} setPieces={setPieces} onlyLack={onlyLack} setOnlyLack={setOnlyLack} />

      <DungeonToday bags={okBags} constants={constants} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {okBags.map((bag, i) => {
          const o = ownerInfo(bag.username);
          return (
            <GapCard
              key={bag.username}
              bag={bag}
              owner={o.name}
              ownerColor={o.color}
              defaultOpen={i === 0}
              tier={tier}
              pieces={pieces}
              onlyLack={onlyLack}
              nameOf={nameOf}
              realmNames={realmNames}
              dungeonSchedule={dungeonSchedule}
              dungeonBonus={dungeonBonus}
              realmOverride={realmOverride}
            />
          );
        })}
      </div>
    </div>
  );
}

function GapControls({ tiers, tierKey, setTierKey, pieces, setPieces, onlyLack, setOnlyLack }: any) {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Text strong style={{ fontSize: 16, color: "var(--accent)" }}>升段缺口计算</Text>
        <Text type="secondary">选择目标境界段，计算每个账号当前材料升满一套装备还差多少。</Text>
        <Space wrap>
          <Space>
            <Text type="secondary">目标境界段</Text>
            <Select
              value={tierKey}
              onChange={setTierKey}
              style={{ width: 260 }}
              options={tiers.map((t: GradeTier) => ({
                value: t.key,
                label: (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {realmIcon(t.key) && (
                      <img src={realmIcon(t.key)} alt="" style={{ width: 16, height: 16, objectFit: "contain", display: "block" }} />
                    )}
                    {t.name.replace(/⭐/g, "").trim()}（{t.range}级 · 单件）
                  </span>
                ),
              }))}
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

export function GapCard({ bag, owner, ownerColor, tier, pieces, onlyLack, nameOf, realmNames, dungeonSchedule, dungeonBonus, realmOverride, defaultOpen = true }: any) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const toggle = () => setOpen((o) => !o);
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

  // 灵石刷满预估：1 体力 = 1200 灵石，每天自然恢复 48 体力
  const stoneLackStamina = Math.ceil(stoneLack / 1200);
  const stoneDays = Math.ceil(stoneLackStamina / 48);

  const title = (
    <div
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "100%" }}
      onClick={toggle}
    >
      {/* 箭头独立一行，垂直居中于整个标题块（换行时也在两行中间） */}
      <CaretRightOutlined
        style={{
          transition: "transform 200ms",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          color: "var(--slate)",
          fontSize: 12,
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
        <span className="serif-title" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
          {p.name || bag.username}
        </span>
        {owner && <OwnerTag name={owner} color={ownerColor} />}
        <SectTag name={p.sect_name} />
        <RealmTag realmKey={p.major_realm} name={realmText(p, realmNames)} />
        <Text type="warning">灵石 {fmtWan(p.spirit_stone)}</Text>
        {allMet ? (
          <Tag color="#6FA287" style={{ borderRadius: 4 }}>材料齐全 ✓</Tag>
        ) : (
          <Tag color="#C47B6D" style={{ borderRadius: 4 }}>缺 {lackCount} 种</Tag>
        )}
      </div>
    </div>
  );

  return (
    <Card size="small" title={title}>
      {/* 折叠态：灵石缺口 + 刷满天数摘要 */}
      {!open && stoneNeed > 0 && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
            <img src="/icons/mat-spirit-stone.png" alt="" style={{ width: 14, height: 14, objectFit: "contain", alignSelf: "center", display: "block" }} />
            <Text type="secondary" style={{ fontSize: 12 }}>灵石缺口</Text>
          </span>
          <Text className="tabular-nums" style={{ fontSize: 13, color: stoneLack > 0 ? "var(--terracotta)" : "var(--bamboo)", fontWeight: 600 }}>
            {stoneLack > 0 ? `缺 ${fmtWan(stoneLack)}` : "已充足 ✓"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            当前 {fmtWan(stoneHave)} / 需要 {fmtWan(stoneNeed)}
          </Text>
          {stoneLack > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              · 约 <Text strong style={{ color: "var(--accent)" }}>{stoneDays} 天</Text> 刷满（{fmt(stoneLackStamina)} 体力）
            </Text>
          )}
        </div>
      )}

      {/* 展开态：完整缺口（高度动画） */}
      <CollapseBox open={open}>
        <div style={{ paddingTop: open ? 12 : 0 }}>
          <Text type="secondary">
            升满 <Text strong style={{ color: "var(--accent)" }}>{tier.name}</Text> 共 {pieces} 件装备的材料缺口：
          </Text>

          {!filtered.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无" style={{ marginTop: 12 }} />}

          {/* 6 列网格（移动端 2 列）：灵石卡跨 3 列，材料每行 6 个；1fr 等宽 + gap 12 一致 */}
          <div className="gap-grid" style={{ gap: 12 }}>
            {stoneNeed > 0 && (
              <div className="gap-stone">
                <StoneCard have={stoneHave} need={stoneNeed} lack={stoneLack} />
              </div>
            )}
            {filtered.map((g) => {
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
            <div key={g.key} style={{ minWidth: 0 }}>
              <Card size="small" style={{ borderColor: g.lack > 0 ? "#f0dcd5" : "#d9e6dc" }}>
                <Space align="end" wrap style={{ width: "100%", justifyContent: "space-between" }} size={4}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                    {ELEM_ICONS[g.key] && (
                      <img src={ELEM_ICONS[g.key]} alt="" style={{ width: 15, height: 15, objectFit: "contain", display: "block", flexShrink: 0 }} />
                    )}
                    <Text strong={g.lack > 0} type={g.lack === 0 ? "success" : undefined} ellipsis style={{ maxWidth: 100 }}>
                      {g.name}
                    </Text>
                  </span>
                  {g.lack > 0
                    ? <Tag color="error" style={{ marginInlineEnd: 0 }}>缺 {fmt(g.lack)}</Tag>
                    : <Tag color="success" style={{ marginInlineEnd: 0 }}>✓</Tag>}
                </Space>
                <Progress
                  percent={pct}
                  showInfo={false}
                  size="small"
                  strokeColor={g.lack === 0 ? "var(--bamboo)" : "var(--accent)"}
                  style={{ margin: "8px 0 4px" }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>{fmt(g.have)} / {fmt(g.need)}</Text>
                {/* 计划文案区：桌面固定等高，移动端自适应完整显示（不截断） */}
                <div className="gap-plan">
                  {planText && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      📍 {planText}
                    </Text>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
          </div>
        </div>
      </CollapseBox>
    </Card>
  );
}
