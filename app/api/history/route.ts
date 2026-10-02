import { NextResponse, type NextRequest } from "next/server";

// XP history via the Wise Old Man public API: one point per local day (the last snapshot of that
// day), each a { skill: xp } map. The client derives weekly/monthly gains, pace and the burn-down
// from these. Server-side so we can send a User-Agent (WOM 403s browser requests without one).
const REVALIDATE = 1800; // 30 min

const USERNAME = "fr3nchy";
const UA = "osrs-max-cape-roadmap (https://osrs.amaurymarque.com)";
const BASE = "https://api.wiseoldman.net/v2";
const PAGE = 50;
const MAX_PAGES = 15;

// WOM metric keys -> app skill names.
const NAME_FIX: Record<string, string> = { runecrafting: "Runecraft" };
const skillName = (k: string) => NAME_FIX[k] ?? k.charAt(0).toUpperCase() + k.slice(1);

type WomSnapshot = {
  createdAt: string;
  data?: {
    skills?: Record<string, { experience?: number }>;
    bosses?: Record<string, { kills?: number }>;
    computed?: { ehb?: { value?: number } };
  };
};

/**
 * ehb = Wise Old Man's efficient hours bossed, cumulative (null when missing);
 * kc = lifetime kills per boss with at least one kill, keyed by WOM metric.
 */
export type HistoryPoint = {
  day: string;
  at: string;
  xp: Record<string, number>;
  ehb: number | null;
  kc: Record<string, number>;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const days = Math.min(400, Math.max(7, parseInt(params.get("days") ?? "120") || 120));
  // Minutes east of UTC (e.g. Paris summer = 120) so days bucket on the player's local midnight.
  const tz = Math.max(-900, Math.min(900, parseInt(params.get("tz") ?? "0") || 0));

  // Day-rounded bounds keep the fetch URLs stable, so the 30-min data cache actually hits.
  const start = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const end = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const snapshots: WomSnapshot[] = [];

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = `${BASE}/players/${USERNAME}/snapshots?startDate=${start}&endDate=${end}&limit=${PAGE}&offset=${
        page * PAGE
      }`;
      const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: REVALIDATE } });

      // Not tracked yet -> kick off tracking so future visits have history.
      if (res.status === 404) {
        await fetch(`${BASE}/players/${USERNAME}`, { method: "POST", headers: { "User-Agent": UA } }).catch(
          () => {}
        );
        return NextResponse.json({ status: "tracking_started", points: [] });
      }
      if (!res.ok) return NextResponse.json({ status: "error", points: [] });

      const batch = (await res.json()) as WomSnapshot[];
      snapshots.push(...batch);
      if (batch.length < PAGE) break;
    }
  } catch {
    return NextResponse.json({ status: "error", points: [] });
  }

  // Keep the latest snapshot per local day.
  const byDay = new Map<string, HistoryPoint>();
  for (const snap of snapshots) {
    const t = new Date(snap.createdAt).getTime();
    const day = new Date(t + tz * 60_000).toISOString().slice(0, 10);
    const prev = byDay.get(day);
    if (prev && new Date(prev.at).getTime() >= t) continue;
    const xp: Record<string, number> = {};
    for (const [k, v] of Object.entries(snap.data?.skills ?? {})) {
      if (k === "overall" || typeof v?.experience !== "number" || v.experience < 0) continue;
      xp[skillName(k)] = v.experience;
    }
    const ehb = snap.data?.computed?.ehb?.value;
    const kc: Record<string, number> = {};
    for (const [k, v] of Object.entries(snap.data?.bosses ?? {})) {
      if (typeof v?.kills === "number" && v.kills > 0) kc[k] = v.kills;
    }
    byDay.set(day, { day, at: snap.createdAt, xp, ehb: typeof ehb === "number" && ehb >= 0 ? ehb : null, kc });
  }

  const points = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  return NextResponse.json({ status: "ok", points });
}
