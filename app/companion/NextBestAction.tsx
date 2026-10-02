"use client";

import Link from "next/link";
import { Compass, Feather, ListOrdered, Moon, Swords } from "lucide-react";
import { formatGp } from "@/lib/format";
import type { FletchingCoverage } from "@/lib/companion/fletching";
import type { NextAction } from "@/lib/companion/nextAction";
import type { RankedMethod } from "@/lib/companion/sessions";
import type { PvmMethod } from "@/lib/companion/methods";
import type { MethodStats } from "@/lib/companion/types";
import { MAX_ORDER, type NextMilestone } from "@/lib/maxOrder";
import type { Remote } from "./useLive";
import type { CrystalKeysResponse } from "@/app/api/market/crystal-keys/route";
import { Card, CardTitle, LABEL, Loading, Notice, RetryButton } from "./ui";

const TOP_N = 3;

type Props = {
  className?: string;
  action: NextAction;
  ranked: RankedMethod[];
  unrated: PvmMethod[];
  noWilderness: boolean;
  fletching: FletchingCoverage | null;
  /** First unmet step of the maxing order; null when done or HiScores missing. */
  maxingStep: NextMilestone | null;
  /** Low-attention earners with your log for each, if any. */
  lowAttention: { method: PvmMethod; stats: MethodStats | null }[];
  /** True when the stock comes from a bank import rather than the 2026-10-02 baseline. */
  stockFromImport: boolean;
  hiscores: Remote<unknown>;
  /** Live crystal key margins and volumes. */
  crystalKeys: Remote<CrystalKeysResponse>;
};

