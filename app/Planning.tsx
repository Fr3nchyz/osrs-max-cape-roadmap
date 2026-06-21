"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Flag, Target, Zap, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { rankSkillsByAfk, afkLabel, afkBadgeClass, ICON_MAP, type Skill } from "./skills";
import type { Goal } from "./useGoals";

const BRAINSTORM_KEY = "osrs-brainstorm-fr3nchy";
const goalTitleFor = (skill: string) => `${skill} to 99`;

type Props = {
  skills?: Skill[];
  goals: Goal[];
  add: (g: Omit<Goal, "id" | "sort">) => void;
  update: (id: string, patch: Partial<Goal>) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: Goal["status"]) => void;
};

export default function Planning({ skills = [], goals, add, update, remove, setStatus }: Props) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [brainstorm, setBrainstorm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

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

  const drafts = goals.filter((g) => g.status === "planned");

  // Collapse Suggested Next once goals first exist; afterwards respect manual toggling.
  const autoCollapsed = useRef(false);
  useEffect(() => {
    if (!autoCollapsed.current && goals.length > 0) {
      setShowSuggestions(false);
      autoCollapsed.current = true;
    }
  }, [goals.length]);

  // Don't re-suggest a skill that's already a goal in ANY status (planned/active/done) —
  // prevents a completed-but-not-maxed goal reappearing and creating a duplicate.
  const existingTitles = new Set(goals.map((g) => g.title.toLowerCase()));
  const suggestions = rankSkillsByAfk(skills).filter(
    (s) => !existingTitles.has(goalTitleFor(s.skill.name).toLowerCase())
  );

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
    <section className="space-y-6">
      {/* Brainstorm notes */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 space-y-3">
        <h3 className="text-base font-black text-white uppercase tracking-tighter flex items-center gap-2">
          <Flag className="w-4 h-4 text-yellow-600" /> Brainstorm
        </h3>
        <textarea
          value={brainstorm}
          onChange={(e) => saveBrainstorm(e.target.value)}
          placeholder="Research, routes, gear, links to commit to memory…"
          rows={3}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 resize-y"
        />
      </div>

      {/* Suggested next (collapsible) */}
      {suggestions.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 space-y-3">
          <button
            onClick={() => setShowSuggestions((v) => !v)}
            className="w-full flex items-center justify-between"
          >
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
                <div
                  key={s.skill.name}
                  className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-2xl px-3 py-2.5"
                >
                  <span className="text-lg shrink-0">{ICON_MAP[s.skill.name] || "❓"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white tracking-tight">{s.skill.name}</span>
                      <span className="text-[10px] font-mono text-neutral-500">Lv {s.skill.level}</span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${afkBadgeClass(
                          s.method.afk
                        )}`}
                      >
                        {afkLabel(s.method.afk)}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {s.method.name} · ~{Math.ceil(s.hours)}h
                    </p>
                  </div>
                  <button
                    onClick={() => addFromSuggestion(s)}
                    className="flex items-center gap-1 bg-neutral-800 hover:bg-yellow-600 hover:text-white text-neutral-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New draft form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Target className="w-4 h-4 text-yellow-600" /> Drafts
          </h3>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            {drafts.length} planned
          </span>
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
          <button
            onClick={addDraft}
            className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Draft cards */}
      {drafts.length === 0 ? (
        <div className="text-center py-12 text-neutral-600">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-bold uppercase tracking-widest">No drafts</p>
          <p className="text-[11px] mt-1">Add suggestions to your plan, or draft a goal to brainstorm here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((g) => (
            <div key={g.id} className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black text-white tracking-tight truncate">{g.title}</h4>
                  {g.target && (
                    <span className="text-[10px] font-mono font-black text-yellow-600 bg-yellow-600/10 px-2 py-0.5 rounded-md">
                      {g.target}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setStatus(g.id, "active")}
                    className="flex items-center gap-1 bg-yellow-600/20 hover:bg-yellow-600 hover:text-white text-yellow-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95"
                  >
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
    </section>
  );
}
