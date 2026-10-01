/**
 * Named strategy presets for the scanners.
 *
 * These are NOT scraped opinions from blogs or videos -- that was
 * deliberately rejected. Chasing "what some YouTuber flipped last week" has
 * no way to verify the source's track record and rewards whoever writes the
 * most confident guide, not whoever is actually right.
 *
 * Instead these thresholds are grounded in the OSRS Wiki's own Flipping
 * guide (https://oldschool.runescape.wiki/w/Flipping, checked 2026-09-08),
 * which documents two verifiable archetypes:
 *
 *   "Standard Flipping" -- buying and reselling at a short-term spread,
 *   wants "a significant margin" and "plenty of starting cash (10M at
 *   least)". This is the High-Margin scanner.
 *
 *   "Bulk Quantity Flipping" -- large quantities at a stable, thin margin
 *   ("often only a couple of gold each"), needs "20 million or more" in
 *   capital. This is the Bulk scanner.
 *
 * The guide also documents a third archetype, buy-limit arbitrage (buying
 * up to the limit over time, reselling off-exchange "on the forums or on
 * the streets"). That's deliberately not built as a scanner: it depends on
 * finding an off-GE buyer, which is a scam-risk, trust-based negotiation
 * our live-price model can't verify or price -- the same reason Decant
 * arbitrage stays blocked pending verification. It's a real, documented
 * strategy; it just isn't one this tool can safely automate a recommendation
 * for.
 *
 * Each preset's own numeric split (PvM-gear vs mid-tier vs budget, say) is
 * this app's judgment call about where to draw lines within the guide's
 * archetype, not a wiki citation -- the archetype and its capital
 * requirement are what's sourced.
 */

export const FLIPPING_GUIDE_SOURCE = "https://oldschool.runescape.wiki/w/Flipping";
export const PRESETS_VERIFIED_ON = "2026-09-08";

export interface HighMarginPreset {
  id: string;
  label: string;
  description: string;
  minMargin: number;
  suggestedCapital: number;
}

export const HIGH_MARGIN_PRESETS: HighMarginPreset[] = [
  {
    id: "pvm-gear",
    label: "PvM gear & rares",
    description: "Wide spreads on expensive, slow-moving items. Ties up capital longest.",
    // Checked against live prices when this was set: >=200k margin with a
    // 100m capital cap returned zero candidates -- PvM gear's spread and its
    // buy-limit cost scale together, so a margin bar that high needs more
    // capital room, not just a lower one. 100k/150m consistently returns a
    // handful of real candidates instead of an empty scanner.
    minMargin: 100_000,
    suggestedCapital: 150_000_000,
  },
  {
    id: "mid-tier",
    label: "Mid-tier gear",
    description: "The guide's default case: a significant margin, faster turnover than rares.",
    minMargin: 50_000,
    suggestedCapital: 50_000_000,
  },
  {
    id: "budget",
    label: "Budget flips",
    description: "Smaller margins, more affordable entry -- a starting point below 10m capital.",
    minMargin: 5_000,
    suggestedCapital: 10_000_000,
  },
];

export interface BulkPreset {
  id: string;
  label: string;
  description: string;
  minVolume: number;
  maxRoi: number;
  suggestedCapital: number;
}

export const BULK_PRESETS: BulkPreset[] = [
  {
    id: "mega-bulk",
    label: "Mega bulk",
    description: "The guide's 'couple of gold each' case -- needs real volume to matter.",
    minVolume: 50_000,
    maxRoi: 2,
    suggestedCapital: 50_000_000,
  },
  {
    id: "runes-ammo",
    label: "Runes & ammo style",
    description: "High volume, tight margin -- the original spec's >10,000/hr bar.",
    minVolume: 10_000,
    maxRoi: 3,
    suggestedCapital: 20_000_000,
  },
  {
    id: "herbs-food",
    label: "Herbs & food",
    description: "Slightly thinner volume floor, a bit more room on the margin.",
    minVolume: 2_000,
    maxRoi: 5,
    suggestedCapital: 10_000_000,
  },
];
