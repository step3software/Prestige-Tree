# MAT01: Craft materials and complementary Water supply

Status: owner-requested implementation-plan draft, November 27, 2026. D1/D2 remain open; this is not native milestone enrollment or implementation authority.
Repository: `step3software/Prestige-Tree`. Branch: `docs/craft-materials-plan`.
Source: local `codex/fire-ms4` at `2d60aaf8874ae0d59eddbd7a7f8f4f3691fe309a`, ahead of PR12 (`8032e91`) and published `main` (`8333e6d`). The parent has an existing writer and pending publication; this task neither publishes nor edits it.
Companions: [structured plan](MAT01.plan.json), [revision/hash evidence](MAT01.evidence.json).

## Outcome and boundaries

A player banks Craft, buys a material capability, sees its related upgrades, and chooses equipment/storage improvements. A spring supplements manual hauling. Storage gives room for reserves; pipes improve delivery. The original request authorizes this plan and its isolated branch only.

The proposed layout has Wood, Bark/plant fiber, Stone and Clay rows with five upgrades each. D1 distinguishes this from five early technologies in total. Numerical effects below are initial design proposals for balance testing. The request explicitly supplies the starting material prices, 10% price relationship, eight-person baseline and pipe Fire cost/multiplier.

Materials mean knowledge of working a material, not harvested inventories. Buying the first tile spends Craft once and permanently reveals that row; it does not instantly buy all its upgrades or grant stock. Row purchases are independent, without an invented universal historical sequence. Fired products also require available Fire. The row's purchase is one-time; repeatable projects keep their existing work/builders and resource-panel controls.

Exclude new raw-material gathering, a fishing unlock, later eras, weather, contamination, changes to farming/automation, unrelated Organization rewards, and all implementation/merge/deployment in this task. Existing Fire tending, Cooking and Shared hearths remain. No implementation tests are claimed by this document.

## Material and upgrade proposal

Unlock costs are fixed Craft: 10, 20, 50, 100. Every ordinary upgrade in a row costs 10% of that row's fixed unlock: 1, 2, 5, 10 Craft. These are never a percentage of the player's balance. Fire is an additional manufacturing input: pipes cost 10 Craft plus exactly 2 Fire under this interpretation. Material unlocks alone cost 180 Craft; all twenty upgrades add 90 Craft, for 270 Craft plus 8 Fire before repeatable construction. Test this large investment; no pacing target has been accepted.

### Wood: 10 Craft to unlock; 1 Craft per upgrade

| Upgrade | Proposed behavior | Research / reuse |
| --- | --- | --- |
| Spears | Unlock Hunt for new settlements and retain the existing Spear hunting crew reduction (3 to 2 before bigger-game scaling). | PLT-08; existing hunting ID |
| Digging sticks | +25% Gather yield; same crew and duration. | PLT-02; existing digging ID |
| Timber frames | Huts provide 6 housing instead of 4, including existing huts. | PLT-04; existing joinery ID |
| Carrying yokes | Manual Water crew falls from 2 to 1; solo recovery remains legal. | WAT-08; existing buckets ID |
| Raised provision racks | +25 Food storage; no Food income. | SMI-04; proposed storage abstraction |

### Bark / plant fiber: 20 Craft to unlock; 2 Craft per upgrade

| Upgrade | Proposed behavior | Research / reuse |
| --- | --- | --- |
| Woven water baskets | Unlock a distinct repeatable basket project: 1 Craft, 12 * 1.35^basketLevel work, +40 Water capacity per completed basket. | PLT-03; WAT-01 |
| Food basketry | Unlock existing food-storage projects: 1 Craft, existing scaling work, +40 Food capacity. | PLT-03; existing food-storage ID |
| Cord lashings | Hut-work growth factor falls from 1.35 to 1.25. | PLT-03/04; existing lashings ID |
| Bucket ropes | +25% manual Water reward on the next dispatch; no passive flow bonus. | WAT-08; proposed coefficient |
| Woven river traps | Unlock existing fish-tools projects with their existing 2^level Craft costs, construction work and staffed Fish behavior; Fish still needs its own discovery. | PLT-07; existing fish-tools ID |

