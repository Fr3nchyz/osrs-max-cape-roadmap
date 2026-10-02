import { describe, expect, it } from "vitest";
import { computeMaxPlan, xpForLevel, type Skill } from "@/app/skills";
import { DEFAULT_STATE, scenarios, weeklySplit } from "@/lib/companion/goal";
import { BASELINE_FLETCHING_STOCK, downtimeFletchingXp } from "@/lib/companion/fletching";
import { MAX_ORDER, nextMilestone, xpFromHiscores } from "@/lib/maxOrder";
import { planEarnRate } from "@/lib/companion/sessions";
import type { Session } from "@/lib/companion/types";

const M = 1_000_000;

describe("weeklySplit", () => {
  it("splits the 16.5h week 25/75 by default (max first)", () => {
    const s = weeklySplit(DEFAULT_STATE);
    expect(s.totalHours).toBe(16.5);
    expect(s.pvmHours).toBeCloseTo(4.125, 9);
    expect(s.maxingHours).toBeCloseTo(12.375, 9);
  });
  it("clamps the share to 10-90% so neither goal gets zero time", () => {
    expect(weeklySplit({ ...DEFAULT_STATE, pvmShare: 1 }).pvmShare).toBe(0.9);
    expect(weeklySplit({ ...DEFAULT_STATE, pvmShare: 0 }).pvmShare).toBe(0.1);
    expect(weeklySplit({ ...DEFAULT_STATE, pvmShare: Number.NaN }).pvmShare).toBe(0.6);
  });
});

describe("scenarios pvmShare", () => {
  it("turns focused hours into total gameplay with the given share", () => {
    const [c] = scenarios(35 * M, 1.5, 4, { pvmShare: 0.5 });
    expect(c.focusedHours).toBe(10);
    expect(c.totalHours).toBe(20);
  });
});

describe("planEarnRate", () => {
  const s = (over: Partial<Session> = {}): Session => ({
    id: "x",
    date: "2026-10-01",
    methodId: "toa",
    hours: 10,
    kills: null,
    lootGp: 45 * M,
    suppliesGp: 5 * M,
    upkeepGp: 0,
    deathCostGp: 0,
    ...over,
  });

  it("is the active scenario's rate with no log", () => {
    expect(planEarnRate({ sessions: [], customGpPerHour: 0 })).toMatchObject({ gpPerHour: 3.5 * M, source: "conservative" });
  });
  it("is your rolling rate once a method has 10 hours", () => {
    expect(planEarnRate({ sessions: [s()], customGpPerHour: 0 })).toMatchObject({ gpPerHour: 4 * M, source: "logged" });
  });
  it("ignores a negative rolling rate and keeps the scenario", () => {
    expect(planEarnRate({ sessions: [s({ lootGp: 0 })], customGpPerHour: 0 }).source).toBe("conservative");
  });
  it("prefers a custom rate over everything", () => {
    expect(planEarnRate({ sessions: [s()], customGpPerHour: 6 * M })).toMatchObject({ gpPerHour: 6 * M, source: "custom" });
  });
});

describe("nextMilestone", () => {
  // fr3nchy on 2026-10-02.
  const xp = { Slayer: 12_982_118, Hunter: 8_771_087, Mining: 7_138_822, Sailing: 9_684_420, Fletching: 9_110_694 };

  it("starts with Slayer 99", () => {
    const n = nextMilestone(xp)!;
    expect(n.index).toBe(0);
    expect(n.milestone).toMatchObject({ skill: "Slayer", level: 99 });
    expect(n.xpToGo).toBe(xpForLevel(99) - 12_982_118);
  });
  it("skips milestones already reached", () => {
    const n = nextMilestone({ ...xp, Slayer: xpForLevel(99), Hunter: xpForLevel(98) })!;
    expect(n.milestone).toMatchObject({ skill: "Mining", level: 97 });
    expect(n.index).toBe(2);
  });
  it("is null when the whole order is done", () => {
    const all = Object.fromEntries(MAX_ORDER.map((m) => [m.skill, xpForLevel(99)]));
    expect(nextMilestone(all)).toBeNull();
  });
  it("reads XP per skill from the HiScores JSON", () => {
    expect(xpFromHiscores({ skills: [{ name: "Slayer", xp: 5 }, { name: "Bad", xp: -1 }, null] })).toEqual({ Slayer: 5 });
    expect(xpFromHiscores("nope")).toEqual({});
  });
});

describe("computeMaxPlan downtime XP", () => {
  const fletch: Skill = { name: "Fletching", rank: 1, level: 95, xp: 9_110_694, isMaxed: false, remainingXp: 3_923_737 };

  it("removes stock-covered Fletching XP from dedicated hours and GP", () => {
    const free = downtimeFletchingXp(fletch.xp, BASELINE_FLETCHING_STOCK);
    const without = computeMaxPlan([fletch], {}, 0);
    const withStock = computeMaxPlan([fletch], {}, 0, { Fletching: free });
    const rate = without.byName.Fletching.method.rate;
    expect(withStock.byName.Fletching.hours).toBeCloseTo((3_923_737 - free) / rate, 9);
    expect(withStock.byName.Fletching.downtimeXp).toBe(free);
    expect(Math.abs(withStock.netGp)).toBeLessThan(Math.abs(without.netGp));
  });
  it("never counts more downtime than the XP left", () => {
    const plan = computeMaxPlan([fletch], {}, 0, { Fletching: 99 * M });
    expect(plan.byName.Fletching.hours).toBe(0);
    expect(plan.byName.Fletching.downtimeXp).toBe(3_923_737);
  });
});
