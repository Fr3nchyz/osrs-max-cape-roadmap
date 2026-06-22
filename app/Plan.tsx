"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Flag,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ArrowRight,
  Undo2,
  Check,
  Clock,
  Coins,
  Calendar,
} from "lucide-react";
import {
  rankSkillsByAfk,
  afkLabel,
  afkBadgeClass,
  bestMethod,
  hoursFor,
  ICON_MAP,
  type Skill,
} from "./skills";
import type { Goal } from "./useGoals";

const BRAINSTORM_KEY = "osrs-brainstorm-fr3nchy";
const goalTitleFor = (skill: string) => `${skill} to 99`;

type Props = {
  skills?: Skill[];
  hoursPerDay: number;
  goals: Goal[];
  add: (g: Omit<Goal, "id" | "sort">) => void;
  update: (id: string, patch: Partial<Goal>) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: Goal["status"]) => void;
  move: (id: string, dir: -1 | 1) => void;
};

// Map a goal title like "Mining to 99" back to a live skill for rollup math.
function skillForGoal(goal: Goal, skills: Skill[]): Skill | undefined {
  const name = goal.title.replace(/ to 99$/i, "").trim().toLowerCase();
  return skills.find((s) => s.name.toLowerCase() === name);
}

export default function Plan({ skills = [], hoursPerDay, goals, add, update, remove, setStatus, move }: Props) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [brainstorm, setBrainstorm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showBrainstorm, setShowBrainstorm] = useState(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    try {
      setBrainstorm(localStorage.getItem(BRAINSTORM_KEY) || "");
    } catch {
      /* ignore */
    }
  }, []);

  const saveBrainstorm = (v: string) => {
    setBrainstorm(v);
    try {
      localStorage.setItem(BRAINSTORM_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const active = goals.filter((g) => g.status === "active").sort((a, b) => a.sort - b.sort);
  const drafts = goals.filter((g) => g.status === "planned");
  const done = goals.filter((g) => g.status === "done");

  // Collapse Suggested Next once goals first exist; respect manual toggling after.
  const autoCollapsed = useRef(false);
  useEffect(() => {
    if (!autoCollapsed.current && goals.length > 0) {
      setShowSuggestions(false);
      autoCollapsed.current = true;
    }
  }, [goals.length]);

  const existingTitles = new Set(goals.map((g) => g.title.toLowerCase()));
  const suggestions = rankSkillsByAfk(skills).filter(
    (s) => !existingTitles.has(goalTitleFor(s.skill.name).toLowerCase())
  );

  // Rollup over committed (active) goals resolvable to a live skill.
  let totalHours = 0;
  let totalGp = 0;
  active.forEach((g) => {
    const skill = skillForGoal(g, skills);
    if (!skill || skill.isMaxed) return;
    const method = bestMethod(skill.name);
    const h = hoursFor(skill, method);
    totalHours += h;
    totalGp += h * method.gp;
  });
  const days = hoursPerDay > 0 ? totalHours / hoursPerDay : 0;
  const finishDate = new Date(Date.now() + days * 86400000);
  const gpLabel =
    Math.abs(totalGp) >= 1_000_000
      ? `${totalGp >= 0 ? "+" : "-"}${(Math.abs(totalGp) / 1_000_000).toFixed(1)}M`
      : `${totalGp >= 0 ? "+" : "-"}${Math.round(Math.abs(totalGp) / 1000)}k`;

  const addDraft = () => {
    const t = title.trim();
    if (!t) return;
    add({ title: t, target: target.trim(), notes: "", status: "planned" });
    setTitle("");
    setTarget("");
  };

  const addFromSuggestion = (s: ReturnType<typeof rankSkillsByAfk>[number]) =>
    add({
      title: goalTitleFor(s.skill.name),
      target: "99",
      notes: `Method: ${s.method.name} · ~${Math.ceil(s.hours)}h · ${afkLabel(s.method.afk)}`,
      status: "active",
    });

  return (
    <section className="space-y-5">
      {/* Rollup */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-4">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Committed
          </p>
          <p className="text-2xl font-black font-mono text-yellow-600 mt-1">{Math.ceil(totalHours)}h</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-4">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Finish (est)
          </p>
          <p className="text-base font-black text-white mt-1.5">
            {active.length === 0
              ? "—"
              : finishDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-4">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Coins className="w-3 h-3" /> GP swing
          </p>
          <p className={`text-2xl font-black font-mono mt-1 ${totalGp >= 0 ? "text-green-500" : "text-red-500"}`}>
            {gpLabel}
          </p>
        </div>
      </div>

      {/* Active plan */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2 px-1">
          <Flag className="w-4 h-4 text-yellow-600" /> Active plan
          <span className="text-[10px] text-neutral-600 font-mono">{active.length}</span>
        </h3>
        {active.length === 0 ? (
          <div className="text-center py-10 text-neutral-600 border border-dashed border-neutral-800 rounded-[1.5rem]">
            <p className="text-xs font-bold uppercase tracking-widest">Nothing committed</p>
            <p className="text-[11px] mt-1">Add a suggestion or commit a draft below.</p>
          </div>
        ) : (
          active.map((g, i) => (
            <div key={g.id} className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-mono font-black text-neutral-600">{i + 1}</span>
                  <h4 className="text-base font-black text-white tracking-tight truncate">{g.title}</h4>
                  {g.target && (
                    <span className="text-[10px] font-mono font-black text-yellow-600 bg-yellow-600/10 px-2 py-0.5 rounded-md">
                      {g.target}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(g.id, -1)} disabled={i === 0} className="p-1.5 text-neutral-600 hover:text-white disabled:opacity-20">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(g.id, 1)} disabled={i === active.length - 1} className="p-1.5 text-neutral-600 hover:text-white disabled:opacity-20">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => setStatus(g.id, "planned")} title="Un-commit (back to drafts)" className="p-1.5 text-neutral-600 hover:text-yellow-500">
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setStatus(g.id, "done")} title="Mark done" className="p-1.5 text-neutral-600 hover:text-green-500">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {g.notes && <p className="mt-2 text-xs text-neutral-500">{g.notes}</p>}
            </div>
          ))
        )}
      </div>

      {/* Suggested next (collapsible) */}
      {suggestions.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5 space-y-3">
          <button onClick={() => setShowSuggestions((v) => !v)} className="w-full flex items-center justify-between">
            <span className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" /> Suggested next
            </span>
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1">
              Most AFK first
              {showSuggestions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </button>
          {showSuggestions && (
            <div className="space-y-1.5">
              {suggestions.map((s) => (
                <div key={s.skill.name} className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-2xl px-3 py-2.5">
                  <span className="text-lg shrink-0">{ICON_MAP[s.skill.name] || "❓"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white tracking-tight">{s.skill.name}</span>
                      <span className="text-[10px] font-mono text-neutral-500">Lv {s.skill.level}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${afkBadgeClass(s.method.afk)}`}>
                        {afkLabel(s.method.afk)}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {s.method.name} · ~{Math.ceil(s.hours)}h
                    </p>
                  </div>
                  <button onClick={() => addFromSuggestion(s)} className="flex items-center gap-1 bg-neutral-800 hover:bg-yellow-600 hover:text-white text-neutral-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 shrink-0">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Planned drafts */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Target className="w-4 h-4 text-yellow-600" /> Drafts
          </h3>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{drafts.length} planned</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDraft()}
            placeholder="Draft a goal to brainstorm (e.g. Finish Mining)"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600"
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDraft()}
            placeholder="Target (e.g. 99)"
            className="sm:w-40 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600"
          />
          <button onClick={addDraft} className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {drafts.length > 0 && (
          <div className="space-y-3 pt-1">
            {drafts.map((g) => (
              <div key={g.id} className="bg-neutral-950/60 border border-neutral-800 rounded-[1.25rem] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-white tracking-tight truncate">{g.title}</h4>
                    {g.target && (
                      <span className="text-[10px] font-mono font-black text-yellow-600 bg-yellow-600/10 px-2 py-0.5 rounded-md">{g.target}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setStatus(g.id, "active")} className="flex items-center gap-1 bg-yellow-600/20 hover:bg-yellow-600 hover:text-white text-yellow-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">
                      Commit <ArrowRight className="w-3 h-3" />
                    </button>
                    <button onClick={() => remove(g.id)} className="p-1.5 text-neutral-600 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={g.notes}
                  onChange={(e) => update(g.id, { notes: e.target.value })}
                  placeholder="Brainstorm + research for this goal…"
                  rows={2}
                  className="mt-3 w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brainstorm (collapsible) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5 space-y-3">
        <button onClick={() => setShowBrainstorm((v) => !v)} className="w-full flex items-center justify-between">
          <span className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Flag className="w-4 h-4 text-yellow-600" /> Brainstorm
          </span>
          {showBrainstorm ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
        </button>
        {showBrainstorm && (
          <textarea
            value={brainstorm}
            onChange={(e) => saveBrainstorm(e.target.value)}
            placeholder="Research, routes, gear, links to commit to memory…"
            rows={4}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 resize-y"
          />
        )}
      </div>

      {/* Completed accordion */}
      {done.length > 0 && (
        <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[1.5rem] p-4">
          <button onClick={() => setShowDone((v) => !v)} className="w-full flex items-center justify-between text-[11px] font-black text-neutral-500 uppercase tracking-widest">
            <span>Completed ({done.length})</span>
            {showDone ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDone && (
            <div className="mt-3 space-y-2">
              {done.map((g) => (
                <div key={g.id} className="flex items-center gap-2 text-xs text-neutral-500">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="line-through">{g.title}</span>
                  <button onClick={() => remove(g.id)} className="ml-auto p-1 text-neutral-700 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
