/**
 * Session log maths: realized net GP/hour per method, the rolling rate the
 * knowledge base's scenario rule reads, and the method ranking behind Next
 * Best Action. Pure functions; no I/O.
 *
 * Net GP/hour = (loot - supplies - upkeep - death costs) / hours. The
 * knowledge base writes it per kill (KPH x [EV - supplies - charges - death EV]);
 * logging session totals gives the same number without needing drop EVs.
 */

import type { PvmMethod } from "./methods";
import type { MethodStats, ScenarioId, Session } from "./types";

/** "Use the conservative scenario until a method has at least 10 logged hours." */
export const LOGGED_HOURS_THRESHOLD = 10;
/** "Move to the base case only when the rolling average exceeds 5M/hour after supplies and deaths." */
export const BASE_RATE_THRESHOLD = 5_000_000;
/** "Use the aggressive case ... after the rolling average exceeds 7M/hour." */
export const AGGRESSIVE_RATE_THRESHOLD = 7_000_000;

export function sessionNet(s: Session): number {
  return s.lootGp - s.suppliesGp - s.upkeepGp - s.deathCostGp;
}

/** One entry per method that has sessions, most hours first. */
export function methodStats(sessions: Session[]): MethodStats[] {
  const byMethod = new Map<string, { sessions: number; hours: number; netGp: number; kills: number; killHours: number }>();
  for (const s of sessions) {
    const t = byMethod.get(s.methodId) ?? { sessions: 0, hours: 0, netGp: 0, kills: 0, killHours: 0 };
    t.sessions++;
    t.hours += s.hours;
    t.netGp += sessionNet(s);
    if (s.kills !== null) {
      t.kills += s.kills;
      t.killHours += s.hours;
    }
    byMethod.set(s.methodId, t);
  }
  return [...byMethod.entries()]
    .map(([methodId, t]) => ({
      methodId,
      sessions: t.sessions,
      hours: t.hours,
      netGp: t.netGp,
      gpPerHour: t.hours > 0 ? t.netGp / t.hours : 0,
      killsPerHour: t.killHours > 0 ? t.kills / t.killHours : null,
      qualified: t.hours >= LOGGED_HOURS_THRESHOLD,
    }))
    .sort((a, b) => b.hours - a.hours || a.methodId.localeCompare(b.methodId));
}

/**
 * Net GP/hour over your most recent sessions adding up to at least `window`
 * hours (the session that crosses the line counts in full). Newest = latest
 * date, then latest in the log. Null until the log holds `window` hours.
 */
export function rollingRate(sessions: Session[], window = LOGGED_HOURS_THRESHOLD): number | null {
  const newestFirst = sessions
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.date.localeCompare(a.s.date) || b.i - a.i);
  let hours = 0;
  let net = 0;
  for (const { s } of newestFirst) {
    hours += s.hours;
    net += sessionNet(s);
    if (hours >= window) return net / hours;
  }
  return null;
}

/** The knowledge base's scenario selection rule. */
export function activeScenario(
  stats: MethodStats[],
  rolling: number | null,
): { id: Extract<ScenarioId, "conservative" | "base" | "aggressive">; reason: string } {
  if (!stats.some((m) => m.qualified) || rolling === null) {
    return {
      id: "conservative",
      reason: `Conservative until a method has ${LOGGED_HOURS_THRESHOLD} logged hours`,
    };
  }
  if (rolling > AGGRESSIVE_RATE_THRESHOLD) {
    return { id: "aggressive", reason: "Your rolling rate is above 7M an hour; treat aggressive as short-term only" };
  }
  if (rolling > BASE_RATE_THRESHOLD) {
    return { id: "base", reason: "Your rolling rate is above 5M an hour after supplies and deaths" };
  }
  return { id: "conservative", reason: "Your rolling rate is 5M an hour or less, so the plan stays conservative" };
}

export interface RankedMethod {
  method: PvmMethod;
  /** GP per focused hour used for ranking. */
  gpPerHour: number;
  /** "logged" once the method has 10 hours; otherwise the learner planning low (the learning penalty). */
  source: "logged" | "planning";
  stats: MethodStats | null;
}

/**
 * Ranks methods by conservative realized GP/hour: your logged rate once a
 * method has 10 hours, else the low end of its learner range. Methods with
 * neither are returned in `unrated`.
 */
export function rankMethods(
  methods: PvmMethod[],
  stats: MethodStats[],
): { ranked: RankedMethod[]; unrated: PvmMethod[] } {
  const ranked: RankedMethod[] = [];
  const unrated: PvmMethod[] = [];
  for (const method of methods) {
    const st = stats.find((s) => s.methodId === method.id) ?? null;
    if (st?.qualified) ranked.push({ method, gpPerHour: st.gpPerHour, source: "logged", stats: st });
    else if (method.learner) ranked.push({ method, gpPerHour: method.learner[0], source: "planning", stats: st });
    else unrated.push(method);
  }
  ranked.sort((a, b) => b.gpPerHour - a.gpPerHour || a.method.name.localeCompare(b.method.name));
  return { ranked, unrated };
}
