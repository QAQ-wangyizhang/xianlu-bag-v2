"use client";

import { useState } from "react";
import { Card, Descriptions, Divider, Empty, Progress, Space, Statistic, Tag, Typography } from "antd";
import type { Bag, GameConstants } from "@/types";
import { fmt, fmtDur, realmText } from "@/lib/format";

const { Text } = Typography;

const CAT_ORDER = ["强化材料", "突破辅料", "功法", "消耗品", "礼盒", "功能道具", "其他"];

/**
 * 账号背包卡片（瀑布流 + 懒加载）：
 * - 收起时：标题（名称/id/所属人）+ 体力、修为 Descriptions（含差多少进阶 + 进度条）
 * - 点击标题展开：完整属性 + 物品格子（Statistic，一次全展示）
 */
export default function BagCard({
  bag, owner, search, onlyHas, constants,
}: {
  bag: Bag; owner?: string; search: string; onlyHas: boolean; constants: GameConstants | null;
}) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  // 加载中
  if (bag.loading) {
    return (
      <Card size="small" title={<Space><Text strong>{bag.username}</Text><Tag color="processing">加载中…</Tag></Space>} />
    );
  }

  // 加载失败
  if (!bag.ok) {
    return (
      <Card size="small" title={<Space><Text strong>{bag.username}</Text><Tag color="error">加载失败</Tag></Space>}>
        <Text type="secondary">{bag.error}</Text>
      </Card>
    );
  }

  const p = bag.player!;
  const st = bag.stamina;
  const realm = bag.realm;
  const exp = realm?.exp ?? p.exp ?? 0;
  const expNeeded = realm?.exp_needed ?? 0;
  const expLack = expNeeded > 0 ? Math.max(0, expNeeded - exp) : null;
  const staminaPct = st?.max ? Math.round(((st.current || 0) / st.max) * 100) : 0;
  const expPct = expNeeded > 0 ? Math.min(100, Math.round((exp / expNeeded) * 100)) : 0;

  // 体力回满时间：下一颗 + (剩余颗数-1) × 每颗分钟数
  const staminaFull =
    st && st.max != null && st.current != null ? Math.max(0, st.max - st.current) : 0;
  let fullTimeSec: number | null = null;
  if (st && staminaFull > 0) {
    const regenSec = (st.regen_minutes || 1) * 60;
    const nextSec = st.seconds_to_next ?? regenSec;
    fullTimeSec = nextSec + (staminaFull - 1) * regenSec;
  }

  const title = (
    <Space wrap size={8} onClick={toggle} style={{ cursor: "pointer", userSelect: "none", width: "100%" }}>
      <span
        style={{
          display: "inline-block",
          color: "#d48806",
          transition: "transform .2s",
          transform: open ? "rotate(90deg)" : undefined,
        }}
      >
        ▶
      </span>
      <Text strong>{p.name || bag.username}</Text>
      <Tag>{bag.username}</Tag>
      {owner && <Tag color="geekblue">{owner}</Tag>}
      <span style={{ flex: 1 }} />
      <Text type="warning">灵石 {fmt(p.spirit_stone)}</Text>
    </Space>
  );

  return (
    <Card size="small" title={title} styles={{ body: { paddingTop: 8, paddingBottom: 12 } }}>
      {/* 体力 / 修为 摘要（Space 统一间距） */}
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        {/* 体力 */}
        <Descriptions size="small" column={1} colon={false}>
          <Descriptions.Item label="体力" labelStyle={{ width: 48 }}>
            <div style={{ width: "100%" }}>
              <Text>{st ? `${st.current}/${st.max}` : "-"}</Text>
              {staminaFull > 0 && (
                <Text type="secondary">
                  {" "}· 差 {fmt(staminaFull)}{fullTimeSec ? ` · 约 ${fmtDur(fullTimeSec)} 回满` : " 回满"}
                </Text>
              )}
              {st && staminaFull === 0 && <Text type="success"> · 已满</Text>}
              <Progress
                percent={staminaPct}
                showInfo={false}
                size="small"
                strokeColor={staminaPct < 30 ? "#ff4d4f" : staminaPct < 60 ? "#faad14" : "#52c41a"}
                style={{ margin: "6px 0 0" }}
              />
            </div>
          </Descriptions.Item>
        </Descriptions>

        {/* 体力 / 修为 分割线 */}
        <Divider style={{ margin: 0 }} />

        {/* 修为（含差多少进阶） */}
        <Descriptions size="small" column={1} colon={false}>
          <Descriptions.Item label="修为" labelStyle={{ width: 48 }}>
            <div style={{ width: "100%" }}>
              <Text>{fmt(exp)}</Text>
              {expNeeded > 0 && (
                <Text type="secondary">
                  {" "}/ {fmt(expNeeded)}
                  {expLack != null && (
                    <>
                      {" "}· 差 <Text type={expLack === 0 ? "success" : "warning"}>{fmt(expLack)}</Text> 进阶
                    </>
                  )}
                </Text>
              )}
              <Progress
                percent={expPct}
                showInfo={false}
                size="small"
                strokeColor={expPct >= 100 ? "#52c41a" : "#d48806"}
                style={{ margin: "6px 0 0" }}
              />
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Space>

      {open && <BagDetail bag={bag} search={search} onlyHas={onlyHas} constants={constants} />}
    </Card>
  );
}

