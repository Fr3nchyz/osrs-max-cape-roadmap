/**
 * Bank import: parse RuneLite Bank Memory's "Copy item data to clipboard" TSV
 * and value it at live Grand Exchange prices, net of tax and slippage.
 *
 * Bank Memory's format (verified from its source, ClipboardActions.java):
 *   Item id<TAB>Item name<TAB>Item quantity      <- header
 *   4151<TAB>Abyssal whip<TAB>1                    <- one row per item
 * Lines end with the OS separator, so expect \r\n from Windows.
 */

import { geTaxPerItem, isTaxExempt } from "@/lib/market/tax";
import {
  COINS_ITEM_ID,
  PLATINUM_TOKEN_GP,
  PLATINUM_TOKEN_ITEM_ID,
  type BankItem,
  type BankValuation,
  type PriceQuote,
  type PriceTable,
  type ValuedItem,
} from "./types";

const NO_ITEMS_MESSAGE =
  "No bank items found — paste the output of Bank Memory's “Copy item data to clipboard”.";
const SECOND_PASTE_MESSAGE =
  "This looks like more than one bank paste (the header appears twice). Paste one bank at a time.";

/**
 * Rules: split on \r?\n; trim; skip blank lines; skip a header line (first
 * cell not an integer); each row needs id (integer > 0), name, quantity
 * (integer > 0) separated by tabs, otherwise count it as skipped; merge
 * duplicate ids by summing quantity. Throws an Error with a user-facing
 * message when no valid rows remain, or when a second header shows the same
 * bank was pasted twice (merging would double every quantity).
 */
export function parseBankMemoryTsv(text: string): { items: BankItem[]; skipped: number } {
  const byId = new Map<number, BankItem>();
  let skipped = 0;
  let seenFirstLine = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") continue;
    const cells = line.split("\t").map((cell) => cell.trim());

    const isFirstLine = !seenFirstLine;
    seenFirstLine = true;
    // The header is the first line whose id cell isn't a number. A later
    // "Item id" line means two pastes back to back.
    if (isFirstLine && !/^[+-]?\d+$/.test(cells[0])) continue;
    if (/^item id$/i.test(cells[0])) throw new Error(SECOND_PASTE_MESSAGE);

    const itemId = parsePositiveInt(cells[0]);
    const name = cells[1] ?? "";
    const quantity = parsePositiveInt(cells[2]);
    if (cells.length !== 3 || itemId === null || name === "" || quantity === null) {
      skipped++;
      continue;
    }

    const existing = byId.get(itemId);
    if (existing) existing.quantity += quantity;
    else byId.set(itemId, { itemId, name, quantity });
  }

  if (byId.size === 0) throw new Error(NO_ITEMS_MESSAGE);
  return { items: [...byId.values()], skipped };
}

/**
 * Coins (995) add quantity to cashGp; platinum tokens (13204) add
 * quantity x 1000. Every other item becomes a ValuedItem:
 * unitPrice = prices[id].low ?? prices[id].high ?? null;
 * taxPerUnit = geTaxPerItem(unitPrice, { exempt: isTaxExempt(id) }) from
 * lib/market/tax; grossTotal = quantity x unitPrice;
 * netTotal = floor(quantity x (unitPrice - taxPerUnit) x (1 - slippagePct / 100));
 * unpriced items get unitPrice null and zero totals.
 */
export function valueBank(
  items: BankItem[],
  prices: PriceTable,
  keepItemIds: ReadonlySet<number>,
  slippagePct: number,
): BankValuation {
  const slippage = Number.isFinite(slippagePct) ? Math.min(100, Math.max(0, slippagePct)) : 0;
  let cashGp = 0;
  const valued: ValuedItem[] = [];

  for (const { itemId, name, quantity } of items) {
    if (itemId === COINS_ITEM_ID) {
      cashGp += quantity;
      continue;
    }
    if (itemId === PLATINUM_TOKEN_ITEM_ID) {
      cashGp += quantity * PLATINUM_TOKEN_GP;
      continue;
    }

    const unitPrice = salePrice(prices[String(itemId)]);
    const kept = keepItemIds.has(itemId);
    if (unitPrice === null) {
      valued.push({ itemId, name, quantity, unitPrice, taxPerUnit: 0, grossTotal: 0, netTotal: 0, kept });
      continue;
    }
    const taxPerUnit = geTaxPerItem(unitPrice, { exempt: isTaxExempt(itemId) });
    // (100 - pct) / 100 rather than (1 - pct / 100): the whole-number product
    // floors exactly where the latter can land a hair under an integer.
    const netTotal = Math.floor((quantity * (unitPrice - taxPerUnit) * (100 - slippage)) / 100);
    valued.push({
      itemId,
      name,
      quantity,
      unitPrice,
      taxPerUnit,
      grossTotal: quantity * unitPrice,
      netTotal,
      kept,
    });
  }

  valued.sort(
    (a, b) =>
      Number(a.unitPrice === null) - Number(b.unitPrice === null) ||
      b.netTotal - a.netTotal ||
      a.name.localeCompare(b.name, "en") ||
      a.itemId - b.itemId,
  );

  let liquidatableNetGp = 0;
  let liquidatableGrossGp = 0;
  let keptNetGp = 0;
  let unpricedCount = 0;
  for (const item of valued) {
    if (item.unitPrice === null) unpricedCount++;
    else if (item.kept) keptNetGp += item.netTotal;
    else {
      liquidatableNetGp += item.netTotal;
      liquidatableGrossGp += item.grossTotal;
    }
  }

  return { cashGp, items: valued, liquidatableNetGp, liquidatableGrossGp, keptNetGp, unpricedCount };
}

/** A whole number > 0 written as plain digits, else null. */
function parsePositiveInt(cell: string | undefined): number | null {
  if (cell === undefined || !/^\d+$/.test(cell)) return null;
  const n = Number(cell);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Instant-sell price, else instant-buy, else null (no usable GE price). */
function salePrice(quote: PriceQuote | undefined): number | null {
  if (!quote) return null;
  return usablePrice(quote.low) ?? usablePrice(quote.high);
}

function usablePrice(price: number | null | undefined): number | null {
  return typeof price === "number" && Number.isFinite(price) && price >= 0 ? price : null;
}
