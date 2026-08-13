"use client";

import { useEffect, useState } from "react";
import { App, Button, Card, Empty, Input, Popconfirm, Space, Tag, Typography } from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import type { Account } from "@/types";
import { apiGet, apiPost } from "@/lib/api";
import AddAccountModal from "./AddAccountModal";

const { Text } = Typography;

export default function AccountsTab({
  accounts, owners, onChanged,
}: {
  accounts: Account[]; owners: string[]; onChanged: () => void;
}) {
  const { message } = App.useApp();
  const [showModal, setShowModal] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [dragUser, setDragUser] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [busy, setBusy] = useState("");

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

  const createOwner = async () => {
    const name = newOwner.trim();
    if (!name) { message.error("请输入归属人名字"); return; }
    if (owners.includes(name)) { message.error("该归属人已存在"); return; }
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

  // 归属人圆角卡片（拖拽目标）
  const ownerCard = (name: string) => {
    const count = accounts.filter((a) => a.owner === name).length;
    const over = dragOver === name;
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
          border: over ? "2px dashed #1677ff" : "1px solid #f0f0f0",
          borderRadius: 16,
          padding: 16,
          background: over ? "#e6f4ff" : "#fff",
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <TeamOutlined style={{ color: "#d48806" }} />
            <Text strong>{name}</Text>
          </Space>
          <Space>
            <Tag>{count} 账号</Tag>
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
          </Space>
        </Space>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
          把账号拖到这里完成分配
        </Text>
      </div>
    );
  };

  // 账号格子（可拖拽）
  const accountCell = (a: Account) => (
    <div
      key={a.username}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.username); setDragUser(a.username); }}
      onDragEnd={() => setDragUser(null)}
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 12,
        padding: "10px 12px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "grab",
        opacity: dragUser === a.username ? 0.4 : 1,
      }}
    >
      <UserOutlined style={{ color: "#999" }} />
      <Text strong>{a.username}</Text>
      {a.owner ? <Tag color="geekblue">{a.owner}</Tag> : <Tag>未分配</Tag>}
      <span style={{ flex: 1 }} />
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
          <Text strong style={{ fontSize: 16, color: "#d48806" }}>账号管理</Text>
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
      <Text strong style={{ color: "#d48806" }}>归属人</Text>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12, margin: "8px 0 20px" }}>
        {owners.map(ownerCard)}
        {!owners.length && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有归属人，可在上方创建" />
        )}
      </div>

      {/* 账号格子（拖拽到归属人卡片分配） */}
      <Text strong style={{ color: "#d48806" }}>账号（拖拽到上方归属人卡片完成分配）</Text>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12, marginTop: 8 }}>
        {accounts.map(accountCell)}
      </div>

      {showModal && (
        <AddAccountModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); onChanged(); }}
        />
      )}
    </div>
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
      title={<Text strong style={{ color: "#d48806" }}>爬取地址（游戏服 Base）</Text>}
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
