/**
 * GE slot allocator: given a cash stack and a ranked list of candidate flips,
 * recommend how to spread capital across the 8 GE slots.
 *
 * Greedy, not optimal: takes the best gp/slot/hour candidates in order and
 * spends as much of the remaining budget on each as the buy limit allows.
 * A true knapsack solve isn't worth it here -- the ranking metric already
 * accounts for the real constraint (liquidity + buy limit), and greedy on a
 * pre-sorted list gives the same practical answer for this problem size.
 */

import type { MarketRow } from "./market";

export interface SlotAllocation {
  itemId: number;
  name: string;
  units: number;
  capitalSpent: number;
  /** capitalSpent as a fraction of what one full buy-limit cycle would cost. */
  limitFillFraction: number;
  expectedProfitPerCycle: number;
  expectedGpPerHour: number;
}

export interface AllocationResult {
  slots: SlotAllocation[];
  capitalDeployed: number;
  capitalUnallocated: number;
  /** Sum of expectedGpPerHour across all filled slots. */
  totalGpPerHour: number;
}

export interface AllocatorOptions {
  /** Total GE slots to fill. Defaults to 8 (max for members). */
  slots?: number;
  /** Skip items requiring more than this to fill one buy-limit cycle. */
  maxCapitalPerItem?: number;
}

/**
 * Rows must already be filtered to affordable, liquid, positive-margin
 * candidates and sorted by whatever ranking the caller prefers -- this
 * function does not re-sort, so callers control priority (e.g. gp/hour vs.
 * capital efficiency).
 */
export function allocateSlots(
  rankedCandidates: MarketRow[],
  cashStack: number,
  opts: AllocatorOptions = {},
): AllocationResult {
  const slotCount = opts.slots ?? 8;
  let remaining = Math.max(0, cashStack);
  const slots: SlotAllocation[] = [];
  const used = new Set<number>();

  for (const row of rankedCandidates) {
    if (slots.length >= slotCount) break;
    if (used.has(row.itemId)) continue;
    if (row.lowPrice === null || row.lowPrice <= 0) continue;
    if (row.netMargin <= 0) continue;
    if (opts.maxCapitalPerItem && (row.capitalPerLimit ?? Infinity) > opts.maxCapitalPerItem) continue;

    // Buy as many as the buy limit allows, capped by what's left to spend.
    const affordableUnits = Math.floor(remaining / row.lowPrice);
    const limitUnits = row.buyLimit ?? affordableUnits; // no known limit: budget is the only cap
    const units = Math.min(affordableUnits, limitUnits);
    if (units <= 0) continue;

    const capitalSpent = units * row.lowPrice;
    const fullCycleCapital = row.capitalPerLimit ?? capitalSpent;

    slots.push({
      itemId: row.itemId,
      name: row.name,
      units,
      capitalSpent,
      limitFillFraction: fullCycleCapital > 0 ? capitalSpent / fullCycleCapital : 1,
      expectedProfitPerCycle: row.netMargin * units,
      // Scale the row's full-liquidity gp/hr by how much of that liquidity
      // this allocation actually uses, so a half-sized position reports
      // half the throughput rather than the item's theoretical ceiling.
      expectedGpPerHour: row.gpPerSlotHour * (row.buyLimit ? units / row.buyLimit : 1),
    });
    used.add(row.itemId);
    remaining -= capitalSpent;
  }

  const capitalDeployed = cashStack - remaining;
  return {
    slots,
    capitalDeployed,
    capitalUnallocated: remaining,
    totalGpPerHour: slots.reduce((sum, s) => sum + s.expectedGpPerHour, 0),
  };
}
