"use client";

import { useId, useState } from "react";
import { CheckCircle2, CircleDashed, NotebookPen, Plus, Trash2 } from "lucide-react";
import { formatGp } from "@/lib/format";
import { availableMethods, methodById, PVM_METHODS } from "@/lib/companion/methods";
import { LOGGED_HOURS_THRESHOLD, sessionNet } from "@/lib/companion/sessions";
import type { CompanionState, MethodStats, Session } from "@/lib/companion/types";
import type { CompanionUpdate } from "./useCompanionState";
import { Card, CardTitle, LABEL, Notice } from "./ui";

const MILLION = 1_000_000;
const RECENT = 8;

type Props = {
  className?: string;
  state: CompanionState;
  update: (change: CompanionUpdate) => void;
  stats: MethodStats[];
  rolling: number | null;
};

type Draft = {
  date: string;
  methodId: string;
  hours: string;
  kills: string;
  loot: string;
  supplies: string;
  upkeep: string;
  deaths: string;
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const emptyDraft = (methodId: string): Draft => ({
  date: today(),
  methodId,
  hours: "",
  kills: "",
  loot: "",
  supplies: "",
  upkeep: "",
  deaths: "",
});

/** A non-negative number from a text field; "" counts as 0 unless `required`. */
function parseAmount(raw: string, required = false): number | null {
  const t = raw.trim();
  if (t === "") return required ? null : 0;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const methodName = (id: string) => methodById(id)?.name ?? id;

export default function SessionLog({ className = "", state, update, stats, rolling }: Props) {
  const methods = availableMethods({ dt2Complete: state.dt2Complete, noWilderness: state.noWilderness });
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(methods[0]?.id ?? "other"));
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  // A method hidden by a preference stays selectable for sessions already logged with it.
  const options = PVM_METHODS.filter((m) => methods.includes(m) || m.id === draft.methodId);

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseAmount(draft.hours, true);
    const kills = draft.kills.trim() === "" ? null : parseAmount(draft.kills);
    const loot = parseAmount(draft.loot);
    const supplies = parseAmount(draft.supplies);
    const upkeep = parseAmount(draft.upkeep);
    const deaths = parseAmount(draft.deaths);
    if (hours === null || hours <= 0 || hours > 24) return setError("Hours must be more than 0 and at most 24.");
    if (draft.kills.trim() !== "" && kills === null) return setError("Kills must be a whole number, or blank.");
    if (loot === null || supplies === null || upkeep === null || deaths === null) {
      return setError("GP amounts must be 0 or more (in millions).");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return setError("Pick a date.");

    const session: Session = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
      date: draft.date,
      methodId: draft.methodId,
      hours,
      kills: kills === null ? null : Math.round(kills),
      lootGp: Math.round(loot * MILLION),
      suppliesGp: Math.round(supplies * MILLION),
      upkeepGp: Math.round(upkeep * MILLION),
      deathCostGp: Math.round(deaths * MILLION),
    };
    update((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
    setDraft(emptyDraft(draft.methodId));
    setError(null);
  };

  const onDelete = (id: string) => {
    if (!window.confirm("Delete this session?")) return;
    update((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== id) }));
  };

  const totalHours = state.sessions.reduce((n, s) => n + s.hours, 0);
  const recent = state.sessions
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.date.localeCompare(a.s.date) || b.i - a.i)
    .slice(0, RECENT)
    .map(({ s }) => s);

  return (
    <Card className={className} aria-labelledby="sessions-title">
      <CardTitle
        id="sessions-title"
        icon={NotebookPen}
        aside={
          rolling === null
            ? `${Number(totalHours.toFixed(2))}h of ${LOGGED_HOURS_THRESHOLD}h logged for a rolling rate`
            : `Rolling ${formatGp(rolling)} / hr over your last ${LOGGED_HOURS_THRESHOLD}h`
        }
      >
        Session log
      </CardTitle>

      <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
        Log each PvM session in two minutes at the end. Net = loot − supplies − upkeep − deaths. RuneLite&apos;s Loot
        Tracker gives the loot total. After {LOGGED_HOURS_THRESHOLD} hours on a method, your own rate replaces the
        planning guess.
      </p>

      <form onSubmit={onAdd} className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Log a session">
        <Field label="Date">
          {(id) => <input id={id} type="date" value={draft.date} onChange={set("date")} className={INPUT} />}
        </Field>
        <Field label="Method" wide>
          {(id) => (
            <select id={id} value={draft.methodId} onChange={set("methodId")} className={INPUT}>
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.wilderness ? " (Wilderness)" : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
        {TEXT_FIELDS.map(({ key, label, placeholder, numeric }) => (
          <Field key={key} label={label}>
            {(id) => (
              <input
                id={id}
                inputMode={numeric ? "numeric" : "decimal"}
                placeholder={placeholder}
                value={draft[key]}
                onChange={set(key)}
                className={INPUT}
              />
            )}
          </Field>
        ))}
        <div className="col-span-2 sm:col-span-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden /> Log session
          </button>
          <span className="text-[11px] text-neutral-500">Upkeep = charges, scales, degradation.</span>
        </div>
      </form>

      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {stats.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="w-full text-xs">
            <caption className="sr-only">Logged rate per method</caption>
            <thead>
              <tr className="border-b border-neutral-800">
                <th className={TH}>Method</th>
                <th className={`${TH} text-right`}>Hours</th>
                <th className={`${TH} text-right`}>Net / hr</th>
                <th className={`${TH} text-right`}>Kills / hr</th>
                <th className={`${TH} text-right`}>Sample</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((m) => (
                <tr key={m.methodId} className="border-b border-neutral-900 last:border-0">
                  <td className="px-3 py-2 font-bold text-neutral-200">{methodName(m.methodId)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{Number(m.hours.toFixed(2))}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-white">{formatGp(m.gpPerHour)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-300">
                    {m.killsPerHour === null ? "--" : m.killsPerHour.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.qualified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-green-500">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Rated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500">
                        <CircleDashed className="w-3.5 h-3.5" aria-hidden /> {Number(m.hours.toFixed(1))}/
                        {LOGGED_HOURS_THRESHOLD}h
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-5">
          <p className={LABEL}>Recent sessions</p>
          <ul className="mt-2 space-y-1.5">
            {recent.map((s) => {
              const net = sessionNet(s);
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs"
                >
                  <span className="text-neutral-500 tabular-nums shrink-0">{s.date}</span>
                  <span className="font-bold text-neutral-200 truncate flex-1 min-w-0">
                    {methodName(s.methodId)} · {Number(s.hours.toFixed(2))}h
                    {s.kills !== null ? ` · ${s.kills} kills` : ""}
                  </span>
                  <span className={`font-black tabular-nums shrink-0 ${net < 0 ? "text-red-400" : "text-white"}`}>
                    {net < 0 ? "−" : "+"}
                    {formatGp(Math.abs(net))}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id)}
                    aria-label={`Delete ${methodName(s.methodId)} session on ${s.date}`}
                    className="shrink-0 p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          {state.sessions.length > RECENT && (
            <p className="mt-2 text-[11px] text-neutral-500">
              Showing the latest {RECENT} of {state.sessions.length}. Export a backup for the full log.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

const TEXT_FIELDS: { key: keyof Draft; label: string; placeholder: string; numeric?: boolean }[] = [
  { key: "hours", label: "Hours", placeholder: "1.5" },
  { key: "kills", label: "Kills (optional)", placeholder: "—", numeric: true },
  { key: "loot", label: "Loot, M gp", placeholder: "0" },
  { key: "supplies", label: "Supplies, M gp", placeholder: "0" },
  { key: "upkeep", label: "Upkeep, M gp", placeholder: "0" },
  { key: "deaths", label: "Deaths, M gp", placeholder: "0" },
];

const INPUT =
  "w-full min-w-0 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-bold text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-600 [color-scheme:dark]";
const TH = "text-[10px] font-black text-neutral-500 uppercase tracking-wider px-3 py-2 text-left";

/** Label tied by id rather than wrapping, so a select's name isn't its selected option. */
function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={`min-w-0 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <label htmlFor={id} className={`block ${LABEL}`}>
        {label}
      </label>
      <div className="mt-1.5">{children(id)}</div>
    </div>
  );
}
