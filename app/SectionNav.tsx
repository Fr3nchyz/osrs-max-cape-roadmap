"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Crosshair, Trophy } from "lucide-react";

const SECTIONS = [
  { href: "/", label: "Max Cape Roadmap", lead: "Max Cape ", short: "Roadmap", tail: "", Icon: Trophy },
  { href: "/companion", label: "T-bow Companion", lead: "", short: "T-bow", tail: " Companion", Icon: Crosshair },
  { href: "/research", label: "Research", lead: "", short: "Research", tail: "", Icon: BookOpen },
] as const;

// Site-level switch between the two pages. Styled like the roadmap's tab bar.
// Between md and xl it shares a header row with the title and buttons, so the
// labels shorten there, and again on phones (below sm); between sm and md the full labels return.
export default function SectionNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="shrink-0">
      <div className="inline-flex gap-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-1">
        {SECTIONS.map((s) => {
          const active = s.href === "/" ? pathname === "/" : pathname === s.href || pathname.startsWith(`${s.href}/`);
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              aria-label={s.label}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                active ? "bg-neutral-800 text-yellow-500" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <s.Icon className="w-4 h-4 shrink-0 max-[419px]:hidden" aria-hidden />
              <span>
                {s.lead && <span className="max-sm:hidden md:max-xl:hidden">{s.lead}</span>}
                {s.short}
                {s.tail && <span className="max-sm:hidden md:max-xl:hidden">{s.tail}</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
