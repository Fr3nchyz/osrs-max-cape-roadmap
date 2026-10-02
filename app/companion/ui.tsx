"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";

/** Small uppercase label, the site's standard (never below 10px). */
export const LABEL = "text-[11px] font-black text-neutral-500 uppercase tracking-wider";

export function Card({
  children,
  className = "",
  hero = false,
  ...rest
}: {
  children: React.ReactNode;
  /** Layout classes only (grid spans, spacing); colours come from `hero`. */
  className?: string;
  /** The page's one emphasised card: a faint yellow wash, like the roadmap's "Do this next". */
  hero?: boolean;
} & React.AriaAttributes) {
  const skin = hero
    ? "bg-gradient-to-br from-yellow-600/15 via-neutral-900/60 to-neutral-900/60 border-yellow-700/30"
    : "bg-neutral-900/50 border-neutral-800";
  return (
    <section className={`border rounded-3xl p-5 sm:p-6 min-w-0 ${skin} ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function CardTitle({
  icon: Icon,
  children,
  aside,
  id,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 id={id} className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
        <Icon className="w-4 h-4 text-yellow-600 shrink-0" aria-hidden /> {children}
      </h2>
      {aside && <div className="text-[11px] font-bold text-neutral-500">{aside}</div>}
    </div>
  );
}

/** Inline status line: an icon plus text, never colour alone. */
export function Notice({
  tone = "info",
  children,
  action,
}: {
  tone?: "info" | "warn" | "error";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon = tone === "info" ? Info : AlertTriangle;
  const cls =
    tone === "error"
      ? "border-red-900/50 bg-red-950/30 text-red-300"
      : tone === "warn"
        ? "border-yellow-800/40 bg-yellow-950/30 text-yellow-200/90"
        : "border-neutral-800 bg-neutral-950/50 text-neutral-400";
  return (
    <div role={tone === "info" ? undefined : "alert"} className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs ${cls}`}>
      <Icon className="w-4 h-4 shrink-0 mt-px" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function Loading({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs text-neutral-500" role="status">
      <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-600" aria-hidden /> {children}
    </p>
  );
}

export function RetryButton({ onClick, busy = false }: { onClick: () => void; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="shrink-0 flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
    >
      <RefreshCw className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} aria-hidden /> Retry
    </button>
  );
}

/** On/off switch with its label; the state is also spelled out for screen readers via aria-checked. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 text-left rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3 transition-colors hover:border-neutral-700 disabled:opacity-40 disabled:hover:border-neutral-800 disabled:cursor-not-allowed"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-neutral-200">{label}</span>
        {hint && <span className="block text-[11px] text-neutral-500 mt-0.5">{hint}</span>}
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 w-6 text-right">
          {checked ? "On" : "Off"}
        </span>
        <span
          aria-hidden
          className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-yellow-600" : "bg-neutral-800"}`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`}
          />
        </span>
      </span>
    </button>
  );
}

/** "Jan 21, 2027" */
export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Whole hours with thousands separators: "1,240h". */
export function formatHours(hours: number): string {
  return `${Math.ceil(hours).toLocaleString("en-US")}h`;
}

/** Minutes between an ISO timestamp (or epoch ms) and `now`, never negative. */
export function minutesSince(then: string | number, now: number): number {
  const t = typeof then === "number" ? then : Date.parse(then);
  return Math.max(0, (now - t) / 60_000);
}

/** "Oct 2" style day for bank snapshot labels. */
export function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** A bank import this old (days) gets a "may be out of date" warning. */
export const BANK_STALE_DAYS = 7;

/** Tiny line of recent prices; decorative, so callers state the change in text beside it. */
export function Sparkline({ values, falling }: { values: number[]; falling?: boolean }) {
  if (values.length < 2) return null;
  const w = 64;
  const h = 18;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * (w - 2) + 1).toFixed(1)},${(h - 1 - ((v - lo) / span) * (h - 2)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="inline-block align-middle">
      <path d={d} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={falling ? "stroke-neutral-500" : "stroke-yellow-600"} />
    </svg>
  );
}

/** Trend as icon + text (never colour alone): "↗ +4.2% 7d". */
export function TrendLabel({ direction, change7d }: { direction: "rising" | "flat" | "falling"; change7d: number | null }) {
  const arrow = direction === "rising" ? "↗" : direction === "falling" ? "↘" : "→";
  const word = direction === "rising" ? "Rising" : direction === "falling" ? "Falling" : "Flat";
  return (
    <span className={`whitespace-nowrap ${direction === "falling" ? "text-yellow-500 font-bold" : "text-neutral-300"}`} title={word}>
      <span aria-hidden>{arrow}</span> <span className="sr-only">{word}, </span>
      {change7d === null ? "--" : `${change7d > 0 ? "+" : ""}${change7d.toFixed(1)}%`}
    </span>
  );
}
