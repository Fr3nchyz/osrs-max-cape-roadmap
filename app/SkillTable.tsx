"use client";

import {
  methodsFor,
  hoursFor,
  adjustedGp,
  afkLabel,
  afkBadgeClass,
  platformLabel,
  levelProgress,
  ICON_MAP,
  XP_FOR_99,
  XP_FOR_92,
  type Skill,
  type MaxLine,
} from "./skills";


const fmtGp = (n: number) => {
  const sign = n >= 0 ? "+" : "-";
  const a = Math.abs(n);
  return a >= 1_000_000 ? `${sign}${(a / 1_000_000).toFixed(1)}M` : `${sign}${Math.round(a / 1000)}k`;
};

type Props = {
  skills: Skill[];
  selections: Record<string, number>;
  onMethodChange: (skill: string, idx: number) => void;
  gains: Record<string, { xp: number; levels: number }>;
  period: "week" | "month";
  earnRate: number;
  byName: Record<string, MaxLine>;
};

export default function SkillTable({ skills, selections, onMethodChange, gains, period, earnRate, byName }: Props) {
  const th = "text-[9px] font-black text-neutral-600 uppercase tracking-widest px-3 py-2 text-left";
  const thR = th + " text-right";

  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-neutral-800 bg-neutral-900">
      <table className="w-full min-w-[900px] text-xs">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className={th}>Skill</th>
            <th className={thR}>Levels left</th>
            <th className={th}>99%</th>
            <th className={thR}>This {period}</th>
            <th className={th}>Method</th>
            <th className={thR}>XP/h</th>
            <th className={thR}>Exp/action</th>
            <th className={th}>Platform</th>
            <th className={thR}>Hrs left</th>
            <th className={thR}>GP/h</th>
            <th className={thR}>Real cost</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const methods = methodsFor(skill.name);
            const idx = selections[skill.name] || 0;
            const m = methods[idx] || methods[0];
            const line = byName[skill.name];
            const hours = line ? line.hours : hoursFor(skill, m);
            const ret = line ? line.trueAtMax : hours * adjustedGp(m, earnRate);
            const pct = Math.min(100, (skill.xp / XP_FOR_99) * 100);
            const gain = gains[skill.name];
            const { levelsLeft, xpToNext } = levelProgress(skill);
            const mobile = platformLabel(m) === "Mobile";
            const near = !skill.isMaxed && skill.xp > XP_FOR_92;

            return (
              <tr
                key={skill.name}
                className={`border-b border-neutral-800/60 last:border-0 transition-colors hover:bg-neutral-800/30 ${
                  skill.isMaxed ? "opacity-40" : near ? "bg-yellow-600/[0.04]" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ICON_MAP[skill.name] || "❓"}</span>
                    <div>
                      <p className="font-black text-white uppercase tracking-tight leading-none">{skill.name}</p>
                      <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                        Lv {skill.level}
                        {skill.estimated && (
                          <span className="ml-1 text-amber-500" title="Not on the HiScores — using a fallback estimate. Set it via Edit levels.">
                            · est.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                  {skill.isMaxed ? (
                    <span className="text-green-600 font-black">99</span>
                  ) : (
                    <>
                      <p className="text-white font-black leading-none">
                        {levelsLeft} <span className="text-[9px] text-neutral-500 font-bold">lv</span>
                      </p>
                      <p className="text-[9px] text-neutral-500 mt-0.5">
                        next in {xpToNext >= 1000 ? `${Math.round(xpToNext / 1000)}k` : xpToNext}
                      </p>
                    </>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="relative w-16 h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/50"
                      title={skill.xp >= XP_FOR_92 ? "Past level 92 — halfway to 99 by XP" : "Level 92 marks the halfway point (by XP)"}
                    >
                      <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400" style={{ width: `${pct}%` }} />
                      <div
                        className="absolute top-0 bottom-0 w-px bg-neutral-400/70"
                        style={{ left: `${(XP_FOR_92 / XP_FOR_99) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-yellow-600">{Math.floor(pct)}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {gain && gain.xp > 0 ? (
                    <>
                      <span className="text-green-500">
                        +{gain.xp >= 1_000_000 ? `${(gain.xp / 1_000_000).toFixed(1)}M` : `${(gain.xp / 1000).toFixed(0)}k`}
                      </span>
                      {gain.levels > 0 && <p className="text-[9px] text-yellow-500 mt-0.5">+{gain.levels} lv</p>}
                    </>
                  ) : (
                    <span className="text-neutral-700">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={idx}
                      onChange={(e) => onMethodChange(skill.name, parseInt(e.target.value))}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] font-bold text-neutral-300 focus:outline-none focus:ring-1 focus:ring-yellow-600 cursor-pointer max-w-[180px]"
                    >
                      {methods.map((mm, i) => (
                        <option key={i} value={i}>
                          {mm.name}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${afkBadgeClass(
                        m.afk
                      )}`}
                    >
                      {afkLabel(m.afk)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-neutral-300">{(m.rate / 1000).toFixed(0)}k</td>
                <td className="px-3 py-2.5 text-right font-mono text-neutral-500">
                  {m.xpPerAction ? m.xpPerAction.toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                      mobile
                        ? "bg-green-600/15 text-green-500 border-green-700/40"
                        : "bg-blue-600/15 text-blue-400 border-blue-700/40"
                    }`}
                  >
                    {platformLabel(m)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-yellow-600">
                  {line?.grouped === "free" ? (
                    <span className="text-[10px] text-green-600" title="Trained free alongside melee combat">free</span>
                  ) : (
                    <>
                      {Math.ceil(hours)}h
                      {line?.grouped === "overlap" && (
                        <span className="ml-1 text-[9px] text-neutral-600" title="Overlaps the melee grind (Slayer)">·linked</span>
                      )}
                    </>
                  )}
                </td>
                <td className={`px-3 py-2.5 text-right font-mono ${m.gp >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {fmtGp(m.gp)}
                </td>
                <td className={`px-3 py-2.5 text-right font-mono font-black ${ret >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {fmtGp(ret)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
