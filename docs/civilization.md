# Civ resource design

Population is the base resource. Food, Water and Shelter are the opening nodes, followed by Craft/Organization, Money/Time and Education/Culture. This playable slice implements the owner's worker-action design; future eras remain separate work.

## First minutes

Start with 5 Population, 10 Food, 10 Water and housing for 8. Send Gather and Collect water; their crews return automatically with the yield. Use available workers to improve a route or build housing. Hunt and Fish can run alongside Gather and each other when enough workers are free. Dispatching a busy route or overbooking workers fails without spending anything.

Food and Water are consumed continuously. A new person takes 12 supported game seconds and needs housing plus a reserve of each supply equal to max(3, a quarter-minute of the next population's upkeep). An empty Food or Water stockpile starts the shortage countdown described below. There is no duplicated continuous Food production system.

## Shortages and recovery

Zero Food or zero Water starts one shared shortage episode. With no protection, the first person is lost after 10 seconds, the next after another 8, then 6.4, 5.12 and progressively shorter intervals, with a 2-second minimum. The engine resolves fractional deadlines on its deterministic one-second steps. Two empty supplies do not create two independent death streams.

Restore both supplies above zero to reset the episode's elapsed time and loss count. The current missing supplies determine the stricter grace period. Emergency rations (Organization 5, then a Craft purchase) double Food grace and related intervals to 20 seconds; Emergency cistern (Organization 4) does the same for Water. An unprotected missing supply still controls a combined shortage. Mutual aid (Organization 8) changes interval decay from 0.8 to 0.9 and raises the minimum interval to 4 seconds. These permanent upgrades change the actual calculation, not only the displayed countdown.

Population cannot fall below one survivor. Domestic work leaves that survivor one usable worker. At very low Population, manual Water collection can use a solo carrier at a slower pace; Gather remains available. Recovery can grow the community again.

Each loss recalculates the shared labor budget. Construction pauses without losing progress if its builder must be released; the keeper can switch off, then only enough active crews return to restore a valid budget. Crews bringing the missing supply are preferred over noncritical trips, with slower trips returned first. Paused construction resumes when both supplies and one worker are available. The global shortage panel shows the current countdown, episode losses and recovery instructions. State survives saves and offline advancement.

## Worker actions and Food routes

| Action | Initial crew | Base duration | Base yield |
| --- | --- | --- | --- |
| Gather | 1 | 10s | 6 Food |
| Hunt | 3 | 25s | 24 Food |
| Fish | 2 | 18s | 14 Food |
| Farm, after fields unlock | 3 | 60s | 75 Food |
| Collect water | 2 | 8s | 14 Water |

Each active route has one canonical saved contract: remaining time, duration, reserved workers and reward. Workers are occupied until completion; the reward arrives as a batch, capped by storage. Overflow is lost. Recall immediately releases the crew, disables its repeat order and forfeits unfinished yield. Equipment and automation upgrades apply to the next dispatch, preserving an in-flight crew's contract.

Gather, Hunt, Fish and Farm have independent repeatable equipment projects. Each level adds 35% of base yield and shortens its cycle. Provisioning projects improve all Food routes by 15% of base yield per level. Baskets add 40 storage. These construction projects reserve one builder but spend no supplies.

Coordinated hunting reduces its crew from 3 to 2; Fishing nets reduce theirs from 2 to 1. The Expedition overseer becomes available at Organization milestone 5; purchasing it unlocks a separate repeat toggle for every Food route. Repetition removes dispatch clicks but retains the whole crew during every cycle. Orders wait when workers are unavailable, and pause near full storage.

Cultivated fields become available at Organization milestone 7, cost Food, Water, Craft and Organization and unlock longer farming cycles. The overseer repeats those cycles with 3 workers. Autonomous food production unlocks at Organization milestone 10 and is a later purchase requiring 8 Knowledge, 12 Craft, 120 Money and 10 Time: subsequent Food actions need zero workers. Purchased repeat orders still control which routes run. These costs are game abstractions, not historical dates.

## Water: hauling, reservoir and flow

Water starts with manual collection trips into a 50-capacity reservoir. Carrying yokes, the initially available Water Craft upgrade, reduce the crew from 2 to 1. Well lining unlocks at 2 lifetime Organization and improves collection and gravity-fed flow by 25%. Water keeper unlocks at milestone 4. Turning it on reserves one dedicated keeper even at full storage, in addition to any carrying crew. It cannot be enabled without that worker. Prestige turns it off; Gravity-fed spring also switches it off and releases the keeper.

A Gravity-fed spring unlocks at milestone 6 and requires 2 Craft, 1 Organization and 30 Food. It replaces hauling with continuous, unattended, worker-free Water flow: 24 base Water per minute plus 10 per improved well, scaled by tools and knowledge. An existing carrying crew finishes normally. Water reaches this stage substantially earlier than Food.

Well projects also improve manual trip yield and speed. Reservoir projects add 40 capacity. Irrigation spends 20 surplus Water, protecting the household growth reserve, to boost newly dispatched Food rewards by 35% for 45 seconds. It does not retroactively change active jobs. An Automatic sluice upgrade unlocks an optional auto-irrigation toggle; it obeys the same reserve and cooldown guards.

## Shelter: expand or improve

There are no building slots and no Shelter milestone track.

- **Build a new hut** is a repeatable, labor-only project adding 4 housing.
- **Improve existing homes** is a repeatable, labor-only project removing up to 0.5 workers' worth of domestic work.
- **Shared hearths** reduce remaining domestic work by 25% and add 25 Food storage.
- **Timber frames** increase all purchased homes from 4 to 6 housing, including existing homes.
- **Construction tools** double project speed while retaining the builder requirement.

Domestic work starts at 0.12 workers per person and cannot become negative. Remaining labor supports dispatches, construction, trade and free Time. The derived ledger counts domestic labor, every active crew and the builder once. Only whole available workers can join a crew. Trade/rest immediately yield their discretionary labor when an action begins.

One construction project runs at a time, reserving one builder while active; population loss may pause it with its progress intact. Progress is measured in work; Organization and Construction tools increase work per second. Canceling releases the builder and clears project progress. Housing cannot be destroyed or respecified through these controls.

## Prestige and later resources

Craft requires only Population: 12 gives 1 Craft, 14 gives 2, 16 gives 3, and every additional two people add one Craft. It has no Food, Water or housing eligibility requirement.

Organization requires only housing: the next point needs 12 + 4 times lifetime Organization earned. The sequence is 12, 16, 20, 24 and onward. It grants exactly one point per action, even with excess housing, and spending Organization cannot lower the next requirement.

Both prestiges restart with 5 Population, 10 Food and 10 Water, and reset growth, irrigation and shortage pressure. Water Keeper starts off. Purchased one-time upgrades, Food repeat orders, Craft/Organization and later resources remain. Unprotected buyables reset according to the milestones below; there is no blanket Population retention reward.

Each foundation begins with exactly one available one-time Craft upgrade: Food has Coordinated hunting, Water has Carrying yokes, and Shelter has Shared hearths. All three require Craft to buy. Organization reveals additional upgrades; reaching a milestone does not purchase them.

| Lifetime Organization | Craft upgrade unlocked | Specific buyable retained |
| --- | --- | --- |
| 1 | Fishing nets | None |
| 2 | Well lining | None |
| 3 | Timber frames | None |
| 4 | Water keeper and Emergency cistern | Reservoirs |
| 5 | Expedition overseer and Emergency rations | Food baskets |
| 6 | Gravity-fed spring | Well improvements |
| 7 | Cultivated fields | Gathering baskets |
| 8 | Construction tools and Mutual aid | Hunting equipment |
| 9 | Automatic sluice | Fishing equipment |
| 10 | Autonomous food production; auto-building toggle | Huts |

Retention is evaluated by the exact buyable ID, not its resource layer. Reservoir records do not retain wells; gathering records do not retain hunting equipment. Provisioning, farming tools and domestic home improvements continue to reset through milestone 10. Later rewards can extend that progression.

Milestones use lifetime Organization earnings, never the spendable balance. Newly earned unlocks and specific retention apply immediately on that Organization prestige. Both Craft and Organization use the same retention rules. The UI preview and native confirmation share the command's prospective reset plan.

Before milestone 10, housing returns to 8; Population independently returns to 5. Unprotected construction loses progress, while protected construction retains its progress and paused/active state. Trips whose equipment resets return without yield; other trips may return if the smaller founding population cannot staff them. The preview names these outcomes before confirmation. Retained jobs are checked against the post-reset five-person budget, with Water Keeper off.

Craft improves yields and gravity-fed flow by 18% per point; Knowledge adds 12%. Organization speeds construction and reduces upkeep. Auto-building is unavailable before milestone 10, including when an earlier save has its toggle enabled. Once earned it starts repeatable projects with one reserved builder and normal construction time.

Both prestige branches unlock Money and Time. Unreserved labor splits between trade and free hours. Earning 5 Money and 3 Time in total discovers Education and Culture. Education consumes Money/Time for Knowledge; Culture consumes Time/Craft for influence. Unlocks persist when currencies are spent.

## State, saves and verification

The canonical owner is createCivilizationRules in js/civilization.js. The registered Food update advances the entire economy, once, in one-second internal steps. Population is player.points; the Time resource uses freeTime because player.time is the runtime timestamp.

Current version 0.5 accepts earlier Civ saves through the same codec. The 0.2 additions to 0.1 saves supply missing route levels, comfort, improvements and action contracts. Existing Population, stocks, infrastructure and construction progress are retained on load; the new buyable rules apply on the next prestige. Organization's existing lifetime total supplies its ten milestones without a second saved milestone ledger. New upgrade fields hydrate to false, and shortage progress starts at zero. Existing keeper toggles from pre-0.5 saves migrate off once because they did not reserve a worker; their in-flight crews and stored progress remain. New saves count the keeper and reject overbooked worker contracts. Paused construction uses a saved zero-worker state with retained work. Previously purchased upgrades remain owned and functional; new purchases obey current lifetime gates. Earlier whole-layer retention rewards are replaced by the current specific-buyable rules on the next prestige. All reads and writes use the one current model; malformed or overcommitted action contracts fail before activation. The original ptr game's data stays untouched.

The base dark theme, monospace type, circular nodes and native upg/tabButton treatments are retained. Tests cover parallel crews, overbooking, recall, timed yields, the separate automation stages, irrigation, Shelter, prestige retention, saves and offline chunk parity. Balance profiles use real commands: active decisions every 5 seconds; regular decisions every 20 seconds until overseer, gravity flow and the milestone-10 auto-builder are earned, then every 300 seconds. This cadence change is owner-requested. Synthetic pacing is not human enjoyment evidence.
