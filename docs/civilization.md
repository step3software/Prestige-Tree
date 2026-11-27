# Civ resource design

Population is the base resource. Food, Water and Shelter are the opening nodes, followed by Craft/Organization, Money/Time and Education/Culture. This playable slice implements the owner's worker-action design; future eras remain separate work.

## First minutes

Start with 5 Population, 20 Food, 20 Water and housing for 8. Send Gather and Collect water; their crews return automatically with the yield. Use available workers to improve a route or build housing. Hunt and Fish can run alongside Gather and each other when enough workers are free. Dispatching a busy route or overbooking workers fails without spending anything.

Food and Water are consumed continuously. A new person takes 12 supported game seconds and needs housing plus a reserve of each supply equal to max(3, a quarter-minute of the next population's upkeep). Shortages pause growth; they never kill people or stop recovery actions. There is no duplicated continuous Food production system.

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

Coordinated hunting reduces its crew from 3 to 2; Fishing nets reduce theirs from 2 to 1. The Expedition overseer unlocks a separate repeat toggle for every Food route. Repetition removes dispatch clicks but retains the whole crew during every cycle. Orders wait when workers are unavailable, and pause near full storage.

Cultivated fields cost Food, Water, Craft and Organization and unlock longer farming cycles. The overseer repeats those cycles with 3 workers. Autonomous food production is a much later purchase requiring 8 Knowledge, 12 Craft, 120 Money and 10 Time: subsequent Food actions need zero workers. Purchased repeat orders still control which routes run. These costs are game abstractions, not historical dates.

## Water: hauling, reservoir and flow

Water starts with manual collection trips into a 50-capacity reservoir. Carrying yokes reduce the crew from 2 to 1. A Water keeper unlocks repeat collection orders while still occupying that worker.

A Gravity-fed spring requires 2 Craft, 1 Organization and 30 Food. It replaces hauling with continuous, unattended, worker-free Water flow: 24 base Water per minute plus 10 per improved well, scaled by tools and knowledge. An existing carrying crew finishes normally. Water reaches this stage substantially earlier than Food.

Well projects also improve manual trip yield and speed. Reservoir projects add 40 capacity. Irrigation spends 20 surplus Water, protecting the household growth reserve, to boost newly dispatched Food rewards by 35% for 45 seconds. It does not retroactively change active jobs. An Automatic sluice upgrade unlocks an optional auto-irrigation toggle; it obeys the same reserve and cooldown guards.

## Shelter: expand or improve

There are no building slots and no Shelter milestone track.

- **Build a new hut** is a repeatable, labor-only project adding 4 housing.
- **Improve existing homes** is a repeatable, labor-only project removing up to 0.5 workers' worth of domestic work.
- **Shared hearths** reduce remaining domestic work by 25% and add 25 Food storage.
- **Timber frames** increase all purchased homes from 4 to 6 housing, including existing homes.
- **Construction tools** double project speed while retaining the builder requirement.

Domestic work starts at 0.12 workers per person and cannot become negative. Remaining labor supports dispatches, construction, trade and free Time. The derived ledger counts domestic labor, every active crew and the builder once. Only whole available workers can join a crew. Trade/rest immediately yield their discretionary labor when an action begins.

One construction project runs at a time, reserving one builder. Progress is measured in work; Organization and Construction tools increase work per second. Canceling releases the builder and clears project progress. Housing cannot be destroyed or respecified through these controls.

## Prestige and later resources

Craft requires 8 Population and 25 Food/Water. Organization requires 8 Population, 12 housing and 35 Food/Water. Their gains remain floor(sqrt(min(stores)/requirement)). Both clear Food/Water stores and next-person growth progress; they keep Population, housing, equipment, upgrades, repeat orders, active trips, active construction, sibling prestige and all other resources.

Craft improves yields and worker-free Water flow by 18% per point. Knowledge adds 12%. Organization improves construction speed and reduces upkeep; cultural influence also reduces upkeep. At 2 Organization, the existing optional auto-builder can improve the foundations. Extensive Organization milestones remain future content.

Both prestige branches unlock Money and Time. Unreserved labor splits between trade and free hours. Earning 5 Money and 3 Time in total discovers Education and Culture. Education consumes Money/Time for Knowledge; Culture consumes Time/Craft for influence. Unlocks persist when currencies are spent.

## State, saves and verification

The canonical owner is createCivilizationRules in js/civilization.js. The registered Food update advances the entire economy, once, in one-second internal steps. Population is player.points; the Time resource uses freeTime because player.time is the runtime timestamp.

Version 0.2 extends 0.1 Civ saves additively at codec ingress: missing route levels, comfort, improvements and action contracts acquire explicit defaults. Existing Population, stocks, infrastructure and construction progress remain. An existing construction project acquires one reserved builder. All reads and writes then use the one current model; malformed or overcommitted action contracts fail before activation. The original ptr game's data stays untouched.

The base dark theme, monospace type, circular nodes and native upg/tabButton treatments are retained. Tests cover parallel crews, overbooking, recall, timed yields, the separate automation stages, irrigation, Shelter, prestige retention, saves and offline chunk parity. Balance profiles use real commands: active decisions every 5 seconds; regular decisions every 20 seconds until overseer plus gravity flow are earned, then every 300 seconds. This cadence change is owner-requested. Synthetic pacing is not human enjoyment evidence.
