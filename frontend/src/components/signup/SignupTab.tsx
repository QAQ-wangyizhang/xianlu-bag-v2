"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert, App, Button, Card, Empty, Space, Switch, Tag, Typography,
} from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import type { Account, Owner } from "@/types";
import { apiGet, apiPost } from "@/lib/api";
import { fmtWan } from "@/lib/format";
import SectTag from "@/components/SectTag";
import RealmTag from "@/components/RealmTag";
import OwnerTag from "@/components/OwnerTag";

const { Text } = Typography;

const REALM_CN: Record<string, string> = {
  lianqi: "炼气", zhuji: "筑基", jindan: "金丹", yuanying: "元婴",
  huashen: "化神", lianxu: "炼虚", heti: "合体", dacheng: "大乘", dujie: "渡劫",
};

interface TodayInfo {
  session_id?: string;
  session_name?: string;
  status?: string;
  registers_open_at?: string;
  registers_close_at?: string;
  can_register?: boolean;
  has_event?: boolean;
}

interface SignupAccount {
  username: string;
  enabled: boolean;
  realm_ok?: boolean;
  faction_joined?: boolean;
  player_name?: string;
  sect_name?: string;
  major_realm?: string;
  stage?: number;
  today?: { status: string; reason?: string; time?: string; session_name?: string } | null;
}

