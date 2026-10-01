import { NextResponse } from "next/server";
import { fetchLatest, fetchTimeseries } from "@/lib/market/wiki";
import { TBOW_ITEM_ID, type TbowPriceResponse } from "@/lib/companion/types";

// The companion's "price refreshed in the last 15 minutes" check trusts `fetchedAt`.
// Time-based revalidation is stale-while-revalidate, so a cached hit after a quiet
// spell could hand back an hours-old price stamped "now". Skip the data cache here
// (2 Wiki calls per refresh); /api/prices/latest keeps the 60s cache.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [latest, series] = await Promise.all([fetchLatest(), fetchTimeseries(TBOW_ITEM_ID, "30d")]);
    const quote = latest[String(TBOW_ITEM_ID)];
    if (!quote) {
      return NextResponse.json({ error: "OSRS Wiki has no latest price for the Twisted bow" }, { status: 502 });
    }

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
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach the OSRS Wiki prices API", detail: String(err) },
      { status: 502 }
    );
  }
}
