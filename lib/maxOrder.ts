/**
 * fr3nchy's maxing order: the milestones to hit, in sequence, and how to
 * train each. "Do this next" on the roadmap and the maxing step in the
 * companion's Next best action both read the first one not yet reached.
 */

import { xpForLevel } from "@/app/skills";

export interface Milestone {
  skill: string;
  level: number;
  /** How to train it, in the player's own words. */
  how: string;
}

export const MAX_ORDER: Milestone[] = [
  { skill: "Slayer", level: 99, how: "Slayer tasks" },
  { skill: "Hunter", level: 98, how: "Hunter Rumours, Herbiboar or Chinchompas" },
  { skill: "Mining", level: 97, how: "Gem rocks, Volcanic Mine or Zalcano" },
  { skill: "Sailing", level: 98, how: "Salvaging" },
  { skill: "Fletching", level: 98, how: "Amethyst arrows and broad bolts from your stock" },
  { skill: "Sailing", level: 99, how: "Salvaging" },
  { skill: "Hunter", level: 99, how: "Hunter Rumours, Herbiboar or Chinchompas" },
  { skill: "Mining", level: 99, how: "Gem rocks, Volcanic Mine or Zalcano" },
  { skill: "Fletching", level: 99, how: "Amethyst arrows and broad bolts from your stock" },
];

export interface NextMilestone {
  milestone: Milestone;
  /** 0-based position in MAX_ORDER. */
  index: number;
  currentXp: number;
  xpToGo: number;
}

/**
 * The first milestone whose target XP isn't reached yet, or null when the
 * whole order is done. A skill missing from `xpBySkill` counts as 0 XP.
 */
export function nextMilestone(xpBySkill: Record<string, number>, order: Milestone[] = MAX_ORDER): NextMilestone | null {
  for (let index = 0; index < order.length; index++) {
    const milestone = order[index];
    const currentXp = Math.max(0, xpBySkill[milestone.skill] ?? 0);
    const target = xpForLevel(milestone.level);
    if (currentXp < target) return { milestone, index, currentXp, xpToGo: target - currentXp };
  }
  return null;
}

/** XP per skill from the Jagex HiScores JSON ({ skills: [{ name, xp }] }). */
export function xpFromHiscores(hiscores: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof hiscores !== "object" || hiscores === null) return out;
  const skills = (hiscores as { skills?: unknown }).skills;
  if (!Array.isArray(skills)) return out;
  for (const s of skills) {
    if (typeof s !== "object" || s === null) continue;
    const { name, xp } = s as { name?: unknown; xp?: unknown };
    if (typeof name === "string" && typeof xp === "number" && Number.isFinite(xp) && xp >= 0) out[name] = xp;
  }
  return out;
}
