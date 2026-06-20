"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Clock,
  Zap,
  Target,
  RefreshCw,
  ChevronDown,
  Eye,
  EyeOff,
  Coins,
  ListOrdered,
  Calendar,
  Hourglass,
} from "lucide-react";

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

type Method = { name: string; rate: number; gp: number };

const TRAINING_METHODS: Record<string, Method[]> = {
  Sailing: [
    { name: "Shipwreck (Rune Hooks)", rate: 110000, gp: 250000 },
    { name: "The Gwenith Glide", rate: 200000, gp: -50000 },
    { name: "Cruising", rate: 50000, gp: 0 },
  ],
  Woodcutting: [
    { name: "Ironwoods (Mid)", rate: 70000, gp: 18000 },
    { name: "Ironwoods (Focused)", rate: 80000, gp: 20000 },
    { name: "Ironwoods (Lazy)", rate: 60000, gp: 15000 },
    { name: "2t Teaks", rate: 180000, gp: -10000 },
    { name: "Redwoods", rate: 65000, gp: 40000 },
  ],
  Fletching: [
    { name: "Dragon Javelins", rate: 600000, gp: -150000 },
    { name: "Broad Arrows", rate: 650000, gp: -1200000 },
    { name: "Stringing Magic Longs", rate: 250000, gp: 150000 },
    { name: "Darts (Sweaty)", rate: 1500000, gp: -3000000 },
  ],
  Smithing: [
    { name: "Addy Plates (Relaxed)", rate: 215000, gp: 150000 },
    { name: "Gold Bars (BF/Goldsmith)", rate: 350000, gp: -300000 },
    { name: "Addy Plates (Sweaty)", rate: 300000, gp: 220000 },
    { name: "Runite Bars (BF)", rate: 100000, gp: 1600000 },
    { name: "Giants' Foundry", rate: 200000, gp: 250000 },
  ],
  Mining: [
    { name: "Gemstones (Relaxed)", rate: 55016, gp: 450000 },
    { name: "Gemstones (Sweaty 3t)", rate: 80408, gp: 675000 },
    { name: "3t4g Granite", rate: 120000, gp: -20000 },
    { name: "Volcanic Mine", rate: 85000, gp: 100000 },
    { name: "MLM (High Level)", rate: 54000, gp: 250000 },
  ],
  Herblore: [
    { name: "Cost Efficient Pots", rate: 250000, gp: -1200000 },
    { name: "Super Combats", rate: 320000, gp: -1800000 },
    { name: "Prayer Potions", rate: 220000, gp: -800000 },
    { name: "Aldarin Mixology", rate: 180000, gp: 300000 },
    { name: "Sara Brews", rate: 350000, gp: -4500000 },
  ],
  Hunter: [
    { name: "Quetzal Rumours", rate: 150000, gp: 800000 },
    { name: "Red Chins", rate: 160000, gp: 800000 },
    { name: "Rainbow Crabs", rate: 90000, gp: 100000 },
    { name: "Mechanical Monkeys", rate: 100000, gp: 0 },
    { name: "Black Chins", rate: 200000, gp: 1800000 },
    { name: "Herbiboar", rate: 150000, gp: 400000 },
  ],
  Construction: [
    { name: "Mahogany Tables", rate: 900000, gp: -14000000 },
    { name: "Oak Dungeon Doors", rate: 450000, gp: -4000000 },
  ],
  Agility: [
    { name: "Sepulchre", rate: 90000, gp: 2500000 },
    { name: "Ardougne Rooftop", rate: 62000, gp: 350000 },
  ],
  Thieving: [
    { name: "Pickpocketing Elves", rate: 450000, gp: 2800000 },
    { name: "Ardy Knights", rate: 250000, gp: 300000 },
  ],
  Crafting: [
    { name: "Cutting Diamonds", rate: 400000, gp: -1500000 },
    { name: "Black D'hide Bodies", rate: 350000, gp: -2500000 },
  ],
  Runecraft: [
    { name: "Lavas (Sweaty)", rate: 100000, gp: -100000 },
    { name: "GotR", rate: 60000, gp: 150000 },
    { name: "ZMI", rate: 45000, gp: 100000 },
  ],
  Fishing: [
    { name: "Barbarian Fishing", rate: 110000, gp: 0 },
    { name: "Tempoross", rate: 80000, gp: 150000 },
    { name: "Anglers", rate: 30000, gp: 350000 },
  ],
  Cooking: [
    { name: "1t Karambwans", rate: 900000, gp: -200000 },
    { name: "Sharks", rate: 300000, gp: 100000 },
  ],
  Firemaking: [
    { name: "Redwood Logs", rate: 450000, gp: -250000 },
    { name: "Wintertodt", rate: 280000, gp: 150000 },
  ],
  Farming: [
    { name: "Tree Runs", rate: 1000000, gp: -1500000 },
    { name: "Tithe Farm", rate: 100000, gp: 0 },
  ],
  Attack: [{ name: "Slayer/Combat", rate: 80000, gp: 100000 }],
  Strength: [{ name: "Slayer/Combat", rate: 80000, gp: 100000 }],
  Defence: [{ name: "Slayer/Combat", rate: 80000, gp: 100000 }],
  Hitpoints: [{ name: "Passive", rate: 25000, gp: 0 }],
  Ranged: [
    { name: "Chinchompas", rate: 500000, gp: -1500000 },
    { name: "NMZ", rate: 80000, gp: -50000 },
  ],
  Magic: [
    { name: "Barraging", rate: 250000, gp: -1200000 },
    { name: "Plank Make", rate: 160000, gp: 150000 },
  ],
  Prayer: [
    { name: "Chaos Altar", rate: 600000, gp: -8000000 },
    { name: "Ensouled Heads", rate: 300000, gp: -2000000 },
  ],
  Slayer: [
    { name: "Efficient", rate: 60000, gp: -200000 },
    { name: "Chilled", rate: 30000, gp: 500000 },
  ],
};