/** 展开后的背包详情（懒加载，仅在展开时渲染） */
function BagDetail({
  bag, search, onlyHas, constants,
}: {
  bag: Bag; search: string; onlyHas: boolean; constants: GameConstants | null;
}) {
  const p = bag.player!;
  const st = bag.stamina;
  const realm = bag.realm;
  const matNames = constants?.materialNames || {};
  const matCats = constants?.materialCategory || {};
  const realmNames = constants?.realmNames || {};
  const nameOf = (k: string) => matNames[k] || k;
  const catOf = (k: string) => matCats[k] || "其他";

  // 进阶状态
  const breakText = realm
    ? realm.can_break
      ? "可突破"
      : realm.at_cap
      ? "已达当前上限"
      : realm.at_wall
      ? `瓶颈（${realm.level_wall_name || ""}）`
      : realm.block_reason || "修为不足"
    : null;

  let entries = Object.entries(bag.materials || {});
  if (onlyHas) entries = entries.filter(([, v]) => v > 0);
  if (search) entries = entries.filter(([k]) => nameOf(k).toLowerCase().includes(search) || k.toLowerCase().includes(search));

  // 按分类分组
  const groups: Record<string, [string, number][]> = {};
  for (const [k, v] of entries) {
    const c = catOf(k);
    (groups[c] = groups[c] || []).push([k, v]);
  }
  const sortedCats = Object.keys(groups).sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));

  return (
    <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Descriptions size="small" column={2} colon={false}>
          <Descriptions.Item label="灵石"><Text type="warning">{fmt(p.spirit_stone)}</Text></Descriptions.Item>
          <Descriptions.Item label="境界">{realmText(p, realmNames)}</Descriptions.Item>
          <Descriptions.Item label="门派">{p.sect_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="修为">{fmt(p.exp)}</Descriptions.Item>
          {p.great_dao_origin ? (
            <Descriptions.Item label="大道本源">{fmt(p.great_dao_origin)}</Descriptions.Item>
          ) : null}
          {realm?.next_stage != null && (
            <Descriptions.Item label="进阶目标">
              {realm.next_realm_name || ""} {realm.next_stage} 阶
              {realm.level_wall_name ? `（${realm.level_wall_name}）` : ""}
            </Descriptions.Item>
          )}
          {breakText && (
            <Descriptions.Item label="进阶状态">
              <Tag color={realm?.can_break ? "success" : "warning"}>{breakText}</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>

        {!entries.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配物品" />}

        {sortedCats.map((cat) => {
          const items = groups[cat].sort((a, b) => nameOf(a[0]).localeCompare(nameOf(b[0]), "zh-CN"));
          return (
            <div key={cat}>
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ color: "#d48806" }}>
                  {cat} <Text type="secondary">({items.length}种)</Text>
                </Text>
              </div>
              {/* 物品格子：Statistic 显示数量，一次全展示 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
                  gap: 8,
                }}
              >
                {items.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: "6px 10px",
                      background: "#fafafa",
                    }}
                  >
                    <Statistic title={nameOf(k)} value={Number(v)} valueStyle={{ fontSize: 16 }} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Space>
    </div>
  );
}
