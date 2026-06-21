// Shared training-method data + ranking helpers.
// Consumed by both the Roadmap dashboard (page.tsx) and the Game Plan tabs (Planning/FinalPlan).
//
// AFK intensity is the master attribute for this account: fr3nchy plays almost entirely on
// mobile (the iOS app), logging in/out constantly, so "how AFK is it" matters more than raw XP/h.
//   afk 1 = set-and-forget   2 = light attention   3 = active   4 = sweaty / tick-perfect
// Within each skill, methods are ordered most-AFK-first, so index 0 is the default pick.
//
// Rates/xpPerAction/afkTime for the AFK-skilling methods come from the OSRS wiki's
// "Guide:AFK Skilling Methods" table (Exp/AFK = xp per AFK cycle).

export type Afk = 1 | 2 | 3 | 4;

export type Method = {
  name: string;
  rate: number; // XP/h
  gp: number; // GP/h (negative = costs money)
  afk: Afk;
  tag?: "meta" | "best" | "great" | "good"; // editorial quality badge
  xpPerAction?: number; // wiki "Exp/AFK" — xp gained per AFK cycle
  afkTime?: string; // average AFK duration per cycle, e.g. "0:35"
  platforms?: Platform[]; // where it's playable; default = both (sweaty afk4 -> desktop only)
  setup?: { location: string; travelMins?: number }; // where you start + travel cost
  links?: { label: string; url: string }[]; // external resources (trackers, guides)
};

export type Platform = "desktop" | "mobile";

export type Skill = {
  name: string;
  rank: number;
  level: number;
  xp: number;
  isMaxed: boolean;
  remainingXp: number;
};

