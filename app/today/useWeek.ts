"use client";

import { useEffect, useMemo, useState } from "react";
import { periodStats, startOfWeek, type XpPoint } from "../progress";

type Point = { day: string; at: string; xp: Record<string, number>; ehb: number | null };

export interface WeekSoFar {
  /** Maxing hours done this week (XP gained at your roadmap methods' rates); null until loaded. */
  maxingHours: number | null;
  /** Wise Old Man efficient hours bossed this week; null when unknown. */
  bossingHours: number | null;
  /** 0-1 through the week (Monday start). */
  elapsed: number;
  loaded: boolean;
}

/**
 * This week's maxing and bossing hours, automatically from Wise Old Man
 * snapshots (the same feed the roadmap's progress panel uses).
 */
export function useWeek(selections: Record<string, number>): WeekSoFar {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const tz = -new Date().getTimezoneOffset();
    fetch(`/api/history?days=14&tz=${tz}`)
      .then((r) => r.json())
      .then((j) => alive && setPoints(j?.status === "ok" && Array.isArray(j.points) ? j.points : []))
      .catch(() => alive && setPoints([]));
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const weekStart = startOfWeek(now);
    const elapsed = Math.min(1, Math.max(0, (now - weekStart) / (7 * 86_400_000)));
    if (points === null) return { maxingHours: null, bossingHours: null, elapsed, loaded: false };
    const xpPoints: XpPoint[] = points.map((p) => ({ at: Date.parse(p.at), xp: p.xp })).sort((a, b) => a.at - b.at);
    const stats = xpPoints.length ? periodStats(xpPoints, weekStart, now, selections) : null;

    // EHB: last snapshot before the week (or the first in it) to the latest one.
    const withEhb = points
      .filter((p) => p.ehb !== null)
      .map((p) => ({ at: Date.parse(p.at), ehb: p.ehb as number }))
      .sort((a, b) => a.at - b.at);
    const base = [...withEhb].reverse().find((p) => p.at <= weekStart) ?? withEhb[0];
    const last = withEhb[withEhb.length - 1];
    const bossingHours = base && last ? Math.max(0, last.ehb - base.ehb) : null;

    return { maxingHours: stats ? stats.hours : null, bossingHours, elapsed, loaded: true };
  }, [points, selections, now]);
}

/** The roadmap's selected training method per skill, from its saved settings. */
export function readRoadmapSelections(): Record<string, number> {
  try {
    const raw = localStorage.getItem("osrs-maxcape-fr3nchy");
    const methods = raw ? (JSON.parse(raw) as { methods?: unknown }).methods : null;
    if (typeof methods !== "object" || methods === null) return {};
    return Object.fromEntries(
      Object.entries(methods as Record<string, unknown>).filter((e): e is [string, number] => Number.isInteger(e[1]))
    );
  } catch {
    return {};
  }
}
