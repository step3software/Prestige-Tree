# MAT01: Material upgrades and Fire buyables

Status: implemented and locally verified; unmerged delivery candidate for owner review. Latest corrections separate Water-storage and Cooking vessels, replace Communal cistern with Clay cooking pots, and replace Copper chisels/awls with pots/sickles. D2 is resolved by the owner: basic huts stay at Organization 1. The owner now authorizes the full development cycle, excluding merge/deployment.
Repository: `step3software/Prestige-Tree`; branch `docs/craft-materials-plan`. Rebased onto published main `27d24953e2c7c8c1617f22beba00fd668232713a`, preserving its current-held Organization rules. Original Fire and plan revisions remain recorded in evidence; parent writers remain unchanged.
Companions: [structured plan](MAT01.plan.json), [revision/hash evidence](MAT01.evidence.json), [preparation](MAT01.preparation.json), [verification](MAT01.verification.md).

## Intended outcome and scope

Five row positions mean one expensive material unlock and four related purchases. Crafting costs 10 Craft, Clay 20, recommended Copper working 30. Related prices are 1, 2 and 3 Craft. Learned material access reveals the row without buying its contents. Effects below remain proposed initial tuning unless expressly supplied by the owner. The material-unlock prices are not harvested resource stocks.

Buyables improve across materials without multiplying identities. Water storage, Cooking and housing have separate equipment families. A higher-material tile pays for the upgrade to that family's current buyable, preserving its levels, paid work and prior applicable effects. It does not grant a duplicate level or refund earlier spending. Require the earlier family stage and target material before a tier upgrade. The old tile shows its upgraded stage; it cannot be bought again as a separate bonus. UI summaries, costs, saves and direct commands share those predicates.

Keep Food/Water survival, labor, in-flight contracts, Fire tending and prestige safety. Exclude new gathered fuel/ore/material currencies, extra eras, an invented Fish unlock, unrelated automation/farming redesign, merge/deployment, service activation. Bronze at a proposed 50 Craft remains a future recommendation only. A purchase of all fifteen material-row positions totals 84 Craft, excluding further construction, the spring and independent Fire-project levels. Pipes additionally cost exactly 2 Fire.

## Material rows and proposed effects

### Crafting (10 Craft)

Four related purchases at **1 Craft each**. A higher-tier purchase upgrades its existing family rather than creating a duplicate.

| Purchase | Proposed effect |
| --- | --- |
| Thatched roofs | Thatched-roof housing tier: +1 housing per existing or future hut. Bricks replaces this tier later; hut levels remain unchanged. |
| Wooden spears | Unlock Hunt and use the existing Spear hunting reduction from 3 to 2 workers before bigger-game scaling. |
| Woven baskets | Water-storage buyable: +40 capacity per level, named Woven baskets. Earthenware jars upgrades this same buyable and preserves its level/work. |
| Digging sticks | Increase Gather yield by 25%, retaining crew and duration. Reuse the digging upgrade. |

### Clay (20 Craft)

Four related purchases at **2 Craft each**. A higher-tier purchase upgrades its existing family rather than creating a duplicate.

| Purchase | Proposed effect |
| --- | --- |
| Earthenware jars | Upgrade the Woven baskets Water-storage buyable for 2 Craft: preserve all levels/work, raise base Water capacity 50 to 100 and capacity per level 40 to 120. Replace the old name; do not add a second storage counter. |
| Bricks | Upgrade Thatched roofs for 2 Craft: +2 housing per hut replaces +1. Preserve the same housing/hut counts and construction progress; do not add the two tier bonuses. |
| Clay cooking pots | Cooking-vessel buyable: 25% less Fire consumed by Cooking at the same selected level and Food output. Separate identity from Water-storage jars. |
| Fired-clay pipes | 2 Craft plus exactly 2 Fire once: double passive Water flow without changing manual hauling. No income without a spring. |

### Copper working (30 Craft)

Four related purchases at **3 Craft each**. A higher-tier purchase upgrades its existing family rather than creating a duplicate.

| Purchase | Proposed effect |
| --- | --- |
| Copper axes | Double hut construction speed; builders remain occupied. |
| Copper knives | +50% Hunt yield, unchanged crew/duration; use the existing butchery effect once. |
| Copper pots | Upgrade Clay cooking pots for 3 Craft. Keep their 25% Cooking fuel saving; add +25% Cooking bonus yield at the same requested fuel cost. Preserve vessel level/work. |
| Copper sickles | Farming trips take 25% less time for the same reward and crew (60s base to 45s). Requires existing Farming activity; new dispatches only. |

