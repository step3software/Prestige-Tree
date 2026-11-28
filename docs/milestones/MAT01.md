# MAT01: Craft rows and complementary Water supply

Status: revised owner-requested implementation-plan draft, November 27, 2026. The row-structure correction resolves D1. Hut bootstrap D2 remains open. No implementation or native lifecycle transition is authorized by this artifact.
Repository: `step3software/Prestige-Tree`. Branch: `docs/craft-materials-plan`.
Gameplay source remains local `codex/fire-ms4` at `2d60aaf8874ae0d59eddbd7a7f8f4f3691fe309a`. This revision corrects local plan commit `7b315f9`; it does not alter the parent's branch or writer.
Companions: [structured plan](MAT01.plan.json), [revision/hash evidence](MAT01.evidence.json).

## Corrected structure and outcome

The owner clarified **five tiles total per row: one expensive unlock followed by four related purchases**. The first row is Crafting at 10 Craft, combining basic wood, stone and fiber techniques. Its four purchases cost 1 Craft each: Thatched roofs, Wooden spears, Woven baskets and the researched recommendation, Digging sticks. The second row is Clay at 20 Craft, with four purchases at 2 Craft each. The requested third-tier recommendation is Copper working at 30 Craft, with four purchases at 3 Craft each.

The earlier separate Wood/Bark/Stone/Clay rows and five-child layout are superseded. There are no separate harvested material stocks. Spending the row's unlock cost reveals its four related purchases without automatically buying them. One-time techniques retain ownership; repeatable container construction retains normal work, builders and per-project payment. In particular, Woven baskets is an actual repeatable 1-Craft Water-storage purchase, so do not charge a separate 1-Craft discovery surcharge before its first basket. The row unlock supplies its prerequisite; first construction completion grants the first +40 capacity.

One purchase of each of these fifteen tiles totals **84 Craft**: 60 for unlocks and 24 for the twelve related purchases. Pipes also cost 2 Fire. Additional container levels, spring purchase and construction costs are separate. Prices and requested tiles are owner direction; proposed effects, the additional basic tool and metal-row choices are architect recommendations for initial balance testing. No pacing target is accepted.

## Proposed rows

### Crafting (10 Craft)

One unlock tile followed by these four purchases at **1 Craft each**.

| Purchase | Proposed effect | Research / reuse |
| --- | --- | --- |
| Thatched roofs | Improve hut capacity by +1 place per hut, including existing huts. Initial tuning proposal. | Plant part 6 paragraphs 91-92; PLT-04 |
| Wooden spears | Unlock Hunt and use the existing Spear hunting reduction from 3 to 2 workers before bigger-game scaling. | Existing hunting ID; wooden hunting equipment research |
| Woven baskets | Increase Water storage by +40 per completed basket. Reuse a repeatable 1-Craft basket project with scaling work. | Plant part 4 paragraphs 22-39; WAT-01 |
| Digging sticks | Increase Gather yield by 25%, retaining crew and duration. Reuse the digging upgrade. | Plant part 1 paragraphs 61-64; PLT-02 |

### Clay (20 Craft)

One unlock tile followed by these four purchases at **2 Craft each**.

| Purchase | Proposed effect | Research / reuse |
| --- | --- | --- |
| Earthenware jars | Cost 2 Craft for the technology. Retain the jars effect: base Water capacity 100 and +120 per jar level, plus access to jar construction. | SMI-14; PLT-10; existing jars ID |
| Bricks | Add +1 housing per hut, including existing huts. Model sun-dried clay bricks so this tile has no invented Fire charge. | PLT-05; authored coefficient |
| Communal cistern | Add +200 Water capacity once; no free refill or income. Keep Emergency cistern shortage protection separate. | WAT-05; original owner request |
| Fired-clay pipes | Cost 2 Craft plus exactly 2 Fire; double automatic Water flow once. No manual-haul multiplier and no flow without a spring. | WAT-05; original owner request |

### Copper working (30 Craft)

One unlock tile followed by these four purchases at **3 Craft each**.

