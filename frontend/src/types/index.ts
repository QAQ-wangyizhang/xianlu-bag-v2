/** TypeScript 类型定义 */

export interface Account {
  username: string;
  password?: string;
  owner?: string;
}

export interface Player {
  name?: string;
  sect_name?: string;
  faction_name?: string;
  major_realm?: string;
  stage?: number;
  exp?: number;
  spirit_stone?: number;
  great_dao_origin?: number;
}

export interface Stamina {
  current: number | null;
  max: number | null;
  seconds_to_next: number | null;
  regen_minutes: number | null;
}

export interface RealmProgress {
  exp: number | null;
  exp_needed: number | null;
  stage?: number | null;
  next_stage?: number | null;
  next_realm_name?: string;
  can_break?: boolean;
  at_wall?: boolean;
  at_cap?: boolean;
  block_reason?: string;
  level_wall_name?: string;
}

export interface Bag {
  username: string;
  ok: boolean;
  loading?: boolean;
  error?: string;
  player?: Player;
  materials?: Record<string, number>;
  stamina?: Stamina | null;
  realm?: RealmProgress | null;
}

export interface SeclusionLog {
  timestamp: string;
  message: string;
}

export interface SeclusionRealtime {
  venue?: string;
  status?: string;
  pending_exp?: number;
  solidified_exp?: number;
  exit_started_at?: string | null;
  exit_remaining_ms?: number | null;
  error?: string;
}

export interface SeclusionStatus {
  enabled: boolean;
  logs: SeclusionLog[];
  cycleCount: number;
  realtime: SeclusionRealtime;
}

export interface GradeTier {
  key: string;
  name: string;
  range: string;
  perItem: Record<string, number>;
  placeholder?: boolean;
}

export interface DungeonDay {
  name: string;
  main: Record<string, number>;
  sub: Record<string, number>;
}

export interface GameConstants {
  materialNames: Record<string, string>;
  materialCategory: Record<string, string>;
  realmNames: Record<string, string>;
  gradeTiers: GradeTier[];
  dungeonSchedule: { odd: Record<number, DungeonDay>; even: Record<number, DungeonDay> };
  dungeonBonus: Record<string, number>;
  realmOverride: Record<string, any>;
  weekdayNames: string[];
}

export type TabName = "bags" | "gap" | "seclusion" | "owners" | "accounts";
