"use client";

import { useState } from "react";
import type { Account, GameConstants } from "@/types";
import { useSeclusion } from "@/hooks/useSeclusion";
import SeclusionCard from "./SeclusionCard";
import { Button, Card, Empty, Space, Switch, Typography } from "antd";
import { PlayCircleOutlined, StopOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function SeclusionTab({
  accounts, constants, autoRefresh, setAutoRefresh,
}: {
  accounts: Account[]; constants: GameConstants | null;
  autoRefresh: boolean; setAutoRefresh: (v: boolean) => void;
}) {
  const secl = useSeclusion(accounts, autoRefresh);
  const running = Object.values(secl.statuses).filter((s) => s.enabled).length;

  if (!accounts.length) {
    return <Empty description="还没有绑定账号，去「账号管理」添加" style={{ padding: "32px 0" }} />;
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text strong style={{ fontSize: 16, color: "var(--accent)" }}>闭关修炼</Text>
          <Text type="secondary">{running}/{accounts.length} 个账号运行中</Text>
          <span style={{ flex: 1 }} />
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => secl.startAll()}>
            全部启动
          </Button>
          <Button danger icon={<StopOutlined />} onClick={() => secl.stopAll()}>
            全部停止
          </Button>
          <Switch checked={autoRefresh} onChange={setAutoRefresh} checkedChildren="自动刷新" unCheckedChildren="手动" />
        </Space>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {accounts.map((a) => (
          <SeclusionCard
            key={a.username}
            username={a.username}
            status={secl.statuses[a.username]}
            onStart={() => secl.startOne(a.username)}
            onStop={() => secl.stopOne(a.username)}
          />
        ))}
      </div>
    </div>
  );
}
