"use client";

import { Tag } from "antd";
import { realmColor, realmBg, realmIcon } from "@/lib/realm";

/** 境界 Tag（带境界专属色 + 境界图标，图标居中） */
export default function RealmTag({
  realmKey, name, fontSize = 12,
}: {
  realmKey?: string | null; name: string; fontSize?: number;
}) {
  const icon = realmIcon(realmKey);
  return (
    <Tag
      style={{
        background: realmBg(realmKey), border: "none", color: realmColor(realmKey), fontSize,
        borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        height: 24, padding: "0 8px", lineHeight: 1, boxSizing: "border-box",
      }}
    >
      {icon && (
        <img
          src={icon} alt=""
          style={{
            width: 16, height: 16,
            objectFit: "contain", display: "block", flexShrink: 0,
          }}
        />
      )}
      <span style={{ lineHeight: 1 }}>{name}</span>
    </Tag>
  );
}
