# Civ resource design

Population is the base resource. Food, Water and Shelter are the opening nodes, followed by Craft/Organization. Money/Time and Education/Culture remain locked, hidden later branches. This playable slice implements the owner's worker-action design; future eras remain separate work.

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

Food routes have distinct repeatable projects, each reserving one builder:

- **Explore farther afield** (`gather-tools`): each level multiplies gathering time by 1.2 and yield by 1.5 with the same one-person crew. Work starts at 14 and scales by 1.35 per level.
- **Hunt bigger game** (`hunt-tools`): each level multiplies the crew by 1.5, rounding up after each level, and doubles yield. Duration stays 25 seconds. The next tier requires 1 + current level lifetime Organization (not spent); work stays 14. Coordinated hunting applies before scaling: crews grow 2, 3, 5, 8 instead of 3, 5, 8, 12.
- **Weave river traps** (`fish-tools`): each level doubles the catch with the same crew and 18-second trip. Craft costs start at 1 and double per level; work stays 14. Craft is spent when construction starts, with no refund on cancellation or lost construction at prestige. Spending Craft also reduces its shared tool bonus, making traps a route specialization choice.
- **Farming tools** retain their +35% base yield and faster-cycle effect; work scales by 1.35 per level.

Provisioning improves all Food routes by 15% of base yield per level. Each Food basket adds 40 storage and costs exactly 1 Craft up front, in addition to its existing scaling work requirement. Provisioning and exploration/farming spend work only. Improvements affect newly dispatched trips. Repeat orders wait for sufficient workers for the new crew size; Autonomous food production still removes the final scaled crew requirement.

Coordinated hunting reduces the base crew from 3 to 2 before bigger-game scaling; Fishing nets reduce theirs from 2 to 1. The Expedition overseer becomes available at Organization milestone 5; purchasing it unlocks a separate repeat toggle for every Food route. Repetition removes dispatch clicks but retains the whole crew during every cycle. Orders wait when workers are unavailable, and pause near full storage.

Cultivated fields become available at Organization milestone 7, cost Food, Water, Craft and Organization and unlock longer farming cycles. The overseer repeats those cycles with 3 workers. Food autonomy and Automatic sluice require later resources and are unavailable in this opening; their previously purchased effects remain intact in older saves. Purchased repeat orders still control which routes run. These costs are game abstractions, not historical dates.

## Water: hauling, jars and flow

