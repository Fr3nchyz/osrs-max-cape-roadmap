"use client";

import { CheckCircle2, Circle, CircleDot, Milestone } from "lucide-react";
import { STAGES, STAGE_ORDER } from "@/lib/companion/goal";
import type { FundingStage } from "@/lib/companion/types";
import { Card, CardTitle, Notice } from "./ui";

type Status = "passed" | "current" | "ahead" | "unknown";

const STATUS = {
  passed: { Icon: CheckCircle2, text: "Passed", cls: "text-neutral-400" },
  current: { Icon: CircleDot, text: "You are here", cls: "text-yellow-500" },
  ahead: { Icon: Circle, text: "Ahead", cls: "text-neutral-600" },
  unknown: { Icon: Circle, text: "", cls: "text-neutral-700" },
} as const;

export default function StageLadder({ stage, className = "" }: { stage: FundingStage | null; className?: string }) {
  const at = stage === null ? -1 : STAGE_ORDER.indexOf(stage);

  return (
    <Card className={className} aria-labelledby="stage-title">
      <CardTitle id="stage-title" icon={Milestone} aside={stage ? STAGES[stage].label : undefined}>
        Stage
      </CardTitle>

      {stage === null && (
        <div className="mt-4">
          <Notice>The stage comes from the funding gap, which needs the live T-bow price.</Notice>
        </div>
      )}

      <ol className="mt-4 space-y-2">
        {STAGE_ORDER.map((id, i) => {
          const status: Status = at < 0 ? "unknown" : i < at ? "passed" : i === at ? "current" : "ahead";
          const { Icon, text, cls } = STATUS[status];
          const current = status === "current";
          return (
            <li
              key={id}
              aria-current={current ? "step" : undefined}
              className={`rounded-2xl border px-3.5 py-3 ${
                current ? "border-yellow-600/50 bg-yellow-600/10" : "border-neutral-800 bg-neutral-950/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cls}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-x-3 gap-y-0.5 flex-wrap">
                    <span className={`text-sm font-black tracking-tight ${status === "ahead" ? "text-neutral-400" : "text-white"}`}>
                      {STAGES[id].label}
                    </span>
                    {text && (
                      <span className={`text-[10px] font-black uppercase tracking-wider ${cls}`}>{text}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{STAGES[id].when}</p>
                  {current && <p className="mt-2 text-sm text-neutral-200 leading-snug">{STAGES[id].action}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
