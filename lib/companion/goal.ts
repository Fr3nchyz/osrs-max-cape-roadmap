/**
 * Goal engine for the T-bow companion: funding gap, stage, scenarios and the
 * pre-purchase checklist. Pure functions; no I/O.
 */

import { GE_TAX_RATE } from "@/lib/market/tax";
import type {
  BankValuation,
  ChecklistId,
  ChecklistItem,
  CompanionState,
  Funding,
  FundingStage,
  ScenarioId,
  ScenarioResult,
} from "./types";

/**
 * Bank Memory items kept out of liquidation by default: Fletching stock for
 * the max cape (the checklist requires it untouched).
 */
export const DEFAULT_KEEP_ITEM_IDS: number[] = [
  21350, // Amethyst arrowtips
  21338, // Amethyst bolt tips
  53, // Headless arrow
  314, // Feather
  19584, // Javelin shaft
  11876, // Unfinished broad bolts
  9194, // Onyx bolt tips
  1517, // Maple logs
  1515, // Yew logs
  1513, // Magic logs
];

/**
 * Baseline from fr3nchy's Bank Memory export of 2026-10-02, valued at live
 * prices (T-bow 1.34b): coins 68,843,184 + 709 platinum tokens; tradeables
 * are the priced, sellable items at guide value with the Fletching stock in
 * DEFAULT_KEEP_ITEM_IDS left out. A fresh bank import replaces both.
 */
export const DEFAULT_STATE: CompanionState = {
  version: 1,
  cashGp: 69_552_184,
  tradeablesGp: 613_500_000,
  // Knowledge base asks for an "explicit slippage reserve" without a number; 1% is an editable default.
  slippagePct: 1,
  reserveGp: 25_000_000,
  weekdayHours: 1.5,
  // 4.5h weekend days: 16.5h a week, fr3nchy's own estimate (the knowledge base said 15.5h).
  weekendHours: 4.5,
  ownsTbow: false,
  dt2Complete: false,
  checklist: {},
  bank: null,
  keepItemIds: DEFAULT_KEEP_ITEM_IDS,
  useBankImport: false,
  sessions: [],
  customGpPerHour: 0,
  noWilderness: true,
  // Max first: 75% of playtime to maxing, 25% to T-bow PvM and breaks.
  pvmShare: 0.25,
  caTier: "None",
  caTarget: "None",
};

/**
 * Stage boundaries, taken from the knowledge base's state-machine exit
 * conditions (Accumulation exits at gap <= 250M, Preparation at <= 150M,
 * Staged liquidation at <= 75M). That resolves its overlapping
 * "150-250M" / "75-150M" ranges: a gap of exactly 150M is STAGED_LIQUIDATION.
 */
export const STAGE_THRESHOLDS = {
  accumulationAbove: 250_000_000,
  preparationAbove: 150_000_000,
  stagedAbove: 75_000_000,
} as const;

export const STAGES: Record<FundingStage, { label: string; when: string; action: string }> = {
  ACCUMULATION: {
    label: "Accumulation",
    when: "Gap above 250M",
    action: "Keep the productive bank. Sell only dead inventory and duplicates; max in parallel.",
  },
  PREPARATION: {
    label: "Preparation",
    when: "Gap 150M–250M",
    action: "Build the item-level sale list. Stop new specialist purchases.",
  },
  STAGED_LIQUIDATION: {
    label: "Staged liquidation",
    when: "Gap 75M–150M",
    action: "Sell marginal armour and upgrades in tranches. Keep the three-style core kit.",
  },
  PURCHASE_WINDOW: {
    label: "Purchase window",
    when: "Gap 75M or less",
    action: "Close the last of the gap, confirm the live price, and buy with patient offers once every check passes.",
  },
  REBUILD: {
    label: "Rebuild",
    when: "Bow owned",
    action: "Rebuild the reserve to 40M first, then replace supporting gear by GP/hour per GP spent.",
  },
};

export const STAGE_ORDER: FundingStage[] = [
  "ACCUMULATION",
  "PREPARATION",
  "STAGED_LIQUIDATION",
  "PURCHASE_WINDOW",
  "REBUILD",
];

/** Realized GP/hour per scenario, from the knowledge base. */
export const SCENARIO_RATES: { id: ScenarioId; label: string; gpPerHour: number }[] = [
  { id: "conservative", label: "Conservative", gpPerHour: 3_500_000 },
  { id: "base", label: "Base", gpPerHour: 5_500_000 },
  { id: "aggressive", label: "Aggressive", gpPerHour: 7_500_000 },
];

/**
 * Default share of gameplay that is income-producing PvM, used to turn
 * focused PvM hours into total gameplay hours (state.pvmShare overrides it).
 * The scenario table says 60%; its weekly allocation table sums to 65% PvM.
 * We follow the scenario table.
 */