| Purchase | Proposed effect | Research / reuse |
| --- | --- | --- |
| Copper axes | Increase hut construction speed by 25%; builders still required. | Early copper axe evidence; game coefficient proposed |
| Copper knives | Reuse Butchery tools: +50% Hunt yield on the next dispatch. Tool-kit specialization is an abstraction, not universal copper superiority. | Existing butchery ID; early copper tool research |
| Copper chisels | Increase well-project construction speed by 25%; no free Water income. | Met copper-alloy chisel; task-specific game interpretation |
| Copper awls | Reduce basket-project work by 25%; no storage/Water gain until a basket completes. | Tel Tsaf copper-awl excavation; fabrication abstraction |

Thatched roofs and Bricks add independently to hut capacity. Preserve the already-purchased Timber frames bonus from old saves; do not relabel it into a weaker upgrade or permit a duplicate purchase of the same effect. Existing active job rewards/crews remain snapshots. Construction speed/work effects apply through the existing construction owner. Copper effects are task-specific game abstractions: research does not establish that copper is universally superior to stone, wood or bone.

Earthenware jars technology now costs **2 Craft**, replacing its old upfront 2-Fire technology price. Firing remains a capability prerequisite for ceramic manufacturing and existing repeatable jar projects retain their scaling Fire inputs. Do not invent a second Fire charge on the 2-Craft technology. Pipes explicitly cost **2 Craft + 2 Fire**, paid atomically once; their operation does not consume Fire. Bricks mean sun-dried clay bricks in this table; fired bricks/roof tiles can be later options rather than extra tiles crowding the five-tile row.

## Why Copper at 30 Craft

Recommend Copper working for the third row. It provides a distinct first-metal tier using axes, knives, chisels and awls. Bronze working can follow at a proposed 50 Craft, with 5-Craft purchases, as future work. Bronze commonly combines copper and tin; material supply and alloying offer a meaningful later step. The prices are game design, not history, and these rows are not a claim that every society followed the same order. Keep ore procurement/annealing/smelting abstracted into Craft, existing Fire capability and construction for now; do not introduce mining, tin trade or a new fuel system in this plan.

## Access, Organization and opening dependency

Crafting replaces the Organization-6 blanket Food/Water buyable gate for the existing basic repeatable projects, with appropriate activity prerequisites. It opens exploration, provisioning, food baskets and basic well projects; Woven baskets directly supplies its Water-storage project. Wooden spears unlock Hunt, replacing the new-game Organization-2 Hunt gate, and enable bigger-game projects without their per-level Organization requirement. River traps still need existing Fish discovery; this task does not invent a fishing unlock. Farming tools still require Farming. Clay plus Earthenware jars opens jar projects. Copper purchases improve their named tasks rather than acting as an arbitrary additional gate for already basic actions.

Organization retains automation, Fire/spring availability, Farming, Abundance, irrigation and exact prestige retention. Update moved item names in milestone promises without renumbering rewards. Spring retains its existing Organization-5 availability and 2 Craft +1 Organization +30 Food purchase cost. Current Fire availability is a manufacturing prerequisite, not a replacement for the Craft row-unlock payment. Cooking, Shared hearths and unrelated bought effects remain.

**D2 remains consequential:** housing starts at 8 while Craft starts at 12. Making all huts require the 10-Craft Crafting tile deadlocks the opening. The recommended smallest change keeps labor-only huts at Organization 1 while their improvements move to Craft rows. Moving huts too requires an explicitly amended first-Craft threshold/starter-hut capability and earnings formula. No answer was supplied by the row correction; do not invent one. The automatic builder and all direct project commands must enforce the same new prerequisites/costs.

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

Preserve existing bought Wood/Bark/Stone-related effects as individual upgrades while inferring the corrected Crafting capability; do not synthesize retired proposed material rows from this planning draft, which was never implemented. Copper defaults unpurchased. Old jar capability maps to Clay/jars without a new charge. Old roofs/frames and new Thatched roofs use distinct IDs unless a lossless exact-equivalent mapping is established.

## Implementation sequence and owning files

