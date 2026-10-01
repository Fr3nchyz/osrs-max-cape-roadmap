/**
 * Flip economics: margin, ROI, velocity and per-slot capital math.
 *
 * Every number here is gp unless the name says otherwise. Prices come from the
 * OSRS Wiki real-time API, where `high` is the instant-buy price (what you pay
 * to buy now / what you sell into) and `low` is the instant-sell price.
 */

import { geTaxPerItem, isTaxExempt } from "./tax";

/** The GE buy limit window. */
export const BUY_LIMIT_WINDOW_HOURS = 4;

export interface PricePoint {
  itemId: number;
  /** Instant-buy price -- the price you list a sell offer at. */
  highPrice: number | null;
  /** Instant-sell price -- the price you list a buy offer at. */
  lowPrice: number | null;
  highTime?: Date | null;
  lowTime?: Date | null;
}

export interface MarginResult {
  /** Gross spread before tax. */
  grossMargin: number;
  /** GE tax on one unit sold at the high price. */
  taxPerItem: number;
  /** Profit per unit after tax. Can be negative. */
  netMargin: number;
  /** netMargin / lowPrice, as a percentage. */
  roiPercent: number;
  /** netMargin * buyLimit -- the ceiling on one 4-hour cycle. */
  profitPerLimit: number | null;
  /** Capital needed to fill the buy limit once. */
  capitalPerLimit: number | null;
}

/**
 * Core flip calculation for a single item.
 *
 * Returns zeroed-out economics rather than throwing when prices are missing,
 * so a scanner can map over thousands of items without guarding each one.
 */
export function calculateMargin(
  price: PricePoint,
  buyLimit: number | null = null,
  opts: { exempt?: boolean } = {},
): MarginResult {
  const high = price.highPrice ?? 0;
  const low = price.lowPrice ?? 0;
  const exempt = opts.exempt ?? isTaxExempt(price.itemId);

  const taxPerItem = geTaxPerItem(high, { exempt });
  const grossMargin = high - low;
  const netMargin = grossMargin - taxPerItem;
  const roiPercent = low > 0 ? (netMargin / low) * 100 : 0;

  const limit = buyLimit && buyLimit > 0 ? buyLimit : null;

  return {
    grossMargin,
    taxPerItem,
    netMargin,
    roiPercent,
    profitPerLimit: limit === null ? null : netMargin * limit,
    capitalPerLimit: limit === null ? null : low * limit,
  };
}

export interface VolumeWindow {
  /** Units bought at the high price during the window. */
  highVolume: number;
  /** Units sold at the low price during the window. */
  lowVolume: number;
  /** Length of the window in minutes (5 for /5m, 60 for /1h). */
  windowMinutes: number;
}

export interface VelocityResult {
  totalVolume: number;
  /** Units traded per hour, extrapolated from the window. */
  hourlyVolume: number;
  /**
   * How lopsided the flow is: +1 = all instant-buys (demand), -1 = all
   * instant-sells (supply), 0 = balanced. Useful for spotting a dump.
   */
  flowImbalance: number;
}

export function calculateVelocity(window: VolumeWindow): VelocityResult {
  const totalVolume = window.highVolume + window.lowVolume;
  const minutes = window.windowMinutes > 0 ? window.windowMinutes : 1;
  const hourlyVolume = (totalVolume / minutes) * 60;
  const flowImbalance =
    totalVolume > 0 ? (window.highVolume - window.lowVolume) / totalVolume : 0;

  return { totalVolume, hourlyVolume, flowImbalance };
}

/**
 * Ratio of a short-window hourly rate against the 24-hour baseline.
 * 3 means "trading at 3x its normal pace"; used by the volume-spike alert.
 */
export function volumeSpikeRatio(recentHourly: number, baselineHourly: number): number {
  if (baselineHourly <= 0) return recentHourly > 0 ? Infinity : 1;
  return recentHourly / baselineHourly;
}

/**
 * How many units of an item you can realistically move per hour, bounded by
 * both the GE buy limit and what the market actually trades.
 */
export function throughputPerHour(buyLimit: number | null, hourlyVolume: number): number {
  const limitPerHour =
    buyLimit && buyLimit > 0 ? buyLimit / BUY_LIMIT_WINDOW_HOURS : Infinity;
  return Math.min(limitPerHour, hourlyVolume);
}

/**
 * Expected gp/hour from one GE slot running this flip, capped by both the buy
 * limit and market liquidity. This is the number the strategy dashboards rank on.
 */
export function profitPerSlotHour(
  netMargin: number,
  buyLimit: number | null,
  hourlyVolume: number,
): number {
  return netMargin * throughputPerHour(buyLimit, hourlyVolume);
}

/**
 * How stale a price is, in minutes. A fat margin on a price last seen six
 * hours ago is a mirage, so every scanner filters on this.
 */
export function priceAgeMinutes(at: Date | null | undefined, now: Date = new Date()): number {
  if (!at) return Infinity;
  return (now.getTime() - at.getTime()) / 60_000;
}
