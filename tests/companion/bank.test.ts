import { describe, expect, it } from "vitest";
import { parseBankMemoryTsv, valueBank } from "@/lib/companion/bank";
import type { BankItem, PriceTable, ValuedItem } from "@/lib/companion/types";

const HEADER = "Item id\tItem name\tItem quantity";
const NO_ITEMS = /No bank items found/;

describe("parseBankMemoryTsv", () => {
  it("skips the header and reads id, name and quantity", () => {
    const text = [HEADER, "4151\tAbyssal whip\t1", "995\tCoins\t60000000", "2434\tPrayer potion(4)\t340"].join("\n");
    expect(parseBankMemoryTsv(text)).toEqual({
      items: [
        { itemId: 4151, name: "Abyssal whip", quantity: 1 },
        { itemId: 995, name: "Coins", quantity: 60_000_000 },
        { itemId: 2434, name: "Prayer potion(4)", quantity: 340 },
      ],
      skipped: 0,
    });
  });

  it("handles Windows line endings and a trailing newline", () => {
    const text = `${HEADER}\r\n4151\tAbyssal whip\t1\r\n13190\tOld school bond\t2\r\n`;
    const { items, skipped } = parseBankMemoryTsv(text);
    expect(items).toEqual([
      { itemId: 4151, name: "Abyssal whip", quantity: 1 },
      { itemId: 13190, name: "Old school bond", quantity: 2 },
    ]);
    expect(items[1].name).not.toMatch(/\r/);
    expect(skipped).toBe(0);
  });

  it("ignores blank and whitespace-only lines and surrounding spaces", () => {
    const text = `\n\n  ${HEADER}  \n\n   \n  4151\tAbyssal whip\t1  \n\t\n\n`;
    expect(parseBankMemoryTsv(text)).toEqual({
      items: [{ itemId: 4151, name: "Abyssal whip", quantity: 1 }],
      skipped: 0,
    });
  });

  it("accepts a paste without the header", () => {
    expect(parseBankMemoryTsv("4151\tAbyssal whip\t1").items).toEqual([
      { itemId: 4151, name: "Abyssal whip", quantity: 1 },
    ]);
  });

  it("keeps names with spaces, brackets and punctuation intact", () => {
    const { items } = parseBankMemoryTsv(`${HEADER}\n12924\tToxic blowpipe (empty)\t1\n22325\tScythe of vitur (uncharged)\t1`);
    expect(items.map((i) => i.name)).toEqual(["Toxic blowpipe (empty)", "Scythe of vitur (uncharged)"]);
  });

  it("counts malformed rows as skipped", () => {
    const text = [
      HEADER,
      "4151\tAbyssal whip\t1", // ok
      "4151 Abyssal whip 1", // spaces, not tabs
      "abc\tAbyssal whip\t1", // id not a number
      "0\tNothing\t1", // id must be > 0
      "-4151\tAbyssal whip\t1", // negative id
      "4151\t\t1", // empty name
      "11212\tDragon arrow\t0", // quantity must be > 0
      "11212\tDragon arrow\t-5", // negative quantity
      "11212\tDragon arrow\t1.5", // not an integer
      "11212\tDragon arrow\t1,000", // thousands separator
      "11212\tDragon arrow", // missing quantity
      "11212\tDragon arrow\t10\textra", // too many cells
      "13190\tOld school bond\t1", // ok
    ].join("\n");
    const { items, skipped } = parseBankMemoryTsv(text);
    expect(items.map((i) => i.itemId)).toEqual([4151, 13190]);
    expect(skipped).toBe(11);
  });

  it("counts a malformed first data row as skipped, not as a header", () => {
    const { items, skipped } = parseBankMemoryTsv("4151\tAbyssal whip\t0\n314\tFeather\t5000");
    expect(items).toEqual([{ itemId: 314, name: "Feather", quantity: 5000 }]);
    expect(skipped).toBe(1);
  });

  it("does not count a repeated header (two pastes back to back) as skipped", () => {
    const text = `${HEADER}\n4151\tAbyssal whip\t1\n${HEADER}\n314\tFeather\t5000`;
    expect(parseBankMemoryTsv(text).skipped).toBe(0);
  });

  it("merges duplicate ids by summing quantity and keeps the first name and position", () => {
    const text = [HEADER, "314\tFeather\t1000", "4151\tAbyssal whip\t1", "314\tFeathers (dup)\t2500"].join("\n");
    expect(parseBankMemoryTsv(text).items).toEqual([
      { itemId: 314, name: "Feather", quantity: 3500 },
      { itemId: 4151, name: "Abyssal whip", quantity: 1 },
    ]);
  });

  it.each([
    ["empty input", ""],
    ["whitespace", "  \r\n\n\t\n"],
    ["a header only", `${HEADER}\r\n`],
    ["only malformed rows", `${HEADER}\nfoo\nbar\tbaz`],
    ["something else entirely", "Hello, I am not a bank"],
  ])("throws a user-facing error for %s", (_label, text) => {
    expect(() => parseBankMemoryTsv(text)).toThrow(NO_ITEMS);
  });

  it("names the Bank Memory action in its error", () => {
    expect(() => parseBankMemoryTsv("")).toThrow(
      "No bank items found — paste the output of Bank Memory's “Copy item data to clipboard”.",
    );
  });
});

