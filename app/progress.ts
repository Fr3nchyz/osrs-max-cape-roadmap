// Progress math over an XP history: weekly/monthly gains, daily max-hours, real pace, burn-down
// and milestone projections. Pure functions — the hook (useProgress) feeds them data.
//
// "Max-hours" is the unit everything is measured in: how much the time-to-max (computeMaxPlan,
// with the player's selected methods and the combat grouping) went down. It's the honest answer
// to "how much of the grind did I actually do", independent of how fast the methods are.

import { computeMaxPlan, levelForXp, skillsFromXp, xpForLevel, XP_FOR_99, type Skill } from "./skills";

export type XpPoint = { at: number; xp: Record<string, number> }; // at = epoch ms

const DAY_MS = 86_400_000;

// --- Calendar helpers (local time) ----------------------------------------------------------------
export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
export function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t));
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}
export function startOfMonth(t: number): number {
  const d = new Date(startOfDay(t));
  d.setDate(1);
  return d.getTime();
}
function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}
function addMonths(t: number, n: number): number {
  const d = new Date(t);
  d.setMonth(d.getMonth() + n);
  return d.getTime();
}

// --- Lookups ------------------------------------------------------------------------------------
// XP as it stood at time t: the last point at or before t. If history starts later, the first
// point is used and `exact` is false (the period is only partially covered).
export function xpAt(points: XpPoint[], t: number): { point: XpPoint; exact: boolean } | null {
  if (!points.length) return null;
  let found: XpPoint | null = null;
  for (const p of points) {
    if (p.at <= t) found = p;
    else break;
  }
  return found ? { point: found, exact: true } : { point: points[0], exact: false };
}

// Fill gaps in an older snapshot with the newer one (a skill missing from history = no change).
function aligned(from: Record<string, number>, to: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of Object.keys(to)) out[k] = from[k] ?? to[k];
  return out;
}

const hoursLeftCache = new WeakMap<Record<string, number>, Map<string, number>>();
// Time-to-max (hours) for a snapshot under the current method selections.
export function hoursLeft(xp: Record<string, number>, selections: Record<string, number>): number {
  const key = JSON.stringify(selections);
  let m = hoursLeftCache.get(xp);
  if (!m) hoursLeftCache.set(xp, (m = new Map()));
  const hit = m.get(key);
  if (hit !== undefined) return hit;
  const h = computeMaxPlan(skillsFromXp(xp), selections).totalHours;
  m.set(key, h);
  return h;
}

// --- Period summary -----------------------------------------------------------------------------
export type SkillGain = { name: string; xp: number; levels: number };
export type PeriodStats = {
  start: number; // period start (calendar)
  since: number; // when our baseline data actually begins (>= start when partial)
  partial: boolean;
  xp: number;
  levels: number;
  hours: number; // max-hours done
  new99s: string[];
  bySkill: Record<string, SkillGain>;
  top: SkillGain[];
};

export function periodStats(
  points: XpPoint[],
  start: number,
  end: number,
  selections: Record<string, number>
): PeriodStats | null {
  const a = xpAt(points, start);
  const b = xpAt(points, end);
  if (!a || !b) return null;
  const to = b.point.xp;
  const from = aligned(a.point.xp, to);

  const bySkill: Record<string, SkillGain> = {};
  const new99s: string[] = [];
  let xp = 0;
  let levels = 0;
  for (const name of Object.keys(to)) {
    const gained = Math.max(0, to[name] - from[name]);
    const lv = Math.max(0, levelForXp(to[name]) - levelForXp(from[name]));
    if (from[name] < XP_FOR_99 && to[name] >= XP_FOR_99) new99s.push(name);
    if (gained > 0) bySkill[name] = { name, xp: gained, levels: lv };
    xp += gained;
    levels += lv;
  }

  return {
    start,
    since: a.exact ? start : a.point.at,
    partial: !a.exact,
    xp,
    levels,
    hours: Math.max(0, hoursLeft(from, selections) - hoursLeft(to, selections)),
    new99s,
    bySkill,
    top: Object.values(bySkill).sort((x, y) => y.xp - x.xp),
  };
}

// --- Daily max-hours for the current calendar week ----------------------------------------------
export type DayBar = { day: number; label: string; hours: number | null; known: boolean };

export function weekDays(points: XpPoint[], now: number, selections: Record<string, number>): DayBar[] {
  const ws = startOfWeek(now);
  const first = points[0]?.at ?? now;
  const out: DayBar[] = [];
  for (let i = 0; i < 7; i++) {
    const d0 = addDays(ws, i);
    const d1 = addDays(ws, i + 1);
    const label = new Date(d0).toLocaleDateString("en-US", { weekday: "short" });
    if (d0 > now) {
      out.push({ day: d0, label, hours: null, known: false });
      continue;
    }
    const a = xpAt(points, d0);
    const b = xpAt(points, Math.min(d1, now));
    if (!a || !b || !a.exact) {
      out.push({ day: d0, label, hours: null, known: d1 > first });
      continue;
    }
    const to = b.point.xp;
    const from = aligned(a.point.xp, to);
    out.push({ day: d0, label, hours: Math.max(0, hoursLeft(from, selections) - hoursLeft(to, selections)), known: true });
  }
  return out;
}