1. Resolve D2, validate exact plan bytes, and prepare the bounded file list against a fresh verified parent. Reuse this branch for later authorized stages; do not restart or alter the parent's writer. Verify the current Orcha snapshot afresh for the next task.
2. In `js/civilization.js`, add a small explicit row/upgrade catalog and shared prerequisites; reuse existing upgrade/project commands. Implement the resolved bootstrap, exact costs and atomic spending, then migration/defaults/validation/prestige. Keep persisted state under the session-owned Civ record, with new physical basket levels in Water. Update `js/mod.js` version and existing type contracts under `types/` and layer defaults in `js/layers/resources.js` only where required. Preparation must identify exact type filenames, not authorize the whole directory.
3. In the same rules owner, implement shared upkeep/passive flow, additive storage, pipes, cistern and continued hauling. UI commands in `js/components.js` and `index.html` derive availability/costs and render Craft material rows using existing native controls. Use `civ.css` only as needed for row layout. Keep domain decisions out of templates.
4. Extend nearby organization/opening/food/Fire rule and save suites, focused Water/material tests, and `tests/browser/civilization.spec.cjs` / `fire.spec.cjs` (or a focused material journey). Retain survival/worker-budget regressions. Exact affected test filenames belong in preparation.
5. Update `scripts/balance/policy.cjs`, `sections.cjs` and relevant balance tests together. Teach policies to bank material costs, purchase legal prerequisites, choose storage versus flow and haul above baseline; do not repeatedly spend the savings needed for a row. Reconcile the regular-cadence transition, which currently assumes worker-free Water is sufficient. Report when five-minute checks cannot sustain a larger population.
6. Revise canonical `docs/civilization.md`, affected routes in `docs/developer-guide.md`, README and balance descriptions in the implementation change. Keep research notes as evidence, not gameplay authority. Run focused checks then required `npm test`; retain source-hashed active/regular and matched rough/fixed observations. Later publish only through the verified project path with parent/PR12 dependencies and human merge control.

## Acceptance and verification

- **MAT01-AC01**: Each row has exactly five tiles: one capability purchase at 10/20/30 Craft followed by four purchases at 1/2/3 Craft respectively; the 30-Craft Copper row is the requested architect recommendation.
- **MAT01-AC02**: The first successful row-unlock purchase permanently reveals its four related tiles. Failed, repeated one-time or insufficient-funds purchases spend nothing and reveal nothing.
- **MAT01-AC03**: Craft capability predicates replace the Organization-6 buyable gate and bigger-game per-level Organization requirement. Organization retention, automation and unrelated activity gates remain explicit; bootstrap follows the resolved D2 decision.
- **MAT01-AC04**: Every listed upgrade and repeatable project has an observable effect, truthful cost and shared simulation/UI eligibility; direct locked commands reject atomically.
- **MAT01-AC05**: Collect water remains visible and dispatchable with a spring, including after reload, with normal worker/full-storage/busy guards and active snapshots.
- **MAT01-AC06**: A spring without Water improvements supports exactly eight current-upkeep equivalents: zero net Water at eight and negative at nine, including Organization balance changes. This is sustainable supply, not a Population cap.
- **MAT01-AC07**: Communal cistern costs 2 Craft and adds 200 capacity without adding stock/income or changing Emergency cistern. Fired-clay pipes spend 2 Craft plus exactly 2 Fire once and multiply only spring flow by exactly 2.
- **MAT01-AC08**: Material knowledge, owned row upgrades and cistern/pipes survive both prestiges. Repeatable projects retain/reset by exact IDs; new water baskets use the explicit Organization-4 Water-storage retention extension.
- **MAT01-AC09**: Supported old Civ exports migrate atomically to the one current schema, preserving currencies, bought effects, active jobs, paid construction and applicable retention. Malformed imports preserve live and durable state; ptr stays untouched.
- **MAT01-AC10**: A legal fresh-game policy reaches the first material and each later row without resource grants or an unlock cycle. Active and regular balance runs report observed cost/time, cadence and completion or stalls; rough/fixed comparisons cover the new sections.
- **MAT01-AC11**: Desktop/narrow keyboard journeys cover row purchase, revealed upgrades, affordability, manual hauling after spring, cistern filling and pipe purchase/depletion rejection; no stale unlock or double charge after save replacement.
- **MAT01-AC12**: Focused rules/save/balance/browser checks and full npm test pass on the implementation candidate; canonical design, developer map and progression text match shipped behavior. Planning validation alone cannot satisfy these criteria.

