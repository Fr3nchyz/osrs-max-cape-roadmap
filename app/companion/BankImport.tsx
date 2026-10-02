"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardPaste, Landmark, Trash2 } from "lucide-react";
import { formatAge, formatFullGp, formatGp } from "@/lib/format";
import { parseBankMemoryTsv } from "@/lib/companion/bank";
import type { BankValuation, CompanionState, LatestPricesResponse } from "@/lib/companion/types";
import type { CompanionUpdate } from "./useCompanionState";
import type { Remote } from "./useLive";
import { BANK_STALE_DAYS, Card, CardTitle, LABEL, Loading, Notice, RetryButton, Toggle, minutesSince, shortDay } from "./ui";

const TOP_N = 25;

const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

type Props = {
  className?: string;
  state: CompanionState;
  update: (change: CompanionUpdate) => void;
  latest: Remote<LatestPricesResponse>;
  valuation: BankValuation | null;
  now: number;
};

type Message = { tone: "info" | "error"; text: string };

export default function BankImport({ className = "", state, update, latest, valuation, now }: Props) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [showAll, setShowAll] = useState(false);
  const bank = state.bank;

  const onImport = () => {
    try {
      const { items, skipped } = parseBankMemoryTsv(text);
      update({ bank: { importedAt: new Date().toISOString(), items }, bankCleared: false });
      setText("");
      setMessage({
        tone: "info",
        text: `Imported ${items.length.toLocaleString("en-US")} item${items.length === 1 ? "" : "s"}${
          skipped > 0 ? `; skipped ${skipped.toLocaleString("en-US")} row${skipped === 1 ? "" : "s"} that didn't parse` : ""
        }.`,
      });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  const onClear = () => {
    update({ bank: null, useBankImport: false, bankCleared: true });
    setMessage(null);
    setShowAll(false);
  };

  const toggleKeep = (itemId: number) =>
    update((prev) => ({
      ...prev,
      keepItemIds: prev.keepItemIds.includes(itemId)
        ? prev.keepItemIds.filter((id) => id !== itemId)
        : [...prev.keepItemIds, itemId],
    }));

  return (
    <Card className={className} aria-labelledby="bank-title">
      <CardTitle
        id="bank-title"
        icon={Landmark}
        aside={
          bank
            ? `${bank.items.length.toLocaleString("en-US")} item rows${bank.baseline ? " · built-in snapshot" : ""}`
            : "No import yet"
        }
      >
        Bank import
      </CardTitle>

      {bank && (bank.baseline || minutesSince(bank.importedAt, now) > BANK_STALE_DAYS * 1440) && (
        <div className="mt-4">
          <Notice tone="warn">
            {bank.baseline ? (
              <>
                <span className="font-bold">Using your bank snapshot from {shortDay(bank.importedAt)}</span> (
                {formatAge(minutesSince(bank.importedAt, now))}), built into the app. Quantities may be out of date;
                prices are live. Paste a fresh bank below to replace it.
              </>
            ) : (
              <>
                <span className="font-bold">Bank imported {formatAge(minutesSince(bank.importedAt, now))}.</span>{" "}
                Quantities may be out of date; paste a fresh bank to update.
              </>
            )}
          </Notice>
        </div>
      )}

      <p className="mt-4 text-xs text-neutral-400 leading-relaxed">
        In RuneLite, install Bank Memory from the Plugin Hub, open its panel, right-click your current bank and choose
        “Copy item data to clipboard”, then paste below.
      </p>

      <label className="block mt-3">
        <span className="sr-only">Bank Memory item data</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder={"Item id\tItem name\tItem quantity\n4151\tAbyssal whip\t1"}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 resize-y"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onImport}
          disabled={text.trim() === ""}
          aria-label={bank ? "Replace bank import" : "Import bank data"}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-yellow-600"
        >
          <ClipboardPaste className="w-3.5 h-3.5" aria-hidden /> {bank ? "Replace import" : "Import"}
        </button>
        {bank && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden /> Clear import
          </button>
        )}
      </div>

      {message && (
        <div className="mt-3">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}

      {bank && (
        <>
          <div className="mt-5">
            <Toggle
              label="Use bank import for capital"
              hint="Cash and tradeables come from this import instead of the manual fields"
              checked={state.useBankImport}
              onChange={(useBankImport) => update({ useBankImport })}
            />
          </div>

          {valuation === null && latest.loading && (
            <div className="mt-4">
              <Loading>Pricing {bank.items.length.toLocaleString("en-US")} items at live GE prices…</Loading>
            </div>
          )}
          {valuation === null && !latest.loading && (
            <div className="mt-4">
              <Notice tone="error" action={<RetryButton onClick={latest.reload} />}>
                Live GE prices unavailable{latest.error ? ` (${latest.error})` : ""}, so the import can&apos;t be valued.
              </Notice>
            </div>
          )}

          {valuation && latest.error && latest.data && (
            <div className="mt-4">
              <Notice tone="warn" action={<RetryButton onClick={latest.reload} busy={latest.loading} />}>
                Price refresh failed ({latest.error}). Still valued at prices fetched{" "}
                {formatAge(minutesSince(latest.data.fetchedAt, now))}.
              </Notice>
            </div>
          )}

          {valuation && (
            <>
              <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Total label="Cash found" value={formatGp(valuation.cashGp)} title={`${formatFullGp(valuation.cashGp)} gp`} />
                <Total
                  label="Liquidatable, net"
                  value={formatGp(valuation.liquidatableNetGp)}
                  sub={`${formatGp(valuation.liquidatableGrossGp)} before costs`}
                  title={`${formatFullGp(valuation.liquidatableNetGp)} gp after GE tax and slippage`}
                />
                <Total
                  label="Kept"
                  value={formatGp(valuation.keptNetGp)}
                  sub={plural(valuation.items.filter((i) => i.kept).length, "item")}
                />
                <Total label="Unpriced" value={valuation.unpricedCount.toLocaleString("en-US")} sub="no GE price" />
                <Total
                  label="Imported"
                  value={formatAge(minutesSince(bank.importedAt, now))}
                  sub={latest.data ? `prices ${formatAge(minutesSince(latest.data.fetchedAt, now))}` : undefined}
                />
              </dl>

              <ItemTable
                valuation={valuation}
                showAll={showAll}
                onToggleAll={() => setShowAll((v) => !v)}
                onToggleKeep={toggleKeep}
              />
            </>
          )}
        </>
      )}
    </Card>
  );
}

function Total({ label, value, sub, title }: { label: string; value: string; sub?: string; title?: string }) {
  return (
    <div title={title} className="bg-neutral-950/50 border border-neutral-800 rounded-2xl px-3 py-2.5 min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 text-lg font-black text-white tracking-tight leading-none">{value}</dd>
      {sub && <dd className="mt-1 text-[11px] text-neutral-500 truncate">{sub}</dd>}
    </div>
  );
}

function ItemTable({
  valuation,
  showAll,
  onToggleAll,
  onToggleKeep,
}: {
  valuation: BankValuation;
  showAll: boolean;
  onToggleAll: () => void;
  onToggleKeep: (itemId: number) => void;
}) {
  const rows = showAll ? valuation.items : valuation.items.slice(0, TOP_N);
  const th = "text-[10px] font-black text-neutral-500 uppercase tracking-wider px-3 py-2 text-left";
  const thR = `${th} text-right`;

  if (valuation.items.length === 0) {
    return (
      <div className="mt-4">
        <Notice>The import holds only coins and platinum tokens.</Notice>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/40">
        <table className="w-full min-w-[520px] text-xs tabular-nums">
          <caption className="sr-only">Bank items by net sale value</caption>
          <thead>
            <tr className="border-b border-neutral-800">
              <th scope="col" className={th}>Item</th>
              <th scope="col" className={thR}>Qty</th>
              <th scope="col" className={thR}>Unit price</th>
              <th scope="col" className={thR}>Net total</th>
              <th scope="col" className={`${th} text-center`}>Keep</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr
                key={item.itemId}
                className={`border-b border-neutral-800/60 last:border-0 hover:bg-neutral-800/30 ${item.kept ? "text-neutral-500" : "text-neutral-300"}`}
              >
                <th scope="row" className="px-3 py-2 text-left font-bold max-w-[220px] truncate">
                  {item.name}
                </th>
                <td className="px-3 py-2 text-right">{item.quantity.toLocaleString("en-US")}</td>
                <td className="px-3 py-2 text-right" title={item.unitPrice === null ? "No GE price" : `${formatFullGp(item.unitPrice)} gp`}>
                  {item.unitPrice === null ? <span className="text-neutral-600">no price</span> : formatGp(item.unitPrice)}
                </td>
                <td className="px-3 py-2 text-right font-bold" title={`${formatFullGp(item.netTotal)} gp`}>
                  {item.unitPrice === null ? "--" : formatGp(item.netTotal)}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={item.kept}
                    onChange={() => onToggleKeep(item.itemId)}
                    aria-label={`Keep ${item.name}`}
                    className="w-4 h-4 accent-yellow-600 cursor-pointer align-middle"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {valuation.items.length > TOP_N && (
        <button
          type="button"
          onClick={onToggleAll}
          className="mt-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-500 hover:text-yellow-500"
        >
          {showAll ? <ChevronUp className="w-3.5 h-3.5" aria-hidden /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden />}
          {showAll ? `Show top ${TOP_N}` : `Show all ${valuation.items.length.toLocaleString("en-US")} items`}
        </button>
      )}
    </div>
  );
}
