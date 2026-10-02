import { describe, expect, it } from "vitest";
import { XP_FOR_99 } from "@/app/skills";
import { bossName, maxCountdown, weekRecap, type HistoryPointIn } from "@/lib/recap";

const DAY = 86_400_000;
const MON = Date.parse("2026-09-21T00:00:00Z");
const base = { Slayer: 12_000_000, Mining: 7_000_000, Attack: XP_FOR_99 };
const pt = (dayOffset: number, xp: Record<string, number>, ehb: number | null, kc: Record<string, number>): HistoryPointIn => ({
  at: new Date(MON + dayOffset * DAY).toISOString(),
  xp,
  ehb,
  kc,
});

const history = [
  pt(-1, base, 30, { vorkath: 260, zulrah: 150 }),
  pt(3, { ...base, Slayer: 12_300_000 }, 31.5, { vorkath: 268, zulrah: 150 }),
  pt(6.9, { ...base, Slayer: 12_500_000, Mining: 7_100_000 }, 33, { vorkath: 268, zulrah: 152, sarachnis: 4 }),
];

describe("weekRecap", () => {
  const r = weekRecap(history, MON, MON + 7 * DAY, {})!;

  it("sums XP, levels and maxing hours from the snapshot before the week to the last in it", () => {
    expect(r.xp).toBe(600_000);
    expect(r.maxingHours).toBeGreaterThan(0);
    expect(r.partial).toBe(false);
    expect(r.snapshots).toBe(2);
    expect(r.topSkills.map((s) => s.name)).toEqual(["Slayer", "Mining"]);
  });

  it("takes bossing from the EHB difference and ranks boss kills gained", () => {
    expect(r.bossingHours).toBe(3);
    expect(r.topBosses).toEqual([
      { boss: "Vorkath", kills: 8 },
      { boss: "Sarachnis", kills: 4 },
      { boss: "Zulrah", kills: 2 },
    ]);
  });

  it("is partial when history starts inside the week, and null with no history", () => {
    expect(weekRecap(history.slice(1), MON, MON + 7 * DAY, {})!.partial).toBe(true);
    expect(weekRecap([], MON, MON + 7 * DAY, {})).toBeNull();
  });

  it("leaves bossing unknown when EHB is missing", () => {
    const noEhb = history.map((p) => ({ ...p, ehb: null }));
    expect(weekRecap(noEhb, MON, MON + 7 * DAY, {})!.bossingHours).toBeNull();
  });
});

describe("maxCountdown", () => {
  it("divides hours left by planned and real hours per day", () => {
    const live = { ...base, Slayer: 12_600_000, Mining: 7_150_000 };
    const now = MON + 7 * DAY;
    const c = maxCountdown(live, history, now, {}, 2);
    expect(c.hoursLeft).toBeGreaterThan(0);
    expect(c.plannedDays).toBeCloseTo(c.hoursLeft / 2, 9);
    expect(c.realHoursPerDay).not.toBeNull();
    expect(c.realDays).toBeCloseTo(c.hoursLeft / c.realHoursPerDay!, 9);
  });

  it("has no real pace without enough history and no planned date at 0 hours", () => {
    const c = maxCountdown(base, [], MON, {}, 0);
    expect(c.plannedDays).toBeNull();
    expect(c.realDays).toBeNull();
  });
});

describe("bossName", () => {
  it("turns WOM metrics into names", () => {
    expect(bossName("tombs_of_amascut")).toBe("Tombs of amascut");
  });
});
