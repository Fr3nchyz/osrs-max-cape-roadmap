"use client";

import { CheckSquare, ShieldCheck, Skull, Square } from "lucide-react";
import { bossKc } from "@/lib/companion/goal";
import type { Remote } from "./useLive";
import { Card, CardTitle, LABEL, Loading, Notice, RetryButton } from "./ui";

/** HiScores activity names, exactly as Jagex spells them. */
const BOSSES = [
  "Tombs of Amascut",
  "Tombs of Amascut: Expert Mode",
  "Doom of Mokhaiotl",
  "Vorkath",
  "Zulrah",
] as const;

type Props = {
  className?: string;
  dt2Complete: boolean;
  onDt2Change: (next: boolean) => void;
  hiscores: Remote<unknown>;
};

export default function Gates({ className = "", dt2Complete, onDt2Change, hiscores }: Props) {
  const Box = dt2Complete ? CheckSquare : Square;

  return (
    <Card className={className} aria-labelledby="gates-title">
      <CardTitle id="gates-title" icon={ShieldCheck}>
        Gates
      </CardTitle>

      <button
        type="button"
        role="checkbox"
        aria-checked={dt2Complete}
        onClick={() => onDt2Change(!dt2Complete)}
        className={`mt-4 w-full flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
          dt2Complete ? "border-yellow-600/40 bg-yellow-600/10" : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700"
        }`}
      >
        <Box className={`w-4 h-4 shrink-0 ${dt2Complete ? "text-yellow-500" : "text-neutral-500"}`} aria-hidden />
        <span className="flex-1 text-sm font-bold text-neutral-200">Desert Treasure II complete</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
          {dt2Complete ? "Done" : "Not yet"}
        </span>
      </button>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <p className={`${LABEL} flex items-center gap-2`}>
            <Skull className="w-3.5 h-3.5" aria-hidden /> Kill counts
          </p>
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">Live HiScores</span>
        </div>

        {hiscores.data === null && hiscores.loading && (
          <div className="mt-3">
            <Loading>Loading HiScores…</Loading>
          </div>
        )}
        {hiscores.data === null && !hiscores.loading && (
          <div className="mt-3">
            <Notice tone="error" action={<RetryButton onClick={hiscores.reload} />}>
              HiScores unavailable{hiscores.error ? ` (${hiscores.error})` : ""}.
            </Notice>
          </div>
        )}
        {hiscores.data !== null && (
          <dl className="mt-2 divide-y divide-neutral-800/70">
            {BOSSES.map((name) => {
              const kc = bossKc(hiscores.data, name);
              return (
                <div key={name} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-xs text-neutral-400 min-w-0">{name}</dt>
                  <dd className="text-sm font-black tabular-nums shrink-0">
                    {kc > 0 ? (
                      <span className="text-white">{kc.toLocaleString("en-US")}</span>
                    ) : (
                      <span className="text-[11px] font-bold text-neutral-500" title="Below the HiScores minimum kill count, or not ranked">
                        Unranked
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>

      <p className="mt-4 text-[11px] text-neutral-500 leading-relaxed">
        The learning baseline will come from session logs in the next phase.
      </p>
    </Card>
  );
}
