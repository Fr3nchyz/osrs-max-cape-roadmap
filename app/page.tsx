"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Clock,
  Zap,
  Target,
  RefreshCw,
  Smartphone,
  Pencil,
  Eye,
  EyeOff,
  Coins,
  ListOrdered,
  Calendar,
  Hourglass,
  LayoutDashboard,
  Flag,
  ListChecks,
  Play,
} from "lucide-react";
import Plan from "./Plan";
import SessionPlanner from "./SessionPlanner";
import NextUp from "./NextUp";
import SkillTable from "./SkillTable";
import { useGoals } from "./useGoals";
import { useWeekly } from "./useWeekly";
import {
  TRAINING_METHODS,
  methodsFor,
  platformsFor,
  computeMaxPlan,
  applyLevelOverrides,
  DEFAULT_EARN_RATE,
  type Skill,
} from "./skills";

const USERNAME = "fr3nchy";
const XP_FOR_99 = 13034431;
const XP_FOR_92 = 6517253;
const SAILING_FALLBACK_XP = 3972294; // Level 87
const STORAGE_KEY = "osrs-maxcape-fr3nchy";

const COMBAT_AND_SLAYER = [
  "Attack",
  "Strength",
  "Defence",
  "Hitpoints",
  "Ranged",
  "Magic",
  "Prayer",
  "Slayer",
];

const EFFICIENT_PRIORITY: Record<string, number> = {
  Fishing: 1,
  Woodcutting: 2,
  Smithing: 3,
  Mining: 4,
  Sailing: 5,
  Herblore: 6,
  Hunter: 7,
  Fletching: 8,
  Attack: 9,
  Strength: 10,
  Defence: 11,
  Hitpoints: 12,
  Ranged: 13,
  Magic: 14,
  Prayer: 15,
  Slayer: 16,
};

const SKILL_COLORS: Record<string, string> = {
  Attack: "bg-red-700",
  Strength: "bg-red-500",
  Defence: "bg-blue-600",
  Hitpoints: "bg-rose-500",
  Ranged: "bg-green-700",
  Prayer: "bg-cyan-400",
  Magic: "bg-indigo-600",
  Cooking: "bg-orange-600",
  Woodcutting: "bg-emerald-800",
  Fletching: "bg-amber-600",
  Fishing: "bg-sky-600",
  Firemaking: "bg-orange-700",
  Crafting: "bg-yellow-800",
  Smithing: "bg-gray-500",
  Mining: "bg-stone-600",
  Herblore: "bg-green-500",
  Agility: "bg-teal-500",
  Thieving: "bg-purple-800",
  Slayer: "bg-zinc-800",
  Farming: "bg-lime-600",
  Runecraft: "bg-yellow-500",
  Hunter: "bg-orange-900",
  Construction: "bg-amber-900",
  Sailing: "bg-blue-400",
  Overall: "bg-yellow-600",
};


type StoredSettings = {
  methods: Record<string, number>;
  orderType: "efficient" | "xp";
  hoursPerDay: number;
  earnRate: number;
  mobileOnly: boolean;
};

