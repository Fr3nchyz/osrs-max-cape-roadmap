"use client";

import { ArrowDownRight, ArrowUpRight, Coins, Keyboard, Landmark, Minus } from "lucide-react";
import { formatAge, formatFullGp, formatGp, formatPercent } from "@/lib/format";
import { GE_TAX_RATE } from "@/lib/market/tax";
import type { Funding, TbowPriceResponse } from "@/lib/companion/types";
import type { Remote } from "./useLive";
import { Card, LABEL, Loading, Notice, RetryButton, minutesSince } from "./ui";

export type BankStatus = "off" | "valuing" | "unavailable" | "on";

type Props = {
  className?: string;
  funding: Funding | null;
  tbow: Remote<TbowPriceResponse>;
  bankStatus: BankStatus;
  bankImportedAt: string | null;
  slippagePct: number;
  ownsTbow: boolean;
  now: number;
};

export default function FundingHero({
  className = "",
  funding,
  tbow,
  bankStatus,
  bankImportedAt,
  slippagePct,
  ownsTbow,
  now,
}: Props) {
  return (
    <Card hero className={className} aria-labelledby="funding-gap-label">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p id="funding-gap-label" className={`${LABEL} flex items-center gap-2`}>
          <Coins className="w-3.5 h-3.5 text-yellow-600" aria-hidden /> Funding gap
        </p>
        {funding && !ownsTbow && <SourceChip funding={funding} importedAt={bankImportedAt} now={now} />}
      </div>

      {ownsTbow ? (
        <div className="mt-3">
          <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">Bow owned</p>
          <p className="mt-2 text-sm text-neutral-400">The gap no longer applies. You are in the Rebuild stage.</p>
        </div>
      ) : funding ? (
        <GapAndMeter funding={funding} />
      ) : (
        <Pending tbow={tbow} bankStatus={bankStatus} />
      )}

      {bankStatus === "unavailable" && !ownsTbow && (
        <div className="mt-4">
          <Notice tone="warn">
            Live prices for your bank import are unavailable, so these numbers use your manual inputs.
          </Notice>
        </div>
      )}

      {tbow.error && tbow.data && (
        <div className="mt-4">
          <Notice tone="warn" action={<RetryButton onClick={tbow.reload} busy={tbow.loading} />}>
            Refresh failed ({tbow.error}). Showing the price fetched{" "}
            {formatAge(minutesSince(tbow.data.fetchedAt, now))}.
          </Notice>
        </div>
      )}

      {(funding || tbow.data) && (
        <div className="mt-6 pt-5 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {funding && !ownsTbow && (
            <>
              <Breakdown
                title="Target"
                total={funding.targetGp}
                rows={[
                  ["T-bow, instant buy", formatGp(funding.tbowPriceGp)],
                  ["Reserve", `+${formatGp(funding.targetGp - funding.tbowPriceGp)}`],
                ]}
              />
              <Breakdown
                title="Capital"
                total={funding.capitalGp}
                rows={[
                  ["Cash", formatGp(funding.cashGp)],
                  ["Tradeables, net", formatGp(funding.tradeablesNetGp)],
                ]}
              />
            </>
          )}
          {tbow.data && (
            <TbowPrice
              data={tbow.data}
              now={now}
              className={funding && !ownsTbow ? "sm:border-l sm:border-neutral-800/80 sm:pl-6" : ""}
            />
          )}
        </div>
      )}

      {funding && !ownsTbow && (
        <p className="mt-5 text-xs text-neutral-500">
          Gap before tax and slippage:{" "}
          <span className="font-bold text-neutral-300">{formatGp(funding.gapBeforeCostsGp)}</span>
          <span className="text-neutral-600">
            {" "}
            · net figures take {formatPercent(GE_TAX_RATE * 100, 0)} GE tax and {formatPercent(slippagePct, Number.isInteger(slippagePct) ? 0 : 1)}{" "}
            slippage off sales
          </span>
        </p>
      )}
    </Card>
  );
}

