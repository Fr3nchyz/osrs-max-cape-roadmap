"use client";

import { ClipboardCheck, Coins, Landmark, Map } from "lucide-react";

export const COMPANION_TABS = ["plan", "check", "money", "bank"] as const;
export type CompanionTab = (typeof COMPANION_TABS)[number];

const TABS: { id: CompanionTab; label: string; short: string; Icon: typeof Map }[] = [
  { id: "plan", label: "Plan", short: "Plan", Icon: Map },
  { id: "check", label: "Buy check", short: "Check", Icon: ClipboardCheck },
  { id: "money", label: "Money", short: "Money", Icon: Coins },
  { id: "bank", label: "Bank & settings", short: "Bank", Icon: Landmark },
];

/** Sticky tab bar, styled like the roadmap's Overview / Goals tabs. */
export default function CompanionTabs({ tab, onChange }: { tab: CompanionTab; onChange: (t: CompanionTab) => void }) {
  return (
    <div className="sticky top-0 z-20 -mx-1 -mt-6 px-1 pt-8 pb-2 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
      <div role="tablist" aria-label="T-bow sections" className="flex w-full sm:inline-flex sm:w-auto gap-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, short, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => onChange(id)}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              tab === id ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0 max-[419px]:hidden" aria-hidden />
            <span className="sm:hidden" aria-hidden>
              {short}
            </span>
            <span className="max-sm:sr-only">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
