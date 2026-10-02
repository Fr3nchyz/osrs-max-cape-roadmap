import { describe, expect, it } from "vitest";
import { BASELINE_FLETCHING_STOCK, XP_FOR_99, fletchingCoverage, fletchingXp } from "@/lib/companion/fletching";

describe("fletchingCoverage", () => {
  it("covers about 83% of fr3nchy's 95 -> 99 from the baseline stock", () => {
    const c = fletchingCoverage(9_110_694, BASELINE_FLETCHING_STOCK);
    expect(c.xpTo99).toBe(3_923_737);
    // 216,586 x 13.5 + 31,930 x 10.6 + 1,410 x 3
    expect(c.lines.map((l) => [l.recipe.name, l.makeable])).toEqual([
      ["Amethyst arrows", 216_586],
      ["Amethyst broad bolts", 31_930],
      ["Broad bolts", 1_410],
    ]);
    expect(c.stockXp).toBeCloseTo(2_923_911 + 338_458 + 4_230, 6);
    expect(c.covered).toBeCloseTo(0.8327, 3);
    expect(c.shortfallXp).toBeCloseTo(3_923_737 - 3_266_599, 6);
  });

  it("limits each recipe by its scarcer input and skips recipes with none", () => {
    const c = fletchingCoverage(0, [
      { itemId: 21350, name: "Amethyst arrowtips", quantity: 100 },
      { itemId: 53, name: "Headless arrow", quantity: 40 },
      { itemId: 21338, name: "Amethyst bolt tips", quantity: 10 },
    ]);
    expect(c.lines).toHaveLength(1);
    expect(c.lines[0]).toMatchObject({ makeable: 40, xp: 540 });
  });

  it("is fully covered with no shortfall at 99", () => {
    const c = fletchingCoverage(XP_FOR_99 + 5, BASELINE_FLETCHING_STOCK);
    expect(c).toMatchObject({ xpTo99: 0, covered: 1, shortfallXp: 0 });
  });
});

describe("fletchingXp", () => {
  it("reads Fletching XP from the HiScores JSON", () => {
    expect(fletchingXp({ skills: [{ name: "Attack", xp: 1 }, { name: "Fletching", xp: 9_110_694 }] })).toBe(9_110_694);
  });
  it.each([null, {}, { skills: "x" }, { skills: [{ name: "Fletching", xp: -1 }] }, { skills: [] }])(
    "returns null for %j",
    (input) => {
      expect(fletchingXp(input)).toBeNull();
    }
  );
});
