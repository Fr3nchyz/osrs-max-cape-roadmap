import { describe, expect, it } from "vitest";
import { formatGp, formatQuantity } from "@/lib/format";

describe("formatGp", () => {
  it("keeps whole numbers intact", () => {
    expect(formatGp(550_000_000)).toBe("550m");
    expect(formatGp(100_000_000)).toBe("100m");
    expect(formatGp(200_000)).toBe("200k");
    expect(formatGp(10_000_000)).toBe("10m");
    expect(formatGp(1_000_000_000)).toBe("1b");
  });
  it("trims trailing decimal zeros", () => {
    expect(formatGp(1_500_000)).toBe("1.5m");
    expect(formatGp(2_000_000)).toBe("2m");
    expect(formatGp(1_366_000_000)).toBe("1.37b");
    expect(formatGp(12_500_000)).toBe("12.5m");
  });
  it("signs and edge cases", () => {
    expect(formatGp(-2_500_000)).toBe("-2.5m");
    expect(formatGp(3_000, { sign: true })).toBe("+3k");
    expect(formatGp(null)).toBe("--");
    expect(formatGp(950)).toBe("950");
  });
});

describe("formatQuantity", () => {
  it("keeps whole numbers intact", () => {
    expect(formatQuantity(300_000)).toBe("300k");
    expect(formatQuantity(20_000)).toBe("20k");
  });
});