export default function SignupTab({
  accounts, owners,
}: {
  accounts: Account[]; owners: Owner[];
}) {
  const { message } = App.useApp();
  const [today, setToday] = useState<TodayInfo | null>(null);
  const [items, setItems] = useState<SignupAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const ownerOf = (username: string) => accounts.find((a) => a.username === username)?.owner || "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<{ today: TodayInfo | null; accounts: SignupAccount[] }>("/api/faction/signup/status");
      setToday(d.today);
      setItems(d.accounts || []);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (username: string, enabled: boolean) => {
    try {
      await apiPost("/api/faction/signup/toggle", { username, enabled });
      setItems((prev) => prev.map((i) => (i.username === username ? { ...i, enabled } : i)));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const toggleOwner = async (ownerName: string, enabled: boolean) => {
    const targets = items.filter((i) => ownerOf(i.username) === ownerName);
    try {
      await Promise.all(targets.map((t) => apiPost("/api/faction/signup/toggle", { username: t.username, enabled })));
      setItems((prev) => prev.map((i) => (ownerOf(i.username) === ownerName ? { ...i, enabled } : i)));
      message.success(`${ownerName} 名下 ${targets.length} 个账号已${enabled ? "开启" : "关闭"}`);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const d = await apiPost<{ results: { username: string; signed: boolean; reason: string }[] }>("/api/faction/signup/run");
      message.success("执行完成");
      load();
      d.results?.forEach((r) => {
        if (r.signed) message.success(`${r.username} 报名成功`);
      });
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (!items.length && !loading) {
    return <Empty description="还没有账号" style={{ padding: "48px 0" }} />;
  }

  // 归属人分组
  const ownerNames = Array.from(new Set([...owners.map((o) => o.name), ...items.map((i) => ownerOf(i.username)).filter(Boolean)]));

  const statusTag = (item: SignupAccount) => {
    const t = item.today;
    if (!item.enabled) return <Tag style={{ background: "var(--muted)", border: "none", color: "var(--ink-2)", borderRadius: 4 }}>未开启</Tag>;
    if (t?.status === "signed") {
      return (
        <Tag color="#6FA287" style={{ borderRadius: 4 }}>
          {t.session_name ? `${t.session_name} ` : ""}报名成功 {t.time || ""}
        </Tag>
      );
    }
    if (t?.status === "failed") return <Tag color="#C47B6D" style={{ borderRadius: 4 }}>{t.reason || "报名失败"}</Tag>;
    if (!item.realm_ok) return <Tag color="#C47B6D" style={{ borderRadius: 4 }}>炼气5段以下不能报名</Tag>;
    if (!item.faction_joined) return <Tag color="#C9A15F" style={{ borderRadius: 4 }}>未加入势力</Tag>;
    if (!today || !today.has_event) return <Tag style={{ background: "var(--muted)", border: "none", color: "var(--ink-2)", borderRadius: 4 }}>今日无场次</Tag>;
    return <Tag color="#5B7B8C" style={{ borderRadius: 4 }}>待报名</Tag>;
  };

  const renderAccountRow = (item: SignupAccount) => (
    <div
      key={item.username}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        border: "1px solid var(--line)",
        borderRadius: 10,
        background: "#fff",
        flexWrap: "wrap",
      }}
    >
      <Text strong>{item.player_name || item.username}</Text>
      <Tag style={{ background: "var(--muted)", border: "none", color: "var(--slate)", fontSize: 12 }}>
        {item.username}
      </Tag>
      {item.sect_name && <SectTag name={item.sect_name} />}
      {item.major_realm && (
        <RealmTag realmKey={item.major_realm} name={`${REALM_CN[item.major_realm] || item.major_realm} · ${item.stage ?? "?"}阶`} />
      )}
      {ownerOf(item.username) && <OwnerTag name={ownerOf(item.username)} color={owners.find((o) => o.name === ownerOf(item.username))?.color} />}
      <span style={{ flex: 1 }} />
      {statusTag(item)}
      <Switch
        size="small"
        checked={item.enabled}
        onChange={(v) => toggle(item.username, v)}
        checkedChildren="开"
        unCheckedChildren="关"
      />
    </div>
  );

  return (
    <div>
      {/* 今日场次 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text strong style={{ fontSize: 16, color: "var(--accent)" }}>势力战 · 自动报名</Text>
          {loading ? (
            <Tag color="processing" style={{ borderRadius: 4 }}>加载中…</Tag>
          ) : today ? (
            <>
              <Tag color="#5B7B8C" style={{ borderRadius: 4 }}>
                {today.session_name || "今日场次"}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                报名窗口 {today.registers_open_at ? today.registers_open_at.slice(11, 16) : "?"} - {today.registers_close_at ? today.registers_close_at.slice(11, 16) : "?"}
              </Text>
            </>
          ) : (
            <Tag style={{ background: "var(--muted)", border: "none", color: "var(--ink-2)", borderRadius: 4 }}>今日无场次（周一/周三/周五 15:30 报名）</Tag>
          )}
          <span style={{ flex: 1 }} />
          <Button icon={<PlayCircleOutlined />} loading={running} onClick={runNow}>
            立即执行
          </Button>
        </Space>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="开启后每天 15:30 报名窗口自动为账号报名；报名结果记录在当天。练气5段以下、未加入势力、非报名时段等会自动跳过并显示原因。"
        />
      </Card>

      {/* 归属人分组 */}
      {ownerNames.map((ownerName) => {
        const groupItems = items.filter((i) => ownerOf(i.username) === ownerName);
        const allOn = groupItems.length > 0 && groupItems.every((i) => i.enabled);
        const someOn = groupItems.some((i) => i.enabled);
        return (
          <Card
            key={ownerName}
            size="small"
            style={{ marginBottom: 12 }}
            title={
              <Space wrap>
                <OwnerTag name={ownerName} color={owners.find((o) => o.name === ownerName)?.color} />
                <Text type="secondary" style={{ fontSize: 12 }}>{groupItems.length} 个账号</Text>
              </Space>
            }
            extra={
              <Switch
                size="small"
                checked={allOn}
                onChange={(v) => toggleOwner(ownerName, v)}
                checkedChildren="全开"
                unCheckedChildren="全关"
              />
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {groupItems.map(renderAccountRow)}
            </div>
          </Card>
        );
      })}

      {/* 未分配账号 */}
      {(() => {
        const unassigned = items.filter((i) => !ownerOf(i.username));
        if (!unassigned.length) return null;
        return (
          <Card
            size="small"
            title={<Tag style={{ background: "var(--muted)", border: "none", color: "var(--ink-2)", borderRadius: 4 }}>未分配</Tag>}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {unassigned.map(renderAccountRow)}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