export default function NextBestAction({
  className = "",
  action,
  ranked,
  unrated,
  noWilderness,
  fletching,
  maxingStep,
  lowAttention,
  stockFromImport,
  hiscores,
  crystalKeys,
}: Props) {
  const unratedNames = unrated.filter((m) => !m.lowAttention).map((m) => m.name);
  return (
    <Card className={className} aria-labelledby="nba-title">
      <CardTitle id="nba-title" icon={Compass} aside={`Stage: ${STATE_LABEL[action.state]}`}>
        Options
      </CardTitle>
      <p className="mt-2 text-xs text-neutral-400">
        <span className="font-bold text-neutral-300">{action.title}.</span> {action.detail}
      </p>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                      : r.source === "research"
                        ? "Your researched rate (Research page)"
                      : r.stats
                        ? `Planning low until 10h logged (${Number(r.stats.hours.toFixed(1))}h so far)`
                        : "Knowledge-base planning low"}
                  </span>
                </span>
                <span className="text-sm font-black text-white shrink-0">{formatGp(r.gpPerHour)}/hr</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
            Ranked by conservative net GP/hour: the low end of the knowledge base&apos;s learning range.
            {unratedNames.length > 0 && <> No planning rate yet for {unratedNames.join(", ")}.</>}
            {noWilderness && " Wilderness methods are hidden."}
          </p>

          {lowAttention.length > 0 && (
            <>
              <p className={`${LABEL} mt-5 flex items-center gap-2`}>
                <Moon className="w-3.5 h-3.5" aria-hidden /> Low attention
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {lowAttention.map(({ method, stats }) => (
                  <li key={method.id} className="flex justify-between gap-3" title={method.note}>
                    <span className="text-neutral-300 min-w-0">{method.name}</span>
                    <span className="text-right shrink-0">
                      {stats && stats.hours > 0 ? (
                        <span className="font-bold text-neutral-200">
                          {formatGp(stats.gpPerHour)}/hr{" "}
                          <span className="font-normal text-neutral-500">yours, {Number(stats.hours.toFixed(1))}h</span>
                        </span>
                      ) : method.wikiModel ? (
                        <span className="text-neutral-400">
                          ~{formatGp(method.wikiModel.gpPerHour)}/hr <span className="text-neutral-600">wiki</span>
                        </span>
                      ) : (
                        <span className="text-neutral-500">no figure</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
                For low-energy blocks. Wiki figures assume their guide&apos;s setup (frost dragons: max melee gear;
                crystal keys: GE volume you rarely get), so expect less.
              </p>
              <CrystalKeysToday remote={crystalKeys} />
            </>
          )}
        </div>

        <div className="min-w-0">
          <p className={`${LABEL} flex items-center gap-2`}>
            <ListOrdered className="w-3.5 h-3.5" aria-hidden /> Maxing next
          </p>
          {maxingStep ? (
            <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-2.5">
              <p className="text-sm font-bold text-neutral-200">
                {maxingStep.milestone.skill} → {maxingStep.milestone.level}
              </p>
              <p className="text-[11px] text-neutral-500">
                Step {maxingStep.index + 1} of {MAX_ORDER.length} · {Math.round(maxingStep.xpToGo / 1000).toLocaleString("en-US")}k
                XP to go
              </p>
              <p className="mt-1 text-xs text-neutral-400">{maxingStep.milestone.how}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-neutral-500">
              {hiscores.data ? "Your maxing order is complete." : "Waiting for HiScores…"}
            </p>
          )}
          <ol className="mt-3 space-y-0.5 text-[11px]">
            {MAX_ORDER.map((m, i) => {
              const done = maxingStep ? i < maxingStep.index : hiscores.data !== null;
              const current = maxingStep?.index === i;
              return (
                <li
                  key={`${m.skill}-${m.level}`}
                  className={`flex gap-2 ${current ? "text-yellow-500 font-bold" : done ? "text-neutral-600 line-through" : "text-neutral-400"}`}
                >
                  <span className="w-4 text-right tabular-nums">{i + 1}.</span>
                  <span>
                    {m.skill} {m.level}
                    {done && <span className="sr-only"> (done)</span>}
                    {current && <span className="sr-only"> (current)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-[11px] text-neutral-500">
            Same order as &ldquo;Do this next&rdquo; on the{" "}
            <Link href="/" className="text-yellow-600 hover:text-yellow-500 hover:underline underline-offset-2">
              Max Cape Roadmap
            </Link>
            .
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

function CrystalKeysToday({ remote }: { remote: Remote<CrystalKeysResponse> }) {
  const d = remote.data;
  if (!d) {
    return remote.error ? (
      <p className="mt-3 text-[11px] text-neutral-500">Crystal key prices unavailable ({remote.error}).</p>
    ) : null;
  }
  const gp = (n: number | null) => (n === null ? "--" : `${n < 0 ? "−" : "+"}${Math.abs(n).toLocaleString("en-US")} gp`);
  return (
    <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-2.5 text-xs">
      <p className={LABEL}>Crystal keys today</p>
      <ul className="mt-1.5 space-y-1">
        <li className="flex justify-between gap-3">
          <span className="text-neutral-400">Per key, patient offers</span>
          <span className="font-bold text-neutral-200 tabular-nums">{gp(d.patientMarginGp)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-neutral-400">Per key, instant buy and sell</span>
          <span className="font-bold text-neutral-200 tabular-nums">{gp(d.instantMarginGp)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-neutral-400">Realistic keys a day</span>
          <span className="font-bold text-neutral-200 tabular-nums">{d.keysPerDay.toLocaleString("en-US")}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-neutral-400">Profit a day, patient</span>
          <span className="font-bold text-white tabular-nums">
            {d.profitPerDayGp === null ? "no margin today" : formatGp(d.profitPerDayGp)}
          </span>
        </li>
      </ul>
      <p className="mt-1.5 text-[11px] text-neutral-500">
        10% of the thinnest market ({d.bottleneck === "key" ? "keys" : `${d.bottleneck} halves`},{" "}
        {d.prices[d.bottleneck].dailyVolume.toLocaleString("en-US")} traded in 24h)
        {d.buyLimit !== null ? `, buy limit ${d.buyLimit.toLocaleString("en-US")} per 4h` : ""}. All after the 2% tax.
      </p>
    </div>
  );
}
