import { NextResponse } from "next/server";

// Weekly XP gains via the Wise Old Man public API. Server-side so we can send a User-Agent
// (WOM 403s browser requests without one) and avoid CORS.
export const revalidate = 1800; // 30 min

const USERNAME = "fr3nchy";
const UA = "osrs-max-cape-roadmap (https://osrs.amaurymarque.com)";
const BASE = "https://api.wiseoldman.net/v2";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type WomGains = {
  data?: { skills?: Record<string, { experience?: { gained?: number } }> };
};

export async function GET() {
  try {
    const res = await fetch(`${BASE}/players/${USERNAME}/gained?period=week`, {
      headers: { "User-Agent": UA },
      next: { revalidate },
    });

    // Not tracked yet -> kick off tracking so future weeks have data, report back.
    if (res.status === 404) {
      await fetch(`${BASE}/players/${USERNAME}`, {
        method: "POST",
        headers: { "User-Agent": UA },
      }).catch(() => {});
      return NextResponse.json({ status: "tracking_started", skills: {} });
    }

    if (!res.ok) return NextResponse.json({ status: "error", skills: {} });

    const json = (await res.json()) as WomGains;
    const skills: Record<string, number> = {};
    for (const [key, val] of Object.entries(json.data?.skills ?? {})) {
      if (key === "overall") continue;
      const gained = val?.experience?.gained ?? 0;
      if (gained > 0) skills[cap(key)] = gained;
    }
    return NextResponse.json({ status: "ok", skills });
  } catch {
    return NextResponse.json({ status: "error", skills: {} });
  }
}
