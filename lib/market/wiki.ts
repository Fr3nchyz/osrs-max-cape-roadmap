/**
 * Client for the OSRS Wiki real-time prices API.
 *
 * Docs: https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices
 *
 * Rules of the road, all enforced here rather than at call sites:
 *   * Identify yourself with a descriptive User-Agent.
 *   * /latest updates roughly every 60s; /5m and /1h on their own cadence.
 *     Polling faster than that is pure waste, so responses are cached.
 *   * The mapping endpoint is near-static -- cache it for hours, not seconds.
 *
 * v2 (verified 2026-10-01): same /latest, /mapping, /5m, /1h shapes as v1, but
 * /timeseries takes a `lookback` window and REJECTS v1's `timestep` param.
 *
 * Call these from server routes only: browsers can't set the User-Agent the
 * Wiki asks for, and the Next data cache collapses repeat calls.
 */

export const WIKI_API_BASE = "https://prices.runescape.wiki/api/v2/osrs";

const WIKI_USER_AGENT = "osrs-max-cape-roadmap (osrs.amaurymarque.com; personal tool for fr3nchy)";

/** Raw shape of a /mapping entry. */
export interface WikiMappingEntry {
  id: number;
  name: string;
  examine?: string;
  members?: boolean;
  lowalch?: number;
  highalch?: number;
  limit?: number;
  value?: number;
  icon?: string;
}

/** Raw shape of a /latest entry (values may be null for untraded items). */
export interface WikiLatestEntry {
  high: number | null;
  highTime: number | null;
  low: number | null;
  lowTime: number | null;
}

/** Raw shape of a /5m or /1h entry. */
export interface WikiAveragedEntry {
  avgHighPrice: number | null;
  highPriceVolume: number | null;
  avgLowPrice: number | null;
  lowPriceVolume: number | null;
}

export interface WikiTimeseriesPoint {
  timestamp: number;
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume: number | null;
  lowPriceVolume: number | null;
}

/**
 * v2 history windows. The API picks the resolution: 7d is hourly, 30d is
 * 6-hourly, 6m and 1y are daily (verified 2026-10-01).
 */
export type Lookback = "7d" | "30d" | "6m" | "1y";

/** How long each endpoint's response stays fresh, in seconds. */
const REVALIDATE_SECONDS: Record<string, number> = {
  mapping: 60 * 60 * 12,
  latest: 60,
  "5m": 60 * 5,
  "1h": 60 * 30,
  timeseries: 60 * 5,
};

export class WikiApiError extends Error {
  constructor(
    readonly endpoint: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "WikiApiError";
  }
}

async function wikiFetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const url = new URL(`${WIKI_API_BASE}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": WIKI_USER_AGENT,
      Accept: "application/json",
    },
    // Next's data cache does the rate-limit protection for us: many concurrent
    // scanner requests collapse into one upstream call per revalidate window.
    next: { revalidate: REVALIDATE_SECONDS[endpoint] ?? 60, tags: [`wiki:${endpoint}`] },
  });

  if (!response.ok) {
    throw new WikiApiError(
      endpoint,
      response.status,
      `OSRS Wiki ${endpoint} responded ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

/** Static-ish item reference data: names, buy limits, alch values, icons. */
export async function fetchMapping(): Promise<WikiMappingEntry[]> {
  return wikiFetch<WikiMappingEntry[]>("mapping");
}

/** Most recent trade on each side, for every tradeable item (or just `itemId`). */
export async function fetchLatest(itemId?: number): Promise<Record<string, WikiLatestEntry>> {
  const body = await wikiFetch<{ data: Record<string, WikiLatestEntry> }>(
    "latest",
    itemId === undefined ? {} : { id: itemId },
  );
  return body.data;
}

/**
 * Volume-weighted averages over the last 5 minutes or hour. This is the only
 * endpoint that reports volume, so it drives every velocity calculation.
 *
 * Pass `timestamp` (unix seconds, aligned to the step) to fetch a past window.
 */
export async function fetchAveraged(
  step: "5m" | "1h",
  timestamp?: number,
): Promise<Record<string, WikiAveragedEntry>> {
  const body = await wikiFetch<{ data: Record<string, WikiAveragedEntry> }>(
    step,
    timestamp ? { timestamp } : {},
  );
  return body.data;
}

/** Price history for one item over a lookback window, oldest first. */
export async function fetchTimeseries(
  itemId: number,
  lookback: Lookback = "30d",
): Promise<WikiTimeseriesPoint[]> {
  const body = await wikiFetch<{ data: WikiTimeseriesPoint[] }>("timeseries", {
    id: itemId,
    lookback,
  });
  return body.data;
}

/** Wiki icon filenames need this prefix and `_` for spaces to resolve. */
export function iconUrl(icon: string | null | undefined): string | null {
  if (!icon) return null;
  return `https://oldschool.runescape.wiki/images/${icon.replace(/ /g, "_")}`;
}

/** Unix seconds (or null) to a Date, the way the Wiki encodes timestamps. */
export function toDate(unixSeconds: number | null | undefined): Date | null {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}
