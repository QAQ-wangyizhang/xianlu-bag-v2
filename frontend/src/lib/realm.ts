/** 境界专属色（莫兰迪低饱和，9 个境界递进色） */

const REALM_COLORS: Record<string, string> = {
  lianqi: "#9BBFAE", // 炼气：浅竹绿
  zhuji: "#8FA9C9", // 筑基：浅蓝
  jindan: "#C9A15F", // 金丹：赭金
  yuanying: "#8A7FA3", // 元婴：暮紫
  huashen: "#5B7B8C", // 化神：黛青
  lianxu: "#6FA287", // 炼虚：竹绿
  heti: "#B3765E", // 合体：陶褐
  dacheng: "#4A5561", // 大乘：墨灰
  dujie: "#A8504A", // 渡劫：赤红
};

const DEFAULT_COLOR = "#6B7A84";

export function realmColor(key?: string | null): string {
  if (!key) return DEFAULT_COLOR;
  return REALM_COLORS[key] || DEFAULT_COLOR;
}

/** 淡色底（hex + 10% 透明度） */
export function realmBg(key?: string | null): string {
  return `${realmColor(key)}1A`;
}
