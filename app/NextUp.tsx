"use client";

import { Sparkles, ArrowRight, Smartphone, Monitor, ListOrdered } from "lucide-react";
import { closestWins, afkLabel, afkBadgeClass, platformLabel, methodsFor, ICON_MAP, type Skill } from "./skills";
import { MAX_ORDER, nextMilestone } from "@/lib/maxOrder";

// "Do this next" — the first unmet step of your maxing order; once that's done, the closest 99.
export default function NextUp({
  skills = [],
  selections = {},
  onPlan,
}: {
  skills?: Skill[];
  selections?: Record<string, number>;
  onPlan: () => void;
}) {
  const xp = Object.fromEntries(skills.map((s) => [s.name, s.xp]));
  const step = skills.length ? nextMilestone(xp) : null;

  let skill: Skill | undefined;
  let target = 99;
  let xpToGo: number;
  let how: string | null = null;
  if (step) {
    skill = skills.find((s) => s.name === step.milestone.skill);
    target = step.milestone.level;
    xpToGo = step.xpToGo;
    how = step.milestone.how;
  } else {
    const win = closestWins(skills)[0];
    skill = win?.skill;
    xpToGo = win?.skill.remainingXp ?? 0;
  }
  if (!skill) return null;

  const ms = methodsFor(skill.name);
  const method = ms[selections[skill.name] || 0] || ms[0];
  const hours = xpToGo / (method.rate || 50000);
  const sessionXp = method.rate; // a 1-hour session
  const pctOfRemaining = Math.min(100, (sessionXp / Math.max(1, xpToGo)) * 100);
  const mobile = platformLabel(method) === "Mobile";

  return (
    <div className="bg-gradient-to-r from-yellow-600/15 to-neutral-900 border border-yellow-700/30 rounded-[1.75rem] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-2xl bg-neutral-950/60 border border-yellow-700/30 flex items-center justify-center text-2xl shrink-0">
          {ICON_MAP[skill.name] || "❓"}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Do this next
            {step && (
              <span className="text-neutral-500 flex items-center gap-1">
                · <ListOrdered className="w-3 h-3" /> step {step.index + 1} of {MAX_ORDER.length}
              </span>
            )}
          </p>
          <h3 className="text-lg font-black text-white tracking-tight leading-tight">
            {skill.name} → {target} in ~{Math.ceil(hours)}h
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {how ? `${how} · ` : ""}
            {method.name} · {(method.rate / 1000).toFixed(0)}k xp/h ·{" "}
            <span className={`font-black ${mobile ? "text-green-500" : "text-blue-400"}`}>
              {mobile ? <Smartphone className="inline w-3 h-3" /> : <Monitor className="inline w-3 h-3" />}{" "}
              {platformLabel(method)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="text-right">
          <p className="text-sm font-black text-white font-mono leading-none">
            +{(sessionXp / 1000).toFixed(0)}k
          </p>
          <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1">
            1h ≈ {pctOfRemaining.toFixed(1)}% left
          </p>
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${afkBadgeClass(
            method.afk
          )}`}
        >
          {afkLabel(method.afk)}
        </span>
        <button
          onClick={onPlan}
          className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all active:scale-95"
        >
          Plan a session <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
