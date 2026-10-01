import { NextResponse } from "next/server";
import { fetchLatest } from "@/lib/market/wiki";
import type { LatestPricesResponse, PriceTable } from "@/lib/companion/types";

// Values a bank import. Rides wiki.ts's 60s data cache: every item's quote in one
// upstream call, trimmed to { high, low } to roughly halve the payload.
export async function GET() {
  try {
    const latest = await fetchLatest();
    const prices: PriceTable = {};
    for (const [id, entry] of Object.entries(latest)) {
      prices[id] = { high: entry.high, low: entry.low };
    }

    const body: LatestPricesResponse = { prices, fetchedAt: new Date().toISOString() };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach the OSRS Wiki prices API", detail: String(err) },
      { status: 502 }
    );
  }
}