### Stone: 50 Craft to unlock; 5 Craft per upgrade

| Upgrade | Proposed behavior | Research / reuse |
| --- | --- | --- |
| Knapped butchery blades | +50% Hunt yield on the next dispatch. | PLT-02; existing butchery ID |
| Hammerstones and construction tools | Double construction speed; builders remain reserved. | PLT-02; existing builderTools ID |
| Stone adzes | Additional 1.25x construction speed; multiplicative with Construction tools. | PLT-02; proposed coefficient |
| Well construction tools | Unlock existing water-site projects; retain manual improvements, replace +10 passive units/level with the smaller flow formula below. | WAT-03; existing water-site ID |
| Communal cistern | +200 Water capacity once; no refill, flow or shortage-grace change. | WAT-05; new ID communalCistern |

### Clay: 100 Craft to unlock; 10 Craft per upgrade

| Upgrade | Proposed behavior | Research / reuse |
| --- | --- | --- |
| Earthenware jars | Also costs 2 Fire. Retain jars upgrade: base Water capacity 100, +120 per jar level. Unlock existing jar projects, retaining 1 Craft + 0.5 * 1.5^jarLevel Fire and existing work. | SMI-14; PLT-10; existing jars ID |
| Sun-dried bricks | +1 housing per hut, including existing huts; no Fire charge. | PLT-05; proposed clay-building abstraction |
| Fired bricks | Also costs 2 Fire. Additional +1 housing per hut, including existing huts. | PLT-10; proposed fired-clay application |
| Ceramic roof tiles | Also costs 2 Fire. Multiply required hut work by 0.9. | PLT-06; proposed coefficient |
| Fired-clay pipes | Also costs exactly 2 Fire. Double total automatic Water flow; no effect without a purchased spring and no manual-trip multiplier. | WAT-05; user-requested 2x and Fire cost |

All names/effects beyond the owner's examples are proposals. Reuse existing upgrade IDs/effects where named rather than introducing duplicate bonuses. Housing additions from bricks add to Timber frames: 4 base +2 with frames +1 sun-dried +1 fired, per hut. Recompute existing homes through the same housing owner. Construction tools and adzes multiply speed; lashings and tiles change work as specified. Active jobs retain dispatched rewards/crews. An upgrade never retroactively charges an existing project.

## Access, Organization and the opening

Remove the blanket Organization-6 Food/Water buyable gate and bigger-game's per-level Organization requirement. Add explicit capability prerequisites to each project and enforce them in direct commands as well as the UI. Proposed mapping: Wood opens exploration/provisioning/bigger-game equipment once its associated activity is discovered; Bark upgrades open food baskets, water baskets and river traps; Stone well tools open well projects; Clay jars open jar projects. Farming tools still require the existing Farming activity and a suitable material capability (Wood initially). Spears replace the new-game Organization-2 Hunt discovery gate. Existing discovered Hunt/Fish remain usable.

Organization continues to own automation, Fire availability, spring availability, Farming, Abundance, irrigation and exact prestige retention. Remove moved item names from milestone promises without renumbering milestones or changing retention IDs. Empty milestone content is acceptable when it still grants retention. Spring remains the existing purchase at Organization 5, with 2 Craft +1 Organization +30 Food; the owner's Water request does not remove its own gate.

Huts need D2. Current Craft begins at 12 people but starting housing holds 8; requiring Wood at 10 Craft for all housing is circular. Recommended smallest change keeps labor-only huts at Organization 1 and moves the other buyables to Craft. The all-huts alternative needs a deliberately amended opening: first Craft reachable at 8, a separate 1-Craft starter-hut capability, and specified earnings beyond that point. Do not invent that amendment during implementation. Both alternatives must legally reach Wood without grants.

