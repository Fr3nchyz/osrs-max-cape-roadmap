/**
 * Weekly recap and max-cape countdown, from Wise Old Man daily snapshots.
 * Pure: the recap card fetches the history and passes it in.
 */

import { computeMaxPlan, skillsFromXp } from "@/app/skills";
import { paceAt, periodStats, type XpPoint } from "@/app/progress";

export interface HistoryPointIn {
  at: string;
  xp: Record<string, number>;
  ehb: number | null;
  kc: Record<string, number>;
}

export interface WeekRecap {
  start: number;
  end: number;
  /** True when history doesn't reach back to the week's start. */
  partial: boolean;
  /** Snapshots taken inside the week; 0 means no play was recorded. */
  snapshots: number;
  maxingHours: number;
  /** Wise Old Man efficient hours bossed; null when unknown. */
  bossingHours: number | null;
  levels: number;
  xp: number;
  topSkills: { name: string; xp: number; levels: number }[];
  topBosses: { boss: string; kills: number }[];
  new99s: string[];
}

/** WOM metric -> display name: "tombs_of_amascut" -> "Tombs of amascut". */
export function bossName(metric: string): string {
  const s = metric.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Last point at or before `t`, else the first point after it (a partial window). */
function pointAt<T extends { at: number }>(sorted: T[], t: number): T | undefined {
  let best: T | undefined;
  for (const p of sorted) if (p.at <= t) best = p;
  return best ?? sorted[0];
}

export function weekRecap(
  history: HistoryPointIn[],
  start: number,
  end: number,
  selections: Record<string, number>,
): WeekRecap | null {
  const pts = history.map((p) => ({ ...p, at: Date.parse(p.at) })).sort((a, b) => a.at - b.at);
  const inRange = pts.filter((p) => p.at <= end);
  if (inRange.length === 0) return null;
  const xpPoints: XpPoint[] = inRange.map((p) => ({ at: p.at, xp: p.xp }));
  const stats = periodStats(xpPoints, start, end, selections);
  if (!stats) return null;

  const a = pointAt(inRange, start)!;
  const b = inRange[inRange.length - 1];
  const bossingHours = a.ehb !== null && b.ehb !== null ? Math.max(0, b.ehb - a.ehb) : null;
  const topBosses = Object.entries(b.kc)
    .map(([metric, kills]) => ({ boss: bossName(metric), kills: kills - (a.kc[metric] ?? 0) }))
    .filter((x) => x.kills > 0)
    .sort((x, y) => y.kills - x.kills)
    .slice(0, 5);

  return {
    start,
    end,
    partial: stats.partial,
    snapshots: inRange.filter((p) => p.at > start && p.at <= end).length,
    maxingHours: stats.hours,
    bossingHours,
    levels: stats.levels,
    xp: stats.xp,
    topSkills: stats.top.slice(0, 3),
    topBosses,
    new99s: stats.new99s,
  };
}

export interface Countdown {
  hoursLeft: number;
  /** Days at your planned maxing hours per day; null when that is 0. */
  plannedDays: number | null;
  /** Days at your last-28-days pace; null without enough history. */
  realDays: number | null;
  realHoursPerDay: number | null;
}

/**
 * Days to max: the max plan's remaining hours (with Fletching stock as
 * downtime) at your planned maxing time and at your real recent pace.
 */
export function maxCountdown(
  liveXp: Record<string, number>,
  history: HistoryPointIn[],
  now: number,
  selections: Record<string, number>,
  plannedHoursPerDay: number,
  downtimeXp: Record<string, number> = {},
): Countdown {
  const hoursLeft = computeMaxPlan(skillsFromXp(liveXp), selections, 0, downtimeXp).totalHours;
  const points: XpPoint[] = history
    .map((p) => ({ at: Date.parse(p.at), xp: p.xp }))
    .filter((p) => p.at < now)
    .sort((a, b) => a.at - b.at);
  points.push({ at: now, xp: liveXp });
  const pace = points.length > 1 ? paceAt(points, now, selections) : null;
  const real = pace && pace.hoursPerDay > 0.01 ? pace.hoursPerDay : null;
  return {
    hoursLeft,
    plannedDays: plannedHoursPerDay > 0 ? hoursLeft / plannedHoursPerDay : null,
    realDays: real ? hoursLeft / real : null,
    realHoursPerDay: real,
  };
}
