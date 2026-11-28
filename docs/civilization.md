# Civ resource design

Population is the base resource. Food, Water and Shelter are the opening nodes, followed by Craft/Organization. Money/Time and Education/Culture remain locked, hidden later branches. This playable slice implements the owner's worker-action design; future eras remain separate work.

## First minutes

Start with 5 Population, 10 Food, 10 Water and housing for 8. Send Gather and Collect water; their crews return automatically with the yield. Earn the first Organization point at 8 Population to unlock hut construction; buy Crafting for 10 Craft to reveal hunting and equipment. Both overseer queues arrive at 3; Food/Water buyables use Craft capability rather than milestone 6. Existing discovered fishing remains usable while its new milestone is undecided. Dispatching a busy route or overbooking workers fails without spending anything.

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
| Fish | 2 | 18s | 14 Food |
| Farm, after fields unlock | 3 | 60s | 75 Food |
| Collect water | 2 | 8s | 14 Water |

Each route saves its active job snapshot separately from a remaining-repeat counter capped at five per assigned overseer. Each successful automatic start dispatches one job and decrements the counter by exactly one. Busy routes, full storage and unavailable crews do not consume repeats. At zero, no further job starts; an active final job still finishes normally. Changing or clearing a slider leaves current work unchanged. Recall cancels active work and clears its queue. New equipment/irrigation affects the next dispatch; saved snapshots retain their remaining time, crew and reward. Existing multi-job snapshots still finish without duplicating yield.

Food routes have distinct repeatable projects, each reserving one builder:

- **Explore farther afield** (`gather-tools`): each level multiplies gathering time by 1.2 and yield by 1.5 with the same one-person crew. Work starts at 14 and scales by 1.35 per level.
- **Hunt bigger game** (`hunt-tools`): each level multiplies the crew by 1.5, rounding up after each level, and doubles yield. Duration stays 25 seconds. Crafting unlocks the equipment; no per-level Organization requirement remains. Work stays 14. Spear hunting applies before scaling: crews grow 2, 3, 5, 8 instead of 3, 5, 8, 12.
- **Weave river traps** (`fish-tools`): each level doubles the catch with the same crew and 18-second trip. Craft costs start at 1 and double per level; work stays 14. Craft is spent when construction starts, with no refund on cancellation or lost construction at prestige.
- **Farming tools** retain their +35% base yield and faster-cycle effect; work scales by 1.35 per level.

Provisioning improves all Food routes by 15% of base yield per level. Each Food basket adds 40 storage and costs exactly 1 Craft up front, in addition to its existing scaling work requirement. Provisioning and exploration/farming spend work only. Improvements affect newly dispatched trips. Repeat orders wait for sufficient workers for the new crew size; Autonomous food production still removes the final scaled crew requirement.

Spear hunting reduces the base crew from 3 to 2 before bigger-game scaling. Digging sticks adds 25% Gather yield; Butchery tools adds 50% Hunt yield. Food crews remain staffed. Cultivated fields becomes available at Organization 7 and retains its existing Food/Water/Craft/Organization costs. Autonomous food production and Automatic sluice still require inaccessible later resources; older purchased effects remain usable. See the early milestone contract below for queue unlocks and staffing.

## Materials and equipment

The Craft panel has one material purchase and four equipment choices per row. Unlock costs are fixed, not a fraction of the current balance. Material knowledge and permanent techniques survive prestige. Rejected purchases spend nothing. Higher equipment tiers require the prior tier and preserve the same physical counts/work.

| Row unlock | Four purchases and effects |
| --- | --- |
| Crafting: 10 Craft | 1 Craft each: Thatched roofs (+1 housing/hut), Wooden spears (unlock Hunt, base crew 2), Woven baskets (+40 Water capacity per completed level), Digging sticks (+25% Gather yield) |
| Clay: 20 Craft | 2 Craft each: Earthenware jars (upgrade baskets; base capacity 100, +120 per existing/future level), Bricks (upgrade roofs, replace +1 with +2 housing/hut), Clay cooking pots (-25% Cooking fuel), Fired-clay pipes (also 2 Fire once; 2x passive Water) |
| Copper working: 30 Craft | 3 Craft each: Copper axes (2x hut construction speed), Copper knives (+50% Hunt yield), Copper pots (upgrade Cooking vessels, retain fuel saving and add 25% Cooking bonus yield), Copper sickles (new Farming trips take 25% less time) |

Water-storage jars and Cooking pots are separate families. A basket-to-jar upgrade does not create a second storage counter; a pot upgrade does not create Water storage. Bricks replaces the Thatched-roof bonus rather than adding both. All existing hut counts/work remain. Previously purchased Timber frames and other retired techniques keep their historical effects; no new purchase slot is supplied for them. The owner removed Communal cistern from this change.

