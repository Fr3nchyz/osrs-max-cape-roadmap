"use client";

import { ArrowRightLeft } from "lucide-react";
import { formatAge, formatGp } from "@/lib/format";
import { MIN_ROI_PERCENT, PER_ITEM_SHARE } from "@/lib/market/flipBook";
import type { CompanionState } from "@/lib/companion/types";
import type { FlipBookResponse } from "../api/market/flips/route";
import type { TrendsResponse } from "../api/market/trends/route";
import { flipWarnings, type Trend } from "@/lib/market/trend";
import type { CompanionUpdate } from "./useCompanionState";
import type { Remote } from "./useLive";
import { Card, CardTitle, LABEL, Loading, Notice, RetryButton, Sparkline, TrendLabel, minutesSince } from "./ui";

type Props = {
  className?: string;
  state: CompanionState;
  update: (change: CompanionUpdate) => void;
  /** Cash minus reserve: what the book can use without touching the reserve. */
  freeCashGp: number;
  budgetGp: number;
  book: Remote<FlipBookResponse>;
  /** 7-day trends for the picks. */
  trends: Remote<TrendsResponse>;
  now: number;
};

const MILLION = 1_000_000;

export default function FlipBook({ className = "", state, update, freeCashGp, budgetGp, book, trends, now }: Props) {
  const d = book.data;
  const overReserve = budgetGp > freeCashGp;

  return (
    <Card className={className} aria-labelledby="flips-title">
      <CardTitle
        id="flips-title"
        icon={ArrowRightLeft}
        aside={d ? `Prices ${formatAge(minutesSince(d.fetchedAt, now))}` : undefined}
      >
        Flip book
      </CardTitle>
      <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
        The knowledge base&apos;s flipping screen on live Wiki prices: both sides traded in the last 15 minutes, at least{" "}
        {MIN_ROI_PERCENT}% return after tax, no more than 0.5% of daily volume or the 4-hour buy limit, and at most{" "}
        {Math.round(PER_ITEM_SHARE * 100)}% of the book in one item. Buy at the instant-sell price and sell at the
        instant-buy price with patient offers; never chase.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className={LABEL}>Budget, M gp</span>
          <input
            type="number"
            min={0}
            step={1}
            value={state.flipBudgetGp > 0 ? Math.round(state.flipBudgetGp / MILLION) : ""}
            placeholder={String(Math.round(freeCashGp / MILLION))}
            onChange={(e) => update({ flipBudgetGp: Math.max(0, Math.round((Number(e.target.value) || 0) * MILLION)) })}
            className="mt-1.5 block w-28 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-bold text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-600"
          />
        </label>
        <p className="text-[11px] text-neutral-500 pb-2">
          {state.flipBudgetGp > 0 ? "" : "Blank = "}
          {formatGp(budgetGp)} · cash minus your reserve is {formatGp(freeCashGp)}
        </p>
      </div>
      {overReserve && (
        <div className="mt-3">
          <Notice tone="warn">
            This budget dips {formatGp(budgetGp - freeCashGp)} into your {formatGp(state.reserveGp)} reserve.
          </Notice>
        </div>
      )}

      {!d && book.loading && (
        <div className="mt-4">
          <Loading>Screening the market…</Loading>
        </div>
      )}
      {!d && book.error && !book.loading && (
        <div className="mt-4">
          <Notice tone="error" action={<RetryButton onClick={book.reload} />}>
            Market data unavailable ({book.error}).
          </Notice>
        </div>
      )}

      {d && (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            <Box label="Deployed" value={formatGp(d.deployed)} sub={`of ${formatGp(d.budget)}`} />
            <Box label="Profit per cycle" value={formatGp(d.profitPerCycle)} sub="if every pick fills once" />
            <Box label="Passed screen" value={d.screened.toLocaleString("en-US")} sub={`${d.picks.length} slots used`} />
          </dl>
          {d.picks.length === 0 ? (
            <div className="mt-3">
              <Notice>Nothing passes the screen right now. Check back after the next price update.</Notice>
            </div>
          ) : (
            <div className="relative mt-4 overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full text-xs">
                <caption className="sr-only">Flip picks</caption>
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className={TH}>Item</th>
                    <th className={`${TH} text-right`}>Buy at</th>
                    <th className={`${TH} text-right`}>Sell at</th>
                    <th className={`${TH} text-right`}>Units</th>
                    <th className={`${TH} text-right`}>Capital</th>
                    <th className={`${TH} text-right`}>Profit</th>
                    <th className={`${TH} text-right`}>ROI</th>
                    <th className={`${TH} text-right`}>7 days</th>
                    <th className={`${TH} text-right`}>Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {d.picks.map((p) => (
                    <tr key={p.itemId} className="border-b border-neutral-900 last:border-0">
                      <td className="px-3 py-1.5 font-bold text-neutral-200 max-w-[12rem] truncate">{p.name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-neutral-300">{p.buyAt.toLocaleString("en-US")}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-neutral-300">{p.sellAt.toLocaleString("en-US")}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-neutral-300">{p.units.toLocaleString("en-US")}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-neutral-300">{formatGp(p.capital)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-bold text-white">{formatGp(p.profitPerCycle)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-neutral-400">{p.roiPercent.toFixed(1)}%</td>
                      <TrendCells trend={trends.data?.trends[String(p.itemId)]} loading={trends.loading} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Warnings picks={d.picks} trends={trends.data} />
          <p className="mt-2 text-[11px] text-neutral-500">
            7 days: price change and shape over the last week (the line is grey when falling). Spread: hours in the last
            24 where the average spread beat the GE tax. Review offers each login; drop a flip after 24 hours if it hasn&apos;t filled or the edge is gone. The book is
            still cash in the T-bow plan.
          </p>
        </>
      )}
    </Card>
  );
}

const TH = "text-[10px] font-black text-neutral-500 uppercase tracking-wider px-3 py-2 text-left";

function Box({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl px-3 py-2.5 min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 text-lg font-black text-white tracking-tight leading-none">{value}</dd>
      {sub && <dd className="mt-1 text-[11px] text-neutral-500 truncate">{sub}</dd>}
    </div>
  );
}

function TrendCells({ trend, loading }: { trend: Trend | undefined; loading: boolean }) {
  if (!trend) {
    return (
      <>
        <td className="px-3 py-1.5 text-right text-neutral-600">{loading ? "…" : "--"}</td>
        <td className="px-3 py-1.5 text-right text-neutral-600">{loading ? "…" : "--"}</td>
      </>
    );
  }
  return (
    <>
      <td className="px-3 py-1.5 text-right">
        <span className="inline-flex items-center gap-2">
          <Sparkline values={trend.sparkline} falling={trend.direction === "falling"} />
          <TrendLabel direction={trend.direction} change7d={trend.change7d} />
        </span>
      </td>
      <td className="px-3 py-1.5 text-right tabular-nums text-neutral-400">
        {trend.spreadHours === null ? "--" : `${trend.spreadHours}/24h`}
      </td>
    </>
  );
}

function Warnings({ picks, trends }: { picks: FlipBookResponse["picks"]; trends: TrendsResponse | null }) {
  if (!trends) return null;
  const rows = picks
    .map((p) => ({ name: p.name, w: trends.trends[String(p.itemId)] ? flipWarnings(trends.trends[String(p.itemId)]) : [] }))
    .filter((r) => r.w.length > 0);
  if (rows.length === 0) return null;
  return (
    <div className="mt-3">
      <Notice tone="warn">
        <p className="font-bold">Check before buying</p>
        <ul className="mt-1 space-y-0.5">
          {rows.map((r) => (
            <li key={r.name}>
              <span className="font-bold">{r.name}:</span> {r.w.join("; ")}.
            </li>
          ))}
        </ul>
      </Notice>
    </div>
  );
}
