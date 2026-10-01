"use client";

import { Crosshair, RefreshCw } from "lucide-react";
import SectionNav from "../SectionNav";

// Same three-part header as the roadmap (title block, section switch, actions),
// so the switch sits in the same place on both pages.
export default function CompanionHeader({
  username,
  onRefresh,
  refreshing,
}: {
  username: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-yellow-500 to-yellow-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-900/40 transform -rotate-3 hover:rotate-0 transition-transform">
          <Crosshair className="w-7 h-7 text-white" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
            T-bow Companion
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Funding plan: {username}</p>
          </div>
        </div>
      </div>

      <SectionNav />

      <div className="flex items-center gap-3 bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-800/50 backdrop-blur-xl">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden /> Refresh price
        </button>
      </div>
    </header>
  );
}
