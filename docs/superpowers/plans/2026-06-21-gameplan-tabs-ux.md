# Game Plan 3-tab restructure + both-tabs UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Game Plan tab into Planning + Final Plan (status-driven), share goal state via a `useGoals` hook, add persisted brainstorm notes, and give both tabs a desktop-first / mobile-accessible UX pass.

**Architecture:** One localStorage-backed goal list (`Goal.status: planned|active|done`) owned by a new `useGoals` hook. `page.tsx` renders a 3-tab shell (Roadmap · Planning · Final Plan) and passes live `skills` + the hook's API down. `Planning.tsx` (renamed from `GamePlan.tsx`) shows Suggested Next + brainstorm notes + `planned` drafts. `FinalPlan.tsx` (new) shows the `active` queue with a rollup + a `done` accordion. No backend; no schema change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, lucide-react. Verification = `npm run build` (tsc) + Chrome MCP browser checks. No unit-test runner in this project.

---

## Conventions for every task

- **Build gate:** `npm run build` from the project root must finish with `✓ Compiled successfully` and no TypeScript errors.
- **Dev server:** already runs on `http://localhost:3001` (port 3000 is taken by another project). If down: `npm run dev`.
- **Browser checks** use the Claude-in-Chrome MCP against `http://localhost:3001` (tab navigation, `find`, screenshot).
- **Commits:** commit after each task. The repo's git email is the noreply address (already set repo-local). End commit messages with the Co-Authored-By trailer.
- Storage keys: goals `osrs-plan-fr3nchy`, brainstorm `osrs-brainstorm-fr3nchy`, settings `osrs-maxcape-fr3nchy`.

---

## File structure

- Create `app/useGoals.ts` — hook owning the goals array + persistence + mutations.
- Create `app/FinalPlan.tsx` — Final Plan tab (active queue + rollup + done accordion).
- Rename `app/GamePlan.tsx` → `app/Planning.tsx` — Planning tab (suggestions + brainstorm + drafts).
- Modify `app/page.tsx` — 3-tab shell, render Planning/FinalPlan, Roadmap UX tweaks.
- Modify `app/skills.ts` — add `hoursFor(skill, method)` helper (rollup math, shared).
- Modify `app/globals.css` only if a shared utility is needed (avoid; prefer inline classes).

---

## Task 1: Extract the `useGoals` hook

**Files:**
- Create: `app/useGoals.ts`
- Reference (do not yet edit): `app/GamePlan.tsx:1-110` (current inline goal logic)

- [ ] **Step 1: Create the hook with the Goal type, persistence, and mutations**

Create `app/useGoals.ts`:

```ts
"use client";

import { useState, useEffect, useCallback } from "react";

const PLAN_KEY = "osrs-plan-fr3nchy";

export type GoalStatus = "planned" | "active" | "done";

export type Goal = {
  id: string;
  title: string;
  target: string;
  notes: string;
  status: GoalStatus;
  sort: number;
};

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Goal[];
    return Array.isArray(arr) ? arr.slice().sort((a, b) => a.sort - b.sort) : [];
  } catch {
    return [];
  }
}

function persist(goals: Goal[]) {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(goals));
  } catch {
    /* storage unavailable */
  }
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setGoals(load());
  }, []);

  // Re-sort and reindex `sort` within each status bucket so ordering is stable per tab.
  const commit = useCallback((next: Goal[]) => {
    const buckets: Record<GoalStatus, Goal[]> = { planned: [], active: [], done: [] };
    next.forEach((g) => buckets[g.status].push(g));
    const reindexed = (Object.keys(buckets) as GoalStatus[]).flatMap((s) =>
      buckets[s].map((g, i) => ({ ...g, sort: i }))
    );
    setGoals(reindexed);
    persist(reindexed);
  }, []);

  const add = useCallback(
    (partial: Omit<Goal, "id" | "sort">) =>
      commit([...goals, { ...partial, id: crypto.randomUUID(), sort: goals.length }]),
    [goals, commit]
  );

  const update = useCallback(
    (id: string, patch: Partial<Goal>) =>
      commit(goals.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    [goals, commit]
  );

  const remove = useCallback(
    (id: string) => commit(goals.filter((g) => g.id !== id)),
    [goals, commit]
  );

  const setStatus = useCallback(
    (id: string, status: GoalStatus) => update(id, { status }),
    [update]
  );

  // Move a goal up/down WITHIN its own status bucket (used by the Final Plan queue).
  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const g = goals.find((x) => x.id === id);
      if (!g) return;
      const bucket = goals.filter((x) => x.status === g.status).sort((a, b) => a.sort - b.sort);
      const i = bucket.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= bucket.length) return;
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
      const reorderedIds = bucket.map((x) => x.id);
      const others = goals.filter((x) => x.status !== g.status);
      const rebucketed = bucket.map((x, idx) => ({ ...x, sort: idx }));
      void reorderedIds;
      commit([...others, ...rebucketed]);
    },
    [goals, commit]
  );

  return { goals, add, update, remove, setStatus, move };
}
```