Water starts with manual collection trips into 50-capacity reserves. **Craft earthenware jars** adds 40 Water storage per purchase for exactly 1 Craft plus the existing work requirement: 12 × 1.35^owned jars. Craft is spent at start, with the same cancellation/prestige no-refund rule as Food baskets. Existing jar projects finish without retroactive charges. [Research and material options](research/reference-guide.md#water-storage-materials) explain the early fired-clay name; later material upgrades have no current cost or unlock. Carrying yokes, the initially available Water Craft upgrade, reduce the crew from 2 to 1. Well lining unlocks at 2 lifetime Organization and improves collection and gravity-fed flow by 25%. Water keeper unlocks at milestone 4. Turning it on reserves one dedicated keeper even at full storage, in addition to any carrying crew. It cannot be enabled without that worker. Prestige turns it off; Gravity-fed spring also switches it off and releases the keeper.

A Gravity-fed spring unlocks at milestone 6 and requires 2 Craft, 1 Organization and 30 Food. It replaces hauling with continuous, unattended, worker-free Water flow: 24 base Water per minute plus 10 per improved well, scaled by tools and knowledge. An existing carrying crew finishes normally. New games currently retain staffed Food production.

Well projects also improve manual trip yield and speed. Earthenware jar projects add 40 capacity. Irrigation spends 20 surplus Water, protecting the household growth reserve, to boost newly dispatched Food rewards by 35% for 45 seconds. It does not retroactively change active jobs. Previously owned Automatic sluice still obeys the same reserve and cooldown guards; new purchases await future resource unlocks.

## Shelter: expand housing

There are no building slots and no Shelter milestone track.

- **Build a new hut** is a repeatable, labor-only project adding 4 housing.
- **Shared hearths** add 25 Food storage.
- **Timber frames** increase all purchased homes from 4 to 6 housing, including existing homes.
- **Construction tools** double project speed while retaining the builder requirement.

There is no domestic work or household labor reservation. Every person can join a crew or build. The ledger counts every active expedition, the Water Keeper and the builder once. Only whole available workers can join a crew.

One construction project runs at a time, reserving one builder while active; population loss may pause it with its progress intact. Progress is measured in work; Organization and Construction tools increase work per second. Canceling releases the builder and clears project progress; spent Craft is not refunded. Housing cannot be destroyed or respecified through these controls.

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
| 4 | Water keeper and Emergency cistern | Earthenware jars |
| 5 | Expedition overseer and Emergency rations | Food baskets |
| 6 | Gravity-fed spring | Well improvements |
| 7 | Cultivated fields | Explore farther afield |
| 8 | Construction tools and Mutual aid | Hunt bigger game |
| 9 | None in the current opening | Weave river traps |
| 10 | Auto-building toggle | Huts |

Retention is evaluated by the exact buyable ID, not its resource layer. Water-storage records do not retain wells; gathering records do not retain bigger-game levels. Provisioning and farming tools continue to reset through milestone 10. Later rewards can extend that progression.

Milestones use lifetime Organization earnings, never the spendable balance. Newly earned unlocks and specific retention apply immediately on that Organization prestige. Both Craft and Organization use the same retention rules. The UI preview and native confirmation share the command's prospective reset plan.

Before milestone 10, housing returns to 8; Population independently returns to 5. Unprotected construction loses progress, while protected construction retains its progress and paused/active state. Trips whose equipment resets return without yield; other trips may return if the smaller founding population cannot staff them. The preview names these outcomes before confirmation. Retained jobs are checked against the post-reset five-person budget, with Water Keeper off.

Craft improves yields and gravity-fed flow by 18% per point; Knowledge adds 12%. Organization speeds construction and reduces upkeep. Auto-building is unavailable before milestone 10, including when an earlier save has its toggle enabled. Once earned it starts repeatable projects with one reserved builder and normal construction time.

Money, Time, Education and Culture are locked and hidden for now, with no in-game unlock. Craft/Organization earnings do not reveal them; unreserved workers remain available instead of generating currencies. New investments and upgrades costing later resources are unavailable. Existing earned balances and purchased upgrade effects are preserved, without generating more Money or Time.

## State, saves and verification

The canonical owner is createCivilizationRules in js/civilization.js. The registered Food update advances the entire economy, once, in one-second internal steps. Population is player.points; the Time resource uses freeTime because player.time is the runtime timestamp.

Current version 0.6 accepts earlier Civ saves through the same codec. At ingress, pre-0.6 later-resource unlock flags are switched off, hidden resource tabs return to Food, and retired home-improvement construction releases its builder and clears its work. Earned balances, owned upgrades, other construction and trips remain. Historical home-improvement counts are preserved without an active labor effect. The 0.2 additions to 0.1 saves supply missing route levels, comfort, improvements and action contracts. Existing Population, stocks, infrastructure and construction progress are retained on load; the new buyable rules apply on the next prestige. Organization's existing lifetime total supplies its ten milestones without a second saved milestone ledger. New upgrade fields hydrate to false, and shortage progress starts at zero. Existing keeper toggles from pre-0.5 saves migrate off once because they did not reserve a worker; their in-flight crews and stored progress remain. New saves count the keeper and reject overbooked worker contracts. Paused construction uses a saved zero-worker state with retained work. Previously purchased upgrades remain owned and functional; new purchases obey current lifetime gates. Earlier whole-layer retention rewards are replaced by the current specific-buyable rules on the next prestige. All reads and writes use the one current model; malformed or overcommitted action contracts fail before activation. The original ptr game's data stays untouched.

The base dark theme, monospace type, circular nodes and native upg/tabButton treatments are retained. Tests cover parallel crews, overbooking, recall, timed yields, the separate automation stages, irrigation, Shelter, prestige retention, saves and offline chunk parity. Balance profiles use real commands: active decisions every 5 seconds; regular decisions every 20 seconds until overseer, gravity flow and the milestone-10 auto-builder are earned, then every 300 seconds. This cadence change is owner-requested. Synthetic pacing is not human enjoyment evidence.

Existing route IDs and levels remain in `player.food.routes` and use the current formulas immediately. In-flight trips retain saved contracts. Previously started current construction (including Food baskets) completes without a retroactive Craft charge or Organization gate; new starts use current requirements. The save representation and single runtime are unchanged.