Woven baskets uses the existing `water-storage` construction ID and `player.water.storage`. Starts cost 1 Craft before jars and 2 after, with `12 * 1.35^level` work. Jars additionally use the recurring firing recipe below. Buying the jars technique requires a completed basket and available Fire. Clay pots require Cooking; Copper pots require Clay pots. Bricks requires roofs; sickles require Farming. The four cells do not imply all four prerequisites are already met.

## Early Organization milestones

New games expose Gather and Collect water. Huts unlock permanently on first reaching Organization 1, Wooden spears unlock Hunt, and both Food and Hut overseer queues at 3 without a separate purchase. The first Organization point requires 8 Population; subsequent requirements are `8 + 4 * current Organization`. Craft still starts at 12 Population. Earned milestones remain unlocked after spending; purchased upgrades and paid work remain. The population requirement falls immediately with the held balance.

Basic huts remain available at Organization 1 so the eight-person founding housing can grow to the first Craft threshold at twelve. Organization 2 no longer unlocks hunting; Wooden spears does. Food and hut orders unlock at 3. Prepared materials (1 Organization) discounts supervised hut work by 25%; Extended expeditions (2) allows separate 1-5x Food duration/reward selections; Work rosters (3) permits 1-5 overseers separately for Food/huts, each supporting five repeats. Each successful automatic start spends one repeat. Current job snapshots keep their crew/duration/reward, and staffing reductions reject before discarding queued work.

Fire remains at 4, spring at 5, well retention at 6, Farming at 7, Abundance at 8, Farming-only irrigation at 9 and hut retention/auto-building at 10. Craft equipment no longer uses these milestones as purchase gates. Exact retention IDs stay unchanged.

## Fire capacity, tending and Cooking

At Organization 4, assign 0-5 whole Fire tenders from the existing shared pool. Cooking costs 1 Fire; Shared hearths costs 3 Fire. Ceramic storage technology is purchased in Clay for 2 Craft. Zero tenders releases their workers and preserves stored Fire; it always produces zero fuel.

| Repeatable Fire buyable | Material; Craft per level | Effect | Base work |
| --- | --- | --- | --- |
| Fuel stores | Crafting; 1 | +10 Fire capacity per level | 12 |
| Improved hearths | Crafting; 1 | +20% base tender production per level | 16 |
| Charcoal clamps | Clay; 2 | Divide recurring fuel use by `1 + 0.15*level` | 24 |

Fire construction uses the normal single slot and one builder, `baseWork * 1.35^level`, complete upfront Craft payment and no cancellation refund. Levels increase only at completion. Capacity adds no free fuel. These new physical levels/construction are unprotected on prestige; Fire and tender assignments reset to zero. The earned Fire milestone remains available after spending; tenders, supervisors and active crews share the same worker budget. Permanent techniques and material knowledge remain.

```text
maximum = 10 + 2*huts + 10*fuelStores
fill = min(1, Fire/maximum)
gain/min = tenders * (0.5 + 1.5*fill^2) * (1 + 0.2*improvedHearths)
efficiency = 1 + 0.15*charcoalClamps
Cooking fuel/min = 0.2*(setting-1)^2*(uncookedFoodPerMinute/30)
                   * (Cooking pots ? 0.75 : 1) / efficiency
effective Cooking multiplier = 1 + (setting-1)*fundedFraction*(Copper pots ? 1.25 : 1)
```

Cooking settings remain 1-5. Copper changes the bonus: setting 3 yields 3.5x fully funded output, setting 5 yields 6x. Raw Food and setting 1 are unchanged. Fuel and bonus accrue during each actual second of active Food work; only the funded share earns the bonus. Existing accrued bonus survives later setting changes until completion. Recall forfeits unfinished output. Idle routes consume no Cooking fuel. Cooking and expedition length remain independent; Shared hearth income is outside Cooking. Shared hearths retains +25 Food storage per whole ten current people and +4 Food/min per group scaled by Fire fullness.

Post-jars construction spends `0.5 * 1.5^water.storage / efficiency` Fire once at start. Current jars cost 2 Craft, baskets 1, and their work scaling remains. All currencies are checked before any spend. Paid in-flight jobs are never charged again. Charcoal discounts recurring manufacturing recipes and Cooking, not fixed technology costs: pipes always cost exactly 2 Fire. Increasing capacity can lower fullness until the new room fills; the Fire bar shows actual gain, consumption, net and effective Cooking output.

## Water: hauling, jars and flow