export const TRAINING_METHODS: Record<string, Method[]> = {
  Sailing: [
    // Real wiki data (was placeholder). fr3nchy is ~88 Sailing -> Merchant shipwreck (req 87) is meta.
    { name: "Merchant Shipwreck", rate: 85000, gp: 259528, afk: 3, tag: "meta", xpPerAction: 5667, afkTime: "4:00", setup: { location: "Anywhere on water" } },
    { name: "Crewmate-only Salvaging", rate: 30000, gp: 88235, afk: 1, tag: "good", xpPerAction: 15000, afkTime: "30:00", setup: { location: "Anywhere on water" } },
    { name: "Mercenary Shipwreck", rate: 70000, gp: 348618, afk: 3, xpPerAction: 3792, afkTime: "3:15", setup: { location: "Anywhere on water" } },
    { name: "Fremennik Shipwreck", rate: 80000, gp: 254625, afk: 3, xpPerAction: 4844, afkTime: "3:38", setup: { location: "Anywhere on water" } },
    { name: "Pirate Shipwreck", rate: 47000, gp: 232723, afk: 3, xpPerAction: 2063, afkTime: "2:38", setup: { location: "Anywhere on water" } },
  ],
  Woodcutting: [
    { name: "Ironwood Tree", rate: 100000, gp: 85544, afk: 2, tag: "meta", xpPerAction: 6667, afkTime: "4:00", setup: { location: "Bank 5 tiles away" } },
    { name: "Infected Root (Log Basket)", rate: 9100, gp: 246400, afk: 1, tag: "good", xpPerAction: 4550, afkTime: "30:00", setup: { location: "Specific tree", travelMins: 2 } },
    { name: "Rosewood Tree", rate: 85000, gp: 186800, afk: 2, xpPerAction: 6493, afkTime: "4:35", setup: { location: "Drumstick Isle", travelMins: 2 } },
    { name: "Redwood Tree", rate: 85000, gp: 189280, afk: 2, xpPerAction: 6233, afkTime: "4:24", setup: { location: "Woodcutting Guild", travelMins: 2 } },
    { name: "Camphor Tree", rate: 70000, gp: 308940, afk: 2, xpPerAction: 2333, afkTime: "2:00", setup: { location: "Anywhere" } },
  ],
  Fletching: [
    { name: "Unstrung Bows (Magic Longbow)", rate: 247050, gp: -43200, afk: 2, tag: "meta", xpPerAction: 2223, afkTime: "0:32", setup: { location: "Bank" } },
    { name: "Redwood Shields", rate: 193000, gp: -885856, afk: 2, xpPerAction: 2509, afkTime: "0:47", setup: { location: "Bank" } },
    { name: "Battlestaves", rate: 143000, gp: -334169, afk: 2, xpPerAction: 1954, afkTime: "0:49", setup: { location: "Bank" } },
    { name: "Bolt Tips (Diamond)", rate: 8400, gp: 702000, afk: 2, tag: "good", xpPerAction: 189, afkTime: "1:21", setup: { location: "Anywhere" } },
  ],
  Smithing: [
    // Platebodies = 5 bars. Adamant bar = 37.5 xp -> 187.5/plate; rune bar = 50 xp -> 250/plate.
    { name: "Rune Platebodies", rate: 250000, gp: 200000, afk: 2, tag: "meta", xpPerAction: 250, afkTime: "0:30", setup: { location: "Anvil + bank" } },
    { name: "Adamant Platebodies", rate: 215000, gp: 150000, afk: 2, tag: "good", xpPerAction: 187.5, afkTime: "0:30", setup: { location: "Anvil + bank" } },
    { name: "Giants' Foundry", rate: 200000, gp: 250000, afk: 2, setup: { location: "Foundry (Varrock)", travelMins: 1 } },
    { name: "Cannonballs (Double Mould)", rate: 30720, gp: 612000, afk: 3, xpPerAction: 529, afkTime: "1:02", setup: { location: "Furnace + bank" } },
    { name: "Gold Bars (BF/Goldsmith)", rate: 350000, gp: -300000, afk: 3, setup: { location: "Blast Furnace", travelMins: 1 } },
  ],
  Mining: [
    // Calcified rocks (Cam Torum, req 41) — 50k/h fully-AFK, beats MLM. fr3nchy also likes MLM.
    { name: "Calcified Rocks (Cam Torum)", rate: 50000, gp: 0, afk: 1, tag: "meta", xpPerAction: 1625, afkTime: "0:35", setup: { location: "Cam Torum", travelMins: 2 } },
    { name: "MLM (High Level)", rate: 54000, gp: 250000, afk: 1, tag: "good", setup: { location: "Motherlode Mine", travelMins: 1 } },
    { name: "Shooting Stars", rate: 31160, gp: 57633, afk: 1, xpPerAction: 3635, afkTime: "7:00", setup: { location: "Roaming — find a star" }, links: [{ label: "osrsportal tracker", url: "https://osrsportal.com/shooting-stars-tracker" }, { label: "07.gg tracker", url: "https://07.gg/trackers/shooting-star" }] },
    { name: "Gemstones (Relaxed)", rate: 55016, gp: 450000, afk: 2, setup: { location: "Shilo gem rocks", travelMins: 2 } },
    { name: "Amethyst Crystals", rate: 24000, gp: 322700, afk: 2, xpPerAction: 780, afkTime: "1:57", setup: { location: "Mining Guild", travelMins: 2 } },
    { name: "Nickel Rocks", rate: 22000, gp: 396630, afk: 2, xpPerAction: 306, afkTime: "0:50", setup: { location: "Cam Torum", travelMins: 2 } },
  ],
  Herblore: [
    { name: "Stackable Secondary Pots (Antivenom)", rate: 330000, gp: -3214750, afk: 2, tag: "meta", xpPerAction: 2842, afkTime: "0:31", setup: { location: "Bank" } },
    { name: "Aldarin Mixology", rate: 180000, gp: 300000, afk: 2, tag: "good", setup: { location: "Aldarin (Varlamore)", travelMins: 2 } },
    { name: "Making Tar (Irit)", rate: 170000, gp: -2894000, afk: 2, xpPerAction: 2219, afkTime: "0:47", setup: { location: "Bank" } },
    { name: "Auto-cleaning Herbs (Torstol)", rate: 45000, gp: 288000, afk: 2, xpPerAction: 425, afkTime: "0:34", setup: { location: "Bank" } },
  ],
  Hunter: [
    // Rainbow crabs (Crown Jewel, req 77 Hunter + 64 Sailing): 155k/h + ~690k gp, 216 xp/crab.
    { name: "Maniacal Monkeys", rate: 120000, gp: 9259, afk: 1, tag: "meta", xpPerAction: 833, afkTime: "0:25", setup: { location: "Kruk's Dungeon", travelMins: 3 } },
    { name: "Rainbow Crabs (Crown Jewel)", rate: 155000, gp: 690972, afk: 2, tag: "good", xpPerAction: 216, afkTime: "0:30", setup: { location: "The Crown Jewel", travelMins: 2 }, links: [{ label: "Wiki guide", url: "https://oldschool.runescape.wiki/w/Rainbow_crab_(Hunter)" }] },
    { name: "Quetzal Rumours", rate: 150000, gp: 800000, afk: 2, setup: { location: "Varlamore", travelMins: 2 } },
    { name: "Herbiboar", rate: 150000, gp: 400000, afk: 2, setup: { location: "Fossil Island", travelMins: 3 } },
  ],
  Construction: [
    { name: "Oak Dungeon Doors", rate: 450000, gp: -4000000, afk: 3, tag: "meta" },
    { name: "Mahogany Tables", rate: 900000, gp: -14000000, afk: 4 },
  ],
  Agility: [
    { name: "Ardougne Rooftop", rate: 62000, gp: 350000, afk: 2, tag: "meta" },
    { name: "Sepulchre", rate: 90000, gp: 2500000, afk: 4 },
  ],
  Thieving: [
    { name: "Ardy Knights", rate: 250000, gp: 300000, afk: 3, tag: "meta" },
    { name: "Pickpocketing Elves", rate: 450000, gp: 2800000, afk: 3 },
  ],
  Crafting: [
    { name: "Black D'hide Bodies", rate: 350000, gp: -2500000, afk: 2, tag: "meta" },
    { name: "Cutting Diamonds", rate: 400000, gp: -1500000, afk: 2 },
  ],
  Runecraft: [
    { name: "GotR", rate: 60000, gp: 150000, afk: 3, tag: "meta" },
    { name: "ZMI", rate: 45000, gp: 100000, afk: 3 },
    { name: "Lavas (Sweaty)", rate: 100000, gp: -100000, afk: 4 },
  ],
  Fishing: [
    { name: "Anglers", rate: 30000, gp: 350000, afk: 1, tag: "good" },
    { name: "Barbarian Fishing", rate: 110000, gp: 0, afk: 2, tag: "meta" },
    { name: "Tempoross", rate: 80000, gp: 150000, afk: 3 },
  ],
  Cooking: [
    { name: "Sharks", rate: 300000, gp: 100000, afk: 2, tag: "meta" },
    { name: "1t Karambwans", rate: 900000, gp: -200000, afk: 4 },
  ],
  Firemaking: [
    { name: "Wintertodt", rate: 280000, gp: 150000, afk: 3, tag: "meta" },
    { name: "Redwood Logs", rate: 450000, gp: -250000, afk: 2 },
  ],
  Farming: [
    { name: "Tree Runs", rate: 1000000, gp: -1500000, afk: 1, tag: "meta" },
    { name: "Tithe Farm", rate: 100000, gp: 0, afk: 3 },
  ],
  Attack: [
    { name: "Slayer (AFK Melee)", rate: 80000, gp: -200000, afk: 1, tag: "meta" },
    { name: "Gemstone Crab (AFK)", rate: 55000, gp: 0, afk: 1 },
    { name: "NMZ", rate: 80000, gp: -50000, afk: 2 },
  ],
  Strength: [
    { name: "Slayer (AFK Melee)", rate: 80000, gp: -200000, afk: 1, tag: "meta" },
    { name: "Gemstone Crab (AFK)", rate: 55000, gp: 0, afk: 1 },
    { name: "NMZ", rate: 80000, gp: -50000, afk: 2 },
  ],
  Defence: [
    // fr3nchy trains Defence on defensive mage.
    { name: "Magic Defensive", rate: 80000, gp: -100000, afk: 2, tag: "meta" },
    { name: "Slayer (AFK Melee)", rate: 80000, gp: -200000, afk: 1 },
    { name: "Gemstone Crab (AFK)", rate: 55000, gp: 0, afk: 1 },
  ],
  Hitpoints: [{ name: "Passive", rate: 25000, gp: 0, afk: 1, tag: "meta" }],
  Ranged: [
    { name: "NMZ", rate: 80000, gp: -50000, afk: 2, tag: "meta" },
    { name: "Chinchompas", rate: 500000, gp: -1500000, afk: 3 },
  ],
  Magic: [
    { name: "Plank Make", rate: 160000, gp: 150000, afk: 2, tag: "meta" },
    { name: "Barraging", rate: 250000, gp: -1200000, afk: 3 },
  ],
  Prayer: [
    { name: "Ensouled Heads", rate: 300000, gp: -2000000, afk: 2, tag: "meta" },
    { name: "Chaos Altar", rate: 600000, gp: -8000000, afk: 3 },
  ],
  Slayer: [
    { name: "Chill Melee", rate: 60000, gp: 500000, afk: 1, tag: "good" },
    { name: "Efficient Melee", rate: 80000, gp: -200000, afk: 2, tag: "meta" },
  ],
};

