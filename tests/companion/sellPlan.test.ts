import { describe, expect, it } from "vitest";
import { autoPick, daysToSell, partialNet, sellPlan } from "@/lib/companion/sellPlan";
import type { BankValuation, ValuedItem } from "@/lib/companion/types";

const M = 1_000_000;
const item = (itemId: number, quantity: number, netTotal: number, kept = false): ValuedItem => ({
  itemId,
  name: `Item ${itemId}`,
  quantity,
  unitPrice: netTotal / quantity,
  taxPerUnit: 0,
  grossTotal: netTotal,
  netTotal,
  kept,
});
const valuation: BankValuation = {
  cashGp: 70 * M,
  items: [item(1, 1, 47 * M), item(2, 216_586, 40 * M, true), item(3, 2, 22 * M), item(4, 10_000, 3 * M)],
  liquidatableNetGp: 72 * M,
  liquidatableGrossGp: 74 * M,
  keptNetGp: 40 * M,
  unpricedCount: 0,
};

describe("sellPlan", () => {
  const base = { valuation, targetGp: 1_365 * M, weeklyPvmGp: 0, weeksToMax: 0, selection: {}, dailyVolume: {} };

  it("needs bow + reserve minus cash, less PvM income before max", () => {
    expect(sellPlan(base).cashNeededNow).toBe(1_295 * M);
    const p = sellPlan({ ...base, weeklyPvmGp: 14 * M, weeksToMax: 20 });
    expect(p.earnedByMax).toBe(280 * M);
    expect(p.cashNeededAtMax).toBe(1_015 * M);
  });

  it("raises net from picks, ignores kept items, and caps quantity at what you own", () => {
    const p = sellPlan({ ...base, selection: { "1": 1, "2": 1000, "3": 5 } });
    expect(p.lines.map((l) => l.item.itemId)).toEqual([1, 3]);
    expect(p.raisedGp).toBe(69 * M);
    expect(p.stillShort).toBe(1_295 * M - 69 * M);
  });

  it("sells part of a stack pro rata and estimates days at 10% of daily volume", () => {
    const p = sellPlan({ ...base, selection: { "4": 5_000 }, dailyVolume: { "4": 20_000 } });
    expect(p.raisedGp).toBe(1.5 * M);
    expect(p.lines[0].daysToSell).toBe(3);
    expect(p.slowestDays).toBe(3);
  });
});

describe("helpers", () => {
  it("partialNet floors and caps", () => {
    expect(partialNet(item(9, 3, 100), 1)).toBe(33);
    expect(partialNet(item(9, 3, 100), 10)).toBe(100);
  });
  it("daysToSell is at least 1 and null without volume", () => {
    expect(daysToSell(1, 1000)).toBe(1);
    expect(daysToSell(1, 0)).toBeNull();
  });
});

describe("autoPick", () => {
  it("takes the biggest non-kept stacks until the need is covered", () => {
    expect(autoPick(valuation, 60 * M)).toEqual({ selection: { "1": 1, "3": 2 }, covers: true });
  });
  it("says when even everything sellable falls short", () => {
    const r = autoPick(valuation, 500 * M);
    expect(r.covers).toBe(false);
    expect(Object.keys(r.selection)).toEqual(["1", "3", "4"]);
  });
});
