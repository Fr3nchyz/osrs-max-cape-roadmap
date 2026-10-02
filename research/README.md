# Research

fr3nchy's audited research: YouTube guides, wiki figures and strategy notes,
each checked against his account. It lives in the repo, not the browser:
research is added in Claude Code sessions, and the app only reads the small
files below.

## Files

| Path | What | Loaded by |
|---|---|---|
| `sources/YYYY-MM-DD-slug.md` | One file per source: transcript or summary, plus the audit | Claude sessions only (never the app) |
| `claims.json` | One entry per claim (schema below) | The Research page, on demand via `/api/research` |
| `rates.json` | `{ methodId: { gpPerHour, claimId, checked } }`: personal planning rates from verified claims | The app (method ranking), every load; keep it tiny |

## Adding research (for Claude)

When fr3nchy pastes a transcript or a summary and says "add to research":

1. **Read** only what's relevant: `grep -ril "<method>" research/` before opening files.
2. **Check** each claim: OSRS Wiki (money-making guide, drop rates), live prices
   (`prices.runescape.wiki/api/v2/osrs`), and his account: gear from the bank
   snapshot (`lib/companion/baselineBank.ts` or a newer paste), stats from the
   HiScores, KC from Wise Old Man.
3. **Write** `sources/<date>-<slug>.md`: what the source says, what you checked,
   your conclusion. Keep raw transcripts trimmed to the parts that matter.
4. **Add** entries to `claims.json` with a status:
   - `VERIFIED`: holds for the stated setup.
   - `INFLATED`: overstated, or only true with gear/skill he doesn't have.
   - `OUTDATED`: was true; prices or an update changed it.
   - `HIGH_RISK`: real but fragile (volume, rare-drop dependence, manipulation).
   - `UNVERIFIED`: couldn't check yet.
5. **Rates**: if a claim gives a personal rate you're confident in, add it to
   `rates.json` keyed by a `methodId` from `lib/companion/methods.ts`. The app
   then ranks that method by it (until he logs 10 hours of his own).
6. Run `npm test`, commit, push, open a PR.

## Claim schema

```json
{
  "id": "YYYY-MM-DD-slug",
  "addedAt": "YYYY-MM-DD",
  "source": "youtube | wiki | knowledge-base | chat-paste | reddit | other",
  "creator": "string | null",
  "url": "string | null",
  "publishedAt": "YYYY-MM-DD | null",
  "method": "human name",
  "methodId": "id from lib/companion/methods.ts | null",
  "claimedGpPerHour": "number | null",
  "assumptions": "kills/hr, gear, invocation, etc.",
  "checkedGpPerHour": "number | null  (what the check found for the stated setup)",
  "personalGpPerHour": "number | null  (expected at fr3nchy's gear and skill)",
  "status": "VERIFIED | INFLATED | OUTDATED | HIGH_RISK | UNVERIFIED",
  "notes": ["string"],
  "sourceFile": "research/sources/... | null"
}
```

## Index

- `sources/2026-09-30-knowledge-base.md`: the Economic & Strategy Knowledge Base v1.0 (full text + audit notes)
- `sources/2026-10-02-wiki-money-making.md`: frost dragons, adamant dragons, crystal keys
