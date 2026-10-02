"use client";

import { useId, useState } from "react";
import { CalendarClock, Feather, Swords, Trophy } from "lucide-react";
import { methodsFor } from "../skills";
import { useCompanionState } from "../companion/useCompanionState";
import { Card, CardTitle, LABEL } from "../companion/ui";
import { weeklySplit } from "@/lib/companion/goal";
import { BASELINE_FLETCHING_STOCK, downtimeFletchingXp } from "@/lib/companion/fletching";
import { PVM_METHODS, availableMethods } from "@/lib/companion/methods";
import { methodStats, rankMethods } from "@/lib/companion/sessions";
import { nextMilestone } from "@/lib/maxOrder";
import { CA_TIERS, TODAY_MINUTES, TODAY_MODES, defaultMode, suggestToday, type CaTier, type TodayMode } from "@/lib/today";
import { useWeek } from "./useWeek";
import { RESEARCH_RATES } from "@/lib/research";

type Props = {
  className?: string;
  /** Live XP per skill (HiScores); null while loading. */
  xpBySkill: Record<string, number> | null;
  /** The roadmap's selected training method per skill. */
  selections: Record<string, number>;
};

const MODE_ICON: Record<TodayMode, typeof Swords> = { maxing: Trophy, gp: CalendarClock, bossing: Swords };

/** One suggestion for right now, shared by the Max Cape Roadmap and the T-bow Companion. */
export default function Today({ className = "", xpBySkill, selections }: Props) {
  const { state, update } = useCompanionState();
  const week = useWeek(selections);
  const split = weeklySplit(state);
  const [picked, setPicked] = useState<TodayMode | null>(null);
  const [minutes, setMinutes] = useState<number>(60);

  const mode =
    picked ??
    defaultMode({
      maxingHours: week.maxingHours,
      bossingHours: week.bossingHours,
      maxingTarget: split.maxingHours,
      pvmTarget: split.pvmHours,
      elapsed: week.elapsed,
    });

  const milestone = xpBySkill ? nextMilestone(xpBySkill) : null;
  const ms = milestone ? methodsFor(milestone.milestone.skill) : null;
  const method = ms ? ms[selections[milestone!.milestone.skill] || 0] || ms[0] : null;
  const fletchXp = xpBySkill?.Fletching;
  const stockLeft =
    fletchXp !== undefined && downtimeFletchingXp(fletchXp, state.bank?.items ?? BASELINE_FLETCHING_STOCK) > 0;
  const stats = methodStats(state.sessions);
  const { ranked } = rankMethods(
    availableMethods({ dt2Complete: state.dt2Complete, noWilderness: state.noWilderness }),
    stats,
    RESEARCH_RATES
  );
  const lowAttention = PVM_METHODS.filter((m) => m.lowAttention && !(state.noWilderness && m.wilderness));
  const day = new Date().getDay();

  const s = suggestToday({
    mode,
    minutes,
    milestone,
    milestoneMethod: method ? { name: method.name, rate: method.rate } : null,
    fletchingStockLeft: stockLeft,
    dt2Complete: state.dt2Complete,
    ranked,
    lowAttention,
    weekend: day === 0 || day === 6,
    caTier: state.caTier,
    caTarget: state.caTarget,
  });

  return (
    <Card hero className={className} aria-labelledby="today-title">
      <CardTitle id="today-title" icon={CalendarClock} aside="Shared by both pages">
        Today
      </CardTitle>

      <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2" role="group" aria-label="Mode">
          {TODAY_MODES.map((m) => {
            const Icon = MODE_ICON[m.id];
            return (
              <Pill key={m.id} active={mode === m.id} onClick={() => setPicked(m.id)}>
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span className="sm:hidden" aria-hidden>
                  {m.short}
                </span>
                <span className="max-sm:sr-only">{m.label}</span>
              </Pill>
            );
          })}
        </div>
        <span className="mx-1 h-5 w-px bg-neutral-800 hidden sm:block" aria-hidden />
        <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2" role="group" aria-label="Time available">
          {TODAY_MINUTES.map((m) => (
            <Pill key={m} active={minutes === m} onClick={() => setMinutes(m)}>
              {m >= 60 ? `${m / 60}h` : `${m}m`}
            </Pill>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-yellow-600/40 bg-neutral-950/40 px-4 py-3.5" aria-live="polite">
        <p className="text-lg font-black text-white tracking-tight">{s.title}</p>
        <p className="mt-1 text-xs text-neutral-300 leading-relaxed">{s.detail}</p>
        {s.alongside && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Feather className="w-3.5 h-3.5 text-yellow-600 shrink-0" aria-hidden /> {s.alongside}
          </p>
        )}
      </div>

      {mode === "bossing" && (
        <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-3 text-xs">
          <TierSelect label="CA tier now" value={state.caTier} onChange={(caTier) => update({ caTier })} />
          <TierSelect label="CA goal" value={state.caTarget} onChange={(caTarget) => update({ caTarget })} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WeekMeter
          label="Maxing this week"
          done={week.maxingHours}
          target={split.maxingHours}
          note="From your XP gains (Wise Old Man)"
        />
        <WeekMeter
          label="Bossing this week"
          done={week.bossingHours}
          target={split.pvmHours}
          note="Wise Old Man efficient hours bossed; real time runs longer"
        />
      </div>
    </Card>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 border ${
        active
          ? "bg-yellow-600 text-white border-yellow-500"
          : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function WeekMeter({
  label,
  done,
  target,
  note,
}: {
  label: string;
  done: number | null;
  target: number;
  note: string;
}) {
  const pct = done === null || target <= 0 ? 0 : Math.min(100, (done / target) * 100);
  const h = (n: number) => `${Number(n.toFixed(1))}h`;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className={LABEL}>{label}</p>
        <p className="text-xs font-bold text-neutral-300">
          {done === null ? "--" : h(done)} <span className="text-neutral-500 font-normal">of {h(target)}</span>
        </p>
      </div>
      <div
        className="mt-1.5 h-2 rounded-full bg-yellow-950/60 overflow-hidden"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className="h-full rounded-full bg-yellow-600" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-neutral-500">{note}</p>
    </div>
  );
}

function TierSelect({ label, value, onChange }: { label: string; value: CaTier; onChange: (v: CaTier) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-2 min-w-0">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as CaTier)}
        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-bold text-neutral-200 focus:outline-none focus:ring-1 focus:ring-yellow-600 [color-scheme:dark]"
      >
        {CA_TIERS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
