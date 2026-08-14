"use client";

import { Button, Card, Empty, Space, Statistic, Tag, Typography } from "antd";
import type { SeclusionStatus } from "@/types";
import { fmt } from "@/lib/format";

const { Text } = Typography;

const VENUE_NAMES: Record<string, string> = {
  mountain: "凡俗深山", vein: "宗门灵脉", relic: "上古遗迹",
};

export default function SeclusionCard({
  username, status, onStart, onStop,
}: {
  username: string; status?: SeclusionStatus; onStart: () => void; onStop: () => void;
}) {
  if (!status) {
    return (
      <Card size="small">
        <Space>
          <Text strong>{username}</Text>
          <Text type="secondary">加载中…</Text>
        </Space>
      </Card>
    );
  }

  const rt = status.realtime;
  const isActive = rt?.status === "active";
  const isExiting = rt?.status === "exiting";
  const statusBadge = status.enabled
    ? <Tag color="success">运行中</Tag>
    : <Tag>已停止</Tag>;

  const rtBadge = rt?.error
    ? <Tag color="error">查询失败</Tag>
    : isActive
    ? <Tag color="processing">闭关中</Tag>
    : isExiting
    ? <Tag color="warning">出关中…</Tag>
    : <Text type="secondary">未闭关</Text>;

  const title = (
    <Space wrap size={8}>
      <Text strong>{username}</Text>
      {statusBadge}
      {rtBadge}
    </Space>
  );

  const extra = status.enabled ? (
    <Button size="small" danger onClick={onStop}>停止</Button>
  ) : (
    <Button size="small" type="primary" ghost onClick={onStart}>启动</Button>
  );

  return (
    <Card size="small" title={title} extra={extra}>
      <Space wrap size={24} style={{ marginBottom: 16 }}>
            <Statistic title="场所" value={VENUE_NAMES[rt?.venue || ""] || rt?.venue || "-"} valueStyle={{ fontSize: 16 }} />
            <Statistic title="已凝修为" value={rt?.solidified_exp ? fmt(rt.solidified_exp) : "-"} valueStyle={{ fontSize: 16 }} />
            <Statistic title="待结修为" value={rt?.pending_exp ? fmt(rt.pending_exp) : "-"} valueStyle={{ fontSize: 16 }} />
            <Statistic title="累计轮数" value={String(status.cycleCount || 0)} valueStyle={{ fontSize: 16 }} />
          </Space>

          <Text strong style={{ color: "var(--accent)" }}>操作日志</Text>
          <div
            style={{
              background: "var(--cell)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: 8,
              height: 192,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
              marginTop: 8,
            }}
          >
            {status.logs.length ? (
              status.logs.slice(-12).reverse().map((log, i) => (
                <div key={i}>
                  <Text type="secondary">[{log.timestamp}]</Text> {log.message}
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无日志" />
            )}
          </div>
    </Card>
  );
}
