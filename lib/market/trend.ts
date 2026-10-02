/**
 * Price trend indicators from the Wiki's 7-day hourly history, so a flip or
 * a sale isn't judged on the latest two trades alone.
 */

import { geTaxPerItem } from "./tax";
import type { WikiTimeseriesPoint } from "./wiki";

export type TrendDirection = "rising" | "flat" | "falling";

export interface Trend {
  /** Change of the mid price over the last 24 hours, percent; null without data. */
  change24h: number | null;
  /** Change over the whole window (about 7 days), percent. */
  change7d: number | null;
  direction: TrendDirection;
  /** Typical daily move: standard deviation of hourly returns scaled to a day, percent. */
  volatility: number | null;
  /** Hours in the last 24 where the average spread beat the GE tax (0-24); null without data. */
  spreadHours: number | null;
  /** Where the latest mid sits in the window's range: 0 = low, 1 = high. */
  rangePosition: number | null;
  /** About 28 mid prices (6-hour steps), oldest first, for a sparkline. */
  sparkline: number[];
}

/** 7d move beyond this, or a 24h move beyond FALL_24H, sets the direction. */
const MOVE_7D = 3;
const FALL_24H = -3;

function mid(p: WikiTimeseriesPoint): number | null {
  const h = p.avgHighPrice;
  const l = p.avgLowPrice;
  if (h !== null && l !== null) return (h + l) / 2;
  return h ?? l;
}

const pct = (from: number, to: number) => ((to - from) / from) * 100;

export function trendFrom(points: WikiTimeseriesPoint[], exempt = false): Trend {
  const pts = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const mids = pts.map((p) => ({ t: p.timestamp, m: mid(p) })).filter((x): x is { t: number; m: number } => x.m !== null && x.m > 0);
  if (mids.length < 2) {
    return { change24h: null, change7d: null, direction: "flat", volatility: null, spreadHours: null, rangePosition: null, sparkline: [] };
  }
  const last = mids[mids.length - 1];
  const dayAgo = [...mids].reverse().find((x) => x.t <= last.t - 24 * 3600) ?? null;
  const change24h = dayAgo ? pct(dayAgo.m, last.m) : null;
  const change7d = pct(mids[0].m, last.m);

  const direction: TrendDirection =
    (change24h !== null && change24h <= FALL_24H) || change7d <= -MOVE_7D
      ? "falling"
      : change7d >= MOVE_7D
        ? "rising"
        : "flat";

  // Hourly log returns -> daily volatility.
  const rets: number[] = [];
  for (let i = 1; i < mids.length; i++) rets.push(Math.log(mids[i].m / mids[i - 1].m));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length);
  const volatility = sd * Math.sqrt(24) * 100;

  const recent = pts.filter((p) => p.timestamp > last.t - 24 * 3600);
  const withBoth = recent.filter((p) => p.avgHighPrice !== null && p.avgLowPrice !== null);
  const spreadHours = withBoth.length
    ? withBoth.filter((p) => p.avgHighPrice! - geTaxPerItem(p.avgHighPrice!, { exempt }) - p.avgLowPrice! > 0).length
    : null;

  const values = mids.map((x) => x.m);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const rangePosition = hi > lo ? (last.m - lo) / (hi - lo) : 0.5;

  const step = Math.max(1, Math.round(mids.length / 28));
  const sparkline = mids.filter((_, i) => i % step === 0 || i === mids.length - 1).map((x) => Math.round(x.m));

  return { change24h, change7d, direction, volatility, spreadHours, rangePosition, sparkline };
}

/** Plain-language warnings for buying into a flip. */
export function flipWarnings(t: Trend): string[] {
  const w: string[] = [];
  if (t.direction === "falling") w.push("Falling price: buys may lose value before they sell");
  if (t.rangePosition !== null && t.rangePosition > 0.9) w.push("Near its 7-day high");
  if (t.spreadHours !== null && t.spreadHours < 12) w.push(`Spread beat tax in only ${t.spreadHours} of the last 24 hours`);
  if (t.volatility !== null && t.volatility > 10) w.push(`Volatile: about ${Math.round(t.volatility)}% a day`);
  return w;
}