- [ ] **Step 2: Build to verify the hook typechecks**

Run: `npm run build`
Expected: `✓ Compiled successfully`, no TS errors. (Hook is unused so far — that's fine.)

- [ ] **Step 3: Commit**

```bash
git add app/useGoals.ts
git commit -m "feat: extract useGoals hook (goals state + localStorage + status mutations)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Add `hoursFor` rollup helper to skills.ts

**Files:**
- Modify: `app/skills.ts` (append near `rankSkillsByAfk`)

- [ ] **Step 1: Add the helper**

Append to `app/skills.ts` (after `rankSkillsByAfk`):

```ts
// Hours to max a skill with a given method (rollup + card math share this).
export function hoursFor(skill: Skill, method: Method): number {
  return skill.remainingXp / (method.rate || 50000);
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add app/skills.ts
git commit -m "feat: add hoursFor() helper for shared rollup math

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Rename GamePlan.tsx → Planning.tsx and adopt useGoals

**Files:**
- Rename: `app/GamePlan.tsx` → `app/Planning.tsx`
- Modify: the renamed file
- Modify: `app/page.tsx` (import path + JSX tag — interim, finalized in Task 6)

- [ ] **Step 1: Rename the file**

```bash
git mv app/GamePlan.tsx app/Planning.tsx
```

- [ ] **Step 2: Rewrite Planning.tsx to consume useGoals and render only `planned` drafts**

Replace the whole contents of `app/Planning.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Flag, Target, Zap, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { rankSkillsByAfk, afkLabel, ICON_MAP, type Skill } from "./skills";
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

  // Collapse Suggested Next once there is at least one goal anywhere.
  useEffect(() => {
    if (goals.length > 0) setShowSuggestions(false);
  }, [goals.length]);

  const committedTitles = new Set(
    goals.filter((g) => g.status !== "done").map((g) => g.title.toLowerCase())
  );
  const suggestions = rankSkillsByAfk(skills).filter(
    (s) => !committedTitles.has(goalTitleFor(s.skill.name).toLowerCase())
  );

  const addDraft = () => {
    const t = title.trim();
    if (!t) return;
    add({ title: t, target: target.trim(), notes: "", status: "planned" });
    setTitle("");
    setTarget("");
  };

  // Suggestion Add commits straight to Final Plan (status: active).
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
                        className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${
                          s.method.afk <= 2
                            ? "bg-green-600/15 text-green-500 border-green-700/40"
                            : s.method.afk === 3
                            ? "bg-amber-600/15 text-amber-500 border-amber-700/40"
                            : "bg-red-600/15 text-red-500 border-red-700/40"
                        }`}
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
```

- [ ] **Step 3: Point page.tsx at the renamed component (interim wiring)**

In `app/page.tsx`, update the import and the render. Replace:

```tsx
import GamePlan from "./GamePlan";
```

with:

```tsx
import Planning from "./Planning";
import { useGoals } from "./useGoals";
```

Find the App component body and add the hook near the other `useState` calls:

```tsx
  const goalStore = useGoals();
```

Replace the render line:

```tsx
        {tab === "plan" && <GamePlan skills={data} />}
```

with (interim — full 3-tab wiring is Task 6):

```tsx
        {tab === "plan" && (
          <Planning
            skills={data}
            goals={goalStore.goals}
            add={goalStore.add}
            update={goalStore.update}
            remove={goalStore.remove}
            setStatus={goalStore.setStatus}
          />
        )}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. If TS complains about an unused `move` from the hook, that's fine — it's destructured only where used.

- [ ] **Step 5: Browser check**

Ensure dev server is up (`http://localhost:3001`). In Chrome MCP: navigate to the URL, click the "Game Plan" tab, confirm Brainstorm + Suggested Next + Drafts render. Add a suggestion → it should NOT appear as a draft (it's `active`, and Final Plan isn't wired yet, so it just disappears from suggestions — expected this task).

- [ ] **Step 6: Reset test data and commit**

In the browser console (Chrome MCP `javascript_tool`): `localStorage.removeItem('osrs-plan-fr3nchy')` then reload.

```bash
git add app/Planning.tsx app/page.tsx
git commit -m "refactor: rename GamePlan->Planning, drive from useGoals, planned-only drafts + brainstorm notes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Create the FinalPlan component

**Files:**
- Create: `app/FinalPlan.tsx`

- [ ] **Step 1: Write FinalPlan.tsx**

Create `app/FinalPlan.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Flag, Trash2, ChevronUp, ChevronDown, Undo2, Check, Clock, Coins, Calendar } from "lucide-react";
import { methodsFor, bestMethod, hoursFor, type Skill } from "./skills";
import type { Goal } from "./useGoals";

