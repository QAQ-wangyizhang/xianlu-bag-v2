"use client";

import { useState } from "react";
import {
  Button, Card, Col, Descriptions, Divider, Empty, Progress, Row, Skeleton, Space, Statistic, Tag, Typography,
} from "antd";
import { CaretRightOutlined, GlobalOutlined } from "@ant-design/icons";
import type { Bag, GameConstants } from "@/types";
import { fmt, fmtDur, fmtWan, realmText } from "@/lib/format";
import SectTag from "@/components/SectTag";
import OwnerTag from "@/components/OwnerTag";
import RealmTag from "@/components/RealmTag";
import { realmColor } from "@/lib/realm";
import CollapseBox from "@/components/CollapseBox";

const { Text } = Typography;

const CAT_ORDER = ["强化材料", "突破辅料", "功法", "消耗品", "礼盒", "功能道具", "其他"];

/** 材料分类 → 图标路径 */
const CAT_ICONS: Record<string, string> = {
  强化材料: "/icons/mat-strengthen.png",
  突破辅料: "/icons/mat-breakthrough.png",
  功法: "/icons/mat-skill.png",
  消耗品: "/icons/mat-consumable.png",
  礼盒: "/icons/mat-gift.png",
};

/**
 * 账号背包卡片（瀑布流）：默认折叠
 * - 收起：标题（serif 名 / 扁平 Tag / 灵石门派境界）+ 体力、修为横排进度
 * - 展开：双栏属性 + 物品格子（一次全展示）
 * - forceOpen：搜索匹配时强制展开（外部控制）
 */
export default function BagCard({
  bag, owner, ownerColor, search, onlyHas, constants, forceOpen, gameBase,
}: {
  bag: Bag; owner?: string; ownerColor?: string; search: string; onlyHas: boolean; constants: GameConstants | null; forceOpen?: boolean; gameBase?: string;
}) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;
  const toggle = () => setOpen((o) => !o);

  // 加载中（骨架屏）
  if (bag.loading) {
    return (
      <Card size="small">
        <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 2 }} />
      </Card>
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
  const realmNames = constants?.realmNames || {};
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

  const labelStyle = { color: "var(--ink-2)", width: 56 } as const;

  const title = (
    <div
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "100%" }}
      onClick={toggle}
    >
      {/* 箭头独立，垂直居中于整个标题块（换行时也在两行中间） */}
      <CaretRightOutlined
        style={{
          transition: "transform 200ms",
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
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
      </div>
    </div>
  );

  return (
    <Card size="small" title={title}>
      {/* 灵石 / 门派 / 境界 */}
      <Descriptions column={{ xs: 1, sm: 3 }} size="small" styles={{ label: labelStyle }}>
        <Descriptions.Item label="灵石">
          <span className="tabular-nums" style={{ color: "var(--ochre)", fontWeight: 500 }}>
            {fmtWan(p.spirit_stone)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="门派">{p.sect_name || "-"}</Descriptions.Item>
        <Descriptions.Item label="境界">{realmText(p, realmNames)}</Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: "12px 0" }} />

      {/* 体力 / 修为（横排紧凑 + 内联百分比进度） */}
      <Descriptions column={1} size="small" styles={{ label: labelStyle }}>
        <Descriptions.Item label="体力">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, width: "100%", flexWrap: "wrap" }}>
            <span className="tabular-nums" style={{ fontSize: 13 }}>
              {st ? `${st.current}/${st.max}` : "-"}
            </span>
            {staminaFull > 0 && (
              <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                差 {fmt(staminaFull)} 回满{fullTimeSec ? ` · 约 ${fmtDur(fullTimeSec)}` : ""}
              </span>
            )}
            {st && staminaFull === 0 && (
              <span style={{ fontSize: 12, color: "var(--bamboo)" }}>已满</span>
            )}
            <Progress
              percent={staminaPct}
              size="small"
              strokeColor={staminaPct < 30 ? "var(--terracotta)" : staminaPct < 60 ? "var(--ochre)" : "var(--bamboo)"}
              style={{ flex: 1, maxWidth: 120, margin: 0 }}
              format={(pp) => <span className="tabular-nums" style={{ fontSize: 11 }}>{pp}%</span>}
            />
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="修为">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, width: "100%", flexWrap: "wrap" }}>
            <span className="tabular-nums" style={{ fontSize: 13 }}>
              {fmt(exp)} / {fmt(expNeeded)}
            </span>
            {expLack != null && (
              <span style={{ fontSize: 12, color: expLack === 0 ? "var(--bamboo)" : "var(--ink-2)" }}>
                差 {fmt(expLack)} 进阶
              </span>
            )}
            <Progress
              percent={expPct}
              size="small"
              strokeColor={expPct >= 100 ? "var(--bamboo)" : "var(--accent)"}
              style={{ flex: 1, maxWidth: 120, margin: 0 }}
              format={(pp) => <span className="tabular-nums" style={{ fontSize: 11 }}>{pp}%</span>}
            />
          </div>
        </Descriptions.Item>
      </Descriptions>

      {/* 展开：双栏属性 + 物品格子（高度动画） */}
      <CollapseBox open={isOpen}>
        <BagDetail bag={bag} search={search} onlyHas={onlyHas} constants={constants} />
      </CollapseBox>

      {/* 免登录进入游戏官网：直接打开「设置」里配置的爬取地址（游戏服 Base），并注入该账号 Cookie */}
      <div style={{ marginTop: 10, textAlign: "right" }}>
        <Button
          size="small"
          type="link"
          icon={<GlobalOutlined />}
          disabled={!gameBase}
          title={gameBase || "未获取到游戏服地址，请检查设置里的爬取地址"}
          onClick={() => {
            // 官网与游戏 API 同源同 Cookie（immortal_session）：直连 Base 即免登录
            const url = new URL("/", gameBase);
            window.open(`${url.origin}/?u=${encodeURIComponent(bag.username)}`, "_blank");
          }}
        >
          进入官网
        </Button>
      </div>
    </Card>
  );
}

