"use client";

import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import SectionNav from "./SectionNav";

/**
 * One header for every section: title block, the section switch in the same
 * place on each page, and a single Refresh that reloads everything live on
 * that page.
 */
export default function AppHeader({
  icon: Icon,
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Omit on pages with nothing live to reload. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Extra buttons shown before Refresh. */
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-yellow-500 to-yellow-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-900/40 transform -rotate-3 hover:rotate-0 transition-transform">
          <Icon className="w-7 h-7 text-white" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">{title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
      </div>

      <SectionNav />

      {onRefresh || actions ? (
        <div className="flex items-center gap-3 bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-800/50 backdrop-blur-xl">
          {actions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title="Reload live HiScores, prices and history on this page"
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden /> Refresh
            </button>
          )}
        </div>
      ) : (
        <div className="hidden lg:block w-[1px]" aria-hidden />
      )}
    </header>
  );
}
