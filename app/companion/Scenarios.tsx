"use client";

import Link from "next/link";
import { CircleDot, Info, Timer } from "lucide-react";
import { formatGp } from "@/lib/format";
import type { ScenarioId, ScenarioResult } from "@/lib/companion/types";
import { Card, CardTitle, LABEL, Notice, formatDay, formatHours } from "./ui";

type Props = {
  results: ScenarioResult[] | null;
  /** The knowledge base's scenario selection rule. */
  active: { id: ScenarioId; reason: string };
  /** Share of playtime for T-bow PvM (0-1); the rest is maxing. */
  pvmShare: number;
  weeklyHours: number;
  weekdayHours: number;
  weekendHours: number;
  ownsTbow: boolean;
  now: number;
};

const hrs = (n: number) => `${Number(n.toFixed(2))}h`;

export default function Scenarios({
  results,
  active,
  pvmShare,
  weeklyHours,
  weekdayHours,
  weekendHours,
  ownsTbow,
  now,
}: Props) {
  return (
    <Card aria-labelledby="scenarios-title">
      <CardTitle
        id="scenarios-title"
        icon={Timer}
        aside={
          <>
            {hrs(weeklyHours)} a week · {hrs(weekdayHours)} weekdays, {hrs(weekendHours)} weekend days
          </>
        }
      >
        Time to goal
      </CardTitle>

      {ownsTbow ? (
        <div className="mt-4">
          <Notice>The bow is owned, so there is nothing left to fund.</Notice>
        </div>
      ) : results === null ? (
        <div className="mt-4">
          <Notice>Scenarios start from the funding gap, which needs live prices. See the funding card.</Notice>
        </div>
      ) : (
        <>
          <div
            className={`mt-4 grid grid-cols-1 gap-3 ${results.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}
          >
            {results.map((r) => (
              <ScenarioCard key={r.id} result={r} active={r.id === active.id} now={now} />
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-neutral-400">
            <Info className="w-3.5 h-3.5 mt-px shrink-0 text-yellow-600" aria-hidden />
            <span>{active.reason}.</span>
          </p>
          <p className="mt-1.5 pl-5.5 text-[11px] text-neutral-500">
            Focused hours are income-producing PvM at the scenario&apos;s rate. Total gameplay assumes{" "}
            {Math.round(pvmShare * 100)}% of your play is that PvM; the other {Math.round((1 - pvmShare) * 100)}% (
            {Number((weeklyHours * (1 - pvmShare)).toFixed(1))}h a week) is maxing time on the{" "}
            <Link href="/" className="text-yellow-600 hover:text-yellow-500 hover:underline underline-offset-2">
              Max Cape Roadmap
            </Link>
            .
          </p>
        </>
      )}
    </Card>
  );
}

function ScenarioCard({ result, active, now }: { result: ScenarioResult; active: boolean; now: number }) {
  const funded = result.focusedHours <= 0;
  const date = result.weeks === null ? null : now + result.weeks * 7 * 86_400_000;

  return (
    <div
      className={`rounded-2xl border p-4 ${active ? "border-yellow-600/50 bg-yellow-600/10" : "border-neutral-800 bg-neutral-950/40"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-white uppercase tracking-tighter">{result.label}</p>
        {active && (
          <span className="inline-flex items-center gap-1 rounded-md border border-yellow-600/40 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-yellow-500">
            <CircleDot className="w-3 h-3" aria-hidden /> Active
          </span>
        )}
      </div>
      <p className="text-[11px] text-neutral-500 mt-0.5">{formatGp(result.gpPerHour)} gp per focused hour</p>

      {funded ? (
        <p className="mt-4 text-sm font-bold text-neutral-300">Funded: no hours needed.</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3">
          <Stat label="Focused PvM" value={formatHours(result.focusedHours)} />
          <Stat label="Total gameplay" value={formatHours(result.totalHours)} />
          <Stat
            wide
            label="Estimated"
            value={date === null ? "--" : formatDay(date)}
            sub={result.weeks === null ? "Set your weekly hours" : `in ${result.weeks.toFixed(1)} weeks`}
          />
        </dl>
      )}
    </div>
  );
}

function Stat({ label, value, sub, wide = false }: { label: string; value: string; sub?: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-0.5 text-xl font-black text-white tracking-tight">{value}</dd>
      {sub && <dd className="text-[11px] text-neutral-500">{sub}</dd>}
    </div>
  );
}
