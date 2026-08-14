"use client";

import { useEffect, useState } from "react";
import { App, Button, Card, ColorPicker, Empty, Input, Modal, Popconfirm, Space, Tag, Typography } from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
import type { Account, Owner } from "@/types";
import { apiGet, apiPost } from "@/lib/api";
import OwnerTag from "@/components/OwnerTag";
import AddAccountModal from "./AddAccountModal";

const { Text } = Typography;
const DEFAULT_OWNER_COLOR = "#6E8CA0";

/** 移动端检测（与 CSS 断点一致：≤768px 视为移动端） */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export default function AccountsTab({
  accounts, owners, onChanged,
}: {
  accounts: Account[]; owners: Owner[]; onChanged: () => void;
}) {
  const { message } = App.useApp();
  const [showModal, setShowModal] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [dragUser, setDragUser] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const isMobile = useIsMobile();
  // 移动端：点击账号格子弹出的归属设置目标
  const [assignTarget, setAssignTarget] = useState<Account | null>(null);

  const ownerColor = (name: string) => owners.find((o) => o.name === name)?.color;

  const assign = async (username: string, owner: string) => {
    setBusy(username);
    try {
      await apiPost("/api/accounts/owner", { username, owner });
      message.success(owner ? `已分配 ${owner}` : "已清除归属");
      onChanged();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const setColor = async (name: string, color: string) => {
    setBusy("__clr_" + name);
    try {
      await apiPost("/api/owners/color", { name, color });
      message.success(`已更新 ${name} 的颜色`);
      onChanged();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const createOwner = async () => {
    const name = newOwner.trim();
    if (!name) { message.error("请输入归属人名字"); return; }
    if (owners.some((o) => o.name === name)) { message.error("该归属人已存在"); return; }
    setBusy("__create__");
    try {
      await apiPost("/api/owners", { name });
      message.success(`已创建归属人 ${name}`);
      setNewOwner("");
      onChanged();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const removeOwner = async (name: string) => {
    setBusy("__rm_" + name);
    try {
      await apiPost("/api/owners/remove", { name });
      message.success(`已删除归属人 ${name}，其名下账号已置为未分配`);
      onChanged();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const removeAccount = async (username: string) => {
    setBusy("__rmacc_" + username);
    try {
      await apiPost("/api/accounts/remove", { username });
      message.success("已删除");
      onChanged();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setBusy("");
    }
  };

  // 归属人圆角卡片（名称靠左 + 删除右上角；拖拽目标）
  const ownerCard = (name: string) => {
    const count = accounts.filter((a) => a.owner === name).length;
    const over = dragOver === name;
    const color = ownerColor(name) || DEFAULT_OWNER_COLOR;
    return (
      <div
        key={name}
        onDragOver={(e) => { e.preventDefault(); setDragOver(name); }}
        onDragLeave={() => setDragOver((o) => (o === name ? null : o))}
        onDrop={(e) => {
          e.preventDefault();
          const u = e.dataTransfer.getData("text/plain") || dragUser;
          if (u) assign(u, name);
          setDragOver(null);
          setDragUser(null);
        }}
        style={{
          border: over ? "2px dashed var(--accent)" : "1px solid var(--line)",
          borderRadius: 16,
          padding: "14px 16px",
          background: over ? "var(--tint)" : "#fff",
        }}
      >
        {/* 第一行：名称靠左，删除右上角 */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
          <Text strong style={{ fontSize: 15, color }}>{name}</Text>
          <Popconfirm
            title={`删除归属人 ${name}？`}
            description="其名下账号将变为未分配"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => removeOwner(name)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} loading={busy === "__rm_" + name} />
          </Popconfirm>
        </div>
        {/* 第二行：颜色 / 账号数 */}
        <Space size={6}>
          <ColorPicker
            size="small"
            value={color}
            disabled={busy === "__clr_" + name}
            onChange={(c) => setColor(name, c.toHexString())}
            presets={[{ label: "水墨", colors: ["#5B7B8C", "#6FA287", "#C9A15F", "#C47B6D", "#8A7FA3", "#4A5561", "#5D8CA8"] }]}
          />
          <Tag style={{ marginInlineEnd: 0 }}>{count} 账号</Tag>
        </Space>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
          把账号拖到这里完成分配
        </Text>
      </div>
    );
  };

  // 账号格子（桌面：拖拽分配；移动端：点击弹窗设置归属）
  const accountCell = (a: Account) => (
    <div
      key={a.username}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.username); setDragUser(a.username); }}
      onDragEnd={() => setDragUser(null)}
      onClick={() => { if (isMobile) setAssignTarget(a); }}
      style={{
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "10px 12px",
        background: "#fff",
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        cursor: isMobile ? "pointer" : "grab",
        opacity: dragUser === a.username ? 0.4 : 1,
      }}
    >
      <UserOutlined style={{ color: "#999", flexShrink: 0, alignSelf: "center" }} />
      <Text strong ellipsis={{ tooltip: a.username }} style={{ minWidth: 0, flex: 1 }}>
        {a.username}
      </Text>
      {a.owner ? <OwnerTag name={a.owner} color={ownerColor(a.owner)} /> : <Tag style={{ flexShrink: 0 }}>未分配</Tag>}
      <Popconfirm
        title="确认删除账号？"
        description="不影响游戏本体，只是从本工具移除"
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        onConfirm={() => removeAccount(a.username)}
      >
        <Button type="text" size="small" danger icon={<DeleteOutlined />} loading={busy === "__rmacc_" + a.username} />
      </Popconfirm>
    </div>
  );

  return (
    <div>
      <GameConfig />

      {/* 顶部操作栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong style={{ fontSize: 16, color: "var(--accent)" }}>账号管理</Text>
          <Space wrap>
            <Input
              placeholder="创建归属人，如：小明"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              onPressEnter={createOwner}
              style={{ width: 200 }}
            />
            <Button icon={<PlusOutlined />} onClick={createOwner} loading={busy === "__create__"}>
              创建归属人
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
              添加账号
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 归属人圆角卡片 */}
      <Text strong style={{ color: "var(--accent)" }}>归属人</Text>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12, margin: "8px 0 20px" }}>
        {owners.map((o) => ownerCard(o.name))}
        {!owners.length && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有归属人，可在上方创建" />
        )}
      </div>

      {/* 账号格子（拖拽到归属人卡片分配） */}
      <Text strong style={{ color: "var(--accent)" }}>
        {isMobile ? "账号（点击账号可设置归属人）" : "账号（拖拽到上方归属人卡片完成分配）"}
      </Text>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginTop: 8 }}>
        {accounts.map(accountCell)}
      </div>

      {showModal && (
        <AddAccountModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); onChanged(); }}
        />
      )}

      {/* 移动端：点击账号格子弹出的归属设置 */}
      <Modal
        open={!!assignTarget}
        title={`设置 ${assignTarget?.username || ""} 的归属`}
        onCancel={() => setAssignTarget(null)}
        footer={null}
        destroyOnClose
      >
        {assignTarget && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {owners.map((o) => {
              const count = accounts.filter((a) => a.owner === o.name).length;
              return (
                <div
                  key={o.name}
                  onClick={() => { assign(assignTarget.username, o.name); setAssignTarget(null); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: assignTarget.owner === o.name ? "var(--tint)" : "#fff",
                  }}
                >
                  <OwnerTag name={o.name} color={ownerColor(o.name)} />
                  <Tag style={{ marginInlineEnd: 0 }}>{count} 账号</Tag>
                  {assignTarget.owner === o.name && <Text type="secondary" style={{ marginLeft: "auto" }}>当前</Text>}
                </div>
              );
            })}
            <div
              onClick={() => { assign(assignTarget.username, ""); setAssignTarget(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                border: "1px solid var(--line)",
                borderRadius: 10,
                cursor: "pointer",
                background: !assignTarget.owner ? "var(--tint)" : "#fff",
              }}
            >
              <Tag style={{ marginInlineEnd: 0 }}>未分配</Tag>
              {!assignTarget.owner && <Text type="secondary" style={{ marginLeft: "auto" }}>当前</Text>}
            </div>
          </div>
        )}
      </Modal>

      {/* 拉取日志（每日 0 点自动清理） */}
      <FetchLogs />
    </div>
  );
}

