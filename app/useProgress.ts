"use client";

import { useState, useEffect, useMemo } from "react";
import type { Skill } from "./skills";
import {
  periodStats,
  weekDays,
  burnDown,
  paceAt,
  xpAt,
  hoursLeft,
  startOfWeek,
  startOfMonth,
  addDays,
  addMonths,
  DAY_MS,
  type XpPoint,
  type PeriodStats,
  type DayBar,
  type BurnPoint,
  type Pace,
} from "./progress";

const HISTORY_KEY = "osrs-xp-history-fr3nchy";
const LEGACY_BASELINE_KEY = "osrs-weekly-baseline-fr3nchy";
const KEEP_DAYS = 400;

type LocalHistory = Record<string, { at: string; xp: Record<string, number> }>; // keyed by local day

export type Progress = {
  ready: boolean;
  now: number; // "as of" time of the live data (epoch ms)
  source: "wom" | "local";
  week: PeriodStats | null;
  lastWeek: PeriodStats | null;
  month: PeriodStats | null;
  lastMonth: PeriodStats | null;
  days: DayBar[];
  burn: BurnPoint[];
  pace: Pace | null; // last 28 days, ending now
  paceWeekAgo: Pace | null; // last 28 days, ending 7 days ago
  hoursWeekAgo: number | null; // time-to-max as it stood 7 days ago
};

const localDay = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function readLocal(): LocalHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const hist: LocalHistory = raw ? JSON.parse(raw) : {};
    // One-time migration of the old rolling weekly baseline into the daily history.
    const legacy = localStorage.getItem(LEGACY_BASELINE_KEY);
    if (legacy) {
      const b = JSON.parse(legacy) as { takenAt: string; xp: Record<string, number> };
      const day = localDay(new Date(b.takenAt).getTime());
      if (!hist[day]) hist[day] = { at: b.takenAt, xp: b.xp };
      localStorage.removeItem(LEGACY_BASELINE_KEY);
    }
    return hist;
  } catch {
    return {};
  }
}

function writeLocal(hist: LocalHistory) {
  try {
    const cutoff = localDay(Date.now() - KEEP_DAYS * DAY_MS);
    const pruned = Object.fromEntries(Object.entries(hist).filter(([d]) => d >= cutoff));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
  } catch {
    /* storage unavailable */
  }
}

// Weekly/monthly progress, daily bars, burn-down and real pace. History = Wise Old Man daily
// snapshots merged with a local daily snapshot (so it still works if WOM is down/untracked);
// the live HiScores data is always the "now" point.
export function useProgress(data: Skill[], selections: Record<string, number>): Progress {
  const [local, setLocal] = useState<LocalHistory>({});
  const [asOf, setAsOf] = useState(0);
  const [wom, setWom] = useState<{ day: string; at: string; xp: Record<string, number> }[]>([]);
  const [womLoaded, setWomLoaded] = useState(false);

  // Record today's live snapshot locally (one per local day, latest wins).
  useEffect(() => {
    if (!data.length) return;
    const xp: Record<string, number> = {};
    data.forEach((s) => {
      if (s.name !== "Overall" && !s.estimated) xp[s.name] = s.xp;
    });
    const hist = readLocal();
    const t = Date.now();
    hist[localDay(t)] = { at: new Date(t).toISOString(), xp };
    writeLocal(hist);
    setLocal(hist);
    setAsOf(t);
  }, [data]);

  useEffect(() => {
    let alive = true;
    const tz = -new Date().getTimezoneOffset();
    fetch(`/api/history?days=120&tz=${tz}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive && j?.status === "ok" && Array.isArray(j.points)) setWom(j.points);
      })
      .catch(() => {})
      .finally(() => alive && setWomLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  return useMemo<Progress>(() => {
    const now = asOf;
    // Merge per day, latest snapshot wins; then append the live point.
    const byDay = new Map<string, XpPoint>();
    const put = (day: string, at: string, xp: Record<string, number>) => {
      const t = new Date(at).getTime();
      const prev = byDay.get(day);
      if (!prev || prev.at < t) byDay.set(day, { at: t, xp: { ...(prev?.xp ?? {}), ...xp } });
    };
    wom.forEach((p) => put(p.day, p.at, p.xp));
    Object.entries(local).forEach(([day, p]) => put(day, p.at, p.xp));

    const liveXp: Record<string, number> = {};
    data.forEach((s) => {
      if (s.name !== "Overall") liveXp[s.name] = s.xp;
    });
    const points = [...byDay.values()].filter((p) => p.at < now - 60_000).sort((a, b) => a.at - b.at);
    if (data.length) points.push({ at: now, xp: liveXp });

    const ws = startOfWeek(now);
    const ms = startOfMonth(now);
    const weekAgo = xpAt(points, now - 7 * DAY_MS);
    const stats = (a: number, b: number) => (points.length ? periodStats(points, a, b, selections) : null);

    return {
      ready: data.length > 0 && womLoaded && asOf > 0,
      now,
      source: wom.length ? "wom" : "local",
      week: stats(ws, now),
      lastWeek: stats(addDays(ws, -7), ws),
      month: stats(ms, now),
      lastMonth: stats(addMonths(ms, -1), ms),
      days: weekDays(points, now, selections),
      burn: burnDown(points, now, selections),
      pace: paceAt(points, now, selections),
      paceWeekAgo: paceAt(points, now - 7 * DAY_MS, selections),
      hoursWeekAgo: weekAgo?.exact ? hoursLeft({ ...liveXp, ...weekAgo.point.xp }, selections) : null,
    };
  }, [wom, local, data, selections, womLoaded, asOf]);
}
