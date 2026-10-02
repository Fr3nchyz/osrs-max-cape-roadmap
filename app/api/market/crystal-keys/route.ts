import { NextResponse } from "next/server";
import { fetchDaily, fetchLatest, fetchMapping } from "@/lib/market/wiki";
import {
  CRYSTAL_KEY_ID,
  LOOP_HALF_ID,
  TOOTH_HALF_ID,
  crystalKeyPlan,
  type CrystalKeyPlan,
  type ItemMarket,
} from "@/lib/market/crystalKeys";

export type CrystalKeysResponse = CrystalKeyPlan & {
  prices: Record<"tooth" | "loop" | "key", ItemMarket>;
  fetchedAt: string;
};

// Prices and volumes ride wiki.ts's data cache (60s latest, 30 min daily, 12h mapping):
// this is a daily-planning figure, not a freshness-checked one.
export async function GET() {
  try {
    const [latest, daily, mapping] = await Promise.all([fetchLatest(), fetchDaily(), fetchMapping()]);
    const market = (id: number): ItemMarket => {
      const q = latest[String(id)];
      const d = daily[String(id)];
      return {
        high: q?.high ?? null,
        low: q?.low ?? null,
        dailyVolume: (d?.highPriceVolume ?? 0) + (d?.lowPriceVolume ?? 0),
      };
    };
    const prices = { tooth: market(TOOTH_HALF_ID), loop: market(LOOP_HALF_ID), key: market(CRYSTAL_KEY_ID) };
    const limits = [TOOTH_HALF_ID, LOOP_HALF_ID].map((id) => mapping.find((m) => m.id === id)?.limit ?? null);
    const buyLimit = limits.every((l): l is number => typeof l === "number") ? Math.min(...limits) : null;

    const body: CrystalKeysResponse = {
      ...crystalKeyPlan(prices.tooth, prices.loop, prices.key, buyLimit),
      prices,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach the OSRS Wiki prices API", detail: String(err) }, { status: 502 });
  }
}
