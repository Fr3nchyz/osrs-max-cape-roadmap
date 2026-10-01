import { describe, expect, it } from "vitest";
import { allocateSlots } from "@/lib/market/allocator";
import type { MarketRow } from "@/lib/market/market";

function row(overrides: Partial<MarketRow>): MarketRow {
  return {
    itemId: 1,
    name: "Test item",
    icon: null,
    members: true,
    buyLimit: 100,
    highAlch: null,
    taxExempt: false,
    highPrice: 110,
    lowPrice: 100,
    highTime: null,
    lowTime: null,
    priceAgeMinutes: 0,
    grossMargin: 10,
    taxPerItem: 2,
    netMargin: 8,
    roiPercent: 8,
    profitPerLimit: 800,
    capitalPerLimit: 10_000,
    hourlyVolume: 1000,
    flowImbalance: 0,
    gpPerSlotHour: 8000,
    ...overrides,
  };
}

describe("allocateSlots", () => {
  it("fills each slot up to the buy limit when capital allows", () => {
    const result = allocateSlots([row({ itemId: 1 })], 1_000_000, { slots: 8 });
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0].units).toBe(100); // buy limit binds, not budget
    expect(result.slots[0].capitalSpent).toBe(10_000);
    expect(result.capitalUnallocated).toBe(990_000);
  });

  it("caps units by remaining budget when capital is scarce", () => {
    const result = allocateSlots([row({ itemId: 1 })], 5_000, { slots: 8 });
    expect(result.slots[0].units).toBe(50); // 5000 / 100 = 50, limit is 100
    expect(result.slots[0].limitFillFraction).toBeCloseTo(0.5);
  });

  it("never exceeds the requested slot count", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ itemId: i + 1 }));
    const result = allocateSlots(rows, 100_000_000, { slots: 8 });
    expect(result.slots).toHaveLength(8);
  });

  it("skips items it cannot afford even one unit of", () => {
    const result = allocateSlots([row({ itemId: 1, lowPrice: 1_000_000 })], 500, { slots: 8 });
    expect(result.slots).toHaveLength(0);
    expect(result.capitalUnallocated).toBe(500);
  });

  it("skips items above the per-item capital cap", () => {
    const result = allocateSlots([row({ itemId: 1, capitalPerLimit: 50_000_000 })], 100_000_000, {
      slots: 8,
      maxCapitalPerItem: 10_000_000,
    });
    expect(result.slots).toHaveLength(0);
  });

  it("never allocates the same item twice", () => {
    const result = allocateSlots([row({ itemId: 1 }), row({ itemId: 1 })], 1_000_000, { slots: 8 });
    expect(result.slots).toHaveLength(1);
  });

  it("skips a non-positive margin even if the row is otherwise fillable", () => {
    const result = allocateSlots([row({ itemId: 1, netMargin: 0 })], 1_000_000, { slots: 8 });
    expect(result.slots).toHaveLength(0);
  });

  it("falls back to budget as the cap when the buy limit is unknown", () => {
    const result = allocateSlots([row({ itemId: 1, buyLimit: null })], 5_000, { slots: 8 });
    expect(result.slots[0].units).toBe(50);
    expect(result.slots[0].expectedGpPerHour).toBe(8000); // no limit to scale against
  });

  it("sums gp/hour across all filled slots", () => {
    const rows = [row({ itemId: 1, gpPerSlotHour: 8000 }), row({ itemId: 2, gpPerSlotHour: 4000 })];
    const result = allocateSlots(rows, 1_000_000, { slots: 8 });
    expect(result.totalGpPerHour).toBe(12_000);
  });
});
