/**
 * Research claims and personal planning rates (see research/README.md).
 * claims.json is read on demand by /api/research; rates.json is tiny and
 * ships with the app so method ranking can use it.
 */

import rawRates from "@/research/rates.json";

export const CLAIM_STATUSES = ["VERIFIED", "INFLATED", "OUTDATED", "HIGH_RISK", "UNVERIFIED"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface Claim {
  id: string;
  addedAt: string;
  source: string;
  creator: string | null;
  url: string | null;
  publishedAt: string | null;
  method: string;
  methodId: string | null;
  claimedGpPerHour: number | null;
  assumptions: string;
  checkedGpPerHour: number | null;
  personalGpPerHour: number | null;
  status: ClaimStatus;
  notes: string[];
  sourceFile: string | null;
}

export interface ResearchRate {
  gpPerHour: number;
  claimId: string;
  checked: string;
}

const isStr = (v: unknown): v is string => typeof v === "string";
const strOrNull = (v: unknown): string | null => (isStr(v) ? v : null);
const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Keeps well-formed claims and drops the rest, newest first. */
export function parseClaims(raw: unknown): Claim[] {
  if (!Array.isArray(raw)) return [];
  const out: Claim[] = [];
  for (const c of raw) {
    if (typeof c !== "object" || c === null) continue;
    const r = c as Record<string, unknown>;
    if (!isStr(r.id) || !isStr(r.method) || !isStr(r.addedAt)) continue;
    if (!(CLAIM_STATUSES as readonly string[]).includes(r.status as string)) continue;
    out.push({
      id: r.id,
      addedAt: r.addedAt,
      source: isStr(r.source) ? r.source : "other",
      creator: strOrNull(r.creator),
      url: strOrNull(r.url),
      publishedAt: strOrNull(r.publishedAt),
      method: r.method,
      methodId: strOrNull(r.methodId),
      claimedGpPerHour: numOrNull(r.claimedGpPerHour),
      assumptions: isStr(r.assumptions) ? r.assumptions : "",
      checkedGpPerHour: numOrNull(r.checkedGpPerHour),
      personalGpPerHour: numOrNull(r.personalGpPerHour),
      status: r.status as ClaimStatus,
      notes: Array.isArray(r.notes) ? r.notes.filter(isStr) : [],
      sourceFile: strOrNull(r.sourceFile),
    });
  }
  return out.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.id.localeCompare(b.id));
}

export function parseRates(raw: unknown): Record<string, ResearchRate> {
  const out: Record<string, ResearchRate> = {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v !== "object" || v === null) continue;
    const r = v as Record<string, unknown>;
    const gp = numOrNull(r.gpPerHour);
    if (gp === null || gp <= 0 || !isStr(r.claimId) || !isStr(r.checked)) continue;
    out[id] = { gpPerHour: gp, claimId: r.claimId, checked: r.checked };
  }
  return out;
}

/** Personal planning rates from verified research, by method id. */
export const RESEARCH_RATES: Record<string, ResearchRate> = parseRates(rawRates);
