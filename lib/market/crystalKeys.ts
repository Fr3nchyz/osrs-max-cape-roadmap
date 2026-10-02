/**
 * Making crystal keys: buy a tooth half and a loop half, combine them, sell
 * the key. Low attention, but thin: the margin only exists with patient
 * offers, and how many you can move is set by GE volume, not by your time.
 */

import { geTaxPerItem } from "./tax";

export const TOOTH_HALF_ID = 985;
export const LOOP_HALF_ID = 987;
export const CRYSTAL_KEY_ID = 989;

/** Share of an item's daily volume one player can realistically take without moving the price. */
export const REALISTIC_VOLUME_SHARE = 0.1;

export interface ItemMarket {
  /** Latest instant-buy price. */
  high: number | null;
  /** Latest instant-sell price. */
  low: number | null;
  /** Units traded in the last 24 hours (both sides). */
  dailyVolume: number;
}

export interface CrystalKeyPlan {
  /** Buy halves instantly (at high) and sell the key instantly (at low), after tax. */
  instantMarginGp: number | null;
  /** Buy halves with patient offers (at low) and sell the key at high, after tax. */
  patientMarginGp: number | null;
  /** Keys a day you can realistically make: a share of the thinnest of the three markets. */
  keysPerDay: number;
  /** keysPerDay x patient margin; null when the patient margin is unknown or negative. */
  profitPerDayGp: number | null;
  /** Which market caps keysPerDay. */
  bottleneck: "tooth" | "loop" | "key";
  /** GE buy limit per half, every 4 hours; null when unknown. */
  buyLimit: number | null;
}

function margin(buyA: number | null, buyB: number | null, sell: number | null): number | null {
  if (buyA === null || buyB === null || sell === null) return null;
  return sell - geTaxPerItem(sell, { exempt: false }) - buyA - buyB;
}

export function crystalKeyPlan(
  tooth: ItemMarket,
  loop: ItemMarket,
  key: ItemMarket,
  buyLimit: number | null = null,
): CrystalKeyPlan {
  const instantMarginGp = margin(tooth.high, loop.high, key.low);
  const patientMarginGp = margin(tooth.low, loop.low, key.high);

  const caps = [
    { which: "tooth" as const, n: tooth.dailyVolume },
    { which: "loop" as const, n: loop.dailyVolume },
    { which: "key" as const, n: key.dailyVolume },
  ].sort((a, b) => a.n - b.n);
  let keysPerDay = Math.floor(caps[0].n * REALISTIC_VOLUME_SHARE);
  // Six 4-hour buy-limit windows a day.
  if (buyLimit !== null) keysPerDay = Math.min(keysPerDay, buyLimit * 6);

  return {
    instantMarginGp,
    patientMarginGp,
    keysPerDay,
    profitPerDayGp: patientMarginGp !== null && patientMarginGp > 0 ? keysPerDay * patientMarginGp : null,
    bottleneck: caps[0].which,
    buyLimit,
  };
}
