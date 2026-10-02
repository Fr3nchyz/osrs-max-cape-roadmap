import { describe, expect, it } from "vitest";
import { scenarios } from "@/lib/companion/goal";
import { PVM_METHODS, availableMethods, methodById } from "@/lib/companion/methods";
import { nextAction } from "@/lib/companion/nextAction";
import {
  LOGGED_HOURS_THRESHOLD,
  activeScenario,
  methodStats,
  rankMethods,
  rollingRate,
  sessionNet,
} from "@/lib/companion/sessions";
import type { Session } from "@/lib/companion/types";

const M = 1_000_000;
let n = 0;
function session(over: Partial<Session> = {}): Session {
  return {
    id: `s${n++}`,
    date: "2026-10-01",
    methodId: "vorkath",
    hours: 1,
    kills: null,
    lootGp: 5 * M,
    suppliesGp: 1 * M,
    upkeepGp: 0,
    deathCostGp: 0,
    ...over,
  };
}

describe("sessionNet", () => {
  it("is loot minus supplies, upkeep and deaths", () => {
    expect(sessionNet(session({ lootGp: 10 * M, suppliesGp: 2 * M, upkeepGp: 1 * M, deathCostGp: 0.5 * M }))).toBe(
      6.5 * M
    );
  });
  it("can be negative", () => {
    expect(sessionNet(session({ lootGp: 0, suppliesGp: 1 * M }))).toBe(-1 * M);
  });
});

describe("methodStats", () => {
  it("totals per method, most hours first, and flags 10 hours as qualified", () => {
    const stats = methodStats([
      session({ methodId: "toa", hours: 4, lootGp: 12 * M, suppliesGp: 0 }),
      session({ methodId: "vorkath", hours: 6, lootGp: 30 * M, suppliesGp: 6 * M, kills: 150 }),
      session({ methodId: "vorkath", hours: 4, lootGp: 20 * M, suppliesGp: 4 * M, kills: null }),
    ]);
    expect(stats.map((s) => s.methodId)).toEqual(["vorkath", "toa"]);
    const vork = stats[0];
    expect(vork).toMatchObject({ sessions: 2, hours: 10, netGp: 40 * M, gpPerHour: 4 * M, qualified: true });
    // KPH only counts the sessions that tracked kills.
    expect(vork.killsPerHour).toBe(25);
    expect(stats[1]).toMatchObject({ hours: 4, gpPerHour: 3 * M, killsPerHour: null, qualified: false });
  });

  it("returns nothing for an empty log", () => {
    expect(methodStats([])).toEqual([]);
  });
});

describe("rollingRate", () => {
  it("is null until the log holds 10 hours", () => {
    expect(rollingRate([session({ hours: 9.5 })])).toBeNull();
  });

  it("uses the newest sessions up to and including the one crossing 10 hours", () => {
    const log = [
      session({ date: "2026-09-01", hours: 5, lootGp: 0, suppliesGp: 0 }), // oldest: left out
      session({ date: "2026-09-20", hours: 6, lootGp: 36 * M, suppliesGp: 0 }),
      session({ date: "2026-09-25", hours: 5, lootGp: 30 * M, suppliesGp: 0 }),
    ];
    // 5h + 6h = 11h newest-first -> 66M / 11h.
    expect(rollingRate(log)).toBe(6 * M);
  });

  it("orders same-day sessions by their place in the log", () => {
    const log = [
      session({ hours: 10, lootGp: 10 * M, suppliesGp: 0 }),
      session({ hours: 10, lootGp: 50 * M, suppliesGp: 0 }),
    ];
    expect(rollingRate(log)).toBe(5 * M);
  });
});

describe("activeScenario", () => {
  const qualified = methodStats([session({ hours: LOGGED_HOURS_THRESHOLD, lootGp: 60 * M, suppliesGp: 0 })]);

  it("stays conservative until a method has 10 hours", () => {
    const stats = methodStats([session({ hours: 9 })]);
    expect(activeScenario(stats, null).id).toBe("conservative");
    expect(activeScenario(stats, 9 * M).id).toBe("conservative");
  });

  it("moves to base above 5M and aggressive above 7M, exclusive", () => {
    expect(activeScenario(qualified, 5 * M).id).toBe("conservative");
    expect(activeScenario(qualified, 5 * M + 1).id).toBe("base");
    expect(activeScenario(qualified, 7 * M).id).toBe("base");
    expect(activeScenario(qualified, 7 * M + 1).id).toBe("aggressive");
  });
});

