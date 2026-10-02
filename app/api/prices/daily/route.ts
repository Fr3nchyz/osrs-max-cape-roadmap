import { NextResponse } from "next/server";
import { fetchDaily } from "@/lib/market/wiki";

/** Per item: units traded in 24h and the 24h average sell price, trimmed for the browser. */
export type DailyResponse = { items: Record<string, { volume: number; avgLow: number | null }>; fetchedAt: string };

export async function GET() {
  try {
    const daily = await fetchDaily();
    const items: DailyResponse["items"] = {};
    for (const [id, d] of Object.entries(daily)) {
      items[id] = {
        volume: (d.highPriceVolume ?? 0) + (d.lowPriceVolume ?? 0),
        avgLow: d.avgLowPrice === null ? null : Math.round(d.avgLowPrice),
      };
    }
    const body: DailyResponse = { items, fetchedAt: new Date().toISOString() };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach the OSRS Wiki prices API", detail: String(err) }, { status: 502 });
  }
}
