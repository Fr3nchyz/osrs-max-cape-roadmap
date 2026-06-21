"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Flag, Target } from "lucide-react";

const PLAN_KEY = "osrs-plan-fr3nchy";

export type Goal = {
  id: string;
  title: string;
  target: string;
  notes: string;
  status: "planned" | "active" | "done";
  sort: number;
};

const STATUS_CYCLE: Goal["status"][] = ["planned", "active", "done"];

const STATUS_STYLE: Record<Goal["status"], string> = {
  planned: "bg-neutral-800 text-neutral-400 border-neutral-700",
  active: "bg-yellow-600/20 text-yellow-500 border-yellow-700/40",
  done: "bg-green-600/20 text-green-500 border-green-700/40",
};

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Goal[];
    return Array.isArray(arr) ? arr.sort((a, b) => a.sort - b.sort) : [];
  } catch {
    return [];
  }
}

function save(goals: Goal[]) {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(goals));
  } catch {
    /* storage unavailable */
  }
}

export default function GamePlan() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    setGoals(load());
  }, []);

  const commit = (next: Goal[]) => {
    const reindexed = next.map((g, i) => ({ ...g, sort: i }));
    setGoals(reindexed);
    save(reindexed);
  };

  const addGoal = () => {
    const t = title.trim();
    if (!t) return;
    const g: Goal = {
      id: crypto.randomUUID(),
      title: t,
      target: target.trim(),
      notes: "",
      status: "planned",
      sort: goals.length,
    };
    commit([...goals, g]);
    setTitle("");
    setTarget("");
  };

  const update = (id: string, patch: Partial<Goal>) =>
    commit(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const remove = (id: string) => commit(goals.filter((g) => g.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const i = goals.findIndex((g) => g.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= goals.length) return;
    const next = [...goals];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  const cycleStatus = (g: Goal) =>
    update(g.id, {
      status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(g.status) + 1) % STATUS_CYCLE.length],
    });

  const activeCount = goals.filter((g) => g.status !== "done").length;

  return (
    <section className="space-y-6">
      {/* Header + add form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Flag className="w-5 h-5 text-yellow-600" /> Game Plan
          </h3>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            {activeCount} open / {goals.length} total
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            placeholder="Next big goal (e.g. Finish Mining)"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600"
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            placeholder="Target (e.g. 99)"
            className="sm:w-40 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600"
          />
          <button
            onClick={addGoal}
            className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Goals */}
      {goals.length === 0 ? (
        <div className="text-center py-16 text-neutral-600">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold uppercase tracking-widest">No goals yet</p>
          <p className="text-xs mt-1">Add your next couple of big grinds to plan your sessions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g, i) => (
            <div
              key={g.id}
              className={`bg-neutral-900 border rounded-[1.5rem] p-5 transition-all ${
                g.status === "done"
                  ? "border-green-900/20 opacity-60"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-white tracking-tight truncate">
                      {g.title}
                    </h4>
                    {g.target && (
                      <span className="text-[10px] font-mono font-black text-yellow-600 bg-yellow-600/10 px-2 py-0.5 rounded-md">
                        {g.target}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => cycleStatus(g)}
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${STATUS_STYLE[g.status]}`}
                  >
                    {g.status}
                  </button>
                  <button
                    onClick={() => move(g.id, -1)}
                    disabled={i === 0}
                    className="p-1.5 text-neutral-600 hover:text-white disabled:opacity-20"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(g.id, 1)}
                    disabled={i === goals.length - 1}
                    className="p-1.5 text-neutral-600 hover:text-white disabled:opacity-20"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(g.id)}
                    className="p-1.5 text-neutral-600 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <textarea
                value={g.notes}
                onChange={(e) => update(g.id, { notes: e.target.value })}
                placeholder="Brainstorm + research: methods, routes, gear, links to commit to memory…"
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
