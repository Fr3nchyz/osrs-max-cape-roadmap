/**
 * "What if I sell…": a cash plan for buying the T-bow after max.
 *
 * Capital already counts every sellable item at net value, so selling
 * doesn't change the gap. What changes is cash in hand: the bow and the
 * reserve must be paid in coins. This works out how much cash you'll still
 * need on max day (after PvM income until then), what your picks raise,
 * and how fast the GE can absorb them.
 */

import { REALISTIC_VOLUME_SHARE } from "@/lib/market/crystalKeys";
import type { BankValuation, ValuedItem } from "./types";

export interface SellLine {
  item: ValuedItem;
  quantity: number;
  /** Net for `quantity`, after tax and slippage. */
  netGp: number;
  /** Days for the GE to absorb `quantity` at 10% of daily volume; null when volume is unknown. */
  daysToSell: number | null;
}

export interface SellPlan {
  /** Bow + reserve - cash today. */
  cashNeededNow: number;
  /** PvM income expected before max day. */
  earnedByMax: number;
  /** Cash still needed on max day, before any sales. */
  cashNeededAtMax: number;
  lines: SellLine[];
  raisedGp: number;
  /** cashNeededAtMax - raisedGp, never below 0. */
  stillShort: number;
  /** Slowest line's days to sell. */
  slowestDays: number | null;
}

/** Net for part of a valued item's stack, same rounding as valueBank. */
export function partialNet(item: ValuedItem, quantity: number): number {
  if (item.unitPrice === null || item.quantity <= 0) return 0;
  const q = Math.max(0, Math.min(item.quantity, Math.floor(quantity)));
  return Math.floor((item.netTotal * q) / item.quantity);
}

export function daysToSell(quantity: number, dailyVolume: number | undefined): number | null {
  if (!dailyVolume || dailyVolume <= 0) return null;
  return Math.max(1, Math.ceil(quantity / Math.max(1, dailyVolume * REALISTIC_VOLUME_SHARE)));
}

export function sellPlan(input: {
  valuation: BankValuation;
  targetGp: number;
  /** Weekly PvM income (hours x GP/hour) and weeks until max. */
  weeklyPvmGp: number;
  weeksToMax: number;
  selection: Record<string, number>;
  dailyVolume: Record<string, number>;
}): SellPlan {
  const { valuation, targetGp, selection, dailyVolume } = input;
  const cashNeededNow = Math.max(0, targetGp - valuation.cashGp);
  const earnedByMax = Math.max(0, input.weeklyPvmGp) * Math.max(0, input.weeksToMax);
  const cashNeededAtMax = Math.max(0, cashNeededNow - earnedByMax);

  const lines: SellLine[] = [];
  for (const item of valuation.items) {
    const q = Math.min(item.quantity, Math.floor(selection[String(item.itemId)] ?? 0));
    if (q <= 0 || item.unitPrice === null || item.kept) continue;
    lines.push({
      item,
      quantity: q,
      netGp: partialNet(item, q),
      daysToSell: daysToSell(q, dailyVolume[String(item.itemId)]),
    });
  }
  const raisedGp = lines.reduce((n, l) => n + l.netGp, 0);
  const days = lines.map((l) => l.daysToSell).filter((d): d is number => d !== null);
  return {
    cashNeededNow,
    earnedByMax,
    cashNeededAtMax,
    lines,
    raisedGp,
    stillShort: Math.max(0, cashNeededAtMax - raisedGp),
    slowestDays: days.length ? Math.max(...days) : null,
  };
}

/**
 * The fewest whole stacks (biggest net first) of priced, non-kept items that
 * cover `needGp`. Returns the selection and whether it covers the need.
 */
export function autoPick(valuation: BankValuation, needGp: number): { selection: Record<string, number>; covers: boolean } {
  const selection: Record<string, number> = {};
  let raised = 0;
  const sellable = valuation.items
    .filter((i) => !i.kept && i.unitPrice !== null && i.netTotal > 0)
    .sort((a, b) => b.netTotal - a.netTotal);
  for (const item of sellable) {
    if (raised >= needGp) break;
    selection[String(item.itemId)] = item.quantity;
    raised += item.netTotal;
  }
  return { selection, covers: raised >= needGp };
}
