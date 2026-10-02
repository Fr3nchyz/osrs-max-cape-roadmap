import { describe, expect, it } from "vitest";
import claimsJson from "@/research/claims.json";
import ratesJson from "@/research/rates.json";
import { parseClaims, parseRates } from "@/lib/research";
import { PVM_METHODS } from "@/lib/companion/methods";
import { rankMethods } from "@/lib/companion/sessions";

describe("research data in the repo", () => {
  it("every claim in claims.json is well-formed, unique and newest first", () => {
    const claims = parseClaims(claimsJson);
    expect(claims).toHaveLength((claimsJson as unknown[]).length);
    expect(new Set(claims.map((c) => c.id)).size).toBe(claims.length);
    const ids = new Set(PVM_METHODS.map((m) => m.id));
    for (const c of claims) if (c.methodId) expect(ids.has(c.methodId)).toBe(true);
  });

  it("every rate in rates.json is valid and points at a known method and claim", () => {
    const rates = parseRates(ratesJson);
    expect(Object.keys(rates)).toHaveLength(Object.keys(ratesJson).length);
    const claimIds = new Set(parseClaims(claimsJson).map((c) => c.id));
    for (const [methodId, r] of Object.entries(rates)) {
      expect(PVM_METHODS.some((m) => m.id === methodId)).toBe(true);
      expect(claimIds.has(r.claimId)).toBe(true);
    }
  });
});

describe("parsers", () => {
  it("drops malformed claims and bad statuses", () => {
    expect(parseClaims([{ id: "x", method: "m", addedAt: "2026-01-01", status: "MAYBE" }, null, "x"])).toEqual([]);
    expect(parseClaims("nope")).toEqual([]);
  });
  it("drops invalid rates", () => {
    expect(parseRates({ toa: { gpPerHour: -1, claimId: "a", checked: "d" }, x: 5 })).toEqual({});
  });
});

describe("rankMethods with research rates", () => {
  it("uses a researched rate before the learner low, but after a 10-hour log", () => {
    const vork = PVM_METHODS.filter((m) => m.id === "vorkath" || m.id === "frost-dragons");
    const { ranked } = rankMethods(vork, [], { "frost-dragons": { gpPerHour: 1_600_000 } });
    expect(ranked.find((r) => r.method.id === "frost-dragons")).toMatchObject({ source: "research", gpPerHour: 1_600_000 });
    const logged = rankMethods(
      vork,
      [{ methodId: "frost-dragons", sessions: 3, hours: 10, netGp: 20_000_000, gpPerHour: 2_000_000, killsPerHour: null, qualified: true }],
      { "frost-dragons": { gpPerHour: 1_600_000 } }
    );
    expect(logged.ranked.find((r) => r.method.id === "frost-dragons")!.source).toBe("logged");
  });
});
