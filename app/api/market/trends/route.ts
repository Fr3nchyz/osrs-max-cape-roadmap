import { NextResponse, type NextRequest } from "next/server";
import { fetchTimeseries } from "@/lib/market/wiki";
import { isTaxExempt } from "@/lib/market/tax";
import { trendFrom, type Trend } from "@/lib/market/trend";

/** Up to this many items per request: one Wiki history call each. */
const MAX_IDS = 30;

export type TrendsResponse = { trends: Record<string, Trend>; fetchedAt: string };

// 7-day hourly history rides wiki.ts's 5-minute timeseries cache.
export async function GET(request: NextRequest) {
  const ids = [
    ...new Set(
      (request.nextUrl.searchParams.get("ids") ?? "")
        .split(",")
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ].slice(0, MAX_IDS);

  const results = await Promise.allSettled(ids.map((id) => fetchTimeseries(id, "7d")));
  const trends: Record<string, Trend> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") trends[String(ids[i])] = trendFrom(r.value, isTaxExempt(ids[i]));
  });
  if (ids.length > 0 && Object.keys(trends).length === 0) {
    return NextResponse.json({ error: "Failed to reach the OSRS Wiki prices API" }, { status: 502 });
  }
  const body: TrendsResponse = { trends, fetchedAt: new Date().toISOString() };
  return NextResponse.json(body);
}
