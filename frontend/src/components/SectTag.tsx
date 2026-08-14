"use client";

import { Tag } from "antd";
import { sectColor, sectBg } from "@/lib/sect";

/** 门派名 → 图标路径 */
const SECT_ICONS: Record<string, string> = {
  万劫宗: "/icons/sect-wanjie.png",
  太华门: "/icons/sect-taihua.png",
  噬魂殿: "/icons/sect-shihun.png",
  混元剑派: "/icons/sect-hunyuan.png",
  天机谷: "/icons/sect-tianji.png",
};

/** 门派 Tag（带门派专属色 + 图标，图标居中） */
export default function SectTag({ name, fontSize = 12 }: { name?: string | null; fontSize?: number }) {
  const label = name || "散修";
  const icon = name ? SECT_ICONS[name] : undefined;
  return (
    <Tag
      style={{
        background: sectBg(name), border: "none", color: sectColor(name), fontSize,
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
      <span style={{ lineHeight: 1.3 }}>{label}</span>
    </Tag>
  );
}