The general auto-builder must choose only projects whose new prerequisites and complete upfront costs pass the same command guards. No bypass through auto-building, repeat queues or imported discovered-feature flags. Do not assign an unrequested new Fish unlock merely to demonstrate traps.

## Water formula and storage

Let `u = 1 / (1 + currentOrganization * 0.06 + currentCulture * 0.04)`, the existing actual per-person upkeep. Factor it into one shared domain calculation. Proposed passive Water/min with a spring:

```text
u * (8 + completedWellLevels) * knowledgeEffect * (ownsFiredClayPipes ? 2 : 1)
```

Without spring the result is zero, even with pipes. No wells, Knowledge or Water upgrades means `8*u`: net zero at eight people and net `-u` at nine. Test Organization 0, earned spring prerequisites and subsequent spending; a flat 8 would otherwise support more than eight when Organization lowers upkeep. This is an authored household-supply abstraction. A technical alternative is a fixed physical spring with upkeep reducing demand, but it fails the literal eight-person baseline after Organization discounts. Show actual units/min and sustainable support truthfully. The baseline is not a hard Population cap: reserves/manual trips can temporarily or continuously support more people.

Replace the old `24 + 10*wellLevel` flow. Each well now adds one upkeep-equivalent per minute before Knowledge/pipes; retain its existing manual yield/speed bonuses. Pipes multiply the complete passive expression once, including wells/Knowledge, and never multiply manual haul rewards. At zero improvements they support sixteen people at the same upkeep. Fire is paid once, not consumed to operate pipes. Fire depletion after manufacture does not shut them off.

Remove the spring-based manual dispatch lock/automatic action classification. Keep Collect water visible with normal crew, busy, capacity, recall and solo-survivor rules. A pre-spring trip finishes exactly once after spring purchase; a new trip can start afterwards. Do not add automatic Water repeats. Flow and crew deliveries use one capacity clamp without double counting.

Communal cistern is a distinct permanent upgrade adding 200 capacity to the current result. Buying it does not fill it. Keep existing `waterReserves` / Emergency cistern shortage-grace behavior separate. New basket levels need a distinct ID and saved count; do not relabel historical jar levels as baskets. Water capacity becomes `(jars ? 100 : 50) + jarLevels*(jars ? 120 : 40) + 40*basketLevels + (communalCistern ? 200 : 0)`. Both Water container types add capacity, not income.

## Saves, prestige and migration

Material capabilities and permanent upgrades survive both prestige types like existing improvements. Keep exact existing retention thresholds and IDs. Proposed new `water-baskets` project joins Water-storage retention at Organization 4 explicitly; do not accidentally retain wells or change jar retention. The material stays learned when an unprotected physical project level resets. Paid in-flight projects follow their project's existing preservation policy.

Use a versioned migration (proposed v0.9) at detached codec ingress into one current model. Inventory actual v0.6/v0.7, pre-redesign v0.8, PR12 and Fire-branch fixtures. Preserve balances, paid effects, discoveries, raw active snapshots, accrued Cooking bonuses, queues and construction. Existing material-related upgrades or project levels imply the minimum necessary capability, without a retroactive charge or refund. Existing jars/active jar projects imply Clay and jar access. Existing unlocked broad-buyable access must translate into explicit capabilities for the old repeatable projects so imports do not revoke previously available operations. Treat this as one-time conversion, then retire the broad buyables flag from normal checks.

Avoid granting a fresh save that historical access. Keep existing bought upgrade IDs to avoid duplicate purchases. A current explicit false capability must not be silently overwritten: reject inconsistent current records. Validate types before conversion; repeat conversion must be idempotent. Validate resource/crew/project references and all new ownership/counts atomically. Bad imports leave live/durable bytes unchanged. Missing fields in supported old versions migrate; malformed present fields reject. New saves write only the current schema. Preserve exported original saves with their matching build; older builds can reject new keys. Original `ptr` storage remains untouched.

