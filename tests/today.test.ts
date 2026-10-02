import { describe, expect, it } from "vitest";
import { PVM_METHODS, availableMethods } from "@/lib/companion/methods";
import { rankMethods } from "@/lib/companion/sessions";
import { MAX_ORDER } from "@/lib/maxOrder";
import { defaultMode, suggestToday, type TodayInput } from "@/lib/today";

const ranked = rankMethods(availableMethods({ dt2Complete: true, noWilderness: true }), []).ranked;
const lowAttention = PVM_METHODS.filter((m) => m.lowAttention);
const base: TodayInput = {
  mode: "maxing",
  minutes: 60,
  milestone: { milestone: MAX_ORDER[0], index: 0, currentXp: 12_982_118, xpToGo: 52_313 },
  milestoneMethod: { name: "Chill Melee", rate: 60_000 },
  fletchingStockLeft: true,
  dt2Complete: true,
  ranked,
  lowAttention,
  weekend: false,
  caTier: "Hard",
  caTarget: "Elite",
};

describe("suggestToday: maxing", () => {
  it("names the next milestone with the XP this block earns and Fletching alongside", () => {
    const s = suggestToday(base);
    expect(s.title).toBe("Slayer → 99");
    expect(s.detail).toContain("60k XP in 60 min");
    expect(s.detail).toContain("100% of this step");
    expect(s.alongside).toMatch(/Fletch amethyst arrows/);
  });
  it("drops the Fletching side task when the step is Fletching, or the stock is used up", () => {
    const fletch = { ...base, milestone: { ...base.milestone!, milestone: MAX_ORDER[4] } };
    expect(suggestToday(fletch).alongside).toBeUndefined();
    expect(suggestToday({ ...base, fletchingStockLeft: false }).alongside).toBeUndefined();
  });
  it("says so when the order is done", () => {
    expect(suggestToday({ ...base, milestone: null }).title).toBe("Your maxing order is done");
  });
});

describe("suggestToday: GP", () => {
  it("follows the time blocks: GE under 30m, a low-attention trip under 60m, the top earner above", () => {
    expect(suggestToday({ ...base, mode: "gp", minutes: 15 }).title).toBe("Collect and relist GE offers");
    expect(suggestToday({ ...base, mode: "gp", minutes: 30 }).title).toBe("Making crystal keys");
    expect(suggestToday({ ...base, mode: "gp", minutes: 120 }).title).toBe(ranked[0].method.name);
  });
});

describe("suggestToday: bossing", () => {
  it("puts DT2 first", () => {
    expect(suggestToday({ ...base, mode: "bossing", dt2Complete: false }).title).toBe("Desert Treasure II");
    expect(suggestToday({ ...base, mode: "bossing", dt2Complete: false, minutes: 30 }).title).toBe(
      "Prep for Desert Treasure II"
    );
  });
  it("uses long blocks for ToA/Doom reps and mentions the CA goal", () => {
    const long = suggestToday({ ...base, mode: "bossing", minutes: 120 });
    expect(long.title).toBe("Focused ToA or Doom repetitions");
    expect(long.detail).toContain("Elite combat achievements");
    expect(suggestToday({ ...base, mode: "bossing", minutes: 60 }).title).toBe("One familiar boss trip");
    expect(suggestToday({ ...base, mode: "bossing", minutes: 60, weekend: true }).title).toBe(
      "Focused ToA or Doom repetitions"
    );
  });
  it("leaves the CA line out once the goal is reached", () => {
    expect(suggestToday({ ...base, mode: "bossing", caTier: "Elite" }).detail).not.toContain("combat achievements");
  });
});

describe("defaultMode", () => {
  const w = { maxingTarget: 11.6, pvmTarget: 3.9, elapsed: 0.5 };
  it("is maxing unless maxing is ahead and bossing behind", () => {
    expect(defaultMode({ ...w, maxingHours: 2, bossingHours: 0 })).toBe("maxing");
    expect(defaultMode({ ...w, maxingHours: 8, bossingHours: 0.5 })).toBe("bossing");
    expect(defaultMode({ ...w, maxingHours: 8, bossingHours: 3 })).toBe("maxing");
    expect(defaultMode({ ...w, maxingHours: null, bossingHours: null })).toBe("maxing");
  });
});
