"use client";

import { Tag } from "antd";
import { realmColor, realmBg } from "@/lib/realm";

/** 已配好图标的境界键 → 图标路径（9 个境界全覆盖） */
const REALM_ICONS: Record<string, string> = {
  lianqi: "/icons/realm-lianqi.png",
  zhuji: "/icons/realm-zhuji.png",
  jindan: "/icons/realm-jindan.png",
  yuanying: "/icons/realm-yuanying.png",
  huashen: "/icons/realm-huashen.png",
  lianxu: "/icons/realm-lianxu.png",
  heti: "/icons/realm-heti.png",
  dacheng: "/icons/realm-dacheng.png",
  dujie: "/icons/realm-dujie.png",
};

/** 境界 Tag（带境界专属色 + 境界图标，图标居中） */
export default function RealmTag({
  realmKey, name, fontSize = 12,
}: {
  realmKey?: string | null; name: string; fontSize?: number;
}) {
  const icon = realmKey ? REALM_ICONS[realmKey] : undefined;
  return (
    <Tag
      style={{
        background: realmBg(realmKey), border: "none", color: realmColor(realmKey), fontSize,
        borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
      }}
    >
      {icon && (
        <img
          src={icon} alt=""
          style={{
            width: Math.round(fontSize * 1.4), height: Math.round(fontSize * 1.4),
            objectFit: "contain", display: "block",
          }}
        />
      )}
      <span style={{ lineHeight: 1.3 }}>{name}</span>
    </Tag>
  );
}
