import { describe, expect, it } from "vitest";
import {
  calculateMargin,
  calculateVelocity,
  priceAgeMinutes,
  profitPerSlotHour,
  throughputPerHour,
  volumeSpikeRatio,
} from "@/lib/market/calc";

describe("calculateMargin", () => {
  it("nets out the GE tax", () => {
    const result = calculateMargin(
      { itemId: 4151, highPrice: 2_000_000, lowPrice: 1_900_000 },
      70,
    );
    expect(result.grossMargin).toBe(100_000);
    expect(result.taxPerItem).toBe(40_000); // 2% of the 2m sale price
    expect(result.netMargin).toBe(60_000);
    expect(result.roiPercent).toBeCloseTo(3.16, 2);
    expect(result.profitPerLimit).toBe(60_000 * 70);
    expect(result.capitalPerLimit).toBe(1_900_000 * 70);
  });

  it("reports a loss when the tax eats the spread", () => {
    const result = calculateMargin({ itemId: 1, highPrice: 1_000_000, lowPrice: 995_000 });
    expect(result.grossMargin).toBe(5_000);
    expect(result.netMargin).toBe(-15_000); // 20k tax swallows the 5k spread
    expect(result.roiPercent).toBeLessThan(0);
  });

  it("skips the tax for exempt items", () => {
    const taxed = calculateMargin({ itemId: 4151, highPrice: 5_000_000, lowPrice: 4_900_000 });
    const exempt = calculateMargin({ itemId: 13190, highPrice: 5_000_000, lowPrice: 4_900_000 });
    expect(taxed.netMargin).toBe(0); // 100k spread, exactly eaten by 100k tax
    expect(exempt.netMargin).toBe(100_000);
  });

  it("returns zeroes rather than NaN when prices are missing", () => {
    const result = calculateMargin({ itemId: 1, highPrice: null, lowPrice: null }, 100);
    expect(result.netMargin).toBe(0);
    expect(result.roiPercent).toBe(0);
    expect(result.profitPerLimit).toBe(0);
  });

  it("treats a zero or absent buy limit as unknown, not unlimited", () => {
    expect(calculateMargin({ itemId: 1, highPrice: 100, lowPrice: 90 }, 0).profitPerLimit).toBeNull();
    expect(calculateMargin({ itemId: 1, highPrice: 100, lowPrice: 90 }).capitalPerLimit).toBeNull();
  });
});

describe("calculateVelocity", () => {
  it("extrapolates a 5-minute window to an hourly rate", () => {
    const result = calculateVelocity({ highVolume: 500, lowVolume: 500, windowMinutes: 5 });
    expect(result.totalVolume).toBe(1000);
    expect(result.hourlyVolume).toBe(12_000);
    expect(result.flowImbalance).toBe(0);
  });

  it("reports one-sided flow", () => {
    expect(
      calculateVelocity({ highVolume: 900, lowVolume: 100, windowMinutes: 60 }).flowImbalance,
    ).toBeCloseTo(0.8);
    expect(
      calculateVelocity({ highVolume: 0, lowVolume: 400, windowMinutes: 60 }).flowImbalance,
    ).toBe(-1);
  });

  it("handles a dead item without dividing by zero", () => {
    const result = calculateVelocity({ highVolume: 0, lowVolume: 0, windowMinutes: 60 });
    expect(result.hourlyVolume).toBe(0);
    expect(result.flowImbalance).toBe(0);
  });
});

describe("throughputPerHour", () => {
  it("is bounded by the 4-hour buy limit", () => {
    // 8000 per 4h = 2000/hr, even though the market moves 50k/hr.
    expect(throughputPerHour(8000, 50_000)).toBe(2000);
  });

  it("is bounded by market liquidity when the limit is generous", () => {
    expect(throughputPerHour(40_000, 300)).toBe(300);
  });

  it("falls back to liquidity when the limit is unknown", () => {
    expect(throughputPerHour(null, 750)).toBe(750);
  });
});

describe("profitPerSlotHour", () => {
  it("prices a slot at margin x throughput", () => {
    expect(profitPerSlotHour(60_000, 70, 1000)).toBeCloseTo(60_000 * 17.5);
  });
});

describe("volumeSpikeRatio", () => {
  it("measures the multiple over baseline", () => {
    expect(volumeSpikeRatio(30_000, 10_000)).toBe(3);
  });

  it("treats new volume on a dead item as an infinite spike", () => {
    expect(volumeSpikeRatio(500, 0)).toBe(Infinity);
    expect(volumeSpikeRatio(0, 0)).toBe(1);
  });
});

describe("priceAgeMinutes", () => {
  it("measures staleness in minutes", () => {
    const now = new Date("2026-09-08T12:00:00Z");
    expect(priceAgeMinutes(new Date("2026-09-08T11:30:00Z"), now)).toBe(30);
  });

  it("treats a never-traded item as infinitely stale", () => {
    expect(priceAgeMinutes(null)).toBe(Infinity);
  });
});