const ICON_MAP: Record<string, string> = {
  Attack: "⚔️",
  Defence: "🛡️",
  Strength: "💪",
  Hitpoints: "❤️",
  Ranged: "🏹",
  Prayer: "✨",
  Magic: "🔮",
  Cooking: "🍳",
  Woodcutting: "🪓",
  Fletching: "🏹",
  Fishing: "🎣",
  Firemaking: "🔥",
  Crafting: "✂️",
  Smithing: "🔨",
  Mining: "⛏️",
  Herblore: "🧪",
  Agility: "🏃",
  Thieving: "🧤",
  Slayer: "💀",
  Farming: "🌱",
  Runecraft: "🌀",
  Hunter: "🐾",
  Construction: "🏠",
  Sailing: "⛵",
  Overall: "🏆",
};

const SkillIcon = ({ name }: { name: string }) => (
  <span className="text-lg mr-2">{ICON_MAP[name] || "❓"}</span>
);

type Skill = {
  name: string;
  rank: number;
  level: number;
  xp: number;
  isMaxed: boolean;
  remainingXp: number;
};

type StoredSettings = {
  methods: Record<string, number>;
  orderType: "efficient" | "xp";
  hoursPerDay: number;
};

export default function App() {
  const [data, setData] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [orderType, setOrderType] = useState<"efficient" | "xp">("efficient");
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [showMaxed, setShowMaxed] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  // Load persisted settings (localStorage) once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<StoredSettings>;
        if (s.methods) setSelections(s.methods);
        if (s.orderType) setOrderType(s.orderType);
        if (typeof s.hoursPerDay === "number") setHoursPerDay(s.hoursPerDay);
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
        : { methods: {}, orderType: "efficient", hoursPerDay: 4 };
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
      setData(skills);
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

  const dashboard = useMemo(() => {
    if (!data.length) return null;
    const activeSkills = data.filter((s) => s.name !== "Overall" && !s.isMaxed);
    let totalHours = 0;
    let totalGpChange = 0;
    const breakdown = activeSkills.map((s) => {
      const methods = TRAINING_METHODS[s.name] || [{ name: "Default", rate: 50000, gp: 0 }];
      const selectedIdx = selections[s.name] || 0;
      const method = methods[selectedIdx] || methods[0];
      const hours = s.remainingXp / (method.rate || 50000);
      totalHours += hours;
      totalGpChange += hours * method.gp;
      return {
        name: s.name,
        hours: isNaN(hours) ? 0 : hours,
        remainingXp: s.remainingXp,
        methodName: method.name,
        gpPerHour: method.gp,
        xpPerHour: method.rate,
      };
    });
    return {
      totalHours: isNaN(totalHours) ? 0 : totalHours,
      totalGpChange: isNaN(totalGpChange) ? 0 : totalGpChange,
      skillsRemaining: activeSkills.length,
      breakdown: breakdown.sort((a, b) => b.hours - a.hours),
    };
  }, [data, selections]);

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
    const visible = data.filter((s) => s.name !== "Overall" && (showMaxed || !s.isMaxed));
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
  }, [data, showMaxed, orderType]);

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
      <div className="max-w-7xl mx-auto space-y-8">
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

        {/* Dashboard Section */}
        {dashboard && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-600/10 blur-[80px] rounded-full" />
              <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-yellow-500" /> Estimated Time to Max
                  </p>
                  <h2 className="text-7xl font-black text-white font-mono tracking-tighter leading-none">
                    {Math.ceil(dashboard.totalHours)}
                    <span className="text-xl text-neutral-500 ml-2">h</span>
                  </h2>
                </div>
                <div className="pt-3 border-t border-neutral-800 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                      Maxing Date
                    </p>
                    <p className="text-lg font-bold text-yellow-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-50" /> {maxDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                      XP to 99
                    </p>
                    <p className="text-lg font-bold text-white font-mono">
                      {(
                        dashboard.breakdown.reduce((a, b) => a + b.remainingXp, 0) / 1000000
                      ).toFixed(1)}
                      M
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-6 flex flex-col justify-between hover:border-yellow-600/30 transition-colors">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                    Financial Impact
                  </p>
                  <div className="p-1.5 bg-neutral-950 rounded-lg">
                    <Coins className="w-3.5 h-3.5 text-yellow-600" />
                  </div>
                </div>
                <div>
                  <h3
                    className={`text-3xl font-black font-mono tracking-tighter leading-none ${
                      dashboard.totalGpChange >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {dashboard.totalGpChange >= 0 ? "+" : ""}
                    {Math.floor(dashboard.totalGpChange / 1000000).toLocaleString()}M
                  </h3>
                  <p className="text-neutral-500 text-[10px] mt-1 font-medium uppercase">
                    Net profit at 99
                  </p>
                </div>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-6 flex flex-col justify-between group cursor-pointer overflow-hidden relative">
                <div className="absolute inset-0 bg-yellow-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="relative z-10 flex justify-between items-start">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                    Efficiency Goal
                  </p>
                  <div className="p-1.5 bg-neutral-950 rounded-lg">
                    <Target className="w-3.5 h-3.5 text-yellow-600" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black font-mono tracking-tighter leading-none text-white">
                    {dashboard.skillsRemaining}
                  </h3>
                  <p className="text-neutral-500 text-[10px] mt-1 font-medium uppercase">
                    Skills remaining
                  </p>
                </div>
              </div>
              <div className="col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-6 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Hourglass className="w-3.5 h-3.5 text-neutral-400" /> Playtime Density
                  </p>
                  <span className="text-[10px] font-black text-white">{hoursPerDay}h / Day</span>
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
            </div>

            <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-6 overflow-hidden flex flex-col">
              <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-600" /> Time Density Visualizer
              </p>
              <div className="space-y-4 flex-grow flex flex-col">
                <div className="w-full h-10 bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800/50 flex shadow-inner relative group">
                  {dashboard.breakdown.map((s) => {
                    const percent = (s.hours / dashboard.totalHours) * 100;
                    if (percent < 0.1) return null;
                    return (
                      <div
                        key={s.name}
                        style={{ width: `${percent}%` }}
                        onMouseEnter={() => setHoveredSkill(s.name)}
                        onMouseLeave={() => setHoveredSkill(null)}
                        className={`${
                          SKILL_COLORS[s.name] || "bg-zinc-600"
                        } h-full transition-all hover:scale-x-105 hover:brightness-125 border-r border-neutral-950/20 last:border-0 cursor-help`}
                      />
                    );
                  })}
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {dashboard.breakdown.map((s) => {
                      const percent = (s.hours / dashboard.totalHours) * 100;
                      const isHovered = hoveredSkill === s.name;
                      return (
                        <div
                          key={s.name}
                          className={`flex items-center justify-between p-1.5 rounded-lg transition-all ${
                            isHovered ? "bg-neutral-800 scale-105" : "bg-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <div
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                SKILL_COLORS[s.name] || "bg-zinc-600"
                              }`}
                            />
                            <span className="text-[9px] font-bold text-neutral-400 uppercase truncate">
                              {s.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-mono font-bold text-white">
                              {Math.round(percent)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section Controls */}
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
        </div>

        {/* Skill Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedVisibleSkills.map((skill) => {
            const methods = TRAINING_METHODS[skill.name] || [
              { name: "Default", rate: 50000, gp: 0 },
            ];
            const selectedIdx = selections[skill.name] || 0;
            const selectedMethod = methods[selectedIdx] || methods[0];
            const hoursToMax = skill.remainingXp / selectedMethod.rate;
            const revenueAtMax = hoursToMax * selectedMethod.gp;
            const progressTo99 = (skill.xp / XP_FOR_99) * 100;
            const progressTo92 = (skill.xp / XP_FOR_92) * 100;

            return (
              <div
                key={skill.name}
                className={`group relative p-5 rounded-[2rem] border transition-all duration-300 ${
                  skill.isMaxed
                    ? "bg-neutral-900/20 border-green-900/10 opacity-40"
                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:shadow-xl"
                }`}
              >
                {!skill.isMaxed && skill.xp > XP_FOR_92 && (
                  <div className="absolute inset-0 bg-yellow-600/5 rounded-[2rem] animate-pulse pointer-events-none" />
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl border border-neutral-800 flex items-center justify-center transition-colors group-hover:bg-neutral-950 ${
                        skill.isMaxed
                          ? "bg-green-900/20 border-green-900/30"
                          : "bg-neutral-950/50"
                      }`}
                    >
                      <SkillIcon name={skill.name} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tighter leading-none mb-1">
                        {skill.name}
                      </p>
                      <p className="text-[9px] text-neutral-500 font-mono tracking-widest">
                        {(skill.xp || 0).toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-black font-mono leading-none ${
                        skill.isMaxed ? "text-green-500" : "text-white"
                      }`}
                    >
                      {skill.level}
                    </p>
                  </div>
                </div>

                {!skill.isMaxed && (
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-end px-1">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                          99 Progress
                        </p>
                        <p className="text-[9px] font-mono font-bold text-yellow-600">
                          {Math.floor(progressTo99)}%
                        </p>
                      </div>
                      <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-neutral-800/50">
                        <div
                          className="bg-gradient-to-r from-yellow-700 to-yellow-400 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, progressTo99)}%` }}
                        />
                      </div>
                      {skill.xp < XP_FOR_92 && (
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[8px] font-black text-neutral-700 uppercase italic leading-none">
                            Halfway mark
                          </p>
                          <div className="w-20 bg-neutral-950 h-0.5 rounded-full overflow-hidden">
                            <div
                              className="bg-neutral-700 h-full"
                              style={{ width: `${Math.min(100, progressTo92)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-neutral-950/40 p-2.5 rounded-2xl border border-neutral-800/50 text-center">
                        <p className="text-[7px] text-neutral-600 font-black uppercase mb-0.5">
                          Remaining
                        </p>
                        <p className="text-sm font-mono font-black text-yellow-600">
                          {Math.ceil(hoursToMax)}h
                        </p>
                      </div>
                      <div className="bg-neutral-950/40 p-2.5 rounded-2xl border border-neutral-800/50 text-center">
                        <p className="text-[7px] text-neutral-600 font-black uppercase mb-0.5">
                          Return
                        </p>
                        <p
                          className={`text-sm font-mono font-black ${
                            revenueAtMax >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {revenueAtMax >= 0 ? "+" : ""}
                          {Math.abs(revenueAtMax) >= 1000000
                            ? `${(revenueAtMax / 1000000).toFixed(1)}M`
                            : `${(revenueAtMax / 1000).toFixed(0)}k`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex flex-col">
                          <label className="text-[7px] font-black text-neutral-600 uppercase tracking-widest leading-none">
                            Strategy
                          </label>
                          <span className="text-[9px] font-mono font-black text-neutral-400">
                            {(selectedMethod.rate / 1000).toFixed(0)}k XP/h
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-mono font-black ${
                            selectedMethod.gp >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {selectedMethod.gp >= 0 ? "+" : ""}
                          {(selectedMethod.gp / 1000).toFixed(0)}k GP/h
                        </span>
                      </div>
                      <div className="relative">
                        <select
                          value={selectedIdx}
                          onChange={(e) =>
                            handleMethodChange(skill.name, parseInt(e.target.value))
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-[10px] font-bold text-neutral-300 focus:outline-none focus:ring-1 focus:ring-yellow-600 appearance-none cursor-pointer"
                        >
                          {methods.map((m, idx) => (
                            <option key={idx} value={idx}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-3 h-3 text-neutral-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
