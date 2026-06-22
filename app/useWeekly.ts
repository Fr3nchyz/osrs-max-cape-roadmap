"use client";

import { useState, useEffect } from "react";
import type { Skill } from "./skills";

const BASELINE_KEY = "osrs-weekly-baseline-fr3nchy";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Baseline = { takenAt: string; xp: Record<string, number> };
export type Weekly = {
  gains: Record<string, number>;
  total: number;
  source: "wom" | "local";
  since: string;
};

function readBaseline(): Baseline | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? (JSON.parse(raw) as Baseline) : null;
  } catch {
    return null;
  }
}

// Weekly XP gained per skill. Local baseline (snapshot in localStorage) always works; WOM overlays
// it with authoritative numbers when the account is tracked.
export function useWeekly(data: Skill[]): Weekly {
  const [local, setLocal] = useState<{ gains: Record<string, number>; since: string }>({
    gains: {},
    since: new Date().toISOString(),
  });
  const [wom, setWom] = useState<Record<string, number> | null>(null);

  // Maintain the local baseline + compute local gains once live data is in.
  useEffect(() => {
    if (!data.length) return;
    const current: Record<string, number> = {};
    data.forEach((s) => {
      if (s.name !== "Overall") current[s.name] = s.xp;
    });

    let baseline = readBaseline();
    if (!baseline || Date.now() - new Date(baseline.takenAt).getTime() > WEEK_MS) {
      baseline = { takenAt: new Date().toISOString(), xp: current };
      try {
        localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
      } catch {
        /* storage unavailable */
      }
    }

    const gains: Record<string, number> = {};
    for (const [name, xp] of Object.entries(current)) {
      const g = xp - (baseline.xp[name] ?? xp);
      if (g > 0) gains[name] = g;
    }
    setLocal({ gains, since: baseline.takenAt });
  }, [data]);

  // Overlay WOM (best-effort; never blocks render).
  useEffect(() => {
    let alive = true;
    fetch("/api/gains")
      .then((r) => r.json())
      .then((j) => {
        if (alive && j?.status === "ok" && j.skills && Object.keys(j.skills).length > 0) {
          setWom(j.skills as Record<string, number>);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const gains = wom ?? local.gains;
  const total = Object.values(gains).reduce((a, b) => a + b, 0);
  return { gains, total, source: wom ? "wom" : "local", since: local.since };
}
