"use client";

import { Tag } from "antd";

const DEFAULT_COLOR = "#6E8CA0";

/** 归属人 Tag（自定义色，未设置时用灰蓝默认色） */
export default function OwnerTag({ name, color, fontSize = 12 }: { name: string; color?: string; fontSize?: number }) {
  const c = color || DEFAULT_COLOR;
  return (
    <Tag style={{ background: `${c}1A`, border: "none", color: c, fontSize }}>
      {name}
    </Tag>
  );
}
