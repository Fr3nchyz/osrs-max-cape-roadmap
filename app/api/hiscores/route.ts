import { NextResponse } from "next/server";

const USERNAME = "fr3nchy";
const JAGEX_URL = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${USERNAME}`;

// Avoid caching so "Sync Live" actually pulls fresh XP.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(JAGEX_URL, {
      headers: { "User-Agent": "max-cape-roadmap/1.0 (personal hiscores lookup)" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Jagex HiScores returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach Jagex HiScores", detail: String(err) },
      { status: 502 }
    );
  }
}
