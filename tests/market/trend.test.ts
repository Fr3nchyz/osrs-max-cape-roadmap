import { describe, expect, it } from "vitest";
import { flipWarnings, trendFrom } from "@/lib/market/trend";
import type { WikiTimeseriesPoint } from "@/lib/market/wiki";

const H = 3600;
function series(mids: number[], spread = 0.05): WikiTimeseriesPoint[] {
  return mids.map((m, i) => ({
    timestamp: 1_790_000_000 + i * H,
    avgHighPrice: m * (1 + spread / 2),
    avgLowPrice: m * (1 - spread / 2),
    highPriceVolume: 10,
    lowPriceVolume: 10,
  }));
}
const flat = (n: number, v = 1000) => Array.from({ length: n }, () => v);

describe("trendFrom", () => {
  it("reads 24h and 7d changes and calls a steady climb rising", () => {
    const mids = Array.from({ length: 168 }, (_, i) => 1000 + i);
    const t = trendFrom(series(mids));
    expect(t.change7d).toBeCloseTo(((1167 - 1000) / 1000) * 100, 6);
    expect(t.change24h).toBeCloseTo(((1167 - 1143) / 1143) * 100, 6);
    expect(t.direction).toBe("rising");
    expect(t.rangePosition).toBe(1);
    expect(t.sparkline.length).toBeLessThanOrEqual(30);
  });

  it("calls a sharp 24h drop falling even when the week is flat overall", () => {
    const mids = [...flat(140, 1000), ...Array.from({ length: 28 }, (_, i) => 1000 - i * 2)];
    expect(trendFrom(series(mids)).direction).toBe("falling");
  });

  it("counts hours where the spread beats tax", () => {
    // 0.5% spread on 1000 gp: 1002.5 - 20 tax - 997.5 < 0 every hour.
    expect(trendFrom(series(flat(48), 0.005)).spreadHours).toBe(0);
    // 5% spread: 1025 - 20 - 975 = 30 > 0.
    expect(trendFrom(series(flat(48), 0.05)).spreadHours).toBe(24);
  });

  it("is quiet with too little data", () => {
    const t = trendFrom(series([1000]));
    expect(t).toMatchObject({ change24h: null, change7d: null, direction: "flat", sparkline: [] });
  });

  it("measures volatility as a daily percentage", () => {
    const calm = trendFrom(series(flat(48)));
    const wild = trendFrom(series(Array.from({ length: 48 }, (_, i) => (i % 2 ? 1100 : 900))));
    expect(calm.volatility).toBe(0);
    expect(wild.volatility!).toBeGreaterThan(50);
  });
});

describe("flipWarnings", () => {
  it("flags falling, near-high, inconsistent and volatile", () => {
    const w = flipWarnings({
      change24h: -5,
      change7d: -2,
      direction: "falling",
      volatility: 15,
      spreadHours: 6,
      rangePosition: 0.95,
      sparkline: [],
    });
    expect(w).toHaveLength(4);
  });
});
