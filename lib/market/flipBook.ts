/**
 * Flip book: the knowledge base's flipping screen on top of the market
 * snapshot, then a slot plan for your flip budget.
 *
 * Screen (knowledge base "Flipping screen", scaled to your budget):
 *   - both sides traded within FRESH_MINUTES
 *   - post-tax margin > 0 and post-tax ROI >= MIN_ROI_PERCENT
 *   - units <= min(4-hour buy limit, 0.5% of daily volume)
 *   - capital per item <= PER_ITEM_SHARE of the budget (4.5M of the doc's 18M book)
 *   - the spread holds on 1-hour average prices too, not just on the latest
 *     single trades ("reject if the spread is based on one stale trade")
 *   - an active market (MIN_HOURLY_VOLUME) and a believable return
 *     (MAX_ROI_PERCENT): huge spreads on thin items don't fill both ways
 * Buy at the instant-sell price and sell at the instant-buy price with
 * patient offers; never chase the instant-buy price to complete a flip.
 */

import type { MarketRow } from "./market";
import { geTaxPerItem } from "./tax";

export const MIN_ROI_PERCENT = 1.2;
/** Returns above this mean a thin or manipulated market, not a real edge. */
export const MAX_ROI_PERCENT = 20;
/** Post-tax margin per unit below this is wiped out by one undercut ("minimum absolute profit"). */
export const MIN_UNIT_MARGIN = 2;
/** Units traded in the last hour (both sides) for the market to count as active. */
export const MIN_HOURLY_VOLUME = 20;
export const DAILY_VOLUME_SHARE = 0.005;
export const PER_ITEM_SHARE = 0.25;
export const FRESH_MINUTES = 15;
export const GE_SLOTS = 8;

export interface FlipCandidate {
  itemId: number;
  name: string;
  icon: string | null;
  buyAt: number;
  sellAt: number;
  netMargin: number;
  roiPercent: number;
  buyLimit: number | null;
  dailyVolume: number;
  /** Units the screen allows this cycle. */
  units: number;
  capital: number;
  /** units x netMargin, after tax. */
  profitPerCycle: number;
}

export interface FlipBook {
  budget: number;
  perItemCap: number;
  /** Chosen flips, one per GE slot, best profit per cycle first. */
  picks: FlipCandidate[];
  deployed: number;
  /** Expected profit if every pick fills once (one 4-hour cycle). */
  profitPerCycle: number;
  /** How many items passed the screen before slot and budget limits. */
  screened: number;
}

function ageMinutes(t: Date | null, now: number): number {
  return t ? (now - t.getTime()) / 60_000 : Infinity;
}

export function screenFlips(
  rows: MarketRow[],
  dailyVolume: Record<string, number>,
  budget: number,
  now: number = Date.now(),
): FlipCandidate[] {
  const perItemCap = Math.max(0, budget) * PER_ITEM_SHARE;
  const out: FlipCandidate[] = [];
  for (const r of rows) {
    if (r.highPrice === null || r.lowPrice === null || r.lowPrice <= 0) continue;
    if (ageMinutes(r.highTime, now) > FRESH_MINUTES || ageMinutes(r.lowTime, now) > FRESH_MINUTES) continue;
    if (r.netMargin < MIN_UNIT_MARGIN || r.roiPercent < MIN_ROI_PERCENT || r.roiPercent > MAX_ROI_PERCENT) continue;
    if (r.hourlyVolume < MIN_HOURLY_VOLUME) continue;
    if (r.avgHigh1h === null || r.avgLow1h === null) continue;
    const avgNet = r.avgHigh1h - geTaxPerItem(r.avgHigh1h, { exempt: r.taxExempt }) - r.avgLow1h;
    if (avgNet <= 0 || (avgNet / r.avgLow1h) * 100 < MIN_ROI_PERCENT) continue;
    const vol = dailyVolume[String(r.itemId)] ?? 0;
    const byVolume = Math.floor(vol * DAILY_VOLUME_SHARE);
    const byLimit = r.buyLimit ?? byVolume;
    const byCap = Math.floor(perItemCap / r.lowPrice);
    const units = Math.min(byVolume, byLimit, byCap);
    if (units < 1) continue;
    out.push({
      itemId: r.itemId,
      name: r.name,
      icon: r.icon,
      buyAt: r.lowPrice,
      sellAt: r.highPrice,
      netMargin: r.netMargin,
      roiPercent: r.roiPercent,
      buyLimit: r.buyLimit,
      dailyVolume: vol,
      units,
      capital: units * r.lowPrice,
      profitPerCycle: units * r.netMargin,
    });
  }
  return out.sort((a, b) => b.profitPerCycle - a.profitPerCycle || a.name.localeCompare(b.name));
}

/** Greedy: best profit per cycle first, one slot each, within the budget (shrinking the last fit). */
export function planFlipBook(candidates: FlipCandidate[], budget: number): FlipBook {
  const cap = Math.max(0, budget);
  let remaining = cap;
  const picks: FlipCandidate[] = [];
  for (const c of candidates) {
    if (picks.length >= GE_SLOTS) break;
    let units = c.units;
    if (units * c.buyAt > remaining) units = Math.floor(remaining / c.buyAt);
    if (units < 1) continue;
    picks.push({ ...c, units, capital: units * c.buyAt, profitPerCycle: units * c.netMargin });
    remaining -= units * c.buyAt;
  }
  return {
    budget: cap,
    perItemCap: cap * PER_ITEM_SHARE,
    picks,
    deployed: cap - remaining,
    profitPerCycle: picks.reduce((n, p) => n + p.profitPerCycle, 0),
    screened: candidates.length,
  };
}
