"use client";

import { useState, useMemo } from "react";
import { CalendarDays, CalendarRange, TrendingDown, Flag, ArrowUp, ArrowDown, Award, Gauge } from "lucide-react";
import { ICON_MAP, type Skill } from "./skills";
import {
  milestones,
  projectDate,
  averageWeek,
  preferLastWeek,
  preferLastMonth,
  type PeriodStats,
  type BurnPoint,
  type DayBar,
  type WeekPoint,
} from "./progress";
import type { Progress } from "./useProgress";

const fmtXp = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${Math.round(n)}`;
const fmtH = (h: number) => (h >= 10 ? `${Math.round(h)}h` : `${h.toFixed(1)}h`);
const fmtDate = (t: number, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  new Date(t).toLocaleDateString("en-US", opts);

const card = "bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5";
const label = "text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2";

// "+12% vs last week" — compares the daily rate so far against the previous full period, so a
// period that just started isn't judged against a whole one.
function Delta({ now, elapsedDays, prev, prevDays, unit }: { now: number; elapsedDays: number; prev: PeriodStats | null; prevDays: number; unit: string }) {
  if (!prev || prev.partial || prev.hours <= 0 || elapsedDays < 1) return null;
  const pct = ((now / elapsedDays - prev.hours / prevDays) / (prev.hours / prevDays)) * 100;
  const up = pct >= 0;
  return (
    <span
      title={`Max-time per day so far vs last ${unit}'s average`}
      className={`inline-flex items-center gap-0.5 text-[10px] font-black font-mono ${up ? "text-green-500" : "text-red-400"}`}
    >
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(0)}% <span className="text-neutral-600 font-bold">/day vs last {unit}</span>
    </span>
  );
}

