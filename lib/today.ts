/**
 * Today: one suggestion for the time you have, in the mode you're in.
 * Pure; the Today card gathers the inputs on either page.
 *
 * Time blocks follow the knowledge base's operating model: under 30 minutes
 * is GE and short loops, 30-60 one familiar trip, 60+ a focused block.
 */

import type { PvmMethod } from "./companion/methods";
import type { RankedMethod } from "./companion/sessions";
import type { NextMilestone } from "./maxOrder";

export type TodayMode = "maxing" | "gp" | "bossing";
export const TODAY_MODES: { id: TodayMode; label: string }[] = [
  { id: "maxing", label: "Grind maxing" },
  { id: "gp", label: "Earn GP" },
  { id: "bossing", label: "Bossing / CAs" },
];
export const TODAY_MINUTES = [15, 30, 60, 120] as const;

export const CA_TIERS = ["None", "Easy", "Medium", "Hard", "Elite", "Master", "Grandmaster"] as const;
export type CaTier = (typeof CA_TIERS)[number];

export interface TodayInput {
  mode: TodayMode;
  minutes: number;
  /** Next step of the maxing order, or null when done / unknown. */
  milestone: NextMilestone | null;
  /** The roadmap's selected method for the milestone's skill. */
  milestoneMethod: { name: string; rate: number } | null;
  /** True while committed Fletching stock is still waiting to be fletched. */
  fletchingStockLeft: boolean;
  dt2Complete: boolean;
  ranked: RankedMethod[];
  lowAttention: PvmMethod[];
  weekend: boolean;
  caTier: CaTier;
  caTarget: CaTier;
}

export interface TodaySuggestion {
  title: string;
  detail: string;
  /** A side task that costs no extra time. */
  alongside?: string;
}

const FLETCH_ALONGSIDE = "Fletch amethyst arrows while you walk, bank or wait.";

export function suggestToday(i: TodayInput): TodaySuggestion {
  const alongside = i.fletchingStockLeft ? FLETCH_ALONGSIDE : undefined;

  if (i.mode === "maxing") {
    if (!i.milestone) {
      return { title: "Your maxing order is done", detail: "Pick the closest 99 on the roadmap." };
    }
    const { milestone, xpToGo } = i.milestone;
    const xp = i.milestoneMethod ? Math.round((i.milestoneMethod.rate * i.minutes) / 60) : null;
    const pct = xp !== null && xpToGo > 0 ? Math.min(100, (xp / xpToGo) * 100) : null;
    return {
      title: `${milestone.skill} → ${milestone.level}`,
      detail:
        `${milestone.how}.` +
        (i.milestoneMethod && xp !== null
          ? ` ${i.milestoneMethod.name}: about ${Math.round(xp / 1000).toLocaleString("en-US")}k XP in ${i.minutes} min` +
            (pct !== null ? ` (${pct < 1 ? "<1" : Math.round(pct)}% of this step).` : ".")
          : ""),
      alongside: milestone.skill === "Fletching" ? undefined : alongside,
    };
  }

  if (i.mode === "gp") {
    if (i.minutes < 30) {
      return {
        title: "Collect and relist GE offers",
        detail: "Under 30 minutes: GE offers, a birdhouse run or another short loop. Set up the next session.",
      };
    }
    const easy = [...i.lowAttention].sort((a, b) => (b.wikiModel?.gpPerHour ?? 0) - (a.wikiModel?.gpPerHour ?? 0))[0];
    if (i.minutes < 60 && easy) {
      return {
        title: easy.name,
        detail: `One low-attention trip. ${easy.note}`,
        alongside,
      };
    }
    const top = i.ranked[0];
    return top
      ? {
          title: top.method.name,
          detail:
            top.source === "logged"
              ? "Your best logged rate. One focused block."
              : top.source === "research"
                ? "Best rate from your research. One focused block."
              : `Best planning rate right now. ${top.method.note}`,
          alongside,
        }
      : { title: "Pick a familiar money maker", detail: "No rated methods yet." };
  }

  // Bossing / combat achievements.
  if (!i.dt2Complete) {
    return {
      title: i.minutes >= 60 ? "Desert Treasure II" : "Prep for Desert Treasure II",
      detail:
        i.minutes >= 60
          ? "About 5 hours in total. Last quest blocker: four bosses, the Ring of Shadows and three combat lamps."
          : "Short block: gear and supplies for the next DT2 boss, or one familiar boss trip.",
    };
  }
  const ca =
    i.caTarget !== "None" && CA_TIERS.indexOf(i.caTarget) > CA_TIERS.indexOf(i.caTier)
      ? ` Pick tasks toward ${i.caTarget} combat achievements.`
      : "";
  if (i.minutes >= 90 || (i.weekend && i.minutes >= 60)) {
    return {
      title: "Focused ToA or Doom repetitions",
      detail: `One objective for the whole block; it builds the rate the T-bow plan needs.${ca}`,
    };
  }
  return {
    title: "One familiar boss trip",
    detail: `Vorkath or Zulrah-length trips fit short blocks.${ca}`,
    alongside,
  };
}

/**
 * Mode to open on: maxing unless it's ahead of its share of the week so far
 * and bossing is behind its own.
 */
export function defaultMode(week: {
  maxingHours: number | null;
  bossingHours: number | null;
  maxingTarget: number;
  pvmTarget: number;
  /** 0-1: how far through the week we are. */
  elapsed: number;
}): TodayMode {
  if (week.maxingHours === null || week.bossingHours === null) return "maxing";
  const maxingDue = week.maxingTarget * week.elapsed;
  const pvmDue = week.pvmTarget * week.elapsed;
  return week.maxingHours >= maxingDue && week.bossingHours < pvmDue ? "bossing" : "maxing";
}
