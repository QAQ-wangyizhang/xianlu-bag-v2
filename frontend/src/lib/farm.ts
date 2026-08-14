/** 刷取计划计算引擎 —— 纯函数 */

const SWEEP_STAMINA_COST = 1;
const STAMINA_REGEN_PER_DAY = 48;

export interface FarmScheduleEntry {
  day: number;
  weekday: number;
  sweeps: number;
  yieldPer: number;
  got: number;
  weekType: string;
  name: string;
}

export interface FarmPlan {
  days: number;
  weeks: number;
  sweeps: number;
  staminaTotal: number;
  schedule: FarmScheduleEntry[];
  fulfilled: boolean;
}

/** ISO 周号 */
export function getISOWeekNumber(d: Date = new Date()): number {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function isOddWeek(d: Date = new Date()): boolean {
  return getISOWeekNumber(d) % 2 === 1;
}

/**
 * 计算某材料在某天某周类型下的每体力产出（考虑境界覆写）
 */
export function dungeonYieldForMat(
  matKey: string,
  weekday: number,
  realmKey: string,
  weekType: string,
  dungeonSchedule: any,
  dungeonBonus: Record<string, number>,
  realmOverride: Record<string, any>,
): number {
  const schedule = dungeonSchedule[weekType]?.[weekday];
  if (!schedule) return 0;
  const override = realmOverride[realmKey];

  let mainKey = Object.keys(schedule.main)[0];
  let mainQty = schedule.main[mainKey] || 0;
  let subKey = Object.keys(schedule.sub)[0];
  let subQty = schedule.sub[subKey] || 0;

  if (override) {
    if (override.mainReplace) { mainKey = override.mainReplace; mainQty = override.mainReplaceQty; }
    if (override.sub) { subKey = override.sub; subQty = override.subQty; }
  }

  let total = 0;
  if (mainKey === matKey) total += mainQty;
  if (subKey === matKey) total += subQty;
  if (dungeonBonus[matKey]) total += dungeonBonus[matKey];
  return total;
}

/**
 * 计算从今天起需要刷几天才能凑齐缺口
 */
export function calcFarmPlan(
  matKey: string,
  lackQty: number,
  realmKey: string,
  dungeonSchedule: any,
  dungeonBonus: Record<string, number>,
  realmOverride: Record<string, any>,
): FarmPlan {
  if (lackQty <= 0) return { days: 0, weeks: 0, sweeps: 0, staminaTotal: 0, schedule: [], fulfilled: true };

  const today = new Date();
  let remaining = lackQty;
  let sweeps = 0;
  let staminaTotal = 0;
  let lastDay = 0;
  const schedule: FarmScheduleEntry[] = [];

  for (let d = 0; d < 84 && remaining > 0; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const wd = date.getDay();
    const wt = isOddWeek(date) ? "odd" : "even";
    const yldPer = dungeonYieldForMat(matKey, wd, realmKey, wt, dungeonSchedule, dungeonBonus, realmOverride);

    if (yldPer > 0) {
      const sweepsNeeded = Math.ceil(remaining / yldPer);
      const sweepsToday = Math.min(sweepsNeeded, STAMINA_REGEN_PER_DAY);
      const got = sweepsToday * yldPer;
      remaining -= got;
      sweeps += sweepsToday;
      staminaTotal += sweepsToday * SWEEP_STAMINA_COST;
      lastDay = d + 1;
      schedule.push({
        day: d + 1, weekday: wd, sweeps: sweepsToday, yieldPer: yldPer, got,
        weekType: wt, name: dungeonSchedule[wt][wd].name,
      });
    }
  }

  return {
    days: lastDay,
    weeks: Math.ceil(lastDay / 7),
    sweeps, staminaTotal,
    schedule: schedule.slice(0, 6),
    fulfilled: remaining <= 0,
  };
}

/** 根据角色境界推断默认升段目标 */
export function defaultTierForRealm(realmKey: string | undefined): string {
  const order = ["lianqi", "zhuji", "jindan", "yuanying", "huashen", "lianxu", "heti", "dacheng", "dujie"];
  const idx = order.indexOf(realmKey || "");
  if (idx < 0) return "huashen";
  return order[Math.min(idx + 1, order.length - 1)];
}
