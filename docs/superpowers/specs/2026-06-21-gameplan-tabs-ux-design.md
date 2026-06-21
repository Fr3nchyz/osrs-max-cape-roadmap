# Game Plan restructure + both-tabs UX overhaul — design

Date: 2026-06-21
Project: OSRS Max Cape Roadmap (`/Users/amaurybat/personalProjects/claude/osrs`)

## Context

The dashboard has two tabs: Roadmap (live hiscores dashboard + per-skill training cards) and
Game Plan (goal list + a "Suggested Next" AFK queue). Two problems:

1. **Game Plan conflates exploration and commitment.** Suggested Next, draft goals, and the real
   plan all live in one undifferentiated list. The user wants to separate "brainstorming what to do"
   from "the committed plan for my next sessions."
2. **The frontend needs a UX pass.** Sub-8px labels hurt legibility, some hero stats are cryptically
   labelled, and the skill cards carry redundant micro-UI.

The user plays OSRS on the iOS game app, not in this dashboard — so the site is **desktop-first,
mobile-accessible** (must reflow to a phone without breaking, but desktop is the design target).
The AFK-method logic in `app/skills.ts` is unaffected (it models how the user *plays*, not how they
view the site).

## Information architecture: three tabs

Replace the 2-tab switcher with three, driven by the existing `Goal.status` field
(`planned | active | done`) — **no data schema change**.

- **Roadmap** — unchanged in purpose: dashboard + skill cards. Gets a UX pass.
- **Planning** — the workshop: Suggested Next queue, a persisted free-form brainstorm notes area, and
  draft goal cards (`status: "planned"`).
- **Final Plan** — the committed queue: `active` goals, ordered by `sort`, reorderable, with a rollup
  strip; `done` goals collapse in a "Completed" accordion at the bottom.

### Goal flow (status-based, single list)

| Action | Effect |
|---|---|
| Suggested Next → **Add** | Creates goal `status: "active"` → lands directly in Final Plan |
| Planning → **New goal** | Creates goal `status: "planned"` → draft card in Planning |
| Planning draft → **Commit to plan** | `planned` → `active` (moves to Final Plan) |
| Final Plan → **Un-commit** | `active` → `planned` (moves back to Planning) |
| Final Plan → **Done** | `active` → `done` (collapses into Completed) |

The current single status-cycle chip is replaced by explicit, labelled actions (Commit / Un-commit /
Done) — clearer than a mystery cycle. Reorder (up/down) stays on `active` goals in Final Plan.

## Data model

`Goal` type is unchanged: `{ id, title, target, notes, status, sort }` in localStorage key
`osrs-plan-fr3nchy`.

**One new persisted field:** a free-form brainstorm notes string for the Planning tab, stored under a
new key `osrs-brainstorm-fr3nchy` (kept separate from the goals array so it round-trips independently).

## Components

`app/page.tsx` holds the shell + Roadmap. The Game Plan work splits into focused components under
`app/` (each one purpose, testable in isolation):

- `app/GamePlan.tsx` → becomes the **Planning** tab (`Planning.tsx`): Suggested Next (collapsible) +
  brainstorm notes + draft cards + New-goal form. Receives `skills` (live hiscores) and a shared
  goal-store API.
- `app/FinalPlan.tsx` (new): rollup strip + ordered active queue + Completed accordion.
- `app/useGoals.ts` (new): a small hook owning the goals array + localStorage persistence + the
  mutations (`add`, `update`, `remove`, `move`, `setStatus`). Both Planning and Final Plan consume it
  so they share one source of truth and stay in sync within a render. (Currently `GamePlan.tsx` owns
  this inline; lifting it out lets two tabs share it.)

`page.tsx` renders the active tab and passes `skills` down. Rollup math (committed hours, projected
finish date, GP swing) reuses the same per-method calculation already in the Roadmap dashboard memo —
extract a tiny helper into `app/skills.ts` (`hoursFor(skill, method)` / reuse `bestMethod`) so the two
tabs don't duplicate the formula.

## UX changes

**Shell**
- 3-tab bar, sticky on scroll, desktop-sized targets.
- Raise sub-8px labels to a ~10–11px floor; keep the dense dark OSRS aesthetic.
- Grids collapse to single column on narrow viewports; desktop multi-column density is preserved.

**Roadmap**
- Relabel hero stats: "Financial Impact" → "Profit at max"; "Efficiency Goal" → "Skills left".
- Skill cards: fold the "halfway mark" micro-bar into the main 99-progress bar; give the method
  `<select>` and the efficient/XP ordering toggle more room.

**Planning**
- Suggested Next collapsible (collapsed once ≥1 goal exists).
- Brainstorm notes textarea at top, persisted.
- Draft cards: title/target/notes + **Commit to plan**.

**Final Plan**
- Rollup strip (committed hours · projected finish date · GP swing) from `active` goals only.
- Numbered reorderable queue; each card: method · hours · AFK badge + **Done** / **Un-commit**.
- Completed accordion (collapsed) for `done` goals.

## Out of scope

- Visual polish is a **separate follow-up pass** after structure lands (desktop, mobile sanity check).
- Supabase migration of goals + settings (still banked; needs `sbp_` token).
- Sailing method data remains placeholder until the user researches it.

## Verification

1. `npm run build` clean.
2. Roadmap: relabelled stats; cards render; method/ordering controls usable.
3. Planning: Suggested Next collapses; brainstorm notes persist across reload; New goal creates a
   `planned` draft; Commit moves it to Final Plan.
4. Final Plan: Add-from-suggestion lands here as `active`; rollup totals match the committed goals;
   reorder works; Done → Completed accordion; Un-commit returns the goal to Planning.
5. Resize to a phone width: tabs + grids reflow without overflow/breakage.
6. Browser screenshot of all three tabs.
