/**
 * The market snapshot: one denormalised row per item, joining /mapping,
 * /latest and /1h, with all flip economics precomputed.
 *
 * Every strategy dashboard filters this same array. Building it costs three
 * upstream calls regardless of how many scanners are open, because the Wiki
 * client caches per endpoint.
 */

import { calculateMargin, calculateVelocity, profitPerSlotHour, priceAgeMinutes } from "./calc";
import { isTaxExempt } from "./tax";
import { fetchAveraged, fetchLatest, fetchMapping, iconUrl, toDate } from "./wiki";

export interface MarketRow {
  itemId: number;
  name: string;
  icon: string | null;
  members: boolean;
  buyLimit: number | null;
  highAlch: number | null;
  taxExempt: boolean;

  highPrice: number | null;
  lowPrice: number | null;
  highTime: Date | null;
  lowTime: Date | null;
  /** Minutes since the more recent of the two sides traded. */
  priceAgeMinutes: number;

  grossMargin: number;
  taxPerItem: number;
  netMargin: number;
  roiPercent: number;
  profitPerLimit: number | null;
  capitalPerLimit: number | null;

  hourlyVolume: number;
  /** Volume-weighted average prices over the last hour; null when untraded. */
  avgHigh1h: number | null;
  avgLow1h: number | null;
  flowImbalance: number;
  /** Expected gp/hour from a single GE slot running this flip. */
  gpPerSlotHour: number;
}

/**
 * Builds the full market snapshot. ~4,000 rows; cheap to compute and the
 * upstream fetches are cached, so callers can just ask for it.
 */
export async function getMarketSnapshot(): Promise<MarketRow[]> {
  const [mapping, latest, hourly] = await Promise.all([
    fetchMapping(),
    fetchLatest(),
    fetchAveraged("1h"),
  ]);

  const now = new Date();

  return mapping.map((entry) => {
    const key = String(entry.id);
    const price = latest[key];
    const volume = hourly[key];
    const taxExempt = isTaxExempt(entry.id);
    const buyLimit = entry.limit ?? null;

    const highTime = toDate(price?.highTime);
    const lowTime = toDate(price?.lowTime);

    const margin = calculateMargin(
      {
        itemId: entry.id,
        highPrice: price?.high ?? null,
        lowPrice: price?.low ?? null,
        highTime,
        lowTime,
      },
      buyLimit,
      { exempt: taxExempt },
    );

    const velocity = calculateVelocity({
      highVolume: volume?.highPriceVolume ?? 0,
      lowVolume: volume?.lowPriceVolume ?? 0,
      windowMinutes: 60,
    });

    // The freshest of the two sides is what tells us the item is actually alive.
    const age = Math.min(priceAgeMinutes(highTime, now), priceAgeMinutes(lowTime, now));

    return {
      itemId: entry.id,
      name: entry.name,
      icon: iconUrl(entry.icon),
      members: entry.members ?? false,
      buyLimit,
      highAlch: entry.highalch ?? null,
      taxExempt,

      highPrice: price?.high ?? null,
      lowPrice: price?.low ?? null,
      highTime,
      lowTime,
      priceAgeMinutes: age,

      ...margin,

      hourlyVolume: velocity.hourlyVolume,
      avgHigh1h: volume?.avgHighPrice ?? null,
      avgLow1h: volume?.avgLowPrice ?? null,
      flowImbalance: velocity.flowImbalance,
      gpPerSlotHour: profitPerSlotHour(margin.netMargin, buyLimit, velocity.hourlyVolume),
    };
  });
}

/**
 * Filters that every scanner applies before its own strategy rules, to keep
 * dead items and stale quotes out of the results.
 */
export interface BaseFilter {
  /** Reject quotes older than this. Defaults to 60 minutes. */
  maxPriceAgeMinutes?: number;
  /** Reject items trading under this many units per hour. */
  minHourlyVolume?: number;
  /** Cap on capital required to fill the buy limit once. */
  maxCapitalPerLimit?: number;
  membersOnly?: boolean;
}

export function applyBaseFilter(rows: MarketRow[], filter: BaseFilter = {}): MarketRow[] {
  const {
    maxPriceAgeMinutes = 60,
    minHourlyVolume = 0,
    maxCapitalPerLimit,
    membersOnly,
  } = filter;

  return rows.filter((row) => {
    if (row.highPrice === null || row.lowPrice === null) return false;
    if (row.lowPrice <= 0) return false;
    if (row.priceAgeMinutes > maxPriceAgeMinutes) return false;
    if (row.hourlyVolume < minHourlyVolume) return false;
    if (membersOnly !== undefined && row.members !== membersOnly) return false;
    if (
      maxCapitalPerLimit !== undefined &&
      row.capitalPerLimit !== null &&
      row.capitalPerLimit > maxCapitalPerLimit
    ) {
      return false;
    }
    return true;
  });
}
