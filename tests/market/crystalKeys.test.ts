import { describe, expect, it } from "vitest";
import { crystalKeyPlan } from "@/lib/market/crystalKeys";

// Prices and volumes as seen on 2026-10-02.
const tooth = { high: 10_100, low: 9_929, dailyVolume: 9_432 };
const loop = { high: 9_587, low: 9_438, dailyVolume: 13_299 };
const key = { high: 20_351, low: 19_917, dailyVolume: 23_392 };

describe("crystalKeyPlan", () => {
  it("loses money buying and selling instantly, after the 2% tax", () => {
    // 19,917 - 398 tax - 10,100 - 9,587
    expect(crystalKeyPlan(tooth, loop, key).instantMarginGp).toBe(19_917 - 398 - 10_100 - 9_587);
  });

  it("makes a margin with patient offers", () => {
    // 20,351 - 407 tax - 9,929 - 9,438 = 577
    expect(crystalKeyPlan(tooth, loop, key).patientMarginGp).toBe(577);
  });

  it("caps keys a day at 10% of the thinnest market and multiplies by the patient margin", () => {
    const p = crystalKeyPlan(tooth, loop, key);
    expect(p.bottleneck).toBe("tooth");
    expect(p.keysPerDay).toBe(943);
    expect(p.profitPerDayGp).toBe(943 * 577);
  });

  it("respects six 4-hour buy-limit windows a day", () => {
    expect(crystalKeyPlan(tooth, loop, key, 100).keysPerDay).toBe(600);
  });

  it("reports no daily profit when the patient margin is gone or prices are missing", () => {
    expect(crystalKeyPlan(tooth, loop, { ...key, high: 19_000 }).profitPerDayGp).toBeNull();
    const p = crystalKeyPlan({ ...tooth, low: null }, loop, key);
    expect(p.patientMarginGp).toBeNull();
    expect(p.profitPerDayGp).toBeNull();
  });
});
