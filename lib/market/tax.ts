/**
 * Grand Exchange sale tax.
 *
 * VERIFIED 2026-09-08 against the OSRS Wiki:
 *   * Rate is 2%. It was 1% from its introduction on 5 Dec 2021 until
 *     29 May 2025, when Jagex doubled it. Any guide, calculator or formula
 *     still quoting 1% predates that change.
 *   * Rounded DOWN to the whole coin.
 *   * Capped at 5,000,000 gp per item. At 2% the cap binds from 250m upward
 *     (it was 500m under the old 1% rate).
 *   * Sales under 50 gp are untaxed.
 *   * Only the SELLER pays. Buy offers are never taxed.
 *
 * Source: https://oldschool.runescape.wiki/w/Grand_Exchange
 *
 * If you are reading this after another Jagex economy update, re-check the
 * rate and cap first -- every margin in this app is derived from them.
 */

/** When the constants below were last checked against the wiki. */
export const TAX_RULES_VERIFIED_ON = "2026-09-08";

/** Tax rate applied to the sale side of a flip. 2% since 29 May 2025. */
export const GE_TAX_RATE = 0.02;

/** Maximum tax charged on a single item. */
export const GE_TAX_CAP_PER_ITEM = 5_000_000;

/**
 * Sale price at or above which the cap binds. Derived, not hardcoded, so it
 * stays correct if the rate or cap changes: 5m / 2% = 250m.
 */
export const GE_TAX_CAP_THRESHOLD = GE_TAX_CAP_PER_ITEM / GE_TAX_RATE;

/** Sales below this price are untaxed. */
export const GE_TAX_MIN_TAXABLE_PRICE = 50;

/**
 * Known tax-exempt item ids.
 *
 * INCOMPLETE BY DESIGN. Jagex exempts a long, quietly-changing list: bonds,
 * energy potions, low-level ammo and mind runes, basic foods, teleport tablets
 * and charged jewellery, and cheap tools. Rather than pretend to enumerate it,
 * this holds only ids we are confident about and everything else defaults to
 * TAXED.
 *
 * That default is deliberate: treating an exempt item as taxed understates
 * profit, which costs you a missed flip. Treating a taxed item as exempt
 * overstates profit, which costs you gp. When in doubt, be pessimistic.
 *
 * The practical blast radius is small -- almost every exempt item is low-value,
 * where 2% is a rounding error. The one that genuinely matters is the bond.
 */
export const TAX_EXEMPT_ITEM_IDS: ReadonlySet<number> = new Set([
  13190, // Old school bond
]);

export function isTaxExempt(itemId: number): boolean {
  return TAX_EXEMPT_ITEM_IDS.has(itemId);
}

/**
 * Tax charged on selling ONE unit at `salePrice`.
 *
 * Rounded down, capped at {@link GE_TAX_CAP_PER_ITEM}, zero for exempt items
 * and for sales under {@link GE_TAX_MIN_TAXABLE_PRICE}.
 */
export function geTaxPerItem(salePrice: number, opts: { exempt?: boolean } = {}): number {
  if (opts.exempt) return 0;
  if (!Number.isFinite(salePrice) || salePrice < GE_TAX_MIN_TAXABLE_PRICE) return 0;
  return Math.min(Math.floor(salePrice * GE_TAX_RATE), GE_TAX_CAP_PER_ITEM);
}

/** Tax charged on selling `quantity` units at `salePrice` each. */
export function geTaxTotal(
  salePrice: number,
  quantity: number,
  opts: { exempt?: boolean } = {},
): number {
  return geTaxPerItem(salePrice, opts) * Math.max(0, Math.trunc(quantity));
}

/** What actually lands in your bank per unit after Jagex takes their cut. */
export function netSaleProceeds(salePrice: number, opts: { exempt?: boolean } = {}): number {
  return salePrice - geTaxPerItem(salePrice, opts);
}
