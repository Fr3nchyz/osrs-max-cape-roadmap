import { NextResponse, type NextRequest } from "next/server";
import { getMarketSnapshot } from "@/lib/market/market";
import { fetchDaily } from "@/lib/market/wiki";
import { planFlipBook, screenFlips, type FlipBook } from "@/lib/market/flipBook";

export type FlipBookResponse = FlipBook & { fetchedAt: string };

// Rides wiki.ts's caches (60s latest, 30 min hourly/daily): flips need fresh
// quotes, and the screen rejects any side older than 15 minutes anyway.
export async function GET(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("budget"));
  const budget = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 2_147_000_000) : 0;
  try {
    const [rows, daily] = await Promise.all([getMarketSnapshot(), fetchDaily()]);
    const volume: Record<string, number> = {};
    for (const [id, d] of Object.entries(daily)) volume[id] = (d.highPriceVolume ?? 0) + (d.lowPriceVolume ?? 0);
    const body: FlipBookResponse = {
      ...planFlipBook(screenFlips(rows, volume, budget), budget),
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach the OSRS Wiki prices API", detail: String(err) }, { status: 502 });
  }
}