## Three separate upgrade chains

- **Water storage: Woven baskets -> Earthenware jars.** Keep the existing `water.storage` level. Baskets provide +40 capacity/level; jars replace that with +120 and raise base Water capacity to 100. Do not retain a second basket counter. Paid existing storage work completes once without a retroactive fee. The material-tier fee is 2 Craft; future repeatable storage starts use their current material's 1/2-Craft recipe, existing work scaling and applicable firing inputs.
- **Cooking: Clay cooking pots -> Copper pots.** Keep a separate Cooking-vessel record. Clay cuts Cooking fuel consumption by 25%. Copper retains that saving and adds 25% to the *Cooking bonus*, without increasing requested fuel. At Cooking setting 3, a fully fueled multiplier rises from `1 + 2 = 3x` to `1 + 2*1.25 = 3.5x`; at setting 5 it rises from 5x to 6x. No added raw Food or extra benefit at setting 1. Partial fuel scales the bonus normally. These are distinct from Water jars.
- **Housing: Thatched roofs -> Bricks.** Keep existing hut counts and paid building progress. Replace the +1 housing/hut tier with +2/hut; do not sum them to +3. Apply to existing and future huts. Preserve any independently purchased historical Timber frames effect without turning it into a weaker tier or selling its exact effect twice.

Copper sickles shorten only newly dispatched Farming contracts by 25%, with the same reward/crew. They do not unlock Farming themselves. Copper axes double hut construction speed; knives reuse Butchery tools once for +50% Hunt yield. Chisels and awls are removed from the candidate row. Proposed fishhooks are not selected. Permanent techniques and tier upgrades apply once; this plan does not invent unbounded stacking for their global effects. Existing repeatable storage/hut counts remain the physical buyables.

Earthenware technology costs 2 Craft rather than the old upfront 2-Fire technology price. Ceramic manufacture still needs the existing Fire capability; recurring jar construction retains its applicable scaling Fire recipe, including grandfathered work. Clay cooking pots cost 2 Craft; Copper pots cost 3 Craft to upgrade those same vessels. Fixed pipe purchase cost remains 2 Craft plus 2 Fire. The owner removed Communal cistern; it has no active tile, capacity bonus or new saved key.

## Fire buyables proposal

Fire already has assigned tenders and fuel consumption. Add these repeatable projects to its panel, available once Fire exists and their material capability is learned:

| Fire buyable | Craft per level | Proposed effect |
| --- | --- | --- |
| Fuel stores | 1 | +10 Fire capacity per completed level; no stock granted |
| Improved hearths | 1 | +20% of base Fire-tender production per level, additive across levels; still requires tenders |
| Charcoal clamps | 2 | Divide Cooking and recurring manufacturing Fire requirements by 1 + 0.15 * level; fixed technology/pipe purchase costs unchanged |

Fuel stores and Improved hearths require Crafting; Charcoal clamps requires Clay. First-level work is proposed at 12/16/24 respectively, scaling as `baseWork * 1.35^ownedLevel`. They use the existing single construction slot and one builder, pay the complete Craft cost once at start, and add their level only at completion. Busy/unstaffed/locked/poor starts spend nothing. Cancellation retains existing no-refund rules. Add no initial Fire charge, so zero-stock recovery remains possible. New Fire projects are unprotected by default on both prestige types; preserve all existing named retention rewards rather than assigning an invented retention milestone.

With `F` Fuel stores, `H` Improved hearths, `C` Charcoal clamps and `f = storedFire / maximum`:

```text
maximum Fire = 10 + 2*huts + 10*F
tender production/min = tenders * (0.5 + 1.5*f*f) * (1 + 0.20*H)
Cooking fuel = existing requested Cooking fuel * vesselDiscount / (1 + 0.15*C)
vesselDiscount = 0.75 with Clay or Copper pots; otherwise 1
recurring manufacturing fuel = its existing recipe / (1 + 0.15*C)
```

Zero tenders still produce zero Fire. Storage construction adds capacity, never stored fuel, and never raises stored Fire to preserve fullness. Increased capacity can temporarily lower the existing fullness-dependent tending rate; report the actual new rate truthfully. Hearth production is additive across hearth levels. Charcoal abstracts better fuel preparation without a new currency; no free fuel is produced by the clamps. Fixed technology purchase costs, including the exact 2 Fire for pipes, are never discounted. At 3 charcoal levels, fuel is divided by 1.45. With Cooking pots it is `0.75/1.45` of the undiscounted Cooking requirement. Copper's bonus-yield factor does not increase that requirement.