function GapAndMeter({ funding }: { funding: Funding }) {
  const pct = Math.max(0, Math.min(1, funding.progress)) * 100;
  const funded = funding.gapGp === 0;

  return (
    <>
      {/* The page's single hero number: proportional digits, no tabular figures. */}
      <p className="mt-3 text-6xl sm:text-7xl font-black text-white tracking-tighter leading-none proportional-nums break-words">
        {formatGp(funding.gapGp)}
      </p>
      <p className="mt-2 text-sm text-neutral-400">
        {funded
          ? "Fully funded: capital covers the bow and the reserve."
          : `${formatFullGp(funding.gapGp)} gp still to raise`}
      </p>

      <div className="mt-6">
        <div
          role="meter"
          aria-label="Capital against target"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-valuetext={`${formatPercent(pct)} funded`}
          className="h-3 rounded-full bg-yellow-950 overflow-hidden"
        >
          <div className="h-full rounded-full bg-yellow-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          <span className="font-black text-white">{formatPercent(pct)} funded</span> · {formatGp(funding.capitalGp)} of{" "}
          {formatGp(funding.targetGp)}
        </p>
      </div>
    </>
  );
}

function Pending({ tbow, bankStatus }: { tbow: Remote<TbowPriceResponse>; bankStatus: BankStatus }) {
  if (tbow.data && tbow.data.high === null) {
    return (
      <div className="mt-4">
        <Notice tone="error" action={<RetryButton onClick={tbow.reload} busy={tbow.loading} />}>
          The OSRS Wiki has no recent instant-buy price for the Twisted bow, so the gap can&apos;t be worked out.
        </Notice>
      </div>
    );
  }
  if (!tbow.data && tbow.error && !tbow.loading) {
    return (
      <div className="mt-4">
        <Notice tone="error" action={<RetryButton onClick={tbow.reload} />}>
          <span className="font-bold">Live T-bow price unavailable.</span> The gap depends on it, so none is shown.{" "}
          <span className="text-red-300/70">({tbow.error})</span>
        </Notice>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-3">
      <div className="h-[60px] sm:h-[72px] w-56 rounded-2xl bg-neutral-800/60 animate-pulse" aria-hidden />
      <Loading>
        {bankStatus === "valuing" && tbow.data
          ? "Valuing your bank import at live prices…"
          : "Loading the live T-bow price…"}
      </Loading>
    </div>
  );
}

function SourceChip({ funding, importedAt, now }: { funding: Funding; importedAt: string | null; now: number }) {
  const bank = funding.source === "bank";
  const Icon = bank ? Landmark : Keyboard;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700/70 bg-neutral-950/50 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-neutral-400">
      <Icon className="w-3.5 h-3.5" aria-hidden />
      {bank
        ? `From bank import${importedAt ? ` · ${formatAge(minutesSince(importedAt, now))}` : ""}`
        : "From manual inputs"}
    </span>
  );
}

function Breakdown({ title, total, rows }: { title: string; total: number; rows: [string, string][] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className={LABEL}>{title}</p>
        <p className="text-lg font-black text-white tracking-tight">{formatGp(total)}</p>
      </div>
      <p className="text-[11px] text-neutral-600 text-right">{formatFullGp(total)} gp</p>
      <dl className="mt-2 space-y-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-neutral-500">{k}</dt>
            <dd className="font-bold text-neutral-300 tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TbowPrice({ data, now, className }: { data: TbowPriceResponse; now: number; className: string }) {
  const points = data.history30d.map((p) => p.high ?? p.low).filter((v): v is number => v !== null);
  const first = points[0];
  const last = points[points.length - 1];
  const change = points.length >= 2 && first > 0 ? ((last - first) / first) * 100 : null;
  const min = points.length ? Math.min(...points) : null;
  const max = points.length ? Math.max(...points) : null;
  const TrendIcon = change === null || Math.abs(change) < 0.05 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;

  const rows: [string, React.ReactNode][] = [
    ["Last trade", data.highTime ? formatAge(minutesSince(data.highTime * 1000, now)) : "--"],
    [
      "30-day change",
      change === null ? (
        "--"
      ) : (
        <span className="inline-flex items-center gap-1">
          <TrendIcon className="w-3 h-3 text-neutral-400" aria-hidden />
          {change > 0 ? "+" : ""}
          {formatPercent(change)}
        </span>
      ),
    ],
    ["30-day range", min === null || max === null ? "--" : `${formatGp(min)} – ${formatGp(max)}`],
    ["Instant sell", formatGp(data.low)],
    ["Fetched", formatAge(minutesSince(data.fetchedAt, now))],
  ];

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={LABEL}>T-bow price</p>
        <p className="text-lg font-black text-white tracking-tight">{formatGp(data.high)}</p>
      </div>
      <p className="text-[11px] text-neutral-600 text-right">{formatFullGp(data.high)} gp · instant buy</p>
      <dl className="mt-2 space-y-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-neutral-500">{k}</dt>
            <dd className="font-bold text-neutral-300 tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
