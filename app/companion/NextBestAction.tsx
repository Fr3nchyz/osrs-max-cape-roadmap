"use client";

import { ArrowRight, Compass, Feather, Swords } from "lucide-react";
import { formatGp } from "@/lib/format";
import type { FletchingCoverage } from "@/lib/companion/fletching";
import type { NextAction } from "@/lib/companion/nextAction";
import type { RankedMethod } from "@/lib/companion/sessions";
import type { PvmMethod } from "@/lib/companion/methods";
import type { Remote } from "./useLive";
import { Card, CardTitle, LABEL, Loading, Notice, RetryButton } from "./ui";

const TOP_N = 3;

type Props = {
  className?: string;
  action: NextAction;
  ranked: RankedMethod[];
  unrated: PvmMethod[];
  noWilderness: boolean;
  fletching: FletchingCoverage | null;
  /** True when the stock comes from a bank import rather than the 2026-10-02 baseline. */
  stockFromImport: boolean;
  hiscores: Remote<unknown>;
};

export default function NextBestAction({
  className = "",
  action,
  ranked,
  unrated,
  noWilderness,
  fletching,
  stockFromImport,
  hiscores,
}: Props) {
  return (
    <Card className={className} aria-labelledby="nba-title">
      <CardTitle id="nba-title" icon={Compass} aside={STATE_LABEL[action.state]}>
        Next best action
      </CardTitle>

      <div className="mt-4 rounded-2xl border border-yellow-600/40 bg-yellow-600/10 px-4 py-3.5">
        <p className="flex items-center gap-2 text-base font-black text-white tracking-tight">
          <ArrowRight className="w-4 h-4 text-yellow-500 shrink-0" aria-hidden /> {action.title}
        </p>
        <p className="mt-1 pl-6 text-xs text-neutral-300 leading-relaxed">{action.detail}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="min-w-0">
          <p className={`${LABEL} flex items-center gap-2`}>
            <Swords className="w-3.5 h-3.5" aria-hidden /> Best earners now
          </p>
          <ol className="mt-2 space-y-1.5">
            {ranked.slice(0, TOP_N).map((r, i) => (
              <li
                key={r.method.id}
                className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-2"
              >
                <span className="text-[11px] font-black text-neutral-500 w-3 pt-0.5">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-neutral-200">{r.method.name}</span>
                  <span className="block text-[11px] text-neutral-500">
                    {r.source === "logged"
                      ? `Your rate over ${Number(r.stats!.hours.toFixed(1))}h logged`
                      : r.stats
                        ? `Planning low until 10h logged (${Number(r.stats.hours.toFixed(1))}h so far)`
                        : "Planning low: no sessions logged yet"}
                  </span>
                </span>
                <span className="text-sm font-black text-white shrink-0">{formatGp(r.gpPerHour)}/hr</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
            Ranked by conservative net GP/hour: the low end of the learning range until a method has 10 logged hours.
            {unrated.length > 0 && <> Log {unrated.map((m) => m.name).join(", ")} to rate them.</>}
            {noWilderness && " Wilderness methods are hidden."}
          </p>
        </div>

        <div className="min-w-0">
          <p className={`${LABEL} flex items-center gap-2`}>
            <Feather className="w-3.5 h-3.5" aria-hidden /> Fletching in the downtime
          </p>
          <FletchingNudge fletching={fletching} stockFromImport={stockFromImport} hiscores={hiscores} />
        </div>
      </div>
    </Card>
  );
}

const STATE_LABEL: Record<NextAction["state"], string> = {
  QUEST_GATE: "Quest gate",
  LEARNING: "Learning",
  INCOME: "Income",
  REBUILD: "Rebuild",
};

function FletchingNudge({
  fletching,
  stockFromImport,
  hiscores,
}: {
  fletching: FletchingCoverage | null;
  stockFromImport: boolean;
  hiscores: Remote<unknown>;
}) {
  if (fletching === null) {
    if (hiscores.loading) {
      return (
        <div className="mt-2">
          <Loading>Loading your Fletching XP…</Loading>
        </div>
      );
    }
    return (
      <div className="mt-2">
        <Notice tone="warn" action={<RetryButton onClick={hiscores.reload} busy={hiscores.loading} />}>
          Fletching XP unavailable from the HiScores{hiscores.error ? ` (${hiscores.error})` : ""}.
        </Notice>
      </div>
    );
  }
  if (fletching.xpTo99 === 0) {
    return (
      <p className="mt-2 text-sm text-neutral-300">
        Fletching is 99. Leftover Fletching stock no longer needs keeping; untick it in the bank import to count it.
      </p>
    );
  }

  const pct = Math.round(fletching.covered * 100);
  const xp = (n: number) => `${Math.round(n / 1000).toLocaleString("en-US")}k`;

  return (
    <div className="mt-2">
      <p className="text-sm text-neutral-200">
        <span className="font-black text-white">{xp(fletching.xpTo99)} XP</span> to 99. Your stock covers{" "}
        <span className="font-black text-white">{pct}%</span>.
      </p>
      <div
        className="mt-2 h-2 rounded-full bg-yellow-950/60 overflow-hidden"
        role="meter"
        aria-label="Fletching XP to 99 covered by stock"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full rounded-full bg-yellow-600" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-3 space-y-1 text-xs">
        {fletching.lines.map((l) => (
          <li key={l.recipe.name} className="flex justify-between gap-3">
            <span className="text-neutral-400">
              {l.makeable.toLocaleString("en-US")} {l.recipe.name}
            </span>
            <span className="font-bold text-neutral-200 tabular-nums">{xp(l.xp)} XP</span>
          </li>
        ))}
        {fletching.shortfallXp > 0 && (
          <li className="flex justify-between gap-3 border-t border-neutral-800 pt-1">
            <span className="text-neutral-400">Still to find</span>
            <span className="font-bold text-neutral-200 tabular-nums">{xp(fletching.shortfallXp)} XP</span>
          </li>
        )}
      </ul>
      <p className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
        Arrows and bolts fletch while you walk, bank or wait between kills, so they cost no PvM time. The inputs are
        already bought: optimise for attention, not sunk cost.{" "}
        {stockFromImport ? "Stock from your bank import." : "Stock from your 2026-10-02 bank; import a bank to update it."}
      </p>
    </div>
  );
}
