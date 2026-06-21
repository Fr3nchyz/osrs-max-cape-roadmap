"use client";

import { useState } from "react";
import { Flag, Trash2, ChevronUp, ChevronDown, Undo2, Check, Clock, Coins, Calendar } from "lucide-react";
import { bestMethod, hoursFor, type Skill } from "./skills";
import type { Goal } from "./useGoals";

type Props = {
  skills?: Skill[];
  hoursPerDay: number;
  goals: Goal[];
  remove: (id: string) => void;
  setStatus: (id: string, status: Goal["status"]) => void;
  move: (id: string, dir: -1 | 1) => void;
};

// Best-effort: map a goal title like "Mining to 99" back to a live skill for rollup math.
function skillForGoal(goal: Goal, skills: Skill[]): Skill | undefined {
  const name = goal.title.replace(/ to 99$/i, "").trim().toLowerCase();
  return skills.find((s) => s.name.toLowerCase() === name);
}

export default function FinalPlan({
  skills = [],
  hoursPerDay,
  goals,
  remove,
  setStatus,
  move,
}: Props) {
  const [showDone, setShowDone] = useState(false);

  const active = goals.filter((g) => g.status === "active").sort((a, b) => a.sort - b.sort);
  const done = goals.filter((g) => g.status === "done");

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

  return (
    <section className="space-y-6">
      {/* Rollup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Committed
          </p>
          <p className="text-2xl font-black font-mono text-yellow-600 mt-1">{Math.ceil(totalHours)}h</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Finish (est)
          </p>
          <p className="text-base font-black text-white mt-1">
            {active.length === 0
              ? "—"
              : finishDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Coins className="w-3 h-3" /> GP swing
          </p>
          <p className={`text-2xl font-black font-mono mt-1 ${totalGp >= 0 ? "text-green-500" : "text-red-500"}`}>
            {gpLabel}
          </p>
        </div>
      </div>

      {/* Active queue */}
      {active.length === 0 ? (
        <div className="text-center py-16 text-neutral-600">
          <Flag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold uppercase tracking-widest">Nothing committed yet</p>
          <p className="text-xs mt-1">Add a suggestion from Planning, or commit a draft.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((g, i) => (
            <div key={g.id} className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5">
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
                  <button
                    onClick={() => move(g.id, -1)}
                    disabled={i === 0}
                    className="p-1.5 text-neutral-600 hover:text-white disabled:opacity-20"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(g.id, 1)}
                    disabled={i === active.length - 1}
                    className="p-1.5 text-neutral-600 hover:text-white disabled:opacity-20"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStatus(g.id, "planned")}
                    title="Un-commit (back to Planning)"
                    className="p-1.5 text-neutral-600 hover:text-yellow-500"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStatus(g.id, "done")}
                    title="Mark done"
                    className="p-1.5 text-neutral-600 hover:text-green-500"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {g.notes && <p className="mt-2 text-xs text-neutral-500">{g.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Completed accordion */}
      {done.length > 0 && (
        <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[1.5rem] p-4">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="w-full flex items-center justify-between text-[11px] font-black text-neutral-500 uppercase tracking-widest"
          >
            <span>Completed ({done.length})</span>
            {showDone ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDone && (
            <div className="mt-3 space-y-2">
              {done.map((g) => (
                <div key={g.id} className="flex items-center gap-2 text-xs text-neutral-500">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="line-through">{g.title}</span>
                  <button
                    onClick={() => remove(g.id)}
                    className="ml-auto p-1 text-neutral-700 hover:text-red-500"
                  >
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