/** 拉取日志表格 */
function FetchLogs() {
  const [logs, setLogs] = useState<{ time: string; username: string; ok: boolean; ms: number; error?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiGet<{ logs: typeof logs }>("/api/fetch-logs");
      setLogs(d.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card
      size="small"
      title={<Text strong style={{ color: "var(--accent)" }}>拉取日志（每日 0 点自动清理）</Text>}
      extra={<Button type="link" size="small" onClick={load} loading={loading}>刷新</Button>}
      style={{ marginTop: 16 }}
    >
      {!logs.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无拉取记录" />
      ) : (
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--ink-2)", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "6px 8px" }}>时间</th>
                <th style={{ padding: "6px 8px" }}>账号</th>
                <th style={{ padding: "6px 8px" }}>状态</th>
                <th style={{ padding: "6px 8px" }}>耗时</th>
                <th style={{ padding: "6px 8px" }}>信息</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "6px 8px", color: "var(--ink-2)" }} className="tabular-nums">{l.time}</td>
                  <td style={{ padding: "6px 8px" }}>{l.username}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <Tag color={l.ok ? "#6FA287" : "#C47B6D"} style={{ borderRadius: 4 }}>
                      {l.ok ? "成功" : "失败"}
                    </Tag>
                  </td>
                  <td style={{ padding: "6px 8px", color: "var(--ink-2)" }} className="tabular-nums">{l.ms}ms</td>
                  <td style={{ padding: "6px 8px", color: l.ok ? "var(--ink-3)" : "var(--terracotta)", fontSize: 12 }}>
                    {l.error || (l.ms < 500 ? "缓存" : "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** 爬取地址（游戏服 Base）设置 */
function GameConfig() {
  const { message } = App.useApp();
  const [base, setBase] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ host: string; port: number }>("/api/config")
      .then((c) => setBase(`http://${c.host}:${c.port}`))
      .catch(() => {});
  }, []);

  const save = async () => {
    let host = base.trim();
    if (!host) { message.error("请输入爬取地址"); return; }
    if (!host.includes("://")) host = `http://${host}`;
    let port: number;
    try {
      const u = new URL(host);
      host = u.hostname;
      port = u.port ? Number(u.port) : 80;
    } catch {
      message.error("地址格式不正确，示例：http://121.41.170.75:18251");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/config", { host, port });
      message.success(`爬取地址已更新：http://${host}:${port}`);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      size="small"
      title={<Text strong style={{ color: "var(--accent)" }}>爬取地址（游戏服 Base）</Text>}
      style={{ marginBottom: 16 }}
    >
      <Space wrap>
        <Input
          placeholder="http://121.41.170.75:18251"
          value={base}
          onChange={(e) => setBase(e.target.value)}
          style={{ width: 320 }}
          prefix={<Text type="secondary">🌐</Text>}
        />
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
          保存
        </Button>
      </Space>
      <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
        所有账号的背包查询 / 闭关操作将使用该地址。修改后立即生效，已建立的连接会重新走新地址。
      </Text>
    </Card>
  );
}