const FALLBACK_METHOD: Method = { name: "Default", rate: 50000, gp: 0, afk: 2 };

// Methods for a skill, always non-empty.
export function methodsFor(skill: string): Method[] {
  return TRAINING_METHODS[skill] ?? [FALLBACK_METHOD];
}

// The recommended pick for a skill: lowest AFK intensity, breaking ties toward a "meta" tag.
export function bestMethod(skill: string): Method {
  const tagRank: Record<NonNullable<Method["tag"]>, number> = {
    meta: 0,
    best: 1,
    great: 2,
    good: 3,
  };
  return [...methodsFor(skill)].sort((a, b) => {
    if (a.afk !== b.afk) return a.afk - b.afk;
    const at = a.tag ? tagRank[a.tag] : 99;
    const bt = b.tag ? tagRank[b.tag] : 99;
    return at - bt;
  })[0];
}

export type SkillSuggestion = { skill: Skill; method: Method; hours: number };

// Unmaxed skills ranked most-AFK-first (then fewest hours), each paired with its best AFK method.
export function rankSkillsByAfk(skills: Skill[]): SkillSuggestion[] {
  return skills
    .filter((s) => s.name !== "Overall" && !s.isMaxed)
    .map((skill) => {
      const method = bestMethod(skill.name);
      return { skill, method, hours: skill.remainingXp / (method.rate || 50000) };
    })
    .sort((a, b) => a.method.afk - b.method.afk || a.hours - b.hours);
}

