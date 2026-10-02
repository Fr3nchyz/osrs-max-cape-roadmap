/**
 * PvM methods the companion can log and rank. Planning ranges come from the
 * knowledge base's "Personalized PvM Learning Ladder" (GP per focused hour);
 * methods it gives no figure for are ranked only once you have logged them.
 */

export interface PvmMethod {
  id: string;
  name: string;
  wilderness: boolean;
  /** Only available after Desert Treasure II. */
  requiresDt2: boolean;
  /** [low, high] planning range while learning; null = no planning figure. */
  learner: [number, number] | null;
  /** [low, high] once competent; null = no planning figure. */
  competent: [number, number] | null;
  note: string;
  /** Needs little attention: fits low-energy or mobile blocks. */
  lowAttention?: boolean;
  /** OSRS Wiki money-making guide figure (GP/hour) and what it assumes; reference only, never ranked. */
  wikiModel?: { gpPerHour: number; assumes: string; checked: string };
}

const M = 1_000_000;

export const PVM_METHODS: PvmMethod[] = [
  {
    id: "toa",
    name: "Tombs of Amascut",
    wilderness: false,
    requiresDt2: false,
    learner: [1.5 * M, 2.5 * M],
    competent: [3 * M, 4 * M],
    note: "Raise invocation only after three clean completions in a row.",
  },
  {
    id: "doom",
    name: "Doom of Mokhaiotl",
    wilderness: false,
    requiresDt2: false,
    learner: [2.5 * M, 5 * M],
    competent: [6 * M, 8 * M],
    note: "Learn the early delves in weekend blocks; strongest T-bow synergy.",
  },
  {
    id: "maggot-king",
    name: "Maggot King (ranged)",
    wilderness: false,
    requiresDt2: false,
    learner: [3.5 * M, 5.5 * M],
    competent: [6.5 * M, 8 * M],
    note: "Run a 50-kill sample first; rare-heavy, so don't sell gear on its headline rate.",
  },
  {
    id: "yama",
    name: "Yama",
    wilderness: false,
    requiresDt2: false,
    // The knowledge base's learner range starts below zero; 0 keeps it last.
    learner: [0, 3 * M],
    competent: [4 * M, 6 * M],
    note: "Deferred until ToA and Doom are stable; learner runs can lose money.",
  },
  {
    id: "vorkath",
    name: "Vorkath",
    wilderness: false,
    requiresDt2: false,
    learner: [3.2 * M, 3.8 * M],
    competent: [3.8 * M, 4.2 * M],
    note: "Reliable fallback with familiar execution.",
  },
  {
    id: "zulrah",
    name: "Zulrah",
    wilderness: false,
    requiresDt2: false,
    learner: [1.5 * M, 2 * M],
    competent: [2 * M, 3 * M],
    note: "Short sessions; lower ceiling.",
  },
  {
    id: "slayer",
    name: "Slayer",
    wilderness: false,
    requiresDt2: false,
    learner: null,
    competent: null,
    note: "No planning figure yet.",
  },
  {
    id: "dt2-bosses",
    name: "DT2 bosses",
    wilderness: false,
    requiresDt2: true,
    learner: null,
    competent: null,
    note: "Test each boss; drop any below 70% of its planning rate after practice.",
  },
  {
    id: "revenants",
    name: "Revenant caves",
    wilderness: true,
    requiresDt2: false,
    learner: null,
    competent: null,
    note: "Wilderness: budget PKer deaths into the log.",
  },
  {
    id: "wildy-bosses",
    name: "Wilderness bosses",
    wilderness: true,
    requiresDt2: false,
    learner: null,
    competent: null,
    note: "Wilderness: budget PKer deaths into the log.",
  },
  {
    id: "frost-dragons",
    name: "Frost dragons",
    wilderness: false,
    requiresDt2: false,
    learner: null,
    competent: null,
    note: "Low attention.",
    lowAttention: true,
    wikiModel: { gpPerHour: 2_034_706, assumes: "138 kills/hr, off-task, max melee gear", checked: "2026-10-02" },
  },
  {
    id: "adamant-dragons",
    name: "Adamant dragons",
    wilderness: false,
    requiresDt2: false,
    learner: null,
    competent: null,
    note: "Low attention.",
    lowAttention: true,
    wikiModel: { gpPerHour: 1_758_768, assumes: "about 60 kills/hr", checked: "2026-10-02" },
  },
  {
    id: "crystal-keys",
    name: "Making crystal keys",
    wilderness: false,
    requiresDt2: false,
    learner: null,
    competent: null,
    note: "Buy key halves, combine, sell. Limited by GE volume; test small first.",
    lowAttention: true,
    wikiModel: { gpPerHour: 2_180_000, assumes: "5,000 keys an hour, which GE volume rarely allows", checked: "2026-10-02" },
  },
  {
    id: "other",
    name: "Other",
    wilderness: false,
    requiresDt2: false,
    learner: null,
    competent: null,
    note: "Anything else that earns GP.",
  },
];

export function methodById(id: string): PvmMethod | undefined {
  return PVM_METHODS.find((m) => m.id === id);
}

/** Methods you can pick right now, given the quest gate and the Wilderness preference. */
export function availableMethods(opts: { dt2Complete: boolean; noWilderness: boolean }): PvmMethod[] {
  return PVM_METHODS.filter((m) => (opts.dt2Complete || !m.requiresDt2) && !(opts.noWilderness && m.wilderness));
}
