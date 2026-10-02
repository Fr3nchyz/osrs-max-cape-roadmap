"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, CircleHelp, Clock, ExternalLink, Search, TrendingDown, TriangleAlert } from "lucide-react";
import { formatGp } from "@/lib/format";
import { CLAIM_STATUSES, RESEARCH_RATES, type Claim, type ClaimStatus } from "@/lib/research";
import type { ResearchResponse } from "../api/research/route";
import { useJson } from "../companion/useLive";
import { Card, CardTitle, LABEL, Loading, Notice, RetryButton } from "../companion/ui";
import SectionNav from "../SectionNav";

const STATUS: Record<ClaimStatus, { label: string; Icon: typeof CheckCircle2; cls: string }> = {
  VERIFIED: { label: "Verified", Icon: CheckCircle2, cls: "text-green-500" },
  INFLATED: { label: "Inflated", Icon: TrendingDown, cls: "text-yellow-500" },
  OUTDATED: { label: "Outdated", Icon: Clock, cls: "text-neutral-400" },
  HIGH_RISK: { label: "High risk", Icon: TriangleAlert, cls: "text-red-400" },
  UNVERIFIED: { label: "Unverified", Icon: CircleHelp, cls: "text-neutral-500" },
};

export default function ResearchPage() {
  const research = useJson<ResearchResponse>("/api/research");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ClaimStatus | "ALL">("ALL");

  const claims = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (research.data?.claims ?? []).filter(
      (c) =>
        (status === "ALL" || c.status === status) &&
        (q === "" || `${c.method} ${c.creator ?? ""} ${c.assumptions} ${c.notes.join(" ")}`.toLowerCase().includes(q))
    );
  }, [research.data, query, status]);

  const counts = useMemo(() => {
    const n: Record<string, number> = {};
    for (const c of research.data?.claims ?? []) n[c.status] = (n[c.status] ?? 0) + 1;
    return n;
  }, [research.data]);

  const rateCount = Object.keys(RESEARCH_RATES).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-4 lg:p-10 font-sans selection:bg-yellow-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center shadow-lg shadow-yellow-900/40">
              <BookOpen className="w-7 h-7 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Research</h1>
              <p className="text-[11px] font-black text-neutral-500 uppercase tracking-widest">
                Claims checked against your account
              </p>
            </div>
          </div>
          <SectionNav />
        </header>

        <Card aria-labelledby="research-how">
          <CardTitle id="research-how" icon={BookOpen} aside={`${rateCount} personal rate${rateCount === 1 ? "" : "s"} in use`}>
            How this works
          </CardTitle>
          <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
            Research is added in a Claude Code session, not here: paste a YouTube transcript or a Gemini summary and say
            &ldquo;add to research&rdquo;. Each claim is checked against the OSRS Wiki, live prices and your gear, stats
            and kill counts, then saved in the repo. Personal rates from verified claims feed the method ranking on the
            T-bow page until you have your own 10-hour log.
          </p>
        </Card>

        <Card aria-labelledby="claims-title">
          <CardTitle id="claims-title" icon={Search} aside={research.data ? `${claims.length} of ${research.data.claims.length}` : undefined}>
            Claims
          </CardTitle>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="relative flex-1 min-w-[12rem]">
              <span className="sr-only">Search claims</span>
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Method, creator, note…"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-yellow-600"
              />
            </label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status">
              {(["ALL", ...CLAIM_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                    status === s
                      ? "bg-yellow-600 text-white border-yellow-500"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                  }`}
                >
                  {s === "ALL" ? "All" : STATUS[s].label}
                  {s !== "ALL" && counts[s] ? ` ${counts[s]}` : ""}
                </button>
              ))}
            </div>
          </div>

          {research.loading && !research.data && (
            <div className="mt-4">
              <Loading>Loading research…</Loading>
            </div>
          )}
          {research.error && !research.data && (
            <div className="mt-4">
              <Notice tone="error" action={<RetryButton onClick={research.reload} />}>
                Research unavailable ({research.error}).
              </Notice>
            </div>
          )}
          {research.data && claims.length === 0 && (
            <p className="mt-4 text-xs text-neutral-500">No claims match.</p>
          )}

          <ul className="mt-4 space-y-3">
            {claims.map((c) => (
              <ClaimCard key={c.id} claim={c} inUse={RESEARCH_RATES[c.methodId ?? ""]?.claimId === c.id} />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ClaimCard({ claim: c, inUse }: { claim: Claim; inUse: boolean }) {
  const s = STATUS[c.status];
  return (
    <li className="rounded-2xl border border-neutral-800 bg-neutral-950/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-white">{c.method}</p>
          <p className="text-[11px] text-neutral-500">
            {c.creator ?? c.source}
            {c.publishedAt ? ` · published ${c.publishedAt}` : ""} · added {c.addedAt}
            {c.url && (
              <>
                {" · "}
                <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-yellow-600 hover:text-yellow-500">
                  source <ExternalLink className="w-3 h-3" aria-hidden />
                </a>
              </>
            )}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider ${s.cls}`}>
          <s.Icon className="w-3.5 h-3.5" aria-hidden /> {s.label}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Figure label="Claimed" value={c.claimedGpPerHour} />
        <Figure label="Checked" value={c.checkedGpPerHour} />
        <Figure label="For you" value={c.personalGpPerHour} strong={inUse} />
      </dl>
      {c.assumptions && <p className="mt-2 text-[11px] text-neutral-500">Assumes: {c.assumptions}</p>}
      {c.notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-neutral-300 list-disc pl-4">
          {c.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {inUse && <p className="mt-2 text-[11px] font-bold text-yellow-500">Used as your planning rate for this method.</p>}
    </li>
  );
}

function Figure({ label, value, strong = false }: { label: string; value: number | null; strong?: boolean }) {
  return (
    <div className={`rounded-xl border px-2.5 py-2 ${strong ? "border-yellow-600/40 bg-yellow-600/10" : "border-neutral-800"}`}>
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-0.5 font-black text-white">{value === null ? "--" : `${formatGp(value)}/hr`}</dd>
    </div>
  );
}
