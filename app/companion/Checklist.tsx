"use client";

import { BadgeCheck, CheckCircle2, CheckSquare, CircleDashed, CircleX, ListChecks, Square } from "lucide-react";
import { CHECKLIST } from "@/lib/companion/goal";
import type { ChecklistId, ChecklistItem, CompanionState, FundingStage } from "@/lib/companion/types";
import { Card, CardTitle } from "./ui";

type Props = {
  className?: string;
  /** null while the funding snapshot is unknown (no live price yet). */
  evaluation: { items: ChecklistItem[]; allPassed: boolean } | null;
  stage: FundingStage | null;
  ownsTbow: boolean;
  manual: CompanionState["checklist"];
  onToggle: (id: ChecklistId, next: boolean) => void;
  /** Context under an auto item, e.g. "Fetched 4m ago". */
  details: Partial<Record<ChecklistId, string>>;
};

export default function Checklist({ className = "", evaluation, stage, ownsTbow, manual, onToggle, details }: Props) {
  const items: (ChecklistItem & { waiting: boolean })[] = evaluation
    ? evaluation.items.map((i) => ({ ...i, waiting: false }))
    : CHECKLIST.map((c) => ({ ...c, passed: !c.auto && manual[c.id] === true, waiting: c.auto }));
  const remaining = items.filter((i) => !i.passed).length;
  const ready = evaluation !== null && evaluation.allPassed && stage === "PURCHASE_WINDOW";

  return (
    <Card className={className} aria-labelledby="checklist-title">
      <CardTitle
        id="checklist-title"
        icon={ListChecks}
        aside={`${items.length - remaining} of ${items.length} passed`}
      >
        Pre-purchase checklist
      </CardTitle>

      <div className="mt-4" role="status">
        {ownsTbow ? (
          <Banner tone="neutral" title="Bow owned" body="The checklist has done its job. Focus on rebuilding the reserve." />
        ) : ready ? (
          <Banner
            tone="ready"
            title="Ready to buy"
            body="Every check passes in the purchase window. Buy with a patient offer near the live price."
          />
        ) : (
          <Banner
            tone="neutral"
            title={`${remaining} check${remaining === 1 ? "" : "s"} remaining`}
            body={
              evaluation === null
                ? "The automatic checks are waiting for the live T-bow price."
                : remaining === 0
                  ? "Every check passes, but the gap has not reached the purchase window yet."
                  : "Buy only when every check passes and the stage is the purchase window."
            }
          />
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item) =>
          item.auto ? (
            <AutoRow key={item.id} item={item} detail={details[item.id]} />
          ) : (
            <li key={item.id}>
              <ManualRow item={item} onToggle={onToggle} />
            </li>
          )
        )}
      </ul>
    </Card>
  );
}

function Banner({ tone, title, body }: { tone: "ready" | "neutral"; title: string; body: string }) {
  const ready = tone === "ready";
  const Icon = ready ? BadgeCheck : ListChecks;
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
        ready ? "border-yellow-600/60 bg-yellow-600/15" : "border-neutral-800 bg-neutral-950/50"
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ready ? "text-yellow-500" : "text-neutral-500"}`} aria-hidden />
      <div className="min-w-0">
        <p className={`text-sm font-black uppercase tracking-tight ${ready ? "text-yellow-400" : "text-white"}`}>{title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{body}</p>
      </div>
    </div>
  );
}

function AutoRow({ item, detail }: { item: ChecklistItem & { waiting: boolean }; detail?: string }) {
  const status = item.waiting
    ? { Icon: CircleDashed, text: "Waiting", cls: "text-neutral-600" }
    : item.passed
      ? { Icon: CheckCircle2, text: "Pass", cls: "text-green-500" }
      : { Icon: CircleX, text: "Not yet", cls: "text-neutral-500" };

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/40 px-3.5 py-3">
      <status.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${status.cls}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-200 leading-snug">{item.label}</p>
        {detail && <p className="text-[11px] text-neutral-500 mt-0.5">{detail}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[10px] font-black uppercase tracking-wider ${status.cls}`}>{status.text}</span>
        <span
          className="rounded-md border border-neutral-700 px-1.5 py-px text-[10px] font-black uppercase tracking-wider text-neutral-500"
          title="Checked automatically from live data"
        >
          auto
        </span>
      </div>
    </li>
  );
}

function ManualRow({ item, onToggle }: { item: ChecklistItem; onToggle: (id: ChecklistId, next: boolean) => void }) {
  const Box = item.passed ? CheckSquare : Square;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={item.passed}
      onClick={() => onToggle(item.id, !item.passed)}
      className={`w-full flex items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
        item.passed ? "border-yellow-700/40 bg-yellow-600/5" : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700"
      }`}
    >
      <Box className={`w-4 h-4 mt-0.5 shrink-0 ${item.passed ? "text-yellow-500" : "text-neutral-500"}`} aria-hidden />
      <span className="min-w-0 flex-1 text-sm text-neutral-200 leading-snug">{item.label}</span>
      <span
        className={`shrink-0 text-[10px] font-black uppercase tracking-wider ${item.passed ? "text-yellow-500" : "text-neutral-500"}`}
      >
        {item.passed ? "Done" : "Open"}
      </span>
    </button>
  );
}
