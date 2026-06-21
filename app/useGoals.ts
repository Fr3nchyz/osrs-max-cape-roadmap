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

  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const g = goals.find((x) => x.id === id);
      if (!g) return;
      const bucket = goals.filter((x) => x.status === g.status).sort((a, b) => a.sort - b.sort);
      const i = bucket.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= bucket.length) return;
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
      const others = goals.filter((x) => x.status !== g.status);
      const rebucketed = bucket.map((x, idx) => ({ ...x, sort: idx }));
      commit([...others, ...rebucketed]);
    },
    [goals, commit]
  );

  return { goals, add, update, remove, setStatus, move };
}