Planned boundary scenarios: one less than/exactly each price; all-or-nothing Craft+Fire spending; duplicate clicks; direct locked calls; material surviving reset while its construction resets; baskets versus jars versus cistern; spring bought during hauling; full tank overflow; eight/nine/sixteen people; Organization earned/spent; no spring with pipes; active action snapshots after upgrades; canceled/retained paid construction; codec replacement and offline chunk parity. Use constructed fixtures only for isolated arithmetic, not fresh-game reachability claims.

The player journey starts in a fresh settlement or a preserved old Civ save, reaches Craft legally, buys a material and sees only its newly available upgrades. Denied purchases explain missing prerequisites/funds and retain balances. Keyboard focus remains usable when a row expands; narrow layouts reflow with readable costs. Water shows passive supply separately from average crew deliveries and explains storage without claiming a refill. Planned rendered/browser evidence cannot establish actual-user enjoyment or assistive-technology quality; those remain unmeasured. No new performance budget or native zoom gate is introduced.

## Open decision

**D2:** Keep huts at Organization 1 (recommended smallest change), or move huts too and explicitly amend the Craft bootstrap. Alternatives and consequences remain in `open_questions`. D1 is resolved by the owner's explicit correction; selection of Digging sticks and the Copper recommendation was expressly delegated to the agent. No further row-layout approval question is required to produce this revised plan. Implementation remains outside the current request.

## Research and documentation assessment

Hash-verified original Plant passages were reread: part 1 paragraphs 61-64 describe digging-stick use for soil/clay excavation and tilling; part 6 paragraphs 91-92 describe a sapling-frame, lashed and thatched shelter; part 4 paragraphs 22-39 distinguish tightly woven water-carrying baskets. Use the pinned [Plant notes](https://github.com/step3software/Prestige-Tree/blob/b42c39c84cd653fff166dca07b569c0fd0bddbbe/docs/research/plant.md) and [Water notes](https://github.com/step3software/Prestige-Tree/blob/b42c39c84cd653fff166dca07b569c0fd0bddbbe/docs/research/water.md) for source locators and limits. These are practical reconstructions, not dated universal invention sequences or measured production rates.

The [Ashmolean Bronze Age collection](https://britisharchaeology.ashmus.ox.ac.uk/collections/bronze-age.html) describes copper preceding bronze in its British collection context and identifies bronze as a copper alloy with tin (and later lead). [Historic England's archaeometallurgy guide](https://historicengland.org.uk/images-books/publications/archaeometallurgy-guidelines-best-practice/heag003-archaeometallurgy-guidelines/) explains tin alloying. The [Tel Tsaf excavation](https://doi.org/10.1371/journal.pone.0092591) provides a concrete early copper-awl example; the [Met's copper-alloy chisel](https://www.metmuseum.org/art/collection/search/855343) supports chisel naming without claiming pure-copper composition. Early copper axe/knife evidence is discussed in the [Italian copper-tool study](https://doi.org/10.1038/s41598-024-54825-z); rely on its verified metadata rather than inferring an alloy from a museum label. The Copper row is an informed game recommendation, not a claim that all four tools were one synchronous kit.

Earlier checked AMNH Petra and Ashmolean ceramic references continue to support storage/conveyance and fired-clay distinctions. Navigation remains README -> developer guide -> civilization owner, with research notes supplying evidence. The registry/manifest `master` versus local `main` discrepancy remains recorded; the explicit latest-work branch instruction selected the local Fire head. Keep this proposed plan separate from canonical shipped rules and preserve the historical first draft in Git. No unrelated documentation reorganization is needed.
