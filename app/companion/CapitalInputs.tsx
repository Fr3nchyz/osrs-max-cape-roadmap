"use client";

import { useId, useState } from "react";
import { Wallet } from "lucide-react";
import { formatFullGp } from "@/lib/format";
import { weeklyHours } from "@/lib/companion/goal";
import type { CompanionState } from "@/lib/companion/types";
import type { CompanionUpdate } from "./useCompanionState";
import { Card, CardTitle, LABEL, Notice, Toggle } from "./ui";

const MILLION = 1_000_000;

type Props = {
  className?: string;
  state: CompanionState;
  update: (change: CompanionUpdate) => void;
  /** Cash and tradeables come from the bank import instead of these fields. */
  bankActive: boolean;
};

export default function CapitalInputs({ className = "", state, update, bankActive }: Props) {
  const gpHint = (gp: number) => `${formatFullGp(gp)} gp`;

  return (
    <Card className={className} aria-labelledby="capital-title">
      <CardTitle id="capital-title" icon={Wallet}>
        Capital &amp; time
      </CardTitle>

      {bankActive && (
        <div className="mt-4">
          <Notice>Cash and tradeables come from your bank import while it is switched on.</Notice>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
        <NumberField
          label="Cash"
          unit="M gp"
          scale={MILLION}
          value={state.cashGp}
          onChange={(cashGp) => update({ cashGp })}
          hint={gpHint(state.cashGp)}
          disabled={bankActive}
        />
        <NumberField
          label="Tradeables, guide value"
          unit="M gp"
          scale={MILLION}
          value={state.tradeablesGp}
          onChange={(tradeablesGp) => update({ tradeablesGp })}
          hint={gpHint(state.tradeablesGp)}
          disabled={bankActive}
        />
        <NumberField
          label="Reserve after buying"
          unit="M gp"
          scale={MILLION}
          value={state.reserveGp}
          onChange={(reserveGp) => update({ reserveGp })}
          hint={gpHint(state.reserveGp)}
        />
        <NumberField
          label="Slippage on sales"
          unit="%"
          step={0.1}
          max={50}
          value={state.slippagePct}
          onChange={(slippagePct) => update({ slippagePct })}
          hint="Extra haircut for thin markets, on top of GE tax"
        />
        <NumberField
          label="Weekday hours"
          unit="h / day"
          step={0.25}
          max={24}
          value={state.weekdayHours}
          onChange={(weekdayHours) => update({ weekdayHours })}
          hint="Monday to Friday"
        />
        <NumberField
          label="Weekend hours"
          unit="h / day"
          step={0.25}
          max={24}
          value={state.weekendHours}
          onChange={(weekendHours) => update({ weekendHours })}
          hint={`Saturday and Sunday · ${Number(weeklyHours(state.weekdayHours, state.weekendHours).toFixed(2))}h a week`}
        />
      </div>

      <div className="mt-5">
        <Toggle
          label="I own the T-bow"
          hint="Moves the plan to the Rebuild stage"
          checked={state.ownsTbow}
          onChange={(ownsTbow) => update({ ownsTbow })}
        />
      </div>
    </Card>
  );
}

/**
 * Numeric input that keeps the raw text while you type ("60." stays "60.")
 * and commits every valid value. `scale` turns the shown unit into stored
 * units: 60 at scale 1,000,000 is stored as 60,000,000 gp.
 */
function NumberField({
  label,
  unit,
  value,
  onChange,
  scale = 1,
  step = 0.1,
  max,
  hint,
  disabled = false,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (next: number) => void;
  scale?: number;
  step?: number;
  max?: number;
  hint?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const problemId = useId();
  const committed = String(Number((value / scale).toFixed(6)));
  const shown = draft ?? committed;

  // While the typed text differs from what the maths uses, say so.
  const typed = draft === null ? null : Number(draft);
  const problem =
    draft === null || typed === null
      ? null
      : draft.trim() === "" || !Number.isFinite(typed) || typed < 0
        ? `Not a valid amount. Still using ${committed}.`
        : max !== undefined && typed > max
          ? `Capped at ${max}. Using ${committed}.`
          : null;

  return (
    <label className={`block min-w-0 ${disabled ? "opacity-50" : ""}`}>
      <span className={LABEL}>{label}</span>
      <span
        className={`mt-1.5 flex items-center bg-neutral-950 border rounded-xl focus-within:ring-1 ${
          problem ? "border-red-800 focus-within:ring-red-600" : "border-neutral-800 focus-within:ring-yellow-600"
        }`}
      >
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={max}
          step={step}
          value={shown}
          disabled={disabled}
          aria-invalid={problem !== null}
          aria-describedby={problem ? problemId : undefined}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            const n = Number(raw);
            if (raw.trim() === "" || !Number.isFinite(n) || n < 0) return;
            const clamped = max === undefined ? n : Math.min(max, n);
            onChange(scale >= 1000 ? Math.round(clamped * scale) : clamped * scale);
          }}
          onBlur={() => setDraft(null)}
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm font-bold text-neutral-100 focus:outline-none disabled:cursor-not-allowed"
        />
        <span className="pr-4 text-[11px] font-black text-neutral-500 uppercase tracking-wider whitespace-nowrap">{unit}</span>
      </span>
      {problem ? (
        <span id={problemId} className="mt-1 block text-[11px] text-red-300">
          {problem}
        </span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-neutral-500">{hint}</span>
      )}
    </label>
  );
}