/** 展开详情：双栏属性 + 物品格子 */
function BagDetail({
  bag, search, onlyHas, constants,
}: {
  bag: Bag; search: string; onlyHas: boolean; constants: GameConstants | null;
}) {
  const p = bag.player!;
  const realm = bag.realm;
  const matNames = constants?.materialNames || {};
  const matCats = constants?.materialCategory || {};
  const realmNames = constants?.realmNames || {};
  const nameOf = (k: string) => matNames[k] || k;
  const catOf = (k: string) => matCats[k] || "其他";

  // 进阶状态（语义色）
  const exp = realm?.exp ?? p.exp ?? 0;
  const expNeeded = realm?.exp_needed ?? 0;
  const breakStatus = realm
    ? realm.can_break
      ? { text: "可突破", color: "#6FA287" }
      : realm.at_wall
      ? { text: "瓶颈", color: "#C9A15F" }
      : exp < expNeeded
      ? { text: "修为不足", color: "#C47B6D" }
      : { text: "正常", color: "#6E8CA0" }
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

  const labelStyle = { color: "var(--ink-2)", width: 80 } as const;

  return (
    <>
      <Divider style={{ margin: "12px 0" }} />
      <Row gutter={[16, 8]}>
        <Col xs={24} sm={12}>
          <Descriptions column={1} size="small" styles={{ label: labelStyle }}>
            <Descriptions.Item label="境界">
              <span className="serif-title" style={{ color: realmColor(p.major_realm) }}>{realmText(p, realmNames)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="门派">{p.sect_name || "-"}</Descriptions.Item>
            <Descriptions.Item label="阵营">{p.faction_name || "-"}</Descriptions.Item>
          </Descriptions>
        </Col>
        <Col xs={24} sm={12}>
          <Descriptions column={1} size="small" styles={{ label: labelStyle }}>
            {p.great_dao_origin ? (
              <Descriptions.Item label="大道本源">
                <span className="tabular-nums">{fmt(p.great_dao_origin)}</span>
              </Descriptions.Item>
            ) : null}
            {realm?.next_stage != null && (
              <Descriptions.Item label="进阶目标">
                {realm.next_realm_name || ""} {realm.next_stage} 阶
                {realm.level_wall_name ? `（${realm.level_wall_name}）` : ""}
              </Descriptions.Item>
            )}
            {breakStatus && (
              <Descriptions.Item label="进阶状态">
                <Tag color={breakStatus.color} style={{ borderRadius: 4, marginInlineEnd: 0 }}>
                  {breakStatus.text}
                </Tag>
                {realm?.at_wall && realm?.block_reason && (
                  <span style={{ fontSize: 12, color: "var(--terracotta)", marginLeft: 4 }}>
                    {realm.block_reason}
                  </span>
                )}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0 12px" }} />

      {!entries.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配物品" />}

      {/* 物品分类：serif 分类标题 + 格子（名称小字 + 数量大字） */}
      {sortedCats.map((cat) => {
        const items = groups[cat].sort((a, b) => nameOf(a[0]).localeCompare(nameOf(b[0]), "zh-CN"));
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div className="serif-title" style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              {CAT_ICONS[cat] && (
                <img src={CAT_ICONS[cat]} alt="" style={{ width: 16, height: 16, objectFit: "contain", display: "block" }} />
              )}
              {cat} <span style={{ color: "var(--ink-3)", fontSize: 12 }}>({items.length}种)</span>
            </div>
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
                    background: "var(--cell)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 2 }}>
                    {nameOf(k)}
                  </div>
                  <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                    {fmt(v)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
