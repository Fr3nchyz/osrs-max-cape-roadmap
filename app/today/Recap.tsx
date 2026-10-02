"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import { startOfWeek } from "../progress";
import { useCompanionState } from "../companion/useCompanionState";
import { Card, CardTitle, LABEL, Loading } from "../companion/ui";
import { weeklySplit } from "@/lib/companion/goal";
import { BASELINE_FLETCHING_STOCK, downtimeFletchingXp } from "@/lib/companion/fletching";
import { maxCountdown, weekRecap, type WeekRecap } from "@/lib/recap";
import { useHistory } from "./useWeek";

type Props = {
  className?: string;
  xpBySkill: Record<string, number> | null;
  selections: Record<string, number>;
};

const DAY = 86_400_000;
const h = (n: number) => `${Number(n.toFixed(1))}h`;
const day = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const range = (a: number, b: number) =>
  `${new Date(a).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(b - 1).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  )}`;

/** Max-cape countdown and a weekly recap, automatic from Wise Old Man. Shared by both pages. */
export default function Recap({ className = "", xpBySkill, selections }: Props) {
  const { state } = useCompanionState();
  const history = useHistory();
  const [now] = useState(() => Date.now());
  const [which, setWhich] = useState<"last" | "this">("this");
  const split = weeklySplit(state);

  const thisWeek = startOfWeek(now);
  const lastWeek = thisWeek - 7 * DAY;

  const fletchXp = xpBySkill?.Fletching;
  const stock = state.bank?.items ?? BASELINE_FLETCHING_STOCK;
  const countdown = useMemo(() => {
    if (!xpBySkill || !history) return null;
    const downtime: Record<string, number> = {};
    if (fletchXp !== undefined) downtime.Fletching = downtimeFletchingXp(fletchXp, stock);
    return maxCountdown(xpBySkill, history, now, selections, split.maxingHours / 7, downtime);
  }, [xpBySkill, history, now, selections, split.maxingHours, fletchXp, stock]);

  const recap = useMemo(() => {
    if (!history) return null;
    return which === "last"
      ? weekRecap(history, lastWeek, thisWeek, selections)
      : weekRecap(history, thisWeek, now, selections);
  }, [history, which, lastWeek, thisWeek, now, selections]);

  return (
    <Card className={className} aria-labelledby="recap-title">
      <CardTitle id="recap-title" icon={CalendarCheck2} aside="Automatic from Wise Old Man">
        Countdown &amp; weekly recap
      </CardTitle>

      {countdown === null ? (
        <div className="mt-4">
          <Loading>Loading your history…</Loading>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className={LABEL}>Max cape in</p>
            <p className="text-5xl font-black text-white tracking-tighter leading-none mt-1">
              {countdown.plannedDays === null ? "--" : `${Math.ceil(countdown.plannedDays)} days`}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {countdown.plannedDays !== null && <>{day(now + countdown.plannedDays * DAY)} · </>}
              {h(countdown.hoursLeft)} left at your planned {h(split.maxingHours)} a week
            </p>
          </div>
          {countdown.realDays !== null && countdown.realHoursPerDay !== null && (
            <div>
              <p className={LABEL}>At your real pace</p>
              <p className="text-2xl font-black text-neutral-200 tracking-tight mt-1">
                {Math.ceil(countdown.realDays)} days
              </p>
              <p className="text-xs text-neutral-500">
                {day(now + countdown.realDays * DAY)} · {h(countdown.realHoursPerDay)}/day over the last 4 weeks
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2" role="group" aria-label="Week">
        {(["this", "last"] as const).map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={which === w}
            onClick={() => setWhich(w)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
              which === w
                ? "bg-neutral-800 text-yellow-500 border-neutral-700"
                : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300"
            }`}
          >
            {w === "last" ? "Last week" : "This week"}
          </button>
        ))}
        <span className="text-[11px] text-neutral-500">
          {which === "last" ? range(lastWeek, thisWeek) : `${range(thisWeek, now + 1)} so far`}
        </span>
      </div>

      {history === null ? null : recap === null ? (
        <p className="mt-3 text-xs text-neutral-500">No Wise Old Man history for this week yet.</p>
      ) : (
        <RecapBody recap={recap} maxingTarget={split.maxingHours} pvmTarget={split.pvmHours} />
      )}
    </Card>
  );
}

function RecapBody({ recap, maxingTarget, pvmTarget }: { recap: WeekRecap; maxingTarget: number; pvmTarget: number }) {
  return (
    <div className="mt-3">
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Maxing" value={h(recap.maxingHours)} sub={`target ${h(maxingTarget)}`} />
        <Stat
          label="Bossing"
          value={recap.bossingHours === null ? "--" : h(recap.bossingHours)}
          sub={`target ${h(pvmTarget)} · efficient hours`}
        />
        <Stat label="Levels" value={`+${recap.levels}`} sub={recap.new99s.length ? `99: ${recap.new99s.join(", ")}` : undefined} />
        <Stat label="XP" value={`+${(recap.xp / 1_000_000).toFixed(2)}M`} />
      </dl>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <List
          title="Top skills"
          rows={recap.topSkills.map((s) => [s.name, `+${Math.round(s.xp / 1000).toLocaleString("en-US")}k`])}
          empty="No skill XP gained"
        />
        <List
          title="Boss kills"
          rows={recap.topBosses.map((b) => [b.boss, `+${b.kills}`])}
          empty="No boss kills"
        />
      </div>
      {recap.snapshots === 0 && (
        <p className="mt-3 text-[11px] text-neutral-500">
          No Wise Old Man snapshots this week: either no play, or the profile wasn&apos;t updated.
        </p>
      )}
      {recap.partial && (
        <p className="mt-3 text-[11px] text-neutral-500">History starts partway through this week, so totals are partial.</p>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl px-3 py-2.5 min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 text-lg font-black text-white tracking-tight leading-none">{value}</dd>
      {sub && <dd className="mt-1 text-[11px] text-neutral-500 truncate">{sub}</dd>}
    </div>
  );
}

function List({ title, rows, empty }: { title: string; rows: [string, string][]; empty: string }) {
  return (
    <div className="min-w-0">
      <p className={LABEL}>{title}</p>
      {rows.length === 0 ? (
        <p className="mt-1.5 text-neutral-500">{empty}</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3">
              <span className="text-neutral-300 truncate">{k}</span>
              <span className="font-bold text-neutral-200 tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