Both `fireStatus()` and actual `advanceFire()` must use the same discounts and Copper bonus: the UI cannot show fuel savings while the step consumes the old amount. Fire losses release workers as before. Completed physical levels, active Fire projects, material prerequisites, prestige previews and offline chunks need normal validation. Exact saved fields/type filenames belong in preparation; do not add a second Fire simulation.

## Access and opening dependency

Crafting replaces the blanket Organization-6 basic Food/Water buyable gate, preserving activity prerequisites. Wooden spears unlock Hunt and its existing crew reduction. Basic exploration/provisioning, well and storage construction follow Craft prerequisites. Larger-game levels lose their per-level Organization requirement. Existing discovered Fish remains usable; no new-game Fish milestone is selected here. Farming and its tools retain the existing activity gate.

Organization retains automation, Fire availability, spring availability, Farming, Abundance, irrigation and exact existing physical-retention rewards. Update moved item descriptions without renumbering milestones. Spring retains Organization-5 availability and 2 Craft +1 Organization +30 Food cost. New Fire projects use material access, rather than a later Organization buyable milestone, after the Fire resource exists.

**D2 resolved:** housing starts at 8, while Craft begins at 12. Requiring 10-Craft Crafting before any huts would deadlock. Recommended smallest change: keep labor-only huts at Organization 1, with their improvements purchased through Craft. Moving huts too needs an explicitly amended first-Craft threshold, starter capability and earnings formula. Owner explicitly selected keeping basic huts at Organization 1 in the asynchronous reply.

## Water formula and storage

Let `u = 1 / (1 + currentOrganization * 0.06 + currentCulture * 0.04)`, the existing actual per-person upkeep. Factor it into one shared domain calculation. Proposed passive Water/min with a spring:

```text
u * (8 + completedWellLevels) * knowledgeEffect * (ownsFiredClayPipes ? 2 : 1)
```

Without spring the result is zero, even with pipes. No wells, Knowledge or Water upgrades means `8*u`: net zero at eight people and net `-u` at nine. Test Organization 0, earned spring prerequisites and subsequent spending; a flat 8 would otherwise support more than eight when Organization lowers upkeep. This is an authored household-supply abstraction. A technical alternative is a fixed physical spring with upkeep reducing demand, but it fails the literal eight-person baseline after Organization discounts. Show actual units/min and sustainable support truthfully. The baseline is not a hard Population cap: reserves/manual trips can temporarily or continuously support more people.

Replace the old `24 + 10*wellLevel` flow. Each well now adds one upkeep-equivalent per minute before Knowledge/pipes; retain its existing manual yield/speed bonuses. Pipes multiply the complete passive expression once, including wells/Knowledge, and never multiply manual haul rewards. At zero improvements they support sixteen people at the same upkeep. Fire is paid once, not consumed to operate pipes. Fire depletion after manufacture does not shut them off.

Remove the spring-based manual dispatch lock/automatic action classification. Keep Collect water visible with normal crew, busy, capacity, recall and solo-survivor rules. A pre-spring trip finishes exactly once after spring purchase; a new trip can start afterwards. Do not add automatic Water repeats. Flow and crew deliveries use one capacity clamp without double counting.

Use the existing Water storage count for both container tiers: baskets add 40 capacity per level; Earthenware jars replace that coefficient with 120 and raise base capacity from 50 to 100. Upgrading retains every existing level and any paid construction. Rename the same buyable rather than adding basket and jar counts together. Water capacity is `(earthenwareTier ? 100 : 50) + water.storage * (earthenwareTier ? 120 : 40)`. Copper cooking pots do not alter this calculation. Communal cistern is removed; the existing Emergency cistern shortage-protection upgrade remains a separate retained mechanic.

## Saves, prestige and recovery

Use one current versioned save model through detached codec ingress. Preserve existing Water storage/hut levels, current material tiers, paid projects, stocks, currencies, permanent purchased effects, Food action snapshots, accrued Cooking bonuses, queues and worker budgets. No retroactive upgrade, Craft or Fire charge. Map old `jars` ownership and Water construction to the single storage family without a duplicate basket count; preserve historical capacity. Cooking vessels have their own record and must never be inferred just from owning Water jars. Historical Timber frames keep their independent earned effect. Validate tier membership, preceding stage, nonnegative safe counts and all active project references. Reject malformed current records atomically without changing durable or live state. Migration must be idempotent; new writes use only the current schema, without a legacy runtime.