export default function App() {
  const [rawData, setRawData] = useState<Skill[]>([]);
  const [levelOverrides, setLevelOverrides] = useState<Record<string, number>>({});
  const [editLevels, setEditLevels] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [orderType, setOrderType] = useState<"efficient" | "xp">("efficient");
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [earnRate, setEarnRate] = useState(DEFAULT_EARN_RATE);
  const [showMaxed, setShowMaxed] = useState(false);
  const [mobileOnly, setMobileOnly] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [tab, setTab] = useState<"dashboard" | "plan" | "now">("dashboard");
  const goalStore = useGoals();

  // Live HiScores with any manual level overrides applied (HiScores lag freshly-trained skills).
  const data = useMemo(() => applyLevelOverrides(rawData, levelOverrides), [rawData, levelOverrides]);
  const weekly = useWeekly(data);

  const LEVELS_KEY = "osrs-levels-fr3nchy";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEVELS_KEY);
      if (raw) setLevelOverrides(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const saveOverride = (skill: string, level: number | null) => {
    setLevelOverrides((prev) => {
      const next = { ...prev };
      if (level === null) delete next[skill];
      else next[skill] = level;
      try {
        localStorage.setItem(LEVELS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Load persisted settings (localStorage) once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<StoredSettings>;
        if (s.methods) setSelections(s.methods);
        if (s.orderType) setOrderType(s.orderType);
        if (typeof s.hoursPerDay === "number") setHoursPerDay(s.hoursPerDay);
        if (typeof s.earnRate === "number") setEarnRate(s.earnRate);
        if (typeof s.mobileOnly === "boolean") setMobileOnly(s.mobileOnly);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persist = (updates: Partial<StoredSettings>) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current: StoredSettings = raw
        ? JSON.parse(raw)
        : { methods: {}, orderType: "efficient", hoursPerDay: 4, earnRate: DEFAULT_EARN_RATE, mobileOnly: false };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...current, ...updates })
      );
    } catch {
      /* storage unavailable */
    }
  };

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/hiscores", { cache: "no-store" });
      const json = await response.json();
      if (!json || !json.skills) throw new Error("Player data not found");

      type ApiSkill = {
        name: string;
        rank?: string | number;
        level?: string | number;
        xp?: string | number;
      };

      const skills: Skill[] = Object.keys(TRAINING_METHODS).map((name) => {
        const skillData = (json.skills as ApiSkill[]).find((s) => s.name === name);

        if (name === "Sailing") {
          const xpNum = skillData
            ? Math.max(0, parseInt(String(skillData.xp)) || SAILING_FALLBACK_XP)
            : SAILING_FALLBACK_XP;
          const lvlNum = skillData ? parseInt(String(skillData.level)) || 87 : 87;
          return {
            name,
            rank: skillData ? parseInt(String(skillData.rank)) || -1 : -1,
            level: lvlNum,
            xp: xpNum,
            isMaxed: lvlNum >= 99,
            remainingXp: Math.max(0, XP_FOR_99 - xpNum),
          };
        }

        if (!skillData) {
          return { name, rank: -1, level: 1, xp: 0, isMaxed: false, remainingXp: XP_FOR_99 };
        }

        const xpNum = Math.max(0, parseInt(String(skillData.xp)) || 0);
        const lvlNum = parseInt(String(skillData.level)) || 1;
        return {
          name,
          rank: parseInt(String(skillData.rank)) || -1,
          level: lvlNum,
          xp: xpNum,
          isMaxed: lvlNum >= 99 || xpNum >= XP_FOR_99,
          remainingXp: Math.max(0, XP_FOR_99 - xpNum),
        };
      });
      setRawData(skills);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleMethodChange = (skillName: string, methodIndex: number) => {
    const updated = { ...selections, [skillName]: methodIndex };
    setSelections(updated);
    persist({ methods: updated });
  };

  const handleOrderChange = (type: "efficient" | "xp") => {
    setOrderType(type);
    persist({ orderType: type });
  };

  // Combat-linked maxing plan (HP free, Slayer overlaps the melee grind — no overcount).
  const maxPlan = useMemo(
    () => (data.length ? computeMaxPlan(data, selections, earnRate) : null),
    [data, selections, earnRate]
  );

  const dashboard = useMemo(() => {
    if (!maxPlan) return null;
    const xpToGo = maxPlan.lines.reduce((a, l) => a + l.remainingXp, 0);
    const needed = XP_FOR_99 * maxPlan.skillsRemaining || 1;
    return {
      totalHours: maxPlan.totalHours,
      totalGpChange: maxPlan.netGp,
      totalTrueCost: maxPlan.trueCost,
      bankroll: maxPlan.bankroll,
      skillsRemaining: maxPlan.skillsRemaining,
      xpToGo,
      overallPct: Math.max(0, Math.min(100, ((needed - xpToGo) / needed) * 100)),
      breakdown: maxPlan.lines.filter((l) => l.hours > 0),
    };
  }, [maxPlan]);

  const maxDate = useMemo(() => {
    if (!dashboard) return null;
    const daysRemaining = dashboard.totalHours / Math.max(0.1, hoursPerDay);
    const date = new Date();
    date.setDate(date.getDate() + daysRemaining);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      day: "numeric",
    });
  }, [dashboard, hoursPerDay]);

  const sortedVisibleSkills = useMemo(() => {
    const visible = data.filter((s) => {
      if (s.name === "Overall" || (!showMaxed && s.isMaxed)) return false;
      if (mobileOnly) {
        const ms = methodsFor(s.name);
        const sel = ms[selections[s.name] || 0] || ms[0];
        if (!platformsFor(sel).includes("mobile")) return false;
      }
      return true;
    });
    return visible.sort((a, b) => {
      if (orderType === "efficient") {
        const pA = EFFICIENT_PRIORITY[a.name] || 99;
        const pB = EFFICIENT_PRIORITY[b.name] || 99;
        if (pA !== pB) return pA - pB;
        return b.remainingXp - a.remainingXp;
      }
      const aIsCombat = COMBAT_AND_SLAYER.includes(a.name);
      const bIsCombat = COMBAT_AND_SLAYER.includes(b.name);
      if (aIsCombat && !bIsCombat) return 1;
      if (!aIsCombat && bIsCombat) return -1;
      return b.remainingXp - a.remainingXp;
    });
  }, [data, showMaxed, orderType, mobileOnly, selections]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8">
        <RefreshCw className="w-16 h-16 text-yellow-600 animate-spin mb-6" />
        <div className="space-y-2 text-center">
          <p className="text-white font-black text-xl tracking-tighter uppercase">
            Initializing Roadmap
          </p>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-pulse">
            Syncing {USERNAME} with Jagex...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-4 lg:p-10 font-sans selection:bg-yellow-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Nav Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-900/40 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                Max Cape Roadmap
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                  Active Session: {USERNAME}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-800/50 backdrop-blur-xl">
            <button
              onClick={() => setShowMaxed(!showMaxed)}
              className="p-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-400 hover:text-white border border-transparent hover:border-neutral-700"
            >
              {showMaxed ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Sync Live
            </button>
          </div>
        </header>

        {/* Tab nav */}
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
              onClick={() => setTab("plan")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === "plan" ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <ListChecks className="w-4 h-4" /> Plan
            </button>
            <button
              onClick={() => setTab("now")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === "now" ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Play className="w-4 h-4" /> Now
            </button>
          </div>
        </div>

        {tab === "plan" && (
          <Plan
            skills={data}
            hoursPerDay={hoursPerDay}
            goals={goalStore.goals}
            add={goalStore.add}
            update={goalStore.update}
            remove={goalStore.remove}
            setStatus={goalStore.setStatus}
            move={goalStore.move}
          />
        )}
        {tab === "now" && <SessionPlanner skills={data} />}

        {/* Dashboard Section */}
        {tab === "dashboard" && dashboard && (
          <NextUp skills={data} onPlan={() => setTab("now")} />
        )}

        {tab === "dashboard" && dashboard && (
          <section className="space-y-3">
            {/* Dense stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
              {[
                { label: "Time to max", value: `${Math.ceil(dashboard.totalHours)}h`, cls: "text-yellow-500" },
                { label: "Maxing date", value: maxDate ?? "—", cls: "text-white", small: true },
                { label: "Overall", value: `${dashboard.overallPct.toFixed(1)}%`, cls: "text-white" },
                { label: "XP to go", value: `${(dashboard.xpToGo / 1_000_000).toFixed(1)}M`, cls: "text-white" },
                { label: "Skills left", value: `${dashboard.skillsRemaining}`, cls: "text-white" },
                { label: "Real cost", value: `−${Math.abs(dashboard.totalTrueCost / 1_000_000).toFixed(0)}M`, cls: "text-red-500" },
                { label: "Bankroll", value: `−${(dashboard.bankroll / 1_000_000).toFixed(0)}M`, cls: "text-red-400" },
                {
                  label: `This week${weekly.source === "wom" ? " · WOM" : ""}`,
                  value: weekly.total > 0 ? `+${(weekly.total / 1000).toFixed(0)}k` : "—",
                  cls: weekly.total > 0 ? "text-green-500" : "text-neutral-600",
                },
              ].map((m) => (
                <div key={m.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl px-3 py-2.5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest truncate">{m.label}</p>
                  <p className={`font-black font-mono tracking-tighter leading-none mt-1.5 ${m.small ? "text-base" : "text-2xl"} ${m.cls}`}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Lower row: density · lists · controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Time density */}
              <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-600" /> Time density
                  </p>
                  <span className="text-[9px] font-black text-yellow-600 font-mono">{dashboard.overallPct.toFixed(0)}% to max</span>
                </div>
                <div className="w-full h-9 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800/50 flex shadow-inner relative group">
                  {dashboard.breakdown.map((s) => {
                    const percent = (s.hours / dashboard.totalHours) * 100;
                    if (percent < 0.1) return null;
                    return (
                      <div
                        key={s.name}
                        style={{ width: `${percent}%` }}
                        onMouseEnter={() => setHoveredSkill(s.name)}
                        onMouseLeave={() => setHoveredSkill(null)}
                        className={`${SKILL_COLORS[s.name] || "bg-zinc-600"} h-full transition-all hover:brightness-125 border-r border-neutral-950/20 last:border-0 cursor-help`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
                  {dashboard.breakdown.map((s) => {
                    const percent = (s.hours / dashboard.totalHours) * 100;
                    return (
                      <div
                        key={s.name}
                        className={`flex items-center justify-between px-1.5 py-1 rounded-lg transition-colors ${
                          hoveredSkill === s.name ? "bg-neutral-800" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SKILL_COLORS[s.name] || "bg-zinc-600"}`} />
                          <span className="text-[9px] font-bold text-neutral-400 uppercase truncate">{s.name}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-white shrink-0">{Math.round(percent)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Biggest grinds + nearest 99 */}
              <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Biggest grinds</p>
                  {dashboard.breakdown.slice(0, 4).map((s) => {
                    const max = dashboard.breakdown[0].hours || 1;
                    return (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="w-20 text-[10px] font-bold text-neutral-400 uppercase truncate">{s.name}</span>
                        <div className="flex-1 h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                          <div className={`h-full ${SKILL_COLORS[s.name] || "bg-zinc-600"}`} style={{ width: `${(s.hours / max) * 100}%` }} />
                        </div>
                        <span className="w-10 text-right text-[10px] font-mono text-neutral-500">{Math.ceil(s.hours)}h</span>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5 border-t border-neutral-800 pt-3">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Nearest 99 — quick wins</p>
                  {data
                    .filter((s) => s.name !== "Overall" && !s.isMaxed)
                    .sort((a, b) => b.xp - a.xp)
                    .slice(0, 4)
                    .map((s) => {
                      const pct = Math.min(100, (s.xp / XP_FOR_99) * 100);
                      return (
                        <div key={s.name} className="flex items-center gap-2">
                          <span className="w-20 text-[10px] font-bold text-neutral-400 uppercase truncate">{s.name}</span>
                          <div className="flex-1 h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-[10px] font-mono text-yellow-600">{Math.floor(pct)}%</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Controls */}
              <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5 flex flex-col justify-center gap-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <Hourglass className="w-3.5 h-3.5 text-neutral-400" /> Playtime
                    </p>
                    <span className="text-[10px] font-black text-white">{hoursPerDay}h / day</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="16"
                    step="0.5"
                    value={hoursPerDay}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setHoursPerDay(v);
                      persist({ hoursPerDay: v });
                    }}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <Coins className="w-3.5 h-3.5 text-neutral-400" /> GP/h · semi-afk
                    </p>
                    <span className="text-[10px] font-black text-white">
                      {earnRate === 0 ? "Off" : `${(earnRate / 1000000).toFixed(2)}M`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6000000"
                    step="250000"
                    value={earnRate}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setEarnRate(v);
                      persist({ earnRate: v });
                    }}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section Controls */}
        {tab === "dashboard" && (
        <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
          <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Target className="w-5 h-5 text-yellow-600" /> Active Skill Goals
          </h3>

          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => handleOrderChange("efficient")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                orderType === "efficient"
                  ? "bg-neutral-800 text-yellow-500 shadow-inner"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Zap className="w-3 h-3" /> Efficient Ordering
            </button>
            <button
              onClick={() => handleOrderChange("xp")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                orderType === "xp"
                  ? "bg-neutral-800 text-yellow-500 shadow-inner"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <ListOrdered className="w-3 h-3" /> XP Remaining
            </button>
          </div>

          <button
            onClick={() => {
              const v = !mobileOnly;
              setMobileOnly(v);
              persist({ mobileOnly: v });
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${
              mobileOnly
                ? "bg-green-600/15 text-green-500 border-green-700/40"
                : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300"
            }`}
          >
            <Smartphone className="w-3 h-3" /> Mobile only
          </button>

          <button
            onClick={() => setEditLevels((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${
              editLevels || Object.keys(levelOverrides).length > 0
                ? "bg-yellow-600/15 text-yellow-500 border-yellow-700/40"
                : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300"
            }`}
          >
            <Pencil className="w-3 h-3" /> Edit levels
            {Object.keys(levelOverrides).length > 0 && (
              <span className="font-mono">· {Object.keys(levelOverrides).length}</span>
            )}
          </button>
        </div>

        {editLevels && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-[1.5rem] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                Manual levels — override lagging HiScores
              </p>
              {Object.keys(levelOverrides).length > 0 && (
                <button
                  onClick={() => {
                    setLevelOverrides({});
                    try {
                      localStorage.removeItem(LEVELS_KEY);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="text-[9px] font-black text-neutral-500 hover:text-yellow-500 uppercase tracking-widest"
                >
                  Reset all to live
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {rawData
                .filter((s) => s.name !== "Overall")
                .map((s) => {
                  const ov = levelOverrides[s.name];
                  const overridden = ov !== undefined && ov !== s.level;
                  return (
                    <div
                      key={s.name}
                      className={`flex items-center gap-2 bg-neutral-950 border rounded-xl px-2.5 py-2 ${
                        overridden ? "border-yellow-700/40" : "border-neutral-800"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-neutral-400 uppercase truncate flex-1">
                        {s.name}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={ov ?? s.level}
                        onChange={(e) => {
                          const n = parseInt(e.target.value);
                          saveOverride(s.name, isNaN(n) ? null : Math.max(1, Math.min(99, n)));
                        }}
                        className="w-12 bg-neutral-900 border border-neutral-800 rounded-md px-1.5 py-1 text-xs font-mono font-black text-white text-center focus:outline-none focus:ring-1 focus:ring-yellow-600"
                      />
                      {overridden && (
                        <span className="text-[8px] text-neutral-600 font-mono" title={`Live: ${s.level}`}>
                          ·{s.level}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
            <p className="text-[10px] text-neutral-600">
              Levels back-fill XP from the OSRS table. Clears automatically when you set it back to the live value, or use Sync Live once HiScores catch up.
            </p>
          </div>
        )}

        <SkillTable
          skills={sortedVisibleSkills}
          selections={selections}
          onMethodChange={handleMethodChange}
          weekly={weekly.gains}
          earnRate={earnRate}
          byName={maxPlan?.byName ?? {}}
        />
        </>
        )}

        <footer className="pt-10 pb-6 text-center border-t border-neutral-900">
          <div className="flex justify-center items-center gap-6 opacity-30">
            <p className="text-[9px] font-black uppercase tracking-widest">
              Roadmap for {USERNAME}
            </p>
            <div className="w-1 h-1 rounded-full bg-neutral-700" />
            <p className="text-[9px] font-black uppercase tracking-widest">Max Cape Roadmap</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
