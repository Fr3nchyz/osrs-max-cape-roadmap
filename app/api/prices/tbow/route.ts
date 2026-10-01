import { NextResponse } from "next/server";
import { fetchLatest, fetchTimeseries } from "@/lib/market/wiki";
import { TBOW_ITEM_ID, type TbowPriceResponse } from "@/lib/companion/types";

// The companion's "price refreshed in the last 15 minutes" check trusts `fetchedAt`.
// Time-based revalidation is stale-while-revalidate, so a cached hit after a quiet
// spell could hand back an hours-old price stamped "now". `force-dynamic` alone
// doesn't stop that: Next still caches fetches that set `next.revalidate`, as
// wiki.ts does. `force-no-store` does.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  // History is decoration; a failed history call must not hide the live price.
  const [latestResult, seriesResult] = await Promise.allSettled([
    fetchLatest(TBOW_ITEM_ID),
    fetchTimeseries(TBOW_ITEM_ID, "30d"),
  ]);
  if (latestResult.status === "rejected") {
    return NextResponse.json(
      { error: "Failed to reach the OSRS Wiki prices API", detail: String(latestResult.reason) },
      { status: 502 }
    );
  }

  const quote = latestResult.value[String(TBOW_ITEM_ID)];
  if (!quote) {
    return NextResponse.json({ error: "OSRS Wiki has no latest price for the Twisted bow" }, { status: 502 });
  }
  const series = seriesResult.status === "fulfilled" ? seriesResult.value : [];

  const body: TbowPriceResponse = {
    itemId: TBOW_ITEM_ID,
    high: quote.high,
    low: quote.low,
    highTime: quote.highTime,
    lowTime: quote.lowTime,
    // 6-hour averages come back fractional; whole gp is all the UI shows.
    history30d: series.map((p) => ({
      t: p.timestamp,
      high: p.avgHighPrice === null ? null : Math.round(p.avgHighPrice),
      low: p.avgLowPrice === null ? null : Math.round(p.avgLowPrice),
    })),
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(body);
}