// Hours to max a skill with a given method (rollup + card math share this).
export function hoursFor(skill: Skill, method: Method): number {
  return skill.remainingXp / (method.rate || 50000);
}

export function afkLabel(afk: Afk): string {
  return afk <= 1 ? "AFK" : afk === 2 ? "Light" : afk === 3 ? "Active" : "Sweaty";
}

// Which platforms a method is playable on. Default = both; sweaty (afk 4) is desktop-only.
export function platformsFor(method: Method): Platform[] {
  return method.platforms ?? (method.afk >= 4 ? ["desktop"] : ["desktop", "mobile"]);
}

export type Intensity = "chill" | "balanced" | "intense";
export type SessionFilters = { platform: Platform; intensity: Intensity; sessionMins: number };
export type SessionMatch = { skill: string; method: Method; sessionXp: number; effMins: number };

const INTENSITY_AFK: Record<Intensity, [number, number]> = {
  chill: [1, 2],
  balanced: [2, 3],
  intense: [3, 4],
};

// Rank what to train RIGHT NOW for the given context. XP-for-this-session aware: travel/setup
// time is subtracted from the session, so slow-to-start methods sink for short sessions.
export function planSession(skills: Skill[], f: SessionFilters): SessionMatch[] {
  const unmaxed = new Set(
    skills.filter((s) => s.name !== "Overall" && !s.isMaxed).map((s) => s.name)
  );
  const [lo, hi] = INTENSITY_AFK[f.intensity];
  const out: SessionMatch[] = [];
  for (const [skill, methods] of Object.entries(TRAINING_METHODS)) {
    if (!unmaxed.has(skill)) continue;
    for (const method of methods) {
      if (method.afk < lo || method.afk > hi) continue;
      if (!platformsFor(method).includes(f.platform)) continue;
      const travel = method.setup?.travelMins ?? 0;
      const effMins = Math.max(0, f.sessionMins - travel);
      out.push({ skill, method, effMins, sessionXp: (method.rate / 60) * effMins });
    }
  }
  return out.sort((a, b) => b.sessionXp - a.sessionXp);
}

// Tailwind classes for the AFK badge — green (low effort) → amber → red (sweaty).
export function afkBadgeClass(afk: Afk): string {
  return afk <= 2
    ? "bg-green-600/15 text-green-500 border-green-700/40"
    : afk === 3
    ? "bg-amber-600/15 text-amber-500 border-amber-700/40"
    : "bg-red-600/15 text-red-500 border-red-700/40";
}

export const ICON_MAP: Record<string, string> = {
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