Collect water remains visible/dispatchable after spring purchase, with its normal crew, active-job and available-worker guards. Saved pre-spring crews finish once. There is no automatic Water repeat queue. Water starts at 50 capacity and basket levels add 40; jars raise the base to 100 and replace that coefficient with 120 for the same levels. Containers add capacity without filling it. Existing Carrying yokes remains usable if previously purchased.

Spring is still a purchase at Organization 5 for 2 Craft, 1 Organization and 30 Food. Let `u` be the same actual per-person upkeep used by consumption:

```text
u = 1/(1 + currentOrganization*0.06 + currentCulture*0.04)
passive Water/min = ownsSpring ? u*(8 + wellLevels)*knowledgeEffect*(pipes ? 2 : 1) : 0
```

With no wells, Knowledge or pipes, supply sustains exactly eight people at any Organization balance. Nine people draw down reserves; hauling can support more. This is sustainable supply, not a Population cap. Pipes double the complete passive expression once, never manual deliveries, and need no operating Fire after manufacture. No spring means no passive income even with pipes. Well levels retain their manual yield/speed improvements and add one upkeep-equivalent to spring supply per level.

Irrigation retains its Organization-9/Farming gate, 20 surplus Water payment, protected household reserve, +35% new Farming reward and 45-second duration. It changes neither other routes nor existing dispatched rewards. Water jar names and current costs derive from the same material tier as the actual command.

## Shelter: expand housing

There are no building slots and no Shelter milestone track.

- **Abundance** is free to purchase after Organization milestone 8. Until purchased, surplus supplies and spare housing do not accelerate growth. Its curves and ownership gate are described above.
- **Build a new hut** unlocks at Organization 1 and adds 4 housing, plus the current roof tier (+1 thatch or +2 bricks) and any historical Timber frames bonus (+2). Both overseers unlock at 3; queued hut work and staffing follow the early milestone contract. General auto-building excludes huts. Busy construction, shortages and missing builders consume no repeats. Setting zero clears pending repeats; canceling stops current construction.

There is no domestic work or household labor reservation. Every person can join a crew or build. The ledger counts active crews, the shared Food Overseer, the hut foreman, Fire tenders and every reserved builder once. Only whole available workers can join a crew.

One construction job runs at a time for new queued work. Other buyables retain their single builder. Existing saved multi-hut snapshots keep their work and builders until completion. Population loss can pause construction without losing progress; it resumes when enough builders are available. Organization and Construction tools still affect construction work. Canceling releases builders and clears progress; spent Craft and Fire are not refunded. Canceling current construction does not consume another queued repeat; set the slider to zero to stop further automatic starts.

## Prestige and later resources

Craft requires only Population: 12 gives 1 Craft, 14 gives 2, 16 gives 3, and every additional two people add one Craft. It has no Food, Water or housing eligibility requirement.

Organization requires only current Population: the next point needs `8 + 4 × current Organization held` people. The sequence is 8, 12, 16, 20 and onward. It grants exactly one point per action even with excess Population; spending Organization immediately lowers the next requirement. Extra empty housing alone cannot qualify, and stocks/housing do not otherwise gate the prestige command.

Milestones unlock when the held balance first reaches their threshold and stay unlocked after spending, prestige and save/reload. The existing saved peak (`organization.best`) records the highest held balance; lifetime earnings remain historical statistics and cannot unlock a never-held threshold. All milestone rewards share this rule: features, upgrade access, overseer orders, irrigation, auto-building and specific buyable retention. Spending still lowers the next Population requirement and must cover each purchase cost. Pending orders continue with their assigned managers. Queues saved while their managers were reassigned wait for free supervisors without discarding active paid work or remaining repeats. Prestige itself still clears queues according to its existing contract. Paid work and purchased upgrades retain their existing state and effects.

Both prestiges restart with 5 Population, 10 Food and 10 Water, and reset growth, irrigation and shortage pressure. Food and hut repeat targets return to zero, releasing their managers. Fire and tender assignments reset to zero. The earned Fire milestone remains available after spending; tenders, supervisors and active crews share the same worker budget. Purchased one-time upgrades, Craft/Organization and later resources remain. Unprotected buyables reset according to the milestones below; there is no blanket Population retention reward.

New games can view the three material unlocks in Craft. Material spending owns equipment; Organization retains the rewards below.

| Highest held Organization | Feature / upgrades | Specific buyable retained |
| --- | --- | --- |
| 1 | Basic huts | None |
| 2 | Material purchases supply hunting/equipment | None |
| 3 | Both overseers; Prepared materials, Extended expeditions, Work rosters | None |
| 4 | Fire; Cooking, Shared hearths | Water-storage containers |
| 5 | Gravity-fed spring, Emergency cistern | Food baskets |
| 6 | Well records | Well improvements |
| 7 | Cultivated fields | Explore farther afield |
| 8 | Free Abundance, Emergency rations, Mutual aid | Hunt bigger game |
| 9 | Farming-only irrigation | Weave river traps |
| 10 | Existing auto-building | Huts |