Water-storage and hut levels keep their existing exact retention rules. Material knowledge and permanent tier effects survive prestige; reset the unprotected new Fire-project levels and Fire/tender assignments with a truthful preview. Protected work and active Food snapshots retain their normal existing policies. Preserve an export with its matching build; older builds can reject newly added keys. Original `ptr` storage remains untouched. Planning artifacts are not game versions and require no gameplay migration.

## Implementation sequence and owning files

1. Apply the owner-resolved D2 choice and validate exact plan bytes, and prepare the bounded file list against a fresh verified parent. Reuse this branch for later authorized stages; do not restart or alter the parent's writer. Verify the current Orcha snapshot afresh for the next task.
2. In `js/civilization.js`, add a small explicit row/upgrade catalog and shared prerequisites; reuse existing upgrade/project commands. Implement the resolved bootstrap, exact costs and atomic spending, then migration/defaults/validation/prestige. Keep persisted state under the session-owned Civ record, with the existing Water storage count and separate cooking-vessel/housing tiers. Update `js/mod.js` version. Existing contracts in `js/contracts.js` infer the persisted shape from canonical defaults; there is no separate types directory.
3. In the same rules owner, implement shared upkeep/passive flow, in-place storage tiers, pipes, Cooking vessels, Fire projects and continued hauling. UI commands in `js/components.js` and `index.html` derive availability/costs and render Craft material rows using existing native controls. Use `civ.css` only as needed for row layout. Keep domain decisions out of templates.
4. Extend nearby organization/opening/food/Fire rule and save suites, focused Water/material tests, and `tests/browser/civilization.spec.cjs` / `fire.spec.cjs` (or a focused material journey). Retain survival/worker-budget regressions. Exact affected test filenames belong in preparation.
5. Update `scripts/balance/policy.cjs`, `sections.cjs` and relevant balance tests together. Teach policies to bank material costs, purchase legal prerequisites, choose storage versus flow and haul above baseline; do not repeatedly spend the savings needed for a row. Reconcile the regular-cadence transition, which currently assumes worker-free Water is sufficient. Report when five-minute checks cannot sustain a larger population.
6. Revise canonical `docs/civilization.md`, affected routes in `docs/developer-guide.md`, README and balance descriptions in the implementation change. Keep research notes as evidence, not gameplay authority. Run focused checks then required `npm test`; retain source-hashed active/regular and matched rough/fixed observations. Later publish only through the verified project path with parent/PR12 dependencies and human merge control.


Preparation must additionally pin the exact Fire-project construction/default/type owners, same-buyable tier records and migration fixtures. Extend legal balance policies to buy Fire projects and exercise actual level completions; a catalog entry alone is not coverage. Apply revised effects consistently to browser view models, direct commands and actual economy steps.

## Acceptance and verification

- **MAT01-AC01**: Each row has exactly five tiles: one capability purchase at 10/20/30 Craft followed by four purchases at 1/2/3 Craft respectively; the 30-Craft Copper row is the requested architect recommendation.
- **MAT01-AC02**: The first successful row-unlock purchase permanently reveals its four related tiles. Failed, repeated one-time or insufficient-funds purchases spend nothing and reveal nothing.
- **MAT01-AC03**: Craft capability predicates replace the Organization-6 buyable gate and bigger-game per-level Organization requirement. Organization retention, automation and unrelated activity gates remain explicit; bootstrap follows the resolved D2 decision.
- **MAT01-AC04**: Every listed upgrade and repeatable project has an observable effect, truthful cost and shared simulation/UI eligibility; direct locked commands reject atomically.
- **MAT01-AC05**: Collect water remains visible and dispatchable with a spring, including after reload, with normal worker/busy guards and active snapshots.
- **MAT01-AC06**: A spring without Water improvements supports exactly eight current-upkeep equivalents: zero net Water at eight and negative at nine, including Organization balance changes. This is sustainable supply, not a Population cap.
- **MAT01-AC07**: Communal cistern is absent. Clay cooking pots cost 2 Craft and reduce Cooking Fire use by 25%. Pipes cost 2 Craft plus exactly 2 Fire and double only passive Water.
- **MAT01-AC08**: Learned material tiers and permanent techniques survive both prestiges. Reuse exact existing Water-storage/hut retention IDs and levels; retain/reset Fire-project levels by the explicitly documented unprotected default.
- **MAT01-AC09**: Supported old Civ exports migrate atomically to the one current schema, preserving currencies, bought effects, active jobs, paid construction and applicable retention. Malformed imports preserve live and durable state; ptr stays untouched.
- **MAT01-AC10**: A legal fresh-game policy reaches the first material and each later row without resource grants or an unlock cycle. Active and regular balance runs report observed cost/time, cadence and completion or stalls; rough/fixed comparisons cover the new sections.
- **MAT01-AC11**: Desktop/narrow keyboard journeys cover row unlocks, same-buyable tier upgrades, manual hauling after spring, pots/fuel effects and Fire-project progress; no stale label, duplicate counter or double charge after save replacement.
- **MAT01-AC12**: Focused rules/save/balance/browser checks and full npm test pass on the implementation candidate; canonical design, developer map and progression text match shipped behavior. Planning validation alone cannot satisfy these criteria.
- **MAT01-AC13**: Repeatable Fire projects charge complete Craft costs once, reserve the normal builder, complete after scaled work, expose owned levels/effects, reset on prestige by the unprotected default, and generate no Fire without tenders.
- **MAT01-AC14**: Water baskets upgrade only to storage jars; Clay cooking pots upgrade only to Copper cooking pots; Thatched roofs upgrade to Bricks. Each transition preserves count/work, enforces prior ownership and charges its material-tier fee once.
- **MAT01-AC15**: Cooking fuel UI and actual one-second consumption use identical vessel/charcoal discounts; Copper increases only the fueled Cooking bonus. Uncooked Food and Cooking level 1 remain unchanged. Sickles affect only newly dispatched Farming durations.