describe("valueBank", () => {
  const NONE = new Set<number>();
  const item = (itemId: number, name: string, quantity = 1): BankItem => ({ itemId, name, quantity });
  const find = (items: ValuedItem[], id: number) => items.find((i) => i.itemId === id)!;

  it("caps tax at 5,000,000 on a 1.35B item", () => {
    const v = valueBank([item(22325, "Scythe of vitur")], { "22325": { high: 1_360_000_000, low: 1_350_000_000 } }, NONE, 0);
    expect(v.items[0]).toEqual<ValuedItem>({
      itemId: 22325,
      name: "Scythe of vitur",
      quantity: 1,
      unitPrice: 1_350_000_000,
      taxPerUnit: 5_000_000,
      grossTotal: 1_350_000_000,
      netTotal: 1_345_000_000,
      kept: false,
    });
    expect(v.liquidatableNetGp).toBe(1_345_000_000);
    expect(v.liquidatableGrossGp).toBe(1_350_000_000);
  });

  it("charges 2% floored below the cap", () => {
    const v = valueBank([item(4151, "Abyssal whip", 3)], { "4151": { high: 1_500_000, low: 1_499_999 } }, NONE, 0);
    expect(v.items[0].taxPerUnit).toBe(29_999);
    expect(v.items[0].grossTotal).toBe(4_499_997);
    expect(v.items[0].netTotal).toBe(3 * (1_499_999 - 29_999));
  });

  it("does not tax bonds", () => {
    const v = valueBank([item(13190, "Old school bond", 2)], { "13190": { high: 9_100_000, low: 9_000_000 } }, NONE, 0);
    expect(v.items[0].taxPerUnit).toBe(0);
    expect(v.items[0].netTotal).toBe(18_000_000);
  });

  it("does not tax items under 50 gp", () => {
    const v = valueBank([item(314, "Feather", 10_000)], { "314": { high: 41, low: 40 } }, NONE, 0);
    expect(v.items[0].taxPerUnit).toBe(0);
    expect(v.items[0].netTotal).toBe(400_000);
  });

  it("prices at instant-sell (low), falling back to high when low is null", () => {
    const prices: PriceTable = {
      "4151": { high: 1_500_000, low: 1_450_000 },
      "11212": { high: 2_000, low: null },
    };
    const v = valueBank([item(4151, "Abyssal whip"), item(11212, "Dragon arrow", 100)], prices, NONE, 0);
    expect(find(v.items, 4151).unitPrice).toBe(1_450_000);
    expect(find(v.items, 11212).unitPrice).toBe(2_000);
    expect(find(v.items, 11212).taxPerUnit).toBe(40);
    expect(find(v.items, 11212).netTotal).toBe(196_000);
  });

  it("leaves items with no price unpriced, at zero, counted and sorted last", () => {
    const prices: PriceTable = {
      "4151": { high: 1_500_000, low: 1_500_000 },
      "314": { high: 3, low: 2 },
      "22000": { high: null, low: null },
    };
    const items = [
      item(22000, "Aardvark (untradeable)"),
      item(23000, "Zebra (missing from table)"),
      item(314, "Feather", 10),
      item(4151, "Abyssal whip"),
    ];
    const v = valueBank(items, prices, NONE, 1);

    expect(v.items.map((i) => i.itemId)).toEqual([4151, 314, 22000, 23000]);
    for (const id of [22000, 23000]) {
      expect(find(v.items, id)).toMatchObject({ unitPrice: null, taxPerUnit: 0, grossTotal: 0, netTotal: 0 });
    }
    expect(v.unpricedCount).toBe(2);
    expect(v.liquidatableGrossGp).toBe(1_500_000 + 20);
  });

  it("sorts by netTotal descending with ties broken by name", () => {
    const prices: PriceTable = {
      "1": { high: 100, low: 100 },
      "2": { high: 100, low: 100 },
      "3": { high: 5_000, low: 5_000 },
      "4": { high: 0, low: 0 },
    };
    const items = [item(1, "Bravo"), item(4, "Zero"), item(2, "Alpha"), item(3, "Charlie")];
    const v = valueBank(items, prices, NONE, 0);
    expect(v.items.map((i) => i.name)).toEqual(["Charlie", "Alpha", "Bravo", "Zero"]);
  });

  it("moves kept items out of the liquidatable totals into keptNetGp", () => {
    const prices: PriceTable = {
      "4151": { high: 1_500_000, low: 1_500_000 },
      "12924": { high: 3_000_000, low: 3_000_000 },
      "999": { high: null, low: null },
    };
    const items = [item(4151, "Abyssal whip"), item(12924, "Toxic blowpipe (empty)"), item(999, "Mystery")];
    const all = valueBank(items, prices, NONE, 0);
    const kept = valueBank(items, prices, new Set([12924, 999]), 0);

    expect(find(kept.items, 12924).kept).toBe(true);
    expect(find(kept.items, 999).kept).toBe(true);
    expect(find(kept.items, 4151).kept).toBe(false);
    expect(kept.keptNetGp).toBe(2_940_000);
    expect(kept.liquidatableNetGp).toBe(1_470_000);
    expect(kept.liquidatableGrossGp).toBe(1_500_000);
    expect(kept.liquidatableNetGp + kept.keptNetGp).toBe(all.liquidatableNetGp);
    expect(kept.unpricedCount).toBe(1);
    expect(all.keptNetGp).toBe(0);
  });

  it("applies slippage after tax and floors the total", () => {
    // 1001 gp: tax 20, so 981 x 3 = 2943; x 0.99 = 2913.57 -> 2913.
    const v = valueBank([item(1, "Thing", 3)], { "1": { high: 1_001, low: 1_001 } }, NONE, 1);
    expect(v.items[0].grossTotal).toBe(3_003);
    expect(v.items[0].netTotal).toBe(2_913);
    expect(Number.isInteger(v.liquidatableNetGp)).toBe(true);
  });

  it("floors exactly where the float product lands a hair under an integer", () => {
    // 510 gp: tax 10, so 500 x 0.93 = 465 exactly; naive float math gives 464.999...
    const v = valueBank([item(1, "Thing")], { "1": { high: 510, low: 510 } }, NONE, 7);
    expect(v.items[0].netTotal).toBe(465);
  });

  it("counts coins and platinum tokens as cash, not items", () => {
    const items = [item(995, "Coins", 60_000_000), item(13204, "Platinum token", 1_500), item(4151, "Abyssal whip")];
    const prices: PriceTable = {
      "995": { high: 1, low: 1 },
      "13204": { high: 1_000, low: 1_000 },
      "4151": { high: 1_500_000, low: 1_500_000 },
    };
    const v = valueBank(items, prices, new Set([995]), 5);
    expect(v.cashGp).toBe(61_500_000);
    expect(v.items.map((i) => i.itemId)).toEqual([4151]);
    expect(v.liquidatableNetGp).toBe(1_396_500); // 1,470,000 x 0.95
  });

  it("values an empty bank at zero", () => {
    expect(valueBank([], {}, NONE, 1)).toEqual({
      cashGp: 0,
      items: [],
      liquidatableNetGp: 0,
      liquidatableGrossGp: 0,
      keptNetGp: 0,
      unpricedCount: 0,
    });
  });

  it("values a parsed Bank Memory paste end to end", () => {
    const text = [
      HEADER,
      "995\tCoins\t60000000",
      "13204\tPlatinum token\t10000",
      "20997\tTwisted bow\t1",
      "13190\tOld school bond\t1",
      "4151\tAbyssal whip\t1",
      "314\tFeather\t20000",
      "11865\tSlayer helmet (i)\t1",
    ].join("\r\n");
    const prices: PriceTable = {
      "20997": { high: 1_360_000_000, low: 1_356_626_084 },
      "13190": { high: 9_000_000, low: 8_900_000 },
      "4151": { high: 1_500_000, low: 1_480_000 },
      "314": { high: 4, low: 3 },
    };
    const { items } = parseBankMemoryTsv(text);
    const v = valueBank(items, prices, new Set([4151]), 0);

    expect(v.cashGp).toBe(70_000_000);
    expect(v.items.map((i) => i.itemId)).toEqual([20997, 13190, 4151, 314, 11865]);
    expect(v.unpricedCount).toBe(1);
    expect(v.keptNetGp).toBe(1_480_000 - 29_600);
    expect(v.liquidatableGrossGp).toBe(1_356_626_084 + 8_900_000 + 60_000);
    expect(v.liquidatableNetGp).toBe(1_356_626_084 - 5_000_000 + 8_900_000 + 60_000);
  });
});