// --- Burn-down ----------------------------------------------------------------------------------
export type BurnPoint = { at: number; hours: number; xpLeft: number; totalLevel: number };

export function burnDown(points: XpPoint[], now: number, selections: Record<string, number>, days = 90): BurnPoint[] {
  const cutoff = now - days * DAY_MS;
  return points
    .filter((p) => p.at >= cutoff)
    .map((p) => {
      const skills = skillsFromXp(p.xp);
      return {
        at: p.at,
        hours: hoursLeft(p.xp, selections),
        xpLeft: skills.reduce((s, k) => s + k.remainingXp, 0),
        totalLevel: skills.reduce((s, k) => s + Math.min(99, k.level), 0),
      };
    });
}

// --- Real pace ----------------------------------------------------------------------------------
export type Pace = { hoursPerDay: number; days: number }; // days = window actually covered

// Max-hours per day over the `window` days ending at `end`. Null when < 3 days of data.
export function paceAt(
  points: XpPoint[],
  end: number,
  selections: Record<string, number>,
  window = 28
): Pace | null {
  const a = xpAt(points, end - window * DAY_MS);
  const b = xpAt(points, end);
  if (!a || !b) return null;
  const days = (Math.min(end, b.point.at) - a.point.at) / DAY_MS;
  if (days < 3) return null;
  const to = b.point.xp;
  const from = aligned(a.point.xp, to);
  return { hoursPerDay: Math.max(0, hoursLeft(from, selections) - hoursLeft(to, selections)) / days, days };
}

export function projectDate(from: number, hours: number, hoursPerDay: number): number | null {
  if (hoursPerDay <= 0.01) return null;
  return from + (hours / hoursPerDay) * DAY_MS;
}

// --- Milestones ---------------------------------------------------------------------------------
export type Milestone = { kind: "99" | "total" | "max"; label: string; hours: number };

// Simulates training the shortest remaining skills first (selected methods, combat grouping kept)
// and reports when each 99 and the next round total levels land, in cumulative hours.
// Linked skills (Slayer overlapping melee, free HP) level up during the melee segments.
export function milestones(skills: Skill[], selections: Record<string, number>, currentTotal: number, maxTotal: number): Milestone[] {
  const plan = computeMaxPlan(skills, selections);
  const byName = Object.fromEntries(skills.map((s) => [s.name, s]));
  const timed = plan.lines.filter((l) => l.hours > 0).sort((a, b) => a.hours - b.hours);
  const linked = plan.lines.filter((l) => l.hours <= 0 && l.remainingXp > 0);

  type Ev = { t: number; skill: string; level: number };
  const events: Ev[] = [];
  const melee: { from: number; to: number }[] = [];
  let cum = 0;
  for (const line of timed) {
    const s = byName[line.name];
    const rate = line.remainingXp / line.hours; // effective (grouping-aware) xp/h
    for (let L = s.level + 1; L <= 99; L++) {
      events.push({ t: cum + Math.max(0, xpForLevel(L) - s.xp) / rate, skill: line.name, level: L });
    }
    if (["Attack", "Strength", "Defence"].includes(line.name)) melee.push({ from: cum, to: cum + line.hours });
    cum += line.hours;
  }
  // Map "h hours of melee training" onto the simulated timeline.
  const onMelee = (h: number) => {
    let left = h;
    for (const seg of melee) {
      const len = seg.to - seg.from;
      if (left <= len) return seg.from + left;
      left -= len;
    }
    return melee.length ? melee[melee.length - 1].to : 0;
  };
  for (const line of linked) {
    const s = byName[line.name];
    const rate = line.method.rate || 50000;
    for (let L = s.level + 1; L <= 99; L++) {
      events.push({ t: onMelee(Math.max(0, xpForLevel(L) - s.xp) / rate), skill: line.name, level: L });
    }
  }
  events.sort((a, b) => a.t - b.t);

  const out: Milestone[] = [];
  const marks = [10, 20]
    .map((n) => Math.floor(currentTotal / 10) * 10 + n)
    .filter((t) => t < maxTotal);
  let total = currentTotal;
  let mi = 0;
  for (const e of events) {
    total++;
    if (mi < marks.length && total >= marks[mi]) {
      out.push({ kind: "total", label: `${marks[mi].toLocaleString()} total`, hours: e.t });
      mi++;
    }
    if (e.level === 99) out.push({ kind: "99", label: `${e.skill} 99`, hours: e.t });
  }
  // The last 99 is the max cape itself.
  const last = [...out].reverse().find((m) => m.kind === "99");
  if (last) {
    last.kind = "max";
    last.label = `Max cape (${last.label.replace(" 99", "")} last)`;
  }
  return out;
}

export { addDays, addMonths, DAY_MS };
