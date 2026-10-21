import { describe, expect, it } from "vitest";
import { averageWeek, preferLastMonth, preferLastWeek, startOfWeek, weekDays, weeklySeries, type XpPoint } from "@/app/progress";
import { METHODS_VERSION, methodsFor, migrateSelections } from "@/app/skills";

const DAY = 86_400_000;
// Local-time dates so the tests hold in any timezone.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe("preferLastWeek / preferLastMonth", () => {
  it("opens on last week on Monday and Tuesday only", () => {
    expect(preferLastWeek(at(2026, 10, 19))).toBe(true); // Mon
    expect(preferLastWeek(at(2026, 10, 20))).toBe(true); // Tue
    expect(preferLastWeek(at(2026, 10, 21))).toBe(false); // Wed
    expect(preferLastWeek(at(2026, 10, 25))).toBe(false); // Sun
  });
  it("opens on last month during the first week of a month", () => {
    expect(preferLastMonth(at(2026, 11, 3))).toBe(true);
    expect(preferLastMonth(at(2026, 11, 8))).toBe(false);
  });
});

describe("weeklySeries", () => {
  const now = at(2026, 10, 21); // Wed
  const thisWeek = startOfWeek(now);
  // Fishing gains 100k XP every day for 5 weeks.
  const points: XpPoint[] = [];
  for (let i = 35; i >= 0; i--) {
    const t = thisWeek - i * DAY + 6 * 3_600_000; // 06:00 each day
    if (t < now) points.push({ at: t, xp: { Fishing: 5_000_000 + (35 - i) * 100_000 } });
  }
  points.push({ at: now, xp: { Fishing: 5_000_000 + 35 * 100_000 + 50_000 } });
  const weeks = weeklySeries(points, now, {}, 6);

  it("returns calendar weeks oldest first with the current week last", () => {
    expect(weeks).toHaveLength(6);
    expect(weeks[5].current).toBe(true);
    expect(weeks[5].start).toBe(thisWeek);
    expect(weeks[4].start).toBe(thisWeek - 7 * DAY);
  });
  it("marks weeks before history as unknown and sums full weeks", () => {
    expect(weeks[0].known).toBe(false);
    expect(weeks[4].known).toBe(true);
    expect(weeks[4].xp).toBe(700_000);
    expect(weeks[4].top).toBe("Fishing");
    expect(weeks[4].hours).toBeGreaterThan(0);
  });
  it("averages only finished, known weeks", () => {
    expect(averageWeek(weeks, "xp")).toBe(700_000);
  });
  it("builds last week's daily bars from an explicit week start", () => {
    const days = weekDays(points, now, {}, thisWeek - 7 * DAY);
    expect(days).toHaveLength(7);
    expect(days.every((d) => d.hours !== null && d.hours > 0)).toBe(true);
  });
});

describe("migrateSelections", () => {
  it("points old Fletching/Mining picks at the new index-0 methods", () => {
    expect(methodsFor("Fletching")[0].name).toMatch(/Amethyst Arrows/);
    expect(methodsFor("Mining")[0].name).toMatch(/Volcanic Mine/);
    expect(migrateSelections({ Fletching: 2, Mining: 1, Herblore: 1 })).toEqual({ Fletching: 0, Mining: 0, Herblore: 1 });
  });
  it("leaves current-version picks alone", () => {
    const picks = { Fletching: 3, Mining: 2 };
    expect(migrateSelections(picks, METHODS_VERSION)).toBe(picks);
  });
});
