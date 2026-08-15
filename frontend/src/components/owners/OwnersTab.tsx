"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftOutlined, ReloadOutlined, TeamOutlined, UserOutlined,
} from "@ant-design/icons";
import {
  Alert, Button, Card, Empty, InputNumber, Progress, Select, Space, Tabs, Tag, Typography,
} from "antd";
import type { Account, Bag, GameConstants, GradeTier, Owner, SeclusionStatus } from "@/types";
import { fmt, staminaText } from "@/lib/format";
import { defaultTierForRealm } from "@/lib/farm";
import { sectColor } from "@/lib/sect";
import { useSeclusion } from "@/hooks/useSeclusion";
import BagCard from "@/components/bags/BagCard";
import { GapCard } from "@/components/gap/GapTab";

const { Text } = Typography;

export default function OwnersTab({
  accounts, owners, bags, constants, loadBagsFor,
}: {
  accounts: Account[]; owners: Owner[]; bags: Bag[]; constants: GameConstants | null;
  loadBagsFor: (usernames: string[], onOne?: (i: number, bag: Bag) => void) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  // 归属人名单 = 独立存储的 owners + 账号里可能存在的归属
  const ownerNames = Array.from(
    new Set([...owners.map((o) => o.name), ...accounts.map((a) => a.owner).filter((o): o is string => !!o)])
  );
  const unassigned = accounts.filter((a) => !a.owner);
  const ownerColor = (name: string) => owners.find((o) => o.name === name)?.color;

  if (selected) {
    const ownerAccounts = accounts.filter((a) => a.owner === selected);
    return (
      <PersonDetail
        owner={selected}
        ownerColor={ownerColor(selected)}
        accounts={ownerAccounts}
        bags={bags}
        constants={constants}
        loadBagsFor={loadBagsFor}
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
            {label === "未分配" ? (
              <TeamOutlined style={{ color: "var(--ink-3)" }} />
            ) : (
              <UserOutlined style={{ color: ownerColor(label) || "var(--slate)" }} />
            )}
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
        <Progress percent={s.pct} showInfo={false} size="small" strokeColor="var(--accent)" style={{ marginTop: 4 }} />
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
  owner, ownerColor, accounts, bags, constants, onBack, loadBagsFor,
}: {
  owner: string; ownerColor?: string; accounts: Account[]; bags: Bag[]; constants: GameConstants | null;
  onBack: () => void; loadBagsFor: (usernames: string[], onOne?: (i: number, bag: Bag) => void) => Promise<void>;
}) {
  const [tierKey, setTierKey] = useState("");
  const [pieces, setPieces] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  // 闭关状态（挂载时拉一次，展示是否闭关 / 已凝 / 待凝修为）
  const secl = useSeclusion(accounts, false);
  // 本归属的背包数据：初始化取全局已有数据，刷新时只拉当前归属账号
  const [detailBags, setDetailBags] = useState<Bag[]>(() =>
    accounts.map((a) => bags.find((b) => b.username === a.username)).filter(Boolean) as Bag[]
  );

  const tiers = constants?.gradeTiers || [];
  const matNames = constants?.materialNames || {};
  const realmNames = constants?.realmNames || {};
  const dungeonSchedule = constants?.dungeonSchedule || { odd: {}, even: {} };
  const dungeonBonus = constants?.dungeonBonus || {};
  const realmOverride = constants?.realmOverride || {};
  const nameOf = (k: string) => matNames[k] || k;
  const bagOf = (username: string) => detailBags.find((b) => b.username === username);

  // 只拉当前归属下的账号（并发流式，拉一个更新一个）
  const refreshOwner = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const usernames = accounts.map((a) => a.username);
    // 先置占位
    setDetailBags(usernames.map((u) => ({ username: u, ok: false, loading: true })));
    let done = 0;
    await loadBagsFor(usernames, (_i, bag) => {
      done++;
      setDetailBags((prev) => {
        const next = [...prev];
        const idx = next.findIndex((b) => b.username === bag.username);
        if (idx >= 0) next[idx] = bag;
        return next;
      });
      if (done === usernames.length) setRefreshing(false);
    });
    setRefreshing(false);
  };

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
  // 体力已满的账号（用于提示）
  const fullAccounts = okItems.filter((it) => {
    const st = it.bag!.stamina;
    return st?.current != null && st?.max != null && st.current >= st.max;
  });

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
        <UserOutlined style={{ color: ownerColor || "var(--accent)" }} />
        <Text strong style={{ fontSize: 18, color: ownerColor || undefined }}>{owner}</Text>
        <Tag>{accounts.length} 个账号</Tag>
        <span style={{ flex: 1 }} />
        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={refreshOwner}>
          刷新该归属
        </Button>
      </Space>

      {/* 体力总览 */}
      <Card size="small" title="💪 体力总览" style={{ marginBottom: 16 }}>
        {/* 有账号体力满时提示（没有则不显示） */}
        {fullAccounts.length > 0 && (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 12 }}
            message={
              <span>
                体力已满：
                {fullAccounts.map((it, i) => (
                  <span key={it.account.username}>
                    <Text strong style={{ color: "var(--bamboo)" }}>
                      {it.bag!.player?.name || it.account.username}
                    </Text>
                    {i < fullAccounts.length - 1 ? "、" : ""}
                  </span>
                ))}
              </span>
            }
          />
        )}
        {okItems.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {okItems.map((it) => {
              const st = it.bag!.stamina;
              const pct = st?.max ? Math.round(((st.current || 0) / st.max) * 100) : 0;
              const name = it.bag!.player?.name || it.account.username;
              return (
                <div key={it.account.username}>
                  <Space align="end" style={{ justifyContent: "space-between", width: "100%" }}>
                    <Text strong ellipsis style={{ maxWidth: 110 }}>{name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{staminaText(st)}</Text>
                  </Space>
                  <Progress percent={pct} showInfo={false} size="small" strokeColor={pct < 30 ? "var(--terracotta)" : pct < 60 ? "var(--ochre)" : "var(--bamboo)"} style={{ marginTop: 2 }} />
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
          <Text strong style={{ color: "var(--accent)" }}>升段缺口计算</Text>
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

      {/* 按账号 Tab 切换（门派（名称））；禁滑动切换，点击后自动滚动居中 */}
      <Tabs
        type="card"
        className="account-tabs"
        onChange={() => {
          // 让当前激活的账号 tab 滚动到导航栏正中间（移动端友好）
          requestAnimationFrame(() => {
            const active = document.querySelector(
              ".account-tabs .ant-tabs-tab-active .ant-tabs-tab-btn"
            );
            active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          });
        }}
        items={accounts.map((a) => {
          const bag = bagOf(a.username);
          const tabName = bag?.player?.name || a.username;
          const tabSect = bag?.player?.sect_name || "散修";
          return {
            key: a.username,
            label: (
              <span>
                <span style={{ color: sectColor(tabSect) }}>{tabSect}</span>
                （{tabName}）
              </span>
            ),
            children: !bag ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据，请先「全部刷新」" />
            ) : bag.loading ? (
              <Card size="small">
                <Space>
                  <Text strong>{tabName}</Text>
                  <Tag color="processing">加载中…</Tag>
                </Space>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <SeclusionStatusCard status={secl.statuses[a.username]} />
                <BagCard bag={bag} owner={owner} search="" onlyHas constants={constants} />
                {tier && (
                  <GapCard
                    bag={bag}
                    tier={tier}
                    pieces={pieces}
                    onlyLack
                    defaultOpen
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

/** 闭关状态卡：是否闭关 + 已凝修为 / 待凝修为 */
function SeclusionStatusCard({ status }: { status?: SeclusionStatus }) {
  const rt = status?.realtime;
  const isActive = rt?.status === "active";
  const isExiting = rt?.status === "exiting";

  const badge = !status ? (
    <Tag color="default" style={{ borderRadius: 4 }}>加载中…</Tag>
  ) : rt?.error ? (
    <Tag color="#C47B6D" style={{ borderRadius: 4 }}>查询失败</Tag>
  ) : isActive ? (
    <Tag color="#5B7B8C" style={{ borderRadius: 4 }}>闭关中</Tag>
  ) : isExiting ? (
    <Tag color="#C9A15F" style={{ borderRadius: 4 }}>出关中…</Tag>
  ) : (
    <Tag style={{ background: "var(--muted)", border: "none", color: "var(--ink-2)", borderRadius: 4 }}>未闭关</Tag>
  );

  return (
    <Card size="small">
      <Space wrap size={16}>
        <Space size={8} align="end">
          <Text type="secondary" style={{ fontSize: 12 }}>闭关</Text>
          {badge}
        </Space>
        <Space size={8} align="end">
          <Text type="secondary" style={{ fontSize: 12 }}>已凝修为</Text>
          <Text className="tabular-nums" style={{ fontWeight: 600 }}>
            {rt?.solidified_exp != null ? fmt(rt.solidified_exp) : "-"}
          </Text>
        </Space>
        <Space size={8} align="end">
          <Text type="secondary" style={{ fontSize: 12 }}>待凝修为</Text>
          <Text className="tabular-nums" style={{ fontWeight: 600 }}>
            {rt?.pending_exp != null ? fmt(rt.pending_exp) : "-"}
          </Text>
        </Space>
      </Space>
    </Card>
  );
}
