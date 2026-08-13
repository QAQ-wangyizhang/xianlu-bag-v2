"use client";

import { Card, Space, Tag, Typography } from "antd";
import type { Bag, GameConstants } from "@/types";
import { isOddWeek } from "@/lib/farm";

const { Text } = Typography;

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const REALM_LABELS: Record<string, string> = {
  lianqi: "炼气", zhuji: "筑基", jindan: "金丹", yuanying: "元婴",
  huashen: "化神", lianxu: "炼虚", heti: "合体",
};

export default function DungeonToday({ bags, constants }: { bags: Bag[]; constants: GameConstants | null }) {
  if (!constants) return null;

  const today = new Date();
  const wd = today.getDay();
  const wt = isOddWeek(today) ? "odd" : "even";
  const weekLabel = wt === "odd" ? "奇数周（变异）" : "偶数周（普通）";
  const dg = constants.dungeonSchedule[wt]?.[wd];
  if (!dg) return null;

  const matNames = constants.materialNames;
  const nameOf = (k: string) => matNames[k] || k;

  const mainKey = Object.keys(dg.main)[0];
  const mainQty = dg.main[mainKey] || 0;
  const subKey = Object.keys(dg.sub)[0];
  const subQty = dg.sub[subKey] || 0;
  const bonusEntries = Object.entries(constants.dungeonBonus);

  // 按境界分组
  const realmVariants: Record<string, { mk: string; mq: number; sk: string; sq: number }> = {};
  for (const bag of bags) {
    const rk = bag.player?.major_realm;
    if (!rk || realmVariants[rk]) continue;
    const ov = constants.realmOverride[rk];
    let mk = mainKey, mq = mainQty, sk = subKey, sq = subQty;
    if (ov) {
      if (ov.mainReplace) { mk = ov.mainReplace; mq = ov.mainReplaceQty; }
      if (ov.sub) { sk = ov.sub; sq = ov.subQty; }
    }
    realmVariants[rk] = { mk, mq, sk, sq };
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Space wrap>
          <Text strong style={{ color: "#d48806" }}>🗺️ 今天五行秘境 · {WEEKDAY_NAMES[wd]}</Text>
          <Tag>{weekLabel}</Tag>
          <Tag color="gold">{dg.name}</Tag>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>以下为每次扫荡（消耗 1 体力）的产出：</Text>

        {Object.keys(realmVariants).length === 0 ? (
          <Space wrap size={8}>
            {mainKey && <Tag color="gold">{nameOf(mainKey)}×{mainQty}</Tag>}
            {subKey && <Tag color="gold">{nameOf(subKey)}×{subQty}</Tag>}
            {bonusEntries.map(([bk, bv]) => (
              <Tag color="gold" key={bk}>{nameOf(bk)}×{bv}</Tag>
            ))}
            <Tag>灵石×30</Tag>
          </Space>
        ) : (
          Object.entries(realmVariants).map(([rk, v]) => {
            const parts: string[] = [];
            if (v.mk) parts.push(`${nameOf(v.mk)}×${v.mq}`);
            if (v.sk) parts.push(`${nameOf(v.sk)}×${v.sq}`);
            for (const [bk, bv] of bonusEntries) parts.push(`${nameOf(bk)}×${bv}`);
            return (
              <div key={rk}>
                <Tag style={{ minWidth: 44, textAlign: "center" }}>{REALM_LABELS[rk] || rk}</Tag>
                <Space wrap size={4} style={{ marginLeft: 8 }}>
                  {parts.map((p, i) => (
                    <Tag color="gold" key={i}>{p}</Tag>
                  ))}
                  <Tag>灵石×30</Tag>
                </Space>
              </div>
            );
          })
        )}
      </Space>
    </Card>
  );
}
