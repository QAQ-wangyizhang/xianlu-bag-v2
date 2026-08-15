"use client";

import { Card, Space, Tag, Typography } from "antd";
import type { Bag, GameConstants } from "@/types";
import { isOddWeek } from "@/lib/farm";
import { realmColor, realmBg } from "@/lib/realm";

const { Text } = Typography;

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const REALM_LABELS: Record<string, string> = {
  lianqi: "炼气", zhuji: "筑基", jindan: "金丹", yuanying: "元婴",
  huashen: "化神", lianxu: "炼虚", heti: "合体", dacheng: "大乘", dujie: "渡劫",
};

/** 五行本源材料 key → 图标路径 */
const ELEM_ICONS: Record<string, string> = {
  fire_essence: "/icons/elem-fire.png",
  water_essence: "/icons/elem-water.png",
  thunder_essence: "/icons/elem-thunder.png",
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

  // 掉落条目渲染：本源材料带图标，其余纯文本
  const renderDrop = (k: string | undefined, qty: number) => {
    if (!k) return null;
    const icon = ELEM_ICONS[k];
    return (
      <Tag key={k} color="#5B7B8C" style={{ marginInlineEnd: 0, borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
        {icon && <img src={icon} alt="" style={{ width: 14, height: 14, objectFit: "contain", display: "block" }} />}
        {nameOf(k)}×{qty}
      </Tag>
    );
  };
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
          <Text strong style={{ color: "var(--accent)" }}>🗺️ 今天五行秘境 · {WEEKDAY_NAMES[wd]}</Text>
          <Tag>{weekLabel}</Tag>
          <Tag color="#5B7B8C">{dg.name}</Tag>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>以下为每次扫荡（消耗 1 体力）的产出：</Text>

        {Object.keys(realmVariants).length === 0 ? (
          <Space wrap size={8}>
            {mainKey && renderDrop(mainKey, mainQty)}
            {subKey && renderDrop(subKey, subQty)}
            {bonusEntries.map(([bk, bv]) => renderDrop(bk, bv))}
            <Tag>灵石×30</Tag>
          </Space>
        ) : (
          Object.entries(realmVariants).map(([rk, v]) => {
            const parts: { k: string; qty: number }[] = [];
            if (v.mk) parts.push({ k: v.mk, qty: v.mq });
            if (v.sk) parts.push({ k: v.sk, qty: v.sq });
            for (const [bk, bv] of bonusEntries) parts.push({ k: bk, qty: bv });
            return (
              <div key={rk} style={{ marginBottom: 10 }}>
                {/* 境界标签一行（带境界色），掉落物下一行左对齐，换行有间距 */}
                <Tag style={{ background: realmBg(rk), border: "none", color: realmColor(rk), minWidth: 44, textAlign: "center", borderRadius: 4 }}>
                  {REALM_LABELS[rk] || rk}
                </Tag>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, alignItems: "center" }}>
                  {parts.map((p, i) => (
                    <span key={i}>{renderDrop(p.k, p.qty)}</span>
                  ))}
                  <Tag style={{ marginInlineEnd: 0, borderRadius: 4 }}>灵石×30</Tag>
                </div>
              </div>
            );
          })
        )}
      </Space>
    </Card>
  );
}
