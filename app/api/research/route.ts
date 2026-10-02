import { NextResponse } from "next/server";
import rawClaims from "@/research/claims.json";
import { parseClaims, type Claim } from "@/lib/research";

export type ResearchResponse = { claims: Claim[] };

// Static data from the repo: claims change only when research is committed.
export const dynamic = "force-static";

export function GET() {
  const body: ResearchResponse = { claims: parseClaims(rawClaims) };
  return NextResponse.json(body);
}
