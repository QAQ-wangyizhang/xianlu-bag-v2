"use client";

import { Card, Progress, Space, Statistic, Tag, Typography } from "antd";
import { fmt } from "@/lib/format";

const { Text } = Typography;

const STONE_PER_STAMINA = 1200;
const STAMINA_PER_DAY = 48;

export default function StoneCard({ have, need, lack }: { have: number; need: number; lack: number }) {
  const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
  const lackStamina = Math.ceil(lack / STONE_PER_STAMINA);
  const lackDays = Math.ceil(lackStamina / STAMINA_PER_DAY);

  return (
    <Card size="small" style={{ borderColor: "#f0c260", marginBottom: 12 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space>
          <Text strong style={{ color: "#d48806" }}>💎 灵石</Text>
          {lack === 0
            ? <Tag color="success">✓ 已充足</Tag>
            : <Tag color="error">缺 {fmt(lack)}</Tag>}
        </Space>

        <Space wrap size={16}>
          <Statistic title="当前持有" value={have} valueStyle={{ fontSize: 16, color: lack === 0 ? "#52c41a" : undefined }} />
          <Statistic title="升满需要" value={need} valueStyle={{ fontSize: 16 }} />
          <Statistic title="缺口" value={lack} valueStyle={{ fontSize: 16, color: lack === 0 ? "#52c41a" : "#ff4d4f" }} />
          <Statistic title="还需体力" value={lack === 0 ? "0" : fmt(lackStamina)} valueStyle={{ fontSize: 16, color: lack === 0 ? "#52c41a" : "#ff4d4f" }} />
          <Statistic title="自然恢复天数" value={lack === 0 ? "0" : `${lackDays} 天`} valueStyle={{ fontSize: 16, color: lack === 0 ? "#52c41a" : "#ff4d4f" }} />
        </Space>

        <Progress percent={pct} showInfo={false} strokeColor={lack === 0 ? "#52c41a" : "#d48806"} />

        <Text type="secondary" style={{ fontSize: 12 }}>
          按 1 体力 = {fmt(STONE_PER_STAMINA)} 灵石 · 每 30 分钟回 1 体力（每天 {(STAMINA_PER_DAY * STONE_PER_STAMINA / 10000).toFixed(1)} 万灵石）计算
        </Text>
      </Space>
    </Card>
  );
}