Retention is evaluated by the exact buyable ID, not its resource layer. Water-storage records do not retain wells; gathering records do not retain bigger-game levels. Provisioning and farming tools continue to reset through milestone 10. Later rewards can extend that progression.

Milestones use the highest Organization balance held, never cumulative earnings. Newly earned unlocks and specific retention apply immediately on that Organization prestige. Both Craft and Organization use the same retention rules. The UI preview and native confirmation share the command's prospective reset plan.

Before milestone 10, housing returns to 8; Population independently returns to 5. Unprotected construction loses progress, while protected construction retains its progress and paused/active state. Trips whose equipment resets return without yield; other trips may return if the smaller founding population cannot staff them. The preview names these outcomes before confirmation. Retained jobs are checked against the post-reset five-person budget, with Food and hut orders off.

Holding or spending Craft has no automatic expedition-yield or gravity-flow effect. Craft is a currency for explicit upgrades and construction. Knowledge retains its existing yield/flow effect. Organization speeds construction and reduces upkeep. Auto-building is unavailable before milestone 10, including when an earlier save has its toggle enabled. Once earned it starts repeatable projects with one reserved builder and normal construction time.

Money, Time, Education and Culture are locked and hidden for now, with no in-game unlock. Craft/Organization earnings do not reveal them; unreserved workers remain available instead of generating currencies. New investments and upgrades costing later resources are unavailable. Existing earned balances and purchased upgrade effects are preserved, without generating more Money or Time.

## State, saves and verification

The canonical owner is createCivilizationRules in js/civilization.js. The registered Food update advances the entire economy, once, in one-second internal steps. Population is player.points; the Time resource uses freeTime because player.time is the runtime timestamp.

Current version 0.9 accepts v0.6/v0.7 and earlier Civ saves through the same detached codec. Before hydration, retired Fishing nets and Well lining Boolean fields are validated and removed, and Water keeper ownership becomes Hut foreman ownership for pre-0.7 saves; hut automation starts off. Historical Boolean Food orders become targets of one; active trips become one-job batch snapshots with unchanged crew, remaining time and yield. If the new dedicated Food Overseer cannot fit, orders pause while active crews/progress remain. Invalid historical/current overbooking is rejected. Abundance defaults to unpurchased in migrated saves and is available free if milestone 8 is active. Existing active rewards/crews retain their snapshots; new trips use the current full Fishing crew and unlined Water output. Before hydration, saves predating the feature-discovery record preserve their activity records, stocks and paid work. Permanently earned Organization milestones govern new huts and overseer starts; Craft equipment governs hunting and buyables. New saves retain their explicit discovery record and default to the new milestone gates. Configured overseers default to one per type, expedition multipliers default to one, and existing construction receives no retroactive Prepared materials discount. Current saves store discoveries, configured staffing, expedition factors, prepared construction, integer targets and batch counts; no alternate legacy runtime remains. Earlier home-improvement retirement, hidden later-resource flags and missing 0.1 defaults still migrate at ingress. Stocks, Population, construction, bought upgrades and lifetime Organization remain meaningful; eligibility uses the new Population rule. Malformed records fail before activation, preserving prior live/durable bytes. Original ptr data remains untouched.

The base dark theme, monospace type, circular nodes and native upg/tabButton treatments are retained. Tests cover parallel crews, overbooking, recall, timed yields, the separate automation stages, irrigation, Shelter, prestige retention, saves and offline chunk parity. Balance profiles use real commands: active decisions every 5 seconds; regular decisions every 20 seconds until overseer, gravity flow and the milestone-10 auto-builder are earned, then every 300 seconds. This cadence change is owner-requested. Synthetic pacing is not human enjoyment evidence.

Existing route IDs and levels remain in `player.food.routes` and use the current formulas immediately. In-flight trips retain saved contracts. Previously started current construction (including Food baskets) completes without a retroactive Craft charge or Organization gate; new starts use current requirements. The single runtime remains; 0.9 adds material-technique ownership and three Fire-project levels. Detached ingress grants the minimum necessary material capability to historical discovered/bought equipment and active work, validates present malformed fields, and preserves balances, work, action contracts and capacity. Missing old improvement records receive typed defaults before inference. New records enforce tier predecessors and Fire-project material prerequisites. Water storage stays in its existing counter; Cooking vessels never migrate from Water jars.