type Props = {
  skills?: Skill[];
  hoursPerDay: number;
  goals: Goal[];
  update: (id: string, patch: Partial<Goal>) => void;
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
  update,
  remove,
  setStatus,
  move,
}: Props) {
  const [showDone, setShowDone] = useState(false);

  const active = goals.filter((g) => g.status === "active").sort((a, b) => a.sort - b.sort);
  const done = goals.filter((g) => g.status === "done");

  // Rollup over committed goals we can resolve to a live skill + its best method.
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
```

Note: `methodsFor` is imported for parity with future per-goal method display but only `bestMethod`/`hoursFor` are used in rollup. If the build warns about an unused import, drop `methodsFor` from the import line.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. Remove any genuinely-unused import the compiler flags.

- [ ] **Step 3: Commit**

```bash
git add app/FinalPlan.tsx
git commit -m "feat: add FinalPlan tab (committed queue, rollup, completed accordion)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wire the 3-tab shell in page.tsx

**Files:**
- Modify: `app/page.tsx` (tab state type, tab nav buttons, render switch, sticky nav)

- [ ] **Step 1: Widen the tab state**

Find:

```tsx
  const [tab, setTab] = useState<"dashboard" | "plan">("dashboard");
```

Replace with:

```tsx
  const [tab, setTab] = useState<"dashboard" | "planning" | "final">("dashboard");
```

- [ ] **Step 2: Update the tab nav**

Locate the existing tab-switcher block (two buttons: Roadmap / Game Plan, using `LayoutDashboard` and `Flag`). Replace the whole nav container with a sticky 3-tab bar. Ensure `Flag`, `LayoutDashboard`, and `ListChecks` are imported from lucide-react (add `ListChecks` to the import list at the top of the file):

```tsx
        <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
          <div className="inline-flex gap-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-1">
            <button
              onClick={() => setTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === "dashboard" ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Roadmap
            </button>
            <button
              onClick={() => setTab("planning")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === "planning" ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Flag className="w-4 h-4" /> Planning
            </button>
            <button
              onClick={() => setTab("final")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === "final" ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <ListChecks className="w-4 h-4" /> Final plan
            </button>
          </div>
        </div>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. (Render switch still references old `tab === "plan"` — fixed in Task 6, so the Planning tab may not show yet. If the build errors on the `"plan"` literal no longer being assignable, proceed directly to Task 6 before testing.)

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: 3-tab sticky nav (Roadmap / Planning / Final plan)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Render Planning + Final Plan; finalize wiring

**Files:**
- Modify: `app/page.tsx` (imports, render switch, gate the dashboard-only blocks)

- [ ] **Step 1: Import FinalPlan**

Add near the Planning import:

```tsx
import FinalPlan from "./FinalPlan";
```

- [ ] **Step 2: Replace the render switch**

Replace the interim Planning render (from Task 3) with both tabs. The dashboard blocks are already gated by `tab === "dashboard"`; leave those untouched. Add:

```tsx
        {tab === "planning" && (
          <Planning
            skills={data}
            goals={goalStore.goals}
            add={goalStore.add}
            update={goalStore.update}
            remove={goalStore.remove}
            setStatus={goalStore.setStatus}
          />
        )}
        {tab === "final" && (
          <FinalPlan
            skills={data}
            hoursPerDay={hoursPerDay}
            goals={goalStore.goals}
            update={goalStore.update}
            remove={goalStore.remove}
            setStatus={goalStore.setStatus}
            move={goalStore.move}
          />
        )}
```

Remove the old `{tab === "plan" && ( … )}` block entirely.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Full browser flow check**

Dev server up. In Chrome MCP against `http://localhost:3001`:
1. Three tabs visible and sticky when scrolling.
2. Planning: Brainstorm persists across reload (type text, reload, still there).
3. Planning → New draft → appears in Drafts; **Commit** → leaves Planning.
4. Final Plan: the committed goal appears in the numbered queue; rollup hours/date/GP are non-zero and match.
5. Final Plan reorder (↑/↓) works; **Un-commit** returns the goal to Planning Drafts; **Done** moves it to the Completed accordion.
6. Planning → Suggested Next → **Add** → goal lands directly in Final Plan as `active`.

- [ ] **Step 5: Reset test data and commit**

Browser console: `localStorage.removeItem('osrs-plan-fr3nchy'); localStorage.removeItem('osrs-brainstorm-fr3nchy')` then reload.

```bash
git add app/page.tsx
git commit -m "feat: render Planning + Final Plan tabs, finalize goal-store wiring

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Roadmap UX pass (labels + card declutter + legibility)

**Files:**
- Modify: `app/page.tsx` (hero stat labels, skill-card progress block, sub-8px labels)

- [ ] **Step 1: Relabel cryptic hero stats**

In `app/page.tsx`, change the hero stat labels. Replace the text `Financial Impact` with `Profit at max`, `Net profit at 99` stays, and replace `Efficiency Goal` with `Skills left`. (Search for those exact strings; they are plain text inside the stat cards.)

- [ ] **Step 2: Fold the "halfway mark" micro-bar into the main progress bar**

In the skill-card render, locate the block that renders the `Halfway mark` label + the thin `progressTo92` bar (a `{skill.xp < XP_FOR_92 && ( … )}` conditional inside the 99-progress section). Remove that conditional block. Instead, add a subtle marker on the main 99-progress bar: inside the main bar's container `div` (the one with the yellow gradient fill), add a sibling marker after the fill:

```tsx
                        <div
                          className="absolute top-0 h-full w-px bg-neutral-500/60"
                          style={{ left: "50%" }}
                        />
```

For the marker to position correctly, ensure the bar container has `relative` in its className (add `relative` to the `w-full bg-neutral-950 h-1.5 …` container if not present).

- [ ] **Step 3: Raise the smallest labels for legibility**

In `app/page.tsx`, bump the `text-[7px]` and `text-[8px]` utility classes on stat/card labels to `text-[10px]` (use find/replace within the file; these are all small uppercase labels where the change is purely legibility). Do a quick scan after to ensure no layout overflow on the 4-col skill grid.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 5: Browser check + screenshot**

Chrome MCP: Roadmap tab. Confirm relabeled stats, single progress bar with a midpoint marker, larger labels still fit the 4-col grid. Screenshot via computer-use.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: Roadmap UX pass — clearer stat labels, single progress bar, legible labels

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Responsive sanity pass + final verification

**Files:**
- Modify: `app/page.tsx` / `app/Planning.tsx` / `app/FinalPlan.tsx` only if overflow is found.

- [ ] **Step 1: Build the production bundle**

Run: `npm run build`
Expected: `✓ Compiled successfully`, all routes listed.

- [ ] **Step 2: Desktop verification (Chrome MCP)**

Walk the full flow from Task 6 Step 4 again on a clean localStorage to confirm nothing regressed.

- [ ] **Step 3: Mobile sanity (Chrome MCP resize)**

Resize the viewport to ~390px wide. Confirm: tab bar wraps/scrolls without breaking; the Roadmap stat grid and skill grid collapse to one column; Planning and Final Plan cards are full-width with no horizontal overflow. If any element overflows, fix by ensuring its grid uses `grid-cols-1 sm:grid-cols-*` and remove fixed widths; re-build.

- [ ] **Step 4: Screenshot all three tabs (computer-use) for the user.**

- [ ] **Step 5: Final commit (only if Step 3 required fixes)**

```bash
git add -A
git commit -m "fix: responsive sanity pass for narrow viewports

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review notes (author)

- **Spec coverage:** 3-tab IA (Tasks 5–6) ✓; status flow Commit/Un-commit/Done (Tasks 3–4) ✓; suggestion Add → active (Task 3) ✓; brainstorm notes persisted (Task 3) ✓; rollup hrs/date/GP (Task 4 + `hoursFor` Task 2) ✓; useGoals shared store (Task 1) ✓; Roadmap relabel + declutter + legibility (Task 7) ✓; desktop-first/mobile-accessible (Task 8) ✓.
- **Type consistency:** `Goal`/`GoalStatus` defined in `app/useGoals.ts` (Task 1) and imported everywhere; hook API `add/update/remove/setStatus/move` used identically in Tasks 3/4/6; `hoursFor(skill, method)` signature matches its only callers in `FinalPlan.tsx`.
- **Known intentional transient:** after Task 5 the render switch still uses the old `"plan"` literal; Task 6 removes it. Build the two together if the literal type-errors.
- **Deferred:** deeper visual polish (separate ui-polish pass), Supabase migration, real Sailing data — all out of scope per spec.
```