describe("rankMethods", () => {
  const all = availableMethods({ dt2Complete: false, noWilderness: true });

  it("ranks by the learner low until a method has 10 logged hours", () => {
    const { ranked, unrated } = rankMethods(all, []);
    expect(ranked.map((r) => r.method.id).slice(0, 3)).toEqual(["maggot-king", "vorkath", "doom"]);
    expect(ranked.every((r) => r.source === "planning")).toBe(true);
    expect(unrated.map((m) => m.id)).toEqual(["slayer", "frost-dragons", "adamant-dragons", "crystal-keys", "other"]);
  });

  it("uses your logged rate once qualified, even when it is lower", () => {
    const stats = methodStats([session({ methodId: "maggot-king", hours: 10, lootGp: 20 * M, suppliesGp: 0 })]);
    const { ranked } = rankMethods(all, stats);
    const maggot = ranked.find((r) => r.method.id === "maggot-king")!;
    expect(maggot).toMatchObject({ source: "logged", gpPerHour: 2 * M });
    expect(ranked[0].method.id).toBe("vorkath");
  });

  it("keeps an under-10-hour method on its planning rate", () => {
    const stats = methodStats([session({ methodId: "vorkath", hours: 3, lootGp: 30 * M, suppliesGp: 0 })]);
    const vork = rankMethods(all, stats).ranked.find((r) => r.method.id === "vorkath")!;
    expect(vork).toMatchObject({ source: "planning", gpPerHour: 3.2 * M });
    expect(vork.stats?.hours).toBe(3);
  });
});

describe("availableMethods", () => {
  it("hides Wilderness methods when asked and DT2 bosses until the quest is done", () => {
    const ids = (dt2Complete: boolean, noWilderness: boolean) =>
      availableMethods({ dt2Complete, noWilderness }).map((m) => m.id);
    expect(ids(false, true)).not.toContain("revenants");
    expect(ids(false, true)).not.toContain("dt2-bosses");
    expect(ids(true, false)).toEqual(PVM_METHODS.map((m) => m.id));
  });

  it("finds methods by id", () => {
    expect(methodById("toa")?.name).toBe("Tombs of Amascut");
    expect(methodById("nope")).toBeUndefined();
  });
});

describe("nextAction", () => {
  const base = { ownsTbow: false, dt2Complete: true, stats: [], weekend: false, topMethod: "Vorkath" };

  it("puts the DT2 quest gate first", () => {
    expect(nextAction({ ...base, dt2Complete: false }).state).toBe("QUEST_GATE");
  });

  it("is learning until ToA or Doom has 10 logged hours, with weekday and weekend blocks", () => {
    expect(nextAction(base)).toMatchObject({ state: "LEARNING", title: expect.stringContaining("Fletching") });
    expect(nextAction({ ...base, weekend: true }).title).toBe("Focused ToA or Doom repetitions");
    // 10 hours of Vorkath doesn't end learning; 10 of ToA does.
    const vork = methodStats([session({ methodId: "vorkath", hours: 10 })]);
    expect(nextAction({ ...base, stats: vork }).state).toBe("LEARNING");
    const toa = methodStats([session({ methodId: "toa", hours: 10 })]);
    expect(nextAction({ ...base, stats: toa })).toMatchObject({ state: "INCOME", title: "Earn with Vorkath" });
  });

  it("is rebuild once the bow is owned, whatever else is true", () => {
    expect(nextAction({ ...base, ownsTbow: true, dt2Complete: false }).state).toBe("REBUILD");
  });
});

describe("scenarios with extra rates", () => {
  it("appends logged and custom rates and skips non-positive ones", () => {
    const r = scenarios(110 * M, 1.5, 4, {
      extra: [
        { id: "logged", label: "Your rate", gpPerHour: 5.5 * M },
        { id: "custom", label: "Custom", gpPerHour: 0 },
      ],
    });
    expect(r.map((x) => x.id)).toEqual(["conservative", "base", "aggressive", "logged"]);
    expect(r[3].focusedHours).toBe(20);
  });
});
