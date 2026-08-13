"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftOutlined, TeamOutlined, UserOutlined,
} from "@ant-design/icons";
import {
  Button, Card, Empty, InputNumber, Progress, Select, Space, Tabs, Tag, Typography,
} from "antd";
import type { Account, Bag, GameConstants, GradeTier } from "@/types";
import { fmt, staminaText } from "@/lib/format";
import { defaultTierForRealm } from "@/lib/farm";
import BagCard from "@/components/bags/BagCard";
import { GapCard } from "@/components/gap/GapTab";

const { Text } = Typography;

export default function OwnersTab({
  accounts, owners, bags, constants,
}: {
  accounts: Account[]; owners: string[]; bags: Bag[]; constants: GameConstants | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  // 归属人名单 = 独立存储的 owners + 账号里可能存在的归属
  const ownerNames = Array.from(
    new Set([...owners, ...accounts.map((a) => a.owner).filter((o): o is string => !!o)])
  );
  const unassigned = accounts.filter((a) => !a.owner);

  if (selected) {
    const ownerAccounts = accounts.filter((a) => a.owner === selected);
    return (
      <PersonDetail
        owner={selected}
        accounts={ownerAccounts}
        bags={bags}
        constants={constants}
        onBack={() => setSelected(null)}
      />
    );
  }

  if (!accounts.length) {
    return <Empty description="还没有绑定账号，去「账号管理」添加" style={{ padding: "32px 0" }} />;
  }

  // 聚合某组账号的体力
  const sumStamina = (accs: Account[]) => {
    let cur = 0, max = 0;
    for (const a of accs) {
      const st = bags.find((b) => b.username === a.username && b.ok)?.stamina;
      if (st?.current != null && st?.max) { cur += st.current; max += st.max; }
    }
    return { cur, max, pct: max > 0 ? Math.round((cur / max) * 100) : 0 };
  };

  const ownerCard = (label: string, accs: Account[]) => {
    const s = sumStamina(accs);
    return (
      <Card
        hoverable
        size="small"
        onClick={() => setSelected(label)}
        title={
          <Space>
            {label === "未分配" ? <TeamOutlined /> : <UserOutlined />}
            <Text strong>{label}</Text>
          </Space>
        }
        extra={<Tag>{accs.length} 账号</Tag>}
      >
        <Text type="secondary">体力总览</Text>
        <div style={{ marginTop: 4 }}>
          <Text strong style={{ fontSize: 18 }}>{fmt(s.cur)}</Text>
          <Text type="secondary"> / {fmt(s.max)}</Text>
        </div>
        <Progress percent={s.pct} showInfo={false} size="small" strokeColor="#1677ff" style={{ marginTop: 4 }} />
      </Card>
    );
  };

  return (
    <div>
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        按归属人查看账号：点击进入后可用 Tab 切换该人名下的账号，查看体力 / 包裹 / 升段缺口。
      </Text>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {ownerNames.map((o) => ownerCard(o, accounts.filter((a) => a.owner === o)))}
        {unassigned.length > 0 && ownerCard("未分配", unassigned)}
      </div>
    </div>
  );
}

/** 某归属人详情：体力总览 + 按账号 Tab 查看包裹 / 升段缺口 */
function PersonDetail({
  owner, accounts, bags, constants, onBack,
}: {
  owner: string; accounts: Account[]; bags: Bag[]; constants: GameConstants | null; onBack: () => void;
}) {
  const [tierKey, setTierKey] = useState("");
  const [pieces, setPieces] = useState(10);

  const tiers = constants?.gradeTiers || [];
  const matNames = constants?.materialNames || {};
  const realmNames = constants?.realmNames || {};
  const dungeonSchedule = constants?.dungeonSchedule || { odd: {}, even: {} };
  const dungeonBonus = constants?.dungeonBonus || {};
  const realmOverride = constants?.realmOverride || {};
  const nameOf = (k: string) => matNames[k] || k;
  const bagOf = (username: string) => bags.find((b) => b.username === username);

  // 默认境界跟随
  useEffect(() => {
    if (!tierKey && tiers.length) {
      const firstOK = accounts.map((a) => bagOf(a.username)).find((b) => b?.ok);
      const def = firstOK?.player?.major_realm
        ? defaultTierForRealm(firstOK.player.major_realm)
        : "huashen";
      setTierKey(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiers, accounts]);

  const tier = tiers.find((t) => t.key === tierKey);

  // 体力总览
  const okItems = accounts
    .map((a) => ({ account: a, bag: bagOf(a.username) }))
    .filter((it) => it.bag?.ok);

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
        <UserOutlined style={{ color: "#d48806" }} />
        <Text strong style={{ fontSize: 18 }}>{owner}</Text>
        <Tag>{accounts.length} 个账号</Tag>
      </Space>

      {/* 体力总览 */}
      <Card size="small" title="💪 体力总览" style={{ marginBottom: 16 }}>
        {okItems.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {okItems.map((it) => {
              const st = it.bag!.stamina;
              const pct = st?.max ? Math.round(((st.current || 0) / st.max) * 100) : 0;
              const name = it.bag!.player?.name || it.account.username;
              return (
                <div key={it.account.username}>
                  <Space style={{ justifyContent: "space-between", width: "100%" }}>
                    <Text strong ellipsis style={{ maxWidth: 110 }}>{name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{staminaText(st)}</Text>
                  </Space>
                  <Progress percent={pct} showInfo={false} size="small" strokeColor={pct < 30 ? "#ff4d4f" : pct < 60 ? "#faad14" : "#52c41a"} style={{ marginTop: 2 }} />
                </div>
              );
            })}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无体力数据，请先「全部刷新」" />
        )}
      </Card>

      {/* 升段缺口参数 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text strong style={{ color: "#d48806" }}>升段缺口计算</Text>
          <Space>
            <Text type="secondary">目标境界段</Text>
            <Select
              value={tierKey}
              onChange={setTierKey}
              style={{ width: 220 }}
              options={tiers.map((t: GradeTier) => ({ value: t.key, label: `${t.name}（${t.range}级 · 单件）` }))}
            />
          </Space>
          <Space>
            <Text type="secondary">装备件数</Text>
            <InputNumber min={1} max={10} value={pieces} onChange={(v) => setPieces(Math.max(1, Number(v) || 10))} />
          </Space>
        </Space>
      </Card>

      {/* 按账号 Tab 切换 */}
      <Tabs
        type="card"
        items={accounts.map((a) => {
          const bag = bagOf(a.username);
          return {
            key: a.username,
            label: a.username,
            children: !bag ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据，请先「全部刷新」" />
            ) : bag.loading ? (
              <Card size="small">
                <Space>
                  <Text strong>{a.username}</Text>
                  <Tag color="processing">加载中…</Tag>
                </Space>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <BagCard bag={bag} owner={owner} search="" onlyHas constants={constants} />
                {tier && (
                  <GapCard
                    bag={bag}
                    tier={tier}
                    pieces={pieces}
                    onlyLack
                    nameOf={nameOf}
                    realmNames={realmNames}
                    dungeonSchedule={dungeonSchedule}
                    dungeonBonus={dungeonBonus}
                    realmOverride={realmOverride}
                  />
                )}
              </div>
            ),
          };
        })}
      />
    </div>
  );
}
