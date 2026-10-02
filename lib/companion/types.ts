/**
 * Shared contract for the T-bow companion (/companion).
 *
 * Rules and default numbers come from fr3nchy's "OSRS Economic & Strategy
 * Knowledge Base" v1.0 (market anchor 2026-09-30). Where that document was
 * ambiguous, the resolution is noted next to the constant in goal.ts.
 */

import type { CaTier } from "../today";

export const TBOW_ITEM_ID = 20997;

/** Coins and platinum tokens have no GE price; a bank import counts them as cash. */
export const COINS_ITEM_ID = 995;
export const PLATINUM_TOKEN_ITEM_ID = 13204;
export const PLATINUM_TOKEN_GP = 1000;

export type FundingStage =
  | "ACCUMULATION"
  | "PREPARATION"
  | "STAGED_LIQUIDATION"
  | "PURCHASE_WINDOW"
  | "REBUILD";

export type ChecklistId =
  | "priceFresh"
  | "reserveCovered"
  | "proceedsRecalculated"
  | "kitsKept"
  | "fletchingUntouched"
  | "plannedUse"
  | "upliftMeasured"
  | "noUpdateRisk"
  | "patientOffers";

/** Everything the companion persists (localStorage + export/import). */
export interface CompanionState {
  version: 1;
  cashGp: number;
  /** Guide value of tradeables you'd be willing to sell (before tax and slippage). */
  tradeablesGp: number;
  /** Extra haircut on sale proceeds for thin markets, in percent (1 = 1%). */
  slippagePct: number;
  /** Cash that must remain after buying the bow. */
  reserveGp: number;
  weekdayHours: number;
  weekendHours: number;
  ownsTbow: boolean;
  dt2Complete: boolean;
  /** Manual ticks only; auto-evaluated items ignore this map. */
  checklist: Partial<Record<ChecklistId, boolean>>;
  bank: BankImport | null;
  /** Items excluded from liquidation (core kit, Fletching materials, ...). */
  keepItemIds: number[];
  /** When true and a bank import exists, cash and tradeables come from it. */
  useBankImport: boolean;
  /** Logged PvM sessions, oldest first. */
  sessions: Session[];
  /** Extra "Custom" scenario rate in GP per focused hour; 0 = off. */
  customGpPerHour: number;
  /** Hide Wilderness methods from the method list and Next Best Action. */
  noWilderness: boolean;
  /**
   * Share of weekly playtime for T-bow PvM (0-1). The rest is maxing time,
   * which the Max Cape Roadmap plans with.
   */
  pvmShare: number;
  /** Combat achievement tiers: current and goal (manual; no public source). */
  caTier: CaTier;
  caTarget: CaTier;
  /** Sell planner picks: item id -> quantity. */
  sellSelection: Record<string, number>;
  /** Flip book budget in gp; 0 = cash minus reserve. */
  flipBudgetGp: number;
  /** You cleared the bank import on purpose: don't bring the built-in snapshot back. */
  bankCleared: boolean;
}

/** One logged PvM session. Net GP = loot - supplies - upkeep - deaths. */
export interface Session {
  id: string;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  methodId: string;
  hours: number;
  /** Kills or completions; null when not tracked. */
  kills: number | null;
  lootGp: number;
  suppliesGp: number;
  /** Charges, scales, gear degradation. */
  upkeepGp: number;
  /** Reclaim fees and lost loot from deaths. */
  deathCostGp: number;
}

/** Totals for one method across its logged sessions. */
export interface MethodStats {
  methodId: string;
  sessions: number;
  hours: number;
  netGp: number;
  /** netGp / hours. */
  gpPerHour: number;
  /** kills / hours over sessions that tracked kills; null when none did. */
  killsPerHour: number | null;
  /** hours >= LOGGED_HOURS_THRESHOLD: the knowledge base's reliable sample. */
  qualified: boolean;
}

export interface BankItem {
  itemId: number;
  name: string;
  quantity: number;
}

export interface BankImport {
  /** ISO timestamp of when the paste was imported. */
  importedAt: string;
  items: BankItem[];
  /** True for the built-in 2026-10-02 snapshot rather than your own paste. */
  baseline?: boolean;
}

export interface PriceQuote {
  /** Latest instant-buy price. */
  high: number | null;
  /** Latest instant-sell price. */
  low: number | null;
}

/** Keyed by item id as a string, matching the Wiki's JSON. */
export type PriceTable = Record<string, PriceQuote>;

export interface ValuedItem {
  itemId: number;
  name: string;
  quantity: number;
  /** Per-unit sale price: instant-sell (low), else high; null = no GE price. */
  unitPrice: number | null;
  taxPerUnit: number;
  /** quantity x unitPrice, before tax and slippage; 0 when unpriced. */
  grossTotal: number;
  /** quantity x (unitPrice - tax) x (1 - slippage), floored; 0 when unpriced. */
  netTotal: number;
  kept: boolean;
}

export interface BankValuation {
  /** Coins + platinum tokens. */
  cashGp: number;
  /** Every non-cash item, sorted by netTotal descending (unpriced last). */
  items: ValuedItem[];
  /** Sum of netTotal over priced, non-kept items. */
  liquidatableNetGp: number;
  /** Sum of grossTotal over priced, non-kept items. */
  liquidatableGrossGp: number;
  /** Sum of netTotal over priced, kept items. */
  keptNetGp: number;
  unpricedCount: number;
}

export interface Funding {
  source: "manual" | "bank";
  tbowPriceGp: number;
  /** tbowPriceGp + reserveGp. */
  targetGp: number;
  cashGp: number;
  /** Tradeables after tax and slippage. */
  tradeablesNetGp: number;
  /** cashGp + tradeablesNetGp. */
  capitalGp: number;
  /** max(0, targetGp - capitalGp). */
  gapGp: number;
  /** Same gap with tradeables at gross guide value (the knowledge base's own figure). */
  gapBeforeCostsGp: number;
  /** capitalGp / targetGp, clamped to [0, 1]. */
  progress: number;
}

export type ScenarioId = "conservative" | "base" | "aggressive" | "logged" | "custom";

export interface ScenarioResult {
  id: ScenarioId;
  label: string;
  gpPerHour: number;
  /** gapGp / gpPerHour. */
  focusedHours: number;
  /** focusedHours / the PvM share of playtime. */
  totalHours: number;
  /** totalHours / weekly hours; null when weekly hours is 0. */
  weeks: number | null;
}

export interface ChecklistItem {
  id: ChecklistId;
  label: string;
  /** Computed from data rather than ticked by hand. */
  auto: boolean;
  passed: boolean;
}

/** GET /api/prices/tbow */
export interface TbowPriceResponse {
  itemId: typeof TBOW_ITEM_ID;
  high: number | null;
  low: number | null;
  /** Unix seconds of the latest trade on each side. */
  highTime: number | null;
  lowTime: number | null;
  /** 30-day history at the Wiki's 6-hour resolution, oldest first. */
  history30d: { t: number; high: number | null; low: number | null }[];
  /** ISO timestamp of when this server fetched the data. */
  fetchedAt: string;
}

/** GET /api/prices/latest */
export interface LatestPricesResponse {
  prices: PriceTable;
  fetchedAt: string;
}
