# Civ resource design

Population is the base resource. Food, Water and Shelter are the opening nodes, followed by Craft/Organization. Money/Time and Education/Culture remain locked, hidden later branches. This playable slice implements the owner's worker-action design; future eras remain separate work.

## First minutes

Start with 5 Population, 10 Food, 10 Water and housing for 8. Send Gather and Collect water; their crews return automatically with the yield. Earn the first Organization point at 8 Population to unlock hut construction; buy Crafting for 10 Craft to reveal repeatable equipment, then build Wooden spears to unlock hunting. The two expedition buyables arrive at Organization 2 and both overseer queues at 3. Materials are purchased in Craft; equipment buyables stay on their resource tabs. Fishing and river traps remain removed. Dispatching a busy route or overbooking workers fails without spending anything.

Food and Water are consumed continuously. Normal growth takes 12 supported game seconds per person. After purchasing Abundance, a free Shelter upgrade unlocked at Organization milestone 8, independent Food, Water and Shelter bonuses can raise the rate to 10 times normal. Before purchase, growth remains at the base rate. Growth still needs housing plus a reserve of each supply equal to max(3, a quarter-minute of the next population's upkeep). An empty Food or Water stockpile starts the shortage countdown described below. Shared hearths adds a small continuous Food supplement through the same economy update as upkeep; expeditions remain the main Food source.

## Abundance growth curves

Abundance is purchased once for no resources after first holding eight Organization; its ownership survives prestige.

`growthSettings` in `js/civilization.js` owns the base period and each input's
independent weight, thresholds and shape exponent. All three currently contribute
0 to +300% of the base rate, added as `M = 1 + FoodBonus + WaterBonus + ShelterBonus`.
Thus zero bonus is normal 1x growth; all three full bonuses give 10x. One weak
input does not erase another input's bonus. Existing growth eligibility still
stops growth when housing or minimum supply reserves are missing.

For a normalized input `t` clamped between 0 and 1, the response is:

```text
u = t^exponent
S(t) = u*u*(3 - 2*u)
bonus = maxBonus * S(t)
```

Default exponents are 1. This smoothstep has gentle, flat ends, rather than
switching abruptly at a single stock or housing threshold. At 25%, 50% and 75%
of an input's range, its +300% maximum contributes +46.875%, +150% and +253.125%.
Each exponent can be tuned separately: above 1 delays the reward toward abundance;
between 0.5 and 1 brings it forward. Weights/ranges are also separate source settings.

**Food and Water:** for each supply independently, let `R` be 60 seconds of the
current population's actual upkeep and `C` its own storage capacity. The bonus is
zero at or below `R`; it reaches full at `R + 0.9*(C-R)`. Between these points,
`t = (stock-R)/(0.9*(C-R))`. This rewards near-full storage *after* protecting a
one-minute buffer. If capacity cannot hold that buffer (`C <= R`), that supply
provides no bonus. Coverage uses stored stock and gross upkeep, without counting
future crew deliveries or assuming passive production will continue. Organization
and Culture upkeep modifiers are included. Increasing Food changes neither the
Water score nor the housing input at a fixed population/progress state.

For example, at five people, ordinary upkeep and 50 capacity, each supply's
zero point is 5 units; full bonus starts at 45.5 units. Holding 25.25 units is the
midpoint and gives +150% from that supply alone.

**Shelter:** measure the remaining time to fill housing at the unbuffed 12 seconds
per person, including the current fractional growth progress:
`T = max(0, housing - population - growthProgress) * 12`. The housing bonus is
zero through 60 seconds, full at 300 seconds, and uses `t = (T-60)/240` between
them. With no partial progress, that means zero through five vacant places and
full at 25. This baseline clock avoids a circular calculation in which supply
bonuses change housing's own threshold.

Each one-second economy step consumes actual supplies and reevaluates growth.
`advanceGrowth()` also reevaluates at each birth, retaining fractional progress
while stopping at housing/supply limits. This supports later tuning above one
birth per second without invalid saved progress or banking ineligible growth.
Abundance itself is derived, not saved; existing partial progress remains valid.
The Population panel exposes the multiplier and all three independent contributions.

## Shortages and recovery

Zero Food or zero Water starts one shared shortage episode. With no protection, the first person is lost after 10 seconds, the next after another 8, then 6.4, 5.12 and progressively shorter intervals, with a 2-second minimum. The engine resolves fractional deadlines on its deterministic one-second steps. Two empty supplies do not create two independent death streams.

Restore both supplies above zero to reset the episode's elapsed time and loss count. The current missing supplies determine the stricter grace period. Emergency rations (Organization 8, then a Craft purchase) double Food grace and related intervals to 20 seconds; Emergency cistern (Organization 5) does the same for Water. An unprotected missing supply still controls a combined shortage. Mutual aid (Organization 8) changes interval decay from 0.8 to 0.9 and raises the minimum interval to 4 seconds. These permanent upgrades change the actual calculation, not only the displayed countdown.

Population cannot fall below one survivor. That survivor retains one usable worker. At very low Population, manual Water collection can use a solo carrier at a slower pace; Gather remains available. Recovery can grow the community again.

Each loss recalculates the shared labor budget. Construction can pause with its full batch progress intact. Food and hut orders can switch off to release their Overseer/foreman; only enough active crews then return to restore a valid budget. Crews bringing the missing supply are preferred. Paused construction resumes when both supplies and enough builders are available. The shortage panel shows the countdown, losses and recovery instructions. State survives saves and offline advancement.

## Worker actions and Food routes

| Action | Initial crew | Base duration | Base yield |
| --- | --- | --- | --- |
| Gather | 1 | 10s | 6 Food |
| Hunt | 3 | 25s | 24 Food |
| Farm, after fields unlock | 3 | 60s | 75 Food |
| Collect water | 2 | 8s | 14 Water |

Each route saves its active job snapshot separately from a remaining-repeat counter capped at five per assigned overseer. Each successful automatic start dispatches one job and decrements the counter by exactly one. Busy routes, full storage and unavailable crews do not consume repeats. At zero, no further job starts; an active final job still finishes normally. Changing or clearing a repeat selection leaves current work unchanged. Recall cancels active work and clears its queue. New equipment/irrigation affects the next dispatch; saved snapshots retain their remaining time, crew and reward. Existing multi-job snapshots still finish without duplicating yield.

The two expedition buyables unlock at Organization milestone 2 and retain the trip tradeoffs and per-level requirements described below. Removed Provisioning, Food baskets, river traps and Farming tools no longer have purchase paths or ongoing effects. Their migrated active trips retain their saved contracts.

Spear hunting reduces the base crew from 3 to 2 before bigger-game scaling. Digging sticks adds 25% Gather yield; Butchery tools adds 50% Hunt yield. Food crews remain staffed. Cultivated fields becomes available at Organization 7 and retains its existing Food/Water/Craft/Organization costs. Autonomous food production and Automatic sluice still require inaccessible later resources; older purchased effects remain usable. See the early milestone contract below for queue unlocks and staffing.

## Materials and equipment

Crafting (10 Craft), Clay (20 Craft) and Copper working (30 Craft) are one-time permanent knowledge purchases. Each unlocks four repeatable equipment buyables on the relevant resource tabs:

| Material | Equipment | Base Craft cost |
| --- | --- | --- |
| Crafting | Thatched roofs, Wooden spears, Woven baskets, Digging sticks | 1 each |
| Clay | Earthenware jars, Bricks, Clay cooking pots, Fired-clay pipes | 2 each |
| Copper working | Copper axes, Copper knives, Copper pots, Copper sickles | 3 each |

| Location | Equipment buyables |
| --- | --- |
| Food | Wooden spears, Digging sticks, Copper knives, Copper sickles |
| Water | Woven baskets, Earthenware jars, Fired-clay pipes |
| Shelter | Thatched roofs, Bricks, Copper axes |
| Fire panel | Clay cooking pots, Copper pots |

Every equipment level costs `base Craft * 2^ownedLevels` and requires `12 * 1.35^ownedLevels` construction work with one builder. Payment occurs once at start; busy, locked, unstaffed or unaffordable commands have no effects. Canceling or losing work on prestige does not refund the payment. A level arrives only on completion. The Craft page sells only these three material unlocks. Resource buyable buttons derive their levels, costs, prerequisites and command availability from the same owner.

Roofs add 1 housing per hut per level; Bricks add 2. The two counts are independent. Wooden spears first unlocks hunting with a two-person base crew; later spear levels add 25% base hunting yield each. Digging sticks multiply gathering yield by 1.25 per level; Copper knives multiply hunting yield by 1.5 per level. Copper axes double hut building speed per level; Copper sickles multiply new Farming duration by 0.75 per level. Existing dispatched trips keep their saved contracts.

Woven baskets add 40 Water capacity each. Each jar level adds 50 base capacity plus 80 per basket: `50 + 40*baskets + jars*(50 + 80*baskets)`. One basket and one jar therefore provide 220 capacity. Jars require a completed basket and available Fire. Bricks needs roofs; Clay pots needs Cooking; Copper pots needs Clay pots; sickles needs Farming. Material knowledge remains required for every new equipment purchase.

Clay pots multiply Cooking fuel use by 0.75 per level. Copper pots add 25% to the fueled Cooking bonus per level. Pipes double spring flow per level. Jars spend `0.5 * 1.5^jarLevels` Fire at start; pipes spend 2 Fire per level. These payments do not create fuel or Water.

All equipment levels, scaling Craft prices and equipment construction reset on both Craft and Organization prestige, including after milestone 10. Material knowledge remains. No Water-container, well, Food-basket or river-trap retention rule protects this equipment. Timber frames and the existing milestones retain only the huts and expedition exceptions described below.

## Early Organization milestones

Huts unlock permanently at Organization milestone 1, allowing the eight-person founding settlement to reach the first Craft threshold at twelve. Explore farther afield and Hunt bigger game unlock at milestone 2, independently of Crafting; each next level requires `2 + current route level` held Organization, without spending it. Their normal work is `14 * 1.35^level`. Explore multiplies duration by 1.2 and yield by 1.5 per level. Bigger game multiplies yield by 2 and rounds the crew upward after each 1.5 multiplier.

Food and hut orders unlock at 3. Prepared materials (1 Organization), Extended expeditions (2) and Work rosters (3) keep their existing effects. The first Organization point needs 8 Population; later points need `8 + 4 * current Organization`. Earned milestone access survives spending through the saved peak held balance. Payment and current Organization requirements still use the live balance.

Fire remains at 4, spring at 5, Farming at 7, Abundance at 8, Farming-only irrigation at 9, and hut retention/auto-building at 10. Milestone 6 no longer retains the removed well. Exploration retention stays at 7 and bigger-game retention at 8. Removed base buyables are Provisioning, Food baskets, Improve the well, river traps and Farming tools. Their commands and purchase controls are gone.

## Fire capacity, tending and Cooking

At Organization 4, assign 0–5 whole Fire tenders from the shared worker pool. Cooking costs 1 Fire; Shared hearths costs 3 Fire. Fuel stores, Improved hearths and Charcoal clamps have been removed, including their effects, construction and controls. Capacity comes from huts, with no repeatable Fire infrastructure purchases.

```text
maximum = 10 + 2*huts
fill = min(1, Fire/maximum)
gain/min = tenders * (0.5 + 1.5*fill^2)
Cooking fuel/min = 0.2*(setting-1)^2*(uncookedFoodPerMinute/30)*0.75^clayPotLevels
effective Cooking multiplier = 1 + (setting-1)*fundedFraction*(1 + 0.25*copperPotLevels)
```

Cooking settings stay at 1–5. Fuel and bonus accrue during active Food work; only the funded share earns the bonus, and base Food remains available without fuel. Existing accrued bonus survives setting changes. Recall forfeits unfinished output. Idle routes consume no Cooking fuel. Zero tenders releases workers and retains stored Fire. Shared hearths keeps its Food capacity/income effect outside Cooking. Stored Fire and tender assignments reset on prestige.

## Water: hauling, jars and flow

Collect water remains available after purchasing Gravity-fed spring, with its normal crew and active-job guards. There is no automatic Water repeat queue. Equipment in Craft owns Water capacity; the Water panel has no base infrastructure buyables.

Spring remains a milestone-5 permanent upgrade costing 2 Craft, 1 Organization and 30 Food. With actual per-person upkeep `u`, passive Water/min is `u * 8 * knowledgeEffect * 2^pipeLevels`. With no pipes or Knowledge it sustains exactly eight people at any Organization balance. Hauling supplements it above that level. Removed wells no longer alter manual collection or spring flow. Previously bought Carrying yokes still has its existing effect.

Irrigation keeps its milestone-9/Farming gate, 20 surplus Water payment, protected household reserve, 35% new Farming yield bonus and 45-second duration. It does not change existing dispatched snapshots.

## Shelter: expand housing

There are no building slots and no Shelter milestone track.

- **Abundance** is free to purchase after Organization milestone 8. Until purchased, surplus supplies and spare housing do not accelerate growth. Its curves and ownership gate are described above.
- **Build a new hut** unlocks at Organization 1 and adds 4 housing, plus current roof levels (+1 per thatch and +2 per Bricks level). Timber frames protects completed huts at prestige. Both overseers unlock at 3; queued hut work and staffing follow the early milestone contract. General auto-building excludes huts. Busy construction, shortages and missing builders consume no repeats. Setting zero clears pending repeats; canceling stops current construction.

There is no domestic work or household labor reservation. Every person can join a crew or build. The ledger counts active crews, the shared Food Overseer, the hut foreman, Fire tenders and every reserved builder once. Only whole available workers can join a crew.

One construction job runs at a time for new queued work. Other buyables retain their single builder. Existing saved multi-hut snapshots keep their work and builders until completion. Population loss can pause construction without losing progress; it resumes when enough builders are available. Organization and Construction tools still affect construction work. Canceling releases builders and clears progress; spent Craft and Fire are not refunded. Canceling current construction does not consume another queued repeat; set the repeat selection to zero to stop further automatic starts.

## Prestige and later resources

Craft requires only Population: 12 gives 1 Craft, 14 gives 2, 16 gives 3, and every additional two people add one Craft. It has no Food, Water or housing eligibility requirement.

Organization requires only current Population: the next point needs `8 + 4 × current Organization held` people. The sequence is 8, 12, 16, 20 and onward. It grants exactly one point per action even with excess Population; spending Organization immediately lowers the next requirement. Extra empty housing alone cannot qualify, and stocks/housing do not otherwise gate the prestige command.

Milestones unlock when the held balance first reaches their threshold and stay unlocked after spending, prestige and save/reload. The existing saved peak (`organization.best`) records the highest held balance; lifetime earnings remain historical statistics and cannot unlock a never-held threshold. All milestone rewards share this rule: features, upgrade access, overseer orders, irrigation, auto-building and specific buyable retention. Spending still lowers the next Population requirement and must cover each purchase cost. Pending orders continue with their assigned managers. Queues saved while their managers were reassigned wait for free supervisors without discarding active paid work or remaining repeats. Prestige itself still clears queues according to its existing contract. Paid work and purchased upgrades retain their existing state and effects.

Both prestiges restart with 5 Population, 10 Food and 10 Water, and reset growth, irrigation and shortage pressure. Food and hut repeat targets return to zero, releasing their managers. Fire and tender assignments reset to zero. The earned Fire milestone remains available after spending; tenders, supervisors and active crews share the same worker budget. Purchased one-time upgrades, Craft/Organization and later resources remain. Unprotected buyables reset according to the milestones below; there is no blanket Population retention reward.

New games can view the three material unlocks in Craft. Material spending owns equipment; Organization retains the rewards below.

| Highest held Organization | Feature / upgrades | Specific buyable retained |
| --- | --- | --- |
| 1 | Basic huts, Timber frames | None |
| 2 | Explore farther afield, Hunt bigger game | None |
| 3 | Overseer queues and Organization upgrades | None |
| 4 | Fire, Cooking, Shared hearths | None |
| 5 | Gravity-fed spring, Emergency cistern | None |
| 6 | Community records | None |
| 7 | Cultivated fields | Explore farther afield |
| 8 | Abundance, Emergency rations, Mutual aid | Hunt bigger game |
| 9 | Farming-only irrigation | None |
| 10 | Auto-building | Huts |

Equipment never inherits retention from a resource layer. Its canonical levels own both effects and costs and reset together.

Milestones use the highest Organization balance held, never cumulative earnings. Newly earned unlocks and specific retention apply immediately on that Organization prestige. Both Craft and Organization use the same retention rules. The UI preview and native confirmation share the command's prospective reset plan.

With Timber frames, Craft and Organization resets retain up to one completed hut per earned Organization milestone, capped by the huts already built. A milestone earned by the current Organization reset counts immediately; spending Organization does not reduce earned milestones. Lifetime earnings do not raise the cap. Before milestone 10, unbuilt hut work still resets. At milestone 10 all huts and current hut construction remain protected, with or without Timber frames. Equipment resets before retained housing is calculated, so retained housing is `8 + 4 × retained huts`; Population independently returns to 5. Unprotected construction loses progress, while protected construction retains its progress and paused/active state. Trips whose equipment resets return without yield; other trips may return if the smaller founding population cannot staff them. The preview names these outcomes before confirmation. Retained jobs are checked against the post-reset five-person budget, with Food and hut orders off.

Holding or spending Craft has no automatic expedition-yield or gravity-flow effect. Craft is a currency for explicit upgrades and construction. Knowledge retains its existing yield/flow effect. Organization speeds construction and reduces upkeep. Auto-building is unavailable before milestone 10, including when an earlier save has its toggle enabled. Once earned it starts repeatable projects with one reserved builder and normal construction time.

Money, Time, Education and Culture are locked and hidden for now, with no in-game unlock. Craft/Organization earnings do not reveal them; unreserved workers remain available instead of generating currencies. New investments and upgrades costing later resources are unavailable. Existing earned balances and purchased upgrade effects are preserved, without generating more Money or Time.

## State, saves and verification

The canonical owner is createCivilizationRules in js/civilization.js. The registered Food update advances the entire economy, once, in one-second internal steps. Population is player.points; the Time resource uses freeTime because player.time is the runtime timestamp.

Version 0.9.3 (save version 0.93) uses `player.civ.equipment` for the twelve integer levels. Improvement flags contain only permanent knowledge and upgrades. Older Civ saves migrate on a detached candidate before typed hydration. Old Boolean equipment becomes level 0/1; old roof tiers preserve their effective housing without double-counting. Old Water storage counts become basket levels and old jars become one jar level, preserving the old capacity. In-flight Water storage becomes the appropriate basket/jar project with its existing work and no retroactive payment.

Removed Food baskets refund their known Craft recipe, including paid unfinished purchases. Fishing and river traps retain main’s earlier cancellation without compensation. Removed Fire infrastructure refunds 1 Craft per Fuel store/hearth and 2 per Charcoal clamp, plus an unfinished project's old recipe. Removed unpaid provisioning, wells and Farming tools have no currency payment to refund. Retired work is canceled and its builder released. Old Fire above the remaining hut-based capacity is capped after validating the historical capacity. Existing active trip snapshots, supplies, permanent knowledge, built huts and retained expedition levels remain. Retired counters become zero and cannot be purchased or regain effects. Malformed old flags, counts, capacity or present values reject before activating the new state; original bytes remain recoverable. Re-import/reload uses the single current model and cannot repeat refunds. Earlier Civ migrations remain at this ingress boundary. The distinct original `ptr` data stays untouched.

The base dark theme, monospace type, circular nodes and native upg/tabButton treatments are retained. Tests cover parallel crews, overbooking, recall, timed yields, the separate automation stages, irrigation, Shelter, prestige retention, saves and offline chunk parity. Balance profiles use real commands: active decisions every 5 seconds; regular decisions every 20 seconds until overseer, gravity flow and the milestone-10 auto-builder are earned, then every 300 seconds. This cadence change is owner-requested. Synthetic pacing is not human enjoyment evidence.

The two retained expedition route IDs use `player.food.routes.gather/hunt`. The named equipment registry drives prestige previews and reset commands independently of UI visibility. `tests/rules/craft-buyables.test.cjs` exercises all twelve first/second purchases, both prestige kinds at milestone ten, cost resets, denial/cancellation, effects, migration and chunk/save parity. Browser coverage exercises the material purchases and resource-tab buyables, native prestige confirmation, reload and narrow layouts.