Planned scenarios include one less/exact Craft and Fire cost; repeatable versus one-time purchases; tier predecessor rejection; preserved count/work through all three chains; pots at Cooking settings 1/3/5 with full/partial/empty fuel; sickle job snapshots; zero-tender Fire with all projects; capacity without free stock; production/efficiency levels; canceled/retained construction; Fire-project resets; legacy/current save replacement; invalid tier imports; and online/offline chunk parity. Active/regular legal play must demonstrate reachability and report stalls, cadence, source hashes and matching rough/fixed observations. No human pacing or enjoyment target is invented.

The player starts fresh or from a preserved Civ save, earns Craft legally, reveals material rows and upgrades an existing buyable with a visible new name/effect. Denied purchases retain funds/work and explain prerequisites. Keyboard focus remains useful after a tier changes its tile; narrow layouts show full prices and effective rates. Measured/browser evidence must identify its level; synthetic checks do not establish actual-user or assistive-technology behavior. No native zoom gate or new performance budget is introduced.

## Decisions, provenance and documentation

The owner explicitly selected the three separate upgrade chains, Clay cooking pots, removal of Communal cistern, Copper pots for Cooking, Copper sickles for Farming, and the need for Fire buyables. New coefficients and the three named Fire projects are architect proposals. D2 was answered by the owner; the current request authorizes preparation, implementation, review and fixes. Native lifecycle authority and merge/deployment remain separate.

Research uses pinned Plant/Water notes at `b42c39c84cd653fff166dca07b569c0fd0bddbbe`. Hash-verified Plant part 7 paragraphs 7-11 discuss a reusable charcoal mound and the labor of fuel preparation; part 4 paragraphs 22-39 support tight water baskets; part 6 paragraphs 91-92 support thatched frames. These are practical reconstructions, not measured game coefficients. The [Smithsonian earthenware cooking pot](https://www.si.edu/object/cooking-pot%3Afsg_S2005.198) supplies a vessel example; it is a later ethnographic object, not an invention date. The [Milwaukee copper-tool collection](https://www.mpm.edu/research-collections/anthropology/online-collections-research/old-copper-culture/artifacts) supports several task-specific tools. [London Museum's sickle](https://www.londonmuseum.org.uk/collections/v/object-2493/sickle-socketed-sickle/) is explicitly copper alloy and Late Bronze Age; it does not establish pure-copper or universal technological superiority. The [Met's sickle discussion](https://www.metmuseum.org/art/collection/search/587605) explains continuing flint use. Keep Copper-row names/effects as game abstractions, without asserting a mandatory historical ladder.

README -> developer guide -> `createCivilizationRules` remains the human route. Keep research as evidence and shipped gameplay rules in the canonical civilization document. Registry/manifest `master` versus local `main` remains recorded; the original explicit latest-work instruction selected the local Fire source. Preserve historical accepted artifacts and previous plan commits rather than rewriting authority. This task adds no duplicate ledger or documentation reorganization.
