import { describe, expect, it } from "vitest";
import { planFlipBook, screenFlips } from "@/lib/market/flipBook";
import type { MarketRow } from "@/lib/market/market";

const NOW = Date.parse("2026-10-02T12:00:00Z");
const fresh = new Date(NOW - 2 * 60_000);
const stale = new Date(NOW - 60 * 60_000);

function row(over: Partial<MarketRow> & { itemId: number }): MarketRow {
  const low = over.lowPrice ?? 1000;
  const high = over.highPrice ?? 1050;
  const tax = Math.floor(high * 0.02);
  const net = high - low - tax;
  return {
    name: `Item ${over.itemId}`,
    icon: null,
    members: true,
    buyLimit: 10_000,
    highAlch: null,
    taxExempt: false,
    highPrice: high,
    lowPrice: low,
    highTime: fresh,
    lowTime: fresh,
    priceAgeMinutes: 2,
    grossMargin: high - low,
    taxPerItem: tax,
    netMargin: net,
    roiPercent: (net / low) * 100,
    profitPerLimit: null,
    capitalPerLimit: null,
    hourlyVolume: 1000,
    avgHigh1h: high,
    avgLow1h: low,
    flowImbalance: 0,
    gpPerSlotHour: 0,
    ...over,
  };
}

describe("screenFlips", () => {
  const vol = { "1": 1_000_000, "2": 1_000_000, "3": 1_000_000, "4": 1_000_000, "5": 100 };

  it("keeps fresh, post-tax ROI >= 1.2% items and sizes by 0.5% of daily volume", () => {
    // 1050 - 21 tax - 1000 = 29 net, 2.9% ROI
    const [c] = screenFlips([row({ itemId: 1 })], vol, 44_000_000, NOW);
    expect(c.netMargin).toBe(29);
    expect(c.units).toBe(5_000);
    expect(c.profitPerCycle).toBe(145_000);
  });

  it("rejects stale sides, thin ROI, and volume too low for one unit", () => {
    const rows = [
      row({ itemId: 2, highTime: stale }),
      row({ itemId: 3, highPrice: 1030 }), // 1030 - 20 - 1000 = 10 net, 1.0% ROI
      row({ itemId: 5 }), // 0.5% of 100 = 0 units
    ];
    expect(screenFlips(rows, vol, 44_000_000, NOW)).toEqual([]);
  });

  it("rejects a spread that doesn't hold on 1-hour averages (one off-price trade)", () => {
    const spike = row({ itemId: 1, lowPrice: 96, highPrice: 134, avgLow1h: 120, avgHigh1h: 122 });
    expect(screenFlips([spike], vol, 44_000_000, NOW)).toEqual([]);
    expect(screenFlips([row({ itemId: 1, avgLow1h: null })], vol, 44_000_000, NOW)).toEqual([]);
  });

  it("rejects unbelievable returns and inactive markets", () => {
    expect(screenFlips([row({ itemId: 1, lowPrice: 1000, highPrice: 3000 })], vol, 44_000_000, NOW)).toEqual([]);
    expect(screenFlips([row({ itemId: 1, hourlyVolume: 5 })], vol, 44_000_000, NOW)).toEqual([]);
    // 18 -> 19: 1 gp margin (untaxed under 50 gp) is under the 2 gp floor.
    expect(screenFlips([row({ itemId: 1, lowPrice: 18, highPrice: 19, avgLow1h: 18, avgHigh1h: 19 })], vol, 44_000_000, NOW)).toEqual([]);
  });

  it("caps units by the buy limit and by 25% of the budget per item", () => {
    expect(screenFlips([row({ itemId: 1, buyLimit: 70 })], vol, 44_000_000, NOW)[0].units).toBe(70);
    // 25% of 1M budget = 250k / 1000 gp = 250 units
    expect(screenFlips([row({ itemId: 1 })], vol, 1_000_000, NOW)[0].units).toBe(250);
  });
});

describe("planFlipBook", () => {
  it("fills at most 8 slots within the budget, best profit first", () => {
    const vol = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1), 1_000_000]));
    const rows = Array.from({ length: 12 }, (_, i) => row({ itemId: i + 1, highPrice: 1040 + i * 5 }));
    const book = planFlipBook(screenFlips(rows, vol, 44_000_000, NOW), 44_000_000);
    expect(book.picks).toHaveLength(8);
    expect(book.picks[0].itemId).toBe(12);
    expect(book.deployed).toBeLessThanOrEqual(44_000_000);
    expect(book.profitPerCycle).toBe(book.picks.reduce((n, p) => n + p.profitPerCycle, 0));
  });

  it("shrinks the last pick to what's left of the budget", () => {
    const vol = { "1": 1_000_000, "2": 1_000_000 };
    const cands = screenFlips([row({ itemId: 1 }), row({ itemId: 2, highPrice: 1040 })], vol, 4_000_000, NOW);
    const book = planFlipBook(cands, 1_500_000);
    expect(book.deployed).toBe(1_500_000);
    expect(book.picks.map((p) => p.units)).toEqual([1_000, 500]);
  });
});
