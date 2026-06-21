// Shared training-method data + ranking helpers.
// Consumed by both the Roadmap dashboard (page.tsx) and the Game Plan tab (GamePlan.tsx).
//
// AFK intensity is the master attribute for this account: fr3nchy plays almost entirely on
// mobile, logging in/out constantly, so "how AFK is it" matters more than raw XP/h.
//   afk 1 = set-and-forget   2 = light attention   3 = active   4 = sweaty / tick-perfect
// Within each skill, methods are ordered most-AFK-first, so index 0 is the default pick.

export type Afk = 1 | 2 | 3 | 4;

export type Method = {
  name: string;
  rate: number; // XP/h
  gp: number; // GP/h (negative = costs money)
  afk: Afk;
  tag?: "meta" | "best" | "great" | "good"; // editorial quality badge
};

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
    // NOTE: Sailing is brand-new content — these rates/GP are best-guess placeholders.
    // fr3nchy hasn't researched the meta yet; edit once real numbers are known.
    { name: "Merchant Salvage (AFK)", rate: 90000, gp: 200000, afk: 2, tag: "meta" },
    { name: "Shipwreck (Rune Hooks)", rate: 110000, gp: 250000, afk: 2 },
    { name: "Cruising", rate: 50000, gp: 0, afk: 1 },
    { name: "The Gwenith Glide", rate: 200000, gp: -50000, afk: 3 },
  ],
  Woodcutting: [
    { name: "Ironwoods (Lazy)", rate: 60000, gp: 15000, afk: 1, tag: "meta" },
    { name: "Ironwoods (Mid)", rate: 70000, gp: 18000, afk: 2 },
    { name: "Redwoods", rate: 65000, gp: 40000, afk: 2, tag: "good" },
    { name: "Ironwoods (Focused)", rate: 80000, gp: 20000, afk: 3 },
    { name: "2t Teaks", rate: 180000, gp: -10000, afk: 4 },
  ],
  Fletching: [
    { name: "Stringing Magic Longs", rate: 250000, gp: 150000, afk: 2, tag: "meta" },
    { name: "Dragon Javelins", rate: 600000, gp: -150000, afk: 3 },
    { name: "Broad Arrows", rate: 650000, gp: -1200000, afk: 3 },
    { name: "Darts (Sweaty)", rate: 1500000, gp: -3000000, afk: 4 },
  ],
  Smithing: [
    { name: "Addy Plates (Relaxed)", rate: 215000, gp: 150000, afk: 2, tag: "meta" },
    { name: "Giants' Foundry", rate: 200000, gp: 250000, afk: 2, tag: "good" },
    { name: "Runite Bars (BF)", rate: 100000, gp: 1600000, afk: 2 },
    { name: "Addy Plates (Sweaty)", rate: 300000, gp: 220000, afk: 3 },
    { name: "Gold Bars (BF/Goldsmith)", rate: 350000, gp: -300000, afk: 3 },
  ],
  Mining: [
    // fr3nchy: "more likely to do MLM since it's more afk".
    { name: "MLM (High Level)", rate: 54000, gp: 250000, afk: 1, tag: "meta" },
    { name: "Gemstones (Relaxed)", rate: 55016, gp: 450000, afk: 2, tag: "good" },
    { name: "Gemstones (Sweaty 3t)", rate: 80408, gp: 675000, afk: 4 },
    { name: "Volcanic Mine", rate: 85000, gp: 100000, afk: 3 },
    { name: "3t4g Granite", rate: 120000, gp: -20000, afk: 4 },
  ],
  Herblore: [
    { name: "Aldarin Mixology", rate: 180000, gp: 300000, afk: 2, tag: "meta" },
    { name: "Cost Efficient Pots", rate: 250000, gp: -1200000, afk: 2 },
    { name: "Prayer Potions", rate: 220000, gp: -800000, afk: 3 },
    { name: "Super Combats", rate: 320000, gp: -1800000, afk: 4 },
    { name: "Sara Brews", rate: 350000, gp: -4500000, afk: 4 },
  ],
  Hunter: [
    // Black Chins removed — wilderness PvP risk, fr3nchy won't use it.
    { name: "Quetzal Rumours", rate: 150000, gp: 800000, afk: 2, tag: "meta" },
    { name: "Herbiboar", rate: 150000, gp: 400000, afk: 2, tag: "good" },
    { name: "Rainbow Crabs", rate: 90000, gp: 100000, afk: 2 },
    { name: "Mechanical Monkeys", rate: 100000, gp: 0, afk: 2 },
    { name: "Red Chins", rate: 160000, gp: 800000, afk: 3 },
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

export function afkLabel(afk: Afk): string {
  return afk <= 1 ? "AFK" : afk === 2 ? "Light" : afk === 3 ? "Active" : "Sweaty";
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