## Implementation sequence and owning files

1. Resolve D1/D2, validate exact plan bytes, and prepare the bounded file list against a fresh verified parent. Reuse this branch for later authorized stages; do not restart or alter the parent's writer. Verify the current Orcha snapshot afresh for the next task.
2. In `js/civilization.js`, add a small explicit material/upgrade catalog and shared prerequisites; reuse existing upgrade/project commands. Implement the resolved bootstrap, exact costs and atomic spending, then migration/defaults/validation/prestige. Keep persisted state under the session-owned Civ record, with new physical basket levels in Water. Update `js/mod.js` version and existing type contracts under `types/` and layer defaults in `js/layers/resources.js` only where required. Preparation must identify exact type filenames, not authorize the whole directory.
3. In the same rules owner, implement shared upkeep/passive flow, additive storage, pipes, cistern and continued hauling. UI commands in `js/components.js` and `index.html` derive availability/costs and render Craft material rows using existing native controls. Use `civ.css` only as needed for row layout. Keep domain decisions out of templates.
4. Extend nearby organization/opening/food/Fire rule and save suites, focused Water/material tests, and `tests/browser/civilization.spec.cjs` / `fire.spec.cjs` (or a focused material journey). Retain survival/worker-budget regressions. Exact affected test filenames belong in preparation.
5. Update `scripts/balance/policy.cjs`, `sections.cjs` and relevant balance tests together. Teach policies to bank material costs, purchase legal prerequisites, choose storage versus flow and haul above baseline; do not repeatedly spend the savings needed for a row. Reconcile the regular-cadence transition, which currently assumes worker-free Water is sufficient. Report when five-minute checks cannot sustain a larger population.
6. Revise canonical `docs/civilization.md`, affected routes in `docs/developer-guide.md`, README and balance descriptions in the implementation change. Keep research notes as evidence, not gameplay authority. Run focused checks then required `npm test`; retain source-hashed active/regular and matched rough/fixed observations. Later publish only through the verified project path with parent/PR12 dependencies and human merge control.

## Acceptance and verification

- **MAT01-AC01**: New material rows use fixed first-purchase Craft costs 10/20/50/100, and ordinary row upgrades cost 1/2/5/10 Craft respectively; no cost is a percentage of current balance.
- **MAT01-AC02**: The first successful material purchase permanently reveals its five upgrades. Failed, repeated or insufficient-funds purchases spend nothing and reveal nothing.
- **MAT01-AC03**: Craft capability predicates replace the Organization-6 buyable gate and bigger-game per-level Organization requirement. Organization retention, automation and unrelated activity gates remain explicit; bootstrap follows the resolved D2 decision.
- **MAT01-AC04**: Every listed upgrade and repeatable project has an observable effect, truthful cost and shared simulation/UI eligibility; direct locked commands reject atomically.
- **MAT01-AC05**: Collect water remains visible and dispatchable with a spring, including after reload, with normal worker/full-storage/busy guards and active snapshots.
- **MAT01-AC06**: A spring without Water improvements supports exactly eight current-upkeep equivalents: zero net Water at eight and negative at nine, including Organization balance changes. This is sustainable supply, not a Population cap.
- **MAT01-AC07**: Communal cistern adds 200 capacity without adding stock/income or changing Emergency cistern. Fired-clay pipes spend 2 Fire plus the Clay-row Craft price once and multiply only spring flow by exactly 2.
- **MAT01-AC08**: Material knowledge, owned row upgrades and cistern/pipes survive both prestiges. Repeatable projects retain/reset by exact IDs; new water baskets use the explicit Organization-4 Water-storage retention extension.
- **MAT01-AC09**: Supported old Civ exports migrate atomically to the one current schema, preserving currencies, bought effects, active jobs, paid construction and applicable retention. Malformed imports preserve live and durable state; ptr stays untouched.
- **MAT01-AC10**: A legal fresh-game policy reaches the first material and each later row without resource grants or an unlock cycle. Active and regular balance runs report observed cost/time, cadence and completion or stalls; rough/fixed comparisons cover the new sections.
- **MAT01-AC11**: Desktop/narrow keyboard journeys cover row purchase, revealed upgrades, affordability, manual hauling after spring, cistern filling and pipe purchase/depletion rejection; no stale unlock or double charge after save replacement.
- **MAT01-AC12**: Focused rules/save/balance/browser checks and full npm test pass on the implementation candidate; canonical design, developer map and progression text match shipped behavior. Planning validation alone cannot satisfy these criteria.

