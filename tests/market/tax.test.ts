import { describe, expect, it } from "vitest";
import {
  GE_TAX_CAP_PER_ITEM,
  GE_TAX_CAP_THRESHOLD,
  GE_TAX_RATE,
  geTaxPerItem,
  geTaxTotal,
  isTaxExempt,
  netSaleProceeds,
} from "@/lib/market/tax";

// These pin the rules verified against the OSRS Wiki on 2026-09-08. If Jagex
// changes the tax again, these tests should fail loudly rather than let stale
// margins ship.
describe("tax rules", () => {
  it("is 2%, not the pre-2025 1%", () => {
    expect(GE_TAX_RATE).toBe(0.02);
  });

  it("caps at 5m, which at 2% binds from 250m up", () => {
    expect(GE_TAX_CAP_PER_ITEM).toBe(5_000_000);
    expect(GE_TAX_CAP_THRESHOLD).toBe(250_000_000);
  });
});

describe("geTaxPerItem", () => {
  it("takes 2% rounded down", () => {
    expect(geTaxPerItem(1000)).toBe(20);
    expect(geTaxPerItem(199)).toBe(3);
    expect(geTaxPerItem(2_000_000)).toBe(40_000);
  });

  it("charges nothing below the 50gp threshold", () => {
    expect(geTaxPerItem(49)).toBe(0);
    expect(geTaxPerItem(1)).toBe(0);
    expect(geTaxPerItem(50)).toBe(1);
  });

  it("caps at 5m from 250m upward", () => {
    expect(geTaxPerItem(249_999_999)).toBe(4_999_999);
    expect(geTaxPerItem(250_000_000)).toBe(GE_TAX_CAP_PER_ITEM);
    expect(geTaxPerItem(2_000_000_000)).toBe(GE_TAX_CAP_PER_ITEM);
  });

  it("exempts flagged items", () => {
    expect(geTaxPerItem(8_000_000, { exempt: true })).toBe(0);
    expect(isTaxExempt(13190)).toBe(true); // Old school bond
  });

  it("defaults unknown items to taxed, which understates rather than overstates profit", () => {
    expect(isTaxExempt(4151)).toBe(false); // Abyssal whip, genuinely taxed
    expect(isTaxExempt(999_999)).toBe(false); // Unknown id: assume taxed
  });

  it("survives missing prices", () => {
    expect(geTaxPerItem(Number.NaN)).toBe(0);
  });
});

describe("geTaxTotal", () => {
  it("multiplies the per-item tax by quantity", () => {
    expect(geTaxTotal(1000, 500)).toBe(10_000);
  });

  it("ignores negative or fractional quantities", () => {
    expect(geTaxTotal(1000, -5)).toBe(0);
    expect(geTaxTotal(1000, 2.9)).toBe(40);
  });
});

describe("netSaleProceeds", () => {
  it("returns what actually lands in the bank", () => {
    expect(netSaleProceeds(1_000_000)).toBe(980_000);
  });

  it("applies the cap, not a flat 2%, on very expensive items", () => {
    expect(netSaleProceeds(1_000_000_000)).toBe(995_000_000);
  });
});
