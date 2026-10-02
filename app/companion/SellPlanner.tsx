"use client";

import { useMemo, useState } from "react";
import { HandCoins, TrendingDown, TrendingUp, Wand2, X } from "lucide-react";
import { formatGp } from "@/lib/format";
import { autoPick, sellPlan } from "@/lib/companion/sellPlan";
import type { BankValuation, CompanionState, PriceTable } from "@/lib/companion/types";
import type { DailyResponse } from "../api/prices/daily/route";
import type { CompanionUpdate } from "./useCompanionState";
import type { Remote } from "./useLive";
import { Card, CardTitle, LABEL, Notice, Sparkline, TrendLabel, shortDay } from "./ui";
import type { TrendsResponse } from "../api/market/trends/route";

const ROWS = 30;
/** Flag a 24h move at least this big on anything you plan to sell. */
const MOVE_PCT = 3;

type Props = {
  className?: string;
  state: CompanionState;
  update: (change: CompanionUpdate) => void;
  valuation: BankValuation | null;
  prices: PriceTable | null;
  /** T-bow + reserve. */
  targetGp: number | null;
  weeklyPvmGp: number;
  weeksToMax: number | null;
  daily: Remote<DailyResponse>;
  /** 7-day trends for the rows shown. */
  trends: Remote<TrendsResponse>;
  /** Bank date and whether it's the built-in snapshot. */
  bankTakenAt: string | null;
  bankIsSnapshot: boolean;
};