export const PVM_SHARE = 0.6;

/** pvmShare kept inside [MIN, MAX] so neither the T-bow nor maxing gets zero time. */
export const PVM_SHARE_MIN = 0.1;
export const PVM_SHARE_MAX = 0.9;

export function clampPvmShare(share: number): number {
  return Number.isFinite(share) ? Math.min(PVM_SHARE_MAX, Math.max(PVM_SHARE_MIN, share)) : PVM_SHARE;
}

/** Weekly hours split between T-bow PvM and maxing. */
export function weeklySplit(state: Pick<CompanionState, "weekdayHours" | "weekendHours" | "pvmShare">): {
  totalHours: number;
  pvmHours: number;
  maxingHours: number;
  pvmShare: number;
} {
  const totalHours = weeklyHours(state.weekdayHours, state.weekendHours);
  const pvmShare = clampPvmShare(state.pvmShare);
  return { totalHours, pvmHours: totalHours * pvmShare, maxingHours: totalHours * (1 - pvmShare), pvmShare };
}

/** A price older than this (since our server fetched it) fails the "price refreshed" check. */
export const PRICE_FRESH_MINUTES = 15;

/** A bank import older than this fails the "proceeds recalculated" check. */
export const BANK_IMPORT_FRESH_HOURS = 24;

export const CHECKLIST: { id: ChecklistId; label: string; auto: boolean }[] = [
  { id: "priceFresh", label: "Live T-bow price refreshed in the last 15 minutes", auto: true },
  { id: "reserveCovered", label: "Capital covers the bow plus your cash reserve", auto: true },
  {
    id: "proceedsRecalculated",
    label: "Sale proceeds recalculated from a bank import in the last 24 hours, at fresh prices",
    auto: true,
  },
  { id: "kitsKept", label: "Minimum melee and magic kits stay usable", auto: false },
  { id: "fletchingUntouched", label: "Fletching materials stay untouched", auto: false },
  { id: "plannedUse", label: "At least 50 of the next 100 focused PvM hours use the bow", auto: false },
  { id: "upliftMeasured", label: "Measured T-bow uplift expected above 1.5M GP/hour", auto: false },
  { id: "noUpdateRisk", label: "No pending official update undermines the plan", auto: false },
  { id: "patientOffers", label: "Buying with patient offers, not an instant buy", auto: false },
];

/**
 * Pessimistic net proceeds for a lump of tradeables known only by guide value:
 * floor(grossGp x (1 - GE_TAX_RATE) x (1 - slippagePct / 100)).
 * A flat 2% overstates tax for items over 250M (capped) and under 50 gp
 * (untaxed), so this never overstates proceeds.
 */
export function approxNetProceeds(grossGp: number, slippagePct: number): number {
  const gross = Number.isFinite(grossGp) ? Math.max(0, grossGp) : 0;
  // Same product as the formula above, kept as whole-number percentages until a
  // single final division: floor(600M x 0.98 x 0.99) style floats can otherwise
  // land a hair under an integer and floor one gp short.
  const keepPct = 100 - GE_TAX_RATE * 100;
  return Math.floor((gross * keepPct * (100 - clampPct(slippagePct))) / 10_000);
}

/**
 * Funding snapshot. Bank mode applies when state.useBankImport is true AND a
 * valuation is given: cash = valuation.cashGp, tradeables net/gross = the
 * valuation's liquidatable totals. Otherwise manual: cash = state.cashGp,
 * tradeables net = approxNetProceeds(state.tradeablesGp, state.slippagePct),
 * gross = state.tradeablesGp.
 */
export function computeFunding(
  state: CompanionState,
  tbowPriceGp: number,
  valuation: BankValuation | null,
): Funding {
  const bankMode = state.useBankImport && valuation !== null;
  const cashGp = bankMode ? valuation.cashGp : state.cashGp;
  const tradeablesNetGp = bankMode
    ? valuation.liquidatableNetGp
    : approxNetProceeds(state.tradeablesGp, state.slippagePct);
  const tradeablesGrossGp = bankMode ? valuation.liquidatableGrossGp : state.tradeablesGp;

  const targetGp = tbowPriceGp + state.reserveGp;
  const capitalGp = cashGp + tradeablesNetGp;
  const progress = targetGp > 0 ? Math.min(1, Math.max(0, capitalGp / targetGp)) : 1;

  return {
    source: bankMode ? "bank" : "manual",
    tbowPriceGp,
    targetGp,
    cashGp,
    tradeablesNetGp,
    capitalGp,
    gapGp: Math.max(0, targetGp - capitalGp),
    gapBeforeCostsGp: Math.max(0, targetGp - (cashGp + tradeablesGrossGp)),
    progress,
  };
}

