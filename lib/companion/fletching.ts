/**
 * Fletching coverage: how much of the XP to 99 the committed bank stock
 * already pays for. XP per item verified on the OSRS Wiki (2026-10-02).
 */

import type { BankItem } from "./types";

export const XP_FOR_99 = 13_034_431;

export interface FletchingRecipe {
  name: string;
  level: number;
  /** XP per finished item. */
  xpEach: number;
  /** Both inputs are used one-for-one. */
  inputs: [{ id: number; name: string }, { id: number; name: string }];
}

export const FLETCHING_RECIPES: FletchingRecipe[] = [
  {
    name: "Amethyst arrows",
    level: 82,
    xpEach: 13.5,
    inputs: [
      { id: 21350, name: "Amethyst arrowtips" },
      { id: 53, name: "Headless arrow" },
    ],
  },
  {
    name: "Amethyst broad bolts",
    level: 76,
    xpEach: 10.6,
    inputs: [
      { id: 21338, name: "Amethyst bolt tips" },
      { id: 11875, name: "Broad bolts" },
    ],
  },
  {
    name: "Broad bolts",
    level: 55,
    xpEach: 3,
    inputs: [
      { id: 11876, name: "Unfinished broad bolts" },
      { id: 314, name: "Feather" },
    ],
  },
];

/**
 * Bank stock of the recipe inputs from the 2026-10-02 Bank Memory export,
 * used until a bank import replaces it.
 */
export const BASELINE_FLETCHING_STOCK: BankItem[] = [
  { itemId: 21350, name: "Amethyst arrowtips", quantity: 216_586 },
  { itemId: 53, name: "Headless arrow", quantity: 239_709 },
  { itemId: 21338, name: "Amethyst bolt tips", quantity: 31_930 },
  { itemId: 11875, name: "Broad bolts", quantity: 41_720 },
  { itemId: 11876, name: "Unfinished broad bolts", quantity: 1_410 },
  { itemId: 314, name: "Feather", quantity: 56_280 },
];

export interface FletchingLine {
  recipe: FletchingRecipe;
  /** How many you can make from stock, limited by the scarcer input. */
  makeable: number;
  xp: number;
}

export interface FletchingCoverage {
  currentXp: number;
  xpTo99: number;
  /** Lines in recipe order, highest XP each first; only the ones you can make. */
  lines: FletchingLine[];
  stockXp: number;
  /** stockXp / xpTo99, capped at 1; 1 when already 99. */
  covered: number;
  /** XP still to find after the stock is used; 0 when covered. */
  shortfallXp: number;
}

/**
 * Feathers are shared between recipes in principle; only Broad bolts uses
 * them here, so each recipe's inputs are independent.
 */
export function fletchingCoverage(currentXp: number, stock: BankItem[]): FletchingCoverage {
  const qty = (id: number) => stock.filter((i) => i.itemId === id).reduce((n, i) => n + i.quantity, 0);
  const xpTo99 = Math.max(0, XP_FOR_99 - Math.max(0, currentXp));
  const lines = FLETCHING_RECIPES.map((recipe) => {
    const makeable = Math.min(qty(recipe.inputs[0].id), qty(recipe.inputs[1].id));
    return { recipe, makeable, xp: makeable * recipe.xpEach };
  }).filter((l) => l.makeable > 0);
  const stockXp = lines.reduce((n, l) => n + l.xp, 0);
  return {
    currentXp,
    xpTo99,
    lines,
    stockXp,
    covered: xpTo99 === 0 ? 1 : Math.min(1, stockXp / xpTo99),
    shortfallXp: Math.max(0, xpTo99 - stockXp),
  };
}

/** Fletching XP from the Jagex HiScores JSON, or null when missing or unranked. */
export function fletchingXp(hiscores: unknown): number | null {
  if (typeof hiscores !== "object" || hiscores === null) return null;
  const skills = (hiscores as { skills?: unknown }).skills;
  if (!Array.isArray(skills)) return null;
  const entry = skills.find(
    (s: unknown) => typeof s === "object" && s !== null && (s as { name?: unknown }).name === "Fletching",
  ) as { xp?: unknown } | undefined;
  const xp = entry?.xp;
  return typeof xp === "number" && Number.isFinite(xp) && xp >= 0 ? xp : null;
}

/**
 * XP the stock pays for, capped at what's left to 99: Fletching the roadmap
 * can count as downtime rather than dedicated hours.
 */
export function downtimeFletchingXp(currentXp: number, stock: BankItem[]): number {
  const c = fletchingCoverage(currentXp, stock);
  return Math.min(c.stockXp, c.xpTo99);
}