Planned boundary scenarios: one less than/exactly each price; all-or-nothing Craft+Fire spending; duplicate clicks; direct locked calls; material surviving reset while its construction resets; baskets versus jars versus cistern; spring bought during hauling; full tank overflow; eight/nine/sixteen people; Organization earned/spent; no spring with pipes; active action snapshots after upgrades; canceled/retained paid construction; codec replacement and offline chunk parity. Use constructed fixtures only for isolated arithmetic, not fresh-game reachability claims.

The player journey starts in a fresh settlement or a preserved old Civ save, reaches Craft legally, buys a material and sees only its newly available upgrades. Denied purchases explain missing prerequisites/funds and retain balances. Keyboard focus remains usable when a row expands; narrow layouts reflow with readable costs. Water shows passive supply separately from average crew deliveries and explains storage without claiming a refill. Planned rendered/browser evidence cannot establish actual-user enjoyment or assistive-technology quality; those remain unmeasured. No new performance budget or native zoom gate is introduced.

## Open decisions

- **D1:** Five upgrades per material row (recommended and shown above), or five initial technologies total. The smaller alternative needs a revised table.
- **D2:** Keep huts at Organization 1 (recommended smallest change), or move huts too and explicitly amend the Craft bootstrap. Current housing/Craft thresholds make this consequential.

These questions are recorded with alternatives in the structured artifact and were presented in the chat. Recommendations are not owner answers. The draft is complete for review; preparation depends on their resolution and implementation remains outside this request.

## Research and documentation assessment

Read the pinned [Plant notes](https://github.com/step3software/Prestige-Tree/blob/b42c39c84cd653fff166dca07b569c0fd0bddbbe/docs/research/plant.md), [Water notes](https://github.com/step3software/Prestige-Tree/blob/b42c39c84cd653fff166dca07b569c0fd0bddbbe/docs/research/water.md) and reference guide. Original Plant EPUB passages were hash-verified through the source reader: part 4 paragraphs 22-39 distinguish tightly coiled water-carrying baskets from loose baskets; part 1 paragraphs 3-18 cover the basic stone toolkit. PLT-02/03/04/06/07/08/10 support task-specific equipment, lashings, shelters, tiles, traps and firing. The spear upgrade is a game interpretation; the spear-thrower source does not measure hunting yields.

Rechecked [AMNH's Petra water account](https://www.amnh.org/explore/ology/archaeology/a-walk-through-the-ruins-of-petra): pipes convey water while reservoirs/cisterns store it. Rechecked the [early wooden-well excavation study](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0051374), which supports stone-tool carpentry without requiring metal. [Ashmolean's ceramic classification](https://potweb.ashmolean.org/PotABCs1.html) distinguishes porous earthenware and suitable higher-fired bodies. These sources support naming and dependencies, not the chosen costs, 200 capacity, 2x flow or chronology. Do not add a water-safety mechanic from these examples.

Navigation assessment: README -> developer guide -> civilization rules gives a useful human route; research claim IDs and reproducible source locators are strengths. The manifest/registry still say `master` while current local instructions/design say `main`; this run preserves that discrepancy and follows the explicit request to branch from latest work. Research observations of old keeper/hauling behavior are dated, not current authority. Material costs and gameplay rules should live in the canonical design after implementation, avoiding a second competing current design in research. This plan adds one discoverability link without reorganizing existing documentation.
