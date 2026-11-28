# Civ resource design

Population is the base resource. Food, Water and Shelter are the opening nodes, followed by Craft/Organization. Money/Time and Education/Culture remain locked, hidden later branches. This playable slice implements the owner's worker-action design; future eras remain separate work.

## First minutes

Start with 5 Population, 10 Food, 10 Water and housing for 8. Send Gather and Collect water; their crews return automatically with the yield. Earn the first Organization point at 8 Population to unlock hut construction; hunting follows at milestone 2. Both overseer queues arrive at 3, with Food/Water buyables later at 7. Existing discovered fishing remains usable while its new milestone is undecided. Dispatching a busy route or overbooking workers fails without spending anything.

Food and Water are consumed continuously. Normal growth takes 12 supported game seconds per person. After purchasing Abundance, a free Shelter upgrade unlocked at Organization milestone 5, independent Food, Water and Shelter bonuses can raise the rate to 10 times normal. Before purchase, growth remains at the base rate. Growth still needs housing plus a reserve of each supply equal to max(3, a quarter-minute of the next population's upkeep). An empty Food or Water stockpile starts the shortage countdown described below. Shared hearths adds a small continuous Food supplement through the same economy update as upkeep; expeditions remain the main Food source.

## Abundance growth curves

Abundance is purchased once for no resources after first holding five Organization; its ownership survives prestige.

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

Restore both supplies above zero to reset the episode's elapsed time and loss count. The current missing supplies determine the stricter grace period. Emergency rations (Organization 5, then a Craft purchase) double Food grace and related intervals to 20 seconds; Emergency cistern (Organization 4) does the same for Water. An unprotected missing supply still controls a combined shortage. Mutual aid (Organization 8) changes interval decay from 0.8 to 0.9 and raises the minimum interval to 4 seconds. These permanent upgrades change the actual calculation, not only the displayed countdown.

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
- **Hunt bigger game** (`hunt-tools`): each level multiplies the crew by 1.5, rounding up after each level, and doubles yield. Duration stays 25 seconds. The next tier requires 1 + current level held Organization (not spent); work stays 14. Spear hunting applies before scaling: crews grow 2, 3, 5, 8 instead of 3, 5, 8, 12.
- **Weave river traps** (`fish-tools`): each level doubles the catch with the same crew and 18-second trip. Craft costs start at 1 and double per level; work stays 14. Craft is spent when construction starts, with no refund on cancellation or lost construction at prestige.
- **Farming tools** retain their +35% base yield and faster-cycle effect; work scales by 1.35 per level.

Provisioning improves all Food routes by 15% of base yield per level. Each Food basket adds 40 storage and costs exactly 1 Craft up front, in addition to its existing scaling work requirement. Provisioning and exploration/farming spend work only. Improvements affect newly dispatched trips. Repeat orders wait for sufficient workers for the new crew size; Autonomous food production still removes the final scaled crew requirement.

Spear hunting reduces the base crew from 3 to 2 before bigger-game scaling. Digging sticks adds 25% Gather yield; Butchery tools adds 50% Hunt yield. Food crews remain staffed. Cultivated fields becomes available at Organization 8 and retains its existing Food/Water/Craft/Organization costs. Autonomous food production and Automatic sluice still require inaccessible later resources; older purchased effects remain usable. See the early milestone contract below for queue unlocks and staffing.

## Early Organization milestones

New games expose Gather and Collect water. Huts unlock at current Organization 1, Hunt at 2, and both Food and Hut overseer queues at 3 without a separate purchase. The first Organization point requires 8 Population; subsequent requirements are `8 + 4 * current Organization`. Craft still starts at 12 Population. Spending Coordination can lock milestones again; purchased upgrades and paid work remain. The population requirement falls immediately with the held balance.

| Milestone | Feature | Upgrade 1 | Upgrade 2 | Upgrade 3 |
| --- | --- | --- | --- | --- |
| 1 | Build huts | Cord lashings: 1 Craft, hut work scales by 1.25 rather than 1.35 per owned hut | Timber frames: 2 Craft, each hut gives 6 instead of 4 housing | Construction tools: 3 Craft, double all construction speed |
| 2 | Hunting | Digging sticks: 1 Craft, +25% Gather yield | Spear hunting: 2 Craft, base Hunt crew 3 to 2 | Butchery tools: 3 Craft, +50% Hunt yield |
| 3 | Expedition and Hut overseers | Prepared materials: 1 Organization, automatic huts need 25% less work | Extended expeditions: 2 Organization, independent 1-5x duration/yield selectors for Food routes | Work rosters: 3 Organization, separate Food/Hut staffing of 1-5 workers |

Each assigned overseer supports five repeats: 1/2/3/4/5 workers gives caps 5/10/15/20/25 for the corresponding sliders. Food workers supervise all Food queues together; Hut workers supervise huts separately. Configured workers reserve labor only while their queues have remaining orders. Crews/builders still reserve their full labor. An active queue's staffing cannot increase beyond free labor, and cannot decrease below the cap needed for its remaining orders. Reducing the repeats first permits a smaller staff without silently discarding orders.

Extended expeditions multiplies Food yield and duration equally; it does not change crew size or consume extra repeats. Controls change future dispatches only, preserving active snapshots. Storage can clip a large returning yield. Prepared materials is captured when a hut starts automatically and persists with its work across save/reload; manual huts receive no discount. Both queue types consume one repeat per successful single-job automatic start, wait without charging when blocked, stop at zero and release supervisors while the final active crew/builder finishes. Prestige clears all remaining repeats; Work rosters provides capacity, not carryover.

These numeric upgrade effects are authored tuning choices, not historical measurements. Baseline hut work remains `16 * scale^owned`; the Prepared materials factor is 0.75. Construction speed remains multiplied by `1 + 0.15 * held Organization` and doubled by Construction tools. Food tool bonuses apply before provisioning and knowledge, once per newly dispatched contract.

Existing later gates are Gravity-fed spring 4, Abundance 5, Food/Water buyables 7, Farming 8 and irrigation 9. Earthenware/Fire/Energy integration and the remaining future upgrade slots are outside the MS1-3 implementation. Fire/Energy is not yet implemented; milestone 6 retains its existing well-record reward and Shared hearths while that design is completed. Fishing has no new-game unlock yet; existing discovered fishing remains usable.

## Water: hauling, jars and flow

Water starts with manual collection trips into 50-capacity reserves. **Craft earthenware jars** adds 40 Water storage per purchase for exactly 1 Craft plus the existing work requirement: 12 × 1.35^owned jars. Craft is spent at start, with the same cancellation/prestige no-refund rule as Food baskets. Existing jar projects finish without retroactive charges. [Research and material options](research/reference-guide.md#water-storage-materials) explain the early fired-clay name; later material upgrades have no current cost or unlock. Previously purchased Carrying yokes still reduce collection crews from 2 to 1; they have no new-game upgrade slot. Well lining is removed; collection and gravity flow have no lining multiplier. There is no Water keeper upgrade or repeat toggle. Both overseers unlock at milestone 3; Water remains manual until Gravity-fed spring at milestone 4.

A Gravity-fed spring unlocks at milestone 4 and requires 2 Craft, 1 Organization and 30 Food. It replaces hauling with continuous, unattended, worker-free Water flow: 24 base Water per minute plus 10 per improved well, scaled by knowledge. An existing carrying crew finishes normally. New games currently retain staffed Food production.

Well projects also improve manual trip yield and speed. Earthenware jar projects add 40 capacity. Irrigation spends 20 surplus Water, protecting the household growth reserve, after milestone 9 with Farming purchased, to boost newly dispatched Farming rewards by 35% for 45 seconds. Gather, Hunt and Fish receive no irrigation multiplier. It does not retroactively change active jobs. Previously owned Automatic sluice still obeys the same reserve and cooldown guards; new purchases await future resource unlocks.

## Shelter: expand housing

There are no building slots and no Shelter milestone track.

- **Abundance** is free to purchase after Organization milestone 5. Until purchased, surplus supplies and spare housing do not accelerate growth. Its curves and ownership gate are described above.
- **Build a new hut** unlocks at Organization 1 and adds 4 housing (6 with Timber frames). Both overseers unlock at 3; queued hut work and staffing follow the early milestone contract. General auto-building excludes huts. Busy construction, shortages and missing builders consume no repeats. Setting zero clears pending repeats; canceling stops current construction.

There is no domestic work or household labor reservation. Every person can join a crew or build. The ledger counts active crews, the shared Food Overseer, the hut foreman and every reserved builder once. Only whole available workers can join a crew.

One construction job runs at a time for new queued work. Other buyables retain their single builder. Existing saved multi-hut snapshots keep their work and builders until completion. Population loss can pause construction without losing progress; it resumes when enough builders are available. Organization and Construction tools still affect construction work. Canceling releases builders and clears progress; spent Craft is not refunded. Canceling current construction does not consume another queued repeat; set the slider to zero to stop further automatic starts.

## Prestige and later resources

Craft requires only Population: 12 gives 1 Craft, 14 gives 2, 16 gives 3, and every additional two people add one Craft. It has no Food, Water or housing eligibility requirement.

Organization requires only current Population: the next point needs `8 + 4 × current Organization held` people. The sequence is 8, 12, 16, 20 and onward. It grants exactly one point per action even with excess Population; spending Organization immediately lowers the next requirement. Extra empty housing alone cannot qualify, and stocks/housing do not otherwise gate the prestige command.

Milestones unlock when the held balance first reaches their threshold and stay unlocked after spending, prestige and save/reload. The existing saved peak (`organization.best`) records the highest held balance; lifetime earnings remain historical statistics and cannot unlock a never-held threshold. All milestone rewards share this rule: features, upgrade access, overseer orders, irrigation, auto-building and specific buyable retention. Spending still lowers the next Population requirement and must cover each purchase cost. Pending orders continue with their assigned managers. Queues saved while their managers were reassigned wait for free supervisors without discarding active paid work or remaining repeats. Prestige itself still clears queues according to its existing contract. Paid work and purchased upgrades retain their existing state and effects.

Both prestiges restart with 5 Population, 10 Food and 10 Water, and reset growth, irrigation and shortage pressure. Food and hut repeat targets return to zero, releasing their managers. Purchased one-time upgrades, Craft/Organization and later resources remain. Unprotected buyables reset according to the milestones below; there is no blanket Population retention reward.

New games have no initially purchasable upgrades. The early Organization milestone table owns the first nine upgrades and their currencies. Later gates remain explicit in `organizationRewards`; a milestone reveals upgrades without buying them.

| Highest held Organization | Feature / upgrades | Specific buyable retained |
| --- | --- | --- |
| 1 | Huts; Cord lashings, Timber frames, Construction tools | None |
| 2 | Hunting; Digging sticks, Spear hunting, Butchery tools | None |
| 3 | Both overseers; Prepared materials, Extended expeditions, Work rosters | None |
| 4 | Gravity-fed spring, Emergency cistern | Earthenware jars |
| 5 | Free Abundance, Emergency rations, Mutual aid | Food baskets |
| 6 | Existing Shared hearths / well records; Fire/Energy pending | Well improvements |
| 7 | Food/Water buyables | Explore farther afield |
| 8 | Cultivated fields | Hunt bigger game |
| 9 | Farming-only irrigation | Weave river traps |
| 10 | Existing auto-building | Huts |

Retention is evaluated by the exact buyable ID, not its resource layer. Water-storage records do not retain wells; gathering records do not retain bigger-game levels. Provisioning and farming tools continue to reset through milestone 10. Later rewards can extend that progression.

Milestones use the highest Organization balance held, never cumulative earnings. Newly earned unlocks and specific retention apply immediately on that Organization prestige. Both Craft and Organization use the same retention rules. The UI preview and native confirmation share the command's prospective reset plan.

Before milestone 10, housing returns to 8; Population independently returns to 5. Unprotected construction loses progress, while protected construction retains its progress and paused/active state. Trips whose equipment resets return without yield; other trips may return if the smaller founding population cannot staff them. The preview names these outcomes before confirmation. Retained jobs are checked against the post-reset five-person budget, with Food and hut orders off.

Holding or spending Craft has no automatic expedition-yield or gravity-flow effect. Craft is a currency for explicit upgrades and construction. Knowledge retains its existing yield/flow effect. Organization speeds construction and reduces upkeep. Auto-building is unavailable before milestone 10, including when an earlier save has its toggle enabled. Once earned it starts repeatable projects with one reserved builder and normal construction time.

Money, Time, Education and Culture are locked and hidden for now, with no in-game unlock. Craft/Organization earnings do not reveal them; unreserved workers remain available instead of generating currencies. New investments and upgrades costing later resources are unavailable. Existing earned balances and purchased upgrade effects are preserved, without generating more Money or Time.

## State, saves and verification

The canonical owner is createCivilizationRules in js/civilization.js. The registered Food update advances the entire economy, once, in one-second internal steps. Population is player.points; the Time resource uses freeTime because player.time is the runtime timestamp.

Current version 0.8 accepts v0.6/v0.7 and earlier Civ saves through the same detached codec. Before hydration, retired Fishing nets and Well lining Boolean fields are validated and removed, and Water keeper ownership becomes Hut foreman ownership for pre-0.7 saves; hut automation starts off. Historical Boolean Food orders become targets of one; active trips become one-job batch snapshots with unchanged crew, remaining time and yield. If the new dedicated Food Overseer cannot fit, orders pause while active crews/progress remain. Invalid historical/current overbooking is rejected. Abundance defaults to unpurchased in migrated saves and is available free if milestone 5 is earned. Existing active rewards/crews retain their snapshots; new trips use the current full Fishing crew and unlined Water output. Before hydration, saves predating the feature-discovery record preserve their activity records, stocks and paid work. Permanently earned Organization milestones govern new huts, hunting, buyables and overseer starts even if an earlier save recorded them as discovered; previously discovered fishing remains usable. New saves retain their explicit discovery record and default to the new milestone gates. Configured overseers default to one per type, expedition multipliers default to one, and existing construction receives no retroactive Prepared materials discount. Current saves store discoveries, configured staffing, expedition factors, prepared construction, integer targets and batch counts; no alternate legacy runtime remains. Earlier home-improvement retirement, hidden later-resource flags and missing 0.1 defaults still migrate at ingress. Stocks, Population, construction, bought upgrades and lifetime Organization remain meaningful; eligibility uses the new Population rule. Malformed records fail before activation, preserving prior live/durable bytes. Original ptr data remains untouched.

The base dark theme, monospace type, circular nodes and native upg/tabButton treatments are retained. Tests cover parallel crews, overbooking, recall, timed yields, the separate automation stages, irrigation, Shelter, prestige retention, saves and offline chunk parity. Balance profiles use real commands: active decisions every 5 seconds; regular decisions every 20 seconds until overseer, gravity flow and the milestone-10 auto-builder are earned, then every 300 seconds. This cadence change is owner-requested. Synthetic pacing is not human enjoyment evidence.

Existing route IDs and levels remain in `player.food.routes` and use the current formulas immediately. In-flight trips retain saved contracts. Previously started current construction (including Food baskets) completes without a retroactive Craft charge or Organization gate; new starts use current requirements. The save representation and single runtime are unchanged.
