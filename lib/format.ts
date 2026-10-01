/**
 * Number formatting in the style OSRS players actually read prices in:
 * 1.2m, 850k, 2.4b -- not 1,200,000.
 */

export function formatGp(value: number | null | undefined, opts: { sign?: boolean } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";

  const sign = value < 0 ? "-" : opts.sign && value > 0 ? "+" : "";
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}b`;
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}m`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

/** Two significant decimals below 10, one below 100, none above. */
function trim(value: number): string {
  const decimals = value < 10 ? 2 : value < 100 ? 1 : 0;
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

export function formatFullGp(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  return Math.round(value).toLocaleString("en-US");
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  return `${value.toFixed(decimals)}%`;
}

export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}m`;
  if (value >= 1_000) return `${trim(value / 1_000)}k`;
  return String(Math.round(value));
}

/** "4m ago" / "2h ago" -- how stale a quote is. */
export function formatAge(minutes: number): string {
  if (!Number.isFinite(minutes)) return "never";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}
