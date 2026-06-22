"use client";

import { Sparkles, ArrowRight, Smartphone, Monitor } from "lucide-react";
import { closestWins, afkLabel, afkBadgeClass, platformLabel, ICON_MAP, type Skill } from "./skills";

// "Do this next" — the closest bite-sized win, framed to make the remaining grind feel achievable.
export default function NextUp({ skills = [], onPlan }: { skills?: Skill[]; onPlan: () => void }) {
  const win = closestWins(skills)[0];
  if (!win) return null;

  const { skill, method, hours } = win;
  const sessionXp = method.rate; // a 1-hour session
  const pctOfRemaining = Math.min(100, (sessionXp / skill.remainingXp) * 100);
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
          </p>
          <h3 className="text-lg font-black text-white tracking-tight leading-tight">
            {skill.name} → 99 in ~{Math.ceil(hours)}h
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
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
