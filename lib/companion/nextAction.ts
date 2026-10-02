/**
 * Next Best Action: the knowledge base's personalized state machine (quest
 * gate -> learning -> income), picked for today. Pure; the UI adds the method
 * ranking and the Fletching nudge around it.
 */

import { LOGGED_HOURS_THRESHOLD } from "./sessions";
import type { MethodStats } from "./types";

export type ActionState = "QUEST_GATE" | "LEARNING" | "INCOME" | "REBUILD";

export interface NextAction {
  state: ActionState;
  title: string;
  detail: string;
}

/** Methods whose 10-hour logged rate ends the learning stage. */
const BASELINE_METHODS = ["toa", "doom"];

export function nextAction(input: {
  ownsTbow: boolean;
  dt2Complete: boolean;
  stats: MethodStats[];
  /** Saturday or Sunday, in the player's local time. */
  weekend: boolean;
  /** Name of the top-ranked method, for the income state. */
  topMethod: string | null;
}): NextAction {
  if (input.ownsTbow) {
    return {
      state: "REBUILD",
      title: "Rebuild the cash reserve",
      detail: "Get the reserve back to 40M first, then rebuy supporting gear by GP per hour gained per GP spent.",
    };
  }
  if (!input.dt2Complete) {
    return {
      state: "QUEST_GATE",
      title: "Complete Desert Treasure II",
      detail:
        "About 5 hours. Last quest blocker: unlocks four bosses and the Ring of Shadows, plus three 100k combat XP lamps (Defence by default).",
    };
  }
  const baselineSet = input.stats.some((s) => s.qualified && BASELINE_METHODS.includes(s.methodId));
  if (!baselineSet) {
    return input.weekend
      ? {
          state: "LEARNING",
          title: "Focused ToA or Doom repetitions",
          detail:
            "15 min setup, a 90-minute block on one objective, a short reset, then 90 to 150 minutes of the same method. Log the session at the end.",
        }
      : {
          state: "LEARNING",
          title: "ToA practice or a familiar GP method, plus Fletching",
          detail: `A 60 to 120 minute block. Learning ends once ToA or Doom has ${LOGGED_HOURS_THRESHOLD} logged hours.`,
        };
  }
  return {
    state: "INCOME",
    title: input.topMethod ? `Earn with ${input.topMethod}` : "Earn with your best logged method",
    detail: input.weekend
      ? "Weekend: long focused blocks on your best method; log each session."
      : "Weekday: one familiar trip or a 60 to 120 minute block, with Fletching in the downtime.",
  };
}
