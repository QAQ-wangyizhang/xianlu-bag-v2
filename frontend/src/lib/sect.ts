/** 门派专属色（莫兰迪低饱和，保持整体水墨调性） */

const SECT_COLORS: Record<string, string> = {
  噬魂殿: "#4A5561", // 阴暗系：深墨灰
  太华门: "#6FA287", // 奶妈/治疗：竹绿
  万劫宗: "#C47B6D", // 魔道/血：陶红
  混元剑派: "#5D8CA8", // 剑宗：黛蓝
  天机谷: "#8A7FA3", // 均衡：暮紫（红蓝相调）
};

const DEFAULT_COLOR = "#6B7A84";

export function sectColor(name?: string | null): string {
  if (!name) return DEFAULT_COLOR;
  return SECT_COLORS[name] || DEFAULT_COLOR;
}

/** 淡色底（hex + 10% 透明度） */
export function sectBg(name?: string | null): string {
  return `${sectColor(name)}1A`;
}