function WeekBars({ days, target, now }: { days: DayBar[]; target: number; now: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = Math.max(target * 1.3, ...days.map((d) => d.hours ?? 0), 0.5);
  const today = new Date(now).setHours(0, 0, 0, 0);
  return (
    <div className="relative">
      <div className="relative h-24 flex items-end gap-1.5 border-b border-neutral-800">
        {/* daily target line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-yellow-700/60 pointer-events-none"
          style={{ bottom: `${(target / top) * 100}%` }}
        >
          <span className="absolute -top-3.5 right-0 text-[8px] font-mono text-yellow-700">{fmtH(target)}/day</span>
        </div>
        {days.map((d, i) => {
          const h = d.hours ?? 0;
          const hit = d.hours !== null && d.hours >= target;
          return (
            <div
              key={d.day}
              className="flex-1 h-full flex items-end cursor-default"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={`w-full rounded-t ${
                  d.hours === null ? "" : hit ? "bg-yellow-500" : "bg-yellow-700/70"
                } ${hover === i ? "brightness-125" : ""}`}
                style={{ height: d.hours === null ? 0 : `max(${(h / top) * 100}%, 2px)` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {days.map((d) => (
          <span
            key={d.day}
            className={`flex-1 text-center text-[9px] font-black uppercase ${
              d.day === today ? "text-yellow-500" : "text-neutral-600"
            }`}
          >
            {d.label.slice(0, 2)}
          </span>
        ))}
      </div>
      {hover !== null && (
        <div
          className="absolute -top-2 bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-[10px] font-mono text-neutral-200 whitespace-nowrap pointer-events-none z-10"
          style={{ left: `${((hover + 0.5) / 7) * 100}%`, transform: "translate(-50%, -100%)" }}
        >
          {fmtDate(days[hover].day, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
          {days[hover].hours === null
            ? days[hover].day > now
              ? "upcoming"
              : "no data"
            : `${fmtH(days[hover].hours!)} max-time`}
        </div>
      )}
    </div>
  );
}

function BurnChart({ burn }: { burn: BurnPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (burn.length < 2) {
    return (
      <p className="text-[11px] text-neutral-500 py-8 text-center">
        History builds up as snapshots come in — check back after a couple of days of syncing.
      </p>
    );
  }
  const W = 800;
  const H = 160;
  const t0 = burn[0].at;
  const t1 = burn[burn.length - 1].at;
  const hi = Math.max(...burn.map((b) => b.hours));
  const lo = Math.min(...burn.map((b) => b.hours));
  const pad = Math.max(1, (hi - lo) * 0.15);
  const yMax = hi + pad;
  const yMin = Math.max(0, lo - pad);
  const x = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * W;
  const y = (h: number) => H - ((h - yMin) / Math.max(0.001, yMax - yMin)) * H;
  const path = burn.map((b, i) => `${i ? "L" : "M"}${x(b.at).toFixed(1)},${y(b.hours).toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  const p = hover !== null ? burn[hover] : null;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = t0 + ((e.clientX - r.left) / r.width) * (t1 - t0);
    let best = 0;
    burn.forEach((b, i) => {
      if (Math.abs(b.at - t) < Math.abs(burn[best].at - t)) best = i;
    });
    setHover(best);
  };

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between text-[9px] font-mono text-neutral-600 py-0.5 w-9 text-right shrink-0">
        <span>{fmtH(yMax)}</span>
        <span>{fmtH((yMax + yMin) / 2)}</span>
        <span>{fmtH(yMin)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="relative h-40" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            {[0, 0.5, 1].map((f) => (
              <line key={f} x1={0} x2={W} y1={f * H} y2={f * H} stroke="#262626" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill="#ca8a04" fillOpacity={0.08} />
            <path d={path} fill="none" stroke="#eab308" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          {p && (
            <>
              <div className="absolute top-0 bottom-0 w-px bg-neutral-500 pointer-events-none" style={{ left: `${(x(p.at) / W) * 100}%` }} />
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-yellow-500 ring-2 ring-neutral-900 pointer-events-none"
                style={{ left: `${(x(p.at) / W) * 100}%`, top: `${(y(p.hours) / H) * 100}%`, transform: "translate(-50%, -50%)" }}
              />
              <div
                className="absolute top-0 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-neutral-300 whitespace-nowrap pointer-events-none z-10 space-y-0.5"
                style={{
                  left: `${(x(p.at) / W) * 100}%`,
                  transform: x(p.at) > W * 0.6 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
                }}
              >
                <p className="text-neutral-500">{fmtDate(p.at, { weekday: "short", month: "short", day: "numeric" })}</p>
                <p className="text-white font-black">{fmtH(p.hours)} to max</p>
                <p>{fmtXp(p.xpLeft)} xp left</p>
                <p>Total {p.totalLevel.toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-neutral-600 mt-1">
          <span>{fmtDate(t0)}</span>
          <span>{fmtDate(t0 + (t1 - t0) / 2)}</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// Two-option pill toggle (Last / This).
function Toggle<T extends string>({ value, options, onChange, label: aria }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex gap-0.5 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5" role="group" aria-label={aria}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
            value === v ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

// "+12% vs …" for a finished period (no per-day scaling needed).
function Versus({ now, prev, unit }: { now: number; prev: number | null; unit: string }) {
  if (prev === null || prev <= 0) return null;
  const pct = ((now - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-black font-mono ${up ? "text-green-500" : "text-red-400"}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(0)}% <span className="text-neutral-600 font-bold">vs {unit}</span>
    </span>
  );
}

const range = (a: number, b: number) => `${fmtDate(a)} – ${fmtDate(b - 1)}`;

function TopSkills({ stats, n = 3 }: { stats: PeriodStats | null; n?: number }) {
  const top = (stats?.top ?? []).slice(0, n);
  if (!top.length) return null;
  return (
    <p className="text-[10px] text-neutral-500 font-mono truncate">
      Top:{" "}
      {top.map((g, i) => (
        <span key={g.name}>
          {i > 0 && " · "}
          {ICON_MAP[g.name]} {g.name} <span className="text-neutral-300">+{fmtXp(g.xp)}</span>
          {g.levels > 0 && <span className="text-green-500"> +{g.levels}lv</span>}
        </span>
      ))}
    </p>
  );
}

function WeekCard({ progress, hoursPerDay }: { progress: Progress; hoursPerDay: number }) {
  const { week, lastWeek, days, lastWeekDays, weeks, now } = progress;
  const lastHasData = !!lastWeek && !lastWeek.partial;
  const [view, setView] = useState<"last" | "this">(() => (preferLastWeek(now) && lastHasData ? "last" : "this"));
  const target = hoursPerDay * 7;
  const prior = weeks.length >= 3 ? weeks[weeks.length - 3] : null; // the week before last
  const avg4 = averageWeek(weeks.slice(-5, -1), "hours"); // 4 full weeks before this one

  if (view === "last") {
    const hours = lastWeek?.hours ?? 0;
    const hit = hours >= target;
    return (
      <div className={`lg:col-span-5 ${card} space-y-4`}>
        <div className="flex items-center justify-between gap-2">
          <p className={label}>
            <CalendarDays className="w-3 h-3 text-yellow-600" /> Last week
            <span className="text-neutral-600 normal-case tracking-normal font-bold">
              {lastWeek ? range(lastWeek.start, lastWeek.start + 7 * 86_400_000) : ""}
            </span>
          </p>
          <Toggle value={view} onChange={setView} label="Week" options={[["last", "Last"], ["this", "This"]]} />
        </div>
        {!lastHasData ? (
          <p className="text-[11px] text-neutral-500">No history covering all of last week yet.</p>
        ) : (
          <>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="font-mono font-black text-white leading-none">
                  <span className="text-3xl text-yellow-500">{fmtH(hours)}</span>
                  <span className="text-sm text-neutral-500"> / {fmtH(target)} target</span>
                </p>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                    hit ? "bg-green-600/15 text-green-500 border-green-700/40" : "bg-neutral-800 text-neutral-400 border-neutral-700"
                  }`}
                >
                  {hit ? "Target hit" : `${fmtH(target - hours)} short`}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400" style={{ width: `${Math.min(100, (hours / Math.max(0.1, target)) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1.5 font-mono">
                +{fmtXp(lastWeek!.xp)} xp · +{lastWeek!.levels} lv
                {lastWeek!.new99s.length > 0 && <span className="text-yellow-500"> · 99 {lastWeek!.new99s.join(", ")}!</span>}
              </p>
              <div className="flex flex-wrap gap-x-3 mt-1">
                <Versus now={hours} prev={prior?.known ? prior.hours : null} unit="the week before" />
                <Versus now={hours} prev={avg4} unit="4-wk avg" />
              </div>
            </div>
            <WeekBars days={lastWeekDays} target={hoursPerDay} now={now} />
            <TopSkills stats={lastWeek} />
          </>
        )}
      </div>
    );
  }

  const weekHours = week?.hours ?? 0;
  const dayOfWeek = ((new Date(now).getDay() + 6) % 7) + 1; // Mon = 1
  const onTrack = weekHours >= hoursPerDay * dayOfWeek;
  const weekElapsed = week ? (now - week.since) / 86_400_000 : 0;
  return (
    <div className={`lg:col-span-5 ${card} space-y-4`}>
      <div className="flex items-center justify-between gap-2">
        <p className={label}>
          <CalendarDays className="w-3 h-3 text-yellow-600" /> This week
          <span className="text-neutral-600 normal-case tracking-normal font-bold">
            {week?.partial ? `since ${fmtDate(week.since)}` : `since Mon ${fmtDate(week?.start ?? now)}`}
          </span>
        </p>
        <Toggle value={view} onChange={setView} label="Week" options={[["last", "Last"], ["this", "This"]]} />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="font-mono font-black text-white leading-none">
            <span className="text-3xl text-yellow-500">{fmtH(weekHours)}</span>
            <span className="text-sm text-neutral-500"> / {fmtH(target)} target</span>
          </p>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
              onTrack ? "bg-green-600/15 text-green-500 border-green-700/40" : "bg-neutral-800 text-neutral-400 border-neutral-700"
            }`}
          >
            {onTrack ? "On track" : `${fmtH(Math.max(0, hoursPerDay * dayOfWeek - weekHours))} behind`}
          </span>
        </div>
        <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400" style={{ width: `${Math.min(100, (weekHours / Math.max(0.1, target)) * 100)}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 mt-1.5">
          <p className="text-[10px] text-neutral-500 font-mono">
            +{fmtXp(week?.xp ?? 0)} xp · +{week?.levels ?? 0} lv
            {week && week.new99s.length > 0 && <span className="text-yellow-500"> · 99 {week.new99s.join(", ")}!</span>}
          </p>
          <Delta now={weekHours} elapsedDays={weekElapsed} prev={lastWeek} prevDays={7} unit="week" />
        </div>
      </div>
      <WeekBars days={days} target={hoursPerDay} now={now} />
      {lastHasData && (
        <button
          type="button"
          onClick={() => setView("last")}
          className="w-full text-left text-[10px] font-mono text-neutral-500 hover:text-neutral-300 border-t border-neutral-800 pt-2"
        >
          Last week: <span className="text-neutral-300">{fmtH(lastWeek!.hours)}</span> · +{fmtXp(lastWeek!.xp)} xp · +{lastWeek!.levels} lv →
        </button>
      )}
      <p className="text-[9px] text-neutral-600">Max-time = how much your time-to-max went down, with your selected methods.</p>
    </div>
  );
}

function MonthCard({ progress }: { progress: Progress }) {
  const { month, lastMonth, now } = progress;
  const lastHasData = !!lastMonth && !lastMonth.partial;
  const [view, setView] = useState<"last" | "this">(() => (preferLastMonth(now) && lastHasData ? "last" : "this"));
  const shown = view === "last" ? lastMonth : month;
  const monthElapsed = month ? (now - month.since) / 86_400_000 : 0;
  const lastMonthDays = lastMonth && month ? (month.start - lastMonth.start) / 86_400_000 : 30;
  const perDay = (st: PeriodStats | null, d: number) => (st && d > 0 ? st.hours / d : 0);

  return (
    <div className={`lg:col-span-4 ${card} space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <p className={label}>
          <CalendarRange className="w-3 h-3 text-yellow-600" />
          {fmtDate(shown?.start ?? now, { month: "long" })}
          {view === "this" && month?.partial && (
            <span className="text-neutral-600 normal-case tracking-normal font-bold">since {fmtDate(month.since)}</span>
          )}
        </p>
        <Toggle value={view} onChange={setView} label="Month" options={[["last", "Last"], ["this", "This"]]} />
      </div>
      {view === "last" && !lastHasData ? (
        <p className="text-[11px] text-neutral-500">No history covering all of last month yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: "Levels", v: `+${shown?.levels ?? 0}` },
              { k: "Max-time", v: fmtH(shown?.hours ?? 0) },
              { k: "XP", v: `+${fmtXp(shown?.xp ?? 0)}` },
            ].map((c) => (
              <div key={c.k} className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2">
                <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">{c.k}</p>
                <p className="text-lg font-black font-mono text-white leading-none mt-1">{c.v}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-neutral-500 font-mono">
            {view === "last" ? (
              <>
                {fmtH(perDay(lastMonth, lastMonthDays))}/day · {fmtH(perDay(lastMonth, lastMonthDays) * 7)}/week avg
              </>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-x-2">
                {fmtH(perDay(month, monthElapsed))}/day so far
                <Delta now={month?.hours ?? 0} elapsedDays={monthElapsed} prev={lastMonth} prevDays={lastMonthDays} unit="month" />
              </span>
            )}
          </p>
          {shown && shown.new99s.length > 0 && (
            <p className="text-[11px] font-black text-yellow-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> 99 reached: {shown.new99s.map((n) => `${ICON_MAP[n] ?? ""} ${n}`).join(" · ")}
            </p>
          )}
          <div className="space-y-1.5">
            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Most trained</p>
            {(shown?.top ?? []).slice(0, 4).map((g) => (
              <div key={g.name} className="flex items-center gap-2">
                <span className="w-24 text-[10px] font-bold text-neutral-400 uppercase truncate">
                  {ICON_MAP[g.name]} {g.name}
                </span>
                <div className="flex-1 h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-600" style={{ width: `${(g.xp / (shown!.top[0].xp || 1)) * 100}%` }} />
                </div>
                <span className="w-20 text-right text-[10px] font-mono text-neutral-400">
                  +{fmtXp(g.xp)}
                  {g.levels > 0 && <span className="text-green-500"> +{g.levels}</span>}
                </span>
              </div>
            ))}
            {!shown?.top.length && <p className="text-[10px] text-neutral-600">No XP gained {view === "last" ? "last" : "yet this"} month.</p>}
          </div>
          {view === "this" && lastHasData && (
            <button
              type="button"
              onClick={() => setView("last")}
              className="w-full text-left text-[10px] text-neutral-500 hover:text-neutral-300 font-mono border-t border-neutral-800 pt-2"
            >
              {fmtDate(lastMonth!.start, { month: "long" })}: +{lastMonth!.levels} lv · {fmtH(lastMonth!.hours)} · +{fmtXp(lastMonth!.xp)} xp →
            </button>
          )}
        </>
      )}
    </div>
  );
}

type Metric = "hours" | "xp" | "levels";
const METRIC_FMT: Record<Metric, (n: number) => string> = {
  hours: fmtH,
  xp: (n) => fmtXp(n),
  levels: (n) => `${Math.round(n * 10) / 10} lv`,
};

// Week-by-week velocity: one bar per calendar week, with a rolling 4-week average line.
function VelocityCard({ weeks, target }: { weeks: WeekPoint[]; target: number }) {
  const [metric, setMetric] = useState<Metric>("hours");
  const [hover, setHover] = useState<number | null>(null);
  const known = weeks.filter((w) => w.known);
  if (known.length < 2) return null;

  const val = (w: WeekPoint) => w[metric];
  // Rolling 4-week average over full weeks, drawn for each finished week.
  const rolling = weeks.map((_, i) => {
    if (weeks[i].current) return null;
    const win = weeks.slice(Math.max(0, i - 3), i + 1).filter((w) => w.known);
    return win.length >= 2 ? win.reduce((a, w) => a + val(w), 0) / win.length : null;
  });
  const top = Math.max(...weeks.map(val), ...(metric === "hours" ? [target] : []), 0.0001) * 1.15;
  const recent = averageWeek(weeks.slice(-5, -1), metric);
  const before = averageWeek(weeks.slice(-9, -5), metric);
  const best = known.filter((w) => !w.current).reduce<WeekPoint | null>((b, w) => (!b || val(w) > val(b) ? w : b), null);
  const n = weeks.length;
  const xOf = (i: number) => ((i + 0.5) / n) * 100;
  const yOf = (v: number) => 100 - (v / top) * 100;
  const linePts = rolling
    .map((v, i) => (v === null ? null : `${xOf(i)},${yOf(v)}`))
    .filter(Boolean) as string[];

  return (
    <div className={`${card} space-y-3`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className={label}>
          <Gauge className="w-3 h-3 text-yellow-600" /> Weekly velocity · last {n} weeks
        </p>
        <Toggle value={metric} onChange={setMetric} label="Metric" options={[["hours", "Max-time"], ["xp", "XP"], ["levels", "Levels"]]} />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-mono">
        {recent !== null && (
          <span className="text-neutral-400">
            Last 4 wks avg <span className="text-white font-black">{METRIC_FMT[metric](recent)}/wk</span>
          </span>
        )}
        {recent !== null && before !== null && <Versus now={recent} prev={before} unit="the 4 weeks before" />}
        {best && (
          <span className="text-neutral-400">
            Best <span className="text-yellow-500 font-black">{METRIC_FMT[metric](val(best))}</span>{" "}
            <span className="text-neutral-600">wk of {fmtDate(best.start)}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <div className="relative h-32 flex items-end gap-1 border-b border-neutral-800">
          {metric === "hours" && (
            <div
              className="absolute left-0 right-0 border-t border-dashed border-yellow-700/60 pointer-events-none"
              style={{ bottom: `${(target / top) * 100}%` }}
            >
              <span className="absolute -top-3.5 left-0 text-[8px] font-mono text-yellow-700">{fmtH(target)}/wk target</span>
            </div>
          )}
          {weeks.map((w, i) => (
            <div
              key={w.start}
              className="flex-1 h-full flex items-end cursor-default"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
            >
              <div
                className={`w-full rounded-t ${
                  !w.known ? "" : w.current ? "bg-yellow-700/40 border border-dashed border-yellow-600/70 border-b-0" : "bg-yellow-600"
                } ${hover === i ? "brightness-125" : ""}`}
                style={{ height: w.known ? `max(${(val(w) / top) * 100}%, 2px)` : 0 }}
              />
            </div>
          ))}
          {linePts.length >= 2 && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <polyline points={linePts.join(" ")} fill="none" stroke="#fafafa" strokeOpacity={0.7} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="flex gap-1 mt-1">
          {weeks.map((w, i) => (
            <span key={w.start} className={`flex-1 text-center text-[8px] font-mono ${w.current ? "text-yellow-500" : "text-neutral-600"}`}>
              {i % 2 === n % 2 || w.current ? fmtDate(w.start, { month: "numeric", day: "numeric" }) : ""}
            </span>
          ))}
        </div>
        {hover !== null && weeks[hover] && (
          <div
            className="absolute top-0 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-neutral-300 whitespace-nowrap pointer-events-none z-10 space-y-0.5"
            style={{
              left: `${xOf(hover)}%`,
              transform: xOf(hover) > 60 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
            }}
          >
            <p className="text-neutral-500">
              {range(weeks[hover].start, weeks[hover].current ? weeks[hover].end + 1 : weeks[hover].end)}
              {weeks[hover].current && " (so far)"}
            </p>
            {weeks[hover].known ? (
              <>
                <p className="text-white font-black">{fmtH(weeks[hover].hours)} max-time</p>
                <p>
                  +{fmtXp(weeks[hover].xp)} xp · +{weeks[hover].levels} lv
                </p>
                {weeks[hover].top && <p>Top: {ICON_MAP[weeks[hover].top!]} {weeks[hover].top}</p>}
                {rolling[hover] !== null && <p className="text-neutral-500">4-wk avg {METRIC_FMT[metric](rolling[hover]!)}</p>}
              </>
            ) : (
              <p>No history for this week</p>
            )}
          </div>
        )}
      </div>
      <p className="text-[9px] text-neutral-600 flex flex-wrap gap-x-3">
        <span>
          <span className="inline-block w-2 h-2 rounded-sm bg-yellow-600 align-middle mr-1" />
          full week
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-sm border border-dashed border-yellow-600 align-middle mr-1" />
          this week so far
        </span>
        <span>
          <span className="inline-block w-3 h-0.5 bg-neutral-300 align-middle mr-1" />
          4-week average
        </span>
      </p>
    </div>
  );
}

type Props = {
  progress: Progress;
  skills: Skill[];
  selections: Record<string, number>;
  hoursPerDay: number;
  totalHours: number;
  currentTotal: number;
  maxTotal: number;
};

export default function ProgressPanel({ progress, skills, selections, hoursPerDay, totalHours, currentTotal, maxTotal }: Props) {
  const { burn, pace, paceWeekAgo, hoursWeekAgo } = progress;
  const now = progress.now;

  const rate = pace && pace.hoursPerDay > 0.01 ? pace.hoursPerDay : hoursPerDay;
  const usingPace = rate !== hoursPerDay;
  const ms = useMemo(
    () => milestones(skills, selections, currentTotal, maxTotal).slice(0, 6),
    [skills, selections, currentTotal, maxTotal]
  );

  const paceDate = pace ? projectDate(now, totalHours, pace.hoursPerDay) : null;
  const paceDateWeekAgo =
    paceWeekAgo && hoursWeekAgo !== null ? projectDate(now - 7 * 86_400_000, hoursWeekAgo, paceWeekAgo.hoursPerDay) : null;
  const trendDays = paceDate && paceDateWeekAgo ? Math.round((paceDate - paceDateWeekAgo) / 86_400_000) : null;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <WeekCard progress={progress} hoursPerDay={hoursPerDay} />
        <MonthCard progress={progress} />

        {/* Milestones */}
        <div className={`lg:col-span-3 ${card} space-y-3`}>
          <p className={label}>
            <Flag className="w-3 h-3 text-yellow-600" /> Next milestones
          </p>
          <ol className="space-y-2">
            {ms.map((m) => {
              const t = projectDate(now, m.hours, rate);
              return (
                <li key={m.label} className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold truncate ${
                      m.kind === "max" ? "text-yellow-500" : m.kind === "total" ? "text-neutral-300" : "text-white"
                    }`}
                  >
                    {m.kind === "total" ? "🏁" : m.kind === "max" ? "🏆" : ICON_MAP[m.label.replace(" 99", "")] ?? "⭐"} {m.label}
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-[10px] font-mono text-neutral-300">{t ? fmtDate(t, { month: "short", day: "numeric", year: "2-digit" }) : "—"}</span>
                    <span className="block text-[9px] font-mono text-neutral-600">in {fmtH(m.hours)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-[9px] text-neutral-600">
            Shortest grinds first · dates at {usingPace ? `your ${fmtH(rate)}/day pace` : `${fmtH(rate)}/day (slider)`}
          </p>
        </div>
      </div>

      <VelocityCard weeks={progress.weeks} target={hoursPerDay * 7} />

      {/* Burn-down */}
      <div className={`${card} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className={label}>
            <TrendingDown className="w-3 h-3 text-yellow-600" /> Time to max · last 90 days
            <span className="text-neutral-600 normal-case tracking-normal font-bold">
              {progress.source === "wom" ? "Wise Old Man + local" : "local snapshots"}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono">
            {pace ? (
              <span className="text-neutral-400">
                Real pace <span className="text-white font-black">{fmtH(pace.hoursPerDay)}/day</span>
                <span className="text-neutral-600"> ({Math.round(pace.days)}d)</span>
              </span>
            ) : (
              <span className="text-neutral-600">Pace needs ≥3 days of history</span>
            )}
            {paceDate && (
              <span className="text-neutral-400">
                Max at this pace <span className="text-yellow-500 font-black">{fmtDate(paceDate, { month: "short", day: "numeric", year: "numeric" })}</span>
              </span>
            )}
            {trendDays !== null && trendDays !== 0 && (
              <span className={trendDays < 0 ? "text-green-500" : "text-red-400"}>
                {trendDays < 0 ? "▲" : "▼"} {Math.abs(trendDays)}d {trendDays < 0 ? "earlier" : "later"} than last week
              </span>
            )}
          </div>
        </div>
        <BurnChart burn={burn} />
      </div>
    </section>
  );
}