/** REBUILD when owned; otherwise the band from STAGE_THRESHOLDS. */
export function fundingStage(gapGp: number, ownsTbow: boolean): FundingStage {
  if (ownsTbow) return "REBUILD";
  if (gapGp > STAGE_THRESHOLDS.accumulationAbove) return "ACCUMULATION";
  if (gapGp > STAGE_THRESHOLDS.preparationAbove) return "PREPARATION";
  if (gapGp > STAGE_THRESHOLDS.stagedAbove) return "STAGED_LIQUIDATION";
  return "PURCHASE_WINDOW";
}

/** Weekday hours x 5 + weekend hours x 2. */
export function weeklyHours(weekdayHours: number, weekendHours: number): number {
  return weekdayHours * 5 + weekendHours * 2;
}

/**
 * One result per SCENARIO_RATES entry, same order, then one per `extra` rate
 * (your logged rate, a custom rate). Rates at or below zero are skipped: no
 * number of hours closes a gap at a loss.
 */
export function scenarios(
  gapGp: number,
  weekdayHours: number,
  weekendHours: number,
  opts: { extra?: { id: ScenarioId; label: string; gpPerHour: number }[]; pvmShare?: number } = {},
): ScenarioResult[] {
  const gap = Math.max(0, gapGp);
  const perWeek = weeklyHours(weekdayHours, weekendHours);
  const extra = opts.extra ?? [];
  const pvmShare = clampPvmShare(opts.pvmShare ?? PVM_SHARE);
  return [...SCENARIO_RATES, ...extra.filter((e) => e.gpPerHour > 0)].map(({ id, label, gpPerHour }) => {
    const focusedHours = gap / gpPerHour;
    const totalHours = focusedHours / pvmShare;
    return {
      id,
      label,
      gpPerHour,
      focusedHours,
      totalHours,
      weeks: perWeek > 0 ? totalHours / perWeek : null,
    };
  });
}

/**
 * Auto items: priceFresh = the T-bow price is at most PRICE_FRESH_MINUTES old;
 * reserveCovered = funding.gapGp === 0; proceedsRecalculated = funding.source
 * === "bank", the bank import is at most BANK_IMPORT_FRESH_HOURS old (and not
 * in the future), and the item prices valuing it are at most
 * PRICE_FRESH_MINUTES old. Ages are null when nothing has been fetched.
 * Manual items read state.checklist[id] === true.
 */
export function evaluateChecklist(
  state: CompanionState,
  funding: Funding,
  priceAgeMinutes: number | null,
  itemPriceAgeMinutes: number | null,
  now: Date = new Date(),
): { items: ChecklistItem[]; allPassed: boolean } {
  const autoPassed: Partial<Record<ChecklistId, boolean>> = {
    priceFresh: isFreshPrice(priceAgeMinutes),
    reserveCovered: funding.gapGp === 0,
    proceedsRecalculated:
      funding.source === "bank" &&
      isBankImportFresh(state.bank?.importedAt, now) &&
      isFreshPrice(itemPriceAgeMinutes),
  };
  const items = CHECKLIST.map(({ id, label, auto }) => ({
    id,
    label,
    auto,
    passed: (auto ? autoPassed[id] : state.checklist[id]) === true,
  }));
  return { items, allPassed: items.every((item) => item.passed) };
}

/**
 * Kill count for a named activity in the Jagex HiScores JSON
 * ({ activities: [{ name, score }] }). Unranked (score <= 0), missing, or
 * malformed input -> 0.
 */
export function bossKc(hiscores: unknown, name: string): number {
  if (typeof hiscores !== "object" || hiscores === null) return 0;
  const activities = (hiscores as { activities?: unknown }).activities;
  if (!Array.isArray(activities)) return 0;
  const entry: unknown = activities.find(
    (a: unknown) => typeof a === "object" && a !== null && (a as { name?: unknown }).name === name,
  );
  if (entry === undefined) return 0;
  const score = (entry as { score?: unknown }).score;
  // Unranked comes back as score 0 (older responses used -1).
  return typeof score === "number" && Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
}

/** Percent clamped to [0, 100]; non-numbers count as 0. */
function clampPct(pct: number): number {
  return Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
}

function isFreshPrice(ageMinutes: number | null): boolean {
  return ageMinutes !== null && ageMinutes <= PRICE_FRESH_MINUTES;
}

/**
 * True when `importedAt` parses and is 0 to BANK_IMPORT_FRESH_HOURS before
 * `now`. A future date (bad clock, edited backup) would otherwise pass forever.
 */
function isBankImportFresh(importedAt: string | undefined, now: Date): boolean {
  if (importedAt === undefined) return false;
  const importedMs = Date.parse(importedAt);
  if (Number.isNaN(importedMs)) return false;
  const ageMs = now.getTime() - importedMs;
  return ageMs >= 0 && ageMs <= BANK_IMPORT_FRESH_HOURS * 3_600_000;
}