export default function SellPlanner({
  className = "",
  state,
  update,
  valuation,
  prices,
  targetGp,
  weeklyPvmGp,
  weeksToMax,
  daily,
  trends,
  bankTakenAt,
  bankIsSnapshot,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const volume = useMemo(
    () => Object.fromEntries(Object.entries(daily.data?.items ?? {}).map(([id, d]) => [id, d.volume])),
    [daily.data]
  );

  if (!valuation || targetGp === null) {
    return (
      <Card className={className} aria-labelledby="sell-title">
        <CardTitle id="sell-title" icon={HandCoins}>
          Sell planner
        </CardTitle>
        <div className="mt-4">
          <Notice>
            Import your bank (Bank import card) and wait for live prices to plan what to sell for the bow.
          </Notice>
        </div>
      </Card>
    );
  }

  const weeks = weeksToMax ?? 0;
  const plan = sellPlan({
    valuation,
    targetGp,
    weeklyPvmGp,
    weeksToMax: weeks,
    selection: state.sellSelection,
    dailyVolume: volume,
  });
  const sellable = valuation.items.filter((i) => !i.kept && i.unitPrice !== null && i.netTotal > 0);
  const rows = showAll ? sellable : sellable.slice(0, ROWS);

  const setQty = (itemId: number, qty: number) =>
    update((prev) => {
      const next = { ...prev.sellSelection };
      if (qty > 0) next[String(itemId)] = qty;
      else delete next[String(itemId)];
      return { ...prev, sellSelection: next };
    });

  const onAuto = () => {
    const { selection } = autoPick(valuation, plan.cashNeededAtMax);
    update({ sellSelection: selection });
  };

  const move = (itemId: number): number | null => {
    const avg = daily.data?.items[String(itemId)]?.avgLow;
    const now = prices?.[String(itemId)]?.low;
    if (!avg || !now) return null;
    return ((now - avg) / avg) * 100;
  };

  const allSellable = sellable.reduce((n, i) => n + i.netTotal, 0);

  return (
    <Card className={className} aria-labelledby="sell-title">
      <CardTitle id="sell-title" icon={HandCoins} aside="Plan for buying after max">
        Sell planner
      </CardTitle>
      <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
        The bow and your reserve are paid in coins. Pick what you&apos;d sell on max day; kept items (your Fletching stock
        and anything else ticked Keep) stay out.
        {bankTakenAt && (
          <span className="block mt-1 text-yellow-500/90">
            Quantities from your {bankIsSnapshot ? "built-in bank snapshot" : "bank import"} of {shortDay(bankTakenAt)}; they
            may be out of date. Prices are live.
          </span>
        )}
      </p>

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Box label="Cash needed now" value={formatGp(plan.cashNeededNow)} sub="bow + reserve − cash" />
        <Box
          label="PvM until max"
          value={weeksToMax === null ? "--" : `+${formatGp(plan.earnedByMax)}`}
          sub={weeksToMax === null ? "needs HiScores" : `${weeks.toFixed(1)} weeks at plan rate`}
        />
        <Box label="Your picks raise" value={formatGp(plan.raisedGp)} sub={`${plan.lines.length} items`} />
        <Box
          label="Still short on max day"
          value={formatGp(plan.stillShort)}
          sub={plan.stillShort === 0 ? "covered" : "keep earning or sell more"}
          strong
        />
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAuto}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <Wand2 className="w-3.5 h-3.5" aria-hidden /> Pick for me
        </button>
        <button
          type="button"
          onClick={() => update({ sellSelection: {} })}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <X className="w-3.5 h-3.5" aria-hidden /> Clear
        </button>
        <span className="text-[11px] text-neutral-500">
          Pick for me takes your biggest sellable stacks until max day&apos;s need is covered.
          {allSellable < plan.cashNeededAtMax && ` Everything sellable (${formatGp(allSellable)}) won't cover it alone.`}
        </span>
      </div>
      {plan.slowestDays !== null && plan.slowestDays > 2 && (
        <div className="mt-3">
          <Notice tone="warn">
            Slowest pick needs about {plan.slowestDays} days to sell at 10% of its daily volume. List it early.
          </Notice>
        </div>
      )}

      <div className="relative mt-4 overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="w-full text-xs">
          <caption className="sr-only">Sellable items and quantities to sell</caption>
          <thead>
            <tr className="border-b border-neutral-800">
              <th className={TH}>Item</th>
              <th className={`${TH} text-right`}>Owned</th>
              <th className={`${TH} text-right`}>Sell</th>
              <th className={`${TH} text-right`}>Net</th>
              <th className={`${TH} text-right`}>Days</th>
              <th className={`${TH} text-right`}>24h</th>
              <th className={`${TH} text-right`}>7 days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const qty = Math.min(item.quantity, state.sellSelection[String(item.itemId)] ?? 0);
              const line = plan.lines.find((l) => l.item.itemId === item.itemId);
              const m = move(item.itemId);
              const days = line?.daysToSell ?? null;
              return (
                <tr key={item.itemId} className={`border-b border-neutral-900 last:border-0 ${qty > 0 ? "bg-yellow-600/5" : ""}`}>
                  <td className="px-3 py-1.5 font-bold text-neutral-200 max-w-[12rem] truncate">{item.name}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-400">{item.quantity.toLocaleString("en-US")}</td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={qty || ""}
                      placeholder="0"
                      aria-label={`Sell quantity for ${item.name}`}
                      onChange={(e) => setQty(item.itemId, Math.max(0, Math.min(item.quantity, Math.floor(Number(e.target.value) || 0))))}
                      className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-right text-xs font-bold text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-600"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-bold text-white">
                    {formatGp(qty > 0 ? (line?.netGp ?? 0) : item.netTotal)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-400">{qty > 0 && days !== null ? days : "--"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {m === null ? (
                      <span className="text-neutral-600">--</span>
                    ) : Math.abs(m) >= MOVE_PCT ? (
                      <span className="inline-flex items-center gap-1 font-bold text-yellow-500">
                        {m > 0 ? <TrendingUp className="w-3 h-3" aria-hidden /> : <TrendingDown className="w-3 h-3" aria-hidden />}
                        {m > 0 ? "+" : ""}
                        {m.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-neutral-500">
                        {m > 0 ? "+" : ""}
                        {m.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {trends.data?.trends[String(item.itemId)] ? (
                      <span className="inline-flex items-center gap-2">
                        <Sparkline
                          values={trends.data.trends[String(item.itemId)].sparkline}
                          falling={trends.data.trends[String(item.itemId)].direction === "falling"}
                        />
                        <TrendLabel
                          direction={trends.data.trends[String(item.itemId)].direction}
                          change7d={trends.data.trends[String(item.itemId)].change7d}
                        />
                      </span>
                    ) : (
                      <span className="text-neutral-600">{trends.loading ? "…" : "--"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
        <span>
          Net is after the 2% tax and {state.slippagePct}% slippage. 24h compares the instant-sell price with its 24h
          average; moves of {MOVE_PCT}% or more are highlighted. 7 days shows the week&apos;s trend for the top 30 rows:
          sell what&apos;s falling sooner, hold what&apos;s rising.
        </span>
        {sellable.length > ROWS && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="font-bold text-yellow-600 hover:text-yellow-500">
            {showAll ? "Show top 30" : `Show all ${sellable.length}`}
          </button>
        )}
      </div>
    </Card>
  );
}

const TH = "text-[10px] font-black text-neutral-500 uppercase tracking-wider px-3 py-2 text-left";

function Box({ label, value, sub, strong = false }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div
      className={`rounded-2xl px-3 py-2.5 min-w-0 border ${strong ? "border-yellow-600/40 bg-yellow-600/10" : "border-neutral-800 bg-neutral-950/50"}`}
    >
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 text-lg font-black text-white tracking-tight leading-none">{value}</dd>
      {sub && <dd className="mt-1 text-[11px] text-neutral-500 truncate">{sub}</dd>}
    </div>
  );
}
