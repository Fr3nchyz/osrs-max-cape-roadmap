# Source: OSRS Economic & Strategy Knowledge Base v1.0 (fr3nchy)

- Kind: personal strategy document (Word), market anchor 2026-09-30
- Added: 2026-10-02
- Used by: lib/companion (stages, checklist, scenarios, method ladder), lib/market/flipBook.ts (flip screen)
- Claims extracted: see research/claims.json entries with `"source": "knowledge-base"`

## Audit notes (2026-10-01)

- Stage bands overlap (150-250M / 75-150M); the app follows the state-machine exits.
- PvM share: scenario table says 60%, weekly table 65%; the app follows 60% (now user-set, default 25%).
- No slippage number given; the app defaults to 1%.
- Wiki model rates in the method ladder are max-gear ceilings; the app plans with the learner low end.

## Full text (extracted)

```text
OSRS ECONOMIC &STRATEGY KNOWLEDGE BASE
Personalized Twisted Bow Acquisition + Maxing Plan
Account: fr3nchy
<<TABLE>>
Account Position | Value / Status
Current bank value | ~850M GP
Liquid cash | ~60M GP
Potentially liquidatable tradeables | ~600M GP
Risk tolerance | Medium-high
Primary goals | Twisted bow ownership and account maxing
Market anchor | September 30, 2026
<</TABLE>>
<<TABLE>>
Core strategyProtect the earning engine now; finish Desert Treasure II, build repeatable ToA and Doom competency, progress maxing during lower-focus windows, and liquidate only when the T-bow funding gap is small enough to bridge without destroying supporting gear or the minimum cash reserve.
<</TABLE>>
[SmallNote] Prepared as a practical account operating manual and code-ready decision-engine reference.
[Heading1] Table of Contents
Right-click and select Update Field to refresh the table of contents.
[Heading2] How to use this report
[ListBullet] Use the Executive Plan and Next 30 Hours sections as the immediate playbook.
[ListBullet] Use the purchase trigger and staged liquidation rules before selling equipment.
[ListBullet] Record realized kills per hour, deaths and supplies; replace model assumptions with personal telemetry.
[ListBullet] Refresh market data before every major liquidation or T-bow purchase decision.
[ListBullet] Treat all GP/hour figures as models, not guaranteed outcomes.
[Heading2] Evidence boundary
The report preserves the September 30, 2026 research conclusions established in the source conversation. Live prices are point-in-time observations and can move materially. The Wiki API provides 7-day and 30-day lookbacks; a 90-day series should be derived from the six-month endpoint or internally stored hourly observations. No synthetic 90-day return is inserted where a validated series was unavailable.
[Heading1] Executive Recommendation for fr3nchy
<<TABLE>>
Recommended routeDT2 -> stable ToA completions -> Doom competency -> measured Maggot King trial -> staged liquidation near the funding threshold -> T-bow rebuild. Run maxing in parallel using short weekday and low-attention blocks.
<</TABLE>>
[Heading2] Immediate top five actions
[ListNumber] Complete Desert Treasure II. It removes the final quest blocker and opens four repeatable bosses plus permanent account rewards.
[ListNumber] Preserve the already-purchased Fletching materials and finish Fletching in compatible downtime.
[ListNumber] Establish a deathless Tombs of Amascut baseline, then increase invocation only when completion consistency is maintained.
[ListNumber] Learn Doom of Mokhaiotl in focused weekend blocks; it is the strongest direct synergy with a future T-bow rebuild.
[ListNumber] Revalue the bank using expected net sale proceeds, not the headline bank-value plugin estimate, before any liquidation.
[Heading2] Decision summary
<<TABLE>>
Decision | Recommendation | Reason
Liquidate today? | No | A roughly 660M combined cash/liquidation state still leaves a large gap and would weaken income generation.
Finish DT2? | Yes - immediate | Permanent unlock, boss access, lamps and full quest completion.
First new PvM focus | ToA | Scalable difficulty, accessible learning path and useful pre-/post-T-bow content.
Second new PvM focus | Doom | High ceiling and exceptional T-bow rebuild synergy.
Max or T-bow first? | Parallel | Use attention-matched blocks; protect GP generation while completing long skills.
Minimum purchase reserve | 25M GP | Provides ammunition, supplies, deaths and transaction flexibility.
Risk posture | Measured medium-high | Allow learning and limited speculation, but cap concentration before the rebuild.
<</TABLE>>
[Heading2] The one rule that matters
Do not buy the bow simply because aggregate bank value reaches its guide price. Buy only when liquid cash plus realistic net sale proceeds cover the executable price, the 25M reserve, and a functional supporting kit - and when at least half of the next 100 focused PvM hours will use the bow productively.
[Heading1] Current Macro Economy and T-bow Market State
[Heading2] Verified market snapshot
<<TABLE>>
Asset | Observed price | Daily volume | Planning interpretation
Twisted bow | 1,356,626,084 | 20 | Thin market; guide price may not equal executable offer.
Tumeken's shadow | 779,560,996 | 71 | Lower-cost megarare; demand exposed to balance changes.
Scythe of Vitur | 1,184,276,282 | 43 | High-value melee concentration with charge economics.
Torva armour set | ~491,008,541 | 16 | Capital-dense armor; potential staged-liquidation reservoir.
Ancestral set | 201,796,711 | 27 | Highly productive with Shadow; situational otherwise.
Blood rune | ~339 | ~16.4M | Deep, highly liquid supply market.
Saradomin brew (4) | ~7,000 | ~1.0M | High-volume PvM supply.
Super restore (4) | ~10,014 | ~1.06M | High-volume PvM supply.
<</TABLE>>
[Heading2] Macro drivers
[ListBullet] GE taxation removes GP and funds selected item sinks. Sink membership is structural support, not a guaranteed floor.
[ListBullet] Liquidity is fragmented: supplies can trade millions of units daily while megarare turnover may be measured in dozens.
[ListBullet] Updates can rotate combat-style demand quickly, creating both liquidation risk and temporary opportunity.
[ListBullet] The upcoming Fractured Archive and ongoing Sailing economy introduce event-driven volatility in weapons, armor, runes and supplies.
[ListBullet] Guide-price responsiveness has increased, but live offers remain more important than guide prices for thin items.
[Heading2] What matters specifically for fr3nchy
<<TABLE>>
Market condition | Effect | Response
T-bow rises | Funding gap expands | Continue income production; do not chase with forced liquidation.
T-bow falls 5-10% | Gap compresses | Revalue sale proceeds and consider staged offers if trigger conditions pass.
Productive owned gear rises | Liquidation power improves | Harvest only near threshold; avoid premature selling.
Supplies spike | PvM cost rises | Maintain 5-10 hours of supplies, but avoid oversized stockpiles.
New-content speculation increases | Spreads widen and reverse faster | Cap catalyst exposure at 5M initially.
<</TABLE>>
[Heading1] Personalized T-bow Gap and Rebuild Analysis
[Heading2] Funding model
Planning target = T-bow executable price + 25,000,000 GP reserve
1,356,626,084 + 25,000,000 = 1,381,626,084 GP
<<TABLE>>
Capital state | Usable capital | Gap to planning target
Current cash only | 60.0M | 1,321.6M
600M total liquidatable | 600.0M | 781.6M
600M tradeables + 60M cash | 660.0M | 721.6M
Entire 850M headline bank - theoretical | 850.0M | 531.6M
<</TABLE>>
The theoretical 850M state is not an actionable liquidation figure. It may include untradeables, committed inputs, supplies, and productive equipment. The 600M estimate also needs to be converted into net proceeds after GE tax and spread loss.
[Heading2] Net-liquidation calculation
Net sale proceeds = Sum(quantity x sale price - sale tax) - expected slippage
[ListBullet] Price each sale candidate using current executable offers, not only the bank-value guide price.
[ListBullet] Use the 5M per-item tax cap for items above the cap threshold.
[ListBullet] Apply an explicit slippage reserve to low-volume armor and weapons.
[ListBullet] Do not count Fletching materials or permanent upgrades as available capital.
[ListBullet] Run liquidation in stages so a single poor fill does not determine the rebuild cost.
[Heading2] Why liquidation now is inefficient
Even if 600M of tradeables is additional to the current 60M cash, the remaining gap is approximately 721.6M. Selling the productive bank at that distance would exchange diversified earning power for idle cash while the bow remains unaffordable. The correct sequence is to use the current bank to close most of the gap, then liquidate marginal items when sale proceeds can complete the purchase.
[Heading2] Suggested liquidation phases
<<TABLE>>
Phase | Trigger | Actions
0 - No liquidation | Gap >250M | Keep the productive bank; sell only dead inventory and duplicates.
1 - Preparation | Gap 150-250M | Build item-level sale list; reduce unused special-purpose gear.
2 - Staging | Gap 75-150M | Sell marginal armor/upgrades in tranches; maintain three-style core.
3 - Execution | Gap <=75M and all gates pass | Place patient sales, confirm live T-bow price and complete purchase.
4 - Rebuild | After purchase | Concentrate play on high-synergy content; replenish reserve first.
<</TABLE>>
[Heading1] Gear Retention and Liquidation Rules
[Heading2] Retain regardless of the rebuild
[ListBullet] Permanent unlocks and untradeable account upgrades.
[ListBullet] Committed Fletching materials required for the planned 99.
[ListBullet] Rune pouch, defenders, Ava devices, key teleport and diary infrastructure.
[ListBullet] A functional melee weapon, ranged backup and powered staff for multi-style encounters.
[ListBullet] At least 25M liquid cash after buying the bow.
[ListBullet] Five to ten hours of ammunition, food, potions, runes and death-cost coverage.
[Heading2] Candidate sale hierarchy
<<TABLE>>
Priority | Candidate category | Sell when | Keep when
1 | Duplicates/cosmetics | No functional use | Sentimental value outweighs speed to goal
2 | Unused specialist gear | Unused in last 30 focused PvM hours | Required for planned learning content
3 | Marginal armor upgrades | DPS loss is small and gap is near threshold | Materially increases realized GP/hour
4 | Expensive jewelry/utility | Cheap substitute preserves most value | Required across several planned methods
5 | Torva/Ancestral components | Incremental value below T-bow uplift | Essential to active melee/Shadow strategy
Never | Permanent upgrades/Fletching inputs | Not applicable | Always
<</TABLE>>
[Heading2] Item-level retention test
<<TABLE>>
For each tradeable item:  recent_use_hours = hours used in last 30 focused PvM hours  incremental_gp_hr = measured GP/hr with item - measured GP/hr with substitute  recovery_hours = net_sale_value / max(incremental_gp_hr, 1)SELL if:  recent_use_hours == 0  OR (T-bow gap <= 150M AND incremental_gp_hr is immaterial)RETAIN if:  item enables planned content  OR item protects the minimum three-style kit  OR selling would reduce expected earnings more than T-bow adds
<</TABLE>>
[Heading2] Supporting kit after purchase
<<TABLE>>
Style | Minimum retained capability | Purpose
Ranged | T-bow, Ava device, affordable ranged armor, arrows | Primary rebuild engine
Melee | Fang or viable substitute, defender, basic strength gear | ToA rooms, Slayer and mechanics requiring melee
Magic | Powered staff, occult/basic robes, rune pouch | Multi-style content and utility
Utility | Food, restores, teleports and death reserve | Operational continuity
<</TABLE>>
[Heading1] Personalized PvM Learning Ladder
<<TABLE>>
Rank | Method | Wiki model | Learner planning range | Competent planning range | Why it fits
1 | ToA 150 -> 300 | ~3.60M at deathless 300 | 1.5-2.5M | 3.0-4.0M | Scalable difficulty and useful pre/post T-bow.
2 | Doom 1 -> 8 | ~9.74M | 2.5-5.0M | 6.0-8.0M | High ceiling and strongest T-bow synergy.
3 | Maggot King ranged | ~8.79M | 3.5-5.5M | 6.5-8.0M | Accessible ranged route; rare-heavy EV.
4 | Yama base/duo | ~5.85M solo model | Negative-3.0M | 4.0-6.0M | Advanced diversification; weaker rebuild synergy.
5 | Vorkath | ~4.07M | 3.2-3.8M | 3.8-4.2M | Reliable fallback and familiar execution.
6 | Zulrah | ~1.90M standard | 1.5-2.0M | 2.0-3.0M | Short sessions; lower ceiling.
<</TABLE>>
[SmallNote] Planning ranges are conservative operating assumptions for decision-making, not guaranteed returns. Replace them with personal 10-hour rolling results.
[Heading2] Learning progression by method
[Heading3] Tombs of Amascut
[ListBullet] Start at a raid level that preserves completions and lets mechanics become automatic.
[ListBullet] Increase invocation only after three consecutive clean completions.
[ListBullet] Track completion time, supplies, deaths and purple chance separately.
[ListBullet] Do not use a theoretical 300-level rate until runs are consistently deathless.
[ListBullet] Post-T-bow, reassess ranged room performance, but retain off-style capability.
[Heading3] Doom of Mokhaiotl
[ListBullet] Learn the early delves before optimizing full 1-8 cycles.
[ListBullet] Use weekend blocks because uninterrupted repetition matters more than isolated attempts.
[ListBullet] Track successful completions per hour and the value lost to failed chests/deaths.
[ListBullet] Treat the Wiki maximum as a ceiling; establish a personal baseline before projecting the T-bow gap.
[ListBullet] After T-bow purchase, prioritize this method if measured incremental profit exceeds the purchase-trigger threshold.
[Heading3] Maggot King
[ListBullet] Test the ranged setup first to avoid requiring the highest-cost magic setup.
[ListBullet] Run a minimum 50-kill sample before assessing supply usage and mechanical consistency.
[ListBullet] Display common-loot profit separately from rare-drop expected value.
[ListBullet] Do not liquidate productive equipment based on a rare-heavy headline rate.
[Heading3] Yama
[ListBullet] Defer until ToA and Doom provide stable income or until a team opportunity reduces the learning burden.
[ListBullet] Avoid expensive contract structures during the T-bow accumulation phase.
[ListBullet] Budget deaths and failed attempts as training cost, not as anomalous losses.
[ListBullet] Revisit after the T-bow rebuild only if owned off-style gear supports the method.
[Heading1] Desert Treasure II Decision
<<TABLE>>
Decision: complete nowDT2 is the last quest blocker and creates permanent account value before any liquidation. It unlocks four repeatable bosses, associated drop economies, the Ring of Shadows and three 100,000-XP combat lamps.
<</TABLE>>
[Heading2] Economic value
<<TABLE>>
Benefit | Value to the plan
Four boss unlocks | Adds diversified solo money-making options when raids or new bosses are unsuitable.
300,000 combat XP | Reduces the remaining Defence burden without consuming GP.
Quest completion | Removes the final quest blocker and protects future access requirements.
Ring/teleports | Permanent utility remains after a rebuild.
New drop markets | Provides optional exposure to Virtus, ancient rings, Soulreaper components and orbs.
<</TABLE>>
[Heading2] Lamp allocation
Default all 300,000 XP to Defence because Attack is only 1,228,825 XP from 99 and should finish naturally through Slayer and PvM. If exact live XP shows one lamp would immediately complete Attack and materially simplify style management, use only the required lamp there and place the remainder into Defence.
[Heading2] Post-quest boss test
[ListNumber] Try each unlocked boss for a small mechanical sample.
[ListNumber] Discard any method that remains below 70% of its conservative planning rate after deliberate practice.
[ListNumber] Keep the strongest one as a short-session weekday alternative.
[ListNumber] Do not add another full learning track until ToA and Doom are stable.
[Heading1] Remaining-Skill Maxing Plan
[Heading2] XP remaining
<<TABLE>>
Skill | Current level | Approx. XP remaining | Priority approach
Mining | 92 | 6,517,178 | Long background track; balanced or AFK method.
Sailing | 93 | 5,838,802 | Weekday blocks; measure current XP and profit.
Fletching | 95 | 4,262,873 | Already funded; use compatible downtime.
Hunter | 95 | 4,262,873 | Balanced or profitable active sessions.
Defence | 96 | 3,349,854 | DT2 lamps plus Slayer/PvM.
Attack | 98 | 1,228,825 | Finish naturally through melee PvM/Slayer.
Slayer | 98 | 1,228,825 | Profitable/boss tasks; integrates combat XP.
<</TABLE>>
[Heading2] Method matrix
<<TABLE>>
Skill | Efficiency-first | Balanced | Low-attention / profitable | Planning note
Mining | Volcanic Mine / current efficient method | Volcanic Mine | Amethyst | Avoid sacrificing focused PvM hours unless energy is low.
Sailing | Best current high-level route | Deep-sea/trial content | Lower-intensity voyages | Calibrate with three one-hour samples because current methods evolve.
Fletching | Fast darts | Arrows/bolts | Longbows | Inputs are committed; optimize around attention, not sunk cost.
Hunter | Fast chinchompas | Herbiboar/rumours | Bird houses | Use bird houses as periodic support, not the primary 99 route.
Defence | Efficient combat training | Slayer/PvM defensive style | AFK combat only for cleanup | Prefer integrated profitable XP.
Attack | Accurate style in PvM | Slayer | AFK only for cleanup | Likely completes before Slayer/Defence.
Slayer | Barrage/cannon routing | Profitable boss tasks | Low-intensity tasks | Choose account-value growth over pure XP when practical.
<</TABLE>>
[Heading2] Recommended sequencing
[ListNumber] Complete DT2 and apply combat lamps.
[ListNumber] Finish Fletching during travel, low-focus windows and compatible activities.
[ListNumber] Complete Slayer while directing melee experience first to Attack, then Defence.
[ListNumber] Use Sailing as a recurring weekday block and collect personal XP/profit data.
[ListNumber] Finish Hunter through a mix of active sessions and periodic runs.
[ListNumber] Run Mining continuously as the long-duration low-attention track.
[ListNumber] Clean up any remaining Defence through profitable combat whenever possible.
[Heading2] Opportunity-cost rule
Adjusted training cost/hour = Direct GP cost + forgone GP/hour - method profit
A “free” training method is not necessarily economically efficient if it replaces a 5M/hour focused PvM block. Conversely, an AFK method used when focused PvM would not occur has a much lower practical opportunity cost.
[Heading1] Parallel T-bow + Maxing Operating Model
[Heading2] Weekday operating blocks
<<TABLE>>
Available time | Default action | Fallback
Under 30 min | Collect/relist GE offers; birdhouse or short periodic loop | Bank organization and next-session setup
30-60 min | One familiar boss trip or focused skill block | Mining/Hunter/Sailing if interrupted
60-120 min | ToA practice or familiar GP method plus Fletching | Single-skill progress block
Low energy | AFK Mining or lower-intensity Sailing | Fletching processing
High energy | Mechanic-specific ToA/Doom practice | DT2 boss test
<</TABLE>>
[Heading2] Weekend operating blocks
[ListNumber] 15 minutes: collect offers, refresh prices and choose one learning objective.
[ListNumber] 90 minutes: focused ToA or Doom repetitions without changing the objective.
[ListNumber] 10-15 minute reset.
[ListNumber] 90-150 minutes: continue the same method to convert learning into consistency.
[ListNumber] Use remaining time for familiar profit or low-attention maxing based on fatigue.
[ListNumber] End with a two-minute log: completions, deaths, supplies, profit and next mechanic.
[Heading2] Weekly allocation target
<<TABLE>>
Activity | Share of focused time | Purpose
Income-producing PvM | 45% | Close T-bow gap while retaining account strength.
PvM learning | 20% | Increase future realized GP/hour.
Maxing | 25% | Advance all remaining skills in attention-matched blocks.
Market management | 5% | Low-time capital return.
Review/setup | 5% | Prevent unplanned gear sales and wasted sessions.
<</TABLE>>
[Heading2] Next 30 gameplay hours
<<TABLE>>
Hours | Action | Success measure
5 | Complete DT2 | Quest complete; lamps allocated; boss access tested.
8 | ToA progression | Consistent deathless baseline; tracked completion time.
6 | Doom learner runs | Stable early delves and recorded net cost/profit.
4 | Maggot King ranged trial | 50-kill target or equivalent structured sample.
3 | Familiar Vorkath/Slayer income | Realized net GP/hour logged.
2 | Fletching | Committed materials converted to XP.
2 | Mining/Hunter/Sailing calibration | One-hour XP/profit samples recorded.
<</TABLE>>
[Heading1] Capital Allocation and Flipping Framework
[Heading2] 60M cash allocation
<<TABLE>>
Bucket | Amount | Operating rule
Untouchable reserve | 20M | Deaths, resupply and unexpected market movement.
Active flipping book | 18M | Maximum 4.5M in any one item.
PvM supplies | 12M | Reorder when approximately half remains.
Catalyst/speculation | 5M | One thesis at a time; no averaging down without new evidence.
Transaction buffer | 5M | Prevents forced sales and supports price checks.
Fletching inputs | Outside allocation | Committed to maxing; excluded from liquid capital.
<</TABLE>>
[Heading2] Flipping screen for the 18M book
<<TABLE>>
Candidate passes only if:  market data is fresh  latest high and low both exist  post-tax margin > 0  preferred post-tax ROI >= 1.2%  intended units <= min(4-hour limit, 0.5% of daily volume)  capital per item <= 4.5M  expected fill window fits the next login cadenceReject if:  spread is based on one stale trade  daily volume is too low for a clean exit  the item is moving solely on rumor  gross spread does not exceed tax plus slippage
<</TABLE>>
[Heading2] Representative screening categories
<<TABLE>>
Category | Examples | Strength | Risk
Runes | Blood, soul, death, chaos | Very deep volume; frequent price discovery | Small per-unit margin; tax/rounding matters
Potions/food | Brews, restores, sharks | Strong PvM demand | Dose-linked limits and update spikes
Ammunition | Darts, arrows, chinchompas | Liquid and limit-friendly | Supply shock around balance changes
Resources | Herbs, ores, bones, logs | Broad demand | Skilling/update seasonality
Mid-value gear | Fang, godswords, zenyte items | Higher nominal margins | Slower fills and larger reversals
Megarares | T-bow, Shadow, Scythe | Capped tax above threshold | Unsuitable for the current 18M book
<</TABLE>>
[Heading2] Review cadence and risk controls
[ListBullet] Review offers at each login; mandatory thesis review after 24 hours.
[ListBullet] Never chase an instant-buy price to “complete” a flip.
[ListBullet] Exit when the post-tax edge disappears or the underlying update thesis changes.
[ListBullet] Cap catalyst exposure at 5M until liquid wealth materially increases.
[ListBullet] Stop opening new positions when the T-bow gap falls below 150M; convert the book to cash.
[Heading1] SECTION 1 - System Ontology and Data Schemas
[Heading2] Core entities
<<TABLE>>
{  "$schema": "https://json-schema.org/draft/2020-12/schema",  "$defs": {    "Item": {      "type": "object",      "required": ["itemId", "name", "taxStatus"],      "properties": {        "itemId": {"type": "integer", "minimum": 1},        "name": {"type": "string"},        "buyLimit4h": {"type": ["integer", "null"], "minimum": 0},        "taxStatus": {"enum": ["TAXABLE", "EXEMPT"]},        "category": {"enum": ["CONSUMABLE", "RAW", "MID_GEAR", "MEGARARE", "OTHER"]}      },      "additionalProperties": false    },    "MarketState": {      "type": "object",      "required": ["itemId", "observedAt", "dataQuality"],      "properties": {        "itemId": {"type": "integer"},        "observedAt": {"type": "string", "format": "date-time"},        "latestHigh": {"type": ["integer", "null"]},        "latestLow": {"type": ["integer", "null"]},        "highTime": {"type": ["integer", "null"]},        "lowTime": {"type": ["integer", "null"]},        "volume24h": {"type": "integer", "minimum": 0},        "spreadPct": {"type": ["number", "null"]},        "returnVariance7d": {"type": ["number", "null"], "minimum": 0},        "liquidityScore": {"type": ["number", "null"], "minimum": 0, "maximum": 100},        "dataQuality": {"enum": ["LIVE", "STALE", "SPARSE", "MISSING"]}      },      "additionalProperties": false    }  }}
<</TABLE>>
[Heading2] Claim and requirement schemas
<<TABLE>>
{  "YouTubeGuideClaim": {    "type": "object",    "required": ["url", "publishedAt", "method", "claimedGpPerHour", "status"],    "properties": {      "url": {"type": "string", "format": "uri"},      "publishedAt": {"type": "string", "format": "date-time"},      "method": {"type": "string"},      "claimedGpPerHour": {"type": "number", "minimum": 0},      "verifiedNetGpPerHour": {"type": ["number", "null"]},      "assumedActionsPerHour": {"type": ["number", "null"]},      "rareDropEvShare": {"type": ["number", "null"], "minimum": 0, "maximum": 1},      "status": {"enum": ["VERIFIED", "INFLATED", "OUTDATED", "HIGH_RISK"]},      "auditNotes": {"type": "array", "items": {"type": "string"}}    },    "additionalProperties": false  },  "StrategyRequirement": {    "type": "object",    "required": ["strategyId", "risk", "returnType"],    "properties": {      "strategyId": {"type": "string"},      "minimumBankGp": {"type": "integer", "minimum": 0},      "minimumCombatLevel": {"type": ["integer", "null"], "minimum": 3, "maximum": 126},      "minimumQuestPoints": {"type": ["integer", "null"], "minimum": 0},      "requiredQuests": {"type": "array", "items": {"type": "string"}},      "requiredSkills": {"type": "object", "additionalProperties": {"type": "integer"}},      "risk": {"enum": ["LOW", "MEDIUM", "HIGH"]},      "returnType": {"enum": ["DETERMINISTIC", "MIXED_EV", "RARE_DROP_EV"]}    },    "additionalProperties": false  }}
<</TABLE>>
[Heading1] Personalized UserAccountState Schema
<<TABLE>>
{  "UserAccountState": {    "type": "object",    "required": ["rsn", "bankValueGp", "cashGp", "riskTolerance", "target"],    "properties": {      "rsn": {"const": "fr3nchy"},      "accountType": {"const": "STANDARD_MAIN"},      "bankValueGp": {"type": "integer", "minimum": 0},      "cashGp": {"type": "integer", "minimum": 0},      "liquidatableTradeablesGp": {"type": "integer", "minimum": 0},      "committedAssets": {"type": "array", "items": {"type": "string"}},      "completedQuests": {"type": "array", "items": {"type": "string"}},      "incompleteQuests": {"type": "array", "items": {"type": "string"}},      "skills": {"type": "object", "additionalProperties": {"type": "integer", "minimum": 1, "maximum": 99}},      "weekdayHours": {"type": "number", "minimum": 0},      "weekendHours": {"type": "number", "minimum": 0},      "riskTolerance": {"enum": ["LOW", "MEDIUM", "MEDIUM_HIGH", "HIGH"]},      "target": {        "type": "object",        "required": ["itemId", "minimumReserveGp"],        "properties": {          "itemId": {"const": 20997},          "minimumReserveGp": {"type": "integer", "minimum": 0},          "minimumPlannedUseShare": {"type": "number", "minimum": 0, "maximum": 1}        }      }    },    "additionalProperties": false  }}
<</TABLE>>
[Heading2] Current account instance
<<TABLE>>
{  "rsn": "fr3nchy",  "accountType": "STANDARD_MAIN",  "bankValueGp": 850000000,  "cashGp": 60000000,  "liquidatableTradeablesGp": 600000000,  "committedAssets": ["FLETCHING_95_TO_99_MATERIALS"],  "incompleteQuests": ["DESERT_TREASURE_II"],  "skills": {    "Mining": 92, "Sailing": 93, "Fletching": 95,    "Hunter": 95, "Defence": 96, "Attack": 98, "Slayer": 98  },  "weekdayHours": 1.5,  "weekendHours": 4.0,  "riskTolerance": "MEDIUM_HIGH",  "target": {    "itemId": 20997,    "minimumReserveGp": 25000000,    "minimumPlannedUseShare": 0.50  }}
<</TABLE>>
[Heading2] API endpoint mapping
<<TABLE>>
Purpose | Endpoint | Required fields
All latest prices | /api/v2/osrs/latest | data[itemId].high, highTime, low, lowTime
Single latest price | /api/v2/osrs/latest?id=20997 | Same fields for T-bow
Item mapping | /api/v2/osrs/mapping | id, name, limit, value, alch, icon
5-minute market | /api/v2/osrs/5m | avgHighPrice, avgLowPrice, high/low volume
Hourly market | /api/v2/osrs/1h | Hourly prices and volume
Historical series | /api/v2/osrs/timeseries?id=20997&lookback=30d | startTime, endTime, interval, data[]
Derived 90-day series | Request lookback=6m; filter locally | Retain timestamps >= now minus 90 days
<</TABLE>>
[Heading1] SECTION 2 - Mathematical Formula Matrix
[Heading2] Grand Exchange tax
Tax(S) = min(5,000,000, floor(0.02 x S))
For taxable items, S is the per-unit sale price. The seller pays the tax. Apply the exemption list before evaluating this formula.
[Heading2] Flip margin and break-even
Net margin = q x [S - Tax(S) - B] - other costs
Break-even sale price = minimum integer S such that S - Tax(S) >= B + cost per unit
Do not approximate break-even as simply 1.02 times the buy price: rounding, exemptions and the 5M cap create discontinuities.
[Heading2] PvM expected value
Net GP/hour = KPH x [drop EV/kill - supplies/kill - charges/kill - death EV/kill] - fixed hourly cost
Death EV/kill = P(death) x [reclaim fee + lost loot + recovery time x opportunity GP/hour]
[Heading2] Rare-drop decomposition
Rare-drop EV share = rare-drop EV / total gross EV
Common-loot GP/hour = KPH x common-loot EV - recurring costs
Decision views should display expected GP/hour, common-loot GP/hour and rare-drop EV share together. This prevents a mathematically correct long-run estimate from being mistaken for a short-session cash forecast.
[Heading2] Skill opportunity cost
Adjusted training cost/hour = direct cost/hour + forgone income/hour - training-method profit/hour
[Heading2] Volatility and liquidity
sigma_7 = stdev[ln(mid_t / mid_(t-1))]
Liquidity score = 100 x [0.45 Volume_n + 0.30 Fill_n + 0.25(1 - Spread_n)]
Opportunity score = 100 x [0.40 ROI_n + 0.30 Liquidity_n + 0.20(1 - Volatility_n) + 0.10 Catalyst_n] - Risk penalty
[Heading2] Hard rejection gates
<<TABLE>>
reject candidate if any are true:  high_price is null OR low_price is null  timestamp age > 2 aggregation intervals  post_tax_margin <= 0  daily_volume < 2 * intended_position_units  single_position_cap exceeded  catalyst has no dated official source  expected exit requires unrealistic share of daily volume
<</TABLE>>
[Heading1] SECTION 3 - Fact-Checking and Truth Audit Matrix
<<TABLE>>
Method | Headline model | fr3nchy planning range | Rare-drop exposure | Status | Primary risk
Doom 1-8 | ~9.74M/hr | 2.5-8.0M/hr | High | INFLATED for learner | Execution, failure cost and chest variance
Maggot King magic | ~10.64M/hr | 3.5-8.0M/hr | Very high | HIGH_RISK | Large share of EV from Elder venator fang
Maggot King ranged | ~8.79M/hr | 3.5-8.0M/hr | Very high | HIGH_RISK | KPH and rare-drop concentration
Yama solo | ~5.85M/hr | Negative-6.0M/hr | High | HIGH_RISK | Learning deaths, gear and contract risk
ToA 300 | ~3.60M/hr | 1.5-4.0M/hr | High | VERIFIED assumptions | Deathless completion and unique variance
Vorkath | ~4.07M/hr | 3.2-4.2M/hr | Low-medium | VERIFIED | KPH and supplies
Zulrah standard | ~1.90M/hr | 1.5-2.5M/hr | Medium | VERIFIED | Lower ceiling; execution
Deep-sea trawling | ~2.40M/hr cited | Measure directly | Market-dependent | NEEDS SAMPLE | Current XP and realized output
High-volume flipping | Variable | Use live screen | Low | VERIFIED framework | Tax, fills and adverse movement
Low-volume guide-price flips | Often very high | Not accepted | N/A | HIGH_RISK | Non-executable spread/manipulation
<</TABLE>>
[Heading2] Creator/guide audit rules
<<TABLE>>
Flag | Trigger
VERIFIED | Claim can be reproduced using current prices, stated KPH/actions, costs and sufficient volume.
INFLATED | Uses theoretical maximum KPH, excludes deaths, annualizes a brief periodic action, or omits sourcing time.
OUTDATED | Depends on mechanics, drops, balance or prices superseded by later changes.
HIGH_RISK | Output is low-volume, rare-drop dominated, contract-dependent or vulnerable to manipulation.
<</TABLE>>
[Heading2] Minimum evidence record
<<TABLE>>
claim_idsource_urlcreatorpublication_timestampmethodclaimed_gp_hourassumed_kph_or_actionsgear_assumptionsupply_basketprice_timestampverified_net_gp_hourrare_drop_ev_sharevolume_screen_resultstatusaudit_notes
<</TABLE>>
[Heading1] SECTION 4 - Market Taxonomy and Flipping Rules
<<TABLE>>
Segment | Typical limit | Tax policy | Minimum operating edge | Volatility | Liquidity window
Runes | 18K-25K | 2%; rounding relevant | >=1.2% post-tax | Low-medium | Seconds-minutes
Food/potions | 2K-10K | 2% | >=1.2% post-tax | Medium | Minutes
Darts/arrows/chins | 7K-11K | 2%; exemptions vary | >=1.2-1.5% post-tax | Medium | Minutes
Herbs/ores/logs/bones | 4.5K-15K | 2% | >=1.2-1.5% post-tax | Medium | Minutes-hours
Mid-tier gear | Usually low limits | 2% | >=2-4% gross after validation | Medium-high | 15 min-hours
Torva/Ancestral pieces | 8 | 2%; cap if price >250M | >=6M nominal edge | High | Hours
Shadow | 8 | 5M capped tax | >=8-12M policy edge | High | Hours
Scythe | 8 | 5M capped tax | >=10-15M policy edge | High | Hours-day
Twisted bow | 8 | 5M capped tax | >=12-20M policy edge | High | Hours-day
<</TABLE>>
[SmallNote] These are operating policies, not assertions that the listed spreads currently exist. Recompute with live latest, five-minute and hourly data before entry.
[Heading2] Four-hour limit deployment
[ListBullet] The timer begins with the first purchase and resets as a cycle rather than creating a separate timer for every unit.
[ListBullet] Diversify across unrelated limit groups rather than forcing fills above fair value.
[ListBullet] Remember that connected potion doses can share limit capacity.
[ListBullet] Selling is not constrained by the same purchase limit, but market depth still constrains exit quality.
[ListBullet] When nearing the T-bow trigger, allow existing cycles to expire and stop redeploying capital.
[Heading2] Automated fill-quality checks
<<TABLE>>
position_units <= 0.5% * daily_volumeexpected_turnover_cycles <= 2high_timestamp_age <= freshness_thresholdlow_timestamp_age <= freshness_thresholdpost_tax_profit >= minimum_absolute_profitpost_tax_roi >= tier_thresholdspread_stability_1h == acceptable
<</TABLE>>
[Heading1] SECTION 5 - Next Best Action Decision Engine
[Heading2] Deterministic logic
<<TABLE>>
INPUT: UserAccountState, MarketState[], StrategyRequirement[]1. Reject stale or untradeable market candidates.2. Complete permanent account gates with positive future-option value.3. Match activity to available time and attention.4. Rank unlocked activities by conservative realized GP/hour.5. Apply learning penalty until personal completion data exists.6. Preserve committed maxing inputs and minimum operational gear.7. If T-bow gap > 250M: retain productive bank.8. If gap is 150M-250M: prepare liquidation list.9. If gap is 75M-150M: sell marginal upgrades in stages.10. If gap <= 75M and purchase gates pass: liquidate and buy.11. After purchase: rebuild reserve first, then replace supporting gear.12. Recalculate after every material price move or 10-hour method sample.
<</TABLE>>
[Heading2] Generic budget tiers
<<TABLE>>
Budget | Immediate priorities | Default allocation | Avoid
10M | Unlocks, supplies, high-volume flips | 40% cash / 30% flips / 10% supplies / 20% gear | Luxury items and pre-tax 2% spreads
100M | Productive gear, mid-tier flips, repeatable PvM | 20% cash / 35% flips / 10% supplies / 35% gear | Marginal BIS before core weapons
1B+ | High-end PvM, liquid book, selective megarare exposure | 15% cash / 30% flips / 10% supplies / 45% gear | All-in speculation and guide-price assumptions
<</TABLE>>
[Heading2] fr3nchy personalized state machine
<<TABLE>>
State | Entry condition | Next best action | Exit condition
Quest gate | DT2 incomplete | Complete DT2 | Quest complete
Learning | No stable ToA/Doom baseline | Weekend focused repetitions | 10-hour reliable rate exists
Accumulation | T-bow gap >250M | Use full productive bank; parallel maxing | Gap <=250M
Preparation | Gap 150-250M | Build sale list; stop new specialist purchases | Gap <=150M
Staged liquidation | Gap 75-150M | Sell marginal upgrades; retain core kit | Gap <=75M
Purchase ready | Gap <=75M and all gates pass | Patient T-bow acquisition | Bow acquired
Rebuild | T-bow owned | Doom/CoX/ToA/Slayer; restore reserve | Reserve and core kits rebuilt
<</TABLE>>
[Heading1] Conservative, Base and Aggressive Scenarios
[Heading2] Assumption
The scenario starts from 660M of available capital after staged liquidation and uses the 1.3816B planning target. It therefore models a 721.6M gap. Maxing time is not counted as income-producing unless the selected training method is profitable.
<<TABLE>>
Scenario | Realized GP/hour | Focused PvM hours | Total gameplay at 60% PvM | Operating interpretation
Conservative | 3.5M | ~206h | ~344h | Familiar bosses, learning drag and limited rare luck.
Base | 5.5M | ~131h | ~219h | Stable ToA/Doom blend plus modest market support.
Aggressive | 7.5M | ~96h | ~160h | Strong competency and favorable EV realization; not guaranteed.
<</TABLE>>
[Heading2] Sensitivity
<<TABLE>>
Change | Conservative impact | Base impact | Aggressive impact
T-bow price +100M | +28.6 focused hours | +18.2 hours | +13.3 hours
T-bow price -100M | -28.6 focused hours | -18.2 hours | -13.3 hours
600M includes current 60M | Add 60M to gap | ~10.9 base hours | ~8.0 aggressive hours
Rare drop | Accelerates path | Do not include in baseline | Bank it toward trigger
Profitable maxing | Reduces effective gap | Credit only realized net profit | Track separately
<</TABLE>>
[Heading2] Scenario selection rule
Use the conservative scenario until a method has at least 10 logged hours. Move to the base case only when the rolling average exceeds 5M/hour after supplies and deaths. Use the aggressive case solely for short-term operational planning after the rolling average exceeds 7M/hour; do not treat it as guaranteed.
[Heading2] Monthly review dashboard
<<TABLE>>
Metric | Current baseline | Decision threshold
Net liquid wealth | To be measured | Use sale proceeds, not bank guide value
T-bow executable price | Refresh live | Price + 25M reserve
Funding gap | ~721.6M from 660M state | Begin liquidation preparation below 250M
Best 10-hour GP rate | Not yet logged | Base scenario at >=5M/hr
ToA completion rate | Not yet logged | Three consecutive clean completions before raising invocation
Doom completion rate | Not yet logged | Stable early delves before full-cycle optimization
Maxing XP/week | Set after first week | Maintain progress without consuming focused PvM blocks
<</TABLE>>
[Heading1] Risk Register and Controls
<<TABLE>>
Risk | Likelihood | Impact | Control
Premature liquidation | Medium | High | Use staged thresholds and preserve the minimum kit.
T-bow price appreciation | Medium | High | Track gap; do not chase; increase liquid share near threshold.
T-bow price decline after purchase | Medium | Medium | Buy for productive use, not short-term resale.
Learning losses | High initially | Medium | Weekend blocks, one objective and explicit training budget.
Rare-drop EV illusion | High | High | Separate common loot, EV and realized cash.
Low-volume flip trap | Medium | Medium | Volume-to-position gate and post-tax validation.
Update-driven gear rotation | Medium-high | High | Cap speculation and refresh official news before concentration.
Maxing burnout | Medium | Medium | Attention-match methods and alternate skill blocks.
Insufficient post-purchase supplies | Low if controlled | High | Maintain 25M reserve and prebuilt supply list.
Data staleness | Medium | Medium | Reject stale timestamps; log observation time.
<</TABLE>>
[Heading2] Pre-purchase checklist
[ListBullet] Live T-bow high/low and timestamps refreshed.
[ListBullet] Net liquidation proceeds recalculated after tax and expected slippage.
[ListBullet] 25M reserve remains after the transaction.
[ListBullet] Minimum melee and magic kits remain usable.
[ListBullet] Fletching materials remain untouched.
[ListBullet] At least 50 of the next 100 focused PvM hours are planned for T-bow-efficient content.
[ListBullet] Measured T-bow incremental value is expected to exceed 1.5M GP/hour.
[ListBullet] No unresolved official update is likely to invalidate the intended content or equipment thesis.
[ListBullet] Patient offers are used rather than an emotional instant buy.
[Heading2] Post-purchase priorities
[ListNumber] Rebuild liquid reserve to at least 40M before optional upgrades.
[ListNumber] Run the highest measured T-bow-synergy content, not merely the highest Wiki headline.
[ListNumber] Repurchase supporting gear in order of incremental GP/hour per GP invested.
[ListNumber] Continue maxing in low-attention windows.
[ListNumber] Revalue the rebuild after each 25 focused PvM hours.
[Heading1] Data Quality, Caveats and References
[Heading2] Data-quality rules
[ListBullet] Point-in-time Wiki prices are observations, not a guaranteed order book.
[ListBullet] Latest high/low transactions can be stale or represent small quantities; validate with 5-minute and hourly volumes.
[ListBullet] No native 90-day lookback should be assumed. Derive it from six-month data or internal hourly storage.
[ListBullet] GP/hour pages are models whose assumptions must be stored with the result.
[ListBullet] Learner planning ranges in this document are decision assumptions, clearly distinct from published Wiki estimates.
[ListBullet] The report does not cover real-money trading or real-world investment.
[Heading2] Primary references
[ListBullet] OSRS Wiki Real-time Prices API documentation
[ListBullet] OSRS Wiki API base
[ListBullet] Twisted bow
[ListBullet] Twisted bow rebuild guide
[ListBullet] Grand Exchange tax and item sink
[ListBullet] Grand Exchange buy limits
[ListBullet] Desert Treasure II
[ListBullet] Money making guide index
[ListBullet] Tombs of Amascut money making
[ListBullet] Vorkath money making
[ListBullet] Zulrah money making
[ListBullet] Doom of Mokhaiotl money making
[ListBullet] Maggot King money making
[ListBullet] Yama money making
[ListBullet] Fletching training
[ListBullet] Mining training
[ListBullet] Hunter training
[ListBullet] Slayer training
[ListBullet] Official Old School RuneScape news
[Heading2] Version control
<<TABLE>>
Field | Value
Account | fr3nchy
Report version | 1.0
Market anchor | September 30, 2026
Document type | Personal operating manual + decision-engine reference
Refresh trigger | Major update, 10-hour method sample, or material T-bow price movement
<</TABLE>>
[Heading1] Appendix A - Session Logging Template
<<TABLE>>
Date | Method | Minutes | Completions/Kills | Gross loot | Supplies/deaths | Net GP | XP | Notes
 |  |  |  |  |  |  |  | 
 |  |  |  |  |  |  |  | 
 |  |  |  |  |  |  |  | 
 |  |  |  |  |  |  |  | 
 |  |  |  |  |  |  |  | 
 |  |  |  |  |  |  |  | 
<</TABLE>>
[Heading2] Ten-hour method review
<<TABLE>>
Metric | Result
Total active hours | 
Successful completions | 
Deaths/failures | 
Gross loot | 
Supply and charge cost | 
Death/reclaim cost | 
Net GP/hour | 
Common-loot GP/hour | 
Rare-drop EV share | 
Decision: continue / modify / stop | 
<</TABLE>>
[Heading1] Appendix B - Liquidation Worksheet
<<TABLE>>
Item/category | Qty | Live price | Tax | Slippage | Net proceeds | Used last 30h? | Retain/Sell
 |  |  |  |  |  |  | 
 |  |  |  |  |  |  | 
 |  |  |  |  |  |  | 
 |  |  |  |  |  |  | 
 |  |  |  |  |  |  | 
 |  |  |  |  |  |  | 
 |  |  |  |  |  |  | 
<</TABLE>>
[Heading2] Final operating statement
<<TABLE>>
Plan in one sentenceUse the current 850M bank to become better at profitable content while maxing during lower-focus time; convert the bank into a T-bow only after the remaining gap is small, the 25M reserve and supporting kit survive, and the bow will be used for most upcoming focused PvM.
<</TABLE>>```
