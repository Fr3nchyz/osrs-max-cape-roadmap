import { describe, expect, it } from "vitest";
import {
  BANK_IMPORT_FRESH_HOURS,
  CHECKLIST,
  DEFAULT_STATE,
  PRICE_FRESH_MINUTES,
  PVM_SHARE,
  SCENARIO_RATES,
  STAGE_ORDER,
  approxNetProceeds,
  bossKc,
  computeFunding,
  evaluateChecklist,
  fundingStage,
  scenarios,
  weeklyHours,
} from "@/lib/companion/goal";
import type { BankValuation, ChecklistId, CompanionState, Funding } from "@/lib/companion/types";

/** T-bow price used by the knowledge base's own worked figure. */
const PLAN_PRICE = 1_356_626_084;

function state(overrides: Partial<CompanionState> = {}): CompanionState {
  return { ...DEFAULT_STATE, checklist: {}, keepItemIds: [], ...overrides };
}

function valuation(overrides: Partial<BankValuation> = {}): BankValuation {
  return {
    cashGp: 100_000_000,
    items: [],
    liquidatableNetGp: 500_000_000,
    liquidatableGrossGp: 520_000_000,
    keptNetGp: 300_000_000,
    unpricedCount: 0,
    ...overrides,
  };
}

describe("approxNetProceeds", () => {
  it("takes 2% tax then slippage, floored", () => {
    expect(approxNetProceeds(600_000_000, 1)).toBe(582_120_000);
    expect(approxNetProceeds(600_000_000, 0)).toBe(588_000_000);
    expect(approxNetProceeds(1_001, 1)).toBe(971); // 970.9398
  });

  it("floors exactly where the float product lands a hair under an integer", () => {
    // 15,000 x 0.98 x 0.93 = 13,671 exactly; naive float math gives 13,670.999...
    expect(approxNetProceeds(15_000, 7)).toBe(13_671);
  });

  it("never exceeds gross minus a flat 2%", () => {
    for (const gross of [0, 49, 50, 999, 1_000_000, 250_000_000, 2_147_483_647]) {
      for (const pct of [0, 0.5, 1, 3, 7]) {
        const net = approxNetProceeds(gross, pct);
        expect(Number.isInteger(net)).toBe(true);
        expect(net).toBeLessThanOrEqual(gross * 0.98);
        expect(net).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("treats nonsense input pessimistically", () => {
    expect(approxNetProceeds(0, 1)).toBe(0);
    expect(approxNetProceeds(-5_000_000, 1)).toBe(0);
    expect(approxNetProceeds(Number.NaN, 1)).toBe(0);
    // Negative slippage would inflate proceeds; clamp to 0%.
    expect(approxNetProceeds(1_000_000, -10)).toBe(980_000);
    expect(approxNetProceeds(1_000_000, 150)).toBe(0);
    expect(approxNetProceeds(1_000_000, Number.NaN)).toBe(980_000);
  });
});

describe("computeFunding", () => {
  it("reproduces the knowledge base's 721,626,084 gap before costs", () => {
    const f = computeFunding(DEFAULT_STATE, PLAN_PRICE, null);
    expect(f.gapBeforeCostsGp).toBe(721_626_084);
  });

  it("nets tradeables of tax and 1% slippage in manual mode", () => {
    const f = computeFunding(state({ slippagePct: 1 }), PLAN_PRICE, null);
    expect(f).toEqual<Funding>({
      source: "manual",
      tbowPriceGp: PLAN_PRICE,
      targetGp: 1_381_626_084,
      cashGp: 60_000_000,
      tradeablesNetGp: 582_120_000,
      capitalGp: 642_120_000,
      gapGp: 739_506_084,
      gapBeforeCostsGp: 721_626_084,
      progress: 642_120_000 / 1_381_626_084,
    });
  });

  it("uses the bank valuation only when useBankImport is on and a valuation exists", () => {
    const v = valuation();
    const bank = computeFunding(state({ useBankImport: true }), PLAN_PRICE, v);
    expect(bank.source).toBe("bank");
    expect(bank.cashGp).toBe(100_000_000);
    expect(bank.tradeablesNetGp).toBe(500_000_000);
    expect(bank.capitalGp).toBe(600_000_000);
    expect(bank.gapGp).toBe(1_381_626_084 - 600_000_000);
    expect(bank.gapBeforeCostsGp).toBe(1_381_626_084 - 620_000_000);

    // Kept items never count towards capital.
    expect(bank.capitalGp).not.toBe(600_000_000 + v.keptNetGp);

    const toggledOff = computeFunding(state({ useBankImport: false }), PLAN_PRICE, v);
    expect(toggledOff.source).toBe("manual");
    expect(toggledOff.capitalGp).toBe(642_120_000);

    const noValuation = computeFunding(state({ useBankImport: true }), PLAN_PRICE, null);
    expect(noValuation.source).toBe("manual");
    expect(noValuation.capitalGp).toBe(642_120_000);
  });

  it("ignores manual cash and tradeables in bank mode", () => {
    const f = computeFunding(
      state({ useBankImport: true, cashGp: 999_999_999, tradeablesGp: 999_999_999 }),
      PLAN_PRICE,
      valuation(),
    );
    expect(f.cashGp).toBe(100_000_000);
    expect(f.tradeablesNetGp).toBe(500_000_000);
  });

  it("never reports a negative gap and caps progress at 1", () => {
    const f = computeFunding(state({ cashGp: 2_000_000_000 }), PLAN_PRICE, null);
    expect(f.gapGp).toBe(0);
    expect(f.gapBeforeCostsGp).toBe(0);
    expect(f.progress).toBe(1);
  });

  it("covers the gap only once costs are counted, not before", () => {
    // Gross capital exactly hits the target; after tax and slippage it doesn't.
    const f = computeFunding(state({ cashGp: 81_626_084, tradeablesGp: 1_300_000_000 }), PLAN_PRICE, null);
    expect(f.gapBeforeCostsGp).toBe(0);
    expect(f.gapGp).toBeGreaterThan(0);
  });

  it("reports progress 0 with no capital and 1 when the target is 0", () => {
    expect(computeFunding(state({ cashGp: 0, tradeablesGp: 0 }), PLAN_PRICE, null).progress).toBe(0);
    const free = computeFunding(state({ cashGp: 0, tradeablesGp: 0, reserveGp: 0 }), 0, null);
    expect(free.targetGp).toBe(0);
    expect(free.gapGp).toBe(0);
    expect(free.progress).toBe(1);
  });

  it("raises the gap as slippage rises", () => {
    const at0 = computeFunding(state({ slippagePct: 0 }), PLAN_PRICE, null);
    const at3 = computeFunding(state({ slippagePct: 3 }), PLAN_PRICE, null);
    expect(at0.tradeablesNetGp).toBe(588_000_000);
    expect(at3.gapGp).toBeGreaterThan(at0.gapGp);
    expect(at3.gapBeforeCostsGp).toBe(at0.gapBeforeCostsGp);
  });
});

describe("fundingStage", () => {
  it.each([
    [1_000_000_000, "ACCUMULATION"],
    [250_000_001, "ACCUMULATION"],
    [250_000_000, "PREPARATION"],
    [150_000_001, "PREPARATION"],
    [150_000_000, "STAGED_LIQUIDATION"],
    [75_000_001, "STAGED_LIQUIDATION"],
    [75_000_000, "PURCHASE_WINDOW"],
    [1, "PURCHASE_WINDOW"],
    [0, "PURCHASE_WINDOW"],
  ] as const)("gap %d -> %s", (gap, stage) => {
    expect(fundingStage(gap, false)).toBe(stage);
  });

  it("is REBUILD whenever the bow is owned, whatever the gap", () => {
    for (const gap of [0, 75_000_000, 250_000_001, 2_000_000_000]) {
      expect(fundingStage(gap, true)).toBe("REBUILD");
    }
  });

  it("puts the plan's own gap in Accumulation", () => {
    const f = computeFunding(DEFAULT_STATE, PLAN_PRICE, null);
    expect(fundingStage(f.gapGp, DEFAULT_STATE.ownsTbow)).toBe("ACCUMULATION");
  });

  it("only returns stages listed in STAGE_ORDER", () => {
    const seen = new Set([0, 80e6, 160e6, 260e6].map((g) => fundingStage(g, false)));
    seen.add(fundingStage(0, true));
    expect([...seen].sort()).toEqual([...STAGE_ORDER].sort());
  });
});

describe("weeklyHours", () => {
  it("is weekday x 5 + weekend x 2", () => {
    expect(weeklyHours(1.5, 4)).toBe(15.5);
    expect(weeklyHours(DEFAULT_STATE.weekdayHours, DEFAULT_STATE.weekendHours)).toBe(15.5);
    expect(weeklyHours(2, 0)).toBe(10);
    expect(weeklyHours(0, 3)).toBe(6);
    expect(weeklyHours(0, 0)).toBe(0);
  });
});

describe("scenarios", () => {
  const GAP = 721_626_084;

  it("returns one result per scenario rate, in order", () => {
    const rows = scenarios(GAP, 1.5, 4);
    expect(rows.map((r) => r.id)).toEqual(["conservative", "base", "aggressive"]);
    expect(rows.map((r) => [r.id, r.label, r.gpPerHour])).toEqual(
      SCENARIO_RATES.map((s) => [s.id, s.label, s.gpPerHour]),
    );
  });

  it("matches the knowledge base's hours for the 721.6M gap", () => {
    const [conservative, base, aggressive] = scenarios(GAP, 1.5, 4);
    expect(conservative.focusedHours).toBeCloseTo(206.18, 2);
    expect(conservative.totalHours).toBeCloseTo(343.6, 1);
    expect(base.focusedHours).toBeCloseTo(131.2, 1);
    expect(aggressive.focusedHours).toBeCloseTo(96.2, 1);
  });

  it("derives total hours from the PvM share and weeks from weekly hours", () => {
    for (const row of scenarios(GAP, 1.5, 4)) {
      expect(row.focusedHours).toBeCloseTo(GAP / row.gpPerHour, 9);
      expect(row.totalHours).toBeCloseTo(row.focusedHours / PVM_SHARE, 9);
      expect(row.weeks).not.toBeNull();
      expect(row.weeks!).toBeCloseTo(row.totalHours / 15.5, 9);
    }
    expect(scenarios(GAP, 1.5, 4)[0].weeks!).toBeCloseTo(22.17, 2);
  });

  it("gives null weeks when no hours are planned", () => {
    for (const row of scenarios(GAP, 0, 0)) {
      expect(row.weeks).toBeNull();
      expect(row.focusedHours).toBeGreaterThan(0);
    }
  });

  it("is all zeros once the gap is closed", () => {
    for (const gap of [0, -10_000_000]) {
      for (const row of scenarios(gap, 1.5, 4)) {
        expect(row.focusedHours).toBe(0);
        expect(row.totalHours).toBe(0);
        expect(row.weeks).toBe(0);
      }
    }
  });
});

describe("evaluateChecklist", () => {
  const NOW = new Date("2026-10-01T12:00:00Z");
  const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
  const MANUAL_IDS = CHECKLIST.filter((c) => !c.auto).map((c) => c.id);
  const allTicked = Object.fromEntries(CHECKLIST.map((c) => [c.id, true])) as Record<ChecklistId, boolean>;

  /** A state that should pass every check against `funded`. */
  const ready = state({
    useBankImport: true,
    bank: { importedAt: hoursAgo(1), items: [] },
    checklist: Object.fromEntries(MANUAL_IDS.map((id) => [id, true])),
  });
  const funded = computeFunding(ready, PLAN_PRICE, valuation({ cashGp: 2_000_000_000 }));

  const passed = (r: ReturnType<typeof evaluateChecklist>, id: ChecklistId) =>
    r.items.find((i) => i.id === id)!.passed;

  it("returns one item per CHECKLIST entry, in order, with its label and kind", () => {
    const r = evaluateChecklist(state(), computeFunding(state(), PLAN_PRICE, null), null, 3, NOW);
    expect(r.items.map(({ id, label, auto }) => ({ id, label, auto }))).toEqual(CHECKLIST);
  });

  it("passes everything for a funded, freshly imported, fully ticked plan", () => {
    expect(funded.source).toBe("bank");
    expect(funded.gapGp).toBe(0);
    const r = evaluateChecklist(ready, funded, 3, 3, NOW);
    expect(r.items.every((i) => i.passed)).toBe(true);
    expect(r.allPassed).toBe(true);
  });

  it("fails allPassed when any single check fails", () => {
    for (const id of MANUAL_IDS) {
      const s = { ...ready, checklist: { ...ready.checklist, [id]: false } };
      const r = evaluateChecklist(s, funded, 3, 3, NOW);
      expect(passed(r, id)).toBe(false);
      expect(r.allPassed).toBe(false);
    }
    expect(evaluateChecklist(ready, funded, null, 3, NOW).allPassed).toBe(false);
    expect(evaluateChecklist(ready, { ...funded, gapGp: 1 }, 3, 3, NOW).allPassed).toBe(false);
  });

  it("evaluates auto items from data and ignores manual ticks for them", () => {
    const s = state({ checklist: allTicked });
    const unfunded = computeFunding(s, PLAN_PRICE, null);
    const r = evaluateChecklist(s, unfunded, null, 3, NOW);
    expect(passed(r, "priceFresh")).toBe(false);
    expect(passed(r, "reserveCovered")).toBe(false);
    expect(passed(r, "proceedsRecalculated")).toBe(false);
    for (const id of MANUAL_IDS) expect(passed(r, id)).toBe(true);
    expect(r.allPassed).toBe(false);
  });

  it("only counts a manual tick of exactly true", () => {
    const r = evaluateChecklist(state({ checklist: { kitsKept: false } }), funded, 3, 3, NOW);
    for (const id of MANUAL_IDS) expect(passed(r, id)).toBe(false);
  });

  it("checks price freshness against PRICE_FRESH_MINUTES", () => {
    expect(PRICE_FRESH_MINUTES).toBe(15);
    expect(passed(evaluateChecklist(ready, funded, 0, 3, NOW), "priceFresh")).toBe(true);
    expect(passed(evaluateChecklist(ready, funded, 15, 3, NOW), "priceFresh")).toBe(true);
    expect(passed(evaluateChecklist(ready, funded, 15.01, 3, NOW), "priceFresh")).toBe(false);
    expect(passed(evaluateChecklist(ready, funded, null, 3, NOW), "priceFresh")).toBe(false);
  });

  it("passes reserveCovered only at a zero gap", () => {
    expect(passed(evaluateChecklist(ready, { ...funded, gapGp: 0 }, 3, 3, NOW), "reserveCovered")).toBe(true);
    expect(passed(evaluateChecklist(ready, { ...funded, gapGp: 1 }, 3, 3, NOW), "reserveCovered")).toBe(false);
  });

  it("needs bank-sourced funding from an import no older than BANK_IMPORT_FRESH_HOURS", () => {
    expect(BANK_IMPORT_FRESH_HOURS).toBe(24);
    const at = (importedAt: string) =>
      passed(evaluateChecklist({ ...ready, bank: { importedAt, items: [] } }, funded, 3, 3, NOW), "proceedsRecalculated");

    expect(at(hoursAgo(0))).toBe(true);
    expect(at(hoursAgo(24))).toBe(true);
    expect(at(hoursAgo(25))).toBe(false);
    expect(at("not a date")).toBe(false);

    // A fresh import doesn't count while funding is still manual.
    const manual = computeFunding({ ...ready, useBankImport: false }, PLAN_PRICE, null);
    expect(passed(evaluateChecklist(ready, manual, 3, 3, NOW), "proceedsRecalculated")).toBe(false);

    // Bank-sourced funding with no import on the state fails too.
    expect(passed(evaluateChecklist({ ...ready, bank: null }, funded, 3, 3, NOW), "proceedsRecalculated")).toBe(false);
  });

  it("fails a 25-hour-old import even when everything else passes", () => {
    const stale = { ...ready, bank: { importedAt: hoursAgo(25), items: [] } };
    const r = evaluateChecklist(stale, funded, 3, 3, NOW);
    expect(passed(r, "proceedsRecalculated")).toBe(false);
    expect(r.items.filter((i) => !i.passed).map((i) => i.id)).toEqual(["proceedsRecalculated"]);
    expect(r.allPassed).toBe(false);
  });

  it("fails an import dated in the future, which would otherwise stay fresh forever", () => {
    const future = { ...ready, bank: { importedAt: hoursAgo(-1), items: [] } };
    expect(passed(evaluateChecklist(future, funded, 3, 3, NOW), "proceedsRecalculated")).toBe(false);
    const farFuture = { ...ready, bank: { importedAt: "2099-01-01T00:00:00Z", items: [] } };
    expect(passed(evaluateChecklist(farFuture, funded, 3, 3, NOW), "proceedsRecalculated")).toBe(false);
  });

  it("needs the item prices valuing the import to be at most PRICE_FRESH_MINUTES old", () => {
    const at = (itemAge: number | null) =>
      passed(evaluateChecklist(ready, funded, 3, itemAge, NOW), "proceedsRecalculated");
    expect(at(0)).toBe(true);
    expect(at(15)).toBe(true);
    expect(at(15.01)).toBe(false);
    expect(at(null)).toBe(false);
    // Stale item prices don't touch the T-bow price check.
    expect(passed(evaluateChecklist(ready, funded, 3, 120, NOW), "priceFresh")).toBe(true);
  });
});

describe("bossKc", () => {
  const SAMPLE = {
    skills: [{ id: 0, name: "Overall", rank: 412_345, level: 2_100, xp: 250_000_000 }],
    activities: [
      { id: 86, name: "Vorkath", rank: 323_070, score: 268 },
      { id: 79, name: "Tombs of Amascut", rank: -1, score: 0 },
      { id: 50, name: "Chambers of Xeric", rank: -1, score: -1 },
    ],
  };

  it("reads a ranked boss's kill count", () => {
    expect(bossKc(SAMPLE, "Vorkath")).toBe(268);
  });

  it("returns 0 for unranked activities, old (-1) or new (0) format", () => {
    expect(bossKc(SAMPLE, "Tombs of Amascut")).toBe(0);
    expect(bossKc(SAMPLE, "Chambers of Xeric")).toBe(0);
  });

  it("needs an exact name match", () => {
    expect(bossKc(SAMPLE, "vorkath")).toBe(0);
    expect(bossKc(SAMPLE, "Vorkath ")).toBe(0);
    expect(bossKc(SAMPLE, "Zulrah")).toBe(0);
    expect(bossKc(SAMPLE, "Overall")).toBe(0); // skills aren't activities
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "Vorkath"],
    ["a number", 268],
    ["an empty object", {}],
    ["activities as a string", { activities: "x" }],
    ["activities as an object", { activities: { name: "Vorkath", score: 268 } }],
    ["junk entries", { activities: [null, 5, "Vorkath", []] }],
    ["a string score", { activities: [{ name: "Vorkath", score: "268" }] }],
    ["a NaN score", { activities: [{ name: "Vorkath", score: Number.NaN }] }],
    ["a missing score", { activities: [{ name: "Vorkath" }] }],
    ["an error payload", { error: "Jagex HiScores returned 404" }],
  ])("returns 0 for %s", (_label, input) => {
    expect(bossKc(input, "Vorkath")).toBe(0);
  });

  it("skips junk entries before the match", () => {
    expect(bossKc({ activities: [null, "x", { name: "Vorkath", score: 12 }] }, "Vorkath")).toBe(12);
  });
});
